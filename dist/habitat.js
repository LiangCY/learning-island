import {PETS,petId} from './companions.js';

export const ROOMS={
 lounge:{name:'暖暖客厅',short:'客厅',tag:'一起分享今天的小进步',icon:'home'},
 study:{name:'星光书房',short:'书房',tag:'好奇心，住在每一本书里',icon:'book'},
 garden:{name:'晴日花园',short:'花园',tag:'晒晒太阳，慢慢长大',icon:'leaf'}
};
export const CATEGORIES={all:'全部好物',furniture:'家具',decor:'小摆件',rug:'地毯',wall:'墙面',floor:'地板',accessory:'伙伴配饰'};
const item=(id,name,category,price,art,color,description,slot=category)=>({id,name,category,price,art,color,description,slot});
export const ITEMS=[
 item('wall-cream','奶油暖墙','wall',0,'wall','#f3e4c8','温暖的小屋，从这里开始。'),
 item('wall-sage','鼠尾草绿','wall',25,'wall','#cbdcc5','把森林的颜色带回家。'),
 item('wall-rose','桃桃花墙','wall',25,'wall','#f0ced3','像春天一样柔软的粉色。'),
 item('wall-night','星夜蓝墙','wall',45,'stars','#687b9f','在家也能拥有一小片星空。'),
 item('wall-lilac','薰衣草墙','wall',35,'wall','#d6cce9','适合做一个甜甜的梦。'),
 item('floor-oak','蜂蜜木地板','floor',0,'floor','#cfa778','踩上去仿佛有阳光的味道。'),
 item('floor-cloud','云朵白木','floor',30,'floor','#e4ded4','让小屋变得明亮又轻盈。'),
 item('floor-moss','青苔软地','floor',35,'floor','#a0ba8b','花园里的绿色小天地。'),
 item('rug-sun','暖阳圆毯','rug',0,'rug','#e8bf69','欢迎伙伴们围坐在一起。'),
 item('rug-berry','莓果花毯','rug',30,'flower-rug','#d88da0','一朵永远盛开的地毯。'),
 item('rug-sea','海浪小毯','rug',30,'rug','#82b5bd','让脚边泛起温柔的涟漪。'),
 item('rug-star','星星地毯','rug',45,'star-rug','#9b89c0','每一个角，都藏着一个愿望。'),
 item('sofa-cloud','云朵沙发','furniture',0,'sofa','#ddd9c8','伙伴们最喜欢的聊天位置。'),
 item('sofa-mint','薄荷双人椅','furniture',55,'sofa','#91b3a0','挤一挤，好朋友一起坐。'),
 item('desk-oak','探险小书桌','furniture',50,'desk','#bd9365','把今天的发现写下来。'),
 item('shelf-story','故事书架','furniture',65,'shelf','#bb936e','装满故事，也装满好奇心。'),
 item('piano-sky','晴空小钢琴','furniture',85,'piano','#84a6ad','练习之后，奏一首小小庆祝曲。'),
 item('tent-moon','月亮帐篷','furniture',90,'tent','#b9aad0','小小探险家的秘密基地。'),
 item('bench-garden','花园长椅','furniture',45,'bench','#b3996d','歇一歇，听听花园里的风。'),
 item('plant-sprout','新芽盆栽','decor',0,'plant','#82a985','每天都在悄悄长高。'),
 item('plant-bloom','铃兰花盆','decor',25,'flowers','#e7c987','给房间添一点春天。'),
 item('lamp-moon','晚安月亮灯','decor',40,'moon','#e8cc83','用一点暖光，收藏今天的努力。'),
 item('globe-world','小小地球仪','decor',45,'globe','#84afad','下一次探险，想去哪里？'),
 item('frame-memory','成长纪念框','decor',35,'frame','#c59a67','把珍贵的小进步放在心上。'),
 item('head-beret','画家贝雷帽','accessory',30,'beret','#b37c62','今天也是充满灵感的一天。','head'),
 item('head-flower','雏菊发夹','accessory',20,'flower','#e9c56d','把一朵小花别在耳边。','head'),
 item('head-crown','小小星冠','accessory',60,'crown','#d4ad4e','送给认真努力的小伙伴。','head'),
 item('head-bow','莓莓蝴蝶结','accessory',25,'bow','#cb819f','一份可爱又轻巧的心意。','head'),
 item('neck-sage','森林小围巾','accessory',25,'scarf','#629d89','出发前，系好你的围巾。','neck'),
 item('neck-sun','阳光小围巾','accessory',25,'scarf','#d7a348','给伙伴一个暖暖的拥抱。','neck'),
 item('neck-night','星夜领结','accessory',35,'bow','#7a79b1','参加今晚的小屋茶话会。','neck'),
 item('charm-star','勇气星章','accessory',30,'star','#e2b552','闪亮的星，陪你勇敢尝试。','charm'),
 item('charm-leaf','森林叶章','accessory',20,'leaf','#6aab85','一枚来自森林的小礼物。','charm'),
 item('charm-heart','友谊心章','accessory',30,'heart','#d18493','把喜欢，悄悄挂在胸前。','charm'),
 item('decor-orbit','鎏金星轨仪','decor',900,'orrery','#b99b57','三重金色轨道，托起一颗蓝绿小星球。'),
 item('head-aurora','极光宝石冠','accessory',1200,'tiara','#96d6cf','水滴宝石、珍珠与细金枝，收藏一束极光。','head'),
 item('decor-musicbox','月鹿水晶音乐盒','decor',1500,'musicbox','#b7b2db','水晶罩里的小鹿与弯月，住在雕花音乐盒上。'),
 item('furniture-glasshouse','繁花玻璃花房','furniture',2400,'glasshouse','#93baa4','拱形玻璃穹顶、攀缘玫瑰与小茶桌，一座四季花园。')
];
// Original purchase amounts stay fixed when the shop catalogue changes.
const NEW_PRICES={20:100,25:125,30:150,35:180,40:220,45:240,50:280,55:300,60:360,65:360,85:480,90:540};
const SELECT_PRICES={'wall-night':360,'rug-star':420,'shelf-story':460,'piano-sky':720,'tent-moon':840,'head-crown':520};
for(const item of ITEMS){
 item.legacyPrice=item.price;
 item.previousPrice=NEW_PRICES[item.price]??item.price;
 item.price=SELECT_PRICES[item.id]??item.previousPrice;
 item.tier=item.price>=900?'heirloom':item.price>=250?'select':'everyday';
}
export const SHOP_TIERS={everyday:{name:'日常好物',range:'100–240'},select:{name:'精心之选',range:'280–840'},heirloom:{name:'典藏珍品',range:'900–2400'}};
export const ITEM_BY_ID=Object.fromEntries(ITEMS.map(x=>[x.id,x]));
export const WELCOME_COINS=80;
export const SLOTS={wall:'墙面',floor:'地板',rug:'地毯',furniture:'家具',decor:'摆件'};
export const WEAR_SLOTS={head:'头饰',neck:'围巾 / 领结',charm:'胸章'};
const valid=(obj,key)=>typeof key==='string'&&Object.hasOwn(obj,key);
const dayKey=date=>{const d=new Date(date);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(d):null;};
export function coinRewards(history=[]){
 const seen=new Set(),days=new Set(),rewards=[];
 const rounds=(Array.isArray(history)?history:[]).filter(r=>r&&typeof r.id==='string'&&Array.isArray(r.details)).sort((a,b)=>(Date.parse(a.date)||0)-(Date.parse(b.date)||0)||a.id.localeCompare(b.id));
 for(const r of rounds){if(seen.has(r.id))continue;seen.add(r.id);
  const filled=r.details.filter(q=>typeof q?.userAnswer==='string'&&q.userAnswer.trim()).length;
  const base=filled,completion=filled>=20?10:0,day=dayKey(r.date),daily=completion&&day&&!days.has(day)?10:0;
  if(completion&&day)days.add(day);
  rewards.push({id:r.id,date:r.date,base,completion,daily,total:base+completion+daily});
 }
 return rewards;
}
export const earnedCoins=history=>WELCOME_COINS+coinRewards(history).reduce((n,r)=>n+r.total,0);
export function normalizeHabitat(value,history=[]){
 const budget=earnedCoins(history),purchases=[],seen=new Set();let spent=0;
 for(const p of Array.isArray(value?.purchases)?value.purchases:[]){
  if(!valid(ITEM_BY_ID,p?.itemId)||seen.has(p.itemId))continue;const item=ITEM_BY_ID[p.itemId];
  const paid=Number.isFinite(p.paid)&&[item.legacyPrice,item.previousPrice,item.price].includes(p.paid)?p.paid:value?.version!==2?item.legacyPrice:item.price;
  if(!item.price||spent+paid>budget)continue;
  purchases.push({itemId:item.id,date:typeof p.date==='string'?p.date:'',paid});seen.add(item.id);spent+=paid;
 }
 const owned=new Set([...ITEMS.filter(i=>i.price===0).map(i=>i.id),...seen]);
 const defaults={wall:'wall-cream',floor:'floor-oak',rug:'rug-sun',furniture:'sofa-cloud',decor:'plant-sprout'};
 const rooms=Object.fromEntries(Object.keys(ROOMS).map(room=>[room,Object.fromEntries(Object.keys(SLOTS).map(slot=>{
  const id=value?.rooms?.[room]?.[slot];return [slot,owned.has(id)&&ITEM_BY_ID[id]?.category===slot?id:defaults[slot]];
 }))]));
 const residents=Object.fromEntries(Object.keys(PETS).map(id=>[id,valid(ROOMS,value?.residents?.[id])?value.residents[id]:'lounge']));
 const outfits=Object.fromEntries(Object.keys(PETS).map(id=>[id,Object.fromEntries(Object.keys(WEAR_SLOTS).map(slot=>{
  const key=value?.outfits?.[id]?.[slot];return [slot,owned.has(key)&&ITEM_BY_ID[key]?.category==='accessory'&&ITEM_BY_ID[key].slot===slot?key:null];
 }))]));
 const wishlist=[...new Set((Array.isArray(value?.wishlist)?value.wishlist:[]).filter(id=>valid(ITEM_BY_ID,id)&&!owned.has(id)))];
 const positions=Object.fromEntries(Object.keys(ROOMS).map(room=>[room,Object.fromEntries(Object.keys(PETS).map((pet,i)=>[pet,clampPosition(value?.positions?.[room]?.[pet],{x:18+i*64/3,y:8})]))]));
 return {version:2,purchases,rooms,residents,positions,outfits,wishlist};
}
export function ownedItems(state){return new Set([...ITEMS.filter(i=>!i.price).map(i=>i.id),...state.purchases.map(p=>p.itemId)]);}
export function wallet(state,history=[]){const earned=earnedCoins(history),spent=state.purchases.reduce((n,p)=>n+p.paid,0);return {earned,spent,balance:earned-spent};}
export function buyItem(value,history,id,date=new Date().toISOString()){
 const state=normalizeHabitat(value,history);if(!valid(ITEM_BY_ID,id))throw Error('没有找到这件好物');
 if(ownedItems(state).has(id))throw Error('这件好物已经在你的收藏里啦');
 if(wallet(state,history).balance<ITEM_BY_ID[id].price)throw Error('叶子币还不够，完成练习后再来看看吧');
 state.purchases.push({itemId:id,date,paid:ITEM_BY_ID[id].price});state.wishlist=state.wishlist.filter(x=>x!==id);return state;
}
export function decorateRoom(value,history,room,id){
 const state=normalizeHabitat(value,history),item=ITEM_BY_ID[id];
 if(!valid(ROOMS,room)||!valid(ITEM_BY_ID,id)||!valid(SLOTS,item.category)||!ownedItems(state).has(id))throw Error('先把这件装饰收入收藏吧');
 state.rooms[room][item.category]=id;return state;
}
export function equipItem(value,history,pet,slot,id){
 const state=normalizeHabitat(value,history);
 if(!valid(PETS,pet)||!valid(WEAR_SLOTS,slot))throw Error('没有找到这个装扮位置');
 if(id!==null&&(!valid(ITEM_BY_ID,id)||ITEM_BY_ID[id].category!=='accessory'||ITEM_BY_ID[id].slot!==slot||!ownedItems(state).has(id)))throw Error('先把这件配饰收入收藏吧');
 state.outfits[pet][slot]=id;return state;
}
export function movePet(value,history,pet,room){
 const state=normalizeHabitat(value,history);if(!valid(PETS,pet)||!valid(ROOMS,room))throw Error('没有找到这个房间');state.residents[pet]=room;return state;
}
export function toggleWish(value,history,id){const state=normalizeHabitat(value,history);if(!valid(ITEM_BY_ID,id)||ownedItems(state).has(id))return state;state.wishlist=state.wishlist.includes(id)?state.wishlist.filter(x=>x!==id):[...state.wishlist,id];return state;}
export function homeMilestones(state){
 const owned=ownedItems(state),dressed=Object.values(state.outfits).filter(o=>Object.values(o).some(Boolean)).length;
 return [{name:'第一件心头好',description:'购买一件好物',done:state.purchases.length>0},
 {name:'伙伴造型师',description:'为任意伙伴戴上配饰',done:dressed>0},
 {name:'房间设计师',description:'三个房间都摆上买来的好物',done:Object.values(state.rooms).every(r=>Object.values(r).some(id=>ITEM_BY_ID[id].price>0))},
 {name:'小屋收藏家',description:'拥有 12 件家具和配饰',done:owned.size>=12},
 {name:'整整齐齐一家人',description:'四位伙伴都有自己的配饰',done:dressed===4}];
}

export function clampPosition(point,fallback={x:50,y:8}){return {x:Math.max(12,Math.min(88,Number.isFinite(point?.x)?point.x:fallback.x)),y:Math.max(3,Math.min(24,Number.isFinite(point?.y)?point.y:fallback.y))};}
export function positionPet(value,history,room,pet,point){const state=normalizeHabitat(value,history);if(!valid(ROOMS,room)||!valid(PETS,pet))throw Error('没有找到这个伙伴');state.positions[room][pet]=clampPosition(point,state.positions[room][pet]);return state;}
export function resetPositions(value,history,room){const state=normalizeHabitat(value,history);if(!valid(ROOMS,room))throw Error('没有找到这个房间');Object.keys(PETS).forEach((pet,i)=>state.positions[room][pet]={x:18+i*64/3,y:8});return state;}
