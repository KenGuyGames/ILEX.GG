import { State, StoreLike, PokemonCard, StateUtils } from './game';
import { Effect } from './game/store/effects/effect';
import { AbstractAttackEffect, AfterDamageEffect, AddSpecialConditionsEffect, DiscardCardsEffect, PutDamageEffect, AddMarkerEffect } from './game/store/effects/attack-effects';
import { EndTurnEffect, AfterAttackEffect } from './game/store/effects/game-phase-effects';
import { WAS_ATTACK_USED } from './game/store/prefabs/prefabs';

// Store final results rather than replaying the original attack (and its costs,
// coin flips, recoil and Weakness calculation) a second time.
export function mirrorMove(store: StoreLike,state: State,effect: Effect,card: PokemonCard): State {
  const slot=StateUtils.findCardList(state,card) as any;
  if(WAS_ATTACK_USED(effect,1,card)){
    if(slot.labMirrorTurn !== state.turn-1)return state;
    for(const previous of slot.labMirrorEffects || []){
      if(previous.preventDefault)continue;
      let reflected: AbstractAttackEffect | undefined;
      if(previous instanceof AfterDamageEffect){
        const damage=new PutDamageEffect(effect,previous.damage);damage.weaknessApplied=true;reflected=damage;
      }else if(previous instanceof AddSpecialConditionsEffect){
        const status=new AddSpecialConditionsEffect(effect,[...previous.specialConditions]);
        status.poisonDamage=previous.poisonDamage;status.burnDamage=previous.burnDamage;status.confusionDamage=previous.confusionDamage;reflected=status;
      }else if(previous instanceof DiscardCardsEffect){
        const cards=effect.opponent.active.cards.filter(c=>c.superType===previous.cards[0]?.superType).slice(0,previous.cards.length);
        reflected=new DiscardCardsEffect(effect,cards);
      }else if(previous instanceof AddMarkerEffect){
        reflected=new AddMarkerEffect(effect,previous.markerName,card);
      }
      if(reflected){reflected.target=effect.opponent.active;store.reduceEffect(state,reflected);}
    }
    if(slot.labMirrorReduction)effect.opponent.active.attackDamageReductionNextTurn=slot.labMirrorReduction;
    if(slot.labMirrorCancel)effect.opponent.active.coinFlipCancelAttackNextTurn=slot.labMirrorCancel;
    if(slot.labMirrorCannotRetreat)effect.opponent.active.cannotRetreatNextTurn=true;
    return state;
  }
  if(effect instanceof AbstractAttackEffect && effect.target===slot && effect.player!==StateUtils.findOwner(state,slot)
    && [AfterDamageEffect,AddSpecialConditionsEffect,DiscardCardsEffect,AddMarkerEffect].some(Type=>effect instanceof Type)){
    if(slot.labMirrorTurn!==state.turn){slot.labMirrorEffects=[];slot.labMirrorTurn=state.turn;}
    slot.labMirrorEffects.push(effect);
  }
  if(effect instanceof AfterAttackEffect && effect.opponent.active===slot){
    slot.labMirrorReduction=slot.attackDamageReductionNextTurn;
    slot.labMirrorCancel=slot.coinFlipCancelAttackNextTurn;
    slot.labMirrorCannotRetreat=slot.cannotRetreatNextTurn;
  }
  if(effect instanceof EndTurnEffect && effect.player===StateUtils.findOwner(state,slot)){
    slot.labMirrorEffects=[];slot.labMirrorTurn=undefined;slot.labMirrorReduction=0;slot.labMirrorCancel=0;slot.labMirrorCannotRetreat=false;
  }
  return state;
}
