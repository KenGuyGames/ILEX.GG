import { ChooseCardsPrompt,SelectPrompt,ShowCardsPrompt,ShuffleDeckPrompt,SuperType,TrainerType,GameMessage } from './game';
import { DRAW_CARDS,MOVE_CARDS } from './game/store/prefabs/prefabs';
export function exHand(store:any,state:any,b:any,op:any,next:()=>void){
 const p=b.player,o=b.opponent;
 const move=(cards:any[])=>MOVE_CARDS(store,state,o.hand,op.discard?o.discard:o.deck,{cards,sourceCard:b._wotcSourceCard,sourceEffect:b});
 const finish=()=>{const done=()=>{if(op.draw)DRAW_CARDS(store,state,o,op.draw);next();};if(op.shuffle)store.prompt(state,new ShuffleDeckPrompt(o.id),(order:any)=>{o.deck.applyOrder(order);done();});else done();};
 if(op.hidden){
  if(o.hand.cards.length<op.threshold)return next();
  const pick=()=>{if(o.hand.cards.length<=op.limit)return finish();store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,o.hand.cards.map((_:any,i:number)=>'Face-down card '+(i+1)),{allowCancel:false}),(index:any)=>{move([o.hand.cards[index]]);pick();});};pick();return state;
 }
 if(!o.hand.cards.length||op.threshold&&o.hand.cards.length<op.threshold)return next();
 const choose=()=>{const filter:any=op.supporter?{superType:SuperType.TRAINER,trainerType:TrainerType.SUPPORTER}:op.pokemon?{superType:SuperType.POKEMON}:{};
  const eligible=o.hand.cards.filter((c:any)=>Object.entries(filter).every(([k,v])=>c[k]===v));if(!eligible.length)return next();
  const count=op.limit!==undefined?o.hand.cards.length-op.limit:1;
  store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,o.hand,filter,{min:op.optional?0:count,max:count,allowCancel:false}),(cards:any)=>{if(!cards?.length)return next();move(cards);finish();});
 };
 return store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,o.hand.cards),choose);
}
