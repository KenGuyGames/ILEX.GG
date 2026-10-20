/* Cube rule context is synchronous, nested and restored even when a reducer throws.
 * It is never persisted globally between matches, workers or prompt actions. */
import { SpecialCondition } from './game/store/card/card-types';
import { GameError } from './game/game-error';
import { GameMessage } from './game/game-message';
let activeRules: any;
export function currentCubeRules(): any { return activeRules; }
export function withCubeRules<T>(state: any, fn: () => T): T {
  const previous = activeRules;
  activeRules = state.rules?.cubeRules;
  try { prepareCubeCards(state); return fn(); } finally { activeRules = previous; }
}
export function makePowerTypes(names: string[]): any {
  const table: any = {};
  names.forEach((name, index) => { table[index] = name; Object.defineProperty(table, name, { enumerable: true, get: () => activeRules?.unifiedAbilities && [0, 1, 6].includes(index) ? 2 : index }); });
  return table;
}
export function cubePowerIncludes(types: number[], value: number): boolean {
  const equivalent = (n: number) => activeRules?.unifiedAbilities && [0, 1, 2, 6].includes(n) ? 2 : n;
  return types.some(t => equivalent(t) === equivalent(value));
}
export function cubeBasePrizes(card: any, rules = activeRules): number {
  if (!card) return 1;
  const tags = card._cubePrintedTags || card.tags || [];
  if (rules?.lowercaseExOnePrize && /(?:^|[ -])ex(?:\s*δ)?$/.test(card.name)) return 1;
  if (tags.some((t: string) => ['VMAX', 'V-UNION', 'Tag Team', 'Mega ex'].includes(t))) return 3;
  return tags.some((t: string) => ['EX', 'GX', 'V', 'VSTAR', 'ex', 'Dual Legend'].includes(t)) || card._hgssLegendPrizes === 2 ? 2 : 1;
}
export function cubeEvolution(from: any, to: any, skipStage = false, rules = activeRules): boolean {
  if (!from || !to) return false;
  if (rules?.twoPrizeEvolutionOnly && ((cubeBasePrizes(from, rules) === 2) !== (cubeBasePrizes(to, rules) === 2))) return false;
  const stages = [2, 3, 4];
  if (!rules?.mutantEvolution || !stages.includes(to.stage)) return from.name === to.evolvesFrom || from.evolvesTo?.includes(to.name) || from.evolvesToStage?.includes(to.stage) || from.evolvesFromBase?.includes(to.evolvesFrom);
  return stages.includes(from.stage) && stages.includes(to.stage) && (skipStage ? to.stage > from.stage : to.stage === from.stage + 1) && (from.cardType || []).some((t: any) => to.cardType.includes(t));
}
export function prepareCubeCards(state: any): void {
  const r = state.rules?.cubeRules;
  if (!r) return;
  for (const player of state.players) for (const list of [player.hand, player.deck, player.discard, player.lostzone, player.stadium, player.supporter, player.active, ...player.bench, ...player.prizes]) for (const card of list.cards) {
    if (card.stage === undefined || card._cubePrepared) continue;
    card._cubePrintedTags = (card.tags || []).slice();
    card._cubePrizeValue = cubeBasePrizes(card, r);
    if (r.unifiedRuleBoxes && card.tags.some((t: string) => ['EX', 'GX', 'V', 'VSTAR', 'VMAX', 'V-UNION', 'Tag Team'].includes(t)) && !/(?:^|[ -])ex(?:\s*δ)?$/.test(card.name)) card.tags = [...new Set([...card.tags, 'EX', 'GX', 'V'])];
    if (r.unifiedAbilities) card.powers = (card.powers || []).map((p: any) => ({ ...p, _cubePrintedPowerType: p._cubePrintedPowerType ?? p.powerType, powerType: [0, 1, 2, 6].includes(p.powerType) ? 2 : p.powerType }));
    card._cubePrepared = true;
  }
}
export function cubePrintedPowerConditions(state: any, effect: any): void {
  if (!state.rules?.cubeRules?.unifiedAbilities) return;
  const card = effect.type === 'POWER_EFFECT' ? effect.card : effect.type === 'CHECK_POKEMON_POWERS_EFFECT' ? effect.target : undefined;
  if (!card?.powers) return;
  const slot = state.players.flatMap((p: any) => [p.active, ...p.bench]).find((l: any) => l.getPokemonCard() === card);
  if (!slot?.specialConditions.length) return;
  const blocked = (power: any): boolean => {
    if ((power._cubePrintedPowerType ?? power.powerType) !== 6) return false;
    const text = power.text || '';
    if (/(?:works?|used|can be used) even (?:if|while)/i.test(text)) return false;
    if (/special condition/i.test(text)) return true;
    return ([['asleep', SpecialCondition.ASLEEP], ['confused', SpecialCondition.CONFUSED], ['paralyzed', SpecialCondition.PARALYZED], ['poisoned', SpecialCondition.POISONED], ['burned', SpecialCondition.BURNED]] as any[]).some(([name, code]) => new RegExp(name, 'i').test(text) && slot.specialConditions.includes(code));
  };
  if (effect.type === 'POWER_EFFECT' && blocked(effect.power)) throw new GameError(GameMessage.CANNOT_USE_POWER);
  if (effect.type === 'CHECK_POKEMON_POWERS_EFFECT') effect.powers = effect.powers.filter((p: any) => !blocked(p));
}
