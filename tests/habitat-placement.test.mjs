import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ITEMS,ITEM_BY_ID,ROOMS,normalizeHabitat,buyItem,decorateRoom,removeRoomItem,clearRoom,moveRoomItem,ownedItems,wallet,canPlaceAt,canPlaceInRoom,isMovable,placementBounds,defaultPlacement} from '../dist/habitat.js';
import {PETS} from '../dist/companions.js';
import {FURNITURE_ART} from '../dist/furniture-art-data.js';
import {itemArt,itemRatio} from '../dist/habitat-art.js';
const history=Array.from({length:600},(_,i)=>({id:'round'+i,date:'2026-10-04',details:Array.from({length:60},()=>({userAnswer:'7'}))}));
const all=()=>ITEMS.filter(i=>i.price).reduce((s,i)=>buyItem(s,history,i.id),normalizeHabitat(null,history));

test('旧版三个房间迁移为四个：保留拥有的家具、价格、穿搭与伙伴，新卧室含入住床',()=>{
 const old={version:2,purchases:[{itemId:'desk-oak',paid:280}],rooms:{study:{wall:null,floor:null,rug:null,furniture:'desk-oak',decor:null}},residents:{rabbit:'study'},outfits:{fox:{}}};
 const s=normalizeHabitat(old,history);assert.equal(Object.keys(s.rooms).length,4);assert.deepEqual(s.rooms.study.objects.map(o=>o.itemId),['desk-oak']);assert.equal(s.rooms.study.wall,null);assert.equal(s.rooms.study.floor,null);assert.equal(s.residents.rabbit,'study');assert.equal(wallet(s,history).spent,280);assert.ok(s.rooms.bedroom.objects.some(o=>o.itemId==='bed-basic'));assert.deepEqual(normalizeHabitat(s,history),s);
});
test('默认物品逐件撤下、背景地面撤下与清空房间持久化；收藏不丢失，可再次摆放',()=>{
 let s=normalizeHabitat(null,history);const initialOwned=[...ownedItems(s)];
 for(const id of ['rug-sun','sofa-cloud','plant-sprout','wall-cream','floor-oak'])s=removeRoomItem(s,history,'lounge',id);
 assert.deepEqual(s.rooms.lounge,{wall:null,floor:null,objects:[]});s=normalizeHabitat(JSON.parse(JSON.stringify(s)),history);assert.deepEqual(s.rooms.lounge,{wall:null,floor:null,objects:[]});assert.deepEqual([...ownedItems(s)],initialOwned);
 for(const r of Object.keys(ROOMS)){s=clearRoom(s,history,r);assert.deepEqual(normalizeHabitat(s,history).rooms[r],{wall:null,floor:null,objects:[]});}
 s=decorateRoom(s,history,'lounge','sofa-cloud');assert.deepEqual(s.rooms.lounge.objects.map(o=>o.itemId),['sofa-cloud']);
});
test('同一房间同时摆多件同类家具，同一物品不重复，适用房间复用不再扣币',()=>{
 let s=all();const spent=wallet(s,history).spent;
 for(const id of ['sofa-mint','desk-oak','honey-teatable','tile-fireplace','sofa-mint'])s=decorateRoom(s,history,'lounge',id);
 assert.equal(s.rooms.lounge.objects.filter(o=>ITEM_BY_ID[o.itemId].category==='furniture').length,5);
 s=decorateRoom(s,history,'bedroom','sofa-mint');assert.equal(wallet(s,history).spent,spent);assert.equal(s.rooms.lounge.objects.filter(o=>o.itemId==='sofa-mint').length,1);
});
test('房间专属商品在放置和读档时都执行限制，非法物品不会被带入房间',()=>{
 let s=all();for(const [id,r] of [['rose-arch','garden'],['bird-clock','lounge'],['arched-library','study'],['moon-canopy','bedroom']]){
  assert.ok(canPlaceInRoom(id,r));s=decorateRoom(s,history,r,id);for(const other of Object.keys(ROOMS).filter(x=>x!==r))assert.throws(()=>decorateRoom(s,history,other,id),/适合/);
 }
 s.rooms.lounge.objects.push({itemId:'rose-arch',x:50,y:86},{itemId:'constructor',x:50,y:86});assert.ok(!normalizeHabitat(s,history).rooms.lounge.objects.some(o=>o.itemId==='rose-arch'));
 for(const invalid of ['constructor','__proto__','missing',null]){assert.equal(canPlaceInRoom(invalid,'lounge'),false);assert.equal(isMovable(invalid),false);assert.equal(placementBounds('lounge',invalid),null);}
});
test('墙面挂件、落地家具、地毯使用各自区域，越界和无效坐标拒绝且不覆盖旧位置',()=>{
 let s=all();for(const [id,room] of [['bird-clock','lounge'],['acorn-sofa','lounge'],['rug-sun','lounge'],['lily-pond','garden']]){
  s=decorateRoom(s,history,room,id);const b=placementBounds(room,id),p={x:(b.left+b.right)/2,y:(b.top+b.bottom)/2};assert.ok(canPlaceAt(room,id,p));s=moveRoomItem(s,history,room,id,p);const saved=JSON.stringify(s);
  for(const bad of [{x:b.left-1,y:p.y},{x:p.x,y:b.top-1},{x:b.right+1,y:p.y},{x:p.x,y:b.bottom+1},{x:NaN,y:p.y},{x:p.x,y:Infinity}])assert.throws(()=>moveRoomItem(s,history,room,id,bad),/高亮/);
  assert.equal(JSON.stringify(s),saved);assert.deepEqual(normalizeHabitat(JSON.parse(saved),history),s);
 }
 assert.ok(placementBounds('lounge','bird-clock').bottom<placementBounds('lounge','acorn-sofa').top);
 assert.throws(()=>moveRoomItem(s,history,'constructor','rug-sun',{x:50,y:90}),/先把/);
});
test('地毯在宽屏最不利比例下仍完全贴在地面：上边不越过墙脚，底部不越界',()=>{
 for(const i of ITEMS.filter(i=>i.zone==='rug')){assert.ok(itemRatio(i)>=2.5);for(const room of i.rooms){const b=placementBounds(room,i.id),height=i.size*2/itemRatio(i);assert.ok(b.top-height>=66-1e-9,i.id);assert.ok(b.top<b.bottom);assert.ok(canPlaceAt(room,i.id,defaultPlacement(i.id,room)));}}
});
test('所有可移动商品与配饰都有同风格透明素材，每件商品的精确窗口对应源PNG尺寸，无方形占位图',()=>{
 const goods=ITEMS.filter(i=>!['wall','floor'].includes(i.category));assert.equal(Object.keys(FURNITURE_ART).length,goods.length);
 for(const i of goods){const f=FURNITURE_ART[i.id];assert.ok(f,i.id);const bytes=readFileSync(new URL('../dist'+f.src,import.meta.url));const [x,y,w,h,W,H]=f.window;assert.equal(bytes.readUInt32BE(16),W);assert.equal(bytes.readUInt32BE(20),H);assert.equal(bytes[25],6,'PNG must carry alpha');assert.ok(x>=0&&y>=0&&x+w<=W&&y+h<=H);assert.match(f.clip,/^polygon\(/);assert.match(itemArt(i),/furniture-sprite/);}
 assert.equal(new Set(goods.map(i=>JSON.stringify([FURNITURE_ART[i.id].src,FURNITURE_ART[i.id].window]))).size,goods.length);
});
test('四个房间都有专属商品；伙伴具名且保持原有稳定ID',()=>{
 assert.deepEqual(Object.keys(ROOMS),['lounge','study','garden','bedroom']);for(const r of Object.keys(ROOMS))assert.ok(ITEMS.filter(i=>i.rooms.length===1&&i.rooms[0]===r&&i.price>0).length>=4);
 assert.deepEqual(Object.keys(PETS),['fox','rabbit','panda','cat']);assert.deepEqual(Object.values(PETS).map(p=>p.nickname),['阿橙','朵朵','团团','星米']);
});

test('所有物品默认落点有效，细长挂件在宽屏边界也不裁切',()=>{
 for(const i of ITEMS.filter(i=>isMovable(i.id)))for(const room of i.rooms){const b=placementBounds(room,i.id),ratio=itemRatio(i);assert.ok(b.top<=b.bottom,i.id);assert.ok(canPlaceAt(room,i.id,defaultPlacement(i.id,room)),i.id);assert.ok(b.top-i.size*2/ratio>=0,i.id);}
});

test('添加同类家具优先找较空的位置，挂饰区域避开固定窗户',()=>{
 let s=all();s=decorateRoom(s,history,'study','arched-library');assert.notEqual(s.rooms.study.objects.find(o=>o.itemId==='arched-library').x,s.rooms.study.objects.find(o=>o.itemId==='sofa-cloud').x);
 const study=placementBounds('study','celestial-chart');assert.ok(study.right+ITEM_BY_ID['celestial-chart'].size/2<=68);
 const lounge=placementBounds('lounge','bird-clock');assert.ok(lounge.left-ITEM_BY_ID['bird-clock'].size/2>=30);
});

test('新增12件日常好物保持100–240价格，购买扣币正确，适用房间摆放后刷新保留',()=>{
 const additions=ITEMS.filter(i=>i.id.startsWith('daily-'));
 assert.equal(additions.length,12);
 let s=normalizeHabitat(null,history),cost=0;
 const balance=wallet(s,history).balance;
 for(const i of additions){
  assert.equal(i.tier,'everyday',i.id);assert.ok(i.price>=100&&i.price<=240,i.id);
  s=buyItem(s,history,i.id);cost+=i.price;assert.equal(wallet(s,history).balance,balance-cost);
  for(const room of i.rooms){s=decorateRoom(s,history,room,i.id);assert.ok(s.rooms[room].objects.some(o=>o.itemId===i.id));}
  for(const room of Object.keys(ROOMS).filter(r=>!i.rooms.includes(r)))assert.throws(()=>decorateRoom(s,history,room,i.id),/适合/);
 }
 assert.deepEqual(normalizeHabitat(JSON.parse(JSON.stringify(s)),history),s);
 assert.equal(wallet(s,history).spent,cost);
});
