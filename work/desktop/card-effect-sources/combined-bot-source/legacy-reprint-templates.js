  // Historical effect templates stay separate from modern reprints.
  for(const [base,name,text,kind]of [
    ['Leftovers GE','ILEX FORMAT Leftovers legacy','At the end of your turn, if this is attached to your Active Pokemon, remove 1 damage counter from that Pokemon.','leftovers'],
    ['Lum Berry SSH','ILEX FORMAT Lum Berry modern','At the end of each turn, remove all Special Conditions from the Pokemon this is attached to, then discard this card.','lumModern'],
    ['ILEX EX ex9-78','ILEX FORMAT Lum Berry legacy','Between turns, remove all Special Conditions from the Pokemon this is attached to, then discard this card.','lum']
  ]){
    const card=manager.getCardByName(base);if(!card)throw Error('Missing historical template '+base);
    card.fullName=name;card.text=text;
    card.reduceEffect=function(store,state,e){
      const timing=kind==='leftovers'||kind==='lumModern'?e instanceof R.EndTurnEffect:e.type==='EX_CHECKUP_COMPLETE_EFFECT';if(!timing)return state;
      for(const owner of state.players)for(const list of [owner.active,...owner.bench]){
        if(!list.tools.includes(this)||kind==='leftovers'&&(owner!==e.player||list!==owner.active))continue;
        try{store.reduceEffect(state,new R.ToolEffect(owner,this));}catch{return state;}
        if(kind==='leftovers')store.reduceEffect(state,new R.HealEffect(owner,list,10));
        else if(list.specialConditions.length){for(const condition of list.specialConditions.slice())list.removeSpecialCondition(condition);store.reduceEffect(state,new R.MoveCardsEffect(list,owner.discard,{cards:[this],sourceCard:this,sourceEffect:e}));}
      }
      return state;
    };
    prototypes.set(name,card);manager.defineCard(card);
  }
