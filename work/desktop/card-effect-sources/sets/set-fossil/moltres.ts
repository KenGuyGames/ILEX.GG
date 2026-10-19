import { CheckProvidedEnergyEffect as LabFireEnergy } from '../../game/store/effects/check-effects';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType } from '../../game/store/card/card-types';
import { StoreLike } from '../../game/store/store-like';
import { State } from '../../game/store/state/state';

import { Effect } from '../../game/store/effects/effect';
import { ChooseCardsPrompt, GameMessage, StateUtils } from '../../game';
import { DiscardCardsEffect } from '../../game/store/effects/attack-effects';
import { MOVE_CARDS, WAS_ATTACK_USED, COIN_FLIP_PROMPT } from '../../game/store/prefabs/prefabs';

export class Moltres extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 70;
  public weakness = [];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Wildfire',
    cost: [R],
    damage: 0,
    text: 'You may discard any number of [R] Energy cards attached to Moltres when you use this attack. If you do, discard that many cards from the top of your opponent\'s deck.'
  }, {
    name: 'Dive Bomb',
    cost: [R, R, R, R],
    damage: 80,
    text: 'Flip a coin. If tails, this attack does nothing.'
  }];

  public set: string = 'FO';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '12';
  public name: string = 'Moltres';
  public fullName: string = 'Moltres FO';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const energy=new LabFireEnergy(effect.player);store.reduceEffect(state,energy);
      const eligible=energy.energyMap.filter(e=>e.provides.includes(CardType.FIRE)||e.provides.includes(CardType.ANY)).map(e=>e.card);
      const blocked=effect.player.active.cards.map((c,i)=>eligible.includes(c as any)?-1:i).filter(i=>i>=0);
      return store.prompt(state,new ChooseCardsPrompt(effect.player,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,effect.player.active,{superType:SuperType.ENERGY},{min:0,max:eligible.length,blocked,allowCancel:false}),cards=>{
        const discard=new DiscardCardsEffect(effect,cards||[]);discard.target=effect.player.active;store.reduceEffect(state,discard);
        if(cards?.length)MOVE_CARDS(store,state,effect.opponent.deck,effect.opponent.discard,{count:cards.length});
      });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      return COIN_FLIP_PROMPT(store, state, player, result => {
        if (result === false) {
          effect.damage = 0;
        }
      });
    }
    return state;
  }
}
