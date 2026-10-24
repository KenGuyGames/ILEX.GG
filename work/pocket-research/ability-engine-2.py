from pathlib import Path
p=Path('work/pocket-candidate/ui/pocket-engine.js');s=p.read_text(encoding='utf-8')
s=s.replace("function attacksFor(l){return tool(l).previousAttacks?", "function attacksFor(l,s){const p=s?.players.find(p=>slots(p).includes(l));return tool(l).previousAttacks||p&&auras(s,p).some(a=>a.teamPreviousAttacks)?")
s=s.replace("(!op.evolvesFrom||c.evolvesFrom===op.evolvesFrom)","(!op.ex||c.ex)&&(!op.evolvesFrom||c.evolvesFrom===op.evolvesFrom)")
s=s.replace("function passive(s,l){return l&&enabled(s,l)?top(l).ability?.passive||{}:{};}", "function passive(s,l){if(!l||!enabled(s,l))return {};const a=top(l).ability?.passive||{},p=s?.players.find(p=>slots(p).includes(l));if(a.needsTool&&!l.tool||a.requiresNamesAny&&(!p||!slots(p).some(t=>a.requiresNamesAny.includes(top(t).name)))||a.anotherName&&(!p||!slots(p).some(t=>t!==l&&top(t).name===a.anotherName))||a.otherAbility&&(!p||!slots(p).some(t=>top(t).name===a.otherAbility.name&&top(t).ability&&top(t).ability.name!==a.otherAbility.except)))return {};return a;}\n  function pokemonTypes(s,l){return passive(s,l).dualTypes||[typeCodes[top(l).subtype]];}\n  function slotMatches(s,l,op){return matches(top(l),{...op,type:undefined})&&(!op.type||pokemonTypes(s,l).includes(typeCodes[op.type]||op.type));}")
s=s.replace("return a.active&&p.active!==l?[]", "return a.active&&p.active!==l||a.bench&&p.active===l?[]")
s=s.replace("matches(top(l),a)","slotMatches(s,l,a)")
s=s.replace("const cost=[...a.cost],reductions=", "const cost=[...a.cost],own=s?passive(s,l):{},selfReduction=own.selfCostReduction;if(selfReduction){let n=selfReduction.amount;for(let i=cost.length-1;i>=0&&n;i--)if(cost[i]===selfReduction.type){cost.splice(i,1);n--;}}const reductions=")
s=s.replace("if(t.freeRetreat||a.energyFreeRetreat", "if(t.freeRetreat||a.freeRetreat||a.energyFreeRetreat")
s=s.replace("(top(l).retreat||0)-(t.retreat||0)-reduction", "(top(l).retreat||0)-(t.retreat||0)-(a.retreatReduction||0)-reduction")
s=s.replace("source.effects.filter(e=>e.kind==='namedBonus'", "((passive(s,source).hpAtMost===undefined||maximumHp(source,s)-source.damage<=passive(s,source).hpAtMost)?passive(s,source).selfAttack||0:0)+source.effects.filter(e=>e.kind==='namedBonus'")
s=s.replace("(!a.types||a.types.includes(typeCodes[top(source).subtype]))", "(!a.types||a.types.some(t=>pokemonTypes(s,source).includes(t)))&&matches(top(source),a)")
s=s.replace("top(target).weakness===top(source).subtype", "pokemonTypes(s,source).includes(typeCodes[top(target).weakness])")
s=s.replace("defensive.attackerTypes?.includes(typeCodes[top(source).subtype])", "defensive.attackerTypes?.some(t=>pokemonTypes(s,source).includes(t))")
s=s.replace("if(!ignore)damage=Math.max(0,damage-s.players[1-player].effects", "if(!ignore)damage=Math.max(0,damage-auras(s,s.players[1-player]).reduce((n,e)=>n+(e.teamReduction||0),0)-s.players[1-player].effects")
s=s.replace("typeCodes[top(t).subtype]===op.type", "pokemonTypes(s,t).includes(op.type)")
s=s.replace("(!op.noTool||!t.tool)","(!op.notSelf||t!==l)&&(!op.noTool||!t.tool)")
s=s.replace("const owner=op.opponent?o:p,target=op.opponent?o.active:l;if(op.opponent", "const owner=op.opponent?o:p,target=op.chosen?slots(owner).find(t=>t.key===op.target):op.opponent?o.active:l;if(op.opponent")
i=s.index("   else if(op.kind==='switchSelf')")
s=s[:i]+'''   else if(op.kind==='cureRandom'){const target=op.active?p.active:l;need(target.conditions.length,'No Special Condition to remove');target.conditions.splice(Math.floor(random(s)*target.conditions.length),1);}
   else if(op.kind==='randomStatus'){const options=op.statuses.filter(c=>!o.active.conditions.includes(c));if(options.length)s.queue.unshift({kind:'status',status:options[Math.floor(random(s)*options.length)],player:p.id,source:l.key,sourceKind:op.sourceKind});}
   else if(op.kind==='moveActiveDamage'){const amount=Math.min(op.amount,p.active.damage);need(amount,'No damage to move');p.active.damage-=amount;l.damage+=amount;l.lastDamage={turn:s.turn,cause:'ability'};}
   else if(op.kind==='moveDamage'){const from=slots(p).find(t=>t.key===op.target);need(from&&from!==l&&from.damage>0,'Choose another damaged Pokémon');const amount=op.all?from.damage:Math.min(op.amount,from.damage);from.damage-=amount;l.damage+=amount;l.lastDamage={turn:s.turn,cause:'ability'};}
   else if(op.kind==='removeSelf'){p.discard.push(...l.stack);if(l.tool)p.discard.push(l.tool);p.energyDiscard.push(...l.energy);if(p.active===l)p.active=null;else p.bench=p.bench.filter(t=>t!==l);}
''' +s[i:]
s=s.replace("if(a.needsTool)need(l.tool,'This Ability requires a Tool');", "if(a.needsTool)need(l.tool,'This Ability requires a Tool');if(a.activeTag)need(top(p.active).tags.includes(a.activeTag),'Your Active Pokémon has the wrong tag');if(a.requiresNamesAny)need(slots(p).some(t=>a.requiresNamesAny.includes(top(t).name)),'The required Pokémon is not in play');if(a.requiredEnergy)need(l.energy.includes(a.requiredEnergy),'Missing Energy for this Ability');if(a.requiresOpponentTool)need(o.active.tool,'No opposing Tool to discard');")
s=s.replace("const source=p.active,a=attacksFor(source)[action.index];", "const source=p.active,a=attacksFor(source,s)[action.index];need(!passive(s,source).attackNeedsBench||passive(s,source).attackNeedsBench.every(name=>p.bench.some(t=>top(t).name===name)),'Missing required Benched Pokémon');")
s=s.replace("attacksFor(p.active).length", "attacksFor(p.active,s).length").replace("...attacksFor(l).filter", "...attacksFor(l,t).filter")
a=s.index('  function checkKnockouts(s){');b=s.index('  function finish(',a)
s=s[:a]+'''  function checkKnockouts(s){
   normalizeConditions(s);const pending=[];let changed=true,rounds=0;
   while(changed){changed=false;need(++rounds<40,'Knockout resolution exceeded safety limit');
    for(const p of s.players)for(const l of slots(p))if(l.damage>=maximumHp(l,s)){
     const c=top(l),held=tool(l),ability=passive(s,l),attackKO=l.lastDamage?.cause==='attack'&&l.lastDamage.turn===s.turn;
     if(attackKO&&ability.surviveAttack&&coin(s,p.id)){l.damage=maximumHp(l,s)-10;continue;}
     const wasActive=p.active===l,hitter=attackKO&&s.players[l.lastDamage.player]?.active,awarded=ability.koCoinNoPoints&&coin(s,p.id)?0:c.points||1;
     s.players[1-p.id].points+=awarded;
     if(attackKO&&held.koReturn&&p.hand.length<10){p.hand.push(l.stack.at(-1));p.discard.push(...l.stack.slice(0,-1));}else p.discard.push(...l.stack);
     if(l.tool)p.discard.push(l.tool);if(attackKO&&held.koDrawTo)draw(s,p,Math.max(0,held.koDrawTo-p.hand.length));
     if(hitter){const owner=s.players[l.lastDamage.player];if(tool(hitter).knockoutDraw)draw(s,owner,tool(hitter).knockoutDraw);if(passive(s,hitter).koShield)hitter.effects.push({kind:'preventAttacks',expires:s.turn+1});}
     p.energyDiscard.push(...l.energy);if(wasActive)p.active=null;else p.bench=p.bench.filter(x=>x!==l);
     event(s,'knockout',{player:p.id,card:c.id,pokemonType:c.subtype,cause:l.lastDamage?.turn===s.turn?l.lastDamage.cause:'effect',points:awarded});changed=true;
     if(attackKO&&wasActive){if(hitter&&ability.koReflect){hitter.damage+=ability.koReflect;hitter.lastDamage={turn:s.turn,cause:'ability'};}if(hitter&&ability.koCoinAttacker&&coin(s,p.id)){hitter.damage=maximumHp(hitter,s);hitter.lastDamage={turn:s.turn,cause:'ability'};}if(ability.koAllDamage)for(const target of slots(s.players[1-p.id])){target.damage+=ability.koAllDamage;target.lastDamage={turn:s.turn,cause:'ability'};}}
    }
   }
   const eliminated=s.players.filter(p=>!p.active&&!p.bench.length).map(p=>p.id);if(eliminated.length){finish(s,eliminated.length===2?'tie':1-eliminated[0]);return;}
   const wins=s.players.filter(p=>p.points>=3);if(wins.length){finish(s,wins.length===2?'tie':wins[0].id);return;}
   const p=s.players.find(p=>!p.active&&p.bench.length);if(p){s.prompt={kind:'promote',player:p.id,options:p.bench.map(l=>l.key)};s.phase='choice';}
  }
''' +s[b:]
p.write_text(s,encoding='utf-8')
p=Path('work/pocket-candidate/ui/pocket-ui.js');s=p.read_text(encoding='utf-8').replace('rules.attacksFor(l).map','rules.attacksFor(l,m).map');p.write_text(s,encoding='utf-8')
