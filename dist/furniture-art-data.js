import premium from './cozy-collection-data.js';
import everyday from './everyday-furniture-data.js';
import keepsakes from './keepsakes-and-wearables-data.js';
const bind=(ids,frames,file)=>ids.map((id,index)=>[id,{...frames[index],src:'/assets/furniture/'+file+'.png'}]);
export const FURNITURE_ART=Object.fromEntries([
 ...bind(['acorn-sofa','honey-teatable','tile-fireplace','bird-clock','arched-library','writers-desk','brass-telescope','celestial-chart','rose-arch','lily-pond','bird-fountain','picnic-table','moon-canopy','lunar-nightstand','wooden-rocker','moon-dreamcatcher'],premium,'cozy-collection'),
 ...bind(['rug-sun','rug-berry','rug-sea','rug-star','sofa-cloud','sofa-mint','desk-oak','shelf-story','piano-sky','tent-moon','bench-garden','plant-sprout','plant-bloom','lamp-moon','globe-world','frame-memory'],everyday,'everyday-furniture'),
 ...bind(['head-beret','head-flower','head-crown','head-bow','neck-sage','neck-sun','neck-night','charm-star','charm-leaf','charm-heart','decor-orbit','head-aurora','decor-musicbox','furniture-glasshouse','bed-basic','rug-picnic'],keepsakes,'keepsakes-and-wearables')
]);
