from pathlib import Path
p=Path('work/pocket-candidate/ui/pocket-engine.js');s=p.read_text(encoding='utf-8').replace("(!op.tag||c.tags.includes(op.tag))", "(!op.evolvesFrom||c.evolvesFrom===op.evolvesFrom)&&(!op.tag||c.tags.includes(op.tag))")
i=s.index('  function enabled(')
s=s[:i]+'''  function testPredicate(s,p,l,c){const o=s.players[1-p.id];switch(c?.test){
   case 'opponentType':return c.types.includes(typeCodes[top(o.active).subtype]);case 'opponentStage':return top(o.active).stage===c.stage;case 'opponentStatus':return !!o.active.conditions.length;
   case 'status':return o.active.conditions.includes(c.status);case 'hpCompare':return c.more?maximumHp(o.active,s)-o.active.damage>maximumHp(l,s)-l.damage:maximumHp(o.active,s)-o.active.damage<maximumHp(l,s)-l.damage;
   case 'equalHands':return p.hand.length===o.hand.length;case 'handCounts':return c.counts.includes((c.opponent?o:p).hand.length);
   case 'energyTypes':return new Set(l.energy).size>=c.count;case 'teamEnergyTypes':return new Set(slots(p).flatMap(t=>t.energy)).size>=c.count;
   case 'moreEnergy':return l.energy.length>o.active.energy.length;case 'sharedEnergy':return l.energy.some(t=>o.active.energy.includes(t));case 'noPoints':return p.points===0;
   case 'discardName':return p.discard.some(r=>card(r).name===c.name);case 'opponentName':return top(o.active).name===c.name;case 'benchStage':return p.bench.some(t=>top(t).stage===c.stage);
   case 'opponentTeamType':return slots(o).some(t=>typeCodes[top(t).subtype]===c.type);case 'evolvedFrom':return l.evolved===s.turn&&l.stack.length>1&&card(l.stack.at(-2)).name===c.name;
   case 'stadium':return !!s.stadium;case 'woundedSelf':return l.damage>0;case 'hpAtMost':return maximumHp(l,s)-l.damage<=c.hp;
   default:return false;
  }}
''' +s[i:]
s=s.replace("const handZone=op.zone==='discard'?p.discard:p.hand,options=handZone.filter", "const cardOwner=op.opponent?o:p,handZone=op.zone==='discard'?cardOwner.discard:cardOwner.hand,options=handZone.filter")
s=s.replace("zone:op.zone||'hand',options,source:", "cardPlayer:cardOwner.id,zone:op.zone||'hand',options,source:")
s=s.replace("sourceKind:q.sourceKind,targetCard:action.value}", "sourceKind:q.sourceKind,targetCard:action.value,targetCardPlayer:q.cardPlayer}")
s=s.replace("const ref=p.hand.find(r=>r.key===op.targetCard);need(ref,'Choose a card from hand');p.hand=p.hand.filter(r=>r!==ref);p.discard.push(ref);", "const owner=s.players[op.targetCardPlayer??p.id],ref=owner.hand.find(r=>r.key===op.targetCard);need(ref,'Choose a card from hand');owner.hand=owner.hand.filter(r=>r!==ref);owner.discard.push(ref);")
s=s.replace("const ref=p.hand.find(r=>r.key===op.targetCard);need(ref,'Choose a card in hand');p.hand=p.hand.filter(r=>r!==ref);p.deck.push(ref);shuffle(s,p.deck);", "const owner=s.players[op.targetCardPlayer??p.id],ref=owner.hand.find(r=>r.key===op.targetCard);need(ref,'Choose a card in hand');owner.hand=owner.hand.filter(r=>r!==ref);owner.deck.push(ref);shuffle(s,owner.deck);")
s=s.replace("(!op.name||c.name===op.name)","(!op.name||c.name===op.name)&&(!op.names||op.names.includes(c.name))")
s=s.replace("if(!op.wounded||t.damage>0)attackDamage", "if((!op.wounded||t.damage>0)&&(!op.hasEnergy||t.energy.length))attackDamage")
s=s.replace("if((!op.energy||t.energy.includes(op.energy))&&(!op.type||typeCodes[top(t).subtype]===op.type))", "if((!op.bench||p.bench.includes(t))&&matches(top(t),op)&&(!op.energy||t.energy.includes(op.energy)))")
s=s.replace("const yes=op.condition==='opponentBasic'&&top(o.active).stage===0;", "const yes=op.predicate?testPredicate(s,p,l,op.predicate)!==!!op.inverse:op.condition==='opponentBasic'&&top(o.active).stage===0;")
s=s.replace("if(op.scale==='remainingHp')", "if(op.scale==='opponentPoints')count=o.points;\n    if(op.scale==='opponentConditions')count=o.active.conditions.length;\n    if(op.scale==='ownKnockouts')count=s.eventsHistory.filter(e=>e.type==='knockout'&&e.player===p.id).length;\n    if(op.scale==='discardSupporter')count=p.discard.filter(r=>card(r).subtype==='Supporter').length;\n    if(op.scale==='typedDiscard')count=p.discard.filter(r=>card(r).category==='Pokemon'&&typeCodes[card(r).subtype]===op.type).length;\n    if(op.scale==='remainingHp')")
s=s.replace("    attackDamage(s,p.id,l,o.active,op.base+(yes?op.amount:0));", "    if(op.predicate)yes=testPredicate(s,p,l,op.predicate);attackDamage(s,p.id,l,o.active,op.base+(yes?op.amount:0));")
s=s.replace("target.energy.splice(at,1)","target.energy.splice(at,1)")
s=s.replace("for(let i=0;i<op.amount&&target.energy.length;i++){const at=Math.floor(random(s)*target.energy.length);owner.energyDiscard.push(...target.energy.splice(at,1));}", "for(let i=0;i<op.amount&&target.energy.length;i++){const indices=target.energy.map((t,i)=>!op.type||t===op.type?i:-1).filter(i=>i>=0);if(!indices.length)break;const at=indices[Math.floor(random(s)*indices.length)];owner.energyDiscard.push(...target.energy.splice(at,1));}")
s=s.replace("if(!ignore)damage=Math.max(0,damage-", "damage+=target.effects.filter(e=>e.kind==='vulnerable').reduce((n,e)=>n+e.amount,0);if(!ignore)damage=Math.max(0,damage-")
i=s.index("   else if(op.kind==='discardChosen')")
s=s[:i]+'''   else if(op.kind==='countCoins'){let heads=0;for(let i=0;i<op.count;i++)if(coin(s,p.id))heads++;s.queue.unshift({...op.then,heads,count:op.count,player:p.id,source:l.key,sourceKind:op.sourceKind});}
   else if(op.kind==='coinTableDamage')attackDamage(s,p.id,l,o.active,op.base+(op.heads===op.count?op.amount:0));
   else if(op.kind==='coinThresholdDamage'){attackDamage(s,p.id,l,o.active,op.base+(op.flat?(op.heads>=op.threshold?op.amount:0):op.heads*op.amount));if(op.status&&op.heads>=op.threshold)s.queue.unshift({kind:'status',status:op.status,player:p.id,source:l.key,sourceKind:op.sourceKind});}
   else if(op.kind==='coinBenchDamage'){for(const t of o.bench)attackDamage(s,p.id,l,t,op.amount*op.heads,{bench:true});}
   else if(op.kind==='coinEnergyDiscardDamage'){if(op.heads){attackDamage(s,p.id,l,o.active,op.base);s.queue.unshift({kind:'randomEnergyDiscard',player:p.id,source:l.key,sourceKind:op.sourceKind,opponent:true,amount:op.heads});}}
   else if(op.kind==='randomHand'){const owner=op.opponent?o:p,choices=owner.hand.filter(r=>matches(card(r),op));if(!choices.length)return;const ref=choices[Math.floor(random(s)*choices.length)];owner.hand=owner.hand.filter(r=>r!==ref);event(s,'reveal',{player:owner.id,cards:[ref.id]});if(op.discard)owner.discard.push(ref);else{owner.deck.push(ref);shuffle(s,owner.deck);}}
''' +s[i:]
s=s.replace("op.energyCount?l.energy.filter(t=>!op.type||t===op.type).length:op.count", "op.pokemonCount?slots(p).length:op.energyCount?l.energy.filter(t=>!op.type||t===op.type).length:op.count")
p.write_text(s,encoding='utf-8')
p=Path('work/pocket-candidate/ui/pocket-ui.js');s=p.read_text(encoding='utf-8').replace("[...m.players[m.prompt.player].hand,...m.players[m.prompt.player].discard]", "[...m.players[m.prompt.cardPlayer??m.prompt.player].hand,...m.players[m.prompt.cardPlayer??m.prompt.player].discard]");p.write_text(s,encoding='utf-8')
