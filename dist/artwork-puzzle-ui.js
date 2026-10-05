import {PUZZLE_LEVELS,puzzleLevel,puzzleComplete,createPuzzle,placePuzzlePiece,puzzleEdges,puzzlePiecePath} from './artwork-puzzle.js';
import {saveArtworkPuzzle} from './coloring.js';
import {coloringSVG,coloringCanvas,escapeText as esc} from './coloring-art.js';

class PuzzleStateError extends Error {}

export function createArtworkPuzzleUI({app,modal,read,history,transaction,isActive,toast,chime,onRouteChange,renderPicker,openTab,dialog}){
 const events=new AbortController();
 let chosen=null,level='medium',session=null,playing=false,imageURL=null,epoch=0,busy=false,failed=null,selected=null,ghost=false,reference=true,message='',drag=null,ignoreClickUntil=0;
 const art=(work,snapshot=false)=>`<div class="puzzle-art-thumb" data-puzzle-thumb="${esc(work.id)}" ${snapshot?'data-puzzle-snapshot':''}>${coloringSVG(work.boardId,work)}</div>`;
 const mark='<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M18 20H40C38 4 62 4 60 20H82V42C98 40 98 64 82 62V84H60C62 68 38 68 40 84H18V62C34 64 34 40 18 42Z" fill="currentColor"/></svg>';
 function picker(state){
  if(!state.works.some(work=>work.id===chosen))chosen=state.works[0]?.id||null;
  const work=state.works.find(work=>work.id===chosen),current=state.puzzles?.current,records=state.puzzles?.records||[];
  if(!work)return `<section class="puzzle-empty"><div class="puzzle-empty-mark">${mark}<span>✦</span></div><div class="eyebrow">A PICTURE YOU MADE, A PUZZLE TO PLAY</div><h2>把自己的画，拼回完整。</h2><p>先涂一幅喜欢的画，点「保存作品」。<br>你的颜色，就会变成可以反复玩的拼图。</p><div class="puzzle-empty-tags"><span>16 / 25 / 36 块</span><span>拖动或轻点都能拼</span><span>免费玩 · 自动保存</span></div><button class="primary" data-puzzle-create>去画第一幅作品 →</button>${current?`<button class="secondary" data-puzzle-resume>继续上次的拼图</button>`:''}</section>`;
  return `<section class="puzzle-picker"><div class="puzzle-section-title"><div><div class="eyebrow">PIECES OF YOUR IMAGINATION</div><h2>你的画，藏着另一种好玩。</h2><p>挑一幅亲手涂好的作品，让小色块找到自己的位置。</p></div><span class="puzzle-free">✦ 免费玩 · 不计时，慢慢拼</span></div>
   ${current&&!puzzleComplete(current)?`<div class="puzzle-resume">${art(current.artwork,true)}<div><strong>上次的小拼图，在这里等你。</strong><span>「${esc(current.artwork.name)}」· 已拼 ${current.placed.length} / ${puzzleLevel(current.level).size**2} 块</span></div><button class="secondary" data-puzzle-resume>继续拼 →</button></div>`:''}
   <div class="puzzle-setup"><div class="puzzle-selected-art">${art(work)}<span>MADE BY YOU</span></div><div class="puzzle-setup-copy"><span class="puzzle-small-label">今天拼这幅</span><h3>${esc(work.name)}</h3><p>沿着轮廓找一找，跟着颜色拼一拼。</p><fieldset class="puzzle-levels"><legend>想拼多少块？</legend>${PUZZLE_LEVELS.map(item=>`<button type="button" data-puzzle-level="${item.id}" aria-pressed="${level===item.id}" class="${level===item.id?'selected':''}"><span class="puzzle-level-grid" style="--grid:${item.size}" aria-hidden="true">${Array(item.size**2).fill('<i></i>').join('')}</span><strong>${item.name}</strong><small>${item.description.split(' · ')[0]}</small></button>`).join('')}</fieldset><button class="primary puzzle-start" data-puzzle-start>把这幅画变成拼图 →</button><p class="puzzle-setup-note">不会改变原作品 · 进度自动保存 · 三档都可以反复玩</p></div></div>
   <div class="puzzle-library-heading"><h3>从我的作品挑选 <small>${state.works.length}</small></h3>${records.length?`<span>已经完成 ${records.length} 次小拼图 ✧</span>`:''}</div><div class="puzzle-library">${state.works.map(work=>`<button class="puzzle-work ${work.id===chosen?'selected':''}" data-puzzle-work="${work.id}" aria-pressed="${work.id===chosen}" aria-label="选择作品：${esc(work.name)}">${art(work)}<span><strong>${esc(work.name)}</strong><i>${work.id===chosen?'✓ 已选':'选这幅'}</i></span></button>`).join('')}</div></section>`;
 }
 function bindPicker(){
  app.querySelector('[data-puzzle-create]')?.addEventListener('click',()=>openTab('shop'));
  app.querySelectorAll('[data-puzzle-level]').forEach(button=>button.onclick=()=>{level=button.dataset.puzzleLevel;renderPicker();});
  app.querySelectorAll('[data-puzzle-work]').forEach(button=>button.onclick=()=>{chosen=button.dataset.puzzleWork;renderPicker();});
  app.querySelector('[data-puzzle-start]')?.addEventListener('click',()=>begin(chosen,level));
  app.querySelectorAll('[data-puzzle-resume]').forEach(button=>button.onclick=()=>{const current=read().puzzles?.current;if(current)openPlay(current);});
  for(const node of app.querySelectorAll('[data-puzzle-thumb]')){
   const work=node.hasAttribute('data-puzzle-snapshot')?read().puzzles?.current?.artwork:read().works.find(work=>work.id===node.dataset.puzzleThumb);
   if(work?.effect==='pixel')coloringCanvas(work.boardId,work,240).then(canvas=>{if(node.isConnected)node.replaceChildren(canvas);}).catch(()=>{});
  }
 }
 function confirmReplace(callback){
  dialog('<h2>开启一幅新的拼图？</h2><p>会替换这一局的拼图进度。涂色作品和已完成的记录都会保留。</p><div class="dialog-actions"><button class="secondary" id="puzzle-keep">继续原来的</button><button class="primary" id="puzzle-replace">开始新拼图</button></div>');
  modal.querySelector('#puzzle-keep').onclick=()=>{modal.close();const current=read().puzzles?.current;if(current)openPlay(current);};
  modal.querySelector('#puzzle-replace').onclick=()=>{modal.close();callback();};
 }
 async function begin(workId,levelId,force=false,snapshot=null){
  if(busy||failed)return;
  const current=read().puzzles?.current;
  if(!force&&current&&!puzzleComplete(current)&&current.placed.length){confirmReplace(()=>begin(workId,levelId,true,snapshot));return;}
  const id=crypto.randomUUID();
  await execute(state=>{
   const work=snapshot||state.works.find(work=>work.id===workId);
   if(!work||!Object.keys(work.colors||{}).length)throw new PuzzleStateError('这幅作品已不存在或没有颜色，请重新选择一幅。');
   return saveArtworkPuzzle(state,history(),createPuzzle(work,levelId,{id}));
  },true);
 }
 function setBusy(value){
  busy=value;
  app.querySelectorAll('.artwork-puzzle button,.puzzle-picker button,.puzzle-empty button').forEach(button=>button.disabled=value);
  const status=app.querySelector('#puzzle-save-status');if(status)status.textContent=value?'正在保存…':'✓ 进度已保存';
 }
 async function execute(change,reopen=false,focus=null){
  if(busy)return;setBusy(true);failed=null;
  try{
   const state=await transaction(change);
   if(!isActive())return;
   session=state.puzzles.current;setBusy(false);
   if(reopen)await openPlay(session);else renderPlay(focus);
  }catch(error){
   if(!isActive())return;
   if(error instanceof PuzzleStateError){setBusy(false);toast(error.message);renderPicker();return;}
   setBusy(false);failed={change,reopen,focus};toast(error.message);
   const status=app.querySelector('#puzzle-save-status');if(status)status.textContent='这一步还未保存';
   const retry=app.querySelector('#puzzle-save-retry');if(retry)retry.hidden=false;
   if(!playing){renderPicker();app.querySelector('[data-puzzle-start]')?.insertAdjacentHTML('afterend','<button class="secondary" id="puzzle-picker-retry">重试保存</button>');app.querySelector('#puzzle-picker-retry').onclick=retrySave;}
  }
 }
 function retrySave(){if(failed){const action=failed;failed=null;execute(action.change,action.reopen,action.focus);}}
 async function openPlay(current){
  stop();session=current;playing=true;selected=null;message='先选一块，再轻点它的位置；也可以直接拖过去。';
  const version=epoch;renderPlay();onRouteChange(routeParams());window.scrollTo({top:0,behavior:'instant'});
  try{
   const canvas=await coloringCanvas(current.artwork.boardId,current.artwork,1200);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('图片生成失败');
   const url=URL.createObjectURL(blob);
   if(version!==epoch||!playing||!isActive()){URL.revokeObjectURL(url);return;}
   imageURL=url;renderPlay();
  }catch{
   if(version===epoch&&playing&&isActive()){
    app.querySelector('.puzzle-loading').innerHTML='<span>画作暂时没加载好</span><button class="secondary" id="puzzle-image-retry">重新加载画作</button>';
    app.querySelector('#puzzle-image-retry').onclick=()=>openPlay(session);
   }
  }
 }
 function pieceSVG(piece,{guide=false}={}){
  const size=puzzleLevel(session.level).size,row=Math.floor(piece/size),col=piece%size,path=puzzlePiecePath(puzzleEdges(session,piece));
  const clip='puzzle-'+session.id+'-'+piece+(guide?'-guide':'');
  return `<svg viewBox="-24 -24 148 148" aria-hidden="true" class="puzzle-piece-svg"><defs><clipPath id="${clip}"><path d="${path}"/></clipPath></defs><path d="${path}" class="puzzle-piece-paper"/><image href="${imageURL}" x="${-col*100}" y="${-row*100}" width="${size*100}" height="${size*100}" clip-path="url(#${clip})"/><path d="${path}" class="puzzle-piece-outline"/></svg>`;
 }
 function renderPlay(focus=null){
  if(!playing||!isActive())return;
  const size=puzzleLevel(session.level).size,count=size**2,complete=puzzleComplete(session),remaining=session.order.filter(piece=>!session.placed.includes(piece));
  app.innerHTML=`<div class="artwork-puzzle ${complete?'puzzle-is-complete':''}"><button class="text-btn" id="puzzle-back">← 选另一幅作品</button><header class="puzzle-play-heading"><div><div class="eyebrow"><span></span> MY ART, PIECE BY PIECE</div><h1>${esc(session.artwork.name)}</h1><p>${complete?'把自己的颜色，重新拼成了一个完整的小世界。':'不着急，每一块小颜色都会找到自己的家。'}</p></div><span class="puzzle-difficulty-badge">${puzzleLevel(session.level).name}<strong>${count} 块</strong></span></header>
   <div class="puzzle-play-layout"><section class="puzzle-table"><div class="puzzle-table-heading"><strong>${complete?'✦ 你拼好了自己的画！':'我的拼图桌'}</strong><span>${session.placed.length} / ${count} 块</span></div><div class="puzzle-progress"><span style="width:${session.placed.length/count*100}%"></span></div>
   <div class="puzzle-frame"><div class="puzzle-board ${ghost?'show-ghost':''}" style="--puzzle-grid:${size}" aria-label="${size} 行 ${size} 列拼图，已完成 ${session.placed.length} 块">${!imageURL?'<div class="puzzle-loading"><span class="puzzle-loading-symbol">✧</span><span>正在把你的颜色变成小拼图…</span></div>':complete?`<img class="puzzle-finished-image" src="${imageURL}" alt="拼好的作品：${esc(session.artwork.name)}"><div class="puzzle-sparkles" aria-hidden="true">${Array.from({length:12},(_,i)=>`<i style="--i:${i};left:${8+(i*17)%84}%;top:${4+(i*23)%88}%">${i%3?'✦':'✧'}</i>`).join('')}</div>`:`<img class="puzzle-ghost-image" src="${imageURL}" alt="" aria-hidden="true"><svg class="puzzle-seams" viewBox="0 0 ${size*100} ${size*100}" aria-hidden="true">${Array.from({length:count},(_,piece)=>`<path d="${puzzlePiecePath(puzzleEdges(session,piece))}" transform="translate(${piece%size*100} ${Math.floor(piece/size)*100})"/>`).join('')}</svg>${Array.from({length:count},(_,piece)=>{
    const style=`left:${piece%size/size*100}%;top:${Math.floor(piece/size)/size*100}%;width:${100/size}%;height:${100/size}%`;
    return session.placed.includes(piece)?`<span class="puzzle-placed" style="${style}">${pieceSVG(piece)}</span>`:`<button class="puzzle-slot" data-puzzle-slot="${piece}" style="${style}" aria-label="第 ${Math.floor(piece/size)+1} 行第 ${piece%size+1} 列，等待拼图"></button>`;
   }).join('')}`}</div></div>
   ${!complete?`<div class="puzzle-board-tools"><button class="secondary" id="puzzle-hint" ${!imageURL?'disabled':''}>✧ 帮我放一块</button><button class="text-btn" id="puzzle-ghost" aria-pressed="${ghost}">${ghost?'◉':'○'} 底图提示</button><span id="puzzle-save-status" role="status">✓ 进度已保存</span><button class="text-btn" id="puzzle-save-retry" hidden>重试保存</button></div><p class="puzzle-feedback" id="puzzle-feedback" role="status" aria-live="polite">${esc(message)}</p>`:'<p class="puzzle-complete-caption">每一块，都是你自己的灵感。</p>'}</section>
   <aside class="puzzle-side">${complete?`<section class="puzzle-celebration"><div class="puzzle-medal">${mark}<span>✦</span></div><span class="puzzle-small-label">MADE & SOLVED BY YOU</span><h2>小小拼图家，<br>这幅画又完成了一次。</h2><div class="puzzle-complete-stats"><div><strong>${count}</strong><span>块小拼图</span></div><div><strong>${session.moves}</strong><span>次尝试</span></div><div><strong>${session.hints}</strong><span>次小提示</span></div></div><button class="primary" id="puzzle-again">再拼一次，换个顺序 ↻</button><button class="secondary" id="puzzle-other">换一幅作品 →</button><button class="text-btn" id="puzzle-gallery">回到我的作品</button><p>涂色和拼图，都藏着你的认真。</p></section>`:`<section class="puzzle-tray-panel"><div class="puzzle-tray-heading"><h2>散落的小色块</h2><span>还剩 ${remaining.length} 块</span></div><p>找到熟悉的颜色，轻点或拖动它。</p><div class="puzzle-tray" aria-label="待拼图块">${imageURL?remaining.map((piece,index)=>`<button class="puzzle-piece ${piece===selected?'selected':''}" data-puzzle-piece="${piece}" aria-label="第 ${index+1} 块拼图，点击选择" aria-pressed="${piece===selected}" style="--tilt:${(piece*11)%7-3}deg">${pieceSVG(piece)}<span class="puzzle-piece-check" aria-hidden="true">✓</span></button>`).join(''):'<div class="puzzle-tray-placeholder">小色块马上就来…</div>'}</div><div class="puzzle-touch-tip"><span>☝</span><p>手机也可以：<br>先点一块，再点拼图桌上的位置。</p></div></section><details class="puzzle-reference" ${reference?'open':''}><summary>看看原图 <span>你的颜色就是线索 ↗</span></summary>${imageURL?`<img src="${imageURL}" alt="原作品：${esc(session.artwork.name)}">`:''}<p>这一局保留了开始时的画作，放心回画室继续创作。</p></details>`}</aside></div><p class="puzzle-local-note">拼图免费玩 · 原作品保持完整 · 进度保存在当前浏览器</p></div>`;
  bindPlay();if(focus)app.querySelector(focus)?.focus({preventScroll:true});
 }
 function bindPlay(){
  app.querySelector('#puzzle-back').onclick=()=>{if(beforeLeave())renderPicker();};
  if(puzzleComplete(session)){
   app.querySelector('#puzzle-again').onclick=()=>begin(session.artwork.id,session.level,true,session.artwork);
   app.querySelector('#puzzle-other').onclick=()=>renderPicker();app.querySelector('#puzzle-gallery').onclick=()=>openTab('gallery');return;
  }
  app.querySelector('#puzzle-save-retry').onclick=retrySave;
  app.querySelector('#puzzle-hint').onclick=()=>{
   const piece=selected??session.order.find(piece=>!session.placed.includes(piece));if(piece!==undefined)place(piece,piece,true,'#puzzle-hint');
  };
  app.querySelector('#puzzle-ghost').onclick=event=>{ghost=!ghost;event.currentTarget.setAttribute('aria-pressed',String(ghost));event.currentTarget.textContent=(ghost?'◉':'○')+' 底图提示';app.querySelector('.puzzle-board').classList.toggle('show-ghost',ghost);};
  app.querySelector('.puzzle-reference').ontoggle=event=>{reference=event.currentTarget.open;};
  app.querySelectorAll('[data-puzzle-piece]').forEach(button=>{
   button.onclick=event=>{
    if(event.detail&&performance.now()<ignoreClickUntil||busy||failed)return;
    selected=Number(button.dataset.puzzlePiece);refreshSelection();
    if(event.detail&&innerWidth<=700)app.querySelector('.puzzle-board')?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
   };
   button.onpointerdown=event=>startDrag(event,button);
  });
  app.querySelectorAll('[data-puzzle-slot]').forEach(button=>button.onclick=event=>{
   if(selected===null){message='先在右边或下方选一块，再点它的位置。';refreshSelection();return;}
   place(selected,Number(button.dataset.puzzleSlot),false,event.detail===0?'[data-puzzle-piece]':null);
  });
 }
 function refreshSelection(){
  app.querySelectorAll('[data-puzzle-piece]').forEach(button=>{const active=Number(button.dataset.puzzlePiece)===selected;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});
  app.querySelector('.puzzle-board')?.classList.toggle('has-selection',selected!==null);
  if(selected!==null)message='选好啦！轻点它的位置，或把这块拖过去。';
  const feedback=app.querySelector('#puzzle-feedback');if(feedback)feedback.textContent=message;
 }
 async function place(piece,slot,hint=false,focus=null){
  if(busy||failed||!playing||!imageURL)return;
  const id=session.id;let correct=false;
  await execute(state=>{
   const current=state.puzzles?.current;if(current?.id!==id)throw new PuzzleStateError('另一页已经切换了拼图，请重新选择或继续最新的拼图。');
   const result=placePuzzlePiece(current,piece,slot,{hint});correct=result.correct;
   return saveArtworkPuzzle(state,history(),result.session);
  },false,focus);
  if(failed||!playing)return;
  if(correct){selected=null;message=hint?'小提示帮你放好了一块，接着找下一块吧。':'啪嗒！又一块小颜色找到家了。';chime(puzzleComplete(session));}
  else message='再看看颜色和凹凸轮廓，这块还没找到自己的家。';
  if(!puzzleComplete(session)){
   const feedback=app.querySelector('#puzzle-feedback');if(feedback)feedback.textContent=message;
   const board=app.querySelector('.puzzle-board');board.classList.add(correct?'puzzle-fit':'puzzle-miss');
   board.addEventListener('animationend',()=>board.classList.remove('puzzle-fit','puzzle-miss'),{once:true});
  }
 }
 function startDrag(event,button){
  if(busy||failed||event.button!==0||!playing)return;
  drag={pointer:event.pointerId,piece:Number(button.dataset.puzzlePiece),button,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,moved:false,node:null,scrollFrame:0};
  button.setPointerCapture(event.pointerId);
 }
 function moveDrag(event){
  if(!drag||event.pointerId!==drag.pointer)return;
  drag.x=event.clientX;drag.y=event.clientY;
  if(!drag.moved&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>6){
   drag.moved=true;selected=drag.piece;refreshSelection();
   const node=document.createElement('div'),rect=app.querySelector('.puzzle-board').getBoundingClientRect();
   node.className='puzzle-drag-ghost';node.innerHTML=pieceSVG(drag.piece,{guide:true});node.style.width=rect.width/puzzleLevel(session.level).size*1.48+'px';document.body.append(node);drag.node=node;
   drag.button.classList.add('being-dragged');autoScrollDrag();
  }
  if(drag.moved){event.preventDefault();drag.node.style.left=event.clientX+'px';drag.node.style.top=event.clientY+'px';}
 }
 function autoScrollDrag(){
  if(!drag?.moved)return;
  const dy=drag.y<70?-Math.min(12,(70-drag.y)/4):drag.y>innerHeight-70?Math.min(12,(drag.y-innerHeight+70)/4):0;
  if(dy)window.scrollBy(0,dy);
  drag.scrollFrame=requestAnimationFrame(autoScrollDrag);
 }
 function endDrag(event){
  if(!drag||event.pointerId!==drag.pointer)return;
  const current=drag,moved=current.moved;cleanupDrag();if(!moved)return;
  ignoreClickUntil=performance.now()+250;
  const rect=app.querySelector('.puzzle-board')?.getBoundingClientRect();if(!rect)return;
  if(event.clientX>=rect.left&&event.clientX<rect.right&&event.clientY>=rect.top&&event.clientY<rect.bottom){
   const size=puzzleLevel(session.level).size,col=Math.floor((event.clientX-rect.left)/rect.width*size),row=Math.floor((event.clientY-rect.top)/rect.height*size);
   place(current.piece,row*size+col);
  }else{message='没关系，选好一块后，也可以直接轻点它的位置。';const feedback=app.querySelector('#puzzle-feedback');if(feedback)feedback.textContent=message;}
 }
 function cleanupDrag(){if(!drag)return;cancelAnimationFrame(drag.scrollFrame);drag.node?.remove();drag.button.classList.remove('being-dragged');if(drag.button.hasPointerCapture(drag.pointer))drag.button.releasePointerCapture(drag.pointer);drag=null;}
 function stop(){epoch++;playing=false;cleanupDrag();if(imageURL)URL.revokeObjectURL(imageURL);imageURL=null;}
 function beforeLeave(){if(busy||failed){toast(failed?'这一步还未保存，请点「重试保存」。':'拼图正在保存，请稍等一下。');return false;}return true;}
 function routeParams(){return playing&&session?{session:session.id}:{...(chosen?{work:chosen}:{}),level};}
 function openRoute(params){
  if(params.session){
   const current=read().puzzles?.current;
   if(current?.id===params.session){openPlay(current);return;}
   if(current?.level==='expert'&&current.id===params.session.slice(0,75)+'-6x6'){
    toast('3×3 已升级为 6×6，保留原画作，开始新的 36 块拼图。');openPlay(current);return;
   }
   toast('这局拼图已不存在，请重新选择或继续最新的拼图。');
  }
  chosen=params.work||chosen;level=puzzleLevel(params.level||level).id;renderPicker();
 }
 function handleStorage(){
  if(!playing||busy||failed)return;
  const current=read().puzzles?.current;
  if(current?.id!==session.id){toast('另一页已经换了新拼图，这里回到作品选择。');renderPicker();return;}
  if(JSON.stringify(current)!==JSON.stringify(session)){session=current;selected=null;renderPlay();}
 }
 window.addEventListener('pointermove',moveDrag,{signal:events.signal,passive:false});
 window.addEventListener('pointerup',endDrag,{signal:events.signal});
 window.addEventListener('pointercancel',cleanupDrag,{signal:events.signal});
 window.addEventListener('beforeunload',event=>{if(busy||failed){event.preventDefault();event.returnValue='';}},{signal:events.signal});
 return {picker,bindPicker,openRoute,routeParams,beforeLeave,stop,handleStorage,isPlaying:()=>playing,choose:id=>{chosen=id;},dispose:()=>{stop();events.abort();}};
}
