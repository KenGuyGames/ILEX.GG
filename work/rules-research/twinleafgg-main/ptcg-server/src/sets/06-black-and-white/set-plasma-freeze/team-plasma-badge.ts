import { TrainerCard } from '../../../game/store/card/trainer-card';
import { TrainerType, CardTag } from '../../../game/store/card/card-types';
import { PlayerType, StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckTableStateEffect } from '../../../game/store/effects/check-effects';
import { TrainerEffect } from '../../../game/store/effects/play-card-effects';
import { IS_TOOL_BLOCKED } from '../../../game/store/prefabs/prefabs';
import { PokemonCard } from '../../../game/store/card/pokemon-card';

export class TeamPlasmaBadge extends TrainerCard {
  protected _trainerType: TrainerType = TrainerType.TOOL;
  protected _tags = [CardTag.TEAM_PLASMA];
  public set: string = 'PLF';
  public setNumber: string = '104';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Team Plasma Badge';
  public fullName: string = 'Team Plasma Badge PLF';
  public text: string = 'The Pokémon this card is attached to is a Team Plasma Pokémon.';

  private injectedTeamPlasmaTags: { [id: number]: PokemonCard } = {};

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Team Plasma membership is reconciled by bwEnvironment across all zones.
    return state;
  }
}
