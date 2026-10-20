import {PowerType} from './game';
import {MOVE_CARDS} from './game/store/prefabs/prefabs';

// D-19: replacing a Pokemon retains its slot, effects and same-Ability usage.
// Add incoming first so normal orphan-attachment cleanup cannot dismantle it.
export function replaceSvOgerpon(store:any,state:any,p:any,list:any,incoming:any,provenance:any){
 const old=list.getPokemonCard(),history=list._svRetainedAbilityTurns||{};
 old.powers.forEach((power:any,i:number)=>{
  if(power.powerType===PowerType.ABILITY&&old._wotcPowerTurn?.[i]===state.turn)history[power.name]=state.turn;
 });
 if(old._svTealDanceUsedTurn===state.turn)history['Teal Dance']=state.turn;
 list._svRetainedAbilityTurns=history;
 MOVE_CARDS(store,state,p.discard,list,{cards:[incoming],sourceCard:provenance._wotcTrainerCard,sourceEffect:provenance});
 if(!list.cards.includes(incoming))return false;
 MOVE_CARDS(store,state,list,p.discard,{cards:[old],sourceCard:provenance._wotcTrainerCard,sourceEffect:provenance});
 if(list.cards.includes(old))return false;
 incoming._wotcPowerTurn={};incoming.powers.forEach((power:any,i:number)=>{if(history[power.name]===state.turn)incoming._wotcPowerTurn[i]=state.turn;});
 p.marker.removeMarker('TEAL_DANCE_MARKER',incoming);p.marker.removeMarker('TEAL_DANCE_MARKER',old);
 if(history['Teal Dance']===state.turn)p.marker.addMarker('TEAL_DANCE_MARKER',incoming);
 for(const marker of list.marker.markers)if(marker.source===old)marker.source=incoming;
 for(const key of ['_wotcLastUsedAttack','_wotcPriorAttack','_dpEntryId','_svTealDanceUsedTurn'])incoming[key]=old[key];
 return true;
}
