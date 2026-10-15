/* Enlarged field actions use the same validated journal as tabletop controls. */
const cardActionDialog=document.createElement('dialog');cardActionDialog.id='cardactions';document.body.append(cardActionDialog);
let cardActionView=null;
function cardActionEntries(player,list,active,index){
 const R=RulesMatch.R,c=list.getPokemonCard();if(!c)return [];
 const target={player:R.PlayerType.BOTTOM_PLAYER,slot:active?R.SlotType.ACTIVE:R.SlotType.BENCH,index};
 const printed=[...c.powers.filter(p=>!p._dpExtra).map(p=>({kind:'ability',name:p.name,text:p.text||'',passive:p.powerType===R.PowerType.POKEBODY||p._wotcPassive||p.powerType===R.PowerType.HOLONS_SPECIAL_ENERGY_EFFECT,action:{type:'ability',player:player.id,name:p.name,target}})),...c.attacks.map(a=>({kind:'attack',name:a.name,text:a.text||'',passive:!active&&!a.useOnBench,action:{type:'attack',player:player.id,name:a.name}}))];
 const extras=active?RulesMatch.attacks(rulesMatch,player).filter(a=>!c.attacks.some(p=>p.name===a.name)).map(a=>({kind:'attack',name:a.name,text:a.text||'',copied:true,action:{type:'attack',player:player.id,name:a.name}})):[];
 const inherited=RulesMatch.powers(rulesMatch,player,list).filter(p=>p._dpExtra||!c.powers.some(own=>own.name===p.name)).map(p=>({kind:'ability',name:p.name,text:p.text||'',copied:true,passive:p.powerType===R.PowerType.POKEBODY||p._wotcPassive,action:{type:'ability',player:player.id,name:p.name,target}}));
 const retreats=active?player.bench.flatMap((slot,i)=>slot.getPokemonCard()?[{kind:'retreat',name:'Retreat to '+slot.getPokemonCard().name+' · Bench '+(i+1),text:'',action:{type:'retreat',player:player.id,index:i}}]:[]):[];
 return [...printed,...extras,...inherited,...retreats];
}
function openCardActions(playerId,index,active){
 const m=rulesMatch;if(!m||tableMode!=='rules')return;
 const player=m.store.state.players.find(p=>p.id===playerId),list=active?player?.active:player?.bench[index],card=list?.getPokemonCard();
 if(!card)return;
 if(list.isSecret)return openFaceDownActions(player,index,active,card);
 hideTableCount();const g=m.store.state,bot=m.spec.opponent,owned=bot?.type!=='bot'||player.id===bot.humanPlayer;
 const enabled=owned&&g.phase===RulesMatch.R.GamePhase.PLAYER_TURN&&g.players[g.activePlayer]===player&&!RulesMatch.pending(m).length;
 const entries=cardActionEntries(player,list,active,index);
 for(const entry of entries){
  entry.reason=entry.passive?'This effect is not activated from this field position.':!enabled?'Actions are available on your turn after pending choices are resolved.':'';
  if(!entry.reason){try{const f=BotAI.fork(m,player.id);RulesMatch.apply(f,entry.action);}catch(e){entry.reason=friendly(e.message);}}
 }
 cardActionView={match:m,journal:m.journal.length,cardId:card.id,playerId,index,active,entries};
 const id=card._labId||'',vintage=/^(base|gym|neo|lc-|si)/.test(id),start=vintage?.58:.50,end=vintage?.835:.895;
 const printed=entries.filter(e=>!e.copied&&e.kind!=='retreat'),weights=printed.map(e=>1.7+Math.ceil(e.text.length/65)),total=weights.reduce((a,b)=>a+b,0)||1;let top=start;
 const button=(entry,i,style='',named=false)=>`<button class="card-action-hotspot ${named?'named-action':''} ${entry.reason?'unavailable':''}" data-card-action="${i}" style="${style}" ${entry.reason?'disabled':''} title="${esc(entry.reason||'Use '+entry.name)}" aria-label="${esc(entry.name+(entry.reason?' — '+entry.reason:''))}"><span>${esc(entry.name)}</span></button>`;
 // Scan-reviewed boundaries keep neighbouring printed names in separate regions.
 const reviewed=card.name==='Alakazam'&&printed.length===2&&printed[0].name==='Damage Swap'?[.58,.723,.835]:card.name==='Jirachi'&&printed.length===2&&printed[0].name==='Wishing Star'?[.50,.75,.895]:null;
 const regions=printed.map((entry,i)=>{const height=reviewed?reviewed[i+1]-reviewed[i]:(end-start)*weights[i]/total;if(reviewed)top=reviewed[i];const result=button(entry,entries.indexOf(entry),`top:${top*100}%;${reviewed?'height:'+height*100+'%;':'height:auto;'}`,!reviewed);top+=height;return result;}).join('');
 const art=ruleArt(card);
 cardActionDialog.innerHTML=`<button class="card-action-close" aria-label="Close card actions">×</button><h2>${esc(card.name)}</h2><p>${enabled?'Select an attack or Power on the card.':'Card inspection · actions unavailable'}</p><div class="card-action-scan ${art?'':'no-scan'}">${art?`<img src="${esc(art)}" alt="${esc(card.name)}" ${previewAttrs(card)}>`:`<h3>${esc(card.name)}</h3>`}${art?regions:printed.map(e=>button(e,entries.indexOf(e))).join('')}</div>${entries.some(e=>e.copied)?`<div class="card-copied-actions"><h3>Additional attacks and Powers</h3>${entries.filter(e=>e.copied).map(e=>button(e,entries.indexOf(e))).join('')}</div>`:''}<p class="card-action-help">Highlighted regions are clickable. Unavailable actions are dimmed. Esc returns to the table.</p>`;
 cardActionDialog.querySelector('.card-action-close').onclick=()=>cardActionDialog.close();
 if(active)cardActionDialog.querySelector('.card-action-help').insertAdjacentHTML('beforebegin',`<section class="card-retreat-actions"><h3>Retreat · choose a Benched Pokémon</h3>${entries.filter(e=>e.kind==='retreat').map(e=>button(e,entries.indexOf(e))).join('')||'<p>No Benched Pokémon available.</p>'}</section>`);
 cardActionDialog.querySelectorAll('[data-card-action]').forEach(button=>button.onclick=()=>activateCardAction(Number(button.dataset.cardAction)));
 if(!cardActionDialog.open)cardActionDialog.showModal();
}
function openFaceDownActions(player,index,active,card){
 const m=rulesMatch,R=RulesMatch.R,g=m.store.state,bot=m.spec.opponent;
 const enabled=(bot?.type!=='bot'||player.id===bot.humanPlayer)&&g.players[g.activePlayer]===player&&g.phase===R.GamePhase.PLAYER_TURN&&!RulesMatch.pending(m).length&&card._wotcRevealAction;
 const entry={name:'Reveal face-down card',reason:enabled?'':'This face-down card cannot be revealed now.',action:{type:'ability',player:player.id,name:'Reveal face-down card',target:{player:R.PlayerType.BOTTOM_PLAYER,slot:active?R.SlotType.ACTIVE:R.SlotType.BENCH,index}}};
 cardActionView={match:m,journal:m.journal.length,cardId:card.id,playerId:player.id,index,active,entries:[entry]};hideTableCount();
 cardActionDialog.innerHTML=`<button class="card-action-close" aria-label="Close card actions">×</button><h2>Face-down Pokémon</h2><div class="card-action-scan"><img src="ilex-card-back.svg" alt="Face-down Pokémon" data-card-back="true"></div><section class="card-retreat-actions"><button data-card-action="0" ${enabled?'':'disabled'}>Reveal card</button></section>`;
 cardActionDialog.querySelector('.card-action-close').onclick=()=>cardActionDialog.close();cardActionDialog.querySelector('[data-card-action]').onclick=()=>activateCardAction(0);
 if(!cardActionDialog.open)cardActionDialog.showModal();
}
function activateCardAction(index){
 const view=cardActionView,entry=view?.entries[index];if(!entry||entry.reason)return;
 const player=rulesMatch?.store.state.players.find(p=>p.id===view.playerId),list=view.active?player?.active:player?.bench[view.index];
 if(rulesMatch!==view.match||rulesMatch.journal.length!==view.journal||list?.getPokemonCard()?.id!==view.cardId){cardActionDialog.close();toast('The game changed. Select the Pokémon again.');return;}
 cardActionDialog.close();cardActionView=null;ruleAction(entry.action);
}
cardActionDialog.addEventListener('click',e=>{if(e.target===cardActionDialog){const r=cardActionDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)cardActionDialog.close();}});
cardActionDialog.addEventListener('close',()=>{if(!cardActionDialog.open)cardActionView=null;});
const focusSeatForActions=focusSeat;
focusSeat=function(player,index,active){focusSeatForActions(player,index,active);openCardActions(player,index,active);};
