import test from 'node:test';
import assert from 'node:assert/strict';
import {generateQuestions,gradeQuestions,isCorrect,formatTime} from '../dist/math.js';
import {validQuestion,loadHistory,loadSession,storage} from '../dist/storage.js';
function random(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function evaluateExpression(source){
 if(source.includes(' 的 ')){const [amount,ratio]=source.split(' 的 ');if(ratio.endsWith('%'))return Number(amount)*Number(ratio.slice(0,-1))/100;const [a,b]=ratio.split('/').map(Number);return Number(amount)*a/b;}
 const normalized=source.replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-');assert.match(normalized,/^[\d\s.+*/()\-]+$/);return Function(`'use strict';return (${normalized})`)();
}
for(let grade=1;grade<=6;grade++)for(const mode of ['mixed','addsub','multiply','missing']){
 if(grade===1&&mode==='multiply')continue;
 test(`年级 ${grade} / ${mode}：60 题不重复、答案正确且等式成立`,()=>{
  for(let seed=1;seed<=25;seed++){
   const qs=generateQuestions({grade,mode,count:60},random(seed));assert.equal(qs.length,60);assert.equal(new Set(qs.map(q=>q.expression)).size,60);
   for(const q of qs){assert.ok(validQuestion(q));assert.ok(q.answer>=0);assert.ok(!q.expression.includes('− -'));
    const [left,right]=q.expression.replace('□',String(q.answer)).split(' = ');assert.ok(Math.abs(evaluateExpression(left)-Number(right))<1e-7,JSON.stringify(q));
    if(grade===1){assert.ok(q.answer<=20);assert.ok(!/[×÷]/.test(q.expression));}
    if(grade===2){assert.ok(q.answer<=100);if(mode!=='multiply')assert.ok(!q.expression.includes('÷'));else if(q.expression.includes('÷')){const [dividend,divisor]=q.expression.split(' = ')[0].split('÷').map(Number);assert.ok(divisor>=1&&divisor<=9);assert.ok(q.answer>=1&&q.answer<=9);assert.equal(dividend%divisor,0);assert.equal(dividend/divisor,q.answer);}if(q.expression.includes('×')){if(mode==='multiply')assert.ok(!/[+−]/.test(q.expression),'二年级乘法专项只练口诀，不混合加减');const factors=q.expression.split(' = ')[0].split(/[+−]/)[0].split('×').map(x=>x.trim()==='□'?q.answer:Number(x));assert.ok(factors.every(x=>x>=1&&x<=9));}}
   }
   if(mode==='mixed')assert.equal(qs.filter(q=>q.kind==='missing').length,18);
   if(mode==='missing')assert.ok(qs.every(q=>q.kind==='missing'));
  }
 });
}
test('20 / 30 / 60 题均可生成，并拒绝不合法的设置',()=>{for(const count of [20,30,60])assert.equal(generateQuestions({count}).length,count);for(const bad of [{grade:0},{grade:7},{count:0},{count:101},{mode:'invalid'},{grade:1,mode:'multiply'}])assert.throws(()=>generateQuestions(bad));});
test('批改区分正确、错答和空白；小数等价；不接受指数、表达式和非数值',()=>{
 assert.equal(isCorrect('1.20',1.2),true);assert.equal(isCorrect('0',0),true);for(const v of ['',' ','1e2','1+2','Infinity','NaN','.','1.','0x10','-1'])assert.equal(isCorrect(v,100),false);
 const qs=[{answer:12},{answer:0},{answer:1.2},{answer:5},{answer:4}];const result=gradeQuestions(qs,['12','0','1.20','8','']);assert.deepEqual({correct:result.correct,wrong:result.wrong,blank:result.blank,accuracy:result.accuracy,stars:result.stars},{correct:3,wrong:1,blank:1,accuracy:60,stars:1});assert.equal(gradeQuestions(qs,['12','0','1.2','5','4']).stars,3);
});
test('计时格式支持超过一小时',()=>{assert.equal(formatTime(0),'00:00');assert.equal(formatTime(61000),'01:01');assert.equal(formatTime(3601000),'60:01');});
test('本地存储读取损坏或异形数据时安全回退，续练统一以暂停状态打开',()=>{
 const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 data.set('math-island-v1:history','broken');assert.deepEqual(loadHistory(),[]);storage.write('history',{bad:true});assert.deepEqual(loadHistory(),[]);
 storage.write('history',[{}]);assert.deepEqual(loadHistory(),[]);storage.write('session',{});assert.equal(loadSession(),null);
 const questions=generateQuestions({count:20});storage.write('session',{questions,answers:questions.map(()=>''),grade:2,name:'测试',elapsed:1000,page:0,paused:false});assert.equal(loadSession().paused,true);
});

test('二年级专项只练乘除口诀，综合和填空仍包含乘加乘减',()=>{const pure=generateQuestions({grade:2,mode:'multiply',count:60},random(23));assert.ok(pure.every(q=>/^\d+ [×÷] \d = □$/.test(q.expression)));assert.equal(pure.filter(q=>q.expression.includes('÷')).length,15);for(const mode of ['mixed','missing']){const qs=generateQuestions({grade:2,mode,count:60},random(23));assert.ok(qs.some(q=>q.expression.includes('×')&&/[+−]/.test(q.expression)),mode+' 应保留乘加乘减');}});

test('二年级口诀整除题占约四分之一，且三个题量均保持分布和准确批改',()=>{for(const count of [20,30,60]){const qs=generateQuestions({grade:2,mode:'multiply',count},random(53));assert.equal(qs.filter(q=>q.expression.includes('÷')).length,Math.round(count*.25));assert.ok(qs.every(q=>!/[+−]/.test(q.expression)));assert.equal(gradeQuestions(qs,qs.map(q=>String(q.answer))).correct,count);}});
