import { CardManager } from '../../cards/card-manager';
import { GameError } from '../../game-error';
import { GameMessage } from '../../game-message';
import { Card } from '../card/card';
import { EnergyType, SuperType, TrainerType } from '../card/card-types';
import { EnergyCard } from '../card/energy-card';
import { TrainerCard } from '../card/trainer-card';
import { matchesPromptFilter } from '../prompts/prompt-card-filter';
import { revealConcealedCard } from '../prefabs/wotc-facedown';

export function restoreTemporaryStage(card: any, destination: CardList) {
  if(card._exEnergyPokemon){
    if(!('energies' in destination)){card.superType=SuperType.POKEMON;delete card._exBeingAttached;}
    else if(card._exBeingAttached){card.superType=SuperType.ENERGY;delete card._exBeingAttached;}
  }
  if(!('energies' in destination))revealConcealedCard(card);
  if(card._wotcTemporaryStage && !('energies' in destination)) {
    card.stage=card._wotcTemporaryStage.stage;
    delete card._wotcTemporaryStage;
  }
}

export function ecogymDestination(source:CardList,destination:CardList,card:Card):CardList {
 const context=(CardList as any).wotcMovementContext,ownerId=(destination as any)._wotcDiscardOwnerId;
 if(context?.state?.rules?.wotcRules&&['attack','power'].includes(context.kind)&&context.state.players.some((p:any)=>p.discard===source)&&context.discardProtected?.())return source;
 if(context&&!context.knockout&&!context.wholePokemon&&'energies' in source&&card.superType===SuperType.ENERGY&&destination!==source){const owner=context.state.players.find((p:any)=>p.active===source||p.bench.includes(source));if(owner&&owner.id!==context.actorId&&['attack','trainer','power'].includes(context.kind)&&destination===(owner as any).discard&&context.keepProtected?.(owner,source))return source;if(owner&&context.kind==='trainer'&&context.sourceCard?.trainerType!==TrainerType.STADIUM&&context.legendaryProtected?.(owner,source))return source;}

 if(context&&!context.knockout&&!context.wholePokemon&&['attack','trainer'].includes(context.kind)&&'energies' in source&&(source as any).getPokemonCard?.()&&(card.superType===SuperType.ENERGY||(source as any).energies.cards.includes(card))&&destination!==source&&source.cards.some((c:any)=>c._wotcEnergyProtection)){
  const owner=context.state.players.find((p:any)=>p.active===source||p.bench.includes(source));if(owner&&owner.id!==context.actorId)return source;
 }
 if(!context||!('energies' in source)||ownerId===undefined||context.actorId===ownerId||context.knockout)return destination;
 const state=context.state,stadium=state.players.flatMap((p:any)=>p.stadium.cards).find((c:any)=>c._wotcEcogym);
 if(!stadium||state.players.some((p:any)=>p.stadiumAndToolHaveNoEffectTurnsRemaining>0)||!context.isNonColorless(source,card))return destination;
 return state.players.find((p:any)=>p.id===ownerId).hand;
}

export enum StadiumDirection {
  UP = 'up',
  DOWN = 'down'
}

export class CardList {

  public cards: Card[] = [];

  public isPublic: boolean = false;

  public isSecret: boolean = false;

  public faceUpPrize: boolean = false;

  public stadiumDirection: StadiumDirection = StadiumDirection.UP;

  public markedAsNotSecret: boolean = false;

  public static fromList(names: string[]): CardList {
    const cardList = new CardList();
    const cardManager = CardManager.getInstance();
    cardList.cards = names.map(cardName => {
      const card = cardManager.getCardByName(cardName);
      if (card === undefined) {
        throw new GameError(GameMessage.UNKNOWN_CARD, cardName);
      }
      return card;
    });
    return cardList;
  }

  public applyOrder(order: number[]) {
    // Check if order is valid, same length
    if (this.cards.length !== order.length) {
      return;
    }
    // Contains all elements exacly one time
    const orderCopy = order.slice();
    orderCopy.sort((a, b) => a - b);
    for (let i = 0; i < orderCopy.length; i++) {
      if (i !== orderCopy[i]) {
        return;
      }
    }
    // Apply order
    const copy = this.cards.slice();
    for (let i = 0; i < order.length; i++) {
      this.cards[i] = copy[order[i]];
    }
  }

  public moveTo(destination: CardList, count?: number): void {
    if (count === undefined) {
      count = this.cards.length;
    }

    count = Math.min(count, this.cards.length);
    if('energies' in this&&(CardList as any).wotcMovementContext){this.moveCardsTo(this.cards.slice(0,count),destination);return;}
    const cards = this.cards.splice(0, count);
    cards.forEach(card=>restoreTemporaryStage(card,destination));
    destination.cards.push(...cards);
  }

  public moveCardsTo(cards: Card[], destination: CardList): void {
    for (let i = 0; i < cards.length; i++) {
      const actualDestination=ecogymDestination(this,destination,cards[i]);
      let index = this.cards.indexOf(cards[i]);
      if (index !== -1) {
        const card = this.cards.splice(index, 1);
        restoreTemporaryStage(card[0],actualDestination);
        // If this is a PokemonCardList with the energies property, remove the card from energies
        if ('energies' in this) {
          const pokemonList = this as any;
          if (pokemonList.energies && pokemonList.energies.cards) {
            const energyIndex = pokemonList.energies.cards.indexOf(card[0]);
            if (energyIndex !== -1) {
              pokemonList.energies.cards.splice(energyIndex, 1);
            }
          }
        }
        actualDestination.cards.push(card[0]);
        // If actualDestination is a PokemonCardList and card is an energy card (not a Pokemon), add to energies.cards
        if ('energies' in actualDestination) {
          const destPkm = actualDestination as any;
          if (destPkm.energies && destPkm.energies.cards) {
            // Only add actual energy cards (superType === ENERGY), not Pokemon cards that can act as energy
            const isEnergyCard = card[0].superType === SuperType.ENERGY;
            if (isEnergyCard && !destPkm.energies.cards.includes(card[0])) {
              destPkm.energies.cards.push(card[0]);
            }
          }
        }
      } else if ((this as any).tools && Array.isArray((this as any).tools)) {
        // If not found in cards, check tools (for robustness)
        index = (this as any).tools.indexOf(cards[i]);
        if (index !== -1) {
          const card = (this as any).tools.splice(index, 1);
          actualDestination.cards.push(card[0]);
          // If actualDestination is a PokemonCardList and card is an energy card (not a Pokemon), add to energies.cards
          if ('energies' in actualDestination) {
            const destPkm = actualDestination as any;
            if (destPkm.energies && destPkm.energies.cards) {
              // Only add actual energy cards (superType === ENERGY), not Pokemon cards that can act as energy
              const isEnergyCard = card[0].superType === SuperType.ENERGY;
              if (isEnergyCard && !destPkm.energies.cards.includes(card[0])) {
                destPkm.energies.cards.push(card[0]);
              }
            }
          }
        }
      }
    }
  }

  public moveCardTo(card: Card, destination: CardList): void {
    this.moveCardsTo([card], destination);
  }

  public moveToTopOfDestination(destination: CardList): void {
    destination.cards = [...this.cards, ...destination.cards];
  }

  public filter(query: Partial<Card>): Card[] {
    return this.cards.filter(c => matchesPromptFilter(c, query));
  }

  public count(query: Partial<Card>): number {
    return this.filter(query).length;
  }

  public sort(superType: SuperType = SuperType.POKEMON) {
    this.cards.sort((a, b) => {

      const result = this.compareSupertype(a.superType) - this.compareSupertype(b.superType);

      // not of the same supertype
      if (result !== 0) {
        return result;
      }

      // cards match supertype, so sort by subtype
      if ((<any>a).trainerType != null) {
        const cardA = a as TrainerCard;
        if (cardA.trainerType != null && (<any>b).trainerType != null) {
          const cardB = b as TrainerCard;
          const subtypeCompare = this.compareTrainerType(cardA.trainerType) - this.compareTrainerType(cardB.trainerType);
          if (subtypeCompare !== 0) {
            return subtypeCompare;
          }
        }
      }
      else if ((<any>a).energyType != null) {
        const cardA = a as EnergyCard;
        if (cardA.energyType != null && (<any>b).energyType != null) {
          const cardB = b as TrainerCard;
          const subtypeCompare = this.compareEnergyType(cardA.energyType) - this.compareEnergyType(cardB.energyType!);
          if (subtypeCompare !== 0) {
            return subtypeCompare;
          }
        }
      }

      // subtype matches, sort by name
      if (a.name < b.name) {
        return -1;
      } else {
        return 1;
      }
    });
  }

  private compareSupertype(input: SuperType) {
    if (input === SuperType.POKEMON) return 1;
    if (input === SuperType.TRAINER) return 2;
    if (input === SuperType.ENERGY) return 3;
    return Infinity;
  }

  private compareTrainerType(input: TrainerType) {
    if (input === TrainerType.SUPPORTER) return 1;
    if (input === TrainerType.ITEM) return 2;
    if (input === TrainerType.TOOL) return 3;
    if (input === TrainerType.STADIUM) return 4;
    return Infinity;
  }

  private compareEnergyType(input: EnergyType) {
    if (input === EnergyType.BASIC) return 1;
    if (input === EnergyType.SPECIAL) return 2;
    return Infinity;
  }
}
