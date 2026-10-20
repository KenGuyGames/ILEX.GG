import { TrainerCard, TrainerType, StoreLike, State, GameMessage, PlayerType, SlotType, ChoosePokemonPrompt } from '../game';
import { Effect } from '../game/store/effects/effect';
import { TrainerEffect } from '../game/store/effects/play-card-effects';
import { DealDamageEffect } from '../game/store/effects/attack-effects';
import { EndTurnEffect } from '../game/store/effects/game-phase-effects';

/** CouncilCube custom card; Kenneth chose one-use Item lifecycle. */
export class CouncilXAttack extends TrainerCard {
  public trainerType = TrainerType.ITEM;
  public set = 'CKCC';
  public setNumber = '44142';
  public name = 'X Attack';
  public fullName = 'ILEX CouncilCube X Attack 44142';
  public cardImage = 'https://i.imgur.com/lfmkZ5a.jpeg';
  public text = "Choose 1 of your Pokemon in play. Until the end of this turn, that Pokemon’s attacks do 30 more damage to your opponent’s Active Pokemon (before applying Weakness and Resistance). This effect is removed if this Pokemon would evolve.";
  private readonly boost = 'COUNCIL_X_ATTACK_30';
  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      return store.prompt(state, new ChoosePokemonPrompt(effect.player.id,
        GameMessage.CHOOSE_POKEMON, PlayerType.BOTTOM_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH], { min: 1, max: 1, allowCancel: false }), targets => {
          if (targets?.length) targets[0].marker.addMarker(this.boost, this);
        });
    }
    if (effect instanceof DealDamageEffect && effect.damage > 0 &&
        effect.target === effect.opponent.active && effect.source.marker.hasMarker(this.boost, this)) effect.damage += 30;
    if (effect instanceof EndTurnEffect) {
      effect.player.forEachPokemon(PlayerType.BOTTOM_PLAYER, list => list.marker.removeMarker(this.boost, this));
    }
    return state;
  }
}
export const setCouncilCustoms = [new CouncilXAttack()];
