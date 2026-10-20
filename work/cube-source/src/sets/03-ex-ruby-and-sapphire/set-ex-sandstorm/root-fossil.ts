import {
  TrainerCard,
  TrainerType,
  Stage,
  CardType,
  PokemonType,
  Power,
  PowerType,
  StoreLike,
  State,
  GameLog,
  StateUtils,
  GameError,
  GameMessage,
  PokemonCard,
  PlayerType,
} from '../../../game';
import { AddSpecialConditionsEffect } from '../../../game/store/effects/attack-effects';
import { Effect } from '../../../game/store/effects/effect';
import {
  RetreatEffect,
  KnockOutEffect,
  HealEffect,
} from '../../../game/store/effects/game-effects';
import { AddSpecialConditionsPowerEffect } from '../../../game/store/effects/check-effects';
import { PowerEffect } from '../../../game/store/effects/game-effects';
import { BetweenTurnsEffect } from '../../../game/store/effects/game-phase-effects';
import { PlayItemEffect, PlayPokemonEffect } from '../../../game/store/effects/play-card-effects';
import {
  IS_POKEBODY_BLOCKED,
  WAS_POWER_USED,
  MOVE_CARDS,
  MOVE_POKEMON_OFF_BOARD,
} from '../../../game/store/prefabs/prefabs';

export class RootFossil extends TrainerCard {
  protected _trainerType = TrainerType.ITEM;

  public stage: Stage = Stage.BASIC;

  public cardType: CardType[] = [CardType.COLORLESS];
  public cardTypez: CardType = CardType.COLORLESS;

  public movedToActiveThisTurn = false;

  public pokemonType = PokemonType.NORMAL;
  public evolvesFrom = '';
  public cardTag = [];
  public tools = [];
  public evolvesTo = [];
  public evolvesToStage = [];
  public archetype = [];
  public hp: number = 40;
  public weakness = [];
  public retreat = [];
  public resistance = [];
  public attacks = [];
  public attacksThisTurn: number = 0;
  public maxAttacksThisTurn: number = 1;
  public allowSubsequentAttackChoice: boolean = false;
  public evolvesFromBase: string[] = [];
  public maxTools: number = 1;
  public set: string = 'SS';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '92';
  public name: string = 'Root Fossil';
  public fullName: string = 'Root Fossil SS';

  public powers: Power[] = [
    {
      name: 'Root Fossil',
      text: "Play Root Fossil as if it were a Basic Pokémon. While in play, Root Fossil counts as a [C] Pokémon (instead of a Trainer card). Root Fossil has no attacks of its own, can't retreat, and can't be affected by any Special Conditions. If Root Fossil is Knocked Out, it doesn't count as a Knocked Out Pokémon. (Discard it anyway.) At any time during your turn before your attack, you may discard Root Fossil from play.",
      useWhenInPlay: true,
      exemptFromAbilityLock: true,
      isFossil: true,
      powerType: PowerType.TRAINER_ABILITY,
    },
    {
      name: 'Spongy Stone',
      text: 'At any time between turns, remove 1 damage counter from Root Fossil.',
      powerType: PowerType.POKEBODY,
      isFossil: true,
    },
  ];

  // public text =
  //   'Play Root Fossil as if it were a Basic Pokémon. While in play, Root Fossil counts as a Pokémon (instead of a Trainer card). Root Fossil has no attacks, can\'t retreat, and can\'t be Asleep, Confused, Paralyzed, or Poisoned. If Root Fossil is Knocked Out, it doesn\'t count as a Knocked Out Pokémon. (Discard it anyway.)';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.card===this && effect.power===this.powers[0]) {
      const list=StateUtils.findCardList(state,this),owner=StateUtils.findOwner(state,list);
      if(owner!==effect.player||list.getPokemonCard()!==this)throw new GameError(GameMessage.CANNOT_USE_POWER);
      MOVE_POKEMON_OFF_BOARD(store,state,list,{pokemonDestination:owner.discard,attachedDestination:owner.discard,sourceCard:this,sourceEffect:effect});
      return state;
    }

    if (effect instanceof KnockOutEffect && effect.target.getPokemonCard() === this) {
      effect.prizeCount = 0;
    }

    if (effect instanceof PlayItemEffect && effect.trainerCard === this) {
      const player = effect.player;

      const emptySlots = player.bench.filter((b) => b.cards.length === 0);
      if (emptySlots.length === 0) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }

      const playPokemonEffect = new PlayPokemonEffect(player, this as PokemonCard, emptySlots[0]);
      store.reduceEffect(state, playPokemonEffect);
    }

    if ((effect instanceof AddSpecialConditionsEffect || effect instanceof AddSpecialConditionsPowerEffect) && effect.target.getPokemonCard() === this) {
      effect.preventDefault = true;
    }


    if (effect instanceof RetreatEffect && effect.player.active.getPokemonCard() === this) {
      throw new GameError(GameMessage.CANNOT_RETREAT);
    }

    // Spongy Stone
    if ((state.rules as any).exEraRules ? effect.type==='EX_CHECKUP_COMPLETE_EFFECT' : effect instanceof BetweenTurnsEffect) {
      const list=StateUtils.findCardList(state,this),player=StateUtils.findOwner(state,list);
      if(!player||list.getPokemonCard()!==this)return state;

      if (IS_POKEBODY_BLOCKED(store, state, player, this)) {
        return state;
      }

      player.forEachPokemon(PlayerType.ANY, (cardList) => {
        if (cardList.getPokemonCard() === this) {
          const healEffect = new HealEffect(player, cardList, 10);
          state = store.reduceEffect(state, healEffect);
        }
      });
    }

    return state;
  }
}
