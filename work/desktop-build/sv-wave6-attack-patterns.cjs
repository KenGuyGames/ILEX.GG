module.exports=(a,name)=>{
 const t=a.text||'';let m;
 if(m=t.match(/^Your opponent shuffles their hand into their deck and draws (\d+) cards\.$/))return [{op:'sv',kind:'shufflePlayerHand',opponent:true,amount:+m[1],after:true}];
 if(m=t.match(/^Choose a player\. That player shuffles their hand into their deck and draws (\d+) cards\.$/))return [{op:'sv',kind:'shufflePlayerHand',either:true,amount:+m[1],after:true}];
 if(t==="Shuffle your hand into your deck. Then, draw a card for each Benched Pokémon (both yours and your opponent's).")return [{op:'sv',kind:'shufflePlayerHand',bothBenches:true,after:true}];
 if(t==='You may discard any number of cards from your hand until you have 4 or fewer. Draw cards until you have 5 cards in your hand.')return [{op:'sv',kind:'discardHandToDraw',remaining:4,drawTo:5,after:true}];
 if(m=t.match(/^You may discard your hand\. If you discarded any cards in this way, this attack does (\d+) more damage\.$/))return [{op:'sv',kind:'discardHandBonus',amount:+m[1]}];
 if(t==='If you go first, you can use this attack during your first turn. Search your deck for up to 2 Basic Pokémon and put them onto your Bench. Then, shuffle your deck.')return [{op:'searchBench',amount:2}];
 if(t==='This attack also does 40 damage to 1 of your Benched Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)')return [{op:'sv',kind:'ownBenchDamage',amount:40,after:true}];
 if(t==="If a Stadium is in play, this attack does 60 more damage. Then, discard that Stadium.")return [{op:'sv',kind:'conditional',condition:'anyStadium',ops:[{op:'addDamage',amount:60},{op:'discardStadium',after:true}]}];
 return null;
};
