import test from 'node:test';
import assert from 'node:assert/strict';
import {PUZZLE_LEVELS,puzzleLevel,createPuzzle,normalizePuzzleSession,normalizePuzzles,placePuzzlePiece,puzzleComplete,savePuzzle,puzzleEdges,puzzlePiecePath} from '../dist/artwork-puzzle.js';
import {normalizeGames,purchaseBoard,saveArtwork,saveDrawing,deleteArtwork,gameWallet,saveArtworkPuzzle} from '../dist/coloring.js';
import {createGameRegistry,createGamePlatform} from '../dist/game-platform.js';

const artwork={id:'my-cat',boardId:'cat',name:'薄荷小猫',colors:{'area-0':'g-ocean','area-9':'#ffbf80'},effect:'watercolor'};
const session=(level='medium')=>createPuzzle(artwork,level,{id:'puzzle-one',random:()=>.43});
const roundTrip=value=>JSON.parse(JSON.stringify(value));

test('仅提供 4×4、5×5、6×6，旧 3×3 转成新局而不误用原位置或历史统计',()=>{
 assert.deepEqual(PUZZLE_LEVELS.map(level=>level.size),[4,5,6]);
 assert.equal(puzzleLevel('easy').size,6);
 assert.equal(createPuzzle(artwork,'easy',{id:'old-link',random:()=>.3}).order.length,36);
 const old={id:'legacy',artwork:roundTrip(artwork),level:'easy',order:[8,7,6,5,4,3,2,1,0],placed:[0,4,8],moves:5,hints:1,finishedAt:''};
 const record={id:'legacy-done',artworkId:artwork.id,name:artwork.name,level:'easy',moves:10,hints:1,finishedAt:'2026-10-05T12:00:00Z'};
 const migrated=normalizePuzzles({current:old,records:[record]});
 assert.equal(migrated.current.id,'legacy-6x6');assert.equal(migrated.current.level,'expert');assert.equal(migrated.current.order.length,36);assert.deepEqual(migrated.current.placed,[]);assert.equal(migrated.current.moves,0);assert.equal(migrated.current.hints,0);
 assert.deepEqual(migrated.current.artwork,artwork);assert.deepEqual(migrated.records,[record]);assert.deepEqual(normalizePuzzles(roundTrip(migrated)),migrated);assert.deepEqual(normalizePuzzles({current:old,records:[record]}),migrated);
 for(const piece of migrated.current.order)migrated.current=placePuzzlePiece(migrated.current,piece,piece,{now:'2026-10-05T13:00:00Z'}).session;
 const completed=savePuzzle(migrated,migrated.current);assert.equal(completed.records.length,2);assert.equal(completed.records[1].moves,36);
 const unchanged=session('medium');unchanged.placed=[0,15];unchanged.moves=2;assert.deepEqual(normalizePuzzleSession(unchanged),unchanged);
});

test('三档拼图有完整乱序，每局保留独立画作快照',()=>{
 for(const level of PUZZLE_LEVELS){
  const work=roundTrip(artwork),puzzle=createPuzzle(work,level.id,{id:'test-'+level.id,random:()=>.999});
  assert.equal(puzzle.order.length,level.size**2);
  assert.deepEqual([...puzzle.order].sort((a,b)=>a-b),Array.from({length:level.size**2},(_,i)=>i));
  assert.ok(puzzle.order.some((value,index)=>value!==index));
  work.colors['area-0']='#ffffff';work.effect='pixel';assert.deepEqual(puzzle.artwork,artwork);
  assert.deepEqual(normalizePuzzleSession(roundTrip(puzzle)),puzzle);
 }
 assert.throws(()=>createPuzzle({...artwork,colors:{}},'easy',{id:'bad'}),/已保存/);
});

test('放错保持图块未拼，放对只放一次；提示与完成记录持久化且幂等',()=>{
 let current=session();
 const wrong=placePuzzlePiece(current,0,1);assert.equal(wrong.correct,false);assert.equal(wrong.changed,true);assert.deepEqual(wrong.session.placed,[]);assert.equal(wrong.session.moves,1);assert.equal(current.moves,0);
 current=wrong.session;
 for(let piece=0;piece<16;piece++){
  const result=placePuzzlePiece(current,piece,piece,{hint:piece===2,now:'2026-10-05T12:00:00Z'});assert.equal(result.correct,true);current=result.session;
  const duplicate=placePuzzlePiece(current,piece,piece);assert.equal(duplicate.changed,false);assert.deepEqual(duplicate.session,current);
 }
 assert.equal(puzzleComplete(current),true);assert.equal(current.moves,17);assert.equal(current.hints,1);assert.equal(current.finishedAt,'2026-10-05T12:00:00Z');
 let state=savePuzzle({},current);state=savePuzzle(roundTrip(state),current);assert.equal(state.records.length,1);assert.equal(state.records[0].moves,17);
 state=savePuzzle(state,createPuzzle(artwork,'hard',{id:'puzzle-two',random:()=>.4}));assert.equal(state.records.length,1);assert.equal(state.current.placed.length,0);
});

test('全部难度都能正常完成，非法图块和位置不能增加进度',()=>{
 for(const level of PUZZLE_LEVELS){
  let current=session(level.id);
  for(const [piece,slot] of [[-1,0],[0,-1],[36,0],[0,36],[.5,0],['0',0]]){const result=placePuzzlePiece(current,piece,slot);assert.equal(result.changed,false);assert.equal(result.session.moves,0);}
  for(const piece of current.order)current=placePuzzlePiece(current,piece,piece).session;
  assert.equal(current.moves,level.size**2);assert.ok(current.finishedAt);assert.ok(puzzleComplete(current));
 }
});

test('读档修复重复和越界进度，过滤无效会话与记录',()=>{
 const restored=normalizePuzzleSession({...session(),placed:[0,0,3,40,-1,'2',1.5],order:[0],moves:-8,hints:20,finishedAt:'2026-10-05T12:00:00Z'});
 assert.deepEqual(restored.placed,[0,3]);assert.equal(restored.moves,2);assert.equal(restored.hints,2);assert.equal(restored.order.length,16);assert.equal(restored.finishedAt,'');
 for(const bad of [null,{},[],{...session(),id:'<script>'},{...session(),level:'unknown'},{...session(),artwork:{}}])assert.equal(normalizePuzzleSession(bad),null);
 const record={id:'done',artworkId:'my-cat',level:'easy',finishedAt:'2026-10-05T12:00:00Z'};
 const state=normalizePuzzles({current:null,records:[null,record,record,{...record,id:'bad',level:'bad'},{...record,id:'wrong-date',finishedAt:'invalid'}]});
 assert.equal(state.records.length,1);assert.equal(state.records[0].moves,9);assert.equal(state.records[0].hints,0);
 assert.equal(normalizePuzzles({records:Array.from({length:70},(_,i)=>({...record,id:'record-'+i}))}).records.length,60);
});

test('凹凸接口在相邻图块上互补，外边缘平直，SVG 路径稳定',()=>{
 for(const level of PUZZLE_LEVELS){
  const current=session(level.id),size=level.size;
  for(let piece=0;piece<size**2;piece++){
   const edges=puzzleEdges(current,piece),row=Math.floor(piece/size),col=piece%size;
   if(!row)assert.equal(edges[0],0);if(!col)assert.equal(edges[3],0);if(row===size-1)assert.equal(edges[2],0);if(col===size-1)assert.equal(edges[1],0);
   if(col<size-1)assert.equal(edges[1],-puzzleEdges(current,piece+1)[3]);if(row<size-1)assert.equal(edges[2],-puzzleEdges(current,piece+size)[0]);
   const path=puzzlePiecePath(edges);assert.match(path,/^M0 0.*Z$/);assert.doesNotMatch(path,/NaN|undefined/);assert.equal(path,puzzlePiecePath(puzzleEdges(roundTrip(current),piece)));
  }
 }
});

test('作品更新或删除后仍能继续原拼图，涂色存档和余额不受影响',()=>{
 let state=saveArtwork(purchaseBoard({},[],'cat'),[],artwork,{id:artwork.id,name:artwork.name});
 state=saveArtworkPuzzle(state,[],createPuzzle(state.works[0],'medium',{id:'snapshot-test',random:()=>.7}));
 const oldSnapshot=roundTrip(state.puzzles.current.artwork),balance=gameWallet(state).balance;
 state=saveDrawing(state,[],{...artwork,colors:{'area-0':'#ffffff'},effect:'pixel'});
 state=saveArtwork(state,[],state.drafts.cat,{id:artwork.id,name:'修改后的画'});
 assert.deepEqual(state.puzzles.current.artwork,oldSnapshot);
 state=deleteArtwork(state,[],artwork.id);assert.equal(state.works.length,0);assert.deepEqual(state.puzzles.current.artwork,oldSnapshot);
 state=saveArtworkPuzzle(roundTrip(state),[],placePuzzlePiece(state.puzzles.current,0,0).session);
 assert.deepEqual(state.puzzles.current.placed,[0]);assert.deepEqual(state.puzzles.current.artwork,oldSnapshot);assert.equal(gameWallet(state).balance,balance);assert.equal(state.drafts.cat.effect,'pixel');
 assert.deepEqual(normalizeGames(roundTrip(state)),state);
 const bad={...session(),artwork:{...artwork,colors:{'area-0':'url(javascript:bad)','bad':'#ffffff'}}};
 assert.throws(()=>saveArtworkPuzzle(state,[],bad),/作品无效/);
 assert.equal(normalizeGames({...state,puzzles:{current:bad}}).puzzles.current,null);
});

test('拼图事务只更新涂色模块，不扣共享游戏币或覆盖其他游戏',async()=>{
 const coloring={id:'coloring',name:'画室',legacy:true,normalize:normalizeGames,createUI:()=>{},purchases:state=>state.purchases.map(p=>({id:'board-'+p.boardId,itemId:p.boardId,paid:p.paid}))};
 const other={id:'another',name:'另一个游戏',normalize:value=>({...value}),createUI:()=>{}};
 const registry=createGameRegistry([coloring,other]);
 let stored={version:3,wallet:{purchases:[]},modules:{another:{score:23},coloring:{}}},fail=false;
 const storage={read:()=>roundTrip(stored),write:(_,next)=>{if(fail)return false;stored=roundTrip(next);return true;}};
 const platform=createGamePlatform({storage,history:()=>[],registry,locks:null}),game=platform.forGame('coloring');
 await game.update(state=>saveArtwork(purchaseBoard(state,[],'cat'),[],artwork,{id:artwork.id}));
 const balance=platform.wallet().balance,original=roundTrip(stored);
 fail=true;await assert.rejects(game.update(state=>saveArtworkPuzzle(state,[],session())),/保存失败/);assert.deepEqual(stored,original);
 fail=false;await game.update(state=>saveArtworkPuzzle(state,[],session()));
 await Promise.all([game.update(state=>saveArtworkPuzzle(state,[],placePuzzlePiece(state.puzzles.current,1,1).session)),game.update(state=>saveArtworkPuzzle(state,[],placePuzzlePiece(state.puzzles.current,2,2).session))]);
 assert.deepEqual(game.read().puzzles.current.placed,[1,2]);assert.equal(platform.wallet().balance,balance);assert.deepEqual(stored.modules.another,{score:23});
});
