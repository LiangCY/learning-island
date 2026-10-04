// Frames are reusable: one purchase can frame any number of saved artworks.
export const FRAMES=[
 {id:'oak',name:'原木相框',price:0,description:'温暖的木纹，送给每一位小画家'},
 {id:'cream',name:'奶油圆角',price:30,description:'柔软圆角与奶白色的宽边'},
 {id:'mint',name:'薄荷波点',price:45,description:'清新的绿色，点缀小小波点'},
 {id:'berry',name:'莓果糖纸',price:60,description:'粉紫相间的条纹，甜甜的灵感'},
 {id:'gold',name:'鎏金画廊',price:80,description:'层层金色线条，收藏得意之作'},
 {id:'night',name:'星夜珍藏',price:100,description:'深蓝夜空里藏着金色星星'}
];
export const FRAME_BY_ID=Object.fromEntries(FRAMES.map(f=>[f.id,f]));
export const ART_ROOMS=[{id:'lounge',name:'暖暖客厅'},{id:'study',name:'星光书房'},{id:'bedroom',name:'星眠卧室'}];
export const WALL_SLOTS=[{id:'left',name:'左侧',x:23},{id:'center',name:'中间',x:50},{id:'right',name:'右侧',x:77}];
export const ownsFrame=(state,id)=>id==='oak'||(state.framePurchases||[]).some(p=>p.frameId===id);
