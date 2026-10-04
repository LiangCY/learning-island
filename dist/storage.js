import {layoutId,pageSize} from './practice-layout.js';
const PREFIX='math-island-v1:';
let reported=false;
export const storage={
 read(key,fallback){try{const raw=localStorage.getItem(PREFIX+key);return raw===null?fallback:JSON.parse(raw);}catch{return fallback;}},
 write(key,value){try{localStorage.setItem(PREFIX+key,JSON.stringify(value));return true;}catch{if(!reported){reported=true;window.dispatchEvent(new CustomEvent('storage-failed'));}return false;}},
 remove(key){try{localStorage.removeItem(PREFIX+key);}catch{window.dispatchEvent(new CustomEvent('storage-failed'));}}
};
export function validQuestion(q){return q&&typeof q.expression==='string'&&q.expression.length<180&&q.expression.split('□').length===2&&Number.isFinite(q.answer)&&q.answer>=0&&typeof q.explanation==='string';}
export function loadHistory(){const value=storage.read('history',[]);return Array.isArray(value)?value.filter(r=>r&&typeof r.id==='string'&&[1,2,3,4,5,6].includes(r.grade)&&Array.isArray(r.details)&&r.details.length&&r.details.every(validQuestion)&&Number.isFinite(r.elapsed)&&typeof r.name==='string'&&typeof r.date==='string'&&Number.isFinite(r.accuracy)&&Number.isFinite(r.correct)&&Number.isFinite(r.total)&&Number.isFinite(r.stars)&&Number.isFinite(r.blank)&&Number.isFinite(r.wrong)&&r.details.every(q=>typeof q.userAnswer==='string'&&typeof q.correct==='boolean')):[];}
export function loadSession(){const s=storage.read('session',null);if(!s||!Array.isArray(s.questions)||!s.questions.length||!s.questions.every(validQuestion)||!Array.isArray(s.answers)||s.answers.length!==s.questions.length||!s.answers.every(a=>typeof a==='string')||![1,2,3,4,5,6].includes(s.grade)||typeof s.name!=='string'||!Number.isFinite(s.elapsed)||!Number.isInteger(s.page)||s.page<0||s.page>=Math.ceil(s.questions.length/pageSize(s.layout)))return null;return {...s,layout:layoutId(s.layout),paused:true};}
