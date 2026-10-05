import {DECOR_GAMES,WATER_TYPES,fitsWater,tankModel,tankDimensions} from './decor-catalog.js';
import {unlockDecor,placeDecor,changeDecorObject,removeDecor,clearDecor,resetDecor,decorBounds,decorScene,updateDecorScene,selectAquariumTank,addAquariumTank,aquariumTankPrice,MAX_AQUARIUM_TANKS} from './decor.js';
import {decorArt,decorSceneObjects,tankStyle,escapeHTML as esc} from './decor-art.js';

import {createAquariumMotion,swimStyle} from './aquarium-motion.js';

export const createGardenUI=context=>createDecorUI(context,'garden');
export const createAquariumUI=context=>createDecorUI(context,'aquarium');
function createDecorUI({app,modal,game,go,toast,chime,isActive,onRouteChange},kind){
 const config=DECOR_GAMES[kind],events=new AbortController();
 let root=game.read(),state, motion=null,tab='collection',category='全部',selected=null,editing=false,busy=0,drag=null,suppressClickUntil=0;
 const read=()=>{root=game.read();state={...decorScene(root,kind),owned:root.owned};return state;};read();
 const routeParams=()=>({tab,category,...(kind==='aquarium'?{tank:state.id}:{})});
 function render(){
  motion?.dispose();motion=null;read();if(!state.objects.some(o=>o.id===selected))selected=null;
  const fish=state.objects.filter(o=>config.byId[o.itemId].fish).length;
  app.innerHTML=`<div class="decor-game decor-${kind}"><header class="play-header"><div><button class="text-btn" id="decor-back">← 游戏大厅</button><div class="eyebrow">${config.english}</div><h1>${config.name}</h1><p>${config.tagline}</p></div><div class="game-wallet"><span>我的游戏币</span><strong><span class="game-coin">✦</span> ${game.wallet().balance}</strong><button class="text-btn" id="decor-earn">答题赚币 ↗</button></div></header>${tankList()}<div class="decor-workspace"><section class="landscape-panel"><div class="landscape-heading"><div><span class="landscape-label">${kind==='garden'?'GARDEN No. 01':'AQUARIUM No. '+String(root.tanks.findIndex(t=>t.id===state.id)+1).padStart(2,'0')}</span><h2>${esc(state.name)} ${kind==='aquarium'?waterBadge(state.water)+modelBadge(state.tank):''} <button class="text-btn" id="decor-rename" aria-label="修改${kind==='garden'?'花园':'水族馆'}名字">✎</button></h2></div><span class="scene-count">${kind==='aquarium'?fish+' 位伙伴 · ':''}${state.objects.length} 件布置</span></div><div class="scene-surround ${kind==='aquarium'?state.tank:''}" ${kind==='aquarium'?`style="${tankStyle(state.tank)}"`:''}><div id="decor-scene" class="decor-scene ${editing?'is-editing':''} ${kind==='aquarium'?state.light:'time-'+state.time}" aria-label="${config.name}布置场景" style="--scene-background:url('${config.background}')"><div class="scene-light" aria-hidden="true"></div>${kind==='aquarium'?`<div class="tank-bubbles" aria-hidden="true">${[14,38,74,89].map((left,i)=>`<i style="left:${left}%;--delay:${-i*3}s"></i>`).join('')}</div>`:'<div class="garden-dust" aria-hidden="true"></div>'}<div class="scene-objects">${decorSceneObjects(config,state,selected,editing)}</div>${state.objects.length?'':'<div class="scene-empty-hint">从收藏里挑选物品，装扮这片小天地</div>'}<div id="scene-selection-actions" class="scene-selection-actions"></div><div class="scene-edit-label" aria-hidden="true">拖动调整位置 · 点击空白取消选中</div></div></div><div class="landscape-toolbar"><button class="${editing?'primary':'secondary'}" id="decor-edit" aria-pressed="${editing}">${editing?'✓ 完成布置':'✥ 开始布置'}</button>${kind==='garden'?`<button class="secondary" id="decor-time">${state.time==='day'?'☾ 看看黄昏':'☀ 回到白天'}</button>`:`<button class="secondary" id="decor-feed">◌ 喂点鱼食</button>`}<button class="text-btn" id="decor-reset">恢复初始布置</button><button class="text-btn" id="decor-clear">收起全部</button><span class="decor-save-status" role="status">${busy?'正在保存…':'✓ 已自动保存'}</span></div><p id="decor-feed-status" class="feed-status" role="status" aria-live="polite"></p><div id="decor-inspector"></div><div class="scene-footnote"><span>${kind==='garden'?'❋ 一花一木，都是你的想法。':'≈ 游得慢一点，也很快乐。'}</span><p>${editing?'拖动物品调整位置，点击空白取消选中；方向键微调，Delete 撤下。':'点击「开始布置」调整位置；从右侧收藏中挑选物品，搭配出自己的小天地。'}</p></div></section><aside class="decor-library"><div class="library-title"><div><span class="eyebrow">${tab==='collection'?'LITTLE TREASURES':'SOMETHING LOVELY'}</span><h2>${tab==='collection'?'我的小收藏':'发现新喜欢'}</h2></div><span class="collection-count">${state.owned.length} / ${config.items.length}</span></div><div class="library-tabs"><button data-decor-tab="collection" class="${tab==='collection'?'active':''}" aria-pressed="${tab==='collection'}">我的收藏</button><button data-decor-tab="shop" class="${tab==='shop'?'active':''}" aria-pressed="${tab==='shop'}">逛逛商店</button></div><p class="library-note">${tab==='collection'?(kind==='aquarium'?'生物按水体摆放，通用配饰可跨缸使用；每口鱼缸单独购买。':'买一次，可以反复摆放。喜欢的位置由你决定。'):'用练习攒下的游戏币，带一份新喜欢回家。'}</p><div class="decor-categories" aria-label="物品分类">${config.categories.map(c=>`<button data-decor-category="${c}" class="${category===c?'active':''}" aria-pressed="${category===c}">${c}</button>`).join('')}</div><div class="decor-item-grid">${cards()}</div><div class="library-bottom">${kind==='aquarium'?'童话水族馆 · 自由搭配水中小伙伴':'花园没有标准答案 · 按自己的喜欢来'}</div></aside></div></div>`;
  bind();renderInspector();
  if(kind==='aquarium'&&!editing)motion=createAquariumMotion(app.querySelector('#decor-scene'),state.objects,config,message=>{
   const status=app.querySelector('#decor-feed-status');if(status)status.textContent=message;
   const button=app.querySelector('#decor-feed');if(button)button.disabled=motion?.isFeeding()||false;
  },state.tank);
  onRouteChange(routeParams());
 }
 function waterBadge(water){return `<span class="water-badge water-${water}">${WATER_TYPES[water]}${water==='both'?'配饰':'缸'}</span>`;}
 function modelBadge(id){return `<span class="tank-dimension-badge">${tankDimensions(id)}</span>`;}
 function tankList(){
  if(kind!=='aquarium')return '';
  return `<section class="aquarium-tanks" aria-label="我的鱼缸"><div class="tank-list-heading"><div><span class="eyebrow">MY AQUARIUMS</span><h2>我的鱼缸 <small>${root.tanks.length} / ${MAX_AQUARIUM_TANKS}</small></h2></div><button class="secondary" id="decor-add-tank" ${root.tanks.length>=MAX_AQUARIUM_TANKS?'disabled':''}>＋ 添一口鱼缸</button></div>${root.migrationNotice?`<p class="migration-note">${esc(root.migrationNotice)}</p>`:''}<div class="tank-list">${root.tanks.map(t=>`<button class="tank-card ${t.id===state.id?'active':''}" data-switch-tank="${t.id}" aria-label="切换到${esc(t.name)}" aria-pressed="${t.id===state.id}"><span class="tank-preview-space"><span class="tank-preview scene-surround ${t.tank}" style="${tankStyle(t.tank)}"><span class="decor-scene ${t.light}" style="--scene-background:url('${config.background}')"><span class="scene-light"></span><span class="scene-objects">${decorSceneObjects(config,t,null,false,true)}</span></span></span></span><span class="tank-card-info"><strong>${esc(t.name)}</strong>${waterBadge(t.water)}${modelBadge(t.tank)}<small>${t.objects.filter(o=>config.byId[o.itemId].fish).length} 位伙伴 · ${t.objects.length} 件布置${t.id===state.id?' · 正在查看':''}</small></span></button>`).join('')}</div></section>`;
 }
 function cards(){
  const list=config.items.filter(i=>(category==='全部'||i.category===category)&&(tab==='shop'||state.owned.includes(i.id)));
  return list.map(item=>{
   const tank=item.slot==='tank',owned=state.owned.includes(item.id),equipped=!tank&&item.slot&&state[item.slot]===item.id;
   const mismatch=kind==='aquarium'&&!fitsWater(item,state.water);
   const label=tank?'购买新鱼缸'+item.name:mismatch?item.name+'仅适用'+WATER_TYPES[item.water]+'缸':(owned?equipped?'已使用':item.slot?'使用':'摆放':'购买')+item.name;
   return `<article class="decor-card ${mismatch?'water-mismatch':''}"><div class="decor-card-art">${decorArt(kind,item)}${item.price===0?'<span class="gift-badge">'+(tank?'首缸赠送':'入住礼物')+'</span>':''}</div><div class="decor-card-copy"><h3>${item.name}</h3><div class="item-traits">${kind==='aquarium'?(tank?'<span class="item-tag">'+tankDimensions(item.id)+'</span><span class="item-tag">'+tankModel(item.id).form+'</span>':`<span class="water-badge water-${item.water}">${item.water==='both'?'两种水体通用':WATER_TYPES[item.water]+'专属'}</span>`):`<span class="item-tag">${item.theme||item.category}</span>`}${item.fish?`<span class="item-tag">${swimStyle(item).name}</span>`:''}</div><p>${item.description}</p><button class="${owned&&!tank?'secondary':'decor-buy'}" data-decor-item="${item.id}" ${busy||equipped||mismatch||tank&&root.tanks.length>=MAX_AQUARIUM_TANKS?'disabled':''} aria-label="${label}">${tank?`＋ 新缸 · ${aquariumTankPrice(item)} 币`:mismatch?`需${WATER_TYPES[item.water]}缸`:owned?equipped?'✓ 正在使用':item.slot?'使用 →':'＋ 摆放':`✦ ${item.price} 游戏币`}</button></div></article>`;
  }).join('')||'<div class="decor-empty"><span>❋</span><h3>这类收藏还在等你发现</h3><p>去商店挑一份喜欢的，带回来吧。</p><button class="secondary" id="decor-empty-shop">逛逛商店 →</button></div>';
 }
 function selectObject(id){
  selected=id;app.querySelectorAll('[data-object]').forEach(b=>{b.classList.toggle('selected',b.dataset.object===id);b.setAttribute('aria-pressed',String(b.dataset.object===id));});renderInspector();
 }
 function renderInspector(){
  const box=app.querySelector('#decor-inspector');if(!box)return;
  const object=state.objects.find(o=>o.id===selected),item=object&&config.byId[object.itemId];
  box.innerHTML=object?`<section class="object-inspector"><div class="inspector-thumb">${decorArt(kind,item)}</div><div class="inspector-name"><strong>${item.name}</strong><small>${item.fish?'布置时鱼儿暂停，完成后继续游动':'拖动调整位置，点击空白取消选中'}</small></div><label>大小 <input id="decor-scale" type="range" min="65" max="135" step="5" value="${Math.round(object.scale*100)}" aria-label="${item.name}大小"></label><button class="secondary" id="decor-flip">↔ 翻转</button><button class="text-btn" id="decor-remove">撤下</button></section>`:`<div class="inspector-empty"><span>✥</span><p>${editing?'选中一个物品，调整大小、翻转或撤下。':kind==='garden'?'收藏可以重复摆放，试试把同一种花种成一片。':'选择适合水体的小伙伴，通用配饰可以反复搭配。'}</p></div>`;
  const floating=app.querySelector('#scene-selection-actions');
  floating.innerHTML=object?`<span>${item.name}</span><button class="secondary" id="decor-scene-remove" aria-label="撤下${item.name}">撤下 ×</button>`:'';
  if(object){
   floating.querySelector('button').onclick=e=>{e.stopPropagation();mutate((s,t)=>removeDecor(s,kind,object.id,t),'已撤下，收藏里可以重新摆放');};
   box.querySelector('#decor-scale').onchange=e=>mutate((s,t)=>changeDecorObject(s,kind,object.id,{scale:Number(e.target.value)/100},t));
   box.querySelector('#decor-flip').onclick=()=>mutate((s,t)=>{const current=decorScene(s,kind,t).objects.find(o=>o.id===object.id);return changeDecorObject(s,kind,object.id,{flip:!current?.flip},t);});
   box.querySelector('#decor-remove').onclick=()=>mutate((s,t)=>removeDecor(s,kind,object.id,t),'已撤下，收藏里可以重新摆放');
  }
 }
 async function mutate(change,message,purchase){
  if(busy)return false;const tankId=state.id;busy++;setSaving(true);
  try{
   await (purchase?game.purchase(purchase,s=>change(s,tankId)):game.update(s=>change(s,tankId)));
   if(isActive()){read();render();if(message)toast(message);}return true;
  }catch(error){if(isActive()){toast(error.message);render();}return false;}
  finally{busy--;if(isActive()){setSaving(false);app.querySelectorAll('[data-decor-item]').forEach(button=>{const item=config.byId[button.dataset.decorItem];button.disabled=!!(item.slot==='tank'?root.tanks.length>=MAX_AQUARIUM_TANKS:item.slot&&state[item.slot]===item.id||kind==='aquarium'&&!fitsWater(item,state.water));});}}
 }
 function setSaving(saving){const status=app.querySelector('.decor-save-status');if(status)status.textContent=saving?'正在保存…':'✓ 已自动保存';}
 function dialog(html){modal.classList.add('decor-modal');document.querySelector('#modal-content').innerHTML=html;modal.showModal();}
 function chooseItem(itemId){
  const item=config.byId[itemId];if(busy)return;if(item.slot==='tank'){buyTank(item);return;}if(kind==='aquarium'&&!fitsWater(item,state.water)){toast(`请先切换到${WATER_TYPES[item.water]}缸`);return;}
  const objectId=crypto.randomUUID();
  if(state.owned.includes(itemId)){editing=!item.slot;selected=item.slot?null:objectId;mutate((s,t)=>placeDecor(s,kind,itemId,objectId,t));return;}
  const balance=game.wallet().balance,enough=balance>=item.price;
  dialog(`<div class="purchase-decor-art">${decorArt(kind,item)}</div><span class="game-kicker">${item.category}</span><h2>${item.name}</h2><p>${item.description}</p><p class="purchase-permanent">收藏一次，可以反复${item.slot?'使用':'摆放'}。</p><div class="purchase-summary"><strong>✦ ${item.price} 游戏币</strong><span>余额 ${balance} 币 · ${enough?'购买后剩 '+(balance-item.price)+' 币':'还差 '+(item.price-balance)+' 币'}</span></div><div class="dialog-actions"><button class="secondary" id="decor-cancel">再看看</button><button class="primary" id="decor-confirm">${enough?'收藏并'+(item.slot?'使用':'摆放'):'去答题赚币'}</button></div>`);
  document.querySelector('#decor-cancel').onclick=()=>modal.close();
  document.querySelector('#decor-confirm').onclick=async e=>{
   if(!enough){modal.close();go('home');return;}
   e.currentTarget.disabled=true;editing=!item.slot;selected=item.slot?null:objectId;
   const ok=await mutate((s,t)=>placeDecor(unlockDecor(s,kind,itemId),kind,itemId,objectId,t),'新的小收藏，已经来到你的小天地！',{id:'item-'+itemId,paid:item.price});
   if(ok){modal.close();chime();}else document.querySelector('#decor-confirm').disabled=false;
  };
 }
 function buyTank(item){
  const id=crypto.randomUUID(),price=aquariumTankPrice(item),balance=game.wallet().balance,enough=balance>=price,model=tankModel(item.id);
  dialog(`<div class="purchase-decor-art tank-model-preview">${decorArt(kind,item)}</div><span class="game-kicker">${model.form} · 一口独立的新鱼缸</span><h2>${item.name}</h2><p class="tank-model-dimensions">宽 ${model.width} cm × 高 ${model.height} cm</p><p>${item.description}</p><p class="purchase-permanent">这款鱼缸有固定尺寸。每口缸单独命名和布置，选择适合伙伴的水体就能入住。</p><fieldset class="tank-water-options"><legend>这口缸的水体</legend><label><input type="radio" name="tank-water" value="fresh" checked> 淡水缸 <small>金鱼、水草、六角恐龙</small></label><label><input type="radio" name="tank-water" value="salt"> 海水缸 <small>小丑鱼、海星、海胆</small></label></fieldset><div class="purchase-summary"><strong>✦ ${price} 游戏币</strong><span>余额 ${balance} 币 · ${enough?'购买后剩 '+(balance-price)+' 币':'还差 '+(price-balance)+' 币'}</span></div><div class="dialog-actions"><button class="secondary" id="decor-cancel">再看看</button><button class="primary" id="decor-confirm">${enough?'购买并布置新鱼缸':'去答题赚币'}</button></div>`);
  document.querySelector('#decor-cancel').onclick=()=>modal.close();
  document.querySelector('#decor-confirm').onclick=async e=>{
   if(game.wallet().balance<price){modal.close();go('home');return;}
   const water=modal.querySelector('[name="tank-water"]:checked').value;
   e.currentTarget.disabled=true;selected=null;editing=true;
   const ok=await mutate(s=>addAquariumTank(s,item.id,id,water),'新鱼缸已就位，开始布置吧！',{id:'tank-'+id,paid:price});
   if(ok){modal.close();chime();}else document.querySelector('#decor-confirm').disabled=false;
  };
 }
 function confirmLayout(reset){
  dialog(`<h2>${reset?'恢复最初的小天地？':'把物品都收起来？'}</h2><p>${kind==='aquarium'?'仅调整当前鱼缸。':''}${reset?(kind==='aquarium'?'会恢复适合当前水体的初始布置，购买的物品仍在收藏里。':'会恢复刚来时的布置，购买的物品仍在收藏里。'):'所有摆放的物品都会回到收藏里，之后可以重新布置。'}</p><div class="dialog-actions"><button class="secondary" id="decor-cancel">保留现在</button><button class="primary" id="decor-confirm">${reset?'恢复初始布置':'收起全部'}</button></div>`);
  document.querySelector('#decor-cancel').onclick=()=>modal.close();document.querySelector('#decor-confirm').onclick=async()=>{if(await mutate((s,t)=>reset?resetDecor(s,kind,t):clearDecor(s,kind,t))){selected=null;modal.close();}};
 }
 function bind(){
  app.querySelector('#decor-add-tank')?.addEventListener('click',()=>{tab='shop';category='鱼缸';render();app.querySelector('.decor-library').scrollIntoView({block:'nearest'});});
  app.querySelectorAll('[data-switch-tank]').forEach(b=>b.onclick=()=>{if(busy||b.dataset.switchTank===state.id)return;selected=null;editing=false;mutate(s=>selectAquariumTank(s,b.dataset.switchTank));});
  app.querySelector('#decor-back').onclick=()=>go('games',{});app.querySelector('#decor-earn').onclick=()=>go('home');
  app.querySelectorAll('[data-decor-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.decorTab;render();});
  app.querySelectorAll('[data-decor-category]').forEach(b=>b.onclick=()=>{category=b.dataset.decorCategory;render();});
  app.querySelectorAll('[data-decor-item]').forEach(b=>b.onclick=()=>chooseItem(b.dataset.decorItem));
  app.querySelector('#decor-empty-shop')?.addEventListener('click',()=>{tab='shop';render();});
  app.querySelector('#decor-edit').onclick=()=>{editing=!editing;selected=null;render();};
  app.querySelector('#decor-time')?.addEventListener('click',()=>mutate(s=>({...s,time:s.time==='day'?'sunset':'day'})));
  app.querySelector('#decor-feed')?.addEventListener('click',()=>{
   if(!state.objects.some(o=>config.byId[o.itemId].fish)){toast('先放几位适合水体的小伙伴进来吧');return;}
   if(editing){editing=false;selected=null;render();}motion?.feed();
  });
  app.querySelector('#decor-reset').onclick=()=>confirmLayout(true);app.querySelector('#decor-clear').onclick=()=>confirmLayout(false);
  app.querySelector('#decor-rename').onclick=()=>{
   dialog(`<h2>给小天地起个名字</h2><label class="decor-name-label">名字<input id="decor-name" maxlength="24" value="${esc(state.name)}"></label><div class="dialog-actions"><button class="secondary" id="decor-cancel">取消</button><button class="primary" id="decor-confirm">保存名字</button></div>`);
   document.querySelector('#decor-cancel').onclick=()=>modal.close();document.querySelector('#decor-confirm').onclick=async()=>{const name=document.querySelector('#decor-name').value;if(await mutate((s,t)=>updateDecorScene(s,kind,t,scene=>({...scene,name}))))modal.close();};
  };
  const scene=app.querySelector('#decor-scene');
  scene.onpointerdown=e=>{
   const target=e.target.closest('[data-object]');if(!editing||!target||busy||e.button!==0)return;
   const object=state.objects.find(o=>o.id===target.dataset.object);selected=object.id;
   scene.querySelectorAll('[data-object]').forEach(b=>{b.classList.toggle('selected',b===target);b.setAttribute('aria-pressed',String(b===target));});renderInspector();
   const rect=scene.getBoundingClientRect();drag={id:object.id,target,rect,startX:e.clientX,startY:e.clientY,x:object.x,y:object.y,moved:false,pointer:e.pointerId};target.setPointerCapture(e.pointerId);e.preventDefault();
  };
  scene.onpointermove=e=>{
   if(!drag||drag.pointer!==e.pointerId)return;
   const object=state.objects.find(o=>o.id===drag.id),b=decorBounds(kind,config.byId[object.itemId],object.scale,state.tank);
   drag.nextX=Math.min(b.maxX,Math.max(b.minX,drag.x+(e.clientX-drag.startX)/drag.rect.width*100));drag.nextY=Math.min(b.maxY,Math.max(b.minY,drag.y+(e.clientY-drag.startY)/drag.rect.height*100));
   if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>3)drag.moved=true;
   drag.target.style.left=drag.nextX+'%';drag.target.style.top=drag.nextY+'%';drag.target.style.zIndex=Math.round(drag.nextY);
  };
  scene.onpointerup=e=>{
   if(!drag||drag.pointer!==e.pointerId)return;const done=drag;drag=null;
   if(done.moved){suppressClickUntil=performance.now()+250;mutate((s,t)=>changeDecorObject(s,kind,done.id,{x:done.nextX,y:done.nextY},t));}
  };
  scene.onpointercancel=()=>{drag=null;render();};
  scene.onclick=e=>{
   if(performance.now()<suppressClickUntil)return;if(busy)return;
   const target=e.target.closest('[data-object]');
   if(e.target.closest('#scene-selection-actions'))return;
   if(target){if(editing)selectObject(target.dataset.object);else{selected=target.dataset.object;editing=true;render();}return;}
   selectObject(null);
  };
  scene.onkeydown=e=>{
   if(e.key==='Escape'){e.preventDefault();selectObject(null);return;}
   if(['Delete','Backspace'].includes(e.key)&&selected&&editing&&!busy){e.preventDefault();const id=selected;mutate((s,t)=>removeDecor(s,kind,id,t),'已撤下，收藏里可以重新摆放');return;}
   const target=e.target.closest('[data-object]');if(!target||!editing||busy||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
   e.preventDefault();selected=target.dataset.object;const amount=e.shiftKey?5:1,id=selected;
   mutate((s,t)=>{const o=decorScene(s,kind,t).objects.find(o=>o.id===id);return changeDecorObject(s,kind,id,{x:o.x+(e.key==='ArrowLeft'?-amount:e.key==='ArrowRight'?amount:0),y:o.y+(e.key==='ArrowUp'?-amount:e.key==='ArrowDown'?amount:0)},t);}).then(()=>app.querySelector(`[data-object="${id}"]`)?.focus({preventScroll:true}));
  };
 }
 modal.addEventListener('close',()=>modal.classList.remove('decor-modal'),{signal:events.signal});
 window.addEventListener('storage',e=>{if(isActive()&&!busy&&!modal.open&&['math-island-v1:games','math-island-v1:history'].includes(e.key))render();},{signal:events.signal});
 return {openRoute:params=>{tab=params.tab==='shop'?'shop':'collection';category=config.categories.includes(params.category)?params.category:'全部';read();if(kind==='aquarium'&&params.tank&&params.tank!==state.id&&root.tanks.some(t=>t.id===params.tank)){selected=null;mutate(s=>selectAquariumTank(s,params.tank));}else render();},routeParams,beforeLeave:()=>{if(busy){toast('正在保存布置，请稍等一下。');return false;}return true;},dispose:()=>{events.abort();motion?.dispose();drag=null;modal.classList.remove('decor-modal');}};
}
