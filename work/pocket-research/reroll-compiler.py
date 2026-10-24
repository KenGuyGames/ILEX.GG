from pathlib import Path
p=Path('work/pocket-candidate/ui/pocket-engine.js');s=p.read_text(encoding='utf-8').replace("slice(0,held.koMoveEnergy?held.amount:undefined)","slice(0,held.koMoveEnergy?held.amount:l.energy.length)").replace("cause:'attack',player};", "cause:'attack',player,lethal:target.damage>=maximumHp(target,s)};")
s=s.replace("l.lastDamage?.cause==='attack'&&l.lastDamage.turn===s.turn", "l.lastDamage?.cause==='attack'&&l.lastDamage.turn===s.turn&&l.lastDamage.lethal")
p.write_text(s,encoding='utf-8')
p=Path('work/pocket-research/compile.cjs');s=p.read_text(encoding='utf-8');a=s.index('function ability(');i=s.index(' return null;',a)
s=s[:i]+''' if(text==="Once during your turn, after you flip any coins for an attack of 1 of your [R] Pokémon, you may ignore all results of those coin flips and begin flipping those coins again. You can't use more than 1 Victory Star Ability each turn.")return{passive:{rerollAttack:true}};
 if(text==="Once during your turn, when you flip any coins for an effect of your Trainer cards, you may ignore all results of those coin flips and begin flipping those coins again. You can't use more than 1 Luxury Coin Ability each turn.")return{passive:{rerollTrainer:true}};
''' +s[i:];a=s.index('function trainer(');i=s.index(' return null;',a)
s=s[:i]+''' if(text==='The next time you flip any number of coins for the effect of an attack, Ability, or Trainer card after using this card on this turn, the first coin flip will definitely be heads.')return[{kind:'guaranteeHead'}];
''' +s[i:];p.write_text(s,encoding='utf-8')
