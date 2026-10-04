import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameRegistry,normalizePlatformState,createGamePlatform,createGameHost,resolveGameRoute} from '../dist/game-platform.js';
import {GAME_REGISTRY} from '../dist/game-catalog.js';
import {normalizeWallet,walletBalance,chargeWallet} from '../dist/game-wallet.js';
import {normalizeGames,purchaseBoard,purchaseFrame,saveArtwork,saveDrawing,hangArtwork,gameWallet} from '../dist/coloring.js';
import {roomArtwork} from '../dist/art-wall-art.js';
const clone=value=>JSON.parse(JSON.stringify(value));
const drawing={boardId:'cat',colors:{'area-0':'g-ocean'},effect:'crayon',name:'旧草稿'};
const painting=()=>hangArtwork(saveArtwork(purchaseFrame(purchaseBoard({},[],'cat'),[],'cream'),[],drawing,{id:'old-work',name:'旧作品',date:'2026-10-04T08:00:00Z'}),[],{room:'study',slot:'left',workId:'old-work',frameId:'cream'});
const puzzle={id:'puzzle',name:'测试拼图',normalize:value=>({level:Number.isSafeInteger(value?.level)?value.level:0}),createUI:()=>({})};
const registry=()=>createGameRegistry([...GAME_REGISTRY.list(),puzzle]);
function memory(value={}){
 let saved=clone(value),fail=false,writes=0;
 return {read:()=>clone(saved),write:(key,next)=>{assert.equal(key,'games');if(fail)return false;saved=clone(next);writes++;return true;},saved:()=>clone(saved),fail:value=>{fail=value;},writes:()=>writes};
}
const platform=(storage,extra={})=>createGamePlatform({storage,history:()=>[],registry:registry(),locks:null,...extra});

test('旧存档一次迁移到公共钱包，保留草稿、作品、购买、展示墙和余额',async()=>{
 const old=painting(),storage=memory(old),service=platform(storage);
 const migrated=service.read();
 assert.equal(migrated.version,3);assert.deepEqual(migrated.modules.coloring,old);
 assert.deepEqual(migrated.wallet.purchases,[{gameId:'coloring',id:'board-cat',paid:20},{gameId:'coloring',id:'frame-cream',paid:30}]);
 assert.equal(service.wallet().balance,70);assert.equal(storage.writes(),0);
 assert.deepEqual(normalizeGames(migrated),old);assert.match(roomArtwork(normalizeGames(migrated),'study'),/旧作品/);
 await service.forGame('coloring').update(state=>saveDrawing(state,[],{...drawing,name:'新草稿'}));
 const saved=storage.saved();assert.equal(saved.version,3);assert.equal(saved.modules.coloring.drafts.cat.name,'新草稿');
 assert.equal(saved.modules.coloring.works[0].name,'旧作品');assert.equal(saved.wallet.purchases.length,2);
 assert.deepEqual(service.read(),saved);assert.equal(gameWallet(saved).balance,70);
});

test('两个游戏共用钱包，新游戏数据在画室保存后仍保留',async()=>{
 const storage=memory(),service=platform(storage),p=service.forGame('puzzle'),c=service.forGame('coloring');
 await p.purchase({id:'level-1',paid:90},()=>({level:1}));
 await c.update(state=>purchaseBoard(state,[],'cat'));
 assert.equal(p.wallet().balance,10);assert.equal(c.wallet().balance,10);
 await assert.rejects(c.update(state=>purchaseFrame(state,[],'cream')),/还不够/);
 await c.update(state=>saveArtwork(state,[],drawing,{id:'one'}));
 assert.deepEqual(p.read(),{level:1});assert.equal(c.read().works.length,1);assert.equal(service.wallet().spent,110);
 assert.equal(storage.saved().wallet.purchases.length,2);
 const other=platform(storage);assert.equal(other.wallet().balance,10);assert.deepEqual(other.forGame('puzzle').read(),{level:1});
});

test('跨游戏购买 ID 同名可独立购买，同一游戏重复购买与透支不写档',async()=>{
 const storage=memory(),service=platform(storage),p=service.forGame('puzzle'),c=service.forGame('coloring');
 await p.purchase({id:'board-cat',paid:70},()=>({level:1}));
 await c.update(state=>purchaseBoard(state,[],'cat'));
 const before=storage.saved(),writes=storage.writes();
 await assert.rejects(p.purchase({id:'board-cat',paid:1},()=>({level:2})),/重复购买/);
 await assert.rejects(p.purchase({id:'level-2',paid:40},()=>({level:2})),/还不够/);
 assert.deepEqual(storage.saved(),before);assert.equal(storage.writes(),writes);assert.equal(service.isPending(),false);
});

test('并发请求从最新存档结算，失败后仍能继续保存',async()=>{
 const storage=memory(),service=platform(storage),p=service.forGame('puzzle'),c=service.forGame('coloring');
 const results=await Promise.allSettled([p.purchase({id:'level-1',paid:110},()=>({level:1})),c.update(state=>purchaseBoard(state,[],'cat'))]);
 assert.equal(results[0].status,'fulfilled');assert.equal(results[1].status,'rejected');
 assert.equal(service.wallet().balance,10);assert.equal(c.read().purchases.length,0);
 await p.update(state=>({...state,level:2}));assert.equal(p.read().level,2);
 const duplicate=await Promise.allSettled([p.purchase({id:'level-2',paid:5},()=>({level:3})),p.purchase({id:'level-2',paid:5},()=>({level:4}))]);
 assert.equal(duplicate.filter(r=>r.status==='fulfilled').length,1);assert.equal(service.wallet().balance,5);
});

test('多实例共用锁，跨标签余额不会被旧读档覆盖',async()=>{
 let tail=Promise.resolve(),requests=0;
 const locks={request(name,run){assert.equal(name,'math-island-games');requests++;const next=tail.then(run);tail=next.catch(()=>{});return next;}};
 const storage=memory(),a=platform(storage,{locks}),b=platform(storage,{locks});
 const results=await Promise.allSettled([a.forGame('puzzle').purchase({id:'one',paid:110},()=>({level:1})),b.forGame('coloring').update(state=>purchaseBoard(state,[],'cat'))]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(requests,2);assert.equal(a.wallet().balance,10);assert.equal(b.wallet().balance,10);
});

test('存储失败不会丢失旧档或只扣币不发物品，重试只扣一次',async()=>{
 const old=painting(),storage=memory(old),service=platform(storage),p=service.forGame('puzzle');storage.fail(true);
 await assert.rejects(p.purchase({id:'one',paid:50},()=>({level:1})),/保存失败/);
 assert.deepEqual(storage.saved(),old);assert.equal(service.wallet().balance,70);assert.equal(service.isPending(),false);
 storage.fail(false);await p.purchase({id:'one',paid:50},()=>({level:1}));
 assert.equal(service.wallet().balance,20);assert.equal(p.read().level,1);assert.equal(p.owns('one'),true);
});

test('未注册游戏存档和消费保留，移除再注册不会退币或丢进度',async()=>{
 const storage=memory(),full=platform(storage);await full.forGame('puzzle').purchase({id:'one',paid:40},()=>({level:3}));
 const limited=createGamePlatform({storage,history:()=>[],registry:GAME_REGISTRY,locks:null});
 await limited.forGame('coloring').update(state=>purchaseBoard(state,[],'cat'));
 assert.deepEqual(storage.saved().modules.puzzle,{level:3});assert.equal(limited.wallet().balance,60);
 assert.deepEqual(platform(storage).forGame('puzzle').read(),{level:3});
});

test('读写返回快照，各游戏不能意外修改其他存档；异步更新被拒绝',async()=>{
 const storage=memory(),service=platform(storage),p=service.forGame('puzzle');
 const data=p.read();data.level=99;assert.equal(p.read().level,0);
 await assert.rejects(p.update(async()=>({level:9})),/同步/);assert.equal(storage.writes(),0);
 await assert.rejects(p.update(state=>{state.level=8;throw Error('更新失败');}),/更新失败/);
 assert.equal(p.read().level,0);await p.update(()=>({level:1}));assert.equal(p.read().level,1);
});

test('模块购买强制绑定自己的游戏 ID，缺失购买信息不会免费解锁',async()=>{
 const storage=memory(),service=platform(storage),p=service.forGame('puzzle');
 await assert.rejects(p.purchase(undefined,()=>({level:1})),/无效/);
 await assert.rejects(p.purchase(null,()=>({level:1})),/无效/);assert.equal(storage.writes(),0);
 await p.purchase({gameId:'coloring',id:'one',paid:30},()=>({level:1}));
 assert.equal(p.owns('one'),true);assert.equal(service.forGame('coloring').owns('one'),false);
 assert.deepEqual(storage.saved().wallet.purchases,[{gameId:'puzzle',id:'one',paid:30}]);
});

test('公共钱包拒绝非法金额和重复记录，奖励收入保持按轮次去重',()=>{
 const wallet=normalizeWallet({purchases:[{gameId:'puzzle',id:'one',paid:30},{gameId:'puzzle',id:'one',paid:30},{gameId:'puzzle',id:'bad',paid:-50},{gameId:'constructor',id:'bad',paid:5},{gameId:'puzzle',id:'fraction',paid:.5}]});
 assert.equal(wallet.purchases.length,1);
 const round={id:'round',details:[{userAnswer:'1'},{userAnswer:' '},{userAnswer:'wrong'}]};
 assert.deepEqual(walletBalance(wallet,[round,round]),{earned:124,spent:30,balance:94});
 for(const paid of [-1,0,.5,Infinity,NaN,'10'])assert.throws(()=>chargeWallet(wallet,[],{gameId:'puzzle',id:'two',paid}),/无效/);
});

test('异常旧存档安全迁移，v1 也保留已购买画板和作品',()=>{
 for(const value of [null,[],{},'broken',{purchases:'broken'}]){
  const state=normalizePlatformState(value,[],registry());assert.equal(state.version,3);assert.equal(walletBalance(state.wallet).balance,120);
 }
 const v1=painting();v1.version=1;delete v1.framePurchases;delete v1.wall;
 const state=normalizePlatformState(v1,[],registry());assert.equal(state.modules.coloring.works.length,1);assert.equal(walletBalance(state.wallet).balance,100);
});

test('注册校验重复和危险 ID；新游戏和旧画室链接均能解析',()=>{
 assert.throws(()=>createGameRegistry([puzzle,puzzle]),/重复/);
 for(const id of ['constructor','__proto__','bad/game'])assert.throws(()=>createGameRegistry([{...puzzle,id}]),/无效/);
 const r=registry();assert.equal(resolveGameRoute({game:'puzzle',level:'2'},r).id,'puzzle');
 assert.equal(resolveGameRoute({tab:'studio',board:'cat',work:'old-work'},r).id,'coloring');
 assert.equal(resolveGameRoute({},r),null);assert.equal(resolveGameRoute({game:'missing',tab:'shop'},r),null);
});

test('游戏宿主复用当前实例，切换和离开销毁监听，旧地址自动加游戏 ID',()=>{
 const events=[],routes=[],messages=[],instances=[];let blocked=false;
 const definition=id=>({...puzzle,id,createUI:context=>{
  let params={};instances.push(context);events.push('mount-'+id);
  return {openRoute:next=>{params=next;context.onRouteChange(next);},routeParams:()=>params,beforeLeave:()=>!blocked,dispose:()=>events.push('dispose-'+id)};
 }});
 const r=createGameRegistry([definition('coloring'),definition('puzzle')]);
 const host=createGameHost({registry:r,platform:platform(memory(),{registry:r}),context:{getView:()=> 'games'},renderLobby:()=>events.push('lobby'),onRouteChange:params=>routes.push(params),toast:msg=>messages.push(msg)});
 host.openRoute({});host.openRoute({tab:'gallery'});assert.deepEqual(host.routeParams(),{game:'coloring',tab:'gallery'});
 host.openRoute({game:'coloring',tab:'wall',room:'study'});assert.equal(instances.length,1);
 blocked=true;assert.equal(host.beforeLeave(),false);blocked=false;
 host.openRoute({game:'puzzle',level:'2'});assert.equal(instances[0].isActive(),false);assert.equal(instances[1].isActive(),true);
 const last=routes.length;instances[0].onRouteChange({tab:'shop'});assert.equal(routes.length,last);
 host.openRoute({game:'missing'});assert.deepEqual(host.routeParams(),{});assert.equal(messages.length,1);
 assert.deepEqual(events,['lobby','mount-coloring','dispose-coloring','mount-puzzle','dispose-puzzle','lobby']);
 host.openRoute({game:'coloring'});assert.equal(instances[0].isActive(),false);
 const count=routes.length;instances[0].onRouteChange({tab:'shop'});assert.equal(routes.length,count);
 host.deactivate();host.deactivate();assert.equal(events.filter(e=>e==='dispose-coloring').length,2);
});

test('宿主在公共事务等待锁时阻止离开，保存完成后解除保护',async()=>{
 let unlock;const locks={request:(_,run)=>new Promise(resolve=>{unlock=()=>resolve(run());})};
 const r=registry(),service=platform(memory(),{locks,registry:r}),messages=[];
 const host=createGameHost({registry:r,platform:service,context:{getView:()=> 'games'},renderLobby:()=>{},onRouteChange:()=>{},toast:message=>messages.push(message)});
 const pending=service.forGame('puzzle').update(()=>({level:1}));
 assert.equal(host.beforeLeave(),false);await Promise.resolve();unlock();await pending;
 assert.equal(host.beforeLeave(),true);assert.equal(messages.length,1);
});
