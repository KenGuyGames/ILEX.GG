const dp=require('./dp-attack-patterns.cjs');
module.exports=function(a,name){
 let t=String(a.text||'').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim(),m;
 t=t.replace(/all effects of attacks?|all effects of attack/g,'all effects of an attack').replace(/next turn ,any/,'next turn, any').replace(/If you do ,/,'If you do,').replace(/ hand\.\]$/,' hand.').replace(/effects of an attack, including damage done/,'effects of an attack, including damage, done');
 const known=dp({...a,text:t},name);if(known!==null)return known;
 const H=(kind,extra={})=>[{op:'hgss',kind,after:!['millDamage','millBench','namedExplosion','ninjaFang','fieldCoins','handCost','statusDamage','typedDiscardDamage','twoCoinDragon','poltergeist','benchTails','remainingHpBonus','optionalEnergyDamage','optionalAllEnergy','handCompare','energyDamage','energySnipe','plead','namedSnipe','eeveeDamage','allExceptType','bypassDefender','lostHandCost','untilTailsSnipe','cosmicCyclone','returnSnipe','streamPump','defenderDamage','thunderFall','lostCrisis','enragedAssault','twister','poisonBonus'].includes(kind),...extra}],C=(heads,tails=[],after=true)=>[{op:'coin',heads,tails,after}];
 if(m=t.match(/^Shuffle your hand into your deck\.(?: Then, draw (\d+) cards\.)?$/))return [{op:'shuffleHand',amount:+m[1]||0}];
 const exact={
  'Search your deck for 1 Pokémon and put it in the Lost Zone. Shuffle your deck afterward.':['seeOff'],
  'Return 1 of your Pokémon and all cards attached to it to your hand.':['returnOwn'],
  'Return 1 of your Pokémon and all cards attached to it in your hand.':['returnOwn'],
  "Your opponent discards a card from his or her hand.":['opponentDiscard',{amount:1}],
  "If the Defending Pokémon tries to attack during your opponent's next turn, your opponent flips a coin. If tails, this attack does nothing.":['smokescreen'],
  'Move up to 4 damage counters from any of your Pokémon to any of your opponent\'s Pokémon in any way you like.':['moveCounters',{amount:4}],
  'Move as many damage counters on your opponent\'s Pokémon as you like to any of your opponent\'s other Pokémon in any way you like.':['moveCounters',{opponentDonor:true}],
  "Flip a coin. If heads, the Defending Pokémon is now Poisoned. Put 2 damage counters instead of 1 on that Pokémon between turns.":['poisonCoin'],
  "Flip a coin. If heads, discard the top 4 cards of your opponent's deck. If tails, discard the top 4 cards of your deck.":['volcano'],
  'Flip a coin for each Water Pokémon you have in play. This attack does 30 damage times the number of heads.':['fieldCoins',{energy:'Water',amount:30}],
  'Flip a coin for each Volbeat you have in play. This attack does 30 damage times the number of heads.':['fieldCoins',{name:'Volbeat',amount:30}],
  "The Defending Pokémon is now Burned and can't retreat during your opponent's next turn.":['ringFire'],
  'The Defending Pokémon is now Poisoned. Flip a coin. If heads, the Defending Pokémon is also Paralyzed.':['paralyzePoison'],
  "Flip a coin. If heads, this attack does 40 damage to each of your opponent's Pokémon. If tails, this attack does 40 damage to each of your Pokémon. (Don't apply Weakness and Resistance for Benched Pokémon.)":['tsunami'],
  "Choose 2 cards from your opponent's hand without looking. Look at the cards you chose, then have your opponent shuffle those cards into his or her deck.":['randomHand',{amount:2,toDeck:true,show:true}],
  "Choose 1 card from your opponent's hand without looking and put it in the Lost Zone.":['randomHand',{amount:1,lost:true}],
  "Discard 2 cards from your hand. (If you can't discard 2 cards from your hand, this attack does nothing.)":['handCost',{amount:2}],
  'Does 50 damage times the number of Special Conditions affecting the Defending Pokémon.':['statusDamage',{amount:50}],
  "Count the number of cards in your opponent's hand. Put that many damage counters on the Defending Pokémon.":['handCounters'],
  "Flip a coin. If heads, choose 1 Energy card attached to 1 of your opponent's Pokémon and put it in the Lost Zone.":['lostOpponentEnergy',{choose:true,coin:true}],
  'Search your deck for up to 2 basic Energy cards and attach them to 1 of your Pokémon. Shuffle your deck afterward.':['accelerate',{amount:2,basic:true,sameTarget:true}],
  'Does 10 damage plus 10 more damage for each Darkness Pokémon in your discard pile.':['typedDiscardDamage',{energy:'Darkness',base:10,amount:10}],
  'Flip 2 coins. If both of them are tails, this attack does nothing. If both of them are heads, the Defending Pokémon is now Paralyzed.':['twoCoinDragon'],
  "Look at your opponent's hand. This attack does 30 damage times the number of Trainer, Supporter, and Stadium cards in your opponent's hand.":['poltergeist'],
  "Your opponent can't use any Poké-Powers on his or her Pokémon during his or her next turn.":['psychicLock'],
  "Your opponent flips a coin for each of his or her Benched Pokémon. This attack does 40 damage times the number of tails. This attack's damage isn't affected by Weakness or Resistance.":['benchTails',{amount:40}],
  "Flip 3 coins. For each heads, discard a card from your opponent's hand without looking.":['handCoins',{count:3}],
  "During your opponent's next turn, the attack cost of each of the Defending Pokémon's attacks is ColorlessColorless more.":['attackTax',{amount:2}],
  'Flip 2 coins. If both of them are heads, your opponent discards all card from his or her hand.':['stripBare'],
  'Search your deck for up to 2 Pokémon, show them to your opponent, and put them into your hand. Shuffle your deck afterward.':['search',{category:'Pokemon',amount:2}],
  'Search your discard pile for up to 2 Psychic Energy cards and attach them to your Pokémon in any way you like.':['accelerate',{discard:true,energy:'Psychic',amount:2}],
  'Does 10 damage times the number of damage counters on the Defending Pokémon.':['defenderDamage'],
  'Discard a Special Energy card attached to the Defending Pokémon.':['specialDiscard'],
  'If you have more cards in your hand than your opponent, this attack does 20 damage plus 30 more damage.':['handCompare',{base:20,bonus:30}],
  'Discard a Fire Energy card from your hand. Then, draw 3 cards.':['handEnergyDraw',{energy:'Fire',amount:3}],
  'Each player draws and reveals the top card of his or her deck.':['bothDraw',{amount:1,reveal:true}],
  'Each player draws 3 cards.':['bothDraw',{amount:3}],
  'Draw a card for each Water Energy attached to all of your Pokémon.':['fieldEnergyDraw',{energy:'Water'}],
  'Draw a card for each of your Grass Pokémon in play.':['fieldDraw',{energy:'Grass'}],
  'Search your deck for a Water Pokémon, show it to your opponent, and put it into your hand. Shuffle your deck afterward.':['search',{category:'Pokemon',energy:'Water',amount:1}],
  'Search your deck for a Moomoo Milk card, show it to your opponent, and put it into your hand. Shuffle your deck afterward.':['search',{category:'Any',names:['Moomoo Milk'],amount:1}],
  "During your opponent's next turn, the Defending Pokémon's Retreat Cost is Colorless more.":['retreatTax',{amount:1}],
  "Flip a coin. If heads, look at your opponent's hand, choose 1 card, and discard it.":['lookDiscard',{amount:1,coin:true}],
  'Draw cards until you have the same number of cards in your hand as your opponent.':['drawMatch'],
  'Look at the top card of your deck. You may put it into your hand. If not, discard it and draw a card.':['selfishDraw'],
  'Look at the top 5 cards of your deck, choose 1 Pokémon you find there, show it to your opponent, and put it into your hand. Shuffle the other cards back into your deck.':['topChoose',{amount:5,category:'Pokemon'}],
  'Ask your opponent if you may draw 2 cards. If yes, draw 2 cards. If no, this attack does 20 damage to the Defending Pokémon.':['plead'],
  "Flip a coin. If heads, this attack does 30 damage to 1 of your opponent's Pokémon. If tails, this attack does 30 damage to 1 of your Pokémon. (Don't apply Weakness and Resistance for Benched Pokémon.)":['tripping'],
  "If you don't have Illumise in play, this attack does nothing. Choose 1 of your opponent's Benched Pokémon. This attack does 30 damage to that Pokémon. (Don't apply Weakness and Resistance for Benched Pokémon.)":['namedSnipe',{name:'Illumise',amount:30}],
  'Does 50 damage plus 10 more damage for each of your Pokémon in play that evolves from Eevee.':['eeveeDamage',{base:50,amount:10}],
  "This attack does 20 damage to each Pokémon in play (both yours and your opponent's) (excluding any Darkness Pokémon). (Don't apply Weakness and Resistance for Benched Pokémon.)":['allExceptType',{energy:'Darkness',amount:20}],
  "This attack's damage isn't affected by Poké-Powers, Poké-Bodies, or any other effects on the Defending Pokémon.":['bypassDefender'],
  "Choose 1 Pokémon from your hand and put it in the Lost Zone. (If you can't put a Pokémon in the Lost Zone, this attack does nothing.)":['lostHandCost',{amount:1}],
  "Choose 1 of your opponent's Benched Pokémon. Put that Pokémon and all cards attached to it back to your opponent's hand.":['returnOpponentBench'],
  'Search your discard pile for a Supporter card, show it to your opponent, and put it into your hand.':['search',{discard:true,category:'Supporter',amount:1}],
  'Search your deck for Porygon2, show it to your opponent, and put it into your hand. Shuffle your deck afterward.':['search',{category:'Pokemon',names:['Porygon2'],amount:1}],
  "Does 20 damage to 1 of your Pokémon and don't apply Weakness and Resistance to this damage.":['ownDamage',{amount:20}],
  "Search your deck for both halves of a Pokémon LEGEND, show them to your opponent, and put them into your hand. Shuffle your deck afterward.":['legendSearch'],
  "Choose 1 of your opponent's Pokémon. Flip a coin until you get tails. This attack does 50 damage times the number of heads to that Pokémon. (Don't apply Weakness and Resistance for Benched Pokémon.)":['untilTailsSnipe',{amount:50}],
  "Choose as many Water Energy attached to your Pokémon as you like. This attack does 20 damage times the number of Energy you chose. Shuffle those cards back into your deck.":['cosmicCyclone'],
  'Search your deck for a number of Lightning Energy cards up to the number of Mareep in play (both yours and your opponent\'s) and attach them to Mareep. Shuffle your deck afterward.':['staticElectricity'],
  'If Vespiquen is on your Bench and has any damage counters on it, this attack does 20 damage plus 60 more damage and the Defending Pokémon is now Poisoned.':['enragedAssault'],
  'Flip 2 coins. For each heads, search your deck for a Grass Pokémon, show it to your opponent, and put it into your hand. If you do, shuffle your deck afterward.':['greenCall'],
  'Flip 2 coins. If both of them are tails, this attack does nothing. For each heads, discard an Energy attached to the Defending Pokémon.':['twister']
 };
 if(exact[t])return H(...exact[t]);
 if(t===`Return ${name} and all cards attached to it to your hand.`)return H('returnSelf');
 if(t===`Remove all damage counters from each of your Pokémon. Shuffle ${name} and all cards attached to it back into your deck.`)return H('blessedWings');
 if(t===`Shuffle ${name} and all cards attached to it back into your deck. Then, your opponent shuffles the Defending Pokémon and all cards attached to it into his or her deck. (You choose your new Active Pokémon first.)`)return H('takeAway');
 if(t===`If, before ${name} does damage, the Defending Pokémon has no damage counters on it and is then damaged by this attack (after applying Weakness and Resistance), the Defending Pokémon is now Paralyzed.`)return H('ninjaFang');
 if(m=t.match(/^Discard the top (\d+) cards from your deck\. This attack does (\d+) damage times the number of Energy cards you discarded\.$/))return H('millDamage',{amount:+m[1],per:+m[2]});
 if(m=t.match(/^Discard the top (\d+) cards from your opponent's deck\. This attack does (\d+) damage times the number of Energy cards you discarded to each of your opponent's Benched Pokémon\. \(Don't apply Weakness and Resistance for Benched Pokémon\.\)$/))return H('millBench',{amount:+m[1],per:+m[2]});
 if(m=t.match(/^Does (\d+) damage times the number of (.+) and (.+) you have in play\. This attack does (\d+) damage to each of your \2 and \3 in play\.$/))return H('namedExplosion',{amount:+m[1],names:[m[2],m[3]],selfAmount:+m[4]});
 if(m=t.match(/^You may discard any number of (Fire|Water|Lightning|Grass|Psychic|Fighting|Darkness|Metal) Energy cards attached to .+\. If you do, this attack does (\d+) damage plus (\d+) more damage for each .+ Energy card you discarded\.$/))return H('optionalEnergyDamage',{energy:m[1],base:+m[2],per:+m[3]});
 if(m=t.match(/^Return 2 Water Energy attached to .+ to your hand\. Choose 1 of your opponent's (Benched )?Pokémon\. This attack does 100 damage to that Pokémon\. \(Don't apply Weakness (?:and|or) Resistance for Benched Pokémon\.\)$/))return H('returnSnipe',{energy:'Water',amount:2,damage:100,bench:!!m[1]});
 if(t===`You may do 50 damage plus 30 more damage. If you do, return an Energy card attached to ${name} to your hand.`)return H('streamPump');
 if(t===`Switch ${name} with 1 of your Benched Pokémon. Then, your opponent switches the Defending Pokémon with 1 of his or her Benched Pokémon.`)return H('wormhole');
 if(t===`During your next turn, ${name}'s Retreat Cost is 0.`)return H('freeRetreat');
 if(t===`Move an Energy card attached to 1 of your opponent's Pokémon to another of your opponent's Pokémon. ${name} is now Asleep.`)return H('energyAntics');
 if(t===`Before doing damage, count the remaining HP of the Defending Pokémon and ${name}. If the Defending Pokémon has fewer remaining HP than ${name}, this attack does 50 damage plus 50 more damage.`)return H('remainingHpBonus',{base:50,bonus:50});
 if(t===`Put 1 Energy card attached to ${name} in the Lost Zone.`)return H('lostSelfEnergy',{amount:1});
 if(t===`You may do 40 damage plus 60 more damage. If you do, discard all Lightning Energy attached to ${name}.`)return H('optionalAllEnergy',{energy:'Lightning',base:40,bonus:60});
 if(m=t.match(/^.+ does (\d+) damage to itself(?:,| and) (?:and )?don't apply Weakness to this damage\.$/))return H('recoil',{amount:+m[1]});
 if(t===`Does 20 damage times the number of Energy attached to ${name}.`)return H('energyDamage',{amount:20});
 if(t===`Flip a coin. If heads, the Defending Pokémon is now Paralyzed. If tails, put 1 Energy card attached to the Defending Pokémon in the Lost Zone.`)return H('plowOver');
 if(t===`During your opponent's next turn, if ${name} would be damaged by an attack, flip a coin. If heads, prevent that attack's damage done to ${name}.`)return H('coinGuard');
 if(t===`Choose 1 of your opponent's Pokémon. This attack does 10 damage to that Pokémon for each Energy attached to ${name}. (Don't apply Weakness and Resistance for Benched Pokémon.)`)return H('energySnipe',{amount:10});
 if(t===`Remove all Special Conditions and 3 damage counters from ${name}.`)return H('clearHeal',{amount:30});
 if(t===`${name} is now Asleep. During your opponent's next turn, the attack cost of each of the Defending Pokémon's attacks is Colorless more.`)return H('sleepTax');
 if(m=t.match(/^Discard the top card of (your opponent's|your) deck\. Then, remove 2 damage counters from .+\.$/))return H('millHeal',{opponent:m[1]!== 'your',amount:20});
 if(t===`If ${name} is Poisoned, this attack does 20 damage plus 60 more damage and remove the Special Condition Poisoned from ${name}.`)return H('poisonBonus');
 if(t===`Search your deck for a Pokémon, show it to your opponent, and put it into your hand. Shuffle ${name} and all cards attached to it back into your deck.`)return H('messenger');
 if(t===`Flip a coin. If heads, your opponent can't play any Trainer cards from his or her hand during your opponent's next turn, and any damage done to ${name} by attack is reduced by 30 (after applying weakness and resistance).`)return H('fakeTears');
 if(t===`Discard all Energy attached to ${name}. This attack does 80 damage to each Pokémon that has any Poké-Powers (both yours and your opponent's). This attack's damage isn't affected by Weakness or Resistance.`)return H('thunderFall');
 if(t===`Choose 2 Energy attached to ${name} and put them in the Lost Zone. If any of your opponent's Pokémon would be Knocked Out by damage from this attack, put that Pokémon and all cards attached to it in the Lost Zone instead of discarding it.`)return H('lostCrisis');
 if(t===`Discard all Metal Energy attached to ${name}. Add the top 2 cards of your opponent's deck to his or her Prize cards.`)return H('timeControl');
 if(t===`Discard a Fire Energy, Water Energy, and Lightning Energy attached to ${name}.`)return [{op:'dpPayUnits',energies:['Fire','Water','Lightning']}];
 if(t===`Discard an Energy card attached to ${name} and discard an Energy card attached to the Defending Pokémon.`)return H('flareDestroy');
 if(t===`If ${name} has no Rainbow Energy attached to it, ${name} does 20 damage to itself and ${name} is now Confused.`)return H('rainbowRecoil');
 return null;
};
