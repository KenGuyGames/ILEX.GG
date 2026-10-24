from pathlib import Path
p=Path('work/pocket-research/compile.cjs');s=p.read_text(encoding='utf-8');i=s.index(' // Independent printed clauses')
s=s[:i]+r'''
 if(text==="Discard a card from your hand. If you can't, this attack does nothing.")return[{kind:'chooseCard',optional:true,next:[{kind:'discardChosen'},hit]}];
 if((m=text.match(/^Discard (?:a|(\d+)) random Energy from among the Energy attached to all Pokémon \(both yours and your opponent's\)\.$/)))return[hit,{kind:'randomGlobalEnergy',amount:+m[1]||1}];
 if(text==='Discard a random Energy from both Active Pokémon.')return[hit,{kind:'randomEnergyDiscard',amount:1},{kind:'randomEnergyDiscard',amount:1,opponent:true}];
 if((m=text.match(/^Take (\d+) \[([A-Z])\] Energy from your Energy Zone and attach it to your \[([A-Z])\] Pokémon in any way you like\.$/)))return[hit,{kind:'distributeEnergy',types:Array(+m[1]).fill(m[2]),type:m[3]}];
 if(text==='Take a [R], [W], and [L] Energy from your Energy Zone and attach them to your Benched Basic Pokémon in any way you like.')return[hit,{kind:'distributeEnergy',types:['R','W','L'],bench:true,stage:0}];
 if((m=text.match(/^Flip (\d+) coins\. Take an amount of \[([A-Z])\] Energy from your Energy Zone equal to the number of heads and attach it to your Benched \[([A-Z])\] Pokémon in any way you like\.$/)))return[hit,{kind:'coinEnergy',count:+m[1],type:m[2],selector:{bench:true,type:m[3]}}];
 if((m=text.match(/^Flip (\d+) coins\. For each heads, produce a \[([A-Z])\] Energy from your Energy Zone and attach it to this Pokémon\.$/)))return[hit,{kind:'coinSelfEnergy',count:+m[1],type:m[2]}];
 if((m=text.match(/^Choose (\d+) of your Benched Pokémon\. For each of those Pokémon, take a \[([A-Z])\] Energy from your Energy Zone and attach it to that Pokémon\.$/)))return[hit,{kind:'distributeEnergy',types:Array(+m[1]).fill(m[2]),bench:true,unique:true}];
 if((m=text.match(/^Take a \[([A-Z])\] Energy from your Energy Zone and attach it to 1 of your Benched Basic Pokémon\.$/)))return[hit,{kind:'choosePokemon',bench:true,stage:0,optional:true,next:[{kind:'zoneEnergy',amount:1,type:m[1]}]}];
 if((m=text.match(/^During your opponent's next turn, if this Pokémon is damaged by an attack, do (\d+) damage to the Attacking Pokémon\.$/)))return[hit,{kind:'lock',effect:'reflect',amount:+m[1]}];
 if((m=text.match(/^During your opponent's next turn, this Pokémon takes -(\d+) damage from attacks and has no Weakness\.$/)))return[hit,{kind:'reduce',amount:+m[1]},{kind:'lock',effect:'noWeakness'}];
 if((m=text.match(/^During your opponent's next turn, this Pokémon takes -(\d+) damage from attacks from your opponent's Pokémon ex\.$/)))return[hit,{kind:'lock',effect:'reduceEx',amount:+m[1]}];
 if(text==="During your opponent's next turn, the Defending Pokémon can't attack.")return[hit,{kind:'lock',opponent:true,effect:'cantAttack'}];
 if(text==="Flip a coin. If heads, the Defending Pokémon can't attack during your opponent's next turn.")return[hit,{kind:'condition',then:[{kind:'lock',opponent:true,effect:'cantAttack'}]}];
 if(text==="If the Defending Pokémon is a Basic Pokémon, it can't attack during your opponent's next turn.")return[hit,{kind:'when',condition:'opponentBasic',then:[{kind:'lock',opponent:true,effect:'cantAttack'}]}];
 if((m=text.match(/^Until this Pokémon leaves the Active Spot, this Pokémon's (.+) attack does \+(\d+) damage\. This effect stacks\.$/)))return[hit,{kind:'lock',effect:'namedBonus',name:m[1],amount:+m[2],untilLeave:true}];
 if((m=text.match(/^During your next turn, this Pokémon's (.+) attack does \+(\d+) damage\.$/)))return[hit,{kind:'lock',effect:'namedBonus',name:m[1],amount:+m[2],nextOwn:true}];
 if(text==='The Defending Pokémon loses all Abilities. This effect lasts until the Defending Pokémon leaves the Active Spot.')return[hit,{kind:'lock',opponent:true,effect:'loseAbility',untilLeave:true}];
 if(text==="If the Defending Pokémon tries to use an attack, your opponent flips a coin. If tails, that attack doesn't happen. This effect lasts until the Defending Pokémon leaves the Active Spot, and it doesn't stack.")return[hit,{kind:'lock',opponent:true,effect:'coinAttack',untilLeave:true}];
 if((m=text.match(/^This attack does (\d+) (more )?damage for each of your Benched (.+)\.$/)))return[{kind:'scaledDamage',base:m[2]?+damage||0:0,amount:+m[1],scale:'namedBench',names:m[3].split(' or ')}];
 if((m=text.match(/^This attack does (\d+) (more )?damage for each Evolution Pokémon on your Bench\.$/)))return[{kind:'scaledDamage',base:m[2]?+damage||0:0,amount:+m[1],scale:'evolvedBench'}];
 if((m=text.match(/^This attack does (\d+) damage for each time your Pokémon used (.+) during this game\.$/)))return[{kind:'scaledDamage',base:0,amount:+m[1],scale:'attackHistory',name:m[2]}];
 if((m=text.match(/^This attack does (\d+) damage for each card in your hand\.$/)))return[{kind:'scaledDamage',base:0,amount:+m[1],scale:'ownHand'}];
 if(text==="This attack does damage to your opponent's Active Pokémon equal to the damage this Pokémon has on it.")return[{kind:'scaledDamage',base:0,amount:10,scale:'ownDamage'}];
 if(text==="This attack does damage to your opponent's Active Pokémon equal to this Pokémon's remaining HP.")return[{kind:'scaledDamage',base:0,amount:1,scale:'remainingHp'}];
 if(text==="This attack's damage isn't affected by Weakness or by any effects on your opponent's Active Pokémon.")return[{...hit,noWeakness:true,ignore:true}];
 if(text==='Your opponent reveals their hand.')return[hit,{kind:'revealHand',opponent:true}];
 if(text==="Shuffle your hand into your deck. Draw a card for each card in your opponent's hand.")return[hit,{kind:'shuffleHandDraw',opponentCount:true}];
 if((m=text.match(/^If (.+) is on your Bench, this attack does (\d+) more damage\.$/)))return[{kind:'conditionalDamage',base:+damage||0,amount:+m[2],condition:'namedBench',name:m[1]}];
 if((m=text.match(/^If this Pokémon has any \[([A-Z])\] Energy attached, this attack does (\d+) more damage\.$/)))return[{kind:'conditionalDamage',base:+damage||0,amount:+m[2],condition:'hasEnergy',type:m[1]}];
 if((m=text.match(/^If this Pokémon has no damage on it, this attack does (\d+) more damage\.$/)))return[{kind:'conditionalDamage',base:+damage||0,amount:+m[1],condition:'healthy'}];
 if((m=text.match(/^If any of your Benched Pokémon have damage on them, this attack does (\d+) more damage\.$/)))return[{kind:'conditionalDamage',base:+damage||0,amount:+m[1],condition:'woundedBench'}];
 if((m=text.match(/^If your opponent's Active Pokémon has a Pokémon Tool attached, this attack does (\d+) more damage\.$/)))return[{kind:'conditionalDamage',base:+damage||0,amount:+m[1],condition:'opponentTool'}];
 if((m=text.match(/^If you have (\d+) or more \[([A-Z])\] Energy in play, this attack does (\d+) more damage\.$/)))return[{kind:'conditionalDamage',base:+damage||0,amount:+m[3],condition:'teamEnergy',count:+m[1],type:m[2]}];
 if((m=text.match(/^If the amount of Energy attached to both Active Pokémon is (\d+) or more, this attack does (\d+) more damage\.$/)))return[{kind:'conditionalDamage',base:+damage||0,amount:+m[2],condition:'bothActiveEnergy',count:+m[1]}];
 if((m=text.match(/^This attack also does (\d+) damage to 1 of your (Benched )?Pokémon\.$/)))return[hit,{kind:'choosePokemon',bench:!!m[2],optional:true,next:[{kind:'damageTo',amount:+m[1]}]}];
 if((m=text.match(/^This attack also does (\d+) damage to 1 of your opponent's Benched Pokémon that has damage on it\.$/)))return[hit,{kind:'choosePokemon',side:'opponent',bench:true,wounded:true,optional:true,next:[{kind:'damageTo',amount:+m[1]}]}];
 if((m=text.match(/^Switch this Pokémon with 1 of your Benched \[([A-Z])\] Pokémon\.$/)))return[hit,{kind:'choosePokemon',bench:true,type:m[1],optional:true,next:[{kind:'switch'}]}];
 if(text==='You may switch this Pokémon with 1 of your Benched Pokémon.')return[hit,{kind:'choosePokemon',bench:true,optional:true,may:true,next:[{kind:'switch'}]}];
 if((m=text.match(/^Flip a coin\. If heads, your opponent's Active Pokémon is now (Poisoned|Paralyzed|Burned|Asleep|Confused) and (Poisoned|Paralyzed|Burned|Asleep|Confused)\.$/)))return[hit,{kind:'condition',then:[{kind:'status',status:m[1]},{kind:'status',status:m[2]}]}];
 if((m=text.match(/^Your opponent's Active Pokémon is now (Poisoned|Paralyzed|Burned|Asleep|Confused) and (Poisoned|Paralyzed|Burned|Asleep|Confused)\.$/)))return[hit,{kind:'status',status:m[1]},{kind:'status',status:m[2]}];
 if((m=text.match(/^Flip a coin\. If heads, your opponent's Active Pokémon is now (Poisoned|Paralyzed|Burned|Asleep|Confused)\. If tails, your opponent's Active Pokémon is now (Poisoned|Paralyzed|Burned|Asleep|Confused)\.$/)))return[hit,{kind:'condition',then:[{kind:'status',status:m[1]}],else:[{kind:'status',status:m[2]}]}];
 if((m=text.match(/^Flip a coin\. If heads, this attack does (\d+) more damage\. If tails, this Pokémon also does (\d+) damage to itself\.$/)))return[{kind:'condition',then:[{kind:'damage',amount:(+damage||0)+ +m[1]}],else:[hit,{kind:'recoil',amount:+m[2]}]}];
''' +s[i:];p.write_text(s,encoding='utf-8')
