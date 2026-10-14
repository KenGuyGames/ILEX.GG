import { StateUtils,CardType,SuperType,CardList,ChooseCardsPrompt,ChoosePokemonPrompt,PlayerType,SlotType,GameMessage,GameError } from './game';
import { CheckProvidedEnergyEffect } from './game/store/effects/check-effects';
import { MOVE_CARDS } from './game/store/prefabs/prefabs';

// A Pokémon's attached Energy is indexed across its main and auxiliary lists.
// Prompts use one read-only view; movement uses the actual owning list.
export function exAttachedEnergy(store:any,state:any,owner:any,list:any){
 const check=new CheckProvidedEnergyEffect(owner,list);store.reduceEffect(state,check);
 return [...new Map(check.energyMap.filter((entry:any)=>list.cards.includes(entry.card)||list.energies.cards.includes(entry.card)).map((entry:any)=>[entry.card,{...entry,zone:list.cards.includes(entry.card)?list:list.energies}])).values()] as any[];
}
export function exMoveEnergy(store:any,state:any,owner:any,sourceCard:any,sourceEffect:any,op:any,done:(target?:any)=>void){
 const sources=(op.fromBench?owner.bench:op.fromActive?[owner.active]:[owner.active,...owner.bench]).filter((list:any)=>list.getPokemonCard()&&(!op.fromSelf||list.getPokemonCard()===sourceCard)&&(!op.toSelf||list.getPokemonCard()!==sourceCard));
 const entries=sources.flatMap((list:any)=>exAttachedEnergy(store,state,owner,list).filter((entry:any)=>!op.energy||StateUtils.providesMatchesType(entry.provides,op.energy)).map((entry:any)=>({...entry,source:list})));
 if(!entries.length)throw new GameError(GameMessage.CANNOT_USE_POWER);
 const view=new CardList();view.cards=entries.map((entry:any)=>entry.card);
 return store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_ATTACH,view,{},{min:1,max:1,allowCancel:false}),(chosen:any)=>{
  const entry=entries.find((entry:any)=>entry.card===chosen[0]);
  const slots=[{player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0,list:owner.active},...owner.bench.map((list:any,index:number)=>({player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index,list}))];
  const eligible=slots.filter((s:any)=>s.list!==entry.source&&s.list.getPokemonCard()&&(!op.toSelf||s.list.getPokemonCard()===sourceCard)&&(!op.toActive||s.list===owner.active)&&(!op.toBench||owner.bench.includes(s.list)));
  if(!eligible.length)throw new GameError(GameMessage.CANNOT_USE_POWER);
  store.prompt(state,new ChoosePokemonPrompt(owner.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,op.toActive?[SlotType.ACTIVE]:op.toBench?[SlotType.BENCH]:[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:slots.filter((s:any)=>!eligible.includes(s)).map(({list,...target}:any)=>target)}),(targets:any)=>{MOVE_CARDS(store,state,entry.zone,targets[0],{cards:chosen,sourceCard,sourceEffect});done(targets[0]);});
 });
}
