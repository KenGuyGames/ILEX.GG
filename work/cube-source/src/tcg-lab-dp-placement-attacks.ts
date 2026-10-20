import { CardList,SuperType,Stage,EnergyType,ChooseCardsPrompt,SelectPrompt,GameMessage } from './game';
import { placePokemonAsBasic } from './game/store/prefabs/place-pokemon-as-basic';
import { MOVE_CARDS } from './game/store/prefabs/prefabs';
import { attachWotcEnergy } from './game/store/prefabs/wotc-energy-attachment';
import { PutCountersEffect } from './game/store/effects/attack-effects';
import { PlayPokemonEffect } from './game/store/effects/play-card-effects';

export function dpPlacementAttack(store:any,state:any,b:any,op:any,next:()=>void,shuffle:any){
 const p=b.player,zone=op.discard?p.discard:p.deck;
 const move=(from:any,to:any,cards:any[])=>MOVE_CARDS(store,state,from,to,{cards,sourceCard:b._wotcSourceCard,sourceEffect:b});
 const finish=()=>op.discard?next():shuffle(p,next);
 if(op.op==='dpLearning'){
  const pairs=p.deck.cards.filter((card:any)=>card._dpLevelUp).flatMap((card:any)=>[p.active,...p.bench].filter((target:any)=>target.getPokemonCard()&&!target.getPokemonCard()._dpLevelUp&&target.getPokemonCard().name===card.evolvesFrom).map((target:any)=>({card,target})));
  const eligible=[...new Set(pairs.map((pair:any)=>pair.card))];if(!eligible.length)return finish();
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,p.deck,{},{min:0,max:1,allowCancel:false,blocked:p.deck.cards.map((card:any,index:number)=>eligible.includes(card)?-1:index).filter((index:number)=>index>=0)}),(cards:any)=>{if(!cards.length)return finish();const targets=pairs.filter((pair:any)=>pair.card===cards[0]).map((pair:any)=>pair.target);store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,targets.map((target:any)=>target===p.active?'Active Pokémon':'Bench '+(p.bench.indexOf(target)+1)),{allowCancel:false}),(index:number)=>{move(p.deck,p.hand,cards);const effect:any=new PlayPokemonEffect(p,cards[0],targets[index]);effect.dpLevelFromEffect=true;effect._wotcFromDeck=true;store.reduceEffect(state,effect);if(store.hasPrompts())store.waitPrompt(state,finish);else finish();});});
 }
 const empty=()=>p.bench.filter((target:any)=>!target.cards.length),eligible=zone.cards.filter((card:any)=>card.superType===SuperType.POKEMON&&!card._dpLevelUp&&(!op.basic||card.stage===Stage.BASIC)&&(!op.nameIncludes||card.name.includes(op.nameIncludes)));
 if(!empty().length||!eligible.length)return finish();
 return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,zone,{superType:SuperType.POKEMON},{min:0,max:Math.min(op.amount,empty().length,eligible.length),allowCancel:false,blocked:zone.cards.map((card:any,index:number)=>eligible.includes(card)?-1:index).filter((index:number)=>index>=0)}),(cards:any)=>{
  const put=(index:number):any=>{if(index>=cards.length||!empty().length)return finish();const slots=empty();store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,slots.map((target:any)=>'Bench '+(p.bench.indexOf(target)+1)),{allowCancel:false}),(choice:number)=>{const target=slots[choice];placePokemonAsBasic(store,state,p,zone,cards[index],target);const after=()=>{if(op.counters){const hit=new PutCountersEffect(b,op.counters);hit.target=target;store.reduceEffect(state,hit);}if(!op.attach)return put(index+1);const energy=zone.cards.filter((card:any)=>card.superType===SuperType.ENERGY&&card.energyType===EnergyType.BASIC);if(!energy.length)return put(index+1);store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_ATTACH,zone,{superType:SuperType.ENERGY,energyType:EnergyType.BASIC},{min:0,max:Math.min(op.attach,energy.length),allowCancel:false}),(selected:any)=>{const attach=(n:number):any=>{if(n>=selected.length)return put(index+1);attachWotcEnergy(store,state,p,zone,target,selected[n],{sourceCard:b._wotcSourceCard,sourceEffect:b});if(store.hasPrompts())store.waitPrompt(state,()=>attach(n+1));else attach(n+1);};attach(0);});};if(store.hasPrompts())store.waitPrompt(state,after);else after();});};put(0);
 });
}
