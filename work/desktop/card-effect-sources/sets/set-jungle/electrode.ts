import { PokemonCard } from '../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../game/store/card/card-types';
import { StoreLike, State, PlayerType, StateUtils } from '../../game';
import { Effect } from '../../game/store/effects/effect';

import { PutDamageEffect } from '../../game/store/effects/attack-effects';
import { WAS_ATTACK_USED } from '../../game/store/prefabs/prefabs';

export class Electrode extends PokemonCard {

  public stage: Stage = Stage.STAGE_1;

  public evolevesFrom = 'Voltorb';

  public cardType: CardType[] = [L];

  public hp: number = 90;

  public weakness = [{ type: F }];

  public retreat = [C];

  public attacks = [
    {
      name: 'Tackle',
      cost: [C, C],
      damage: 20,
      text: ''
    },
    {
      name: 'Chain Lightning',
      cost: [L, L, L],
      damage: 20,
      text: 'If the Defending Pokémon isn\'t Colorless, this attack does 10 damage to each Benched Pokémon of the same type as the Defending Pokémon (including your own).'
    },
  ];

  public set: string = 'JU';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '2';

  public name: string = 'Electrode';

  public fullName: string = 'Electrode JU';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const types=effect.opponent.active.getPokemonCard()?.cardType || [];
      if(types.includes(CardType.COLORLESS))return state;
      for(const owner of [effect.player,effect.opponent])for(const target of owner.bench){
        const card=target.getPokemonCard();if(card && card.cardType.some(t=>types.includes(t))){const damage=new PutDamageEffect(effect,10);damage.target=target;store.reduceEffect(state,damage);}
      }
    }

    return state;
  }

}