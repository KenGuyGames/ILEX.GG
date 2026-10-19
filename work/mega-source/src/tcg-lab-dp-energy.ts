import { StateUtils,CardType,CardTag,EnergyType } from './game';
import { AfterEnergyAttachedEffect } from './game/store/effects/play-card-effects';
import { CheckProvidedEnergyEffect } from './game/store/effects/check-effects';
import { HealEffect } from './game/store/effects/game-effects';
import { IS_SPECIAL_ENERGY_BLOCKED } from './game/store/prefabs/prefabs';
export function installDpEnergy(card:any,kind:string){
 card.energyType=EnergyType.SPECIAL;card.provides=[CardType.COLORLESS];
 card.reduceEffect=function(store:any,state:any,e:any){
  if(!(e instanceof AfterEnergyAttachedEffect||e instanceof CheckProvidedEnergyEffect))return state;
  const list=StateUtils.findPokemonSlot(state,this);if(!list)return state;const owner=StateUtils.findOwner(state,list);if(IS_SPECIAL_ENERGY_BLOCKED(store,state,owner,this,list))return state;
  if(kind==='dpSp'&&e instanceof CheckProvidedEnergyEffect&&e.source===list){const provides=list.getPokemonCard()?.tags.includes(CardTag.POKEMON_SP)?[CardType.ANY]:[CardType.COLORLESS],entry=e.energyMap.find((entry:any)=>entry.card===this);if(entry)entry.provides=provides;else e.energyMap.push({card:this,provides});}
  if(e instanceof AfterEnergyAttachedEffect&&e.energyCard===this&&e.fromHand){
   if(kind==='dpHeal'&&list.getPokemonCard()?.tags.includes(CardTag.POKEMON_ex))return state;
   if(kind==='dpHeal'||kind==='dpHealth')store.reduceEffect(state,new HealEffect(owner,list,10));
   if(kind==='dpHeal'||kind==='dpRecover'){list.specialConditions=[];list.poisonDamage=10;list.burnDamage=20;}
  }return state;
 };
}
