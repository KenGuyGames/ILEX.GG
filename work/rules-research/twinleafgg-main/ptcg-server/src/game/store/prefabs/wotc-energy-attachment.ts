import { AfterEnergyAttachedEffect, AttachEnergyEffect } from '../effects/play-card-effects';
import { MOVE_CARDS } from './prefabs';
import { CardList } from '../state/card-list';

// Attachment from a zone is distinct from moving an already attached Energy.
// All new WOTC attachment effects use the same post-attachment notification.
export function attachWotcEnergy(store: any, state: any, player: any, zone: any, target: any, card: any, context: any): any {
  const origin=context.sourceKind??(context.sourceEffect?._wotcTrainer?'trainer':context.sourceEffect?.type==='POWER_EFFECT'?'power':context.sourceEffect?.type==='ATTACK_EFFECT'?'attack':(CardList as any).wotcMovementContext?.kind);
  if (zone === player.hand) {const attach=new AttachEnergyEffect(player,card,target);attach.origin=origin;return store.reduceEffect(state,attach);}
  if (target.wotcAllEnergyLockUntilTurn===state.turn && target.marker.hasMarker('WOTC_ALL_ENERGY_LOCK')) return state;
  MOVE_CARDS(store, state, zone, target, { cards: [card], sourceCard: context.sourceCard, sourceEffect: context.sourceEffect });
  if (target.cards.includes(card)) return store.reduceEffect(state, new AfterEnergyAttachedEffect(player, card, target, false,origin));
  return state;
}
