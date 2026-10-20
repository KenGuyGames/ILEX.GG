import { PowerType } from './game/store/card/pokemon-types';

// Legacy "Pokémon Powers" cover these three families, never modern Abilities,
// Ancient Traits, Baby Rules, assembly rules or effects on attached Energy.
export function isLegacyPowerType(type: PowerType): boolean {
  return [PowerType.POKEMON_POWER, PowerType.POKEPOWER, PowerType.POKEBODY].includes(type);
}

export function legacyPowerLockApplies(state: any, power: any): boolean {
  return !state.rules.unlimitedRules || isLegacyPowerType(power?.powerType);
}
