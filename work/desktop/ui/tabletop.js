/* Presentation and inspection never dispatch a game action. */
let seatFocus=null;
function previewAttrs(card){return ruleArt(card)?`data-preview-src="${esc(ruleArt(card))}" data-preview-name="${esc(card.name)}"`:'';}
function seatCard(list,p,index,active){
 const card=list.getPokemonCard(),secret=list.isSecret&&list.cards.length;
 const focus=seatFocus?.player===p.id&&seatFocus.index===index&&seatFocus.active===active;
 const attachments=!secret?[...new Set([...list.cards,...(list.tools||[])])].filter(c=>c!==card):[];
 return `<div class="seat-slot ${active?'seat-active':'seat-bench'} ${focus?'focused':''}" data-seat-slot><span class="seat-zone-name">${active?'ACTIVE':'BENCH '+(index+1)}</span>
  ${attachments.length?`<div class="seat-energy">${attachments.map(c=>`<span ${previewAttrs(c)} title="${esc(c.name)}">${ruleArt(c)?`<img src="${esc(ruleArt(c))}" alt="${esc(c.name)}">`:'Energy'}</span>`).join('')}</div>`:''}
  <button class="seat-pokemon ${card||secret?'occupied':''}" ${!secret&&card?previewAttrs(card):'data-card-back="true"'} onclick="focusSeat(${p.id},${index},${active})" aria-label="${secret?'Face-down Pokémon':card?'Select '+esc(card.name):'Empty '+(active?'Active':'Bench')}" >${secret?'<img src="ilex-card-back.svg" alt="Face-down Pokémon">':card&&ruleArt(card)?`<img src="${esc(ruleArt(card))}" alt="${esc(card.name)}">`:card?`<span>${esc(card.name)}</span>`:'<span>＋</span>'}</button>
  ${card&&!secret?`<span class="seat-counters">${list.damage?`<b>${list.damage}</b> damage`:'Healthy'}${list.specialConditions.length?' · '+list.specialConditions.map(s=>esc(RulesMatch.R.SpecialCondition[s])).join(' / '):''}</span>`:''}
 </div>`;
}
function seatPile(p,kind){
 const cards=kind==='prizes'?p.prizes.filter(l=>l.cards.length):p[kind].cards;
 const top=kind==='discard'?cards.at(-1):null;
 return `<div class="seat-pile seat-${kind}"><span>${kind==='prizes'?'PRIZES':kind.toUpperCase()} · ${cards.length}</span>${kind==='prizes'?`<div class="seat-prizes">${cards.map(list=>list.faceUpPrize?`<img src="${esc(ruleArt(list.cards[0]))}" alt="${esc(list.cards[0].name)}" ${previewAttrs(list.cards[0])}>`:'<img src="ilex-card-back.svg" alt="Face-down prize" data-card-back="true">').join('')}</div>`:`<div class="pile-stack" ${top?previewAttrs(top):'data-card-back="true"'}>${cards.length?`<img src="${esc(top?ruleArt(top):'ilex-card-back.svg')}" alt="${esc(top?top.name:'Face-down deck')}" data-card-back="${top?'false':'true'}">`:'<span>Empty</span>'}</div>`}${kind==='discard'?`<button onclick="showRuleDiscard(${p.id})">View discard</button>`:''}</div>`;
}
function renderSeatedTable(g,prompt){
 const viewerId=rulesMatch.spec.opponent?.type==='bot'?rulesMatch.spec.opponent.humanPlayer:prompt?.getPerspectivePlayerId?.()??prompt?.playerId??g.players[g.activePlayer]?.id??g.players[0].id;
 const near=g.players.find(p=>p.id===viewerId)||g.players[0],far=g.players.find(p=>p!==near);
 const enabled=g.players[g.activePlayer]===near&&!prompt&&g.phase===RulesMatch.R.GamePhase.PLAYER_TURN;
 if(!seatFocus||seatFocus.player!==near.id)seatFocus={player:near.id,index:0,active:true};
 const hand=(p,own)=>{
   const visible=own||p.hand.isPublic;
   return `<div class="seat-hand ${own?'near-hand':'far-hand'}"><span class="hand-label">${own?'YOUR HAND':'OPPONENT HAND'} · ${p.hand.cards.length}</span><div class="hand-fan">${p.hand.cards.map((c,i)=>`<button class="fan-card" style="--fan:${i-(p.hand.cards.length-1)/2};--hand-size:${p.hand.cards.length}" ${visible?previewAttrs(c):'data-card-back="true"'} ${own&&enabled?`onclick="pickRuleHand(${p.id},${i})"`:'aria-disabled="true"'} aria-label="${visible?esc(c.name):'Face-down opponent card'}">${visible&&ruleArt(c)?`<img src="${esc(ruleArt(c))}" alt="${esc(c.name)}">`:'<img src="ilex-card-back.svg" alt="Face-down opponent card" data-card-back="true">'}</button>`).join('')}</div></div>`;
 };
 const half=(p,opponent)=>`<section class="seat-half ${opponent?'far-seat':'near-seat'}"><div class="seat-bench-row">${p.bench.map((l,i)=>seatCard(l,p,i,false)).join('')}</div><div class="seat-active-row">${seatCard(p.active,p,0,true)}</div>${seatPile(p,'prizes')}${seatPile(p,'deck')}${seatPile(p,'discard')}${p.stadium.cards.length?`<div class="seat-stadium">${p.stadium.cards.map(c=>`<button ${previewAttrs(c)} ${enabled&&c._wotcStadiumAction!==false&&near.stadiumUsedTurn!==g.turn?`onclick="ruleAction({type:'stadium',player:${near.id}})"`:''}>${ruleArt(c)?`<img src="${esc(ruleArt(c))}" alt="${esc(c.name)}">`:esc(c.name)}</button>`).join('')}</div>`:''}</section>`;
 const player=g.players.find(p=>p.id===seatFocus.player),list=seatFocus.active?player.active:player.bench[seatFocus.index];
 const focused=list.getPokemonCard();
 return `<div class="table-layout"><div class="seated-experience"><div class="opponent-seat"><span class="dot"></span>${esc(far.name)}<span>Across the table</span></div>${hand(far,false)}<div class="table-scene"><div class="felt-table"><div class="felt-mark">ILEX<span>.GG</span><small>EVERY ERA. YOUR ADVENTURE.</small></div>${half(far,true)}<div class="table-divider"></div>${half(near,false)}</div></div>${hand(near,true)}<div class="seat-player-bar"><strong>${esc(near.name)}</strong><span>Right-click to magnify · Click to select</span></div></div><section class="seat-action-dock"><div><span class="eyebrow">${seatFocus.active?'ACTIVE POKÉMON':'BENCH '+(seatFocus.index+1)}</span><h2>${focused?esc(focused.name):'Choose a Pokémon'}</h2></div><div class="seat-actions">${focused?ruleSlot(list,player,seatFocus.index,seatFocus.active,enabled&&player===near):'<p>Select a card on the table to see its actions.</p>'}</div></section></div>`;
}
function focusSeat(player,index,active){seatFocus={player,index,active};rulesTable();}

const magnifier=document.createElement('dialog');magnifier.id='cardmagnifier';
magnifier.innerHTML='<button class="magnify-close" aria-label="Close card preview">×</button><h2 id="magnify-title"></h2><img id="magnify-image" alt=""><p>Esc or click outside to return to the table.</p>';
document.body.append(magnifier);
magnifier.querySelector('button').onclick=()=>magnifier.close();
magnifier.addEventListener('click',e=>{if(e.target===magnifier){const r=magnifier.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)magnifier.close();}});
document.addEventListener('contextmenu',e=>{
 const node=e.target.closest('[data-preview-src]'),img=e.target.closest('#app img,#modal img');
 if(!node&&!img)return;
 if(e.target.closest('[data-card-back="true"]')){e.preventDefault();return;}
 const src=node?.dataset.previewSrc||img?.getAttribute('src'),name=node?.dataset.previewName||img?.alt||'Card preview';
 if(!src||src.includes('ilex-card-back.svg')){e.preventDefault();return;}
 e.preventDefault();e.stopPropagation();
 magnifier.querySelector('#magnify-image').src=src;magnifier.querySelector('#magnify-image').alt=name;magnifier.querySelector('#magnify-title').textContent=name;
 if(!magnifier.open)magnifier.showModal();
},true);

const seatedPlay=play;
play=function(){seatedPlay();document.body.classList.toggle('in-match',!!(tableMode==='rules'?rulesMatch:state.game));if(tableMode==='manual'&&state.game){
 const table=document.querySelector('.table');if(!table)return;table.classList.add('manual-seated');
 const players=[...table.querySelectorAll('.player')];const near=players[state.game.player],far=players[1-state.game.player];
 far.classList.add('manual-far');near.classList.add('manual-near');table.append(far,near);
 for(const p of players)for(const [i,zone] of [...p.querySelectorAll('.zone')].entries())zone.classList.add('manual-'+zoneNames[i]);
}};
const seatedRender=render;
render=function(){seatedRender();document.body.classList.toggle('in-match',tab==='play'&&!!(tableMode==='rules'?rulesMatch:state.game));};


