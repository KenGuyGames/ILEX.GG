import { AfterDamageEffect as LabAfterDamage } from '../../game/store/effects/attack-effects';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { Stage, CardType, SpecialCondition } from '../../game/store/card/card-types';
import { StoreLike, State } from '../../game';
import { Effect } from '../../game/store/effects/effect';
import { HealEffect } from '../../game/store/effects/game-effects';
import { AddSpecialConditionsEffect, DealDamageEffect } from '../../game/store/effects/attack-effects';
import { WAS_ATTACK_USED } from '../../game/store/prefabs/prefabs';

export class Exeggcute extends PokemonCard {

  public stage: Stage = Stage.BASIC;

  public cardType: CardType[] = [CardType.GRASS];

  public hp: number = 50;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS];

  public attacks = [{
    name: 'Hypnosis',
    cost: [CardType.PSYCHIC],
    damage: 0,
    text: 'The Defending Pokémon is now Asleep.'
  },
  {
    name: 'Leech Seed',
    cost: [CardType.GRASS, CardType.GRASS],
    damage: 20,
    text: 'Unless all damage from this attack is prevented, you may remove 1 damage counter from Exeggcute.'
  }];

  public set: string = 'JU';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '52';

  public name: string = 'Exeggcute';

  public fullName: string = 'Exeggcute JU';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // TCG Lab actual drain
    if (effect instanceof LabAfterDamage && effect.attack === this.attacks[1] && effect.source?.getPokemonCard() === this && effect.target === effect.opponent.active && effect.damage > 0) {
      store.reduceEffect(state,new HealEffect(effect.player,effect.source,10));
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const specialConditionEffect = new AddSpecialConditionsEffect(effect, [SpecialCondition.ASLEEP]);
      store.reduceEffect(state, specialConditionEffect);
    }

    

    return state;
  }
}