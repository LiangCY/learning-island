import test from 'node:test';
import assert from 'node:assert/strict';
import {TANK_MODELS,DECOR_GAMES,tankModel} from '../dist/decor-catalog.js';
import {normalizeDecor,addAquariumTank,aquariumTankPrice,placeDecor,decorScene,unlockDecor,removeDecor,decorBounds,decorObjectWidth} from '../dist/decor.js';
import {PLAYGROUND_ART} from '../dist/playground-art-data.js';
import {createGamePlatform} from '../dist/game-platform.js';
import {GAME_REGISTRY} from '../dist/game-catalog.js';
import {swimStyle} from '../dist/aquarium-motion.js';

test('11款鱼缸有各自固定宽高，比例多样且数量规则不因款式变化',()=>{
 const models=Object.keys(TANK_MODELS);assert.equal(models.length,11);assert.equal(new Set(models.map(id=>{const m=tankModel(id);return m.width+'/'+m.height;})).size,11);
 assert.ok(new Set(models.map(id=>{const m=tankModel(id);return (m.width/m.height).toFixed(2);})).size>=7);
 for(const id of models){
  let s=addAquariumTank({},id,'model','fresh');assert.equal(decorScene(s,'aquarium').tank,id);assert.equal('size' in decorScene(s,'aquarium'),false);
  for(let i=0;i<18;i++)s=placeDecor(s,'aquarium','goldfish','fish-'+i);
  assert.throws(()=>placeDecor(s,'aquarium','goldfish','too-many'),/18 位/);
  for(let i=18;i<48;i++)s=placeDecor(s,'aquarium','driftwood','decor-'+i);
  assert.throws(()=>placeDecor(s,'aquarium','driftwood','full'),/48 件/);
  s=removeDecor(s,'aquarium','fish-0');s=placeDecor(s,'aquarium','goldfish','replacement');assert.equal(decorScene(s,'aquarium').objects.length,48);
  assert.deepEqual(normalizeDecor(s,'aquarium'),s);
 }
});
test('旧档保留鱼缸款式和全部布置，移除大中小字段，旧框仍是紧凑桌景比例',()=>{
 const legacy={version:4,owned:['tank-pearl'],activeTankId:'old',tanks:[{id:'old',name:'旧缸',tank:'tank-pearl',size:'large',water:'fresh',objects:Array.from({length:18},(_,i)=>({id:'old-'+i,itemId:'goldfish',x:30+i,y:50,scale:1,flip:false}))}]};
 const s=normalizeDecor(legacy,'aquarium');assert.equal(s.version,5);assert.equal(s.tanks[0].tank,'tank-pearl');assert.equal('size' in s.tanks[0],false);assert.deepEqual(s.tanks[0].objects,legacy.tanks[0].objects);assert.equal(s.tanks[0].name,'旧缸');assert.deepEqual(normalizeDecor(s,'aquarium'),s);
 assert.equal(tankModel('tank-pearl').width,48);assert.throws(()=>addAquariumTank(s,'unknown','bad'),/鱼缸/);
});
test('按具体款式原子扣款，价格固定，余额不足不会创建鱼缸',async()=>{
 let data={};const p=createGamePlatform({storage:{read:()=>structuredClone(data),write:(_,s)=>{data=structuredClone(s);return true;}},history:()=>[],registry:GAME_REGISTRY,locks:null}),a=p.forGame('aquarium');
 assert.equal(aquariumTankPrice(DECOR_GAMES.aquarium.byId['tank-oak']),28);
 await a.purchase({id:'tank-stream',paid:aquariumTankPrice(DECOR_GAMES.aquarium.byId['tank-stream'])},s=>addAquariumTank(s,'tank-stream','stream','salt'));assert.equal(p.wallet().balance,58);assert.equal(decorScene(a.read(),'aquarium').tank,'tank-stream');
 const before=p.read();await assert.rejects(a.purchase({id:'tank-panorama',paid:110},s=>addAquariumTank(s,'tank-panorama','wide','salt')),/还不够/);assert.deepEqual(p.read(),before);
});
test('所有素材在高柱、方缸和横向长缸中保持完整，拖动及动画使用同一边界',()=>{
 for(const id of Object.keys(TANK_MODELS))for(const item of DECOR_GAMES.aquarium.items.filter(i=>!i.slot))for(const scale of [.65,1,1.35]){
  const m=tankModel(id),width=decorObjectWidth('aquarium',item,scale,id),[, ,w,h]=PLAYGROUND_ART[item.atlas||'aquarium'][item.index],height=width*h/w*m.width/m.height,b=decorBounds('aquarium',item,scale,id);
  assert.ok(b.minX-width/2>=0&&b.maxX+width/2<=100);assert.ok(b.minY-height>=0&&b.minY<=b.maxY&&b.maxY<=100,`${id}/${item.id}`);
  const s=normalizeDecor({version:5,owned:[id,item.id],tanks:[{id:'t',tank:id,water:item.water==='salt'?'salt':'fresh',objects:[{id:'o',itemId:item.id,x:-999,y:999,scale}]}]},'aquarium');
  const o=s.tanks[0].objects[0];assert.equal(o.x,b.minX);assert.equal(o.y,b.maxY);
 }
});
test('海星海胆属于海水生物，慢速贴底并可收藏后重摆',()=>{
 let s=addAquariumTank({},'tank-oak','sea','salt');
 for(const id of ['starfish','urchin']){
  const item=DECOR_GAMES.aquarium.byId[id];assert.equal(item.water,'salt');assert.equal(item.fish,true);assert.equal(item.motion,'crawl');assert.ok(swimStyle(item).speed<swimStyle({motion:'bottom'}).speed);
  s=unlockDecor(s,'aquarium',id);s=placeDecor(s,'aquarium',id,id);const o=decorScene(s,'aquarium').objects.find(o=>o.id===id);assert.ok(o.y>=77&&o.y<=94);
  assert.throws(()=>placeDecor(s,'aquarium',id,id+'-fresh','tank-home'),/海水/);
  s=removeDecor(s,'aquarium',id);assert.ok(s.owned.includes(id));s=placeDecor(s,'aquarium',id,id+'-again');
 }
 assert.equal(decorScene(s,'aquarium').objects.length,2);
});
