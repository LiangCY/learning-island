import {p,e,face,line} from './coloring-shapes.js';
const n=v=>Number(v.toFixed(3));
const matrix=(sx,sy,tx,ty,angle=0,cx=0,cy=0)=>{
 const a=angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 return `matrix(${[sx*c,sx*s,-sy*s,sy*c,tx+cx-c*cx+s*cy,ty+cy-s*cx-c*cy].map(n).join(' ')})`;
};
const positioned=(region,sx,sy,tx,ty,angle=0,cx=0,cy=0)=>({...region,attrs:{...region.attrs,transform:matrix(sx,sy,tx,ty,angle,cx,cy)}});
// A composition pass changes the camera, focal scale and silhouette, not just strokes.
// Existing region IDs remain attached to their subjects, including transformed parts.
// Closed color regions carry the detail; ink is reserved for faces and structural
// connections, avoiding floating engraving and duplicate decorative contours.
export function composeBoard(source){
 let regions=source.regions.map(r=>({...r,attrs:{...r.attrs}})),ink='',scale=.85;
 const replace=(name,d)=>{const r=regions.find(r=>r.name===name);if(r)Object.assign(r,p(name,d),{id:r.id});};
 const ellipse=(name,cx,cy,rx,ry=rx)=>{const r=regions.find(r=>r.name===name);if(r)Object.assign(r,e(name,cx,cy,rx,ry),{id:r.id});};
 const move=(match,sx,sy,tx,ty,angle=0,cx=0,cy=0)=>{regions=regions.map(r=>match(r.name)?positioned(r,sx,sy,tx,ty,angle,cx,cy):r);};
 const toFront=match=>{regions=[...regions.filter(r=>!match(r.name)),...regions.filter(r=>match(r.name))];};
 if(source.id==='greenhouse'){
  move(name=>name!=='背景'&&!name.startsWith('猫')&&!name.startsWith('地面')&&!name.startsWith('大盆花'),.74,.69,13,22);
  replace('地面','M8 347Q89 310 186 341Q270 303 377 340L472 322V444Q472 472 444 472H36Q8 472 8 444Z');
  move(name=>name.startsWith('地面大盆')||name.startsWith('大盆花'),1.8,1.8,-50,-337);
  move(name=>name.startsWith('地面右盆'),1.4,1.4,-326,-156);
  move(name=>name.startsWith('猫'),1.5,1.5,-18,-230);
  replace('猫尾','M387 414C443 427 455 366 432 360C413 354 419 385 403 386L373 392Z');
  ellipse('猫身体',352,395,51,49);ellipse('猫胸口',349,410,25,27);
  replace('猫耳朵','M306 366L298 302Q316 307 339 329Q357 320 376 329L409 302L400 369Z');ellipse('猫脸',352,363,52,42);
  ink=face(352,357,.69)+line('M310 374L291 370M310 383L291 387M394 374L413 370M394 383L413 387');
 }
 if(source.id==='bakery'){
  move(name=>!['背景','熊身体','熊左耳','熊右耳','熊脸','围裙','熊口鼻','厨师帽','菜单边框','菜单牌'].includes(name),.79,.76,7,11);
  move(name=>name.startsWith('熊')||name==='围裙'||name==='厨师帽',1.56,1.56,12,-203);
  replace('菜单边框','M56 369Q139 347 226 370L212 438Q138 458 68 436Z');replace('菜单牌','M67 385Q141 371 216 385L206 428Q137 443 77 428Z');
  move(name=>name.startsWith('门口花盆'),1,1,36,-250);
  // Three loaves become a foreground bread basket instead of repeating shelf icons.
  for(let i=0;i<3;i++){
   move(name=>name===`上层圆面包${i}`||name===`面包切口${i}`,1.15,1.2,-36-i*4,83);
  }
  // Bring the loaves and basket in front of the storefront.
  toFront(name=>/上层圆面包|面包切口|菜单/.test(name));
  ink=face(360,365,.62)+line('M439 35V82M421 153L439 82L457 153');
 }
 if(source.id==='valley-falls'){
  ellipse('太阳',333,84,37);move(name=>name==='晨间云',.9,.9,4,17);
  replace('远山左峰','M8 246Q41 220 84 129L126 87L154 119L198 159L238 225Z');
  replace('远山右峰','M140 240L223 114L250 111L283 51L315 85L346 88L412 198L472 242Z');
  replace('左峰积雪','M66 166L84 129L126 87L154 119L175 134L149 137L129 118L113 142L95 138Z');
  replace('右峰积雪','M223 114L250 111L283 51L315 85L346 88L363 119L333 115L315 102L298 114L280 93L262 126L245 121Z');
  replace('左山壁','M8 235Q75 172 159 183L229 215Q210 256 187 282L170 332L8 392Z');
  replace('左山壁上层','M8 235Q75 172 159 183L229 215L205 244Q144 214 101 231L48 267L8 271Z');
  replace('左山壁下层','M8 317Q57 277 105 278L158 262L193 271L170 332L8 392Z');
  replace('右山壁','M254 215Q314 181 359 176Q408 189 472 233V394L308 347L273 289Z');
  replace('右山壁上层','M254 215Q314 181 359 176Q408 189 472 233V270L408 243L359 227L278 251Z');
  replace('右山壁下层','M272 278L320 266L372 277L416 267L472 302V394L308 347L273 289Z');
  replace('瀑布','M229 215Q240 221 254 215C252 263 239 281 219 304Q203 323 223 337Q250 352 273 355Q262 384 215 387C173 364 152 336 174 307C207 270 227 254 229 215Z');
  replace('瀑布左水流','M232 221L239 222C236 258 216 284 195 309Q176 334 212 355L231 370L219 381C179 359 161 337 181 311C207 278 230 260 232 221Z');
  replace('瀑布右水流','M246 222L251 221Q248 268 218 305Q204 321 224 336L250 349L245 359Q194 336 210 306C230 281 245 258 246 222Z');
  replace('水潭','M219 356Q258 343 292 359Q330 362 352 382L396 396Q418 428 333 441L170 442Q121 426 146 402L188 389Z');
  replace('落水浪花','M210 374Q206 362 219 362Q229 347 241 360Q255 351 263 361Q278 356 284 371Q274 388 241 388Q220 389 210 374Z');
  replace('近岸','M8 374Q54 344 94 375Q120 407 160 425Q218 457 303 446Q382 445 418 414Q436 384 472 385V444Q472 472 444 472H36Q8 472 8 444Z');
  move(name=>name.startsWith('左松树'),1.7,1.65,-21,-87);move(name=>name.startsWith('右松树'),1.25,1.3,-103,-42);
  move(name=>name.startsWith('山顶松树'),.7,.7,22,40);move(name=>name.startsWith('远处松树'),.8,.8,86,54);
  move(name=>name.startsWith('左岸野花'),1.4,1.4,-9,-137);move(name=>name.startsWith('右岸野花'),1.4,1.4,-151,-141);
  move(name=>name.startsWith('睡莲'),.85,.85,44,84);
 }
 if(source.id==='sunset-cove'){
  ellipse('落日外晕',316,157,84);ellipse('太阳',316,157,65);
  move(name=>name==='左晚霞',1.35,.73,-38,-17);move(name=>name==='右晚霞',1.1,.8,-12,-22);
  replace('远海','M8 243Q266 230 472 241V422H8Z');
  replace('远岛','M129 252Q151 223 174 229L190 242Q207 232 228 250Z');
  replace('右海岬','M399 248Q420 212 439 214L455 201L472 214V302L439 287Z');
  replace('右海岬光面','M420 230L439 214L455 201L472 214V241L452 234L439 261Z');
  replace('中层海浪','M8 281C122 262 185 290 279 280S399 268 472 276V421H8Z');
  replace('近层海浪','M8 321C122 298 211 344 310 320S417 303 472 312V444H8Z');
  replace('浪花带','M8 379C118 326 207 387 294 356Q370 328 472 350V369Q391 349 302 374C210 410 122 350 8 402Z');
  replace('沙滩','M8 409C125 361 209 427 309 393Q400 365 472 395V444Q472 472 444 472H36Q8 472 8 444Z');
  // Tall bending palm frames the sun; its leaves fill the upper-left corner.
  replace('椰树干','M64 402C103 321 119 251 105 174L117 170C141 247 114 345 84 406Z');
  replace('椰叶左上','M102 182C68 133 55 150 34 190Q58 161 102 182Z');
  replace('椰叶左下','M102 182C49 179 27 204 47 250Q55 211 102 182Z');
  move(name=>name.startsWith('椰叶')||name.startsWith('椰子'),1.4,1.28,-33,-62);
  const trunkX=(y,points)=>{
   let lo=0,hi=1;const coordinate=(t,k)=>(1-t)**3*points[0][k]+3*(1-t)**2*t*points[1][k]+3*(1-t)*t*t*points[2][k]+t**3*points[3][k];
   for(let j=0;j<30;j++){const t=(lo+hi)/2;if((coordinate(t,1)<y)===(points[3][1]>points[0][1]))lo=t;else hi=t;}
   return coordinate((lo+hi)/2,0);
  };
  const left=[[64,402],[103,321],[119,251],[105,174]],right=[[117,170],[141,247],[114,345],[84,406]];
  for(let i=0;i<4;i++){
   const y=219+i*38,l1=trunkX(y,left)+1,r1=trunkX(y,right)-1,l2=trunkX(y+10,left)+1,r2=trunkX(y+10,right)-1;
   replace(`树干纹理${i+1}`,`M${l1} ${y}Q${(l1+r1)/2} ${y+4} ${r1} ${y}L${r2} ${y+10}Q${(l2+r2)/2} ${y+14} ${l2} ${y+10}Z`);
  }
  move(name=>name.startsWith('扇贝'),1.1,1.1,-55,-41);move(name=>/海星/.test(name),1.1,1.1,-18,-22);
  move(name=>name.startsWith('海边小花'),.9,.9,36,54);move(name=>name==='潮汐水洼'||name==='水洼小石头',.72,.7,39,135);
 }
 if(source.id==='moon-jewels'){
  ellipse('首饰绒布',240,245,208,209);
  move(name=>name.startsWith('项链珠子'),.95,.72,12,-17);
  move(name=>/吊坠挂环|月光主石|新月托座|托座珍珠/.test(name),1.85,1.85,-204,-356);
  ellipse('项链珠子10',240,174,9);
  toFront(name=>name==='项链珠子10');
  move(name=>/耳钉|耳饰挂环|耳坠/.test(name),1.12,1.08,-28.8,78);
  move(name=>name==='上方星光'||name.startsWith('星光珍珠'),1.25,1.25,-60,-42);
  move(name=>name==='左装饰星',.7,.7,-9,-66);move(name=>name==='右装饰星',.7,.7,156,-74);
 }
 if(source.id==='flower-tiara'){
  replace('首饰展示垫','M58 63Q240 28 422 63L445 391Q432 448 240 455Q48 448 35 391Z');
  move(name=>/花冠|冠顶|冠尖|冠沿/.test(name),1.13,.96,-31.2,-12);
  // Taller scroll arches make the tiara a single ornate silhouette.
  replace('花冠金属架','M44 171C73 211 108 215 127 167Q133 121 145 103Q155 165 183 162Q214 157 240 70Q266 157 297 162Q325 165 335 103Q347 121 353 167C372 215 407 211 436 171L412 297Q240 346 68 297Z');
  replace('花冠左镂空','M89 222Q125 227 145 160Q159 207 183 211L169 265Q128 272 95 250Z');
  replace('花冠中镂空','M200 209Q224 178 240 127Q256 178 280 209L266 273H214Z');
  replace('花冠右镂空','M297 211Q321 207 335 160Q355 227 391 222L385 250Q352 272 311 265Z');
  move(name=>name.startsWith('中央花心'),1.48,1.48,-115.2,-126);
  move(name=>name.startsWith('左冠宝石'),1.45,1.45,-65.25,-78);
  move(name=>name.startsWith('右冠宝石'),1.45,1.45,-150.75,-78);
  move(name=>/蝴蝶胸针|翼小宝石/.test(name),1.25,1.25,-53,-100);
  move(name=>name.startsWith('戒指')||name.startsWith('戒面'),1.27,1.27,-71,-112);
  move(name=>name==='左上碎光',1,1,-21,-29);move(name=>name==='右上碎光',1,1,18,-24);
 }
 if(source.id==='carousel'){
  for(let i=0;i<8;i++){
   const left=40+i*50,right=left+50;
   replace(`顶棚扇面${i}`,`M240 43Q${left} 51 ${left} 158H${right}Q${right} 51 240 43Z`);
  }
  move(name=>name.startsWith('垂帘')||name==='棚沿',1,1,0,-15);
  move(name=>name==='顶上金星',1,1,0,-17);
  for(let i=0;i<3;i++){
   const match=name=>name===`木马${i}`||name===`马鞍${i}`||name===`马鬃${i}`||name===`鞍心${i}`;
   if(i===1)move(match,1.75,1.75,-197,-205);else move(match,.86,.86,i===0?-7:64,27);
  }
  replace('中心柱','M226 153H254V412Q240 421 226 412Z');
  replace('舞台','M50 402C57 378 135 364 240 364C346 364 424 378 430 402Q423 436 240 438Q58 436 50 402Z');
  replace('舞台底座','M50 402Q240 452 430 402V433Q416 458 240 460Q62 458 50 433Z');
  for(let i=0;i<9;i++)ellipse(`舞台灯${i}`,76+i*41,433+Math.sin(i/8*Math.PI)*15,6.5);
  toFront(name=>/^木马[012]$|马鞍|马鬃|鞍心/.test(name));
  ink='<circle cx="302" cy="262" r="3.2"/><circle cx="136" cy="242" r="2.1"/><circle cx="412" cy="242" r="2.1"/>';
 }
 if(source.id==='woodland-tea'){
  move(name=>/树干|树冠/.test(name),.71,.74,2,2);
  // Reposition the right border trees separately after the common scale.
  move(name=>/树干1|树冠1|树冠下层1/.test(name),.71,.74,128,2);
  move(name=>name.startsWith('兔'),1.6,1.6,-90,-205);
  move(name=>name.startsWith('狐狸')||name.startsWith('狐左')||name.startsWith('狐右'),1.5,1.5,-168,-185);
  replace('狐狸尾巴','M382 326Q408 287 440 319Q467 369 416 390L378 369Z');
  move(name=>/桌|茶壶|壶嘴|壶盖|壶钮|壶身|杯|茶水|点心|饼干/.test(name),1.12,1.08,-28.8,-14);
  move(name=>name.startsWith('彩旗'),1,.8,0,-7);
  move(name=>name.startsWith('左小花'),1.1,1.1,-10,-27);move(name=>name.startsWith('右小花'),1.1,1.1,-33,-27);
  ink=face(131,194,.68)+face(351,191,.65);
 }
 if(source.id==='bakery')regions=regions.map(r=>({...r,name:r.name==='菜单边框'?'面包篮外沿':r.name==='菜单牌'?'面包篮编织面':r.name}));
 return {...source,regions,ink,lineScale:scale};
}
