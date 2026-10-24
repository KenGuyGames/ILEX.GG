from pathlib import Path
p=Path('work/pocket-research/compile.cjs');s=p.read_text(encoding='utf-8');a=s.index('function trainer(c){');i=s.index(' return null;',a)
s=s[:i]+r'''
 if((m=text.match(/^Heal (\d+) damage from 1 of your (?:\[([A-Z])\] Pokémon|Stage (\d) Pokémon)\.$/)))return[{kind:'choosePokemon',wounded:true,type:m[2],stage:m[3]===undefined?undefined:+m[3],next:[{kind:'heal',amount:+m[1]}]}];
 if(text==='Each player shuffles the cards in their hand into their deck, then draws that many cards.')return[{kind:'shuffleHandDraw',keepCount:true,both:true}];
 if(text==="Shuffle your hand into your deck. Draw a card for each card in your opponent's hand.")return[{kind:'shuffleHandDraw',opponentCount:true}];
 if(text==="Your opponent shuffles their hand into their deck and draws a card for each of their remaining points needed to win.")return[{kind:'shuffleHandDraw',opponent:true,remainingPoints:true}];
 if(text==="Switch in 1 of your opponent's Benched Pokémon that has damage on it to the Active Spot.")return[{kind:'choosePokemon',side:'opponent',bench:true,wounded:true,next:[{kind:'switch'}]}];
 if(text==='Move an Energy from 1 of your Benched Pokémon to your Active Pokémon.')return[{kind:'choosePokemon',bench:true,hasEnergy:true,next:[{kind:'chooseMoveEnergy'}]}];
 if(text==='Move a [R] , [W] , or [L] Energy from 1 of your Benched Pokémon to your Active Pokémon.')return[{kind:'choosePokemon',bench:true,energyTypes:['R','W','L'],next:[{kind:'chooseMoveEnergy',types:['R','W','L']}]}];
 if((m=text.match(/^Heal (\d+) damage from each of your Pokémon that has any \[([A-Z])\] Energy attached\.$/)))return[{kind:'healAll',amount:+m[1],energy:m[2]}];
 if((m=text.match(/^During this turn, attacks used by your (?:\[([A-Z])\] )?Pokémon do \+(\d+) damage to your opponent's Active Pokémon( ex)?\.$/)))return[{kind:'attackBonus',amount:+m[2],type:m[1],ex:!!m[3]}];
 if((m=text.match(/^During this turn, attacks used by your (.+) do \+(\d+) damage to your opponent's Active Pokémon( ex)?\.$/)))return[{kind:'attackBonus',amount:+m[2],names:m[1].split(/,? or |,? and |, /),ex:!!m[3]}];
 if((m=text.match(/^During your opponent's next turn, all of your (?:\[([A-Z])\] )?Pokémon take -(\d+) damage from attacks from your opponent's Pokémon\.$/)))return[{kind:'teamReduction',amount:+m[2],type:m[1]}];
 if((m=text.match(/^During your opponent's next turn, all of your (.+) take -(\d+) damage from attacks from your opponent's Pokémon( ex)?\.$/)))return[{kind:'teamReduction',amount:+m[2],names:m[1].split(/,? or |,? and |, /),ex:!!m[3]}];
 if((m=text.match(/^Put (?:1 |a )random (Stage 2 Pokémon|Mega Evolution Pokémon ex|Stadium card|Item card) from your deck into your hand\.$/)))return[{kind:'searchRandom',...(m[1]==='Stage 2 Pokémon'?{stage:2,category:'Pokemon'}:m[1]==='Mega Evolution Pokémon ex'?{mega:true,category:'Pokemon'}:{subtype:m[1].split(' ')[0]})}];
 if(text==='Flip a coin. If heads, put a random Item card from your deck into your hand.')return[{kind:'condition',then:[{kind:'searchRandom',subtype:'Item',optional:true}]}];
 if(text==='Flip a coin. If heads, put a random Item card from your deck into your hand. If tails, put a random Pokémon Tool card from your deck into your hand.')return[{kind:'condition',then:[{kind:'searchRandom',subtype:'Item',optional:true}],else:[{kind:'searchRandom',subtype:'Tool',optional:true}]}];
 if((m=text.match(/^Flip a coin\. If heads, take a \[([A-Z])\] Energy from your Energy Zone and attach it to 1 of your Benched \[([A-Z])\] Pokémon\.$/)))return[{kind:'condition',then:[{kind:'choosePokemon',bench:true,type:m[2],optional:true,next:[{kind:'zoneEnergy',amount:1,type:m[1]}]}]}];
 if((m=text.match(/^Choose 1 of your \[([A-Z])\] Pokémon, and flip a coin until you get tails\. For each heads, take a \[([A-Z])\] Energy from your Energy Zone and attach it to that Pokémon\.$/)))return[{kind:'choosePokemon',type:m[1],next:[{kind:'untilTailsEnergy',type:m[2]}]}];
 if((m=text.match(/^Take a \[([A-Z])\] Energy from your Energy Zone and attach it to (.+)\.$/)))return[{kind:'choosePokemon',...(m[2]==='1 of your Stage 2 Pokémon'?{stage:2}:{names:m[2].split(' or ')}),next:[{kind:'zoneEnergy',amount:1,type:m[1]}]}];
 if(text==="Flip a coin until you get tails. For each heads, discard a random Energy from your opponent's Active Pokémon.")return[{kind:'untilTailsEnergyDiscard'}];
 if(text==='Put 1 random Basic Pokémon from your discard pile into your hand.')return[{kind:'searchRandom',fromDiscard:true,category:'Pokemon',stage:0}];
 if(text==='Put a random Basic [W] Pokémon from your discard pile into your hand.')return[{kind:'searchRandom',fromDiscard:true,category:'Pokemon',stage:0,type:'Water'}];
 if((m=text.match(/^Attach a \[([A-Z])\] Energy from your discard pile to your Active \[([A-Z])\] Pokémon\.$/)))return[{kind:'choosePokemon',active:true,type:m[2],next:[{kind:'recoverEnergy',amount:1,type:m[1]}]}];
 if((m=text.match(/^Choose 1 of your (Electivire or Luxray)\. Attach (\d+) \[([A-Z])\] Energy from your discard pile to that Pokémon\.$/)))return[{kind:'choosePokemon',names:m[1].split(' or '),next:[{kind:'recoverEnergy',amount:+m[2],type:m[3]}]}];
 if(text==='Your opponent reveals their hand.')return[{kind:'revealHand',opponent:true}];
 if(text==='Your opponent reveals all of the Supporter cards in their deck.')return[{kind:'revealDeck',opponent:true,subtype:'Supporter'}];
 if((m=text.match(/^Look at the top (\d+) cards of your deck\. Put all (Pokémon Tool cards|Stage 1 Pokémon|Pokémon you find there that have the Puppy Pile attack)(?: you find there)? into your hand\. Shuffle the other cards back into your deck\.$/)))return[{kind:'topSearch',amount:+m[1],...(m[2]==='Pokémon Tool cards'?{subtype:'Tool'}:m[2]==='Stage 1 Pokémon'?{stage:1,category:'Pokemon'}:{attack:'Puppy Pile'})}];
 if(text==='Discard all Pokémon Tool cards attached to each of your opponent\'s Pokémon.')return[{kind:'allTools',opponent:true}];
 if(text==="Return all Pokémon Tools attached to each Pokémon (both yours and your opponent's) to their owner's hand.")return[{kind:'allTools',both:true,toHand:true}];
 if(text==="Your opponent's Active Pokémon is now Confused. Flip a coin. If tails, your Active Pokémon is now also Confused.")return[{kind:'status',status:'Confused'},{kind:'condition',then:[],else:[{kind:'status',status:'Confused',self:true}]}];
 if(text==='Flip 2 coins. If both of them are heads, discard a random Energy from your opponent\'s Active Pokémon.')return[{kind:'allHeads',count:2,next:[{kind:'randomEnergyDiscard',opponent:true,amount:1}]}];
 if(text==='Heal 30 damage from 1 of your Pokémon, and it recovers from all Special Conditions.')return[{kind:'choosePokemon',next:[{kind:'heal',amount:30},{kind:'cureTarget'}]}];
 if(text==="During this turn, attacks used by your Snorlax, Heracross, and Staraptor cost 2 less [C] Energy.")return[{kind:'costReduction',names:['Snorlax','Heracross','Staraptor'],amount:2}];
''' +s[i:];p.write_text(s,encoding='utf-8')
