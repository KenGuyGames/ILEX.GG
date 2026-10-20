import { ChooseCardsPrompt,ShowCardsPrompt,SuperType,TrainerType,GameMessage } from './game';
import { TrainerEffect } from './game/store/effects/play-card-effects';
// Copy an effect without playing a Supporter, moving its original printing, or
// spending the player's Supporter for the turn. Native self-staging is omitted.
export function exCopySupporter(store:any,state:any,b:any,op:any,next:()=>void){
 const p=b.player,o=b.opponent,zone=op.own?p.supporter:op.discard?o.discard:o.hand;
 const eligible=zone.cards.filter((c:any)=>c.superType===SuperType.TRAINER&&c.trainerType===TrainerType.SUPPORTER);
 const choose=()=>{if(!eligible.length)return next();store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,zone,{superType:SuperType.TRAINER,trainerType:TrainerType.SUPPORTER},{min:op.optional?0:1,max:1,allowCancel:false}),(chosen:any)=>{
  if(!chosen?.length)return next();const original=chosen[0],virtual=new original.constructor();Object.assign(virtual,original);virtual.id=-(state.exVirtualSupporterSequence=(state.exVirtualSupporterSequence||0)+1);
  const proxy=new Proxy(store,{get(target,key){if(key==='reduceEffect')return (s:any,e:any)=>{if(e.cards?.includes(virtual)){e.cards=e.cards.filter((c:any)=>c!==virtual);if(!e.cards.length)return s;}if(e.sourceCard===virtual){e.sourceCard=b._wotcSourceCard;e.sourceEffect=b;}return target.reduceEffect(s,e);};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
  const effect:any=new TrainerEffect(p,virtual);effect._exOriginAttack=b;
  const used=p.supporterTurn;p.supporterTurn=0;
  try{virtual.reduceEffect(proxy,state,effect);}finally{p.supporterTurn=used;}
  if(store.hasPrompts())store.waitPrompt(state,next);else next();
 });};
 if(!op.own&&!op.discard&&zone.cards.length)return store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,zone.cards),choose);
 choose();return state;
}
