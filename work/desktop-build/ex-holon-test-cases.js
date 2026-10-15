test('All five Holon Pokemon attach from hand and provide their printed Energy',()=>{
 for(const id of ['ex11-21','ex11-22','ex13-44','ex11-70','ex11-71'])for(const bench of [false,true]){
  const m=exCombat('ex1-23'),[p]=m.store.state.players,list=bench?p.bench[0]:p.active,original=list.getPokemonCard(),replacement=['ex11-21','ex11-22','ex13-44'].includes(id);
  const old=exPut(m,'ex1-106',list),holon=exPut(m,id,p.hand),index=p.hand.cards.indexOf(holon);
  M.apply(m,M.handEnergyAction(p,index));drain(m);
  answer(m,M.pending(m).find(q=>q.type==='Choose pokemon'),[{player:R.PlayerType.BOTTOM_PLAYER,slot:bench?R.SlotType.BENCH:R.SlotType.ACTIVE,index:0}]);drain(m);
  if(replacement){const q=M.pending(m).find(q=>q.type==='Choose energy');assert.ok(q);answer(m,q,[q.energy.findIndex(e=>e.card===old)]);}
  exDrain(m);assert.equal(list.getPokemonCard(),original);assert.equal(holon.superType,R.SuperType.ENERGY);assert.ok(list.energies.cards.includes(holon));assert.equal(p.hand.cards.includes(old),replacement);
  const check=new R.CheckProvidedEnergyEffect(p,list);m.store.reduceEffect(m.store.state,check);assert.equal(R.StateUtils.getProvidesUnitCount(check.energyMap.find(e=>e.card===holon).provides),replacement?2:1);
  assert.equal(p.energyPlayedTurn,m.store.state.turn);const extra=exPut(m,id,p.hand);assert.throws(()=>M.apply(m,M.handEnergyAction(p,p.hand.cards.indexOf(extra))));
 }
});
