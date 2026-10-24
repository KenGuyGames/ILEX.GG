from pathlib import Path
p=Path('work/pocket-candidate/ui/pocket-engine.js');s=p.read_text(encoding='utf-8')
s=s.replace("case 'fewerPokemon':", "case 'firstAttack':return l.attackUses===1;case 'benchName':return p.bench.some(t=>top(t).name===c.name);case 'benchNames':return c.names.every(name=>p.bench.some(t=>top(t).name===name));case 'emptyDeck':return !p.deck.length;case 'revenge':return s.eventsHistory.some(e=>e.type==='knockout'&&e.player===p.id&&e.cause==='attack'&&e.turn===s.turn-1);case 'damagedLastTurn':return l.receivedAttack?.turn===s.turn-1&&l.receivedAttack.active;case 'opponentNameContains':return top(o.active).name.includes(c.name);\n   case 'extraEnergy':{const remaining=[...providedEnergy(s,p,l)];for(let i=0;i<c.count;i++){const at=remaining.indexOf(c.type);if(at<0)return false;remaining.splice(at,1);}return !!pay(remaining,c.cost);}\n   case 'fewerPokemon':")
s=s.replace("const cost=[...a.cost],own=", "const special=s&&a.automation?.find(op=>op.kind==='specialCost'&&testPredicate(s,p,l,op.predicate)),cost=[...(special?special.cost:a.cost)],own=")
s=s.replace("(a.energyHp||0)*l.energy.filter(e=>e===a.energyType).length", "(a.energyHp||0)*(p?providedEnergy(s,p,l):l.energy).filter(e=>e===a.energyType).length")
s=s.replace("if(op.kind==='noop')return;", "if(['noop','specialCost'].includes(op.kind))return;\n   else if(op.kind==='attackRequirement')need(testPredicate(s,p,l,op.predicate),'Missing required Pokémon for this attack');")
s=s.replace("name:op.name,expires:op.untilLeave?9999:s.turn+(op.opponent?1:op.nextOwn?2:1)", "name:op.name,benchAlso:op.benchAlso,expires:op.untilLeave?9999:s.turn+(op.nextOwn?2:1)")
s=s.replace("p.effects.push({...op,expires:s.turn});", "p.effects.push({...op,starts:op.nextOwn?s.turn+2:s.turn,expires:s.turn+(op.nextOwn?2:0)});")
s=s.replace("e.kind==='attackBonus'&&matches", "e.kind==='attackBonus'&&(!e.starts||e.starts<=s.turn)&&matches")
s=s.replace("if(!bench)damage+=", "if(bench&&opposing)damage+=s.players[player].effects.filter(e=>e.kind==='attackBonus'&&e.benchAlso&&(!e.starts||e.starts<=s.turn)&&matches(top(source),e)).reduce((n,e)=>n+e.amount,0)+source.effects.filter(e=>e.kind==='namedBonus'&&e.benchAlso&&e.name===source.currentAttack).reduce((n,e)=>n+e.amount,0);\n   if(!bench)damage+=")
s=s.replace("target.damage+=damage;if(damage)target.lastDamage", "target.damage+=damage;if(damage&&opposing)target.receivedAttack={turn:s.turn,active:target===s.players[1-player].active};if(damage)target.lastDamage")
s=s.replace("const field=stadium(s);if(!bench)","const field=stadium(s);if(!bench)")
s=s.replace("function end(s){", "function end(s){\n   for(const owner of s.players){for(const e of owner.effects.filter(e=>e.kind==='delayedSpot'&&e.expires===s.turn)){const target=slot(owner,e.spot);if(target&&!effectsBlocked(target,s)){target.damage=e.knockout?maximumHp(target,s):target.damage+e.amount;target.lastDamage={turn:s.turn,cause:'effect'};}}for(const target of slots(owner))for(const e of target.effects.filter(e=>e.kind==='delayedDamage'&&e.expires===s.turn))if(!effectsBlocked(target,s)){target.damage+=e.amount;target.lastDamage={turn:s.turn,cause:'effect'};}}")
s=s.replace("if(ownPassive.zoneSleep&&p.active===target", "if((ownPassive.zoneSleep&&p.active===target||target.effects.some(e=>e.kind==='zoneSleep'))")
s=s.replace("attachZone(s,p,target,op.type,op.amount);", "attachZone(s,p,target,op.randomType?p.energyTypes[Math.floor(random(s)*p.energyTypes.length)]:op.type,op.amount);")
s=s.replace("op.randomType?p.energyTypes[Math.floor(random(s)*p.energyTypes.length)]", "op.randomType?energyTypes[Math.floor(random(s)*energyTypes.length)]")
s=s.replace("op.pokemonCount?slots(p).filter(t=>!op.names||op.names.includes(top(t).name)).length:op.energyCount?l.energy.filter", "op.pokemonCount?slots(p).filter(t=>!op.names||op.names.includes(top(t).name)).length:op.energyCount?providedEnergy(s,p,l).filter")
s=s.replace("bench:owner.active!==target", "bench:owner.id===p.id||owner.active!==target")
s=s.replace("attackDamage(s,p.id,l,target,op.amount,{bench:", "attackDamage(s,p.id,l,target,op.amount*(op.perEnergy?providedEnergy(s,owner,target).length:1),{bench:")
s=s.replace("if(op.scale==='opponentEnergy')count=o.active.energy.length;", "if(op.scale==='opponentEnergy')count=providedEnergy(s,o,o.active).length;")
s=s.replace("count=l.energy.filter(t=>!op.type||t===op.type).length;", "count=providedEnergy(s,p,l).filter(t=>!op.type||t===op.type).length;")
s=s.replace("const remaining=[...l.energy];let reserved=0;", "const remaining=[...providedEnergy(s,p,l)];let reserved=0;")
s=s.replace("(op.opponent?[o]:s.players).flatMap", "(op.opponent?[o]:op.own?[p]:s.players).flatMap")
i=s.index("   else if(op.kind==='chooseMode')")
s=s[:i]+'''   else if(op.kind==='chooseSpot'){s.prompt={kind:'spot',player:p.id,options:[0,1,2,3],amount:op.amount,knockout:op.knockout};s.phase='choice';}
   else if(op.kind==='chooseDamageRepeated'){if(!op.count)return;s.queue.unshift({kind:'choosePokemon',player:p.id,source:l.key,sourceKind:op.sourceKind,side:'opponent',bench:op.bench,exclude:op.exclude,optional:true,next:[{kind:'repeatedDamageStep',amount:op.amount,next:{...op,count:op.count-1}}]});}
   else if(op.kind==='repeatedDamageStep'){const target=slots(o).find(t=>t.key===op.target);if(target)attackDamage(s,p.id,l,target,op.amount,{bench:o.active!==target});s.queue.unshift({...op.next,exclude:[...(op.next.exclude||[]),op.target],player:p.id,source:l.key,sourceKind:op.sourceKind});}
   else if(op.kind==='moveSelfToChosen'){const target=p.bench.find(t=>t.key===op.target);if(!target)return;let candidates=l.energy.map((type,index)=>!op.type||op.type===type?index:-1).filter(i=>i>=0);if(op.random)shuffle(s,candidates);candidates=candidates.slice(0,op.amount==='all'?candidates.length:op.amount);for(const index of candidates.sort((a,b)=>b-a))target.energy.push(...l.energy.splice(index,1));}
   else if(op.kind==='discardTopDamage'){const ref=p.deck.shift();if(ref)p.discard.push(ref);attackDamage(s,p.id,l,o.active,op.base+(ref&&matches(card(ref),op)?op.amount:0));}
   else if(op.kind==='recoilIfKO'){if(slots(o).some(t=>t.damage>=maximumHp(t,s)&&t.lastDamage?.cause==='attack'&&t.lastDamage.turn===s.turn)){l.damage+=op.amount;l.lastDamage={turn:s.turn,cause:'effect'};}}
   else if(op.kind==='changeEnergyType'){if(o.active.energy.length&&!effectsBlocked(o.active,s)){const at=Math.floor(random(s)*o.active.energy.length);o.active.energy[at]=energyTypes[Math.floor(random(s)*energyTypes.length)];}}
   else if(op.kind==='changeNextEnergy')o.zone.next=energyTypes[Math.floor(random(s)*energyTypes.length)];
   else if(op.kind==='coinHandShuffle'){for(let i=0;i<op.heads;i++)s.queue.unshift({kind:'randomHand',opponent:true,player:p.id,source:l.key,sourceKind:op.sourceKind});}
   else if(op.kind==='randomAttackLock'){if(effectsBlocked(o.active,s)||!top(o.active).attacks.length)return;const a=top(o.active).attacks[Math.floor(random(s)*top(o.active).attacks.length)];o.active.effects.push({kind:'cantUseAttack',name:a.name,expires:s.turn+1});}
   else if(op.kind==='revealTopDamage'){const viewed=p.deck.slice(0,op.count),count=viewed.filter(r=>{const c=card(r);return c.category==='Pokemon'&&(op.minRetreat===undefined||c.retreat>=op.minRetreat)&&(!op.nameContains||c.name.includes(op.nameContains));}).length;event(s,'reveal',{player:p.id,cards:viewed.map(r=>r.id)});shuffle(s,p.deck);attackDamage(s,p.id,l,o.active,count*op.amount);}
   else if(op.kind==='coinDiscardDamage'){let count=0;for(let i=0;i<op.heads;i++){const at=l.energy.indexOf(op.type);if(at<0)break;p.energyDiscard.push(...l.energy.splice(at,1));count++;}attackDamage(s,p.id,l,o.active,op.base+count*op.amount);}
''' +s[i:]
s=s.replace("else if(s.prompt.kind==='mode')", "else if(s.prompt.kind==='spot'){const q=s.prompt;need(q.options.includes(action.value),'Choose a spot');s.prompt=null;s.phase='turn';o.effects.push({kind:'delayedSpot',spot:action.value,amount:q.amount,knockout:q.knockout,expires:s.turn+1});drain(s);}\n    else if(s.prompt.kind==='mode')")
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');")
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');")
# The actual message uses 'implemented' without being.
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');")
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');")
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');")
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');")
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');")
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');")
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');")
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');")
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');")
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');")
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');")
# Validate printed attack-use restrictions before opening its action journal entry.
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');")
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');")
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');")
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');")
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');")
# Target the stable condition directly.
s=s.replace("need(!source.effects.some(e=>e.kind==='cantUseAttack'", "for(const requirement of a.automation.filter(op=>op.kind==='attackRequirement'))need(testPredicate(s,p,source,requirement.predicate),'Missing required Pokémon for this attack');need(!source.effects.some(e=>e.kind==='cantUseAttack'")
s=s.replace("p.retreated=true;", "p.retreated=true;for(const e of o.active?.effects.filter(e=>e.kind==='retreatPunish')||[])if(!effectsBlocked(p.active,s)){p.active.damage+=e.amount;p.active.lastDamage={turn:s.turn,cause:'effect'};}checkKnockouts(s);")
p.write_text(s,encoding='utf-8')
