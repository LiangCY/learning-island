import {PETS} from './companions.js';
import {COMPANION_ART} from './companion-art-data.js';
import {normalizeGomoku,playMove,undoMoves,boardFromMoves,gameResult,DIFFICULTIES,chooseMove,suggestMove} from './gomoku.js';
let portraitSequence=0;
export function partnerPortrait(id){
 const art=COMPANION_ART[id],frame=art.frames[id==='cat'?1:0],[x,y,w,h,W,H]=frame.window;
 const clipId='partner-portrait-'+(++portraitSequence),points=[...frame.clip.matchAll(/([\d.]+)% ([\d.]+)%/g)].map(([,a,b])=>`${x+w*Number(a)/100},${y+h*Number(b)/100}`).join(' ');
 return `<svg class="partner-face" viewBox="${x} ${y} ${w} ${h*.68}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><clipPath id="${clipId}"><polygon points="${points}"/></clipPath></defs><image href="${frame.src||art.src}" clip-path="url(#${clipId})" x="0" y="0" width="${W}" height="${H}"/></svg>`;
}
export function createGomokuUI({app,modal,game,go,toast,chime,isActive,onRouteChange}){
 const events=new AbortController();let state=game.read(),busy=false,thinking=false,hint=null,hintLoading=false,worker=null,job=0,fallbackTimer=null,focusPos=112,boardFocused=false,disposed=false;
 app.addEventListener('focusin',e=>{boardFocused=!!e.target.closest('[data-cell]');},{signal:events.signal});
 const restoreFocus=()=>{if(boardFocused)app.querySelector(`[data-cell="${focusPos}"]:not(:disabled)`)?.focus({preventScroll:true});};
 const result=()=>gameResult(state.moves);
 const turn=()=>state.moves.length%2+1;
 const aiTurn=()=>state.mode==='ai'&&turn()!==state.humanColor&&!result().winner&&!result().draw;
 const playerName=color=>PETS[color===1?state.blackPet:state.whitePet].name;
 function cancelWork(){job++;worker?.terminate();worker=null;clearTimeout(fallbackTimer);thinking=false;hintLoading=false;hint=null;}
 function request(type,callback){
  const id=++job,board=boardFromMoves(state.moves),player=turn();
  const receive=data=>{if(disposed||!isActive()||id!==job)return;if(data.error){thinking=false;hintLoading=false;toast('思考遇到了一点问题，请再试一次');render();return;}callback(data.value);};
  try{
   if(!worker)worker=new Worker(new URL('./gomoku-worker.js',import.meta.url),{type:'module'});
   worker.onmessage=e=>{if(e.data.id===id)receive(e.data);};
   worker.onerror=()=>{worker?.terminate();worker=null;fallbackTimer=setTimeout(()=>receive({value:type==='hint'?suggestMove(board,player):chooseMove(board,player,state.difficulty)}),30);};
   worker.postMessage({id,type,board,player,difficulty:state.difficulty});
  }catch{fallbackTimer=setTimeout(()=>receive({value:type==='hint'?suggestMove(board,player):chooseMove(board,player,state.difficulty)}),30);}
 }
 function afterTurn(){
  if(result().winner||result().draw)return;
  if(aiTurn()){
   const position=JSON.stringify(state);
   thinking=true;render();request('move',pos=>{thinking=false;if(pos!==null)commit(s=>JSON.stringify(s)===position?playMove(s,pos):s,true);});
  }else if(state.autoHint){hintLoading=true;renderHint();request('hint',value=>{hintLoading=false;hint=value;renderBoard();renderHint();});}
 }
 async function commit(change,nextTurn=false){
  if(busy)return false;busy=true;let saved=false;
  try{await game.update(change);saved=true;if(!isActive())return true;state=game.read();hint=null;render();if(result().winner)chime(true);else if(nextTurn)chime();return true;}
  catch(error){toast(error.message);state=game.read();render();return false;}
  finally{busy=false;if(isActive()){render();if(nextTurn&&saved)afterTurn();}}
 }
 function boardHTML(){
  const board=boardFromMoves(state.moves),outcome=result(),last=state.moves.at(-1);
  return `<svg class="goban-lines" viewBox="0 0 15 15" aria-hidden="true">${Array.from({length:15},(_,i)=>`<path d="M.5 ${i+.5}H14.5 M${i+.5} .5V14.5"/>`).join('')}${[3,7,11].flatMap(y=>[3,7,11].filter(x=>x===7&&y===7||x!==7&&y!==7).map(x=>`<circle cx="${x+.5}" cy="${y+.5}" r=".085"/>`)).join('')}</svg>${board.map((value,pos)=>`<button class="goban-point ${outcome.line.includes(pos)?'winning-stone':''}" data-cell="${pos}" aria-label="${String.fromCharCode(65+pos%15)}${Math.floor(pos/15)+1}${value?value===1?' 黑子':' 白子':' 空位'}${pos===hint?.pos?' 建议落点':''}" tabindex="${pos===focusPos?0:-1}" ${busy||thinking||outcome.winner||outcome.draw?'disabled':''}>${value?`<span class="gomoku-stone stone-${value===1?'black':'white'}">${state.showAvatars?partnerPortrait(value===1?state.blackPet:state.whitePet):''}${last===pos?'<i class="last-move" aria-hidden="true"></i>':''}</span>`:pos===hint?.pos?'<span class="move-hint" aria-hidden="true">✦</span>':'<span class="stone-ghost" aria-hidden="true"></span>'}</button>`).join('')}`;
 }
 function renderBoard(){const board=app.querySelector('#goban');if(board){board.innerHTML=boardHTML();bindBoard();restoreFocus();}}
 function renderHint(){const box=app.querySelector('#gomoku-hint');if(box)box.innerHTML=thinking?'<span>◌</span><p>伙伴正在认真想下一步…</p>':hintLoading?'<span>✧</span><p>正在观察棋盘，找一个好位置…</p>':hint?`<span>✦</span><p><strong>试试 ${String.fromCharCode(65+hint.pos%15)}${Math.floor(hint.pos/15)+1}</strong>${hint.reason}</p>`:'<span>✧</span><p>先观察，再落子。需要时，点「给我提示」。</p>';}
 function render(){
  const outcome=result(),over=outcome.winner||outcome.draw;
  app.innerHTML=`<div class="gomoku-game"><header class="play-header"><div><button class="text-btn" id="gomoku-back">← 游戏大厅</button><div class="eyebrow">FIVE LITTLE STONES</div><h1>伙伴五子棋</h1><p>一人一手，和喜欢的伙伴认真下一盘。</p></div><span class="gomoku-rule-badge">15 × 15 棋盘<br><strong>先连成五子就赢</strong></span></header><div class="gomoku-layout"><section class="gomoku-match"><div class="match-heading"><div><span class="landscape-label">A QUIET LITTLE MATCH</span><h2>${outcome.winner?playerName(outcome.winner)+'赢啦！':outcome.draw?'旗鼓相当的一局':thinking?'伙伴正在思考…':`轮到${turn()===1?'黑棋':'白棋'}落子`}</h2></div><div class="match-progress"><strong>${state.moves.length}</strong><span>手 · ${state.mode==='ai'?DIFFICULTIES[state.difficulty].name:'双人对弈'}</span></div></div><div class="gomoku-players">${[1,2].map(color=>`<div class="gomoku-player ${!over&&turn()===color?'active':''}"><span class="player-avatar">${partnerPortrait(color===1?state.blackPet:state.whitePet)}</span><div><strong>${playerName(color)}</strong><small><i class="color-dot ${color===1?'black':'white'}"></i>${color===1?'执黑 · 先手':'执白 · 后手'}${state.mode==='ai'?color===state.humanColor?' · 你':' · 电脑':''}</small></div>${!over&&turn()===color?'<span class="turn-dot"></span>':''}</div>`).join('')}</div><div class="goban-frame"><div class="goban-board" id="goban" role="group" aria-label="五子棋棋盘，方向键移动焦点，回车落子">${boardHTML()}</div><div class="goban-row-coordinates" aria-hidden="true">${Array.from({length:15},(_,i)=>`<span>${i+1}</span>`).join('')}</div><div class="goban-coordinates" aria-hidden="true">${Array.from({length:15},(_,i)=>`<span>${String.fromCharCode(65+i)}</span>`).join('')}</div></div><div class="gomoku-actions"><button class="secondary" id="gomoku-undo" ${busy||!state.moves.length||(state.mode==='ai'&&state.humanColor===2&&state.moves.length===1)?'disabled':''}>↶ 悔一步</button><button class="secondary" id="gomoku-tip" ${over||thinking||busy?'disabled':''}>✧ 给我提示</button><button class="primary" id="gomoku-new" ${busy?'disabled':''}>${over?'再来一局':'重新开局'}</button><span>${busy?'正在保存…':'✓ 棋局自动保存'}</span></div><div class="gomoku-hint" id="gomoku-hint" role="status"></div>${over?`<div class="match-result"><span>${outcome.winner?'✦':'◈'}</span><div><h3>${outcome.winner?'漂亮的连线，值得庆祝！':'这一盘，大家都很认真。'}</h3><p>${outcome.winner?(outcome.winner===1?'黑棋':'白棋')+'连成 '+outcome.line.length+' 子。':'棋盘已经填满，双方和棋。'} 可以悔一步复盘，也可以再来一局。</p></div></div>`:''}<p class="gomoku-footnote">黑棋先下，横、竖、斜任一方向连续五子或更多即获胜。本游戏采用自由规则，无禁手。</p></section><aside class="gomoku-settings"><span class="eyebrow">YOUR TABLE, YOUR WAY</span><h2>这一局，怎么下？</h2><label class="settings-label">对战方式</label><div class="mode-segment"><button data-gomoku-mode="ai" class="${state.mode==='ai'?'active':''}">人机对战</button><button data-gomoku-mode="local" class="${state.mode==='local'?'active':''}">双人对战</button></div>${state.mode==='ai'?`<label class="settings-label" for="gomoku-difficulty">伙伴棋力</label><select id="gomoku-difficulty">${Object.entries(DIFFICULTIES).map(([id,d])=>`<option value="${id}" ${state.difficulty===id?'selected':''}>${d.name}</option>`).join('')}</select><p class="difficulty-note">${DIFFICULTIES[state.difficulty].description}</p><label class="settings-label" for="gomoku-color">我来执哪一色？</label><select id="gomoku-color"><option value="1" ${state.humanColor===1?'selected':''}>黑棋 · 我先下</option><option value="2" ${state.humanColor===2?'selected':''}>白棋 · 伙伴先下</option></select>`:'<p class="difficulty-note">和身边的家人、朋友轮流落子，一起享受思考的乐趣。</p>'}<label class="settings-label">挑选你的伙伴</label>${[1,2].map(color=>`<div class="partner-picker"><span><i class="color-dot ${color===1?'black':'white'}"></i>${color===1?'黑棋伙伴':'白棋伙伴'}</span><div>${Object.entries(PETS).map(([id,pet])=>`<button data-pet-color="${color}" data-gomoku-pet="${id}" class="${(color===1?state.blackPet:state.whitePet)===id?'active':''}" aria-label="选择${pet.name}作为${color===1?'黑棋':'白棋'}伙伴" aria-pressed="${(color===1?state.blackPet:state.whitePet)===id}">${partnerPortrait(id)}<small>${pet.nickname}</small></button>`).join('')}</div></div>`).join('')}<div class="gomoku-toggles"><label><input id="gomoku-autohint" type="checkbox" ${state.autoHint?'checked':''}>自动提示<span>每轮给出建议与原因</span></label><label><input id="gomoku-avatars" type="checkbox" ${state.showAvatars?'checked':''}>棋子显示伙伴头像<span>始终保留清晰黑白底色</span></label></div><div class="gomoku-small-note">✧ 不用急，想清楚再下。<br>提示只是一个建议，你也可以尝试自己的想法。</div></aside></div></div>`;
  bind();renderHint();restoreFocus();onRouteChange({});
 }
 function bindBoard(){
  app.querySelectorAll('[data-cell]').forEach(button=>{
   button.onclick=()=>humanMove(Number(button.dataset.cell));
   button.onfocus=()=>{focusPos=Number(button.dataset.cell);};
   button.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const p=Number(button.dataset.cell),x=p%15,y=Math.floor(p/15);focusPos=Math.min(14,Math.max(0,y+(e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0)))*15+Math.min(14,Math.max(0,x+(e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0)));app.querySelectorAll('[data-cell]').forEach(b=>b.tabIndex=Number(b.dataset.cell)===focusPos?0:-1);app.querySelector(`[data-cell="${focusPos}"]`).focus({preventScroll:true});};
  });
 }
 function humanMove(pos){if(busy||thinking||aiTurn())return;if(state.moves.includes(pos)){toast('这个位置已经有棋子啦');return;}const position=JSON.stringify(state);focusPos=pos;cancelWork();commit(s=>JSON.stringify(s)===position?playMove(s,pos):s,true);}
 function startNew(patch={}){
  const start=()=>{cancelWork();commit(s=>normalizeGomoku({...s,...patch,moves:[]}),true);};
  if(!state.moves.length||result().winner||result().draw){start();return;}
  modal.classList.add('gomoku-modal');document.querySelector('#modal-content').innerHTML='<h2>开始新的一局？</h2><p>当前棋局会结束，伙伴和偏好设置会保留。</p><div class="dialog-actions"><button class="secondary" id="gomoku-cancel">继续这一局</button><button class="primary" id="gomoku-confirm">开始新局</button></div>';modal.showModal();
  document.querySelector('#gomoku-cancel').onclick=()=>{modal.close();render();};document.querySelector('#gomoku-confirm').onclick=()=>{modal.close();start();};
 }
 function bind(){
  bindBoard();app.querySelector('#gomoku-back').onclick=()=>go('games',{});
  app.querySelector('#gomoku-new').onclick=()=>startNew();
  app.querySelector('#gomoku-undo').onclick=()=>{cancelWork();commit(undoMoves,true);};
  app.querySelector('#gomoku-tip').onclick=()=>{hintLoading=true;renderHint();request('hint',value=>{hintLoading=false;hint=value;renderBoard();renderHint();});};
  app.querySelectorAll('[data-gomoku-mode]').forEach(b=>b.onclick=()=>{if(b.dataset.gomokuMode!==state.mode)startNew({mode:b.dataset.gomokuMode});});
  app.querySelector('#gomoku-difficulty')?.addEventListener('change',e=>startNew({difficulty:e.target.value}));
  app.querySelector('#gomoku-color')?.addEventListener('change',e=>startNew({humanColor:Number(e.target.value)}));
  app.querySelectorAll('[data-gomoku-pet]').forEach(b=>b.onclick=()=>{const patch=b.dataset.petColor==='1'?{blackPet:b.dataset.gomokuPet}:{whitePet:b.dataset.gomokuPet};cancelWork();commit(s=>({...s,...patch}),true);});
  app.querySelector('#gomoku-autohint').onchange=e=>{const autoHint=e.target.checked;cancelWork();commit(s=>({...s,autoHint}),true);};
  app.querySelector('#gomoku-avatars').onchange=e=>{const showAvatars=e.target.checked;cancelWork();commit(s=>({...s,showAvatars}),true);};
 }
 modal.addEventListener('close',()=>{modal.classList.remove('gomoku-modal');if(isActive())render();},{signal:events.signal});
 window.addEventListener('storage',e=>{if(isActive()&&e.key==='math-island-v1:games'&&!busy&&!modal.open){cancelWork();state=game.read();render();afterTurn();}},{signal:events.signal});
 return {openRoute:()=>{cancelWork();state=game.read();render();afterTurn();},routeParams:()=>({}),beforeLeave:()=>{if(busy){toast('正在保存棋局，请稍等一下。');return false;}return true;},dispose:()=>{disposed=true;cancelWork();events.abort();modal.classList.remove('gomoku-modal');}};
}
