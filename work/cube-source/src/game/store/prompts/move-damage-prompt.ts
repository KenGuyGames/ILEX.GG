import { GameError } from '../../game-error';
import { GameMessage } from '../../game-message';
import { Prompt } from './prompt';
import { PlayerType, SlotType, CardTarget } from '../actions/play-card-action';
import { State } from '../state/state';
import { StateUtils } from '../state-utils';

export const MoveDamagePromptType = 'Move damage';

export type MoveDamageResultType = DamageTransfer[];

export interface DamageTransfer {
  from: CardTarget;
  to: CardTarget;
}

export interface DamageMap {
  target: CardTarget;
  damage: number;
}

export interface MoveDamageOptions {
  allowCancel: boolean;
  min: number;
  max: number | undefined;
  blockedFrom: CardTarget[];
  blockedTo: CardTarget[];
  singleSourceTarget: boolean;
  singleDestinationTarget: boolean;
  damageMultiple?: number;
}

export class MoveDamagePrompt extends Prompt<DamageTransfer[]> {

  readonly type: string = MoveDamagePromptType;

  public options: MoveDamageOptions;

  constructor(
    playerId: number,
    public message: GameMessage,
    public playerType: PlayerType,
    public slots: SlotType[],
    public maxAllowedDamage: DamageMap[],
    options?: Partial<MoveDamageOptions>
  ) {
    super(playerId);

    // Default options
    this.options = Object.assign({}, {
      allowCancel: true,
      min: 0,
      max: undefined,
      blockedFrom: [],
      blockedTo: [],
      singleSourceTarget: false,
      singleDestinationTarget: false,
      damageMultiple: 10
    }, options);
  }

  public decode(result: MoveDamageResultType | null, state: State): DamageTransfer[] | null {
    if (result === null) {
      return result;  // operation cancelled
    }
    const player = state.players.find(p => p.id === this.getPerspectivePlayerId());
    if (player === undefined) {
      throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
    }
    return result;
  }

  public validate(result: DamageTransfer[] | null, state: State): boolean {
    if (result === null) {
      return this.options.allowCancel;  // operation cancelled
    }

    if (this.options.singleSourceTarget) {
      const sources = new Set(result.map(r => JSON.stringify(r.from)));
      if (sources.size > 1) {
        return false;
      }
    }

    if (this.options.singleDestinationTarget) {
      const destinations = new Set(result.map(r => JSON.stringify(r.to)));
      if (destinations.size > 1) {
        return false;
      }
    }

    if (result.length < this.options.min) {
      return false;
    }

    if (this.options.max !== undefined && result.length > this.options.max) {
      return false;
    }

    const player = state.players.find(p => p.id === this.getPerspectivePlayerId());
    if (player === undefined) {
      return false;
    }
    const blockedFrom = this.options.blockedFrom.map(b => StateUtils.getTarget(state, player, b));
    const blockedTo = this.options.blockedTo.map(b => StateUtils.getTarget(state, player, b));

    for (const r of result) {
      const from = StateUtils.getTarget(state, player, r.from);
      if (from === undefined || blockedFrom.includes(from)) {
        return false;
      }
      const to = StateUtils.getTarget(state, player, r.to);
      if (to === undefined || blockedTo.includes(to)) {
        return false;
      }
    }

    if (this.playerType !== PlayerType.ANY) {
      if (result.some(r => r.from.player !== this.playerType)
        || result.some(r => r.to.player !== this.playerType)) {
        return false;
      }
    }

    if (result.some(r => !this.slots.includes(r.from.slot))
      || result.some(r => !this.slots.includes(r.to.slot))) {
      return false;
    }

    // Validate sequential counter movements, not just target ownership.
    const damage = new Map<any, number>();
    const read = (list:any) => damage.has(list) ? damage.get(list)! : list.damage;
    const caps = new Map(this.maxAllowedDamage.map(x => [StateUtils.getTarget(state, player, x.target), x.damage]));
    for (const r of result) {
      const from = StateUtils.getTarget(state, player, r.from), to = StateUtils.getTarget(state, player, r.to);
      if (from === to || !from.getPokemonCard() || !to.getPokemonCard() || read(from) < 10) return false;
      damage.set(from, read(from) - 10); damage.set(to, read(to) + 10);
      if (caps.has(to) && read(to) > caps.get(to)!) return false;
    }
    return true;
  }

}
