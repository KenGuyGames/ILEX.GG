import {StateUtils,SuperType,Stage,EnergyType,SpecialCondition,CardList,ChooseCardsPrompt,ChoosePokemonPrompt,PlayerType,SlotType,SelectPrompt,ShowCardsPrompt,ShuffleDeckPrompt,GameMessage} from './game';
import {PowerEffect,HealEffect} from './game/store/effects/game-effects';
import {MOVE_CARDS,MULTIPLE_COIN_FLIPS_PROMPT} from './game/store/prefabs/prefabs';
import {exAttachedEnergy} from './tcg-lab-ex-attachments';
import {placePokemonAsBasic} from './game/store/prefabs/place-pokemon-as-basic';

export function svEntryPower(card:any,op:any,power:any,store:any,state:any,p:any,list:any){
 if(state.players[state.activePlayer]!==p)return state;
 const o=StateUtils.getOpponent(state,p),provenance=new PowerEffect(p,power,card);
 const move=(from:any,to:any,cards:any[])=>MOVE_CARDS(store,state,from,to,{cards,sourceCard:card,sourceEffect:provenance});
 const shuffle=(owner:any)=>store.prompt(state,new ShuffleDeckPrompt(owner.id),(order:any)=>owner.deck.applyOrder(order));
 const view=(cards:any[])=>{const zone=new CardList();zone.cards=cards;return zone;};
 const chooseCards=(zone:any,cards:any[],count:number,done:any)=>{
  if(!cards.length)return done([]);
  store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,zone,{},{min:Math.min(count,cards.length),max:Math.min(count,cards.length),allowCancel:false,blocked:zone.cards.map((c:any,i:number)=>cards.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>done(chosen||[]));
 };
 const perform=()=>{
  switch(op.action){
  case 'entrySpecialEat':{
   const entries=exAttachedEnergy(store,state,o,o.active).filter((entry:any)=>entry.card.energyType===EnergyType.SPECIAL);if(!entries.length)return;
   const cards=entries.map((entry:any)=>entry.card);return chooseCards(view(cards),cards,1,(chosen:any[])=>{for(const c of chosen)move(entries.find((entry:any)=>entry.card===c).zone,o.discard,[c]);});
  }
  case 'entryObligingHeal':{
   const target=p.active;store.reduceEffect(state,new HealEffect(p,target,30));
   const clear=()=>{const conditions=target.specialConditions.slice();if(!conditions.length)return;store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,conditions.map(String),{allowCancel:false}),(choice:number)=>target.removeSpecialCondition(conditions[choice]));};
   if(store.hasPrompts())store.waitPrompt(state,clear);else clear();return;
  }
  case 'entryEnergyMove':{
   const entries=exAttachedEnergy(store,state,o,o.active),slots=o.bench.filter((l:any)=>l.getPokemonCard());if(!entries.length||!slots.length)return;
   const cards=entries.map((entry:any)=>entry.card);return chooseCards(view(cards),cards,1,(chosen:any[])=>store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.TOP_PLAYER,[SlotType.BENCH],{min:1,max:1,allowCancel:false}),(targets:any)=>{if(chosen.length)move(entries.find((entry:any)=>entry.card===chosen[0]).zone,targets[0],chosen);}));
  }
  case 'entryHandEnergyShuffle':{
   if(!o.hand.cards.length)return;
   return store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,o.hand.cards),()=>chooseCards(o.hand,o.hand.cards.filter((c:any)=>c.superType===SuperType.ENERGY),2,(cards:any[])=>{if(cards.length){move(o.hand,o.deck,cards);shuffle(o);}}));
  }
  case 'entryRandomHandShuffle':return MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,2,(flips:boolean[])=>{
   const remaining=o.hand.cards.slice(),cards:any[]=[];for(let i=0;i<flips.filter(Boolean).length&&remaining.length;i++)cards.push(remaining.splice(Math.floor(Math.random()*remaining.length),1)[0]);
   if(!cards.length)return;store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,cards),()=>{move(o.hand,o.deck,cards);shuffle(o);});
  });
  case 'entryEvolutionHeal':{
   const targets=[p.active,...p.bench].filter((l:any)=>l.getPokemonCard()&&l.getPokemonCard().stage!==Stage.BASIC&&l.damage>0);
   const heal=(i:number):any=>{if(i>=targets.length)return;const target=targets[i],before=target.damage;store.reduceEffect(state,new HealEffect(p,target,before));const finish=()=>{if(target.damage<before)for(const entry of exAttachedEnergy(store,state,p,target))move(entry.zone,p.discard,[entry.card]);if(store.hasPrompts())store.waitPrompt(state,()=>heal(i+1));else heal(i+1);};if(store.hasPrompts())store.waitPrompt(state,finish);else finish();};return heal(0);
  }
  case 'entryLifeboat':{
   const owners=[o,p],place=(i:number):any=>{if(i>=owners.length)return;const owner=owners[i],slots=owner.bench.filter((l:any)=>!l.cards.length),cards=owner.discard.cards.filter((c:any)=>c.superType===SuperType.POKEMON&&c.stage===Stage.BASIC);if(!slots.length||!cards.length)return place(i+1);
    store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_PUT_ONTO_BENCH,owner.discard,{superType:SuperType.POKEMON,stage:Stage.BASIC},{min:1,max:1,allowCancel:false}),(chosen:any)=>store.prompt(state,new SelectPrompt(owner.id,GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,slots.map((_:any,j:number)=>'Bench '+(owner.bench.indexOf(slots[j])+1)),{allowCancel:false}),(choice:number)=>{placePokemonAsBasic(store,state,owner,owner.discard,chosen[0],slots[choice]);if(store.hasPrompts())store.waitPrompt(state,()=>place(i+1));else place(i+1);}));
   };return place(0);
  }
  default:throw Error('Unknown SV entry action '+op.action);
  }
 };
 return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Skip Ability','Use Ability'],{allowCancel:false}),(choice:number)=>{if(choice===1)perform();});
}
