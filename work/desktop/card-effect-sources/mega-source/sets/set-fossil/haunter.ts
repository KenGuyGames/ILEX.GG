import { PokemonCard } from '../../game/store/card/pokemon-card';
import { Stage, CardType, SpecialCondition } from '../../game/store/card/card-types';
import { StoreLike } from '../../game/store/store-like';
import { GamePhase, State } from '../../game/store/state/state';
import { Effect } from '../../game/store/effects/effect';
import { PowerType } from '../../game';
import { AddSpecialConditionsEffect, PutDamageEffect } from '../../game/store/effects/attack-effects';
import { CoinFlipEffect } from '../../game/store/effects/play-card-effects';
import { IS_POKEMON_POWER_BLOCKED, WAS_ATTACK_USED } from '../../game/store/prefabs/prefabs';

export class Haunter extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Gastly';
  public cardType: CardType[] = [P];
  public hp: number = 50;
  public weakness = [];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [];

  public powers = [{
    name: 'Transparency',
    powerType: PowerType.POKEMON_POWER,
    text: 'Whenever an attack does anything to Haunter, flip a coin. If heads, prevent all effects of that attack, including damage, done to Haunter. This power stops working while Haunter is Asleep, Confused, or Paralyzed.'
  }];

  public attacks = [{
    name: 'Nightmare',
    cost: [P, C],
    damage: 10,
    text: 'The Defending Pokémon is now Asleep.'
  }];

  public set: string = 'FO';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '6';
  public name: string = 'Haunter';
  public fullName: string = 'Haunter FO';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // One Transparency flip protects against the entire attack, including
    // damage-free status attacks. Do not flip again for each subeffect.
    const targeted = effect as any;
    if (targeted.attackEffect && targeted.target?.getPokemonCard() === this && state.phase === GamePhase.ATTACK
      && !['APPLY_WEAKNESS_EFFECT','AFTER_DAMAGE_EFFECT','AFTER_WEAKNESS_AND_RESISTANCE_EFFECT'].includes(effect.type)) {
      const slot = targeted.target;
      if (!slot.specialConditions.some((c:SpecialCondition) => [SpecialCondition.ASLEEP,SpecialCondition.CONFUSED,SpecialCondition.PARALYZED].includes(c))
        && !IS_POKEMON_POWER_BLOCKED(store,state,targeted.player,this)) {
        if ((slot as any).transparencyTurn !== state.turn) {
          const coin = new CoinFlipEffect(targeted.player); store.reduceEffect(state,coin);
          (slot as any).transparencyTurn = state.turn;
          (slot as any).transparencyPrevent = coin.result;
        }
        if ((slot as any).transparencyPrevent) targeted.preventDefault = true;
      }
    }
    // Nightmare
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const sleepEffect = new AddSpecialConditionsEffect(effect, [SpecialCondition.ASLEEP]);
      store.reduceEffect(state, sleepEffect);
      return state;
    }

    return state;
  }
}