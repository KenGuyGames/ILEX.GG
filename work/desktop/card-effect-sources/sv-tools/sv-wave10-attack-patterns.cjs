module.exports=(a,name)=>{
 const t=a.text||'';let m;
 if(m=t.match(/^At the end of your opponent's next turn, put (\d+) damage counters on the Defending Pokémon\.$/))return [{op:'sv',kind:'delayedCounters',amount:+m[1]*10,after:true}];
 if(t==="At the end of your opponent's next turn, discard the Defending Pokémon and all attached cards.")return [{op:'sv',kind:'delayedDiscard',after:true}];
 if(t==="During your opponent's next turn, if they attach an Energy card from their hand to the Defending Pokémon, their turn ends.")return [{op:'sv',kind:'endTurnOnAttach',after:true}];
 if(t==="During your next turn, if the Defending Pokémon is Knocked Out, take 2 more Prize cards.")return [{op:'sv',kind:'delayedPrizeBonus',amount:2,after:true}];
 if(m=t.match(/^If any of your Pokémon were Knocked Out by damage from an attack during your opponent's last turn, this attack does (\d+) more damage\.$/))return [{op:'exConditional',condition:'dpLastOpponentAttackKo',ops:[{op:'addDamage',amount:+m[1]}]}];
 if(m=t.match(/^During your opponent's next turn, if this Pokémon is damaged by an attack \(even if this Pokémon is Knocked Out\), put damage counters on the Attacking Pokémon equal to the damage done to this Pokémon\.$/))return [{op:'xy',kind:'reflectDamage',after:true}];
 if(t==="Search your deck for a card that evolves from this Pokémon and put it onto this Pokémon to evolve it. Then, shuffle your deck.")return [{op:'evolveChosen',self:true,amount:1,after:true}];
 if(t==='For each of your Benched Pokémon, search your deck for a card that evolves from that Pokémon and put it onto that Pokémon to evolve it. Then, shuffle your deck.')return [{op:'evolveChosen',benchOnly:true,amount:999,after:true}];
 if(m=t.match(/^Flip 2 coins\. This attack does (\d+) damage for each heads\. If both of them are tails,\s+your opponent's Active Pokémon is now Confused\.$/))return [{op:'coinTable',count:2,branches:[0,1,2].map(n=>[{op:'damage',amount:n*+m[1]},...(!n?[{op:'status',conditions:['CONFUSED']}]:[])])}];
 if(t==="You may put 2 Energy attached to your opponent's Active Stage 2 Pokémon into their hand.")return [{op:'sv',kind:'conditional',condition:'defenderStage2',ops:[{op:'dpOptional',ops:[{op:'dpOpponentEnergy',amount:2,hand:true}],after:true}]}];
 if(t==="If the Retreat Cost of your opponent's Active Pokémon is ColorlessColorless or more, this attack does 110 more damage.")return [{op:'sv',kind:'conditional',condition:'defenderRetreatMinimum',amount:2,ops:[{op:'addDamage',amount:110}]}];
 return null;
};
