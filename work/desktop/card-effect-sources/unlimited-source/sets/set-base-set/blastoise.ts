import { CheckProvidedEnergyEffect as LabWaterEnergy } from '../../game/store/effects/check-effects';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType, SuperType } from '../../game/store/card/card-types';
import { PowerType, StoreLike, State, StateUtils, GameError, GameMessage, EnergyCard, PlayerType, SlotType } from '../../game';
import { Effect } from '../../game/store/effects/effect';

import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { AttachEnergyEffect } from '../../game/store/effects/play-card-effects';
import { CheckAttackCostEffect, CheckProvidedEnergyEffect } from '../../game/store/effects/check-effects';
import { BLOCK_IF_ASLEEP_CONFUSED_PARALYZED, WAS_ATTACK_USED, WAS_POWER_USED } from '../../game/store/prefabs/prefabs';

export class Blastoise extends PokemonCard {

  public stage: Stage = Stage.STAGE_2;

  public evolvesFrom = 'Wartortle';

  public cardType: CardType[] = [CardType.WATER];

  public hp: number = 100;

  public weakness = [{ type: CardType.LIGHTNING }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public powers = [{
    name: 'Rain Dance',
    useWhenInPlay: true,
    powerType: PowerType.POKEMON_POWER,
    text: 'As often as you like during your turn (before your attack), you may attach 1 [W] Energy card to 1 of your [W] Pokémon. (This doesn\'t use up your 1 Energy card attachment for the turn.) This power can\'t be used if Blastoise is Asleep, Confused, or Paralyzed.'
  }];

  public attacks = [
    {
      name: 'Hydro Pump',
      cost: [CardType.WATER, CardType.WATER, CardType.WATER],
      damage: 40,
      text: 'Does 40 damage plus 10 more damage for each [W] Energy attached to Blastoise but not used to pay for this attack\'s Energy cost. Extra [W] Energy after the 2nd doesn\'t count.'
    }
  ];

  public set: string = 'BS';

  public name: string = 'Blastoise';

  public fullName: string = 'Blastoise BS';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '2';

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

    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;

      BLOCK_IF_ASLEEP_CONFUSED_PARALYZED(player, this);

      const hasEnergyInHand = player.hand.cards.some(c => {
        return c instanceof EnergyCard
          && c.energyType === EnergyType.BASIC
          && c.provides.includes(CardType.WATER);
      });
      if (!hasEnergyInHand) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }

      return store.prompt(state, new AttachEnergyPrompt(
        player.id,
        GameMessage.ATTACH_ENERGY_CARDS,
        player.hand,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH, SlotType.ACTIVE],
        { superType: SuperType.ENERGY, energyType: EnergyType.BASIC, name: 'Water Energy' },
        { allowCancel: true }
      ), transfers => {
        transfers = transfers || [];
        for (const transfer of transfers) {
          const target = StateUtils.getTarget(state, player, transfer.to);
          const energyCard = transfer.card as EnergyCard;
          const attachEnergyEffect = new AttachEnergyEffect(player, energyCard, target);
          store.reduceEffect(state, attachEnergyEffect);
        }
      });
    }

    return state;
  }
}

