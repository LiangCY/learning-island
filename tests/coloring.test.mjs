import {composeBoard} from '../dist/coloring-compositions.js';
import {NATURE_JEWELRY_BOARDS} from '../dist/coloring-nature-jewelry.js';
import {refineBoard} from '../dist/coloring-refinements.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {BOARDS,BOARD_BY_ID,RETIRED_BOARDS} from '../dist/coloring-boards.js';
import {SOLID_COLORS,GRADIENTS,PAINTS,EFFECTS,gameRewards,gameEarnings,gameWallet,normalizeGames,normalizeDrawing,purchaseBoard,saveDrawing,saveArtwork,drawingProgress} from '../dist/coloring.js';
import {coloringSVG} from '../dist/coloring-art.js';
const round=(id,answers)=>({id,details:answers.map(userAnswer=>({userAnswer,correct:false}))});
const drawing={boardId:'cat',colors:{'area-0':'g-ocean','area-9':'#ffbf80'},effect:'sparkle'};
const bought=()=>purchaseBoard({},[],'cat');
test('28 张原创卡通画板均含独立封闭色块与不同档位定价',()=>{
 assert.equal(BOARDS.length,28);assert.equal(new Set(BOARDS.map(b=>b.id)).size,28);assert.equal(new Set(BOARDS.map(b=>b.category)).size,5);assert.ok(new Set(BOARDS.map(b=>b.price)).size>=6);
 for(const b of BOARDS){assert.ok(b.regions.length>=12);assert.ok(b.price>0);assert.equal(new Set(b.regions.map(r=>r.id)).size,b.regions.length);for(const r of b.regions){assert.ok(r.name);assert.ok(['path','rect','ellipse'].includes(r.tag));if(r.tag==='path'){assert.match(r.attrs.d,/^M/);assert.match(r.attrs.d,/Z$/);assert.doesNotMatch(r.attrs.d,/NaN|undefined|\(|\)/);}else for(const [k,v] of Object.entries(r.attrs)){if(k==='transform')assert.match(v,/^matrix\([-0-9. ]+\)$/);else assert.ok(Number.isFinite(v));}}}
});
test('72 个不重复纯色、8 种安全渐变与 12 种效果',()=>{
 assert.equal(SOLID_COLORS.length,72);assert.equal(GRADIENTS.length,8);assert.equal(new Set(PAINTS.map(c=>c.id)).size,80);assert.equal(EFFECTS.length,12);assert.equal(EFFECTS[0].id,'original');
 SOLID_COLORS.forEach(c=>assert.match(c.id,/^#[0-9a-f]{6}$/));GRADIENTS.forEach(g=>{assert.ok(g.colors.length>=2);g.colors.forEach(c=>assert.match(c,/^#[0-9a-f]{6}$/));});
});
test('首次 120 币，每个非空填答 2 币，错答也奖励、空白不奖励、重复轮次不重复到账',()=>{
 const h=[round('one',['0',' 2 ','','   ']),round('one',['0','2']),round('two',['wrong','1'])];
 assert.equal(gameEarnings([]),120);assert.equal(gameEarnings(h),128);assert.deepEqual(gameRewards(h),[{id:'one',answered:2,total:4},{id:'two',answered:2,total:4}]);
 assert.equal(gameEarnings([null,{},round('bad',[null,3,undefined])]),120);assert.equal(gameEarnings(null),120);
});
test('购买只扣一次，重载幂等，不能透支，不能购买未知画板',()=>{
 let s=bought();assert.equal(gameWallet(s).balance,100);assert.throws(()=>purchaseBoard(s,[],'cat'),/已经拥有/);
 s=purchaseBoard(s,[],'owl');assert.equal(gameWallet(s).balance,20);assert.throws(()=>purchaseBoard(s,[],'rocket'),/还不够/);
 assert.equal(gameWallet(purchaseBoard(s,[round('new',Array(5).fill('2'))],'rocket'),[round('new',Array(5).fill('2'))]).balance,0);
 assert.throws(()=>purchaseBoard(s,[],'constructor'),/没有找到/);assert.deepEqual(normalizeGames(JSON.parse(JSON.stringify(s))),s);
});
test('异常购买不能制造游戏币，未知、重复和超预算条目被丢弃',()=>{
 const s=normalizeGames({purchases:[{boardId:'cat',paid:-100},{boardId:'cat',paid:0},{boardId:'missing'},{boardId:'owl'},{boardId:'camp'}]});
 assert.deepEqual(s.purchases,[{boardId:'cat',paid:20},{boardId:'owl',paid:80}]);assert.equal(gameWallet(s).balance,20);
});
test('草稿与作品只有已买画板可保存，保存不再扣币',()=>{
 assert.throws(()=>saveDrawing({},[],drawing),/先购买/);assert.throws(()=>saveArtwork({},[],drawing,{id:'one'}),/先购买/);
 const s=saveDrawing(bought(),[],drawing);assert.deepEqual(s.drafts.cat,drawing);assert.equal(gameWallet(s).balance,100);assert.equal(s.works.length,0);
});
test('作品收藏为快照，改草稿不会修改原作；继续编辑按 ID 更新，另存可保留多个版本',()=>{
 const s=saveArtwork(bought(),[],drawing,{id:'one',name:'第一幅',date:'2026-10-04T08:00:00Z'}),edit={...drawing,colors:{'area-0':'#ffbf80'},effect:'pixel'};
 const draft=saveDrawing(s,[],edit);assert.deepEqual(draft.works[0].colors,drawing.colors);
 const updated=saveArtwork(draft,[],edit,{id:'one',name:'改好了'});assert.equal(updated.works.length,1);assert.equal(updated.works[0].effect,'pixel');assert.equal(s.works[0].effect,'sparkle');
 const copy=saveArtwork(updated,[],drawing,{id:'two',name:'另一幅'});assert.equal(copy.works.length,2);assert.equal(gameWallet(copy).balance,100);assert.deepEqual(normalizeGames(JSON.parse(JSON.stringify(copy))),copy);
});
test('读档过滤非法色块、颜色、效果及未解锁作品，拦截 SVG 属性注入',()=>{
 const dirty={boardId:'cat',effect:'url(javascript:alert(1))',colors:{'area-0':'url(https://evil.test/pic)','area-1':'#ffffff','area-900':'#ffbf80','area-9':'g-ocean'}};
 const clean=normalizeDrawing(dirty,'cat');assert.deepEqual(clean.colors,{'area-1':'#ffffff','area-9':'g-ocean'});assert.equal(clean.effect,'original');
 const s=normalizeGames({...bought(),drafts:{cat:dirty,owl:drawing},works:[{...drawing,id:'one',date:'bad'}, {...drawing,id:'one'},{...drawing,id:'x"><script>'},{...drawing,boardId:'owl',id:'two'}]});
 assert.equal(s.works.length,1);assert.equal(s.works[0].date,'');assert.equal(s.drafts.owl,undefined);assert.doesNotMatch(coloringSVG('cat',dirty),/evil\.test|javascript:|area-900/);
});
test('损坏存储及原型字段安全恢复，不读取继承来的颜色',()=>{
 for(const bad of [null,{},[],7,'broken',{purchases:'x',works:'y',drafts:null}])assert.deepEqual(normalizeGames(bad),{version:2,purchases:[],framePurchases:[],drafts:{},works:[],wall:[]});
 assert.equal(normalizeDrawing({},'constructor'),null);assert.deepEqual(normalizeDrawing({colors:Object.create({'area-0':'#ffffff'})},'cat').colors,{});
});
test('空作品不会保存，作品名限长，作品 ID 不可跨画板覆盖',()=>{
 assert.throws(()=>saveArtwork(bought(),[],{boardId:'cat',colors:{}},{id:'one'}),/先给画板/);
 let s=saveArtwork(bought(),[],drawing,{id:'one',name:'  '+ '画'.repeat(60)+'  '});assert.equal(s.works[0].name.length,40);
 s=purchaseBoard(s,[],'bunny');assert.throws(()=>saveArtwork(s,[],{...drawing,boardId:'bunny'},{id:'one'}),/不匹配/);
 assert.throws(()=>saveArtwork(s,[],drawing,{id:'<bad>'}),/编号无效/);
});
test('白色填答算完成，效果不改变原有颜色与完成度',()=>{
 assert.deepEqual(drawingProgress({boardId:'cat',colors:{'area-0':'#ffffff'}}),{count:1,total:23,percent:4});
 const full={boardId:'cat',colors:Object.fromEntries(BOARD_BY_ID.cat.regions.map(r=>[r.id,'#ffffff']))};assert.equal(drawingProgress(full).percent,100);
 for(const e of EFFECTS){const c=normalizeDrawing({...full,effect:e.id},'cat');assert.deepEqual(c.colors,full.colors);assert.equal(drawingProgress(c).percent,100);}
});
test('并排 SVG 各自使用唯一渐变和滤镜 ID，所有引用可解析；每块能用键盘操作',()=>{
 const svgs=BOARDS.map(b=>coloringSVG(b.id,{colors:{'area-0':'g-rainbow'},effect:'pastel'},true));const ids=svgs.flatMap(svg=>[...svg.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));assert.equal(new Set(ids).size,ids.length);
 for(let i=0;i<svgs.length;i++){const svg=svgs[i];assert.equal([...svg.matchAll(/data-region=/g)].length,BOARDS[i].regions.length);assert.equal([...svg.matchAll(/tabindex="0"/g)].length,BOARDS[i].regions.length);for(const m of svg.matchAll(/url\(#([^)]*)\)/g))assert.ok(svg.includes(`id="${m[1]}"`));}
});

test('草稿名称随颜色和效果持久化，名字限长且不会影响作品快照',()=>{
 const original=saveArtwork(bought(),[],drawing,{id:'named',name:'收藏的名字'});
 const state=saveDrawing(original,[],{...drawing,name:'草稿新名字'});
 const reload=normalizeGames(JSON.parse(JSON.stringify(state)));
 assert.equal(reload.drafts.cat.name,'草稿新名字');assert.equal(reload.works[0].name,'收藏的名字');
 assert.equal(normalizeDrawing({...drawing,name:'画'.repeat(50)},'cat').name.length,40);
});

 test('进阶画板可购买、保存新增效果并完整恢复，价格高于基础画板',()=>{
 const history=[round('advanced-budget',Array(20).fill('1'))];
 for(const b of BOARDS.slice(20)){
  assert.ok(b.price>80&&b.price<=145);assert.ok(b.regions.length>=40);
  for(const effect of ['oil','invert','fog']){
   const colors=Object.fromEntries(b.regions.map(r=>[r.id,'g-ocean']));
   const purchased=purchaseBoard({},history,b.id);
   const saved=saveArtwork(purchased,history,{boardId:b.id,colors,effect},{id:'advanced'});
   const restored=normalizeGames(JSON.parse(JSON.stringify(saved)),history);
   assert.deepEqual(restored.works[0].colors,colors);assert.equal(restored.works[0].effect,effect);
   assert.equal(drawingProgress(restored.works[0]).percent,100);
   assert.equal(gameWallet(restored,history).balance,160-b.price);
   const svg=coloringSVG(b.id,restored.works[0],true);
   for(const ref of svg.matchAll(/url\(#([^)]*)\)/g))assert.ok(svg.includes(`id="${ref[1]}"`));
  }
 }
 assert.throws(()=>purchaseBoard({},[],'flower-tiara'),/还不够/);
});

test('替换建筑题材后，旧购买、草稿与作品保留原画板且不影响余额',()=>{
 const history=[round('legacy-budget',Array(250).fill('1'))];
 let state={};
 for(const b of RETIRED_BOARDS){
  assert.ok(!BOARDS.some(current=>current.id===b.id));
  const drawing={boardId:b.id,effect:'oil',colors:Object.fromEntries(b.regions.map(r=>[r.id,'#ffbf80']))};
  state=purchaseBoard(state,history,b.id);state=saveArtwork(state,history,drawing,{id:b.id});
 }
 const reload=normalizeGames(JSON.parse(JSON.stringify(state)),history);
 assert.deepEqual(reload,state);assert.equal(reload.works.length,4);
 assert.equal(gameWallet(reload,history).balance,620-110-115-120-145);
 for(const work of reload.works){assert.equal(drawingProgress(work).percent,100);assert.match(coloringSVG(work.boardId,work),new RegExp(BOARD_BY_ID[work.boardId].name));}
 assert.equal(BOARDS.filter(b=>['valley-falls','sunset-cove','moon-jewels','flower-tiara'].includes(b.id)).length,4);
});

test('精修不改变色块身份和已有配色，不修改原始画板数据',()=>{
 for(const source of NATURE_JEWELRY_BOARDS){
  const before=structuredClone(source),refined=refineBoard(source);
  assert.deepEqual(source,before);
  assert.deepEqual(refined.regions.map(r=>[r.id,r.name]),source.regions.map(r=>[r.id,r.name]));
  const colors=Object.fromEntries(source.regions.map((r,i)=>[r.id,i%2?'#ffbf80':'g-ocean']));
  const drawing=normalizeDrawing({colors,effect:'original'},source.id);
  assert.deepEqual(drawing.colors,colors);assert.equal(drawingProgress(drawing).percent,100);
  const svg=coloringSVG(source.id,drawing,true);assert.equal((svg.match(/data-region=/g)||[]).length,source.regions.length);
  assert.deepEqual(refineBoard(source),refined);
 }
});

test('构图重绘保留色块 ID、数量和已涂进度，所有材质的独立 SVG 引用完整',()=>{
 for(const source of NATURE_JEWELRY_BOARDS){
  const refined=refineBoard(source),before=structuredClone(refined),composed=composeBoard(refined);
  assert.deepEqual(refined,before);
  assert.deepEqual(composed.regions.map(r=>r.id).sort(),refined.regions.map(r=>r.id).sort());
  const colors=Object.fromEntries(refined.regions.map(r=>[r.id,'g-ocean']));
  for(const {id:effect} of EFFECTS){
   const svg=coloringSVG(source.id,{colors,effect},true);
   assert.equal((svg.match(/data-region=/g)||[]).length,refined.regions.length);
   for(const ref of svg.matchAll(/url\(#([^)]*)\)/g))assert.ok(svg.includes(`id="${ref[1]}"`));
  }
  assert.equal(drawingProgress({boardId:source.id,colors}).percent,100);
 }
});
