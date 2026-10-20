import { ShuffleDeckPrompt } from './game/store/prompts/shuffle-prompt';
import { TrainerEffect } from './game/store/effects/play-card-effects';
import { EvolveEffect } from './game/store/effects/game-effects';
import { ChoosePokemonPrompt } from './game/store/prompts/choose-pokemon-prompt';
import { ChooseCardsPrompt } from './game/store/prompts/choose-cards-prompt';
import { PlayerType, SlotType } from './game/store/actions/play-card-action';
import { Stage, SuperType, TrainerType } from './game/store/card/card-types';
import { PokemonCard } from './game/store/card/pokemon-card';
import { GameError } from './game/game-error';
import { GameMessage } from './game/game-message';
import { cubeEvolution } from './tcg-lab-cube';

/* Evolution items retain their printed timing/stage permission while the family
 * relationship uses the selected cube's mutant and Prize-class rules. */
export function cubeEvolutionTrainer(store: any, state: any, effect: any): boolean {
  const rules = state.rules?.cubeRules;
  if (!rules?.mutantEvolution || !(effect instanceof TrainerEffect)) return false;
  const card = effect.trainerCard;
  const fromDeck = ['Wally', 'Evosoda'].includes(card.name);
  if (!(fromDeck || (card.trainerType === TrainerType.ITEM && ['Rare Candy', 'Pokémon Breeder', 'Pokemon Breeder'].includes(card.name)))) return false;
  const player = effect.player;
  const legacyCandy = card.name === 'Rare Candy' && /Stage 1 or (?:a )?Stage 2/i.test(card.text || '');
  if (player.cannotEvolvePokemonCards || player.cannotPlayPokemonCards) throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
  const source = fromDeck ? player.deck : player.hand;
  const slots = [player.active, ...player.bench];
  const matches = (list: any, evolution: any): boolean => {
    const basic = list.getPokemonCard();
    if (!basic || (fromDeck ? ![Stage.BASIC, Stage.STAGE_1].includes(basic.stage) : basic.stage !== Stage.BASIC) || list.cannotEvolveNextTurn || !(evolution instanceof PokemonCard)) return false;
    if (!fromDeck && evolution.stage !== Stage.STAGE_2 && !(legacyCandy && evolution.stage === Stage.STAGE_1)) return false;
    if (fromDeck && ![Stage.STAGE_1, Stage.STAGE_2].includes(evolution.stage)) return false;
    if (!legacyCandy && card.name !== 'Wally' && (state.turn <= 2 || list.pokemonPlayedTurn >= state.turn)) return false;
    return cubeEvolution(basic, evolution, !fromDeck, rules);
  };
  const possible = slots.filter(list => source.cards.some((c: any) => matches(list, c)));
  if (!possible.length) throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  const target = (i: number) => ({ player: PlayerType.BOTTOM_PLAYER, slot: i === 0 ? SlotType.ACTIVE : SlotType.BENCH, index: i === 0 ? 0 : i - 1 });
  store.prompt(state, new ChoosePokemonPrompt(player.id, GameMessage.CHOOSE_POKEMON_TO_EVOLVE, PlayerType.BOTTOM_PLAYER, [SlotType.ACTIVE, SlotType.BENCH], { min: 1, max: 1, allowCancel: false, blocked: slots.flatMap((list: any, i: number) => possible.includes(list) ? [] : [target(i)]) }), (chosen: any[]) => {
    const list = chosen[0];
    const blocked = source.cards.flatMap((c: any, i: number) => matches(list, c) ? [] : [i]);
    store.prompt(state, new ChooseCardsPrompt(player.id, GameMessage.CHOOSE_CARD_TO_EVOLVE, source, { superType: SuperType.POKEMON }, { min: 1, max: 1, allowCancel: false, blocked }), (selected: any[]) => {
      const evolution = selected[0];
      if (!matches(list, evolution)) throw new GameError(GameMessage.INVALID_TARGET);
      const evolve = new EvolveEffect(player, list, evolution);
      (evolve as any)._dpHandEvolution = !fromDeck;
      (evolve as any)._xyEvolutionSource = source;
      store.reduceEffect(state, evolve);
      if (fromDeck) store.prompt(state, new ShuffleDeckPrompt(player.id), (order: number[]) => player.deck.applyOrder(order));
    });
  });
  return true;
}
