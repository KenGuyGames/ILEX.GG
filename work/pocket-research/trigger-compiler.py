from pathlib import Path
p=Path('work/pocket-research/compile.cjs');s=p.read_text(encoding='utf-8');a=s.index('function ability(');i=s.index(' return null;',a)
s=s[:i]+r'''
 if((m=text.match(/^Once during your turn, when you (play this Pokémon from your hand to evolve 1 of your Pokémon|put this Pokémon from your hand onto your Bench), you may (.+)$/))){const parsed=ability({effect:'Once during your turn, you may '+m[2]});if(parsed)return{...parsed,when:m[1].startsWith('play')?'evolve':'bench'};}
 if((m=text.match(/^Once during your turn, you may draw (\d+) cards\.$/)))return{program:[{kind:'draw',amount:+m[1]}]};
 if((m=text.match(/^Once during your turn, you may do (\d+) damage to your opponent's Active Pokémon\.$/)))return{program:[{kind:'abilityDamage',active:true,amount:+m[1]}]};
 if((m=text.match(/^Once during your turn, you may heal (\d+) damage from 1 of your \[([A-Z])\] Pokémon\.$/)))return{program:[{kind:'choosePokemon',wounded:true,type:m[2],next:[{kind:'heal',amount:+m[1]}]}]};
 if(text==="Once during your turn, you may put 2 random Pokémon Tool cards from your discard pile into your hand.")return{program:[{kind:'searchRandom',fromDiscard:true,subtype:'Tool',optional:true},{kind:'searchRandom',fromDiscard:true,subtype:'Tool',optional:true}]};
 if(text==="Once during your turn, you may look at the top 4 cards of your deck and put all Item cards you find there into your hand. Shuffle the other cards back into your deck.")return{program:[{kind:'topSearch',amount:4,subtype:'Item'}]};
 if(text==="Once during your turn, you may discard a random Energy from your opponent's Active Pokémon.")return{program:[{kind:'randomEnergyDiscard',opponent:true,amount:1}]};
 if(text==='Once during your turn, you may put a Supporter card from your discard pile into your hand.')return{program:[{kind:'chooseCard',zone:'discard',subtype:'Supporter',next:[{kind:'recoverChosen'}]}]};
 if(text==="Once during your turn, you may make your opponent's Active Pokémon Poisoned and Burned.")return{program:[{kind:'status',status:'Poisoned'},{kind:'status',status:'Burned'}]};
 if(text==="Once during your turn, you may move a random Energy from your opponent's Active Pokémon to this Pokémon.")return{program:[{kind:'stealEnergy'}]};
 if(text==="Once during your turn, you may have your opponent shuffle their hand into their deck. For each remaining point that your opponent needs to win, they draw a card.")return{program:[{kind:'shuffleHandDraw',opponent:true,remainingPoints:true}]};
 if(text==="Once during your turn, you may prevent all damage from—and effects of—attacks from your opponent's Pokémon done to this Pokémon until the end of your opponent's next turn.")return{program:[{kind:'lock',effect:'preventAttacks'}]};
 if(text==="Once during your turn, you may flip a coin. If heads, your opponent's Active Pokémon is now Paralyzed.")return{program:[{kind:'condition',then:[{kind:'status',status:'Paralyzed'}]}]};
 if(text==='Once during your turn, you may switch it with your Active Pokémon. If you do, move all of your Energy in play to this Pokémon.')return{program:[{kind:'switchSelf'},{kind:'gatherEnergy'}]};
 if(text==='Once during your turn, you may heal 20 damage from your Active [G] Pokémon.')return{activeType:'G',needsHealing:'active',program:[{kind:'heal',active:true,amount:20}]};
 if(text==="Once during your turn, you may have your opponent reveal their hand.")return{program:[{kind:'revealHand',opponent:true}]};
 if(text==='At the beginning of your turn, if this Pokémon is in the Active Spot, put a random [P] Pokémon from your deck into your hand.')return{passive:{startSearch:{category:'Pokemon',type:'Psychic'},active:true}};
 if(text==='At the end of your first turn, take a [L] Energy from your Energy Zone and attach it to this Pokémon.')return{passive:{firstEndEnergy:'L'}};
 if(text==="At the end of your opponent's turn, if this Pokémon is in the Active Spot, put a random card from your deck that evolves from this Pokémon onto this Pokémon to evolve it.")return{passive:{opponentEndEvolve:true,active:true}};
 if(text==='Whenever you attach an Energy from your Energy Zone to this Pokémon, put a random card from your deck that evolves from this Pokémon onto this Pokémon to evolve it.')return{passive:{zoneEvolve:true}};
 if(text==='Whenever you attach a [P] Energy from your Energy Zone to this Pokémon, heal 20 damage from this Pokémon.')return{passive:{zoneHeal:20,energyType:'P'}};
 if(text==='As long as this Pokémon is in the Active Spot, whenever you attach an Energy from your Energy Zone to it, it is now Asleep.')return{passive:{zoneSleep:true,active:true}};
''' +s[i:];p.write_text(s,encoding='utf-8')
