from pathlib import Path
p=Path('work/pocket-candidate/ui/pocket-engine.js');s=p.read_text(encoding='utf-8')
s=s.replace("case 'opponentPoints':", "case 'fewerPokemon':return slots(p).length<slots(o).length;case 'equalEnergy':return l.energy.length===o.active.energy.length;case 'promoted':return l.promoted===s.turn&&l.promotedTop===top(l).id;\n   case 'opponentPoints':")
s=s.replace("function clearLeavingActive(l){if(!l)return;l.conditions=[];", "function clearLeavingActive(l){if(!l)return;l.conditions=[];delete l.poisonDamage;")
s=s.replace("l.damage+=10+auras", "l.damage+=(l.poisonDamage||10)+auras")
s=s.replace("target.effects.some(x=>x.kind==='preventAttacks')||defensive.preventEx", "target.effects.some(x=>x.kind==='preventAttacks'||x.kind==='preventDamage'||x.kind==='preventBasicDamage'&&top(source).stage===0)||defensive.preventEx")
s=s.replace("damage+=target.effects.filter(e=>e.kind==='vulnerable')", "if(!ignore)damage+=target.effects.filter(e=>e.kind==='vulnerable')")
s=s.replace("target.damage+=damage;if(damage)", "if(!ignore&&target.effects.some(e=>e.kind==='preventSmallDamage'&&damage<=e.amount))damage=0;\n   if(target===s.players[1-player].active)source.attackDamageTotal=(source.attackDamageTotal||0)+damage;target.damage+=damage;if(damage)")
s=s.replace("if(!t.conditions.includes(op.status))t.conditions.push(op.status);", "if(!t.conditions.includes(op.status))t.conditions.push(op.status);if(op.status==='Poisoned')t.poisonDamage=op.poisonDamage||10;")
s=s.replace("let damage=Math.max(0,amount);if(!damage)return;", "let damage=Math.max(0,amount);if(!damage)return;")
s=s.replace("source.currentAttack=a.name;event", "source.currentAttack=a.name;source.attackDamageTotal=0;source.attackUses=(source.attackUses||0)+1;event")
s=s.replace("a.cost,...", "a.cost,...")
s=s.replace("op.count??op.coins", "op.toolCount&&attachedTools(l).some(r=>card(r).name===op.toolCount.name)?op.toolCount.count:op.count??op.coins")
s=s.replace("op.pokemonCount?slots(p).length", "op.pokemonCount?slots(p).filter(t=>!op.names||op.names.includes(top(t).name)).length")
s=s.replace("'allHeads','allHeadsDraw'", "'allHeads','allHeadsDraw','untilTailsMill'")
s=s.replace("c.category==='Pokemon'&&c.stage===0&&(!op.name", "c.category==='Pokemon'&&(op.allowEvolution||c.stage===0)&&(!op.name")
s=s.replace("op.scale==='megaInPlay'?s.players.flatMap(slots).filter(l=>top(l).mega).length:0", "op.scale==='megaInPlay'?s.players.flatMap(slots).filter(l=>top(l).mega).length:op.names?slots(p).filter(t=>op.names.includes(top(t).name)).length:0")
s=s.replace("if(op.toHand&&owner.hand.length<10)owner.hand.push(ref);else owner.discard.push(ref);", "if(op.toHand&&owner.hand.length<10)owner.hand.push(ref);else if(op.toDeck)owner.deck.push(ref);else owner.discard.push(ref);")
s=s.replace("removeTool(t,ref);}}", "removeTool(t,ref);}if(op.toDeck)shuffle(s,owner.deck);}") if False else s
s=s.replace("const heads=op.rolls.filter(Boolean).length;attackDamage(s,p.id,l,o.active,op.base+(yes?op.amount:0))", "const heads=op.rolls.filter(Boolean).length;attackDamage(s,p.id,l,o.active,op.base+(yes?op.amount:0))")
s=s.replace("attackDamage(s,p.id,l,o.active,op.base+(yes?op.amount:0));", "attackDamage(s,p.id,l,o.active,op.base+(yes?op.amount:0),{ignore:op.ignore});")
s=s.replace("if(op.scale==='opponentPoints')", "if(op.scale==='opponentAbilities')count=slots(o).filter(t=>top(t).ability&&enabled(s,t)).length;\n    if(op.scale==='opponentDeckTrainers')count=o.deck.filter(r=>card(r).category==='Trainer').length;\n    if(op.scale==='opponentLastPoints')count=s.eventsHistory.filter(e=>e.type==='knockout'&&e.player===p.id&&e.turn===s.turn-1).reduce((n,e)=>n+e.points,0);\n    if(op.scale==='opponentPoints')")
i=s.index("   else if(op.kind==='copyAttack')")
s=s[:i]+'''   else if(op.kind==='randomHits'){const owners=op.both?[p,o]:[o],choices=owners.flatMap(owner=>(op.bench?owner.bench:slots(owner)).filter(t=>!op.notSelf||t!==l).map(target=>({owner:owner.id,target:target.key})));if(!choices.length)return;const extra=p.effects.filter(e=>e.kind==='extraRandomHit'&&e.name===l.currentAttack).reduce((n,e)=>n+e.amount,0),count=(op.energyCount?l.energy.filter(e=>e===op.type).length:op.count)+extra,selected=new Map();for(let i=0;i<count;i++){const choice=choices[Math.floor(random(s)*choices.length)],key=choice.owner+':'+choice.target;selected.set(key,{...choice,count:(selected.get(key)?.count||0)+1});}for(const hit of selected.values()){const owner=s.players[hit.owner],target=slots(owner).find(t=>t.key===hit.target);attackDamage(s,p.id,l,target,op.amount*hit.count,{bench:owner.active!==target});}}
   else if(op.kind==='secondAttack'){const source=slots(p).find(t=>t.key===op.source);if(source&&source===p.active&&o.active){attackDamage(s,p.id,source,o.active,op.amount);s.queue.unshift({kind:'checkKO',player:p.id});}}
   else if(op.kind==='discardScaledDamage'){const removed=l.energy.filter(t=>op.types.includes(t));l.energy=l.energy.filter(t=>!op.types.includes(t));p.energyDiscard.push(...removed);attackDamage(s,p.id,l,o.active,removed.length*op.amount);}
   else if(op.kind==='healDamageDone')heal(s,l,l.attackDamageTotal||0);
   else if(op.kind==='healOpponent')heal(s,o.active,op.amount);
   else if(op.kind==='setRemainingHp'){if(effectsBlocked(o.active,s))return;const remaining=maximumHp(o.active,s)-o.active.damage,next=op.half?Math.floor(remaining/20)*10:op.hp;o.active.damage=Math.max(0,maximumHp(o.active,s)-next);o.active.lastDamage={turn:s.turn,cause:'effect'};}
   else if(op.kind==='removeStadium'){if(s.stadium){s.players[s.stadium.player].discard.push(s.stadium.ref);s.stadium=null;}}
   else if(op.kind==='drawToOpponent')draw(s,p,Math.max(0,o.hand.length-p.hand.length));
   else if(op.kind==='untilTailsMill')o.discard.push(...o.deck.splice(0,op.rolls.filter(Boolean).length));
   else if(op.kind==='coinEnergyDiscard')s.queue.unshift({kind:'randomEnergyDiscard',player:p.id,source:l.key,sourceKind:op.sourceKind,opponent:op.opponent,amount:op.heads});
   else if(op.kind==='coinBonusTable')attackDamage(s,p.id,l,o.active,op.base+(op.table[op.heads]||0));
''' +s[i:]
s=s.replace("need(action.slot!==0||!auras(s,o).some(a=>a.blockActiveEvolution)", "need(!p.effects.some(e=>e.kind==='lockTrainer'&&e.subtype==='evolution'),'Evolution is blocked this turn');need(action.slot!==0||!auras(s,o).some(a=>a.blockActiveEvolution)")
p.write_text(s,encoding='utf-8')
