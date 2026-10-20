import {makePowerTypes} from '../../../tcg-lab-cube';
import { CardType } from './card-types';
import { StoreLike } from '../store-like';
import { State } from '../state/state';
import { Effect } from '../effects/effect';
import { PowerEffect } from '../effects/game-effects';

export interface Weakness {
  type: CardType;
  value?: number; // when undefined, then it's x2
  multiplier?: number;
}

export interface Resistance {
  type: CardType;
  value: number;
}

export interface Attack {
  cost: CardType[];
  damage: number;
  damageCalculation?: string;
  copycatAttack?: boolean;
  gxAttack?: boolean;
  shredAttack?: boolean;
  useOnBench?: boolean;
  canUseOnFirstTurn?: boolean;
  name: string;
  text: string;
  barrage?: boolean;
  effect?:
  | ((store: StoreLike, state: State, effect: Effect) => State | void)
  | ((state: State) => State | void);
}

export type PowerType = number;
export const PowerType = makePowerTypes(["POKEBODY", "POKEPOWER", "ABILITY", "ANCIENT_TRAIT", "BABY_RULE", "HELD_ITEM", "POKEMON_POWER", "VUNION_ASSEMBLY", "LEGEND_ASSEMBLY", "TRAINER_ABILITY", "etc.\n  HOLONS_SPECIAL_ENERGY_EFFECT", "MEGA_EVOLUTION_RULE", "do not use\n  LV_X_RULE", "do not use\n  BREAK_RULE", "do not use\n  ARCEUS_RULE", "do not use\n  ENERGY_ABILITY"]);

export interface Power {
  name: string;
  powerType: PowerType;
  text: string;
  effect?: (store: StoreLike, state: State, effect: PowerEffect) => State;
  useWhenInPlay?: boolean;
  useFromHand?: boolean;
  useFromHandToBench?: boolean;
  useFromDiscard?: boolean;
  exemptFromAbilityLock?: boolean;
  exemptFromInitialize?: boolean;
  abilityLock?: boolean;
  barrage?: boolean;
  knocksOutSelf?: boolean;
  isFossil?: boolean;
}
