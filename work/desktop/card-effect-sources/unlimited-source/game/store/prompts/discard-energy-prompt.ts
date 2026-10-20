import { Card } from '../card/card';
import { GameError } from '../../game-error';
import { GameMessage } from '../../game-message';
import { Prompt } from './prompt';
import { PlayerType, SlotType, CardTarget } from '../actions/play-card-action';
import { State } from '../state/state';
import { StateUtils } from '../state-utils';
import { FilterType } from './choose-cards-prompt';
import { SuperType } from '../card/card-types';
import { CardList } from '../state/card-list';
import {matchesPromptFilter} from './prompt-card-filter';


export const DiscardEnergyPromptType = 'Discard energy';

export type DiscardEnergyResultType = { from: CardTarget, index: number }[];

export interface DiscardEnergyTransfer {
  from: CardTarget;
  card: Card;
}

export interface DiscardEnergyOptions {
  allowCancel: boolean;
  min: number;
  max: number | undefined;
  blockedFrom: CardTarget[];
  blockedMap: { source: CardTarget, blocked: number[] }[];
}

export class DiscardEnergyPrompt extends Prompt<DiscardEnergyTransfer[]> {

  readonly type: string = DiscardEnergyPromptType;

  public options: DiscardEnergyOptions;
  public cardList!: CardList;

  constructor(
    playerId: number,
    public message: GameMessage,
    public playerType: PlayerType,
    public slots: SlotType[],
    public filter: FilterType,
    options?: Partial<DiscardEnergyOptions>
  ) {
    super(playerId);

    // Default options
    this.options = Object.assign({}, {
      allowCancel: true,
      min: 0,
      max: undefined,
      blockedFrom: [],
      blockedMap: [],
    }, options);
  }

  public decode(result: DiscardEnergyResultType | null, state: State): DiscardEnergyTransfer[] | null {
    if (result === null) {
      return result;  // operation cancelled
    }
    const player = state.players.find(p => p.id === this.getPerspectivePlayerId());
    if (player === undefined) {
      throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
    }
    const transfers: DiscardEnergyTransfer[] = [];
    const processedCards = new Set<string>();

    result.forEach(t => {
      const cardList = StateUtils.getTarget(state, player, t.from);

      // Check if we've already processed this card from this source
      // Create a unique key using the card target components and index
      const key = `${t.from.player}-${t.from.slot}-${t.from.index}-${t.index}`;
      if (processedCards.has(key)) {
        throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
      }
      processedCards.add(key);

      const card = cardList.cards[t.index];
      // Verify this is a card.
      if (!(card instanceof Card)) {
        throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
      }
      // Verify card is an energy card
      if (card.superType !== SuperType.ENERGY) {
        throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
      }
      transfers.push({ from: t.from, card });
    });
    return transfers;
  }

  public validate(result: DiscardEnergyTransfer[] | null, state?:State): boolean {
    if (result === null) {
      return this.options.allowCancel;  // operation cancelled
    }
    if (result.length < this.options.min || (this.options.max !== undefined && result.length > this.options.max)) {
      return false;
    }
    const seen=new Set<Card>();
    return result.every(r=>{
      if(!r.card||seen.has(r.card)||!matchesPromptFilter(r.card,this.filter))return false;
      seen.add(r.card);
      if(this.options.blockedFrom.some(t=>t.player===r.from.player&&t.slot===r.from.slot&&t.index===r.from.index))return false;
      if(!this.slots.includes(r.from.slot)||r.from.player!==this.playerType&&this.playerType!==PlayerType.ANY)return false;
      if(state){const owner=state.players.find(p=>p.id===this.getPerspectivePlayerId());if(!owner)return false;const list=StateUtils.getTarget(state,owner,r.from),index=list.cards.indexOf(r.card);if(index<0)return false;
        if(this.options.blockedMap.some(entry=>entry.source.player===r.from.player&&entry.source.slot===r.from.slot&&entry.source.index===r.from.index&&entry.blocked.includes(index)))return false;
      }
      return true;
    });
  }
}
