module.exports=function(d){
 const plans=[];for(const rule of d.rules||[]){
  if(/^Put this card onto your Active .+\. .+ LV\.X can use any attack, Poké-Power, or Poké-Body from its previous level\.$/.test(rule)||rule==='You may have as many of this card in your deck as you like.'||rule==='When Pokémon-ex has been Knocked Out, your opponent takes 2 Prize cards.'||rule==="You can't have more than 1 Pokémon Star in your deck.")continue;
  const text=rule.replace(/^[^:]+: /,'');let m;
  if(m=text.match(/^If (.+) is damaged by an attack from your opponent's (Grass|Fire|Water|Lightning|Psychic|Fighting|Darkness|Metal) Pokémon, remove (\d+) damage counters at the end of that turn\.$/)){if(m[1]!==d.name)return null;plans.push({kind:'damageEndHeal',energy:m[2],amount:+m[3]*10});continue;}
  if(m=text.match(/^If an Active Pokémon has Weakness to (Metal|Water) type, (.+)'s attacks do (\d+) more damage to that Pokémon \(before applying Weakness and Resistance\)\.$/)){if(m[2]!==d.name)return null;plans.push({kind:'weaknessBonus',energy:m[1],amount:+m[3]});continue;}
  if(m=text.match(/^Remove (\d+) damage counter from (.+) at the end of your turn\.$/)){if(m[2]!==d.name)return null;plans.push({kind:'endHeal',amount:+m[1]*10});continue;}
  if(m=text.match(/^If (.+) is (Paralyzed|Poisoned|Asleep|Confused|Burned), remove the Special Condition \2 from \1 at the end of each player's turn\.$/)){if(m[1]!==d.name)return null;plans.push({kind:'endClear',condition:m[2].toUpperCase()});continue;}
  if(text===`${d.name} can evolve during the turn you play it.`){plans.push({kind:'earlyEvolution'});continue;}
  if(text===`${d.name}'s Retreat Cost is Colorless less for each ${d.name} on your Bench.`){plans.push({kind:'magnet',name:d.name});continue;}
  if(m=text.match(/^Any damage done to (.+) by attacks from (Grass|Fire|Water|Lightning|Psychic|Fighting|Darkness|Metal) Pokémon is reduced by (\d+) \(after applying Weakness and Resistance\)\.$/)){if(m[1]!==d.name)return null;plans.push({kind:'reduce',energy:m[2],amount:+m[3]});continue;}
  return null;
 }return plans;
};
