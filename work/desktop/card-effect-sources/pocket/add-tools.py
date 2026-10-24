from pathlib import Path
p=Path('work/pocket-research/compile.cjs')
s=p.read_text(encoding='utf-8')
s=s.replace("function trainer(c){",'''const toolPrograms={
 'Giant Cape':{hp:20},'Leaf Cape':{hp:30,type:'Grass'},
 'Elegant Cape':{hp:30,stage:1},'Ancient Booster Energy Capsule':{hp:40,tag:'ancient'},
 'Rocky Helmet':{reflect:20},'Poison Barb':{poisonAttacker:true},
 'Steel Apron':{reduce:10,statusImmune:true,type:'Metal'},
 'Inflatable Boat':{retreat:1,type:'Water'},'Small Balloon':{retreat:1,stage:0},
 'Big Air Balloon':{freeRetreat:true,stage:2},'Heavy Helmet':{reduce:20,minRetreat:3},
 'Leftovers':{endHeal:10,ownTurn:true,active:true},
 'Lum Berry':{cureBerry:true},'Sitrus Berry':{healBerry:30},
 'Future Booster Energy Capsule':{attackBonus:20,tag:'future'},
 'Beastite':{pointBonus:10,tag:'ultra_beasts'},
 'Protective Poncho':{benchProtection:true},'Clear Veil':{effectProtection:true},
 'Deceptive Needle':{endDamage:10,ownTurn:true,active:true,type:'Darkness'}
};
function trainer(c){if(c.subtype==='Tool'&&toolPrograms[c.name])return[{kind:'attachTool',tool:toolPrograms[c.name]}];''')
p.write_text(s,encoding='utf-8')
p=Path('work/pocket-candidate/ui/pocket-engine.js');s=p.read_text(encoding='utf-8')
s=s.replace('function maximumHp(l){return top(l).hp;}', '''function tool(l){const t=l?.tool&&card(l.tool).program?.find(x=>x.kind==='attachTool')?.tool,c=top(l);if(!t||t.type&&t.type!==c.subtype||t.stage!==undefined&&t.stage!==c.stage||t.tag&&!c.tags.includes(t.tag)||t.minRetreat!==undefined&&c.retreat<t.minRetreat)return {};return t;}
  function maximumHp(l){return top(l).hp+(tool(l).hp||0);}
  function retreatCost(s,p,l=p.active){const t=tool(l);return t.freeRetreat?0:Math.max(0,(top(l).retreat||0)-(t.retreat||0)-p.effects.reduce((n,x)=>n+(x.kind==='retreat'?x.amount:0),0));}
  function effectsBlocked(l){return l.effects.some(x=>x.kind==='preventAttacks')||tool(l).effectProtection;}
  function immune(l){return top(l).ability?.passive?.statusImmune||tool(l).statusImmune;}
  function toolEnd(s){for(const p of s.players)for(const l of slots(p)){
   const t=tool(l);if(t.ownTurn&&s.active!==p.id||t.active&&p.active!==l)continue;
   if(t.endHeal)l.damage=Math.max(0,l.damage-t.endHeal);
   if(t.endDamage&&s.players[1-p.id].active)s.players[1-p.id].active.damage+=t.endDamage;
   if(t.cureBerry&&l.conditions.length){l.conditions=[];p.discard.push(l.tool);l.tool=null;}
   if(t.healBerry&&l.damage>0&&maximumHp(l)-l.damage<=maximumHp(l)/2){l.damage=Math.max(0,l.damage-t.healBerry);p.discard.push(l.tool);l.tool=null;}
  }}''')
s=s.replace('function end(s){','function end(s){\n   toolEnd(s);')
s=s.replace("let damage=Math.max(0,amount);if(!damage)return;","let damage=Math.max(0,amount);if(!damage)return;\n   if(bench&&tool(target).benchProtection)return;\n   if(!bench)damage+=(tool(source).attackBonus||0)+(tool(source).pointBonus||0)*s.players[player].points;")
s=s.replace("-(top(target).ability?.passive?.reduce||0)","-(top(target).ability?.passive?.reduce||0)-(tool(target).reduce||0)")
s=s.replace("if(damage&&target===s.players[1-player].active&&top(target).ability?.passive?.reflect)source.damage+=top(target).ability.passive.reflect;", "if(damage&&target===s.players[1-player].active){source.damage+=(top(target).ability?.passive?.reflect||0)+(tool(target).reflect||0);if(tool(target).poisonAttacker&&!immune(source)&&!source.conditions.includes('Poisoned'))source.conditions.push('Poisoned');}")
s=s.replace("top(t).ability?.passive?.statusImmune||(!op.self&&op.sourceKind==='attack'&&t.effects.some(x=>x.kind==='preventAttacks'))","immune(t)||(!op.self&&op.sourceKind==='attack'&&effectsBlocked(t))")
s=s.replace("target.effects.some(x=>x.kind==='preventAttacks'))return;\n    for(let i=0;i<op.amount", "effectsBlocked(target))return;\n    for(let i=0;i<op.amount")
s=s.replace("target.effects.some(x=>x.kind==='preventAttacks'))return;\n    target.effects.push", "effectsBlocked(target))return;\n    target.effects.push")
s=s.replace("if(target){target.damage+=op.amount;", "if(target&&!(owner.bench.includes(target)&&tool(target).benchProtection)){target.damage+=op.amount;")
s=s.replace("else if(op.kind==='retreatBonus')", "else if(op.kind==='attachTool'){const target=slots(p).find(t=>t.key===op.target);need(target&&!target.tool,'Choose a Pokémon without a Tool');target.tool=op.ref;if(immune(target))target.conditions=[];}\n   else if(op.kind==='retreatBonus')")
s=s.replace("Math.max(0,(top(p.active).retreat||0)-(p.effects.find(x=>x.kind==='retreat')?.amount||0))","retreatCost(s,p)")
a=s.index("     const ref=p.hand.find(c=>c.key===action.card),c=ref&&card(ref);need(c?.category==='Trainer'")
b=s.index("    }else if(action.type==='attack')",a)
s=s[:a]+'''     const ref=p.hand.find(c=>c.key===action.card),c=ref&&card(ref);need(c?.category==='Trainer'&&c.program,'Choose an automated Pocket Trainer');need(['Item','Supporter','Tool'].includes(c.subtype),'This Trainer type is still being implemented');need(c.subtype!=='Supporter'||!p.supporterUsed,'You already played a Supporter this turn');
     if(c.subtype==='Tool'){
      need(slots(p).some(t=>!t.tool),'All your Pokémon already have Tools');p.hand=p.hand.filter(x=>x!==ref);
      s.queue.push({kind:'choosePokemon',player:p.id,source:p.active.key,noTool:true,next:[{kind:'attachTool',ref}]},{kind:'checkKO',player:p.id});
     }else{p.hand=p.hand.filter(x=>x!==ref);p.discard.push(ref);if(c.subtype==='Supporter')p.supporterUsed=true;s.queue.push(...c.program.map(op=>({...op,player:p.id,source:p.active.key})),{kind:'checkKO',player:p.id});}
     drain(s);event(s,'trainer',{player:p.id,card:c.id});
'''+s[b:]
s=s.replace("(!op.bench||owner.bench.includes(t))", "(!op.noTool||!t.tool)&&(!op.bench||owner.bench.includes(t))")
s=s.replace('slots,pay,typeCodes};','slots,pay,typeCodes,maximumHp,retreatCost};')
p.write_text(s,encoding='utf-8')
p=Path('work/pocket-candidate/ui/pocket-ui.js');s=p.read_text(encoding='utf-8').replace('cost=rules.top(p.active).retreat||0','cost=rules.retreatCost(m,p)');p.write_text(s,encoding='utf-8')
