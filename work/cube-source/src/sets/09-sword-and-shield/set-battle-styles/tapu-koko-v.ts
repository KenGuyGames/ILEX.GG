import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State, StateUtils, PlayerType } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';

import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class TapuKokoV extends PokemonCard {
  protected _tags = [CardTag.POKEMON_V];

  public regulationMark = 'E';

  public stage: Stage = Stage.BASIC;

  public cardType: CardType[] = [CardType.LIGHTNING];

  public hp: number = 210;

  public weakness = [{ type: CardType.FIGHTING }];

  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Electro Ball',
      cost: [CardType.LIGHTNING],
      damage: 40,
      text: '',
    },
    {
      name: 'Spiral Thunder',
      cost: [L, L, C],
      damage: 20,
      damageCalculation: '+',
      text:
        'This attack does 40 more damage for each Energy' +
        "attached to all of your opponent's Pokémon.",
    },
  ];

  public set: string = 'BST';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '50';

  public name: string = 'Tapu Koko V';

  public fullName: string = 'Tapu Koko V BST';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      let energyCount = 0;
      opponent.forEachPokemon(PlayerType.TOP_PLAYER, (list) => {
        const check = new CheckProvidedEnergyEffect(opponent, list);
        store.reduceEffect(state, check);
        energyCount += check.energyMap.reduce((sum, entry) => sum + StateUtils.getProvidesUnitCount(entry.provides, entry), 0);
      });

      effect.damage = effect.attack.damage + energyCount * 40;
    }
    return state;
  }
}
