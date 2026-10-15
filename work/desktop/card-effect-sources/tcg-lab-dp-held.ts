import { StateUtils,CardType,SpecialCondition } from './game';
import { EndTurnEffect } from './game/store/effects/game-phase-effects';
import { HealEffect } from './game/store/effects/game-effects';
import { CheckPokemonStatsEffect,CheckPokemonTypeEffect,CheckRetreatCostEffect,CheckEvolutionTimingEffect } from './game/store/effects/check-effects';
import { PutDamageEffect,AfterDamageEffect,ApplyWeaknessEffect } from './game/store/effects/attack-effects';
const types:any={Grass:CardType.GRASS,Fire:CardType.FIRE,Water:CardType.WATER,Lightning:CardType.LIGHTNING,Psychic:CardType.PSYCHIC,Fighting:CardType.FIGHTING,Darkness:CardType.DARK,Metal:CardType.METAL};
export function dpHeld(card:any,plans:any[],store:any,state:any,e:any){
 const list=StateUtils.findPokemonSlot(state,card);if(!list||list.getPokemonCard()!==card||card._dpLevelUp)return;
 const owner=StateUtils.findOwner(state,list);
 for(const op of plans){
  if(op.kind==='damageEndHeal'){
   if(e instanceof AfterDamageEffect&&e.target===list&&e.player!==owner&&e.damage>0&&!e.attackEffect._wotcTrainer){const type=new CheckPokemonTypeEffect(e.source);store.reduceEffect(state,type);if(type.cardTypes.includes(types[op.energy])){const id=e.attackEffect._dpAttackId??state._dpAttackSequence,entry=card._dpEntryId||0;if(card._dpHeldHeal?.turn!==state.turn||card._dpHeldHeal.entry!==entry)card._dpHeldHeal={turn:state.turn,entry,ids:[]};if(!card._dpHeldHeal.ids.includes(id))card._dpHeldHeal.ids.push(id);}}
   if(e instanceof EndTurnEffect&&card._dpHeldHeal?.turn===state.turn&&card._dpHeldHeal.entry===(card._dpEntryId||0)){const amount=op.amount*card._dpHeldHeal.ids.length;delete card._dpHeldHeal;store.reduceEffect(state,new HealEffect(owner,list,amount));}
  }
  if(op.kind==='endHeal'&&e instanceof EndTurnEffect&&e.player===owner)store.reduceEffect(state,new HealEffect(owner,list,op.amount));
  if(op.kind==='endClear'&&e instanceof EndTurnEffect)list.removeSpecialCondition((SpecialCondition as any)[op.condition]);
  if(op.kind==='earlyEvolution'&&e instanceof CheckEvolutionTimingEffect&&e.target===list)e.ignorePlayedTurn=true;
  if(op.kind==='magnet'&&e instanceof CheckRetreatCostEffect&&e.player===owner&&owner.active===list){let count=owner.bench.filter((target:any)=>target.getPokemonCard()?.name===op.name).length;while(count--){const index=e.cost.indexOf(CardType.COLORLESS);if(index>=0)e.cost.splice(index,1);}}
  if(op.kind==='weaknessBonus'&&e instanceof ApplyWeaknessEffect&&e.source===list&&e.target===StateUtils.getOpponent(state,owner).active&&e.damage>0){const stats=new CheckPokemonStatsEffect(e.target);store.reduceEffect(state,stats);if(stats.weakness.some((entry:any)=>entry.type===types[op.energy]))e.damage+=op.amount;}
  if(op.kind==='reduce'&&e instanceof PutDamageEffect&&e.target===list&&!e.attackEffect?.wotcBypassDefender){const type=new CheckPokemonTypeEffect(e.source);store.reduceEffect(state,type);if(type.cardTypes.includes(types[op.energy]))e.reduceDamage(op.amount);}
 }
}
