(async()=>{
 const M=RulesMatch,checks=[],check=(v,n)=>{if(!v)throw Error(n);checks.push(n)},oldTab=tab,oldMode=tableMode,oldMatch=rulesMatch;botSuspended=true;clearTimeout(botTimer);cancelRealisticPlanning();state.botPaused=true;
 try{
  for(const fixture of window.formatFixture){
   IlexPresentation.cancel();rulesMatch=M.restore(fixture,ruleMap);rulesMatch.spec.opponent={type:'local'};tab='play';tableMode='rules';render();const profile=rulesMatch.spec.profile,p=rulesMatch.store.state.players[rulesMatch.store.state.activePlayer],before=rulesMatch.journal.length,legacy=['exlate','hgss'].includes(profile),evolution=profile==='exlate'?'ex1-34':'ex1-7';
   check(rulesMatch.spec.reprintRulesVersion===1,profile+' saved match pins its format reprint policy');check(rulesMatch.spec.reprintRulesThrough===({exlate:'ex16',hgss:'hgss2',bw:'bw1',sv:'sv01'})[profile],profile+' selected set pool pins its historical cutoff');
   pickRuleHand(p.id,p.hand.cards.findIndex(c=>c._labId==='ex2-88'));if(document.querySelector('#touch-options'))document.querySelector('#touch-options').click();let q=M.pending(rulesMatch)[0];check(q?.type==='Choose pokemon',profile+' old-print Rare Candy opens Basic selection');document.querySelector('#ruleprompt [data-choice="0"]').click();document.querySelector('#resolvechoice').click();q=M.pending(rulesMatch)[0];check(q?.type==='Choose cards',profile+' evolution choices open');
   const stage1=q.cards.cards.findIndex(c=>c._labId==='ex1-34');check((!q.options.blocked.includes(stage1)&&M.R.matchesPromptFilter(q.cards.cards[stage1],q.filter))===legacy,profile+' Stage1 choice follows the historical or modern rule');
   const i=q.cards.cards.findIndex(c=>c._labId===evolution);document.querySelector('#ruleprompt [data-choice="'+i+'"]').click();document.querySelector('#resolvechoice').click();for(let n=0;n<30&&M.pending(rulesMatch).length;n++)ruleAction(BotAI.prompt(rulesMatch,M.pending(rulesMatch)[0],'normal'));
   check(p.active.getPokemonCard()._labId===evolution,profile+' UI completes the format-correct evolution');check(p.discard.cards.some(c=>c._labId==='ex2-88'),profile+' original Rare Candy printing stays in discard');
   const restored=M.restore({spec:rulesMatch.spec,journal:rulesMatch.journal},ruleMap);check(restored.spec.reprintRulesVersion===1&&restored.store.state.players.find(x=>x.id===p.id).active.getPokemonCard()._labId===evolution,profile+' replay preserves policy and evolution');for(let n=0;n<15&&rulesMatch.journal.length>before;n++)undoRuleAction();check(rulesMatch.journal.length===before&&rulesMatch.store.state.players.find(x=>x.id===p.id).active.getPokemonCard()._labId==='ex1-66',profile+' Undo restores the Basic and original hand');
  }
  return {passed:true,checks};
 }finally{IlexPresentation.cancel();rulesMatch=oldMatch;tab=oldTab;tableMode=oldMode;render();}
})()
