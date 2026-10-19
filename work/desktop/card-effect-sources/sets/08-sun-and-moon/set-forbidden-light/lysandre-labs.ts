import { Effect } from '../../../game/store/effects/effect';
import { State } from '../../../game/store/state/state';
import { StoreLike } from '../../../game/store/store-like';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { TrainerType } from '../../../game/store/card/card-types';
import { StateUtils } from '../../../game/store/state-utils';
import { ToolEffect } from '../../../game/store/effects/play-card-effects';
import { UseStadiumEffect } from '../../../game/store/effects/game-effects';
import { GameError } from '../../../game/game-error';
import { GameMessage } from '../../../game/game-message';
import { IS_STADIUM_EFFECT_BLOCKED } from '../../../game/store/prefabs/stadium-effect';

export class LysandreLabs extends TrainerCard {
  protected _trainerType: TrainerType = TrainerType.STADIUM;

  public set: string = 'FLI';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '111';

  public name: string = 'Lysandre Labs';

  public fullName: string = 'Lysandre Labs FLI';

  public text: string =
    "Pokémon Tool cards in play (both yours and your opponent's) have no effect.";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (StateUtils.getStadiumCard(state) !== this) return state;
    if (effect instanceof UseStadiumEffect) {
      throw new GameError(GameMessage.CANNOT_USE_STADIUM);
    }
    if (effect instanceof ToolEffect) {
      // Older Tool reducers sometimes probe with the attacker as effect.player.
      // Resolve the attached Tool's actual owner instead of trusting that field.
      for (const owner of state.players) {
        const target = [owner.active, ...owner.bench].find(list => list.tools.includes(effect.card));
        if (!target) continue;
        if (IS_STADIUM_EFFECT_BLOCKED(store, state, owner, target, this)) return state;
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
    }
    return state;
  }
}
