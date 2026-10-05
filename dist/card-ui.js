import {CARDS,CARD_BY_ID,DECKS,ALL_DECKS,RARITIES,deckId,probabilities,intensity,normalizeCollection,pendingTickets,inventory,redeem,redeemBatch} from './cards.js';

export function createCardUI({app,modal,storage,history,getView,renderResult,go,toast,chime,confetti}){
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const read=()=>normalizeCollection(storage.read('cards',{}));
 const percent=n=>Number(n.toFixed(1))+'%';
 let rarityFilter='all',ownedOnly=false,drawing=false,cardModal=false,revealTimer=0;
 const rng=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
 function saveDeck(id){const value=read();value.selectedDeck=deckId(id);return storage.write('cards',value);}
 function artwork(c,locked){
  const deck=ALL_DECKS[c.deck];
  let portrait;
  if(c.artWindow){const [x,y,w,h,W,H]=c.artWindow;portrait=`<span class="character-portrait window-portrait" style="--card-atlas:url('${c.art}');--card-x:${x/(W-w||1)*100}%;--card-y:${y/(H-h||1)*100}%;--card-scale-x:${W/w*100}%;--card-scale-y:${H/h*100}%;--card-aspect:${w/h};--card-clip:${c.artClip||'none'}"></span>`;}
  else if(c.art)portrait=`<span class="character-portrait individual-portrait ${c.deck==='superwings'?'superwings-portrait ':''}${c.portrait?'photo-portrait':''} ${c.portraitSide?'parent-portrait '+c.portraitSide:''}" style="--card-atlas:url('${c.art}');--card-clip:${c.artClip||'none'}"></span>`;
  else{const size=deck.size,[ry,rh]=deck.rows[Math.floor(c.index/4)],[x,y,w,h]=deck.cells?.[c.index]||[c.index%4*size/4,ry,size/4,rh];portrait=`<span class="character-portrait" style="--card-atlas:url('${deck.atlas}');--card-x:${x/(size-w)*100}%;--card-y:${y/(size-h)*100}%;--card-scale-x:${size/w*100}%;--card-scale-y:${size/h*100}%;--card-aspect:${w/h};--card-clip:${deck.clips?.[c.index]||'none'}"></span>`;}
  return `<span class="card-artwork ${locked?'silhouette':''} ${c.deck==='superwings'?'superwings-art':''} ${c.deck==='bangbang'?'bangbang-art':''}" role="img" aria-label="${locked?'未获得的角色黑影':esc(c.name)}">${portrait}${locked?'<span class="card-lock" aria-hidden="true">?</span>':''}</span>`;
 }
 function cardMarkup(c,item,large=false){
  const locked=!item,tag=large?'article':'button';
  return `<${tag} class="collectible-card rarity-${c.rarity} ${locked?'locked':'owned'} ${large?'large-card':''}" ${large?'':`data-card="${c.id}" aria-label="${locked?`第 ${c.index+1} 张未获得卡片，${c.rarity} ${RARITIES[c.rarity].name}`:`${esc(c.name)}，${c.rarity} ${RARITIES[c.rarity].name}，已获得 ${item.count} 张，查看介绍`}"`} style="--rarity-color:${RARITIES[c.rarity].color};--deck-color:${ALL_DECKS[c.deck].color};--deck-tint:${ALL_DECKS[c.deck].tint}"><div class="card-top"><span>${ALL_DECKS[c.deck].label} · ${String(c.index+1).padStart(2,'0')}</span><b>${c.rarity}</b></div>${artwork(c,locked)}<div class="card-caption"><h3>${locked?'神秘伙伴':esc(c.name)}</h3><span>${locked?'等待你来点亮':esc(c.english)}</span><p>${locked?'未获得':esc(c.title)}</p></div><div class="card-bottom"><span>${RARITIES[c.rarity].name} · ${'✦'.repeat(Object.keys(RARITIES).indexOf(c.rarity)+1)}</span><strong>${locked?'未点亮':`× ${item.count}`}</strong></div><span class="card-shine" aria-hidden="true"></span></${tag}>`;
 }
 function deckChoices(selected,prefix){return `<div class="deck-choices" aria-label="选择抽卡卡组">${Object.entries(DECKS).map(([id,d])=>`<button ${prefix}="${id}" class="deck-choice ${selected===id?'active':''}" aria-pressed="${selected===id}" style="--deck-color:${d.color};--deck-tint:${d.tint}"><span class="deck-symbol" aria-hidden="true">${d.symbol}</span><span><strong>${d.name}</strong><small>${d.subtitle} · 16 张</small></span>${selected===id?'<b aria-hidden="true">✓</b>':''}</button>`).join('')}</div>`;}
 function rates(count){return `<div class="draw-rates" aria-label="本次各稀有度概率">${Object.entries(probabilities(count)).map(([r,p])=>`<span><b style="color:${RARITIES[r].color}">${r}</b> ${percent(p)}</span>`).join('')}</div>`;}
 function pack(deck){return `<div class="card-pack" style="--deck-color:${DECKS[deck].color};--deck-tint:${DECKS[deck].tint}" aria-hidden="true"><div class="pack-inner"><span>✦</span><strong>${DECKS[deck].name}</strong><small>一张卡，一点小成就</small><div>✧ · ✧ · ✧</div></div></div>`;}
 function ticketPanel(round){
  if(round.cardTicket!==true)return '';
  const collection=read(),draw=collection.draws.find(d=>d.roundId===round.id);
  if(draw){const c=CARD_BY_ID[draw.cardId];return `<section class="round-card-reward"><div class="mini-card-art">${artwork(c,false)}</div><div><span class="eyebrow">✦ 本轮收集的伙伴</span><h2>${esc(c.name)} <span class="rarity-inline" style="color:${RARITIES[c.rarity].color}">${c.rarity}</span></h2><p>这轮的抽卡机会已使用，卡片已收入图鉴。</p></div><button class="secondary" data-view-drawn="${c.id}">看看伙伴故事</button><button class="text-btn" id="result-album">打开图鉴</button></section>`;}
  const pending=pendingTickets(history(),collection);
  return `<section class="round-card-reward undrawn saved-ticket"><div class="ticket-symbol" aria-hidden="true">✦</div><div><span class="eyebrow">✦ 惊喜已存好</span><h2>抽卡背包 +1 次</h2><p>已经自动存好，目前共攒了 <strong>${pending.length} 次</strong>。下次可以选喜欢的卡组，一起打开。</p><small>每次机会保留原练习的抽卡概率，不会过期。</small></div><div class="saved-ticket-actions"><button class="primary" id="result-album">去抽卡背包</button><button class="secondary" id="save-ticket-later">存起来，下次再抽</button></div></section>`;
 }
 function bindTicket(round){
  app.querySelectorAll('[data-result-deck]').forEach(b=>b.onclick=()=>{if(saveDeck(b.dataset.resultDeck))renderResult();});
  app.querySelector('#draw-round')?.addEventListener('click',()=>draw(round.id,read().selectedDeck));
  app.querySelector('#result-album')?.addEventListener('click',()=>go('cards'));
  app.querySelector('#save-ticket-later')?.addEventListener('click',()=>{toast('已存入抽卡背包，随时从图鉴回来一起抽！');go('home');});
  app.querySelector('[data-view-drawn]')?.addEventListener('click',e=>showCard(e.currentTarget.dataset.viewDrawn));
 }
 function render(){
  const collection=read(),items=inventory(collection),selected=collection.selectedDeck,deck=DECKS[selected],pending=pendingTickets(history(),collection),next=pending[0],count=next?intensity(next):20;
  const deckCards=CARDS.filter(c=>c.deck===selected),owned=deckCards.filter(c=>items[c.id]).length;
  const shown=deckCards.filter(c=>(rarityFilter==='all'||c.rarity===rarityFilter)&&(!ownedOnly||items[c.id]));
  app.innerHTML=`<section class="page-intro collection-intro"><div><div class="eyebrow"><span></span> LITTLE EFFORT, LOVELY SURPRISES</div><h1>把努力，变成一张惊喜。</h1><p>完成一轮练习，获得一次抽卡机会。让熟悉的伙伴，陪你收集进步。</p></div><div class="collection-total"><strong>${Object.keys(items).length}<small> / ${CARDS.length}</small></strong><span>已经认识的伙伴</span></div></section><section class="panel collection-draw"><div class="pack-display">${pack(selected)}<span>选择卡组 · 单抽或一起开包</span></div><div class="draw-controls"><div class="panel-heading"><h2>${pending.length?`还有 ${pending.length} 次惊喜，等你打开`:'下一张惊喜，等你练习后开启'}</h2></div>${deckChoices(selected,'data-album-deck')}<p class="draw-intensity">${next?`下一次来自${new Date(next.date).toLocaleDateString('zh-CN')}的练习 · 填写 ${count} 题`:'20、30、60 题，每轮结算都能获得 1 次机会。'}</p>${rates(count)}<div class="draw-actions">${next?`<button class="secondary draw-trigger" id="draw-next">抽一张卡</button>${pending.length>1?`<label class="batch-count-label">一起抽<select id="batch-count" aria-label="一起抽几张">${Array.from({length:Math.min(10,pending.length)-1},(_,i)=>i+2).map(n=>`<option value="${n}" ${n===Math.min(5,pending.length)?'selected':''}>${n} 张</option>`).join('')}</select></label><button class="primary draw-trigger" id="draw-batch">一起开包</button>`:''}`:'<button class="primary" id="cards-practice">去做一轮练习</button>'}<button class="text-btn" id="show-draw-rules">看看抽卡概率</button></div><p class="draw-help">机会自动存入背包，可以攒好几次一起抽。每批最多 10 张，按练习先后使用机会。抽中某个稀有度后，优先认识该档新伙伴；已集齐时，同一批尽量抽不同角色。</p></div></section><section class="panel album-panel"><div class="panel-heading"><div><div class="eyebrow">${deck.name} · 角色图鉴</div><h2>${owned===16?'16 位伙伴，全部点亮！':`已点亮 ${owned} / 16 位伙伴`}</h2></div><div class="album-filters"><label>稀有度<select id="rarity-filter"><option value="all">全部</option>${Object.keys(RARITIES).map(r=>`<option value="${r}" ${rarityFilter===r?'selected':''}>${r} · ${RARITIES[r].name}</option>`).join('')}</select></label><button id="owned-filter" class="secondary" aria-pressed="${ownedOnly}">${ownedOnly?'显示全部':'只看已获得'}</button></div></div><div class="album-progress" role="progressbar" aria-label="${deck.name}收集进度" aria-valuemin="0" aria-valuemax="16" aria-valuenow="${owned}"><span style="width:${owned/16*100}%"></span></div><p class="album-caption">点亮的卡片可以查看伙伴故事；黑影里的朋友，等待下一次相遇。</p>${shown.length?`<div class="card-grid">${shown.map(c=>cardMarkup(c,items[c.id])).join('')}</div>`:'<div class="collection-empty"><h3>这里还没有点亮的伙伴</h3><p>抽到卡片后，它们就会出现在这里。</p></div>'}<div class="album-footer"><span>${deck.name} · 第一辑 · 16 张</span><a href="${deck.source}" target="_blank" rel="noopener noreferrer">人物资料参考</a></div></section>${collection.draws.length?`<section class="panel recent-cards"><div class="panel-heading"><h2>最近的相遇</h2><span>共收集 ${collection.draws.length} 张卡片</span></div><div class="recent-card-list">${[...collection.draws].reverse().slice(0,6).map(d=>{const c=CARD_BY_ID[d.cardId];return `<button data-card="${c.id}"><div class="mini-card-art">${artwork(c,false)}</div><span><strong>${esc(c.name)} <b style="color:${RARITIES[c.rarity].color}">${c.rarity}</b></strong><small>${ALL_DECKS[c.deck].name} · 填写 ${d.intensity} 题的奖励</small></span></button>`;}).join('')}</div></section>`:''}<p class="local-note">卡片和未使用的抽卡机会保存在当前浏览器。刷新不会丢失，也不会重复抽取同一轮奖励。</p>`;
  app.querySelectorAll('[data-album-deck]').forEach(b=>b.onclick=()=>{if(saveDeck(b.dataset.albumDeck)){rarityFilter='all';ownedOnly=false;render();}});
  app.querySelector('#draw-next')?.addEventListener('click',()=>draw(next.id,selected));
  app.querySelector('#draw-batch')?.addEventListener('click',()=>drawMany(Number(app.querySelector('#batch-count').value),selected));
  app.querySelector('#cards-practice')?.addEventListener('click',()=>go('home'));
  app.querySelector('#show-draw-rules').onclick=showRules;
  app.querySelector('#rarity-filter').onchange=e=>{rarityFilter=e.target.value;render();};
  app.querySelector('#owned-filter').onclick=()=>{ownedOnly=!ownedOnly;render();};
  app.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>showCard(b.dataset.card));bindEffects(app);
 }
 function bindEffects(root){
  root.querySelectorAll('.collectible-card.owned').forEach(card=>{
   card.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const rect=card.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;card.style.setProperty('--tilt-x',`${(0.5-y)*12}deg`);card.style.setProperty('--tilt-y',`${(x-0.5)*12}deg`);card.style.setProperty('--shine-x',`${x*100}%`);card.style.setProperty('--shine-y',`${y*100}%`);});
   card.addEventListener('pointerleave',()=>{card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');});
  });
 }
 const sparks=()=>`<div class="draw-sparks" aria-hidden="true">${Array.from({length:12},(_,i)=>`<i style="--spark-angle:${i*30}deg;--spark-delay:${i%3*0.07}s">✦</i>`).join('')}</div>`;
 function openModal(html){clearTimeout(revealTimer);cardModal=true;modal.classList.add('card-modal');document.querySelector('#modal-content').innerHTML=html;if(!modal.open)modal.showModal();}
 function bindClose(){document.querySelector('#close-card').onclick=()=>modal.close();}
 function showCard(id){
  const c=CARD_BY_ID[id];if(!c)return;
  const item=inventory(read())[id];
  openModal(`<div class="card-detail">${cardMarkup(c,item,true)}<div class="card-story"><span class="eyebrow">${ALL_DECKS[c.deck].name} · ${RARITIES[c.rarity].name}</span><h2>${item?esc(c.title):'黑影里的新朋友'}</h2><p>${item?esc(c.intro):'这位伙伴还没有点亮。完成练习后抽一张卡，看看下一次相遇会是谁。'}</p><div class="card-story-meta">${item?`已获得 ${item.count} 张 · 初次相遇 ${new Date(item.firstDate).toLocaleDateString('zh-CN')}`:'角色介绍会在获得卡片后解锁。'}</div><button class="primary" id="close-card">${item?'收好这份小成就':'继续收集'}</button></div></div>`);bindClose();bindEffects(modal);
 }
 function showRules(){openModal(`<h2>练得多一点，惊喜也多一点</h2><p class="rules-intro">每轮结算获得 1 次抽卡机会，和答对多少题无关。全部卡组使用相同概率。</p><div class="table-scroll"><table class="probability-table"><thead><tr><th>填写题量</th>${Object.keys(RARITIES).map(r=>`<th>${r}</th>`).join('')}</tr></thead><tbody>${[20,30,60].map(n=>`<tr><td>${n} 题</td>${Object.values(probabilities(n)).map(p=>`<td>${percent(p)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="rules-help">不足 20 题使用 20 题概率；20–60 题之间按实际填写题数平滑提升。空白题不提升概率，同一轮只能抽一次。先按表中概率随机稀有度，再从该档未收集的角色中等概率抽取；该档已集齐时，优先抽取本批还未出现的角色。</p><p class="rules-help">每套 16 张：8 张 R、5 张 SR、3 张 SSR。同一批中，只有抽中的稀有度全部角色都已出现后，才会再次出现相同角色，因此多抽仍可能重复。重复卡累计张数；未使用的机会可以留到下次。</p><div class="dialog-actions"><button id="close-card" class="primary">知道啦</button></div>`);bindClose();}
 async function drawMany(count,deck){
  if(drawing)return;drawing=true;app.querySelectorAll('.draw-trigger').forEach(b=>b.disabled=true);
  try{
   const commit=()=>{const outcome=redeemBatch(history(),read(),count,deck,rng);if(!storage.write('cards',outcome.collection))throw Error('这次开包没有保存成功，抽卡次数仍保留');return outcome;};
   const result=navigator.locks?await navigator.locks.request('math-island-card-draw',commit):commit();
   openModal(`<div class="draw-opening" role="status"><h2>${count} 份惊喜，一起打开！</h2><div class="opening-pack">${pack(deck)}${sparks()}</div><p>积攒的每一次努力，都变成了一次相遇。</p></div>`);
   revealTimer=setTimeout(()=>{if(!cardModal||!modal.open)return;modal.classList.add('batch-modal');const items=inventory(result.collection),totals=Object.keys(RARITIES).map(r=>`${r} × ${result.outcomes.filter(o=>o.card.rarity===r).length}`).join(' · ');document.querySelector('#modal-content').innerHTML=`<div class="batch-results"><div class="eyebrow">SURPRISES TOGETHER</div><h2>这次遇见了 ${count} 位伙伴</h2><p>${totals} · 新点亮 ${result.outcomes.filter(o=>o.isNew).length} 位伙伴 · 已全部收入图鉴</p><div class="batch-card-grid" style="--batch-columns:${Math.min(3,count)}">${result.outcomes.map((o,i)=>`<div class="batch-result" style="--batch-delay:${i*.09}s"><span class="batch-new">${o.isNew?'✦ 首次点亮':'再次相遇'}</span>${cardMarkup(o.card,items[o.card.id])}<small>${o.draw.intensity} 题的练习奖励</small></div>`).join('')}</div><button class="primary" id="close-card">收好这 ${count} 张卡</button></div>`;bindClose();bindEffects(modal);modal.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>showCard(b.dataset.card));chime(true);confetti();},matchMedia('(prefers-reduced-motion: reduce)').matches?0:1100);
  }catch(error){toast(error.message);if(getView()==='cards')render();}
  finally{drawing=false;}
 }
 async function draw(roundId,deck){
  if(drawing)return;drawing=true;app.querySelectorAll('.draw-trigger').forEach(b=>b.disabled=true);
  try{
   const commit=()=>{const outcome=redeem(history(),read(),roundId,deck,rng);if(!storage.write('cards',outcome.collection))throw new Error('抽卡没有保存成功，这次机会还在，请稍后再试。');return outcome;};
   const outcome=navigator.locks?await navigator.locks.request('math-island-card-draw',commit):commit();
   openModal(`<div class="draw-opening" role="status"><h2>你的新伙伴正在登场…</h2><div class="opening-pack"><span class="opening-ring"></span>${pack(deck)}${sparks()}</div><p>这份惊喜，来自你的认真练习。</p></div>`);
   revealTimer=setTimeout(()=>{if(!cardModal||!modal.open)return;const {card,isNew,copies,draw}=outcome;document.querySelector('#modal-content').innerHTML=`<div class="draw-reveal rarity-${card.rarity}"><div class="eyebrow">${isNew?'✦ 新伙伴，点亮啦！':'✦ 老朋友，又见面啦！'}</div><h2>${isNew?'认识一个新朋友':'收藏再添一张'}</h2><div class="reveal-stage"><span class="reveal-halo"></span>${sparks()}${cardMarkup(card,{count:copies},true)}</div><p>${draw.intensity} 题的努力，变成了这张${RARITIES[card.rarity].name}卡。</p><div class="draw-reveal-actions"><button class="secondary" id="draw-story">看看伙伴故事</button><button class="primary" id="close-card">收进图鉴</button></div></div>`;bindClose();bindEffects(modal);document.querySelector('#draw-story').onclick=()=>showCard(card.id);document.querySelector('#close-card').focus({preventScroll:true});chime(true);if(['SR','SSR'].includes(card.rarity))confetti();},1100);
  }catch(error){toast(error.message);if(getView()==='cards')render();else if(getView()==='result')renderResult();}
  finally{drawing=false;}
 }
 modal.addEventListener('close',()=>{if(!cardModal)return;clearTimeout(revealTimer);cardModal=false;modal.classList.remove('card-modal','batch-modal');if(getView()==='cards')render();else if(getView()==='result')renderResult();});
 window.addEventListener('storage',e=>{if(['math-island-v1:cards','math-island-v1:history'].includes(e.key)&&!modal.open){if(getView()==='cards')render();else if(getView()==='result')renderResult();}});
 return {render,ticketPanel,bindTicket};
}
