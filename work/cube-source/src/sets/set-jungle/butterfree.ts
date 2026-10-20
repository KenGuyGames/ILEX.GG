import { AfterDamageEffect as LabAfterDamage } from '../../game/store/effects/attack-effects';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../game/store/card/card-types';
import { StoreLike, State, StateUtils, ChoosePokemonPrompt, GameMessage, PlayerType, SlotType } from '../../game';
import { Effect } from '../../game/store/effects/effect';
import { HealEffect } from '../../game/store/effects/game-effects';
import { AfterDamageEffect, DealDamageEffect } from '../../game/store/effects/attack-effects';
import { EndTurnEffect } from '../../game/store/effects/game-phase-effects';
import { WAS_ATTACK_USED } from '../../game/store/prefabs/prefabs';

export class Butterfree extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;

  public cardType: CardType[] = [CardType.GRASS];

  public hp: number = 70;

  public weakness = [{ type: CardType.FIRE }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public evolvesFrom = 'Metapod';

  public attacks = [{
    name: 'Whirlwind',
    cost: [CardType.COLORLESS, CardType.COLORLESS],
    damage: 20,
    text: 'If your opponent has any Benched Pokémon, he or she chooses 1 of them and switches it with the Defending Pokémon. (Do the damage before switching the Pokémon.)'
  },
  {
    name: 'Mega Drain',
    cost: [CardType.GRASS, CardType.GRASS, CardType.GRASS, CardType.GRASS],
    damage: 40,
    text: 'Remove a number of damage counters from Butterfree equal to half the damage done to the Defending Pokémon (after applying Weakness and Resistance) (rounded up to the nearest 10).'
  }];

  public set: string = 'JU';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '33';

  public name: string = 'Butterfree';

  public fullName: string = 'Butterfree JU';

  public USED_WHIRLWIND: boolean = false;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // TCG Lab actual drain
    if (effect instanceof LabAfterDamage && effect.attack === this.attacks[1] && effect.source?.getPokemonCard() === this && effect.target === effect.opponent.active && effect.damage > 0) {
      store.reduceEffect(state,new HealEffect(effect.player,effect.source,Math.ceil(effect.damage / 20) * 10));
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      this.USED_WHIRLWIND = true;
    }

    if (effect instanceof AfterDamageEffect && effect.attack === this.attacks[0] && effect.source?.getPokemonCard() === this && effect.target === effect.opponent.active) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
      const hasBench = opponent.bench.some(b => b.cards.length > 0);

      if (hasBench === false) {
        return state;
      }

      return store.prompt(state, new ChoosePokemonPrompt(
        opponent.id,
        GameMessage.CHOOSE_POKEMON_TO_SWITCH,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { allowCancel: false }
      ), targets => {
        if (targets && targets.length > 0) {
          opponent.active.clearEffects();
          opponent.switchPokemon(targets[0]);
          return state;
        }
      });
    }

    if (effect instanceof EndTurnEffect && this.USED_WHIRLWIND == true) {
      this.USED_WHIRLWIND = false;
    }

    

    return state;
  }

}