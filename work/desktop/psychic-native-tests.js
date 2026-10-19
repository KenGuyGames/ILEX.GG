(async()=>{
 const M=RulesMatch,checks=[],check=(v,n)=>{if(!v)throw Error(n);checks.push(n)},oldTab=tab,oldMode=tableMode,oldMatch=rulesMatch;
 botSuspended=true;clearTimeout(botTimer);cancelRealisticPlanning();state.botPaused=true;
 try{
  rulesMatch=M.restore(window.psychicFixture,ruleMap);rulesMatch.spec.opponent={type:'local'};tab='play';tableMode='rules';render();
  const p=rulesMatch.store.state.players[rulesMatch.store.state.activePlayer],before=rulesMatch.journal.length;
  check(p.active.getPokemonCard()._labId==='sv01-086'&&p.discard.cards.filter(c=>c._labId==='sve-005').length===2,'Natural saved game contains Gardevoir ex and two modern Psychic Energy in discard');
  for(let use=0;use<2;use++){
   for(let n=0;n<100&&IlexPresentation.busy();n++)await new Promise(r=>setTimeout(r,40));openCardActions(p.id,0,true);const entry=cardActionView.entries.findIndex(e=>e.name==='Psychic Embrace'),button=cardActionDialog.querySelector('[data-card-action="'+entry+'"]');check(button&&!button.disabled,'Printed Psychic Embrace action is available, use '+(use+1));button.click();
   for(let n=0;n<30&&M.pending(rulesMatch)[0]?.type==='WaitPrompt';n++)ruleAction(BotAI.prompt(rulesMatch,M.pending(rulesMatch)[0],'normal'));
   let q=M.pending(rulesMatch)[0];check(q?.type==='Attach energy'&&assignmentRows(q).some(x=>x.card._labId==='sve-005'),'Click opens modern Psychic Energy attachment choices, use '+(use+1)+'; pending='+q?.type);
   const select=document.querySelector('#ruleprompt [data-assign]');check(select&&select.options.length>1,'Energy destination is selectable, use '+(use+1));select.value=select.options[1].value;document.querySelector('#assignsubmit').click();
   for(let n=0;n<30&&M.pending(rulesMatch).length;n++)ruleAction(BotAI.prompt(rulesMatch,M.pending(rulesMatch)[0],'normal'));
   check(p.active.damage===(use+1)*20,'Attachment adds exactly two damage counters, use '+(use+1));
  }
  check(!p.discard.cards.some(c=>c._labId==='sve-005'),'Both Energy leave the discard after repeated use');
  const restored=M.restore({spec:rulesMatch.spec,journal:rulesMatch.journal},ruleMap);check(restored.store.state.players.find(x=>x.id===p.id).active.damage===40,'Saved Psychic Embrace attachments replay with damage');
  for(let n=0;n<20&&rulesMatch.journal.length>before;n++)undoRuleAction();const back=rulesMatch.store.state.players.find(x=>x.id===p.id);check(rulesMatch.journal.length===before&&back.active.damage===0&&back.discard.cards.filter(c=>c._labId==='sve-005').length===2,'Undo restores both Psychic Energy and clears Ability damage');
  return {passed:true,checks};
 }finally{if(cardActionDialog.open)cardActionDialog.close();rulesMatch=oldMatch;tab=oldTab;tableMode=oldMode;render();}
})()
