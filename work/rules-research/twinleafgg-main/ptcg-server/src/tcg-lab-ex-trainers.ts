import { AttackEffect } from './game/store/effects/game-effects';
import { EndTurnEffect } from './game/store/effects/game-phase-effects';
import { MOVE_CARDS } from './game/store/prefabs/prefabs';
import { AfterEnergyAttachedEffect } from './game/store/effects/play-card-effects';
import { HealEffect } from './game/store/effects/game-effects';
import { CardType,CardTag,Stage,StateUtils,GameError,GameMessage,PowerType,EnergyType } from './game';
import { CheckPokemonTypeEffect,CheckPokemonStatsEffect,CheckProvidedEnergyEffect,CheckHpEffect,CheckRetreatCostEffect } from './game/store/effects/check-effects';
import { PowerEffect } from './game/store/effects/game-effects';
import { PutDamageEffect } from './game/store/effects/attack-effects';
export function exStadium(card:any,kind:string,store:any,state:any,e:any){
 if(StateUtils.getStadiumCard(state)!==card||state.players.some((p:any)=>p.stadiumAndToolHaveNoEffectTurnsRemaining>0))return state;
 if(kind==='holonCircle'&&e instanceof AttackEffect&&e.source===e.player.active){e.damage=0;e._exHolonCircleStopped=true;e.preventDefault=true;MOVE_CARDS(store,state,StateUtils.findOwner(state,StateUtils.findCardList(state,card)).stadium,StateUtils.findOwner(state,StateUtils.findCardList(state,card)).discard,{cards:[card],sourceCard:card,sourceEffect:e});return state;}
 if(kind==='highPressure'&&e instanceof CheckRetreatCostEffect&&typesFor(store,state,e.target).some((t:any)=>[CardType.FIRE,CardType.WATER].includes(t))){const i=e.cost.indexOf(CardType.COLORLESS);if(i>=0)e.cost.splice(i,1);}
 if(kind==='lowPressure'&&e instanceof CheckHpEffect&&typesFor(store,state,e.target).some((t:any)=>[CardType.GRASS,CardType.LIGHTNING].includes(t)))e.hp+=10;
 if(kind==='pokemonPark'&&e instanceof AfterEnergyAttachedEffect&&e.fromHand&&e.player.bench.includes(e.target)&&e.player._exParkTurn!==state.turn){e.player._exParkTurn=state.turn;store.reduceEffect(state,new HealEffect(e.player,e.target,10));}
 if(!(e instanceof CheckPokemonStatsEffect||e instanceof CheckProvidedEnergyEffect||e instanceof PowerEffect||e instanceof PutDamageEffect))return state;
 const types=(list:any)=>{const check=new CheckPokemonTypeEffect(list);store.reduceEffect(state,check);return check.cardTypes;};
 const delta=(list:any)=>list.getPokemonCard()?.tags.includes(CardTag.DELTA_SPECIES);
 if(kind==='drake'&&e instanceof PutDamageEffect&&!e.attackEffect.wotcBypassDefender&&e.target===e.opponent.active&&types(e.target).includes(CardType.COLORLESS))e.damage=Math.max(0,e.damage-10);
 if(e instanceof CheckPokemonStatsEffect){
  if(kind==='holonLegacy'&&delta(e.target))e.weakness=[];
  if(kind==='glacia'&&!e.target.getPokemonCard()?.tags.includes(CardTag.POKEMON_ex)&&types(e.target).includes(CardType.WATER))e.weakness=[];
 }
 if(kind==='holonTower'&&e instanceof CheckProvidedEnergyEffect&&delta(e.source))for(const energy of e.source.cards.filter((c:any)=>c.energyType===EnergyType.BASIC)){const entry=e.energyMap.find((x:any)=>x.card===energy);const provides=[...new Set([...(entry?.provides||energy.provides),CardType.METAL])];if(entry)entry.provides=provides;else e.energyMap.push({card:energy,provides});}
 if(e instanceof PowerEffect){
  const list=StateUtils.findCardList(state,e.card);if(!list.getPokemonCard?.())return state;
  if(kind==='holonLegacy'&&delta(list)&&e.power.powerType===PowerType.POKEPOWER)throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
  if(kind==='battleFrontier'&&list.isEvolved()&&types(list).some((t:any)=>[CardType.COLORLESS,CardType.DARK,CardType.METAL].includes(t))&&[PowerType.POKEPOWER,PowerType.POKEBODY].includes(e.power.powerType))throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
  if(kind==='mtMoon'&&e.power.powerType===PowerType.POKEPOWER){const owner=StateUtils.findOwner(state,list),hp=new CheckHpEffect(owner,list);store.reduceEffect(state,hp);if(hp.hp<70)throw new GameError(GameMessage.BLOCKED_BY_EFFECT);}
 }
 return state;
}

function typesFor(store:any,state:any,list:any){const effect=new CheckPokemonTypeEffect(list);store.reduceEffect(state,effect);return effect.cardTypes;}
