/* Enlarged field actions use the same validated journal as tabletop controls. */
const cardActionDialog=document.createElement('dialog');cardActionDialog.id='cardactions';document.body.append(cardActionDialog);
let cardActionView=null;
function cardActionEntries(player,list,active,index){
 const R=RulesMatch.R,c=list.getPokemonCard();if(!c)return [];
 const target={player:R.PlayerType.BOTTOM_PLAYER,slot:active?R.SlotType.ACTIVE:R.SlotType.BENCH,index};
 const printed=[...c.powers.filter(p=>!p._dpExtra&&!(c._swshUnionPart!==undefined&&p.powerType===R.PowerType.VUNION_ASSEMBLY)).map(p=>({kind:'ability',name:p.name,text:p.text||'',passive:p.powerType===R.PowerType.POKEBODY||p._wotcPassive||p.powerType===R.PowerType.HOLONS_SPECIAL_ENERGY_EFFECT,action:{type:'ability',player:player.id,name:p.name,target}})),...c.attacks.map(a=>({kind:'attack',name:a.name,text:a.text||'',passive:!active&&!a.useOnBench,action:{type:'attack',player:player.id,name:a.name,target}}))];
 const extras=active?RulesMatch.attacks(rulesMatch,player).filter(a=>!c.attacks.some(p=>p.name===a.name)).map(a=>({kind:'attack',name:a.name,text:a.text||'',copied:true,action:{type:'attack',player:player.id,name:a.name,target}})):[];
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
 // VSTAR Powers are printed below the ordinary attack, including Ability Powers.
 const vstar=card.stage===RulesMatch.R.Stage.VSTAR;
 const printed=entries.filter(e=>!e.copied&&e.kind!=='retreat');
 if(vstar)printed.sort((a,b)=>(a.kind==='ability')-(b.kind==='ability'));
 const weights=printed.map(e=>1.7+Math.ceil(e.text.length/65)),total=weights.reduce((a,b)=>a+b,0)||1;let top=start;
 const button=(entry,i,style='',overlay=false)=>`<button class="card-action-hotspot ${overlay?'scan-action':''} ${entry.reason?'unavailable':''}" data-card-action="${i}" style="${style}" ${entry.reason?'disabled':''} title="${esc(entry.reason||'Use '+entry.name)}" aria-label="${esc(entry.name+(entry.reason?' — '+entry.reason:''))}">${overlay?'':`<span>${esc(entry.name)}</span>`}</button>`;
 // Scan-reviewed boundaries keep neighbouring printed names in separate regions.
 const reviewed=vstar&&printed.length===2?[.50,.66,.86]:card.name==='Alakazam'&&printed.length===2&&printed[0].name==='Damage Swap'?[.58,.723,.835]:card.name==='Jirachi'&&printed.length===2&&printed[0].name==='Wishing Star'?[.50,.75,.895]:null;
 const joined=!!LegendDisplay.pair(list);if(joined)top=.66;
 const unionRegions={
  'Union Gain':[.115,.177,.37,.063],'Shocking Shock':[.525,.177,.37,.063],'Disconnect':[.115,.790,.37,.070],'Electro Ball Together':[.525,.825,.37,.040],
  'Ninja Body':[.525,.177,.37,.065],'Aqua Edge':[.525,.250,.37,.035],'Antidote Jutsu':[.115,.740,.37,.045],'Feel the Way':[.525,.740,.37,.055],'Twister Shuriken':[.115,.790,.37,.070],'Waterfall Bind':[.525,.800,.37,.065],
  'Super Regeneration':[.525,.177,.37,.060],'Psysplosion':[.115,.800,.37,.065],'Photon Barrier':[.525,.750,.37,.075],'Final Burn':[.525,.830,.37,.035],
  'Dance of the Crowned Sword':[.525,.177,.37,.075],'Steel Cut':[.115,.825,.37,.035],'Master Blade':[.525,.800,.37,.065],
  'All You Can Eat':[.525,.177,.37,.060],'Burst Wheel':[.115,.780,.37,.080],'Electric Ball':[.525,.825,.37,.040]
 };
 const regions=printed.map((entry,i)=>{const union=card._swshUnionPart!==undefined&&unionRegions[entry.name];if(union){const [x,y,w,h]=union;return button(entry,entries.indexOf(entry),`left:${x*100}%;top:${y*100}%;width:${w*100}%;height:${h*100}%;`,true);}const height=reviewed?reviewed[i+1]-reviewed[i]:((joined ? .96 : end)-(joined ? .66 : start))*weights[i]/total;if(reviewed)top=reviewed[i];const result=button(entry,entries.indexOf(entry),`top:${top*100}%;height:${height*100}%;`,true);top+=height;return result;}).join('');
 const legendParts=LegendDisplay.pair(list)||[],legendBottom=legendParts[1];
 const art=ruleArt(legendParts.length===4?legendParts[0]:legendBottom||card);
 cardActionDialog.innerHTML=`<button class="card-action-close" aria-label="Close card actions">×</button><h2>${esc(card.name)}</h2><p>${enabled?'Select an attack or Power on the card.':'Card inspection · actions unavailable'}</p><div class="card-action-scan ${legendParts.length?'complete-legend':''} ${art?'':'no-scan'}">${art?`<img src="${esc(art)}" alt="${esc(card.name)}" ${previewAttrs(card)} ${legendParts.length?LegendDisplay.attrs(list):''}>`:`<h3>${esc(card.name)}</h3>`}${art?regions:printed.map(e=>button(e,entries.indexOf(e))).join('')}</div>${entries.some(e=>e.copied)?`<div class="card-copied-actions"><h3>Additional attacks and Powers</h3>${entries.filter(e=>e.copied).map(e=>button(e,entries.indexOf(e))).join('')}</div>`:''}<p class="card-action-help">Select a printed attack or Power in its outlined region. Hover or focus for availability details. Esc returns to the table.</p>`;
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
