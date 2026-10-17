/* Presentation and inspection never dispatch a game action. */
let seatFocus=null;
var tableCountTooltip,tableCountZone;
function hideTableCount(){if(tableCountTooltip)tableCountTooltip.hidden=true;tableCountZone=null;}
function showTableCount(zone,event){
 if(!zone)return hideTableCount();
 const manual=zone.dataset.countMode==='manual',player=manual?state.game?.players[Number(zone.dataset.countPlayer)]:rulesMatch?.store.state.players.find(p=>p.id===Number(zone.dataset.countPlayer));
 const pile=player?.[zone.dataset.countKind],count=manual?pile?.length:pile?.cards.length;if(count===undefined)return hideTableCount();
 tableCountZone=zone;tableCountTooltip.textContent=`${zone.dataset.countOwner} ${zone.dataset.countKind}: ${count} ${count===1?'card':'cards'}`;
 tableCountTooltip.hidden=false;
 const rect=zone.getBoundingClientRect(),x=event?.clientX??rect.left+rect.width/2,y=event?.clientY??rect.bottom;
 tableCountTooltip.style.left=Math.max(8,Math.min(x+14,window.innerWidth-tableCountTooltip.offsetWidth-8))+'px';
 tableCountTooltip.style.top=Math.max(8,Math.min(y+14,window.innerHeight-tableCountTooltip.offsetHeight-8))+'px';
}
function previewAttrs(card){if(card?._dpFaceDownEnergyRole)return 'data-card-back="true"';return ruleArt(card)?`data-preview-src="${esc(ruleArt(card))}" data-preview-name="${esc(card.name)}"`:'';}
function seatCard(list,p,index,active){
 const card=list.getPokemonCard(),secret=list.isSecret&&list.cards.length,legend=LegendDisplay.pair(list);
 const focus=seatFocus?.player===p.id&&seatFocus.index===index&&seatFocus.active===active;
 const attachments=!secret?[...new Set([...list.cards,...(list.energies?.cards||[]),...(list.tools||[])])].filter(c=>c!==card&&!legend?.includes(c)):[];
 return `<div class="seat-slot ${active?'seat-active':'seat-bench'} ${focus?'focused':''}" data-seat-slot data-slot-player="${p.id}" data-slot-kind="${active?'active':'bench'}" data-slot-index="${index}"><span class="seat-zone-name">${active?'ACTIVE':'BENCH '+(index+1)}</span>
  ${attachments.length?`<div class="seat-energy">${attachments.map(c=>`<span ${previewAttrs(c)} title="${esc(c._dpFaceDownEnergyRole?'Face-down Energy':c.name)}">${ruleArt(c)?`<img src="${esc(ruleArt(c))}" alt="${esc(c.name)}">`:'Energy'}</span>`).join('')}</div>`:''}
  <button class="seat-pokemon ${legend?'complete-legend':''} ${card||secret?'occupied':''}" ${legend?LegendDisplay.attrs(list):''} ${!secret&&card?previewAttrs(card):'data-card-back="true"'} onclick="focusSeat(${p.id},${index},${active})" aria-label="${secret?'Face-down Pokémon':card?'Select '+esc(card.name):'Empty '+(active?'Active':'Bench')}" >${secret?'<img src="ilex-card-back.svg" alt="Face-down Pokémon">':card&&ruleArt(card)?`<img src="${esc(ruleArt(card))}" alt="${esc(card.name)}" ${legend?LegendDisplay.attrs(list):''}>`:card?`<span>${esc(card.name)}${ruleCounterLabels(list)?' · '+esc(ruleCounterLabels(list)):''}</span>`:'<span>＋</span>'}</button>
  ${card&&!secret?`<span class="seat-counters">${list.damage?`<b>${list.damage}</b> damage`:'Healthy'}${list.specialConditions.length?' · '+list.specialConditions.map(s=>esc(RulesMatch.R.SpecialCondition[s])).join(' / '):''}${ruleCounterLabels(list)?' · '+esc(ruleCounterLabels(list)):''}</span>`:''}
 </div>`;
}
function tableCountAttrs(p,kind,opponent){
 const count=p[kind].cards.length,label=`${opponent?'Opponent':'Your'} ${kind}: ${count} ${count===1?'card':'cards'}`;
 return `data-count-player="${p.id}" data-count-kind="${kind}" data-count-owner="${opponent?'Opponent':'Your'}" tabindex="0" aria-label="${esc(label)}" aria-describedby="table-count-tooltip"`;
}
function seatPile(p,kind,opponent=false){
 const cards=kind==='prizes'?p.prizes.filter(l=>l.cards.length):p[kind].cards;
 const top=kind==='discard'?cards.at(-1):null;
 return `<div class="seat-pile seat-${kind}" ${kind!=='prizes'?tableCountAttrs(p,kind,opponent):''}><span class="pile-caption"><span class="pile-name">${kind==='prizes'?'PRIZES':kind.toUpperCase()}</span><b class="pile-count">${cards.length}</b></span>${kind==='prizes'?`<div class="seat-prizes">${cards.map(list=>list.faceUpPrize?`<img src="${esc(ruleArt(list.cards[0]))}" alt="${esc(list.cards[0].name)}" ${previewAttrs(list.cards[0])}>`:'<img src="ilex-card-back.svg" alt="Face-down prize" data-card-back="true">').join('')}</div>`:`<div class="pile-stack" ${top?previewAttrs(top):'data-card-back="true"'}>${cards.length?`<img src="${esc(top?ruleArt(top):'ilex-card-back.svg')}" alt="${esc(top?top.name:'Face-down deck')}" data-card-back="${top?'false':'true'}">`:'<span>Empty</span>'}</div>`}${kind==='discard'?`<button onclick="showRuleDiscard(${p.id})">View discard</button>`:''}</div>`;
}
function renderSeatedTable(g,prompt){
 hideTableCount();
 const viewerId=(typeof IlexPresentation!=='undefined'?IlexPresentation.viewer(rulesMatch):null)??(rulesMatch.spec.opponent?.type==='bot'?rulesMatch.spec.opponent.humanPlayer:prompt?.getPerspectivePlayerId?.()??prompt?.playerId??g.players[g.activePlayer]?.id??g.players[0].id);
 const near=g.players.find(p=>p.id===viewerId)||g.players[0],far=g.players.find(p=>p!==near);
 const enabled=g.players[g.activePlayer]===near&&!prompt&&g.phase===RulesMatch.R.GamePhase.PLAYER_TURN;
 if(!seatFocus||seatFocus.player!==near.id)seatFocus={player:near.id,index:0,active:true};
 const hand=(p,own)=>{
   const visible=own||p.hand.isPublic;
   return `<div class="seat-hand ${own?'near-hand':'far-hand'}" ${tableCountAttrs(p,'hand',!own)}><span class="hand-label">${own?'YOUR HAND':'OPPONENT HAND'} · ${p.hand.cards.length}</span><div class="hand-fan">${p.hand.cards.map((c,i)=>`<button class="fan-card" style="--fan:${i-(p.hand.cards.length-1)/2};--hand-size:${p.hand.cards.length}" ${visible?previewAttrs(c):'data-card-back="true"'} ${own&&enabled?`onclick="pickRuleHand(${p.id},${i})"`:'aria-disabled="true"'} aria-label="${visible?esc(c.name):'Face-down opponent card'}">${visible&&ruleArt(c)?`<img src="${esc(ruleArt(c))}" alt="${esc(c.name)}">`:'<img src="ilex-card-back.svg" alt="Face-down opponent card" data-card-back="true">'}</button>`).join('')}</div></div>`;
 };
 const half=(p,opponent)=>`<section class="seat-half ${opponent?'far-seat':'near-seat'}" data-seat-player="${p.id}"><div class="seat-bench-row">${p.bench.map((l,i)=>seatCard(l,p,i,false)).join('')}</div><div class="seat-active-row">${seatCard(p.active,p,0,true)}</div>${seatPile(p,'prizes')}${seatPile(p,'deck',opponent)}${seatPile(p,'discard',opponent)}${p.stadium.cards.length?`<div class="seat-stadium">${p.stadium.cards.map(c=>`<button ${previewAttrs(c)} ${enabled&&c._wotcStadiumAction!==false&&(near.stadiumUsedTurn!==g.turn||c._wotcUnlimitedStadiumAction)?`onclick="ruleAction({type:'stadium',player:${near.id}})"`:''}>${ruleArt(c)?`<img src="${esc(ruleArt(c))}" alt="${esc(c.name)}">`:esc(c.name)}</button>`).join('')}</div>`:''}</section>`;
 return `<div class="table-layout"><div class="seated-experience"><div class="opponent-seat"><span class="dot"></span>${esc(far.name)}<span>Across the table</span></div>${hand(far,false)}<div class="table-scene"><div class="felt-table"><div class="felt-mark">ILEX<span>.GG</span><small>EVERY ERA. YOUR ADVENTURE.</small></div>${half(far,true)}<div class="table-divider"></div>${half(near,false)}</div></div>${hand(near,true)}<div class="seat-player-bar"><strong>${esc(near.name)}</strong><span>Right-click to magnify · Click to select</span></div></div></div>`;
}
function focusSeat(player,index,active){seatFocus={player,index,active};rulesTable();}

tableCountTooltip=document.createElement('div');tableCountTooltip.id='table-count-tooltip';tableCountTooltip.setAttribute('role','tooltip');tableCountTooltip.hidden=true;document.body.append(tableCountTooltip);
document.addEventListener('pointerover',e=>{const zone=e.target.closest?.('[data-count-kind]');if(zone)showTableCount(zone,e);});
document.addEventListener('pointermove',e=>{const zone=e.target.closest?.('[data-count-kind]');if(zone)showTableCount(zone,e);else if(tableCountZone)hideTableCount();});
document.addEventListener('pointerout',e=>{if(tableCountZone&&!tableCountZone.contains(e.relatedTarget))hideTableCount();});
document.addEventListener('focusin',e=>{const zone=e.target.closest?.('[data-count-kind]');if(zone)showTableCount(zone);});
document.addEventListener('focusout',e=>{if(tableCountZone&&!tableCountZone.contains(e.relatedTarget))hideTableCount();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideTableCount();});
document.addEventListener('dragstart',hideTableCount);window.addEventListener('blur',hideTableCount);
const magnifier=document.createElement('dialog');magnifier.id='cardmagnifier';
magnifier.innerHTML='<button class="magnify-close" aria-label="Close card preview">×</button><h2 id="magnify-title"></h2><div id="finish-preview"><img id="magnify-image" alt=""></div><p>Esc or click outside to return to the table.</p>';
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
 const magnify= magnifier.querySelector('#magnify-image');LegendDisplay.reset(magnify);magnify.src=src;if(node?.dataset.legendTop)LegendDisplay.decorate(magnify,node);magnifier.querySelector('#magnify-image').alt=name;magnifier.querySelector('#magnify-title').textContent=name;
 if(typeof PackFinish!=='undefined')PackFinish.decorate(document.querySelector('#finish-preview'),node?.dataset.previewFinish,node?.dataset.previewEnergy);
 if(!magnifier.open)magnifier.showModal();
},true);

const seatedPlay=play;
play=function(){hideTableCount();seatedPlay();document.body.classList.toggle('in-match',!!(tableMode==='rules'?rulesMatch:state.game));if(tableMode==='manual'&&state.game){
 const table=document.querySelector('.table');if(!table)return;table.classList.add('manual-seated');
 const players=[...table.querySelectorAll('.player')];const near=players[state.game.player],far=players[1-state.game.player];
 far.classList.add('manual-far');near.classList.add('manual-near');table.append(far,near);
 for(const [playerIndex,p] of players.entries())for(const [i,zone] of [...p.querySelectorAll('.zone')].entries()){
  const kind=zoneNames[i];zone.classList.add('manual-'+kind);
  if(['deck','discard','hand'].includes(kind)){
   const count=state.game.players[playerIndex][kind].length,owner=playerIndex===state.game.player?'Your':'Opponent';
   zone.dataset.countMode='manual';zone.dataset.countPlayer=playerIndex;zone.dataset.countKind=kind;zone.dataset.countOwner=owner;zone.tabIndex=0;
   zone.setAttribute('aria-describedby','table-count-tooltip');zone.setAttribute('aria-label',`${owner} ${kind}: ${count} ${count===1?'card':'cards'}`);
  }
 }
}};
const seatedRender=render;
render=function(){seatedRender();document.body.classList.toggle('in-match',tab==='play'&&!!(tableMode==='rules'?rulesMatch:state.game));};




