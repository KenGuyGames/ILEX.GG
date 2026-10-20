module.exports=a=>{
 const t=a.text||'',S=(kind,extra={})=>[{op:'sv',kind,...extra}];
 if(t==="Discard all Energy from this Pokémon, and this attack does 210 damage to 1 of your opponent's Benched Pokémon ex. (Don't apply Weakness and Resistance for Benched Pokémon.)")return [{op:'targetDamage',benchOnly:true,modernExOnly:true,amount:210},{op:'dpReturnAllSelfEnergy',discard:true,after:true}];
 if(t==='Search your deck for a Basic Pokémon and put it onto your Bench. Then, shuffle your deck. If you put any Pokémon onto your Bench in this way, move an Energy from this Pokémon to the new Benched Pokémon.')return S('invitingKiss',{after:true});
 if(t==="During your opponent's next turn, prevent all damage done to each of your Future Pokémon by attacks from Pokémon ex. If this Pokémon is no longer your Active Pokémon, this effect ends.")return S('codeProtect',{after:true});
 if(t==="Choose 1 of your Benched Combee and shuffle that Pokémon and all attached cards into your deck. If you can't shuffle a Combee into your deck, this attack does nothing.")return S('raidCost');
 if(t==="Shuffle each player's Active Pokémon and all attached cards into their deck. (You choose a new Active Pokémon first.)")return S('returnBothActives',{after:true});
 if(t==="Choose 1 of your opponent's Benched Pokémon. Shuffle that Pokémon and all attached cards into their deck, and then shuffle this Pokémon and all attached cards into your deck. If your opponent has no Benched Pokémon, this attack does nothing.")return S('byeByeFlight',{after:true});
 if(t==='Put this Pokémon and all attached cards into your deck. If you do, search your deck for up to 3 cards and put them into your hand. Then, shuffle your deck.')return S('breezyGift',{after:true});
 if(t==='Switch this Pokémon with 1 of your Benched Pokémon. If you do, attach up to 2 basic Lightning Energy cards from your hand to this Pokémon.')return S('returnCharge',{after:true});
 if(t==='Flip 2 coins. Search your deck for a number of Grass Pokémon up to the number of heads and put them onto your Bench. Then, shuffle your deck.')return S('spreadFilaments',{after:true});
 if(t==="Reveal the top 6 cards of your deck. This attack does 60 damage to 1 of your opponent's Pokémon for each Energy card you find there. Then, discard those Energy cards and shuffle the other cards back into your deck. (Don't apply Weakness and Resistance for Benched Pokémon.)")return S('whirltide');
 if(t==="Choose 3 of your opponent's Benched Pokémon. If you do, shuffle all of your opponent's Benched Pokémon that you didn't choose, and all cards attached to those Pokémon, into their deck.")return S('expellingTornado',{after:true});
 if(t==='If all of your Benched Pokémon have at least 1 damage counter on them, this attack does 120 more damage.')return S('conditional',{condition:'allBenchDamaged',ops:[{op:'addDamage',amount:120}]});
 if(t==="Attach up to 3 Energy cards from your opponent's discard pile to their Pokémon in any way you like.")return S('mischievousPainting',{after:true});
 return null;
};
