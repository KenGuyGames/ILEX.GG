(async()=>{
 const M=RulesMatch,R=M.R,checks=[],check=(v,s)=>{if(!v)throw Error('Tournament bot: '+s);checks.push(s);};
 check(Object.keys(BotAI.levels).join(',')==='easy,normal,hard,realistic','All four difficulties remain available');
 check(BotAI.strategy.energyDeficit([{provides:[R.CardType.FIRE,R.CardType.WATER]}],[R.CardType.FIRE,R.CardType.WATER])===1,'Flexible Energy is one unit in the desktop policy');
 check(BotAI.strategy.prizeValue({getPokemonCard:()=>({tags:[R.CardTag.POKEMON_SV_MEGA]})})===3,'Modern Mega threat is three Prizes');
 const results=[];
 for(const profile of ['wotc','xy','mega','unlimited']){
  const m=M.create({profile,seed:17,decks:[BotAI.decks[0],BotAI.decks[1]]},ruleMap);for(let i=0;i<180&&M.pending(m).length;i++){const p=M.pending(m)[0];M.apply(m,BotAI.prompt(m,p,'normal'));}
  const id=m.store.state.players[m.store.state.activePlayer].id,before=JSON.stringify({state:m.store.state,journal:m.journal,random:m.randomState,spec:m.spec});
  const worker=new Worker('bot-worker.js');try{const result=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Worker timeout '+profile)),45000);worker.onmessage=e=>{clearTimeout(timer);resolve(e.data);};worker.onerror=e=>{clearTimeout(timer);reject(Error(e.message));};worker.postMessage({requestId:101,player:id,saved:{spec:m.spec,journal:m.journal},custom:[]});});
   check(!result.error&&result.action,'Worker plans a legal '+profile+' action');check(result.diagnostics?.version===2&&result.diagnostics.trials<=420,'Bounded upgraded search runs in '+profile);check(JSON.stringify({state:m.store.state,journal:m.journal,random:m.randomState,spec:m.spec})===before,'Worker leaves '+profile+' live state unchanged before commit');M.apply(m,result.action);check(m.journal.length>0,'Engine accepts '+profile+' worker action');results.push({profile,diagnostics:result.diagnostics});
  }finally{worker.terminate();}
 }
 return {passed:true,checks,results,limits:'Worker/format integration checks, not proof of professional human strength'};
})()
