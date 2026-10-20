/* Shared evolution search: native effects keep their printed target/stage filters,
 * while cube matches use the same family/type/Prize eligibility as hand evolution. */
import { cubeEvolution } from './tcg-lab-cube';
import { ChooseCardsPrompt } from './game/store/prompts/choose-cards-prompt';
import { ShuffleDeckPrompt } from './game/store/prompts/shuffle-prompt';
import { EvolveEffect } from './game/store/effects/game-effects';
import { SuperType } from './game/store/card/card-types';
import { matchesPromptFilter } from './game/store/prompts/prompt-card-filter';
import { GameMessage } from './game/game-message';
import { GameError } from './game/game-error';
export function evolutionSearchEligible(state: any, list: any, card: any, filter: any = {}): boolean {
 const from=list.getPokemonCard();
 return !!from && card.superType===SuperType.POKEMON && matchesPromptFilter(card,filter) && cubeEvolution(from,card,false,state.rules?.cubeRules);
}
export function searchAndEvolveFromDeck(store: any,state: any,player: any,list: any,filter: any = {}): any {
 const source=player.deck;
 const eligible=(card:any)=>evolutionSearchEligible(state,list,card,filter);
 const blocked=source.cards.flatMap((c:any,i:number)=>eligible(c)?[]:[i]);
 return store.prompt(state,new ChooseCardsPrompt(player.id,GameMessage.CHOOSE_CARD_TO_EVOLVE,source,{superType:SuperType.POKEMON},{min:0,max:1,allowCancel:true,blocked}),(selected:any[])=>{
  if(selected?.length){
   const card=selected[0];if(!source.cards.includes(card)||!eligible(card))throw new GameError(GameMessage.INVALID_TARGET);
   const evolve=new EvolveEffect(player,list,card);(evolve as any)._xyEvolutionSource=source;
   store.reduceEffect(state,evolve);
  }
  store.prompt(state,new ShuffleDeckPrompt(player.id),(order:number[])=>source.applyOrder(order));
 });
}
