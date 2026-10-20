import { GameError } from '../game-error';
import { GameMessage } from '../game-message';
import { CardTarget, PlayerType, SlotType } from './actions/play-card-action';
import { Card } from './card/card';
import { CardType } from './card/card-types';
import { PokemonCard } from './card/pokemon-card';
import { EnergyMap } from './prompts/choose-energy-prompt';
import { CardList } from './state/card-list';
import { Player } from './state/player';
import { PokemonCardList } from './state/pokemon-card-list';
import { State } from './state/state';

/** One energy unit: either a concrete type, or a choosable set of types (blend/unit). */
type EnergyUnit =
  | { kind: 'concrete'; type: CardType }
  | { kind: 'choosable'; types: CardType[] };

export class StateUtils {
  /** Preserve every provided unit while exposing each physical card once. */
  public static physicalEnergyMap(energy: EnergyMap[]): EnergyMap[] {
    const cards=new Map<Card,EnergyMap>();
    for(const entry of energy){const groups=(entry.providedGroups||[entry.provides]).map(group=>group.slice()),prior=cards.get(entry.card);
      if(prior){prior.providedGroups!.push(...groups);prior.provides=[...new Set(prior.providedGroups!.flat())];}
      else cards.set(entry.card,{...entry,provides:entry.provides.slice(),providedGroups:groups});
    }
    return [...cards.values()];
  }
  static getStadium(state: State) {
    throw new Error('Method not implemented.');
  }

  /**
   * True when provides lists multiple distinct types — one energy choosable as any of them.
   * Homogeneous repeats ([D,D], [C,C], [ANY,ANY]) are multi-unit, not choosable.
   */
  public static isChoosableProvides(provides: CardType[]): boolean {
    return new Set(provides).size > 1;
  }

  /** Number of energy units an EnergyMap provides entry represents. */
  public static getProvidesUnitCount(provides: CardType[], entry?: EnergyMap): number {
    if(entry?.providedGroups)return entry.providedGroups.reduce((sum,group)=>sum+StateUtils.getProvidesUnitCount(group),0);
    return StateUtils.isChoosableProvides(provides) ? 1 : provides.length;
  }

  /** Whether this provides array can satisfy the given energy type (including ANY). */
  public static providesMatchesType(provides: CardType[], type: CardType): boolean {
    if (provides.includes(CardType.ANY)) {
      return true;
    }
    return provides.includes(type);
  }

  private static toEnergyUnits(energy: EnergyMap[]): EnergyUnit[] {
    const units: EnergyUnit[] = [];
    for (const e of energy) {
      for(const provides of e.providedGroups||[e.provides]){
      if (StateUtils.isChoosableProvides(provides)) {
        units.push({ kind: 'choosable', types: [...provides] });
      } else {
        for (const t of provides) {
          units.push({ kind: 'concrete', type: t });
        }
      }
      }
    }
    return units;
  }

  public static checkEnoughEnergy(energy: EnergyMap[], cost: CardType[]): boolean {
    if (cost.length === 0) {
      return true;
    }

    const units = StateUtils.toEnergyUnits(energy);
    let colorless = 0;
    const needsProviding: CardType[] = [];

    cost.forEach(costType => {
      switch (costType) {
        case CardType.ANY:
        case CardType.NONE:
          break;
        case CardType.COLORLESS:
          colorless += 1;
          break;
        default: {
          const index = units.findIndex(
            u => u.kind === 'concrete' && u.type === costType
          );
          if (index !== -1) {
            units.splice(index, 1);
          } else {
            needsProviding.push(costType);
          }
        }
      }
    });

      // Reassign earlier choices when overlapping type sets require it.
      const assigned = new Map<number, number>();
      const matches = (unit: EnergyUnit, type: CardType) => unit.kind === 'choosable'
        ? unit.types.includes(type) || unit.types.includes(CardType.ANY)
        : unit.type === type || unit.type === CardType.ANY;
      const assign = (need: number, seen: Set<number>): boolean => {
        for (let index = 0; index < units.length; index++) {
          if (seen.has(index) || !matches(units[index], needsProviding[need])) continue;
          seen.add(index);
          const previous = assigned.get(index);
          if (previous === undefined || assign(previous, seen)) { assigned.set(index, need); return true; }
        }
        return false;
      };
      for (let need = 0; need < needsProviding.length; need++) if (!assign(need, new Set())) return false;
      return units.length - assigned.size >= colorless;
  }

  public static checkExactEnergy(energy: EnergyMap[], cost: CardType[]): boolean {
    let enough = StateUtils.checkEnoughEnergy(energy, cost);
    if (!enough) {
      return false;
    }

    for (let i = 0; i < energy.length; i++) {
      const tempCards = energy.slice();
      tempCards.splice(i, 1);
      enough = StateUtils.checkEnoughEnergy(tempCards, cost);
      if (enough) {
        return false;
      }
    }
    return true;
  }

  /** Maximize matching Energy left over after paying every typed and Colorless cost. */
  public static getUnusedEnergyUnitsOfType(energy: EnergyMap[], cost: CardType[], type: CardType): number {
    const units = StateUtils.toEnergyUnits(energy), needs = cost.filter(t => t !== CardType.ANY && t !== CardType.NONE);
    const matches = (unit: EnergyUnit, needed: CardType) => needed === CardType.COLORLESS || (unit.kind === 'choosable'
      ? unit.types.includes(needed) || unit.types.includes(CardType.ANY)
      : unit.type === needed || unit.type === CardType.ANY);
    const weights = units.map(unit => matches(unit, type) ? 1 : 0), assigned = new Map<number, number>();
    let spent = 0;
    for (let start = 0; start < needs.length; start++) {
      const distance = Array(needs.length + units.length).fill(Infinity), previous = Array(needs.length + units.length).fill(-1);
      distance[start] = 0;
      const queue = [start], queued = new Set(queue);
      for (let at = 0; at < queue.length; at++) {
        const node = queue[at]; queued.delete(node);
        const relax = (to: number, weight: number) => {
          if (distance[to] <= distance[node] + weight) return;
          distance[to] = distance[node] + weight; previous[to] = node;
          if (!queued.has(to)) { queue.push(to); queued.add(to); }
        };
        if (node < needs.length) {
          for (let unit = 0; unit < units.length; unit++) if (assigned.get(unit) !== node && matches(units[unit], needs[node])) relax(needs.length + unit, weights[unit]);
        } else {
          const unit = node - needs.length, owner = assigned.get(unit);
          if (owner !== undefined) relax(owner, -weights[unit]);
        }
      }
      let last = -1;
      for (let unit = 0; unit < units.length; unit++) if (!assigned.has(unit) && Number.isFinite(distance[needs.length + unit])
        && (last < 0 || distance[needs.length + unit] < distance[needs.length + last])) last = unit;
      if (last < 0) return 0;
      spent += distance[needs.length + last];
      let node = needs.length + last;
      while (node >= needs.length) {
        const need = previous[node], formerUnit = previous[need];
        assigned.set(node - needs.length, need); node = formerUnit;
      }
    }
    return Math.max(0, weights.reduce((a, b) => a + b, 0) - spent);
  }

  /**
   * Returns true when every energy entry has the same provides array.
   * Used to skip the energy selection prompt when all options are interchangeable.
   */
  public static allEnergyProvidesIdentical(energyMap: EnergyMap[]): boolean {
    if (energyMap.length === 0) {
      return false;
    }
    const providesKey = (e: EnergyMap) => JSON.stringify((e.providedGroups||[e.provides]).map(group=>[...group].sort()).sort());
    const firstKey = providesKey(energyMap[0]);
    return energyMap.every(e => providesKey(e) === firstKey);
  }

  /**
   * Apply one EnergyMap entry against remaining typed costs.
   * Choosable provides pay at most one typed cost; homogeneous entries pay one per matching unit.
   */
  private static applyProvidesToTypedCosts(provides: CardType[], costs: CardType[]): void {
    if (StateUtils.isChoosableProvides(provides)) {
      const matchIndex = costs.findIndex(c => StateUtils.providesMatchesType(provides, c));
      if (matchIndex !== -1) {
        costs.splice(matchIndex, 1);
      }
      return;
    }

    for (const c of provides) {
      if (c === CardType.ANY && costs.length > 0) {
        costs.shift();
      } else {
        const i = costs.indexOf(c);
        if (i !== -1) {
          costs.splice(i, 1);
        }
      }
    }
  }

  /**
   * Returns a minimal set of EnergyMap entries that satisfies the cost, or null if impossible.
   * Satisfies typed costs first, then colorless, then trims excess.
   */
  public static selectMinimalEnergyForCost(energyMap: EnergyMap[], cost: CardType[]): EnergyMap[] | null {
    if(!cost.length)return [];
    let selected=StateUtils.physicalEnergyMap(energyMap);
    if(!StateUtils.checkEnoughEnergy(selected,cost))return null;
    selected.sort((a,b)=>StateUtils.getProvidesUnitCount(a.provides,a)-StateUtils.getProvidesUnitCount(b.provides,b));
    // Trim physical cards using the full matching solver, retaining overlapping
    // selectable types and every unit of multi-unit Special Energy.
    for(let i=0;i<selected.length;){const rest=selected.filter((_,index)=>index!==i);if(StateUtils.checkEnoughEnergy(rest,cost))selected=rest;else i++;}
    return selected;
  }

  public static getPlayerById(state: State, playerId: number): Player {
    const player = state.players.find(p => p.id === playerId);
    if (player === undefined) {
      throw new GameError(GameMessage.INVALID_GAME_STATE);
    }
    return player;
  }

  public static getOpponent(state: State, player: Player): Player {
    const opponent = state.players.find(p => p.id !== player.id);
    if (opponent === undefined) {
      throw new GameError(GameMessage.INVALID_GAME_STATE);
    }
    return opponent;
  }

  public static getTarget(state: State, player: Player, target: CardTarget): PokemonCardList {
    if (target.player === PlayerType.TOP_PLAYER) {
      player = StateUtils.getOpponent(state, player);
    }
    if (target.slot === SlotType.ACTIVE) {
      return player.active;
    }
    if (target.slot !== SlotType.BENCH) {
      throw new GameError(GameMessage.INVALID_TARGET);
    }
    if (player.bench[target.index] === undefined) {
      throw new GameError(GameMessage.INVALID_TARGET);
    }
    return player.bench[target.index];
  }

  public static findCardList(state: State, card: Card): CardList {
    const cardLists: CardList[] = [];
    for (const player of state.players) {
      cardLists.push(player.active);
      cardLists.push(player.deck);
      cardLists.push(player.discard);
      cardLists.push(player.hand);
      cardLists.push(player.lostzone);
      cardLists.push(player.stadium);
      cardLists.push(player.supporter);
      player.bench.forEach(item => cardLists.push(item));
      player.prizes.forEach(item => cardLists.push(item));
    }
    const cardList = cardLists.find(c => c.cards.includes(card));
    if (cardList === undefined) {
      throw new GameError(GameMessage.INVALID_GAME_STATE);
    }
    return cardList;
  }

  public static findPokemonSlot(state: State, card: Card): PokemonCardList | undefined {
    const cardLists: { pokemonSlot: PokemonCardList, cardList: CardList | Card[] }[] = [];
    for (const player of state.players) {
      cardLists.push({ pokemonSlot: player.active, cardList: player.active.cards });
      cardLists.push({ pokemonSlot: player.active, cardList: player.active.energies });
      cardLists.push({ pokemonSlot: player.active, cardList: player.active.tools });
      player.bench.forEach(item => cardLists.push(
        { pokemonSlot: item, cardList: item.cards },
        { pokemonSlot: item, cardList: item.energies },
        { pokemonSlot: item, cardList: item.tools }
      ));
    }
    const cardList = cardLists.find(c => Array.isArray(c.cardList) ? c.cardList.includes(card) : c.cardList.cards.includes(card));
    return cardList ? cardList.pokemonSlot : undefined;
  }

  public static findOwner(state: State, cardList: CardList): Player {
    for (const player of state.players) {
      const cardLists: CardList[] = [];
      cardLists.push(player.active);
      cardLists.push(player.deck);
      cardLists.push(player.discard);
      cardLists.push(player.hand);
      cardLists.push(player.lostzone);
      cardLists.push(player.stadium);
      cardLists.push(player.supporter);
      player.bench.forEach(item => cardLists.push(item));
      player.prizes.forEach(item => cardLists.push(item));
      if (cardLists.includes(cardList)) {
        return player;
      }
    }
    throw new GameError(GameMessage.INVALID_GAME_STATE);
  }

  public static isPokemonInPlay(player: Player, pokemon: PokemonCard, location?: SlotType.BENCH | SlotType.ACTIVE): boolean {
    let inPlay = false;
    player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (cardList, card) => {
      if (card === pokemon) {
        if ((location === SlotType.BENCH && cardList === player.active) ||
          (location === SlotType.ACTIVE && cardList !== player.active)) {
          inPlay = false;
        } else {
          inPlay = true;
        }
      }
    });
    return inPlay;
  }

  public static getStadiumCard(state: State): Card | undefined {
    for (const player of state.players) {
      if (player.stadium.cards.length > 0) {
        return player.stadium.cards[0];
      }
    }
    return undefined;
  }
}
