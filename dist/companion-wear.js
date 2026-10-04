import {itemRatio} from './habitat-art.js';

// Percentages refer to each tightly cropped portrait, not the outer growth-stage box.
// Hat: centre / brim baseline / width / angle. Clip: centre / centre / width / angle.
// Neck: centre / top / width / angle. Badge: centre / centre / width.
export const WEAR_ANCHORS={
 fox:[
  {hat:[50,23,36,-8],clip:[74,30,17,-12],neck:[43,56,38,8],badge:[49,76,11]},
  {hat:[40,19,32,3],clip:[60,25,16,10],neck:[39,41,29,0],badge:[39,57,10]},
  {hat:[43,18,28,0],clip:[57,23,14,8],neck:[43,40,26,0],badge:[45,55,9]},
  {hat:[30,16,30,-3],clip:[43,15,15,8],neck:[25,38,30,0],badge:[29,56,10]}
 ],
 rabbit:[
  {hat:[37,31,30,-8],clip:[59,35,18,12],neck:[34,63,35,0],badge:[34,80,11]},
  {hat:[39,26,30,-6],clip:[59,28,20,12],neck:[38,52,31,0],badge:[51,72,11]},
  {hat:[42,31,26,-6],clip:[61,33,16,12],neck:[45,57,23,-4],badge:[61,78,10]},
  {hat:[39,23,26,-5],clip:[56,21,17,10],neck:[35,43,29,0],badge:[45,59,10]}
 ],
 panda:[
  {hat:[51,17,32,10],clip:[61,12,17,15],neck:[48,53,35,-7],badge:[49,77,11]},
  {hat:[45,14,35,14],clip:[66,18,19,15],neck:[44,46,35,6],badge:[38,65,11]},
  {hat:[54,14,33,10],clip:[74,18,17,15],neck:[52,45,34,6],badge:[47,63,11]},
  {hat:[43,9,30,-3],clip:[64,10,17,12],neck:[40,32,35,0],badge:[39,53,11]}
 ],
 cat:[
  {hat:[44,56,30,10],clip:[63,61,16,15],neck:[65,74,23,-60],badge:[65,80,8]},
  {hat:[40,19,38,7],clip:[66,22,21,15],neck:[43,46,39,8],badge:[42,65,12]},
  {hat:[48,21,27,8],clip:[66,26,15,12],neck:[46,45,28,5],badge:[45,61,10]},
  {hat:[32,16,32,5],clip:[49,13,17,12],neck:[29,38,30,0],badge:[29,55,10]}
 ]
};

export function wearableStyle(pet,level,item){
 const pose=WEAR_ANCHORS[pet][level-1];
 const type=item.slot==='head'?(['flower','bow'].includes(item.art)?'clip':'hat'):item.slot==='neck'?'neck':'badge';
 let [x,y,width,angle=0]=pose[type];
 if(item.art==='beret')width*=1.15;
 if(item.art==='tiara')width*=1.05;
 if(item.slot==='neck'&&item.art==='bow'){width*=.65;y+=2;}
 const anchor=type==='hat'?'-100%':type==='neck'?'0':'-50%';
 return `left:${x}%;top:${y}%;width:${width}%;height:auto;aspect-ratio:${itemRatio(item)};transform:translate(-50%,${anchor}) rotate(${angle}deg);transform-origin:50% ${type==='hat'?'100%':type==='neck'?'0':'50%'}`;
}
