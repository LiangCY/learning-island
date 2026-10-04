import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeGames,purchaseBoard,purchaseFrame,saveArtwork,saveDrawing,gameWallet,hangArtwork,removeWallArtwork,deleteArtwork} from '../dist/coloring.js';
import {FRAMES,ownsFrame} from '../dist/art-frames.js';
import {coloringSVG} from '../dist/coloring-art.js';
import {roomArtwork,framedArtwork} from '../dist/art-wall-art.js';
const painting={boardId:'cat',colors:{'area-0':'g-ocean','area-9':'#ff0000'},effect:'crayon'};
const saved=()=>saveArtwork(purchaseBoard({},[],'cat'),[],painting,{id:'one',name:'我的画'});
const placement={room:'lounge',slot:'left',workId:'one',frameId:'oak'};
test('旧版存档原样保留画板、草稿、作品和余额，赠送免费画框',()=>{
 const old={...saved(),version:1};delete old.framePurchases;delete old.wall;
 const migrated=normalizeGames(old);assert.deepEqual(migrated.works,old.works);assert.deepEqual(migrated.drafts,old.drafts);assert.equal(gameWallet(migrated).balance,100);assert.ok(ownsFrame(migrated,'oak'));assert.deepEqual(migrated.wall,[]);
});
test('画框与画板共用游戏币，不能重复购买或透支，画框可无限复用',()=>{
 let state=purchaseFrame(saved(),[],'gold');assert.equal(gameWallet(state).balance,20);
 assert.throws(()=>purchaseFrame(state,[],'gold'),/已经拥有/);assert.throws(()=>purchaseFrame(state,[],'oak'),/已经拥有/);assert.throws(()=>purchaseFrame(state,[],'cream'),/还不够/);assert.throws(()=>purchaseBoard(state,[],'owl'),/还不够/);assert.throws(()=>purchaseFrame(state,[],'constructor'),/没有找到/);
 state=hangArtwork(state,[],{...placement,frameId:'gold'});state=hangArtwork(state,[],{...placement,slot:'right',frameId:'gold'});assert.equal(state.wall.length,2);assert.equal(gameWallet(state).balance,20);assert.deepEqual(normalizeGames(JSON.parse(JSON.stringify(state))),state);
});
test('替换展示位不消耗作品，撤下不丢失画框或作品，房间互不影响',()=>{
 let s=hangArtwork(saved(),[],placement);s=hangArtwork(s,[],{...placement,room:'study'});
 s=saveArtwork(s,[],{...painting,effect:'oil'},{id:'two'});s=hangArtwork(s,[],{...placement,workId:'two'});
 assert.equal(s.wall.length,2);assert.equal(s.works.length,2);assert.equal(s.wall.find(p=>p.room==='lounge').workId,'two');
 s=removeWallArtwork(s,[],'lounge','left');assert.equal(s.wall.length,1);assert.equal(s.wall[0].room,'study');assert.equal(s.works.length,2);assert.equal(gameWallet(s).balance,100);
});
test('草稿不改变墙上作品，更新作品立即同步；删除清除所有房间关联',()=>{
 let s=hangArtwork(saved(),[],placement);s=hangArtwork(s,[],{...placement,room:'bedroom'});
 s=saveDrawing(s,[],{...painting,effect:'watercolor'});assert.equal(s.works[0].effect,'crayon');
 s=saveArtwork(s,[],{...painting,effect:'pencil'},{id:'one'});assert.match(roomArtwork(s,'lounge'),/material-pencil/);
 s=deleteArtwork(s,[],'one');assert.equal(s.wall.length,0);assert.equal(s.works.length,0);assert.ok(s.drafts.cat);assert.equal(s.purchases.length,1);
});
test('未知位置、未拥有画框、未保存作品不可上墙，坏存档不会创建挂画或游戏币',()=>{
 const s=saved();for(const patch of [{room:'constructor'},{slot:'roof'},{frameId:'gold'},{workId:'missing'}])assert.throws(()=>hangArtwork(s,[],{...placement,...patch}));
 const dirty={...s,framePurchases:[{frameId:'gold',paid:-100},{frameId:'gold'},{frameId:'night'},{frameId:'bad'}],wall:[placement,placement,{...placement,slot:'right',frameId:'night'},{...placement,slot:'center',workId:'missing'}]};
 const normalized=normalizeGames(dirty);assert.deepEqual(normalized.framePurchases,[{frameId:'gold',paid:80}]);assert.deepEqual(normalized.wall,[placement]);assert.equal(gameWallet(normalized).balance,20);
});
test('四种材质保留所有色块交互，SVG 引用可独立导出',()=>{
 for(const effect of ['crayon','watercolor','oil','pencil']){
  const svg=coloringSVG('cat',{...painting,effect},true);assert.match(svg,new RegExp('material-'+effect));assert.equal((svg.match(/data-region=/g)||[]).length,23);
  for(const m of svg.matchAll(/url\(#([^)]*)\)/g))assert.ok(svg.includes(`id="${m[1]}"`));
  if(effect==='crayon'){assert.match(svg,/<mask[^>]*material-mask/);assert.match(svg,/pointer-events="none" aria-hidden="true" mask=/);}
  else{
   // Only painted regions get paper/pigment fills; blank foreground areas stay opaque.
   assert.match(svg,/<pattern id="[^"]+-region-0"/);assert.match(svg,/<pattern id="[^"]+-region-9"/);assert.doesNotMatch(svg,/<pattern id="[^"]+-region-1"/);
   for(const m of svg.matchAll(/href="#([^"]+)"/g))assert.ok(svg.includes(`id="${m[1]}"`));
  }
 }
 for(const f of FRAMES)assert.match(framedArtwork({...painting,name:'<script>',id:'one'},f.id),/&lt;script&gt;/);
});

test('花园不再支持挂画，旧花园布置移除但作品和画框保留',()=>{
 const state=purchaseFrame(saved(),[],'cream');
 const old={...state,wall:[placement,{...placement,room:'garden',frameId:'cream'}]};
 const clean=normalizeGames(old);
 assert.deepEqual(clean.wall,[placement]);assert.deepEqual(clean.works,state.works);assert.deepEqual(clean.framePurchases,state.framePurchases);assert.equal(gameWallet(clean).balance,70);
 assert.throws(()=>hangArtwork(state,[],{...placement,room:'garden'}),/有效的房间/);
});
