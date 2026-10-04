import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {coinRewards,earnedCoins,normalizeHabitat,ownedItems,wallet,buyItem,decorateRoom,equipItem,movePet,toggleWish,homeMilestones,ITEMS,ROOMS,positionPet,resetPositions} from '../dist/habitat.js';
import {COMPANION_ART} from '../dist/companion-art-data.js';
import {companionArt} from '../dist/companion-art.js';
const funded=Array.from({length:8},(_,i)=>({id:'fund'+i,date:'2026-10-03T01:00:00.000Z',details:Array.from({length:60},()=>({userAnswer:'7'}))}));
const round=(id,filled,date='2026-10-03T01:00:00.000Z',blanks=0)=>({id,date,details:[...Array.from({length:filled},()=>({userAnswer:'7',correct:false})),...Array.from({length:blanks},()=>({userAnswer:' ',correct:false}))]});

test('金币按填答获得，空白不给币，20题奖励与上海自然日首轮奖励准确',()=>{
 const h=[round('one',20,'2026-10-02T15:59:00.000Z',40),round('two',30,'2026-10-02T16:01:00.000Z'),round('three',60,'2026-10-03T05:00:00.000Z'),round('short',8,'2026-10-03T06:00:00.000Z'),round('empty',0)];
 assert.deepEqual(coinRewards(h).map(r=>[r.id,r.base,r.completion,r.daily,r.total]),[['one',20,10,10,40],['two',30,10,10,50],['empty',0,0,0,0],['three',60,10,0,70],['short',8,0,0,8]]);
 assert.equal(earnedCoins(h),248);assert.equal(earnedCoins([...h,...h]),248);assert.equal(earnedCoins([...h].reverse()),248);
 assert.equal(coinRewards([round('invalid',20,'bad-date')])[0].daily,0);
});
test('新用户有80入住币和六件基础家具，损坏存储与未知字段安全回退',()=>{
 for(const value of [null,{},[],{purchases:'x',rooms:{lounge:{wall:'__proto__'}},outfits:{fox:{head:'head-crown'}},residents:{fox:'constructor'}}]){
  const s=normalizeHabitat(value);assert.equal(wallet(s).balance,80);assert.equal(ownedItems(s).size,6);assert.equal(s.rooms.lounge.wall,'wall-cream');assert.equal(s.outfits.fox.head,null);assert.equal(s.residents.fox,'lounge');
 }
});
test('新价格扣款精确、拒绝余额不足和重复购买，刷新不重计价格',()=>{
 let s=buyItem(null,funded,'head-crown');assert.equal(wallet(s,funded).balance,130);
 assert.throws(()=>buyItem(s,funded,'head-crown'),/已经/);assert.throws(()=>buyItem(s,funded,'tent-moon'),/不够/);
 s=buyItem(s,funded,'neck-sage');assert.equal(wallet(s,funded).balance,5);
 assert.deepEqual(normalizeHabitat(JSON.parse(JSON.stringify(s)),funded),s);
 const repaired=normalizeHabitat({...s,purchases:[...s.purchases,...s.purchases,{itemId:'tent-moon'},{itemId:'constructor'}]},funded);assert.deepEqual(repaired,s);
});
test('涨价保留旧购买成本、物品与穿搭，新增购买按现价且迁移幂等',()=>{
 const old={version:1,purchases:[{itemId:'head-flower',date:'2026-10-03'},{itemId:'desk-oak',date:'2026-10-03'}],outfits:{fox:{head:'head-flower'}},rooms:{study:{furniture:'desk-oak'}}};
 const s=normalizeHabitat(old);assert.equal(wallet(s).spent,70);assert.equal(wallet(s).balance,10);assert.equal(s.outfits.fox.head,'head-flower');assert.ok(s.rooms.study.objects.some(o=>o.itemId==='desk-oak'));assert.deepEqual(normalizeHabitat(s),s);
 const next=buyItem(s,funded,'neck-sage');assert.equal(next.purchases.at(-1).paid,125);assert.equal(wallet(next,funded).spent,195);assert.deepEqual(normalizeHabitat(next,funded),next);
 assert.ok(ITEMS.filter(i=>i.legacyPrice<100&&i.price).every(i=>i.price>=i.legacyPrice*4));
});
test('家具跨房间重用、穿搭分槽保存，不扣第二次款',()=>{
 let s=buyItem(null,funded,'desk-oak');s=decorateRoom(s,funded,'study','desk-oak');s=decorateRoom(s,funded,'bedroom','desk-oak');
 assert.ok(s.rooms.lounge.objects.some(o=>o.itemId==='sofa-cloud'));assert.ok(s.rooms.bedroom.objects.some(o=>o.itemId==='desk-oak'));assert.equal(wallet(s,funded).spent,280);assert.throws(()=>decorateRoom(s,funded,'lounge','tent-moon'));
 for(const [slot,id] of [['head','head-flower'],['neck','neck-sage'],['charm','charm-leaf']]){s=buyItem(s,funded,id);s=equipItem(s,funded,'fox',slot,id);}
 s=equipItem(s,funded,'rabbit','head','head-flower');s=equipItem(s,funded,'fox','head',null);assert.equal(s.outfits.fox.neck,'neck-sage');assert.equal(s.outfits.fox.charm,'charm-leaf');assert.equal(s.outfits.rabbit.head,'head-flower');assert.equal(s.outfits.cat.head,null);
 assert.throws(()=>equipItem(s,funded,'fox','head','neck-sage'));assert.deepEqual(normalizeHabitat(JSON.parse(JSON.stringify(s)),funded),s);
});
test('位置在房间内按百分比保存、约束边界、搬家互不覆盖且能重置',()=>{
 let s=positionPet(null,[],'lounge','fox',{x:70,y:20});s=movePet(s,[],'fox','garden');s=positionPet(s,[],'garden','fox',{x:-99,y:999});
 assert.deepEqual(s.positions.lounge.fox,{x:70,y:20});assert.deepEqual(s.positions.garden.fox,{x:12,y:24});assert.equal(s.residents.panda,'lounge');
 assert.deepEqual(normalizeHabitat(JSON.parse(JSON.stringify(s))),s);s=resetPositions(s,[],'lounge');assert.deepEqual(s.positions.lounge.fox,{x:18,y:8});assert.deepEqual(s.positions.garden.fox,{x:12,y:24});
 assert.deepEqual(positionPet(s,[],'garden','fox',{x:NaN,y:Infinity}).positions.garden.fox,{x:12,y:24});assert.throws(()=>positionPet(s,[],'unknown','fox',{x:1,y:2}));
});
test('心愿单与收集印章在购买换装后更新并持久化',()=>{
 let s=toggleWish(null,funded,'head-flower');assert.deepEqual(s.wishlist,['head-flower']);s=buyItem(s,funded,'head-flower');s=equipItem(s,funded,'rabbit','head','head-flower');
 assert.deepEqual(s.wishlist,[]);assert.deepEqual(homeMilestones(s).slice(0,2).map(x=>x.done),[true,true]);assert.deepEqual(normalizeHabitat(JSON.parse(JSON.stringify(s)),funded),s);
});
test('四位伙伴各有四个不同的完整图像窗口，佩戴配饰在渲染图层显示',()=>{
 for(const [id,art] of Object.entries(COMPANION_ART)){
  assert.equal(art.frames.length,4);assert.equal(new Set(art.frames.map(f=>JSON.stringify(f.window))).size,4);
  for(const f of art.frames){const png=readFileSync(new URL('../dist'+(f.src||art.src),import.meta.url));const [x,y,w,h,W,H]=f.window;assert.equal(png.readUInt32BE(16),W);assert.equal(png.readUInt32BE(20),H);assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=W&&y+h<=H);assert.match(f.clip,/^polygon\(/);}
  const html=companionArt(id,4,{head:'head-flower',neck:'neck-sage',charm:'charm-star'});assert.match(html,/level-4/);for(const slot of ['head','neck','charm'])assert.ok(html.includes('wear-'+slot));
 }
 assert.equal(ITEMS.length,new Set(ITEMS.map(i=>i.id)).size);assert.equal(Object.keys(ROOMS).length,4);
});

test('上版购买按成交价保留，典藏珍品购买和布置后刷新不丢失',()=>{
 const previous={version:2,purchases:[{itemId:'head-crown',paid:360,date:'2026-10-03'}],outfits:{fox:{head:'head-crown'}}};
 const migrated=normalizeHabitat(previous,funded);assert.equal(wallet(migrated,funded).spent,360);assert.equal(migrated.outfits.fox.head,'head-crown');assert.deepEqual(normalizeHabitat(migrated,funded),migrated);
 const wealth=Array.from({length:100},(_,i)=>round('premium'+i,60));let state=normalizeHabitat(null,wealth);
 for(const id of ['decor-orbit','head-aurora','decor-musicbox','furniture-glasshouse'])state=buyItem(state,wealth,id);
 assert.equal(wallet(state,wealth).spent,6000);
 state=decorateRoom(state,wealth,'garden','furniture-glasshouse');state=decorateRoom(state,wealth,'study','decor-orbit');state=decorateRoom(state,wealth,'lounge','decor-musicbox');state=equipItem(state,wealth,'rabbit','head','head-aurora');
 assert.deepEqual(normalizeHabitat(JSON.parse(JSON.stringify(state)),wealth),state);assert.ok(state.rooms.garden.objects.some(o=>o.itemId==='furniture-glasshouse'));
 assert.throws(()=>buyItem(null,[],'decor-musicbox'),/不够/);
});
