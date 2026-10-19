// Shared by retreat and effect-driven switches. Source-bound locks expire when
// either Pokemon leaves Active, even if that Pokemon later returns.
export function hasActiveSwitchLock(player: any, state: any): boolean {
  if (!state) return false;
  const active = player.active;
  const lock = active.wotcActiveSwitchLock;
  if (!lock || state.turn > lock.untilTurn || !active.marker.hasMarker(lock.marker, lock.source)) return false;
  if (!lock.sourceBound) return true;
  const opponent = state.players.find((p: any) => p !== player);
  return opponent?.active.getPokemonCard() === lock.source
    && opponent.active.marker.hasMarker(lock.marker, lock.source);
}
