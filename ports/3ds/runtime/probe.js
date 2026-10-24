var IlexProbeResult, IlexProbeDebug;
(function(){
 const R=RulesMatch.R,deck={name:'ARM11 rules fixture',cards:{'base1-46':4,'base1-98':56}},m=RulesMatch.create({profile:'wotc',seed:314159,decks:[deck,deck]},IlexCardMap);
 let attacks=0,steps=0;
 for(;steps<1200&&m.store.state.phase!==R.GamePhase.FINISHED;steps++){
  const pending=RulesMatch.pending(m),id=m.store.state.players[m.store.state.activePlayer]?.id;
  const clock=Date.now; let action; try{Date.now=()=>0;action=pending.length?BotAI.prompt(m,pending[0],'easy'):BotAI.choose(m,id,'easy');}finally{Date.now=clock;}
  if(!action)throw Error('No legal fixture action at step '+steps);
  RulesMatch.apply(m,action);if(action.type==='attack')attacks++;
 }
 if(m.store.state.phase!==R.GamePhase.FINISHED||!attacks)throw Error('Fixture did not finish with attacks');
 const snapshot=m=>{const list=l=>({cards:l.cards.map(c=>c.id),energy:l.energies?.cards.map(c=>c.id)||[],damage:l.damage||0});const g=m.store.state;return JSON.stringify({phase:g.phase,turn:g.turn,active:g.activePlayer,winner:g.winner,players:g.players.map(p=>({deck:list(p.deck),hand:list(p.hand),discard:list(p.discard),prizes:p.prizes.map(list),active:list(p.active),bench:p.bench.map(list)}))});};
 const restored=RulesMatch.restore({spec:m.spec,journal:m.journal},IlexCardMap);
 if(snapshot(m)!==snapshot(restored))throw Error('Rules journal replay mismatch');
 function hash(s){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return (h>>>0).toString(16);}
 IlexProbeDebug={state:JSON.parse(snapshot(m)),journal:m.journal};
 IlexProbeResult={stateHash:hash(snapshot(m)),journalHash:hash(JSON.stringify(m.journal)),passed:true,scope:'Seeded Base Set Charmander/Fire fixture only',finished:true,attacks,actions:m.journal.length,turn:m.store.state.turn,winner:m.store.state.winner,replayExact:true};
})();



