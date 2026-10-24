from pathlib import Path
p=Path('work/pocket-research/compile.cjs');s=p.read_text(encoding='utf-8')
s=s.replace("if((m=text.match(/^Heal (\\d+) damage from 1 of your (.+)\\.$/)))return", "if((m=text.match(/^Heal (\\d+) damage from 1 of your (.+)\\.$/)))if(m[2].split(' or ').every(name=>cards.some(c=>c.name===name)))return")
s=s.replace("if((m=text.match(/^Take a \\[([A-Z])\\] Energy from your Energy Zone and attach it to (.+)\\.$/)))return", "if((m=text.match(/^Take a \\[([A-Z])\\] Energy from your Energy Zone and attach it to (.+)\\.$/)))if(m[2]==='1 of your Stage 2 Pokémon'||m[2].split(' or ').every(name=>cards.some(c=>c.name===name)))return")
s=s.replace("names:m[1].split(/,? or |,? and |, /),ex:!!m[3]", "...(m[1]==='Ultra Beasts'?{tag:'ultra_beasts'}:{names:m[1].split(/,? or |,? and |, /)}),ex:!!m[3]")
a=s.index('function trainer(');i=s.index(' return null;',a);s=s[:i]+''' if(text==='Take a [P] Energy from your Energy Zone and attach it to each of your Drifblim and Mismagius.')return[{kind:'zoneEnergyEach',names:['Drifblim','Mismagius'],type:'P',amount:1}];
''' +s[i:];p.write_text(s,encoding='utf-8')
p=Path('work/pocket-candidate/ui/pocket-engine.js');s=p.read_text(encoding='utf-8');i=s.index('  function offer(');s=s[:i]+'''  function targetCanResolve(s,p,target,ops){for(const op of ops||[]){if(op.kind==='recoverEnergy'&&!p.energyDiscard.some(t=>!op.type||t===op.type))return false;if(op.kind==='bounce'&&op.destination==='hand'&&p.hand.length+target.stack.length>10)return false;}return true;}
''' +s[i:]
s=s.replace("slots(owner).filter(t=>", "slots(owner).filter(t=>targetCanResolve(s,p,t,op.next)&&",1)
i=s.index("   else if(op.kind==='zoneEnergy')");s=s[:i]+'''   else if(op.kind==='zoneEnergyEach'){const targets=slots(p).filter(t=>op.names.includes(top(t).name));need(targets.length,'No eligible Pokémon in play');for(const target of targets)attachZone(s,p,target,op.type,op.amount);}
''' +s[i:]
s=s.replace("source:l?.key,sourceKind:op.sourceKind})));}\n   else if(op.kind==='collect')", "source:l?.key,sourceKind:op.sourceKind})));}\n   else if(op.kind==='collect')")
# Copying an unavailable Supporter effect reveals it and does nothing, without stranding the match.
a=s.index("   else if(op.kind==='copyTrainer')");b=s.index("   else if(op.kind===",a+12)
s=s[:a]+'''   else if(op.kind==='copyTrainer'){const owner=op.opponent?o:p,zone=op.from==='deck'?owner.deck:owner.hand,choices=zone.filter(r=>card(r).subtype==='Supporter'&&card(r).program&&card(r).name!==op.excludeName&&!JSON.stringify(card(r).program).includes('"copyTrainer"'));need(choices.length,'No eligible Supporter to copy');const ref=choices[Math.floor(random(s)*choices.length)];event(s,'reveal',{player:owner.id,cards:[ref.id]});if(op.from==='deck')shuffle(s,owner.deck);const program=card(ref).program.map(x=>({...x,player:p.id,source:l?.key,sourceKind:op.sourceKind}));try{const probe=copy(s);probe.queue=copy(program);probe.prompt=null;drain(probe);}catch{return;}s.queue.unshift(...program);}
''' +s[b:]
p.write_text(s,encoding='utf-8')
