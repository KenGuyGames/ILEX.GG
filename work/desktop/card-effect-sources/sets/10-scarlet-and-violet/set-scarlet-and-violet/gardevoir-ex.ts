import { PokemonCard } from '../../../game/store/card/pokemon-card';
import {
  Stage,
  CardType,
  EnergyType,
  SuperType,
  CardTag,
} from '../../../game/store/card/card-types';
import { PowerType,
  StoreLike,
  State,
  StateUtils,
  GameMessage,
  PlayerType,
  SlotType,
  GameError, pokemonHasCardType } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';

import { AttachEnergyPrompt } from '../../../game/store/prompts/attach-energy-prompt';
import { RemoveSpecialConditionsEffect } from '../../../game/store/effects/attack-effects';
import { CheckHpEffect, CheckPokemonTypeEffect } from '../../../game/store/effects/check-effects';
import {attachWotcEnergy} from '../../../game/store/prefabs/wotc-energy-attachment';
import {WAS_ATTACK_USED, WAS_POWER_USED, MOVE_CARDS } from '../../../game/store/prefabs/prefabs';

export class Gardevoirex extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Kirlia';
  protected _tags = [CardTag.POKEMON_ex];
  public cardType: CardType[] = [P];
  public hp: number = 310;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public powers = [
    {
      name: 'Psychic Embrace',
      useWhenInPlay: true,
      powerType: PowerType.ABILITY,
      text: "As often as you like during your turn, you may attach a Basic [P] Energy card from your discard pile to 1 of your [P] Pokémon. If you attached Energy to a Pokémon in this way, put 2 damage counters on that Pokémon. You can't use this Ability on a Pokémon that would be Knocked Out.",
    },
  ];

  public attacks = [
    {
      name: 'Miracle Force',
      cost: [P, P, C],
      damage: 190,
      text: 'This Pokémon recovers from all Special Conditions.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '86';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Gardevoir ex';
  public fullName: string = 'Gardevoir ex SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;
      const slots=[{list:player.active,player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0},...player.bench.map((list,index)=>({list,player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index}))];
      const eligible=(target:any)=>{
        if(!target.getPokemonCard())return false;
        const type=new CheckPokemonTypeEffect(target);store.reduceEffect(state,type);
        const hp=new CheckHpEffect(player,target);store.reduceEffect(state,hp);
        return type.cardTypes.includes(CardType.PSYCHIC)&&target.damage+20<hp.hp;
      };
      const legal=slots.filter(s=>eligible(s.list));
      if(!legal.length||!player.discard.cards.some(c=>c.superType===SuperType.ENERGY&&(c as any).energyType===EnergyType.BASIC&&(c as any).provides.includes(CardType.PSYCHIC)))throw new GameError(GameMessage.CANNOT_USE_POWER);

      // const blocked: CardTarget[] = [];
      // player.bench.forEach((card, index) => {
      //   if (card instanceof PokemonCard && !pokemonHasCardType(card, CardType.PSYCHIC)) {
      //     blocked.push();
      //   }
      // });

      // player.active.cards.forEach((card, index) => {
      //   if (card instanceof PokemonCard && !pokemonHasCardType(card, CardType.PSYCHIC)) {
      //     blocked.push();
      //   }
      // });

      state = store.prompt(
        state,
        new AttachEnergyPrompt(
          player.id,
          GameMessage.ATTACH_ENERGY_TO_BENCH,
          player.discard,
          PlayerType.BOTTOM_PLAYER,
          [SlotType.BENCH, SlotType.ACTIVE],
          { superType: SuperType.ENERGY, energyType: EnergyType.BASIC, name: 'Psychic Energy' },
          { allowCancel: true, min: 0, max:1, blockedTo:slots.filter(s=>!legal.includes(s)).map(({list,...target})=>target) },
        ),
        (transfers) => {
          transfers = transfers || [];
          // cancelled by user
          if (transfers.length === 0) {
            return state;
          }
          for (const transfer of transfers) {
            const target = StateUtils.getTarget(state, player, transfer.to);
            const checkHpEffect = new CheckHpEffect(player, target);
            store.reduceEffect(state, checkHpEffect);

            const targetType=new CheckPokemonTypeEffect(target);store.reduceEffect(state,targetType);
            if (!targetType.cardTypes.includes(CardType.PSYCHIC)) {
              throw new GameError(GameMessage.CAN_ONLY_ATTACH_TO_PSYCHIC);
            }

            const damageAfterTransfer = target.damage + 20;
            if (damageAfterTransfer >= checkHpEffect.hp) {
              throw new GameError(GameMessage.CANNOT_USE_POWER);
            }
            attachWotcEnergy(store,state,player,player.discard,target,transfer.card,{sourceCard:this,sourceEffect:effect,sourceKind:'power'});
            if(target.cards.includes(transfer.card)||target.energies.cards.includes(transfer.card))target.damage += 20;
          }
        },
      );
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const removeSpecialCondition = new RemoveSpecialConditionsEffect(effect, undefined);
      removeSpecialCondition.target = player.active;
      state = store.reduceEffect(state, removeSpecialCondition);
      return state;
    }
    return state;
  }
}
