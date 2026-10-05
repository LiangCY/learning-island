import {decorBounds} from './decor.js';
export const SWIM_STYLES={dart:{name:'灵动穿梭',speed:5.2,turn:2.8},glide:{name:'舒展巡游',speed:3.1,turn:1.3},float:{name:'轻盈漂浮',speed:2.2,turn:1.8},bottom:{name:'贴底探索',speed:2.6,turn:2},crawl:{name:'缓慢爬行',speed:.65,turn:1.2}};
export function swimStyle(item){return SWIM_STYLES[item.motion]||SWIM_STYLES.glide;}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function advanceSwimmer(s,dt,target,multiplier=1){
 dt=clamp(Number.isFinite(dt)?dt:0,0,.08);
 const dx=target.x-s.x,dy=target.y-s.y,distance=Math.hypot(dx,dy),speed=Math.min(s.speed*multiplier,distance*2.5),blend=1-Math.exp(-Math.min(dt,.08)*s.turn);
 const vx=s.vx+((distance?dx/distance*speed:0)-s.vx)*blend,vy=s.vy+((distance?dy/distance*speed:0)-s.vy)*blend;
 return {...s,vx,vy,x:clamp(s.x+vx*dt,s.bounds.minX,s.bounds.maxX),y:clamp(s.y+vy*dt,s.bounds.minY,s.bounds.maxY),facing:Math.abs(vx)>.15?(vx>0?1:-1):s.facing};
}
// Animation is transient: saved positions remain the user's decorating anchors.
export function createAquariumMotion(scene,objects,config,onFeedStatus,tank='tank-oak'){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let frame=0,previous=0,elapsed=0,feeding=null,closed=false;
 const swimmers=objects.filter(o=>config.byId[o.itemId].fish).map((o,i)=>{
  const item=config.byId[o.itemId],style=swimStyle(item),el=scene.querySelector(`[data-object="${o.id}"]`);
  return {id:o.id,el,visual:el.querySelector('.object-visual'),x:o.x,y:o.y,vx:(i%2?1:-1)*style.speed,vy:0,facing:i%2?1:-1,bounds:decorBounds('aquarium',item,o.scale,tank),speed:style.speed,turn:style.turn,crawl:item.motion==='crawl',index:i,target:null,next:0};
 });
 function targetFor(s){const b=s.bounds;return {x:b.minX+Math.random()*(b.maxX-b.minX),y:b.minY+Math.random()*(b.maxY-b.minY)};}
 function draw(s){s.el.style.left=s.x+'%';s.el.style.top=s.y+'%';s.visual.style.transform=s.crawl?'none':`scaleX(${s.facing}) rotate(${clamp(s.vy*1.8,-9,9)*s.facing}deg)`;}
 function finishFeed(){if(!feeding)return;const count=feeding.eaten.size;feeding=null;scene.classList.remove('is-feeding');scene.querySelector('.fish-food')?.remove();onFeedStatus(`喂食结束，${count} 位小伙伴吃到了点心。`);}
 function tick(now){
  if(closed)return;const dt=previous?Math.min((now-previous)/1000,.08):.016;previous=now;elapsed+=dt;
  for(let i=0;i<swimmers.length;i++){
   let s=swimmers[i];const food=feeding&&!feeding.eaten.has(s.id)?feeding.targets.get(s.id):null;
   if(!s.target||elapsed>s.next||Math.hypot(s.target.x-s.x,s.target.y-s.y)<2){s.target=targetFor(s);s.next=elapsed+3+Math.random()*7;}
   const target=food||s.target;
   s=advanceSwimmer(s,dt,target,food?2.7:1);swimmers[i]=s;draw(s);
   if(food&&Math.hypot(food.x-s.x,food.y-s.y)<3){
    feeding.eaten.add(s.id);food.pellet.remove();const heart=document.createElement('span');heart.className='fish-delight';heart.textContent='♥';heart.style.left=s.x+'%';heart.style.top=(s.y-4)+'%';scene.append(heart);heart.addEventListener('animationend',()=>heart.remove(),{once:true});
    onFeedStatus(`${feeding.eaten.size} / ${swimmers.length} 位小伙伴吃到啦！`);
   }
  }
  if(feeding&&(elapsed-feeding.started>14||feeding.eaten.size===swimmers.length&&elapsed-feeding.started>3))finishFeed();
  frame=requestAnimationFrame(tick);
 }
 if(!reduced)frame=requestAnimationFrame(tick);
 return {
  isFeeding:()=>!!feeding,
  feed(){
   if(closed||feeding||!swimmers.length)return false;
   const food=document.createElement('div');food.className='fish-food';scene.append(food);scene.classList.add('is-feeding');feeding={started:elapsed,eaten:new Set(),targets:new Map()};
   for(const s of swimmers){
    const x=clamp(s.crawl?s.x+(Math.random()-.5)*12:40+Math.random()*20,s.bounds.minX,s.bounds.maxX),y=clamp(s.crawl?s.y+(Math.random()-.5)*4:30+Math.random()*10,s.bounds.minY,s.bounds.maxY);
    const pellet=document.createElement('i');pellet.style.left=x+'%';pellet.style.setProperty('--food-end',y+'%');food.append(pellet);feeding.targets.set(s.id,{x,y,pellet});
    if(reduced){s.x=x;s.y=y;draw(s);feeding.eaten.add(s.id);}
   }
   onFeedStatus('开饭啦！小伙伴正在游向鱼食…');if(reduced)finishFeed();return true;
  },
  dispose(){closed=true;cancelAnimationFrame(frame);scene.querySelectorAll('.fish-food,.fish-delight').forEach(el=>el.remove());}
 };
}
