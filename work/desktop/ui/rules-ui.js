let rulesMatch=null,ruleMap={},cardMetadata={},deckCodes={},wotcCoverage=null,rulesReady=false,ruleSelected=null,promptChoice=[];
const wotcPresets=[
  {id:'wotc-base-fossil',name:'WOTC · Base–Fossil',sets:'base1,base2,base3',ruleProfile:'wotc'},
  {id:'wotc-base-rocket',name:'WOTC · Base–Team Rocket',sets:'base1,base2,base3,base4,base5',ruleProfile:'wotc'},
  {id:'wotc-base-gym',name:'WOTC · Base–Gym Challenge',sets:'base1,base2,base3,base4,base5,gym1,gym2',ruleProfile:'wotc'},
  {id:'wotc-base-neo',name:'WOTC · Base–Neo Revelation',sets:'base1,base2,base3,base4,base5,gym1,gym2,neo1,neo2,neo3,si1',ruleProfile:'wotc'},
  {id:'wotc-neo-destiny',name:'WOTC · Base–Neo Destiny',sets:'base1,base2,base3,base4,base5,gym1,gym2,neo1,neo2,neo3,neo4,si1',ruleProfile:'wotc2002'},
  {id:'wotc-base-skyridge',name:'WOTC · Base–Skyridge',sets:'base1,base2,base3,base4,base5,gym1,gym2,neo1,neo2,neo3,neo4,si1,lc,ecard1,ecard2,ecard3,basep',ruleProfile:'wotc2002'}
];
if(state.wotcFormatVersion!==1){for(const p of wotcPresets)if(!(state.removedFormatIds||[]).includes(p.id)&&!state.formats.some(f=>f.id===p.id))state.formats.push({...p,size:60,copies:4,prizes:6,banned:'',custom:false});state.wotcFormatVersion=1;save();}
const skyridgePreset=wotcPresets.find(f=>f.id==='wotc-base-skyridge');
for(const f of state.formats)if(f.id===skyridgePreset.id&&f.sets===skyridgePreset.sets){f.sets+=',bog';save();}
const manualTable=play;
let tableMode='rules';
const friendly=s=>String(s||'').replace(/^(?:LOG_|SETUP_)/,'').replaceAll('_',' ').toLowerCase();
const rulesAssets=Promise.all(['rules-card-map.json','card-details.json','deck-set-codes.json','wotc-coverage.json'].map(u=>fetch(u).then(r=>r.json()))).then(([m,d,c,w])=>{
  Object.assign(d,LimitlessCollection.metadata);ruleMap=RulesMatch.withAliases(m,LimitlessCollection);cardMetadata=d;deckCodes=c;wotcCoverage=w;rulesReady=true;
  if(state.rulesMatch)try{
    rulesMatch=RulesMatch.restore(state.rulesMatch,ruleMap,state.rulesMatch.spec.custom||state.custom);
    if(rulesMatch.recoveredInvalidAttack){state.botPaused=true;state.botError='Recovered the turn before an unfinished attack with insufficient Energy.';saveRules();}
  }catch(e){state.rulesRestoreError=e.message;}
  if(tab==='play')play();else if(tab==='decks')decks();else if(tab==='library'&&cards.length)library();
});
function openWotcCoverage(){
 if(!wotcCoverage)return;let dialog=document.getElementById('wotccoverage');if(!dialog){dialog=document.createElement('dialog');dialog.id='wotccoverage';dialog.style.cssText='width:min(780px,92vw);max-height:85vh;overflow:auto;border:1px solid #6b9e77;border-radius:18px;background:#102a24;color:#e6f2df;padding:24px';document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});}
 dialog.innerHTML='<div class="row"><h2>WOTC rules coverage</h2><button onclick="document.getElementById(\'wotccoverage\').close()">Close</button></div><p>'+wotcCoverage.available.toLocaleString()+' / '+wotcCoverage.total.toLocaleString()+' printings available. '+wotcCoverage.pending.toLocaleString()+' still need effects. Unavailable cards block enforced matches.</p><table style="width:100%;text-align:left"><thead><tr><th>Set</th><th>Available</th><th>Total</th></tr></thead><tbody>'+wotcCoverage.bySet.map(s=>'<tr><td>'+esc(s.name)+'</td><td>'+s.available+'</td><td>'+s.total+'</td></tr>').join('')+'</tbody></table><details style="margin-top:18px"><summary>Cards still awaiting automation</summary>'+wotcCoverage.unsupported.map(c=>'<p>'+esc(c.name)+' <small>('+esc(c.id)+')</small></p>').join('')+'</details><p>Availability is implementation coverage; it does not certify every possible interaction or historical ruling.</p>';dialog.showModal();
}
const oldDetails=details;
details=async id=>cardMetadata[id]?{...find(id),...cardMetadata[id]}:oldDetails(id);
function ruleCard(c){return find(c?._labId)||find(Object.keys(ruleMap).find(id=>ruleMap[id]===c?.fullName))||{name:c?.name||'Card'};}
function ruleArt(c){return c?._dpFaceDownEnergyRole?'ilex-card-back.svg':image(ruleCard(c));}
function saveRules(){state.rulesMatch={spec:rulesMatch.spec,journal:rulesMatch.journal,undoHistory:RulesMatch.undoPoints(rulesMatch)};save();}
function autoRules(){
  for(let n=0;n<1000;n++){
    const p=RulesMatch.pending(rulesMatch).find(p=>['Coin flip','Shuffle deck','Shuffle hand','WaitPrompt'].includes(p.type));if(!p)return;
    let value=true;
    if(p.type==='Coin flip')value=!!(crypto.getRandomValues(new Uint32Array(1))[0]&1);
    else if(p.type.startsWith('Shuffle')){
      const player=rulesMatch.store.state.players.find(x=>x.id===p.getPerspectivePlayerId());
      value=shuffle(Array.from({length:p.type==='Shuffle hand'?player.hand.cards.length:player.deck.cards.length},(_,i)=>i));
    }
    if(typeof IlexPresentation!=='undefined')IlexPresentation.noteCoin(p,value);
    RulesMatch.apply(rulesMatch,{type:'prompt',id:p.id,value});
  }throw Error('Effect exceeded the resolution limit.');
}
function ruleAction(a){
  if(typeof IlexPresentation!=='undefined'&&IlexPresentation.busy())return;
  const visualBefore=typeof IlexPresentation!=='undefined'?IlexPresentation.before(rulesMatch,a):null;
  try{const audioBefore=typeof IlexAudio!=='undefined'?IlexAudio.before(rulesMatch,a):null;const before={spec:rulesMatch.spec,journal:rulesMatch.journal.slice(),undoHistory:RulesMatch.undoPoints(rulesMatch)};
    try{RulesMatch.apply(rulesMatch,a);autoRules()}catch(e){rulesMatch=RulesMatch.restore(before,ruleMap,before.spec.custom||state.custom);throw e}
    if(typeof IlexPresentation!=='undefined')IlexPresentation.after(visualBefore,rulesMatch,a);
    if(typeof IlexAudio!=='undefined')IlexAudio.after(audioBefore,rulesMatch,a);RulesMatch.checkpoint(rulesMatch,before.journal.length);ruleSelected=null;promptChoice=[];saveRules();play();
  }catch(e){if(typeof IlexPresentation!=='undefined')IlexPresentation.abort(visualBefore);toast(friendly(e.message));play()}
}
function undoRuleAction(){
 if(typeof IlexPresentation!=='undefined')IlexPresentation.cancel();
 if(!rulesMatch||!RulesMatch.undoPoints(rulesMatch).length)return;
 try{const restored=RulesMatch.undoAction(rulesMatch,ruleMap,rulesMatch.spec.custom||state.custom);if(typeof stopBotForUndo==='function')stopBotForUndo();rulesMatch=restored;ruleSelected=null;promptChoice=[];if(typeof seatFocus!=='undefined')seatFocus=null;state.rulesRestoreError='';saveRules();if(typeof IlexAudio!=='undefined')IlexAudio.play('undo');play();toast(restored.spec.opponent?.type==='bot'?'Action undone. Bot paused.':'Action undone.');}catch(e){toast('Could not undo: '+e.message);}
}
async function beginRules(){
  await rulesAssets;
  const ds=[$('#rp1').value,$('#rp2').value].map(id=>(typeof ruleDeckChoices==='function'?ruleDeckChoices():state.decks).find(d=>d.id===id));
  if(ds.some(d=>!d))return toast('Create two decks first.');
  const selectedFormat=state.formats.find(f=>f.id===$('#matchformat')?.value);
  if(!selectedFormat||ds.some(d=>d.format!==selectedFormat.id))return toast('Choose two decks assigned to the selected match format.');
  const formatsUsed=ds.map(()=>selectedFormat);
  if(formatsUsed.some(f=>!f))return toast('Choose a format for each deck before starting a match.');
  const profile=$('#ruleprofile').value;
  if(formatsUsed.some(f=>+f.size!==60||+f.prizes!==6))return toast('Automated matches currently require 60-card decks and 6 prizes.');
  const problems=[];
  for(let i=0;i<2;i++){
    const f=formatsUsed[i],d=ds[i];
    const counts={};for(const [id,n] of Object.entries(d.cards)){const c=cardMetadata[id]||find(id);if(c?.category==='Energy'&&c.energyType==='Normal')continue;const name=c?.name||id;counts[name]=(counts[name]||0)+n;}
    for(const [name,n] of Object.entries(counts))if(n>+f.copies)problems.push(`${d.name}: ${name} exceeds the format's ${f.copies}-copy limit`);
    for(const [id,n] of Object.entries(d.cards)){
      const c=find(id);if(!c){problems.push(`${d.name}: missing ${id}`);continue;}
      if(c.custom&&!f.custom)problems.push(`${d.name}: custom cards disabled`);
      if(!c.custom&&!ruleMap[id])problems.push(`${d.name}: ${c.name} (${id}) has no automated implementation`);
      if(f.sets&&!c.custom&&!limitlessPrintingAllowed(id,cardMetadata[id]||c,f,f.sets.split(',').map(s=>s.trim()).filter(Boolean)))problems.push(`${d.name}: ${c.name} is outside its format`);
      if(f.banned.split(',').map(s=>s.trim().toLowerCase()).includes(id.toLowerCase())||f.banned.split(',').map(s=>s.trim().toLowerCase()).includes((cardMetadata[id]?.name||c.name).toLowerCase()))problems.push(`${d.name}: ${c.name} is banned`);
    }
  }
  if(problems.length)return modal('<h2>Decks need attention</h2><p>These entries cannot be used in an enforced match. Their scans remain in the library.</p>'+problems.map(s=>'<p class="error">'+esc(s)+'</p>').join(''));
  if(rulesMatch&&!confirm('Replace the current rules match?'))return;
  try{
    const opponent=typeof newOpponentSettings==='function'?newOpponentSettings():{type:'local'};
    const candidate=RulesMatch.create({version:1,profile,opponent,format:{id:selectedFormat.id,name:selectedFormat.name},decks:ds.map(d=>({name:d.name,cards:d.cards})),custom:state.custom},ruleMap,state.custom);
    state.botPaused=false;state.botError='';
    if(typeof IlexPresentation!=='undefined')IlexPresentation.cancel();rulesMatch=candidate;const setupVisual=typeof IlexPresentation!=='undefined'?IlexPresentation.before(candidate,{type:'setup'}):null;autoRules();if(typeof IlexPresentation!=='undefined')IlexPresentation.after(setupVisual,candidate,{type:'setup'});saveRules();if(typeof IlexAudio!=='undefined')IlexAudio.play('shuffle');play();
  }catch(e){toast(e.message)}
}
function rulesProfileFor(deck){const f=state.formats.find(f=>f.id===deck?.format),profile=f?.ruleProfile||(f?.id==='expanded'?'expanded':'modern');if(['dp','dppl'].includes(profile)&&[...String(f.sets||'').split(','),...Object.keys(deck?.cards||{}).map(id=>id.split('-')[0])].some(id=>/^(?:hgss[1-4p]?|col1)$/.test(id.trim().replace(/-$/,''))))return 'hgss';if(profile==='dp'&&[...String(f.sets||'').split(','),...Object.keys(deck?.cards||{}).map(id=>id.split('-')[0])].some(id=>/^(?:dp[1-7]?|pl[1-4]?|dpp|pop[4-9]|ru1)$/.test(id.trim())))return 'dppl';if(profile==='ex'&&[...String(f.sets||'').split(','),...Object.keys(deck?.cards||{}).map(id=>id.split('-')[0])].some(id=>/^ex(?:[6-9]|1[0-6])$/.test(id.trim())))return 'exlate';return profile;}
function rulesTable(){
  const R=RulesMatch.R,g=rulesMatch?.store.state;
  $('#app').innerHTML=title('RULES TABLE','Play a rules-enforced match','Setup, card effects, attachments, attacks and checkup are resolved by the game engine.',`<button onclick="tableMode='manual';play()">Manual sandbox</button>`)+
    `<div class="panel"><div class="toolbar"><select id="rp1" aria-label="Player 1 deck">${state.decks.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select><select id="rp2" aria-label="Player 2 deck">${state.decks.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select><select id="ruleprofile" aria-label="Historical rules profile">${Object.entries(RulesMatch.profiles).map(([id,p])=>`<option value="${id}">${esc(p.name)}</option>`).join('')}</select><button class="primary" onclick="beginRules()">${g?'New match':'Start match'}</button></div>${state.rulesRestoreError?`<p class="error">Saved match could not resume: ${esc(state.rulesRestoreError)}</p>`:''}</div>`;
  if(!rulesReady){$('#app').innerHTML+='<p>Loading automated card catalog…</p>';return;}
  const wireSelectors=()=>{$('#ruleprofile').value=g?rulesMatch.spec.profile:rulesProfileFor(state.decks[0]);$('#rp1').onchange=()=>$('#ruleprofile').value=rulesProfileFor(state.decks.find(d=>d.id===$('#rp1').value));};
  if(!g){$('#app').innerHTML+='<div class="empty">Import a deck list or build a deck, then start a match. The engine guides legal setup and card choices.</div>';wireSelectors();return;}
  const prompt=RulesMatch.pending(rulesMatch)[0];
  $('#app').innerHTML+=`<div class="panel rule-status"><div class="row"><span class="pill">${esc(R.GamePhase[g.phase])} · TURN ${g.turn}</span><h2>${g.phase===R.GamePhase.FINISHED?(g.winner>=0&&g.winner<2?esc(g.players[g.winner].name)+' wins':'Match finished'):esc(g.players[g.activePlayer]?.name||'Setup')}</h2><span>${esc(RulesMatch.profiles[rulesMatch.spec.profile].name)}</span>${g.phase===R.GamePhase.PLAYER_TURN&&!prompt?`<button onclick="ruleAction({type:'pass',player:${g.players[g.activePlayer].id}})">End turn</button><button onclick="if(confirm('Concede this match?'))ruleAction({type:'concede',player:${g.players[g.activePlayer].id}})">Concede</button>`:''}</div></div><div id="ruleprompt"></div>`;
  $('.rule-status .row').insertAdjacentHTML('beforeend','<button id="undoruleaction" onclick="undoRuleAction()" '+(RulesMatch.undoPoints(rulesMatch).length?'':'disabled')+'>Undo Action</button>');
  $('#app').innerHTML+=renderSeatedTable(g,prompt)+`<details class="panel"><summary>Game log</summary><div class="log">${g.logs.slice(-80).reverse().map(l=>esc(friendly(l.message))+' '+esc(Object.entries(l.params||{}).filter(([k])=>k!=='timestamp').map(([k,v])=>k+': '+v).join(' · '))).join('<br>')}</div></details>`;
  const settings=$('#rp1').closest('.panel');const fold=document.createElement('details');fold.className='match-settings';fold.innerHTML='<summary>Match settings · '+esc(RulesMatch.profiles[rulesMatch.spec.profile].name)+'</summary>';settings.before(fold);fold.append(settings);
  wireSelectors();if(prompt)drawRulePrompt(prompt);
}
function ruleCounterLabels(list){const counters=list.wotcCounters||{};return [counters.char?'Char counter':'',counters.lightningRod?'Lightning Rod marker':'',counters.color!==undefined?'Color counter: '+RulesMatch.R.CardType[counters.color]:''].filter(Boolean).join(' · ');}
function ruleSlot(list,p,index,active,enabled){
  if(list.isSecret)return '<div class="rule-slot"><h3>Face-down card</h3>'+(enabled?'<button onclick="ruleAction({type:\'ability\',player:'+p.id+',name:\'Reveal face-down card\',target:'+esc(JSON.stringify({player:RulesMatch.R.PlayerType.BOTTOM_PLAYER,slot:active?RulesMatch.R.SlotType.ACTIVE:RulesMatch.R.SlotType.BENCH,index:active?0:index}))+'})">Reveal card</button>':'')+'</div>';
  if(list.isSecret&&list.cards.length)return `<div class="rule-slot"><h3>${active?'Active':'Bench '+(index+1)}</h3><div class="rule-pokemon" style="padding:35px 10px;background:#213e61;border:4px solid #dfc744;border-radius:9px;text-align:center">Face-down Pokémon</div></div>`;
  const R=RulesMatch.R,c=list.getPokemonCard(),target={player:R.PlayerType.BOTTOM_PLAYER,slot:active?R.SlotType.ACTIVE:R.SlotType.BENCH,index};
  return `<div class="rule-slot"><h3>${active?'Active':'Bench '+(index+1)}</h3>${c?`${ruleArt(c)?`<img class="rule-pokemon" src="${esc(ruleArt(c))}" alt="${esc(c.name)}">`:''}<strong>${esc(c.name)}</strong><p>${list.damage} damage · ${list.hp||c.hp} HP</p><p>${list.specialConditions.map(s=>R.SpecialCondition[s]).join(', ')||'Healthy'}</p><p>${esc(ruleCounterLabels(list))}</p><small>Stack: ${esc(list.cards.map(c=>c.name).join(', '))}${list.tools?.length?' · Tools: '+esc(list.tools.map(c=>c.name).join(', ')):''}</small>${enabled&&active?RulesMatch.attacks(rulesMatch,p).map(a=>`<button onclick="ruleAction({type:'attack',player:${p.id},name:${esc(JSON.stringify(a.name))}})">${esc(a.name)} · ${a.damage} · ${a.cost.map(x=>R.CardType[x]).join(' / ')}</button>`).join(''):''}${enabled?c.powers.filter(a=>a.powerType!==R.PowerType?.POKEBODY&&a.powerType!==R.PowerType.HOLONS_SPECIAL_ENERGY_EFFECT&&!a._wotcPassive).map(a=>`<button onclick="ruleAction({type:'ability',player:${p.id},name:${esc(JSON.stringify(a.name))},target:${esc(JSON.stringify(target))}})">${esc(a.name)}</button>`).join(''):''}${enabled&&!active?`<button onclick="ruleAction({type:'retreat',player:${p.id},index:${index}})">Retreat to here</button>`:''}`:'<p>Empty</p>'}</div>`;
}
function pickRuleHand(player,index){
  const R=RulesMatch.R,p=rulesMatch.store.state.players.find(p=>p.id===player),c=p.hand.cards[index];
  const options=[{target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0},label:'Active'},...p.bench.map((l,i)=>({target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.BENCH,index:i},label:'Bench '+(i+1)+(l.getPokemonCard()?' · '+l.getPokemonCard().name:' · empty')}))];
  if(c.superType===R.SuperType.TRAINER&&![R.TrainerType.TOOL].includes(c.trainerType)){ruleAction({type:'play',player,index,target:options[0].target});return;}
  const energyAction=RulesMatch.handEnergyAction(p,index);
  modal(`<h2>Play ${esc(c.name)}</h2>${ruleZoneAbilityButtons(p,R.SlotType.HAND,index)}${energyAction?`<button onclick="$('#modal').close();ruleAction(${esc(JSON.stringify(energyAction))})">Attach as Energy</button><p>Uses your Energy attachment for this turn. Follow the target and Energy-return choices. Or play as a Pokémon below.</p>`:''}<p>Choose where to play, evolve, or attach. The engine checks legality.</p>${options.map((o,i)=>`<button onclick="$('#modal').close();ruleAction({type:'play',player:${player},index:${index},target:${esc(JSON.stringify(o.target))}})">${esc(o.label)}</button>`).join(' ')}`);
}
function ruleZoneAbilityButtons(p,slot,index){const m=rulesMatch,c=(slot===RulesMatch.R.SlotType.HAND?p.hand:p.discard).cards[index],bot=m.spec.opponent;if(bot?.type==='bot'&&p.id!==bot.humanPlayer)return '';return RulesMatch.zoneAbilities(m,p,slot,index).map(action=>{let reason='';if(m.store.state.players[m.store.state.activePlayer]!==p||RulesMatch.pending(m).length)reason='Available on your turn after pending effects resolve.';else try{RulesMatch.apply(BotAI.fork(m,p.id),action);}catch(e){reason=friendly(e.message);}return `<button data-zone-ability="${esc(action.name)}" ${reason?'disabled':''} title="${esc(reason)}" onclick="useRuleZoneAbility(${p.id},${slot},${index},${c.id},${m.journal.length},${esc(JSON.stringify(action.name))})">${esc(action.name)}</button>`;}).join('');}
function useRuleZoneAbility(playerId,slot,index,cardId,journal,name){const m=rulesMatch,p=m?.store.state.players.find(p=>p.id===playerId),zone=slot===RulesMatch.R.SlotType.HAND?p?.hand:p?.discard;if(!m||m.journal.length!==journal||zone?.cards[index]?.id!==cardId){$('#modal').close();toast('The game changed. Select the card again.');return;}$('#modal').close();ruleAction({type:'ability',player:playerId,name,target:{player:RulesMatch.R.PlayerType.BOTTOM_PLAYER,slot,index}});}
function showRuleDiscard(id){const p=rulesMatch.store.state.players.find(p=>p.id===id);modal('<h2>Discard</h2>'+p.discard.cards.map((c,i)=>'<div class="discard-preview" '+previewAttrs(c)+'>'+(ruleArt(c)?'<img src="'+esc(ruleArt(c))+'" alt="'+esc(c.name)+'">':'')+'<span>'+esc(c.name)+'</span>'+ruleZoneAbilityButtons(p,RulesMatch.R.SlotType.DISCARD,i)+'</div>').join('')+'<h2>Lost Zone</h2>'+p.lostzone.cards.map(c=>'<div class="discard-preview" '+previewAttrs(c)+'>'+(ruleArt(c)?'<img src="'+esc(ruleArt(c))+'" alt="'+esc(c.name)+'">':'')+'<span>'+esc(c.name)+'</span></div>').join(''));}
play=function(){if(tableMode==='manual'){manualTable();$('#app').insertAdjacentHTML('afterbegin','<button onclick="tableMode=\'rules\';play()">Rules-enforced matches</button>');}else rulesTable();};
function promptRows(p){
  const R=RulesMatch.R,g=rulesMatch.store.state;
  if(p.type==='Choose cards')return p.cards.cards.map((c,i)=>({value:i,label:c.name,card:c,blocked:p.options.blocked.includes(i)||!R.matchesPromptFilter(c,p.filter)}));
  if(p.type==='Choose pokemon')return RulesMatch.targets(rulesMatch,p).map(x=>({value:x.target,label:x.label,blocked:p.options.blocked.some(b=>JSON.stringify(b)===JSON.stringify(x.target))}));
  if(p.type==='Choose prize'){const owner=g.players.find(x=>p.options.useOpponentPrizes?x.id!==p.getPerspectivePlayerId():x.id===p.getPerspectivePlayerId());return owner.prizes.map((list,slot)=>({list,slot})).filter(x=>x.list.cards.length).map((x,index)=>({value:index,label:'Prize '+(x.slot+1),blocked:p.options.blocked.includes(index)}));}
  if(p.type==='Choose energy')return p.energy.map((e,i)=>({value:i,label:e.card.name+' · '+e.provides.map(t=>R.CardType[t]).join('/'),card:e.card}));
  if(p.type==='Choose attack')return p.cards.flatMap((c,i)=>c.attacks.map(a=>({value:{index:i,attack:a.name},label:c.name+' · '+a.name,blocked:p.options.blocked.some(b=>b.index===i&&b.attack===a.name)})));
  if(p.type==='Select'||p.type==='SelectOption')return p.values.map((label,i)=>({value:i,label,blocked:p.options.disabled?.[i]}));
  return [];
}
function drawRulePrompt(p){
  const R=RulesMatch.R,el=$('#ruleprompt');
  let html=`<div class="panel pending-effect"><span class="pill">PLAYER ${p.playerId} · ${esc(p.type)}</span><h2>${esc(friendly(p.message||p.type))}</h2>${p.sourceCard?'<p>Effect: '+esc(p.sourceCard.name)+'</p>':''}`;
  const rows=promptRows(p);
  if(rows.length||['Choose cards','Choose energy','Choose pokemon','Choose prize'].includes(p.type)){
    html+=`<p>Select in order. ${p.options?.min!==undefined?'Minimum: '+p.options.min:''} ${p.options?.max!==undefined?'Maximum: '+p.options.max:''} ${p.options?.count?'Required: '+p.options.count:''}</p><div class="prompt-options">${rows.map((r,i)=>`<button class="prompt-pick ${promptChoice.some(v=>JSON.stringify(v)===JSON.stringify(r.value))?'primary':''}" data-choice="${i}" ${r.blocked?'disabled':''}>${r.card&&ruleArt(r.card)?`<img src="${esc(ruleArt(r.card))}" alt="${esc(r.label)}">`:''}${esc(r.label)}${promptChoice.some(v=>JSON.stringify(v)===JSON.stringify(r.value))?' · '+(promptChoice.findIndex(v=>JSON.stringify(v)===JSON.stringify(r.value))+1):''}</button>`).join('')}</div><button id="resolvechoice" class="primary">Confirm selection</button>`;
  }else if(p.type==='Confirm')html+='<button id="yeschoice" class="primary">Yes</button> <button id="nochoice">No</button>';
  else if(['Show cards','Confirm cards','ShowMulligan','Show mulligan','Alert'].includes(p.type))html+=(p.cards||p.hands?.flat()||[]).map(c=>'<span>'+esc(c.name)+' </span>').join('')+'<button id="ackchoice">Continue</button>';
  else if(p.type==='Order cards')html+='<p>Top to bottom; adjust the order before confirming.</p><div id="orderchoices"></div><button id="confirmorder" class="primary">Confirm order</button>';
  else if(['Attach energy','Move energy','Discard energy'].includes(p.type))html+=assignmentPrompt(p);
  else if(p.type==='Put damage')html+=damagePrompt(p);
  else if(['Move damage','Remove damage'].includes(p.type))html+=transferPrompt(p);
  else html+='<p class="error">This effect needs a choice interface that is not implemented yet. The match is paused; no effect has been silently skipped.</p>';
  if(p.options?.allowCancel)html+='<button id="cancelchoice">Cancel effect</button>';
  el.innerHTML=html+'</div>';
  el.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{const v=rows[+b.dataset.choice].value,key=JSON.stringify(v),single=['Select','SelectOption','Choose attack'].includes(p.type);if(single)promptChoice=[v];else if(promptChoice.some(x=>JSON.stringify(x)===key))promptChoice=promptChoice.filter(x=>JSON.stringify(x)!==key);else promptChoice.push(v);drawRulePrompt(p);});
  const resolve=value=>ruleAction({type:'prompt',id:p.id,value});
  if($('#resolvechoice'))$('#resolvechoice').onclick=()=>resolve(['Select','SelectOption','Choose attack'].includes(p.type)?promptChoice[0]:promptChoice);
  if($('#yeschoice'))$('#yeschoice').onclick=()=>resolve(true);if($('#nochoice'))$('#nochoice').onclick=()=>resolve(false);if($('#ackchoice'))$('#ackchoice').onclick=()=>resolve(true);if($('#cancelchoice'))$('#cancelchoice').onclick=()=>resolve(null);
  if(p.type==='Order cards'){
    if(promptChoice.length!==p.cards.cards.length)promptChoice=Array.from({length:p.cards.cards.length},(_,i)=>i);
    $('#orderchoices').innerHTML=promptChoice.map((v,i)=>`<p>${i+1}: ${esc(p.cards.cards[v].name)} <button data-up="${i}" ${i===0?'disabled':''}>↑</button><button data-down="${i}" ${i===promptChoice.length-1?'disabled':''}>↓</button></p>`).join('');
    $('#orderchoices').querySelectorAll('[data-up],[data-down]').forEach(b=>b.onclick=()=>{const i=+(b.dataset.up??b.dataset.down),j=b.dataset.up===undefined?i+1:i-1;[promptChoice[i],promptChoice[j]]=[promptChoice[j],promptChoice[i]];drawRulePrompt(p)});$('#confirmorder').onclick=()=>resolve(promptChoice);
  }
  if($('#assignsubmit'))$('#assignsubmit').onclick=()=>resolve(readAssignments(p));
  if($('#damagesubmit'))$('#damagesubmit').onclick=()=>resolve([...el.querySelectorAll('[data-damage]')].map(b=>({target:JSON.parse(b.dataset.damage),damage:+b.value})).filter(x=>x.damage>0));
  if($('#transfersubmit'))$('#transfersubmit').onclick=()=>{
    const from=JSON.parse($('#transferfrom').value),to=JSON.parse($('#transferto').value),n=+$('#transfercount').value;
    if(!Number.isInteger(n)||n<0||n>1000)return toast('Choose a whole number of counters.');resolve(Array.from({length:n},()=>({from,to})));
  };
}
function targetOptions(p){return RulesMatch.targets(rulesMatch,p).map(x=>`<option value="${esc(JSON.stringify(x.target))}">${esc(x.label)}</option>`).join('');}
function assignmentRows(p){
  const R=RulesMatch.R;
  if(p.type==='Attach energy')return p.cardList.cards.map((c,i)=>({card:c,index:i})).filter(x=>x.card.superType===R.SuperType.ENERGY&&!p.options.blocked.includes(x.index)&&R.matchesPromptFilter(x.card,p.filter));
  return RulesMatch.targets(rulesMatch,p).flatMap(x=>x.list.cards.map((card,index)=>({card,index,from:x.target}))).filter(x=>x.card.superType===R.SuperType.ENERGY&&R.matchesPromptFilter(x.card,p.filter));
}
function assignmentPrompt(p){const rows=assignmentRows(p);return '<p>Choose the Energy cards and destinations required by this effect.</p>'+rows.map((x,i)=>`<label>${esc(x.card.name)}${x.from?' · '+esc(JSON.stringify(x.from)):''}${p.type==='Discard energy'?`<input type="checkbox" data-assign="${i}" style="width:auto">`:`<select data-assign="${i}"><option value="">Leave this card</option>${targetOptions(p)}</select>`}</label>`).join('')+'<button id="assignsubmit" class="primary">Resolve Energy selection</button>';}
function readAssignments(p){const rows=assignmentRows(p);return [...$('#ruleprompt').querySelectorAll('[data-assign]')].filter(e=>p.type==='Discard energy'?e.checked:e.value).map(e=>{const row=rows[+e.dataset.assign];return p.type==='Discard energy'?{from:row.from,index:row.index}:p.type==='Attach energy'?{to:JSON.parse(e.value),index:row.index}:{from:row.from,to:JSON.parse(e.value),index:row.index}});}
function damagePrompt(p){return '<p>Assign '+p.damage+' total damage in multiples of '+(p.options.damageMultiple||10)+'.</p>'+RulesMatch.targets(rulesMatch,p).map(x=>`<label>${esc(x.label)}<input type="number" min="0" step="${p.options.damageMultiple||10}" value="0" data-damage="${esc(JSON.stringify(x.target))}"></label>`).join('')+'<button id="damagesubmit" class="primary">Resolve damage</button>';}
function transferPrompt(p){const opts=targetOptions(p);return `<label>From<select id="transferfrom">${opts}</select></label><label>To<select id="transferto">${opts}</select></label><label>Number of 10-damage counters<input id="transfercount" type="number" min="0" max="1000" value="1"></label><button id="transfersubmit" class="primary">Resolve counters</button>`;}

const originalDecks=decks;
decks=function(){originalDecks();$('.heading').insertAdjacentHTML('beforeend','<button onclick="importDeckText()">Import Limitless list</button>');const d=state.decks.find(d=>d.id===activeDeck);if(d&&$('#app .panel .row'))$('#app .panel .row').insertAdjacentHTML('beforeend','<button onclick="exportDeckText()">Export Limitless text</button>');};
function importDeckText(){
  modal('<h2>Import a Limitless / TCG Live deck list</h2><p>In Limitless Deck Builder, copy the deck as text. Paste it here or open a .txt file.</p><label>Deck name<input id="importdeckname" value="Imported deck"></label><label>Format<select id="importdeckformat">'+state.formats.map(f=>`<option value="${f.id}">${esc(f.name)}</option>`).join('')+'</select></label><input id="decktextfile" type="file" accept=".txt,text/plain"><textarea id="decktext" style="min-height:240px" placeholder="4 Charmander OBF 26\n3 Charizard ex OBF 125"></textarea><button id="parsedeck" class="primary">Review import</button><div id="deckimportreview"></div>');
  $('#decktextfile').onchange=async e=>{if(e.target.files[0])$('#decktext').value=await e.target.files[0].text()};
  $('#parsedeck').onclick=async()=>{
    await rulesAssets;const result=DeckText.parse($('#decktext').value,cards,cardMetadata,deckCodes);
    $('#deckimportreview').innerHTML='<h3>'+result.count+' cards matched</h3>'+result.entries.map(r=>'<p>'+r.qty+' '+esc(r.name)+' · '+esc(r.id)+(ruleMap[r.id]?'':' · automation unavailable')+'</p>').join('')+result.errors.map(e=>'<p class="error">'+(e.line?'Line '+e.line+': ':'')+esc(e.text||'')+' — '+esc(e.error)+'</p>').join('')+(result.errors.length?'':'<button id="confirmdeckimport" class="primary">Save imported deck</button>');
    if($('#confirmdeckimport'))$('#confirmdeckimport').onclick=()=>{const d={id:crypto.randomUUID(),name:$('#importdeckname').value.trim()||'Imported deck',format:$('#importdeckformat').value,cards:result.cards};state.decks.push(d);activeDeck=d.id;state.deckFormatFilter='';save();$('#modal').close();tab='decks';render();toast('Deck imported with every line matched');};
  };
}
async function exportDeckText(){await rulesAssets;try{const text=DeckText.format(state.decks.find(d=>d.id===activeDeck),cards,cardMetadata,deckCodes);modal('<h2>Limitless-compatible deck text</h2><p>Copy this text into Limitless Deck Builder or TCG Live.</p><textarea id="exportdecktext" style="min-height:300px"></textarea><button id="selectdecktext">Select all</button>');$('#exportdecktext').value=text;$('#selectdecktext').onclick=()=>{$('#exportdecktext').focus();$('#exportdecktext').select()};}catch(e){toast(e.message)}}
const originalFormatForm=formatForm;
formatForm=function(f={}){originalFormatForm(f);$('#ff').insertAdjacentHTML('afterbegin',`<label>Historical game rules<select name="ruleProfile">${Object.entries(RulesMatch.profiles).map(([id,p])=>`<option value="${id}" ${id===(f.ruleProfile||'modern')?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>`);};
const originalCustom=custom;
custom=function(){originalCustom();const cf=$('#cf');cf.insertAdjacentHTML('beforeend','<label>Automated attack effect<select name="condition"><option value="">None (numeric damage only)</option>'+['POISONED','BURNED','ASLEEP','CONFUSED','PARALYZED'].map(s=>'<option>'+s+'</option>').join('')+'</select></label><label>Evolves from (for automated evolution)<input name="evolveFrom"></label>');const handler=cf.onsubmit;cf.onsubmit=e=>{const condition=cf.elements.condition.value,evolveFrom=cf.elements.evolveFrom.value.trim();handler(e);const c=state.custom.at(-1);if(condition)c.automation={condition};if(evolveFrom)c.evolveFrom=evolveFrom;save();};};





