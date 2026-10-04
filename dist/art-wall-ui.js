import {FRAMES,FRAME_BY_ID,ART_ROOMS,WALL_SLOTS,ownsFrame} from './art-frames.js';
import {purchaseFrame,hangArtwork,removeWallArtwork} from './coloring.js';
import {framedArtwork,hydrateFramedArt} from './art-wall-art.js';
import {escapeText as esc} from './coloring-art.js';
const sample={id:'frame-sample',boardId:'cat',name:'画框预览',effect:'watercolor',colors:{'area-0':'#fff4d5','area-1':'#ace8d3','area-2':'#ffbf80','area-3':'#ffbf80','area-5':'#ffbf80','area-6':'#ffbf80','area-7':'#ffbad0','area-8':'#ffbad0','area-9':'#ffbf80','area-15':'#ffda48','area-16':'#ffda48','area-17':'#ffda48','area-18':'#ffda48','area-19':'#ffda48','area-22':'g-berry'}};
export function createArtWallUI({app,modal,read,history,wallet,transaction,dialog,render,navigate,visitRoom,toast}){
 let room='lounge',previewId=null;
 const roomName=id=>ART_ROOMS.find(r=>r.id===id).name;
 function wall(state){
  return `<section class="art-wall-section"><div class="art-wall-heading"><div><div class="eyebrow">MADE BY ME, AT HOME</div><h2>把喜欢的画，挂在每天看得见的地方。</h2><p>每个房间有 3 个展示位。画框可以反复使用，换画和撤下都免费。</p></div><button class="secondary" id="visit-art-room">去小屋看看 ↗</button></div><div class="art-room-tabs" aria-label="展示墙房间">${ART_ROOMS.map(r=>`<button data-art-room="${r.id}" class="${room===r.id?'active':''}" aria-pressed="${room===r.id}">${r.name}</button>`).join('')}</div><div class="art-wall-display wall-${room}">${WALL_SLOTS.map(slot=>{
   const placement=state.wall.find(p=>p.room===room&&p.slot===slot.id),work=placement&&state.works.find(w=>w.id===placement.workId);
   return `<article class="art-wall-slot">${work?`<button class="hanging-picture" data-hang-slot="${slot.id}" aria-label="更换${slot.name}作品：${esc(work.name)}">${framedArtwork(work,placement.frameId)}</button><h3>${esc(work.name)}</h3><p>${slot.name} · ${FRAME_BY_ID[placement.frameId].name}</p><div><button class="text-btn" data-hang-slot="${slot.id}">换画 / 换框</button><button class="text-btn" data-unhang="${slot.id}" aria-label="撤下${slot.name}作品">撤下</button></div>`:`<button class="empty-art-slot" data-hang-slot="${slot.id}" aria-label="在${slot.name}挂一幅画"><span>＋</span>挂一幅画</button><h3>${slot.name}展示位</h3><p>等一幅你的得意之作</p>`}</article>`;
  }).join('')}</div><p class="art-wall-footnote">这里的布置会同步到${roomName(room)}。更新已保存的作品，墙上的画也会一起更新。</p><button class="text-btn" data-open-frames>为作品挑一个新画框 →</button></section>`;
 }
 function shop(state){
  const work=state.works.find(w=>w.id===previewId)||state.works[0]||sample;
  return `<section class="frame-shop"><div class="art-wall-heading"><div><div class="eyebrow">A LITTLE FRAME FOR YOUR ART</div><h2>每一幅认真画的画，都值得装裱。</h2><p>原木相框免费赠送 · 其他画框用游戏币购买 · 买一次，所有作品都能用</p></div>${state.works.length?`<label>试装作品<select id="frame-preview-work" aria-label="试装作品">${state.works.map(w=>`<option value="${w.id}" ${w.id===work.id?'selected':''}>${esc(w.name)}</option>`).join('')}</select></label>`:''}</div><div class="frame-shop-grid">${[...FRAMES].sort((a,b)=>Number(ownsFrame(state,a.id))-Number(ownsFrame(state,b.id))||a.price-b.price).map(f=>`<article class="frame-shop-card"><div class="frame-sample">${framedArtwork(work,f.id)}</div><h3>${f.name}</h3><p>${f.description}</p><button class="${ownsFrame(state,f.id)?'secondary':'primary'}" ${ownsFrame(state,f.id)?'data-use-frame':'data-buy-frame'}="${f.id}">${ownsFrame(state,f.id)?f.price?'✓ 已拥有 · 去挂画':'免费赠送 · 去挂画':`✦ ${f.price} 游戏币 · 购买`}</button></article>`).join('')}</div></section>`;
 }
 function openHang(workId,slotId,frameId){
  const state=read();if(!state.works.length){
   dialog('<h2>先收藏一幅自己的画吧</h2><p>涂好颜色，点「保存作品」，就能装框挂到小屋。原木相框已经为你准备好了。</p><div class="dialog-actions"><button class="secondary" id="hang-cancel">稍后再来</button><button class="primary" id="hang-create">去选画板</button></div>');
   document.querySelector('#hang-cancel').onclick=()=>modal.close();document.querySelector('#hang-create').onclick=()=>{modal.close();navigate('shop');};return;
  }
  const slot=slotId||WALL_SLOTS.find(s=>!state.wall.some(p=>p.room===room&&p.slot===s.id))?.id||'left';
  const old=state.wall.find(p=>p.room===room&&p.slot===slot),work=state.works.find(w=>w.id===(workId||old?.workId))||state.works[0],frame=frameId||old?.frameId||'oak';
  dialog(`<h2>给作品找个温暖的位置</h2><form id="hang-form"><div id="hang-preview" class="hang-preview"></div><div class="hang-fields"><label>作品<select name="work" aria-label="要展示的作品">${state.works.map(w=>`<option value="${w.id}" ${w.id===work.id?'selected':''}>${esc(w.name)}</option>`).join('')}</select></label><label>画框<select name="frame" aria-label="展示画框">${FRAMES.filter(f=>ownsFrame(state,f.id)).map(f=>`<option value="${f.id}" ${frame===f.id?'selected':''}>${f.name}${f.price?'':' · 免费'}</option>`).join('')}</select></label><label>房间<select name="room" aria-label="展示房间">${ART_ROOMS.map(r=>`<option value="${r.id}" ${r.id===room?'selected':''}>${r.name}</option>`).join('')}</select></label><label>位置<select name="slot" aria-label="展示位置">${WALL_SLOTS.map(s=>`<option value="${s.id}" ${s.id===slot?'selected':''}>${s.name}</option>`).join('')}</select></label></div><p id="hang-replace-note" role="status"></p><div class="dialog-actions"><button type="button" class="secondary" id="hang-cancel">再看看</button><button type="submit" class="primary">保存上墙</button></div></form>`);
  const form=document.querySelector('#hang-form'),fields=form.elements;
  function preview(){const w=state.works.find(w=>w.id===fields.work.value),target=document.querySelector('#hang-preview');target.innerHTML=framedArtwork(w,fields.frame.value);hydrateFramedArt(target,[w]);const existing=state.wall.find(p=>p.room===fields.room.value&&p.slot===fields.slot.value);document.querySelector('#hang-replace-note').textContent=existing?'会替换这个位置的挂画，原作品仍保留在「我的作品」。':'使用已拥有的画框，上墙不花游戏币。';}
  form.onchange=preview;preview();document.querySelector('#hang-cancel').onclick=()=>modal.close();
  form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('[type="submit"]'),placement={workId:fields.work.value,frameId:fields.frame.value,room:fields.room.value,slot:fields.slot.value};button.disabled=true;try{await transaction(s=>hangArtwork(s,history(),placement));room=placement.room;modal.close();navigate('wall');toast('作品已挂到'+roomName(room)+'！');}catch(err){toast(err.message);button.disabled=false;}};
 }
 function buy(frameId){
  const f=FRAME_BY_ID[frameId],balance=wallet().balance,enough=balance>=f.price;
  dialog(`<div class="hang-preview">${framedArtwork(read().works[0]||sample,frameId)}</div><h2>${f.name}</h2><p>${f.description}。解锁后可以给任意作品使用。</p><div class="purchase-summary"><strong>✦ ${f.price} 游戏币</strong><span>余额 ${balance} 币 · ${enough?'购买后剩 '+(balance-f.price)+' 币':'还差 '+(f.price-balance)+' 币'}</span></div><div class="dialog-actions"><button class="secondary" id="frame-cancel">再看看</button><button class="primary" id="frame-confirm">${enough?'购买画框':'去答题赚币'}</button></div>`);
  hydrateFramedArt(modal,read().works);
  document.querySelector('#frame-cancel').onclick=()=>modal.close();document.querySelector('#frame-confirm').onclick=async e=>{if(!enough){modal.close();navigate('earn');return;}const b=e.currentTarget;b.disabled=true;try{await transaction(s=>purchaseFrame(s,history(),frameId));modal.close();render();toast('画框已收藏，可以给喜欢的作品装框了');}catch(err){toast(err.message);b.disabled=false;}};
 }
 function bind(state){
  app.querySelectorAll('[data-art-room]').forEach(b=>b.onclick=()=>{room=b.dataset.artRoom;render();});
  app.querySelectorAll('[data-hang-work]').forEach(b=>b.onclick=()=>openHang(b.dataset.hangWork));
  app.querySelectorAll('[data-hang-slot]').forEach(b=>b.onclick=()=>openHang(null,b.dataset.hangSlot));
  app.querySelectorAll('[data-use-frame]').forEach(b=>b.onclick=()=>openHang(null,null,b.dataset.useFrame));
  app.querySelectorAll('[data-buy-frame]').forEach(b=>b.onclick=()=>buy(b.dataset.buyFrame));
  app.querySelectorAll('[data-open-frames]').forEach(b=>b.onclick=()=>navigate('frames'));
  app.querySelectorAll('[data-unhang]').forEach(b=>b.onclick=async()=>{b.disabled=true;const currentRoom=room;try{await transaction(s=>removeWallArtwork(s,history(),currentRoom,b.dataset.unhang));render();toast('已撤下，作品仍在收藏里');}catch(err){toast(err.message);b.disabled=false;}});
  app.querySelector('#visit-art-room')?.addEventListener('click',()=>visitRoom(room));
  app.querySelector('#frame-preview-work')?.addEventListener('change',e=>{previewId=e.target.value;render();});
  hydrateFramedArt(app,state.works);
 }
 return {wall,shop,bind,getRoom:()=>room,setRoom:id=>{room=ART_ROOMS.some(r=>r.id===id)?id:'lounge';}};
}
