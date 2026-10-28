import { CardTag } from '../card/card-types';
import {CoinFlipEffect,ToolEffect} from '../effects/play-card-effects';
import { getCardTarget } from "../../../simple-bot/simple-tactics/simple-tactics";
import { GameError } from "../../game-error";
import { GameMessage, GameLog } from "../../game-message";
import { PlayerType } from "../actions/play-card-action";
import { PutDamageEffect, AfterDamageEffect, ApplyWeaknessEffect, AfterWeaknessAndResistanceEffect, DealDamageEffect, KnockOutOpponentEffect, KOEffect, KnockOutPlayerEffect, PutCountersEffect, DiscardCardsEffect, DiscardCardsFromOpponentsActivePokemonEffect, DiscardDefendingPokemonEffect, LostZoneCardsEffect, CardsToHandEffect, MoveOpponentEnergyEffect, GustOpponentBenchEffect, SwitchOutOpponentsActiveEffect, AddMarkerEffect, HealTargetEffect, AddSpecialConditionsEffect, RemoveSpecialConditionsEffect } from "../effects/attack-effects";
import { CheckHpEffect } from "../effects/check-effects";
import { Effect } from "../effects/effect";
import { shouldPreventAttackEffects, shouldPreventAttackDamage, shouldApplyDamageReduction, getActiveSurviveOnTenHpOptions, shouldKnockOutIfDamaged, getActiveRetaliateOnDamage, retaliateDamageEffect, RetaliateDamageEffect, EffectOfAttackEffect } from "../effects/effect-of-attack-effects";
import { AttackEffect, KnockOutAttackEffect, HealEffect } from "../effects/game-effects";
import { GameStatsTracker } from "../game-stats-tracker";
import { TAKE_X_PRIZES, IS_POKEPOWER_BLOCKED, IS_ABILITY_BLOCKED, IS_TOOL_BLOCKED, MOVE_CARDS, MOVE_POKEMON_OFF_BOARD, COIN_FLIP_PROMPT } from "../prefabs/prefabs";
import { StateUtils } from "../state-utils";
import { State, GamePhase } from "../state/state";
import { StoreLike } from "../store-like";
import { SwapDamageCountersEffect } from "../effects/attack-effects";
import { SelectPrompt } from '../prompts/select-prompt';

function applyPutDamage(store: StoreLike, state: State, effect: PutDamageEffect): State {
  const target = effect.target;
  const sourceOwner = StateUtils.findOwner(state, effect.source);
  const targetCard = target.getPokemonCard();

  if (targetCard === undefined) {
    throw new GameError(GameMessage.ILLEGAL_ACTION);
  }

  if(target.marker.hasMarker('WOTC_SHADOW_IMAGES') && effect.player!==StateUtils.findOwner(state,target) && !(effect.attackEffect as any).wotcBypassDefender){
    const attack:any=effect.attackEffect;attack._wotcShadowResults??=new Map();
    if(!attack._wotcShadowResults.has(target))return COIN_FLIP_PROMPT(store,state,effect.player,heads=>{attack._wotcShadowResults.set(target,heads);applyPutDamage(store,state,effect);});
    if(!attack._wotcShadowResults.get(target))return state;
  }
  const guard=(effect.attackEffect as any).wotcBypassDefender?undefined:(effect as any)._wotcBenchGuards?.shift();
  if(guard&&effect.damage>0)return store.prompt(state,new SelectPrompt(guard.player.id,GameMessage.CHOOSE_OPTION,['Keep damage','Use '+guard.name],{allowCancel:false}),(choice:any)=>{if(choice===1){const redirected=Math.min(10,effect.damage);effect.damage-=redirected;guard.list.damage+=redirected;}applyPutDamage(store,state,effect);});
  const charity=(effect as any)._wotcCharityPlayer;
  if(charity&&!(effect as any)._wotcCharityUsed&&effect.damage>0){(effect as any)._wotcCharityUsed=true;return store.prompt(state,new SelectPrompt(charity.id,GameMessage.CHOOSE_OPTION,Array.from({length:Math.floor(effect.damage/10)+1},(_,i)=>'Reduce damage by '+i*10),{allowCancel:false}),(choice:any)=>{effect.damage=Math.max(0,effect.damage-choice*10);applyPutDamage(store,state,effect);});}
  const rock=(effect as any)._bwSolidRock;if(rock&&!(effect as any)._bwRockDone&&effect.damage>0){(effect as any)._bwRockDone=true;const coin=new CoinFlipEffect(rock.player,heads=>{if(heads)effect.damage=Math.max(0,effect.damage-rock.amount);applyPutDamage(store,state,effect);});coin.skipReflipTool=true;return store.reduceEffect(state,coin);}
  const proposedDamage = Math.max(0, effect.damage);
  const damage = (state as any).newRules ? ((globalThis as any).IlexNewRules?.finalDamage(store,state,effect,proposedDamage) ?? proposedDamage) : proposedDamage;
  target.damage += damage;
  if(damage>0)target.marker.removeMarker('WOTC_SHADOW_IMAGES');

  if (damage > 0) {
    store.log(state, GameLog.LOG_PLAYER_DEALS_DAMAGE, {
      name: sourceOwner.name,
      damage: damage,
      target: targetCard.name,
      effect: effect.attack.name,
    });

    const targetOwner = StateUtils.findOwner(state, target);
    targetOwner.marker.addMarkerToState(targetOwner.DAMAGE_DEALT_MARKER);

    if (effect.attackEffect && effect.source) {
      GameStatsTracker.trackDamageDealt(effect.player, effect.source, damage);
    }

    if (targetCard.damageTakenLastTurn !== undefined) {
      targetCard.damageTakenLastTurn += damage;
    }

    if (effect.surviveOnTenHPReason !== undefined) {
      const checkHpEffect = new CheckHpEffect(effect.player, target);
      state = store.reduceEffect(state, checkHpEffect);
      if (target.damage >= checkHpEffect.hp) {
        store.log(state, GameLog.LOG_SURVIVES_ON_TEN_HP, {
          pokemon: targetCard.name,
          reason: effect.surviveOnTenHPReason,
        });
        target.damage = checkHpEffect.hp - 10;
      }
    }

    if(effect.player!==StateUtils.findOwner(state,target)&&!(effect.attackEffect as any)._wotcTrainer){if((target as any).wotcLastOpponentAttackDamageTurn!==state.turn)(target as any).wotcLastOpponentAttackDamage=0;(target as any).wotcLastOpponentAttackDamageTurn=state.turn;}
    if(damage>0&&!(effect.attackEffect as any)._wotcTrainer){const hp=new CheckHpEffect(StateUtils.findOwner(state,target),target);store.reduceEffect(state,hp);(target as any)._exLethalAttackDamage=target.damage>=hp.hp?{card:targetCard,turn:state.turn,attackId:(effect.attackEffect as any)._dpAttackId,attackerCard:effect.source.getPokemonCard(),wasActive:StateUtils.findOwner(state,target).active===target,powerBlocked:(state.rules as any).dpEraRules&&IS_POKEPOWER_BLOCKED(store,state,StateUtils.findOwner(state,target),targetCard),abilityBlocked:(state.rules as any).dpEraRules&&IS_ABILITY_BLOCKED(store,state,StateUtils.findOwner(state,target),targetCard)}:undefined;}
    const afterDamageEffect = new AfterDamageEffect(effect.attackEffect, damage);
    afterDamageEffect.target = effect.target;
    store.reduceEffect(state, afterDamageEffect);
  }

  if (effect.attackEffect && effect.attackEffect.player && (effect.attackEffect.player.active as any).pendingAttackTargets) {
    try {
      const cardTarget = getCardTarget(effect.attackEffect.player, state, target);
      const pending = (effect.attackEffect.player.active as any).pendingAttackTargets;
      if (Array.isArray(pending) && !pending.some((t: { player: number; slot: number; index: number }) =>
        t.player === cardTarget.player && t.slot === cardTarget.slot && t.index === cardTarget.index)) {
        pending.push(cardTarget);
      }
    } catch (e) { /* ignore if cannot resolve target */ }
  }

  return state;
}

export function attackReducer(store: StoreLike, state: State, effect: Effect): State {

  // Switch-in affects the selected Bench Pokemon; switch-out affects the Active.
  // Official advanced rulebook C-04/C-05: immunity on the other slot is irrelevant.

  if (shouldPreventAttackEffects(state, effect)) {
    return state;
  }

  if (effect instanceof PutDamageEffect) {
    const target = effect.target;
    const bypassDefender = (effect.attackEffect as any)?.wotcBypassDefender && StateUtils.findOwner(state,target)!==effect.player;
    const targetCard = target.getPokemonCard();

    if (targetCard === undefined) {
      throw new GameError(GameMessage.ILLEGAL_ACTION);
    }

    // Lusamine Prism Star protects all of this player's Ultra Beasts, including
    // ones that enter play later, for the opponent's next turn only.
    if (!bypassDefender && state.phase === GamePhase.ATTACK &&
      (StateUtils.findOwner(state, target) as any).lusaminePrismProtectionTurn === state.turn &&
      targetCard.hasTag(CardTag.ULTRA_BEAST)) return state;

    // Defending Pokémon's attacks do N less (before W/R). Only for direct PutDamage
    // paths — DealDamageEffect already applied this before weakness.
    if (!effect.weaknessApplied && effect.source.attackDamageReductionNextTurn > 0) {
      effect.damage = Math.max(0, effect.damage - effect.source.attackDamageReductionNextTurn);
    }

    if (!bypassDefender && !effect.weaknessApplied && effect.target.damageReductionBeforeWeaknessNextTurn > 0) {
      effect.damage = Math.max(0, effect.damage - effect.target.damageReductionBeforeWeaknessNextTurn);
    }

    const opponent = StateUtils.getOpponent(state, effect.player);

    if (effect.attackEffect && target === opponent.active && !effect.weaknessApplied) {
      // Apply weakness
      const applyWeakness = new ApplyWeaknessEffect(effect.attackEffect, effect.damage);
      applyWeakness.target = effect.target;
      applyWeakness.ignoreWeakness = effect.attackEffect.ignoreWeakness;
      applyWeakness.ignoreResistance = effect.attackEffect.ignoreResistance;
      state = store.reduceEffect(state, applyWeakness);

      effect.damage = applyWeakness.damage;

      const targetOwner = StateUtils.findOwner(state, target);
      targetOwner.marker.addMarkerToState(targetOwner.DAMAGE_DEALT_MARKER);
    }

    if (!(effect as any).specialEnergyAfterWeaknessApplied) {
      (effect as any).specialEnergyAfterWeaknessApplied = true;
      effect.damage = Math.max(0,effect.damage-((effect as any).specialEnergyAfterWeaknessReduction||0));
    }
    if (!(effect as any).strengthCharmApplied) {
      (effect as any).strengthCharmApplied = true;
      if (effect.damage > 0) effect.damage += 10 * ((effect as any).strengthCharmCards?.length || 0);
    }
    if (!bypassDefender && state.phase === GamePhase.ATTACK && shouldPreventAttackDamage(target, effect.source, effect.damage)) {
      return state;
    }
    const optional=(effect as any)._wotcOptionalReductions?.shift();
    if(optional && effect.damage>0){effect.weaknessApplied=true;return store.prompt(state,new SelectPrompt(optional.player.id,GameMessage.CHOOSE_OPTION,['Keep damage','Use '+optional.name],{allowCancel:false}),(choice:any)=>{if(choice===1)effect.damage=Math.max(0,effect.damage-optional.amount);attackReducer(store,state,effect);});}

    // Stadium reductions apply after weakness, including direct/Bench damage paths.
    if ((effect as any).wotcSproutReduction) {
      effect.damage = Math.max(0, effect.damage - (effect as any).wotcSproutReduction);
    }

    // Light Screen halves incoming attack damage after weakness/resistance.
    // Its slot marker is removed by switching/evolving; the turn stamp expires it.
    if (!bypassDefender && effect.player !== StateUtils.findOwner(state, target)
      && target.marker.hasMarker('WOTC_HALF_ATTACK_DAMAGE')
      && (target as any).wotcHalfAttackDamageUntilTurn === state.turn) {
      effect.damage = Math.floor(effect.damage / 20) * 10;
    }

    // Apply damage reduction (or increase via negative values) for "during opponent's next turn" effects
    if (!bypassDefender && shouldApplyDamageReduction(target, effect.source)) {
      effect.damage = Math.max(0, effect.damage - target.damageReductionNextTurn);
    }

    if (effect.source.attackDamageReductionAfterWeaknessNextTurn > 0) {
      effect.damage = Math.max(0, effect.damage - effect.source.attackDamageReductionAfterWeaknessNextTurn);
    }

    // Apply extra damage for "during your next turn, the Defending Pokemon takes more damage" effects
    if (!bypassDefender && target.defendingPokemonExtraDamageNextTurn > 0
      && (!(target as any).exExtraDamageNeedsPositive || effect.damage>0)
      && !target.defendingPokemonExtraDamagePending
      && target.defendingPokemonExtraDamageAttackerId === effect.player.id) {
      effect.damage += target.defendingPokemonExtraDamageNextTurn;
    }

    const bonuses=(effect.player as any).wotcTurnDamageBonuses;
    if(!(effect as any)._wotcTurnBonusesApplied && effect.damage>0 && effect.target===effect.opponent.active && !(effect.attackEffect as any)._wotcTrainer){
      (effect as any)._wotcTurnBonusesApplied=true;
      effect.damage+=(effect.attackEffect as any)._wotcSurgeBonus||0;
      for(const bonus of bonuses||[])if(bonus.turn===state.turn&&effect.source.getPokemonCard()?.name.includes(bonus.nameIncludes))effect.damage+=bonus.amount;
    }
    // Consumable reductions belong after prevention and ordinary reductions.
    // Their own Tool effect discards them, retaining physical-card ownership.
    for(const entry of effect.consumableDamageReductions.splice(0)){
      const owner=StateUtils.findOwner(state,entry.holder);
      if(!bypassDefender&&effect.damage>0&&entry.holder.tools.includes(entry.card)&&!IS_TOOL_BLOCKED(store,state,owner,entry.card)){
        effect.damage=Math.max(0,effect.damage-entry.amount);
        MOVE_CARDS(store,state,entry.holder,owner.discard,{cards:[entry.card],sourceCard:entry.card,sourceEffect:new ToolEffect(owner,entry.card)});
      }
    }
    // Survive at 10 HP during opponent's next turn
    const surviveOpts = bypassDefender ? null : (effect as any)._wotcSurviveTenOptions || ((effect as any)._wotcSurviveTenPower ? {coinFlipOnWouldKo:true,requireFullHp:false} : getActiveSurviveOnTenHpOptions(target));
    if (surviveOpts !== null
      && effect.surviveOnTenHPReason === undefined
      && state.phase === GamePhase.ATTACK) {
      const checkHpPreview = new CheckHpEffect(effect.player, target);
      state = store.reduceEffect(state, checkHpPreview);
      const wouldKo = target.damage + Math.max(0, effect.damage) >= checkHpPreview.hp;
      const fullHpOk = !surviveOpts.requireFullHp || target.damage === 0;
      if (wouldKo && fullHpOk) {
        if (surviveOpts.coinFlipOnWouldKo) {
          return COIN_FLIP_PROMPT(store, state, StateUtils.findOwner(state, target), result => {
            if (result) {
              effect.surviveOnTenHPReason = effect.attack?.name || 'Endure';
            }
            applyPutDamage(store, state, effect);
          });
        }
        effect.surviveOnTenHPReason = effect.attack?.name || 'Endure';
      }
    }

    // Afterimage: when damaged during the opponent's next turn, flip; heads prevents that damage.
    if (!bypassDefender && target.coinFlipPreventAttackDamageNextTurn
      && effect.damage > 0
      && state.phase === GamePhase.ATTACK
      && effect.source
      && StateUtils.findOwner(state, target) !== effect.player) {
      const targetOwner = StateUtils.findOwner(state, target);
      return COIN_FLIP_PROMPT(store, state, targetOwner, result => {
        if (result) {
          effect.damage = 0;
        }
        applyPutDamage(store, state, effect);
      });
    }

    // Reflect Shield: when damaged, flip a coin; heads prevents damage and retaliates.
    const coinFlipRetaliate = getActiveRetaliateOnDamage(target);
    if (coinFlipRetaliate !== null
      && 'coinFlipPrevent' in coinFlipRetaliate
      && coinFlipRetaliate.coinFlipPrevent === true
      && 'damage' in coinFlipRetaliate
      && effect.damage > 0
      && state.phase === GamePhase.ATTACK
      && effect.source
      && StateUtils.findOwner(state, target) !== effect.player) {
      const targetOwner = StateUtils.findOwner(state, target);
      return COIN_FLIP_PROMPT(store, state, targetOwner, result => {
        if (!result) {
          applyPutDamage(store, state, effect);
          return;
        }

        // Swift ignores prevention, while the independent retaliation still fires.
        if (bypassDefender) applyPutDamage(store,state,effect);

        let sourceList = effect.target;
        const attackerPlayer = state.players.find(p => p.id === coinFlipRetaliate.attackerPlayerId);
        if (attackerPlayer) {
          attackerPlayer.forEachPokemon(PlayerType.BOTTOM_PLAYER, (cardList, card) => {
            if (card === coinFlipRetaliate.sourceCard) {
              sourceList = cardList;
            }
          });
        }
        const revengeBase = new AttackEffect(targetOwner, effect.player, coinFlipRetaliate.attack);
        revengeBase.source = sourceList;
        const retaliateEffect = retaliateDamageEffect(revengeBase, coinFlipRetaliate.damage, effect.source);
        retaliateEffect.markerSource = coinFlipRetaliate.sourceCard;
        store.reduceEffect(state, retaliateEffect);
      });
    }

    return applyPutDamage(store, state, effect);
  }

  if (effect instanceof AfterWeaknessAndResistanceEffect) {
    const target = effect.target;
    const proposed = Math.max(0,effect.damage);
    const damage = (state as any).newRules ? ((globalThis as any).IlexNewRules?.finalDamage(store,state,effect,proposed) ?? proposed) : proposed;
    target.damage += damage;

    // Track damage dealt by the attacking Pokemon
    if (damage > 0 && effect.attackEffect && effect.source) {
      GameStatsTracker.trackDamageDealt(effect.player, effect.source, damage);
    }
  }

  if (effect instanceof DealDamageEffect) {
    const base = effect.attackEffect;
    const bypassDefender = (base as any)?.wotcBypassDefender && StateUtils.findOwner(state,effect.target)!==effect.player;

    // Defending Pokémon's attacks do N less — before Weakness and Resistance
    if (effect.source.attackDamageReductionNextTurn > 0) {
      effect.damage = Math.max(0, effect.damage - effect.source.attackDamageReductionNextTurn);
    }

    const dealOpponent = StateUtils.getOpponent(state, effect.player);
    if (effect.source.outgoingAttackDamageBonusNextTurn > 0 && effect.target === dealOpponent.active) {
      effect.damage += effect.source.outgoingAttackDamageBonusNextTurn;
    }

    if (!bypassDefender && effect.target.damageReductionBeforeWeaknessNextTurn > 0) {
      effect.damage = Math.max(0, effect.damage - effect.target.damageReductionBeforeWeaknessNextTurn);
    }

    const applyWeakness = new ApplyWeaknessEffect(base, effect.damage);
    applyWeakness.target = effect.target;
    applyWeakness.ignoreWeakness = base.ignoreWeakness;
    applyWeakness.ignoreResistance = base.ignoreResistance;
    state = store.reduceEffect(state, applyWeakness);

    const dealDamage = new PutDamageEffect(base, applyWeakness.damage);
    dealDamage.target = effect.target;
    dealDamage.weaknessApplied = true;
    state = store.reduceEffect(state, dealDamage);

    // Hangman KO — Mist-blockable EffectOfAttack (auto-KO), not boosted damage
    if (dealDamage.damage > 0
      && !dealDamage.preventDefault
      && shouldKnockOutIfDamaged(effect.target, effect.source)
      && effect.target.knockOutIfDamagedNextTurnAttack
      && effect.target.knockOutIfDamagedNextTurnSourceCard
      && effect.target.knockOutIfDamagedNextTurnAttackerId !== undefined) {
      const hangmanOwner = state.players.find(
        p => p.id === effect.target.knockOutIfDamagedNextTurnAttackerId,
      );
      if (hangmanOwner) {
        let sourceList = hangmanOwner.active;
        const sourceCard = effect.target.knockOutIfDamagedNextTurnSourceCard;
        hangmanOwner.forEachPokemon(PlayerType.BOTTOM_PLAYER, (cardList, card) => {
          if (card === sourceCard) {
            sourceList = cardList;
          }
        });
        const targetOwner = StateUtils.findOwner(state, effect.target);
        const hangmanBase = new AttackEffect(
          hangmanOwner,
          targetOwner,
          effect.target.knockOutIfDamagedNextTurnAttack,
        );
        hangmanBase.source = sourceList;
        const ko = new KnockOutOpponentEffect(hangmanBase);
        ko.target = effect.target;
        state = store.reduceEffect(state, ko);
      }
    }
    return state;
  }

  if (effect instanceof KOEffect) {
    const target = effect.target;
    const pokemonCard = target.getPokemonCard();
    if (pokemonCard === undefined) {
      throw new GameError(GameMessage.ILLEGAL_ACTION);
    }

    // Check if the effect is part of an attack and the target is the opponent's active Pokemon
    const opponent = StateUtils.getOpponent(state, effect.player);
    if (effect.attackEffect && target === opponent.active) {
      // Apply weakness
      const applyWeakness = new ApplyWeaknessEffect(effect.attackEffect, effect.damage);
      applyWeakness.target = effect.target;
      applyWeakness.ignoreWeakness = effect.attackEffect.ignoreWeakness;
      applyWeakness.ignoreResistance = effect.attackEffect.ignoreResistance;
      state = store.reduceEffect(state, applyWeakness);

      effect.damage = applyWeakness.damage;

    }

    const proposed = Math.max(0,effect.damage);
    const damage = (state as any).newRules ? ((globalThis as any).IlexNewRules?.finalDamage(store,state,effect,proposed) ?? proposed) : proposed;
    target.damage += damage;

    const targetOwner = StateUtils.findOwner(state, target);
    targetOwner.marker.addMarkerToState(effect.player.DAMAGE_DEALT_MARKER);

    if (damage > 0) {
      // Track damage dealt by the attacking Pokemon
      if (effect.attackEffect && effect.source) {
        GameStatsTracker.trackDamageDealt(effect.player, effect.source, damage);
      }

      if(damage>0&&!(effect.attackEffect as any)._wotcTrainer){const hp=new CheckHpEffect(StateUtils.findOwner(state,target),target);store.reduceEffect(state,hp);(target as any)._exLethalAttackDamage=target.damage>=hp.hp?{card:targetCard,turn:state.turn,attackId:(effect.attackEffect as any)._dpAttackId,attackerCard:effect.source.getPokemonCard(),wasActive:StateUtils.findOwner(state,target).active===target,powerBlocked:(state.rules as any).dpEraRules&&IS_POKEPOWER_BLOCKED(store,state,StateUtils.findOwner(state,target),targetCard)}:undefined;}
    const afterDamageEffect = new AfterDamageEffect(effect.attackEffect, damage);
      afterDamageEffect.target = effect.target;
      store.reduceEffect(state, afterDamageEffect);
    }
  }

  if (effect instanceof KnockOutOpponentEffect) {
    const target = effect.target;
    const pokemonCard = target.getPokemonCard();
    if (pokemonCard === undefined) {
      throw new GameError(GameMessage.ILLEGAL_ACTION);
    }

    const targetOwner = StateUtils.findOwner(state, target);
    const knockOutEffect = new KnockOutAttackEffect(targetOwner, target, effect.attack);
    state = store.reduceEffect(state, knockOutEffect);

    if (!knockOutEffect.preventDefault) {
      effect.knockedOut = true;
      effect.prizeCount = knockOutEffect.prizeCount;
      return TAKE_X_PRIZES(store, state, effect.player, knockOutEffect.prizeCount);
    }

    return state;
  }

  if (effect instanceof KnockOutPlayerEffect) {
    if (effect.preventDefault) {
      return state;
    }

    const target = effect.target;
    const pokemonCard = target.getPokemonCard();
    if (pokemonCard === undefined) {
      throw new GameError(GameMessage.ILLEGAL_ACTION);
    }

    const targetOwner = StateUtils.findOwner(state, target);
    const knockOutEffect = new KnockOutAttackEffect(targetOwner, target, effect.attack);
    state = store.reduceEffect(state, knockOutEffect);

    if (!knockOutEffect.preventDefault) {
      effect.knockedOut = true;
      effect.prizeCount = knockOutEffect.prizeCount;
      return TAKE_X_PRIZES(store, state, effect.opponent, knockOutEffect.prizeCount);
    }

    return state;
  }

  if (effect instanceof SwapDamageCountersEffect) {
    const original = effect.source.damage;
    effect.source.damage = effect.target.damage;
    effect.target.damage = original;
    return state;
  }

  if (effect instanceof PutCountersEffect) {
    const target = effect.target;
    const sourceOwner = StateUtils.findOwner(state, effect.source);
    const targetCard = target.getPokemonCard();
    if (targetCard === undefined) {
      throw new GameError(GameMessage.ILLEGAL_ACTION);
    }

    const proposed = Math.max(0,effect.damage);
    const damage = (state as any).newRules ? ((globalThis as any).IlexNewRules?.finalDamage(store,state,effect,proposed) ?? proposed) : proposed;
    target.damage += damage;
    if(damage>0)delete (target as any)._exLethalAttackDamage;

    if (damage > 0) {
      store.log(state, GameLog.LOG_PLAYER_PLACES_DAMAGE_COUNTERS, {
        name: sourceOwner.name,
        damage: damage,
        target: targetCard.name,
        effect: effect.attack.name,
      });

      // Track damage dealt by the attacking Pokemon
      if (effect.attackEffect && effect.source) {
        GameStatsTracker.trackDamageDealt(effect.player, effect.source, damage);
      }
    }
  }

  if (effect instanceof AfterDamageEffect) {
    const targetOwner = StateUtils.findOwner(state, effect.target);
    targetOwner.marker.addMarkerToState(effect.player.DAMAGE_DEALT_MARKER);

    const reaction=(effect.target as any).wotcDamageReaction;
    if(reaction && reaction.turn===state.turn && effect.target.marker.hasMarker('WOTC_DAMAGE_REACTION') && effect.damage>0 && effect.player!==targetOwner && !(effect.attackEffect as any)._wotcReaction){
      const respond=()=>{const attack:any=new AttackEffect(targetOwner,effect.player,reaction.attack);attack.source=effect.target;attack._wotcReaction=true;if(reaction.counters){const counters=new PutCountersEffect(attack,reaction.amount);counters.target=effect.source;store.reduceEffect(state,counters);return;}const wr=new ApplyWeaknessEffect(attack,reaction.amount??effect.damage*reaction.multiplier);wr.target=effect.player.active;store.reduceEffect(state,wr);const damage=new PutDamageEffect(attack,wr.damage);damage.target=effect.player.active;damage.weaknessApplied=true;store.reduceEffect(state,damage);};
      if(reaction.coin)return COIN_FLIP_PROMPT(store,state,targetOwner,heads=>{if(heads)respond();});respond();
    }

    // Revenge trap (Shell Trap / Counter Press) — even if Knocked Out.
    // Must be an EffectOfAttack attributed to the retaliator so Mist Energy blocks it.
    // coinFlipPrevent traps are resolved during PutDamageEffect instead.
    const retaliate = getActiveRetaliateOnDamage(effect.target);
    if (retaliate !== null
      && !('coinFlipPrevent' in retaliate && retaliate.coinFlipPrevent)
      && effect.damage > 0
      && targetOwner !== effect.player
      && state.phase === GamePhase.ATTACK
      && effect.source) {
      let revengeDamage = 0;
      if ('reflect' in retaliate && retaliate.reflect) {
        revengeDamage = effect.damage;
      } else if ('damage' in retaliate) {
        revengeDamage = retaliate.damage;
      }
      if (revengeDamage > 0) {
        let sourceList = effect.target;
        const attackerPlayer = state.players.find(p => p.id === retaliate.attackerPlayerId);
        if (attackerPlayer) {
          attackerPlayer.forEachPokemon(PlayerType.BOTTOM_PLAYER, (cardList, card) => {
            if (card === retaliate.sourceCard) {
              sourceList = cardList;
            }
          });
        }
        const revengeBase = new AttackEffect(targetOwner, effect.player, retaliate.attack);
        revengeBase.source = sourceList;
        const retaliateEffect = retaliateDamageEffect(revengeBase, revengeDamage, effect.source);
        retaliateEffect.markerSource = retaliate.sourceCard;
        state = store.reduceEffect(state, retaliateEffect);
      }
    }
  }

  if (effect instanceof DiscardCardsEffect) {
    const target = effect.target;
    const cards = effect.cards;
    const owner = StateUtils.findOwner(state, target);
    target.moveCardsTo(cards, owner.discard);
    return state;
  }

  if (effect instanceof DiscardCardsFromOpponentsActivePokemonEffect) {
    if (!effect.preventDefault) {
      const target = effect.target;
      const cards = effect.cards;
      const owner = StateUtils.findOwner(state, target);
      return MOVE_CARDS(store, state, (effect as any).sourceZone||target, owner.discard, { cards, sourceEffect: effect });
    }
    return state;
  }

  if (effect instanceof DiscardDefendingPokemonEffect) {
    if (effect.preventDefault) {
      return state;
    }

    const target = effect.target;
    const pokemonCard = target.getPokemonCard();
    if (pokemonCard === undefined) {
      throw new GameError(GameMessage.ILLEGAL_ACTION);
    }

    const owner = StateUtils.findOwner(state, target);
    state = MOVE_POKEMON_OFF_BOARD(store, state, target, {
      pokemonDestination: owner.discard,
      sourceEffect: effect,
    });
    effect.discarded = true;
    return state;
  }

  if (effect instanceof LostZoneCardsEffect) {
    const target = effect.target;
    const cards = effect.cards;
    const owner = StateUtils.findOwner(state, target);
    target.moveCardsTo(cards, owner.lostzone);
    return state;
  }

  if (effect instanceof CardsToHandEffect) {
    const target = effect.target;
    const cards = effect.cards;
    const owner = StateUtils.findOwner(state, target);
    target.moveCardsTo(cards, owner.hand);
    return state;
  }

  if (effect instanceof MoveOpponentEnergyEffect) {
    if (!effect.preventDefault) {
      ((effect as any).sourceZone||effect.target).moveCardTo(effect.card, effect.destination);
    }
    return state;
  }

  if (effect instanceof GustOpponentBenchEffect) {
    if (!effect.preventDefault) {
      effect.opponent.switchPokemon(effect.target, store, state);
    }
    return state;
  }

  if (effect instanceof SwitchOutOpponentsActiveEffect) {
    if (!effect.preventDefault && effect.benchTarget) {
      effect.opponent.switchPokemon(effect.benchTarget, store, state);
    }
    return state;
  }

  if (effect instanceof AddMarkerEffect) {
    const target = effect.target;
    target.marker.addMarker(effect.markerName, effect.markerSource, (effect.attackEffect as any)._wotcTrainer ? 'trainer' : 'attack', 'pokemon');
    effect.markerAdded = true;
    return state;
  }

  if (effect instanceof HealTargetEffect) {
    const target = effect.target;
    const owner = StateUtils.findOwner(state, target);
    const healEffect = new HealEffect(owner, target, effect.damage);
    state = store.reduceEffect(state, healEffect);
    return state;
  }

  if (effect instanceof AddSpecialConditionsEffect) {
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
    return state;
  }

  if (effect instanceof RemoveSpecialConditionsEffect) {
    const target = effect.target;
    effect.specialConditions.forEach(sp => {
      target.removeSpecialCondition(sp);
    });
    return state;
  }

  if (effect instanceof RetaliateDamageEffect) {
    const target = effect.target;
    const targetCard = target.getPokemonCard();
    const sourceOwner = StateUtils.findOwner(state, effect.source);
    const damage = Math.max(0, effect.damage);
    effect.applyEffect();
    if (damage > 0 && targetCard !== undefined) {
      store.log(state, GameLog.LOG_PLAYER_PLACES_DAMAGE_COUNTERS, {
        name: sourceOwner.name,
        damage,
        target: targetCard.name,
        effect: effect.attack.name,
      });
      if (effect.source) {
        GameStatsTracker.trackDamageDealt(effect.player, effect.source, damage);
      }
    }
    return state;
  }

  if (effect instanceof EffectOfAttackEffect) {
    effect.applyEffect();
    return state;
  }

  return state;
}
