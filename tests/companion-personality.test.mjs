import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PETS} from '../dist/companions.js';
import {companionBehavior} from '../dist/companion-personality.js';
import {companionArt} from '../dist/companion-art.js';
import {COMPANION_ART} from '../dist/companion-art-data.js';

test('每一等级的四位伙伴拥有独立说明和动作，渲染的动画名称均有有效定义',()=>{
 const css=readFileSync(new URL('../dist/habitat.css',import.meta.url),'utf8')+readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');
 for(let level=1;level<=4;level++){
  const profiles=Object.keys(PETS).map(id=>companionBehavior(id,level));
  for(const key of ['label','description','idle','greet','happy','celebrate'])assert.equal(new Set(profiles.map(p=>p[key])).size,4,`Lv.${level} ${key}`);
  for(const id of Object.keys(PETS)){
   const p=companionBehavior(id,level),html=companionArt(id,level);
   for(const key of ['idle','greet','happy','celebrate']){assert.ok(css.includes('@keyframes '+p[key]+'{'),p[key]);assert.ok(html.includes(`--${key}-motion:${p[key]};`));}
   const art=COMPANION_ART[id],frame=art.frames[level-1];assert.ok(html.includes(frame.src||art.src));
   if(id!=='fox')assert.ok(!p.description.includes('抱抱尾巴'));
  }
 }
});
test('无效伙伴和阶段安全回退，一级兔子竖耳、熊猫抱竹、猫咪伸展',()=>{
 assert.deepEqual(companionBehavior('unknown',NaN),companionBehavior('fox',1));
 assert.equal(companionBehavior('rabbit',-3).label,'竖耳倾听');
 assert.equal(companionBehavior('panda',1).label,'抱竹尝鲜');
 assert.equal(companionBehavior('cat',1).label,'伸爪懒腰');
 assert.equal(companionBehavior('rabbit',99).label,'花间致意');
});
