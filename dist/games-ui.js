import {GAME_REGISTRY} from './game-catalog.js';
import {createGamePlatform,createGameHost} from './game-platform.js';
import {INITIAL_GAME_COINS,COINS_PER_ANSWER} from './game-wallet.js';

const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createGamesUI(context){
 const {app,storage,history,go,getView,toast,onRouteChange=()=>{}}=context;
 const platform=createGamePlatform({storage,history,registry:GAME_REGISTRY});
 const host=createGameHost({registry:GAME_REGISTRY,platform,context,renderLobby,onRouteChange,toast});
 function renderLobby(){
  const wallet=platform.wallet();
  app.innerHTML=`<div class="games-page games-lobby"><section class="games-intro"><div><div class="eyebrow"><span></span> A LITTLE PLAY, A NEW ADVENTURE</div><h1>认真学，<span class="lobby-title-play">也要开心玩。</span></h1><p>今天想玩什么？选一扇门，开启你的小小冒险。</p></div><div class="game-wallet"><span>我的游戏币</span><strong><span class="game-coin" aria-hidden="true">✦</span> ${wallet.balance}</strong><button class="text-btn" id="game-earn">答题赚币 ↗</button></div></section><div class="game-rule"><span>✦ 初始赠送 ${INITIAL_GAME_COINS} 币</span><span>每填答 1 题 +${COINS_PER_ANSWER} 币，交卷后到账</span><span>游戏币在游戏乐园通用</span></div><section class="game-lobby-heading"><h2>挑一个喜欢的游戏</h2><span>${GAME_REGISTRY.list().length} 个游戏 · 慢慢玩，开心就好</span></section><div class="game-directory">${GAME_REGISTRY.list().map(game=>`<article class="game-entry"><div class="game-entry-art" aria-hidden="true"><span>${esc(game.icon||'✦')}</span><i>✧</i><i>✦</i><i>○</i></div><div class="game-entry-copy"><span class="game-kicker">${esc(game.category||'小游戏')}</span><h3>${esc(game.name)}</h3><p>${esc(game.description||'')}</p><ul>${(game.features||[]).map(feature=>`<li>${esc(feature)}</li>`).join('')}</ul><button class="primary" data-open-game="${game.id}">进入${esc(game.name)} →</button></div></article>`).join('')}</div><p class="game-local-note">游戏进度保存在当前浏览器，随时回来继续你的小小冒险。</p></div>`;
  app.querySelector('#game-earn').onclick=()=>go('home');
  app.querySelectorAll('[data-open-game]').forEach(button=>button.onclick=()=>go('games',{game:button.dataset.openGame}));
 }
 window.addEventListener('storage',event=>{
  if(getView()==='games'&&['math-island-v1:games','math-island-v1:history'].includes(event.key))host.refresh();
 });
 window.addEventListener('beforeunload',event=>{
  if(platform.isPending()){event.preventDefault();event.returnValue='';}
 });
 return {...host,render:()=>host.openRoute({})};
}
