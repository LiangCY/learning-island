const INDOOR=['lounge','study','bedroom'],ALL=[...INDOOR,'garden'];
const special=(id,name,category,price,art,color,description,rooms,zone,size,artIndex)=>({id,name,category,price,art,color,description,slot:category,rooms,zone,size,artIndex});
export const EXTRA_ITEMS=[
 special('acorn-sofa','橡果绒绒沙发','furniture',980,'sofa','#9baa73','叶片刺绣靠垫、弧形橡木扶手，坐下就是森林的拥抱。',['lounge'],'ground',32,0),
 special('honey-teatable','蜂蜜下午茶桌','furniture',680,'desk','#be945d','雕花圆桌上摆好小茶壶，给朋友留一杯暖茶。',['lounge'],'ground',23,1),
 special('tile-fireplace','花砖暖炉','furniture',1800,'frame','#d8bc91','奶油花砖、黄铜围栏与橘色炉火，让晚风也变得温柔。',['lounge'],'ground',28,2),
 special('bird-clock','啾啾布谷钟','decor',560,'frame','#ae8954','小鸟住在木屋钟顶，橡叶围着金色钟摆轻轻垂落。',['lounge'],'wall',14,3),
 special('arched-library','森林拱顶书柜','furniture',1600,'shelf','#aa8151','拱形雕花顶、黄铜小锁和满满书页，收藏一整个故事世界。',['study'],'ground',24,4),
 special('writers-desk','绿灯作家书桌','furniture',1100,'desk','#b89366','台灯亮起，翻开笔记本，把今天的好奇写成故事。',['study'],'ground',29,5),
 special('brass-telescope','银河黄铜望远镜','furniture',1350,'globe','#777b98','深蓝镜筒配木制三脚架，准备发现下一颗星星。',['study'],'ground',22,6),
 special('celestial-chart','航海星图挂画','decor',480,'stars','#576584','金线勾勒星座，木卷轴把一整片星空挂在墙上。',['study'],'wall',17,7),
 special('rose-arch','蔷薇秘密花门','furniture',1500,'flowers','#bb9ca7','攀缘玫瑰、白色小栅门和薰衣草，通向自己的秘密花园。',['garden'],'ground',27,8),
 special('lily-pond','睡莲小池塘','furniture',980,'rug','#84b6ac','圆润石岸围着清水，粉色睡莲在叶子间悄悄开放。',['garden'],'rug',30,9),
 special('bird-fountain','青瓷小鸟喷泉','furniture',2200,'moon','#86b9b4','双层花瓣青瓷碗、细细水流与金色小鸟，给花园一段清凉。',['garden'],'ground',24,10),
 special('picnic-table','莓果野餐桌','furniture',760,'desk','#c1a276','藤编小桌装着果篮、面包与格纹布，邀请伙伴来野餐。',['garden'],'ground',24,11),
 special('moon-canopy','月眠纱幔床','furniture',3200,'bed','#d8aec0','柔软纱幔垂在四根床柱之间，月亮绣被装着一整夜好梦。',['bedroom'],'ground',34,12),
 special('lunar-nightstand','月光晚安柜','furniture',840,'shelf','#b5a7c5','圆角薰衣草小柜，月亮灯和花束陪你说晚安。',['bedroom'],'ground',19,13),
 special('wooden-rocker','橡木小摇马','furniture',620,'bench','#c39b63','木纹马鞍、奶油色鬃毛和弯弯摇板，收藏童年的慢时光。',['bedroom'],'ground',23,14),
 special('moon-dreamcatcher','星月捕梦网','decor',420,'moon','#a0b8cc','细金线穿过月亮与星星，蓝色流苏把美梦留下。',['bedroom'],'wall',13,15),
 special('bed-basic','云绒小床','furniture',0,'bed','#c7b7d4','卧室的入住礼物，松软枕头等你做一个好梦。',['bedroom'],'ground',32),
 special('sky-sunset','蜜桃晚霞','wall',240,'stars','#edc7b0','把花园的天空染成蜜桃色，留住傍晚的温柔。',['garden'],'finish',0),
 special('ground-stone','青石花径','floor',320,'floor','#a0aaa1','草地间铺出灰绿小石路，走向喜欢的角落。',['garden'],'finish',0),
 special('rug-picnic','草莓格纹野餐垫','rug',340,'picnic-rug','#d39499','铺在草地上的小方格，装得下四位伙伴的快乐。',['garden'],'rug',39)
];
const meta={
 'sofa-cloud':{size:32},'sofa-mint':{size:32},'desk-oak':{size:28},'shelf-story':{size:24},'piano-sky':{size:27},'tent-moon':{size:28},
 'bench-garden':{rooms:['garden'],size:30},'furniture-glasshouse':{rooms:['garden'],size:29},
 'plant-sprout':{rooms:ALL,size:15},'plant-bloom':{rooms:ALL,size:15},'frame-memory':{zone:'wall',size:13},
 'floor-moss':{rooms:ALL},'decor-musicbox':{size:15},'decor-orbit':{size:16}
};
export function enrichItem(item){
 return Object.assign(item,{rooms:item.category==='accessory'?ALL:INDOOR,zone:['wall','floor'].includes(item.category)?'finish':item.category==='rug'?'rug':'ground',size:item.category==='furniture'?28:item.category==='rug'?40:14},meta[item.id]||{},Object.fromEntries(['rooms','zone','size','artIndex'].filter(k=>Object.hasOwn(item,k)).map(k=>[k,item[k]])));
}
