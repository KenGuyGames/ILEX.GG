import { AfterEnergyAttachedEffect, AttachEnergyEffect } from '../effects/play-card-effects';
import { MOVE_CARDS } from './prefabs';

// Attachment from a zone is distinct from moving an already attached Energy.
// All new WOTC attachment effects use the same post-attachment notification.
export function attachWotcEnergy(store: any, state: any, player: any, zone: any, target: any, card: any, context: any): any {
  if (zone === player.hand) return store.reduceEffect(state, new AttachEnergyEffect(player, card, target));
  if (target.wotcAllEnergyLockUntilTurn===state.turn && target.marker.hasMarker('WOTC_ALL_ENERGY_LOCK')) return state;
  MOVE_CARDS(store, state, zone, target, { cards: [card], sourceCard: context.sourceCard, sourceEffect: context.sourceEffect });
  if (target.cards.includes(card)) return store.reduceEffect(state, new AfterEnergyAttachedEffect(player, card, target, false));
  return state;
}
