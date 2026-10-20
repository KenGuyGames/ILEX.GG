import {StateUtils,CardTag,Stage,SuperType,EnergyType,CardType,TrainerType,SpecialCondition,ChoosePokemonPrompt,PlayerType,SlotType,GameError,GameMessage,ChooseCardsPrompt,CardList,OrderCardsPrompt,SelectPrompt,ShowCardsPrompt} from './game';
import {HealEffect} from './game/store/effects/game-effects';
import {AddMarkerEffect,PutCountersEffect,DiscardDefendingPokemonEffect} from './game/store/effects/attack-effects';
import {ShuffleDeckPrompt} from './game';
import {CheckPokemonTypeEffect,CheckHpEffect,CheckRetreatCostEffect} from './game/store/effects/check-effects';
import {AddSpecialConditionsEffect} from './game/store/effects/attack-effects';
import {MOVE_CARDS,DRAW_CARDS,COIN_FLIP_PROMPT,MOVE_POKEMON_OFF_BOARD,LOOK_AT_TOP_X_CARDS_AND_BENCH_UP_TO_Y_POKEMON} from './game/store/prefabs/prefabs';
import {placePokemonAsBasic} from './game/store/prefabs/place-pokemon-as-basic';
import {dpPayEnergyUnits} from './tcg-lab-dp-energy-cost';
import {xyTypes} from './tcg-lab-xy-actions';
import {exAttachedEnergy} from './tcg-lab-ex-attachments';
import {dpAttachedTrainers,dpDiscardAttached} from './tcg-lab-dp-tools';
import {attachWotcEnergy} from './game/store/prefabs/wotc-energy-attachment';
import {FLIP_UNTIL_TAILS_AND_COUNT_HEADS} from './game/store/prefabs/prefabs';
import {replaceSvOgerpon} from './tcg-lab-sv-replacement';
import {svZoneAction} from './tcg-lab-sv-zone-actions';
import {THIS_POKEMON_RETALIATES_ON_DAMAGE_DURING_OPPONENTS_NEXT_TURN,YOUR_POKEMON_CANNOT_ATTACK_DURING_YOUR_NEXT_TURN,OPPONENT_TURN_ENDS_ON_ENERGY_ATTACH_FROM_HAND_TO_DEFENDING_NEXT_TURN,TAKE_MORE_PRIZES_IF_DEFENDING_KNOCKED_OUT_DURING_YOUR_NEXT_TURN} from './game/store/prefabs/effect-of-attack-prefabs';
import {PUT_DAMAGE_COUNTERS_ON_DEFENDING_POKEMON_AT_END_OF_OPPONENTS_NEXT_TURN,DISCARD_DEFENDING_POKEMON_AT_END_OF_OPPONENTS_NEXT_TURN} from './game/store/prefabs/attack-effects';
export function svAction(store:any,state:any,b:any,op:any,next:any,ctx:any){
 const p=b.player,o=StateUtils.getOpponent(state,p),source=b.source||p.active;
 const typed=(list:any,type:string)=>{if(!list.getPokemonCard())return false;const e=new CheckPokemonTypeEffect(list);store.reduceEffect(state,e);return e.cardTypes.includes(xyTypes[type]);};
 const modernEx=(c:any)=>c?.tags.includes(CardTag.POKEMON_ex)&&!!c.regulationMark;
 const v=(c:any)=>c?.tags.some((t:any)=>[CardTag.POKEMON_V,CardTag.POKEMON_VMAX,CardTag.POKEMON_VSTAR,CardTag.POKEMON_VUNION].includes(t));
 switch(op.kind){
 case 'crispin':{
  const available=p.deck.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC),shuffle=()=>store.prompt(state,new ShuffleDeckPrompt(p.id),(order:number[])=>{p.deck.applyOrder(order);next();});if(!available.length)return shuffle();
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,p.deck,{superType:SuperType.ENERGY,energyType:EnergyType.BASIC},{min:0,max:Math.min(2,available.length),differentTypes:true,allowCancel:false}),(chosen:any)=>{
   if(!chosen?.length)return shuffle();const reveal=()=>store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,chosen),()=>{
    const hand=(card:any)=>{MOVE_CARDS(store,state,p.deck,p.hand,{cards:[card],sourceCard:b._wotcTrainerCard,sourceEffect:b});const other=chosen.find((c:any)=>c!==card);if(!other)return shuffle();store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{min:1,max:1,allowCancel:false}),(targets:any)=>{attachWotcEnergy(store,state,p,p.deck,targets[0],other,{sourceCard:b._wotcTrainerCard,sourceEffect:b,sourceKind:'trainer'});if(store.hasPrompts())store.waitPrompt(state,shuffle);else shuffle();});};
    if(chosen.length===1)return hand(chosen[0]);const zone=new CardList();zone.cards=chosen;store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,zone,{},{min:1,max:1,allowCancel:false}),(pick:any)=>hand(pick[0]));
   });reveal();
  });
 }
 case 'raidCost':case 'byeByeFlight':case 'returnBothActives':case 'breezyGift':case 'returnCharge':case 'spreadFilaments':case 'whirltide':case 'expellingTornado':case 'mischievousPainting':case 'invitingKiss':return svZoneAction(store,state,b,op,next,ctx);
 case 'codeProtect':{const probe=new AddMarkerEffect(b,'SV_CODE_PROTECT',source.getPokemonCard());probe.target=source;store.reduceEffect(state,probe);if(probe.markerAdded)source._svCodeProtectTurn=state.turn+1;break;}
 case 'botherBot':{
  const prizes=o.prizes.map((list:any,index:number)=>({list,index})).filter((s:any)=>s.list.cards.length&&!s.list.faceUpPrize);if(!prizes.length)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_PRIZE_CARD,prizes.map((s:any)=>'Prize '+(s.index+1)),{allowCancel:false}),(index:number)=>{
   const prize=prizes[index].list;prize.faceUpPrize=true;if(!o.hand.cards.length)return next();const picked=o.hand.cards[Math.floor(Math.random()*o.hand.cards.length)];
   return store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,[picked]),()=>store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Keep cards','Swap with Prize'],{allowCancel:false}),(choice:number)=>{if(choice===1){const original=prize.cards[0];MOVE_CARDS(store,state,o.hand,prize,{cards:[picked],sourceCard:b._wotcTrainerCard,sourceEffect:b});if(prize.cards.includes(picked))MOVE_CARDS(store,state,prize,o.hand,{cards:[original],sourceCard:b._wotcTrainerCard,sourceEffect:b});}next();}));
  });
 }
 case 'ogerponMask':{
  const match=(c:any)=>modernEx(c)&&c.name.includes('Ogerpon'),cards=p.discard.cards.filter(match),slots=[{list:p.active,player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0},...p.bench.map((list:any,index:number)=>({list,player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index}))],targets=slots.filter(s=>match(s.list.getPokemonCard()));
  if(!cards.length||!targets.length)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_SWITCH,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{min:1,max:1,allowCancel:false,blocked:slots.filter(s=>!targets.includes(s)).map(({list,...target})=>target)}),(chosen:any)=>store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,p.discard,{superType:SuperType.POKEMON},{min:1,max:1,allowCancel:false,blocked:p.discard.cards.map((c:any,i:number)=>cards.includes(c)?-1:i).filter((i:number)=>i>=0)}),(picked:any)=>{replaceSvOgerpon(store,state,p,chosen[0],picked[0],b);next();}));
 }
 case 'retreatTax':{const probe=new AddMarkerEffect(b,'SV_RETREAT_TAX',source.getPokemonCard());probe.target=o.active;store.reduceEffect(state,probe);if(probe.markerAdded){o.active.retreatCostIncreaseNextTurnPending=op.amount;o.active.retreatCostIncreaseNextTurnAttackerId=p.id;}break;}
 case 'weaknessType':{
  const apply=(energy:string)=>{const probe=new AddMarkerEffect(b,'SV_WEAKNESS_TYPE',source.getPokemonCard());probe.target=o.active;store.reduceEffect(state,probe);if(probe.markerAdded)o.active.svWeaknessOverride={type:xyTypes[energy],untilTurn:op.nextTurn?state.turn+2:Number.MAX_SAFE_INTEGER};next();};
  if(op.energy)return apply(op.energy);const choices=['Grass','Fire','Water','Lightning','Psychic','Fighting','Darkness','Metal','Dragon'];return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,choices,{allowCancel:false}),(choice:number)=>apply(choices[choice]));
 }
 case 'suddenShout':if(source._dpEvolutionHistory?.turn===state.turn&&source._dpEvolutionHistory.from==='Loudred'){store.reduceEffect(state,new DiscardDefendingPokemonEffect(b));if(store.hasPrompts())return store.waitPrompt(state,next);}break;
 case 'typedSearch':{
  const types=op.attachedTypes?exAttachedEnergy(store,state,p,source).filter((entry:any)=>entry.card.superType===SuperType.ENERGY&&entry.card.energyType===EnergyType.BASIC).flatMap((entry:any)=>entry.card.provides):[xyTypes[op.energy]];
  const cards=p.deck.cards.filter((c:any)=>c.superType===SuperType.POKEMON?c.cardType.some((t:any)=>types.includes(t)):op.mixedEnergy&&c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC&&c.provides.some((t:any)=>types.includes(t)));
  const shuffle=()=>store.prompt(state,new ShuffleDeckPrompt(p.id),(order:number[])=>{p.deck.applyOrder(order);next();});
  if(!cards.length)return shuffle();
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,p.deck,{},{min:0,max:Math.min(op.amount,cards.length),allowCancel:false,blocked:p.deck.cards.map((c:any,i:number)=>cards.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{
   const finish=()=>{MOVE_CARDS(store,state,p.deck,p.hand,{cards:chosen||[],sourceCard:b._wotcSourceCard,sourceEffect:b});shuffle();};
   if(chosen?.length)store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,chosen),finish);else finish();
  });
 }
 case 'untilTailsDamage':return FLIP_UNTIL_TAILS_AND_COUNT_HEADS(store,state,p,(heads:number)=>{b.damage=heads*op.amount;if(!heads)return ctx.run([{op:'status',conditions:[op.zeroStatus],after:true}],next);next();});
 case 'untilTailsEnergy':return FLIP_UNTIL_TAILS_AND_COUNT_HEADS(store,state,p,(heads:number)=>heads?ctx.run([{op:'dpOpponentEnergy',amount:heads,deck:true}],next):next());
 case 'benchEnergyEach':{
  const zone=op.zone==='deck'?p.deck:p.discard,targets=p.bench.filter((list:any)=>list.getPokemonCard()&&(!op.name||list.getPokemonCard().name===op.name));
  const eligible=()=>zone.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC&&c.provides.includes(xyTypes[op.energy]));
  const finish=()=>op.zone==='deck'?store.prompt(state,new ShuffleDeckPrompt(p.id),(order:number[])=>{p.deck.applyOrder(order);next();}):next();
  const apply=(chosen:any[])=>{
   const attach=(i:number):any=>{if(i>=chosen.length||!eligible().length)return finish();
    return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_ATTACH,zone,{superType:SuperType.ENERGY,energyType:EnergyType.BASIC},{min:op.zone==='deck'?0:1,max:1,allowCancel:false,blocked:zone.cards.map((c:any,index:number)=>eligible().includes(c)?-1:index).filter((index:number)=>index>=0)}),(cards:any)=>{
     if(cards?.length)attachWotcEnergy(store,state,p,zone,chosen[i],cards[0],{sourceCard:b._wotcSourceCard,sourceEffect:b});if(store.hasPrompts())store.waitPrompt(state,()=>attach(i+1));else attach(i+1);
    });
   };return attach(0);
  };
  if(!targets.length||!eligible().length)return finish();if(!op.choose)return apply(targets);
  return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{min:0,max:Math.min(op.choose,targets.length,eligible().length),allowCancel:false}),(chosen:any)=>apply(chosen||[]));
 }
 case 'lucian':{
  let moved=false;for(const owner of [p,o]){
   const cards=owner.hand.cards.slice();for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}
   MOVE_CARDS(store,state,owner.hand,owner.deck,{cards,sourceCard:b._wotcTrainerCard,sourceEffect:b});if(cards.some((c:any)=>owner.deck.cards.includes(c)))moved=true;
  }
  if(!moved)break;
  return COIN_FLIP_PROMPT(store,state,p,(heads:boolean)=>{DRAW_CARDS(store,state,p,heads?6:3);COIN_FLIP_PROMPT(store,state,o,(otherHeads:boolean)=>{DRAW_CARDS(store,state,o,otherHeads?6:3);next();});});
 }
 case 'switchDamage':{
  b.damage=0;const old=o.active.getPokemonCard();
  return ctx.run([op.opponentChooses?{op:'xy',kind:'roar'}:{op:'gust'}],()=>{
   if(o.active.getPokemonCard()===old)return next();b.damage=op.amount;
   if(op.paralyze){b._wotcAfterOps??=[];b._wotcAfterOps.push({op:'coin',heads:[{op:'status',conditions:['PARALYZED']}]});}next();
  });
 }
 case 'switchThenRoar':{
  const old=p.active.getPokemonCard();return ctx.run([{op:'switchSelf'}],()=>p.active.getPokemonCard()!==old?ctx.run([{op:'xy',kind:'roar'}],next):next());
 }
 case 'delayedCounters':PUT_DAMAGE_COUNTERS_ON_DEFENDING_POKEMON_AT_END_OF_OPPONENTS_NEXT_TURN(store,state,b,b._wotcSourceCard||source.getPokemonCard(),op.amount);break;
 case 'delayedDiscard':DISCARD_DEFENDING_POKEMON_AT_END_OF_OPPONENTS_NEXT_TURN(store,state,b,b._wotcSourceCard||source.getPokemonCard());break;
 case 'endTurnOnAttach':OPPONENT_TURN_ENDS_ON_ENERGY_ATTACH_FROM_HAND_TO_DEFENDING_NEXT_TURN(store,state,b,b._wotcSourceCard||source.getPokemonCard());break;
 case 'delayedPrizeBonus':TAKE_MORE_PRIZES_IF_DEFENDING_KNOCKED_OUT_DURING_YOUR_NEXT_TURN(store,state,b,b._wotcSourceCard||source.getPokemonCard(),op.amount);break;
 case 'prizeAttach':return ctx.run([{op:'attachZoneEnergy',zone:'discard',basic:true,energy:op.energy,amount:o.prizes.filter((l:any)=>!l.cards.length).length,optional:true}],next);
 case 'typedFieldCoins':{const count=[p.active,...p.bench].filter((l:any)=>typed(l,op.energy)).length;return ctx.run([{op:'countedCoins',count,perHead:op.amount,base:0}],next);}
 case 'selfHandDiscard':{const owner=op.opponent?o:p,count=Math.min(op.amount,owner.hand.cards.length);if(!count)break;return store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_DISCARD,owner.hand,{},{min:count,max:count,allowCancel:false}),(cards:any)=>{MOVE_CARDS(store,state,owner.hand,owner.discard,{cards,sourceCard:b._wotcSourceCard,sourceEffect:b});next();});}
 case 'handBasicTypeScale':{
  b.damage=0;const eligible=p.hand.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC);if(!eligible.length)break;
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_DISCARD,p.hand,{superType:SuperType.ENERGY,energyType:EnergyType.BASIC},{min:0,max:eligible.length,allowCancel:false}),(cards:any)=>{
   MOVE_CARDS(store,state,p.hand,p.discard,{cards:cards||[],sourceCard:b._wotcSourceCard,sourceEffect:b});
   const types=new Set((cards||[]).filter((c:any)=>p.discard.cards.includes(c)).flatMap((c:any)=>c.provides));b.damage=types.size*op.amount;next();
  });
 }
 case 'topAllChoice':{
  const cards=p.deck.cards.slice(0,op.amount);if(!cards.length)break;
  return store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CHOOSE_CARD_TO_HAND,cards),()=>store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Put these cards into your hand','Discard these cards and draw'],{allowCancel:false}),(choice:number)=>{
   MOVE_CARDS(store,state,p.deck,choice===1?p.discard:p.hand,{cards,sourceCard:b._wotcSourceCard,sourceEffect:b});if(choice===1)DRAW_CARDS(store,state,p,op.amount);next();
  }));
 }
 case 'topBottomChoice':{
  const cards=p.deck.cards.slice(0,1);if(!cards.length)break;
  return store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CHOOSE_CARDS_ORDER,cards),()=>store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Leave on top','Put on bottom'],{allowCancel:false}),(choice:number)=>{if(choice===1){const index=p.deck.cards.indexOf(cards[0]);if(index>=0)p.deck.cards.push(...p.deck.cards.splice(index,1));}next();}));
 }
 case 'opponentTopShuffle':{
  const cards=o.deck.cards.slice(0,1);if(!cards.length)break;
  return store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,cards),()=>store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Leave deck','Shuffle opponent deck'],{allowCancel:false}),(choice:number)=>choice===1?store.prompt(state,new ShuffleDeckPrompt(o.id),(order:number[])=>{o.deck.applyOrder(order);next();}):next()));
 }
 case 'orderOpponentTop':{
  const cards=o.deck.cards.slice(0,op.amount),view=new CardList();view.cards=cards;if(!cards.length)break;
  return store.prompt(state,new OrderCardsPrompt(p.id,GameMessage.CHOOSE_CARDS_ORDER,view,{allowCancel:false}),(order:number[])=>{o.deck.cards.splice(0,cards.length,...order.map(i=>cards[i]));next();});
 }
 case 'lookOpponentPrize':{
  const eligible=o.prizes.map((list:any,index:number)=>({list,index})).filter((s:any)=>s.list.cards.length&&!s.list.faceUpPrize);if(!eligible.length)break;
  return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_PRIZE_CARD,eligible.map((s:any)=>'Prize '+(s.index+1)),{allowCancel:false}),(index:number)=>store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CHOOSE_PRIZE_CARD,eligible[index].list.cards.slice()),next));
 }
 case 'ownToolDiscard':{
  const lists=(op.self?[source]:[p.active,...p.bench]).filter((l:any)=>l.getPokemonCard()),entries=lists.flatMap((list:any)=>dpAttachedTrainers(list,true).filter((card:any)=>!op.name||card.name===op.name).map((card:any)=>({list,card})));if(!entries.length)break;
  const apply=(cards:any[])=>{let discarded=0;for(const list of lists)discarded+=dpDiscardAttached(store,state,b,list,cards.filter((card:any)=>entries.some((entry:any)=>entry.list===list&&entry.card===card)));if(op.bonus)b.damage+=op.bonus*discarded;if(discarded&&op.reduction)return ctx.run([{op:'reduceNextDamage',amount:op.reduction,allDamage:true}],next);next();};
  if(op.all)return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Keep Tools','Discard all matching Tools'],{allowCancel:false}),(choice:number)=>choice===1?apply(entries.map((entry:any)=>entry.card)):next());
  const zone=new CardList();zone.cards=entries.map((entry:any)=>entry.card);return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_DISCARD,zone,{},{min:0,max:entries.length,allowCancel:false}),(cards:any)=>apply(cards||[]));
 }
 case 'recoverItemsTools':{
  const cards=p.discard.cards.filter((c:any)=>c.superType===SuperType.TRAINER&&[TrainerType.ITEM,TrainerType.TOOL].includes(c.trainerType));if(!cards.length)break;
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,p.discard,{superType:SuperType.TRAINER},{min:0,max:Math.min(op.amount,cards.length),allowCancel:false,blocked:p.discard.cards.map((c:any,i:number)=>cards.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{MOVE_CARDS(store,state,p.discard,p.hand,{cards:chosen||[],sourceCard:b._wotcSourceCard,sourceEffect:b});next();});
 }
 case 'hpTenCounters':{
  const hp=new CheckHpEffect(o,o.active);store.reduceEffect(state,hp);const amount=Math.max(0,hp.hp-o.active.damage-10);if(!amount)break;
  const before=o.active.damage,e=new PutCountersEffect(b,amount);e.target=o.active;store.reduceEffect(state,e);
  const finish=()=>o.active.damage>before?ctx.run([{op:'recoil',amount:op.recoil}],next):next();if(store.hasPrompts())return store.waitPrompt(state,finish);return finish();
 }
 case 'selfCounterScale':return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,Array.from({length:op.amount+1},(_,n)=>'Place '+n+' damage counters'),{allowCancel:false}),(count:number)=>{const before=source.damage,e=new PutCountersEffect(b,count*10);e.target=source;store.reduceEffect(state,e);b.damage=op.per*Math.max(0,(source.damage-before)/10);next();});
 case 'healTaggedBench':{
  const eligible=p.bench.filter((l:any)=>l.getPokemonCard()?.tags.includes(op.tag==='Ancient'?CardTag.ANCIENT:CardTag.FUTURE));if(!eligible.length)break;
  return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_HEAL,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{min:1,max:1,allowCancel:false,blocked:p.bench.map((list:any,index:number)=>({list,index})).filter((s:any)=>!eligible.includes(s.list)).map(({index}:any)=>({player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index}))}),(chosen:any)=>{store.reduceEffect(state,new HealEffect(p,chosen[0],op.amount));next();});
 }
 case 'ownBenchDamage':if(p.bench.some((l:any)=>l.getPokemonCard()))return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_DAMAGE,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{min:1,max:1,allowCancel:false}),(chosen:any)=>{ctx.damage(chosen[0],op.amount);next();});break;
 case 'shufflePlayerHand':{
  const count=op.bothBenches?[...p.bench,...o.bench].filter((l:any)=>l.getPokemonCard()).length:op.amount;
  const apply=(owner:any)=>{MOVE_CARDS(store,state,owner.hand,owner.deck,{cards:owner.hand.cards.slice(),sourceCard:b._wotcTrainerCard||b._wotcSourceCard,sourceEffect:b});store.prompt(state,new ShuffleDeckPrompt(owner.id),(order:any)=>{owner.deck.applyOrder(order);DRAW_CARDS(store,state,owner,count);next();});};
  if(op.either)return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Your hand',"Opponent's hand"],{allowCancel:false}),(choice:number)=>apply(choice===1?o:p));
  apply(op.opponent?o:p);return;
 }
 case 'discardHandToDraw':{
  if(!p.hand.cards.length){DRAW_CARDS(store,state,p,op.drawTo);break;}
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_DISCARD,p.hand,{},{min:Math.max(0,p.hand.cards.length-op.remaining),max:p.hand.cards.length,allowCancel:false}),(cards:any)=>{MOVE_CARDS(store,state,p.hand,p.discard,{cards:cards||[],sourceCard:b._wotcSourceCard,sourceEffect:b});DRAW_CARDS(store,state,p,Math.max(0,op.drawTo-p.hand.cards.length));next();});
 }
 case 'discardHandBonus':if(p.hand.cards.length)return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Keep hand','Discard hand for extra damage'],{allowCancel:false}),(choice:number)=>{if(choice===1){const cards=p.hand.cards.slice();MOVE_CARDS(store,state,p.hand,p.discard,{cards,sourceCard:b._wotcSourceCard,sourceEffect:b});if(cards.some((c:any)=>p.discard.cards.includes(c)))b.damage+=op.amount;}next();});break;
 case 'teamAttackLock':YOUR_POKEMON_CANNOT_ATTACK_DURING_YOUR_NEXT_TURN(store,state,b,b._wotcSourceCard||source.getPokemonCard());break;
 case 'energySnipe':{const units=exAttachedEnergy(store,state,p,source).reduce((n:number,entry:any)=>n+StateUtils.getProvidesUnitCount(entry.provides,entry),0);return ctx.run([{op:'targetDamage',amount:units*op.amount}],next);}
 case 'chosenCounters':{
  const count=Math.min(op.targets,[o.active,...o.bench].filter((l:any)=>l.getPokemonCard()).length);if(!count)break;
  return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_DAMAGE,PlayerType.TOP_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{min:count,max:count,allowCancel:false}),(chosen:any)=>{for(const target of chosen){const e=new PutCountersEffect(b,op.amount);e.target=target;store.reduceEffect(state,e);}next();});
 }
 case 'namedFieldCounters':{
  const count=[p.active,...p.bench].filter((l:any)=>l.getPokemonCard()?.name===op.name).length;
  for(const target of [o.active,...o.bench].filter((l:any)=>l.getPokemonCard())){const e=new PutCountersEffect(b,count*op.amount);e.target=target;store.reduceEffect(state,e);}break;
 }
 case 'healField':for(const target of [p.active,...p.bench]){const c=target.getPokemonCard();if(c&&(!op.basic||c.stage===Stage.BASIC)&&(!op.tag||c.tags.includes(CardTag.POKEMON_TERA))){const e=new (HealEffect)(p,target,op.all?target.damage:op.amount);store.reduceEffect(state,e);}}break;
 case 'lookOwnPrizes':{const cards=p.prizes.filter((l:any)=>!l.faceUpPrize).flatMap((l:any)=>l.cards);if(cards.length)return store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CHOOSE_PRIZE_CARD,cards),next);break;}
 case 'ortega':{
  if(!o.hand.cards.length)break;
  return store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,o.hand.cards),()=>store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,o.hand,{},{min:1,max:1,allowCancel:false}),(cards:any)=>{
   MOVE_CARDS(store,state,o.hand,o.deck,{cards,sourceCard:b._wotcTrainerCard,sourceEffect:b});
   store.prompt(state,new SelectPrompt(o.id,GameMessage.CHOOSE_OPTION,['Keep hand','Draw a card'],{allowCancel:false}),(choice:number)=>{if(choice===1)DRAW_CARDS(store,state,o,1);next();});
  }));
 }
 case 'retaliate':return ctx.run([],()=>{THIS_POKEMON_RETALIATES_ON_DAMAGE_DURING_OPPONENTS_NEXT_TURN(store,state,b,b._wotcSourceCard||source.getPokemonCard(),{damage:op.amount});next();});
 case 'coinAttackLock':{const probe=new AddMarkerEffect(b,'SV_COIN_ATTACK_LOCK',b._wotcSourceCard||source.getPokemonCard());probe.target=o.active;store.reduceEffect(state,probe);o.active.marker.removeMarker('SV_COIN_ATTACK_LOCK',b._wotcSourceCard||source.getPokemonCard());if(probe.markerAdded)o.active.coinFlipCancelAttackNextTurn=op.amount;break;}
 case 'optionalEnergyScale':{
  const entries=exAttachedEnergy(store,state,p,source).filter((entry:any)=>StateUtils.providesMatchesType(entry.provides,xyTypes[op.energy]));if(!entries.length)break;
  const zone=new CardList();zone.cards=entries.map((entry:any)=>entry.card);
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,zone,{},{min:0,max:Math.min(op.amount,entries.length),allowCancel:false}),(chosen:any)=>{let paid=0;for(const card of chosen||[]){const entry=entries.find((entry:any)=>entry.card===card);MOVE_CARDS(store,state,entry.zone,p.discard,{cards:[card],sourceCard:b._wotcSourceCard||source.getPokemonCard(),sourceEffect:b});if(p.discard.cards.includes(card))paid++;}b.damage+=paid*op.bonus;next();});
 }
 case 'tagProtection':source.preventDamageNextTurnPending={sourceTags:[op.tag==='Ancient'?CardTag.ANCIENT:CardTag.FUTURE]};break;
 case 'requireHand':if(p.hand.cards.length<op.amount)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);break;
 case 'parasolLady':return ctx.run([{op:'shuffleHand',amount:state.turn===2?8:4}],next);
 case 'topChoose':{
  const cards=p.deck.cards.slice(0,op.amount),view=new CardList();view.cards=cards;
  const finish=(chosen:any[])=>{
   MOVE_CARDS(store,state,p.deck,op.discard?p.discard:p.hand,{cards:chosen,sourceCard:b._wotcTrainerCard||b._wotcSourceCard,sourceEffect:b});
   const rest=cards.filter((c:any)=>!chosen.includes(c)),zone=new CardList();zone.cards=rest;
   const place=(order:number[],bottom:boolean)=>{p.deck.cards=p.deck.cards.filter((c:any)=>!rest.includes(c));const ordered=order.map(i=>rest[i]);if(bottom)p.deck.cards.push(...ordered);else p.deck.cards.unshift(...ordered);next();};
   const randomizedBottom=()=>store.prompt(state,new ShuffleDeckPrompt(p.id),(order:number[])=>{
    // A regular shuffle prompt supplies a permutation of the entire deck. Project
    // that concealed random order onto the remainder without shuffling the deck.
    const ordered=order.map(i=>p.deck.cards[i]).filter((c:any)=>rest.includes(c));
    place(ordered.map((c:any)=>rest.indexOf(c)),true);
   });
   const orderedTop=()=>rest.length<2?place(rest.map((_:any,i:number)=>i),false):store.prompt(state,new OrderCardsPrompt(p.id,GameMessage.CHOOSE_CARDS_ORDER,zone,{allowCancel:false}),(order:number[])=>place(order,false));
   if(!rest.length)return next();
   if(op.remainder==='randomBottom')return randomizedBottom();
   if(op.remainder==='topOrBottom')return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Order on top','Shuffle to bottom'],{allowCancel:false}),(choice:number)=>choice===1?randomizedBottom():orderedTop());
   return orderedTop();
  };
  if(!cards.length)break;
  if(!op.pick)return finish([]);
  return store.prompt(state,new ChooseCardsPrompt(p,op.discard?GameMessage.CHOOSE_CARD_TO_DISCARD:GameMessage.CHOOSE_CARD_TO_HAND,view,{},{min:op.optional?0:Math.min(op.pick,cards.length),max:Math.min(op.pick,cards.length),allowCancel:false}),(chosen:any)=>finish(chosen||[]));
 }
 case 'discardDefenderTools':dpDiscardAttached(store,state,b,o.active,dpAttachedTrainers(o.active,true));break;
 case 'drawTo':DRAW_CARDS(store,state,p,Math.max(0,op.amount-p.hand.cards.length));break;
 case 'returnBench':{
  if(!o.bench.some((l:any)=>l.getPokemonCard()))break;
  return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_SWITCH,PlayerType.TOP_PLAYER,[SlotType.BENCH],{min:1,max:1,allowCancel:false}),(chosen:any)=>{
   const target=chosen[0],probe=new AddMarkerEffect(b,'WOTC_RETURN_PROBE',b._wotcSourceCard||source.getPokemonCard());probe.target=target;store.reduceEffect(state,probe);
   if(!probe.markerAdded)return next();
   MOVE_POKEMON_OFF_BOARD(store,state,target,{pokemonDestination:o.deck,attachedDestination:o.deck,sourceCard:b._wotcSourceCard||source.getPokemonCard(),sourceEffect:b});
   store.prompt(state,new ShuffleDeckPrompt(o.id),(order:any)=>{o.deck.applyOrder(order);next();});
  });
 }
 case 'fieldDiscardUnits':{
  const field=[p.active,...p.bench],entries=field.filter((l:any)=>l.getPokemonCard()).flatMap((l:any)=>exAttachedEnergy(store,state,p,l));let amount=op.amount;
  while(amount>0&&!StateUtils.checkEnoughEnergy(entries,Array(amount).fill(xyTypes[op.energy])))amount--;
  if(!amount)break;
  return dpPayEnergyUnits(store,state,p,field,Array(amount).fill(xyTypes[op.energy]),b._wotcSourceCard||source.getPokemonCard(),b,next);
 }
 case 'topBench':{
  const slots=p.bench.filter((l:any)=>!l.cards.length);if(!slots.length)return ctx.run([{op:'shuffle'}],next);
  const result=LOOK_AT_TOP_X_CARDS_AND_BENCH_UP_TO_Y_POKEMON(store,state,p,op.amount,slots.length,{remainderDestination:'shuffle'});
  if(store.hasPrompts())store.waitPrompt(state,next);else next();return result;
 }
 case 'reviveNamed':{
  const slots=p.bench.filter((l:any)=>!l.cards.length),cards=p.discard.cards.filter((c:any)=>c.superType===SuperType.POKEMON&&(!op.name||c.name===op.name));if(!slots.length||!cards.length)break;
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_PUT_ONTO_BENCH,p.discard,{superType:SuperType.POKEMON,...(op.name?{name:op.name}:{})},{min:op.name?0:Math.min(1,cards.length,slots.length),max:Math.min(op.amount,cards.length,slots.length),allowCancel:false}),(chosen:any)=>{
   const put=(index:number):any=>{if(index>=(chosen||[]).length)return next();placePokemonAsBasic(store,state,p,p.discard,chosen[index],slots[index]);if(store.hasPrompts())store.waitPrompt(state,()=>put(index+1));else put(index+1);};put(0);
  });
 }
 case 'conditional':{
  const defender=o.active.getPokemonCard();
  if(op.condition==='allBenchDamaged'){const bench=p.bench.filter((l:any)=>l.getPokemonCard());if(bench.length&&bench.every((l:any)=>l.damage>=10))return ctx.run(op.ops,next);break;}
  if(op.condition==='toolAttachedFromHand'){if(source._svToolAttachedFromHandTurn===state.turn)return ctx.run(op.ops,next);break;}
  if(op.condition==='healedThisTurn'){if(source.healedThisTurn)return ctx.run(op.ops,next);break;}
  if(op.condition==='discardBasicFireTen'){if(p.discard.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC&&c.provides.includes(CardType.FIRE)).length>=10)return ctx.run(op.ops,next);break;}
  if(op.condition==='fightingResistance'){if(defender?.resistance.some((r:any)=>r.type===CardType.FIGHTING))return ctx.run(op.ops,next);break;}
  if(op.condition==='defenderStage2'){if(defender?.stage===Stage.STAGE_2)return ctx.run(op.ops,next);break;}
  if(op.condition==='defenderRetreatMinimum'){const e=new CheckRetreatCostEffect(o,o.active);store.reduceEffect(state,e);if(e.cost.length>=op.amount)return ctx.run(op.ops,next);break;}
  if(op.condition==='namedSupporter'){if(p.supporter.cards.some((c:any)=>c.name===op.name))return ctx.run(op.ops,next);if(op.failZero)b.damage=0;break;}
  if(op.condition==='futureSupporter'){if(p.supporter.cards.some((c:any)=>c.tags.includes(CardTag.FUTURE)))return ctx.run(op.ops,next);break;}
  if(op.condition==='namedBench'){if(p.bench.some((l:any)=>l.getPokemonCard()?.name===op.name))return ctx.run(op.ops,next);break;}
  if(op.condition==='anyStadium'){if(StateUtils.getStadiumCard(state))return ctx.run(op.ops,next);break;}
  if(op.condition==='ownPrizeOne'){if(p.prizes.filter((l:any)=>l.cards.length).length===1)return ctx.run(op.ops,next);break;}
  if(op.condition==='namedBenchDamaged'){if(p.bench.some((l:any)=>l.getPokemonCard()?.name===op.name&&l.damage>0))return ctx.run(op.ops,next);break;}
  if(op.condition==='previousAttack'){const last=source.getPokemonCard()?._wotcLastUsedAttack;if(last?.name===op.name&&last.turn===p.wotcLastTurnEnded)return ctx.run(op.ops,next);break;}
  if(op.condition==='secondFirstTurn'){if(state.turn===2)return ctx.run(op.ops,next);break;}
  if(op.condition==='namedDiscard'){if(p.discard.cards.some((c:any)=>c.name===op.name))return ctx.run(op.ops,next);break;}
  const units=(owner:any,list:any,energy?:string)=>exAttachedEnergy(store,state,owner,list).filter((entry:any)=>!energy||StateUtils.providesMatchesType(entry.provides,xyTypes[energy])).reduce((n:number,entry:any)=>n+StateUtils.getProvidesUnitCount(entry.provides,entry),0);
  const extra:any={opponentHandMaximum:()=>o.hand.cards.length<=op.amount,defenderTool:()=>o.active.tools.length>0,notEvolvedThisTurn:()=>source._dpEvolutionHistory?.turn!==state.turn,defenderDamaged:()=>o.active.damage>0,selfConfused:()=>source.specialConditions.includes(SpecialCondition.CONFUSED),defenderBurned:()=>o.active.specialConditions.includes(SpecialCondition.BURNED),selfCountersBelow:()=>source.damage<op.amount*10,equalEnergy:()=>units(p,source)===units(o,o.active),opponentPrizeCount:()=>op.counts.includes(o.prizes.filter((l:any)=>l.cards.length).length),selfEnergyMinimum:()=>units(p,source,op.energy)>=op.amount};
  if(extra[op.condition]){if(extra[op.condition]())return ctx.run(op.ops,next);if(op.failZero)b.damage=0;break;}
  const yes=op.condition==='ownStadium'?p.stadium.cards.length>0:op.condition==='handMinimum'?p.hand.cards.length>=op.amount:op.condition==='defenderExOrV'?modernEx(defender)||v(defender):op.condition==='defenderEx'?modernEx(defender):op.condition==='ownBenchDamaged'?p.bench.some((l:any)=>l.getPokemonCard()&&l.damage>0):op.condition==='moreHand'?p.hand.cards.length>o.hand.cards.length:op.condition==='morePrizes'?p.prizes.filter((l:any)=>l.cards.length).length>o.prizes.filter((l:any)=>l.cards.length).length:op.condition==='defenderEvolution'?defender&&defender.stage!==Stage.BASIC:op.condition==='defenderBasic'?defender?.stage===Stage.BASIC:op.condition==='selfEnergyType'?exAttachedEnergy(store,state,p,source).some((e:any)=>StateUtils.providesMatchesType(e.provides,xyTypes[op.energy])):op.condition==='ownBenchType'?p.bench.some((l:any)=>typed(l,op.energy)):op.condition==='emptyHand'?p.hand.cards.length===0:false;
  if(yes)return ctx.run(op.ops,next);
  if(op.failZero)b.damage=0;
  break;
 }
 case 'countDamage':{
  if(op.count==='ownBenchCounters'){b.damage=op.amount*p.bench.filter((l:any)=>typed(l,op.energy)).reduce((n:number,l:any)=>n+l.damage/10,0);break;}
  if(op.count==='opponentHand'){b.damage=(op.add?b.damage:op.base||0)+op.amount*o.hand.cards.length;break;}
  const count=op.count==='opponentPrizesTaken'?o.prizes.filter((l:any)=>!l.cards.length).length:op.count==='opponentDiscardEnergy'?o.discard.cards.filter((c:any)=>c.superType===SuperType.ENERGY).length:op.count==='hand'?p.hand.cards.length:0;
  b.damage=(op.add?b.damage:op.base||0)+op.amount*count;break;
 }
 case 'discardHandDraw':MOVE_CARDS(store,state,p.hand,p.discard,{cards:p.hand.cards.slice(),sourceCard:b._wotcSourceCard||source.getPokemonCard(),sourceEffect:b});DRAW_CARDS(store,state,p,op.amount);break;
 case 'requireBench':if(!(op.opponent?o:p).bench.some((l:any)=>l.getPokemonCard()))throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);break;
 case 'requireAnyBench':if(![...p.bench,...o.bench].some((l:any)=>l.getPokemonCard()))throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);break;
 case 'shuffleHandPlus':return ctx.run([{op:'shuffleHand',amount:p.hand.cards.length+op.amount}],next);
 case 'healChosen':{
  const slots=[{list:p.active,player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0},...p.bench.map((list:any,index:number)=>({list,player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index}))];
  const eligible=slots.filter(s=>s.list.getPokemonCard()&&s.list.damage>0);if(!eligible.length)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_HEAL,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{min:0,max:Math.min(op.max,eligible.length),allowCancel:false,blocked:slots.filter(s=>!eligible.includes(s)).map(({list,...target})=>target)}),(chosen:any)=>{for(const list of chosen||[])store.reduceEffect(state,new HealEffect(p,list,op.amount));next();});
 }
 case 'bothStatus':for(const target of [source,o.active]){const e=new AddSpecialConditionsEffect(b,op.conditions.map((c:string)=>(SpecialCondition as any)[c]));e.target=target;store.reduceEffect(state,e);}break;
 }
 return next();
}

