import {companionBehavior} from './companion-personality.js';
import {PETS,petId} from './companions.js';
import {COMPANION_ART} from './companion-art-data.js';
import {ITEM_BY_ID} from './habitat.js';
import {itemArt} from './habitat-art.js';
import {wearableStyle} from './companion-wear.js';

export function companionArt(id,level,equipment={},extra=''){
 id=petId(id);level=Math.max(1,Math.min(4,Math.floor(level)||1));
 const motion=companionBehavior(id,level),pet=PETS[id],art=COMPANION_ART[id],frame=art.frames[level-1],[x,y,w,h,W,H]=frame.window;
 const wear=Object.entries(equipment||{}).filter(([slot,key])=>['head','neck','charm'].includes(slot)&&Object.hasOwn(ITEM_BY_ID,key)&&ITEM_BY_ID[key].slot===slot).map(([slot,key])=>`<span class="pet-wear wear-${slot} wear-${ITEM_BY_ID[key].art}" aria-hidden="true" style="${wearableStyle(id,level,ITEM_BY_ID[key])}">${itemArt(ITEM_BY_ID[key])}</span>`).join('');
 return `<span class="pet-art companion-v2 pet-${id} level-${level} ${extra}" role="img" aria-label="${pet.name} · Lv.${level} ${pet.stages[level-1]}" style="--idle-motion:${motion.idle};--greet-motion:${motion.greet};--happy-motion:${motion.happy};--celebrate-motion:${motion.celebrate};--motion-time:${motion.duration}s;--interaction-time:${motion.interactionTime}s;--pet-accent:${pet.accent};--pet-ratio:${w/h};--pet-scale:${[.66,.78,.9,1][level-1]}"><span class="pet-ground"></span><span class="pet-body"><span class="pet-portrait" style="background-image:url('${frame.src||art.src}');background-size:${W/w*100}% ${H/h*100}%;background-position:${x/(W-w||1)*100}% ${y/(H-h||1)*100}%;clip-path:${frame.clip}"></span>${wear}</span><span class="pet-mood-symbol" aria-hidden="true">${pet.spark}</span></span>`;
}
