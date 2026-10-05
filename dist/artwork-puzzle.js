// A puzzle keeps a snapshot of a saved artwork. Editing or deleting the original
// never changes the image halfway through a game.
export const PUZZLE_LEVELS=[
 {id:'medium',name:'仔细看',size:4,description:'16 块 · 发现颜色的线索'},
 {id:'hard',name:'小挑战',size:5,description:'25 块 · 慢慢拼也很棒'},
 {id:'expert',name:'挑战拼',size:6,description:'36 块 · 耐心找找小细节'}
];
const validId=value=>typeof value==='string'&&/^[\w-]{1,80}$/.test(value);
const integer=(value,fallback=0)=>Number.isSafeInteger(value)&&value>=0?value:fallback;
const copy=value=>JSON.parse(JSON.stringify(value));
export const puzzleLevel=id=>PUZZLE_LEVELS.find(level=>level.id===(id==='easy'?'expert':id))||PUZZLE_LEVELS[0];
export const puzzleComplete=session=>!!session&&session.placed.length===puzzleLevel(session.level).size**2;
function artworkSnapshot(value){
 if(!validId(value?.id)||!validId(value?.boardId)||!value?.colors||typeof value.colors!=='object'||Array.isArray(value.colors)||!Object.keys(value.colors).length)return null;
 return {id:value.id,boardId:value.boardId,name:typeof value.name==='string'?value.name.slice(0,40):'我的画作',colors:copy(value.colors),effect:typeof value.effect==='string'?value.effect:'original'};
}
export function createPuzzle(artwork,level='medium',{id=globalThis.crypto.randomUUID(),random=Math.random}={}){
 const source=artworkSnapshot(artwork);if(!source||!validId(id))throw Error('请先选择一幅已保存的涂色作品');
 const count=puzzleLevel(level).size**2,order=Array.from({length:count},(_,i)=>i);
 for(let i=count-1;i>0;i--){const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));[order[i],order[j]]=[order[j],order[i]];}
 if(order.every((value,index)=>value===index))order.push(order.shift());
 return {id,artwork:source,level:puzzleLevel(level).id,order,placed:[],moves:0,hints:0,finishedAt:''};
}
export function normalizePuzzleSession(value,cleanArtwork=artworkSnapshot){
 if(!validId(value?.id)||!(value.level==='easy'||PUZZLE_LEVELS.some(level=>level.id===value.level)))return null;
 const artwork=cleanArtwork(value.artwork);if(!artwork)return null;
 // Old 3×3 positions cannot be reused on a 6×6 grid. Keep the artwork,
 // but start a fresh, deterministic session so repeated reads are stable.
 if(value.level==='easy')return createPuzzle(artwork,'expert',{id:value.id.slice(0,75)+'-6x6',random:()=>.43});
 const count=puzzleLevel(value.level).size**2;
 const placed=[...new Set((Array.isArray(value.placed)?value.placed:[]).filter(i=>Number.isInteger(i)&&i>=0&&i<count))].sort((a,b)=>a-b);
 const order=Array.isArray(value.order)&&value.order.length===count&&new Set(value.order).size===count&&value.order.every(i=>Number.isInteger(i)&&i>=0&&i<count)?[...value.order]:Array.from({length:count},(_,i)=>count-i-1);
 const finishedAt=placed.length===count&&typeof value.finishedAt==='string'&&Number.isFinite(Date.parse(value.finishedAt))?value.finishedAt:'';
 return {id:value.id,artwork,level:value.level,order,placed,moves:Math.max(placed.length,integer(value.moves)),hints:Math.min(placed.length,integer(value.hints)),finishedAt};
}
export function normalizePuzzles(value,cleanArtwork=artworkSnapshot){
 const current=normalizePuzzleSession(value?.current,cleanArtwork),seen=new Set();
 const records=(Array.isArray(value?.records)?value.records:[]).flatMap(record=>{
  if(!validId(record?.id)||seen.has(record.id)||!validId(record?.artworkId)||!(record.level==='easy'||PUZZLE_LEVELS.some(level=>level.id===record.level))||typeof record.finishedAt!=='string'||!Number.isFinite(Date.parse(record.finishedAt)))return [];
  const count=record.level==='easy'?9:puzzleLevel(record.level).size**2;
  seen.add(record.id);return [{id:record.id,artworkId:record.artworkId,name:typeof record.name==='string'?record.name.slice(0,40):'我的画作',level:record.level,moves:Math.max(count,integer(record.moves)),hints:Math.min(count,integer(record.hints)),finishedAt:record.finishedAt}];
 }).slice(-60);
 return {version:1,current,records};
}
export function savePuzzle(value,session){
 const state=normalizePuzzles(value),current=normalizePuzzleSession(session);
 if(!current)throw Error('拼图进度无效');
 state.current=current;
 if(puzzleComplete(current)&&current.finishedAt&&!state.records.some(record=>record.id===current.id)){
  state.records.push({id:current.id,artworkId:current.artwork.id,name:current.artwork.name,level:current.level,moves:current.moves,hints:current.hints,finishedAt:current.finishedAt});
  state.records=state.records.slice(-60);
 }
 return state;
}
export function placePuzzlePiece(session,piece,slot,{hint=false,now=new Date().toISOString()}={}){
 const clean=normalizePuzzleSession(session);if(!clean)throw Error('拼图进度无效');
 const count=puzzleLevel(clean.level).size**2;
 if(puzzleComplete(clean)||!Number.isInteger(piece)||piece<0||piece>=count||!Number.isInteger(slot)||slot<0||slot>=count||clean.placed.includes(piece))return {session:clean,correct:false,changed:false};
 clean.moves++;
 if(piece!==slot||clean.placed.includes(slot))return {session:clean,correct:false,changed:true};
 clean.placed.push(piece);clean.placed.sort((a,b)=>a-b);if(hint)clean.hints++;
 if(puzzleComplete(clean))clean.finishedAt=now;
 return {session:clean,correct:true,changed:true};
}

function hash(value){let seed=2166136261;for(const c of value)seed=Math.imul(seed^c.charCodeAt(0),16777619);return seed>>>0;}
// Adjacent pieces share the same curved seam, with opposite outward signs.
export function puzzleEdges(session,piece){
 const size=puzzleLevel(session.level).size,row=Math.floor(piece/size),col=piece%size;
 const sign=key=>hash(session.id+':'+key)%2?1:-1;
 return [row? -sign('h'+(row-1)+','+col):0,col<size-1?sign('v'+row+','+col):0,row<size-1?sign('h'+row+','+col):0,col? -sign('v'+row+','+(col-1)):0];
}
export function puzzlePiecePath(edges){
 let path='M0 0';
 const rotate=(x,y,side)=>side===0?[x,y]:side===1?[100-y,x]:side===2?[100-x,100-y]:[y,100-x];
 edges.forEach((sign,side)=>{
  const points=(...values)=>values.reduce((parts,value,index)=>{if(index%2===0)parts.push(rotate(value,values[index+1],side).join(' '));return parts;},[]).join(' ');
  if(sign){
   path+='L'+points(36,0)+'C'+points(40,0,40,-5*sign,36,-9*sign)+'C'+points(24,-24*sign,76,-24*sign,64,-9*sign)+'C'+points(60,-5*sign,60,0,64,0);
  }
  path+='L'+points(100,0);
 });
 return path+'Z';
}
