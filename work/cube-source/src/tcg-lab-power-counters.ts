import { StateUtils } from './game';
import { PowerEffect, PutDamageCountersEffect } from './game/store/effects/game-effects';

// Keep the Ability's owner and source when a passive effect places counters.
// Attack damage modifiers and attack-only protection do not apply to counters.
export function placePowerCounters(store: any, state: any, source: any, target: any, amount: number, power = source.powers[0]): void {
  const owner = StateUtils.findOwner(state, StateUtils.findCardList(state, source));
  const base = new PowerEffect(owner, power, source, target);
  store.reduceEffect(state, new PutDamageCountersEffect(base, amount));
}
