import test from 'node:test';
import assert from 'node:assert/strict';
import {appearance,progress,growthFromHistory,roundGrowth,PETS} from '../dist/companions.js';
const record=(id,petId,correct,wrong=0)=>({id,petId,details:[...Array.from({length:correct},()=>({correct:true})),...Array.from({length:wrong},()=>({correct:false}))]});
test('损坏的装扮数据安全回退，六种皮肤和四种伙伴可以保存',()=>{
 for(const invalid of [null,[],{skin:'__proto__',pet:'constructor'},{skin:'broken',pet:99}])assert.deepEqual(appearance(invalid),{skin:'green',pet:'fox'});
 for(const skin of ['green','pink','blue','yellow','purple','red'])for(const pet of Object.keys(PETS))assert.deepEqual(appearance({skin,pet}),{skin,pet});
});
test('四级成长边界正确，满级后继续累计积分',()=>{
 for(const [points,level] of [[0,1],[59,1],[60,2],[179,2],[180,3],[359,3],[360,4],[900,4]]){const p=progress(points);assert.equal(p.level,level);assert.ok(p.percent>=0&&p.percent<=100);}
 assert.deepEqual(progress(360),{points:360,level:4,next:null,remaining:0,percent:100});
 assert.equal(progress(NaN).points,0);assert.equal(progress(-10).points,0);
});
test('只为答对题目积分，每种伙伴独立成长，旧记录归入狐狸',()=>{
 const history=[record('old',undefined,60,4),record('rabbit','rabbit',180),record('panda','panda',359,3),record('cat','cat',360)];
 const growth=growthFromHistory(history);
 assert.deepEqual(Object.values(growth).map(p=>[p.points,p.level]),[[60,2],[180,3],[359,3],[360,4]]);
 assert.deepEqual(growthFromHistory(history),growthFromHistory(history));
 assert.equal(growthFromHistory([...history,...history]).fox.points,60);
});
test('交卷记录带有升级快照，换伙伴不会转移积分，跨级升级和零分安全',()=>{
 const h=[record('1','fox',59)];
 assert.deepEqual(roundGrowth(h,'fox',1),{petId:'fox',earned:1,beforeLevel:1,level:2,points:60,leveledUp:true});
 assert.equal(roundGrowth(h,'rabbit',0).points,0);
 assert.equal(roundGrowth(h,'cat',360).level,4);
 assert.equal(roundGrowth(h,'fox',0).leveledUp,false);
});
