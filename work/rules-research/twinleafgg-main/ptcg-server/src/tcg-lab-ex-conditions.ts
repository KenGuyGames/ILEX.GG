import { CardTag,CardType,Stage,SuperType,StateUtils,SpecialCondition,EnergyType } from './game';
import { CheckProvidedEnergyEffect, CheckPokemonTypeEffect,CheckHpEffect } from './game/store/effects/check-effects';
export function exCondition(store:any,state:any,e:any,op:any){
 const p=e.player,o=e.opponent,source=e.source,defender=o.active.getPokemonCard();
 const units=(owner:any,list:any)=>{const check=new CheckProvidedEnergyEffect(owner,list);store.reduceEffect(state,check);return check.energyMap.reduce((n:number,x:any)=>n+StateUtils.getProvidesUnitCount(x.provides),0);};
 switch(op.condition){
 case 'lessFieldEnergy':return [p.active,...p.bench].filter((l:any)=>l.getPokemonCard()).reduce((n:number,l:any)=>n+units(p,l),0)<[o.active,...o.bench].filter((l:any)=>l.getPokemonCard()).reduce((n:number,l:any)=>n+units(o,l),0);
 case 'defenderLessHp':{const self=new CheckHpEffect(p,source),target=new CheckHpEffect(o,o.active);store.reduceEffect(state,self);store.reduceEffect(state,target);return target.hp-o.active.damage<self.hp-source.damage;}
 case 'selfBasicEnergyTypes':return new Set([...source.cards,...source.energies.cards].filter((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC).flatMap((c:any)=>c.provides)).size>=op.amount;
 case 'ownNamedAtLeast':return [p.active,...p.bench].filter((l:any)=>l.getPokemonCard()?.name===op.name).length>=op.amount;
 case 'lessBench':return p.bench.filter((l:any)=>l.getPokemonCard()).length<o.bench.filter((l:any)=>l.getPokemonCard()).length;
 case 'stadium':return !!StateUtils.getStadiumCard(state);
 case 'defenderBasic':return defender?.stage===Stage.BASIC;
 case 'defenderStatus':return o.active.specialConditions.includes((SpecialCondition as any)[op.status]);
 case 'opponentEx':return [o.active,...o.bench].some((l:any)=>l.getPokemonCard()?.tags.includes(CardTag.POKEMON_ex));
 case 'opponentStage2':return [o.active,...o.bench].some((l:any)=>l.isEvolved()&&l.getPokemonCard()?.stage===Stage.STAGE_2);
 case 'selfTool':return !!source.tool;
 case 'aheadPrizes':return p.prizes.filter((l:any)=>l.cards.length).length<o.prizes.filter((l:any)=>l.cards.length).length;
 case 'opponentLastPrize':return o.prizes.filter((l:any)=>l.cards.length).length===1;
 case 'defenderSpecialEnergy':return [...o.active.cards,...o.active.energies.cards].some((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.SPECIAL);
 case 'sameEnergy':return units(p,source)===units(o,o.active);
 case 'lessEnergy':return units(p,source)<units(o,o.active);
 case 'defenderType':{const type=new CheckPokemonTypeEffect(o.active);store.reduceEffect(state,type);const map:any={Grass:CardType.GRASS,Fire:CardType.FIRE,Water:CardType.WATER,Lightning:CardType.LIGHTNING,Psychic:CardType.PSYCHIC,Fighting:CardType.FIGHTING,Darkness:CardType.DARK,Metal:CardType.METAL};return type.cardTypes.includes(map[op.energy]);}
 case 'defenderEx':return !!defender?.tags.includes(CardTag.POKEMON_ex);
 case 'defenderEvolved':return o.active.isEvolved();
 case 'defenderStage2':return defender?.stage===Stage.STAGE_2;
 case 'defenderDamaged':return o.active.damage>0;
 case 'defenderDamageAtLeast':return o.active.damage>=op.amount;
 case 'defenderCondition':return o.active.specialConditions.length>0;
 case 'defenderDelta':return !!defender?.tags.includes(CardTag.DELTA_SPECIES);
 case 'defenderNameIncludes':return !!defender?.name.includes(op.name);
 case 'behindPrizes':return p.prizes.filter((l:any)=>l.cards.length).length>o.prizes.filter((l:any)=>l.cards.length).length;
 case 'sameHandSize':return p.hand.cards.length===o.hand.cards.length;
 case 'opponentEvolved':return [o.active,...o.bench].some((l:any)=>l.isEvolved());
 case 'opponentBench':return o.bench.some((l:any)=>l.getPokemonCard());
 case 'stadiumNamed':return StateUtils.getStadiumCard(state)?.name===op.name;
 case 'selfNamedEnergy':return [...source.cards,...source.energies.cards].some((c:any)=>c.superType===SuperType.ENERGY&&(op.includes?c.name.includes(op.name):c.name===op.name));
 case 'onlySelfLastPrize':return o.prizes.filter((l:any)=>l.cards.length).length===1&&!p.bench.some((l:any)=>l.getPokemonCard());
 case 'defenderDarkOrNamed':return exCondition(store,state,e,{condition:'defenderType',energy:'Darkness'})||!!defender?.name.includes('Dark');
 case 'defenderResistance':return defender?.resistance.some((r:any)=>r.type===({Fighting:CardType.FIGHTING} as any)[op.energy]);
 case 'selfTypedEnergyAtLeast':{const types:any={Grass:CardType.GRASS,Fire:CardType.FIRE,Water:CardType.WATER,Lightning:CardType.LIGHTNING,Psychic:CardType.PSYCHIC,Fighting:CardType.FIGHTING,Darkness:CardType.DARK,Metal:CardType.METAL};const energy=new CheckProvidedEnergyEffect(p,source);store.reduceEffect(state,energy);return energy.energyMap.reduce((n:number,x:any)=>n+(StateUtils.providesMatchesType(x.provides,types[op.energy])?StateUtils.getProvidesUnitCount(x.provides):0),0)>=op.amount;}
 default:return false;
 }
}
