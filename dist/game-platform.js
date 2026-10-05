import {validGameId,normalizeWallet,walletBalance,chargeWallet} from './game-wallet.js';
const object=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const clone=value=>JSON.parse(JSON.stringify(value));

export function createGameRegistry(definitions){
 const entries=new Map();
 for(const definition of definitions){
  if(!validGameId(definition.id)||entries.has(definition.id)||typeof definition.name!=='string'||typeof definition.normalize!=='function'||typeof definition.createUI!=='function')throw Error('游戏注册信息无效或 ID 重复');
  entries.set(definition.id,Object.freeze({...definition}));
 }
 return Object.freeze({list:()=>[...entries.values()],get:id=>entries.get(id)});
}

// The original storage key remains unchanged. Migration is saved with the next
// successful transaction, so a failed write never partially moves a save.
export function normalizePlatformState(value,history,registry){
 const modern=value?.version===3;
 const modules=Object.fromEntries(Object.entries(object(modern?value.modules:{})).filter(([id])=>validGameId(id)));
 let wallet=normalizeWallet(modern?value.wallet:{});
 for(const game of registry.list()){
  const source=modern?modules[game.id]:game.legacy?value:undefined;
  const state=game.normalize(clone(source??{}),history);
  modules[game.id]=state;
  if(!modern&&game.legacy){
   for(const p of game.purchases?.(state)||[])wallet=chargeWallet(wallet,history,{...p,gameId:game.id});
  }
 }
 return {version:3,wallet,modules};
}

export function createGamePlatform({storage,history,registry,locks=globalThis.navigator?.locks}){
 let queue=Promise.resolve(),pending=0;
 const read=()=>normalizePlatformState(storage.read('games',{}),history(),registry);
 function transact(change){
  pending++;
  const run=()=>{
   const rounds=history(),state=normalizePlatformState(storage.read('games',{}),rounds,registry);
   const next=change(state,rounds);
   if(!storage.write('games',next))throw Error('保存失败：浏览器空间可能已满。请先下载作品，再重试保存。');
   return next;
  };
  const result=queue.then(()=>locks?locks.request('math-island-games',run):run());
  queue=result.catch(()=>{});
  return result.finally(()=>{pending--;});
 }
 function forGame(id){
  const game=registry.get(id);if(!game)throw Error('没有找到这个游戏');
  function update(change,purchase,shouldCharge=false){
   return transact((state,rounds)=>{
    const previous=state.modules[id],changed=change(clone(previous));
    if(!changed||typeof changed!=='object'||typeof changed.then==='function')throw Error('游戏更新必须同步返回存档');
    const next=game.normalize(changed,rounds);
    const oldPurchases=new Set((game.purchases?.(previous)||[]).map(p=>p.id));
    const added=(game.purchases?.(next)||[]).filter(p=>!oldPurchases.has(p.id));
    // A declared inventory (such as coloring boards and frames) is charged
    // automatically in the same write as the module's new save.
    for(const p of added)state.wallet=chargeWallet(state.wallet,rounds,{...p,gameId:id});
    if(shouldCharge){
     if(added.some(p=>p.id===purchase?.id))throw Error('同一笔购买不能重复计费');
     state.wallet=chargeWallet(state.wallet,rounds,{...purchase,gameId:id});
    }
    state.modules[id]=next;return state;
   }).then(state=>clone(state.modules[id]));
  }
  return Object.freeze({
   read:()=>clone(read().modules[id]),
   update:change=>update(change),
   purchase:(purchase,change)=>update(change,purchase,true),
   wallet:()=>walletBalance(read().wallet,history()),
   owns:purchaseId=>read().wallet.purchases.some(p=>p.gameId===id&&p.id===purchaseId)
  });
 }
 return Object.freeze({read,wallet:()=>walletBalance(read().wallet,history()),forGame,isPending:()=>pending>0});
}

export function resolveGameRoute(params,registry){
 if(params.game)return registry.get(params.game)?{id:params.game,params}:null;
 // Bookmarked studio, gallery and room links from before the game lobby.
 if(['shop','gallery','wall','frames','studio','puzzle'].includes(params.tab)&&registry.get('coloring'))return {id:'coloring',params};
 return null;
}

export function createGameHost({registry,platform,context,renderLobby,onRouteChange,toast}){
 let active=null,activeId=null,generation=0;
 function deactivate(){generation++;active?.dispose();active=null;activeId=null;}
 function routeParams(){return active?{...active.routeParams(),game:activeId}:{};}
 function openRoute(params={}){
  const route=resolveGameRoute(params,registry);
  if(!route){
   deactivate();renderLobby();
   if(params.game)toast('这个游戏暂时不可用，先看看其他游戏吧。');
   onRouteChange({});return;
  }
  if(activeId!==route.id){
   deactivate();activeId=route.id;
   const instance=generation;
   active=registry.get(activeId).createUI({
    ...context,game:platform.forGame(activeId),
    isActive:()=>generation===instance&&activeId===route.id&&context.getView()==='games',
    onRouteChange:(next,options)=>{if(generation===instance&&activeId===route.id)onRouteChange({...next,game:route.id},options);}
   });
   if(!active||['openRoute','routeParams','beforeLeave','dispose'].some(key=>typeof active[key]!=='function'))throw Error('游戏界面缺少必要的接入方法');
  }
  const {game,...next}=route.params;active.openRoute(next);
 }
 return {
  openRoute,routeParams,deactivate,
  beforeLeave:()=>{
   if(active?.beforeLeave()===false)return false;
   if(platform.isPending()){toast('正在保存，请稍等一下再离开。');return false;}
   return true;
  },
  refresh:()=>{if(!active)renderLobby();}
 };
}
