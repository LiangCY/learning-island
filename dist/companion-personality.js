import {petId} from './companions.js';
const stage=(label,description,speech,idle,duration)=>({label,description,speech,idle,duration});
// Personality belongs to the species; growth changes its pose and pace, not its identity.
export const PERSONALITIES={
 fox:{greet:'fox-curious',happy:'fox-cuddle',celebrate:'fox-skip',interactionTime:1.1,replies:{greet:'嗨！今天想和我发现什么？',happy:'尾巴暖暖的，喜欢你的摸摸头。',celebrate:'耶！把这份进步藏进我的小行囊！'},stages:[
  stage('抱尾歪头','把蓬松尾巴抱在怀里，歪头看看你；开心时灵巧地晃一晃。','尾巴暖暖的，分你一点。','companion-rock',4.8),
  stage('跃起招呼','穿上绿背心，跃起向你招呼；身子轻快地弹起，像迎接新朋友。','来啦来啦，一起出发！','young-bounce',3.2),
  stage('迈步指路','背上行囊，伸爪指向新方向；小步左右探看，准备带路。','跟着我，前面有新发现！','explorer-step',4.3),
  stage('安稳守候','披风自然垂落，站稳脚步轻轻点头；用温暖的目光陪伴你。','每一份认真，都在闪闪发光。','guardian-breathe',5.5)
 ]},
 rabbit:{greet:'rabbit-peek',happy:'rabbit-snuggle',celebrate:'rabbit-hop',interactionTime:1.25,replies:{greet:'耳朵竖好啦，我在认真听你说！',happy:'轻轻摸，像花瓣落在头顶。',celebrate:'蹦一下！今天又向前进了一小步！'},stages:[
  stage('竖耳倾听','小爪子乖乖放在身前，竖起长耳朵听动静；轻轻侧倾，好奇地看着你。','嘘，我好像听见你来啦！','rabbit-listen',4.2),
  stage('抱萝卜轻晃','穿上小花背心，把胡萝卜抱在胸前；满足地轻轻摇晃，庆祝时蹦两下。','这根胡萝卜，想和你分享。','rabbit-carrot',4.6),
  stage('提壶照料','蹲下身子提起小水壶，细心照料花园；轻轻前倾，做个耐心的小园丁。','慢慢浇水，慢慢长大。','rabbit-garden',5.2),
  stage('花间致意','抱着花束安静站好，花纹披风垂在身后；轻轻倾身，向你送上问候。','把今天的小进步，种成一朵花。','rabbit-grace',6)
 ]},
 panda:{greet:'panda-bow',happy:'panda-nuzzle',celebrate:'panda-sway',interactionTime:1.8,replies:{greet:'慢慢来，我和竹子都在等你。',happy:'嗯——好舒服，再歇一小会儿。',celebrate:'摇呀摇，为你的认真鼓鼓劲！'},stages:[
  stage('抱竹尝鲜','坐得圆滚滚，抱着竹子送到嘴边；身子随着开心的小节奏轻轻晃动。','咔嚓，竹子真香！','panda-munch',5.8),
  stage('抱笋摇摆','两只爪子抱稳一束竹笋，稳稳站着；慢悠悠地左右摇摆，很有满足感。','今天也收获满满。','panda-bundle',6.2),
  stage('拄杖漫步','背好小包，扶着竹杖从容出发；小幅挪动重心，慢一点也能走很远。','不用着急，我陪你慢慢走。','panda-trek',6.8),
  stage('竹杖守望','握着竹杖安稳守望，呼吸舒缓；打招呼时缓缓躬身，庆祝也从从容容。','大树慢慢长，你也一样。','panda-rest',7.2)
 ]},
 cat:{greet:'cat-peek',happy:'cat-purr',celebrate:'cat-prance',interactionTime:.95,replies:{greet:'喵？让我瞧瞧你今天的新发现。',happy:'呼噜呼噜……这个摸摸头我喜欢。',celebrate:'喵呜！轻轻踮一下，为你庆祝！'},stages:[
  stage('伸爪懒腰','前爪向前伸，胸口贴低，尾巴翘在身后；慢慢伸展，睡醒就来陪你。','先伸个懒腰，再开始吧。','cat-stretch',5.6),
  stage('舔爪梳洗','坐好，抬起一只前爪认真梳洗；轻轻歪头，舒服时发出呼噜声。','把小爪子洗干净啦。','cat-groom',4.7),
  stage('举镜观星','坐着举起小望远镜，眯起一只眼寻找星星；轻轻转动视线，发现新的方向。','那颗星星，你也看到了吗？','cat-stargaze',6.1),
  stage('星夜轻守','尾巴卷在身侧，星纹披风自然垂落；安静地左右探看，守着你的每次进步。','今晚的星光，送给认真的你。','cat-watch',6.5)
 ]}
};
export function companionBehavior(id,level=1){
 const personality=PERSONALITIES[petId(id)],index=Math.max(0,Math.min(3,(Math.floor(level)||1)-1));
 const profile={...personality,...personality.stages[index]};
 // Guardians stay grounded; younger companions can be more playful.
 if(index===3){profile.celebrate={fox:'guardian-cheer',rabbit:'rabbit-grace-cheer',panda:'panda-sway',cat:'cat-proud'}[petId(id)];}
 return profile;
}
