import { Stage, SuperType } from './game/store/card/card-types';
import { PokemonCard } from './game/store/card/pokemon-card';
import { StateUtils } from './game/store/state-utils';
import { GameError } from './game/game-error';
import { GameMessage } from './game/game-message';
import { CheckPokemonAttacksEffect, CheckPokemonPowersEffect, CheckSpecialConditionRemovalEffect } from './game/store/effects/check-effects';
import { PowerEffect, UsePowerEffect } from './game/store/effects/game-effects';
import { withSourceMarkerConstants } from './game/store/prefabs/copy-attack-delegation';

// Location is outside serializable card state. Forked cards are indexed anew.
const fields=new WeakMap<object,any>();
const getters=new WeakSet<object>();
export function syncDpLevels(state:any){
 for(const player of state.players)for(const list of [player.active,...player.bench]){
  const pokemons=list.getPokemons();
  for(const card of pokemons)if(card._dpLevelUp){
   fields.set(card,list);
   if(!getters.has(card)){
    Object.defineProperty(card,'stage',{enumerable:true,configurable:true,get(){
     const slot=fields.get(this),stack=slot?.getPokemons()||[],index=stack.indexOf(this);
     return index>0?stack[index-1].stage:Stage.LV_X;
    },set(){/* Printed level-up stage is immutable outside its field stack. */}});
    getters.add(card);
   }
  }
 }
}
export function playDpLevel(store:any,state:any,effect:any){
 if(effect.dpLevelPlaced)return state;
 const card=effect.pokemonCard,player=effect.player,list=effect.target,base=list.getPokemonCard();
 if(!effect.dpLevelFromEffect&&list!==player.active||!base||base._dpLevelUp||base.name!==card.evolvesFrom)throw new GameError(GameMessage.INVALID_TARGET);
 if(player.cannotPlayPokemonCards)throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
 if(!effect.dpLevelFromEffect&&!player.canEvolve&&state.turn<=2)throw new GameError(GameMessage.CANNOT_EVOLVE_ON_YOUR_FIRST_TURN);
 if(!effect.dpLevelFromEffect&&list.pokemonPlayedTurn>=state.turn)throw new GameError(GameMessage.POKEMON_CANT_EVOLVE_THIS_TURN);
 const removal=new CheckSpecialConditionRemovalEffect(player,list);(removal as any).dpLevelUp=true;store.reduceEffect(state,removal);
 list._preservedConditionsDuringEvolution=removal.preservedConditions;
 player.removePokemonEffects(list);list._preservedConditionsDuringEvolution=undefined;
 player.hand.moveCardTo(card,list);list.pokemonPlayedTurn=state.turn;list.marker.markers=[];card.marker.markers=[];
 card._dpLevelPlacedTurn=state.turn;syncDpLevels(state);effect.preventDefault=true;effect.dpLevelPlaced=true;
 return state;
}
function delegatePower(top:any,parent:any,store:any,state:any,effect:any):any{
 const context=(fn:()=>any):any=>withSourceMarkerConstants(top,parent,()=>{
  const keys=['powers','_wotcId','_wotcFinalPlans','_wotcMindGames'],saved=keys.map(key=>({key,own:Object.prototype.hasOwnProperty.call(top,key),value:top[key]}));
  for(const key of keys)top[key]=parent[key];
  const prompt=store.prompt;
  store.prompt=(current:any,prompts:any,callback:any)=>prompt.call(store,current,prompts,(result:any)=>context(()=>callback(result)));
  try{return fn();}finally{store.prompt=prompt;for(const item of saved)if(item.own)top[item.key]=item.value;else delete top[item.key];}
 });
 return context(()=>parent.reduceEffect.call(top,store,state,effect));
}
export function reduceDpLevel(card:any,store:any,state:any,effect:any,ordinary:()=>any):any{
 const list=StateUtils.findPokemonSlot(state,card),top:any=list?.getPokemonCard();
 if(card._dpLevelUp&&!list&&['CHECK_TABLE_STATE_EFFECT','CHECK_POKEMON_ATTACKS_EFFECT','CHECK_POKEMON_POWERS_EFFECT'].includes(effect.type))return state;
 if(!top?._dpLevelUp)return ordinary();
 // Only the previous level keeps its text; lower evolution stages do not react.
 if(card!==top&&card.superType===SuperType.POKEMON)return state;
 if(card!==top)return ordinary();
 const stack=list!.getPokemons(),parent:any=stack[stack.length-2];if(!parent)return ordinary();
 if(effect instanceof CheckPokemonAttacksEffect&&effect.player.active===list){
  const names=new Set([...top.attacks,...effect.attacks].map((a:any)=>a.name));
  for(const original of parent.attacks){const attack:any={...original,cost:[...original.cost],name:names.has(original.name)?original.name+' (previous level)':original.name,_wotcOriginalAttack:original};effect.attacks.push(attack);effect.attackSources.set(attack,parent);}
 }
 if(effect instanceof CheckPokemonPowersEffect&&effect.target===top){for(const power of parent.powers)if(!effect.powers.some((p:any)=>p.name===power.name))effect.powers.push(power);}
 const inherited=parent.powers.includes((effect as any).power)&&((effect as any).card===top);
 if(inherited&&(effect instanceof UsePowerEffect||effect.constructor===PowerEffect))return delegatePower(top,parent,store,state,effect);
 state=ordinary();
 if(effect instanceof CheckPokemonAttacksEffect){const seen=new Set();effect.attacks=effect.attacks.filter((a:any)=>{if(parent.attacks.includes(a)||seen.has(a.name))return false;seen.add(a.name);return true;});}
 if(effect instanceof CheckPokemonPowersEffect){const seen=new Set();effect.powers=effect.powers.filter((p:any)=>{if(seen.has(p.name))return false;seen.add(p.name);return true;});}
 if(inherited)return state;
 // Placement is a level-up, not another play/evolution of the previous card.
 if(['PLAY_POKEMON_EFFECT','EVOLVE_EFFECT'].includes(effect.type))return state;
 if(effect instanceof CheckPokemonAttacksEffect||effect instanceof CheckPokemonPowersEffect)return state;
 if(['ATTACK_EFFECT','USE_ATTACK_EFFECT','AFTER_ATTACK_EFFECT'].includes(effect.type))return state;
 return delegatePower(top,parent,store,state,effect);
}
