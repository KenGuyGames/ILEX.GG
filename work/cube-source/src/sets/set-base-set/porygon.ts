import { PokemonCard } from '../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../game/store/card/card-types';
import { StoreLike, State, StateUtils, PokemonCardList, GameError, GameMessage, SelectPrompt } from '../../game';
import { Effect } from '../../game/store/effects/effect';

import { WAS_ATTACK_USED } from '../../game/store/prefabs/prefabs';

export class Porygon extends PokemonCard {

  public stage: Stage = Stage.BASIC;

  public cardType: CardType[] = [CardType.COLORLESS];

  public hp: number = 30;

  public weakness = [{ type: CardType.FIGHTING }];

  public resistance = [{ type: CardType.PSYCHIC, value: -30 }];

  public retreat = [C];

  public attacks = [{
    name: 'Conversion 1',
    cost: [CardType.COLORLESS],
    damage: 0,
    text: 'If the Defending Pokémon has a Weakness, you may change it to a type of your choice other than Colorless.'
  },
  {
    name: 'Conversion 2',
    cost: [CardType.COLORLESS, CardType.COLORLESS],
    damage: 0,
    text: 'Change Porygon\'s Resistance to a type of your choice other than Colorless.'
  }
  ];

  public set: string = 'BS';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '39';

  public name: string = 'Porygon';

  public fullName: string = 'Porygon BS';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
      const first=WAS_ATTACK_USED(effect,0,this), second=WAS_ATTACK_USED(effect,1,this);
      if(first || second){
        const target=first?effect.opponent.active:effect.player.active;
        if(first && !target.getPokemonCard()?.weakness.length)return state;
        const types=[CardType.FIRE,CardType.WATER,CardType.GRASS,CardType.LIGHTNING,CardType.PSYCHIC,CardType.FIGHTING];
        return store.prompt(state,new SelectPrompt(effect.player.id,GameMessage.CHOOSE_ENERGY_TYPE,['Fire','Water','Grass','Lightning','Psychic','Fighting'],{allowCancel:false}),choice=>{
          (target as any)[first?'labConversionWeakness':'labConversionResistance']=types[choice];
        });
      }
      return state;
    }
}