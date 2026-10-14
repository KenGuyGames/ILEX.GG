(async()=>{
 const assert=(v,s)=>{if(!v)throw Error('Bot UI: '+s)},checks=[],pause=ms=>new Promise(r=>setTimeout(r,ms));let preview;
 const previous={spec:rulesMatch.spec,journal:rulesMatch.journal.slice(),undoHistory:RulesMatch.undoPoints(rulesMatch)},previousPaused=state.botPaused,previousError=state.botError;
 botSuspended=true;botGeneration++;clearTimeout(botTimer);botTimer=null;
 const tick=()=>{botSuspended=false;runBotStep();botSuspended=true;clearTimeout(botTimer);botTimer=null;assert(!state.botError,state.botError);};
 try{
  rulesMatch=null;tab='play';play();assert($('#opponentmode').value==='bot','Bot is default for new matches');assert($('#botdifficulty').options.length===3,'Three levels');
  $('#matchformat').value='wotc-base-fossil';$('#matchformat').onchange();$('#rp1').value='bot-forest';$('#rp1').onchange();$('#rp2').value='bot-fire';$('#rp2').onchange();$('#botdifficulty').value='normal';await beginRules();
  assert(rulesMatch?.spec.opponent?.type==='bot'&&rulesMatch.spec.opponent.difficulty==='normal','Start a bot match from ready-made decks');checks.push('New-match controls offer three difficulties, local play and starter decks');
  const hp=RulesMatch.pending(rulesMatch).find(p=>p.playerId===1),bp=RulesMatch.pending(rulesMatch).find(p=>p.playerId===2);
  if(hp&&bp&&hp.type==='Choose cards'){
   const value=BotAI.prompt(rulesMatch,hp,'normal').value;promptChoice=value.slice();const chosen=JSON.stringify(promptChoice);tick();assert(JSON.stringify(promptChoice)===chosen,'Bot setup does not clear human selection');checks.push('Simultaneous bot setup preserves the human’s pending selections');
  }
  for(let n=0;n<120;n++){
   const p=RulesMatch.pending(rulesMatch)[0];if(!p)break;
   if(p.playerId===2)tick();else {const action=BotAI.choose(rulesMatch,p.playerId,'normal');assert(!!action,'Human setup helper');ruleAction(action);}
  }
  assert(rulesMatch.store.state.phase===RulesMatch.R.GamePhase.PLAYER_TURN,'Setup completes');checks.push('Bot resolves its own setup choices while the human resolves theirs');
  preview=JSON.parse(JSON.stringify({spec:rulesMatch.spec,journal:rulesMatch.journal}));
  {const R=RulesMatch.R,g=rulesMatch.store.state,h=new R.ChooseCardsPrompt(g.players[0],R.GameMessage.CHOOSE_CARD_TO_HAND,g.players[0].hand,{}, {min:1,max:1,allowCancel:false}),b=new R.ChooseCardsPrompt(g.players[1],R.GameMessage.CHOOSE_CARD_TO_HAND,g.players[1].hand,{}, {min:1,max:1,allowCancel:false});
   rulesMatch.store.prompt(g,[h,b],()=>{});play();promptChoice=[0];drawRulePrompt(h);tick();assert(JSON.stringify(promptChoice)==='[0]'&&RulesMatch.pending(rulesMatch).some(p=>p.id===h.id),'Concurrent bot choice preserves human selection');ruleAction({type:'prompt',id:h.id,value:[0]});checks.push('Concurrent bot choices preserve the human’s selected cards');}
  if(rulesMatch.store.state.players[rulesMatch.store.state.activePlayer].id===1)ruleAction({type:'pass',player:1});
  assert(rulesMatch.store.state.players[rulesMatch.store.state.activePlayer].id===2,'Bot turn');
  const human=rulesMatch.store.state.players[0];
  assert(document.querySelector('.seat-player-bar strong').textContent===human.name,'Human seat stays fixed');
  assert([...document.querySelectorAll('.far-hand img')].every(i=>i.getAttribute('src')==='ilex-card-back.svg'),'Bot hand stays hidden');
  assert(!document.querySelector('.near-hand [data-table-source]'),'Human hand cannot dispatch bot actions');
  let length=rulesMatch.journal.length;ruleAction({type:'pass',player:2});assert(rulesMatch.journal.length===length,'Human cannot control bot');checks.push('Bot turns preserve the human seat, hide the bot hand and reject human control of the bot');
  setBotPaused(true);runBotStep();assert(rulesMatch.journal.length===length,'Pause prevents actions');setBotPaused(false);
  botSuspended=false;scheduleBot();await pause(1100);botSuspended=true;clearTimeout(botTimer);botTimer=null;
  assert(rulesMatch.journal.length>length&&!state.botError,'Timer runs the bot automatically');checks.push('The bot takes an action automatically; pause and resume work');
  $('#livebotdifficulty').value='hard';$('#livebotdifficulty').onchange({target:$('#livebotdifficulty')});assert(rulesMatch.spec.opponent.difficulty==='hard'&&state.rulesMatch.spec.opponent.difficulty==='hard','Difficulty is saved with match');setBotDifficulty('normal');
  for(let n=0;n<80&&rulesMatch.store.state.players[rulesMatch.store.state.activePlayer].id===2&&rulesMatch.store.state.phase!==RulesMatch.R.GamePhase.FINISHED;n++)tick();
  assert(rulesMatch.store.state.phase===RulesMatch.R.GamePhase.FINISHED||rulesMatch.store.state.players[rulesMatch.store.state.activePlayer].id===1,'Bot hands control back');checks.push('Bot finishes its turn and hands control back; difficulty persists with the saved match');
  const pending=new (class extends RulesMatch.R.Prompt{constructor(){super(2);this.type='Unsupported bot test';}})();rulesMatch.store.prompt(rulesMatch.store.state,pending,()=>{});
  botSuspended=false;runBotStep();botSuspended=true;assert(state.botPaused&&state.botError,'Unsupported required choice pauses visibly');assert(document.querySelector('.bot-controls .error'),'Paused reason is visible');checks.push('Unsupported mandatory effects pause visibly instead of skipping an effect');
 }finally{
  botGeneration++;clearTimeout(botTimer);botTimer=null;botThinking=false;rulesMatch=RulesMatch.restore(previous,ruleMap,previous.spec.custom||state.custom);state.botPaused=previousPaused;state.botError=previousError;promptChoice=[];seatFocus=null;saveRules();play();botSuspended=false;
 }
 return {passed:true,checks,preview};
})()
