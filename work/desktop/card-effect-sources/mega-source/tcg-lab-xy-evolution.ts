import {Stage} from './game';
import {EvolveEffect} from './game/store/effects/game-effects';
import {EndTurnEffect} from './game/store/effects/game-phase-effects';
import {IS_TOOL_BLOCKED} from './game/store/prefabs/prefabs';

// Trainer-driven evolution must use the same evolution event as hand play,
// while retaining its actual source zone for "from your hand" effects.
export function evolveFromZone(store:any,state:any,player:any,target:any,card:any,source:any):any {
 const effect:any=new EvolveEffect(player,target,card);
 effect._xyEvolutionSource=source;
 effect._xyDeferredMega=true;
 store.reduceEffect(state,effect);
 return effect;
}
export function finishMegaEvolution(store:any,state:any,effect:any):void {
 if(!state.rules.xyEraRules||effect.pokemonCard?.stage!==Stage.MEGA||effect.skipMegaEvolutionEndTurn||effect.target.getPokemonCard()!==effect.pokemonCard)return;
 if(effect.target.tools.some((tool:any)=>(tool._xySpiritLinkTarget===effect.pokemonCard.name||tool.name.endsWith(' Spirit Link')&&effect.pokemonCard.name==='M '+tool.name.slice(0,-12)+'-EX')&&!IS_TOOL_BLOCKED(store,state,effect.player,tool)))return;
 const end=()=>{if(state.players[state.activePlayer]===effect.player)store.reduceEffect(state,new EndTurnEffect(effect.player));};
 if(store.hasPrompts())store.waitPrompt(state,end);else end();
}
