module.exports=(a,name)=>{
 const t=a.text||'';let m;
 if(t==="After doing damage, you may discard all Future Booster Energy Capsules from this Pokémon. If you do, during your opponent's next turn, this Pokémon takes 150 less damage from attacks (after applying Weakness and Resistance).")return [{op:'sv',kind:'ownToolDiscard',self:true,name:'Future Booster Energy Capsule',all:true,reduction:150,after:true}];
 if(m=t.match(/^Before doing damage, you may discard any number of Pokémon Tools from your Pokémon\. This attack does (\d+) more damage for each card you discarded in this way\.$/))return [{op:'sv',kind:'ownToolDiscard',bonus:+m[1]}];
 if(t==='Put up to 2 in any combination of Item cards and Pokémon Tool cards from your discard pile into your hand.')return [{op:'sv',kind:'recoverItemsTools',amount:2,after:true}];
 if(t==="Put damage counters on your opponent's Active Pokémon until its remaining HP is 10. If you placed any damage counters in this way, this attack also does 120 damage to this Pokémon.")return [{op:'sv',kind:'hpTenCounters',recoil:120,after:true}];
 if(m=t.match(/^Put up to (\d+) damage counters on this Pokémon\. This attack does (\d+) damage for each damage counter you placed in this way\.$/))return [{op:'sv',kind:'selfCounterScale',amount:+m[1],per:+m[2]}];
 if(t==="Flip a coin. If heads, search your deck for a card and put it into your hand. Then, shuffle your deck. If tails, discard a card from your hand.")return [{op:'coin',heads:[{op:'search',category:'Any',amount:1,noReveal:true}],tails:[{op:'sv',kind:'selfHandDiscard',amount:1}],after:true}];
 if(t==='Heal 100 damage from 1 of your Benched Ancient Pokémon.')return [{op:'sv',kind:'healTaggedBench',tag:'Ancient',amount:100,after:true}];
 return null;
};
