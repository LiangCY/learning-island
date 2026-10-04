import {FRAME_BY_ID,WALL_SLOTS} from './art-frames.js';
import {coloringSVG,coloringCanvas,escapeText as esc} from './coloring-art.js';
export function framedArtwork(work,frameId='oak'){
 const frame=FRAME_BY_ID[frameId]||FRAME_BY_ID.oak;
 return `<span class="art-frame frame-${frame.id}" role="img" aria-label="${esc(work.name)} · ${frame.name}"><span class="frame-paper">${coloringSVG(work.boardId,work)}${work.effect==='pixel'?`<span class="framed-pixel" data-framed-pixel="${esc(work.id)}"></span>`:''}</span></span>`;
}
export function roomArtwork(state,room,mini=false){
 return state.wall.filter(p=>p.room===room).map(p=>{
  const positions=room==='study'?[23,44,65]:[43,63,83];
  const work=state.works.find(w=>w.id===p.workId),slot=WALL_SLOTS.find(s=>s.id===p.slot);
  return `<${mini?'span':'button'} class="room-artwork" style="left:${positions[WALL_SLOTS.indexOf(slot)]}%" ${mini?'':`data-house-art="${room}" aria-label="调整挂画：${esc(work.name)}"`}>${framedArtwork(work,p.frameId)}</${mini?'span':'button'}>`;
 }).join('');
}
export function hydrateFramedArt(root,works){
 for(const target of root.querySelectorAll('[data-framed-pixel]')){
  const work=works.find(w=>w.id===target.dataset.framedPixel);if(!work)continue;
  coloringCanvas(work.boardId,work,480).then(c=>{if(target.isConnected)target.replaceChildren(c);}).catch(()=>{});
 }
}
