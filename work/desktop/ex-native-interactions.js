(async()=>{
 const M=RulesMatch,R=M.R,assert=(v,s)=>{if(!v)throw Error(s)},checks=[];
 const deck={name:'EX interaction native fixture',cards:{'exu-A':1,'ex13-4':1,'ex11-38':1,'ex1-75':4,'ex1-108':53}};
 function fixture(){const m=M.create({profile:'exlate',seed:7,decks:[deck,deck]},ruleMap);for(let n=0;n<150&&M.pending(m).length;n++){const q=M.pending(m)[0],a=BotAI.prompt(m,q,'normal');assert(a,'Setup choice');M.apply(m,a);}m.store.state.turn=2;return m;}
 function put(id,list,index){const c=R.CardManager.getInstance().getCardByName(ruleMap[id]);c._labId=id;c.id=-99000-index;list.cards.push(c);return c;}
 function automatic(m){for(let n=0;n<100;n++){const q=M.pending(m).find(q=>['WaitPrompt','Shuffle deck','Coin flip'].includes(q.type));if(!q)return;M.apply(m,BotAI.prompt(m,q,'normal'));}}
 for(const [i,[id,name]] of [['exu-A','Shuffle'],['ex13-4','Form Change'],['ex11-38','Duplicate']].entries()){
  const m=fixture(),p=m.store.state.players[m.store.state.activePlayer];p.active.cards=[];const c=put(id,p.active,i);p.active.damage=20;p.deck.cards=[];put('ex1-108',p.deck,10+i);
  M.apply(m,{type:'ability',player:p.id,name,target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}});automatic(m);const q=M.pending(m).find(q=>q.type==='Choose cards');assert(q,'Replacement search');M.apply(m,{type:'prompt',id:q.id,value:null});automatic(m);assert(!M.pending(m).length&&p.active.getPokemonCard()===c&&p.active.damage===20,'Cancel replacement leaves table intact');checks.push(name+' cancellation');
 }
 for(const count of [0,1,2]){const m=fixture(),p=m.store.state.players[m.store.state.activePlayer];p.hand.cards=[];put('ex15-76',p.hand,30);M.apply(m,{type:'play',player:p.id,index:0,target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}});automatic(m);for(let n=0;n<count;n++){const q=M.pending(m).find(q=>q.type==='Select');assert(q,'Reveal choice');M.apply(m,{type:'prompt',id:q.id,value:1});}const q=M.pending(m).find(q=>q.type==='Select');if(q)M.apply(m,{type:'prompt',id:q.id,value:0});automatic(m);assert(!M.pending(m).length&&p.hand.cards.length===2&&p.prizes.filter(l=>l.faceUpPrize).length===count,'Island Hermit sequence');checks.push('Island Hermit '+count+' reveals');}
 const previous=rulesMatch;
 try{for(const [i,id] of ['ex11-21','ex11-22','ex13-44','ex11-70','ex11-71'].entries()){
  const m=fixture(),p=m.store.state.players[m.store.state.activePlayer];rulesMatch=m;p.hand.cards=[];const energy=put('ex1-108',p.active,100+i),holon=put(id,p.hand,110+i),original=p.active.getPokemonCard();
  pickRuleHand(p.id,0);assert($('#modal').textContent.includes('Attach as Energy'),'Hand offers Energy mode '+id);$('#modal').close();
  const intent=dragIntent({kind:'hand',player:p.id,index:0},{kind:'slot',player:p.id,active:true,index:0});assert(intent?.action?.type==='ability'&&intent.action.target.slot===R.SlotType.HAND,'Occupied drop attaches '+id);
  assert(BotAI.candidates(m,p.id).some(x=>x.action.type==='ability'&&x.action.target.slot===R.SlotType.HAND),'Bot has Energy mode '+id);
  M.apply(m,intent.action);automatic(m);const q=M.pending(m).find(q=>q.type==='Choose pokemon');assert(q,'Attachment target');M.apply(m,{type:'prompt',id:q.id,value:[{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}]});automatic(m);
  const returnEnergy=M.pending(m).find(q=>q.type==='Choose energy');if(returnEnergy)M.apply(m,{type:'prompt',id:returnEnergy.id,value:[returnEnergy.energy.findIndex(e=>e.card===energy)]});automatic(m);
  assert(!M.pending(m).length&&p.active.getPokemonCard()===original&&p.active.energies.cards.includes(holon)&&holon.superType===R.SuperType.ENERGY,'Attachment resolves '+id);checks.push(id+' hand/drag Energy');
 }}finally{rulesMatch=previous;$('#modal').close();}
 return {passed:true,checks};
})()
