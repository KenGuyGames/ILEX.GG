from pathlib import Path
p=Path('work/pocket-research/compile.cjs');s=p.read_text(encoding='utf-8').replace('function effect(text,damage=0){','function effect(text,damage=0,context={}){').replace('effect(t,0)','effect(t,0,context)').replace('effect(a.text,a.damage)','effect(a.text,a.damage,a)')
marker=" // Independent printed clauses"
i=s.index(marker)
s=s[:i]+r'''
 if((m=text.match(/^If 1 of your Pokémon used (.+) during your last turn, this attack does (\d+) more damage\.$/)))return[{kind:'conditionalDamage',base:+damage||0,amount:+m[2],condition:'lastAttack',name:m[1]}];
 if((m=text.match(/^If any of your (?:\[([A-Z])\] )?Pokémon were Knocked Out by damage from an attack during your opponent's last turn, this attack does (\d+) more damage\.$/)))return[{kind:'conditionalDamage',base:+damage||0,amount:+m[2],condition:'revenge',type:m[1]}];
 if((m=text.match(/^If this Pokémon has at least (\d+) extra \[([A-Z])\] Energy attached, this attack does (\d+) more damage\.$/)))return[{kind:'conditionalDamage',base:+damage||0,amount:+m[3],condition:'extraEnergy',count:+m[1],type:m[2],cost:context.cost||[]}];
 if((m=text.match(/^If your opponent's Active Pokémon is (Poisoned|Asleep|Burned|Confused|Paralyzed), this attack does (\d+) more damage\.$/)))return[{kind:'conditionalDamage',base:+damage||0,amount:+m[2],condition:'status',status:m[1]}];
 if((m=text.match(/^If your opponent's Active Pokémon has an Ability, this attack does (\d+) more damage\.$/)))return[{kind:'conditionalDamage',base:+damage||0,amount:+m[1],condition:'ability'}];
 if((m=text.match(/^If this Pokémon's remaining HP is (\d+) or less, this attack does (\d+) more damage\.$/)))return[{kind:'conditionalDamage',base:+damage||0,amount:+m[2],condition:'remainingHp',hp:+m[1]}];
 if((m=text.match(/^If this Pokémon evolved during this turn, this attack does (\d+) more damage\.$/)))return[{kind:'conditionalDamage',base:+damage||0,amount:+m[1],condition:'evolved'}];
 if((m=text.match(/^If this Pokémon moved from your Bench to the Active Spot this turn, this attack does (\d+) more damage\.$/)))return[{kind:'conditionalDamage',base:+damage||0,amount:+m[1],condition:'promoted'}];
 if((m=text.match(/^During your next turn, this Pokémon can't use (.+)\.$/)))return[hit,{kind:'lock',nextOwn:true,effect:'cantUseAttack',name:m[1]}];
 if(text==="During your opponent's next turn, if the Defending Pokémon tries to use an attack, your opponent flips a coin. If tails, that attack doesn't happen.")return[hit,{kind:'lock',opponent:true,effect:'coinAttack'}];
 if((m=text.match(/^During your opponent's next turn, (?:they can't play any (Item|Trainer) cards|Your opponent can't use any (Supporter) cards) from their hand\.$/)))return[hit,{kind:'playerLock',effect:m[1]||m[2]}];
 if(text==="Your opponent can't use any Supporter cards from their hand during their next turn.")return[hit,{kind:'playerLock',effect:'Supporter'}];
 if(text==="During your opponent's next turn, they can't take any Energy from their Energy Zone to attach to their Active Pokémon.")return[hit,{kind:'playerLock',effect:'activeEnergy'}];
 if((m=text.match(/^Flip a coin\. If tails, this Pokémon also does (\d+) damage to itself\.$/)))return[hit,{kind:'condition',then:[],else:[{kind:'recoil',amount:+m[1]}]}];
 if(text==="Flip a coin. If tails, during your next turn, this Pokémon can't attack.")return[hit,{kind:'condition',then:[],else:[{kind:'lock',nextOwn:true,effect:'cantAttack'}]}];
 if((m=text.match(/^Put 1 random (Basic Pokémon|Weedle) from your deck onto your Bench\.$/)))return[hit,{kind:'benchRandom',...(m[1]==='Weedle'?{name:'Weedle'}:{stage:0})}];
 if(text==='Put a random card from your deck that evolves from this Pokémon onto this Pokémon to evolve it.')return[hit,{kind:'evolveRandom'}];
 if(text==="Before doing damage, discard all Pokémon Tools from your opponent's Active Pokémon.")return[{kind:'discardTool',opponent:true},hit];
 if((m=text.match(/^Put (?:1 |a )random (?:\[([A-Z])\] )?(Pokémon|Supporter card) from your deck into your hand\.$/)))return[hit,{kind:'searchRandom',...(m[2]==='Pokémon'?{category:'Pokemon',type:m[1]&&({G:'Grass',R:'Fire',W:'Water',L:'Lightning',P:'Psychic',F:'Fighting',D:'Darkness',M:'Metal'})[m[1]]}:{subtype:'Supporter'})}];
 if((m=text.match(/^Take a \[([A-Z])\] Energy from your Energy Zone and attach it to 1 of your Benched \[([A-Z])\] Pokémon\.$/)))return[hit,{kind:'choosePokemon',bench:true,type:m[2],optional:true,next:[{kind:'zoneEnergy',amount:1,type:m[1]}]}];
 if(text==="Switch out your opponent's Active Pokémon to the Bench. (Your opponent chooses the new Active Pokémon.)")return[hit,{kind:'choosePokemon',side:'opponent',controller:'opponent',bench:true,optional:true,next:[{kind:'switch'}]}];
 if((m=text.match(/^This attack does (\d+) damage to each of your opponent's Pokémon\.$/)))return[{kind:'damage',amount:+m[1]},{kind:'benchDamage',amount:+m[1]}];
 if((m=text.match(/^This attack also does (\d+) damage to each of your Benched Pokémon\.$/)))return[hit,{kind:'benchDamage',amount:+m[1],self:true}];
 if((m=text.match(/^This attack also does (\d+) damage to each of your opponent's Benched Pokémon that has damage on it\.$/)))return[hit,{kind:'benchDamage',amount:+m[1],wounded:true}];
 if((m=text.match(/^This attack does (\d+) damage to 1 of your opponent's Pokémon that have damage on them\.$/)))return[{kind:'choosePokemon',side:'opponent',wounded:true,optional:true,next:[{kind:'damageTo',amount:+m[1]}]}];
 if(text==="This attack's damage isn't affected by Weakness.")return[{...hit,noWeakness:true}];
 if(text==='This attack does more damage equal to the damage this Pokémon has on it.')return[{kind:'scaledDamage',base:+damage||0,amount:10,scale:'ownDamage'}];
 if((m=text.match(/^This attack does (\d+) (more )?damage for each (point you have gotten|Benched Pokémon \(both yours and your opponent's\)|type of Energy attached to this Pokémon|Pokémon in your discard pile|Item card in your discard pile|Pokémon Tool attached to all of your Pokémon|Energy attached to all of your opponent's Pokémon|Energy in your opponent's Active Pokémon's Retreat Cost)\.$/)))return[{kind:'scaledDamage',base:m[2]?+damage||0:0,amount:+m[1],scale:({'point you have gotten':'points',"Benched Pokémon (both yours and your opponent's)":'bothBench','type of Energy attached to this Pokémon':'energyTypes','Pokémon in your discard pile':'discardPokemon','Item card in your discard pile':'discardItem','Pokémon Tool attached to all of your Pokémon':'ownTools',"Energy attached to all of your opponent's Pokémon":'opponentAllEnergy',"Energy in your opponent's Active Pokémon's Retreat Cost":'opponentRetreat'})[m[3]]}];
 if((m=text.match(/^This attack does (\d+) more damage for each \[([A-Z])\] Energy attached to (this Pokémon|all of your Pokémon)\.$/)))return[{kind:'scaledDamage',base:+damage||0,amount:+m[1],scale:m[3]==='this Pokémon'?'ownEnergy':'ownAllEnergy',type:m[2]}];
 if((m=text.match(/^This attack does (\d+) more damage for each Energy attached to this Pokémon\.$/)))return[{kind:'scaledDamage',base:+damage||0,amount:+m[1],scale:'ownEnergy'}];
 if((m=text.match(/^Heal (\d+) damage from each of your Pokémon\.$/)))return[hit,{kind:'healAll',amount:+m[1]}];
 if(text==='This Pokémon recovers from all Special Conditions.')return[hit,{kind:'cure'}];
 if((m=text.match(/^Flip a coin for each (?:\[([A-Z])\] )?Energy attached to this Pokémon\. This attack does (\d+) damage for each heads\.$/)))return[{kind:'coinDamage',energyCount:true,type:m[1],amount:+m[2],base:0}];
 if((m=text.match(/^Discard a \[([A-Z])\], \[([A-Z])\], and \[([A-Z])\] Energy from this Pokémon\.$/)))return[hit,...m.slice(1).map(type=>({kind:'discardEnergy',amount:1,type}))];
''' +s[i:]
p.write_text(s,encoding='utf-8')
