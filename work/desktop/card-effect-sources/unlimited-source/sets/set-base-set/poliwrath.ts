import { CheckProvidedEnergyEffect as LabWaterEnergy } from '../../game/store/effects/check-effects';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType } from '../../game/store/card/card-types';
import { Attack } from '../../game/store/card/pokemon-types';
import { CheckAttackCostEffect, CheckProvidedEnergyEffect } from '../../game/store/effects/check-effects';

import { Effect } from '../../game/store/effects/effect';
import { State } from '../../game/store/state/state';
import { StoreLike } from '../../game/store/store-like';
import { Card, ChooseCardsPrompt, GameMessage, StateUtils } from '../../game';
import { DiscardCardsEffect } from '../../game/store/effects/attack-effects';
import { WAS_ATTACK_USED } from '../../game/store/prefabs/prefabs';

export class Poliwrath extends PokemonCard {

  public name = 'Poliwrath';

  public set = 'BS';

  public fullName = 'Poliwrath BS';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '13';

  public stage: Stage = Stage.STAGE_2;

  public cardType: CardType[] = [CardType.WATER];

  public hp: number = 90;

  public weakness = [{ type: CardType.GRASS }];

  public retreat: CardType[] = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public attacks: Attack[] = [
    {
      name: 'Water Gun',
      cost: [CardType.WATER, CardType.WATER, CardType.COLORLESS],
      damage: 30,
      text: 'Does 30 damage plus 10 more damage for each [W] Energy attached to Poliwrath but not used to pay for this attack\'s Energy cost. Extra [W] Energy after the 2nd doesn\'t count.'
    },
    {
      name: 'Whirlpool',
      cost: [CardType.WATER, CardType.WATER, CardType.COLORLESS, CardType.COLORLESS],
      damage: 40,
      text: 'If the Defending Pokémon has any Energy cards attached to it, choose 1 of them and discard it.'
    }
  ];

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
      const opponent = StateUtils.getOpponent(state, player);
      const activeCardList = opponent.active;
      const activePokemonCard = activeCardList.getPokemonCard();

      let hasPokemonWithEnergy = false;

      if (activePokemonCard && activeCardList.cards.some(c => c.superType === SuperType.ENERGY)) {
        hasPokemonWithEnergy = true;
      }

      if (!hasPokemonWithEnergy) {
        return state;
      }

      let cards: Card[] = [];
      state = store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_DISCARD,
        opponent.active,
        { superType: SuperType.ENERGY },
        { min: 1, max: 1, allowCancel: false },
      ), selected => {
        cards = selected || [];
      });
      const discardEnergy = new DiscardCardsEffect(effect, cards);
      return store.reduceEffect(state, discardEnergy);
    }

    return state;

  }

}