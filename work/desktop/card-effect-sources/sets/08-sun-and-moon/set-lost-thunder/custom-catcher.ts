import { ChoosePokemonPrompt, SelectPrompt, PlayerType, SlotType, StateUtils } from '../../../game';
import { GameError } from '../../../game/game-error';
import { GameMessage } from '../../../game/game-message';
import { TrainerType } from '../../../game/store/card/card-types';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { Effect } from '../../../game/store/effects/effect';
import { TrainerEffect } from '../../../game/store/effects/play-card-effects';
import { State } from '../../../game/store/state/state';
import { StoreLike } from '../../../game/store/store-like';
import { MOVE_CARDS, DRAW_CARDS } from '../../../game/store/prefabs/prefabs';

export class CustomCatcher extends TrainerCard {
  protected _trainerType: TrainerType = TrainerType.ITEM;
  public set: string = 'LOT';
  public name: string = 'Custom Catcher';
  public fullName: string = 'Custom Catcher LOT';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '171';
  public text: string = `You may play 2 Custom Catcher cards at once.

  • If you played 1 card, draw cards until you have 3 cards in your hand.
  • If you played 2 cards, switch 1 of your opponent's Benched Pokémon with their Active Pokémon. (This effect works one time for 2 cards.)`;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (!(effect instanceof TrainerEffect) || effect.trainerCard !== this) return state;
    const player = effect.player;
    const opponent = StateUtils.getOpponent(state, player);
    // The played copy has already moved from the hand into the play zone.
    const copies = player.hand.cards.filter(c => c !== this && c.name === this.name);
    const canDraw = player.hand.cards.filter(c => c !== this).length < 3 && player.deck.cards.length > 0;
    const canPair = copies.length > 0 && opponent.bench.some(list => !!list.getPokemonCard());
    if (!canDraw && !canPair) throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);

    const draw = () => {
      DRAW_CARDS(store, state, player, Math.max(0, 3 - player.hand.cards.length));
      return state;
    };
    if (!canPair) return draw();

    return store.prompt(state, new SelectPrompt(player.id, GameMessage.CHOOSE_OPTION, [
      'Play 1 Custom Catcher: draw until you have 3 cards',
      "Play 2 Custom Catcher: switch your opponent's Active Pokémon"
    ], { allowCancel: false, disabled: [!canDraw, false] } as any), choice => {
      if (choice === 0) return draw();
      // Both printings count as the same card; commit exactly one extra copy.
      const second = copies[0];
      MOVE_CARDS(store, state, player.hand, player.supporter, { cards: [second], sourceCard: this, sourceEffect: effect });
      return store.prompt(state, new ChoosePokemonPrompt(player.id,
        GameMessage.CHOOSE_POKEMON_TO_SWITCH, PlayerType.TOP_PLAYER,
        [SlotType.BENCH], { allowCancel: false }), targets => {
        if (targets?.length) opponent.switchPokemon(targets[0], store, state);
        MOVE_CARDS(store, state, player.supporter, player.discard, { cards: [second], sourceCard: this, sourceEffect: effect });
      });
    });
  }
}
