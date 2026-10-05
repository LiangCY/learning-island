import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DECOR_GAMES} from '../dist/decor-catalog.js';
import {PLAYGROUND_ART} from '../dist/playground-art-data.js';
import {normalizeDecor,unlockDecor,placeDecor,changeDecorObject,clearDecor,removeDecor,resetDecor,decorBounds,decorScene,updateDecorScene,selectAquariumTank,addAquariumTank,aquariumTankPrice,MAX_AQUARIUM_TANKS} from '../dist/decor.js';
import {createGamePlatform} from '../dist/game-platform.js';
import {GAME_REGISTRY} from '../dist/game-catalog.js';
import {normalizeGomoku,playMove,undoMoves,winningLine,boardFromMoves,gameResult,chooseMove,suggestMove,moveStrength} from '../dist/gomoku.js';
const empty=()=>Array(225).fill(0);
const pos=(x,y)=>y*15+x;
function memory(){let data={},fail=false;return {read:()=>structuredClone(data),write:(_,s)=>{if(fail)return false;data=structuredClone(s);return true;},setFail:v=>fail=v};}
const platform=s=>createGamePlatform({storage:s,history:()=>[],registry:GAME_REGISTRY,locks:null});

test('两种布置游戏提供完整场景和新增素材，每个窗口都在 RGBA 原图内',()=>{
 assert.equal(DECOR_GAMES.garden.items.length,36);assert.equal(DECOR_GAMES.aquarium.items.length,52);
 for(const [kind,c]of Object.entries(DECOR_GAMES)){
  const state=normalizeDecor({},kind);assert.equal(decorScene(state,kind).objects.length,8);assert.deepEqual(normalizeDecor(state,kind),state);
  assert.equal(new Set(c.items.map(i=>i.id)).size,c.items.length);
  for(const i of c.items.filter(i=>!i.slot)){
   const png=readFileSync(new URL(`../dist/assets/playgrounds/${i.atlas||kind}-atlas.png`,import.meta.url));assert.equal(png.readUInt8(25),6);
   const [x,y,w,h,W,H]=PLAYGROUND_ART[i.atlas||kind][i.index];assert.equal(W,png.readUInt32BE(16));assert.equal(H,png.readUInt32BE(20));assert.ok(w>20&&h>20&&x>=0&&y>=0&&x+w<=W&&y+h<=H);
  }
 }
});
test('重复摆放、缩放翻转、撤下、清空与重置保持收藏，不修改输入',()=>{
 for(const kind of ['garden','aquarium']){
  const item=kind==='garden'?'tulip':'guppy',start=normalizeDecor({},kind),before=structuredClone(start);
  assert.throws(()=>placeDecor(start,kind,item,'a'),/收藏/);
  const owned=unlockDecor(start,kind,item);let state=placeDecor(placeDecor(owned,kind,item,'a'),kind,item,'b');
  state=changeDecorObject(state,kind,'a',{x:64,y:66,scale:1.2,flip:true});assert.equal(decorScene(state,kind).objects.find(o=>o.id==='a').flip,true);
  assert.equal(decorScene(state,kind).objects.find(o=>o.id==='a').scale,1.2);assert.deepEqual(start,before);
  state=removeDecor(state,kind,'a');assert.equal(decorScene(state,kind).objects.length,9);state=clearDecor(state,kind);assert.equal(decorScene(normalizeDecor(state,kind),kind).objects.length,0);assert.ok(state.owned.includes(item));
  assert.equal(decorScene(resetDecor(state,kind),kind).objects.length,8);assert.ok(resetDecor(state,kind).owned.includes(item));assert.throws(()=>unlockDecor(state,kind,item),/已经拥有/);
 }
});
test('所有素材缩放后仍在场景内，底栖生物与巡游生物活动区域不同',()=>{
 for(const [kind,c]of Object.entries(DECOR_GAMES))for(const i of c.items.filter(i=>!i.slot))for(const scale of [.65,1,1.35]){
  const state=normalizeDecor({water:i.water,owned:c.items.map(i=>i.id),objects:[{id:'a',itemId:i.id,x:-100,y:-100,scale},{id:'b',itemId:i.id,x:200,y:200,scale}]},kind);
  const [, ,w,h]=PLAYGROUND_ART[i.atlas||kind][i.index],height=i.size*scale*h/w*1.5,objects=decorScene(state,kind).objects;
  assert.equal(objects.length,2);for(const o of objects){assert.ok(o.x-i.size*scale/2>=0&&o.x+i.size*scale/2<=100);assert.ok(o.y-height>=0&&o.y<=100);}
  if(i.fish)assert.ok(objects[1].y<=(['bottom','crawl'].includes(i.motion)?94:68));else if(kind==='aquarium')assert.ok(objects[0].y>=78);
 }
});
test('损坏存档过滤危险编号、重复和未拥有对象；每缸限制48件与18位生物',()=>{
 const bad={owned:['__proto__','missing'],objects:[null,{id:'a',itemId:'__proto__'},{id:'constructor',itemId:'daisy'},{id:'a',itemId:'tulip'},{id:'b',itemId:'daisy',x:Infinity,y:NaN,scale:'oops'},{id:'b',itemId:'daisy'}]};
 const state=normalizeDecor(bad,'garden');assert.equal(state.objects.length,1);assert.equal(state.objects[0].scale,1);assert.ok(Number.isFinite(state.objects[0].x));
 for(const [kind,item,max]of [['garden','daisy',48],['aquarium','goldfish',18]]){
  let s=clearDecor({},kind);for(let n=0;n<max;n++)s=placeDecor(s,kind,item,'item-'+n);
  assert.throws(()=>placeDecor(s,kind,item,'extra'),kind==='garden'?/48/:/18/);
  const over=structuredClone(s);decorScene(over,kind).objects.push({id:'extra',itemId:item});assert.equal(decorScene(normalizeDecor(over,kind),kind).objects.length,max);
 }
});
test('每口缸独立命名、装饰与灯光，重复购买同款生成空缸，定向修改不受当前缸变化影响',()=>{
 let s=addAquariumTank({},'tank-oak','second','fresh');assert.equal(decorScene(s,'aquarium').objects.length,0);
 s=placeDecor(s,'aquarium','goldfish','new-fish');s=updateDecorScene(s,'aquarium','second',t=>({...t,name:'溪流'}));
 s=placeDecor(unlockDecor(s,'aquarium','light-dusk'),'aquarium','light-dusk',null,'second');s=selectAquariumTank(s,'tank-home');
 assert.equal(decorScene(s,'aquarium').objects.length,8);assert.equal(decorScene(s,'aquarium').light,'light-sun');
 s=changeDecorObject(s,'aquarium','new-fish',{x:70},'second');assert.equal(decorScene(s,'aquarium','second').objects[0].x,70);
 const reload=normalizeDecor(s,'aquarium');assert.equal(reload.tanks[1].name,'溪流');assert.equal(reload.tanks[1].light,'light-dusk');assert.deepEqual(reload,s);
 assert.throws(()=>placeDecor(s,'aquarium','tank-oak'),/新鱼缸/);assert.equal(aquariumTankPrice(DECOR_GAMES.aquarium.byId['tank-oak']),28);
});
test('水体双向限制生物、水草；配饰与灯光通用；错误购买不扣币、不解锁',async()=>{
 let s=unlockDecor({},'aquarium','clownfish');assert.throws(()=>placeDecor(s,'aquarium','clownfish','wrong'),/海水/);
 s=addAquariumTank(s,'tank-oak','sea','salt');s=placeDecor(s,'aquarium','clownfish','right');
 assert.throws(()=>placeDecor(s,'aquarium','goldfish','wrong'),/淡水/);assert.throws(()=>placeDecor(s,'aquarium','ribbon','wrong'),/淡水/);
 s=placeDecor(s,'aquarium','driftwood','wood');assert.equal(decorScene(s,'aquarium').objects.length,2);
 for(const i of DECOR_GAMES.aquarium.items)assert.ok(['fresh','salt','both'].includes(i.water));
 const p=platform(memory()),a=p.forGame('aquarium');await assert.rejects(a.purchase({id:'item-clownfish',paid:26},s=>placeDecor(unlockDecor(s,'aquarium','clownfish'),'aquarium','clownfish','wrong')),/海水/);
 assert.equal(p.wallet().balance,120);assert.equal(a.read().owned.includes('clownfish'),false);
});
test('旧混养存档自动拆分海水缸并保留位置、收藏和原装备，迁移幂等',()=>{
 const old={name:'旧缸',owned:['clownfish','tank-pearl','light-moon'],tank:'tank-pearl',light:'light-moon',objects:[{id:'a',itemId:'goldfish',x:40,y:50},{id:'b',itemId:'clownfish',x:60,y:50},{id:'c',itemId:'driftwood',x:30,y:90}]};
 const before=structuredClone(old),s=normalizeDecor(old,'aquarium');assert.equal(s.tanks.length,2);assert.equal(s.tanks[0].water,'fresh');assert.deepEqual(s.tanks[0].objects.map(o=>o.id),['a','c']);assert.equal(s.tanks[1].water,'salt');assert.equal(s.tanks[1].objects[0].x,60);
 assert.equal(s.tanks[0].tank,'tank-pearl');assert.equal(s.tanks[1].light,'light-moon');assert.ok(s.owned.includes('clownfish'));assert.match(s.migrationNotice,/1 件/);assert.deepEqual(normalizeDecor(s,'aquarium'),s);assert.deepEqual(old,before);
 const wrong=structuredClone(s);wrong.tanks[0].objects.push({id:'bad',itemId:'clownfish'});assert.equal(normalizeDecor(wrong,'aquarium').tanks[0].objects.length,2);
});
test('鱼缸编号、上限、水体校验与满缸失败；恢复只影响当前缸',()=>{
 let s=normalizeDecor({},'aquarium');assert.throws(()=>addAquariumTank(s,'tank-oak','constructor'),/编号/);assert.throws(()=>addAquariumTank(s,'tank-oak','new','brackish'),/淡水或海水/);
 for(let n=1;n<MAX_AQUARIUM_TANKS;n++)s=addAquariumTank(s,'tank-oak','tank-'+n,n%2?'salt':'fresh');
 assert.throws(()=>addAquariumTank(s,'tank-oak','overflow'),/12/);assert.throws(()=>selectAquariumTank(s,'missing'),/找不到/);
 const reset=resetDecor(s,'aquarium');assert.equal(reset.tanks[0].objects.length,8);assert.ok(decorScene(reset,'aquarium').objects.every(o=>DECOR_GAMES.aquarium.byId[o.itemId].water!=='fresh'));
 const corrupt={...s,tanks:[s.tanks[0],s.tanks[0],{id:'__proto__'},null]};assert.equal(normalizeDecor(corrupt,'aquarium').tanks.length,1);
});
test('多缸逐口计费，余额不足、存储失败、重复事务都不会半扣款或覆盖其他模块',async()=>{
 const storage=memory(),p=platform(storage),a=p.forGame('aquarium'),g=p.forGame('garden');
 const buyTank=(id,frame='tank-oak')=>a.purchase({id:'tank-'+id,paid:aquariumTankPrice(DECOR_GAMES.aquarium.byId[frame])},s=>addAquariumTank(s,frame,id));
 await buyTank('one');await buyTank('two');assert.equal(p.wallet().balance,64);assert.equal(a.read().tanks.length,3);
 const before=p.read();await assert.rejects(buyTank('two'),/编号/);await assert.rejects(buyTank('three','tank-pearl'),/还不够/);assert.deepEqual(p.read(),before);
 storage.setFail(true);await assert.rejects(buyTank('three'),/保存失败/);assert.deepEqual(p.read(),before);storage.setFail(false);
 await Promise.all([g.purchase({id:'item-tulip',paid:18},s=>placeDecor(unlockDecor(s,'garden','tulip'),'garden','tulip','flower')),p.forGame('gomoku').update(s=>playMove(s,112)),a.update(s=>updateDecorScene(s,'aquarium','one',t=>({...t,name:'清溪'})))]);
 const reload=platform(storage);assert.equal(reload.wallet().balance,46);assert.equal(reload.forGame('aquarium').read().tanks[1].name,'清溪');assert.deepEqual(reload.forGame('gomoku').read().moves,[112]);assert.equal(reload.forGame('garden').read().objects.length,9);
});
test('满场购买不能只扣币不发货',async()=>{
 const p=platform(memory()),g=p.forGame('garden');await g.update(s=>({...s,objects:Array.from({length:48},(_,i)=>({id:'a'+i,itemId:'daisy'}))}));
 await assert.rejects(g.purchase({id:'item-tulip',paid:18},s=>placeDecor(unlockDecor(s,'garden','tulip'),'garden','tulip','extra')),/48/);assert.equal(p.wallet().balance,120);assert.equal(g.read().owned.includes('tulip'),false);
});

test('横竖与双斜线均判胜、长连获胜，边缘不换行串联；坏棋谱截断在合法前缀',()=>{
 for(const [dx,dy]of [[1,0],[0,1],[1,1],[1,-1]]){const b=empty();const line=Array.from({length:5},(_,i)=>pos(5+dx*i,7+dy*i));line.forEach(p=>b[p]=1);assert.equal(winningLine(b,line[2]).length,5);}
 const b=empty();[12,13,14,15,16].forEach(p=>b[p]=1);assert.equal(winningLine(b,14).length,0);
 const long=empty();for(let x=1;x<=6;x++)long[pos(x,7)]=2;assert.equal(winningLine(long,pos(4,7)).length,6);
 assert.deepEqual(normalizeGomoku({moves:[112,113,112,114]}).moves,[112,113]);assert.deepEqual(normalizeGomoku({moves:[0,225,1]}).moves,[0]);
 const moves=[105,0,106,2,107,4,108,6,109];assert.equal(gameResult(moves).winner,1);assert.deepEqual(normalizeGomoku({moves:[...moves,10]}).moves,moves);assert.throws(()=>playMove({moves},110),/已经结束/);assert.throws(()=>playMove({moves:[0]},0),/已经有/);
});
test('双人悔一手，人机退回自己的上一回合；执白保留电脑开局且设置持久化',()=>{
 assert.deepEqual(undoMoves({mode:'local',moves:[112,113,114]}).moves,[112,113]);
 assert.deepEqual(undoMoves({moves:[112,113]}).moves,[]);assert.deepEqual(undoMoves({moves:[112]}).moves,[]);
 assert.deepEqual(undoMoves({humanColor:2,moves:[112,113,114]}).moves,[112]);assert.deepEqual(undoMoves({humanColor:2,moves:[112,113]}).moves,[112]);
 const s=normalizeGomoku({mode:'local',difficulty:'hard',humanColor:2,blackPet:'cat',whitePet:'panda',autoHint:false,showAvatars:false,moves:[112]});assert.deepEqual(normalizeGomoku(s),s);
});
test('所有难度都争取一步胜利并防守唯一杀点，胜利优先于阻挡且不污染棋盘',()=>{
 for(const difficulty of ['easy','normal','hard'])for(const [dx,dy]of [[1,0],[0,1],[1,1],[1,-1]])for(const player of [1,2]){
  const b=empty(),line=Array.from({length:5},(_,i)=>pos(5+dx*i,7+dy*i));line.slice(0,4).forEach(p=>b[p]=player);b[pos(5-dx,7-dy)]=3-player;
  const before=[...b];assert.equal(chooseMove(b,player,difficulty),line[4]);assert.equal(chooseMove(b,3-player,difficulty),line[4]);assert.deepEqual(b,before);
 }
 const b=empty();for(let i=0;i<4;i++){b[pos(i,0)]=1;b[pos(i,2)]=2;}assert.equal(chooseMove(b,1,'hard'),pos(4,0));
});
test('认真与挑战难度制造双杀并阻止活三；提示带原因，开局、满盘均合法',()=>{
 for(const difficulty of ['normal','hard']){
  const b=empty();[pos(6,7),pos(8,7),pos(7,6),pos(7,8)].forEach(p=>b[p]=1);b[0]=2;assert.equal(chooseMove(b,1,difficulty),112);
  const danger=empty();[pos(6,7),pos(7,7),pos(8,7)].forEach(p=>danger[p]=2);danger[0]=1;assert.ok([pos(5,7),pos(9,7)].includes(chooseMove(danger,1,difficulty)));
 }
 assert.equal(chooseMove(empty(),1,'hard'),112);assert.equal(chooseMove(Array(225).fill(1),2,'hard'),null);assert.equal(suggestMove(Array(225).fill(1),2),null);
 const b=empty();[0,1,2,3].forEach(p=>b[p]=2);const hint=suggestMove(b,1);assert.equal(hint.pos,4);assert.match(hint.reason,/挡住/);assert.equal(moveStrength(b,0,1),-Infinity);
});

test('满盘且没有五连时判和棋，最后一格不会继续请求落子',()=>{
 const black=[],white=[];
 for(let y=0;y<15;y++)for(let x=0;x<15;x++)((x+2*y)%4<2?black:white).push(pos(x,y));
 assert.equal(black.length,113);assert.equal(white.length,112);
 const moves=black.flatMap((p,i)=>i<white.length?[p,white[i]]:[p]);
 assert.equal(normalizeGomoku({moves}).moves.length,225);assert.deepEqual(gameResult(moves),{winner:0,line:[],draw:true});assert.throws(()=>playMove({moves},0),/已经结束/);
});

test('旧多缸迁移到上限时撤回不兼容物品仍保留收藏；损坏对象列表安全归一化',()=>{
 const s={version:2,owned:['clownfish'],activeTankId:'old-0',tanks:Array.from({length:12},(_,i)=>({id:'old-'+i,objects:[{id:'sea',itemId:'clownfish',x:40,y:40}]}))};
 const migrated=normalizeDecor(s,'aquarium');assert.equal(migrated.tanks.length,12);assert.ok(migrated.tanks.every(t=>t.objects.length===0));assert.ok(migrated.owned.includes('clownfish'));assert.match(migrated.migrationNotice,/12 件已撤回收藏/);assert.deepEqual(normalizeDecor(migrated,'aquarium'),migrated);
 for(const objects of ['broken',{},42,null])assert.equal(normalizeDecor({objects},'aquarium').tanks[0].objects.length,8);
});
