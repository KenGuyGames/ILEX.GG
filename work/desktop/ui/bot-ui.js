let botTimer=null,botThinking=false,botSuspended=false,botGeneration=0;
const botSettings=()=>rulesMatch?.spec.opponent?.type==='bot'?rulesMatch.spec.opponent:null;
const ruleDeckChoices=()=>[...state.decks,...BotAI.decks];
let matchSetupFormat='',matchSetupDecks=['',''];
function matchFormatDecks(formatId){return ruleDeckChoices().filter(d=>d.format===formatId&&state.formats.some(f=>f.id===formatId));}
function wireMatchFormatSetup(){
 const toolbar=$('#rp1')?.closest('.toolbar');if(!toolbar)return;
 toolbar.insertAdjacentHTML('afterbegin','<label class="opponent-setting">Match format<select id="matchformat" aria-label="Match format"><option value="">Choose a format…</option>'+state.formats.map(f=>'<option value="'+esc(f.id)+'">'+esc(f.name)+'</option>').join('')+'</select></label>');
 const formatSelect=$('#matchformat'),start=toolbar.querySelector('button.primary');
 if(!matchSetupFormat&&rulesMatch?.spec.format?.id){
  matchSetupFormat=rulesMatch.spec.format.id;
  const choices=matchFormatDecks(matchSetupFormat);
  matchSetupDecks=rulesMatch.spec.decks.map(saved=>choices.find(d=>d.name===saved.name&&JSON.stringify(Object.entries(d.cards).sort())===JSON.stringify(Object.entries(saved.cards).sort()))?.id||'');
 }
 formatSelect.value=state.formats.some(f=>f.id===matchSetupFormat)?matchSetupFormat:'';
 const populate=()=>{
  matchSetupFormat=formatSelect.value;
  const choices=matchFormatDecks(matchSetupFormat),format=state.formats.find(f=>f.id===matchSetupFormat);
  for(const [i,id] of ['rp1','rp2'].entries()){
   const select=$('#'+id);select.innerHTML='<option value="">'+(format?'Choose a deck…':'Choose a format first…')+'</option>'+choices.map(d=>'<option value="'+esc(d.id)+'">'+esc(d.name+' · '+format.name)+'</option>').join('');
   select.disabled=!format||!choices.length;select.value=choices.some(d=>d.id===matchSetupDecks[i])?matchSetupDecks[i]:'';matchSetupDecks[i]=select.value;
   select.onchange=()=>{matchSetupDecks[i]=select.value;if(i===0)$('#ruleprofile').value=rulesProfileFor(choices.find(d=>d.id===select.value));start.disabled=false;};
  }
  start.disabled=false;
  if(format)$('#ruleprofile').value=rulesProfileFor({format:format.id,cards:{}});
  const empty=$('.empty');if(!rulesMatch&&empty)empty.textContent=!format?'Select the match format, then choose your deck and your opponent’s deck.':choices.length?'Only decks assigned to '+format.name+' are shown. Choose both decks to start.':'No decks are assigned to '+format.name+'. Assign or create a deck in My decks first.';
 };
 formatSelect.onchange=()=>{matchSetupDecks=['',''];populate();};populate();
}

function newOpponentSettings(){return $('#opponentmode')?.value==='local'?{type:'local'}:{type:'bot',difficulty:$('#botdifficulty')?.value||'normal',humanPlayer:1,botPlayer:2};}
function botActorAction(a){const b=botSettings();return b&&(a.type==='prompt'?RulesMatch.pending(rulesMatch).find(p=>p.id===a.id)?.playerId===b.botPlayer:a.player===b.botPlayer);}
const humanRuleAction=ruleAction;
ruleAction=function(a){if(botActorAction(a)){toast('The bot controls that side of the table.');return;}humanRuleAction(a);};
let realisticWorker=null,realisticRequest=0,realisticTimeout=null;
function cancelRealisticPlanning(){realisticRequest++;clearTimeout(realisticTimeout);realisticTimeout=null;realisticWorker?.terminate();realisticWorker=null;botThinking=false;}
function stopBotForUndo(){botGeneration++;clearTimeout(botTimer);botTimer=null;cancelRealisticPlanning();if(botSettings())state.botPaused=true;state.botError='';}
function setBotPaused(value){state.botPaused=value;state.botError='';botGeneration++;clearTimeout(botTimer);botTimer=null;cancelRealisticPlanning();save();play();}
function setBotDifficulty(value){const b=botSettings();if(!b||!BotAI.levels[value])return;botGeneration++;clearTimeout(botTimer);botTimer=null;cancelRealisticPlanning();b.difficulty=value;saveRules();play();}
function botNeedsAction(){const b=botSettings();if(!b||!rulesMatch)return false;const g=rulesMatch.store.state,p=RulesMatch.pending(rulesMatch),botTurn=g.players[g.activePlayer]?.id===b.botPlayer;return !!globalThis.IlexKenGuy?.botAction(rulesMatch,b.botPlayer)||p.some(p=>p.playerId===b.botPlayer||p.playerId==null&&botTurn)||!p.length&&g.phase===RulesMatch.R.GamePhase.PLAYER_TURN&&botTurn;}
function scheduleBot(){
 if((typeof IlexPresentation!=='undefined'&&IlexPresentation.busy())||botTimer||botThinking||botSuspended||state.botPaused||tab!=='play'||!botNeedsAction())return;
 const match=rulesMatch,generation=botGeneration;
 botTimer=setTimeout(()=>{botTimer=null;if(generation!==botGeneration||state.botPaused||tab!=='play'||botSuspended)return;if(rulesMatch!==match){scheduleBot();return;}runBotStep();},450);
}
function planRealisticStep(){
 const match=rulesMatch,b=botSettings(),generation=botGeneration,journal=JSON.stringify(match.journal),requestId=++realisticRequest;
 botThinking=true;
 const fail=message=>{if(requestId!==realisticRequest)return;const stale=rulesMatch!==match||generation!==botGeneration;cancelRealisticPlanning();if(stale){if(tab==='play')play();return;}state.botPaused=true;state.botError=message;save();if(tab==='play')play();};
 try{
  if(!realisticWorker)realisticWorker=new Worker('bot-worker.js');
  realisticWorker.onerror=e=>{e.preventDefault();fail('Realistic Player could not finish planning. Resume to retry.');};
  realisticWorker.onmessage=e=>{const result=e.data;if(result.requestId!==realisticRequest)return;clearTimeout(realisticTimeout);realisticTimeout=null;botThinking=false;
   if(rulesMatch!==match||generation!==botGeneration||JSON.stringify(match.journal)!==journal||state.botPaused||tab!=='play'||botSettings()?.difficulty!=='realistic'){if(tab==='play')play();return;}
   if(result.error||!result.action){fail(result.error||'Realistic Player has no valid choice.');return;}runBotStep({action:result.action});
  };
  realisticTimeout=setTimeout(()=>fail('Realistic Player planning timed out. Resume to retry.'),45000);
  realisticWorker.postMessage({requestId,player:b.botPlayer,custom:match.spec.custom||state.custom,saved:{spec:match.spec,journal:match.journal.slice()}});
 }catch(e){fail(e.message||'Realistic Player could not start.');}
}
function runBotStep(planned){
 if((typeof IlexPresentation!=='undefined'&&IlexPresentation.busy())||!botNeedsAction()||botSuspended||state.botPaused)return;
 if(!planned&&botSettings()?.difficulty==='realistic'&&typeof Worker!=='undefined'){if(!botThinking)planRealisticStep();return;}
 botThinking=true;const b=botSettings(),before={spec:rulesMatch.spec,journal:rulesMatch.journal.slice(),undoHistory:RulesMatch.undoPoints(rulesMatch)};
 const humanPrompt=RulesMatch.pending(rulesMatch).find(p=>p.playerId===b.humanPlayer),humanChoices=promptChoice.slice();
 try{
  const action=planned?.action||BotAI.choose(rulesMatch,b.botPlayer,b.difficulty);
  if(!action)throw Error('This card effect needs a choice the bot cannot resolve yet.');
  const visualBefore=typeof IlexPresentation!=='undefined'?IlexPresentation.before(rulesMatch,action):null;
  const audioBefore=typeof IlexAudio!=='undefined'?IlexAudio.before(rulesMatch,action):null;try{RulesMatch.apply(rulesMatch,action);autoRules();}catch(e){if(typeof IlexPresentation!=='undefined')IlexPresentation.abort(visualBefore);rulesMatch=RulesMatch.restore(before,ruleMap,before.spec.custom||state.custom);throw e;}
  if(typeof IlexPresentation!=='undefined')IlexPresentation.after(visualBefore,rulesMatch,action);
  if(typeof IlexAudio!=='undefined')IlexAudio.after(audioBefore,rulesMatch,action);state.botError='';promptChoice=humanPrompt&&RulesMatch.pending(rulesMatch).some(p=>p.id===humanPrompt.id)?humanChoices:[];ruleSelected=null;saveRules();
 }catch(e){state.botPaused=true;state.botError=e.message||'The bot could not complete its action.';save();}
 finally{botThinking=false;}
 if(tab==='play')play();else scheduleBot();
}
const botTable=rulesTable;
rulesTable=function(){
 botTable();
 const choices=ruleDeckChoices(),settings=botSettings();
 for(const [i,id] of ['rp1','rp2'].entries()){
  const select=$('#'+id);if(!select)continue;const current=select.value;
  select.innerHTML=choices.map(d=>'<option value="'+esc(d.id)+'">'+esc(d.name)+'</option>').join('');
  select.value=choices.some(d=>d.id===current)?current:BotAI.decks[i].id;
  if(i&&!rulesMatch)select.value=BotAI.decks[1].id;
  select.setAttribute('aria-label',i?'Opponent deck':'Your deck');
  const label=document.createElement('label');label.className='opponent-setting';label.textContent=i?'Opponent deck':'Your deck';select.before(label);label.append(select);
 }
 const toolbar=$('#rp1')?.closest('.toolbar');
 if(toolbar){
  toolbar.insertAdjacentHTML('afterbegin','<label class="opponent-setting">Opponent<select id="opponentmode"><option value="bot">Bot opponent</option><option value="local">Local two-player</option></select></label><label class="opponent-setting" id="difficultysetting">Difficulty<select id="botdifficulty">'+Object.entries(BotAI.levels).map(([id,l])=>'<option value="'+id+'">'+l.label+'</option>').join('')+'</select></label>');
  $('#opponentmode').value=rulesMatch?(settings?'bot':'local'):'bot';$('#botdifficulty').value=settings?.difficulty||state.botDifficulty||'normal';
  const update=()=>{$('#difficultysetting').hidden=$('#opponentmode').value!=='bot';};$('#opponentmode').onchange=update;update();
  $('#botdifficulty').onchange=()=>{state.botDifficulty=$('#botdifficulty').value;save();};
  $('#rp1').onchange=()=>$('#ruleprofile').value=rulesProfileFor(choices.find(d=>d.id===$('#rp1').value));
  if(!rulesMatch){$('#ruleprofile').value=rulesProfileFor(choices.find(d=>d.id===$('#rp1').value));$('.empty').innerHTML='Choose your deck, the bot’s deck and a difficulty, then start a match. Ready-made Base–Fossil starter decks are included.';}
 }
 if(settings){
  const g=rulesMatch.store.state,p=RulesMatch.pending(rulesMatch)[0],botOwnsPrompt=p?.playerId===settings.botPlayer;
  if(botOwnsPrompt)$('#ruleprompt').innerHTML='<div class="panel bot-choice-notice">The bot is resolving its card choice…</div>';
  if(g.players[g.activePlayer]?.id===settings.botPlayer){document.querySelectorAll('.rule-status button:not(#undoruleaction)').forEach(b=>b.remove());}
  const status=g.phase===RulesMatch.R.GamePhase.FINISHED?'Match finished':state.botPaused?'Bot paused':botNeedsAction()?'Bot is thinking…':'Your turn / choice';
  $('.rule-status')?.insertAdjacentHTML('beforeend','<div class="bot-controls"><span class="dot"></span><strong>'+esc(status)+'</strong><label>Bot difficulty <select id="livebotdifficulty">'+Object.entries(BotAI.levels).map(([id,l])=>'<option value="'+id+'">'+l.label+'</option>').join('')+'</select></label>'+(g.phase!==RulesMatch.R.GamePhase.FINISHED?'<button id="pausebot">'+(state.botPaused?'Resume bot':'Pause bot')+'</button>':'')+(state.botError?'<p class="error">'+esc(state.botError)+' Resume to retry.</p>':'')+'</div>');
  $('#livebotdifficulty').value=settings.difficulty;$('#livebotdifficulty').onchange=e=>setBotDifficulty(e.target.value);if($('#pausebot'))$('#pausebot').onclick=()=>setBotPaused(!state.botPaused);
  document.querySelector('.opponent-seat>span:last-child').textContent=BotAI.levels[settings.difficulty].label+' bot';
  if(botOwnsPrompt||g.players[g.activePlayer]?.id===settings.botPlayer&&!p){document.querySelectorAll('[data-table-source]').forEach(el=>{el.draggable=false;delete el.dataset.tableSource;});}
 }
 wireMatchFormatSetup();
 scheduleBot();
};
