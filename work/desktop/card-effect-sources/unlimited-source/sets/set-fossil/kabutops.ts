import { AfterDamageEffect as LabAfterDamage } from '../../game/store/effects/attack-effects';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../game/store/card/card-types';
import { StoreLike } from '../../game/store/store-like';
import { State } from '../../game/store/state/state';
import { HealEffect } from '../../game/store/effects/game-effects';
import { Effect } from '../../game/store/effects/effect';
import { DealDamageEffect } from '../../game/store/effects/attack-effects';
import { WAS_ATTACK_USED } from '../../game/store/prefabs/prefabs';

export class Kabutops extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Kabuto';
  public cardType: CardType[] = [CardType.FIGHTING];
  public hp: number = 60;
  public weakness = [{ type: G }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public attacks = [
    {
      name: 'Sharp Sickle',
      cost: [CardType.FIGHTING, CardType.FIGHTING],
      damage: 30,
      text: ''
    },
    {
      name: 'Absorb',
      cost: [CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING],
      damage: 40,
      text: 'Remove a number of damage counters from Kabutops equal to half the damage done to the Defending Pokémon (after applying Weakness and Resistance) (rounded up to the nearest 10). If Kabutops has fewer damage counters than that, remove all of them.'
    }
  ];

  public set: string = 'FO';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '9';

  public name: string = 'Kabutops';

  public fullName: string = 'Kabutops FO';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // TCG Lab actual drain
    if (effect instanceof LabAfterDamage && effect.attack === this.attacks[1] && effect.source?.getPokemonCard() === this && effect.target === effect.opponent.active && effect.damage > 0) {
      store.reduceEffect(state,new HealEffect(effect.player,effect.source,Math.ceil(effect.damage / 20) * 10));
    }
    
    return state;
  }
}
