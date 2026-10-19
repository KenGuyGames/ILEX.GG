const previous=require('./swsh-trainer-patterns.cjs');
module.exports=d=>{
 const text=(d.rules||[]).filter(t=>!/^You may play (?:only 1 Supporter|only 1 Stadium|any number of Item)|^You may attach any number of Pokémon Tools|^Attach a Pokémon Tool to/.test(t)).join(' ').replace(/\s+/g,' ').trim();let m;
 if(text==='Search your deck for a card that has no Abilities and evolves from 1 of your Pokémon, and put it onto that Pokémon to evolve it. Then, shuffle your deck. You can use this card on a Pokémon you put down when you were setting up to play or on a Pokémon that was put into play this turn.')return [{op:'evolveChosen',noAbility:true,amount:1}];
 if(text==='Search your deck for a Pokémon, except any Pokémon with an Ability, that evolves from 1 of your Pokémon in play and put it onto that Pokémon to evolve it. Then, shuffle your deck. (You can use this card during your first turn or on a Pokémon that was put into play this turn.)')return [{op:'evolveChosen',noAbility:true,amount:1}];
 if(text==='Search your deck for up to 2 Basic Energy cards of different types, reveal them, and put 1 of them into your hand. Attach the other to 1 of your Pokémon. Then, shuffle your deck.')return [{op:'sv',kind:'crispin'}];
 if(text==="Turn 1 of your opponent's face-down Prize cards face up and choose a random card from your opponent's hand. Your opponent reveals that card. You may have your opponent switch those cards. (That Prize card remains face up for the rest of the game.)")return [{op:'sv',kind:'botherBot'}];
 if(text==="The Pokémon this card is attached to can use the attack on this card. (You still need the necessary Energy to use this attack.) If this card is attached to 1 of your Pokémon, discard it at the end of your turn."){
  const attacks=(d.attacks||[]).map(a=>require('./sv-attack-patterns.cjs')(a,d.name));if(attacks.length&&attacks.every(a=>a!==null))return [{op:'technicalMachine',tool:true,anyType:true,attacks}];
 }
 if(text==="If the Pokémon this card is attached to is Knocked Out by damage from an attack from your opponent's Pokémon, discard a random card from your opponent's hand.")return [{op:'tool',kind:'svCursedDuster'}];
 if(text==='Choose a Pokémon ex in your discard pile that has "Ogerpon" in its name, and switch it with 1 of your Pokémon ex in play that has "Ogerpon" in its name. Any attached cards, damage counters, Special Conditions, turns in play, and any other effects remain on the new Pokémon.')return [{op:'sv',kind:'ogerponMask'}];
 if(text==='Each player shuffles their hand and puts it on the bottom of their deck. If either player put any cards on the bottom of their deck in this way, each player flips a coin. If heads, that player draws 6 cards. If tails, they draw 3 cards.')return [{op:'sv',kind:'lucian'}];
 if(/^Professor.s Research(?: \(.*\))?$/.test(d.name)&&d.subtypes?.includes('Supporter')&&(d.rules||[]).some(r=>r==='Discard your hand and draw 7 cards.'))return [{op:'bw',kind:'juniper'}];
 if(text==='Draw 3 cards.')return [{op:'draw',amount:3}];
 if(m=text.match(/^If the Pokémon this card is attached to is damaged by an attack from your opponent's (Fire|Psychic|Metal|Darkness|Water) Pokémon, it takes (\d+) less damage \(after applying Weakness and Resistance\), and discard this card\.$/))return [{op:'tool',kind:'svBerry',energy:m[1],amount:+m[2]}];
 if(/^The Retreat Cost of each Psyduck in play \(both yours and your opponent's\) is (?:Colorless|\{C\}) less\.$/.test(text))return [{op:'stadium',kind:'svPsyduckRetreat'}];
 if(text==='Draw 2 cards. Look at your face-down Prize cards.')return [{op:'draw',amount:2},{op:'sv',kind:'lookOwnPrizes'}];
 if(text==="Your opponent reveals their hand, and you choose a card you find there and put it on the bottom of their deck. If you put a card on the bottom of your opponent's deck in this way, your opponent may draw a card.")return [{op:'sv',kind:'ortega'}];
 if(text==="Put a card from your hand on the bottom of your deck. If you do, draw cards until you have 5 cards in your hand. (If you have no other cards in your hand, you can't use this card.)")return [{op:'sv',kind:'requireHand',amount:1},{op:'dpBottomHand',amount:1},{op:'sv',kind:'drawTo',amount:5}];
 if(text==='Look at the top 8 cards of your deck. You may reveal any number of Pokémon you find there and put them into your hand. Shuffle the other cards back into your deck.')return [{op:'dpTopPick',amount:8,max:8,pokemon:true,optional:true,reveal:true}];
 if(text==="Shuffle your hand into your deck. Then, draw 4 cards. If you go second and it's your first turn, draw 8 cards instead.")return [{op:'sv',kind:'parasolLady'}];
 if(text==='Look at the top 4 cards of your deck and put 2 of them into your hand. Shuffle the other cards and put them on the bottom of your deck.')return [{op:'sv',kind:'topChoose',amount:4,pick:2,remainder:'randomBottom'}];
 if(text==='Look at the top 5 cards of your deck and discard any number of them. Put the other cards back in any order.')return [{op:'sv',kind:'topChoose',amount:5,pick:5,optional:true,discard:true,remainder:'orderedTop'}];
 if(text==='Look at the top 3 cards of your deck and put them back in any order, or shuffle them and put them on the bottom of your deck.')return [{op:'sv',kind:'topChoose',amount:3,pick:0,remainder:'topOrBottom'}];
 if(text==='Flip a coin. If heads, draw 4 cards. If tails, draw 2 cards.')return [{op:'coin',heads:[{op:'draw',amount:4}],tails:[{op:'draw',amount:2}]}];
 if(text==="Switch in 1 of your opponent's Benched Pokémon to the Active Spot.")return [{op:'sv',kind:'requireBench',opponent:true},{op:'gust'}];
 if(text==='Draw 2 cards. If you have a Stadium in play, draw 2 more cards.')return [{op:'draw',amount:2},{op:'sv',kind:'conditional',condition:'ownStadium',ops:[{op:'draw',amount:2}]}];
 if(text==="Draw 2 cards. If your opponent's Active Pokémon is a Pokémon ex, draw 2 more cards.")return [{op:'draw',amount:2},{op:'sv',kind:'conditional',condition:'defenderEx',ops:[{op:'draw',amount:2}]}];
 if(text==='Draw 2 cards. Put a Basic Energy card from your discard pile into your hand.')return [{op:'draw',amount:2},{op:'recover',category:'BasicEnergy',amount:1}];
 if(text==='Put up to 2 Nemona cards from your discard pile into your hand.')return [{op:'recover',category:'Supporter',names:['Nemona'],amount:2,optional:true}];
 if(text==="Flip a coin. If heads, switch in 1 of your opponent's Benched Pokémon to the Active Spot. If tails, switch your Active Pokémon with 1 of your Benched Pokémon.")return [{op:'sv',kind:'requireAnyBench'},{op:'coin',heads:[{op:'gust'}],tails:[{op:'switchSelf'}]}];
 if(text==='Flip a coin. If heads, search your deck for up to 2 Pokémon, reveal them, and put them into your hand. If tails, search your deck for a Basic Pokémon, reveal it, and put it into your hand. Then, shuffle your deck.')return [{op:'coin',heads:[{op:'search',category:'Pokemon',amount:2,reveal:true}],tails:[{op:'search',category:'BasicPokemon',amount:1,reveal:true}]}];
 if(text==='Choose up to 2 of your Pokémon and heal 50 damage from each of them.')return [{op:'sv',kind:'healChosen',amount:50,max:2}];
 if(text==='Count the cards in your hand, shuffle those cards into your deck, then draw that many cards plus 1.')return [{op:'sv',kind:'shuffleHandPlus',amount:1}];
 if(text==='Draw 2 cards. Then, if you have 10 or more cards in your hand, draw 2 more cards.')return [{op:'draw',amount:2},{op:'sv',kind:'conditional',condition:'handMinimum',amount:10,ops:[{op:'draw',amount:2}]}];
 return previous({...d,name:d.name.replace(/^(Professor.s Research) \(.*\)$/,'$1')});
};
