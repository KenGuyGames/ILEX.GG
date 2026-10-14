(async()=>{
 const M=RulesMatch,R=M.R,check=(v,msg)=>{if(!v)throw Error(msg)},coverage=await fetch('ex-coverage.json').then(r=>r.json());
 check(coverage.total===1857&&coverage.available===1857&&coverage.pending===0,'EX coverage incomplete');
 check(coverage.bySet.every(s=>s.total===s.available),'EX set incomplete');
 check(coverage.interactionScope.includes('ecard1')&&coverage.interactionScope.includes('ecard2')&&coverage.interactionScope.includes('ecard3'),'EX interaction scope lost');
 const missing=Object.keys(ruleMap).filter(id=>/^(ex\d+-|exu-|np-|pop[123]-|tk-ex-)/.test(id));check(missing.length===1857,'EX printing map count');
 const deck={name:'EX native verification',cards:{'ex1-75':4,'ex1-108':48,'ex1-74':4,'ex1-77':4}};
 let m=M.create({profile:'exlate',seed:7,decks:[deck,deck]},ruleMap);
 const settle=()=>{for(let i=0;i<400;i++){const q=M.pending(m)[0];if(!q)return;let v=true;
 if(q.type==='Choose cards')v=q.cards.cards.map((c,i)=>({c,i})).filter(x=>!q.options.blocked.includes(x.i)&&R.matchesPromptFilter(x.c,q.filter)).slice(0,q.options.min).map(x=>x.i);
 else if(q.type==='Choose pokemon')v=M.targets(m,q).filter(x=>!q.options.blocked.some(t=>JSON.stringify(t)===JSON.stringify(x.target))).slice(0,q.options.min||1).map(x=>x.target);
 else if(['Shuffle deck','Shuffle hand'].includes(q.type)){const p=m.store.state.players.find(p=>p.id===q.playerId);v=(q.type==='Shuffle deck'?p.deck:p.hand).cards.map((_,i)=>i);}
 else if(q.type==='Select')v=0;
 else if(!['WaitPrompt','Coin flip','Confirm','Show cards','Show mulligan','Alert'].includes(q.type))throw Error('EX native prompt '+q.type);
 M.apply(m,{type:'prompt',id:q.id,value:v});}throw Error('EX setup loop');};
 settle();check(m.store.state.phase===R.GamePhase.PLAYER_TURN,'EX setup failed');
 const p=m.store.state.players[m.store.state.activePlayer],before=m.journal.length;
 const energy=p.hand.cards.findIndex(c=>c.superType===R.SuperType.ENERGY);check(energy>=0,'EX fixture has no Energy');
 M.apply(m,{type:'play',player:p.id,index:energy,target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}});settle();M.checkpoint(m,before);
 const snapshot=x=>JSON.stringify({turn:x.store.state.turn,random:x.randomState,journal:x.journal,players:x.store.state.players.map(p=>({deck:p.deck.cards.map(c=>c._labId),hand:p.hand.cards.map(c=>c._labId),active:p.active.cards.map(c=>c._labId),prizes:p.prizes.map(l=>l.cards.map(c=>c._labId))}))});
 const saved={spec:m.spec,journal:m.journal,undoHistory:m.undoHistory};check(snapshot(M.restore(saved,ruleMap))===snapshot(m),'EX replay changed');
 const undone=M.undoAction(m,ruleMap);check(undone.journal.length===before,'EX undo boundary failed');
 check(M.profiles.exlate.firstTurnUseSupporter===false&&M.profiles.ex.firstTurnUseSupporter===true,'EX profiles lost');
 return {passed:true,total:coverage.total,available:coverage.available,pending:coverage.pending,allSetsComplete:true,exPrintingMapCount:missing.length,exReplayAndUndo:true,earlyAndLateProfiles:true};
})()
