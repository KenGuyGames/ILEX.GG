import { Card } from '../../../game/store/card/card';
import { CardType, EnergyType } from '../../../game/store/card/card-types';
import { BetweenTurnsEffect } from '../../../game/store/effects/game-phase-effects';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { StoreLike } from '../../../game/store/store-like';
import { State, GamePhase } from '../../../game/store/state/state';
import { Effect } from '../../../game/store/effects/effect';
import { KnockOutEffect } from '../../../game/store/effects/game-effects';
import { IS_SPECIAL_ENERGY_BLOCKED, MOVE_CARDS } from '../../../game/store/prefabs/prefabs';

export class RescueEnergy extends EnergyCard {

  public provides: CardType[] = [CardType.COLORLESS];

  public energyType = EnergyType.SPECIAL;

  public set: string = 'TM';

  public name = 'Rescue Energy';

  public fullName = 'Rescue Energy TM';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '90';

  public readonly RESCUE_ENERGY_MAREKER = 'RESCUE_ENERGY_MAREKER';

  public text =
    'Rescue Energy provides [C] Energy. If the Pokemon this card is attached ' +
    'to is Knocked Out by damage from an attack, put that Pokemon back into ' +
    'your hand. (Discard all cards attached to that Pokemon.)';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (effect instanceof KnockOutEffect && effect.target.cards.includes(this)) {
      const lethal=(effect.target as any)._exLethalAttackDamage;
      if (state.phase===GamePhase.ATTACK && lethal?.turn===state.turn && lethal.card===effect.target.getPokemonCard()
        && !IS_SPECIAL_ENERGY_BLOCKED(store,state,effect.player,this,effect.target)) (effect as any)._hgssRescue=true;
    }

    return state;
  }

}
