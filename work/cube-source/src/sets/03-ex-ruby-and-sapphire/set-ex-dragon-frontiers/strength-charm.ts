import { EndTurnEffect } from '../../../game/store/effects/game-phase-effects';
import { TrainerType } from '../../../game/store/card/card-types';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { PutDamageEffect, AfterDamageEffect } from '../../../game/store/effects/attack-effects';
import { Effect } from '../../../game/store/effects/effect';
import {IS_TOOL_BLOCKED, MOVE_CARDS } from '../../../game/store/prefabs/prefabs';
import { StateUtils } from '../../../game/store/state-utils';
import { State } from '../../../game/store/state/state';
import { StoreLike } from '../../../game/store/store-like';

export class StrengthCharm extends TrainerCard {
  protected _trainerType: TrainerType = TrainerType.TOOL;
  public set: string = 'DF';
  public name: string = 'Strength Charm';
  public fullName: string = 'Strength Charm DF';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '81';

  public text: string =
    'Whenever an attack from the Pokémon that Strength Charm is attached to does damage to the Active Pokémon, this attack does 10 more damage (after applying Weakness and Resistance). Discard Strength Charm at the end of the turn in which this happens.';

  private usedTurn = -1;
  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PutDamageEffect && effect.source.tools.includes(this) && effect.target === StateUtils.getOpponent(state, effect.player).active && effect.damage > 0 && !IS_TOOL_BLOCKED(store, state, effect.player, this)) {
      const cards = ((effect as any).strengthCharmCards ??= []);
      if (!cards.includes(this)) cards.push(this);
    }
    if (effect instanceof AfterDamageEffect && effect.source.tools.includes(this) && effect.target === StateUtils.getOpponent(state, effect.player).active && effect.damage > 0 && !IS_TOOL_BLOCKED(store, state, effect.player, this)) this.usedTurn = state.turn;
    if (effect instanceof EndTurnEffect && this.usedTurn === state.turn) {
      for (const list of [effect.player.active, ...effect.player.bench]) if (list.tools.includes(this)) MOVE_CARDS(store, state, list, effect.player.discard, {cards: [this], sourceCard: this});
    }
    return state;
  }
}
