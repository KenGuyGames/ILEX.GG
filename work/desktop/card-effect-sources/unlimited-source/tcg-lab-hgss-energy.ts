import {CardType,EnergyType,StateUtils} from './game';
import {ApplyWeaknessEffect,PutDamageEffect} from './game/store/effects/attack-effects';
import {CheckPokemonTypeEffect} from './game/store/effects/check-effects';
import {IS_SPECIAL_ENERGY_BLOCKED} from './game/store/prefabs/prefabs';
export function installHgssEnergy(card:any,kind:string){card.energyType=EnergyType.SPECIAL;card.provides=[kind==='dark'?CardType.DARK:CardType.METAL];card.reduceEffect=function(store:any,state:any,e:any){
 if(!(e instanceof ApplyWeaknessEffect||e instanceof PutDamageEffect))return state;const list=StateUtils.findPokemonSlot(state,this);if(!list)return state;const owner=StateUtils.findOwner(state,list);if(IS_SPECIAL_ENERGY_BLOCKED(store,state,owner,this,list))return state;const type=new CheckPokemonTypeEffect(list);store.reduceEffect(state,type);
 if(kind==='dark'&&e instanceof ApplyWeaknessEffect&&e.source===list&&e.target===StateUtils.getOpponent(state,owner).active&&type.cardTypes.includes(CardType.DARK)&&e.damage>0)e.damage+=10;
 if(kind==='metal'&&e instanceof PutDamageEffect&&e.target===list&&type.cardTypes.includes(CardType.METAL)&&!e.attackEffect.wotcBypassDefender)e.damage=Math.max(0,e.damage-10);
 return state;};}
