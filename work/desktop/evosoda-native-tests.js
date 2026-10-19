(async()=>{
 const M=RulesMatch,checks=[],check=(v,n)=>{if(!v)throw Error(n);checks.push(n)},oldTab=tab,oldMode=tableMode,oldMatch=rulesMatch;
 botSuspended=true;clearTimeout(botTimer);cancelRealisticPlanning();state.botPaused=true;
 try{
  rulesMatch=M.restore(window.evosodaFixture,ruleMap);rulesMatch.spec.opponent={type:'local'};tab='play';tableMode='rules';render();
  const p=rulesMatch.store.state.players[rulesMatch.store.state.activePlayer],before=rulesMatch.journal.length;
  check(rulesMatch.store.state.turn>2&&!p.canEvolve,'Natural later turn retains false exceptional-evolution flag');check(p.active.pokemonPlayedTurn<rulesMatch.store.state.turn,'Eevee has been in play since an earlier turn');
  pickRuleHand(p.id,p.hand.cards.findIndex(c=>c._labId==='xy1-116'));
  if(document.querySelector('#touch-options'))document.querySelector('#touch-options').click();
  let q=M.pending(rulesMatch)[0];check(q?.type==='Choose cards','Playing Evosoda opens search instead of false first-turn error');
  const i=q.cards.cards.findIndex(c=>c._labId==='sm1-61');document.querySelector('#ruleprompt [data-choice="'+i+'"]').click();document.querySelector('#resolvechoice').click();
  check(M.pending(rulesMatch)[0]?.type==='Choose pokemon','Choosing Espeon-GX opens the evolution target prompt');
  document.querySelector('#ruleprompt [data-choice="0"]').click();document.querySelector('#resolvechoice').click();
  for(let n=0;n<30&&M.pending(rulesMatch).length;n++)ruleAction(BotAI.prompt(rulesMatch,M.pending(rulesMatch)[0],'normal'));
  check(p.active.getPokemonCard()._labId==='sm1-61','Eevee evolves through actual UI choices');check(p.discard.cards.some(c=>c._labId==='xy1-116'),'Evosoda finishes in discard');check(!M.pending(rulesMatch).length,'Shuffle and continuation complete');
  const restored=M.restore({spec:rulesMatch.spec,journal:rulesMatch.journal},ruleMap);check(restored.store.state.players.find(x=>x.id===p.id).active.getPokemonCard()._labId==='sm1-61','Saved second-turn evolution restores correctly');
  for(let n=0;n<15&&rulesMatch.journal.length>before;n++)undoRuleAction();
  check(rulesMatch.journal.length===before,'Undo returns before playing Evosoda');const back=rulesMatch.store.state.players.find(x=>x.id===p.id);check(back.active.getPokemonCard()._labId==='sm1-101'&&back.hand.cards.some(c=>c._labId==='xy1-116'),'Undo restores Eevee and Evosoda');
  return {passed:true,checks};
 }finally{rulesMatch=oldMatch;tab=oldTab;tableMode=oldMode;render();}
})()
