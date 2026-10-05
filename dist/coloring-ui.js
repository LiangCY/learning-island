import {createArtworkPuzzleUI} from './artwork-puzzle-ui.js';
import {createArtWallUI} from './art-wall-ui.js';
import {BOARDS,BOARD_BY_ID,BOARD_CATEGORIES,RETIRED_BOARDS} from './coloring-boards.js';
import {SOLID_COLORS,GRADIENTS,PAINT_BY_ID,EFFECTS,normalizeDrawing,purchaseBoard,saveDrawing,saveArtwork,deleteArtwork,drawingProgress} from './coloring.js';
import {coloringSVG,coloringCanvas,escapeText as esc} from './coloring-art.js';

export function createColoringUI({app,modal,storage,game,history,isActive,go,visitRoom,onRouteChange=()=>{},toast,chime}){
 const events=new AbortController();
 let tab='shop',category='全部画板',ownedOnly=false,editor=null,paint='#a774db',eraser=false,undo=[],redo=[],revision=0,pending=0,saveFailed=false;
 const read=()=>game.read();
 const wallUI=createArtWallUI({app,modal,read,history,wallet:game.wallet,transaction,dialog,render,visitRoom,toast,navigate:next=>{if(next==='earn'){go('home');return;}tab=next;render();}});
 const isEditor=()=>isActive()&&!!app.querySelector('#coloring-stage');
 const puzzleUI=createArtworkPuzzleUI({app,modal,read,history,transaction,isActive:()=>isActive()&&tab==='puzzle',toast,chime,onRouteChange:params=>onRouteChange({tab:'puzzle',...params}),renderPicker:()=>{tab='puzzle';render();},openTab:switchTab,dialog});
 function switchTab(next){if(beforeLeave()){tab=next;render();}}
 const coin=n=>`<span class="game-coin" aria-hidden="true">✦</span> ${n}`;
 function transaction(change){
  pending++;
  return game.update(change).finally(()=>{pending--;});
 }
 function preview(b,drawing,index){return `<div class="board-preview preview-${index%4}">${coloringSVG(b.id,drawing)}${drawing?.effect==='pixel'?'<span class="pixel-preview" data-pixel="'+esc(drawing.id||b.id)+'"></span>':''}</div>`;}
 function pixelPreviews(works){
  for(const w of works.filter(w=>w.effect==='pixel')){const target=app.querySelector(`[data-pixel="${w.id}"]`);if(target)coloringCanvas(w.boardId,w,480).then(c=>{if(target.isConnected)target.replaceChildren(c);}).catch(()=>{});}
 }
 function render(){
  puzzleUI.stop();
  editor=null;undo=[];redo=[];saveFailed=false;
  const state=read(),wallet=game.wallet(),owned=new Set(state.purchases.map(p=>p.boardId));
  app.innerHTML=`<div class="games-page"><button class="text-btn game-lobby-back" id="game-lobby">← 游戏大厅</button><section class="games-intro"><div><div class="eyebrow"><span></span> A LITTLE PLAY, A LOT OF COLOR</div><h1>认真学，也要开心玩。</h1><p>把练习收获的游戏币，变成自己的小小创作。</p></div><div class="game-wallet"><span>我的游戏币</span><strong>${coin(wallet.balance)}</strong><button class="text-btn" id="game-earn">答题赚币 ↗</button></div></section>
  <div class="game-tabs coloring-tabs" aria-label="画室页面"><button data-game-tab="shop" class="${tab==='shop'?'active':''}" aria-pressed="${tab==='shop'}">画板商店 <small>${BOARDS.length}</small></button><button data-game-tab="gallery" class="${tab==='gallery'?'active':''}" aria-pressed="${tab==='gallery'}">我的作品 <small>${state.works.length}</small></button><button data-game-tab="wall" class="${tab==='wall'?'active':''}" aria-pressed="${tab==='wall'}">作品展示墙</button><button data-game-tab="frames" class="${tab==='frames'?'active':''}" aria-pressed="${tab==='frames'}">画框商店</button><button data-game-tab="puzzle" class="${tab==='puzzle'?'active':''}" aria-pressed="${tab==='puzzle'}">作品拼图</button><span>游戏币独立于小屋叶子币 · 历史填答也计入</span></div>
  ${tab==='shop'?`<div class="board-filters"><div>${BOARD_CATEGORIES.map(c=>`<button class="${category===c?'active':''}" data-category="${c}" aria-pressed="${category===c}">${c}</button>`).join('')}</div><button id="owned-boards" class="${ownedOnly?'active':''}" aria-pressed="${ownedOnly}">✓ 只看已拥有（${owned.size}）</button></div><div class="board-grid">${[...BOARDS,...RETIRED_BOARDS.filter(b=>owned.has(b.id))].filter(b=>(category==='全部画板'||b.category===category)&&(!ownedOnly||owned.has(b.id))).sort((a,b)=>Number(owned.has(a.id))-Number(owned.has(b.id))||a.price-b.price).map((b,i)=>`<article class="board-card"><button class="board-open" data-board="${b.id}" aria-label="${owned.has(b.id)?'开始涂色':'预览画板'}：${b.name}">${preview(b,{},i)}<span class="board-badge">${owned.has(b.id)?'✓ 已拥有':b.category}</span></button><div class="board-caption"><h3>${b.name}</h3><p>${b.regions.length} 个色块 · ${b.description}</p><button data-board="${b.id}" class="board-cta ${owned.has(b.id)?'owned':''}">${owned.has(b.id)?state.drafts[b.id]&&Object.keys(state.drafts[b.id].colors).length?'继续涂色 →':'开始涂色 →':`解锁画板 <strong>${coin(b.price)}</strong>`}</button></div></article>`).join('')||'<div class="game-empty"><span>✎</span><h2>这里还没有画板</h2><p>试试其他分类，或用初始游戏币解锁一张。</p></div>'}</div>`:tab==='gallery'?gallery(state):tab==='wall'?wallUI.wall(state):tab==='puzzle'?puzzleUI.picker(state):wallUI.shop(state)}
  <p class="game-local-note">画板、画框、草稿、作品和上墙布置保存在当前浏览器。喜欢的作品记得下载一份，留住你的灵感。</p></div>`;
  app.querySelector('#game-lobby').onclick=()=>go('games',{});
  app.querySelector('#game-earn').onclick=()=>go('home');
  app.querySelectorAll('[data-game-tab]').forEach(b=>b.onclick=()=>switchTab(b.dataset.gameTab));
  app.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;render();});
  app.querySelector('#owned-boards')?.addEventListener('click',()=>{ownedOnly=!ownedOnly;render();});
  app.querySelectorAll('[data-board]').forEach(b=>b.onclick=()=>selectBoard(b.dataset.board));
  app.querySelectorAll('[data-edit-work]').forEach(b=>b.onclick=()=>{const w=read().works.find(w=>w.id===b.dataset.editWork);if(w)openEditor(w.boardId,w);});
  app.querySelectorAll('[data-download-work]').forEach(b=>b.onclick=()=>download(read().works.find(w=>w.id===b.dataset.downloadWork),b));
  app.querySelectorAll('[data-delete-work]').forEach(b=>b.onclick=()=>deleteWork(b.dataset.deleteWork));
  app.querySelector('#gallery-shop')?.addEventListener('click',()=>{tab='shop';render();});pixelPreviews(state.works);wallUI.bind(state);
  if(tab==='puzzle')puzzleUI.bindPicker();
  app.querySelectorAll('[data-puzzle-from-work]').forEach(b=>b.onclick=()=>{puzzleUI.choose(b.dataset.puzzleFromWork);switchTab('puzzle');});
  onRouteChange(routeParams());
 }
 function gallery(state){return state.works.length?`<div class="board-grid gallery-grid">${state.works.map((w,i)=>`<article class="board-card"><button class="board-open" data-edit-work="${w.id}" aria-label="继续编辑：${esc(w.name)}">${preview(BOARD_BY_ID[w.boardId],w,i)}</button><div class="board-caption"><h3>${esc(w.name)}</h3><p>${EFFECTS.find(e=>e.id===w.effect).name} · ${w.date?new Date(w.date).toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'}):'已收藏'}</p><div class="work-actions"><button class="text-btn" data-puzzle-from-work="${w.id}">拼成拼图</button><button class="text-btn" data-hang-work="${w.id}">装框上墙</button><button class="text-btn" data-edit-work="${w.id}">继续创作</button><button class="text-btn" data-download-work="${w.id}">下载 PNG</button><button class="text-btn" data-delete-work="${w.id}" aria-label="删除作品：${esc(w.name)}">删除</button></div></div></article>`).join('')}</div>`:`<div class="game-empty"><span>▧</span><h2>第一幅作品，等你来画。</h2><p>涂好喜欢的画板，点「保存作品」，就会收藏在这里。</p><button class="primary" id="gallery-shop">去挑一张画板</button></div>`;}
 function dialog(content){modal.classList.add('coloring-modal');document.querySelector('#modal-content').innerHTML=content;modal.showModal();}
 modal.addEventListener('close',()=>{modal.classList.remove('coloring-modal');if(!modal.open&&isActive()&&!isEditor()&&!puzzleUI.isPlaying())render();},{signal:events.signal});
 function selectBoard(id){
  const state=read(),b=BOARD_BY_ID[id];if(state.purchases.some(p=>p.boardId===id)){openEditor(id);return;}
  const balance=game.wallet().balance,enough=balance>=b.price;
  dialog(`${preview(b,{},0)}<h2>${b.name}</h2><p>${b.description}<br>${b.regions.length} 个可涂色区域 · 解锁后可反复创作</p><div class="purchase-summary"><strong>${coin(b.price)} 游戏币</strong><span>余额 ${balance} 币${enough?` · 购买后剩 ${balance-b.price} 币`:` · 还差 ${b.price-balance} 币`}</span></div><div class="dialog-actions"><button class="secondary" id="buy-cancel">再看看</button><button class="primary" id="buy-board">${enough?'购买并开始涂色':'去答题赚币'}</button></div>`);
  document.querySelector('#buy-cancel').onclick=()=>modal.close();
  document.querySelector('#buy-board').onclick=async e=>{if(!enough){modal.close();go('home');return;}const button=e.currentTarget;button.disabled=true;try{await transaction(s=>purchaseBoard(s,history(),id));modal.close();chime();openEditor(id);toast('画板已解锁，开始你的创作吧！');}catch(err){toast(err.message);button.disabled=false;}};
 }
 function openEditor(id,work,restore=false){
  const state=read();if(!state.purchases.some(p=>p.boardId===id)){selectBoard(id);return;}
  const context=storage.read('game-editor',null),draft=restore&&context?.boardId===id&&context?.workId===(work?.id||null)?state.drafts[id]:null;
  if(!restore)storage.remove('game-editor');
  const drawing=draft||work||state.drafts[id];
  editor={...normalizeDrawing(drawing,id),workId:work?.id||null,name:drawing?.name||BOARD_BY_ID[id].name};undo=[];redo=[];eraser=false;revision++;saveFailed=false;renderEditor();window.scrollTo({top:0,behavior:'instant'});
 }
 function renderEditor(){
  const b=BOARD_BY_ID[editor.boardId];
  app.innerHTML=`<div class="coloring-editor"><div class="editor-heading"><div><button class="text-btn game-lobby-back" id="game-lobby">← 游戏大厅</button><br><button class="text-btn" id="studio-back">← 返回画室</button><h1>${b.name}</h1><p>先选颜色，再轻点画面里的色块。</p></div><div class="editor-save"><button class="secondary" id="download-painting">下载 PNG</button><button class="primary" id="save-painting">${editor.workId?'更新作品':'保存作品'}</button></div></div><div class="studio-layout"><section class="canvas-panel"><div class="canvas-top"><span>✎ 我的涂色板</span><span id="paint-progress"></span></div><div class="coloring-stage" id="coloring-stage"></div><div class="canvas-toolbar"><div><button class="secondary" id="paint-undo" title="撤销（Ctrl / ⌘ Z）">↶ 撤销</button><button class="secondary" id="paint-redo" title="重做（Ctrl / ⌘ Shift Z）">↷ 重做</button><button class="text-btn" id="paint-clear">清空颜色</button></div><div class="draft-feedback"><span id="draft-status" role="status">草稿自动保存</span><button class="text-btn" id="retry-draft" hidden>重试保存草稿</button></div></div><div class="canvas-caption"><label for="painting-name">作品名</label><input id="painting-name" maxlength="40" value="${esc(editor.name)}" placeholder="给作品起个名字">${editor.workId?'<button class="text-btn" id="save-copy">另存一幅</button>':''}</div></section><aside class="paint-sidebar"><section class="palette-panel"><div class="paint-section-heading"><h2>我的调色盘</h2><span id="selected-paint" data-current-paint></span></div><div class="paint-tools"><button id="paint-brush" class="active" aria-pressed="true">◉ 填色笔</button><button id="paint-eraser" aria-pressed="false">▱ 橡皮擦</button></div><h3>${SOLID_COLORS.length} 种灵感色</h3><div class="paint-palette" aria-label="纯色调色盘">${SOLID_COLORS.map(c=>`<button class="paint-swatch" data-paint="${c.id}" style="--swatch:${c.css}" aria-label="${c.name} ${c.id}" title="${c.name}" aria-pressed="false"></button>`).join('')}</div><h3>一点渐变魔法 <small>8 色</small></h3><div class="gradient-palette" aria-label="渐变调色盘">${GRADIENTS.map(c=>`<button class="gradient-swatch" data-paint="${c.id}" aria-label="${c.name}" aria-pressed="false"><span style="background:${c.css}"></span><small>${c.name}</small></button>`).join('')}</div></section><section class="effects-panel"><div class="paint-section-heading"><h2>给作品加点风格</h2><span>随时可换</span></div><div class="paint-effects">${EFFECTS.map(e=>`<button data-effect="${e.id}" title="${e.description}" aria-pressed="false"><span>${e.icon}</span>${e.name}</button>`).join('')}</div><p id="effect-description"></p></section></aside></div><div class="mobile-paintbar" aria-label="随手调色盘"><div class="mobile-paintbar-head"><strong data-current-paint></strong><span>左右滑动选颜色 →</span><button id="mobile-eraser" aria-pressed="false">橡皮擦</button><button id="mobile-undo">↶ 撤销</button></div><div class="mobile-swatches">${[...SOLID_COLORS,...GRADIENTS].map(c=>`<button class="paint-swatch" data-paint="${c.id}" style="--swatch:${c.css}" aria-label="随手调色：${c.name}" aria-pressed="false" title="${c.name}"></button>`).join('')}</div></div><p class="game-local-note">小提示：白色也算一种颜色。橡皮擦可还原色块，Tab + Enter 也能填色；撤销最多保留 80 步。</p></div>`;
  app.querySelector('#game-lobby').onclick=()=>go('games',{});
  app.querySelector('#retry-draft').onclick=()=>persistDraft();
  app.querySelector('#studio-back').onclick=()=>{if(beforeLeave())render();};
  app.querySelector('#save-painting').onclick=e=>saveWork(e.currentTarget,false);
  app.querySelector('#save-copy')?.addEventListener('click',e=>saveWork(e.currentTarget,true));
  app.querySelector('#download-painting').onclick=e=>download({...editor,name:editor.name},e.currentTarget);
  app.querySelector('#painting-name').oninput=e=>{editor.name=e.target.value;revision++;persistDraft();};
  app.querySelectorAll('[data-paint]').forEach(b=>b.onclick=()=>{paint=b.dataset.paint;eraser=false;updateTools();});
  app.querySelector('#mobile-eraser').onclick=()=>{eraser=!eraser;updateTools();};app.querySelector('#mobile-undo').onclick=()=>undoPaint();
  app.querySelector('#paint-brush').onclick=()=>{eraser=false;updateTools();};app.querySelector('#paint-eraser').onclick=()=>{eraser=true;updateTools();};
  app.querySelectorAll('[data-effect]').forEach(b=>b.onclick=()=>{if(editor.effect!==b.dataset.effect)change({...editor,effect:b.dataset.effect});});
  app.querySelector('#paint-undo').onclick=()=>undoPaint();app.querySelector('#paint-redo').onclick=()=>redoPaint();
  app.querySelector('#paint-clear').onclick=()=>{if(!Object.keys(editor.colors).length)return;dialog('<h2>让画板重新变白？</h2><p>会清空这张草稿的颜色。已收藏的作品保留，也可以用撤销找回。</p><div class="dialog-actions"><button class="secondary" id="clear-cancel">保留颜色</button><button class="primary" id="clear-confirm">清空颜色</button></div>');document.querySelector('#clear-cancel').onclick=()=>modal.close();document.querySelector('#clear-confirm').onclick=()=>{modal.close();change({...editor,colors:{}});};};
  const stage=app.querySelector('#coloring-stage');stage.onclick=e=>fill(e.target.closest('[data-region]')?.dataset.region);stage.onkeydown=e=>{if(['Enter',' '].includes(e.key)&&e.target.dataset.region){e.preventDefault();fill(e.target.dataset.region);}};
  updateCanvas();updateTools();
  onRouteChange(routeParams());
 }
 function fill(id){if(!id)return;const colors={...editor.colors};if(eraser){if(!colors[id])return;delete colors[id];}else{if(colors[id]===paint)return;colors[id]=paint;}change({...editor,colors},id);}
 function snapshot(){return {...editor,colors:{...editor.colors}};}
 function change(next,focus){undo.push(snapshot());if(undo.length>80)undo.shift();redo=[];editor=next;afterChange(focus);}
 function undoPaint(){if(!undo.length)return;redo.push(snapshot());const old=undo.pop();editor={...old,name:editor.name,workId:editor.workId};afterChange();}
 function redoPaint(){if(!redo.length)return;undo.push(snapshot());const next=redo.pop();editor={...next,name:editor.name,workId:editor.workId};afterChange();}
 function afterChange(focus){revision++;updateCanvas(focus);updateTools();persistDraft();}
 function persistDraft(){
  const drawing=snapshot(),version=revision;status('正在保存草稿…');
  return transaction(s=>{const next=saveDrawing(s,history(),drawing);if(!storage.write('game-editor',{boardId:drawing.boardId,workId:drawing.workId}))throw Error('草稿编辑信息保存失败，请重试。');return next;}).then(()=>{if(version===revision){saveFailed=false;status('✓ 草稿已保存');}return true;}).catch(err=>{if(version===revision){saveFailed=true;status('草稿未保存，请下载备份');}toast(err.message);return false;});
 }
 function status(text){if(isEditor()){app.querySelector('#draft-status').textContent=text;app.querySelector('#retry-draft').hidden=!saveFailed;}}
 function updateTools(){
  if(!isEditor())return;
  app.querySelectorAll('[data-paint]').forEach(b=>{const active=!eraser&&b.dataset.paint===paint;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  for(const [id,active] of [['paint-brush',!eraser],['paint-eraser',eraser]]){const b=app.querySelector('#'+id);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
  app.querySelectorAll('[data-current-paint]').forEach(b=>b.textContent=eraser?'还原空白':PAINT_BY_ID[paint].name);app.querySelector('#mobile-eraser').setAttribute('aria-pressed',String(eraser));app.querySelector('#mobile-eraser').classList.toggle('active',eraser);app.querySelector('#mobile-undo').disabled=!undo.length;
  app.querySelectorAll('[data-effect]').forEach(b=>{const active=b.dataset.effect===editor.effect;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  app.querySelector('#effect-description').textContent=EFFECTS.find(e=>e.id===editor.effect).description;
  app.querySelector('#paint-undo').disabled=!undo.length;app.querySelector('#paint-redo').disabled=!redo.length;
  const progress=drawingProgress(editor);app.querySelector('#paint-progress').textContent=`已涂 ${progress.count} / ${progress.total} 块 · ${progress.percent}%`;
 }
 function updateCanvas(focus){
  const stage=app.querySelector('#coloring-stage');if(!stage)return;
  const keyboardFocus=document.activeElement?.dataset.region;
  stage.innerHTML=coloringSVG(editor.boardId,editor,true);
  if(keyboardFocus&&focus)stage.querySelector(`[data-region="${focus}"]`)?.focus({preventScroll:true});
  if(editor.effect==='pixel'){
   const version=revision,target=document.createElement('div');target.className='pixel-overlay';target.setAttribute('aria-hidden','true');stage.append(target);
   coloringCanvas(editor.boardId,editor,960).then(c=>{if(version===revision&&target.isConnected)target.replaceChildren(c);}).catch(()=>toast('像素预览未加载，请重新选择效果'));
  }
 }
 async function saveWork(button,copy){
  const drawing=snapshot(),savedRevision=revision,id=!copy&&editor.workId?editor.workId:crypto.randomUUID();button.disabled=true;
  try{await transaction(s=>saveArtwork(s,history(),drawing,{id,name:drawing.name}));if(editor?.boardId===drawing.boardId&&isEditor()){editor.workId=id;saveFailed=false;onRouteChange(routeParams(),{replace:true});renderEditor();status(savedRevision===revision?'✓ 作品已收藏，草稿已保存':'新改动已存草稿，可再次更新作品');}toast(copy?'新的作品已收藏！':'作品已保存到「我的作品」');chime();}catch(err){toast(err.message);}finally{button.disabled=false;}
 }
 async function download(drawing,button){
  if(!drawing)return;button.disabled=true;
  try{const canvas=await coloringCanvas(drawing.boardId,drawing,1440),blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('无法生成图片');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(drawing.name||BOARD_BY_ID[drawing.boardId].name).replace(/[\\/:*?"<>|]/g,'-')+'.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);toast('作品图片已生成，开始下载');}catch{toast('图片生成失败，请重试');}finally{button.disabled=false;}
 }
 function deleteWork(id){
  const w=read().works.find(w=>w.id===id);if(!w)return;
  dialog(`<h2>删除「${esc(w.name)}」？</h2><p>会从作品集和小屋展示墙移除这幅作品。已购买的画板和草稿仍然保留。</p><div class="dialog-actions"><button class="secondary" id="delete-cancel">保留作品</button><button class="primary" id="delete-confirm">删除作品</button></div>`);
  document.querySelector('#delete-cancel').onclick=()=>modal.close();document.querySelector('#delete-confirm').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{await transaction(s=>deleteArtwork(s,history(),id));modal.close();render();}catch(err){toast(err.message);b.disabled=false;}};
 }
 function beforeLeave(){if(!puzzleUI.beforeLeave())return false;if(isEditor()&&(saveFailed||pending)){toast(saveFailed?'草稿尚未保存，请先下载作品，并点「重试保存草稿」。':'正在保存，请稍等一下再离开画室。');return false;}return true;}
 window.addEventListener('beforeunload',e=>{if(pending||saveFailed){e.preventDefault();e.returnValue='';}},{signal:events.signal});
 window.addEventListener('keydown',e=>{if(!isEditor()||modal.open||e.target.matches('input,textarea')||!(e.ctrlKey||e.metaKey))return;if(e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redoPaint():undoPaint();}else if(e.key.toLowerCase()==='y'){e.preventDefault();redoPaint();}},{signal:events.signal});
 window.addEventListener('storage',e=>{if(['math-island-v1:games','math-island-v1:history'].includes(e.key)&&isActive()&&!isEditor()&&!modal.open){if(puzzleUI.isPlaying())puzzleUI.handleStorage();else render();}},{signal:events.signal});
 function routeParams(){return editor?{tab:'studio',board:editor.boardId,work:editor.workId,from:tab}:{tab,...(tab==='wall'?{room:wallUI.getRoom()}:tab==='puzzle'?puzzleUI.routeParams():{})};}
 function openRoute(params={}){
  tab=['shop','gallery','wall','frames','puzzle'].includes(params.tab)?params.tab:['shop','gallery','wall','frames','puzzle'].includes(params.from)?params.from:'shop';
  wallUI.setRoom(params.room);
  if(params.tab==='puzzle'){editor=null;puzzleUI.openRoute(params);return;}
  if(params.tab==='studio'){
   const state=read(),work=params.work?state.works.find(w=>w.id===params.work):null;
   if(Object.hasOwn(BOARD_BY_ID,params.board)&&state.purchases.some(p=>p.boardId===params.board)&&(!params.work||work?.boardId===params.board)){openEditor(params.board,work,true);return;}
   toast('这个画板尚未解锁，或作品已不存在，请重新选择。');
  }
  render();
 }
 return {render,beforeLeave,routeParams,openRoute,dispose:()=>{puzzleUI.dispose();events.abort();editor=null;},showWall:room=>{wallUI.setRoom(room);tab='wall';render();}};
}
