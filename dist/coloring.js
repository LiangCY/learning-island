import {FRAME_BY_ID,ART_ROOMS,WALL_SLOTS,ownsFrame} from './art-frames.js';
import {BOARD_BY_ID} from './coloring-boards.js';
import {INITIAL_GAME_COINS,COINS_PER_ANSWER,gameRewards,gameEarnings,walletBalance} from './game-wallet.js';
export {INITIAL_GAME_COINS,COINS_PER_ANSWER,gameRewards,gameEarnings};
const colorRows=[
 ['奶油','fff4d5','ffe0ab','ffbf80','f49a62','e47747','c45635'],
 ['红色','ffe1dc','ffa08f','ff6050','ff0000','dc2626','991b1b'],
 ['莓果','ffe1e9','ffbad0','fa88ad','ee5988','cd3468','97234f'],
 ['花语','f2ddff','dfbbfa','c496ef','a774db','8153b5','593884'],
 ['天空','e0f3ff','b3dfff','80c6f2','4fa6df','267fb9','19527f'],
 ['宝石蓝','dde4ff','a9baff','6d89ff','395bfa','153bcc','112780'],
 ['湖水','d1fbff','95eaf2','4dd3e3','12b5cb','07889c','075f70'],
 ['薄荷','dbf8ef','ace8d3','7cd1b4','4eb595','278e72','176650'],
 ['森林','eff6ce','d7e89d','b7d171','8ab048','638732','425d28'],
 ['阳光','fff9b3','ffec7c','ffda48','f3bd2c','d7971d','a6711d'],
 ['大地','f6e3d2','dfbda0','c99b76','a77452','7e5037','4c3024'],
 ['时光','ffffff','e9e7e3','c7c7c1','939991','5f6d66','283f3b']
];
export const SOLID_COLORS=colorRows.flatMap(([name,...colors])=>colors.map((hex,i)=>({id:'#'+hex,name:name==='红色'?['浅珊瑚红','珊瑚红','朱红','正红','深红','酒红'][i]:name+(i+1),css:'#'+hex})));
export const GRADIENTS=[
 {id:'g-sunset',name:'落日橘粉',colors:['#ffcd77','#f487a7']},
 {id:'g-ocean',name:'晴空海洋',colors:['#a9f0e4','#548de3']},
 {id:'g-berry',name:'莓果梦境',colors:['#ffc6df','#a58ae8']},
 {id:'g-forest',name:'森林晨光',colors:['#f3edac','#62bb9b']},
 {id:'g-rainbow',name:'七彩糖纸',colors:['#ffaaa7','#ffe99a','#a9e4c1','#9ccbf4','#c8a9ee']},
 {id:'g-night',name:'星河蓝紫',colors:['#566bba','#c09bdf']},
 {id:'g-peach',name:'蜜桃奶油',colors:['#fff1c7','#f5ab87']},
 {id:'g-pearl',name:'珍珠极光',colors:['#b8e9e4','#f5d9f0','#e9edff']}
].map(g=>({...g,css:`linear-gradient(135deg,${g.colors.join(',')})`}));
export const PAINTS=[...SOLID_COLORS,...GRADIENTS];
export const PAINT_BY_ID=Object.fromEntries(PAINTS.map(c=>[c.id,c]));
export const EFFECTS=[{id:'original',name:'原画',icon:'◯',description:'保留每一种原本的颜色'}, {id:'crayon',name:'蜡笔',icon:'▰',description:'粗线条、蜡质颗粒，像用蜡笔厚厚地涂'}, {id:'watercolor',name:'水彩',icon:'◒',description:'自然晕染、细纸纹与积色边缘'}, {id:'oil',name:'油画',icon:'≋',description:'分区厚涂、叠色笔触与细腻颜料起伏'}, {id:'pencil',name:'彩铅',icon:'✎',description:'分区短排线与彩色叠笔，露出温暖画纸'}, {id:'sparkle',name:'闪亮',icon:'✦',description:'细密闪粉，带一点金银碎光'}, {id:'pixel',name:'像素',icon:'▦',description:'细腻像素，保留表情和轮廓'}, {id:'pastel',name:'柔彩',icon:'☁',description:'像棉花糖一样轻柔'}, {id:'vintage',name:'复古',icon:'◷',description:'暖暖的旧时光明信片'}, {id:'candy',name:'糖果',icon:'◇',description:'更加鲜亮的糖果色彩'}, {id:'invert',name:'反色',icon:'◐',description:'明暗与色相翻转，发现另一种奇妙配色'}, {id:'fog',name:'雾化',icon:'≋',description:'柔焦与乳白薄雾，像隔着晨雾看风景'}];
const has=(map,key)=>typeof key==='string'&&Object.hasOwn(map,key);
const object=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
export function normalizeDrawing(value,boardId){
 const b=has(BOARD_BY_ID,boardId)?BOARD_BY_ID[boardId]:null;
 if(!b)return null;
 const colors=object(value?.colors);
 return {boardId,colors:Object.fromEntries(b.regions.filter(r=>has(colors,r.id)&&has(PAINT_BY_ID,colors[r.id])).map(r=>[r.id,colors[r.id]])),effect:EFFECTS.some(e=>e.id===value?.effect)?value.effect:'original',...(typeof value?.name==='string'?{name:value.name.slice(0,40)}:{})};
}
export function normalizeGames(value,history=[]){
 if(value?.version===3)value=value.modules?.coloring;
 const purchases=[],owned=new Set(),budget=gameEarnings(history);let spent=0;
 for(const p of Array.isArray(value?.purchases)?value.purchases:[]){
  if(!has(BOARD_BY_ID,p?.boardId)||owned.has(p.boardId))continue;
  const price=BOARD_BY_ID[p.boardId].price;
  if(spent+price>budget)continue;
  purchases.push({boardId:p.boardId,paid:price});spent+=price;owned.add(p.boardId);
 }
 const framePurchases=[],frames=new Set(['oak']);
 for(const p of Array.isArray(value?.framePurchases)?value.framePurchases:[]){
  if(!has(FRAME_BY_ID,p?.frameId)||frames.has(p.frameId))continue;
  const price=FRAME_BY_ID[p.frameId].price;if(spent+price>budget)continue;
  framePurchases.push({frameId:p.frameId,paid:price});spent+=price;frames.add(p.frameId);
 }
 const drafts=Object.fromEntries([...owned].filter(id=>object(value?.drafts)[id]).map(id=>[id,normalizeDrawing(value.drafts[id],id)]));
 const seen=new Set(),works=(Array.isArray(value?.works)?value.works:[]).flatMap(w=>{
  if(!owned.has(w?.boardId)||typeof w?.id!=='string'||!/^[\w-]{1,80}$/.test(w.id)||seen.has(w.id))return [];
  seen.add(w.id);return [{...normalizeDrawing(w,w.boardId),id:w.id,name:typeof w.name==='string'?w.name.slice(0,40):BOARD_BY_ID[w.boardId].name,date:typeof w.date==='string'&&Number.isFinite(Date.parse(w.date))?w.date:''}];
 });
 const slots=new Set(),wall=(Array.isArray(value?.wall)?value.wall:[]).flatMap(p=>{
  if(!ART_ROOMS.some(r=>r.id===p?.room)||!WALL_SLOTS.some(s=>s.id===p?.slot)||!seen.has(p?.workId)||!frames.has(p?.frameId))return [];
  const key=p.room+':'+p.slot;if(slots.has(key))return [];slots.add(key);return [{room:p.room,slot:p.slot,workId:p.workId,frameId:p.frameId}];
 });
 return {version:2,purchases,framePurchases,drafts,works,wall};
}
export function gameWallet(state,history=[]){if(state?.version===3)return walletBalance(state.wallet,history);const earned=gameEarnings(history),spent=[...state.purchases,...(state.framePurchases||[])].reduce((n,p)=>n+p.paid,0);return {earned,spent,balance:earned-spent};}
export function purchaseBoard(value,history,boardId){
 const state=normalizeGames(value,history);
 if(!has(BOARD_BY_ID,boardId))throw Error('没有找到这张画板');
 if(state.purchases.some(p=>p.boardId===boardId))throw Error('已经拥有这张画板啦，无需重复购买');
 if(gameWallet(state,history).balance<BOARD_BY_ID[boardId].price)throw Error('游戏币还不够，去答几道题再来吧');
 state.purchases.push({boardId,paid:BOARD_BY_ID[boardId].price});return state;
}
export function saveDrawing(value,history,drawing){
 const state=normalizeGames(value,history);
 if(!state.purchases.some(p=>p.boardId===drawing?.boardId))throw Error('请先购买这张画板');
 state.drafts[drawing.boardId]=normalizeDrawing(drawing,drawing.boardId);return state;
}
export function saveArtwork(value,history,drawing,{id,name,date=new Date().toISOString()}={}){
 const state=saveDrawing(value,history,drawing),clean=state.drafts[drawing.boardId];
 if(!Object.keys(clean.colors).length)throw Error('先给画板涂一点颜色吧');
 if(typeof id!=='string'||!/^[\w-]{1,80}$/.test(id))throw Error('作品编号无效');
 const existing=state.works.find(w=>w.id===id);
 if(existing&&existing.boardId!==drawing.boardId)throw Error('作品与画板不匹配');
 const work={...clean,id,name:typeof name==='string'&&name.trim()?name.trim().slice(0,40):BOARD_BY_ID[drawing.boardId].name,date};
 state.works=existing?state.works.map(w=>w.id===id?work:w):[work,...state.works];return state;
}
export function drawingProgress(drawing){const b=BOARD_BY_ID[drawing.boardId],count=b.regions.filter(r=>drawing.colors[r.id]).length;return {count,total:b.regions.length,percent:Math.round(count/b.regions.length*100)};}

export function purchaseFrame(value,history,frameId){
 const state=normalizeGames(value,history);
 if(!has(FRAME_BY_ID,frameId))throw Error('没有找到这个画框');
 if(ownsFrame(state,frameId))throw Error('已经拥有这个画框啦，无需重复购买');
 const price=FRAME_BY_ID[frameId].price;
 if(gameWallet(state,history).balance<price)throw Error('游戏币还不够，去答几道题再来吧');
 state.framePurchases.push({frameId,paid:price});return state;
}
export function hangArtwork(value,history,{room,slot,workId,frameId='oak'}){
 const state=normalizeGames(value,history);
 if(!ART_ROOMS.some(r=>r.id===room)||!WALL_SLOTS.some(s=>s.id===slot))throw Error('请选择有效的房间和位置');
 if(!state.works.some(w=>w.id===workId))throw Error('请先保存这幅作品');
 if(!has(FRAME_BY_ID,frameId)||!ownsFrame(state,frameId))throw Error('请先购买这个画框');
 state.wall=state.wall.filter(p=>p.room!==room||p.slot!==slot);
 state.wall.push({room,slot,workId,frameId});return state;
}
export function removeWallArtwork(value,history,room,slot){
 const state=normalizeGames(value,history);state.wall=state.wall.filter(p=>p.room!==room||p.slot!==slot);return state;
}
export function deleteArtwork(value,history,id){
 const state=normalizeGames(value,history);state.works=state.works.filter(w=>w.id!==id);state.wall=state.wall.filter(p=>p.workId!==id);return state;
}
