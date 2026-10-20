import { TrainerCard } from '../../../game/store/card/trainer-card';
import { TrainerType } from '../../../game/store/card/card-types';
import { StoreLike } from '../../../game/store/store-like';
import { State } from '../../../game/store/state/state';
import { Effect } from '../../../game/store/effects/effect';
import { ChoosePokemonPrompt } from '../../../game/store/prompts/choose-pokemon-prompt';
import { TrainerEffect } from '../../../game/store/effects/play-card-effects';
import { PlayerType, SlotType, StateUtils, GameError, GameMessage, CoinFlipPrompt } from '../../../game';
function* playCard(
  next: Function,
  store: StoreLike,
  state: State,
  self: PokemonCatcher,
  effect: TrainerEffect,
): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);
  const hasBench = opponent.bench.some((b) => b.cards.length > 0);

  if (!hasBench) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  // We will discard this card after prompt confirmation
  effect.preventDefault = true;

  yield store.prompt(
    state,
    new ChoosePokemonPrompt(
      player.id,
      GameMessage.CHOOSE_POKEMON_TO_SWITCH,
      PlayerType.TOP_PLAYER,
      [SlotType.BENCH],
      { allowCancel: false },
    ),
    (result) => {
      const cardList = result && result[0];
      if (cardList) {
        opponent.switchPokemon(cardList);
      }
    },
  );
}

export class PokemonCatcher extends TrainerCard {
  protected _trainerType: TrainerType = TrainerType.ITEM;
  public set: string = 'EPO';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '95';
  public name: string = 'Pokémon Catcher';
  public fullName: string = 'Pokemon Catcher EPO';
  public text: string = "Switch your opponent's Active Pokémon with 1 of their Benched Pokémon.";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      // XY introduced an erratum for all printings, including older BW copies.
      // Historical BW profiles preserve their original no-flip behavior.
      if ((state.rules as any).pokemonCatcherErrata) {
        const opponent=StateUtils.getOpponent(state,effect.player);
        if (!opponent.bench.some(b=>b.getPokemonCard())) throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
        return store.prompt(state,new CoinFlipPrompt(effect.player.id,GameMessage.COIN_FLIP),heads=>{
          if(heads){const generator=playCard(()=>generator.next(),store,state,this,effect);return generator.next().value;}
        });
      }
      const generator = playCard(() => generator.next(), store, state, this, effect);
      return generator.next().value;
    }
    return state;
  }
}
