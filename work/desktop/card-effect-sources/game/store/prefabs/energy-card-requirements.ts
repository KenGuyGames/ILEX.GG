import { StateUtils } from '../state-utils';
import { CardType, SuperType } from '../card/card-types';
import { CheckProvidedEnergyEffect } from '../effects/check-effects';
import { ChooseCardsPrompt } from '../prompts/choose-cards-prompt';
import { GameError } from '../../game-error';
import { GameMessage } from '../../game-message';

// Discard requirements count distinct cards, even when a card provides multiple
// units or a choice of types. Look ahead so an early choice cannot strand a
// remaining requirement that could otherwise have been paid.
export function chooseEnergyCardsForRequirements(store: any, state: any, player: any, list: any, requirements: CardType[], done: (cards: any[]) => void, unavailable?: () => void): any {
  const energy = new CheckProvidedEnergyEffect(player, list);
  store.reduceEffect(state, energy);
  const entries = energy.energyMap.filter((x: any) => x.card.superType === SuperType.ENERGY)
    .map((x: any) => ({card:x.card,provides:[...new Set(x.provides)]}));
  const enough = (map: any[], cost: CardType[]) => StateUtils.checkEnoughEnergy(map, cost);
  if (!enough(entries, requirements)) {
    if (unavailable) return unavailable();
    throw new GameError(GameMessage.NOT_ENOUGH_ENERGY);
  }
  const chosen: any[] = [];
  const choose = (index: number): any => {
    if (index >= requirements.length) return done(chosen);
    const available = entries.filter((x: any) => !chosen.includes(x.card));
    const eligible = available.filter((x: any) => enough([x], [requirements[index]])
      && enough(available.filter((other: any) => other.card !== x.card), requirements.slice(index + 1)));
    return store.prompt(state, new ChooseCardsPrompt(player, GameMessage.CHOOSE_ENERGIES_TO_DISCARD, list, {superType:SuperType.ENERGY}, {
      min:1,max:1,allowCancel:false,blocked:list.cards.map((c: any,i: number) => eligible.some((x: any) => x.card === c) ? -1:i).filter((i: number) => i>=0)
    }), (cards: any[]) => { chosen.push(cards[0]);choose(index+1); });
  };
  choose(0);
  return state;
}
