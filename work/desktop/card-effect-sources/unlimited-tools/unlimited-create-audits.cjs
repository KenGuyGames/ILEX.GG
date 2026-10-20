const fs=require('fs'),path=require('path'),dir=__dirname;
let s=fs.readFileSync(path.join(dir,'mega-attack-sweep.cjs'),'utf8').replaceAll('mega-base-tests','unlimited-base-tests').replaceAll('mega-candidate','unlimited-candidate').replaceAll('mega-era-','unlimited-era-').replaceAll('mega-candidate-data.json','unlimited-card-inventory.json');
s=s.replaceAll('unlimited-candidate-data.json','unlimited-card-inventory.json');
s=s.replace("for(const r of records)map[r.d.id]='ILEX DP '+r.d.id;",'');
s=s.replace("setup('sv',blank)","setup('unlimited',blank)");
s=s.replace('getCardByName(map[id])',"getCardByName(M.resolveCardName(map[id],'unlimited'))");
s=s.replace('for(let i=0;i<6;i++)put(m,energy,owner.active);',"const energyType=R.CardManager.getInstance().getCardByName(map[energy]).provides[0],required=Math.max(1,...selectedCard.attacks.map(a=>a.cost.filter(t=>t===energyType).length));for(let i=0;i<required;i++)put(m,energy,owner.active);");
s=s.replace('index%3===Number(shard)','index%Number(process.env.ILEX_UNLIMITED_SHARDS||6)===Number(shard)');
s=s.replace(" console.log('START '+record.d.id+' '+attack.name+' '+seed+' '+positive);",' ');
s=s.replace(' const required=c.attacks.find',` if(name==='Dream Eater')o.active.specialConditions=[R.SpecialCondition.ASLEEP];
 if(/^(Call |Let's Play|Guiding Flame)/.test(name)){p.bench[4].cards=[];o.bench[4].cards=[];put(m,'basep-35',p.deck);}
 if(name==='Synchronize')put(m,'bw8-127',o.active);
 if(c.powers.some(a=>a.name==='Power Saver')&&c.name.startsWith("Team Aqua")){for(let i=0;i<3;i++){p.bench[i].cards=[];put(m,'ex4-56',p.bench[i]);}}
 const required=c.attacks.find`);
s=s.replace("failures.push(failure);console.log('FAIL '+JSON.stringify(failure));","if(/^(CANNOT_USE_ATTACK|CANNOT_USE_POWER|BLOCKED_BY_EFFECT|NO_BENCH_SLOTS_AVAILABLE|INVALID_TARGET)$/.test(failure.error))rejected.push(failure);else{failures.push(failure);console.log('FAIL '+JSON.stringify(failure));}");
s=s.replace('SV era candidate with BW-onward fixtures; Unlimited deferred','Unlimited cross-era candidate; all implemented eras, modern turn rules, Trainer reprint resolver; generic conditional exclusions recorded separately');
fs.writeFileSync(path.join(dir,'unlimited-attack-sweep.cjs'),s);
s=fs.readFileSync(path.join(dir,'mega-trainer-audit.cjs'),'utf8').replaceAll('mega-base-tests','unlimited-base-tests').replaceAll('mega-candidate','unlimited-candidate').replaceAll('mega-attack-sweep','unlimited-attack-sweep').replaceAll('mega-full-trainer','unlimited-full-trainer');
s=s.replace("records.filter(r=>r.d.supertype==='Trainer')","records.filter(r=>r.d.supertype==='Trainer').filter((r,i,a)=>a.findIndex(x=>M.resolveCardName(map[x.d.id],'unlimited')===M.resolveCardName(map[r.d.id],'unlimited'))===i)");
s=s.replace("console.log('TRAINER '+record.d.id+' '+positive);",'');
s=s.replace("const card=put(m,record.d.id,p.hand);","const card=put(m,record.d.id,p.hand),foreign=card.attachesToOpponentsPokemon; if(foreign){const o=m.store.state.players[1];o.active.cards=[];put(m,'xy1-1',o.active);}");
s=s.replace("index:p.hand.cards.indexOf(card),target}","index:p.hand.cards.indexOf(card),target:foreign?{player:R.PlayerType.TOP_PLAYER,slot:R.SlotType.ACTIVE,index:0}:target}");
s=s.replace("records.filter(r=>r.d.supertype==='Trainer').filter", "records.filter(r=>r.d.supertype==='Trainer'&&(!process.env.ILEX_UNLIMITED_TRAINERS||process.env.ILEX_UNLIMITED_TRAINERS.split(',').includes(r.d.id))).filter");
s=s.replace("'work/rules-research/unlimited-full-trainer-audit.json'","'work/rules-research/'+(process.env.ILEX_UNLIMITED_TRAINERS?'unlimited-foreign-tool-audit':'unlimited-full-trainer-audit')+'.json'");
fs.writeFileSync(path.join(dir,'unlimited-trainer-audit.cjs'),s);
console.log('Unlimited all-era attack and unique resolved-Trainer audits generated.');
