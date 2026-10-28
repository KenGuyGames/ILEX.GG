import {StateUtils,CardType,Stage} from './game';
import {CheckPokemonTypeEffect,CheckProvidedEnergyEffect} from './game/store/effects/check-effects';
import {AbstractAttackEffect} from './game/store/effects/attack-effects';
import {IS_SPECIAL_ENERGY_BLOCKED,MOVE_CARDS} from './game/store/prefabs/prefabs';

// Return true when the printing's native reducer has been replaced completely.
export function megaEnergy(card:any,store:any,state:any,e:any):boolean{
 const name=card.name;if(!['Bubbly Water Energy','Nitro Fire Energy','Rocky Fighting Energy','Ignition Energy','Shadowy Darkness Energy'].includes(name))return false;
 const holder=state.players.flatMap((p:any)=>[p.active,...p.bench]).find((l:any)=>l.cards.includes(card)||l.energies.cards.includes(card)),owner=holder&&StateUtils.findOwner(state,holder);
 if(name==='Nitro Fire Energy'){
  if(e.type==='END_TURN_EFFECT'){const plan=card._xyBurningReturn;delete card._xyBurningAttack;delete card._xyBurningReturn;if(plan?.turn===state.turn){const p=state.players.find((p:any)=>p.id===plan.ownerId);if(p?.discard.cards.includes(card))MOVE_CARDS(store,state,p.discard,p.hand,{cards:[card],sourceCard:card,sourceEffect:e});}}
  return true;
 }
 const relevant=['Rocky Fighting Energy','Shadowy Darkness Energy'].includes(name)&&e instanceof CheckProvidedEnergyEffect||name==='Ignition Energy'&&(e instanceof CheckProvidedEnergyEffect||e.type==='END_TURN_EFFECT')||name==='Bubbly Water Energy'&&(e.type==='CHECK_TABLE_STATE_EFFECT'||e.type==='AFTER_ENERGY_ATTACHED_EFFECT'&&e.energyCard===card||e.target===holder&&Array.isArray(e.specialConditions))||name==='Rocky Fighting Energy'&&e instanceof AbstractAttackEffect&&e.target===holder||name==='Shadowy Darkness Energy'&&e.type==='PUT_DAMAGE_EFFECT'&&e.target===holder;
 if(!relevant||!holder||IS_SPECIAL_ENERGY_BLOCKED(store,state,owner,card,holder))return true;
 if(name==='Ignition Energy'){
  if(e instanceof CheckProvidedEnergyEffect&&e.source===holder){const count=[Stage.BASIC,Stage.RESTORED].includes(holder.getPokemonCard()?.stage)?1:3,entry=e.energyMap.find((x:any)=>x.card===card),provides=Array(count).fill(CardType.COLORLESS);if(entry)entry.provides=provides;else e.energyMap.push({card,provides});}
  if(e.type==='END_TURN_EFFECT'&&e.player===owner)MOVE_CARDS(store,state,holder.cards.includes(card)?holder:holder.energies,owner.discard,{cards:[card],sourceCard:card,sourceEffect:e});
  return true;
 }
 if(e instanceof CheckProvidedEnergyEffect&&e.source===holder&&['Rocky Fighting Energy','Shadowy Darkness Energy'].includes(name)){
  const provides=[name==='Rocky Fighting Energy'?CardType.FIGHTING:CardType.DARK],entry=e.energyMap.find((x:any)=>x.card===card);if(entry)entry.provides=provides;else e.energyMap.push({card,provides});return true;
 }
 const type=new CheckPokemonTypeEffect(holder);store.reduceEffect(state,type);
 if(name==='Bubbly Water Energy'&&type.cardTypes.includes(CardType.WATER)){
  if(e.type==='CHECK_TABLE_STATE_EFFECT'||e.type==='AFTER_ENERGY_ATTACHED_EFFECT'&&e.energyCard===card)holder.clearAllSpecialConditions();
  if(e.target===holder&&Array.isArray(e.specialConditions))e.preventDefault=true;
 }
 if(name==='Rocky Fighting Energy'&&type.cardTypes.includes(CardType.FIGHTING)&&e instanceof AbstractAttackEffect&&e.target===holder&&e.player!==owner&&!e.attackEffect?.wotcBypassDefender&&!e.attackEffect?._wotcTrainer&&!['APPLY_WEAKNESS_EFFECT','AFTER_WEAKNESS_AND_RESISTANCE_EFFECT','PUT_DAMAGE_EFFECT','DEAL_DAMAGE_EFFECT','AFTER_DAMAGE_EFFECT'].includes(e.type))e.preventDefault=true;
 if(name==='Shadowy Darkness Energy'&&type.cardTypes.includes(CardType.DARK)&&owner.bench.includes(holder)&&e.type==='PUT_DAMAGE_EFFECT'&&e.target===holder&&e.player!==owner&&!e.attackEffect?.wotcBypassDefender)e.preventDefault=true;
 return true;
}
