import {StateUtils,SuperType,CardType,CardList,ChooseCardsPrompt,ChoosePokemonPrompt,SelectPrompt,ShowCardsPrompt,ShuffleDeckPrompt,PlayerType,SlotType,GameMessage} from './game';
import {AddMarkerEffect} from './game/store/effects/attack-effects';
import {MOVE_CARDS,MOVE_POKEMON_OFF_BOARD,MULTIPLE_COIN_FLIPS_PROMPT} from './game/store/prefabs/prefabs';
import {attachWotcEnergy} from './game/store/prefabs/wotc-energy-attachment';
import {PlayPokemonFromDeckEffect} from './game/store/effects/play-card-effects';
import {exAttachedEnergy} from './tcg-lab-ex-attachments';

export function svZoneAction(store:any,state:any,b:any,op:any,next:any,ctx:any){
 const p=b.player,o=StateUtils.getOpponent(state,p),source=b.source||p.active,card=b._wotcSourceCard||source.getPokemonCard();
 const move=(from:any,to:any,cards:any[])=>MOVE_CARDS(store,state,from,to,{cards,sourceCard:card,sourceEffect:b});
 const shuffle=(owner:any,done:any=next)=>store.prompt(state,new ShuffleDeckPrompt(owner.id),(order:number[])=>{owner.deck.applyOrder(order);done();});
 const returnSlot=(owner:any,list:any)=>{const probe=new AddMarkerEffect(b,'SV_RETURN_PROBE',card);probe.target=list;store.reduceEffect(state,probe);if(probe.markerAdded)MOVE_POKEMON_OFF_BOARD(store,state,list,{pokemonDestination:owner.deck,attachedDestination:owner.deck,sourceCard:card,sourceEffect:b});};
 switch(op.kind){
 case 'invitingKiss':{
  const before=p.bench.map((l:any)=>l.getPokemonCard());return ctx.run([{op:'searchBench',amount:1}],()=>{
   const target=p.bench.find((l:any)=>l.getPokemonCard()&&!before.includes(l.getPokemonCard())),entries=exAttachedEnergy(store,state,p,source);if(!target||!entries.length)return next();const zone=new CardList();zone.cards=entries.map((entry:any)=>entry.card);
   return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_ATTACH,zone,{},{min:1,max:1,allowCancel:false}),(chosen:any)=>{move(entries.find((entry:any)=>entry.card===chosen[0]).zone,target,chosen);next();});
  });
 }
 case 'raidCost':{
  const targets=p.bench.filter((l:any)=>l.getPokemonCard()?.name==='Combee');if(!targets.length){b.damage=0;return next();}
  return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_SWITCH,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{min:1,max:1,allowCancel:false,blocked:p.bench.map((list:any,index:number)=>({list,index})).filter((s:any)=>!targets.includes(s.list)).map(({index}:any)=>({player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index}))}),(chosen:any)=>{const combee=chosen[0].getPokemonCard();returnSlot(p,chosen[0]);if(!p.deck.cards.includes(combee)){b.damage=0;return next();}shuffle(p);});
 }
 case 'byeByeFlight':if(!o.bench.some((l:any)=>l.getPokemonCard()))return next();return ctx.run([{op:'sv',kind:'returnBench'},{op:'returnPokemon',all:true}],next);
 case 'returnBothActives':{
  returnSlot(p,p.active);returnSlot(o,o.active);
  const promote=(owners:any[],i:number):any=>{if(i>=owners.length)return next();const owner=owners[i];if(owner.active.getPokemonCard()||!owner.bench.some((l:any)=>l.getPokemonCard()))return promote(owners,i+1);
   return store.prompt(state,new ChoosePokemonPrompt(owner.id,GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{min:1,max:1,allowCancel:false}),(chosen:any)=>{owner.switchPokemon(chosen[0],store,state);if(store.hasPrompts())store.waitPrompt(state,()=>promote(owners,i+1));else promote(owners,i+1);});
  };return shuffle(p,()=>shuffle(o,()=>promote([p,o],0)));
 }
 case 'breezyGift':returnSlot(p,source);if(p.deck.cards.includes(card))return ctx.run([{op:'search',category:'Any',amount:3,optional:true,noReveal:true}],next);return next();
 case 'returnCharge':{
  if(source!==p.active)return next();const old=source.getPokemonCard();return ctx.run([{op:'switchSelf'}],()=>p.active.getPokemonCard()===old?next():ctx.run([{op:'attachZoneEnergy',zone:'hand',basic:true,energy:'Lightning',self:true,amount:2,optional:true}],next));
 }
 case 'spreadFilaments':return MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,2,(flips:boolean[])=>{
  const max=Math.min(flips.filter(Boolean).length,p.bench.filter((l:any)=>!l.cards.length).length),eligible=p.deck.cards.filter((c:any)=>c.superType===SuperType.POKEMON&&c.cardType.includes(CardType.GRASS));if(!max||!eligible.length)return shuffle(p);
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_PUT_ONTO_BENCH,p.deck,{superType:SuperType.POKEMON},{min:0,max:Math.min(max,eligible.length),allowCancel:false,blocked:p.deck.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{
   const place=(i:number):any=>{if(i>=(chosen||[]).length)return shuffle(p);const slots=p.bench.filter((l:any)=>!l.cards.length);store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,slots.map((l:any)=>'Bench '+(p.bench.indexOf(l)+1)),{allowCancel:false}),(index:number)=>{store.reduceEffect(state,new PlayPokemonFromDeckEffect(p,chosen[i],slots[index]));if(store.hasPrompts())store.waitPrompt(state,()=>place(i+1));else place(i+1);});};place(0);
  });
 });
 case 'whirltide':{
  b.damage=0;const top=p.deck.cards.slice(0,6),energy=top.filter((c:any)=>c.superType===SuperType.ENERGY);if(!top.length)return next();
  return store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,top),()=>ctx.run([{op:'targetDamage',amount:energy.length*60}],()=>{move(p.deck,p.discard,energy);shuffle(p);}));
 }
 case 'expellingTornado':{
  const targets=o.bench.filter((l:any)=>l.getPokemonCard());if(targets.length<3)return next();
  return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_SWITCH,PlayerType.TOP_PLAYER,[SlotType.BENCH],{min:3,max:3,allowCancel:false}),(keep:any)=>{for(const target of targets)if(!keep.includes(target))returnSlot(o,target);shuffle(o);});
 }
 case 'mischievousPainting':{
  const eligible=o.discard.cards.filter((c:any)=>c.superType===SuperType.ENERGY);if(!eligible.length)return next();
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_ATTACH,o.discard,{superType:SuperType.ENERGY},{min:0,max:Math.min(3,eligible.length),allowCancel:false}),(chosen:any)=>{
   const attach=(i:number):any=>{if(i>=(chosen||[]).length)return next();store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.TOP_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{min:1,max:1,allowCancel:false}),(targets:any)=>{attachWotcEnergy(store,state,o,o.discard,targets[0],chosen[i],{sourceCard:card,sourceEffect:b,sourceKind:'attack'});if(store.hasPrompts())store.waitPrompt(state,()=>attach(i+1));else attach(i+1);});};attach(0);
  });
 }
 }
 return next();
}
