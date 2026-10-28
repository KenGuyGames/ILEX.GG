import { PowerType, StoreLike, State, CardType } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { PowerEffect } from '../../../game/store/effects/game-effects';
import { IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';
import { EnergySwitchPK } from '../../03-ex-ruby-and-sapphire/set-ex-power-keepers/other-prints';
import { GreatBall } from '../../03-ex-ruby-and-sapphire/set-ex-firered-leafgreen/great-ball';
import { Potion } from '../../set-base-set/potion';
import { Switch } from '../../set-base-set/switch';
import { Charmander } from '../../set-base-set/charmander';
import { Charmeleon } from '../../set-base-set/charmeleon';
import { Charizard } from '../../set-base-set/charizard';
import { CycloneEnergy } from '../../03-ex-ruby-and-sapphire/set-ex-power-keepers/cyclone-energy';
import { PremierBall } from '../set-great-encounters/premier-ball';
import { WarpEnergy } from '../../set-shining-legends/warp-energy';

export class CycloneEnergySF extends CycloneEnergy {
  public fullName = 'Cyclone Energy SF';
  public name = 'Cyclone Energy';
  public set = 'SF';
  public setNumber = '94';
  public text = 'Cyclone Energy provides [C] Energy. When you attach this card from your hand to your Active Pokémon, switch 1 of the Defending Pokémon with 1 of your opponent\'s Benched Pokémon. Your opponent chooses the Benched Pokémon to switch.';
}

export class PremierBallSF extends PremierBall {
  public fullName = 'Premier Ball SF';
  public name = 'Premier Ball';
  public set = 'SF';
  public setNumber = '91';
}

export class WarpEnergySF extends WarpEnergy {
  public fullName = 'Warp Energy SF';
  public name = 'Warp Energy';
  public set = 'SF';
  public setNumber = '95';
  public text = 'Warp Energy provides [C] Energy. When you attach this card from your hand to your Active Pokémon, switch that Pokémon with 1 of your Benched Pokémon.';
}
export class EnergySwitchPKSF extends EnergySwitchPK {
  public setNumber = '84';
  public fullName: string = 'Energy Switch SF';
  public set = 'SF';
}

export class GreatBallSF extends GreatBall {
  public setNumber = '85';
  public fullName: string = 'Great Ball SF';
  public set = 'SF';
}

export class PotionSF extends Potion {
  public setNumber = '92';
  public fullName: string = 'Potion SF';
  public set = 'SF';
}

export class SwitchSF extends Switch {
  public setNumber = '93';
  public fullName: string = 'Switch SF';
  public set = 'SF';
}

export class CharmanderSF extends Charmander {
  public setNumber = '101';
  public fullName: string = 'Charmander SF';
  public set = 'SF';
}

export class CharmeleonSF extends Charmeleon {
  public setNumber = '102';
  public fullName: string = 'Charmeleon SF';
  public set = 'SF';
}

export class CharizardSF extends Charizard {
  public powers = [{name: 'Energy Burn', powerType: PowerType.POKEBODY, text: 'All Energy attached to Charizard are Fire Energy instead of their usual type.'}];
  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckProvidedEnergyEffect && effect.source.getPokemonCard() === this && !IS_ABILITY_BLOCKED(store, state, effect.player, this, this.powers[0])) {
      for (const energy of [...effect.source.cards, ...effect.source.energies.cards]) {
        if ((energy as any).provides && !effect.energyMap.some(entry => entry.card === energy)) effect.energyMap.push({card: energy as any, provides: (energy as any).provides});
      }
      effect.energyMap.forEach(entry => { entry.provides = entry.provides.map(() => CardType.FIRE); });
    }
    // Fire Spin is shared; the original activated Energy Burn is replaced by this Body.
    if (!(effect instanceof PowerEffect)) return super.reduceEffect(store, state, effect);
    return state;
  }
  public setNumber = '103';
  public fullName: string = 'Charizard SF';
  public set = 'SF';
}
