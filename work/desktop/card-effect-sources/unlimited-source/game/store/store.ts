import { outgoingBeforeHit, finishOutgoingHit } from '../../tcg-lab-outgoing-tools';
import { isLegacyPowerType } from '../../tcg-lab-unlimited-power-types';
import {swshBeforeEffect,swshMovementBlocked} from '../../tcg-lab-swsh-environment';
import {svBeforeEffect,svMovementBlocked} from '../../tcg-lab-sv-environment';
import {smBeforeEffect,smAfterEffect,smPreparePrompts} from '../../tcg-lab-sm-environment';
import {bwFinish} from '../../tcg-lab-bw-cards';
import {xyCoinResult,xyPlayerProtected} from '../../tcg-lab-xy-player';
import {xyBeforeEffect,xyAfterEffect} from '../../tcg-lab-xy-environment';
import {bwEnvironment,syncBwBadges} from '../../tcg-lab-bw-actions';
import { hgssEnvironment,hgssFinish } from '../../tcg-lab-hgss-legend';
import { dpNativePowerChoice } from '../../tcg-lab-dp-power-window';
import { dpPokemonStadiumEffect,dpGuardToolEffect } from '../../tcg-lab-dp-card-roles';
import { syncHolonVeil } from '../../tcg-lab-ex-finish-powers';
import { syncDpLevels, reduceDpLevel, playDpLevel } from '../../tcg-lab-dp-level';
import { prepareExRetreatCost } from '../../tcg-lab-ex-retreat';
import { finalBefore, finalAfter, specialEnergySuppressed, keepEnergyProtected, finalRetreat, discardPileProtected } from '../../tcg-lab-wotc-final';
import { CardList } from './state/card-list';
import { revealWotcSlot } from './prefabs/wotc-facedown';
import { PlayerType } from './actions/play-card-action';
import { UseAttackEffect } from './effects/game-effects';
import { AddSpecialConditionsPowerEffect } from './effects/check-effects';
import { SelectPrompt } from './prompts/select-prompt';
import { PowerType } from './card/pokemon-types';
import { AfterEnergyAttachedEffect } from './effects/play-card-effects';
import { AttackEffect } from './effects/game-effects';
import { AddSpecialConditionsEffect } from './effects/attack-effects';
import { SpecialCondition } from './card/card-types';
import { ChooseCardsPrompt } from './prompts/choose-cards-prompt';
import { StateUtils } from './state-utils';
import { Action } from './actions/action';
import { AbortGameAction } from './actions/abort-game-action';
import { AppendLogAction } from './actions/append-log-action';
import { ConcedeAction } from './actions/concede-action';
import { Card } from './card/card';
import { SuperType, TrainerType, CardType, SpecialCondition } from './card/card-types';
import { TrainerCard } from './card/trainer-card';
import { ChangeAvatarAction } from './actions/change-avatar-action';
import { Effect } from './effects/effect';
import { PlayPokemonEffect, TrainerEffect } from './effects/play-card-effects';
import { CheckAttackCostEffect, CheckPokemonPowersEffect, CheckRetreatCostEffect, CheckProvidedEnergyEffect } from './effects/check-effects';
import { MovedFromActiveToBenchEffect, MovedToActiveEffect, PowerEffect } from './effects/game-effects';
import {
  CLEAR_ABILITY_LOCK_ACTIVATION,
  STAMP_ABILITY_LOCK_ACTIVATION,
  APPLY_ATTACK_EFFECT_ABILITY_LOCKS,
} from './prefabs/ability-lock';
import { resolveCopyAttackSessions } from './prefabs/copy-attack-delegation';
import { effectWasBlocked, logAppliedEffect, logPreventedEffect, logResolvedPrompt, stampEffectBlocker } from './prefabs/auto-log';
import { filterTrainerPromptResult, ResolvingTrainerSource } from './prefabs/trainer-target';
import { GameError } from '../game-error';
import { GameMessage, GameLog } from '../game-message';
import { Prompt } from './prompts/prompt';
import { ReorderHandAction, ReorderBenchAction } from './actions/reorder-actions';
import { ResolvePromptAction } from './actions/resolve-prompt-action';
import { State, GamePhase } from './state/state';
import { StateLog, StateLogParam } from './state/state-log';
import { StoreHandler } from './store-handler';
import { StoreLike } from './store-like';
import { generateId, deepClone } from '../../utils/utils';
import { attackReducer } from './effect-reducers/attack-effect';
import { playCardReducer } from './reducers/play-card-reducer';
import { playEnergyReducer } from './effect-reducers/play-energy-effect';
import { playPokemonReducer } from './effect-reducers/play-pokemon-effect';
import { playPokemonFromDeckReducer } from './effect-reducers/play-pokemon-from-deck-effect';
import { playPokemonFromDiscardReducer } from './effect-reducers/play-pokemon-from-discard-effect';
import { playTrainerReducer } from './effect-reducers/play-trainer-effect';
import { playerTurnReducer } from './reducers/player-turn-reducer';
import { gamePhaseReducer } from './effect-reducers/game-phase-effect';
import { gameReducer } from './effect-reducers/game-effect';
import { checkState, checkStateReducer } from './effect-reducers/check-effect';
import { playerStateReducer } from './reducers/player-state-reducer';
import { retreatReducer } from './effect-reducers/retreat-effect';
import { setupPhaseReducer } from './reducers/setup-reducer';
import { abortGameReducer } from './reducers/abort-game-reducer';
import { concedeReducer } from './reducers/concede-reducer';
import { sandboxReducer } from './reducers/sandbox-reducer';
import { SandboxModifyPlayerAction } from './actions/sandbox-modify-player-action';
import { SandboxModifyGameStateAction } from './actions/sandbox-modify-game-state-action';
import { SandboxModifyCardAction } from './actions/sandbox-modify-card-action';
import { SandboxModifyPokemonAction } from './actions/sandbox-modify-pokemon-action';

interface PromptItem {
  ids: number[],
  then: (results: any) => void;
}

export class Store implements StoreLike {

  //private effectHistory: Effect[] = [];

  public state: State = new State();
  private promptItems: PromptItem[] = [];
  private waitItems: (() => void)[] = [];
  private logId: number = 0;
  // Flag to prevent nested playability calculations
  private calculatingPlayability: boolean = false;
  /** Set only while the played trainer card's own effect (or its prompt callbacks) runs. */
  private resolvingTrainer: ResolvingTrainerSource | undefined;
  /** Prompt ids created by the resolving trainer. Not serialized. */
  private trainerPromptSources = new Map<number, ResolvingTrainerSource>();

  constructor(private handler: StoreHandler) { }

  public dispatch(action: Action, clientRoleId?: number): State {
    (this as any)._wotcActionDepth=((this as any)._wotcActionDepth||0)+1;
    try{return this.dispatchInternal(action,clientRoleId);}finally{(this as any)._wotcActionDepth--;}
  }
  private dispatchInternal(action:Action,clientRoleId?:number):State {
    let state = this.state;

    // Handle sandbox actions
    if (action instanceof SandboxModifyPlayerAction
      || action instanceof SandboxModifyGameStateAction
      || action instanceof SandboxModifyCardAction
      || action instanceof SandboxModifyPokemonAction) {
      if (clientRoleId === undefined) {
        throw new GameError(GameMessage.ILLEGAL_ACTION);
      }
      state = sandboxReducer(this, state, action, clientRoleId);
      this.handler.onStateChange(state);
      return state;
    }

    if (action instanceof AbortGameAction) {
      state = abortGameReducer(this, state, action);
      this.handler.onStateChange(state);
      return state;
    }

    if (action instanceof ConcedeAction) {
      state = concedeReducer(this, state, action);
      this.handler.onStateChange(state);
      return state;
    }

    if (action instanceof ReorderHandAction
      || action instanceof ReorderBenchAction
      || action instanceof ChangeAvatarAction) {
      state = playerStateReducer(this, state, action);
      this.handler.onStateChange(state);
      return state;
    }

    if (action instanceof ResolvePromptAction) {
      try {
        state = this.reducePrompt(state, action);
        state = this.resolveAutomaticPrompts(state);
      } catch (storeError) {
        this.handler.onStateChange(state);
        throw storeError;
      }
      if (this.promptItems.length === 0) {
        state = checkState(this, state);
      }
      this.handler.onStateChange(state);
      return state;
    }

    if (action instanceof AppendLogAction) {
      this.log(state, action.message, action.params, action.id);
      this.handler.onStateChange(state);
      return state;
    }

    if (state.prompts.some(p => p.result === undefined)) {
      throw new GameError(GameMessage.ACTION_IN_PROGRESS);
    }

    state = this.reduce(state, action);
    const automatic=state.prompts.some((p:any)=>p.result===undefined&&p._wotcAutoAnswer!==undefined);
    state = this.resolveAutomaticPrompts(state);
    if(automatic&&this.promptItems.length===0)state=checkState(this,state);

    return state;
  }

  public reduceEffect(state: State,effect:Effect):State {
    if(effect instanceof AttackEffect && effect.attack.shredAttack)(effect as any).wotcBypassDefender=true;
    outgoingBeforeHit(this,state,effect);
    syncBwBadges(this,state);
    syncDpLevels(state);
    syncHolonVeil(this,state);
    if(state.rules.bwEraRules&&effect.type==='KNOCK_OUT_EFFECT'){const actualKoOwner=state.players.find((p:any)=>p.active===(effect as any).target||p.bench.includes((effect as any).target));if(actualKoOwner)(effect as any).player=actualKoOwner;}
    if(svBeforeEffect(this,state,effect))return state;
    if(swshBeforeEffect(this,state,effect))return state;
    if(smBeforeEffect(this,state,effect))return state;
    if(xyBeforeEffect(this,state,effect))return state;
    const shield:any=(effect as any).target;if(state.rules.exEraRules&&shield?.exAllDamageShield?.turn===state.turn&&shield.exAllDamageShield.card===shield.getPokemonCard()&&shield.marker.hasMarker('EX_ALL_DAMAGE_SHIELD')&&['PUT_DAMAGE_EFFECT','DEAL_DAMAGE_EFFECT','WOTC_POWER_DAMAGE_EFFECT'].includes(effect.type)){effect.preventDefault=true;return state;}
    const previous=(CardList as any).wotcMovementContext,e:any=effect;
    const previousDepth=(this as any)._wotcReduceDepth||0;
    (this as any)._wotcReduceDepth=previousDepth+1;
    for(const player of state.players){(player.discard as any)._wotcDiscardOwnerId=player.id;}
    let actorId=e.player?.id??previous?.actorId??state.players[state.activePlayer]?.id;
    if(e.sourceCard||e.options?.sourceCard){try{actorId=StateUtils.findOwner(state,StateUtils.findCardList(state,e.sourceCard||e.options.sourceCard)).id;}catch{}}
    const store=this;
    (CardList as any).wotcMovementContext={svMovementBlocked,swshMovementBlocked,store:this,state,actorId,kind:effect instanceof PowerEffect||e.sourceEffect instanceof PowerEffect?'power':effect instanceof TrainerEffect||e.sourceEffect instanceof TrainerEffect||e.attackEffect?._wotcTrainer||e.sourceEffect?._wotcTrainer?'trainer':e.attackEffect||effect instanceof AttackEffect||effect instanceof UseAttackEffect||e.sourceEffect instanceof AttackEffect?'attack':previous?.kind,wholePokemon:previous?.wholePokemon||effect.type==='MOVE_POKEMON_OFF_BOARD_EFFECT',knockout:previous?.knockout||effect.type==='KNOCK_OUT_EFFECT',sourceCard:(effect instanceof PowerEffect?effect.card:undefined)||(effect as any).trainerCard||e.sourceCard||e.sourceEffect?.card||e.sourceEffect?.trainerCard||previous?.sourceCard,xyPlayerProtected:(owner:any)=>xyPlayerProtected(store,state,owner),discardProtected:()=>discardPileProtected(store,state),keepProtected:(owner:any,list:any)=>keepEnergyProtected(store,state,owner,list),legendaryProtected:(owner:any,list:any)=>{const check:any={type:'WOTC_CHECK_LEGENDARY',player:owner,target:list,preventDefault:false};store.reduceEffect(state,check);return check.preventDefault;},isNonColorless:(list:any,card:any)=>{const owner=StateUtils.findOwner(state,list),check=new CheckProvidedEnergyEffect(owner,list);store.reduceEffect(state,check);const entry=check.energyMap.find((x:any)=>x.card===card);return !!entry&&entry.provides.some((type:any)=>type!==CardType.COLORLESS&&type!==CardType.NONE);}};
    try{return this.reduceEffectInternal(state,effect);}finally{finishOutgoingHit(effect);(CardList as any).wotcMovementContext=previous;(this as any)._wotcReduceDepth=previousDepth;}
  }
  private reduceEffectInternal(state: State, effect: Effect): State {
    prepareExRetreatCost(state,effect);
    if(finalBefore(this,state,effect))return state;
    const facedown:any=effect,target=facedown.target||(['RETREAT_EFFECT','USE_ATTACK_EFFECT'].includes(effect.type)?facedown.player?.active:undefined);
    const knowledge=(this as any)._wotcActionDepth>0&&['CHECK_HP_EFFECT','CHECK_POKEMON_TYPE_EFFECT','CHECK_POKEMON_STATS_EFFECT','CHECK_RETREAT_COST_EFFECT'].includes(effect.type)&&(CardList as any).wotcMovementContext?.kind&&!facedown._wotcStateCheck;
    if(!this.calculatingPlayability&&target?.getPokemonCard?.()?._wotcConcealedCard&&(facedown.attackEffect||effect.type==='WOTC_POWER_DAMAGE_EFFECT'||['RETREAT_EFFECT','PLAY_POKEMON_EFFECT','USE_ATTACK_EFFECT'].includes(effect.type)||knowledge)){
      const removed=revealWotcSlot(this,state,target);if(removed){effect.preventDefault=true;return state;}
      const actual=target.getPokemonCard();if(effect.type==='CHECK_HP_EFFECT')facedown.hp=actual.hp;if(effect.type==='CHECK_POKEMON_TYPE_EFFECT')facedown.cardTypes=[...actual.cardType];if(effect.type==='CHECK_POKEMON_STATS_EFFECT'){facedown.weakness=[...actual.weakness];facedown.resistance=[...actual.resistance];}
    }
    const gym:any=effect;
    if(effect.type==='DEAL_DAMAGE_EFFECT'&&gym.target===gym.source&&gym.source.marker.hasMarker('WOTC_FOCUS_RECOIL')&&gym.source.wotcFocusRecoil?.turn===state.turn&&gym.source.wotcFocusRecoil.attackName===gym.attack.name&&!gym._wotcRecoilDoubled){gym.damage*=2;gym._wotcRecoilDoubled=true;}
    if(effect.type==='AFTER_DAMAGE_EFFECT'&&!gym._wotcKogaApplied&&gym.damage>0&&gym.target===gym.opponent.active&&gym.player.wotcKogaTurn===state.turn&&gym.source.getPokemonCard()?.name.includes('Koga')&&!gym.attackEffect._wotcTrainer){gym._wotcKogaApplied=true;gym._wotcKogaCandidate=gym.target.getPokemonCard();}
    const wotcAttack = effect as any;
    if(effect instanceof TrainerEffect&&(effect.trainerCard as any)._wotcRemovalCostPrepaid){(effect as any)._wotcSurchargePaid=true;delete (effect.trainerCard as any)._wotcRemovalCostPrepaid;}
    if(effect.type==='CHECK_POKEMON_TYPE_EFFECT'){const check=effect as any;if(check.target.wotcCounters?.color!==undefined)check.cardTypes=[check.target.wotcCounters.color];}
    if(wotcAttack.attackEffect&&!wotcAttack.attackEffect._wotcTrainer&&wotcAttack.target){const owner=state.players.find(p=>p.bench.includes(wotcAttack.target));if(owner&&owner!==wotcAttack.player&&(owner as any).wotcBenchShieldTurn===state.turn&&!['AFTER_DAMAGE_EFFECT','APPLY_WEAKNESS_EFFECT'].includes(effect.type)&&!wotcAttack.attackEffect.wotcBypassDefender){effect.preventDefault=true;return state;}}

    if(effect instanceof AttackEffect&&!wotcAttack._wotcDamageTrackingInitialized){wotcAttack._wotcDamageTrackingInitialized=true;const card=effect.source.getPokemonCard() as any;if(card){const historyPlayer:any=effect.player;historyPlayer._swshAttackHistory=(historyPlayer._swshAttackHistory||[]).filter((r:any)=>r.turn===historyPlayer.wotcLastTurnEnded||r.turn===state.turn);historyPlayer._swshAttackHistory.push({turn:state.turn,pokemon:card.name,cardId:card.id,attack:effect.attack.name});/* effect.player as any)._swshAttackHistory */card._wotcPriorAttack=card._wotcLastUsedAttack;card._wotcLastUsedAttack={name:(effect.attack as any)._wotcOriginalAttack?.name||effect.attack.name,turn:state.turn};card._wotcLastAttackDamage=0;card._wotcLastTotalAttackDamage=0;}}
    if(effect.type==='AFTER_DAMAGE_EFFECT'&&!wotcAttack._wotcDamageTracked){wotcAttack._wotcDamageTracked=true;const card=wotcAttack.attackEffect?._wotcSourceCard||wotcAttack.source.getPokemonCard();if(card){if(wotcAttack.target===wotcAttack.opponent.active)card._wotcLastAttackDamage=(card._wotcLastAttackDamage||0)+wotcAttack.damage;if(wotcAttack.target===wotcAttack.opponent.active||wotcAttack.opponent.bench.includes(wotcAttack.target))card._wotcLastTotalAttackDamage=(card._wotcLastTotalAttackDamage||0)+wotcAttack.damage;}}
    for(const owner of state.players){const card=owner.active.getPokemonCard() as any,link=card?._wotcLinkedDefense;if(!link||link.turn!==state.turn||!owner.active.marker.hasMarker(link.marker,card))continue;const opponent=StateUtils.getOpponent(state,owner);if(!opponent.active.marker.hasMarker(link.marker,card))continue;if(link.noAttack&&effect instanceof UseAttackEffect&&effect.player===opponent)throw new GameError(GameMessage.BLOCKED_BY_EFFECT);if(link.reduction&&effect.type==='APPLY_WEAKNESS_EFFECT'&&wotcAttack.source===opponent.active&&wotcAttack.target===owner.active)wotcAttack.damage=Math.max(0,wotcAttack.damage-link.reduction);}

    const currentAttack=(state as any).wotcCurrentAttack;
    if(effect instanceof AddSpecialConditionsPowerEffect&&currentAttack?._wotcFledDefender&&effect.source===currentAttack.source.getPokemonCard()&&effect.player===currentAttack.opponent){effect.preventDefault=true;return state;}
    if(wotcAttack.attackEffect?._wotcFledDefender&&wotcAttack.target===wotcAttack.opponent?.active&&!['AFTER_DAMAGE_EFFECT','APPLY_WEAKNESS_EFFECT','PUT_DAMAGE_EFFECT','DEAL_DAMAGE_EFFECT'].includes(effect.type)){effect.preventDefault=true;return state;}

    if(effect.type==='CHECK_POKEMON_ATTACKS_EFFECT'){const check=effect as any,slot=check.player.active;if(slot.wotcRecallTurn===state.turn&&slot.marker.hasMarker('WOTC_RECALL'))for(const pokemon of slot.getPokemons().filter((c:any)=>c!==slot.getPokemonCard()))for(const original of pokemon.attacks){const duplicate=slot.getPokemonCard().attacks.some((a:any)=>a.name===original.name)||check.attacks.some((a:any)=>a.name===original.name);const attack=duplicate?{...original,cost:[...original.cost],name:original.name+' ('+pokemon.name+')',_wotcOriginalAttack:original}:original;check.attacks.push(attack);check.attackSources.set(attack,pokemon);}}

    if(wotcAttack.attackEffect?._wotcFledTargets?.has(wotcAttack.target)&&!['AFTER_DAMAGE_EFFECT','APPLY_WEAKNESS_EFFECT'].includes(effect.type)){effect.preventDefault=true;return state;}

    if(effect instanceof TrainerEffect && ['Energy Removal','Super Energy Removal'].includes(effect.trainerCard.name) && !(effect as any)._wotcSurchargePaid && !(effect.trainerCard as any)._wotcRemovalCostPrepaid){
      const stadium=StateUtils.getStadiumCard(state) as any,cost=stadium?._wotcRemovalSurcharge;
      if(cost && !state.players.some(p=>p.stadiumAndToolHaveNoEffectTurnsRemaining>0)){
        const player=effect.player,eligible=player.hand.cards.filter(c=>c!==effect.trainerCard);
        const opponent=StateUtils.getOpponent(state,player),hasEnergy=(p:any)=>[p.active,...p.bench].some((l:any)=>l.cards.some((c:any)=>c.superType===SuperType.ENERGY));
        if(!hasEnergy(opponent)||effect.trainerCard.name==='Super Energy Removal'&&!hasEnergy(player))throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);

        if(eligible.length<cost)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
        return this.prompt(state,new ChooseCardsPrompt(player,GameMessage.CHOOSE_CARD_TO_DISCARD,player.hand,{},{min:cost,max:cost,allowCancel:false,blocked:player.hand.cards.map((c,i)=>c===effect.trainerCard?i:-1).filter(i=>i>=0)}),(cards:any)=>{player.hand.moveCardsTo(cards,player.discard);(effect as any)._wotcSurchargePaid=true;this.reduceEffect(state,effect);});
      }
    }
    if (effect instanceof PowerEffect && effect.power.powerType === PowerType.POKEBODY
      && (state as any).wotcIgnoreBodiesUntilTurn === state.turn) throw new GameError(GameMessage.CANNOT_USE_POWER);
    if (effect instanceof PlayPokemonEffect && effect.target?.getPokemonCard()
      && effect.player.hand.cards.includes(effect.pokemonCard)
      && (effect.target as any).wotcHandEvolutionLockUntilTurn === state.turn
      && effect.target.marker.hasMarker('WOTC_HAND_EVOLUTION_LOCK')) throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    if (wotcAttack.attackEffect && wotcAttack.target && !wotcAttack.attackEffect._wotcTrainer
      && !['APPLY_WEAKNESS_EFFECT','AFTER_DAMAGE_EFFECT'].includes(effect.type)) {
      const owner = state.players.find(p => p.active === wotcAttack.target || p.bench.includes(wotcAttack.target));
      const bypassDamage = wotcAttack.attackEffect.wotcBypassDefender && ['DEAL_DAMAGE_EFFECT','PUT_DAMAGE_EFFECT','AFTER_WEAKNESS_AND_RESISTANCE_EFFECT'].includes(effect.type);
      if (owner && owner !== wotcAttack.player && (owner as any).wotcUnownShieldUntilTurn === state.turn
        && wotcAttack.target.getPokemonCard?.()?.name.includes('Unown') && !bypassDamage) {
        effect.preventDefault = true;
        if (typeof wotcAttack.damage === 'number') wotcAttack.damage = 0;
        return state;
      }
    }
    // A source-bound retreat lock ends when its source leaves Active, even if
    // that same Pokemon later returns before the defender tries to retreat.
    if (state.players.length === 2) for (const player of state.players) {
      const locked = player.active;
      if (locked.cannotRetreatWhileActiveSourceCard
        && StateUtils.getOpponent(state,player).active.getPokemonCard() !== locked.cannotRetreatWhileActiveSourceCard) {
        locked.cannotRetreatWhileActive = false;
        locked.cannotRetreatWhileActiveSourceCard = undefined;
      }
    }
    // TCG Lab defer attack status
    if ((state.rules as any).wotcRules && (state as any).labDeferStatus && effect.type === 'ADD_SPECIAL_CONDITIONS_EFFECT' && (effect as any).attackEffect) {
      ((state as any).labPendingStatus ||= []).push(effect);return state;
    }
    // Track Active ability-lock activation order before card handlers run.
    if (effect instanceof MovedToActiveEffect) {
      STAMP_ABILITY_LOCK_ACTIVATION(state, effect.player.active, effect.pokemonCard);
    } else if (effect instanceof MovedFromActiveToBenchEffect) {
      CLEAR_ABILITY_LOCK_ACTIVATION(state, effect.pokemonCard);
    }

    APPLY_ATTACK_EFFECT_ABILITY_LOCKS(state, effect);

    if(effect instanceof PlayPokemonEffect&&(effect.pokemonCard as any)._dpLevelUp&&!this.calculatingPlayability)state=playDpLevel(this,state,effect);
    const dpResumeCore=(effect as any)._dpResumeCore===true;delete (effect as any)._dpResumeCore;
    if(!dpResumeCore){state = this.propagateEffect(state, effect);xyAfterEffect(this,state,effect);}
    if(effect.type==='AFTER_DAMAGE_EFFECT'&&gym._wotcKogaCandidate){const poison=()=>{if(gym.target===gym.opponent.active&&gym.target.getPokemonCard()===gym._wotcKogaCandidate&&!gym.attackEffect._wotcFledTargets?.has(gym.target)){const status=new AddSpecialConditionsEffect(gym.attackEffect,[SpecialCondition.POISONED]);status.target=gym.target;this.reduceEffect(state,status);}};if(this.hasPrompts())this.waitPrompt(state,poison);else poison();}
    if(effect.type==='CHECK_POKEMON_TYPE_EFFECT'){const check=effect as any;if(check.target.wotcCounters?.color!==undefined)check.cardTypes=[check.target.wotcCounters.color];}
    if (effect.type === 'CHECK_HP_EFFECT' || effect instanceof AttackEffect) {
      const check=effect as any,list=effect instanceof AttackEffect?check.source:check.target,change=list?.wotcActiveStats;
      if(change && list.marker.hasMarker('WOTC_ACTIVE_STATS',change.pokemon) && list.getPokemonCard()===change.pokemon) {
        if(effect.type==='CHECK_HP_EFFECT')check.hp=change.hp;
        else if(check.attack.name===change.attackName)check.damage=change.damage;
      }
    }
    if (effect.type === 'CHECK_EVOLUTION_TIMING_EFFECT') {
      const timing = effect as any, permission = timing.target.wotcEvolutionPermission;
      if (permission?.turn === state.turn && timing.target.getPokemons().includes(permission.pokemon)) {
        timing.allowFirstTurn = true;
        timing.ignorePlayedTurn = true;
      }
    }
    if (effect.type === 'WOTC_POWER_DAMAGE_EFFECT') {
      const damage = effect as any, target = damage.target;
      const owner = state.players.find(p => p.active === target || p.bench.includes(target));
      const redirect=()=>{const guard=damage._wotcBenchGuards?.shift();if(!guard||damage.damage<=0)return;this.prompt(state,new SelectPrompt(guard.player.id,GameMessage.CHOOSE_OPTION,['Keep damage','Use '+guard.name],{allowCancel:false}),(choice:any)=>{if(choice===1){const amount=Math.min(10,damage.damage);damage.damage-=amount;guard.list.damage+=amount;}redirect();});};redirect();
      if (owner && owner !== damage.player) {
        if (target.marker.hasMarker('WOTC_HALF_ATTACK_DAMAGE') && target.wotcHalfAllDamage && target.wotcHalfAttackDamageUntilTurn === state.turn)
          damage.damage = Math.floor(damage.damage / 20) * 10;
        const reduction = target.wotcReduceAllDamage;
        if (reduction?.untilTurn === state.turn && target.marker.hasMarker('WOTC_REDUCE_ALL_DAMAGE')) damage.damage = Math.max(0, damage.damage - reduction.amount);
      }
    }
    if (effect instanceof AfterEnergyAttachedEffect) {
      const trigger = (effect.target as any).wotcAttachmentStatus;
      if (trigger && trigger.untilTurn === state.turn && effect.target.marker.hasMarker(trigger.marker, trigger.source)) {
        const attacker = state.players.find(p => p.id === trigger.playerId);
        if (attacker && attacker !== effect.player) {
          const attack = new AttackEffect(attacker, effect.player, trigger.attack);
          (attack as any)._wotcSourceCard = trigger.source;
          const status = new AddSpecialConditionsEffect(attack, trigger.conditions.map((c: string) => (SpecialCondition as any)[c]));
          status.target = effect.target;
          state = this.reduceEffect(state, status);
        }
      }
    }
    // TCG Lab slot conversion
    if(effect.type === 'CHECK_POKEMON_STATS_EFFECT') {
      const stats=effect as any;
      if(stats.target.labConversionWeakness!==undefined)stats.weakness=[{type:stats.target.labConversionWeakness}];
      if(stats.target.labConversionResistance!==undefined)stats.resistance=[{type:stats.target.labConversionResistance,value:-30}];
    }
    if (!this.calculatingPlayability) {
      logPreventedEffect(this, state, effect);
    }
    state = resolveCopyAttackSessions(this, state, effect);

    const gs = state.gameSettings;
    if (gs?.sandboxMode) {
      if (effect instanceof CheckAttackCostEffect && gs.sandboxAttacksCostNoEnergy) {
        effect.cost = [];
      }
      if (effect instanceof CheckRetreatCostEffect && gs.sandboxRetreatCostsNoEnergy) {
        effect.cost = [];
      }
    }

    if (effect.preventDefault === true) {
      return state;
    }

    state = bwEnvironment(this,state,hgssEnvironment(this,state,effect));
    state = gamePhaseReducer(this, state, effect);
    state = playEnergyReducer(this, state, effect);
    state = playPokemonReducer(this, state, effect);
    state = playPokemonFromDeckReducer(this, state, effect);
    state = playPokemonFromDiscardReducer(this, state, effect);
    state = playTrainerReducer(this, state, effect);
    state = retreatReducer(this, state, effect);
    state = gameReducer(this, state, effect);
    state = attackReducer(this, state, effect);
    state = checkStateReducer(this, state, effect);
    state = hgssFinish(this,state,effect);
    state = bwFinish(this,state,effect);
    // TCG Lab final Energy Burn, including a converted Buzzap card.
    if(effect.type === 'CHECK_ENOUGH_ENERGY_EFFECT') {
      const energy=effect as any, card=energy.source.getPokemonCard();
      if(card && energy.player.marker.hasMarker('ENERGY_BURN_MARKER',card))
        energy.energyMap.forEach((entry:any)=>entry.provides=entry.provides.map(()=>CardType.FIRE));
      if(energy.source.marker.hasMarker('WOTC_ENERGY_TYPE')&&energy.source.wotcEnergyTypeTurn===state.turn)
        energy.energyMap.forEach((entry:any)=>entry.provides=entry.provides.map((type:any)=>type===energy.source.wotcEnergyTypeFrom?energy.source.wotcEnergyTypeTo:type));
    }

    if (!this.calculatingPlayability) {
      logAppliedEffect(this, state, effect);
    }

    smAfterEffect(this,state,effect);
    finalAfter(this,state,effect);
    syncBwBadges(this,state);
    // Calculate playability after all effects are processed
    // The calculatingPlayability flag prevents nested calls during playability checks
    state = this.calculatePlayability(state);

    return state;
  }

  compareEffects(effect1: Effect, effect2: Effect): boolean {
    if (effect1.type !== effect2.type) {
      return false;
    }

    const effect1CardId = (<any>effect1)?.card?.id;
    const effect2CardId = (<any>effect2)?.card?.id;

    const effect1CardPlayerId = (<any>effect1)?.player?.id;
    const effect2CardPlayerId = (<any>effect2)?.player?.id;

    return effect1CardId === effect2CardId &&
      effect1CardPlayerId === effect2CardPlayerId;
  }

  public prompt(state: State, prompts: Prompt<any>[] | Prompt<any>, then: (results: any) => void): State {
    if (!(prompts instanceof Array)) {
      prompts = [prompts];
    }

    smPreparePrompts(state,prompts);
    const receipt:any=(this.resolvingTrainer?.trainerCard as any)?._wotcPrepaidCost;
    if(receipt)for(const prompt of prompts as any[]){
      if(receipt.energy&&prompt.type==='Choose pokemon'&&prompt.playerId===this.resolvingTrainer?.player.id&&prompt.playerType===PlayerType.BOTTOM_PLAYER)prompt._wotcAutoAnswer=[receipt.zone];
      if(prompt.type==='Choose cards'&&prompt.playerId===this.resolvingTrainer?.player.id&&prompt.message===GameMessage.CHOOSE_CARD_TO_DISCARD&&prompt.options.min===receipt.cards.length){prompt._wotcAutoAnswer=receipt.cards;delete (this.resolvingTrainer!.trainerCard as any)._wotcPrepaidCost;}
    }
    const movementContext=(CardList as any).wotcMovementContext;
    const reduceDepth=(this as any)._wotcReduceDepth||0;
    for (let i = 0; i < prompts.length; i++) {
      const id = generateId(state.prompts);
      prompts[i].id = id;

      // Route answers to promptController while keeping board perspective on the
      // original owner (Hand Control / forced opponent card play).
      const controllerId = state.promptControllerId;
      if (controllerId !== undefined && controllerId !== prompts[i].playerId) {
        if (prompts[i].perspectivePlayerId === undefined) {
          prompts[i].perspectivePlayerId = prompts[i].playerId;
        }
        prompts[i].playerId = controllerId;
      }

      state.prompts.push(prompts[i]);
      this.stampTrainerPrompt(prompts[i]);
    }

    const promptItem: PromptItem = {
      ids: prompts.map(prompt => prompt.id),
      then: (results:any)=>{const previous=(CardList as any).wotcMovementContext,previousDepth=(this as any)._wotcReduceDepth||0;(this as any)._wotcReduceDepth=reduceDepth;(CardList as any).wotcMovementContext=movementContext?{...movementContext,state:this.state}:previous;try{then(results);}finally{(CardList as any).wotcMovementContext=previous;(this as any)._wotcReduceDepth=previousDepth;}}
    };

    this.promptItems.push(promptItem);
    return state;
  }

  public waitPrompt(state: State, callback: () => void): State {
    const depth=(this as any)._wotcReduceDepth||0;
    const continuation:any=()=>{const previousDepth=(this as any)._wotcReduceDepth||0;(this as any)._wotcReduceDepth=depth;try{callback();}finally{(this as any)._wotcReduceDepth=previousDepth;}};
    continuation._wotcDepth=depth;
    this.waitItems.push(continuation);
    return state;
  }

  private resolveAutomaticPrompts(state:State):State {
    for(let n=0;n<100;n++){const prompt:any=state.prompts.find((p:any)=>p.result===undefined&&p._wotcAutoAnswer!==undefined);if(!prompt)break;state=this.reducePrompt(state,new ResolvePromptAction(prompt.id,prompt._wotcAutoAnswer));}
    return state;
  }
  public log(state: State, message: GameLog, params?: StateLogParam, client?: number): void {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).toString();

    const log = new StateLog(message, params, client);
    log.params = { ...params, timestamp };
    log.id = ++this.logId;
    state.logs.push(log);
  }

  private reducePrompt(state: State, action: ResolvePromptAction): State {
    // Resolve prompts actions
    const prompt = state.prompts.find(item => item.id === action.id);
    const promptItem = this.promptItems.find(item => item.ids.indexOf(action.id) !== -1);

    if (prompt === undefined || promptItem === undefined) {
      return state;
    }

    if (prompt.result !== undefined) {
      throw new GameError(GameMessage.PROMPT_ALREADY_RESOLVED);
    }

    try {
      prompt.result = xyCoinResult(this,state,prompt,action.result);

      if (action.log !== undefined) {
        this.log(state, action.log.message, action.log.params, action.log.client);
      }

      const pending = promptItem.ids.map(id => {
        const p = state.prompts.find(item => item.id === id);
        return p === undefined ? undefined : p.result;
      });

      if (pending.every(result => result !== undefined)) {
        this.applyTrainerTargetFilters(state, promptItem.ids);
        if (!this.calculatingPlayability) {
          for (const id of promptItem.ids) {
            const resolved = state.prompts.find(item => item.id === id);
            if (resolved) {
              logResolvedPrompt(this, state, resolved);
            }
          }
        }
        const results = promptItem.ids.map(id => {
          const p = state.prompts.find(item => item.id === id);
          return p === undefined ? undefined : p.result;
        });
        const source = this.takeTrainerPromptSource(promptItem.ids);
        const previous = this.resolvingTrainer;
        if (source) {
          this.resolvingTrainer = source;
        }
        try {
          const itemIndex = this.promptItems.indexOf(promptItem);
          promptItem.then(results.length === 1 ? results[0] : results);
          this.promptItems.splice(itemIndex, 1);
        } finally {
          this.resolvingTrainer = previous;
        }
      }

      this.resolveWaitItems();
    } catch (storeError) {
      this.dropTrainerPromptSources(promptItem.ids);
      for (const id of promptItem.ids) {
        const promptIndex = state.prompts.findIndex(item => item.id === id);
        if (promptIndex !== -1) {
          state.prompts.splice(promptIndex, 1);
        }
      }
      const itemIndex = this.promptItems.indexOf(promptItem);
      if (itemIndex !== -1) {
        this.promptItems.splice(itemIndex, 1);
      }
      throw storeError;
    }

    return state;
  }

  private resolveWaitItems(): void {
    while (this.promptItems.length === 0 && this.waitItems.length > 0) {
      // Finish nested effects before resuming their enclosing attack or Trainer.
      let index=this.waitItems.length-1;
      for(let i=index-1;i>=0;i--)if(((this.waitItems[i] as any)._wotcDepth||0)>((this.waitItems[index] as any)._wotcDepth||0))index=i;
      const waitItem = this.waitItems.splice(index,1)[0];
      if (waitItem !== undefined) {
        waitItem();
      }
    }
  }

  public hasPrompts(): boolean {
    return this.promptItems.length > 0;
  }

  public cleanup(): void {
    this.promptItems = [];
    this.waitItems = [];
    this.logId = 0;
    this.state = new State();
  }

  private reduce(state: State, action: Action): State {
    const stateBackup = deepClone(state, [Card]);
    this.promptItems.length = 0;

    try {
      state = setupPhaseReducer(this, state, action);
      state = playCardReducer(this, state, action);
      state = playerTurnReducer(this, state, action);

      this.resolveWaitItems();
      if (this.promptItems.length === 0) {
        state = checkState(this, state);
      }

      // Calculate playability before state change
      state = this.calculatePlayability(state);
    } catch (storeError) {
      // Illegal action
      this.state = stateBackup;
      this.promptItems.length = 0;
      throw storeError;
    }

    this.handler.onStateChange(state);
    return state;
  }

  private calculatePlayability(state: State): State {
    // Prevent nested calls - if we're already calculating playability, skip
    if (this.calculatingPlayability) {
      return state;
    }

    // Skip playability calculation during setup and other non-play phases
    // Only calculate starting from Turn 1 (skip Turn 0 which is setup)
    if (state.phase !== GamePhase.PLAYER_TURN || state.turn < 1) {
      // Clear playability for all players when not in player turn or during setup
      for (const player of state.players) {
        player.playableCardIds = [];
        player.playableHandAbilityCardIds = [];
      }
      return state;
    }

    // Skip if players aren't set up yet
    if (!state.players || state.players.length === 0) {
      return state;
    }

    // Set flag to prevent nested calls
    this.calculatingPlayability = true;

    // Track prompts before playability check to clean up any created during checks
    const promptItemsBefore = this.promptItems.length;
    const waitItemsBefore = this.waitItems.length;

    try {
      const { CAN_PLAY_CARD, CAN_USE_FROM_HAND_TO_BENCH_POWER } = require('./prefabs/prefabs');
      const { PokemonCard } = require('./card/pokemon-card');

      for (const player of state.players) {
        // Clear previous playability
        player.playableCardIds = [];
        player.playableHandAbilityCardIds = [];

        // Only calculate for the active player
        if (state.players[state.activePlayer]?.id !== player.id) {
          continue;
        }

        // Check each card in hand
        for (const card of player.hand.cards) {
          try {
            // Skip cards without valid IDs (shouldn't happen, but safety check)
            if (card.id === undefined || card.id === -1) {
              continue;
            }

            if (CAN_PLAY_CARD(this, state, player, card)) {
              player.playableCardIds.push(card.id);
            }
            if (
              card instanceof PokemonCard &&
              CAN_USE_FROM_HAND_TO_BENCH_POWER(this, state, player, card)
            ) {
              player.playableHandAbilityCardIds.push(card.id);
            }
          } catch (error) {
            // If check fails, card is not playable - silently continue
          }
        }
      }
    } catch (error) {
      // If playability calculation fails entirely, just clear all and continue
      // This prevents setup from breaking
      for (const player of state.players) {
        player.playableCardIds = [];
        player.playableHandAbilityCardIds = [];
      }
    } finally {
      // Clean up any prompts or wait items that were created during playability checks
      // These are fake prompts from testing card playability and should not interfere with real game prompts
      if (this.promptItems.length > promptItemsBefore) {
        const removed = this.promptItems.splice(promptItemsBefore, this.promptItems.length - promptItemsBefore);
        for (const item of removed) {
          this.dropTrainerPromptSources(item.ids);
        }
      }
      if (this.waitItems.length > waitItemsBefore) {
        this.waitItems.splice(waitItemsBefore, this.waitItems.length - waitItemsBefore);
      }
      // Always clear the flag, even if an error occurred
      this.calculatingPlayability = false;
    }

    return state;
  }

  private propagateEffect(state: State, effect: Effect): State {
    const cards: Card[] = [];
    for (const player of state.players) {
      player.stadium.cards.forEach(c => cards.push(c));
      player.supporter.cards.forEach(c => cards.push(c));
      player.active.cards.forEach(c => cards.push(c));
      player.active.tools.forEach(t => cards.push(t));
      for (const bench of player.bench) {
        bench.cards.forEach(c => cards.push(c));
        bench.tools.forEach(t => cards.push(t));
      }
      for (const prize of player.prizes) {
        prize.cards.forEach(c => cards.push(c));
      }
      player.hand.cards.forEach(c => cards.push(c));
      player.deck.cards.forEach(c => cards.push(c));
      player.discard.cards.forEach(c => cards.push(c));
    }
    const playPokemonTargetTools = effect instanceof PlayPokemonEffect
      ? effect.target.tools.slice()
      : [];

    playPokemonTargetTools.forEach(t => {
      state = this.callReduceEffect(t, this, state, effect);
    });

    // Ability locks live on Trainers/Stadiums.
    // PowerEffect: run lockers first so they throw before ability owners mutate state.
    // CheckPokemonPowersEffect: run stadiums last so filters apply after tools / BREAK /
    // LV.X handlers contribute powers (otherwise Path to the Peak etc. get undone).
    if (effect instanceof PowerEffect) {
      const rank = (c: Card) => {
        if (c.superType === SuperType.TRAINER) return 0;
        if (c.superType === SuperType.ENERGY) return 1;
        return 2;
      };
      cards.sort((a, b) => rank(a) - rank(b));
    } else if (effect instanceof CheckPokemonPowersEffect) {
      const rank = (c: Card) => {
        if (c.superType === SuperType.POKEMON) return 0;
        if (c.superType === SuperType.ENERGY) return 1;
        if (c instanceof TrainerCard && c.trainerType === TrainerType.STADIUM) return 3;
        if (c.superType === SuperType.TRAINER) return 2;
        return 2;
      };
      cards.sort((a, b) => rank(a) - rank(b));
    } else {
      // WOTC printed damage order (rulebook p.22): attacking Trainers,
      // defending Trainers, then prevention/reduction and Pokémon Powers.
      if ((state.rules as any).wotcRules && effect.type === 'PUT_DAMAGE_EFFECT') {
        const damageEffect = effect as any;
        const rank = (c:Card) => damageEffect.source?.cards.includes(c) && c.superType === SuperType.TRAINER ? 0 : damageEffect.target?.cards.includes(c) && c.superType === SuperType.TRAINER ? 1 : 2;
        cards.sort((a,b) => rank(a) - rank(b));
      } else cards.sort((a, b) => a.superType - b.superType);
    }
    [...new Set(cards)].forEach(c => {
      if (playPokemonTargetTools.includes(c)) {
        return;
      }
      state = this.callReduceEffect(c, this, state, effect);
    });
    return state;
  }

  // Utility function to call reduceEffect with override support
  private callReduceEffect(card: Card, store: StoreLike, state: State, effect: Effect): State {
    if((card as any)._dpPokemonStadiumRole)return dpPokemonStadiumEffect(card,store,state,effect);
    if((card as any)._dpPokemonEnergyRole)return state;
    if((card as any)._dpFaceDownEnergyRole)return state;
    if((card as any)._dpPokemonToolRole)return dpGuardToolEffect(card,store,state,effect);
    if(card.superType===SuperType.ENERGY&&(card as any).energyType===1&&specialEnergySuppressed(store,state))return state;
    const damage = effect as any;
    if (['APPLY_WEAKNESS_EFFECT','DEAL_DAMAGE_EFFECT','PUT_DAMAGE_EFFECT','AFTER_WEAKNESS_AND_RESISTANCE_EFFECT'].includes(effect.type)
      && damage.attackEffect?.wotcBypassDefender && damage.opponent) {
      const defendingSlots = [damage.opponent.active, ...damage.opponent.bench];
      if (defendingSlots.includes(damage.target)
        && (card.superType === SuperType.POKEMON && defendingSlots.some(l => l.cards.includes(card))
          || damage.target.cards.includes(card) || damage.target.tools.includes(card))) return state;
    }
    const crystalSlot = effect.type === 'CHECK_POKEMON_TYPE_EFFECT' && (card as any)._wotcCrystalTurn === state.turn ? StateUtils.findPokemonSlot(state, card) : undefined;
    const persistentCrystalType = crystalSlot?.marker.hasMarker('WOTC_CRYSTAL_TYPE',card) && (effect as any).target === crystalSlot;
    const powerSlot = ((state as any).wotcHasPowerLocks || (state as any).wotcHasPokePowerLocks) && (card as any).powers?.length ? StateUtils.findPokemonSlot(state, card) : undefined;
    if (powerSlot?.marker.hasMarker('WOTC_POKEPOWER_LOCK') && (powerSlot as any).wotcPokePowerLockUntilTurn >= state.turn) {
      if (effect instanceof CheckPokemonPowersEffect && effect.target === card) effect.powers = effect.powers.filter(p => p.powerType !== PowerType.POKEPOWER);
      if (effect instanceof PowerEffect && effect.card === card && effect.power.powerType === PowerType.POKEPOWER) throw new GameError(GameMessage.CANNOT_USE_POWER);
    }
    if (((powerSlot?.marker.hasMarker('WOTC_STARE_POWER_LOCK') && (powerSlot as any).wotcPowerLockUntilTurn >= state.turn) || (powerSlot && (state as any).wotcGlobalPowerLockUntilTurn >= state.turn)) && (!(state.rules as any).unlimitedRules || (card as any).powers.some((p:any)=>isLegacyPowerType(p.powerType)))) {
      if ((state.rules as any).unlimitedRules && !(effect instanceof PowerEffect) && (card as any).refreshSuppressedIdentity && !(card as any)._refreshingSuppressedIdentity) { (card as any)._refreshingSuppressedIdentity=true; try { (card as any).refreshSuppressedIdentity(store,state); } finally { delete (card as any)._refreshingSuppressedIdentity; } }
      if (effect instanceof CheckPokemonPowersEffect && effect.target === card) effect.powers = (state.rules as any).unlimitedRules ? effect.powers.filter(p=>!isLegacyPowerType(p.powerType)) : [];
      if (effect instanceof PowerEffect && effect.card === card && effect.power.powerType !== PowerType.BABY_RULE && (!(state.rules as any).unlimitedRules || isLegacyPowerType(effect.power.powerType))) throw new GameError(GameMessage.CANNOT_USE_POWER);
      if (!persistentCrystalType && !['USE_ATTACK_EFFECT','ATTACK_EFFECT','AFTER_ATTACK_EFFECT','AFTER_DAMAGE_EFFECT','END_TURN_EFFECT'].includes(effect.type) && !(effect instanceof PowerEffect && effect.power.powerType === PowerType.BABY_RULE)) return state;
    }
    if ((state.rules as any).wotcPowerConditions && (card as any).powers?.some((p:any) => (state.rules as any).unlimitedRules ? p.powerType===PowerType.POKEMON_POWER : [PowerType.POKEMON_POWER,PowerType.POKEPOWER,PowerType.POKEBODY].includes(p.powerType))) {
      const slot = StateUtils.findPokemonSlot(state, card);
      if ((state.rules as any).unlimitedRules && slot?.specialConditions.length && (card as any).refreshSuppressedIdentity && !(effect instanceof PowerEffect)) (card as any).refreshSuppressedIdentity(store,state);
      const worksUnderConditions = (card as any).powers?.some((p:any)=>/(?:works?|used|can be used) even (?:if|while)/i.test(p.text || ''));
      if ((state.rules as any).unlimitedRules && !worksUnderConditions && slot?.specialConditions.length && effect instanceof CheckPokemonPowersEffect && effect.target===card) { const currentConditionPowers=(card as any).refreshSuppressedIdentity ? [...(card as any).powers] : effect.powers; effect.powers=currentConditionPowers.filter((p:any)=>p.powerType!==PowerType.POKEMON_POWER); }
      if (!persistentCrystalType && !worksUnderConditions && slot?.specialConditions.length && !['USE_ATTACK_EFFECT','ATTACK_EFFECT','AFTER_ATTACK_EFFECT','AFTER_DAMAGE_EFFECT','END_TURN_EFFECT'].includes(effect.type) && !(effect instanceof PowerEffect && effect.power.powerType === PowerType.BABY_RULE)) {
        if (effect instanceof PowerEffect && effect.card === card && (!(state.rules as any).unlimitedRules || effect.power.powerType===PowerType.POKEMON_POWER)) throw new GameError(GameMessage.CANNOT_USE_POWER);
        return state;
      }
    }
    const resolvingThisTrainer = !this.calculatingPlayability
      && effect instanceof TrainerEffect
      && effect.trainerCard === card;
    const previous = this.resolvingTrainer;
    if (resolvingThisTrainer && effect instanceof TrainerEffect) {
      this.resolvingTrainer = { player: effect.player, trainerCard: effect.trainerCard };
    }

    const previousMovement=(CardList as any).wotcMovementContext;
    try{const list=StateUtils.findCardList(state,card),owner=StateUtils.findOwner(state,list);if(owner)(CardList as any).wotcMovementContext={...previousMovement,actorId:owner.id,kind:card.superType===SuperType.POKEMON&&((effect.type==='AFTER_DAMAGE_EFFECT'&&card!==(effect as any).source?.getPokemonCard())||effect.type==='AFTER_ENERGY_ATTACHED_EFFECT')?'power':previousMovement?.kind};}catch{}
    const alreadyBlocked = effectWasBlocked(effect);

    try {
      // Only try override for TrainerCard (for now)
      if ((card as any).trainerType !== undefined && (!(card as any)._dpId || (state.rules as any).unlimitedRules)) {
        // Import here to avoid circular dependency at module level
        const { getOverriddenReduceEffect } = require('./card/card-effect-overrides');
        const format = (store as any)?.handler?.gameSettings?.format ?? 0;
        const override = getOverriddenReduceEffect(card, format);
        if (override) {
          return override(store, state, effect);
        }
      }
      return reduceDpLevel(card,store,state,effect,()=>dpNativePowerChoice(store,state,card,effect,()=>card.reduceEffect(store, state, effect)));
    } finally {
      (CardList as any).wotcMovementContext=previousMovement;
      stampEffectBlocker(effect, card, alreadyBlocked);
      if (resolvingThisTrainer) {
        this.resolvingTrainer = previous;
      }
    }
  }

  private stampTrainerPrompt(prompt: Prompt<any>): void {
    if (this.calculatingPlayability || this.resolvingTrainer === undefined) {
      return;
    }
    this.trainerPromptSources.set(prompt.id, this.resolvingTrainer);
    prompt.sourceCard = this.resolvingTrainer.trainerCard;
  }

  private applyTrainerTargetFilters(state: State, promptIds: number[]): void {
    for (const id of promptIds) {
      const prompt = state.prompts.find(item => item.id === id);
      const source = this.trainerPromptSources.get(id);
      if (prompt === undefined || source === undefined) {
        continue;
      }
      filterTrainerPromptResult(this, state, prompt, source);
    }
  }

  private takeTrainerPromptSource(promptIds: number[]): ResolvingTrainerSource | undefined {
    let source: ResolvingTrainerSource | undefined;
    for (const id of promptIds) {
      const stamped = this.trainerPromptSources.get(id);
      if (stamped) {
        source = stamped;
      }
      this.trainerPromptSources.delete(id);
    }
    return source;
  }

  private dropTrainerPromptSources(promptIds: number[]): void {
    for (const id of promptIds) {
      this.trainerPromptSources.delete(id);
    }
  }
}


