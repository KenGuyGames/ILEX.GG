import { CardList,SuperType,Stage,TrainerType,StateUtils,ChooseCardsPrompt,ChoosePokemonPrompt,SelectPrompt,ShowCardsPrompt,OrderCardsPrompt,ShuffleDeckPrompt,PlayerType,SlotType,GameMessage } from './game';
import { HealEffect } from './game/store/effects/game-effects';
import { MOVE_CARDS,MULTIPLE_COIN_FLIPS_PROMPT } from './game/store/prefabs/prefabs';
import { exAttachedEnergy } from './tcg-lab-ex-attachments';

export function dpTrainerAction(store:any,state:any,b:any,op:any,next:()=>void){
 const p=b.player,o=b.opponent,source=b._wotcTrainerCard||b._wotcSourceCard;
 const move=(from:any,to:any,cards:any[])=>MOVE_CARDS(store,state,from,to,{cards,sourceCard:source,sourceEffect:b});
 const shuffle=()=>store.prompt(state,new ShuffleDeckPrompt(p.id),(order:any)=>{p.deck.applyOrder(order);next();});
 const view=(cards:any[])=>{const list=new CardList();list.cards=cards;return list;};
 const choose=(actor:any,zone:any,eligible:any[],min:number,max:number,done:(cards:any[])=>void)=>{
  if(!eligible.length)return done([]);
  store.prompt(state,new ChooseCardsPrompt(actor,GameMessage.CHOOSE_CARD_TO_HAND,zone,{},{min:Math.min(min,eligible.length),max:Math.min(max,eligible.length),allowCancel:false,blocked:zone.cards.map((card:any,index:number)=>eligible.includes(card)?-1:index).filter((index:number)=>index>=0)}),(cards:any)=>done(cards||[]));
 };
 const field=(eligible:any[],done:(list:any)=>void)=>{const slots=[{player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0,list:p.active},...p.bench.map((list:any,index:number)=>({player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index,list}))];store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:slots.filter((slot:any)=>!eligible.includes(slot.list)).map(({list,...target}:any)=>target)}),(cards:any)=>done(cards[0]));};
 switch(op.op){
 case 'dpRecoverTop':{const chooseOwner=(owner:any)=>choose(p,owner.discard,owner.discard.cards.slice(),op.optional?0:1,op.amount,cards=>{if(!cards.length)return next();const finish=(ordered:any[])=>{move(owner.discard,owner.deck,ordered);owner.deck.cards=[...ordered,...owner.deck.cards.filter((card:any)=>!ordered.includes(card))];next();};store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,cards),()=>{if(cards.length<2)return finish(cards);store.prompt(state,new OrderCardsPrompt(p.id,GameMessage.CHOOSE_CARDS_ORDER,view(cards),{allowCancel:false}),(order:any)=>finish(order.map((index:number)=>cards[index])));});});if(op.either)return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Your discard pile',"Opponent's discard pile"],{allowCancel:false}),(choice:number)=>chooseOwner(choice===1?o:p));chooseOwner(op.opponent?o:p);return state;}
 case 'dpRotomChoice':{const targets=[p.active,...p.bench].filter((list:any)=>/Rotom$/.test(list.getPokemonCard()?.name||''));if(!targets.length)return next();field(targets,list=>{const eligible=p.deck.cards.filter((card:any)=>card.superType===SuperType.POKEMON&&/Rotom$/.test(card.name));choose(p,p.deck,eligible,0,1,cards=>{if(cards.length){const old=list.getPokemonCard(),position=list.cards.indexOf(old),damage=list.damage;p.deck.cards.splice(p.deck.cards.indexOf(cards[0]),1);list.cards[position]=cards[0];list.clearEffects();list.specialConditions=[];list.damage=damage;p.deck.cards.unshift(old);}shuffle();});});return state;}
 case 'dpHealerPlus':{const copies=p.hand.cards.filter((card:any)=>card.name===source.name);const finish=(double:boolean)=>{store.reduceEffect(state,new HealEffect(p,p.active,double?80:10));const conditions=p.active.specialConditions.slice();if(double){for(const condition of p.active.specialConditions.slice())p.active.removeSpecialCondition(condition);p.active.poisonDamage=10;p.active.burnDamage=20;return next();}if(!conditions.length)return next();store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,conditions.map(String),{allowCancel:false}),(choice:number)=>{const condition=conditions[choice];p.active.removeSpecialCondition(condition);next();});};if(!copies.length)return finish(false);return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Play one Poké Healer +','Play two Poké Healer +'],{allowCancel:false}),(choice:number)=>{if(choice===1)move(p.hand,p.discard,[copies[0]]);finish(choice===1);});}
 case 'dpTopPick':{
  const cards=p.deck.cards.slice(0,op.amount),zone=view(cards),eligible=cards.filter((card:any)=>(!op.pokemon||card.superType===SuperType.POKEMON)&&(!op.trainer||card.superType===SuperType.TRAINER&&![TrainerType.SUPPORTER,TrainerType.STADIUM].includes(card.trainerType)));
  choose(p,zone,eligible,op.optional?0:1,op.max,chosen=>{const finish=()=>{move(p.deck,p.hand,chosen);shuffle();};if(op.reveal&&chosen.length)store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,chosen),finish);else finish();});break;
 }
 case 'dpBottomPick':{
  const cards=p.deck.cards.slice(-op.amount),zone=view(cards);choose(p,zone,cards,op.max,op.max,chosen=>{move(p.deck,p.hand,chosen);const remaining=cards.filter((card:any)=>!chosen.includes(card));if(remaining.length<2)return next();const rest=view(remaining);store.prompt(state,new OrderCardsPrompt(p.id,GameMessage.CHOOSE_CARD_TO_HAND,rest,{allowCancel:false}),(order:number[])=>{p.deck.cards=p.deck.cards.filter((card:any)=>!remaining.includes(card));p.deck.cards.push(...order.map(index=>remaining[index]));next();});});break;
 }
 case 'dpLookBottomHand':if(!o.hand.cards.length)return next();store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,o.hand.cards),()=>choose(p,o.hand,o.hand.cards,op.amount,op.amount,chosen=>{const put=(cards:any[])=>{move(o.hand,o.deck,cards);next();};if(chosen.length<2)return put(chosen);store.prompt(state,new OrderCardsPrompt(p.id,GameMessage.CHOOSE_CARD_TO_HAND,view(chosen),{allowCancel:false}),(order:number[])=>put(order.map(index=>chosen[index])));}));break;
 case 'dpHandToDeck':move(p.hand,p.deck,p.hand.cards.slice());next();break;
 case 'dpFossilExcavator':{
  const fossilBases=['Omanyte','Kabuto','Aerodactyl','Lileep','Anorith','Shieldon','Cranidos'];
  store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Search deck','Search discard pile'],{allowCancel:false}),(index:number)=>{const zone=index===0?p.deck:p.discard,eligible=zone.cards.filter((card:any)=>card.superType===SuperType.TRAINER&&card.name.includes('Fossil')||card.superType===SuperType.POKEMON&&!card._dpLevelUp&&card.stage!==Stage.BASIC&&(card.evolvesFrom?.includes('Fossil')||card.stage===Stage.STAGE_2&&fossilBases.includes(card.evolvesFrom)));choose(p,zone,eligible,index===0?0:1,1,chosen=>{const finish=()=>{move(zone,p.hand,chosen);if(index===0)shuffle();else next();};if(chosen.length)store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,chosen),finish);else finish();});});break;
 }
 case 'dpFieldHeal':case 'dpNightCenter':{
  const eligible=[p.active,...p.bench].filter((list:any)=>list.getPokemonCard());if(!eligible.length)return next();field(eligible,list=>{
   if(op.op==='dpNightCenter')return MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,2,(results:boolean[])=>{const heads=results.filter(Boolean).length;if(heads===2)store.reduceEffect(state,new HealEffect(p,list,list.damage));if(heads===0)for(const entry of exAttachedEnergy(store,state,p,list))move(entry.zone,p.discard,[entry.card]);next();});
   store.reduceEffect(state,new HealEffect(p,list,op.amount));if(op.clear){list.specialConditions=[];list.poisonDamage=10;list.burnDamage=20;}next();
  });break;
 }
 case 'dpLucian':{
  const all=[p.active,...p.bench].filter((list:any)=>list.getPokemonCard()),eligible=all.filter((list:any)=>exAttachedEnergy(store,state,p,list).length);if(all.length<2||!eligible.length)return next();
  field(eligible,from=>{const entries=exAttachedEnergy(store,state,p,from),zone=view(entries.map((entry:any)=>entry.card));choose(p,zone,zone.cards,0,zone.cards.length,cards=>{if(!cards.length)return next();field(all.filter(list=>list!==from),to=>{for(const card of cards)move(entries.find((entry:any)=>entry.card===card).zone,to,[card]);next();});});});break;
 }
 default:throw Error('Unknown DP Trainer operation '+op.op);
 }
 return state;
}
