/* Drives the same public controller calls used by the C touch/button bridge. */
var IlexPlayTests=(()=>{
 function hash(s){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(16);}
 function stateHash(){const m=IlexPlay.state(),g=m.store.state,list=l=>({cards:l.cards.map(c=>c.id),damage:l.damage||0,conditions:l.specialConditions||[],secret:!!l.isSecret});return hash(JSON.stringify({phase:g.phase,turn:g.turn,winner:g.winner,active:g.activePlayer,random:m.randomState,players:g.players.map(p=>({deck:list(p.deck),hand:list(p.hand),discard:list(p.discard),prizes:p.prizes.map(list),active:list(p.active),bench:p.bench.map(list)}))}));}
 const results=[],assert=(x,s)=>{if(!x)throw Error(s);};
 function click(i){const e=IlexPlay.choose(i);assert(!e,'UI choice failed: '+e);}
 function humanAction(){
  let v=IlexPlay.view(),m=IlexPlay.state(),p=RulesMatch.pending(m)[0];
  if(p){const a=BotAI.prompt(m,p,'easy');assert(a,'No expected prompt response '+p.type);
   if(['Attach energy','Move energy','Discard energy'].includes(p.type)){for(const x of a.value||[]){v=IlexPlay.view();const i=v.energySources.findIndex(y=>y&&x.index===y.index&&JSON.stringify(x.from)===JSON.stringify(y.from));assert(i>=0,'Missing Energy source');click(i);if(p.type!=='Discard energy'){v=IlexPlay.view();const j=v.energyTargets.findIndex(y=>JSON.stringify(y)===JSON.stringify(x.to));assert(j>=0,'Missing Energy destination');click(j);}}v=IlexPlay.view();click(v.confirm);}
   else if(v.confirm>=0){for(const x of a.value||[]){v=IlexPlay.view();const i=v.choiceValues.findIndex(y=>JSON.stringify(x)===JSON.stringify(y));assert(i>=0,'Missing prompt row '+p.type);click(i);}v=IlexPlay.view();click(v.confirm);}
   else {const i=v.choiceValues?.findIndex(x=>JSON.stringify(x)===JSON.stringify(a.value));click(i>=0?i:v.rows.length-1);}return;
  }
  let action;const clock=Date.now;try{Date.now=()=>0;action=BotAI.choose(m,m.store.state.players[0].id,'easy');}finally{Date.now=clock;}
  assert(action,'No expected human action');
  if(action.type==='play'){click(0);IlexPlay.view();click(action.index);v=IlexPlay.view();click(action.target.slot===RulesMatch.R.SlotType.ACTIVE?0:action.target.index+1);}
  else if(action.type==='attack'){click(1);v=IlexPlay.view();click(v.rows.findIndex(s=>s.startsWith(action.name+' [')));}
  else if(action.type==='ability'){click(2);v=IlexPlay.view();click(v.rows.findIndex(s=>s.includes(': '+action.name)));}
  else if(action.type==='retreat'){const p=m.store.state.players[0],name=p.bench[action.index].getPokemonCard().name;click(3);v=IlexPlay.view();click(v.rows.indexOf('Promote '+name));}
  else if(action.type==='pass')click(5);
  else throw Error('Unmapped action '+action.type);
 }
 for(const [deck,seed] of [[0,314159],[1,271828],[0,42]]){
  IlexPlay.start(deck,seed);let steps=0,humanMoves=0,botMoves=0,saved=false;const types=new Set();
  for(;steps<1600&&!IlexPlay.finished();steps++){
   const v=IlexPlay.view(),p=RulesMatch.pending(IlexPlay.state())[0];for(const side of v.board||[])for(const l of side.slots)if(l.secret)assert(!l.id&&l.hp===0&&l.energy===0&&!l.condition,'Secret board identity leaked');if(p)types.add(p.type);
   if(v.auto){const e=IlexPlay.tick();assert(!e,'Automatic action failed '+e);botMoves++;}else{humanAction();humanMoves++;}
   if(!saved&&IlexPlay.state().journal.length>35){const before=IlexPlay.snapshot(),digest=stateHash();IlexPlay.restore(before);assert(digest===stateHash(),"Restored state diverged");assert(before===IlexPlay.snapshot(),'Save journal mismatch');saved=true;}
  }
  const m=IlexPlay.state();assert(IlexPlay.finished(),'Match did not finish');assert(humanMoves>5&&botMoves>5,'No interactive turns');assert(m.journal.some(a=>a.type==='attack'),'No attacks');
  results.push({stateHash:stateHash(),journalHash:hash(JSON.stringify(m.journal)),deck,seed,steps,humanMoves,botMoves,actions:m.journal.length,turn:m.store.state.turn,winner:m.store.state.winner,prompts:[...types],saveRestore:saved});
 }
 // A rejected move must preserve the exact authoritative state/journal.
 IlexPlay.start(0,123);for(let i=0;i<200;i++){const v=IlexPlay.view();if(!v.auto&&!RulesMatch.pending(IlexPlay.state()).length)break;if(v.auto)IlexPlay.tick();else humanAction();}
 let before=IlexPlay.snapshot();IlexPlay.view();click(1);let v=IlexPlay.view();const attack=v.rows.findIndex(s=>s!=='Back');if(attack>=0){const e=IlexPlay.choose(attack);assert(e,'Expected not-enough-energy rejection');assert(IlexPlay.snapshot()===before,'Rejected attack changed journal');}
 assert(!IlexPlay.inspect(0).includes('[object Object]'),'Inspection not readable');
 let rejected=false;try{IlexPlay.restore('{"version":5}');}catch{rejected=true;}assert(rejected,'Invalid save accepted');
 return {passed:true,scope:'Controller-driven starter matches; not physical handheld acceptance',matches:results,rejectedActionSafe:true};
})();

