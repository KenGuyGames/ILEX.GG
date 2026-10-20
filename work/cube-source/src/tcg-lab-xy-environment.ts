import {CardTag,CardType,StateUtils,CardList,PowerType,GameError,GameMessage} from './game';
import {CheckPokemonTypeEffect} from './game/store/effects/check-effects';
import {PutCountersEffect,AfterDamageEffect,PutDamageEffect} from './game/store/effects/attack-effects';
import {xyPlayerProtected} from './tcg-lab-xy-player';
import {IS_ABILITY_BLOCKED,IS_SPECIAL_ENERGY_BLOCKED} from './game/store/prefabs/prefabs';
function devourLight(store:any,state:any):boolean{return state.players.some((p:any)=>[p.active,...p.bench].some((list:any)=>{const c=list.getPokemonCard();return c?.powers.some((power:any)=>power.name==='Devour Light')&&!IS_ABILITY_BLOCKED(store,state,p,c);}));}
export function xyAfterEffect(store:any,state:any,e:any):void {
 if(state.rules.xyEraRules&&e.type==='CHECK_POKEMON_POWERS_EFFECT'&&e.target.tags.includes(CardTag.BREAK)&&devourLight(store,state))e.powers=e.powers.filter((p:any)=>p.powerType!==PowerType.ABILITY);
}
// These effects belong to the affected in-play instance, including a BW Pokémon
// copying an XY attack. Markers clear them on evolution/switch/devolution.
export function xyBeforeEffect(store:any,state:any,e:any):boolean {
 if(!state.rules.xyEraRules)return false;
 // Capture attachment provenance before the attacking Pokemon's native reducer
 // can discard its Energy during propagation of this same attack event.
 if(e.type==='ATTACK_EFFECT')for(const energy of e.source.cards)if(energy._xyBurningEnergy&&!IS_SPECIAL_ENERGY_BLOCKED(store,state,e.player,energy,e.source)){if(energy._megaNitroEnergy){const type=new CheckPokemonTypeEffect(e.source);store.reduceEffect(state,type);if(!type.cardTypes.includes(CardType.FIRE))continue;}energy._xyBurningAttack={turn:state.turn,pokemon:e.source.getPokemonCard()};}
 if(e.type==='POWER_EFFECT'&&e.power.powerType===PowerType.ABILITY&&StateUtils.findPokemonSlot(state,e.card)?.getPokemonCard()?.tags.includes(CardTag.BREAK)&&devourLight(store,state))throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
 if(e.type==='CHECK_EVOLUTION_TIMING_EFFECT'&&e.evolutionCard?._xyTrait==='Δ Evolution'&&e.player.hand.cards.includes(e.evolutionCard)){e.allowFirstTurn=true;e.ignorePlayedTurn=true;}
 if(e.type==='CHECK_POKEMON_TYPE_EFFECT'){const list=e.target,plan=list?._xyType;if(plan&&plan.card===list.getPokemonCard()&&state.turn<=plan.until&&list.marker.hasMarker('XY_TYPE_SWITCH',plan.card))e.cardTypes=[plan.type];}
 if(e instanceof AfterDamageEffect&&e.damage>0){const list=e.target,plan=list._xyReflect,owner=StateUtils.findOwner(state,list);if(plan?.turn===state.turn&&plan.card===list.getPokemonCard()&&e.player!==owner&&list.marker.hasMarker('XY_REFLECT',plan.card)){const counters=new PutCountersEffect(e.attackEffect,e.damage);counters.target=e.source;store.reduceEffect(state,counters);}}
 if(e instanceof PutDamageEffect){const owner=StateUtils.findOwner(state,e.target),list=owner.active,plan=list._xyExShield;if(plan?.turn===state.turn&&plan.card===list.getPokemonCard()&&e.player!==owner&&list.marker.hasMarker('XY_EX_SHIELD',plan.card)&&e.source.getPokemonCard()?.tags.includes(CardTag.POKEMON_EX)&&!e.attackEffect.wotcBypassDefender){e.preventDefault=true;return true;}}
 if(e.type==='PLAY_LOCK_EFFECT'&&xyPlayerProtected(store,state,e.opponent))e._xyOpponentProtected=true;
 if(['OPPONENT_CANNOT_DRAW_AT_START_OF_NEXT_TURN_EFFECT','OPPONENT_POKEMON_CANNOT_ATTACK_DURING_THEIR_NEXT_TURN_EFFECT','OPPONENT_POKEMON_HAVE_NO_ABILITIES_EFFECT'].includes(e.type)&&xyPlayerProtected(store,state,e.opponent)){e.preventDefault=true;return true;}
 if(e.type==='CHECK_TABLE_STATE_EFFECT')for(const owner of state.players)if(xyPlayerProtected(store,state,owner)){owner.clearPlayLocks();owner.attackPowerSuppressions=[];owner.cannotDrawAtStartOfTurn=false;owner.cannotAttackMaxEnergy=null;owner.cannotAttackMaxEnergyTurnsRemaining=0;delete owner._xyForcedTailsTurn;}
 return false;
}
