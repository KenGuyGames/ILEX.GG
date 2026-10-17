const dp=require('./dp-trainer-patterns.cjs');
module.exports=function(d){const known=dp(d);if(known!==null)return known;const t=(d.rules||[]).filter(t=>!/^You can play only one Supporter|^This card stays in play/.test(t)).join(' ');let m;const H=(kind,extra={})=>[{op:'hgss',kind,...extra}];
 if(m=t.match(/^Shuffle your hand into your deck\. Then, draw (\d+) cards\.$/))return [{op:'shuffleHand',amount:+m[1]}];
 if(t==='Search your deck for up to 3 Basic Pokémon, show them to your opponent, and put them into your hand. Shuffle your deck afterward.')return [{op:'search',category:'BasicPokemon',amount:3,optional:true}];
 const exact={
 'Search your discard pile for 4 basic Energy cards, show them to your opponent, and put them into your hand.':['recoverBasic',{amount:4}],
 "Shuffle your hand into your deck. Then, draw a number of cards equal to the number of cards in your opponent's hand.":['copycat'],
 'Each player shuffles his or her hand into his or her deck and draws 4 cards.':['judge'],
 'Search your discard pile for 3 Pokémon and 3 basic Energy cards. Show them to your opponent and shuffle them into your deck.':['flowerLady'],
 'Look at the top 5 cards of your deck. Choose any 2 cards you find there and put them into your hand. Discard the other cards.':['sage'],
 "You may use this card only if you have more Prize cards left than your opponent. During this turn, each of your Active Pokémon's attacks does 40 more damage to your opponent's Active Pokémon (before applying Weakness and Resistance).":['blackBelt'],
 'Each player returns 1 of his or her Benched Pokémon and all cards attached to it to his or her hand. (You return your Pokémon first.)':['seeker'],
 'You may use this card only if you have more Prize cards left than your opponent. Search your deck for any 2 cards and put them into your hand. Shuffle your deck afterward.':['twins'],
 'Reveal the top 10 cards of your deck. If you reveal both halves of a Pokémon LEGEND, put those cards onto your Bench and attach all revealed Energy cards to that Pokémon LEGEND. Shuffle the other cards back into your deck. (You can play only 1 Pokémon LEGEND in this way.)':['legendBox'],
 'Discard an Energy card from your hand. Then, draw 4 cards.':['engineer'],
 'Each Pokémon in play has no Resistance.':['stadium',{effect:'noResistance'}],
 'Flip a coin. If heads, search your discard pile for a Pokémon, show it to your opponent, and put it on top of your deck. If tails, search your discard pile for a Trainer card, show it to your opponent, and put it on top of your deck.':['goodRod'],
 'Draw 2 cards. Then, your opponent discards a card from his or her hand.':['trickery'],
 'Look at the top 8 cards of your deck. Choose as many Energy cards as you like, show them to your opponent, and put them into your hand. Shuffle the other cards back into your deck.':['topChoose',{amount:8,category:'Energy',any:true}],
 'Look at the top 4 cards of your deck and put as many of them as you like back on top of your deck in any order. Then, put the remaining cards on the bottom of your deck in any order.':['researchRecord'],
 "Each Pokémon LEGEND in play (both yours and your opponent's) gets +30 HP.":['stadium',{effect:'legendHp'}],
 'Choose 1 of your Pokémon. Flip 2 coins. For each heads, remove 3 damage counters from that Pokémon.':['moomoo'],
 'Flip a coin. If heads, discard all Trainer and Stadium cards your opponent has in play. If tails, discard all Trainer and Stadium cards you have in play.':['tidalWave'],
 "Look at your opponent's hand!":['showHand'],
 "Return any Stadium card in play to its player's hand!":['returnStadium'],
 'Shuffle your deck!':['shuffleDeck']
 };return exact[t]?H(...exact[t]):null;
};
