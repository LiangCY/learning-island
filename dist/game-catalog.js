import {createGameRegistry} from './game-platform.js';
import {normalizeGames} from './coloring.js';
import {createColoringUI} from './coloring-ui.js';

export const GAME_REGISTRY=createGameRegistry([
 {
  id:'coloring',name:'涂色小画室',category:'创意绘画',icon:'✎',
  description:'选个颜色，轻点色块，把天马行空的想象变成自己的作品。',
  features:['画板买一次，永久畅涂','作品可收藏、下载、挂到小屋'],
  legacy:true,normalize:normalizeGames,
  purchases:state=>[
   ...state.purchases.map(p=>({id:'board-'+p.boardId,paid:p.paid})),
   ...state.framePurchases.map(p=>({id:'frame-'+p.frameId,paid:p.paid}))
  ],
  createUI:createColoringUI
 }
]);
