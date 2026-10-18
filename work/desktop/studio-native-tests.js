(async()=>{
 const M=RulesMatch,R=M.R,P=IlexPresentation,checks=[];
 const check=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const original={state:JSON.stringify(state),match:rulesMatch,tab,mode:tableMode,focus:seatFocus,choices:promptChoice.slice(),selected:ruleSelected};
 const settle=m=>{for(let i=0;i<400&&M.pending(m).length;i++){const action=BotAI.prompt(m,M.pending(m)[0],'easy');if(!action)throw Error('Native fixture prompt '+M.pending(m)[0].type);M.apply(m,action);}if(M.pending(m).length)throw Error('Fixture setup did not finish');};
 const fixture=(id='dp1-76',seed=7)=>{const deck={name:'Studio native match',cards:{[id]:4,'base1-98':56}},m=M.create({profile:'dppl',seed,decks:[deck,deck]},ruleMap);settle(m);return m;};
 const active=m=>m.store.state.players[m.store.state.activePlayer];
 const attach=(m,p)=>{const index=p.hand.cards.findIndex(c=>c.superType===R.SuperType.ENERGY);if(index<0)throw Error('Missing fixture Energy');M.apply(m,{type:'play',player:p.id,index,target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}});settle(m);};
 const ready=(id='dp1-76',seed=7,count=2)=>{const m=fixture(id,seed),p=active(m);for(let i=0;i<count;i++){attach(m,p);if(i<count-1){M.apply(m,{type:'pass',player:p.id});settle(m);M.apply(m,{type:'pass',player:active(m).id});settle(m);}}return m;};
 const display=m=>{P.cancel();clearTimeout(botTimer);botTimer=null;botGeneration++;rulesMatch=m;tab='play';tableMode='rules';state.botPaused=true;render();};
 const snapshot=m=>JSON.stringify({journal:m.journal,random:m.randomState,turn:m.store.state.turn,phase:m.store.state.phase,players:m.store.state.players.map(p=>({zones:[p.deck,p.hand,p.discard,p.lostzone,p.supporter,p.stadium,...p.prizes].map(l=>l.cards.map(c=>c._labId||c.fullName)),board:[p.active,...p.bench].map(l=>({cards:l.cards.map(c=>c._labId||c.fullName),damage:l.damage,status:l.specialConditions}))}))});
 const open=async()=>{for(let i=0;i<60&&!document.querySelector('#ilex-cinema').open;i++)await pause(20);check(document.querySelector('#ilex-cinema').open,'Committed action opens the cinematic layer');};
 try{
  P.update({effects:true,speed:'fast',shake:true});
  let m=ready(),p=active(m);display(m);await pause(150);
  const before=snapshot(m),logCount=m.store.state.logs.length,startEvents=P.diagnostics().events.length;
  ruleAction({type:'attack',player:p.id,name:'Ember'});
  check(P.busy(),'Human attack starts presentation after committing the action');
  const committed=snapshot(m),journal=m.journal.length;await open();
  const flips=m.store.state.logs.slice(logCount).filter(l=>/^LOG_PLAYER_FLIPS_(HEADS|TAILS)$/.test(l.message)).map(l=>l.message.endsWith('HEADS'));
  const coin=P.diagnostics().events.slice(startEvents).find(e=>e.kind==='coin');
  check(flips.length===1&&JSON.stringify(coin.results)===JSON.stringify(flips),'Visible single coin matches the actual engine result');
  check(document.querySelector('.coin-slot').dataset.result===(flips[0]?'heads':'tails'),'Coin face and label match the resolved result');
  const face=document.querySelector('.coin-face:not(.back)'),backFace=document.querySelector('.coin-face.back');
  check(face.querySelector('path').getAttribute('d')===backFace.querySelector('path').getAttribute('d'),'Heads and tails share the same Celebi silhouette');
  check(getComputedStyle(face).backgroundColor===getComputedStyle(backFace).color&&getComputedStyle(backFace).backgroundColor===getComputedStyle(face).color,'Tails reverses the heads background and silhouette colors');
  ruleAction({type:'pass',player:active(m).id});runBotStep();
  check(m.journal.length===journal,'Inputs and bot dispatch cannot advance the match during presentation');
  await P.whenIdle();
  check(snapshot(m)===committed,'Animation leaves game state, RNG, choices and journal untouched');
  const saved={spec:m.spec,journal:m.journal,undoHistory:M.undoPoints(m)};
  check(snapshot(M.restore(saved,ruleMap))===snapshot(m),'Saved-game replay remains exact with presentation enabled');
  undoRuleAction();check(snapshot(rulesMatch)===before,'Undo restores the whole action after a cinematic');
  check(!P.busy(),'Undo leaves no lingering animation or input lock');

  m=ready('dp5-57',7,1);p=active(m);display(m);const previous=m.store.state.logs.length,eventsBefore=P.diagnostics().events.length;
  ruleAction({type:'attack',player:p.id,name:'Fury Swipes'});await open();
  const expected=m.store.state.logs.slice(previous).filter(l=>/^LOG_PLAYER_FLIPS_(HEADS|TAILS)$/.test(l.message)).map(l=>l.message.endsWith('HEADS'));
  const multi=P.diagnostics().events.slice(eventsBefore).find(e=>e.kind==='coin');
  check(expected.length===3&&JSON.stringify(multi.results)===JSON.stringify(expected),'Multi-flip attack shows every engine result in order');
  check(document.querySelectorAll('.coin-slot').length===3,'Multi-flip display contains all three visible coins');
  P.cancel();check(!P.busy()&&!document.querySelector('#ilex-cinema').open,'Skip immediately releases the layer and queued effects');
  const skippedState=snapshot(m);await pause(160);check(snapshot(m)===skippedState,'Skipping cannot reroll coins or alter damage');

  m=fixture();p=active(m);display(m);const rejected=snapshot(m),history=P.diagnostics().events.length;
  ruleAction({type:'attack',player:p.id,name:'Ember'});
  check(!P.busy()&&P.diagnostics().events.length===history,'Rejected unpaid attacks do not produce animations');
  check(snapshot(rulesMatch)===rejected,'Rejected moves retain normal rollback behavior');

  m=ready('dp5-57',1,1);p=active(m);display(m);const beforeForecast=snapshot(m),historyBefore=P.diagnostics().events.length;
  BotAI.choose(m,p.id,'hard');
  check(snapshot(m)===beforeForecast&&P.diagnostics().events.length===historyBefore,'Bot forecasting remains silent and does not mutate live state');
  m.spec.opponent={type:'bot',difficulty:'easy',humanPlayer:m.store.state.players.find(o=>o!==p).id,botPlayer:p.id};
  let botAnimated=false;
  for(let n=0;n<16&&!botAnimated&&m.store.state.phase!==R.GamePhase.FINISHED;n++){
   const index=P.diagnostics().events.length;state.botPaused=false;runBotStep();state.botPaused=true;clearTimeout(botTimer);botTimer=null;
   botAnimated=P.diagnostics().events.slice(index).some(e=>e.kind==='attack');if(P.busy())P.cancel();
  }
  check(botAnimated,'Committed bot attacks use the same cinematic pipeline');

  m=ready();display(m);const independent=snapshot(m);P.manualCoin(false);await open();
  check(document.querySelector('.coin-slot').dataset.result==='tails','Manual tabletop flips also display the recorded side');
  document.querySelector('#ilex-cinema').dispatchEvent(new Event('cancel',{cancelable:true}));
  check(!P.busy()&&snapshot(m)===independent,'Escape cancellation is presentation-only');
  P.manualCoin(true);await open();const navigationState=snapshot(m);tab='library';render();
  check(!P.busy()&&snapshot(m)===navigationState,'Navigating away cancels effects without changing the match');

  display(m);P.update({effects:false});const disabled=P.preferences();P.manualCoin(true);check(!P.busy(),'Effects can be disabled without removing game functionality');
  P.update({effects:true,speed:'fast',shake:false});check(state.presentationPreferences.effects&&state.presentationPreferences.speed==='fast'&&!state.presentationPreferences.shake,'Visual preferences are persisted independently of audio');
  check(!document.querySelectorAll('.far-hand [data-preview-src]').length,'Opponent hand identities stay concealed');
  check(document.querySelectorAll('.seat-pile .pile-count').length===6,'Both players have persistent Deck, Discard and Prize count badges');
  for(const [id,name,energy]of [['dp1-93','Peck','WATER'],['dp1-103','Tackle','GRASS'],['dp1-95','Horn Attack','FIGHTING'],['dp1-91','Astonish','PSYCHIC'],['dp1-102','Scratch','DARK'],['dp1-101','Gust','COLORLESS']]){
   m=ready(id,7,1);display(m);const start=P.diagnostics().events.length;ruleAction({type:'attack',player:active(m).id,name});await open();
   check(P.diagnostics().events.slice(start).some(e=>e.kind==='attack'&&e.energy===energy),energy+' renderer follows the committed card attack');await P.whenIdle();
  }
  check(P.diagnostics().errors.length===0,'Cinematic renderers complete without errors');
  return {passed:true,checks,singleFlip:flips,multiFlip:expected,renderErrors:P.diagnostics().errors};
 }finally{
  P.cancel();clearTimeout(botTimer);botTimer=null;botGeneration++;state=JSON.parse(original.state);rulesMatch=original.match;tab=original.tab;tableMode=original.mode;seatFocus=original.focus;promptChoice=original.choices;ruleSelected=original.selected;save();render();
 }
})()
