from pathlib import Path
p=Path('work/pocket-research/compile.cjs');s=p.read_text(encoding='utf-8');i=s.index('function effect(')
s=s[:i]+r'''function predicate(text){let m;
 if((m=text.match(/^your opponent's Active Pokémon is (?:a )?\[([A-Z])\](?: or \[([A-Z])\])? Pokémon$/)))return{test:'opponentType',types:m.slice(1).filter(Boolean)};
 if(text==="your opponent's Active Pokémon is a Basic Pokemon")return{test:'opponentStage',stage:0};
 if(text==="your opponent's Active Pokémon is affected by a Special Condition")return{test:'opponentStatus'};
 if((m=text.match(/^your opponent's Active Pokémon (?:is|has) (Poisoned|Asleep|Paralyzed|Burned|Confused)$/)))return{test:'status',status:m[1]};
 if(text==="your opponent's Active Pokémon has more remaining HP than this Pokémon")return{test:'hpCompare',more:true};
 if(text==="your opponent's Active Pokémon has less remaining HP than this Pokémon")return{test:'hpCompare',more:false};
 if(text==="you have the same number of cards in your hand as your opponent")return{test:'equalHands'};
 if((m=text.match(/^(you|your opponent) ha(?:ve|s) exactly (.+) cards in (?:your|their) hand$/)))return{test:'handCounts',opponent:m[1]!=='you',counts:m[2].split(/,? or |, /).map(Number)};
 if(text==="this Pokémon has 2 or more different types of Energy attached")return{test:'energyTypes',count:2};
 if(text==="your Pokémon in play have 3 or more different types of Energy attached")return{test:'teamEnergyTypes',count:3};
 if(text==="this Pokémon has more Energy attached than your opponent's Active Pokémon")return{test:'moreEnergy'};
 if(text==="this Pokémon and your opponent's Active Pokémon have 1 or more of the same type of Energy attached")return{test:'sharedEnergy'};
 if(text==="you haven't gotten any points")return{test:'noPoints'};
 if((m=text.match(/^(.+) is in your discard pile$/)))return{test:'discardName',name:m[1]};
 if((m=text.match(/^your opponent's Active Pokémon is (.+)$/)))return{test:'opponentName',name:m[1]};
 if(text==='you have any Stage 2 Pokémon on your Bench')return{test:'benchStage',stage:2};
 if((m=text.match(/^your opponent has any \[([A-Z])\] Pokémon in play$/)))return{test:'opponentTeamType',type:m[1]};
 if((m=text.match(/^this Pokémon evolved from (.+) during this turn$/)))return{test:'evolvedFrom',name:m[1]};
 if(text==='a Stadium is in play')return{test:'stadium'};
 if(text==='this Pokémon has damage on it')return{test:'woundedSelf'};
 if((m=text.match(/^this Pokémon's remaining HP is (\d+) or less$/)))return{test:'hpAtMost',hp:+m[1]};
 return null;
}
''' +s[i:];i=s.index(' // Independent printed clauses')
s=s[:i]+r'''
 if((m=text.match(/^If (.+), this attack does (\d+) more damage\.$/))){const condition=predicate(m[1]);if(condition)return[{kind:'conditionalDamage',base:+damage||0,amount:+m[2],predicate:condition}];}
 if((m=text.match(/^If (.+), this attack does nothing\.$/))){const condition=predicate(m[1]);if(condition)return[{kind:'when',predicate:condition,inverse:true,then:[hit]}];}
 if((m=text.match(/^If (.+), (heal \d+ damage from this Pokémon|your opponent's Active Pokémon is now Asleep)\.$/))){const condition=predicate(m[1]),ops=effect(m[2][0].toUpperCase()+m[2].slice(1)+'.',0,context);if(condition&&ops)return[hit,{kind:'when',predicate:condition,then:ops.filter(o=>o.kind!=='damage')}];}
 if((m=text.match(/^If this Pokémon evolved from (.+) during this turn, this attack does (\d+) more damage\.$/)))return[{kind:'conditionalDamage',base:+damage||0,amount:+m[2],predicate:{test:'evolvedFrom',name:m[1]}}];
 if((m=text.match(/^This attack does (\d+) more damage for each (point your opponent has gotten|Special Condition affecting your opponent's Active Pokémon|time your Pokémon have been Knocked Out during this game|Supporter card in your discard pile|\[([A-Z])\] Pokémon in your discard pile)\.$/)))return[{kind:'scaledDamage',base:+damage||0,amount:+m[1],scale:({'point your opponent has gotten':'opponentPoints',"Special Condition affecting your opponent's Active Pokémon":'opponentConditions','time your Pokémon have been Knocked Out during this game':'ownKnockouts','Supporter card in your discard pile':'discardSupporter'})[m[2]]||'typedDiscard',type:m[3]}];
 if((m=text.match(/^This attack does (\d+) damage for each Energy attached to your opponent's Active Pokémon\.$/)))return[{kind:'scaledDamage',base:0,amount:+m[1],scale:'opponentEnergy'}];
 if((m=text.match(/^Flip (\d+) coins\. If both of them are heads, this attack does (\d+) more damage\.$/)))return[{kind:'countCoins',count:+m[1],then:{kind:'coinTableDamage',base:+damage||0,amount:+m[2],allHeads:true}}];
 if((m=text.match(/^Flip (\d+) coins\. This attack does (\d+) damage for each heads\. (Your opponent's Active Pokémon|This Pokémon) is now (Confused|Burned|Poisoned)\.$/)))return[{kind:'coinDamage',count:+m[1],amount:+m[2],base:0},{kind:'status',self:m[3]==='This Pokémon',status:m[4]}];
 if((m=text.match(/^Flip (\d+) coins\. This attack does (\d+) damage for each heads\. If at least (\d+) of them (?:is|are) heads, your opponent's Active Pokémon is now (Burned|Poisoned|Paralyzed)\.$/)))return[{kind:'countCoins',count:+m[1],then:{kind:'coinThresholdDamage',amount:+m[2],base:0,status:m[4],threshold:+m[3]}}];
 if((m=text.match(/^Flip a coin for each Pokémon you have in play\. This attack does (\d+) damage for each heads\.$/)))return[{kind:'coinDamage',pokemonCount:true,base:0,amount:+m[1]}];
 if((m=text.match(/^Flip a coin for each \[([A-Z])\] Energy attached to this Pokémon\. This attack does (\d+) more damage for each heads\.$/)))return[{kind:'coinDamage',energyCount:true,type:m[1],base:+damage||0,amount:+m[2]}];
 if(text==='Flip 2 coins. If both of them are tails, this attack does nothing.')return[{kind:'countCoins',count:2,then:{kind:'coinThresholdDamage',flat:true,amount:+damage||0,base:0,threshold:1}}];
 if((m=text.match(/^Flip (\d+) coins\. For each heads, discard a random Energy from your opponent's Active Pokémon\. If (?:both|all) of them are tails, this attack does nothing\.$/)))return[{kind:'countCoins',count:+m[1],then:{kind:'coinEnergyDiscardDamage',base:+damage||0}}];
 if((m=text.match(/^Flip (\d+) coins\. This attack also does (\d+) damage for each heads to each of your opponent's Benched Pokémon\.$/)))return[hit,{kind:'countCoins',count:+m[1],then:{kind:'coinBenchDamage',amount:+m[2]}}];
 if((m=text.match(/^Flip a coin\. If heads, (heal \d+ damage from this Pokémon|discard a random card from your opponent's hand|discard your opponent's Active Pokémon|switch in 1 of your opponent's Benched Pokémon to the Active Spot)\.$/))){const ops=effect(m[1][0].toUpperCase()+m[1].slice(1)+'.',0,context);if(ops)return[hit,{kind:'condition',then:ops.filter(o=>o.kind!=='damage')}];}
 if(text==="Flip a coin. If heads, during your opponent's next turn, this Pokémon takes -100 damage from attacks.")return[hit,{kind:'condition',then:[{kind:'reduce',amount:100}]}];
 if(text==="Flip a coin. If tails, this attack does nothing. If heads, during your opponent's next turn, prevent all damage from—and effects of—attacks done to this Pokémon.")return[{kind:'condition',then:[hit,{kind:'lock',effect:'preventAttacks'}]}];
 if(text==="Flip a coin. If tails, this attack does nothing. If heads, your opponent's Active Pokémon is now Paralyzed.")return[{kind:'condition',then:[hit,{kind:'status',status:'Paralyzed'}]}];
 if((m=text.match(/^During your opponent's next turn, this Pokémon takes \+(\d+) damage from attacks\.$/)))return[hit,{kind:'lock',effect:'vulnerable',amount:+m[1]}];
 if((m=text.match(/^This attack also does (\d+) damage to each of your opponent's Benched Pokémon that has any Energy attached\.$/)))return[hit,{kind:'benchDamage',amount:+m[1],hasEnergy:true}];
 if((m=text.match(/^Heal (\d+) damage from each of your Benched( Basic)? Pokémon\.$/)))return[hit,{kind:'healAll',amount:+m[1],bench:true,stage:m[2]?0:undefined}];
 if((m=text.match(/^Heal (\d+) damage from each of your \[([A-Z])\] Pokémon\.$/)))return[hit,{kind:'healAll',amount:+m[1],type:m[2]}];
 if((m=text.match(/^Heal (\d+) damage from 1 of your Benched Pokémon\.$/)))return[hit,{kind:'choosePokemon',bench:true,wounded:true,optional:true,next:[{kind:'heal',amount:+m[1]}]}];
 if((m=text.match(/^Discard a \[([A-Z])\] Energy from your opponent's Active Pokémon\.$/)))return[hit,{kind:'randomEnergyDiscard',opponent:true,type:m[1],amount:1}];
 if((m=text.match(/^Discard a random (Pokémon Tool |Item )?card from your opponent's hand\.$/)))return[hit,{kind:'randomHand',opponent:true,discard:true,subtype:m[1]?.trim()==='Pokémon Tool'?'Tool':m[1]?.trim()}];
 if(text==="Your opponent reveals a random card from their hand and shuffles it into their deck.")return[hit,{kind:'randomHand',opponent:true}];
 if(text==="Flip a coin. If heads, your opponent reveals a random card from their hand and shuffles it into their deck.")return[hit,{kind:'condition',then:[{kind:'randomHand',opponent:true}]}];
 if(text==="Your opponent reveals their hand. Choose a Supporter card you find there and discard it.")return[hit,{kind:'revealHand',opponent:true},{kind:'chooseCard',opponent:true,subtype:'Supporter',optional:true,next:[{kind:'discardChosen'}]}];
 if(text==="Your opponent reveals their hand. Choose a card you find there and shuffle it into your opponent's deck.")return[hit,{kind:'revealHand',opponent:true},{kind:'chooseCard',opponent:true,optional:true,next:[{kind:'shuffleChosen'}]}];
 if((m=text.match(/^Put 1 random (.+) from your deck onto your Bench\.$/)))return[hit,{kind:'benchRandom',names:m[1].split(' or ')}];
 if((m=text.match(/^Put a random card that evolves from (.+) from your deck into your hand\.$/)))return[hit,{kind:'searchRandom',evolvesFrom:m[1]}];
 if(text==='Put a random Item card from your discard pile into your hand.')return[hit,{kind:'searchRandom',fromDiscard:true,subtype:'Item'}];
 if((m=text.match(/^Take (\d+) \[([A-Z])\] Energy from your Energy Zone and attach it to 1 of your Benched \[([A-Z])\] Pokémon\.$/)))return[hit,{kind:'choosePokemon',bench:true,type:m[3],optional:true,next:[{kind:'zoneEnergy',amount:+m[1],type:m[2]}]}];
 if(text==='Take a [P] Energy from your Energy Zone and attach it to Mesprit or Azelf.')return[hit,{kind:'choosePokemon',names:['Mesprit','Azelf'],optional:true,next:[{kind:'zoneEnergy',amount:1,type:'P'}]}];
''' +s[i:];p.write_text(s,encoding='utf-8')
