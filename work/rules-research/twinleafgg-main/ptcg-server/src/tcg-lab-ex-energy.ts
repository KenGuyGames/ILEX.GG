import { CardType,CardTag,EnergyType,Stage,SuperType,StateUtils,GameError,GameMessage } from './game';
import { AttackEffect } from './game/store/effects/game-effects';
import { EndTurnEffect } from './game/store/effects/game-phase-effects';
import { AttachEnergyEffect,AfterEnergyAttachedEffect } from './game/store/effects/play-card-effects';
import { CheckProvidedEnergyEffect,CheckPokemonStatsEffect,CheckRetreatCostEffect,CheckTableStateEffect,AddSpecialConditionsPowerEffect } from './game/store/effects/check-effects';
import { AbstractAttackEffect,PutDamageEffect,AddSpecialConditionsEffect } from './game/store/effects/attack-effects';
import { IS_SPECIAL_ENERGY_BLOCKED,MOVE_CARDS } from './game/store/prefabs/prefabs';

export function installExEnergy(card:any,kind:string){
 card.energyType=EnergyType.SPECIAL;
 card.provides=kind==='darkMetal'?[CardType.DARK,CardType.METAL]:kind==='rocket'?[CardType.DARK,CardType.DARK]:kind==='boost'?[CardType.COLORLESS,CardType.COLORLESS,CardType.COLORLESS]:kind==='metal'?[CardType.METAL]:[CardType.COLORLESS];
 card.reduceEffect=function(store:any,state:any,e:any){
  if(!(e instanceof AttachEnergyEffect||e instanceof AfterEnergyAttachedEffect||e instanceof CheckProvidedEnergyEffect||e instanceof CheckPokemonStatsEffect||e instanceof CheckRetreatCostEffect||e instanceof CheckTableStateEffect||e instanceof EndTurnEffect||e instanceof AttackEffect||e instanceof AbstractAttackEffect||e instanceof AddSpecialConditionsPowerEffect))return state;
  const list=StateUtils.findCardList(state,this),owner=StateUtils.findOwner(state,list);
  const valid=(target:any)=>target.isEvolved()&&!(['doubleRainbow','scramble'].includes(kind)&&target.getPokemonCard().tags.includes(CardTag.POKEMON_ex));
  if(e instanceof AttachEnergyEffect&&e.energyCard===this){
   if(['boost','doubleRainbow','scramble'].includes(kind)&&!valid(e.target))throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
   if(kind==='rocket'&&!/^(Dark |Rocket's )/.test(e.target.getPokemonCard()?.name||''))throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }
  if(!owner||!list?.getPokemonCard?.())return state;
  const blocked=IS_SPECIAL_ENERGY_BLOCKED(store,state,owner,this,list);
  if(blocked)return state;
  if(e instanceof AfterEnergyAttachedEffect&&e.energyCard===this&&e.fromHand)this._exAttachedTurn=state.turn;
  if(e instanceof CheckProvidedEnergyEffect&&e.source===list){
   let provides=this.provides;
   if(kind==='deltaRainbow')provides=list.getPokemonCard().tags.includes(CardTag.DELTA_SPECIES)?[CardType.ANY]:[CardType.COLORLESS];
   if(kind==='multi')provides=list.cards.some((c:any)=>c!==this&&c.superType===SuperType.ENERGY&&c.energyType===EnergyType.SPECIAL)?[CardType.COLORLESS]:[CardType.ANY];
   if(kind==='doubleRainbow')provides=[CardType.ANY,CardType.ANY];
   if(kind==='scramble'){const opponent=StateUtils.getOpponent(state,owner);provides=owner.prizes.filter((l:any)=>l.cards.length).length>opponent.prizes.filter((l:any)=>l.cards.length).length?[CardType.ANY,CardType.ANY,CardType.ANY]:[CardType.COLORLESS];}
   const entry=e.energyMap.find((x:any)=>x.card===this);if(entry)entry.provides=provides;else e.energyMap.push({card:this,provides});
  }
  if(e instanceof CheckTableStateEffect&&['boost','doubleRainbow','scramble'].includes(kind)&&!valid(list))MOVE_CARDS(store,state,list,owner.discard,{cards:[this],sourceCard:this,sourceEffect:e});
  if(e instanceof EndTurnEffect&&e.player===owner&&['boost','rocket'].includes(kind))MOVE_CARDS(store,state,list,owner.discard,{cards:[this],sourceCard:this,sourceEffect:e});
  if(kind==='boost'&&e instanceof CheckRetreatCostEffect&&e.player===owner&&owner.active===list&&!(e as any)._exDamageQuery)e.cost=[...Array(100)].map(()=>CardType.COLORLESS);
  if(kind==='rocket'&&e instanceof AttackEffect&&e.source===list)e.damage+=10;
  if(kind==='doubleRainbow'&&e instanceof AttackEffect&&e.source===list)e.damage=Math.max(0,e.damage-10);
  const hasBasic=(type:any)=>list.cards.some((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC&&c.provides.includes(type));
  if(kind==='metal'&&e instanceof PutDamageEffect&&e.target===list){const stats=new CheckPokemonStatsEffect(list);store.reduceEffect(state,stats);if(list.getPokemonCard().cardType.includes(CardType.METAL))e.damage=Math.max(0,e.damage-10);}
  if(!kind.startsWith('holon')||list.getPokemonCard().tags.includes(CardTag.POKEMON_ex))return state;
  if(kind==='holonFF'){
   if(e instanceof CheckPokemonStatsEffect&&e.target===list&&hasBasic(CardType.FIRE))e.weakness=[];
   if(e instanceof AttackEffect&&e.source===list&&hasBasic(CardType.FIGHTING))e.ignoreResistance=true;
  }
  if(kind==='holonGL'){
   if((e instanceof AddSpecialConditionsEffect||e instanceof AddSpecialConditionsPowerEffect)&&e.target===list&&hasBasic(CardType.GRASS))e.preventDefault=true;
   if(e instanceof PutDamageEffect&&e.target===list&&e.player!==owner&&hasBasic(CardType.LIGHTNING)&&e.source.getPokemonCard()?.tags.includes(CardTag.POKEMON_ex))e.damage=Math.max(0,e.damage-10);
  }
  if(kind==='holonWP'){
   if(e instanceof CheckRetreatCostEffect&&e.player===owner&&e.target===list&&hasBasic(CardType.PSYCHIC))e.cost=[];
   if(e instanceof AbstractAttackEffect&&e.target===list&&e.player!==owner&&hasBasic(CardType.WATER)&&!e.attackEffect._wotcTrainer&&!['APPLY_WEAKNESS_EFFECT','AFTER_WEAKNESS_AND_RESISTANCE_EFFECT','DEAL_DAMAGE_EFFECT','PUT_DAMAGE_EFFECT','AFTER_DAMAGE_EFFECT'].includes(e.type))e.preventDefault=true;
  }
  return state;
 };
}
