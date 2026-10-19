import { mirrorMove as labMirror } from '../../tcg-lab-mirror';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../game/store/card/card-types';
import { StoreLike, State, StateUtils } from '../../game';
import { Effect } from '../../game/store/effects/effect';

import { AbstractAttackEffect } from '../../game/store/effects/attack-effects';
import { EndTurnEffect } from '../../game/store/effects/game-phase-effects';
import { WAS_ATTACK_USED } from '../../game/store/prefabs/prefabs';

export class Spearow extends PokemonCard {

  public stage: Stage = Stage.BASIC;

  public cardType: CardType[] = [CardType.COLORLESS];

  public hp: number = 50;

  public weakness = [{ type: CardType.LIGHTNING }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [];

  public attacks =
    [
      {
        name: 'Peck',
        cost: [CardType.COLORLESS],
        damage: 10,
        text: ''
      },
      {
        name: 'Mirror Move',
        cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
        damage: 0,
        text: 'If Spearow was attacked last turn, do the final result of that attack on Spearow to the Defending Pokémon.'
      }
    ];

  public set: string = 'JU';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '62';

  public name: string = 'Spearow';

  public fullName: string = 'Spearow JU';

  private mirrorMoveEffects: AbstractAttackEffect[] = [];

  public reduceEffect(store: StoreLike,state: State,effect: Effect): State { 
    return labMirror(store,state,effect,this);
  }
}
