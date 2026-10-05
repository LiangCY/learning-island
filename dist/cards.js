import {luo} from './luo-cards.js';
import {luoWindows,luoClips} from './luo-art-windows.js';
import {digimon,superwings} from './extra-cards.js';
import {bangbang} from './bangbang-cards.js';
import {atlasArt} from './atlas-art-windows.js';
export const RARITIES={R:{name:'闪亮',color:'#2675bb'},SR:{name:'珍稀',color:'#8655be'},SSR:{name:'星耀',color:'#a46a09'}};
export const DECKS={
 digimon:{name:'数码宝贝',label:'DIGIMON',symbol:'✹',subtitle:'勇气，让伙伴一起成长',color:'#ca7836',tint:'#fff0dd',atlas:'/assets/cards/digimon-atlas.png',size:1254,rows:[[0,333],[333,302],[635,305],[940,314]],source:'https://digimon.net/reference/'},
 luo:{name:'罗小黑战记',label:'THE LEGEND OF HEI',symbol:'☾',subtitle:'电影 1 · 电影 2 的伙伴',color:'#526d5d',tint:'#e8f2df',source:'https://luoxiaohei-movie.com/2nd/character/'},
 bluey:{name:'布鲁伊',label:'BLUEY',symbol:'✦',subtitle:'把日常变成冒险',color:'#408bc4',tint:'#e4f3ff',atlas:'/assets/cards/bluey-atlas.png',size:1254,rows:[[0,340],[340,332],[672,292],[964,290]],source:'https://www.bluey.tv/characters/'},
 peppa:{name:'小猪佩奇',label:'PEPPA PIG',symbol:'❋',subtitle:'快乐就在小小日常里',color:'#d75791',tint:'#ffe7f1',atlas:'/assets/cards/peppa-atlas.png',size:1254,rows:[[0,330],[330,314],[644,298],[942,312]],source:'https://peppapig-next-main.digital.hasbro.com/characters'},
 pokemon:{name:'宝可梦',label:'POKÉMON',symbol:'ϟ',subtitle:'一起发现新的伙伴',color:'#be8b18',tint:'#fff4ca',source:'https://www.pokemon.com/us/pokedex/'},
 pony:{name:'小马宝莉',label:'MY LITTLE PONY',symbol:'✧',subtitle:'友谊让每一天闪闪发光',color:'#9167c2',tint:'#f2e6ff',atlas:'/assets/cards/pony-atlas.png',size:1254,rows:[[0,313.5],[313.5,313.5],[627,313.5],[940.5,313.5]],cells:[[10,0,310,312],[330,0,310,314],[640,0,300,309],[980,0,274,307],[5,315,330,310],[339,318,300,302],[635,286,328,341],[977,300,277,330],[30,625,322,314],[355,624,273,310],[711,650,178,288],[985,609,269,337],[50,943,245,311],[370,973,270,281],[708,973,250,281],[984,944,270,310]],clips:{2:'polygon(0 0,100% 0,100% 100%,30% 100%,30% 90%,0 90%)',6:'polygon(0 0,26% 0,26% 7%,100% 7%,100% 100%,0 100%)'},source:'https://mylittlepony.hasbro.com/'},
 superwings:{name:'超级飞侠',label:'SUPER WINGS',symbol:'✈',subtitle:'一起出发，送达勇气与友谊',color:'#e35342',tint:'#ffebe4',source:'https://www.superwings.es/personajes'},
 bangbang:{name:'帮帮龙',label:'GO GO DINO',symbol:'🦖',subtitle:'小小救援队，出发帮助朋友',color:'#df684a',tint:'#fff0d9',atlas:'/assets/cards/bangbang-atlas.png',size:1254,rows:[[0,313.5],[313.5,313.5],[627,313.5],[940.5,313.5]],source:'https://www.suning.com/itemvideo/0070123434/824130308.html'}
};
for(const [id,art] of Object.entries(atlasArt))Object.assign(DECKS[id],art);
const bluey=[
 ['bluey','布鲁伊','Bluey','SSR','想象力小队长','蓝色的小狗女孩，和爸爸妈妈、妹妹宾果住在一起。她最爱编游戏，把平凡的一天变成新冒险。'],
 ['bingo','宾果','Bingo','SR','温柔的小搭档','布鲁伊的妹妹，是一只橙色的小狗。她喜欢和姐姐玩游戏，也能在小小的事物里找到自己的快乐。'],
 ['bandit','爸爸班迪特','Bandit','SR','游戏高手爸爸','布鲁伊和宾果的爸爸。即使忙忙碌碌，他也愿意加入孩子们的游戏，变成她们想象里的各种角色。'],
 ['chilli','妈妈奇莉','Chilli','SR','暖心的引路人','布鲁伊和宾果的妈妈。她耐心陪伴孩子，用温柔的话帮助她们面对成长中的新挑战。'],
 ['muffin','玛芬','Muffin','R','活力小旋风','布鲁伊和宾果的表妹，也是袜袜的姐姐。她有好多自己的想法，正在学习轮流玩耍和照顾伙伴的感受。'],
 ['socks','袜袜','Socks','R','一步步长大','布鲁伊最小的表妹，玛芬的妹妹。她从四脚走路慢慢学会站起来，也在学习说话和一起玩。'],
 ['stripe','叔叔斯特莱普','Uncle Stripe','R','烧烤好帮手','班迪特的弟弟，玛芬和袜袜的爸爸。他喜欢家庭聚会和烧烤，也很乐意和孩子们一起玩。'],
 ['trixie','阿姨特里克茜','Aunt Trixie','R','欢乐的家人','玛芬和袜袜的妈妈。她会加入孩子们的角色游戏，也喜欢和奇莉一起打曲棍球。'],
 ['coco','可可','Coco','R','粉色卷毛伙伴','布鲁伊的同学，是一只粉色贵宾犬。她爱惜蓬松的卷毛，在朋友的帮助下学习遵守游戏规则。'],
 ['chloe','克洛伊','Chloe','R','聪明的点子家','温柔聪明的小斑点狗，也是布鲁伊的好朋友。她喜欢想象游戏，还会把学到的新知识带进游戏里。'],
 ['lucky','幸运','Lucky','R','爱运动的邻居','住在布鲁伊隔壁的金色拉布拉多。他喜欢板球、足球和红色的小球，总是活力满满。'],
 ['rusty','拉斯蒂','Rusty','R','勇敢的好队友','布鲁伊学校里的红色凯尔皮犬。他擅长板球，也喜欢和杰克一起玩充满想象力的冒险游戏。'],
 ['jack','杰克','Jack','R','奔跑的小伙伴','班里新来的杰克罗素梗。杰克喜欢和好朋友拉斯蒂一起玩游戏，在游戏中发现自己的本领。'],
 ['mackenzie','麦肯齐','Mackenzie','R','跳跃的小能手','布鲁伊的边境牧羊犬同学，家人来自新西兰。他说话直接，跳跃和奔跑也很拿手。'],
 ['snickers','士力架','Snickers','R','独特就是本领','戴着黄色帽子的腊肠犬。短短的腿让跑步不那么容易，但他很会翻滚，也喜欢当小记者。'],
 ['honey','哈妮','Honey','R','细心的观察家','戴着圆圆眼镜的小比格犬。她体贴又有主见，擅长搭玩具，还有响亮的“口令”本领。']
];
const peppa=[
 ['peppa','佩奇','Peppa Pig','SSR','快乐小主角','穿红裙子的小猪女孩。她和家人、朋友一起玩耍，总能从小小的日常中找到快乐。'],
 ['george','乔治','George Pig','SR','恐龙小伙伴','佩奇的弟弟，穿着蓝色衣服。他的小恐龙玩具陪他一起探索，也陪他和姐姐玩游戏。'],
 ['mummy','猪妈妈','Mummy Pig','SR','温柔的陪伴','佩奇和乔治的妈妈。她穿橙色裙子，陪伴孩子一起经历成长中的小小故事。'],
 ['daddy','猪爸爸','Daddy Pig','SR','欢乐一家人','佩奇和乔治的爸爸，戴着圆眼镜。和孩子们在一起时，普通的一天也可以充满笑声。'],
 ['granny','猪奶奶','Granny Pig','R','温暖的家人','佩奇和乔治的奶奶。戴着漂亮的帽子，和猪爷爷一起迎接孩子们的来访。'],
 ['grandpa','猪爷爷','Grandpa Pig','R','爷爷的好时光','佩奇和乔治的爷爷。紫色衣服和小帽子很好认，和孙辈在一起的日子充满欢乐。'],
 ['suzy','小羊苏西','Suzy Sheep','R','好朋友相伴','穿粉色裙子的小羊女孩，是佩奇的好朋友。一起玩游戏，也一起学着相处和分享。'],
 ['danny','小狗丹尼','Danny Dog','R','快乐的小狗','棕色的小狗，有两只尖尖的短耳朵，穿着紫色衣服。他是佩奇的朋友，和伙伴们一起参加快乐的游戏。'],
 ['rebecca','小兔瑞贝卡','Rebecca Rabbit','R','长耳朵伙伴','白色小兔女孩，穿着黄色裙子。长长的耳朵让她很好认，也是佩奇的朋友。'],
 ['pedro','小马佩德罗','Pedro Pony','R','眼镜小伙伴','戴着圆眼镜的小马，穿黄色衣服。他和佩奇、朋友们一起玩耍，参与大家的小故事。'],
 ['candy','小猫坎迪','Candy Cat','R','可爱的猫朋友','橙色的小猫女孩，穿蓝绿色裙子。尖尖的耳朵和小胡须，是她独特的模样。'],
 ['emily','小象艾米丽','Emily Elephant','R','长鼻子好朋友','灰色的小象女孩，穿着红色裙子。她有圆圆的大耳朵和长鼻子，和佩奇的伙伴们一起玩。'],
 ['zoe','斑马佐伊','Zoe Zebra','R','条纹小伙伴','穿紫色裙子的斑马女孩。黑白条纹很特别，也是佩奇朋友圈里的一员。'],
 ['freddy','小狐狸弗雷迪','Freddy Fox','R','狐狸好朋友','穿红色衣服的小狐狸，橙色皮毛和蓬松尾巴很好认。他也是佩奇的朋友。'],
 ['gerald','长颈鹿杰拉德','Gerald Giraffe','R','高个子伙伴','穿蓝色衣服的小长颈鹿。长长的脖子和棕色斑点，让他在伙伴中格外显眼。'],
 ['molly','鼹鼠莫莉','Molly Mole','R','小小新朋友','戴着小眼镜、穿紫色裙子的鼹鼠女孩。她加入佩奇和朋友们，一起分享快乐的日常。']
];
const pokemon=[
 ['pikachu','皮卡丘','Pikachu','SSR','电力满满的小伙伴','黄色的电属性宝可梦，脸颊有红色的电气袋。黑色耳尖和闪电形尾巴，是它很特别的模样。',25],
 ['eevee','伊布','Eevee','SSR','充满可能的小伙伴','棕色的宝可梦，有大耳朵和奶油色的蓬松围脖。伊布拥有多种进化的可能，就像每次练习都能发现新本领。',133],
 ['charmander','小火龙','Charmander','SSR','尾巴上的小火苗','橙色的火属性宝可梦，尾巴尖上燃烧着火焰。小小的身躯和明亮的火苗，让它非常好认。',4],
 ['squirtle','杰尼龟','Squirtle','SR','蓝色的龟伙伴','水属性宝可梦，有蓝色身体、棕色龟壳和卷卷的尾巴。它可以躲进壳里，保护自己。',7],
 ['bulbasaur','妙蛙种子','Bulbasaur','SR','背着种子去冒险','草和毒属性的宝可梦，背上长着一颗植物种子。随着它成长，背上的植物也会跟着长大。',1],
 ['jigglypuff','胖丁','Jigglypuff','SR','圆滚滚的歌唱家','粉色的圆圆宝可梦，有蓝色大眼睛和卷卷的额发。它会唱歌，歌声能让听到的伙伴睡着。',39],
 ['psyduck','可达鸭','Psyduck','SR','慢慢想也没关系','黄色的水属性宝可梦，常常抱着脑袋。扁扁的嘴巴、短短的翅膀和头顶的三根毛都很好认。',54],
 ['snorlax','卡比兽','Snorlax','SR','休息也是小本领','圆滚滚的大个子宝可梦，身体是蓝绿色，肚子是奶油色。它喜欢吃东西，也喜欢舒舒服服地睡觉。',143],
 ['meowth','喵喵','Meowth','R','亮闪闪的小收藏家','奶油色的猫形宝可梦，额头上有一枚金色金币。它喜欢闪亮的东西，有长胡须和卷起来的尾巴。',52],
 ['slowpoke','呆呆兽','Slowpoke','R','悠闲的粉色伙伴','粉色的水和超能力属性宝可梦。它行动悠闲，有奶油色嘴巴和一条长长的尾巴。',79],
 ['magnemite','小磁怪','Magnemite','R','磁铁小伙伴','电和钢属性宝可梦，圆圆的银色身体中间有一只眼睛。两边的磁铁和头顶的螺丝是它的标志。',81],
 ['growlithe','卡蒂狗','Growlithe','R','勇敢的小狗伙伴','橙色的火属性宝可梦，有黑色条纹和蓬松的奶油色毛。它对熟悉的伙伴很忠诚。',58],
 ['vulpix','六尾','Vulpix','R','六条尾巴的朋友','火属性的狐狸形宝可梦，有橙色皮毛和六条卷卷的尾巴。额头上的卷毛也很特别。',37],
 ['oddish','走路草','Oddish','R','会走路的小植物','草和毒属性宝可梦，蓝色圆身体上长着绿色叶子。它用小脚走路，夜晚会四处活动。',43],
 ['poliwag','蚊香蝌蚪','Poliwag','R','肚子上的小旋涡','蓝色的水属性宝可梦，白肚子上有黑色螺旋花纹。它有小脚和适合游泳的尾巴。',60],
 ['ditto','百变怪','Ditto','R','变身小能手','紫色的柔软宝可梦，眼睛像两个小圆点。它擅长变成其他宝可梦的样子，模仿对方的模样。',132]
];
const pony=[
 ['twilight','紫悦','Twilight Sparkle','SSR','爱学习的友谊公主','紫色的小马，深蓝色鬃毛里有粉紫条纹。她热爱读书和学习，和朋友们一起发现友谊的魔法。'],
 ['rainbow','云宝','Rainbow Dash','SSR','勇敢的彩虹伙伴','天蓝色的飞马，有彩虹色鬃毛和尾巴。她喜欢飞翔和挑战，也愿意为朋友挺身而出。'],
 ['pinkie','碧琪','Pinkie Pie','SSR','把快乐送给朋友','粉色的陆马，鬃毛和尾巴卷卷的。她爱办派对、逗朋友开心，希望大家一起分享快乐。'],
 ['applejack','苹果嘉儿','Applejack','SR','诚实可靠的朋友','戴牛仔帽的橙色陆马，有金色鬃毛。她和家人在苹果园工作，认真做事，也珍惜对朋友的承诺。'],
 ['rarity','珍奇','Rarity','SR','创意满满的设计师','白色独角兽，紫色鬃毛优雅地卷起来。她喜欢设计漂亮衣服，也乐意把自己的才能分享给朋友。'],
 ['fluttershy','柔柔','Fluttershy','SR','温柔照顾小动物','淡黄色飞马，有长长的粉色鬃毛。她声音轻轻的，对小动物很有耐心，用善意陪伴大家。'],
 ['celestia','宇宙公主','Princess Celestia','SR','明亮的引路人','白色天角兽公主，有彩色长鬃毛和金色王冠。她与太阳有关，也耐心引导紫悦学习和成长。'],
 ['luna','月亮公主','Princess Luna','SR','夜空里的守护者','深蓝色天角兽公主，鬃毛像闪亮的夜空。她是宇宙公主的妹妹，与月亮和夜晚有关。'],
 ['cadance','音韵公主','Princess Cadance','R','温暖的心意','粉色天角兽公主，有紫、粉、金色的鬃毛。她与闪耀盔甲一起生活在水晶帝国。'],
 ['shining','闪耀盔甲','Shining Armor','R','可靠的哥哥','白色独角兽，有蓝色鬃毛。他是紫悦的哥哥，也是音韵公主的丈夫，会保护家人和朋友。'],
 ['spike','穗龙','Spike','R','贴心的小助手','紫色小龙，有绿色的头冠和背刺。他陪伴紫悦读书和冒险，是可靠的小助手和好朋友。'],
 ['discord','无序','Discord','R','奇妙的变化大师','模样很特别的龙马，有不同动物的角、爪和翅膀。他拥有变化的魔法，也在朋友的陪伴下学习友谊。'],
 ['bloom','苹果丽丽','Apple Bloom','R','认真发现自己的本领','黄色小陆马，有红色鬃毛和大蝴蝶结。她是苹果嘉儿的妹妹，和朋友们一起寻找各自的特长。'],
 ['sweetie','甜心宝宝','Sweetie Belle','R','小小的梦想家','白色小独角兽，有粉紫色卷鬃毛。她是珍奇的妹妹，和苹果丽丽、醒目露露一起探索自己的本领。'],
 ['scootaloo','醒目露露','Scootaloo','R','勇敢向前的小伙伴','橙色小飞马，有紫红色短鬃毛。她很欣赏云宝，常和朋友们一起行动，尝试新的挑战。'],
 ['trixie','崔克茜','Trixie','R','闪亮的魔术表演者','淡蓝色独角兽，有银色鬃毛。她喜欢穿星星图案的帽子和披风，用魔法为大家表演。']
];
// Every deck contains three star cards, five rare cards, and eight shining cards.
const makeCards=(deck,list)=>list.map(([key,name,english,_rarity,title,intro,number],index)=>({id:`${deck}-${key}`,deck,index,name,english,rarity:index<3?'SSR':index<8?'SR':'R',title,intro,...(deck==='luo'?{art:`/assets/cards/luo/${['fengxi','luozhu','xuhuai','tianhu'].includes(key)?`${key}-cutout`:key}.png`,artWindow:luoWindows[key],artClip:luoClips[key]}:{}),...(deck==='peppa'&&key==='danny'?{art:'/assets/cards/peppa/danny-cutout.png'}:{}),...(deck==='superwings'?{art:`/assets/cards/superwings/${key}-cutout.png`,artClip:key==='bigwing'?'polygon(evenodd,0 0,100% 0,100% 100%,0 100%,0 0,67% 55.5%,94% 55.5%,94% 53%,70% 53%,67% 55.5%,0 0)':undefined}:{}),...(number?{art:`/assets/cards/pokemon/${String(number).padStart(3,'0')}.png`}:{})}));
export const CARDS=Object.entries({bluey,peppa,pokemon,pony,digimon,luo,superwings,bangbang}).flatMap(([deck,list])=>makeCards(deck,list));
export const ALL_DECKS=DECKS;
export const CARD_BY_ID=Object.fromEntries(CARDS.map(c=>[c.id,c]));
export const deckId=id=>Object.hasOwn(DECKS,id)?id:'bluey';
const anchors=[[20,{R:60,SR:25,SSR:15}],[30,{R:50,SR:30,SSR:20}],[60,{R:35,SR:35,SSR:30}]];
export function probabilities(count){
 count=Number.isFinite(count)?Math.max(0,Math.min(60,count)):0;
 const [low,high]=count<=30?[anchors[0],anchors[1]]:[anchors[1],anchors[2]];
 const ratio=Math.max(0,Math.min(1,(count-low[0])/(high[0]-low[0])));
 return Object.fromEntries(Object.keys(RARITIES).map(key=>[key,low[1][key]+(high[1][key]-low[1][key])*ratio]));
}
export const intensity=round=>Array.isArray(round?.details)?round.details.filter(q=>typeof q.userAnswer==='string'&&q.userAnswer.trim()).length:0;
export function normalizeCollection(value){
 const draws=[],seen=new Set();
 for(const d of Array.isArray(value?.draws)?value.draws:[]){
  if(!d||typeof d.roundId!=='string'||!d.roundId||d.roundId.length>100||seen.has(d.roundId)||!Object.hasOwn(CARD_BY_ID,d.cardId)||typeof d.date!=='string'||!Number.isFinite(Date.parse(d.date))||!Number.isInteger(d.intensity)||d.intensity<0||d.intensity>60)continue;
  seen.add(d.roundId);draws.push({roundId:d.roundId,cardId:d.cardId,date:d.date,intensity:d.intensity});
 }
 return {version:1,selectedDeck:deckId(value?.selectedDeck),draws};
}
export function pendingTickets(history,collection){
 const seen=new Set(collection.draws.map(d=>d.roundId));
 return history.filter(r=>{if(r.cardTicket!==true||typeof r.id!=='string'||seen.has(r.id))return false;seen.add(r.id);return true;}).reverse();
}
export function inventory(collection){const items={};for(const d of collection.draws){const item=items[d.cardId]||{count:0,firstDate:d.date};item.count++;if(d.date<item.firstDate)item.firstDate=d.date;items[d.cardId]=item;}return items;}
function sample(rng){const value=rng();if(!Number.isFinite(value)||value<0||value>=1)throw new Error('抽卡随机值不正确');return value;}
export function pickCard(deck,count,rng=Math.random,{ownedCardIds=new Set(),batchCardIds=new Set()}={}){
 if(!Object.hasOwn(DECKS,deck))throw new Error('卡组不存在');
 const weights=probabilities(count),roll=sample(rng)*100;let cumulative=0,rarity='SSR';
 for(const [key,weight] of Object.entries(weights)){cumulative+=weight;if(roll<cumulative){rarity=key;break;}}
 const tier=CARDS.filter(c=>c.deck===deck&&c.rarity===rarity);
 // Keep the rarity roll unchanged; choose new friends before repeat copies.
 const unowned=tier.filter(c=>!ownedCardIds.has(c.id));
 const unused=tier.filter(c=>!batchCardIds.has(c.id));
 const pool=unowned.length?unowned:unused.length?unused:tier;
 return pool[Math.floor(sample(rng)*pool.length)];
}
export function redeem(history,value,roundId,deck,rng=Math.random,date=new Date().toISOString()){
 return redeemTicket(history,value,roundId,deck,rng,date,new Set());
}
function redeemTicket(history,value,roundId,deck,rng,date,batchCardIds){
 const collection=normalizeCollection(value);
 if(collection.draws.some(d=>d.roundId===roundId))throw new Error('这轮已经抽过卡了');
 const round=pendingTickets(history,collection).find(r=>r.id===roundId);
 if(!round)throw new Error('这轮没有可用的抽卡机会');
 const count=Math.min(60,intensity(round)),card=pickCard(deck,count,rng,{ownedCardIds:new Set(collection.draws.map(d=>d.cardId)),batchCardIds});
 if(!Number.isFinite(Date.parse(date)))throw new Error('抽卡日期不正确');
 const repeat=inventory(collection)[card.id]?.count||0;
 const draw={roundId,cardId:card.id,date,intensity:count};
 return {collection:{...collection,selectedDeck:deck,draws:[...collection.draws,draw]},draw,card,isNew:repeat===0,copies:repeat+1};
}

// A batch is calculated entirely before one storage commit. Each ticket keeps its own odds.
export function redeemBatch(history,value,count,deck,rng=Math.random,date=new Date().toISOString()){
 if(!Number.isInteger(count)||count<1||count>10)throw Error('每次可以一起抽 1–10 张');
 let collection=normalizeCollection(value);const tickets=pendingTickets(history,collection);
 if(tickets.length<count)throw Error('抽卡次数不够，先完成练习再来吧');
 const outcomes=[],batchCardIds=new Set();
 for(const ticket of tickets.slice(0,count)){const outcome=redeemTicket(history,collection,ticket.id,deck,rng,date,batchCardIds);outcomes.push(outcome);collection=outcome.collection;batchCardIds.add(outcome.card.id);}
 return {collection,outcomes};
}
