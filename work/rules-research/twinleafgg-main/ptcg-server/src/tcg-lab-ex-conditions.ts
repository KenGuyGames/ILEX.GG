import { dpPrintedPowers } from './tcg-lab-dp-power-identity';
import { CardTag,CardType,Stage,SuperType,StateUtils,SpecialCondition,EnergyType,PowerType } from './game';
import { CheckProvidedEnergyEffect, CheckPokemonTypeEffect,CheckHpEffect,CheckPokemonStatsEffect,CheckRetreatCostEffect } from './game/store/effects/check-effects';
export function exCondition(store:any,state:any,e:any,op:any){
 const p=e.player,o=e.opponent,source=e.source,defender=o.active.getPokemonCard();
 const units=(owner:any,list:any)=>{const check=new CheckProvidedEnergyEffect(owner,list);store.reduceEffect(state,check);return check.energyMap.reduce((n:number,x:any)=>n+StateUtils.getProvidesUnitCount(x.provides),0);};
 switch(op.condition){
 case 'dpSelfCountersAtLeast':return source.damage>=op.amount*10;
 case 'dpDefenderPowers':return dpPrintedPowers(o.active).some((power:any)=>[PowerType.POKEPOWER,PowerType.POKEBODY].includes(power.powerType));
 case 'dpBenchAtMost':return p.bench.filter((list:any)=>list.getPokemonCard()).length<=o.bench.filter((list:any)=>list.getPokemonCard()).length;
 case 'dpDefenderFreeRetreat':{const check=new CheckRetreatCostEffect(o,o.active);store.reduceEffect(state,check);return !check.cost.length;}
 case 'dpMoreFieldEnergy':return [p.active,...p.bench].filter((list:any)=>list.getPokemonCard()).reduce((n:number,list:any)=>n+units(p,list),0)>[o.active,...o.bench].filter((list:any)=>list.getPokemonCard()).reduce((n:number,list:any)=>n+units(o,list),0);
 case 'dpSelfTool':return source.tools.length>0;
 case 'dpDefenderBasic':return defender?.stage===Stage.BASIC;
 case 'dpNoSupporterPlayed':return !p.supporterTurn;
 case 'dpWasBenchedThisTurn':return source._dpBenchTurn===state.turn;
 case 'dpEvolutionStatus':return source._dpEvolutionHistory?.turn===state.turn&&source._dpEvolutionHistory.from===op.name&&source._dpEvolutionHistory.conditions.includes((SpecialCondition as any)[op.status]);
 case 'dpAttachedFromHand':return source._dpAttachedFromHand?.turn===state.turn&&source._dpAttachedFromHand.entries.some((entry:any)=>StateUtils.providesMatchesType(entry,({Grass:CardType.GRASS,Fire:CardType.FIRE,Water:CardType.WATER,Lightning:CardType.LIGHTNING,Psychic:CardType.PSYCHIC,Fighting:CardType.FIGHTING,Darkness:CardType.DARK,Metal:CardType.METAL} as any)[op.energy]));
 case 'dpOwnBench':return p.bench.some((list:any)=>list.getPokemonCard());
 case 'dpOpponentBench':return o.bench.some((list:any)=>list.getPokemonCard());
 case 'dpOpponentPrizesExactly':return o.prizes.filter((zone:any)=>zone.cards.length).length===op.amount;
 case 'dpDefenderCountersAtLeast':return o.active.damage>=op.amount*10;
 case 'dpLastOpponentAttackKo':return p._dpKoHistory?.some((entry:any)=>entry.turn===p._dpLastOpponentTurn&&entry.byAttack);
 case 'dpSelfEnergyExactly':return units(p,source)===op.amount;
 case 'dpSelfHasEnergyType':{const check=new CheckProvidedEnergyEffect(p,source);store.reduceEffect(state,check);return check.energyMap.some((entry:any)=>StateUtils.providesMatchesType(entry.provides,({Grass:CardType.GRASS,Fire:CardType.FIRE,Water:CardType.WATER,Lightning:CardType.LIGHTNING,Psychic:CardType.PSYCHIC,Fighting:CardType.FIGHTING,Darkness:CardType.DARK,Metal:CardType.METAL} as any)[op.energy]));}
 case 'dpCanMoveSelfEnergy':return units(p,source)>0&&p.bench.some((list:any)=>list.getPokemonCard());
 case 'dpSelfEnergyAtMost':return units(p,source)<=op.amount;
 case 'dpSelfBasicTypes':return op.energies.every((name:string)=>[...source.cards,...source.energies.cards].some((card:any)=>card.superType===SuperType.ENERGY&&card.energyType===EnergyType.BASIC&&card.provides.includes(({Grass:CardType.GRASS,Fire:CardType.FIRE,Water:CardType.WATER,Lightning:CardType.LIGHTNING,Psychic:CardType.PSYCHIC,Fighting:CardType.FIGHTING,Darkness:CardType.DARK,Metal:CardType.METAL} as any)[name])));
 case 'dpDifferentPrizes':return p.prizes.filter((zone:any)=>zone.cards.length).length!==o.prizes.filter((zone:any)=>zone.cards.length).length;
 case 'dpSelfMachine':return source.tools.some((card:any)=>card.tags.includes(CardTag.TECHNICAL_MACHINE));
 case 'dpSourceStatus':return source.specialConditions.includes((SpecialCondition as any)[op.status]);
 case 'dpSelfDamaged':return source.damage>0;
 case 'dpSelfEnergyAtLeast':return units(p,source)>=op.amount;
 case 'dpSameHp':case 'dpSelfLessHp':{const own=new CheckHpEffect(p,source),other=new CheckHpEffect(o,o.active);store.reduceEffect(state,own);store.reduceEffect(state,other);return op.condition==='dpSameHp'?own.hp-source.damage===other.hp-o.active.damage:own.hp-source.damage<other.hp-o.active.damage;}
 case 'dpNoOwnPower':return ![p.active,...p.bench].some((list:any)=>list.getPokemons().some((card:any,index:number,array:any[])=>card.powers.some((power:any)=>power.powerType===PowerType.POKEPOWER)&&(index===array.length-1||array[array.length-1]._dpLevelUp)));
 case 'dpDefenderTool':return o.active.tools.length>0;
 case 'dpOpponentName':return [o.active,...o.bench].some((list:any)=>list.getPokemonCard()?.name===op.name);
 case 'dpOwnStadium':return p.stadium.cards.includes(StateUtils.getStadiumCard(state));
 case 'dpOpponentStadium':return o.stadium.cards.includes(StateUtils.getStadiumCard(state));
 case 'dpOwnNames':return op.names.every((name:string)=>[p.active,...p.bench].some((list:any)=>list.getPokemonCard()?.name===name));
 case 'dpOwnBenchName':return p.bench.some((list:any)=>list.getPokemonCard()?.name===op.name);
 case 'dpNotUnder':return !source.getPokemons().slice(0,-1).some((card:any)=>card.name===op.name);
 case 'dpUnder':return source.getPokemons().slice(0,-1).some((card:any)=>card.name===op.name);
 case 'dpDefenderResistance':{const check=new CheckPokemonStatsEffect(o.active);store.reduceEffect(state,check);return check.resistance.length>0;}
 case 'dpDefenderName':return defender?.name===op.name;
 case 'dpEvolvedThisTurn':return source.pokemonPlayedTurn===state.turn&&source.getPokemons().slice(0,-1).some((card:any)=>card.name===op.name);
 case 'dpOpponentType':return [o.active,...o.bench].filter((list:any)=>list.getPokemonCard()).some((list:any)=>{const check=new CheckPokemonTypeEffect(list);store.reduceEffect(state,check);return check.cardTypes.includes(({Grass:CardType.GRASS,Fire:CardType.FIRE,Water:CardType.WATER,Lightning:CardType.LIGHTNING,Psychic:CardType.PSYCHIC,Fighting:CardType.FIGHTING,Darkness:CardType.DARK,Metal:CardType.METAL} as any)[op.energy]);});
 case 'dpDamagedLastTurn':return (source.getPokemonCard()?.damageTakenLastTurn||0)>0;
 case 'dpDefenderRemainingHpAtMost':{const hp=new CheckHpEffect(o,o.active);store.reduceEffect(state,hp);return hp.hp-o.active.damage<=op.amount;}
 case 'dpDefenderHasEnergy':return units(o,o.active)>0;
 case 'dpPlayedThisTurn':return source.pokemonPlayedTurn===state.turn;
 case 'dpSupporterPlayed':return p.supporterTurn>0;
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
