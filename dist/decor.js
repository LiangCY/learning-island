import {DECOR_GAMES,fitsWater,WATER_TYPES,tankModel} from './decor-catalog.js';
import {PLAYGROUND_ART} from './playground-art-data.js';
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const number=(n,fallback)=>typeof n==='number'&&Number.isFinite(n)?n:fallback;
const validId=value=>typeof value==='string'&&/^[\w-]{1,80}$/.test(value)&&!['constructor','__proto__','prototype'].includes(value);
export const MAX_AQUARIUM_TANKS=12;
export function decorObjectWidth(kind,item,scale=1,tank='tank-oak'){
 const model=tankModel(tank),ratio=kind==='aquarium'?model.width/model.height:1.5;
 return item.size*scale*Math.min(1,1.5/ratio);
}
export function decorBounds(kind,item,scale=1,tank='tank-oak'){
 const width=decorObjectWidth(kind,item,scale,tank),half=width/2,model=tankModel(tank),ratio=kind==='aquarium'?model.width/model.height:1.5;
 const [, ,w,h]=PLAYGROUND_ART[item.atlas||kind][item.index];
 const height=width*h/w*ratio,bottom=['bottom','crawl'].includes(item.motion);
 return {minX:half+1,maxX:99-half,minY:Math.max(height+2,item.fish?(bottom?77:18):kind==='garden'?43:78),maxY:item.fish?(bottom?94:68):96};
}
function normalizeScene(value,kind,owned){
 const config=DECOR_GAMES[kind],seen=new Set(),water=value?.water==='salt'?'salt':'fresh';let fish=0;
 const tank=owned.includes(value?.tank)&&config.byId[value.tank]?.slot==='tank'?value.tank:'tank-oak',capacity={objects:config.max,fish:18};
 const source=Array.isArray(value?.objects)?value.objects:config.defaults.map(([itemId,x,y],i)=>({id:'starter-'+i,itemId,x,y,scale:1,flip:false}));
 const objects=source.flatMap(object=>{
  const item=Object.hasOwn(config.byId,object?.itemId)?config.byId[object.itemId]:null;
  if(!item||item.slot||(kind==='aquarium'&&!fitsWater(item,water))||!owned.includes(item.id)||!validId(object.id)||seen.has(object.id)||seen.size>=capacity.objects)return [];
  if(item.fish&&++fish>capacity.fish)return [];
  seen.add(object.id);const scale=clamp(number(object.scale,1),.65,1.35),b=decorBounds(kind,item,scale,tank);
  return [{id:object.id,itemId:item.id,x:clamp(number(object.x,50),b.minX,b.maxX),y:clamp(number(object.y,item.fish?45:85),b.minY,b.maxY),scale,flip:object.flip===true}];
 });
 const scene={name:typeof value?.name==='string'&&value.name.trim()?value.name.trim().slice(0,24):config.sceneName,objects};
 if(kind==='aquarium')scene.water=water;
 if(kind==='aquarium')for(const slot of ['tank','light'])scene[slot]=owned.includes(value?.[slot])&&config.byId[value[slot]].slot===slot?value[slot]:config.items.find(i=>i.slot===slot&&i.price===0).id;
 if(kind==='garden')scene.time=['day','sunset'].includes(value?.time)?value.time:'day';
 return scene;
}
export function normalizeDecor(value,kind){
 const config=DECOR_GAMES[kind];if(!config)throw Error('未知的布置游戏');
 const owned=[...new Set([...config.items.filter(i=>i.price===0).map(i=>i.id),...(Array.isArray(value?.owned)?value.owned:[]).filter(i=>Object.hasOwn(config.byId,i))])];
 if(kind==='garden')return {version:1,owned,...normalizeScene(value,kind,owned)};
 // Older scenes could mix water types. Split incompatible organisms into a
 // companion tank during migration; all purchases stay in the shared collection.
 const migrating=![3,4,5].includes(value?.version);
 const sources=Array.isArray(value?.tanks)?value.tanks:[{...value,id:'tank-home'}];
 const seen=new Set(),tanks=[];let moved=0,returned=0;
 for(const t of sources){
  if(!validId(t?.id)||seen.has(t.id)||tanks.length>=MAX_AQUARIUM_TANKS)continue;
  seen.add(t.id);tanks.push({id:t.id,...normalizeScene(t,kind,owned)});
 }
 if(!tanks.length)tanks.push({id:'tank-home',...normalizeScene({},kind,owned)});
 if(migrating)for(const tank of [...tanks]){
  const original=sources.find(t=>t?.id===tank.id),opposite=tank.water==='fresh'?'salt':'fresh';
  const displaced=(Array.isArray(original?.objects)?original.objects:[]).filter(o=>config.byId[o?.itemId]&&config.byId[o.itemId].water===opposite);
  if(!displaced.length)continue;
  const extra=normalizeScene({...original,water:opposite,objects:displaced,name:`${tank.name.slice(0,18)} · ${WATER_TYPES[opposite]}`},kind,owned);
  if(!extra.objects.length)continue;
  if(tanks.length>=MAX_AQUARIUM_TANKS){returned+=extra.objects.length;continue;}
  let id='migrated-'+tanks.length;while(seen.has(id))id+='x';seen.add(id);
  tanks.push({id,...extra});moved+=extra.objects.length;
 }
 const migrationNotice=moved||returned?`已按水体整理旧布置：${moved} 件移入独立鱼缸${returned?'，'+returned+' 件已撤回收藏':''}，已购收藏全部保留。`:typeof value?.migrationNotice==='string'?value.migrationNotice.slice(0,160):'';
 return {version:5,owned,activeTankId:tanks.some(t=>t.id===value?.activeTankId)?value.activeTankId:tanks[0].id,tanks,migrationNotice};
}
export function decorScene(state,kind,tankId){
 if(kind==='garden')return state;
 const scene=state.tanks.find(t=>t.id===(tankId||state.activeTankId));
 if(!scene)throw Error('这口鱼缸暂时找不到了，请重新选择');return scene;
}
export function updateDecorScene(value,kind,tankId,change){
 const state=normalizeDecor(value,kind),scene=decorScene(state,kind,tankId);
 Object.assign(scene,change(scene));return normalizeDecor(state,kind);
}
export function selectAquariumTank(value,tankId){const state=normalizeDecor(value,'aquarium');decorScene(state,'aquarium',tankId);state.activeTankId=tankId;return state;}
export function addAquariumTank(value,itemId,tankId,water='fresh'){
 if(!['fresh','salt'].includes(water))throw Error('请选择淡水或海水');
 const state=normalizeDecor(value,'aquarium'),item=DECOR_GAMES.aquarium.byId[itemId];
 if(!Object.hasOwn(DECOR_GAMES.aquarium.byId,itemId)||item.slot!=='tank')throw Error('请选择一款鱼缸');
 if(!validId(tankId)||state.tanks.some(t=>t.id===tankId))throw Error('鱼缸编号无效');
 if(state.tanks.length>=MAX_AQUARIUM_TANKS)throw Error('最多可以照顾 12 口鱼缸啦');
 if(!state.owned.includes(itemId))state.owned.push(itemId);
 state.tanks.push({id:tankId,name:`${item.name} ${state.tanks.length+1}`,tank:itemId,water,light:'light-sun',objects:[]});state.activeTankId=tankId;
 return normalizeDecor(state,'aquarium');
}
export function aquariumTankPrice(item){return item.price||28;}
export function unlockDecor(value,kind,itemId){
 const state=normalizeDecor(value,kind);
 if(!Object.hasOwn(DECOR_GAMES[kind].byId,itemId))throw Error('没有找到这件物品');
 if(state.owned.includes(itemId))throw Error('已经拥有了，无需重复购买');
 state.owned.push(itemId);return state;
}
export function placeDecor(value,kind,itemId,objectId,tankId){
 const state=normalizeDecor(value,kind),item=DECOR_GAMES[kind].byId[itemId],scene=decorScene(state,kind,tankId);
 if(!Object.hasOwn(DECOR_GAMES[kind].byId,itemId)||!state.owned.includes(itemId))throw Error('请先收藏这件物品');
 if(kind==='aquarium'&&!fitsWater(item,scene.water))throw Error(`${item.name}只适用于${WATER_TYPES[item.water]}缸，请切换鱼缸后摆放`);
 if(item.slot==='tank')throw Error('请通过购买新鱼缸添加独立鱼缸');
 if(item.slot){scene[item.slot]=itemId;return state;}
 if(!validId(objectId)||scene.objects.some(o=>o.id===objectId))throw Error('物品编号无效');
 const capacity={name:kind==='aquarium'?'鱼缸':'花园',objects:48,fish:18};
 if(scene.objects.length>=capacity.objects)throw Error(`${capacity.name}已经摆满 ${capacity.objects} 件啦，可以先撤下一些再摆放`);
 if(item.fish&&scene.objects.filter(o=>DECOR_GAMES[kind].byId[o.itemId].fish).length>=capacity.fish)throw Error(`${capacity.name}已经有 ${capacity.fish} 位小伙伴啦，可以先撤下一位再摆放`);
 scene.objects.push({id:objectId,itemId,x:45+scene.objects.length%4*6,y:item.fish?40+scene.objects.length%3*8:80+scene.objects.length%3*5,scale:1,flip:false});
 return normalizeDecor(state,kind);
}
export function changeDecorObject(value,kind,objectId,patch,tankId){
 return updateDecorScene(value,kind,tankId,scene=>{
  const object=scene.objects.find(o=>o.id===objectId);if(!object)throw Error('这个物品已经撤下了');
  for(const key of ['x','y','scale','flip'])if(Object.hasOwn(patch,key))object[key]=patch[key];return scene;
 });
}
export function removeDecor(value,kind,objectId,tankId){return updateDecorScene(value,kind,tankId,s=>({...s,objects:s.objects.filter(o=>o.id!==objectId)}));}
export function clearDecor(value,kind,tankId){return updateDecorScene(value,kind,tankId,s=>({...s,objects:[]}));}
export function resetDecor(value,kind,tankId){return updateDecorScene(value,kind,tankId,s=>({...s,objects:undefined}));}
