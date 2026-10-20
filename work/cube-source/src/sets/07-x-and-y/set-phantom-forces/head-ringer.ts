import { TrainerCard, TrainerType, CardTag, CardType, Player, PlayerType, StateUtils, State, StoreLike, GameError, GameMessage } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { AttachPokemonToolEffect } from '../../../game/store/effects/play-card-effects';
import { CheckAttackCostEffect } from '../../../game/store/effects/check-effects';
import { IS_TOOL_BLOCKED } from '../../../game/store/prefabs/prefabs';
export class HeadRinger extends TrainerCard {
  protected _trainerType = TrainerType.TOOL;
  public attachesToOpponentsPokemon = true;
  public set='PHF';public setNumber='97';public cardImage='assets/cardback.png';
  public name='Head Ringer';public fullName='Head Ringer Team Flare Hyper Gear PHF';
  public text="Attach this Pokémon Tool to 1 of your opponent's Pokémon-EX that doesn't already have a Pokémon Tool attached to it. The attacks of the Pokémon this card is attached to cost [C] more. When this card is removed from a Pokémon for any reason, put this card in its owner's discard pile.";
  public canPlay(store:StoreLike,state:State,player:Player):boolean {const opponent=StateUtils.getOpponent(state,player);return [opponent.active,...opponent.bench].some(list=>list.getPokemonCard()?.tags.includes(CardTag.POKEMON_EX)&&list.tools.length===0);}
  public reduceEffect(store:StoreLike,state:State,effect:Effect):State {
    if(effect instanceof AttachPokemonToolEffect&&effect.trainerCard===this){const owner=StateUtils.findOwner(state,effect.target);if(owner===effect.player||!effect.target.getPokemonCard()?.tags.includes(CardTag.POKEMON_EX)||effect.target.tools.length)throw new GameError(GameMessage.INVALID_TARGET);}
    // Add [C] to attack costs of the Pokemon this is attached to
    if (effect instanceof CheckAttackCostEffect) {
      const player = effect.player;

      // Check if this card is attached to the attacking Pokemon
      if (!effect.source.tools.includes(this)) {
        return state;
      }

      if (IS_TOOL_BLOCKED(store, state, player, this)) {
        return state;
      }

      effect.cost.push(CardType.COLORLESS);
    }

    return state;
  }
}
