export const GRADES=['一','二','三','四','五','六'];
export const MODES={mixed:'综合探险',addsub:'加减训练',multiply:'乘除训练',missing:'填空挑战',review:'错题再探险'};
export const CONFIG={
  1:{topics:['20 以内加减法','认识加法与减法','简单的数字填空'],samples:['8 + 7 = □','16 − 9 = □','□ + 6 = 14']},
  2:{topics:['100 以内两位数加减','1–9 的乘法口诀','乘加乘减 · 填空挑战'],samples:['7 × 8 + 4 = □','60 − 43 = □','□ × 5 − 3 = 42']},
  3:{topics:['三位数加减法','两位数乘一位数 · 整除','四则运算 · 数字填空'],samples:['240 + 180 = □','24 × 3 = □','□ ÷ 8 = 7']},
  4:{topics:['较大整数加减法','两位数乘法与整除','运算顺序与括号'],samples:['1200 − 450 = □','12 × 15 = □','(24 + 16) ÷ 8 = □']},
  5:{topics:['两位小数加减法','小数乘整数 · 整除','小数综合与填空'],samples:['3.75 + 2.5 = □','1.2 × 4 = □','□ − 0.8 = 2.6']},
  6:{topics:['小数四则运算','分数与百分数求值','综合运算与填空'],samples:['4.8 ÷ 0.6 = □','80 的 25% = □','36 的 2/3 = □']}
};
const round=n=>Math.round(n*100)/100;
const fmt=n=>String(round(n));
function int(min,max,rng){return Math.floor(rng()*(max-min+1))+min;}
function pick(list,rng){return list[int(0,list.length-1,rng)];}
function addsub(grade,missing,rng){
  let a,b;
  if(grade===1){a=int(2,20,rng);b=int(1,a-1,rng);}
  else if(grade===2){a=int(20,99,rng);b=int(1,a-1,rng);}
  else if(grade===3){a=int(10,99,rng)*10;b=int(1,a/10-1,rng)*10;}
  else if(grade===4){a=int(20,99,rng)*100;b=int(1,a/50-1,rng)*50;}
  else {a=int(100,999,rng)/100;b=int(1,Math.floor(a*100)-1,rng)/100;}
  const plus=rng()<.5,c=round(a-b),topic=grade>=5?'小数加减':'加减法';
  const left=plus?c:a,right=b,result=plus?a:c,op=plus?'+':'−';
  if(!missing)return {expression:`${fmt(left)} ${op} ${fmt(right)} = □`,answer:result,topic,kind:'compute',explanation:`${fmt(left)} ${op} ${fmt(right)} = ${fmt(result)}`};
  const hole=rng()<.5?0:1,answer=hole===0?left:right;
  const inverse=plus?`${fmt(result)} − ${fmt(hole===0?right:left)} = ${fmt(answer)}`:hole===0?`${fmt(result)} + ${fmt(right)} = ${fmt(answer)}`:`${fmt(left)} − ${fmt(result)} = ${fmt(answer)}`;
  return {expression:`${hole===0?'□':fmt(left)} ${op} ${hole===1?'□':fmt(right)} = ${fmt(result)}`,answer,topic,kind:'missing',explanation:`用${plus?'减法':'加减法'}找回数字：${inverse}`};
}
function multiply(grade,missing,rng,pureTable=false,tableDivision=false){
  const topic=grade===2?(tableDivision?'口诀除法':'乘法口诀'):grade>=5?'小数乘除':'乘除法';
  let a,b;
  if(grade===2){a=int(1,9,rng);b=int(1,9,rng);}
  else if(grade===3){a=int(2,30,rng);b=int(2,9,rng);}
  else if(grade===4){a=int(2,20,rng);b=int(2,20,rng);}
  else{a=int(1,99,rng)/10;b=int(2,9,rng);}
  const product=round(a*b),division=grade===2?pureTable&&tableDivision:grade>=3&&rng()<.35;
  if(division){
    const divisor=grade===6&&rng()<.5?round(b/10):b,dividend=grade===6&&divisor!==b?round(product/10):product;
    if(missing)return {expression:`□ ÷ ${fmt(divisor)} = ${fmt(a)}`,answer:dividend,topic,kind:'missing',explanation:`用乘法找回被除数：${fmt(a)} × ${fmt(divisor)} = ${fmt(dividend)}`};
    return {expression:`${fmt(dividend)} ÷ ${fmt(divisor)} = □`,answer:a,topic,kind:'compute',explanation:`想乘法：${fmt(divisor)} × ${fmt(a)} = ${fmt(dividend)}`};
  }
  const adjust=!(grade===2&&pureTable)&&rng()<.65&&product>=1?int(1,Math.min(10,Math.floor(product)),rng):0,sign=rng()<.5?1:-1,result=round(product+sign*adjust);
  const tail=adjust?` ${sign===1?'+':'−'} ${adjust}`:'',unadjust=adjust?`${fmt(result)} ${sign===1?'−':'+'} ${adjust} = ${fmt(product)}；`:'',reason=adjust?`先算乘法：${fmt(a)} × ${fmt(b)} = ${fmt(product)}，再${sign===1?'加':'减'} ${adjust}`:`${fmt(a)} × ${fmt(b)} = ${fmt(product)}`;
  if(missing){const hole=rng()<.5?0:1;return {expression:`${hole===0?'□':fmt(a)} × ${hole===1?'□':fmt(b)}${tail} = ${fmt(result)}`,answer:hole===0?a:b,topic:adjust?'乘加乘减填空':topic,kind:'missing',explanation:`先找乘积：${unadjust}${fmt(product)} ÷ ${fmt(hole===0?b:a)} = ${fmt(hole===0?a:b)}`};}
  return {expression:`${fmt(a)} × ${fmt(b)}${tail} = □`,answer:result,topic:adjust?'乘加乘减':topic,kind:'compute',explanation:reason};
}
function special(grade,rng){
  if(grade===4){const d=int(2,9,rng),a=int(1,10,rng)*d,b=int(1,10,rng)*d;return {expression:`(${a} + ${b}) ÷ ${d} = □`,answer:(a+b)/d,topic:'括号与顺序',kind:'compute',explanation:`先算括号：${a} + ${b} = ${a+b}，再除以 ${d}`};}
  if(grade===6){const denominator=pick([2,3,4,5,8,10],rng),n=int(1,15,rng)*denominator,k=int(1,denominator-1,rng),percent=rng()<.5&&100%denominator===0;return {expression:`${n} 的 ${percent?`${k*100/denominator}%`:`${k}/${denominator}`} = □`,answer:n*k/denominator,topic:percent?'百分数':'分数求值',kind:'compute',explanation:`先把 ${n} 分成 ${denominator} 份，再取 ${k} 份：${n} ÷ ${denominator} × ${k} = ${n*k/denominator}`};}
  return multiply(grade,false,rng);
}
export function generateQuestions({grade=2,mode='mixed',count=60}={},rng=Math.random){
  if(!Number.isInteger(grade)||grade<1||grade>6||!['mixed','addsub','multiply','missing'].includes(mode)||!Number.isInteger(count)||count<1||count>100)throw new Error('练习设置不正确');
  if(grade===1&&mode==='multiply')throw new Error('一年级请先练习加减法');
  const questions=[],seen=new Set();
  for(let i=0;i<count;i++){
    let q,attempt=0;
    do{const missing=mode==='missing'||mode==='mixed'&&i%10>=7;
      if(mode==='addsub'||grade===1)q=addsub(grade,missing,rng);
      else if(mode==='multiply'){const divisionCount=grade===2?Math.round(count*.25):0;const tableDivision=Math.floor((i+1)*divisionCount/count)>Math.floor(i*divisionCount/count);q=multiply(grade,false,rng,true,tableDivision);}
      else if(!missing&&mode==='mixed'&&[4,6].includes(grade)&&i%10===6)q=special(grade,rng);
      else q=(i%2===0?addsub:multiply)(grade,missing,rng);
      if(++attempt>1000)throw new Error('题目生成失败，请重新开始');
    }while(seen.has(q.expression)||q.answer<0);
    seen.add(q.expression);questions.push({...q,id:`q-${i+1}`});
  }
  return questions;
}
export function isCorrect(value,answer){return typeof value==='string'&&/^\d+(\.\d+)?$/.test(value.trim())&&Number.isFinite(answer)&&Math.abs(Number(value.trim())-answer)<1e-7;}
export function gradeQuestions(questions,answers){
  const details=questions.map((q,i)=>({...q,userAnswer:typeof answers[i]==='string'?answers[i]:'',correct:isCorrect(answers[i],q.answer)}));
  const correct=details.filter(q=>q.correct).length,blank=details.filter(q=>!q.userAnswer.trim()).length;
  return {details,total:details.length,correct,wrong:details.length-correct-blank,blank,accuracy:Math.round(correct/details.length*100),stars:correct===details.length?3:correct/details.length>=.8?2:1};
}
export function formatTime(ms){const seconds=Math.floor(Math.max(0,ms)/1000);return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
