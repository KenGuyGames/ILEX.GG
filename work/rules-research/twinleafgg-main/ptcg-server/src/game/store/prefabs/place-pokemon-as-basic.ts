import { Stage } from '../card/card-types';
import { PlayPokemonEffect, PlayPokemonFromDeckEffect, PlayPokemonFromDiscardEffect } from '../effects/play-card-effects';
import { ChooseCardsPrompt } from '../prompts/choose-cards-prompt';
import { SelectPrompt } from '../prompts/select-prompt';
import { SuperType } from '../card/card-types';
import { GameMessage } from '../../game-message';

export function choosePokemonAsBasicPlacement(store: any, state: any, player: any, zone: any, options: any, done: () => void): any {
  const slots=player.bench.map((list:any,index:number)=>({list,index})).filter((s:any)=>!s.list.cards.length);
  const eligible=zone.cards.filter((c:any)=>c.superType===SuperType.POKEMON&&(!options.names||options.names.includes(c.name))&&(!options.evolvesFrom||c.evolvesFrom===options.evolvesFrom));
  if(!slots.length||!eligible.length){done();return state;}
  return store.prompt(state,new ChooseCardsPrompt(player,GameMessage.CHOOSE_CARD_TO_HAND,zone,{superType:SuperType.POKEMON},{min:options.optional?0:1,max:1,allowCancel:false,blocked:zone.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{
    if(!chosen?.length)return done();
    store.prompt(state,new SelectPrompt(player.id,GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,slots.map((s:any)=>'Bench '+(s.index+1)),{allowCancel:false}),(index:any)=>{
      placePokemonAsBasic(store,state,player,zone,chosen[0],slots[index].list);
      if(store.hasPrompts())store.waitPrompt(state,done);else done();
    });
  });
}

export function placePokemonAsBasic(store: any, state: any, player: any, zone: any, card: any, target: any): any {
  card._wotcTemporaryStage ??= {stage:card.stage};
  card.stage=Stage.BASIC;
  try {
    const effect=zone===player.deck?new PlayPokemonFromDeckEffect(player,card,target):zone===player.discard?new PlayPokemonFromDiscardEffect(player,card,target):new PlayPokemonEffect(player,card,target);
    return store.reduceEffect(state,effect);
  } catch(error) {
    if(!target.cards.includes(card)){card.stage=card._wotcTemporaryStage.stage;delete card._wotcTemporaryStage;}
    throw error;
  }
}
