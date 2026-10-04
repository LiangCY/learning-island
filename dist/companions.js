export const SKINS={
 green:{name:'森林绿',main:'#12796b',dark:'#09584e',tint:'#e5f2ec',paper:'#f7faf5',ink:'#193f3a',muted:'#61786f',line:'#d8e6db'},
 pink:{name:'樱花粉',main:'#ad3e72',dark:'#812a53',tint:'#fbe6ef',paper:'#fff7fa',ink:'#54263c',muted:'#896375',line:'#efd5e0'},
 blue:{name:'天空蓝',main:'#216eb0',dark:'#174b80',tint:'#e1effb',paper:'#f6faff',ink:'#203c56',muted:'#60778d',line:'#d4e2f0'},
 yellow:{name:'阳光黄',main:'#906300',dark:'#684700',tint:'#fff1bc',paper:'#fffdf4',ink:'#4a3b1a',muted:'#807453',line:'#e9dfbd'},
 purple:{name:'星空紫',main:'#784bb1',dark:'#54307f',tint:'#efe6fc',paper:'#fbf8ff',ink:'#413052',muted:'#7b698c',line:'#e3d8ef'},
 red:{name:'珊瑚红',main:'#b74343',dark:'#853030',tint:'#fce5e3',paper:'#fff8f5',ink:'#572d2b',muted:'#8c6966',line:'#efd7d2'}
};
export const PETS={
 fox:{name:'小狐狸',row:0,effect:'暖阳闪光',stages:['林间幼崽','绿衣伙伴','森林探险家','太阳守护者'],accent:'#ec9246',spark:'✦'},
 rabbit:{name:'小兔子',row:1,effect:'花瓣轻舞',stages:['软萌幼崽','花间伙伴','花园探险家','花园守护者'],accent:'#db74a3',spark:'❋'},
 panda:{name:'熊猫团团',row:2,effect:'竹林光环',stages:['竹林幼崽','竹叶伙伴','竹林探险家','竹林守护者'],accent:'#389f7b',spark:'❖'},
 cat:{name:'小猫咪',row:3,effect:'星光旋转',stages:['好奇幼崽','星衣伙伴','星夜探险家','星空守护者'],accent:'#9374d3',spark:'✧'}
};
export const LEVELS=[0,60,180,360];
export const petId=id=>Object.hasOwn(PETS,id)?id:'fox';
export function appearance(value){return {skin:Object.hasOwn(SKINS,value?.skin)?value.skin:'green',pet:petId(value?.pet)};}
export function progress(points=0){
 points=Number.isFinite(points)?Math.max(0,Math.floor(points)):0;
 let level=1;LEVELS.forEach((threshold,i)=>{if(points>=threshold)level=i+1;});
 const floor=LEVELS[level-1],next=LEVELS[level]??null;
 return {points,level,next,remaining:next===null?0:next-points,percent:next===null?100:(points-floor)/(next-floor)*100};
}
// Completed records are the source of truth: opening an old result cannot award points twice.
// Older rounds belong to the original fox, so existing practice still counts toward growth.
export function growthFromHistory(history){
 const totals=Object.fromEntries(Object.keys(PETS).map(id=>[id,0])),seen=new Set();
 for(const r of history){if(!r||typeof r.id!=='string'||seen.has(r.id))continue;seen.add(r.id);
  const earned=Array.isArray(r.details)?r.details.filter(q=>q.correct===true).length:0;
  totals[petId(r.petId)]+=earned;
 }
 return Object.fromEntries(Object.entries(totals).map(([id,points])=>[id,progress(points)]));
}
export function roundGrowth(history,id,correct){
 id=petId(id);const before=growthFromHistory(history)[id];
 const earned=Number.isFinite(correct)?Math.max(0,Math.floor(correct)):0,after=progress(before.points+earned);
 return {petId:id,earned,beforeLevel:before.level,level:after.level,points:after.points,leveledUp:after.level>before.level};
}
