import test from 'node:test';
import assert from 'node:assert/strict';
import {LAYOUTS,pageSize,layoutId,switchLayout} from '../dist/practice-layout.js';
import {loadSession,storage} from '../dist/storage.js';
import {generateQuestions} from '../dist/math.js';
const questions=generateQuestions({grade:2,mode:'multiply',count:60});
const session={id:'test',questions,answers:questions.map(()=>''),grade:2,name:'测试',elapsed:1000,page:0,paused:false};
test('练习方式安全回退，单题与分站页大小独立于数学题型',()=>{assert.equal(pageSize('single'),1);for(const bad of [undefined,null,'wrong','constructor']){assert.equal(layoutId(bad),'sheet');assert.equal(pageSize(bad),10);}});
test('切换方式保持当前题目、所有答案和计时，跨越10题边界不丢进度',()=>{
 const original={...session,layout:'sheet',page:2,answers:questions.map((_,i)=>i<24?String(i):'')};
 const single=switchLayout(original,'single',23);assert.equal(single.page,23);assert.equal(single.answers,original.answers);assert.equal(single.elapsed,1000);assert.equal(original.page,2);
 const sheet=switchLayout(single,'sheet',23);assert.equal(sheet.page,2);assert.equal(sheet.answers,single.answers);
 assert.equal(switchLayout(original,'single',1).page,20);assert.equal(switchLayout({...session,layout:'single',page:59},'sheet',59).page,5);
});
test('单题最后一题刷新可续练，旧分站记录兼容，超界页面被拒绝',()=>{
 const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 storage.write('session',{...session,layout:'single',page:59,answers:questions.map((_,i)=>i===59?'81':'')});const restored=loadSession();assert.equal(restored.page,59);assert.equal(restored.layout,'single');assert.equal(restored.answers[59],'81');assert.equal(restored.paused,true);
 storage.write('session',{...session,page:5});assert.equal(loadSession().layout,'sheet');assert.equal(loadSession().page,5);
 for(const [layout,page] of [['sheet',6],['single',60],['single',-1],['single',1.5]]){storage.write('session',{...session,layout,page});assert.equal(loadSession(),null);}
});
test('移除游戏入口，旧游戏末题仍能以单题模式续练并保留答案与用时',()=>{
 assert.deepEqual(Object.keys(LAYOUTS),['sheet','single']);
 const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 for(const layout of ['mole','space']){
  const answers=questions.map((_,i)=>i===59?'81':'');
  storage.write('session',{...session,layout,page:59,answers});
  const restored=loadSession();assert.equal(restored.layout,'single');assert.equal(restored.page,59);assert.deepEqual(restored.answers,answers);assert.equal(restored.elapsed,1000);assert.equal(restored.paused,true);
  assert.equal(switchLayout(restored,'sheet',59).page,5);
 }
});
