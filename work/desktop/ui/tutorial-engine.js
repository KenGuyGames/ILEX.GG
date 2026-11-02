/* Tutorial games are independent real-engine journals; no normal match or Campaign state is borrowed. */
var IlexTutorialEngine=(()=>{
 const D=IlexTutorialData,F='base1-98',copy=x=>JSON.parse(JSON.stringify(x));
 function create(map){return RulesMatch.create({profile:'sv',seed:24,decks:copy(D.decks),opponent:{type:'local'},tutorial:{version:D.version,prepared:true}},map);}
 const player=(m,id=1)=>m.store.state.players.find(p=>p.id===id);
 const saved=m=>({spec:copy(m.spec),journal:copy(m.journal)});
 const current=m=>m.store.state.players[m.store.state.activePlayer]?.id;
 const finished=m=>m.store.state.phase===RulesMatch.R.GamePhase.FINISHED;
 function target(zone='active',index=0){const R=RulesMatch.R;return {player:R.PlayerType.BOTTOM_PLAYER,slot:zone==='bench'?R.SlotType.BENCH:R.SlotType.ACTIVE,index};}
 function automatic(m){
  for(let n=0;n<160;n++){
   const q=RulesMatch.pending(m)[0];if(!q)return;
   let value;
   if(q.type==='Shuffle deck'){
    const p=player(m,q.playerId),pool=p.deck.cards.map((c,i)=>({c,i})),order=[];
    if(pool.length===60)for(const id of D.order[p.id]){const at=pool.findIndex(x=>x.c._labId===id);if(at<0)throw Error('Teaching deck is missing '+id);order.push(pool.splice(at,1)[0].i);}
    value=[...order,...pool.map(x=>x.i)];
   }else if(q.type==='Shuffle hand'){value=Array.from({length:player(m,q.playerId).hand.cards.length},(_,i)=>i);}
   else if(q.type==='WaitPrompt')value=true;
   else if(q.playerId===2){
    if(q.message==='CHOOSE_STARTING_POKEMONS'){
     const cards=q.cards.cards;value=[cards.findIndex(c=>c._labId==='swsh12-019'),cards.findIndex(c=>c._labId==='sv03.5-016')];if(value.some(i=>i<0))throw Error('Opponent opening is not ready.');
    }else{const a=BotAI.prompt(m,q,'easy');if(!a)throw Error('Opponent choice is unavailable: '+q.type);value=a.value;}
   }else return;
   RulesMatch.apply(m,{type:'prompt',id:q.id,value});
  }
  throw Error('Tutorial effect exceeded its resolution limit.');
 }
 function expected(m,step){
  const a=step.action,p=player(m),q=RulesMatch.pending(m)[0];if(!a)throw Error('This lesson has no move.');
  if(a.type==='openingCoin'){if(q?.type!=='Coin flip')throw Error('Opening flip is not pending.');return {type:'prompt',id:q.id,value:true};}
  if(a.type==='goFirst'){if(q?.message!=='GO_FIRST')throw Error('First-player choice is not pending.');return {type:'prompt',id:q.id,value:true};}
  if(a.type==='setupActive'){if(q?.message!=='CHOOSE_STARTING_POKEMONS')throw Error('Opening Pokémon choice is not pending.');const i=q.cards.cards.findIndex(c=>c._labId===a.card);if(i<0)throw Error('Opening Charmander is not in hand.');return {type:'prompt',id:q.id,value:[i]};}
  if(q)throw Error('Finish the pending card choice first.');
  if(current(m)!==1)throw Error('It is the opponent’s turn.');
  if(a.type==='play'){const i=p.hand.cards.findIndex(c=>c._labId===a.card);if(i<0)throw Error('The teaching card is not in hand: '+a.card);return {type:'play',player:1,index:i,target:target(a.zone,a.index||0)};}
  if(a.type==='retreat')return {type:'retreat',player:1,index:a.index};
  if(a.type==='attack'||a.type==='ability')return {type:a.type,player:1,name:a.name,target:target(a.zone,a.index||0)};
  if(a.type==='pass')return {type:'pass',player:1};
  throw Error('Unknown teaching move.');
 }
 function apply(m,a){RulesMatch.apply(m,a);automatic(m);return m;}
 function legal(m,a,map){try{const f=RulesMatch.restore(saved(m),map);RulesMatch.apply(f,a);return true;}catch{return false;}}
 function opponent(m,map){
  if(finished(m)||current(m)!==2||RulesMatch.pending(m).length)return null;
  const p=player(m,2),R=RulesMatch.R,t=target();
  let i=p.hand.cards.findIndex(c=>c._labId==='swsh3.5-53');
  if(i>=0){const a={type:'play',player:2,index:i,target:t};if(legal(m,a,map))return {action:a,card:p.hand.cards[i],text:'The opponent plays Hop, their one Supporter for this turn, and draws 3 cards.'};}
  const empty=p.bench.findIndex(l=>!l.getPokemonCard());
  if(empty>=0){i=p.hand.cards.findIndex(c=>c.superType===R.SuperType.POKEMON&&c.stage===R.Stage.BASIC);if(i>=0){const a={type:'play',player:2,index:i,target:target('bench',empty)};if(legal(m,a,map))return {action:a,card:p.hand.cards[i],text:'The opponent puts '+p.hand.cards[i].name+' on the Bench. A backup lets them keep playing if their Active is Knocked Out.'};}}
  i=p.hand.cards.findIndex(c=>c._labId===F);
  if(i>=0){const a={type:'play',player:2,index:i,target:t};if(legal(m,a,map))return {action:a,card:p.hand.cards[i],text:'The opponent attaches a Fire Energy to their Active Pokémon. Any type of Energy can pay a Colorless cost.'};}
  for(const attack of p.active.getPokemonCard()?.attacks||[]){const a={type:'attack',player:2,name:attack.name,target:t};if(attack.damage>0&&legal(m,a,map))return {action:a,card:p.active.getPokemonCard(),text:'The opponent uses '+attack.name+'. Their attached Energy can pay its cost. The attack resolves and their turn ends.'};}
  return {action:{type:'pass',player:2},text:'The opponent cannot make a damaging attack with their current Energy. They end the turn. You will draw a card as your next turn begins.'};
 }
 function promptRows(m,q){
  const R=RulesMatch.R,p=player(m,q.playerId||1);
  if(q.type==='Choose cards')return q.cards.cards.map((c,i)=>({value:i,label:c.name,card:c,blocked:q.options?.blocked?.includes(i)||!R.matchesPromptFilter(c,q.filter)}));
  if(q.type==='Choose pokemon')return RulesMatch.targets(m,q).map(x=>({value:x.target,label:x.list.getPokemonCard()?.name||x.label,card:x.list.getPokemonCard(),blocked:q.options?.blocked?.some(b=>JSON.stringify(b)===JSON.stringify(x.target))}));
  if(q.type==='Choose prize')return p.prizes.filter(l=>l.cards.length).map((_,i)=>({value:i,label:'Face-down Prize '+(i+1),back:true,blocked:q.options?.blocked?.includes(i)}));
  if(q.type==='Choose energy')return q.energy.map((e,i)=>({value:i,label:e.card.name,card:e.card}));
  if(q.type==='Select'||q.type==='SelectOption')return q.values.map((label,i)=>({value:i,label,blocked:q.options?.disabled?.[i]}));
  return [];
 }
 function ready(m,t){const step=D.steps[t.step];if(!step)return false;if(step.kind==='info')return true;if(step.kind==='quiz')return !!t.answered;if(step.kind==='action')return !!t.acted&&(['openingCoin','goFirst'].includes(step.action.type)||!RulesMatch.pending(m).some(q=>q.playerId===1));if(step.kind==='opponent')return current(m)===1&&!RulesMatch.pending(m).length;if(step.kind==='practice')return finished(m)&&m.store.state.players[m.store.state.winner]?.id===1;return false;}
 return {create,player,saved,current,finished,target,automatic,expected,apply,opponent,promptRows,ready};
})();
