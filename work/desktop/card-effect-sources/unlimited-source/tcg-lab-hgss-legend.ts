import { ApplyWeaknessEffect } from './game/store/effects/attack-effects';
import {Stage,CardTag,StateUtils,GameError,GameMessage,SuperType,TrainerType,PowerType,CardType} from './game';
import {PlayPokemonEffect} from './game/store/effects/play-card-effects';
import {MOVE_CARDS} from './game/store/prefabs/prefabs';
import {CheckRetreatCostEffect,CheckAttackCostEffect,CheckHpEffect,CheckPokemonStatsEffect,CheckProvidedEnergyEffect} from './game/store/effects/check-effects';
import {PowerEffect} from './game/store/effects/game-effects';
export function hgssLegendPair(zone:any,card:any){if(!card?._hgssLegend)return null;const partner=zone.cards.find((c:any)=>c!==card&&c._hgssLegend&&c.name===card.name&&c.set===card.set&&c.setNumber!==card.setNumber);if(!partner)return null;return [card,partner].sort((a,b)=>Number(b.setNumber)-Number(a.setNumber));}
export function assembleHgssLegend(store:any,state:any,p:any,zone:any,list:any,pair:any[],fromHand=true){
 if(pair?.length!==2||pair[0].setNumber===pair[1].setNumber||pair[0].name!==pair[1].name||pair[0].set!==pair[1].set||!pair.every(c=>zone.cards.includes(c))||list.cards.length||!p.bench.includes(list))throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
 MOVE_CARDS(store,state,zone,list,{cards:pair,sourceCard:pair[1]});list.pokemonPlayedTurn=state.turn;const card=list.getPokemonCard();card._wotcPowerTurn={};card._dpEntryId=state._dpNextEntryId=(state._dpNextEntryId||0)+1;
 return store.reduceEffect(state,{type:'HGSS_LEGEND_ENTERED',player:p,target:list,pokemonCard:card,fromHand,preventDefault:false} as any);
}
export function playHgssLegend(store:any,state:any,e:any){const card=e.pokemonCard,p=e.player;if(!p.hand.cards.includes(card))throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);return assembleHgssLegend(store,state,p,p.hand,e.target,hgssLegendPair(p.hand,card));}
export function hgssEnvironment(store:any,state:any,e:any){
 if(e instanceof ApplyWeaknessEffect&&e.player._hgssBlackBelt?.turn===state.turn&&e.target===StateUtils.getOpponent(state,e.player).active&&e.damage>0)e.damage+=e.player._hgssBlackBelt.amount;
 if(e instanceof PowerEffect&&e.power.powerType===PowerType.POKEPOWER&&e.player._hgssPowerLockTurn===state.turn)throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
 if(e instanceof CheckAttackCostEffect){const list=e.source,tax=list._hgssAttackTax;if(!e._hgssNoAttackCost&&tax?.turn===state.turn&&list.marker.hasMarker('HGSS_ATTACK_TAX',tax.card))e.cost.push(...Array(tax.amount).fill(CardType.COLORLESS));}
 const stadium:any=StateUtils.getStadiumCard(state);if(stadium?._hgssStadium){if(e instanceof CheckPokemonStatsEffect&&stadium._hgssStadium==='noResistance')e.resistance=[];if(e instanceof CheckHpEffect&&stadium._hgssStadium==='legendHp'&&e.target.getPokemonCard()?._hgssLegend)e.hp+=30;}
 return state;
}

export function hgssFinish(store:any,state:any,e:any){if(state.rules.hgssEraRules&&e instanceof CheckRetreatCostEffect&&e._hgssNoRetreatCost)e.cost=[];if(e instanceof CheckProvidedEnergyEffect&&e._hgssEnergyType!==undefined)for(const entry of e.energyMap)entry.provides=Array(StateUtils.getProvidesUnitCount(entry.provides,entry)).fill(e._hgssEnergyType);return state;}
