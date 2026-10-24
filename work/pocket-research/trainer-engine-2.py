from pathlib import Path
p=Path('work/pocket-candidate/ui/pocket-engine.js');s=p.read_text(encoding='utf-8')
s=s.replace("(!op.ex||c.ex)","(op.hpAtMost===undefined||c.hp<=op.hpAtMost)&&(!op.ex||c.ex)")
s=s.replace("case 'opponentType':", "case 'opponentPoints':return (c.min===undefined||o.points>=c.min)&&(c.max===undefined||o.points<=c.max);case 'ownName':return slots(p).some(t=>top(t).name===c.name);case 'activeAttack':return attacksFor(p.active,s).some(a=>a.name===c.name);case 'activeNames':return c.names.includes(top(p.active).name);case 'ownStage':return top(p.active).stage===c.stage;\n   case 'opponentType':")
s=s.replace("if(op.kind==='guaranteeHead')", "if(op.kind==='require')need(testPredicate(s,p,l,op.predicate),'The requirements for this card are not met');\n   else if(op.kind==='guaranteeHead')")
s=s.replace("else if(['attackBonus','costReduction'].includes(op.kind))", "else if(['attackBonus','costReduction','extraRandomHit','extraPoint'].includes(op.kind))")
s=s.replace("else if(op.kind==='teamReduction')", "else if(op.kind==='teamSurvive')p.effects.push({...op,expires:s.turn+1});\n   else if(op.kind==='teamReduction')")
s=s.replace("(!op.hasEnergy||t.energy.length)", "(!op.hasEnergy||t.energy.length)&&(op.minEnergy===undefined||t.energy.filter(e=>!op.energyType||op.energyType===e).length>=op.minEnergy)&&(op.maxHp===undefined||maximumHp(t,s)<=op.maxHp)")
s=s.replace("if(op.requiresDeckSubtype)need", "if(op.requiresDeckCategory)need(p.deck.some(r=>card(r).category===op.requiresDeckCategory),'No eligible cards remain in your deck');if(op.requiresDeckSubtype)need")
s=s.replace("player:p.id,cardPlayer:cardOwner.id", "player:op.controller==='opponent'?o.id:p.id,actor:p.id,cardPlayer:cardOwner.id")
s=s.replace("player:p.id,source:q.source,sourceKind:q.sourceKind,targetCard:action.value", "player:q.actor??p.id,source:q.source,sourceKind:q.sourceKind,targetCard:action.value")
s=s.replace("const owner=op.opponent?o:p,choices=owner.hand.filter", "const owners=op.both?[p,o]:[op.opponent?o:p],choices=owners.flatMap(owner=>owner.hand.filter(r=>matches(card(r),op)).map(ref=>({owner,ref})));if(!choices.length)return;const choice=choices[Math.floor(random(s)*choices.length)],owner=choice.owner,ref=choice.ref;owner.hand=owner.hand.filter(r=>r!==ref);event(s,'reveal',{player:owner.id,cards:[ref.id]});if(op.discard)owner.discard.push(ref);else{owner.deck.push(ref);shuffle(s,owner.deck);}return;const obsolete=owner.hand.filter")
# Replace the whole randomHand branch cleanly rather than retaining dead implementation.
a=s.index("   else if(op.kind==='randomHand')");b=s.index("   else if(op.kind===",a+12)
s=s[:a]+'''   else if(op.kind==='randomHand'){const owners=op.both?[p,o]:[op.opponent?o:p],choices=owners.flatMap(owner=>owner.hand.filter(r=>matches(card(r),op)).map(ref=>({owner,ref})));if(!choices.length)return;const {owner,ref}=choices[Math.floor(random(s)*choices.length)];owner.hand=owner.hand.filter(r=>r!==ref);event(s,'reveal',{player:owner.id,cards:[ref.id]});if(op.discard)owner.discard.push(ref);else{owner.deck.push(ref);shuffle(s,owner.deck);}}
''' +s[b:]
s=s.replace("const choices=s.players.flatMap(owner=>slots(owner).flatMap(target=>", "const choices=(op.opponent?[o]:s.players).flatMap(owner=>slots(owner).filter(target=>!op.hasAbility||enabled(s,target)&&top(target).ability).flatMap(target=>")
s=s.replace("else if(op.kind==='gatherEnergy'){for(const from of slots(p).filter(t=>t!==l))", "else if(op.kind==='gatherEnergy'){const target=op.active?p.active:l;for(const from of slots(p).filter(t=>t!==target&&(!op.benchOnly||p.bench.includes(t))))")
s=s.replace("l.energy.push(...moved);}}", "target.energy.push(...moved);}}")
s=s.replace("else if(op.kind==='cureTarget'){const t=slots(p).find(x=>x.key===op.target)||l;t.conditions=[];}", "else if(op.kind==='cureTarget'){const t=slots(p).find(x=>x.key===op.target)||l;t.conditions=op.statuses?t.conditions.filter(c=>!op.statuses.includes(c)):[];}")
s=s.replace("need(target.conditions.length,'No Special Condition to remove');", "if(!target.conditions.length&&op.optional)return;need(target.conditions.length,'No Special Condition to remove');")
s=s.replace("(top(l).retreat||0)-(t.retreat||0)", "(top(l).retreat||0)+l.effects.filter(e=>e.kind==='retreatMore').reduce((n,e)=>n+e.amount,0)-(t.retreat||0)")
i=s.index("   else if(op.kind==='switchSelf')")
s=s[:i]+'''   else if(op.kind==='swapRandom'){const choices=p.deck.filter(r=>matches(card(r),op)),ref=p.hand.find(r=>r.key===op.targetCard);need(ref&&choices.length,'Choose eligible cards to swap');const found=choices[Math.floor(random(s)*choices.length)];p.hand=p.hand.filter(r=>r!==ref);p.deck=p.deck.filter(r=>r!==found);p.hand.push(found);p.deck.push(ref);shuffle(s,p.deck);}
   else if(op.kind==='drawScaled'){const count=op.scale==='megaInPlay'?s.players.flatMap(slots).filter(l=>top(l).mega).length:0;need(count,'No eligible Pokémon in play');draw(s,p,count);}
   else if(op.kind==='healDiscard'){const target=slots(p).find(t=>t.key===op.target),before=target.damage;heal(s,target,op.amount);if(target.damage<before){const indices=target.energy.map((type,i)=>!op.type||op.type===type?i:-1).filter(i=>i>=0).slice(0,op.count==='all'?target.energy.length:op.count);for(const i of indices.reverse())p.energyDiscard.push(...target.energy.splice(i,1));}}
   else if(op.kind==='moveDamageToOpponent'){const from=slots(p).find(t=>t.key===op.target);need(from&&from.damage>0,'Choose a damaged Pokémon');const amount=Math.min(from.damage,op.amount);from.damage-=amount;o.active.damage+=amount;o.active.lastDamage={turn:s.turn,cause:'effect'};}
   else if(op.kind==='discardDown'){const owner=op.opponent?o:p;if(owner.hand.length>op.to)s.queue.unshift({kind:'chooseCard',player:p.id,source:l?.key,sourceKind:op.sourceKind,opponent:op.opponent,controller:op.opponent?'opponent':undefined,next:[{kind:'discardChosen'},{...op}]});}
''' +s[i:]
s=s.replace("if(attackKO&&ability.surviveAttack&&coin(s,p.id))", "if(attackKO&&(p.effects.some(e=>e.kind==='teamSurvive'&&matches(c,e))||ability.surviveAttack&&coin(s,p.id)))")
s=s.replace("s.players[1-p.id].points+=awarded;", "const bonus=attackKO&&wasActive&&hitter?s.players[1-p.id].effects.filter(e=>e.kind==='extraPoint'&&top(hitter).name===e.name).reduce((n,e)=>n+e.amount,0):0;s.players[1-p.id].points+=awarded+bonus;")
p.write_text(s,encoding='utf-8')
