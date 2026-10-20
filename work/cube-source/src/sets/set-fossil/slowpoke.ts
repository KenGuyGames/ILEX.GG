import { COIN_FLIP_PROMPT as LabFlip } from '../../game/store/prefabs/prefabs';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { Stage, CardType, TrainerType, SuperType } from '../../game/store/card/card-types';
import { StoreLike, State, Card, ChooseEnergyPrompt, GameMessage, StateUtils, TrainerCard, ChooseCardsPrompt, ShowCardsPrompt, GameError } from '../../game';
import { Effect } from '../../game/store/effects/effect';
import { DiscardCardsEffect } from '../../game/store/effects/attack-effects';
import { CheckProvidedEnergyEffect } from '../../game/store/effects/check-effects';
import { HealEffect } from '../../game/store/effects/game-effects';
import {WAS_ATTACK_USED, MOVE_CARDS } from '../../game/store/prefabs/prefabs';

export class Slowpoke extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.PSYCHIC];
  public hp: number = 50;
  public weakness = [{ type: CardType.PSYCHIC }];
  public retreat = [CardType.COLORLESS];

  public attacks = [{
    name: 'Spacing Out',
    cost: [C],
    damage: 0,
    text: 'Flip a coin. If heads, remove a damage counter from Slowpoke. This attack can\'t be used if Slowpoke has no damage counters on it.'
  },
  {
    name: 'Scavenge',
    cost: [P, P],
    damage: 0,
    text: 'Discard 1 [P] Energy card attached to Slowpoke in order to use this attack. Put a Trainer card from your discard pile into your hand.'
  }];

  public set: string = 'FO';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '55';
  public name: string = 'Slowpoke';
  public fullName: string = 'Slowpoke FO';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      if (!effect.player.active.damage) throw new GameError(GameMessage.CANNOT_USE_ATTACK);
      return LabFlip(store,state,effect.player,heads => {if(heads)store.reduceEffect(state,new HealEffect(effect.player,effect.player.active,10));});
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player=effect.player;
      const recover=() => {
        if(!player.discard.cards.some(c => c instanceof TrainerCard)) return state;
        return store.prompt(state,new ChooseCardsPrompt(player,GameMessage.CHOOSE_CARD_TO_HAND,player.discard,{superType:SuperType.TRAINER},{min:1,max:1,allowCancel:false}),cards => {
          if(cards?.length) MOVE_CARDS(store,state,player.discard,player.hand,{cards,sourceCard:this});
        });
      };
      if((effect as any).wotcEnergyCostPaid) return recover();
      const energy=new CheckProvidedEnergyEffect(player);store.reduceEffect(state,energy);
      return store.prompt(state,new ChooseEnergyPrompt(player.id,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,energy.energyMap,[CardType.PSYCHIC],{allowCancel:false}),chosen => {
        const discard=new DiscardCardsEffect(effect,(chosen||[]).map(e=>e.card));discard.target=player.active;store.reduceEffect(state,discard);recover();
      });
    }

    return state;
  }
}