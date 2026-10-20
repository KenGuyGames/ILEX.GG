import {cubeBasePrizes} from '../../../tcg-lab-cube';
import { outgoingBeforeWeakness, rememberOutgoingWeakness } from '../../../tcg-lab-outgoing-tools';
import { dpDeclarePower,dpPowerAlreadyUsed } from '../../../tcg-lab-dp-power-window';
import { SelectPrompt } from '../prompts/select-prompt';
import { ChooseCardsPrompt } from '../prompts/choose-cards-prompt';
import { chooseEnergyCardsForRequirements } from '../prefabs/energy-card-requirements';
import { GameError } from '../../game-error';
import { GameLog, GameMessage } from '../../game-message';
import { CardTag, CardType, SpecialCondition, SuperType, EnergyType,TrainerType } from '../card/card-types';
import { PokemonCard, getPrimaryCardType } from '../card/pokemon-card';
import { Power, PowerType, Resistance, Weakness } from '../card/pokemon-types';
import { ApplyWeaknessEffect, DealDamageEffect, DiscardCardsEffect } from '../effects/attack-effects';
import { Player } from '../state/player';
import {
  AddSpecialConditionsPowerEffect,
  CheckPokemonAttacksEffect,CheckSpecialConditionRemovalEffect,CheckAttackCostEffect,
  CheckPokemonStatsEffect,
  CheckPokemonTypeEffect,
  CheckProvidedEnergyEffect
} from '../effects/check-effects';
import { Effect } from '../effects/effect';
import {
  AttackEffect,
  EvolveEffect,
  HealEffect, KnockOutEffect,
  PlaceDamageCountersEffect,
  PowerEffect,
  PutDamageCountersEffect,
  TrainerPowerEffect,
  UseAttackEffect,
  UsePowerEffect,
  UseStadiumEffect,
  UseTrainerPowerEffect,
  EffectOfAbilityEffect,
} from '../effects/game-effects';
import { AfterAttackEffect, BeforeDoingDamageEffect, EndTurnEffect } from '../effects/game-phase-effects';
import { PlayerType, SlotType } from '../actions/play-card-action';
import { StateUtils } from '../state-utils';
import { GamePhase, State } from '../state/state';
import { StoreLike } from '../store-like';
import { MoveCardsEffect } from '../effects/game-effects';
import { runDelegatedCopiedAttackGenerator } from '../prefabs/copy-attack-delegation';
import { GameStatsTracker } from '../game-stats-tracker';
import { PokemonCardList } from '../state/pokemon-card-list';
import { MOVE_POKEMON_OFF_BOARD, MOVE_CARDS, COIN_FLIP_PROMPT, IS_ABILITY_BLOCKED } from '../prefabs/prefabs';
import { OPPONENT_WEAKNESS_AURA_POWER, STAMP_ABILITY_LOCK_ACTIVATION } from '../prefabs/ability-lock';
import { RESOLVE_COIN_FLIP_EFFECT, RUN_COIN_FLIP_SEQUENCE } from '../prefabs/attack-coin-reflip';
import { CardList } from '../state/card-list';
import { ConfirmPrompt } from '../prompts/confirm-prompt';
import { checkState } from './check-effect';
import { ChooseAttackPrompt } from '../prompts/choose-attack-prompt';
import { DiscardEnergyPrompt } from '../prompts/discard-energy-prompt';
import { Card } from '../card/card';
import { Attack } from '../card/pokemon-types';
import { WaitPrompt } from '../prompts/wait-prompt';
import { CoinFlipEffect, CoinFlipSequenceEffect } from '../effects/play-card-effects';

/** Keep in sync with ptcg-play-react {@link BOARD3D_ABILITY_ANIMATION_DURATION_SEC} (× 1000). */
const ABILITY_ANIMATION_WAIT_MS = 900;

function emitAbilityAnimationEvent(
  store: StoreLike,
  player: { id: number },
  card: { id: number | string },
  slot: 'active' | 'bench',
  index: number,
  abilityName: string,
): void {
  const game = (store as any).handler;
  if (game && game.core && typeof game.core.emit === 'function') {
    game.core.emit((c: any) => {
      if (typeof c.socket !== 'undefined') {
        c.socket.emit(`game[${game.id}]:ability`, {
          playerId: player.id,
          cardId: card.id,
          slot,
          index,
          abilityName,
        });
      }
    });
  }
}


export function applyWeaknessAndResistance(
  damage: number,
  cardTypes: CardType[],
  weakness: Weakness[],
  resistance: Resistance[]
): number {
  let multiply = 1;
  let modifier = 0;

  const allTypes = cardTypes;

  for (const item of weakness) {
    if (allTypes.includes(item.type)) {
      if (item.multiplier !== undefined) {
        multiply *= item.multiplier;
      } else if (item.value === undefined) {
        multiply *= 2;
      } else {
        modifier += item.value;
      }
    }
  }

  for (const item of resistance) {
    if (allTypes.includes(item.type)) {
      modifier += item.value;
    }
  }

  return (damage * multiply) + modifier;
}

/**
 * Fully reset a board slot after its Pokémon leave play.
 * Attachments must already have been moved off the slot before calling this.
 */
function resetEmptyPokemonSlot(slot: PokemonCardList): void {
  slot.removeAttackEffects();
  slot.clearEffects();
  slot.damage = 0;
  slot.hp = 0;
  slot.specialConditions = [];
  slot.poisonDamage = 10;
  slot.burnDamage = 20;
  slot.confusionDamage = 30;
  slot.marker.markers = [];
  slot.tools = [];
  slot.boardEffect = [];
  slot.abilityLockActivationOrder = 0;
  slot.pokemonPlayedTurn = 0;
  slot.hpBonus = 0;
  slot.attacksThisTurn = undefined;
  slot.stadium = undefined;
  slot.sleepFlips = 1;
  slot.showAllStageAbilities = false;
  slot.triggerEvolutionAnimation = false;
  slot.showBasicAnimation = false;
  slot.triggerAttackAnimation = false;
  slot.isActivatingCard = false;
}

function* useAttack(next: Function, store: StoreLike, state: State, effect: UseAttackEffect | AttackEffect): IterableIterator<State> {
  const player = effect.player;
  const opponent = StateUtils.getOpponent(state, player);
  if(effect instanceof UseAttackEffect){
    if((effect.attack as any)._swshVstar&&player.usedVSTAR)throw new GameError(GameMessage.LABEL_VSTAR_USED);
    const minimum=(effect.attack as any)._swshLostZoneMinimum;
    if(minimum&&player.lostzone.cards.length<minimum)throw new GameError(GameMessage.CANNOT_USE_ATTACK);
  }

  //Skip attack on first turn
  if (state.turn === 1 && effect.attack.canUseOnFirstTurn !== true && state.rules.attackFirstTurn == false) {
    throw new GameError(GameMessage.CANNOT_ATTACK_ON_FIRST_TURN);
  }

  const attack=effect.attack;
  let attackingPokemon=effect.source||player.active;
  if(effect instanceof UseAttackEffect&&!effect.explicitSource&&attackingPokemon===player.active&&!player.active.getPokemonCard()?.attacks.includes(attack)){
    const candidates=player.bench.filter(slot=>slot.getPokemonCard()?.attacks.includes(attack)&&attack.useOnBench);
    if(candidates.length===1)attackingPokemon=candidates[0];
  }
  const sp=attackingPokemon.specialConditions;
  const ignoreStatusConditions=effect instanceof UseAttackEffect&&effect.ignoreStatusConditions;
  if((sp.includes(SpecialCondition.PARALYZED)||sp.includes(SpecialCondition.ASLEEP))&&!ignoreStatusConditions)
    throw new GameError(GameMessage.BLOCKED_BY_SPECIAL_CONDITION);
  const preceding=(attack as any)._wotcRequiredPreviousAttack,last=(attackingPokemon.getPokemonCard() as any)?._wotcLastUsedAttack;
  if(preceding&&(last?.name!==preceding||last.turn!==(player as any).wotcLastTurnEnded))throw new GameError(GameMessage.CANNOT_USE_ATTACK);

  // Check if Pokemon cannot attack next turn
  if (attackingPokemon.cannotAttackNextTurn || attackingPokemon.marker.hasMarker('WOTC_PERSISTENT_ATTACK_LOCK')) {
    throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
  }

  // Player-wide attack lock (e.g. Steelix Gigaton Shake, Cobalion-GX Iron Rule)
  if (player.cannotAttackTurnsRemaining > 0) {
    throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
  }

  if (player.cannotAttackMaxEnergyTurnsRemaining > 0 && player.cannotAttackMaxEnergy !== null) {
    const checkEnergy = new CheckProvidedEnergyEffect(player, attackingPokemon);
    store.reduceEffect(state, checkEnergy);
    const energyCount = checkEnergy.energyMap.reduce((sum, entry) => sum + entry.provides.length, 0);
    if (energyCount <= player.cannotAttackMaxEnergy) {
      throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    }
  }

  // Check if specific attack cannot be used next turn
  if (attackingPokemon.cannotUseAttacksNextTurn.includes(attack.name)) {
    throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
  }

  // Check if a specific attack was disabled by an opponent's effect
  if (attackingPokemon.blockedAttackNameNextTurn === attack.name) {
    throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
  }
  if (attackingPokemon.onlyAllowedAttackNameNextTurn !== undefined
    && attackingPokemon.onlyAllowedAttackNameNextTurn !== attack.name) {
    throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
  }
  if (attackingPokemon.blockedAttackNameUntilLeavesActive === attack.name) {
    throw new GameError(GameMessage.CANNOT_USE_ATTACK);
  }
  const attackingCard = attackingPokemon.getPokemonCard();
  if (attackingCard?.cannotUseAttackUntilLeavesPlay === attack.name) {
    throw new GameError(
      attack.name === 'Leek Slap'
        ? GameMessage.LEEK_SLAP_CANNOT_BE_USED_AGAIN
        : GameMessage.CANNOT_USE_ATTACK,
    );
  }
  if (player.cannotUseGXAttacks && (attack.gxAttack === true || attack.name.includes('-GX'))) {
    throw new GameError(GameMessage.CANNOT_USE_ATTACK);
  }

  if (!(state.rules as any).wotcRules) {
  // Smokescreen / Sand-Attack: flip coin(s); any tails cancels the attack
  if (!(state.rules.exEraRules&&StateUtils.getStadiumCard(state)?.name==='Holon Circle')&&(attackingPokemon.coinFlipCancelAttackNextTurn > 0 || attackingPokemon.marker.hasMarker('WOTC_PERSISTENT_COIN_LOCK'))) {
    const flips = Math.max(attackingPokemon.coinFlipCancelAttackNextTurn, 1);
    let anyTails = false;

    for (let i = 0; i < flips; i++) {
      let heads = false;
      state = COIN_FLIP_PROMPT(store, state, player, result => {
        heads = result;
      });
      if (store.hasPrompts()) {
        yield store.waitPrompt(state, () => next());
      }
      if (!heads) {
        anyTails = true;
      }
    }

    if (anyTails) {
      state = store.reduceEffect(state, new EndTurnEffect(player));
      return state;
    }
  }

  }

  // Get the actual PokemonCard for power checks
  const attackingPokemonCard = attackingPokemon.getPokemonCard();
  // Check for barrage on powers (and not blocked)
  let hasBarragePower = false;
  if (attackingPokemonCard) {
    hasBarragePower = attackingPokemonCard.powers.some(
      power => power.barrage
    );
  }

  const checkAttackCost = new CheckAttackCostEffect(player, attack, attackingPokemon);
  state = store.reduceEffect(state, checkAttackCost);

  const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, attackingPokemon);
  state = store.reduceEffect(state, checkProvidedEnergy);

  if (StateUtils.checkEnoughEnergy(checkProvidedEnergy.energyMap, checkAttackCost.cost as CardType[]) === false) {
    throw new GameError(GameMessage.NOT_ENOUGH_ENERGY);
  }

  if((state.rules as any).dpEraRules){const field=(attack as any)._dpRequiredFieldUnits;if(field?.length){const entries=[player.active,...player.bench].filter(list=>list.getPokemonCard()).flatMap(list=>{const check=new CheckProvidedEnergyEffect(player,list);store.reduceEffect(state,check);return check.energyMap;});if(!StateUtils.checkEnoughEnergy(entries,field))throw new GameError(GameMessage.NOT_ENOUGH_ENERGY);}const hand=(attack as any)._dpRequiredHandCards;if(hand&&player.hand.cards.filter(card=>card.superType===SuperType.ENERGY&&(!hand.energy||(card as any).provides.includes(hand.energy))).length<hand.amount)throw new GameError(GameMessage.NOT_ENOUGH_ENERGY);}
  const physical=(attack as any)._dpRequiredAttachedCards;
  if(physical){const eligible=checkProvidedEnergy.energyMap.filter((entry:any)=>(!physical.basic||entry.card.energyType===EnergyType.BASIC)&&(!physical.energy||StateUtils.providesMatchesType(entry.provides,physical.energy)));if(new Set(eligible.map((entry:any)=>entry.card)).size<physical.amount)throw new GameError(GameMessage.NOT_ENOUGH_ENERGY);}
  if((state.rules as any).dpEraRules)for(const requirements of [(attack as any)._dpRequiredUnits,(attack as any)._wotcRequiredEnergyCards,(attack as any)._wotcRequiredEnergyReturn])if(requirements?.length&&!StateUtils.checkEnoughEnergy(checkProvidedEnergy.energyMap,requirements))throw new GameError(GameMessage.NOT_ENOUGH_ENERGY);
  if(state.rules.exEraRules&&attackingPokemon===player.active&&StateUtils.getStadiumCard(state)?.name==='Holon Circle'&&!state.players.some(p=>p.stadiumAndToolHaveNoEffectTurnsRemaining>0)){const circle=StateUtils.getStadiumCard(state)!;const circleOwner=state.players.find(p=>p.stadium.cards.includes(circle))!;circleOwner.stadium.moveCardsTo([circle],circleOwner.discard);state=store.reduceEffect(state,new EndTurnEffect(player));return state;}
  let wotcEnergyCostPaid = false;
  let roaringDamage:number|undefined;
  const roaring=(attack as any)._wotcRoaringCost;
  if((state.rules as any).wotcRules&&roaring){const entries=checkProvidedEnergy.energyMap.filter(entry=>StateUtils.providesMatchesType(entry.provides,roaring.energy));const units=entries.reduce((n,entry)=>n+Math.min(StateUtils.getProvidesUnitCount(entry.provides,entry),entry.provides.filter(type=>type===roaring.energy||type===CardType.ANY).length),0);attackingPokemon.moveCardsTo(entries.map(entry=>entry.card),player.discard);roaringDamage=roaring.base+units*roaring.amount;wotcEnergyCostPaid=true;}
  let wotcRequiredEnergyCount = 0;
  const cardRequirements = (attack as any)._wotcRequiredEnergyCards;
  const returnRequirements = (attack as any)._wotcRequiredEnergyReturn;
  if ((state.rules as any).wotcRules && returnRequirements?.length) {
    yield chooseEnergyCardsForRequirements(store,state,player,attackingPokemon,returnRequirements,(cards: any[])=>{attackingPokemon.moveCardsTo(cards,player.hand);wotcRequiredEnergyCount=cards.length;next();});
    wotcEnergyCostPaid=true;
  }
  if ((state.rules as any).wotcRules && cardRequirements?.length) {
    yield chooseEnergyCardsForRequirements(store,state,player,attackingPokemon,cardRequirements,(cards: any[]) => {
      attackingPokemon.moveCardsTo(cards,player.discard);
      wotcRequiredEnergyCount=cards.length;
      next();
    });
    wotcEnergyCostPaid=true;
  }
  if ((state.rules as any).wotcRules) {
    const required = attack.text.match(/Discard (all|a|\d+) (?:\[([A-Z])\] )?Energy(?: cards?)? attached to [^.]+? in order to use this attack/i);
    if (required) {
      const types: Record<string, CardType> = { G: CardType.GRASS, R: CardType.FIRE, W: CardType.WATER, L: CardType.LIGHTNING, P: CardType.PSYCHIC, F: CardType.FIGHTING, D: CardType.DARK, M: CardType.METAL, C: CardType.COLORLESS };
      const eligible = checkProvidedEnergy.energyMap.filter(e => !required[2] || e.provides.includes(types[required[2]]) || e.provides.includes(CardType.ANY)).map(e => e.card);
      const count = required[1].toLowerCase() === 'all' ? eligible.length : required[1].toLowerCase()==='a'?1:Number(required[1]);
      if (eligible.length < count) throw new GameError(GameMessage.NOT_ENOUGH_ENERGY);
      if (count) {
        yield store.prompt(state, new ChooseCardsPrompt(player, GameMessage.CHOOSE_ENERGIES_TO_DISCARD, attackingPokemon, { superType: SuperType.ENERGY }, { min: count, max: count, allowCancel: false, blocked: attackingPokemon.cards.map((c,i)=>eligible.includes(c)?-1:i).filter(i=>i>=0) }), chosen => {
          if (chosen) { wotcRequiredEnergyCount = chosen.length; attackingPokemon.moveCardsTo(chosen, player.discard); }
          next();
        });
      }
      wotcEnergyCostPaid = true;
    }
  }
  // WOTC attack cancellation follows required costs.
  if ((state.rules as any).wotcRules) {
  // Smokescreen / Sand-Attack: flip coin(s); any tails cancels the attack
  if (!(state.rules.exEraRules&&StateUtils.getStadiumCard(state)?.name==='Holon Circle')&&(attackingPokemon.coinFlipCancelAttackNextTurn > 0 || attackingPokemon.marker.hasMarker('WOTC_PERSISTENT_COIN_LOCK'))) {
    const flips = Math.max(attackingPokemon.coinFlipCancelAttackNextTurn, 1);
    let anyTails = false;

    for (let i = 0; i < flips; i++) {
      let heads = false;
      state = COIN_FLIP_PROMPT(store, state, player, result => {
        heads = result;
      });
      if (store.hasPrompts()) {
        yield store.waitPrompt(state, () => next());
      }
      if (!heads) {
        anyTails = true;
      }
    }

    if (anyTails) {
      state = store.reduceEffect(state, new EndTurnEffect(player));
      return state;
    }
  }

  }

  const preAttack:any={type:'WOTC_BEFORE_ATTACK_EFFECT',player,attack,preventDefault:false,cancelled:false};
  state=store.reduceEffect(state,preAttack);
  if(store.hasPrompts())yield store.waitPrompt(state,()=>next());
  if(preAttack.cancelled)return store.reduceEffect(state,new EndTurnEffect(player));
  if (sp.includes(SpecialCondition.CONFUSED)) {
    let flip = false;

    store.log(state, GameLog.LOG_FLIP_CONFUSION, { name: player.name });
    state = COIN_FLIP_PROMPT(store, state, player, result => {
      flip = result;
    }, {system:true});
    if (store.hasPrompts()) {
      yield store.waitPrompt(state, () => next());
    }

    if (flip === false) {
      store.log(state, GameLog.LOG_HURTS_ITSELF);
      if ((state.rules as any).wotcRules) {
        const confusionAttack = new AttackEffect(player, opponent, { name: 'Confusion', cost: [], damage: 20, text: '' });
        confusionAttack.source = attackingPokemon;
        const selfDamage = new DealDamageEffect(confusionAttack, 20);
        selfDamage.target = attackingPokemon;
        state.phase = GamePhase.ATTACK;
        state = store.reduceEffect(state, selfDamage);
      } else player.active.damage += player.active.confusionDamage;
      state = store.reduceEffect(state, new EndTurnEffect(player));
      return state;
    }
  }

  store.log(state, GameLog.LOG_PLAYER_USES_ATTACK, { name: player.name, attack: attack.name });
  state.phase = GamePhase.ATTACK;

  // At the start of the attack, initialize pendingAttackTargets
  //  (attackingPokemon as any).pendingAttackTargets = [];

  const attackEffect = (effect instanceof AttackEffect) ? effect : new AttackEffect(player, opponent, attack);
  (attackEffect as any)._wotcRoaringDamage=roaringDamage;
  attackEffect.source = attackingPokemon;
  (state as any).wotcCurrentAttack=attackEffect;
  (attackEffect as any).wotcEnergyCostPaid = wotcEnergyCostPaid;
  (attackEffect as any).wotcRequiredEnergyCount = wotcRequiredEnergyCount;
  if (attackingPokemon === player.active && attackingPokemon.whileActiveAttackDamageBonus > 0) {
    attackEffect.damage += attackingPokemon.whileActiveAttackDamageBonus;
  }

  const copycatCard = attackingPokemon.getPokemonCard();
  const delegateFrom = effect instanceof UseAttackEffect ? effect.delegateFrom : undefined;

  if (delegateFrom && copycatCard) {
    state = yield* runDelegatedCopiedAttackGenerator(next, {
      store,
      state,
      player,
      opponent,
      copycatCard,
      sourceCard: delegateFrom,
      selectedAttack: attack,
      sourceSlot: attackingPokemon,
      energyCostPaid: wotcEnergyCostPaid,
      requiredEnergyCount: wotcRequiredEnergyCount,
      skipLog: true,
      skipAfterAttack: false,
    });
  } else {
    if ((state.rules as any).wotcRules) (state as any).labDeferStatus = true;
    state = store.reduceEffect(state, attackEffect);

    if (store.hasPrompts()) {
      yield store.waitPrompt(state, () => next());
    }
  }

  // --- Attack Animation Trigger ---
  // Set triggerAttackAnimation on the attacking Pokemon
  attackingPokemon.triggerAttackAnimation = true;

  // Find slot and index for the attackingPokemon
  let slot: string | undefined = undefined;
  let index: number | undefined = undefined;
  if (player.active === attackingPokemon) {
    slot = 'active';
    index = 0;
  } else {
    slot = 'bench';
    index = player.bench.indexOf(attackingPokemon);
  }
  const card = attackingPokemon.getPokemonCard();
  const cardId = card ? card.id : undefined;
  const cardType = card ? getPrimaryCardType(card) : undefined;

  // Emit attack animation event
  const game = (store as any).handler;
  if (game && game.core && typeof game.core.emit === 'function') {
    game.core.emit((c: any) => {
      if (typeof c.socket !== 'undefined') {
        c.socket.emit(`game[${game.id}]:attack`, {
          playerId: player.id,
          cardId,
          slot,
          index,
          cardType,
          damage: attackEffect.damage,
          opponentId: opponent.id
        });
      }
    });
  }

  // Yield a wait prompt for the animation (1 second)
  yield store.prompt(state, new WaitPrompt(player.id, 1000, 'Attack animation'), () => {
    // After wait, clear the animation flag
    attackingPokemon.triggerAttackAnimation = false;
    next();
  });
  // --- End Attack Animation Trigger ---

  if (!delegateFrom) {
    const beforeDoingDamageEffect = new BeforeDoingDamageEffect(attackEffect);
    state = store.reduceEffect(state, beforeDoingDamageEffect);

    if (attackEffect.damage > 0) {
      const dealDamage = new DealDamageEffect(attackEffect, attackEffect.damage);
      state = store.reduceEffect(state, dealDamage);

      if (store.hasPrompts()) {
        yield store.waitPrompt(state, () => next());
      }
    }

    // TCG Lab damage before conditions
    (state as any).labDeferStatus = false;
    const statuses = (state as any).labPendingStatus || [];(state as any).labPendingStatus = [];
    for (const status of statuses) state = store.reduceEffect(state,status);
    if (store.hasPrompts()) yield store.waitPrompt(state, () => next());
    const afterAttackEffect = new AfterAttackEffect(effect.player, opponent, attack, attackEffect);
    state = store.reduceEffect(state, afterAttackEffect);

    if (store.hasPrompts()) {
      yield store.waitPrompt(state, () => next());
    }
  }

  if((state.rules as any).dpEraRules&&(state as any)._dpLinkLightning?.turn===state.turn&&(state as any)._dpLinkLightning.playerId===player.id){
    const link=(state as any)._dpLinkLightning;delete (state as any)._dpLinkLightning;
    state=checkState(store,state);if(store.hasPrompts())yield store.waitPrompt(state,()=>next());
    state=checkState(store,state);if(store.hasPrompts())yield store.waitPrompt(state,()=>next());
    if(player.active.getPokemonCard()!==link.card)return store.reduceEffect(state,new EndTurnEffect(player));
    const check=new CheckPokemonAttacksEffect(player);store.reduceEffect(state,check);const energy=new CheckProvidedEnergyEffect(player,player.active);store.reduceEffect(state,energy);
    const attacks=[...link.card.attacks,...check.attacks].filter((candidate:any)=>{const cost=new CheckAttackCostEffect(player,candidate);store.reduceEffect(state,cost);if(!StateUtils.checkEnoughEnergy(energy.energyMap,cost.cost))return false;if(candidate._dpRequiredHandCards){const requirement=candidate._dpRequiredHandCards;if(player.hand.cards.filter((card:any)=>card.superType===SuperType.ENERGY&&(!requirement.energy||card.provides.includes(({Lightning:CardType.LIGHTNING} as any)[requirement.energy]))).length<requirement.amount)return false;}return true;});
    if(!attacks.length)return store.reduceEffect(state,new EndTurnEffect(player));
    const view=Object.assign(Object.create(Object.getPrototypeOf(link.card)),link.card);view.attacks=attacks;
    let selected:any=null;yield store.prompt(state,new ChooseAttackPrompt(player.id,GameMessage.CHOOSE_ATTACK_TO_COPY,[view],{allowCancel:true}),(choice:any)=>{selected=choice;next();});
    if(!selected)return store.reduceEffect(state,new EndTurnEffect(player));
    const additional=new UseAttackEffect(player,selected);additional.delegateFrom=check.attackSources.get(selected);return yield* useAttack(next,store,state,additional);
  }
  if ((attack.barrage || hasBarragePower) && !(effect as any)._barrageUsed) {
    state = checkState(store, state);
    if (store.hasPrompts()) {
      yield store.waitPrompt(state, () => next());
    }
    state = checkState(store, state);
    if (store.hasPrompts()) {
      yield store.waitPrompt(state, () => next());
    }
    let wantToUse: boolean | undefined = undefined;
    yield store.prompt(state, new ConfirmPrompt(
      player.id,
      GameMessage.WANT_TO_USE_ABILITY
    ), result => {
      wantToUse = result;
      next();
    });

    if (wantToUse) {
      // If barrage is from a power, prompt for attack choice
      if (!attack.barrage && hasBarragePower) {
        // Gather all attackable cards: the actual Pokemon and any attached tool with attacks
        const attackableCards: Card[] = [];
        const mainPokemon = attackingPokemon.getPokemonCard();
        if (mainPokemon) {
          attackableCards.push(mainPokemon);
        }
        if (attackingPokemon.tools.length > 0) {
          attackableCards.push(attackingPokemon.tools[0]);
        }
        yield store.prompt(state, new ChooseAttackPrompt(
          player.id,
          GameMessage.CHOOSE_ATTACK_TO_COPY,
          attackableCards,
          { allowCancel: false }
        ), (selectedAttack: Attack | null) => {
          if (selectedAttack) {
            const newEffect = new AttackEffect(player, opponent, selectedAttack);
            (newEffect as any)._barrageUsed = true;
            const generator = useAttack(() => generator.next(), store, state, newEffect);
            state = generator.next().value;
          } else {
            state = store.reduceEffect(state, new EndTurnEffect(player));
          }
          next();
        });
        return state;
      } else {
        // Default: use the same attack again
        const newEffect = new UseAttackEffect(player, attack);
        (newEffect as any)._barrageUsed = true;
        const generator = useAttack(() => generator.next(), store, state, newEffect);
        return generator.next().value;
      }
    }
    return store.reduceEffect(state, new EndTurnEffect(player));
  }

  return store.reduceEffect(state, new EndTurnEffect(player));
}

/**
 * Probe ability/Poké-Power locks before the real PowerEffect runs.
 *
 * Locker cards (Mesprit, Hex Maniac, etc.) and ability owners both handle the same
 * PowerEffect in one propagateEffect pass. If the owner runs first, side effects
 * (draw, damage, markers) can apply before the locker throws — with no rollback.
 * This probe uses a distinct Power object so WAS_POWER_USED never matches, while
 * still carrying the real power's lock-relevant flags.
 */
function assertActivatedPowerNotLocked(
  store: StoreLike,
  state: State,
  player: Player,
  card: PokemonCard,
  power: Power,
): void {
  if((card as any)._wotcRevealAction)return;
  if((state.rules as any).dpEraRules&&power.powerType===PowerType.POKEPOWER){const list=StateUtils.findPokemonSlot(state,card),text=power.text.replace(/[’‘]/g,"'");if(list?.specialConditions.length&&/can't be used if .+ affected by a Special Condition/i.test(text))throw new GameError(GameMessage.BLOCKED_BY_EFFECT);const normalize=(value:string)=>value.replace(/[^a-z0-9]/gi,'').toLowerCase();let match=text.match(/if (.+?) is your Active Pokémon/i);if(match&&normalize(match[1])===normalize(card.name)&&list!==player.active)throw new GameError(GameMessage.CANNOT_USE_POWER);match=text.match(/if (.+?) is on your Bench/i);if(match&&normalize(match[1])===normalize(card.name)&&!player.bench.includes(list))throw new GameError(GameMessage.CANNOT_USE_POWER);const cost=text.match(/(?:you may discard|\. Discard) (a|an|1|2) (?:(basic )?(Energy|Supporter) )?cards? from your hand/i);if(cost){const amount=cost[1]==='2'?2:1,eligible=player.hand.cards.filter((card:any)=>!cost[3]||cost[3].toLowerCase()==='energy'&&card.superType===SuperType.ENERGY&&(!cost[2]||card.energyType===EnergyType.BASIC)||cost[3].toLowerCase()==='supporter'&&card.superType===SuperType.TRAINER&&card.trainerType===TrainerType.SUPPORTER);if(eligible.length<amount)throw new GameError(GameMessage.CANNOT_USE_POWER);}if((card as any)._wotcFinalPlans?.length){const probe:any=new PowerEffect(player,power,card);probe._dpValidateOnly=true;store.reduceEffect(state,probe);}}

  try {
    store.reduceEffect(
      state,
      new PowerEffect(
        player,
        {
          name: 'test',
          powerType: power.powerType,
          text: '',
          exemptFromAbilityLock: power.exemptFromAbilityLock,
          exemptFromInitialize: power.exemptFromInitialize,
          knocksOutSelf: power.knocksOutSelf,
          useFromHand: power.useFromHand,
          useFromDiscard: power.useFromDiscard,
        },
        card,
      ),
    );
  } catch {
    throw new GameError(GameMessage.CANNOT_USE_POWER);
  }
}

function* usePower(next: Function, store: StoreLike, state: State, effect: UsePowerEffect): IterableIterator<State> {
  const player = effect.player;
  const power = effect.power;
  const card = effect.card;

  if((state.rules as any).dpEraRules&&power.powerType===PowerType.POKEPOWER&&dpPowerAlreadyUsed(state,player,card,power))throw new GameError(GameMessage.POWER_ALREADY_USED);
  // Reject locked powers before animation / owner side effects.
  assertActivatedPowerNotLocked(store, state, player, card, power);

  store.log(state, GameLog.LOG_PLAYER_USES_ABILITY, { name: player.name, ability: power.name });

  const targetSlot = effect.target.slot;
  if (targetSlot === SlotType.ACTIVE || targetSlot === SlotType.BENCH) {
    const slot = targetSlot === SlotType.ACTIVE ? 'active' : 'bench';
    const index = targetSlot === SlotType.BENCH ? effect.target.index : 0;
    emitAbilityAnimationEvent(store, player, card, slot, index, power.name);
    yield store.prompt(state, new WaitPrompt(player.id, ABILITY_ANIMATION_WAIT_MS, 'Ability animation'), () => next());
    state = (store as StoreLike & { state: State }).state;
  }

  // Run after the board animation so ability prompts are not shown on top of the overlay.
  // Validation errors (e.g. POWER_ALREADY_USED) are raised here; store.reducePrompt cleans up
  // any open prompts when those errors propagate.
  if((state.rules as any).dpEraRules&&power.powerType===PowerType.POKEPOWER){dpDeclarePower(store,state,player,card,power,()=>store.reduceEffect(state,new PowerEffect(player,power,card,effect.benchTarget)));return state;}
  state = store.reduceEffect(state, new PowerEffect(player, power, card, effect.benchTarget));
  return state;
}

export function gameReducer(store: StoreLike, state: State, effect: Effect): State {

  if (effect instanceof KnockOutEffect) {
    const card = effect.target.getPokemonCard()||(effect as any)._dpReplacementKoCard;
    if (card !== undefined) {

      if ((state.rules as any).cubeRules) effect.prizeCount += cubeBasePrizes(card,(state.rules as any).cubeRules)-1;
      else {
      // Pokemon ex rule
      if (card.tags.includes(CardTag.POKEMON_EX) || card.tags.includes(CardTag.POKEMON_V) || card.tags.includes(CardTag.POKEMON_VSTAR) || card.tags.includes(CardTag.POKEMON_ex) || card.tags.includes(CardTag.POKEMON_GX)) {
        effect.prizeCount += 1;
      }
      if (card.tags.includes(CardTag.POKEMON_SV_MEGA) || card.tags.includes(CardTag.TAG_TEAM) || card.tags.includes(CardTag.DUAL_LEGEND) || (card as any)._hgssLegendPrizes===2) {
        effect.prizeCount += 1;
      }

      if (card.tags.includes(CardTag.POKEMON_VMAX) || card.tags.includes(CardTag.POKEMON_VUNION)) {
        effect.prizeCount += 2;
      }

      }
      // Attack-armed prize denial / extra prizes (slot fields)
      if (effect.target.denyPrizesIfKnockedOutNextTurn
        && !effect.target.denyPrizesIfKnockedOutNextTurnPending) {
        effect.prizeCount = 0;
      } else if (
        effect.target.extraPrizesIfKnockedOutNextTurn > 0
        && !effect.target.extraPrizesIfKnockedOutNextTurnPending
        && state.phase === GamePhase.ATTACK
        && effect.prizeCount > 0
      ) {
        effect.prizeCount += effect.target.extraPrizesIfKnockedOutNextTurn;
      }

      // Little Grudge: Mist-blockable DiscardCardsEffect attributed to the arming attack
      if (effect.target.discardAttackerEnergyIfKnockedOutNextTurn
        && !effect.target.discardAttackerEnergyIfKnockedOutNextTurnPending
        && effect.player.marker.hasMarker(effect.player.DAMAGE_DEALT_MARKER)
        && effect.target.discardAttackerEnergyIfKnockedOutNextTurnAttack
        && effect.target.discardAttackerEnergyIfKnockedOutNextTurnSourceCard
        && effect.target.discardAttackerEnergyIfKnockedOutNextTurnAttackerId !== undefined) {
        const prizeTaker = StateUtils.getOpponent(state, effect.player);
        const attackerEnergy = prizeTaker.active.cards.filter(c => c.superType === SuperType.ENERGY);
        const grudgeAttack = effect.target.discardAttackerEnergyIfKnockedOutNextTurnAttack;
        const grudgeSourceCard = effect.target.discardAttackerEnergyIfKnockedOutNextTurnSourceCard;
        const grudgeAttackerId = effect.target.discardAttackerEnergyIfKnockedOutNextTurnAttackerId;

        const discardSelected = (cards: Card[]) => {
          if (cards.length === 0) {
            return;
          }
          const grudgeOwner = state.players.find(p => p.id === grudgeAttackerId);
          if (!grudgeOwner) {
            return;
          }
          let sourceList = grudgeOwner.active;
          grudgeOwner.forEachPokemon(PlayerType.BOTTOM_PLAYER, (cardList, card) => {
            if (card === grudgeSourceCard) {
              sourceList = cardList;
            }
          });
          const base = new AttackEffect(grudgeOwner, prizeTaker, grudgeAttack);
          base.source = sourceList;
          const discard = new DiscardCardsEffect(base, cards);
          discard.target = prizeTaker.active;
          store.reduceEffect(state, discard);
        };

        if (attackerEnergy.length === 1) {
          discardSelected(attackerEnergy);
        } else if (attackerEnergy.length > 1) {
          state = store.prompt(state, new DiscardEnergyPrompt(
            effect.player.id,
            GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
            PlayerType.TOP_PLAYER,
            [SlotType.ACTIVE],
            { superType: SuperType.ENERGY },
            { allowCancel: false, min: 1, max: 1 }
          ), transfers => {
            if (!transfers || transfers.length === 0) {
              return;
            }
            discardSelected(transfers.map(t => t.card));
          });
        }
      }

      store.log(state, GameLog.LOG_POKEMON_KO, { name: card.name });

      const knockedOutOwner = effect.player;
      const attacker = StateUtils.getOpponent(state, knockedOutOwner);
      const duringOpponentsTurn = [GamePhase.PLAYER_TURN, GamePhase.ATTACK].includes(state.phase)
        && state.players[state.activePlayer] === attacker;

      if (duringOpponentsTurn) {
        knockedOutOwner.pokemonKnockedOutDuringOpponentsLastTurn = true;
        knockedOutOwner.pokemonKnockedOutLastTurnEntries.push([...(card.tags || [])] as CardTag[]);
      }

      if (state.phase === GamePhase.ATTACK &&
        state.players[state.activePlayer] === attacker &&
        knockedOutOwner.marker.hasMarker(knockedOutOwner.DAMAGE_DEALT_MARKER)) {
        knockedOutOwner.pokemonKnockedOutByAttackDuringOpponentsLastTurn = true;
      }

      if((state.rules as any).dpEraRules){const history=(knockedOutOwner as any)._dpKoHistory||=(([] as any[]));history.push({name:card.name,turn:state.turn,types:(effect as any)._dpKoTypes||card.cardType,byAttack:!!(effect as any)._dpKoByAttack});knockedOutOwner.pokemonKnockedOutByAttackDuringOpponentsLastTurn=history.some((entry:any)=>entry.turn===state.turn&&entry.byAttack);}
      if((effect as any)._dpRetainPokemon)return state;
      if((effect as any)._hgssRescue){
        const lost=(effect as any)._dpLostZoneKo||effect.target.marker.hasMarker('LOST_CITY_MARKER');
        const rescue=()=>MOVE_POKEMON_OFF_BOARD(store,state,effect.target,{pokemonDestination:knockedOutOwner.hand,attachedDestination:(effect as any)._dpLostZoneKo?knockedOutOwner.lostzone:knockedOutOwner.discard,sourceEffect:effect});
        if(lost)return store.prompt(state,new SelectPrompt(knockedOutOwner.id,GameMessage.CHOOSE_OPTION,['Return Pokemon to hand','Put Pokemon in Lost Zone'],{allowCancel:false}),(choice:number)=>{if(choice===0)rescue();else MOVE_POKEMON_OFF_BOARD(store,state,effect.target,{pokemonDestination:knockedOutOwner.lostzone,attachedDestination:(effect as any)._dpLostZoneKo?knockedOutOwner.lostzone:knockedOutOwner.discard,sourceEffect:effect});});
        rescue();return state;
      }
      if((effect as any)._dpLostZoneKo){MOVE_POKEMON_OFF_BOARD(store,state,effect.target,{pokemonDestination:knockedOutOwner.lostzone,attachedDestination:knockedOutOwner.lostzone,sourceEffect:effect});return state;}
      // Handle Lost City marker or PRISM_STAR cards
      if (effect.target.marker.hasMarker('LOST_CITY_MARKER') || card.tags.includes(CardTag.PRISM_STAR)) {
        const lostZoned = new CardList();
        const attachedCards = new CardList();

        // Clear damage and effects before splitting cards
        effect.target.damage = 0;
        effect.target.clearEffects();

        // Splice in reverse so indices remain valid; do NOT pre-move tools/energies
        // or effect.target.cards shrinks and later splice(indices[i], 1) can be out of bounds
        while (effect.target.cards.length > 0) {
          const removedCard = effect.target.cards.splice(effect.target.cards.length - 1, 1)[0];

          // Handle cardlist cards (energy, tools, etc.)
          if (removedCard.cards) {
            const cards = removedCard.cards;
            while (cards.cards.length > 0) {
              const card = cards.cards[0];
              attachedCards.cards.push(card);
              cards.cards.splice(0, 1);
            }
          }

          // Handle the main card
          if (removedCard.superType === SuperType.POKEMON || removedCard.tags.includes(CardTag.PRISM_STAR)) {
            lostZoned.cards.push(removedCard);
          } else {
            attachedCards.cards.push(removedCard);
          }
        }

        // Clear refs so the slot is fully emptied
        effect.target.tools = [];
        effect.target.energies.cards = [];

        // Move attached cards to discard
        if (attachedCards.cards.length > 0) {
          state = MOVE_CARDS(store, state, attachedCards, effect.player.discard);
        }

        // Move Pokémon to lost zone
        if (lostZoned.cards.length > 0) {
          state = MOVE_CARDS(store, state, lostZoned, effect.player.lostzone);
        }
      } else {
        // Attachments first, Pokémon last so the KO'd Pokémon is the top discard card
        // (same order as bench-overflow discard / MOVE_POKEMON_OFF_BOARD).
        const pokemons = effect.target.getPokemons();
        const tools = [...effect.target.tools];
        const otherCards = effect.target.cards.filter(
          c =>
            !(c instanceof PokemonCard) &&
            !pokemons.includes(c as PokemonCard) &&
            !tools.includes(c),
        );

        if (otherCards.length > 0) {
          state = MOVE_CARDS(store, state, effect.target, effect.player.discard, {
            cards: otherCards,
          });
        }
        for (const tool of tools) {
          state = MOVE_CARDS(store, state, effect.target, effect.player.discard, {
            cards: [tool],
          });
        }
        if (pokemons.length > 0) {
          state = MOVE_CARDS(store, state, effect.target, effect.player.discard, {
            cards: pokemons,
          });
        }
      }
      const rebirth=(effect as any)._wotcRebirthCard;
      if(rebirth&&effect.player.discard.cards.includes(rebirth))return store.prompt(state,new SelectPrompt(effect.player.id,GameMessage.CHOOSE_OPTION,['Leave in discard','Use Rebirth'],{allowCancel:false}),(choice:any)=>{if(choice===1)effect.player.discard.moveCardsTo([rebirth],effect.player.hand);});
    }
  }

  if (effect instanceof CheckPokemonStatsEffect) {
    if (effect.target.noWeaknessNextTurn) {
      effect.weakness = [];
    } else if(effect.target.svWeaknessOverride&&state.turn<=effect.target.svWeaknessOverride.untilTurn){
      effect.weakness=effect.weakness.map(w=>({...w,type:effect.target.svWeaknessOverride!.type}));
    } else if (effect.target.weaknessOverrideType !== undefined) {
      effect.weakness = [{ type: effect.target.weaknessOverrideType }];
    } else {
      applyWhileInPlayOpponentWeakness(store, state, effect);
    }
    return state;
  }

  if (effect instanceof ApplyWeaknessEffect) {
    outgoingBeforeWeakness(store,state,effect);
    const checkPokemonType = new CheckPokemonTypeEffect(effect.source);
    state = store.reduceEffect(state, checkPokemonType);
    const checkPokemonStats = new CheckPokemonStatsEffect(effect.target);
    state = store.reduceEffect(state, checkPokemonStats);

    const cardTypes = checkPokemonType.cardTypes;
    const weakness = effect.ignoreWeakness ? [] : checkPokemonStats.weakness;
    const resistance = effect.ignoreResistance ? [] : checkPokemonStats.resistance;
    effect.damage = applyWeaknessAndResistance(effect.damage, cardTypes, weakness, resistance);
    rememberOutgoingWeakness(effect);
    return state;
  }

  if (effect instanceof UseAttackEffect) {
    const generator = useAttack(() => generator.next(), store, state, effect);
    return generator.next().value;
  }

  if (effect instanceof UsePowerEffect) {
    const generator = usePower(() => generator.next(), store, state, effect);
    return generator.next().value;
  }

  if (effect instanceof UseTrainerPowerEffect) {
    const player = effect.player;
    const power = effect.power;
    const card = effect.card;

    store.log(state, GameLog.LOG_PLAYER_USES_ABILITY, { name: player.name, ability: power.name });
    state = store.reduceEffect(state, new TrainerPowerEffect(player, power, card));
    return state;
  }

  if (effect instanceof AddSpecialConditionsPowerEffect) {
    const target = effect.target;
    effect.specialConditions.forEach(sp => {
      target.addSpecialCondition(sp);
    });
    if (effect.poisonDamage !== undefined) {
      target.poisonDamage = effect.poisonDamage;
    }
    if (effect.burnDamage !== undefined) {
      target.burnDamage = effect.burnDamage;
    }
    if (effect.confusionDamage !== undefined) {
      target.confusionDamage = effect.confusionDamage;
    }
    if (effect.sleepFlips !== undefined) {
      target.sleepFlips = effect.sleepFlips;
    }
    return state;
  }

  if (effect instanceof UseStadiumEffect) {
    if (state.players.some(p => p.stadiumAndToolHaveNoEffectTurnsRemaining > 0)) {
      throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    }
    const player = effect.player;
    store.log(state, GameLog.LOG_PLAYER_USES_STADIUM, { name: player.name, stadium: effect.stadium.name });
    player.stadiumUsedTurn = state.turn;
  }

  // if (effect instanceof TrainerEffect && effect.trainerCard.trainerType === TrainerType.SUPPORTER) {
  //   const player = effect.player;
  //   store.log(state, GameLog.LOG_PLAYER_PLAYS_SUPPORTER, { name: player.name, stadium: effect.trainerCard.name });
  // }

  if (effect instanceof HealEffect) {
    if (effect.preventDefault || effect.target.cannotBeHealedNextTurn) {
      effect.preventDefault = true;
      return state;
    }
    if (effect.damage > 0 && effect.target.damage > 0) {
      effect.target.healedThisTurn = true;
    }
    effect.target.damage = Math.max(0, effect.target.damage - effect.damage);
    return state;
  }

  if (effect instanceof PutDamageCountersEffect) {
    // First process the EffectOfAbilityEffect
    state = store.reduceEffect(state, effect.effectOfAbility);

    // Then apply the damage if the effect wasn't prevented
    if (effect.effectOfAbility.target) {
      const damage = Math.max(0, effect.damage);
      effect.effectOfAbility.target.damage += damage;

      if (damage > 0) {
        const targetCard = effect.effectOfAbility.target.getPokemonCard();
        if (targetCard) {
          store.log(state, GameLog.LOG_PLAYER_PLACES_DAMAGE_COUNTERS, {
            name: effect.player.name,
            damage: damage,
            target: targetCard.name,
            effect: effect.power.name,
          });
        }
      }
    }
    return state;
  }

  if (effect instanceof PlaceDamageCountersEffect) {
    if (effect.preventDefault) {
      return state;
    }

    const target = effect.target;
    const targetCard = target.getPokemonCard();
    if (targetCard === undefined) {
      throw new GameError(GameMessage.ILLEGAL_ACTION);
    }

    const damage = Math.max(0, effect.damage);
    target.damage += damage;

    if (damage > 0) {
      const effectName = effect.source ? effect.source.name : '';
      store.log(state, GameLog.LOG_PLAYER_PLACES_DAMAGE_COUNTERS, {
        name: effect.player.name,
        damage: damage,
        target: targetCard.name,
        effect: effectName,
      });

      // Track damage dealt if source is provided
      if (effect.source) {
        const sourceCardList = StateUtils.findPokemonSlot(state, effect.source);
        if (sourceCardList) {
          GameStatsTracker.trackDamageDealt(effect.player, sourceCardList, damage);
        }
      }
    }
    return state;
  }

  if (effect instanceof EvolveEffect) {
    if ((state.rules as any).cubeRules?.twoPrizeEvolutionOnly && ((cubeBasePrizes(effect.target.getPokemonCard(),(state.rules as any).cubeRules)===2)!==(cubeBasePrizes(effect.pokemonCard,(state.rules as any).cubeRules)===2))) throw new GameError(GameMessage.INVALID_TARGET);
    if (effect.player.cannotPlayPokemonCards) {
      throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    }
    if (effect.player.cannotEvolvePokemonCards) {
      throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    }
    if (effect.target.cannotEvolveNextTurn) {
      throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    }
    if (effect.player.cannotPlayPokemonWithAbilities
      && effect.pokemonCard.powers.some(power => power.powerType === PowerType.ABILITY)) {
      throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    }
    const pokemonCard = effect.target.getPokemonCard();

    if (pokemonCard === undefined) {
      throw new GameError(GameMessage.INVALID_TARGET);
    }

    const dpEvolutionHistory=(state.rules as any).dpEraRules?{turn:state.turn,from:pokemonCard.name,conditions:effect.target.specialConditions.slice()}:undefined;
    if(dpEvolutionHistory){const removal=new CheckSpecialConditionRemovalEffect(effect.player,effect.target);store.reduceEffect(state,removal);effect.target._preservedConditionsDuringEvolution=removal.preservedConditions;effect.player.removePokemonEffects(effect.target);effect.target._preservedConditionsDuringEvolution=undefined;(effect.target as any)._dpEvolutionHistory=dpEvolutionHistory;}
    // Track Pokemon evolution for damage continuity
    GameStatsTracker.handlePokemonEvolution(
      effect.player,
      effect.target,
      pokemonCard,
      effect.pokemonCard
    );

    store.log(state, GameLog.LOG_PLAYER_EVOLVES_POKEMON, {
      name: effect.player.name,
      pokemon: pokemonCard.name,
      card: effect.pokemonCard.name
    });
    (effect as any)._bwFromHand=effect.player.hand.cards.includes(effect.pokemonCard);
    const evolutionSource=(effect as any)._xyEvolutionSource||effect.player.hand;
    evolutionSource.moveCardTo(effect.pokemonCard, effect.target);
    effect.target.pokemonPlayedTurn = state.turn;
    effect.target.marker.markers = [];

    // Evolving the Active Pokemon can bring a new ability lock online (e.g. Lazy).
    if (effect.player.active === effect.target) {
      effect.target.abilityLockActivationOrder = 0;
      STAMP_ABILITY_LOCK_ACTIVATION(state, effect.target, effect.pokemonCard);
    }
  }

  if (effect instanceof MoveCardsEffect) {
    const source = effect.source;
    const destination = effect.destination;
    const isPartialMove = effect.cards !== undefined || effect.count !== undefined;

    // moveTo() does not move tools; attach them before a full-stack move.
    if (source instanceof PokemonCardList && !effect.skipCleanup && !isPartialMove) {
      const tools = [...source.tools];
      for (const tool of tools) {
        source.moveCardTo(tool, destination);
      }
    }

    // Helper to get owner of a CardList
    const getOwner = (cardList: CardList) => {
      try {
        return StateUtils.findOwner(state, cardList);
      } catch {
        return undefined;
      }
    };

    // Helper to check if a CardList is a player's discard
    const isDiscardPile = (cardList: CardList) => {
      const owner = getOwner(cardList);
      return owner && owner.discard === cardList;
    };

    // Move logic for Prism Star cards
    const moveWithPrismStarCheck = (cardsToMove: any[], src: CardList, dest: CardList) => {
      if (isDiscardPile(dest)) {
        const owner = getOwner(dest);
        const toLostZone = cardsToMove.filter(card => card.tags && card.tags.includes(CardTag.PRISM_STAR));
        const toDiscard = cardsToMove.filter(card => !(card.tags && card.tags.includes(CardTag.PRISM_STAR)));
        if (toLostZone.length > 0 && owner) {
          src.moveCardsTo(toLostZone, owner.lostzone);
        }
        if (toDiscard.length > 0) {
          src.moveCardsTo(toDiscard, dest);
        }
      } else {
        src.moveCardsTo(cardsToMove, dest);
      }
    };

    // If specific cards are specified
    if (effect.cards) {
      moveWithPrismStarCheck(effect.cards, source, destination);
      if (effect.toBottom) {
        destination.cards = [...destination.cards.slice(effect.cards.length), ...effect.cards];
      } else if (effect.toTop) {
        destination.cards = [...effect.cards, ...destination.cards];
      }
    }
    // If count is specified
    else if (effect.count !== undefined) {
      const cards = source.cards.slice(0, effect.count);
      moveWithPrismStarCheck(cards, source, destination);
      if (effect.toBottom) {
        destination.cards = [...destination.cards.slice(cards.length), ...cards];
      } else if (effect.toTop) {
        destination.cards = [...cards, ...destination.cards];
      }
    }
    // Move all cards
    else {
      // For move all, check for Prism Star cards
      if (isDiscardPile(destination)) {
        const owner = getOwner(destination);
        const toLostZone = source.cards.filter(card => card.tags && card.tags.includes(CardTag.PRISM_STAR));
        const toDiscard = source.cards.filter(card => !(card.tags && card.tags.includes(CardTag.PRISM_STAR)));
        if (toLostZone.length > 0 && owner) {
          source.moveCardsTo(toLostZone, owner.lostzone);
        }
        if (toDiscard.length > 0) {
          source.moveCardsTo(toDiscard, destination);
        }
      } else {
        if (effect.toTop) {
          source.moveToTopOfDestination(destination);
        } else {
          source.moveTo(destination);
        }
      }
    }

    // Salvage orphan attachments when no Pokemon remain in the slot.
    // Tools live in tools[] (not cards[]), so they must be moved explicitly
    // before resetEmptyPokemonSlot wipes the array.
    if (source instanceof PokemonCardList && source.getPokemons().length === 0) {
      const player = StateUtils.findOwner(state, source);

      // Remaining cards/energies → discard (Prism Star → lost zone)
      if (source.cards.length > 0) {
        const toLostZone = source.cards.filter(card => card.tags && card.tags.includes(CardTag.PRISM_STAR));
        const toDiscard = source.cards.filter(card => !(card.tags && card.tags.includes(CardTag.PRISM_STAR)));
        if (toLostZone.length > 0) {
          source.moveCardsTo(toLostZone, player.lostzone);
        }
        if (toDiscard.length > 0) {
          source.moveCardsTo(toDiscard, player.discard);
        }
      }
      if (source.energies && source.energies.cards.length > 0) {
        source.energies.cards = [];
      }

      // Remaining tools → discard (Prism Star → lost zone)
      for (const tool of [...source.tools]) {
        if (tool.tags && tool.tags.includes(CardTag.PRISM_STAR)) {
          source.moveCardTo(tool, player.lostzone);
        } else {
          source.moveCardTo(tool, player.discard);
        }
      }
    }

    // In-play state (damage, special conditions, etc.) lives on the slot, not on cards.
    // Reset whenever a slot is vacated — including after partial card moves.
    if (source instanceof PokemonCardList && !effect.skipCleanup && source.getPokemons().length === 0) {
      resetEmptyPokemonSlot(source);
    }

    return state;
  }

  if (effect instanceof CoinFlipSequenceEffect) {
    return RUN_COIN_FLIP_SEQUENCE(store, state, effect);
  }

  if (effect instanceof CoinFlipEffect) {
    return RESOLVE_COIN_FLIP_EFFECT(store, state, effect);
  }

  return state;
}

function applyWhileInPlayOpponentWeakness(
  store: StoreLike,
  state: State,
  effect: CheckPokemonStatsEffect,
): void {
  const owner = StateUtils.findOwner(state, effect.target);
  const opponent = StateUtils.getOpponent(state, owner);
  let source: PokemonCard | undefined;
  opponent.forEachPokemon(PlayerType.TOP_PLAYER, (_cardList, card) => {
    if (card.whileInPlayOpponentWeakness !== undefined) {
      source = card;
    }
  });
  if (!source || source.whileInPlayOpponentWeakness === undefined) {
    return;
  }
  if (IS_ABILITY_BLOCKED(store, state, opponent, source)) {
    return;
  }
  const canApply = new EffectOfAbilityEffect(
    opponent,
    OPPONENT_WEAKNESS_AURA_POWER(source.whileInPlayOpponentWeakness),
    source,
    effect.target,
  );
  store.reduceEffect(state, canApply);
  if (canApply.target) {
    effect.weakness = [{ type: source.whileInPlayOpponentWeakness }];
  }
}
