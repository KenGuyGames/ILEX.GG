import { StateUtils,CardType,EnergyType,CardList,ChooseCardsPrompt,ChoosePokemonPrompt,PlayerType,SlotType,GameMessage } from './game';
import { exAttachedEnergy } from './tcg-lab-ex-attachments';
import { MOVE_CARDS } from './game/store/prefabs/prefabs';
export function exMoveGroup(store:any,state:any,p:any,sourceCard:any,e:any,op:any,next:()=>void){
 const self=[p.active,...p.bench].find((l:any)=>l.getPokemonCard()===sourceCard);
 const from=op.toSelf?[p.active,...p.bench].filter((l:any)=>l!==self):[self];
 const entries=from.filter(Boolean).flatMap((l:any)=>exAttachedEnergy(store,state,p,l).filter((x:any)=>(!op.basic||x.card.energyType===EnergyType.BASIC)&&(!op.energy||StateUtils.providesMatchesType(x.provides,op.energy))));
 if(!entries.length)return next();const view=new CardList();view.cards=entries.map((x:any)=>x.card);
 store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_ATTACH,view,{}, {min:0,max:Math.min(op.amount??entries.length,entries.length),allowCancel:false}),(chosen:any)=>{
  if(!chosen?.length)return next();const move=(target:any)=>{for(const card of chosen){const entry=entries.find((x:any)=>x.card===card);MOVE_CARDS(store,state,entry.zone,target,{cards:[card],sourceCard,sourceEffect:e});}if(store.hasPrompts())store.waitPrompt(state,next);else next();};
  if(op.toSelf)return move(self);
  const slots=[{player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0,list:p.active},...p.bench.map((list:any,index:number)=>({player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index,list}))];
  store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:slots.filter((x:any)=>!x.list.getPokemonCard()||!op.allowSelf&&x.list===self).map(({list,...target}:any)=>target)}),(targets:any)=>move(targets[0]));
 });return state;
}
