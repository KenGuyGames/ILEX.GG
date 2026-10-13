(async()=>{
 const assert=(v,s)=>{if(!v)throw Error('Drag: '+s)},checks=[];
 const saved={spec:rulesMatch.spec,journal:rulesMatch.journal.slice()};
 const owner=()=>rulesMatch.store.state.players[rulesMatch.store.state.activePlayer];
 const take=id=>{const p=owner();for(const list of [p.deck,p.hand]){const index=list.cards.findIndex(c=>c._labId===id);if(index>=0)return list.cards.splice(index,1)[0];}throw Error('Fixture missing '+id);};
 const redraw=()=>{tab='play';play();};
 const slot=(active,index=0)=>document.querySelectorAll('.near-seat .'+(active?'seat-active':'seat-bench'))[index];
 const hand=id=>{const index=owner().hand.cards.findIndex(c=>c._labId===id);assert(index>=0,'card in hand');return document.querySelectorAll('.near-hand .fan-card')[index];};
 const gesture=(source,target)=>{
  assert(source?.draggable,'draggable source');const dataTransfer=new DataTransfer();
  source.dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer}));
  const over=new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer});target.dispatchEvent(over);
  target.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer}));
  assert(!tableDrag,'drag session cleaned');return over.defaultPrevented;
 };
 try{
  owner().bench.forEach(b=>{b.cards=[];});owner().hand.cards.push(take('base1-45'));redraw();
  let count=rulesMatch.journal.length;assert(gesture(hand('base1-45'),slot(false)),'Basic highlights Bench');
  assert(owner().bench[0].getPokemonCard()?._labId==='base1-45'&&rulesMatch.journal.length===count+1,'Basic dropped on Bench');checks.push('Native drag/drop handlers bench a Basic Pokémon');
  count=rulesMatch.journal.length;gesture(hand('base1-99'),slot(true));
  assert(owner().active.cards.some(c=>c._labId==='base1-99')&&rulesMatch.journal.length===count+1,'Energy attaches to intended Pokémon');checks.push('Energy drop attaches through the engine');
  count=rulesMatch.journal.length;const handCount=owner().hand.cards.length;gesture(hand('base1-99'),slot(false));
  assert(rulesMatch.journal.length===count&&owner().hand.cards.length===handCount&&!owner().bench[0].cards.some(c=>c.superType===RulesMatch.R.SuperType.ENERGY),'Second attachment rejected');
  assert(!gesture(hand('base1-99'),document.querySelector('.far-seat .seat-active'))&&rulesMatch.journal.length===count,'Opponent destination rejected');checks.push('Illegal second attachments and opponent drops preserve hand and journal');
  owner().hand.cards.push(take('base1-91'));redraw();count=rulesMatch.journal.length;const beforeDraw=owner().hand.cards.length;
  gesture(hand('base1-91'),document.querySelector('.trainer-play-zone'));
  assert(rulesMatch.journal.length===count+1&&owner().hand.cards.length===beforeDraw+1&&owner().discard.cards.some(c=>c._labId==='base1-91'),'Bill draws two and discards');checks.push('Trainer drop resolves Bill and draws two cards');
  count=rulesMatch.journal.length;gesture(slot(false).querySelector('.seat-pokemon'),slot(true));
  assert(rulesMatch.journal.length===count+1&&owner().active.getPokemonCard()._labId==='base1-45'&&owner().discard.cards.some(c=>c._labId==='base1-99'),'Retreat pays Energy and switches');checks.push('Bench-to-Active drag retreats and pays the printed Energy cost');
  owner().hand.cards.push(take('base1-95'));redraw();gesture(hand('base1-95'),document.querySelector('.trainer-play-zone'));
  assert(RulesMatch.pending(rulesMatch)[0]?.type==='Choose pokemon','Switch requests a Pokémon');
  let switched=owner().bench[0].getPokemonCard();gesture(slot(false).querySelector('.seat-pokemon'),slot(true));
  assert(!RulesMatch.pending(rulesMatch).length&&owner().active.getPokemonCard()===switched,'Switch drag resolves target');checks.push('Switch Trainer is played by dragging and its Bench choice is also dragged');
  const R=RulesMatch.R,p=owner(),promotion=new R.ChoosePokemonPrompt(p.id,R.GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,R.PlayerType.BOTTOM_PLAYER,[R.SlotType.BENCH],{min:1,max:1,allowCancel:false});
  p.active.moveTo(p.discard);
  rulesMatch.store.prompt(rulesMatch.store.state,promotion,lists=>p.switchPokemon(lists[0],rulesMatch.store,rulesMatch.store.state));redraw();
  const expected=owner().bench[0].getPokemonCard();count=rulesMatch.journal.length;gesture(slot(false).querySelector('.seat-pokemon'),slot(true));
  assert(!RulesMatch.pending(rulesMatch).length&&owner().active.getPokemonCard()===expected&&rulesMatch.journal.length===count+1,'Promotion resolves engine prompt');checks.push('Bench drag resolves a required single Pokémon switch/promotion choice');
  const energy=take('base1-99');owner().active.cards.push(energy);
  const energyPrompt=new R.ChooseEnergyPrompt(owner().id,R.GameMessage.CHOOSE_ENERGY_TO_PAY_RETREAT_COST,[{card:energy,provides:[R.CardType.GRASS]}],[R.CardType.COLORLESS]);
  rulesMatch.store.prompt(rulesMatch.store.state,energyPrompt,entries=>owner().active.moveCardsTo(entries.map(e=>e.card),owner().discard));redraw();
  gesture(document.querySelector('.near-seat .seat-active .seat-energy span'),document.querySelector('.near-seat .seat-discard'));
  assert(promptChoice.length===1&&RulesMatch.pending(rulesMatch).length===1,'Energy drop stages choice');document.querySelector('#resolvechoice').click();
  assert(!RulesMatch.pending(rulesMatch).length&&owner().discard.cards.includes(energy),'Energy choice resolves');checks.push('Attached Energy can be dragged to Discard for a pending cost and confirmed');
 }finally{rulesMatch=RulesMatch.restore(saved,ruleMap,saved.spec.custom||state.custom);promptChoice=[];ruleSelected=null;seatFocus=null;saveRules();redraw();}
 return {passed:true,checks};
})()
