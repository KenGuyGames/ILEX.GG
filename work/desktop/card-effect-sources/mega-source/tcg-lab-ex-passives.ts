import { dpPrintedPowers } from './tcg-lab-dp-power-identity';
import { CardType,CardTag,Stage,SuperType,EnergyType,StateUtils,GameError,GameMessage,PowerType,SpecialCondition } from './game';
import { CheckProvidedEnergyEffect,CheckPokemonTypeEffect } from './game/store/effects/check-effects';
const types:any={Grass:CardType.GRASS,Fire:CardType.FIRE,Water:CardType.WATER,Lightning:CardType.LIGHTNING,Psychic:CardType.PSYCHIC,Fighting:CardType.FIGHTING,Darkness:CardType.DARK,Metal:CardType.METAL};
export function exPassive(store:any,state:any,e:any,op:any,owner:any,list:any){
 const opponent=StateUtils.getOpponent(state,owner);
 const cards=Array.from(new Set([...list.cards,...list.energies.cards])) as any[];
 const energy=()=>{const check=new CheckProvidedEnergyEffect(owner,list);store.reduceEffect(state,check);return check.energyMap;};
 const matches=(entries:any[],type:string)=>entries.some(x=>StateUtils.providesMatchesType(x.provides,types[type]));
 switch(op.kind){
 case 'exFastFeet':if(owner.active===list)e.ignoreStatusConditions=true;break;
 case 'exNoPrizes':e.prizeCount=0;break;
 case 'exSetNamedHp':if(e.target.getPokemonCard()?.name===op.name)e.hp=op.hp;break;
 case 'exNamedAttackCost':if(e.player===owner&&owner.active===list&&e.attack.name===op.attack&&[owner.active,...owner.bench].some((l:any)=>op.names.includes(l.getPokemonCard()?.name)))e.cost=op.cost.map((t:string)=>types[t]??CardType.COLORLESS);break;
 case 'exWeaknessFilter':if(cards.some((c:any)=>c.superType===SuperType.ENERGY&&c.name.includes(op.requireNamedEnergyIncludes))){const check=new CheckPokemonTypeEffect(e.target);store.reduceEffect(state,check);if(check.cardTypes.includes(types[op.targetType]))e.weakness=[];}break;
 case 'exBasicAttackLock':{
  if(op.active&&owner.active!==list||op.onlySelf&&owner.bench.some((l:any)=>l.getPokemonCard()))break;
  const source=e.card||e.source?.getPokemonCard();if(op.name?source?.name===op.name:source?.stage===Stage.BASIC)throw new GameError(GameMessage.BLOCKED_BY_EFFECT);break;
 }
 case 'exNonExPowerLock':{const target=StateUtils.findCardList(state,e.card);if(op.active&&owner.active!==list||op.ownNames&&![owner.active,...owner.bench].some((l:any)=>op.ownNames.includes(l.getPokemonCard()?.name))||op.evolved&&!target.isEvolved()||op.bodiesOnly&&e.power.powerType!==PowerType.POKEBODY||e.card.tags.includes(CardTag.POKEMON_ex))break;throw new GameError(GameMessage.BLOCKED_BY_EFFECT);}
 case 'exEvolvedAttackTax':if(owner.active===list&&e.player.active.isEvolved())e.cost.push(CardType.COLORLESS);break;
 case 'exOpponentNoResistance':if(owner.active===list)e.resistance=[];break;
 case 'exAttackAura':{
  if(op.lastKoType&&!owner._dpKoHistory?.some((entry:any)=>entry.turn===owner._dpLastOpponentTurn&&entry.byAttack&&entry.types.includes(types[op.lastKoType])))break;
  if(op.morePrizes&&owner.prizes.filter((zone:any)=>zone.cards.length).length<=opponent.prizes.filter((zone:any)=>zone.cards.length).length)break;
  if(op.selfOnly&&e.source!==list||op.damaged&&!list.damage||op.defenderBody&&!dpPrintedPowers(e.target).some((power:any)=>power.powerType===PowerType.POKEBODY))break;
  if(op.ownAllNames&&!op.ownAllNames.every((name:string)=>[owner.active,...owner.bench].some((target:any)=>target.getPokemonCard()?.name===name)))break;
  if(op.noSupporter&&owner.supporter.cards.length||op.opponentPrizesAtMost!==undefined&&opponent.prizes.filter((zone:any)=>zone.cards.length).length>op.opponentPrizesAtMost||op.lessBench&&owner.bench.filter((target:any)=>target.getPokemonCard()).length>=opponent.bench.filter((target:any)=>target.getPokemonCard()).length||op.opponentLevelUp&&![opponent.active,...opponent.bench].some((target:any)=>target.getPokemonCard()?.tags.includes(CardTag.POKEMON_LV_X)))break;
  if(op.opponentNames&&!opponent.bench.concat([opponent.active]).some((l:any)=>op.opponentNames.includes(l.getPokemonCard()?.name)))break;
  if(op.active&&owner.active!==list||!op.both&&e.player!==owner||op.holonStadium&&!StateUtils.getStadiumCard(state)?.name.includes('Holon')||e.damage<=0)break;
  if(op.types){const type=new CheckPokemonTypeEffect(e.source);store.reduceEffect(state,type);if(!type.cardTypes.some((entry:any)=>op.types.some((name:string)=>types[name]===entry)))break;}
  const attacker=e.source.getPokemonCard();if(op.names&&!op.names.includes(attacker?.name)||op.stage2Ex&&!(attacker?.stage===Stage.STAGE_2&&attacker.tags.includes(CardTag.POKEMON_ex))||op.delta&&!attacker?.tags.includes(CardTag.DELTA_SPECIES))break;
  let amount=op.amount;if(op.countBenchType)amount*=owner.bench.filter((target:any)=>{if(!target.getPokemonCard())return false;const type=new CheckPokemonTypeEffect(target);store.reduceEffect(state,type);return type.cardTypes.includes(types[op.countBenchType]);}).length;e.damage+=amount;break;
 }
 case 'exPreventBySource':{
  if(op.requireNamedEnergy&&!cards.some((card:any)=>card.name===op.requireNamedEnergy))break;
  if(op.basicEnergies&&!op.basicEnergies.every((t:string)=>cards.some(c=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC&&c.provides.includes(types[t]))))break;
  if(e.attackEffect.wotcBypassDefender||e.attackEffect._wotcTrainer||op.ownName&&![owner.active,...owner.bench].some((l:any)=>l.getPokemonCard()?.name===op.ownName))break;
  if(op.effectsOnly&&['DEAL_DAMAGE_EFFECT','PUT_DAMAGE_EFFECT'].includes(e.type))break;
  const source=e.source.getPokemonCard();if(op.sourceLevel&&!source?.tags.includes(CardTag.POKEMON_LV_X)||op.sourceConditions&&e.source.specialConditions.length<op.sourceConditions||op.sourceSP&&!source?.tags.includes(CardTag.POKEMON_SP)||op.sourcePowers&&!dpPrintedPowers(e.source).some((power:any)=>[PowerType.POKEPOWER,PowerType.POKEBODY].includes(power.powerType))||op.sourceStatus&&!e.source.specialConditions.includes((SpecialCondition as any)[op.sourceStatus])||op.sourceSpecialEnergy&&![...e.source.cards,...e.source.energies.cards].some((card:any)=>card.superType===SuperType.ENERGY&&card.energyType===EnergyType.SPECIAL))break;if(op.basic&&source?.stage!==Stage.BASIC||op.sourceEx&&!source?.tags.includes(CardTag.POKEMON_ex)||op.nameIncludes&&!source?.name.includes(op.nameIncludes)||op.energy&&!matches(energy(),op.energy))break;
  e.preventDefault=true;break;
 }
 case 'exDynamicType':if(op.basicEnergyTypes){const basic=cards.filter(c=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC);if(basic.length)e.cardTypes=[...new Set(basic.flatMap(c=>c.provides))];}else if(matches(energy(),op.energy))e.cardTypes=op.types.map((t:string)=>types[t]);break;
 case 'exAllEnergyType':if(!op.evolved||list.isEvolved())for(const c of cards.filter(c=>c.superType===SuperType.ENERGY)){let entry=e.energyMap.find((x:any)=>x.card===c);if(!entry){entry={card:c,provides:[]};e.energyMap.push(entry);}const original=entry.provides.length?entry.provides:c.provides;entry.provides=Array(StateUtils.getProvidesUnitCount(original)).fill(types[op.energy]);}break;
 case 'exFilteredReduction':{
  if(op.basicMatchesAttacker){const type=new CheckPokemonTypeEffect(e.source);store.reduceEffect(state,type);if(!cards.some((card:any)=>card.superType===SuperType.ENERGY&&card.energyType===EnergyType.BASIC&&card.provides.some((energy:any)=>type.cardTypes.includes(energy))))break;}
  if(op.minimumCounters&&list.damage<op.minimumCounters*10||op.maxDamage!==undefined&&e.damage>op.maxDamage)break;
  if(op.status&&!list.specialConditions.includes((SpecialCondition as any)[op.status])||op.tool&&!list.tools.length)break;
  if(op.inPlayName&&!state.players.flatMap((p:any)=>[p.active,...p.bench]).some((l:any)=>l.getPokemonCard()?.name===op.inPlayName))break;
  if(op.ownerName&&!/[’']s /.test(e.source.getPokemonCard()?.name))break;
  if(op.evolved&&!list.isEvolved()||op.sourceSpecialEnergy&&![...e.source.cards,...e.source.energies.cards].some((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.SPECIAL))break;
  if(e.attackEffect?.wotcBypassDefender||op.opponent&&e.player===owner||op.evolvedSource&&!e.source.isEvolved()||op.sourceEx&&!e.source.getPokemonCard()?.tags.includes(CardTag.POKEMON_ex)||op.stadium&&StateUtils.getStadiumCard(state)?.name!==op.stadium||op.opponentHandAtLeast&&opponent.hand.cards.length<op.opponentHandAtLeast)break;
  if(op.types){const check=new CheckPokemonTypeEffect(e.source);store.reduceEffect(state,check);if(!op.types.some((t:string)=>check.cardTypes.includes(types[t])))break;}
  const entries=op.energy||op.countEnergy?energy():[];
  if(op.energy&&!matches(entries,op.energy)||op.requireEnergy&&!cards.some(c=>c.superType===SuperType.ENERGY&&(!op.basic||c.energyType===EnergyType.BASIC)))break;
  const count=op.countName?cards.filter(c=>c.superType===SuperType.ENERGY&&c.name===op.countName).length:op.countEnergy?entries.reduce((n:number,x:any)=>n+(op.countEnergy===true||StateUtils.providesMatchesType(x.provides,types[op.countEnergy])?StateUtils.getProvidesUnitCount(x.provides,x):0),0):1;
  e.reduceDamage(Math.min(op.cap??Infinity,op.amount*count));break;
 }
 case 'exRetreatFilter':{
  if(op.self&&e.target!==list||op.ownNames&&!op.ownNames.every((name:string)=>[owner.active,...owner.bench].some((l:any)=>l.getPokemonCard()?.name===name)))break;
  if(op.requireNamedEnergy&&!cards.some(c=>c.superType===SuperType.ENERGY&&c.name===op.requireNamedEnergy))break;
  if(op.targetType){const type=new CheckPokemonTypeEffect(e.target);store.reduceEffect(state,type);if(!type.cardTypes.includes(types[op.targetType]))break;}
  if(op.excludeEx&&e.target.getPokemonCard()?.tags.includes(CardTag.POKEMON_ex))break;
  if((op.basicEnergy||op.ownName||op.defenderEx)&&e.target!==list)break;
  const active=e.target.getPokemonCard();if(op.bench&&!owner.bench.includes(list)||op.basicEnergy&&!cards.some(c=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC)||op.ownName&&![owner.active,...owner.bench].some((l:any)=>l.getPokemonCard()?.name===op.ownName)||op.defenderEx&&!opponent.active.getPokemonCard()?.tags.includes(CardTag.POKEMON_ex)||op.names&&!op.names.includes(active?.name)||op.stage2Ex&&!(active?.stage===Stage.STAGE_2&&active.tags.includes(CardTag.POKEMON_ex))||op.excludeExBaby&&active?.tags.some((t:any)=>[CardTag.POKEMON_ex,CardTag.BABY].includes(t)))break;
  if(op.bench&&e.target!==owner.active)break;
  if(op.amount){for(let i=0;i<op.amount;i++){const at=e.cost.indexOf(CardType.COLORLESS);if(at>=0)e.cost.splice(at,1);}}else e.cost=[];break;
 }
 }
}
