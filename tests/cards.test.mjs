import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CARDS,CARD_BY_ID,DECKS,RARITIES,deckId,probabilities,intensity,normalizeCollection,pendingTickets,inventory,pickCard,redeem,redeemBatch} from '../dist/cards.js';
const round=(id,count=20)=>({id,cardTicket:true,date:'2026-10-03T04:00:00.000Z',details:Array.from({length:count},()=>({userAnswer:'7'}))});
const date='2026-10-03T04:10:00.000Z';
const sequence=(...values)=>()=>values.shift();
const empty=()=>normalizeCollection(null);
test('罗小黑只收录两部电影角色；已移除的卡组和旧卡片安全回退',()=>{
 const movieKeys=['xiaohei','wuxian','luye','nezha','fengxi','luozhu','xuhuai','tianhu','ruoshui','jiulao','panjing','yudi','lingyao','ximuzi','jia','yi'];
 assert.deepEqual(CARDS.filter(c=>c.deck==='luo').map(c=>c.id),movieKeys.map(k=>'luo-'+k));
 const sources=JSON.parse(readFileSync(new URL('../docs/asset-sources/luo.json',import.meta.url)));
 for(const c of CARDS.filter(c=>c.deck==='luo')){
  const key=c.id.slice(4);assert.match(sources.images[key],/^https:\/\/luoxiaohei-movie\.com\/(1st|2nd)\//);
  const [x,y,w,h,W,H]=c.artWindow,png=readFileSync(new URL('../dist'+c.art,import.meta.url));
  assert.equal(png.readUInt32BE(16),W);assert.equal(png.readUInt32BE(20),H);assert.ok(w>0&&h>0&&x>=0&&y>=0&&x+w<=W&&y+h<=H);
 }
 const prior={roundId:'prior',cardId:'zootopia-judy',date,intensity:20};
 assert.equal(Object.hasOwn(DECKS,'zootopia'),false);assert.equal(CARDS.some(c=>c.deck==='zootopia'),false);
 assert.deepEqual(normalizeCollection({selectedDeck:'zootopia',draws:[prior]}),{version:1,selectedDeck:'bluey',draws:[]});
});
test('超级飞侠16张卡均使用本地透明去圆底角色图，且旧收藏可保留',()=>{
 const sources=JSON.parse(readFileSync(new URL('../docs/asset-sources/superwings.json',import.meta.url)));
 const wings=CARDS.filter(c=>c.deck==='superwings');assert.equal(wings.length,16);
 assert.equal(normalizeCollection({selectedDeck:'superwings',draws:[]}).selectedDeck,'superwings');
 for(const c of wings){const key=c.id.slice('superwings-'.length),image=readFileSync(new URL('../dist'+c.art,import.meta.url));assert.equal(sources.images[key],`https://www.superwings.es/img/superwing_${key}.png`);assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.ok(image.readUInt32BE(16)>=320);assert.ok(image.readUInt32BE(20)>=320);assert.equal(image.readUInt8(25),6);assert.ok(c.art.endsWith('-cutout.png'));assert.ok(image.length>10000);}
});
test('帮帮龙卡组使用透明4×4图集，16位成员和已移除卡组均可安全抽卡',()=>{
 const cards=CARDS.filter(c=>c.deck==='bangbang'),deck=DECKS.bangbang;
 assert.equal(cards.length,16);assert.equal(pickCard('bangbang',20,sequence(.9,0)).deck,'bangbang');
 const atlas=readFileSync(new URL('../dist/assets/cards/bangbang-atlas.png',import.meta.url));
 assert.equal(atlas.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(atlas.readUInt32BE(16),1254);assert.equal(atlas.readUInt32BE(20),1254);assert.equal(atlas.readUInt8(25),6);
 assert.equal(deck.rows.length,4);assert.deepEqual(cards.slice(0,8).map(c=>c.name),['韦司','汤拇','薇琪','乐乒','洛奇','艾奇','波齐','佩利']);
});
test('八套卡组各16张，有独立介绍和图片，只有R/SR/SSR三档',()=>{
 assert.equal(CARDS.length,128);assert.equal(new Set(CARDS.map(c=>c.id)).size,128);
 assert.deepEqual(Object.keys(RARITIES),['R','SR','SSR']);
 for(const [id,deck] of Object.entries(DECKS)){
  const cards=CARDS.filter(c=>c.deck===id);assert.equal(cards.length,16);
  assert.deepEqual(['R','SR','SSR'].map(r=>cards.filter(c=>c.rarity===r).length),[8,5,3]);
  for(const [index,c] of cards.entries()){
   assert.equal(c.index,index);assert.equal(CARD_BY_ID[c.id],c);assert.ok(c.name&&c.english&&c.title&&c.intro.length>=28);
   const png=readFileSync(new URL('../dist'+(c.art||deck.atlas),import.meta.url));
   if(c.art?.endsWith('.jpg')){assert.equal(png.subarray(0,3).toString('hex'),'ffd8ff');assert.ok(png.length>10000);}else assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   if(deck.atlas){assert.equal(png.readUInt32BE(16),deck.size);assert.equal(png.readUInt32BE(20),deck.size);const [y,h]=deck.rows[Math.floor(index/4)];assert.ok(y>=0&&y+h<=deck.size);if(deck.cells){const [x,cy,w,ch]=deck.cells[index];assert.ok(x>=0&&cy>=0&&x+w<=deck.size&&cy+ch<=deck.size);assert.match(deck.clips[index],/^polygon\(/);const percentages=[...deck.clips[index].matchAll(/([\d.]+)%/g)].map(m=>Number(m[1]));assert.ok(percentages.length>=6&&percentages.length%2===0&&percentages.every(n=>Number.isFinite(n)&&n>=0&&n<=100));}}
  }
 }
});
test('SSR概率20/30/60题为15/20/30%，所有中间题量平滑提升且总和100%',()=>{
 for(const [n,expected] of [[20,{R:60,SR:25,SSR:15}],[30,{R:50,SR:30,SSR:20}],[60,{R:35,SR:35,SSR:30}]])assert.deepEqual(probabilities(n),expected);
 let previous=0;
 for(let n=0;n<=60;n++){const p=probabilities(n);assert.ok(Math.abs(Object.values(p).reduce((a,b)=>a+b,0)-100)<1e-9);assert.ok(p.SSR>=previous);previous=p.SSR;assert.equal('N' in p,false);}
 assert.deepEqual(probabilities(-10),probabilities(20));assert.deepEqual(probabilities(NaN),probabilities(20));assert.deepEqual(probabilities(600),probabilities(60));assert.equal(probabilities(25).SSR,17.5);
});
test('按实际填答题量计算概率，空白不提高概率，答错不扣抽卡机会',()=>{
 const r={...round('r',60),details:Array.from({length:60},(_,i)=>({userAnswer:i<30?'0':'   ',correct:false}))};
 assert.equal(intensity(r),30);const outcome=redeem([r],null,'r','bluey',sequence(.9,0),date);assert.equal(outcome.draw.intensity,30);assert.equal(outcome.card.rarity,'SSR');
 assert.equal(intensity({details:null}),0);assert.equal(redeem([round('empty',0)],null,'empty','pony',sequence(.9,0),date).draw.intensity,0);
});
test('所有128张卡均可抽取，稀有度先随机、同档角色等概率，边界准确',()=>{
 const p=probabilities(20);let lower=0;
 for(const [rarity,weight] of Object.entries(p)){
  for(const deck of Object.keys(DECKS)){
   const pool=CARDS.filter(c=>c.deck===deck&&c.rarity===rarity);
   for(let i=0;i<pool.length;i++)assert.equal(pickCard(deck,20,sequence((lower+weight/2)/100,(i+.5)/pool.length)).id,pool[i].id);
  }
  lower+=weight;
 }
 assert.equal(pickCard('bluey',20,sequence(.599999,0)).rarity,'R');assert.equal(pickCard('bluey',20,sequence(.6,0)).rarity,'SR');assert.equal(pickCard('bluey',20,sequence(.85,0)).rarity,'SSR');
 for(const invalid of [-1,1,NaN,Infinity])assert.throws(()=>pickCard('bluey',20,()=>invalid));assert.throws(()=>pickCard('bogus',20));
});
test('大量种子抽样符合20、30、60题的概率分布',()=>{
 let seed=123456;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(const count of [20,30,60]){
  const totals={R:0,SR:0,SSR:0},runs=40000;
  for(let i=0;i<runs;i++)totals[pickCard('pokemon',count,rng).rarity]++;
  for(const [r,p] of Object.entries(probabilities(count)))assert.ok(Math.abs(totals[r]/runs*100-p)<1,`${count}题 ${r}: ${totals[r]/runs*100}%`);
 }
});
test('每轮只有一次机会，未使用可积攒，重复历史和旧记录不多发',()=>{
 const history=[round('new'),round('old'),round('new'),{...round('legacy'),cardTicket:undefined}];
 assert.deepEqual(pendingTickets(history,empty()).map(r=>r.id),['old','new']);
 const out=redeem(history,null,'old','peppa',sequence(0,0),date);assert.deepEqual(pendingTickets(history,out.collection).map(r=>r.id),['new']);
 assert.throws(()=>redeem(history,out.collection,'old','peppa'),/已经抽过/);assert.throws(()=>redeem(history,null,'legacy','peppa'),/没有可用/);assert.throws(()=>redeem(history,null,'nonexistent','peppa'),/没有可用/);
});
test('刷新后抽卡结果和机会保持不变，重复卡累积数量和首次日期',()=>{
 const owned=CARDS.filter(c=>c.deck==='pony'&&c.rarity==='SSR').map((c,i)=>({roundId:'owned'+i,cardId:c.id,date,intensity:20}));
 const history=[round('two'),round('one')],one=redeem(history,{draws:owned},'one','pony',sequence(.9,0),date);
 const loaded=normalizeCollection(JSON.parse(JSON.stringify(one.collection)));assert.deepEqual(loaded,one.collection);assert.equal(one.isNew,false);assert.equal(one.copies,2);
 const two=redeem(history,loaded,'two','pony',sequence(.9,0),'2026-10-04T04:00:00.000Z');
 assert.equal(two.isNew,false);assert.equal(two.copies,3);assert.deepEqual(inventory(two.collection)[one.card.id],{count:3,firstDate:date});assert.equal(pendingTickets(history,two.collection).length,0);
});
test('存储损坏安全回退，未知卡组、未知卡片、重复开奖和异常日期被过滤',()=>{
 for(const value of [null,undefined,[],{draws:'bad',selectedDeck:'constructor'}])assert.deepEqual(normalizeCollection(value),empty());
 assert.equal(deckId('__proto__'),'bluey');
 const good={roundId:'r',cardId:CARDS[0].id,date,intensity:20};
 const value={selectedDeck:'pokemon',draws:[good,good,{...good,roundId:'a',cardId:'unknown'},{...good,roundId:'b',date:'bad'},{...good,roundId:'c',intensity:-1},{...good,roundId:'d',intensity:61},{...good,roundId:'e',intensity:1.1}]};
 assert.deepEqual(normalizeCollection(value),{version:1,selectedDeck:'pokemon',draws:[good]});assert.throws(()=>redeem([round('a')],null,'a','bluey',sequence(0,0),'bad'),/日期/);
});

test('批量按先后使用积攒机会，每张保留原题量概率且全部一次返回',async()=>{
 const {redeemBatch}=await import('../dist/cards.js');
 const history=[{...round('new'),details:Array.from({length:60},()=>({userAnswer:'1'}))},{...round('old'),details:Array.from({length:20},()=>({userAnswer:'1'}))}];
 const out=redeemBatch(history,null,2,'bluey',()=>.8,date);
 assert.deepEqual(out.outcomes.map(o=>o.draw.roundId),['old','new']);assert.deepEqual(out.outcomes.map(o=>o.draw.intensity),[20,60]);assert.deepEqual(out.outcomes.map(o=>o.card.rarity),['SR','SSR']);
 assert.equal(pendingTickets(history,normalizeCollection(JSON.parse(JSON.stringify(out.collection)))).length,0);
 assert.throws(()=>redeemBatch(history,out.collection,2,'bluey'),/次数不够/);
 for(const n of [0,11,1.5])assert.throws(()=>redeemBatch(history,null,n,'bluey'));
 const source=empty();let calls=0;assert.throws(()=>redeemBatch(history,source,2,'bluey',()=>++calls===3?NaN:.2,date));assert.equal(source.draws.length,0);
});

test('十连抽同档未抽遍前不重复，超出角色数后累计重复卡且不能超额扣次',async()=>{
 const {redeemBatch}=await import('../dist/cards.js');const history=Array.from({length:12},(_,i)=>round('batch'+i));
 const out=redeemBatch(history,null,10,'bluey',()=>0,date);assert.equal(out.collection.draws.length,10);assert.equal(new Set(out.collection.draws.map(d=>d.roundId)).size,10);assert.equal(pendingTickets(history,out.collection).length,2);
 assert.equal(out.outcomes.filter(o=>o.isNew).length,8);assert.equal(new Set(out.outcomes.slice(0,8).map(o=>o.card.id)).size,8);assert.ok(out.outcomes.every(o=>o.card.rarity==='R'));assert.equal(inventory(out.collection)[out.outcomes[0].card.id].count,3);assert.throws(()=>redeemBatch(history,out.collection,3,'bluey'),/次数不够/);assert.equal(out.collection.draws.length,10);
});

test('单抽优先点亮同档新伙伴，跨卡组及刷新后仍按已有收藏选择',()=>{
 for(const deck of Object.keys(DECKS)){
  for(const [rarity,roll] of [['R',.1],['SR',.7],['SSR',.95]]){
   const tier=CARDS.filter(c=>c.deck===deck&&c.rarity===rarity);
   let collection=empty();
   for(let i=0;i<tier.length;i++){
    const id=`${deck}-${rarity}-${i}`,out=redeem([round(id)],collection,id,deck,sequence(roll,0),date);
    assert.equal(out.card.id,tier[i].id);assert.equal(out.isNew,true);
    collection=normalizeCollection(JSON.parse(JSON.stringify(out.collection)));
   }
   const out=redeem([round('repeat')],collection,'repeat',deck,sequence(roll,0),date);
   assert.equal(out.isNew,false);assert.equal(out.card.rarity,rarity);assert.equal(out.copies,2);
  }
 }
 const pony=redeem([round('pony')],null,'pony','pony',sequence(.1,0),date);
 const bluey=redeem([round('bluey')],pony.collection,'bluey','bluey',sequence(.1,0),date);
 assert.equal(bluey.isNew,true);assert.equal(bluey.card.id,CARDS.find(c=>c.deck==='bluey'&&c.rarity==='R').id);
});

test('已集齐及抽到最后一张新卡时，连抽在同档角色用完前仍不重复',()=>{
 for(const [rarity,roll] of [['R',.1],['SR',.7],['SSR',.95]]){
  const tier=CARDS.filter(c=>c.deck==='bluey'&&c.rarity===rarity);
  for(const missing of [0,1]){
   const owned=tier.slice(missing).map((c,i)=>({roundId:'owned'+i,cardId:c.id,date,intensity:20}));
   const history=Array.from({length:tier.length+1},(_,i)=>round('ticket'+i));
   const source={draws:owned},snapshot=JSON.stringify(source);
   const out=redeemBatch(history,source,tier.length+1,'bluey',sequence(...Array(tier.length+1).fill([roll,0]).flat()),date);
   assert.equal(new Set(out.outcomes.slice(0,tier.length).map(o=>o.card.id)).size,tier.length);
   assert.equal(out.outcomes.filter(o=>o.isNew).length,missing);
   assert.ok(out.outcomes.every(o=>o.card.rarity===rarity));
   assert.equal(out.outcomes.at(-1).isNew,false);assert.equal(JSON.stringify(source),snapshot);
  }
 }
});

test('收藏优先及批内避重不改变稀有度概率，同档候选仍等概率',()=>{
 const tier=CARDS.filter(c=>c.deck==='bluey'&&c.rarity==='SR'),ownedCardIds=new Set(tier.slice(0,2).map(c=>c.id));
 const candidates=tier.slice(2);
 for(let i=0;i<candidates.length;i++)assert.equal(pickCard('bluey',20,sequence(.7,(i+.5)/candidates.length),{ownedCardIds}).id,candidates[i].id);
 const full=new Set(tier.map(c=>c.id)),batchCardIds=new Set(tier.slice(0,2).map(c=>c.id));
 for(let i=0;i<candidates.length;i++)assert.equal(pickCard('bluey',20,sequence(.7,(i+.5)/candidates.length),{ownedCardIds:full,batchCardIds}).id,candidates[i].id);
 let seed=54321;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(const count of [20,30,60]){
  const totals={R:0,SR:0,SSR:0},runs=20000;
  const owned=new Set(CARDS.filter(c=>c.deck==='bluey'&&c.index%2===0).map(c=>c.id));
  for(let i=0;i<runs;i++)totals[pickCard('bluey',count,rng,{ownedCardIds:owned,batchCardIds:owned}).rarity]++;
  for(const [r,p] of Object.entries(probabilities(count)))assert.ok(Math.abs(totals[r]/runs*100-p)<1,`${count}题 ${r}: ${totals[r]/runs*100}%`);
 }
});
