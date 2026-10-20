(async()=>{
 const M=RulesMatch,checks=[],check=(v,n)=>{if(!v)throw Error(n);checks.push(n)},oldTab=tab,oldMode=tableMode,oldMatch=rulesMatch;
 botSuspended=true;clearTimeout(botTimer);cancelRealisticPlanning();state.botPaused=true;
 try{
  rulesMatch=M.restore(window.candyFixture,ruleMap);rulesMatch.spec.opponent={type:'local'};tab='play';tableMode='rules';render();
  const p=rulesMatch.store.state.players[rulesMatch.store.state.activePlayer],before=rulesMatch.journal.length;
  check(rulesMatch.store.state.turn>2&&!p.canEvolve,'Natural later turn has false exceptional evolution flag');check(p.active.pokemonPlayedTurn<rulesMatch.store.state.turn,'Ralts has been in play since an earlier turn');check(p.hand.cards.some(c=>c._labId==='sv01-086')&&!p.hand.cards.some(c=>c._labId==='sv01-085'),'Stage2 is in hand without the intermediate Stage1');
  for(let n=0;n<100&&IlexPresentation.busy();n++)await new Promise(r=>setTimeout(r,40));
  pickRuleHand(p.id,p.hand.cards.findIndex(c=>c._labId==='sv01-191'));if(document.querySelector('#touch-options'))document.querySelector('#touch-options').click();
  let q=M.pending(rulesMatch)[0];check(q?.type==='Choose pokemon','Playing Rare Candy opens valid Basic Pokemon selection');document.querySelector('#ruleprompt [data-choice="0"]').click();document.querySelector('#resolvechoice').click();
  q=M.pending(rulesMatch)[0];check(q?.type==='Choose cards','Choosing Ralts opens Stage2 hand selection');const i=q.cards.cards.findIndex(c=>c._labId==='sv01-086');check(i>=0&&!q.options.blocked.includes(i),'Gardevoir ex is a legal Stage2 choice');document.querySelector('#ruleprompt [data-choice="'+i+'"]').click();document.querySelector('#resolvechoice').click();
  for(let n=0;n<30&&M.pending(rulesMatch).length;n++)ruleAction(BotAI.prompt(rulesMatch,M.pending(rulesMatch)[0],'normal'));
  check(p.active.getPokemonCard()._labId==='sv01-086','Actual UI evolves Ralts directly to Gardevoir ex');check(p.discard.cards.some(c=>c._labId==='sv01-191'),'Rare Candy finishes in discard');check(!M.pending(rulesMatch).length,'Rare Candy resolves completely');
  const restored=M.restore({spec:rulesMatch.spec,journal:rulesMatch.journal},ruleMap);check(restored.store.state.players.find(x=>x.id===p.id).active.getPokemonCard()._labId==='sv01-086','Saved Rare Candy evolution restores correctly');
  for(let n=0;n<15&&rulesMatch.journal.length>before;n++)undoRuleAction();const back=rulesMatch.store.state.players.find(x=>x.id===p.id);check(rulesMatch.journal.length===before,'Undo returns before Rare Candy');check(back.active.getPokemonCard()._labId==='sv01-084'&&back.hand.cards.some(c=>c._labId==='sv01-191')&&back.hand.cards.some(c=>c._labId==='sv01-086'),'Undo restores Ralts, Rare Candy and Stage2');
  return {passed:true,checks};
 }finally{rulesMatch=oldMatch;tab=oldTab;tableMode=oldMode;render();}
})()
