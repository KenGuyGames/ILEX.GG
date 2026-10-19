import { PokemonCard, Stage, CardType, State, StoreLike, StateUtils, GamePhase } from '../../game';
import { Effect } from '../../game/store/effects/effect';
import { AfterDamageEffect } from '../../game/store/effects/attack-effects';
import { CheckHpEffect } from '../../game/store/effects/check-effects';
import { ADD_SLEEP_TO_PLAYER_ACTIVE, AFTER_ATTACK, COIN_FLIP_PROMPT, WAS_ATTACK_USED } from '../../game/store/prefabs/prefabs';
import { DISCARD_X_ENERGY_FROM_THIS_POKEMON } from '../../game/store/prefabs/costs';

export class Gastly extends PokemonCard {
  public name = 'Gastly';
  public fullName = 'Gastly BS';
  public set = 'BS';
  public setNumber = '50';
  public cardImage = 'assets/cardback.png';
  public stage = Stage.BASIC;
  public hp = 30;
  public cardType = [CardType.PSYCHIC];
  public resistance = [{ type: CardType.FIGHTING, value: -30 }];
  public attacks = [{ name: 'Sleeping Gas', cost: [CardType.PSYCHIC], damage: 0,
    text: 'Flip a coin. If heads, the Defending Pokémon is now Asleep.' },
  { name: 'Destiny Bond', cost: [CardType.PSYCHIC, CardType.COLORLESS], damage: 0,
    text: 'Discard 1 [P] Energy card attached to Gastly in order to use this attack. If a Pokémon Knocks Out Gastly during your opponent\'s next turn, Knock Out that Pokémon.' }];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (AFTER_ATTACK(effect, 0, this)) {
      return COIN_FLIP_PROMPT(store, state, effect.player, result => {
        if (result) ADD_SLEEP_TO_PLAYER_ACTIVE(store, state, StateUtils.getOpponent(state, effect.player), this);
      });
    }
    if (WAS_ATTACK_USED(effect, 1, this)) {
      DISCARD_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 1, CardType.PSYCHIC);
      effect.player.active.marker.addMarker('BASE_DESTINY_BOND', this);
      (effect.player.active as any).destinyBondTurn = state.turn + 1;
    }
    // AfterDamage observes actual damage, including prevention and reduction.
    // Mark the attacker lethal before the shared state check collects simultaneous KOs.
    if (effect instanceof AfterDamageEffect && state.phase === GamePhase.ATTACK
      && effect.target.getPokemonCard() === this
      && effect.target.marker.hasMarker('BASE_DESTINY_BOND', this)
      && (effect.target as any).destinyBondTurn === state.turn
      && StateUtils.findOwner(state, effect.target) !== effect.player) {
      const hp = new CheckHpEffect(StateUtils.findOwner(state, effect.target), effect.target);
      store.reduceEffect(state, hp);
      if (effect.target.damage >= hp.hp) {
        const attackerHp = new CheckHpEffect(effect.player, effect.source);
        store.reduceEffect(state, attackerHp);
        effect.source.damage = Math.max(effect.source.damage, attackerHp.hp);
      }
    }
    return state;
  }
}
