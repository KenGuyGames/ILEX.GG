import {StateUtils,GamePhase} from './game';
import {IS_ABILITY_BLOCKED} from './game/store/prefabs/prefabs';
export function xyPlayerProtected(store:any,state:any,owner:any):boolean {
 if(!state.rules.xyEraRules)return false;
 return [owner.active,...owner.bench].some((list:any)=>{const card=list.getPokemonCard();return card?.powers.some((p:any)=>p.name==='Bodyguard')&&!IS_ABILITY_BLOCKED(store,state,owner,card);});
}
export function xyCoinResult(store:any,state:any,prompt:any,result:any):any {
 if(prompt.type!=='Coin flip'||!state.rules.xyEraRules)return result;
 const owner=state.players.find((p:any)=>p.id===prompt.getPerspectivePlayerId());return xyActualCoinResult(store,state,owner,result);
}
export function xyActualCoinResult(store:any,state:any,owner:any,result:boolean):boolean {
 if(!state.rules.xyEraRules||state.phase===GamePhase.BETWEEN_TURNS||!owner||state.players[state.activePlayer]!==owner)return result;
 if(owner._xyForcedTailsTurn===state.turn)return false;
 const opponent=StateUtils.getOpponent(state,owner),card=opponent.active.getPokemonCard();
 return card?.powers.some((p:any)=>p.name==='Contrary')&&!IS_ABILITY_BLOCKED(store,state,opponent,card)?false:result;
}
