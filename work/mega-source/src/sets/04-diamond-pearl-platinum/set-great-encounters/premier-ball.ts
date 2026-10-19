import { SelectPrompt,ShowCardsPrompt } from '../../../game';
import { GameError, PokemonCard, SelectOptionPrompt } from '../../../game';
import { GameMessage } from '../../../game/game-message';
import { Card } from '../../../game/store/card/card';
import { CardTag, Stage, SuperType, TrainerType } from '../../../game/store/card/card-types';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { Effect } from '../../../game/store/effects/effect';
import { TrainerEffect } from '../../../game/store/effects/play-card-effects';
import {SHOW_CARDS_TO_PLAYER, SHUFFLE_DECK, MOVE_CARDS } from '../../../game/store/prefabs/prefabs';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import { State } from '../../../game/store/state/state';
import { StoreLike } from '../../../game/store/store-like';

export class PremierBall extends TrainerCard {
  protected _trainerType: TrainerType = TrainerType.ITEM;
  public set: string = 'GE';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '101';
  public name: string = 'Premier Ball';
  public fullName: string = 'Premier Ball GE';

  public text: string =
    'Search your deck or your discard pile for a Pokémon LV.X, show it to your opponent, and put it into your hand. If you search your deck, shuffle your deck afterward.';


  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (!(effect instanceof TrainerEffect) || effect.trainerCard !== this) return state;
    const player=effect.player,opponent=state.players.find(owner=>owner!==player)!;
    const isLevel=(card:any)=>card.superType===SuperType.POKEMON&&(card.stage===Stage.LV_X||card.hasTag(CardTag.POKEMON_LV_X));
    const options=[...(player.deck.cards.length?[player.deck]:[]),...(player.discard.cards.some(isLevel)?[player.discard]:[])];
    if(!options.length)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
    const search=(zone:any)=>store.prompt(state,new ChooseCardsPrompt(player,GameMessage.CHOOSE_CARD_TO_HAND,zone,{superType:SuperType.POKEMON,stage:Stage.LV_X},{min:zone===player.deck?0:1,max:1,allowCancel:false}),(selected:any)=>{
      const cards=selected||[];
      const finish=()=>{MOVE_CARDS(store,state,zone,player.hand,{cards,sourceCard:this,sourceEffect:effect});if(zone===player.deck)SHUFFLE_DECK(store,state,player);};
      if(cards.length)store.prompt(state,new ShowCardsPrompt(opponent.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,cards),finish);else finish();
    });
    if(options.length===1)return search(options[0]);
    return store.prompt(state,new SelectPrompt(player.id,GameMessage.CHOOSE_OPTION,['Search deck','Search discard pile'],{allowCancel:false}),(choice:number)=>search(options[choice]));
  }
}
