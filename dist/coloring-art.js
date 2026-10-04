import {BOARD_BY_ID} from './coloring-boards.js';
import {GRADIENTS,normalizeDrawing} from './coloring.js';
export const escapeText=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let svgSequence=0;
const PIXEL_GRID_SIZE=160;
// Fixed micro-facets: the glitter stays put while painting, reopening and exporting.
// Batch thousands of tiny flakes into paths instead of creating one DOM node each.
const GLITTER_TEXTURE=(()=>{
 let seed=0x8ab42f;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const layers=Array.from({length:5},()=>[]),n=v=>v.toFixed(2);
 for(let i=0;i<3500;i++){
  const x=random()*173,y=random()*157,size=.35+random()**1.6*1.35;
  const slant=(random()-.5)*size,layer=Math.floor(random()*5);
  // Irregular reflective flakes, with both light and dark faces like real glitter.
  layers[layer].push(`M${n(x)} ${n(y)}l${n(size)} ${n(slant)} ${n(-size*.2)} ${n(size*.62)} ${n(-size)} ${n(-slant)}Z`);
 }
 const tones=[['#183934',.29],['#fff3c2',.65],['#ffffff',.95],['#e9ffff',.82],['#bf8e42',.43]];
 let texture=layers.map((paths,i)=>`<path fill="${tones[i][0]}" opacity="${tones[i][1]}" d="${paths.join('')}"/>`).join('');
 const glints=[];
 for(let i=0;i<15;i++){
  const x=2+random()*169,y=2+random()*153,s=.5+random()*.8;
  glints.push(`M${n(x-s)} ${n(y)}h${n(s*2)}M${n(x)} ${n(y-s)}v${n(s*2)}`);
 }
 texture+=`<path d="${glints.join('')}" fill="none" stroke="#ffffff" stroke-width=".45" opacity=".9"/>`;
 return texture;
})();
const shapeScale=region=>{const m=region.attrs.transform?.match(/^matrix\(([^)]+)\)$/)?.[1].split(/\s+/).map(Number);return m?Math.sqrt(Math.abs(m[0]*m[3]-m[1]*m[2])):1;};
const shapeAttributes=region=>Object.entries(region.attrs).map(([k,v])=>`${k}="${v}"`).join(' ');
function glitterLayer(board,colors,prefix){
 // Paint order also masks out uncolored foreground shapes; black strokes leave
 // cartoon outlines and facial details clean, even when the background is filled.
 const mask=board.regions.map(r=>`<${r.tag} ${shapeAttributes(r)} fill="${colors[r.id]?'white':'black'}"/>`).join('');
 return {defs:`<pattern id="${prefix}-glitter-grain" patternUnits="userSpaceOnUse" width="173" height="157" patternTransform="rotate(-17)">${GLITTER_TEXTURE}</pattern><mask id="${prefix}-glitter-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="480" height="480"><g stroke="black" stroke-width="4.5" stroke-linejoin="round">${mask}<g fill="black" stroke-width="4">${board.ink}</g></g></mask>`,
  layer:`<g class="glitter-dust" pointer-events="none" aria-hidden="true" mask="url(#${prefix}-glitter-mask)"><rect x="8" y="8" width="464" height="464" fill="url(#${prefix}-glitter-grain)"/></g>`};
}
// Deterministic, color-neutral marks keep paint colors editable and exports identical.
const MATERIAL_TEXTURES=(()=>{
 let seed=8137;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},n=x=>x.toFixed(2);
 let crayon='';
 const flecks=[],dust=[];
 for(let i=0;i<2100;i++){
  const x=rand()*251,y=rand()*239,r=.3+rand()*1.6;
  flecks.push(`M${n(x)} ${n(y)}l${n(r*2)} ${n(-r*.5)} ${n(r*.4)} ${n(r)} ${n(-r*2)} ${n(r*.5)}Z`);
  if(i%3===0)dust.push(`M${n(x)} ${n(y)}h${n(r)}`);
 }
 crayon=`<path d="${flecks.join('')}" fill="#fff5dc" opacity=".64"/><path d="${dust.join('')}" stroke="#443b32" stroke-width=".65" opacity=".13"/>`;
 return {crayon};
})();
function materialStyle(prefix,effect){
 const settings={
  crayon:{stroke:'#494236',width:5.4,inkWidth:4.1,paper:'#fff9e8'},
  watercolor:{stroke:'#586b73',width:2.1,inkWidth:2.5,paper:'#fffefa'},
  oil:{stroke:'#45483b',width:2.7,inkWidth:2.8,paper:'#fffaf0'},
  pencil:{stroke:'#6d6259',width:1.45,inkWidth:1.6,paper:'#fff9ec'}
 }[effect];
 if(!settings)return {defs:'',filter:'',stroke:'#344944',width:3.5,inkWidth:3,paper:null};
 const id=`${prefix}-pigment`;
 const filters={
  crayon:`<feTurbulence type="fractalNoise" baseFrequency=".17 .6" numOctaves="3" seed="14" result="grain"/><feColorMatrix in="grain" type="luminanceToAlpha"/><feComponentTransfer><feFuncA type="linear" slope="1.1" intercept=".4"/></feComponentTransfer><feComposite in="SourceGraphic" operator="in" result="wax"/><feDisplacementMap in="wax" in2="grain" scale="1.7" xChannelSelector="R" yChannelSelector="G"/>`,
  watercolor:`<feTurbulence type="fractalNoise" baseFrequency=".065" numOctaves="2" seed="28" result="water"/><feDisplacementMap in="SourceGraphic" in2="water" scale=".75" xChannelSelector="R" yChannelSelector="G"/>`,
  oil:`<feTurbulence type="fractalNoise" baseFrequency=".19" numOctaves="2" seed="9" result="bristles"/><feDisplacementMap in="SourceGraphic" in2="bristles" scale=".55" xChannelSelector="R" yChannelSelector="G"/>`,
  pencil:`<feTurbulence type="fractalNoise" baseFrequency=".12" numOctaves="2" seed="31" result="paper"/><feDisplacementMap in="SourceGraphic" in2="paper" scale=".9" xChannelSelector="R" yChannelSelector="G"/>`
 };
 return {...settings,filter:` filter="url(#${id})"`,defs:`<filter id="${id}" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB">${filters[effect]}</filter>`};
}
function pigmentEdge(paint,prefix){
 if(paint.startsWith('g-'))return `url(#${prefix}-${paint})`;
 return '#'+[1,3,5].map(i=>Math.round(parseInt(paint.slice(i,i+2),16)*.73).toString(16).padStart(2,'0')).join('');
}
// Short pencil marks are colored with the chosen pigment and rotated per region.
// Foreground regions occlude earlier ones normally, so hatching never crosses faces.
const PENCIL_MARKS=(()=>{
 let seed=6291;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},n=v=>v.toFixed(2);
 const marks=[[],[]];
 for(let pass=0;pass<2;pass++)for(let i=0;i<(pass?160:320);i++){
  const x=rand()*80,y=rand()*80,l=3+rand()*9,dy=(rand()-.5)*1.5;
  // Wrap crossing marks at the tile edges instead of cutting regular seams.
  for(const ox of [-80,0,80])for(const oy of [-80,0,80]){
   if(x+ox+l<0||x+ox>80||y+oy+dy<0||y+oy>80)continue;
   marks[pass].push(`M${n(x+ox)} ${n(y+oy)}q${n(l*.5)} ${n(dy+.3)} ${n(l)} ${n(dy)}`);
  }
 }
 return {main:marks[0].join(''),cross:marks[1].join('')};
})();
// Overlapping, irregular flat-brush daubs. Each patch carries its own short
// bristle ridges; wrapping at tile boundaries avoids a grid or woodgrain effect.
const OIL_DAUBS=(()=>{
 let seed=9347;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},n=v=>v.toFixed(2);
 let marks='';
 for(let i=0;i<42;i++){
  const x=rand()*128,y=rand()*128,w=12+rand()*25,h=5+rand()*9,angle=-38+rand()*76;
  const d=`M0 1Q${n(w*.4)} -2 ${n(w)} 0L${n(w-2)} ${n(h*.45)}L${n(w)} ${n(h-1)}Q${n(w*.45)} ${n(h+2)} 1 ${n(h)}L2 ${n(h*.55)}Z`;
  for(const dx of [-128,0,128])for(const dy of [-128,0,128]){
   if(x+dx+w+15<0||x+dx-15>128||y+dy+h+25<0||y+dy-25>128)continue;
   marks+=`<g transform="translate(${n(x+dx)} ${n(y+dy)}) rotate(${n(angle)})"><path d="${d}" fill="${i%3?'#fff5d9':'#253c46'}" opacity="${i%3?'.16':'.1'}"/><path d="M2 ${n(h-1)}Q${n(w*.5)} ${n(h+1)} ${n(w-3)} ${n(h-1)}" fill="none" stroke="#243431" stroke-width=".65" opacity=".15"/><path d="M3 1Q${n(w*.45)} -1 ${n(w-2)} 1M4 ${n(h*.38)}Q${n(w*.5)} ${n(h*.25)} ${n(w-5)} ${n(h*.33)}" fill="none" stroke="#fffbe9" stroke-width=".8" opacity=".38"/></g>`;
  }
 }
 return marks;
})();
function oilMaterials(board,colors,prefix){
 let defs=`<g id="${prefix}-daubs">${OIL_DAUBS}</g>`;const fills={};
 board.regions.forEach((region,i)=>{
  const paint=colors[region.id];if(!paint)return;
  const id=`${prefix}-region-${i}`,color=paint.startsWith('g-')?`url(#${prefix}-${paint})`:paint;
  defs+=`<pattern id="${id}-daubs" patternUnits="userSpaceOnUse" width="128" height="128" patternTransform="translate(${i*17%128} ${i*29%128}) rotate(${[-24,17,63,-48,35][i%5]})"><use href="#${prefix}-daubs"/></pattern><pattern id="${id}" patternUnits="userSpaceOnUse" x="-60" y="-60" width="600" height="600"><rect x="-60" y="-60" width="600" height="600" fill="${color}"/><rect x="-60" y="-60" width="600" height="600" fill="url(#${id}-daubs)"/></pattern>`;
  fills[region.id]=`url(#${id})`;
 });
 return {defs,fills};
}
function regionMaterials(board,colors,prefix,effect){
 if(effect==='oil')return oilMaterials(board,colors,prefix);
 if(!['pencil','watercolor'].includes(effect))return {defs:'',fills:{}};
 const pencil=effect==='pencil',fills={};
 let defs=pencil?`<path id="${prefix}-hatch" d="${PENCIL_MARKS.main}"/><path id="${prefix}-crosshatch" d="${PENCIL_MARKS.cross}"/>`:
 `<filter id="${prefix}-water-bloom" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".014 .021" numOctaves="4" seed="18"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1.25 0 0 0 -.35"/></filter><filter id="${prefix}-water-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".48" numOctaves="3" seed="42"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1.5 0 0 0 -.52"/></filter>`;
 board.regions.forEach((r,i)=>{
  const paint=colors[r.id];if(!paint)return;
  const color=paint.startsWith('g-')?`url(#${prefix}-${paint})`:paint,id=`${prefix}-region-${i}`;
  fills[r.id]=`url(#${id})`;
  if(pencil){
   const angle=[-32,25,-15,42,12][i%5];
   defs+=`<pattern id="${id}-marks" patternUnits="userSpaceOnUse" width="80" height="80" patternTransform="translate(${i*13} ${i*7}) rotate(${angle})"><g fill="none" stroke="white" stroke-linecap="round"><use href="#${prefix}-hatch" stroke-width=".65" opacity=".84"/><use href="#${prefix}-crosshatch" stroke-width=".45" opacity=".38" transform="rotate(52 40 40)"/></g></pattern><mask id="${id}-hatch-mask" maskUnits="userSpaceOnUse" x="-60" y="-60" width="600" height="600"><rect x="-60" y="-60" width="600" height="600" fill="url(#${id}-marks)"/></mask><pattern id="${id}" patternUnits="userSpaceOnUse" width="600" height="600" x="-60" y="-60"><rect x="-60" y="-60" width="600" height="600" fill="#fffaf1"/><rect x="-60" y="-60" width="600" height="600" fill="${color}" opacity=".45"/><rect x="-60" y="-60" width="600" height="600" fill="${color}" mask="url(#${id}-hatch-mask)" opacity=".9"/></pattern>`;
  }else{
   // A whole-board wash has no repeating tile boundary. Each region has its own
   // phase, plus a thin inward pigment rim painted before the next region.
   defs+=`<pattern id="${id}" patternUnits="userSpaceOnUse" width="600" height="600" x="-60" y="-60"><rect x="-60" y="-60" width="600" height="600" fill="#fffaf1"/><rect x="-60" y="-60" width="600" height="600" fill="${color}" opacity=".9"/><rect x="-60" y="-60" width="600" height="600" fill="#fffdf6" filter="url(#${prefix}-water-bloom)" opacity=".42" transform="translate(${i%3*7} ${i%4*5})"/><rect x="-60" y="-60" width="600" height="600" fill="#fffdf6" filter="url(#${prefix}-water-grain)" opacity=".24"/></pattern><clipPath id="${id}-clip"><${r.tag} ${shapeAttributes({...r,attrs:Object.fromEntries(Object.entries(r.attrs).filter(([key])=>key!=='transform'))})}/></clipPath>`;
  }
 });
 return {defs,fills};
}
function materialLayer(board,colors,prefix,effect){
 if(!MATERIAL_TEXTURES[effect])return {defs:'',layer:''};
 const mask=board.regions.map(r=>`<${r.tag} ${shapeAttributes(r)} fill="${colors[r.id]?'white':'black'}"/>`).join('');
 const lineGap=effect==='crayon'?6:4.5;
 return {defs:`<pattern id="${prefix}-material" patternUnits="userSpaceOnUse" width="251" height="239" patternTransform="rotate(-12)">${MATERIAL_TEXTURES[effect]}</pattern><mask id="${prefix}-material-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="480" height="480"><g stroke="black" stroke-width="${lineGap}" stroke-linejoin="round">${mask}<g fill="black" stroke-width="4">${board.ink}</g></g></mask>`,
 layer:`<g class="paint-material material-${effect}" pointer-events="none" aria-hidden="true" mask="url(#${prefix}-material-mask)"><rect width="480" height="480" fill="url(#${prefix}-material)"/></g>`};
}
export function coloringSVG(boardId,drawing={},interactive=false){
 const board=BOARD_BY_ID[boardId],clean=normalizeDrawing(drawing,boardId),prefix=`paint-${++svgSequence}`;
 const glitter=clean.effect==='sparkle'?glitterLayer(board,clean.colors,prefix):{defs:'',layer:''};
 const material=materialLayer(board,clean.colors,prefix,clean.effect),style=materialStyle(prefix,clean.effect),regionPaint=regionMaterials(board,clean.colors,prefix,clean.effect);
 const defs=GRADIENTS.map(g=>`<linearGradient id="${prefix}-${g.id}" x1="0" y1="0" x2="1" y2="1">${g.colors.map((c,i)=>`<stop offset="${i/(g.colors.length-1)*100}%" stop-color="${c}"/>`).join('')}</linearGradient>`).join('');
 const filters=`<filter id="${prefix}-pastel" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0.75"/><feComponentTransfer>${['R','G','B'].map(c=>`<feFunc${c} type="linear" slope="0.8" intercept="0.2"/>`).join('')}</feComponentTransfer></filter><filter id="${prefix}-vintage" color-interpolation-filters="sRGB"><feColorMatrix values=".45 .6 .12 0 0 .3 .65 .1 0 0 .23 .42 .13 0 .04 0 0 0 1 0"/></filter><filter id="${prefix}-candy" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="1.7"/></filter><filter id="${prefix}-invert" color-interpolation-filters="sRGB"><feComponentTransfer>${['R','G','B'].map(c=>`<feFunc${c} type="linear" slope="-1" intercept="1"/>`).join('')}</feComponentTransfer></filter><filter id="${prefix}-fog" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="1.6"/><feComponentTransfer>${['R','G','B'].map(c=>`<feFunc${c} type="linear" slope=".68" intercept=".3"/>`).join('')}</feComponentTransfer></filter>`;
 const effect=['pastel','vintage','candy','invert','fog'].includes(clean.effect)?` filter="url(#${prefix}-${clean.effect})"`:style.filter;
 const regions=board.regions.map((region,i)=>{
  const paint=clean.colors[region.id],pigment=paint?.startsWith('g-')?`url(#${prefix}-${paint})`:paint||'#ffffff',fill=regionPaint.fills[region.id]||pigment;
  const width=(['watercolor','pencil'].includes(clean.effect)&&paint?(clean.effect==='watercolor'?1.5:1.2):style.width*(board.lineScale||1))/shapeScale(region);
  return `<${region.tag} ${shapeAttributes(region)} fill="${fill}" stroke-width="${width}" ${['watercolor','pencil'].includes(clean.effect)&&paint?`stroke="${pigmentEdge(paint,prefix)}"`:clean.effect==='crayon'?'fill-opacity=".97"':''} ${interactive?`data-region="${region.id}" tabindex="0" role="button" aria-label="涂色：${region.name}"`:''}/>${clean.effect==='watercolor'&&paint?`<${region.tag} ${shapeAttributes(region)} fill="none" stroke="${pigmentEdge(paint,prefix)}" stroke-width="${6/shapeScale(region)}" opacity=".18" clip-path="url(#${prefix}-region-${i}-clip)" pointer-events="none"/>`:''}`;
 }).join('');

 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480" ${interactive?'role="group"':'role="img"'} aria-label="${escapeText(board.name)}" class="coloring-svg"><defs>${defs}${filters}${glitter.defs}${material.defs}${style.defs}${regionPaint.defs}</defs>${style.paper?`<rect x="8" y="8" width="464" height="464" rx="28" fill="${style.paper}" pointer-events="none"/>`:""}<g class="material-${clean.effect}"${effect} stroke="${style.stroke}" stroke-width="${style.width*(board.lineScale||1)}" stroke-linejoin="round" stroke-linecap="round">${regions}<g fill="${style.stroke}" stroke-width="${style.inkWidth*(board.lineScale||1)}" pointer-events="none">${board.ink}</g></g>${glitter.layer}${material.layer}</svg>`;
}
// Rasterize the very same SVG for screen previews and PNG export; nearest-neighbor
// upscaling makes the pixel effect visible in both places and leaves hit targets intact.
export async function coloringCanvas(boardId,drawing,size=960){
 const blob=new Blob([coloringSVG(boardId,drawing)],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob);
 try{
  const img=new Image();img.src=url;await img.decode();
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,size,size);
  if(drawing.effect==='pixel'){
   const small=document.createElement('canvas');small.width=small.height=PIXEL_GRID_SIZE;const sctx=small.getContext('2d');sctx.fillStyle='#ffffff';sctx.fillRect(0,0,PIXEL_GRID_SIZE,PIXEL_GRID_SIZE);sctx.imageSmoothingQuality='high';sctx.drawImage(img,0,0,PIXEL_GRID_SIZE,PIXEL_GRID_SIZE);ctx.imageSmoothingEnabled=false;canvas.style.imageRendering='pixelated';ctx.drawImage(small,0,0,size,size);
  }else ctx.drawImage(img,0,0,size,size);
  return canvas;
 }finally{URL.revokeObjectURL(url);}
}
