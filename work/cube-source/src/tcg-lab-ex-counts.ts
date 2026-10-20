import { SuperType,EnergyType,StateUtils,CardType } from './game';
import { CheckProvidedEnergyEffect,CheckPokemonTypeEffect } from './game/store/effects/check-effects';
// Counts distinguish physical cards from the units supplied by special Energy.
export function exCount(store:any,state:any,e:any,op:any):number {
 const p=e.player,o=e.opponent,s=e.source;
 const cards=(list:any)=>Array.from(new Set([...list.cards,...list.energies.cards])) as any[];
 const basic=(list:any)=>cards(list).filter((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC);
 const units=(owner:any,list:any)=>{const check=new CheckProvidedEnergyEffect(owner,list);store.reduceEffect(state,check);return check.energyMap.reduce((n:number,x:any)=>n+StateUtils.getProvidesUnitCount(x.provides,x),0);};
 const map:any={Grass:CardType.GRASS,Fire:CardType.FIRE,Water:CardType.WATER,Lightning:CardType.LIGHTNING,Psychic:CardType.PSYCHIC,Fighting:CardType.FIGHTING,Darkness:CardType.DARK,Metal:CardType.METAL};
 switch(op.count){
 case 'opponentHand':return o.hand.cards.length;
 case 'defenderBasicEnergyTypes':return new Set(basic(o.active).flatMap((c:any)=>c.provides)).size;
 case 'opponentFieldTrainerCards':return new Set([...o.stadium.cards,...o.supporter.cards,...[o.active,...o.bench].flatMap((l:any)=>l.cards.filter((c:any)=>c.superType===SuperType.TRAINER))]).size;
 case 'ownNamedCounters':return [p.active,...p.bench].filter((l:any)=>l.getPokemonCard()?.name===op.name).reduce((n:number,l:any)=>n+l.damage/10,0);
 case 'otherOwnNamed':return [p.active,...p.bench].filter((l:any)=>l!==s&&l.getPokemonCard()?.name===op.name).length;
 case 'selfNamedEnergyCards':return cards(s).filter((c:any)=>c.superType===SuperType.ENERGY&&c.name.includes(op.nameIncludes)).length;
 case 'ownFieldTypedEnergy':return [p.active,...p.bench].filter((l:any)=>l.getPokemonCard()).reduce((n:number,l:any)=>{const check=new CheckProvidedEnergyEffect(p,l);store.reduceEffect(state,check);return n+check.energyMap.reduce((v:number,x:any)=>v+(StateUtils.providesMatchesType(x.provides,map[op.energy])?StateUtils.getProvidesUnitCount(x.provides,x):0),0);},0);
 case 'fieldTypedPokemon':case 'ownTypedPokemon':return (op.count==='fieldTypedPokemon'?[p.active,...p.bench,o.active,...o.bench]:[p.active,...p.bench]).filter((l:any)=>{if(!l.getPokemonCard())return false;const type=new CheckPokemonTypeEffect(l);store.reduceEffect(state,type);return op.energies.some((t:string)=>type.cardTypes.includes(map[t]));}).length;
 case 'opponentBench':return o.bench.filter((l:any)=>l.getPokemonCard()).length;
 case 'ownBench':return p.bench.filter((l:any)=>l.getPokemonCard()).length;
 case 'basicEnergyTypes':return new Set(basic(s).flatMap((c:any)=>c.provides)).size;
 case 'selfBasicEnergyCards':return basic(s).length;
 case 'bothActiveBasicEnergyCards':return basic(s).length+basic(o.active).length;
 case 'bothActiveEnergy':return units(p,s)+units(o,o.active);
 default:throw Error('Unsupported EX count '+op.count);
 }
}
