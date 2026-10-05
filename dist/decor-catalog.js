const item=(id,name,category,price,size,description,index,extra={})=>({id,name,category,price,size,description,index,...extra});
export const GARDEN_ITEMS=[
 item('daisy','晨光小雏菊','花卉',0,13,'把一小片春天，种在脚边。',0),
 item('tulip','蜜桃郁金香','花卉',18,13,'像一杯温柔的蜜桃汽水。',1),
 item('lavender','紫雾薰衣草','花卉',22,14,'风经过时，紫色也轻轻摇晃。',2),
 item('sunflower','向阳小太阳','花卉',26,16,'把最明亮的一角留给它。',3),
 item('hydrangea','蓝莓绣球','花卉',32,16,'一团一团，像蓝色的小云。',4),
 item('rose','莓红玫瑰','花卉',36,16,'为花园添一束热烈的颜色。',5),
 item('apple','苹果小树','树木',0,24,'树荫下，藏着今天的小心愿。',6),
 item('cherry','樱花树','树木',65,28,'粉色花枝，撑起一把春天的伞。',7),
 item('lemon','柠檬树','树木',48,23,'绿叶之间，亮起小小的金黄。',8),
 item('pine','森林小松树','树木',42,23,'四季都在的小小守护者。',9),
 item('shrub','圆圆绿篱','绿植',0,14,'种成一排，围出自己的秘密角落。',10),
 item('fern','卷卷蕨叶','绿植',20,15,'舒展开的绿叶，像森林的羽毛。',11),
 item('bench','奶油木长椅','庭院',0,22,'忙完了，和伙伴坐下来看看花。',12),
 item('arch','蔷薇花拱门','庭院',90,27,'穿过这扇门，就是你的花园。',13),
 item('fountain','涟漪小喷泉','庭院',85,23,'水珠跳跃，花园有了轻快的节奏。',14),
 item('pond','睡莲小池塘','庭院',75,27,'在叶子与花朵间，收藏一片天空。',15),
 item('birdhouse','木屋鸟舍','庭院',45,13,'为路过的鸟儿，留一间小房子。',16),
 item('watering','雏菊洒水壶','摆件',18,11,'照顾花草的小小工具。',17),
 item('stones','散步石板','小径',0,16,'摆成一条通往长椅的小路。',18,{layer:1}),
 item('fence','白木小栅栏','小径',24,20,'一节一节，围出喜欢的形状。',19),
 item('pot','陶盆绿植','绿植',16,11,'温暖的红陶，装着生机勃勃。',20),
 item('mushroom','蘑菇小伞','摆件',20,11,'像从童话书里悄悄走出来。',21),
 item('lantern','暖光花园灯','摆件',38,11,'傍晚亮起一盏温柔的小灯。',22),
 item('windmill','童话小风车','庭院',80,22,'风有了形状，愿望有了方向。',23)
];
export const AQUARIUM_ITEMS=[
 item('goldfish','橘子小金鱼','游鱼',0,12,'长长的尾巴，像一片柔软的丝绸。',0,{fish:true}),
 item('clownfish','珊瑚小丑鱼','游鱼',26,10,'橘白相间的小小探险家。',1,{fish:true}),
 item('tetra','霓虹灯鱼','游鱼',0,9,'蓝红色的光，在水中慢慢游过。',2,{fish:true}),
 item('betta','翡翠斗鱼','游鱼',48,14,'展开的鳍，像一件翡翠色礼服。',3,{fish:true}),
 item('butterfly','金线蝴蝶鱼','游鱼',35,11,'一抹明亮的黄，划过碧蓝的水。',4,{fish:true}),
 item('angel','月光神仙鱼','游鱼',45,12,'轻盈的身影，像水里的月亮。',5,{fish:true}),
 item('discus','蓝宝石七彩鱼','游鱼',55,12,'把蓝色的波纹，穿在身上。',6,{fish:true}),
 item('koi','锦云小锦鲤','游鱼',42,14,'一朵白云，沾上了晚霞。',7,{fish:true}),
 item('guppy','紫扇孔雀鱼','游鱼',30,12,'轻轻摆动一把紫色的小扇子。',8,{fish:true}),
 item('gourami','珍珠丝足鱼','游鱼',35,12,'身上藏着一整片细碎星光。',9,{fish:true}),
 item('seahorse','薄荷小海马','游鱼',60,8,'慢悠悠，看看水草间的新朋友。',10,{fish:true}),
 item('shrimp','樱桃小虾','游鱼',20,8,'透明的小脚，认真探索每个角落。',11,{fish:true}),
 item('ribbon','丝带水草','水草',0,14,'高高的绿叶，跟着水流摇摆。',12),
 item('anubias','青叶水榕','水草',0,15,'宽宽的绿叶，是鱼儿的秘密基地。',13),
 item('cabomba','羽毛金鱼藻','水草',18,15,'一簇蓬松的水中小森林。',14),
 item('ludwigia','红霞水草','水草',26,15,'在碧水里，种下一抹晚霞。',15),
 item('moss','圆圆莫丝球','水草',16,12,'软乎乎的绿色小岛。',16),
 item('coral','蔷薇珊瑚摆件','造景',40,19,'粉色的枝丫，像海底花园。',17),
 item('driftwood','森林沉木','造景',0,23,'弯弯的树根，搭起水下拱门。',18),
 item('cave','青石拱洞','造景',36,22,'游进去，再从另一边探出头。',19),
 item('castle','海蓝小城堡','造景',75,22,'一座藏在水底的童话城堡。',20),
 item('ship','远航小帆船','造景',65,25,'旧帆船，带着海洋的故事。',21),
 item('shell','月白珍珠贝','造景',28,14,'打开贝壳，发现一颗小月亮。',22),
 item('treasure','星星宝藏箱','造景',58,17,'把闪亮的心愿，藏进小箱子里。',23),
 item('tank-oak','原木观景缸','鱼缸',0,0,'温暖原木框，购买时选择淡水或海水。',null,{slot:'tank'}),
 item('tank-pearl','珍珠白鱼缸','鱼缸',70,0,'奶白圆角边框，让水色更清透。',null,{slot:'tank'}),
 item('tank-night','深海黑金缸','鱼缸',95,0,'深蓝金边，收藏一座小小水族馆。',null,{slot:'tank'}),
 item('light-sun','晴空水面灯','灯光',0,0,'像午后的阳光，明亮而柔和。',null,{slot:'light'}),
 item('light-dusk','落日晚霞灯','灯光',40,0,'水面染上柔柔的蜜桃色。',null,{slot:'light'}),
 item('light-moon','蓝月夜光灯','灯光',50,0,'慢慢暗下来，让鱼儿在月光里游。',null,{slot:'light'})
];
const expanded=(id,name,category,price,size,description,index,extra={})=>item(id,name,category,price,size,description,index,{atlas:'expansion',...extra});
GARDEN_ITEMS.push(
 expanded('ginkgo','金扇银杏树','树木',38,25,'金色扇叶，让花园住进秋天。',0,{theme:'秋日林间'}),
 expanded('bamboo','清风小竹林','树木',34,20,'修长竹节，围出清凉的一隅。',1,{theme:'东方庭院'}),
 expanded('maple','晚霞红枫','树木',58,26,'层层红叶，铺开热烈的秋色。',2,{theme:'秋日林间'}),
 expanded('cactus','花冠仙人掌','绿植',22,12,'圆滚滚的小刺球，开出粉色花冠。',3,{theme:'阳光小院'}),
 expanded('calla','白羽马蹄莲','花卉',24,13,'洁白花瓣，像轻轻舒展的翅膀。',4,{theme:'纯白花境'}),
 expanded('dahlia','橘光大丽花','花卉',30,14,'层叠花瓣，盛满橘色阳光。',5,{theme:'暖色花境'}),
 expanded('greenhouse','玻璃小温室','庭院',95,29,'通透玻璃屋，收藏一整间绿意。',6,{theme:'秘密庭院'}),
 expanded('swing','蔷薇小秋千','庭院',68,24,'坐在花架下，让风轻轻推一下。',7,{theme:'秘密庭院'}),
 expanded('bridge','弯弯木拱桥','小径',55,25,'一座弧形小桥，连接两片风景。',8,{theme:'东方庭院'}),
 expanded('gazebo','薄荷八角亭','庭院',110,29,'精巧的八角凉亭，留一处歇脚的地方。',9,{theme:'秘密庭院'}),
 expanded('birdbath','双鸟饮水台','庭院',42,15,'浅浅水盘，迎来两位蓝色访客。',10,{theme:'森林访客'}),
 expanded('hedgehog','蘑菇帽小刺猬','摆件',26,12,'蜷成小团子，戴着一顶蘑菇帽。',11,{theme:'森林访客'})
);
AQUARIUM_ITEMS.push(
 expanded('turtle','慢悠悠海龟','游鱼',58,15,'舒展鳍足，在海水中从容巡游。',12,{fish:true,motion:'glide',water:'salt'}),
 expanded('ray','蓝点小鳐鱼','游鱼',68,18,'宽宽的双翼，掠过海底的光影。',13,{fish:true,motion:'glide',water:'salt'}),
 expanded('puffer','金球刺鲀','游鱼',40,11,'圆圆的海洋小刺球，轻巧地转身。',14,{fish:true,motion:'dart',water:'salt'}),
 expanded('jellyfish','星雾小水母','游鱼',60,11,'透明的紫色伞盖，轻轻浮起又落下。',15,{fish:true,motion:'float',water:'salt'}),
 expanded('crab','橘钳海蟹','游鱼',28,10,'挥挥小钳子，沿着海底慢慢探索。',16,{fish:true,motion:'bottom',water:'salt'}),
 expanded('axolotl','樱花六角恐龙','游鱼',48,13,'粉色外鳃像花瓣，悠闲探索淡水缸底。',17,{fish:true,motion:'bottom',water:'fresh'}),
 expanded('anemone','碧浪海葵','造景',32,17,'柔软的触手舒展成一朵海中花。',18,{water:'salt'}),
 expanded('crystal','紫晶拱洞','造景',55,24,'紫色晶簇，围起闪亮的藏身处。',19),
 expanded('ruins','青苔石柱遗迹','造景',65,25,'斑驳白石柱，讲述水下古城的故事。',20),
 expanded('submarine','柠檬小潜艇','造景',58,21,'明黄色的迷你潜艇，准备出发探险。',21),
 expanded('volcano','熔光火山摆件','造景',80,23,'橘色灯光模拟熔岩，照亮黑色山体。',22),
 expanded('shellhouse','粉螺小屋','造景',45,19,'旋转的粉色屋顶，藏着童话小门。',23)
);
AQUARIUM_ITEMS.push(
 item('starfish','橘光小海星','海底伙伴',24,11,'五只柔软的腕，沿着海底慢慢探索。',0,{atlas:'seafloor',fish:true,motion:'crawl',water:'salt'}),
 item('urchin','紫绒小海胆','海底伙伴',30,9,'紫色小刺球，迈着细小的步子寻找点心。',1,{atlas:'seafloor',fish:true,motion:'crawl',water:'salt'})
);
// Each aquarium model has its own fixed footprint and silhouette.
export const TANK_MODELS={
 'tank-oak':{width:45,height:30,display:70,form:'原木桌景',frame:'#b79b6b',edge:'#887451',radius:'18px'},
 'tank-pearl':{width:48,height:32,display:72,form:'奶油圆角',frame:'#eee8dd',edge:'#c8bfae',radius:'24px'},
 'tank-night':{width:51,height:34,display:74,form:'黑金小景',frame:'#283e50',edge:'#b59c68',radius:'14px'},
 'tank-petal':{width:32,height:26,display:57,form:'花瓣桌景',frame:'#dbb9b3',edge:'#ad8984',radius:'30px'},
 'tank-cube':{width:42,height:42,display:62,form:'方形森屿',frame:'#91a99a',edge:'#627d70',radius:'10px'},
 'tank-stream':{width:90,height:32,display:96,form:'溪流长景',frame:'#b6c9c6',edge:'#809d9a',radius:'12px'},
 'tank-tower':{width:48,height:68,display:56,form:'月光高柱',frame:'#b7b4cd',edge:'#817e9f',radius:'22px'},
 'tank-arch':{width:64,height:56,display:76,form:'拱窗花境',frame:'#e2cfaa',edge:'#b09b70',radius:'48px 48px 14px 14px'},
 'tank-lagoon':{width:84,height:48,display:90,form:'碧湾观景',frame:'#76aaa5',edge:'#477b78',radius:'28px'},
 'tank-panorama':{width:120,height:50,display:100,form:'无垠全景',frame:'#344952',edge:'#8ba8ac',radius:'10px'},
 'tank-walnut':{width:100,height:62,display:98,form:'胡桃客厅',frame:'#957553',edge:'#644a32',radius:'16px'}
};
AQUARIUM_ITEMS.push(
 item('tank-petal','花瓣桌景缸','鱼缸',24,0,'温柔粉框和圆角，适合一隅轻巧的小水景。',null,{slot:'tank'}),
 item('tank-cube','森屿方缸','鱼缸',38,0,'宽高相同的方形视窗，层层叠出水下绿意。',null,{slot:'tank'}),
 item('tank-stream','溪流长缸','鱼缸',62,0,'低矮而舒展，沿着沙底铺开一条小溪。',null,{slot:'tank'}),
 item('tank-tower','月光高柱缸','鱼缸',65,0,'修长的紫灰色高窗，收藏上下浮游的光影。',null,{slot:'tank'}),
 item('tank-arch','拱窗花境缸','鱼缸',78,0,'香槟色拱肩边框，像一扇看向水中的窗。',null,{slot:'tank'}),
 item('tank-lagoon','碧湾观景缸','鱼缸',88,0,'宽阔青绿边框，把一片宁静海湾带回家。',null,{slot:'tank'}),
 item('tank-panorama','无垠全景缸','鱼缸',110,0,'横向延伸的深色长窗，一眼望见整片水景。',null,{slot:'tank'}),
 item('tank-walnut','胡桃客厅缸','鱼缸',98,0,'厚实胡桃木框，容纳一幅开阔的客厅风景。',null,{slot:'tank'})
);
export const tankModel=id=>TANK_MODELS[Object.hasOwn(TANK_MODELS,id)?id:'tank-oak'];
export const tankDimensions=id=>{const t=tankModel(id);return `${t.width} × ${t.height} cm`;};
export const WATER_TYPES={fresh:'淡水',salt:'海水',both:'通用'};
export const fitsWater=(item,water)=>item.water==='both'||item.water===water;
for(const i of AQUARIUM_ITEMS){
 if(!i.water)i.water=['clownfish','butterfly','seahorse'].includes(i.id)?'salt':i.fish||i.category==='水草'?'fresh':'both';
 if(i.fish&&!i.motion)i.motion=['clownfish','tetra','guppy'].includes(i.id)?'dart':i.id==='seahorse'?'float':i.id==='shrimp'?'bottom':'glide';
}
export const DECOR_GAMES={
 garden:{id:'garden',name:'花园小园丁',english:'THE LITTLE GARDEN',tagline:'种一片花，留一处慢慢长大的风景。',sceneName:'我的秘密花园',items:GARDEN_ITEMS,categories:['全部','花卉','树木','绿植','庭院','小径','摆件'],background:'/assets/playgrounds/garden-background.png',defaults:[['apple',21,53],['bench',66,58],['daisy',32,67],['daisy',41,78],['shrub',82,56],['shrub',86,65],['stones',54,75],['stones',62,85]],max:48},
 aquarium:{id:'aquarium',name:'欢乐水族馆',english:'A LITTLE OCEAN',tagline:'让一片小小的海，住进你的日常。',sceneName:'我的玻璃海洋',items:AQUARIUM_ITEMS,categories:['全部','游鱼','海底伙伴','水草','造景','鱼缸','灯光'],background:'/assets/playgrounds/aquarium-background.png',defaults:[['ribbon',15,89],['ribbon',22,90],['anubias',78,91],['anubias',87,93],['driftwood',52,91],['goldfish',36,42],['tetra',66,33],['tetra',54,56]],max:48}
};
for(const config of Object.values(DECOR_GAMES))config.byId=Object.fromEntries(config.items.map(i=>[i.id,i]));
