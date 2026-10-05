import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceSwimmer,swimStyle} from '../dist/aquarium-motion.js';
const swimmer=()=>({x:30,y:30,vx:0,vy:0,facing:1,bounds:{minX:10,maxX:90,minY:20,maxY:68},...swimStyle({motion:'dart'})});
test('游动速度平滑转向，在二维区域内活动，觅食速度更快，输入保持不变',()=>{
 const original=swimmer(),before=structuredClone(original);let normal=original,hungry=original;
 for(let n=0;n<60;n++){normal=advanceSwimmer(normal,1/60,{x:80,y:60});hungry=advanceSwimmer(hungry,1/60,{x:80,y:60},2.7);}
 assert.ok(normal.x>30&&normal.y>30);assert.ok(hungry.x>normal.x&&hungry.y>normal.y);assert.deepEqual(original,before);
 const turned=advanceSwimmer(normal,1/60,{x:10,y:20});assert.ok(turned.vx>0,'掉头有缓冲而非瞬移');
 let reverse=turned;for(let n=0;n<120;n++)reverse=advanceSwimmer(reverse,1/60,{x:10,y:20});assert.equal(reverse.facing,-1);
});
test('不同游动风格有速度差异，长帧和边缘目标不会穿出鱼缸或产生 NaN',()=>{
 assert.ok(swimStyle({motion:'dart'}).speed>swimStyle({motion:'float'}).speed);
 let state=swimmer();for(let n=0;n<2000;n++){
  state=advanceSwimmer(state,n%5===0?5:1/60,{x:n%300<150?-100:200,y:n%200<100?-100:200},2.7);
  assert.ok(state.x>=10&&state.x<=90&&state.y>=20&&state.y<=68);
 }
 assert.deepEqual(advanceSwimmer(state,NaN,{x:50,y:40}),state);
});
