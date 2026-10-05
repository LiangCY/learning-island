import {createGardenUI,createAquariumUI} from './decor-ui.js';
import {normalizeDecor} from './decor.js';
import {createGomokuUI} from './gomoku-ui.js';
import {normalizeGomoku} from './gomoku.js';
import {createGameRegistry} from './game-platform.js';
import {normalizeGames} from './coloring.js';
import {createColoringUI} from './coloring-ui.js';

export const GAME_REGISTRY=createGameRegistry([
 {id:'garden',name:'花园小园丁',category:'自由造园',icon:'❋',cover:'garden',description:'种一片花，摆一张长椅，亲手布置属于你的秘密花园。',features:['36 种花木与庭院好物','自由摆放 · 白天与黄昏'],normalize:value=>normalizeDecor(value,'garden'),createUI:createGardenUI},
 {id:'aquarium',name:'欢乐水族馆',category:'水中小世界',icon:'≈',cover:'aquarium',description:'把喜欢的游鱼、水草和小城堡，装进一片会呼吸的海。',features:['20 种水中伙伴 · 52 款收藏','海水与淡水 · 多缸独立装扮'],normalize:value=>normalizeDecor(value,'aquarium'),createUI:createAquariumUI},
 {id:'gomoku',name:'伙伴五子棋',category:'思考与对弈',icon:'◈',cover:'gomoku',description:'和小伙伴一人一手，发现黑白之间藏着的巧妙连线。',features:['人机三档难度 · 双人对战','伙伴头像棋子 · 自动提示'],normalize:normalizeGomoku,createUI:createGomokuUI},
 {
  id:'coloring',name:'涂色小画室',category:'创意绘画',icon:'✎',
  description:'选个颜色，轻点色块，把天马行空的想象变成自己的作品。',
  features:['画板买一次，永久畅涂','自己的作品可拼图、收藏、挂到小屋'],
  legacy:true,normalize:normalizeGames,
  purchases:state=>[
   ...state.purchases.map(p=>({id:'board-'+p.boardId,paid:p.paid})),
   ...state.framePurchases.map(p=>({id:'frame-'+p.frameId,paid:p.paid}))
  ],
  createUI:createColoringUI
 }
]);
