 function realDiscardPrompt(m,q,owner,origin,out){
  if(!['Choose cards','Discard energy'].includes(q.type)||origin?.player!==owner.id||!/DISCARD/i.test(String(q.message)))return null;
  const source=origin.target?.slot===R.SlotType.BENCH?owner.bench[origin.target.index]:owner.active,card=source?.getPokemonCard();if(!card)return null;
  let attack=origin.type==='attack'?realAttacks(m,owner,source).find(a=>a.attack.name===origin.name)?.attack:null;
  if(!attack&&origin.type==='ability'&&/use[\s\S]*attacks?/i.test(card.powers.find(p=>p.name===origin.name)?.text||'')&&origin.copiedAttackName){const options=m.store.state.players.flatMap(p=>[...realSlots(p).map(l=>l.getPokemonCard()),...p.discard.cards]).flatMap(c=>c.attacks||[]).filter(a=>a.name===origin.copiedAttackName),unique=new Map(options.map(a=>[a.text+'|'+a.damage,a]));if(unique.size===1)attack=[...unique.values()][0];}
  if(!attack)return null;const text=attack.text||'',match=text.match(/(\d+)\s+(more\s+)?damage\s+for each\s+(?:\w+\s+){0,4}(?:cards?|Energy)\s+(?:you\s+)?(?:discard(?:ed)?|put (?:in|into))/i);if(!match||/to each|each of your opponent.s|all of your opponent.s/i.test(text))return null;
  const rows=q.type==='Choose cards'?q.cards.cards.map((c,i)=>({c,value:i})).filter(x=>!q.options.blocked.includes(x.value)&&R.matchesPromptFilter(x.c,q.filter)):RulesMatch.targets(m,q).flatMap(x=>x.list.cards.map((c,index)=>({c,list:x.list,value:{from:x.target,index}}))).filter(x=>x.c.superType===R.SuperType.ENERGY&&R.matchesPromptFilter(x.c,q.filter));
  if(!rows.length)return null;const min=q.options.count??q.options.min??0,max=Math.min(q.options.count??q.options.max??rows.length,rows.length),op=m.store.state.players.find(p=>p!==owner),base=match[2]?Number(attack.damage)||0:0,coefficient=Number(match[1]);
  const maps=new Map(),ordered=[],remaining=rows.slice();
  while(remaining.length){let best;
   for(const row of remaining){let cost=realisticCardValue(m,owner,row.c)*.2,next;
    if(row.list){const map=maps.get(row.list)||realEnergy(m,owner,row.list);next=map.filter(e=>e.card.id!==row.c.id);const costs=row.list===source?[attack.cost]:realAttacks(m,owner,row.list).map(a=>a.cost),before=Math.min(6,...costs.map(c=>realMissing(map,c))),after=Math.min(6,...costs.map(c=>realMissing(next,c)));cost+=Math.max(0,after-before)*(row.list===source?35:22);}
    if(!best||cost<best.cost)best={row,cost,next};
   }ordered.push(best.row);if(best.next)maps.set(best.row.list,best.next);remaining.splice(remaining.indexOf(best.row),1);
  }
  let best;
  for(let n=min;n<=max;n++){const value=ordered.slice(0,n).map(x=>x.value),action=out(value);if(!action)continue;const damage=realDamage(m,source,op.active,{...attack,damage:base+n*coefficient,text:''}),ko=damage>=realHp(op.active),score=Math.min(damage,realHp(op.active))*.35+(ko?1200*realPrize(op.active):0)-n*(q.type==='Choose cards'?8:20);if(!best||score>best.score)best={action,score};if(ko)return action;}
  return best?.action||null;
 }
