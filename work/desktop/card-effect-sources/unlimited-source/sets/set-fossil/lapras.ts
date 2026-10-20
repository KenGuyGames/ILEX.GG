import { CheckProvidedEnergyEffect as LabWaterEnergy } from '../../game/store/effects/check-effects';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { Stage, CardType, SpecialCondition } from '../../game/store/card/card-types';
import { StoreLike, State } from '../../game';
import { Effect } from '../../game/store/effects/effect';

import { CheckAttackCostEffect, CheckProvidedEnergyEffect } from '../../game/store/effects/check-effects';
import { AddSpecialConditionsEffect } from '../../game/store/effects/attack-effects';
import { WAS_ATTACK_USED, COIN_FLIP_PROMPT } from '../../game/store/prefabs/prefabs';

export class Lapras extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 80;
  public weakness = [{ type: L }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Water Gun',
    cost: [W],
    damage: 10,
    text: 'Does 10 damage plus 10 more damage for each [W] Energy attached to Lapras but not used to pay for this attack\'s Energy cost. You can\'t add more than 20 damage in this way.'
  }, {
    name: 'Confuse Ray',
    cost: [W, W],
    damage: 10,
    text: 'Flip a coin. If heads, the Defending Pokémon is now Confused.'
  }];

  public set: string = 'FO';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '10';
  public name: string = 'Lapras';
  public fullName: string = 'Lapras FO';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      // TCG Lab surplus Water: other types can cover the Colorless portion.
      const energy = new LabWaterEnergy(effect.player,effect.source);store.reduceEffect(state,energy);
      const units = energy.energyMap.flatMap(e => e.provides);
      const water = units.filter(t => t === CardType.WATER || t === CardType.ANY).length;
      const other = units.length - water;
      const typedCost = effect.attack.cost.filter(t => t === CardType.WATER).length;
      const colorlessCost = effect.attack.cost.filter(t => t === CardType.COLORLESS).length;
      effect.damage += 10 * Math.min(2,Math.max(0,water - typedCost - Math.max(0,colorlessCost-other)));
      return state;
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      return COIN_FLIP_PROMPT(store, state, player, result => {
        if (result === true) {
          const addSpecialCondition = new AddSpecialConditionsEffect(effect, [SpecialCondition.CONFUSED]);
          store.reduceEffect(state, addSpecialCondition);
        }
      });
      return state;
    }
    return state;
  }
}