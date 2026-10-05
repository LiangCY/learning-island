import {tankModel} from './decor-catalog.js';
import {decorObjectWidth} from './decor.js';
import {PLAYGROUND_ART} from './playground-art-data.js';
export const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function tankStyle(id){
 const t=tankModel(id),ratio=t.width/t.height,preview=Math.min(t.display,ratio/1.5*100);
 return `--tank-width:${t.display}%;--tank-preview-width:${preview}%;--tank-ratio:${ratio};--tank-frame:${t.frame};--tank-edge:${t.edge};--tank-radius:${t.radius};--tank-thumb-width:${Math.min(145,t.width*1.6,96*ratio)}px`;
}
export function decorArt(kind,item){
 if(item.slot==='tank')return `<span class="equipment-art miniature-tank ${item.id}" style="${tankStyle(item.id)}"><span></span><i>◌</i></span>`;
 if(item.slot==='light')return `<span class="equipment-art miniature-light ${item.id}"><span></span><i></i></span>`;
 const [x,y,w,h,W,H]=PLAYGROUND_ART[item.atlas||kind][item.index];
 return `<span class="decor-sprite" style="aspect-ratio:${w}/${h}"><img draggable="false" alt="" src="/assets/playgrounds/${item.atlas||kind}-atlas.png" style="width:${W/w*100}%;height:${H/h*100}%;left:${-x/w*100}%;top:${-y/h*100}%"></span>`;
}
export function decorSceneObjects(kind,state,selected,editing,preview=false){
 return state.objects.map((object,index)=>{
  const item=kind.byId[object.itemId];
  const tag=preview?'span':'button';
  return `<${tag} class="decor-object ${item.fish?'swimming-fish':''} ${item.category==='水草'?'water-plant':''} ${selected===object.id?'selected':''}" ${preview?'aria-hidden="true"':`data-object="${object.id}" aria-label="${editing?'移动':'查看'}${item.name}" aria-pressed="${selected===object.id}"`} style="left:${object.x}%;top:${object.y}%;width:${decorObjectWidth(kind.id,item,object.scale,state.tank)}%;z-index:${item.layer||Math.round(object.y)};--flip:${object.flip?-1:1};--delay:${-index*2.7}s"><span class="object-visual">${decorArt(kind.id,item)}</span><span class="object-selection" aria-hidden="true"></span></${tag}>`;
 }).join('');
}
