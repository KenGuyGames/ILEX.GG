from pathlib import Path
p=Path('work/pocket-research/compile.cjs');s=p.read_text(encoding='utf-8');a=s.index('function ability(');i=s.index(' return null;',a)
s=s[:i]+r'''
 if((m=text.match(/^Once during your turn, you may take (a|\d+) \[([A-Z])\] Energy from your Energy Zone and attach it to this Pokémon\.(?: If you use this Ability, your turn ends\.| If you do, do (\d+) damage to this Pokémon\.)?$/)))return{program:[{kind:'zoneEnergy',type:m[2],amount:m[1]==='a'?1:+m[1]},...(m[3]?[{kind:'recoil',amount:+m[3]}]:[]),...(text.endsWith('your turn ends.')?[{kind:'end'}]:[])]};
 if((m=text.match(/^Once during your turn, you may flip a coin\. If heads, your opponent's Active Pokémon is now (Asleep|Poisoned)\.$/)))return{program:[{kind:'condition',then:[{kind:'status',status:m[1]}]}]};
 if((m=text.match(/^Once during your turn, (?:if this Pokémon is in the Active Spot, )?you may make your opponent's Active Pokémon (Poisoned|Confused|Burned)\.$/)))return{onlyActive:text.includes('Active Spot'),program:[{kind:'status',status:m[1]}]};
 if(text==='Once during your turn, if this Pokémon is in the Active Spot, you may draw a card.')return{onlyActive:true,program:[{kind:'draw',amount:1}]};
 if(text==="Once during your turn, you may discard the top card of your opponent's deck.")return{program:[{kind:'mill',opponent:true,amount:1}]};
 if((m=text.match(/^Once during your turn, you may put a random (Pokémon|Pokémon Tool card) from your deck into your hand\.$/)))return{program:[{kind:'searchRandom',...(m[1]==='Pokémon'?{category:'Pokemon'}:{subtype:'Tool'})}]};
 if((m=text.match(/^Once during your turn, you may heal (\d+) damage from each of your \[([A-Z])\] Pokémon\.$/)))return{program:[{kind:'healAll',amount:+m[1],type:m[2]}]};
 if(text==='Once during your turn, if this Pokémon is on your Bench, you may switch it with your Active Pokémon.')return{onlyBench:true,program:[{kind:'switchSelf'}]};
 if((m=text.match(/^Once during your turn, (?:if this Pokémon is in the Active Spot, )?you may switch out your opponent's Active (Basic )?Pokémon to the Bench\. \(Your opponent chooses the new Active Pokémon\.\)$/)))return{onlyActive:text.includes('this Pokémon is in'),program:[{kind:'choosePokemon',side:'opponent',controller:'opponent',bench:true,next:[{kind:'switch'}],requireOpponentStage:m[1]?0:undefined}]};
 if((m=text.match(/^Once during your turn, you may switch your Active \[([A-Z])\] Pokémon with 1 of your Benched Pokémon\.$/)))return{activeType:m[1],program:[{kind:'choosePokemon',bench:true,next:[{kind:'switch'}]}]};
 if(text==="Once during your turn, if this Pokémon is in the Active Spot, you may switch in 1 of your opponent's Benched Pokémon that has damage on it to the Active Spot.")return{onlyActive:true,program:[{kind:'choosePokemon',side:'opponent',bench:true,wounded:true,next:[{kind:'switch'}]}]};
 if(text==="If this Pokémon is in the Active Spot, once during your turn, you may switch in 1 of your opponent's Benched Basic Pokémon to the Active Spot.")return{onlyActive:true,program:[{kind:'choosePokemon',side:'opponent',bench:true,stage:0,next:[{kind:'switch'}]}]};
 if(text==='Once during your turn, if this Pokémon is in the Active Spot, you may take a [G] Energy from your Energy Zone and attach it to 1 of your [G] Pokémon.')return{onlyActive:true,program:[{kind:'choosePokemon',type:'G',next:[{kind:'zoneEnergy',amount:1,type:'G'}]}]};
 if(text==='Once during your turn, you may move all [P] Energy from 1 of your Benched [P] Pokémon to your Active Pokémon.')return{program:[{kind:'choosePokemon',bench:true,type:'P',energyTypes:['P'],next:[{kind:'moveEnergyAll',type:'P',toActive:true}]}]};
 if(text==='As often as you like during your turn, you may move a [W] Energy from 1 of your Benched [W] Pokémon to your Active [W] Pokémon.')return{repeatable:true,activeType:'W',program:[{kind:'choosePokemon',bench:true,type:'W',energyTypes:['W'],next:[{kind:'chooseMoveEnergy',types:['W']}]}]};
 if(text==='Once during your turn, you may move all [D] Energy from each of your Pokémon to this Pokémon.')return{program:[{kind:'gatherEnergy',type:'D'}]};
 if(text==='Once during your turn, if this Pokémon is on your Bench, you may attach an Energy from your discard pile to your Active [N] Pokémon.')return{onlyBench:true,activeType:'N',program:[{kind:'recoverEnergy',amount:1,active:true}]};
 if(text==='Once during your turn, you may attach a [R] Energy from your discard pile to this Pokémon. If you do, do 20 damage to this Pokémon.')return{program:[{kind:'recoverEnergy',amount:1,type:'R',self:true},{kind:'recoil',amount:20}]};
 if(text==='Once during your turn, if this Pokémon is in the Active Spot, you may heal 30 damage from 1 of your Pokémon.')return{onlyActive:true,program:[{kind:'choosePokemon',wounded:true,next:[{kind:'heal',amount:30}]}]};
 if(text==='Once during your turn, if this Pokémon has a Pokémon Tool attached, you may heal 30 damage from 1 of your Pokémon.')return{needsTool:true,program:[{kind:'choosePokemon',wounded:true,next:[{kind:'heal',amount:30}]}]};
 if(text==="As long as this Pokémon is in the Active Spot, your opponent can't use any Supporter cards from their hand.")return{passive:{blockTrainer:'Supporter',active:true}};
 if(text==="As long as this Pokémon is in the Active Spot, your opponent can't play any Stadium cards from their hand.")return{passive:{blockTrainer:'Stadium',active:true}};
 if(text==="Your opponent can't play any Pokémon from their hand to evolve their Active Pokémon.")return{passive:{blockActiveEvolution:true}};
 if(text==="Basic Pokémon in play (both yours and your opponent's) have no Abilities.")return{passive:{blockBasicAbilities:true}};
 if(text==='As long as this Pokémon is in the Active Spot, it can evolve during your first turn or the turn you play it.')return{passive:{earlyEvolution:true}};
 if(text==="Prevent all damage done to this Pokémon by attacks from your opponent's Pokémon ex.")return{passive:{preventEx:true}};
 if(text==='When this Pokémon is first damaged by an attack after coming into play, prevent that damage.')return{passive:{firstShield:true}};
 if(text==="If this Pokémon is in the Active Spot and is damaged by an attack from your opponent's Pokémon, the Attacking Pokémon is now Poisoned.")return{passive:{poisonAttacker:true}};
 if((m=text.match(/^If any damage is done to this Pokémon by attacks, flip a coin\. If heads, (prevent that damage|this Pokémon takes -(\d+) damage from that attack)\.$/)))return{passive:{coinReduce:m[2]?+m[2]:99999}};
 if((m=text.match(/^This Pokémon takes -(\d+) damage from attacks from \[([A-Z])\](?: or \[([A-Z])\])? Pokémon\.$/)))return{passive:{typedReduce:+m[1],attackerTypes:m.slice(2).filter(Boolean)}};
 if(text==='If this Pokémon has full HP, it takes -40 damage from attacks from your opponent\'s Pokémon.')return{passive:{healthyReduce:40}};
 if((m=text.match(/^This Pokémon gets \+(\d+) HP for each \[([A-Z])\] Energy attached to it\.$/)))return{passive:{energyHp:+m[1],energyType:m[2]}};
 if(text==="This Pokémon can't be Asleep.")return{passive:{immuneStatuses:['Asleep']}};
 if(text==="Prevent all effects of attacks used by your opponent's Pokémon done to this Pokémon.")return{passive:{effectProtection:true}};
 if(text==='As long as this Pokémon is on your Bench, prevent all damage done to this Pokémon by attacks.')return{passive:{benchProtection:true}};
 if(text==='If this Pokémon has any Energy attached, it has no Retreat Cost.')return{passive:{energyFreeRetreat:true}};
 if(text==='During your first turn, this Pokémon has no Retreat Cost.')return{passive:{firstFreeRetreat:true}};
 if(text==='If a Stadium is in play, this Pokémon has no Retreat Cost.')return{passive:{stadiumFreeRetreat:true}};
 if(text==='Your Active Pokémon has no Retreat Cost.')return{passive:{teamFreeRetreat:true}};
 if(text==='Your Active Dondozo has no Retreat Cost.')return{passive:{teamFreeRetreat:true,names:['Dondozo']}};
 if(text==="Your opponent's Active Pokémon's Retreat Cost is 1 more.")return{passive:{opponentRetreat:1}};
 if(text==='As long as this Pokémon is on your Bench, your Active Basic Pokemon\'s Retreat Cost is 1 less.')return{passive:{benchRetreat:1,stage:0}};
 if(text==="As long as this Pokémon is on your Bench, your Active [D] Pokémon's Retreat Cost is 1 less.")return{passive:{benchRetreat:1,type:'Darkness'}};
 if(text==="Your opponent's Active Pokémon takes +10 damage from being Poisoned.")return{passive:{extraPoison:10}};
 if(text==='Each [G] Energy attached to your [G] Pokémon provides 2 [G] Energy. This effect doesn\'t stack.')return{passive:{doubleEnergy:'G',type:'Grass'}};
 if(text==='Each of your [G] Pokémon gets +20 HP.')return{passive:{teamHp:20,type:'Grass'}};
 if((m=text.match(/^Attacks used by your (?:\[([A-Z])\] Pokémon(?: and \[([A-Z])\] Pokémon)?) do \+(\d+) damage to your opponent's Active Pokémon\.$/)))return{passive:{teamAttack:+m[3],types:m.slice(1,3).filter(Boolean)}};
 if(text==='Attacks used by your Future Pokémon cost 1 less [C] Energy.')return{passive:{teamCostReduction:1,tag:'future'}};
 if(text==='Each of your Pokémon that has any Energy attached recovers from all Special Conditions and can\'t be affected by any Special Conditions.')return{passive:{teamImmune:true,energy:true}};
 if(text==='Each of your Pokémon that has any [P] Energy attached recovers from all Special Conditions and can\'t be affected by any Special Conditions.')return{passive:{teamImmune:true,energy:'P'}};
 if(text==="As long as this Pokémon is in the Active Spot, attacks used by your opponent's Active Pokémon cost 1 [C] more.")return{passive:{opponentCost:1,active:true}};
 if(text==="As long as this Pokémon is in the Active Spot, attacks used by your opponent's Active Pokémon do -20 damage.")return{passive:{opponentAttackReduction:20,active:true}};
 if(text==="Pokémon (both yours and your opponent's) can't be healed.")return{passive:{preventHealing:true}};
 if((m=text.match(/^At the end of your turn, if this Pokémon is in the Active Spot, heal (\d+) damage from it\.$/)))return{passive:{endHeal:+m[1],active:true,ownTurn:true}};
 if((m=text.match(/^During Pokémon Checkup, if this Pokémon is in the Active Spot, do (\d+) damage to (each of your opponent's Pokémon|your opponent's Active Pokémon)\.$/)))return{passive:{endDamage:+m[1],active:true,all:m[2].startsWith('each')}};
 if(text==="At the end of each turn, if your opponent's Active Pokémon is Asleep, do 20 damage to that Pokémon.")return{passive:{endDamage:20,opponentAsleep:true}};
 if(text==='During Pokémon Checkup, heal 10 damage from each of your Pokémon.')return{passive:{teamEndHeal:10}};
''' +s[i:];p.write_text(s,encoding='utf-8')
# Clear all compiler-owned Ability metadata, preserving just the source fields.
s=s.replace("if(c.ability){delete c.ability.program;delete c.ability.passive;delete c.ability.needsHealing;delete c.ability.activeType;Object.assign(c.ability,ability(c.ability)||{});}", "if(c.ability){const original={exists:c.ability.exists,name:c.ability.name,effect:c.ability.effect};c.ability={...original,...(ability(original)||{})};}")
p.write_text(s,encoding='utf-8')
