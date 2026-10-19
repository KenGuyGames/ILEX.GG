import { CardList, ChooseCardsPrompt, GameError, GameMessage, OrderCardsPrompt, SelectPrompt } from '../../../game';
import { TrainerType } from '../../../game/store/card/card-types';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { Effect } from '../../../game/store/effects/effect';
import { TrainerEffect } from '../../../game/store/effects/play-card-effects';
import { State } from '../../../game/store/state/state';
import { StoreLike } from '../../../game/store/store-like';
import { MOVE_CARDS } from '../../../game/store/prefabs/prefabs';

export class PuzzleOfTime extends TrainerCard {
  protected _trainerType: TrainerType = TrainerType.ITEM;
  public set: string = 'BKP';
  public name: string = 'Puzzle of Time';
  public fullName: string = 'Puzzle of Time BKP';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '109';
  public text: string = 'You may play 2 Puzzle of Time cards at once.\n\n' +
    '• If you played 1 card, look at the top 3 cards of your deck and put them back in any order.\n' +
    '• If you played 2 cards, put 2 cards from your discard pile into your hand.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (!(effect instanceof TrainerEffect) || effect.trainerCard !== this) return state;
    const player = effect.player;
    const second = player.hand.cards.find(c => c !== this && c.name === this.name);
    const canOrder = player.deck.cards.length > 0;
    const canRecover = !!second && player.discard.cards.length > 0;
    if (!canOrder && !canRecover) throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
    return store.prompt(state, new SelectPrompt(player.id, GameMessage.CHOOSE_OPTION, [
      'Play 1 Puzzle of Time: reorder the top 3 cards of your deck',
      'Play 2 Puzzle of Time: recover 2 cards from your discard pile'
    ], { allowCancel: false, disabled: [!canOrder, !canRecover] } as any), choice => {
      if (choice === 0) {
        if (!canOrder) throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
        const top = new CardList();
        MOVE_CARDS(store, state, player.deck, top, { count: Math.min(3, player.deck.cards.length), sourceCard: this, sourceEffect: effect });
        return store.prompt(state, new OrderCardsPrompt(player.id, GameMessage.CHOOSE_CARDS_ORDER, top, { allowCancel: false }), order => {
          if (order !== null) { top.applyOrder(order); top.moveToTopOfDestination(player.deck); }
        });
      }
      if (!canRecover || !second) throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      // Both played copies remain in the play zone until their joint effect resolves.
      MOVE_CARDS(store, state, player.hand, player.supporter, { cards: [second], sourceCard: this, sourceEffect: effect });
      const count = Math.min(2, player.discard.cards.length);
      return store.prompt(state, new ChooseCardsPrompt(player, GameMessage.CHOOSE_CARD_TO_HAND, player.discard, {}, { min: count, max: count, allowCancel: false }), cards => {
        MOVE_CARDS(store, state, player.discard, player.hand, { cards: cards || [], sourceCard: this, sourceEffect: effect });
        MOVE_CARDS(store, state, player.supporter, player.discard, { cards: [second], sourceCard: this, sourceEffect: effect });
      });
    });
  }
}
