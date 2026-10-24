from pathlib import Path
p=Path('work/pocket-candidate/ui/pocket-engine.js');s=p.read_text(encoding='utf-8')
s=s.replace("event(s,'knockout',{player:p.id,card:c.id,points:c.points||1});", "event(s,'knockout',{player:p.id,card:c.id,pokemonType:c.subtype,cause:l.lastDamage?.turn===s.turn?l.lastDamage.cause:'effect',points:c.points||1});")
s=s.replace("if(l.conditions.includes('Poisoned'))l.damage+=10;", "if(l.conditions.includes('Poisoned')){l.damage+=10;l.lastDamage={turn:s.turn,cause:'checkup'};}")
s=s.replace("l.damage+=20;if(coin(s,p.id))", "l.damage+=20;l.lastDamage={turn:s.turn,cause:'checkup'};if(coin(s,p.id))")
s=s.replace("{bench=false,ignore=false}={}","{bench=false,ignore=false,noWeakness=false}={}")
s=s.replace("if(!bench&&top(target).weakness===top(source).subtype)", "if(!bench&&!noWeakness&&!target.effects.some(x=>x.kind==='noWeakness')&&top(target).weakness===top(source).subtype)")
s=s.replace("target.damage+=damage;event(s,'damage'", "target.damage+=damage;if(damage)target.lastDamage={turn:s.turn,cause:'attack',player};event(s,'damage'")
s=s.replace("source.damage+=(top(target).ability?.passive?.reflect||0)+(tool(target).reflect||0);", "const reflected=(top(target).ability?.passive?.reflect||0)+(tool(target).reflect||0);source.damage+=reflected;if(reflected)source.lastDamage={turn:s.turn,cause:'effect'};")
s=s.replace("opponent.active.damage+=own.amount;", "{opponent.active.damage+=own.amount;opponent.active.lastDamage={turn:s.turn,cause:'ability'};}")
s=s.replace("target.damage+=top(opponent.active).ability.passive.opponentZoneDamage;", "{target.damage+=top(opponent.active).ability.passive.opponentZoneDamage;target.lastDamage={turn:s.turn,cause:'ability'};}")
s=s.replace("attackDamage(s,p.id,l,o.active,op.amount);", "attackDamage(s,p.id,l,o.active,op.amount,{noWeakness:op.noWeakness});")
s=s.replace("else if(op.kind==='recoil')l.damage+=op.amount;", "else if(op.kind==='recoil'){l.damage+=op.amount;l.lastDamage={turn:s.turn,cause:'effect'};}\n   else if(op.kind==='cure')l.conditions=[];\n   else if(op.kind==='playerLock')o.effects.push({kind:'lockTrainer',subtype:op.effect,expires:s.turn+1});\n   else if(op.kind==='discardTool'){const owner=op.opponent?o:p,target=op.opponent?o.active:l;if(target?.tool){owner.discard.push(target.tool);target.tool=null;}}\n   else if(op.kind==='benchRandom'){if(p.bench.length>=3)return;const choices=p.deck.filter(r=>{const c=card(r);return c.category==='Pokemon'&&c.stage===0&&(!op.name||c.name===op.name)});if(!choices.length)return;const ref=choices[Math.floor(random(s)*choices.length)];p.deck=p.deck.filter(r=>r!==ref);p.bench.push(pokemon(s,ref));shuffle(s,p.deck);}\n   else if(op.kind==='evolveRandom'){const choices=p.deck.filter(r=>card(r).evolvesFrom===top(l).name&&card(r).stage===top(l).stage+1);if(!choices.length)return;const ref=choices[Math.floor(random(s)*choices.length)];p.deck=p.deck.filter(r=>r!==ref);l.stack.push(ref);l.evolved=s.turn;l.used=[];l.conditions=[];l.effects=[];shuffle(s,p.deck);event(s,'evolve',{player:p.id,card:ref.id});}")
s=s.replace("owner.active=next;clearLeavingActive(old)","owner.active=next;next.promoted=s.turn;next.promotedTop=top(next).id;clearLeavingActive(old)")
s=s.replace("if(op.scale==='opponentEnergy')", "if(op.scale==='points')count=p.points;\n    if(op.scale==='bothBench')count=p.bench.length+o.bench.length;\n    if(op.scale==='energyTypes')count=new Set(l.energy).size;\n    if(op.scale==='discardPokemon')count=p.discard.filter(r=>card(r).category==='Pokemon').length;\n    if(op.scale==='discardItem')count=p.discard.filter(r=>card(r).subtype==='Item').length;\n    if(op.scale==='ownTools')count=slots(p).filter(t=>t.tool).length;\n    if(op.scale==='opponentAllEnergy')count=slots(o).reduce((n,t)=>n+t.energy.length,0);\n    if(op.scale==='opponentRetreat')count=retreatCost(s,o);\n    if(op.scale==='ownAllEnergy')count=slots(p).reduce((n,t)=>n+t.energy.filter(e=>!op.type||op.type===e).length,0);\n    if(op.scale==='opponentEnergy')")
a=s.index("    const yes=op.condition===");b=s.index("    attackDamage",a)
s=s[:a]+'''    let yes=false;
    switch(op.condition){
     case 'ex':yes=top(o.active).ex;break;case 'tool':yes=!!l.tool;break;case 'supporter':yes=p.supporterUsed;break;
     case 'woundedOpponent':yes=o.active.damage>0;break;case 'woundedSelf':yes=l.damage>0;break;
     case 'revenge':yes=s.eventsHistory?.some(e=>e.type==='knockout'&&e.player===p.id&&e.turn===s.turn-1&&e.cause==='attack'&&(!op.type||typeCodes[e.pokemonType]===op.type));break;
     case 'lastAttack':yes=s.eventsHistory?.some(e=>e.type==='attack'&&e.player===p.id&&e.turn===s.turn-2&&e.name===op.name);break;
     case 'extraEnergy':{const paid=pay(l.energy,op.cost);yes=paid&&l.energy.filter((t,i)=>t===op.type&&!paid.includes(i)).length>=op.count;break;}
     case 'status':yes=o.active.conditions.includes(op.status);break;case 'ability':yes=!!top(o.active).ability;break;
     case 'remainingHp':yes=maximumHp(l,s)-l.damage<=op.hp;break;case 'evolved':yes=l.evolved===s.turn;break;
     case 'promoted':yes=l.promoted===s.turn&&l.promotedTop===top(l).id;break;
    }
''' +s[b:]
s=s.replace("amount:op.amount||0,expires:","amount:op.amount||0,name:op.name,expires:")
s=s.replace("target.damage+=op.amount;event(s,'abilityDamage'", "target.damage+=op.amount;target.lastDamage={turn:s.turn,cause:'ability'};event(s,'abilityDamage'")
s=s.replace("i<op.count;i++", "i<(op.energyCount?l.energy.filter(t=>!op.type||t===op.type).length:op.count);i++")
s=s.replace("(!op.category||c.category===op.category)&&(op.stage===undefined||c.stage===op.stage)&&(!op.type||c.subtype===op.type)", "(!op.category||c.category===op.category)&&(!op.subtype||c.subtype===op.subtype)&&(op.stage===undefined||c.stage===op.stage)&&(!op.type||c.subtype===op.type)")
s=s.replace("need(l&&p.zone.current,'No generated Energy is available');", "need(l&&p.zone.current,'No generated Energy is available');need(action.slot!==0||!p.effects.some(e=>e.kind==='lockTrainer'&&e.subtype==='activeEnergy'),'You cannot attach Energy to your Active Pokémon this turn');")
s=s.replace("p.active=next;clearLeavingActive(old)", "p.active=next;next.promoted=s.turn;next.promotedTop=top(next).id;clearLeavingActive(old)")
s=s.replace("need(c?.category==='Trainer'&&c.program,'Choose an automated Pocket Trainer');", "need(c?.category==='Trainer'&&c.program,'Choose an automated Pocket Trainer');need(!p.effects.some(e=>e.kind==='lockTrainer'&&['Trainer',c.subtype].includes(e.subtype)),'That Trainer type is blocked this turn');")
s=s.replace("need(a.automation,'That attack is still being implemented');", "need(a.automation,'That attack is still being implemented');need(!source.effects.some(e=>e.kind==='cantUseAttack'&&e.name===a.name),'That attack is blocked this turn');")
s=s.replace("if(source.conditions.includes('Confused')&&!coin(s,p.id)){end(s);}", "event(s,'attack',{player:p.id,name:a.name,source:source.key});if((source.conditions.includes('Confused')||source.effects.some(e=>e.kind==='coinAttack'))&&!coin(s,p.id)){end(s);}")
s=s.replace("drain(s);event(s,'attack',{player:p.id,name:a.name});", "drain(s);")
p.write_text(s,encoding='utf-8')
