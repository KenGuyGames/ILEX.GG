import { Card } from '../card/card';
import { CardType } from '../card/card-types';
import { GameMessage } from '../../game-message';
import { Prompt } from './prompt';
import { StateUtils } from '../state-utils';

export const ChooseEnergyPromptType = 'Choose energy';

export interface ChooseEnergyOptions {
  allowCancel: boolean;
}

export type EnergyMap = { card: Card, provides: CardType[], providedGroups?: CardType[][] }

export class ChooseEnergyPrompt extends Prompt<EnergyMap[]> {

  readonly type: string = ChooseEnergyPromptType;

  public options: ChooseEnergyOptions;

  constructor(
    playerId: number,
    public message: GameMessage,
    public energy: EnergyMap[],
    public cost: CardType[],
    options?: Partial<ChooseEnergyOptions>
  ) {
    super(playerId);
    this.energy = StateUtils.physicalEnergyMap(this.energy);

    // Default options
    this.options = Object.assign({}, {
      allowCancel: true
    }, options);

    if (this.options.allowCancel === false) {
      this.cost = this.getCostThatCanBePaid();
    }
  }

  public decode(result: number[] | null): EnergyMap[] | null {
    if (result === null) {
      return null;
    }
    const energy: EnergyMap[] = this.energy;
    if(new Set(result).size!==result.length||result.some(index=>!Number.isInteger(index)||index<0||index>=energy.length))throw new Error(GameMessage.INVALID_PROMPT_RESULT);
    return result.map(index => energy[index]);
  }

  public validate(result: EnergyMap[] | null): boolean {
    if (result === null) {
      return this.options.allowCancel;
    }
    if(new Set(result.map(entry=>entry.card)).size!==result.length)return false;
    if (!StateUtils.checkExactEnergy(result, this.cost)) {
      return false;
    }
    return true;
  }

  private getCostThatCanBePaid(): CardType[] {
    const payable: CardType[] = [];
    // Prefer printed typed requirements, then spend any remaining units on C.
    const ordered=[...this.cost.filter(type=>type!==CardType.COLORLESS),...this.cost.filter(type=>type===CardType.COLORLESS)];
    for(const type of ordered)if(StateUtils.checkEnoughEnergy(this.energy,[...payable,type]))payable.push(type);
    return payable;
  }

}
