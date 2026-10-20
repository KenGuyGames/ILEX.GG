import { GamePhase } from './game/store/state/state';
import { IS_TOOL_BLOCKED } from './game/store/prefabs/prefabs';

// A hit's Weakness calculation and its damage application can be separate
// events, including copied native attacks. Keep the calculation transient so
// the same Tool penalty is never paid twice or serialized into a saved game.
const calculated = new WeakMap<object, {target:any; damage:number}>();
function penalty(store:any,state:any,e:any):number {
  if(state.phase!==GamePhase.ATTACK||!e.attackEffect||e.attackEffect._wotcTrainer||e.attackEffect._wotcReaction)return 0;
  const owner=state.players.find((p:any)=>p.active===e.target||p.bench.includes(e.target));
  if(!owner||owner===e.player)return 0;
  return (e.source?.tools||[]).reduce((sum:number,tool:any)=>sum+(tool.outgoingAttackPenalty&&!IS_TOOL_BLOCKED(store,state,e.player,tool)?tool.outgoingAttackPenalty:0),0);
}
export function outgoingBeforeWeakness(store:any,state:any,e:any):void {
  if(e._outgoingToolApplied)return;
  const amount=penalty(store,state,e);if(!amount)return;
  e.damage=Math.max(0,e.damage-amount);e._outgoingToolApplied=true;
}
export function rememberOutgoingWeakness(e:any):void {
  if(e._outgoingToolApplied)calculated.set(e.attackEffect,{target:e.target,damage:e.damage});
}
export function outgoingBeforeHit(store:any,state:any,e:any):void {
  if(e.type!=='PUT_DAMAGE_EFFECT'||e._outgoingToolApplied)return;
  const last=calculated.get(e.attackEffect);
  if(e.weaknessApplied&&last?.target===e.target&&last.damage===e.damage){e._outgoingToolApplied=true;calculated.delete(e.attackEffect);return;}
  // Raw Active damage goes through the engine's Weakness stage next. Benched
  // hits and native pre-calculated hits without that stage still pay once.
  const owner=state.players.find((p:any)=>p.active===e.target||p.bench.includes(e.target));
  if(!e.weaknessApplied&&owner?.active===e.target)return;
  const amount=penalty(store,state,e);if(amount){e.damage=Math.max(0,e.damage-amount);e._outgoingToolApplied=true;}
}
export function finishOutgoingHit(e:any):void {
  if(e.type==='PUT_DAMAGE_EFFECT'&&e.attackEffect)calculated.delete(e.attackEffect);
}
