(async()=>{
 const M=RulesMatch,R=M.R,check=(v,msg)=>{if(!v)throw Error(msg)},coverage=await fetch('dp-coverage.json').then(r=>r.json());
 check(coverage.total===1558&&coverage.available===1558&&coverage.pending===0,'DP coverage incomplete');
 check(coverage.bySet.every(s=>s.total===s.available),'DP set incomplete');
 check(coverage.interactionScope.includes('ex13')&&coverage.interactionScope.includes('ex14')&&coverage.interactionScope.includes('ex16'),'DP interaction scope lost');
 const missing=Object.keys(ruleMap).filter(id=>/^(dp[1-7]-|pl[1-4]-|dpp-|pop[4-9]-|ru1-|tk-dp-)/.test(id));check(missing.length===1558,'DP printing map count');
 check(ruleArt({_dpFaceDownEnergyRole:{}})==='ilex-card-back.svg'&&previewAttrs({_dpFaceDownEnergyRole:{}}).includes('data-card-back'),'Face-down Energy preview leaked');
 const deck={name:'DP native verification',cards:{'dp1-76':4,'tk-dp-m-12':56}};
 let m=M.create({profile:'dppl',seed:7,decks:[deck,deck]},ruleMap);
 const settle=()=>{for(let i=0;i<400;i++){const q=M.pending(m)[0];if(!q)return;let v=true;
 if(q.type==='Choose cards')v=q.cards.cards.map((c,i)=>({c,i})).filter(x=>!q.options.blocked.includes(x.i)&&R.matchesPromptFilter(x.c,q.filter)).slice(0,q.options.min).map(x=>x.i);
 else if(q.type==='Choose pokemon')v=M.targets(m,q).filter(x=>!q.options.blocked.some(t=>JSON.stringify(t)===JSON.stringify(x.target))).slice(0,q.options.min||1).map(x=>x.target);
 else if(['Shuffle deck','Shuffle hand'].includes(q.type)){const p=m.store.state.players.find(p=>p.id===q.playerId);v=(q.type==='Shuffle deck'?p.deck:p.hand).cards.map((_,i)=>i);}
 else if(q.type==='Select')v=0;
 else if(!['WaitPrompt','Coin flip','Confirm','Show cards','Show mulligan','Alert'].includes(q.type))throw Error('DP native prompt '+q.type);
 M.apply(m,{type:'prompt',id:q.id,value:v});}throw Error('DP setup loop');};
 settle();check(m.store.state.phase===R.GamePhase.PLAYER_TURN,'DP setup failed');
 const p=m.store.state.players[m.store.state.activePlayer],before=m.journal.length;
 const energy=p.hand.cards.findIndex(c=>c.superType===R.SuperType.ENERGY);check(energy>=0,'DP fixture has no Energy');
 M.apply(m,{type:'play',player:p.id,index:energy,target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}});settle();M.checkpoint(m,before);
 const snapshot=x=>JSON.stringify({turn:x.store.state.turn,random:x.randomState,journal:x.journal,players:x.store.state.players.map(p=>({deck:p.deck.cards.map(c=>c._labId),hand:p.hand.cards.map(c=>c._labId),active:p.active.cards.map(c=>c._labId),prizes:p.prizes.map(l=>l.cards.map(c=>c._labId))}))});
 const saved={spec:m.spec,journal:m.journal,undoHistory:m.undoHistory};check(snapshot(M.restore(saved,ruleMap))===snapshot(m),'DP replay changed');
 const undone=M.undoAction(m,ruleMap);check(undone.journal.length===before,'DP undo boundary failed');
 check(M.profiles.dppl.dpEraRules&&M.profiles.dppl.firstTurnNoTrainers&&M.profiles.dppl.attackFirstTurn,'DP profile lost');
 const previousMatch=rulesMatch,previousFocus=seatFocus;
 try{m.store.state.turn=4;p.canEvolve=true;p.active.cards=[];p.active.pokemonPlayedTurn=3;const put=(id,zone)=>{const card=R.CardManager.getInstance().getCardByName(ruleMap[id]);card._labId=id;card.id=-(990000+zone.cards.length);zone.cards.push(card);return card;};put('dp6-43',p.active);const level=put('dp6-146',p.hand);M.apply(m,{type:'play',player:p.id,index:p.hand.cards.indexOf(level),target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}});settle();rulesMatch=m;const entries=cardActionEntries(p,p.active,true,0);check(entries.some(entry=>entry.name==='Psychic Restore'&&entry.copied),'Inherited Lv.X attack missing from enlarged-card actions');check(entries.some(entry=>entry.name==='Set Up'&&entry.copied),'Inherited Lv.X Power missing from enlarged-card actions');check(ruleArt(level)&&!ruleArt(level).includes('undefined'),'DP scan lookup failed');}finally{rulesMatch=previousMatch;seatFocus=previousFocus;}
 return {passed:true,total:coverage.total,available:coverage.available,pending:coverage.pending,allSetsComplete:true,dpPrintingMapCount:missing.length,dpReplayAndUndo:true,inheritedEnlargedCardActions:true,hiddenEnergyPresentation:true,earlyAndLateProfiles:true};
})()
