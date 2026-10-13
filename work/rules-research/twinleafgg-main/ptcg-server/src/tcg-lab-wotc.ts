// Offline WOTC printings and explicitly compiled effects. No natural-language
// interpretation occurs during a match; the build rejects unknown clauses.
import * as sets from './sets';
import { wotcData } from './tcg-lab-wotc-data';
import { wotcPowers } from './tcg-lab-wotc-powers';
import { PokemonCard, TrainerCard, CardList, EnergyCard, CardType, CardTag, PowerType, TrainerType, EnergyType, Stage, SuperType, SpecialCondition, StateUtils, ChoosePokemonPrompt, ChooseCardsPrompt, ShuffleDeckPrompt, ShowCardsPrompt, SelectPrompt, PlayerType, SlotType, GameMessage, GameError } from './game';
import { AttackEffect, EvolveEffect, UseAttackEffect, HealEffect } from './game/store/effects/game-effects';
import { TrainerEffect } from './game/store/effects/play-card-effects';
import { UseStadiumEffect } from './game/store/effects/game-effects';
import { ApplyWeaknessEffect, AfterWeaknessAndResistanceEffect } from './game/store/effects/attack-effects';
import { PlayPokemonFromDeckEffect, PlayPokemonFromDiscardEffect, AttachEnergyEffect } from './game/store/effects/play-card-effects';
import { OrderCardsPrompt } from './game/store/prompts/order-cards-prompt';
import { CheckPokemonAttacksEffect } from './game/store/effects/check-effects';
import { CheckAttackCostEffect } from './game/store/effects/check-effects';
import { ChooseAttackPrompt } from './game/store/prompts/choose-attack-prompt';
import { runDelegatedCopiedAttackGenerator } from './game/store/prefabs/copy-attack-delegation';
import { AfterAttackEffect, EndTurnEffect } from './game/store/effects/game-phase-effects';
import { AddSpecialConditionsEffect, DealDamageEffect, PutDamageEffect, HealTargetEffect, GustOpponentBenchEffect, DiscardCardsFromOpponentsActivePokemonEffect, MoveOpponentEnergyEffect, AddMarkerEffect } from './game/store/effects/attack-effects';
import { CheckHpEffect, CheckProvidedEnergyEffect, CheckPokemonTypeEffect, CheckRetreatCostEffect, AddSpecialConditionsPowerEffect } from './game/store/effects/check-effects';
import { PutCountersEffect, AfterDamageEffect, RemoveSpecialConditionsEffect } from './game/store/effects/attack-effects';
import { SwapDamageCountersEffect } from './game/store/effects/attack-effects';
import { DefendingPokemonTakesMoreDamageDuringAttackerNextTurnEffect } from './game/store/effects/effect-of-attack-effects';
import { PreventRetreatWhileActiveEffect } from './game/store/effects/effect-of-attack-effects';
import { PlayLockEffect, SurviveOnTenHpDuringOpponentsNextTurnEffect, CoinFlipPreventAttackDamageDuringOpponentsNextTurnEffect, CannotAttachEnergyFromHandToDefendingNextTurnEffect } from './game/store/effects/effect-of-attack-effects';
import { COIN_FLIP_PROMPT, MULTIPLE_COIN_FLIPS_PROMPT, FLIP_UNTIL_TAILS_AND_COUNT_HEADS, DRAW_CARDS, SWITCH_ACTIVE_WITH_BENCHED, MOVE_POKEMON_OFF_BOARD, MOVE_CARDS } from './game/store/prefabs/prefabs';
const types:any={Fire:CardType.FIRE,Grass:CardType.GRASS,Water:CardType.WATER,Lightning:CardType.LIGHTNING,Psychic:CardType.PSYCHIC,Fighting:CardType.FIGHTING,Colorless:CardType.COLORLESS,Darkness:CardType.DARK,Metal:CardType.METAL};
const codes:any={base1:'BS',base2:'JU',base3:'FO',base4:'B2',base5:'TR',gym1:'G1',gym2:'G2',neo1:'N1',neo2:'N2',neo3:'N3',neo4:'N4',si1:'SI',base6:'LC',ecard1:'EX',ecard2:'AQ',ecard3:'SK',basep:'PR',bp:'BOP'};
const originals=new Map(Object.values(sets).filter(Array.isArray).flat().map((c:any)=>[c.fullName,c]));
for(const card of originals.values() as any)if(card.set==='N4'&&card.name.startsWith('Shining '))card._wotcMaxCopies=1;
const supplemental:any[]=(sets as any).setIlexWotc;
const attackContexts=new WeakMap<object,any>();
function baseAttack(e:any){if(e instanceof AttackEffect)return e;return new AttackEffect(e.player,e.opponent,e.attack);}
function run(store:any,state:any,e:any,ops:any[],done:()=>void=()=>{}){
 if(!ops.length){done();return state;}let [op,...rest]=ops;const b=baseAttack(e),p=e.player,o=e.opponent,source=b.source;
 b._wotcSourceCard??=source.getPokemonCard();
 const next=()=>run(store,state,e,rest,done);
 if(!b._wotcTrainer&&!b._wotcAfterPhase&&(op.after||op.op==='status')){b._wotcAfterOps??=[];b._wotcAfterOps.push({...op,after:false});return next();}
 const shuffle=(owner:any,finish:()=>void=next)=>store.prompt(state,new ShuffleDeckPrompt(owner.id),(order:any)=>{owner.deck.applyOrder(order);finish();});
 const provided=(list:any,owner:any)=>{const energy=new CheckProvidedEnergyEffect(owner,list);store.reduceEffect(state,energy);return energy.energyMap;};
 const energyUnits=(list:any,owner:any,type?:string)=>provided(list,owner).reduce((n:number,x:any)=>n+(!type||StateUtils.providesMatchesType(x.provides,types[type])?StateUtils.getProvidesUnitCount(x.provides):0),0);
 const damage=(list:any,amount:number,recoil=false)=>{const d=recoil?new DealDamageEffect(b,amount):new PutDamageEffect(b,amount);d.target=list;store.reduceEffect(state,d);};
 const heal=(list:any,amount:number)=>{if(b._wotcTrainer)return store.reduceEffect(state,new HealEffect(StateUtils.findOwner(state,list),list,amount));const h=new HealTargetEffect(b,amount);h.target=list;return store.reduceEffect(state,h);};
 switch(op.op){
 case 'birthdayDamage':return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,["It isn't my birthday","It's my birthday"],{allowCancel:false}),(choice:any)=>{b.damage=op.base;if(choice===1)COIN_FLIP_PROMPT(store,state,p,heads=>{b.damage=heads?op.heads:op.base;next();});else next();});
 case 'returnSelective':{const cards=source.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&(!op.basic||c.energyType===EnergyType.BASIC));MOVE_CARDS(store,state,source,p.hand,{cards,sourceCard:b._wotcSourceCard,sourceEffect:b});MOVE_POKEMON_OFF_BOARD(store,state,source,{pokemonDestination:p.hand,attachedDestination:p.discard,sourceCard:b._wotcSourceCard,sourceEffect:b});break;}
 case 'moveSelfEnergy':case 'attachZoneEnergy':{
  const zone=op.op==='moveSelfEnergy'?source:op.zone==='hand'?p.hand:p.discard,cards=op.op==='moveSelfEnergy'?provided(source,p).filter((x:any)=>x.card.superType===SuperType.ENERGY&&(!op.energy||x.provides.includes(types[op.energy])||x.provides.includes(CardType.ANY))).map((x:any)=>x.card):zone.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&(!op.basic||c.energyType===EnergyType.BASIC)&&(!op.energy||c.provides.includes(types[op.energy]))),count=Math.min(op.amount,cards.length),bench=op.op==='moveSelfEnergy',slots=[...(!bench?[{player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0,list:p.active}]:[]),...p.bench.map((list:any,index:number)=>({player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index,list}))],eligible=slots.filter((s:any)=>{if(!s.list.getPokemonCard())return false;if(op.targetType){const type=new CheckPokemonTypeEffect(s.list);store.reduceEffect(state,type);return type.cardTypes.includes(types[op.targetType]);}return true;});if(!count||!eligible.length&&!op.discardIfNoBench)break;
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_ATTACH,zone,{superType:SuperType.ENERGY},{min:op.optional?0:count,max:count,allowCancel:false,blocked:zone.cards.map((c:any,i:number)=>cards.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{if(!chosen?.length)return next();if(!eligible.length){MOVE_CARDS(store,state,zone,p.discard,{cards:chosen,sourceCard:b._wotcSourceCard,sourceEffect:b});return next();}let sameTarget:any;const attach=(index:number)=>{if(index>=chosen.length)return next();const put=(target:any)=>{sameTarget=target;if(zone===p.hand)store.reduceEffect(state,new AttachEnergyEffect(p,chosen[index],target));else MOVE_CARDS(store,state,zone,target,{cards:[chosen[index]],sourceCard:b._wotcSourceCard,sourceEffect:b});attach(index+1);};if(op.sameTarget&&sameTarget)return put(sameTarget);store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,bench?[SlotType.BENCH]:[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:slots.filter((s:any)=>!eligible.includes(s)).map(({list,...target}:any)=>target)}),(target:any)=>put(target[0]));};attach(0);});
 }
 case 'cardFlipGame':{const prizes=o.prizes.map((list:any,index:number)=>({list,index})).filter((s:any)=>s.list.cards.length&&!s.list.faceUpPrize);if(!prizes.length)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,prizes.map((s:any)=>'Opponent prize '+(s.index+1)),{allowCancel:false}),(index:any)=>{const prize=prizes[index].list;store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Energy','Trainer','Pokemon'],{allowCancel:false}),(guess:any)=>{prize.faceUpPrize=true;prize.isPublic=true;const correct=guess===0?prize.cards[0].superType===SuperType.ENERGY:guess===1?prize.cards[0].superType===SuperType.TRAINER:prize.cards[0].superType===SuperType.POKEMON;store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,prize.cards),()=>{if(correct)DRAW_CARDS(store,state,p,2);next();});});});}
 case 'quizCategory':if(!p.hand.cards.length)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,p.hand,{}, {min:1,max:1,allowCancel:false}),(chosen:any)=>store.prompt(state,new SelectPrompt(o.id,GameMessage.CHOOSE_OPTION,['Energy','Trainer','Pokemon'],{allowCancel:false}),(guess:any)=>{const correct=guess===0?chosen[0].superType===SuperType.ENERGY:guess===1?chosen[0].superType===SuperType.TRAINER:chosen[0].superType===SuperType.POKEMON;store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,chosen),()=>{DRAW_CARDS(store,state,correct?o:p,2);next();});}));
 case 'replaceOpponentPrizes':{const prizes=o.prizes.filter((l:any)=>l.cards.length),cards=prizes.flatMap((l:any)=>l.cards);if(!cards.length)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);return store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,cards),()=>store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Keep opponent prizes','Replace opponent prizes'],{allowCancel:false}),(choice:any)=>{if(choice!==1)return next();for(const list of prizes){list.moveTo(o.deck);list.faceUpPrize=false;list.isPublic=false;}shuffle(o,()=>{for(const list of prizes)o.deck.moveCardsTo(o.deck.cards.slice(0,1),list);next();});}));}
 case 'prizeWish':{const prizes=p.prizes.map((list:any,index:number)=>({list,index})).filter((s:any)=>s.list.cards.length);if(!prizes.length)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,prizes.map((s:any)=>'Prize '+(s.index+1)),{allowCancel:false}),(index:any)=>{const prize=prizes[index].list;store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,prize.cards),()=>store.prompt(state,new SelectPrompt(o.id,GameMessage.CHOOSE_OPTION,['Allow prize swap','Decline prize swap'],{allowCancel:false}),(choice:any)=>{if(choice===1){DRAW_CARDS(store,state,p,1);return next();}if(!p.hand.cards.length)return next();store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,p.hand,{}, {min:1,max:1,allowCancel:false}),(chosen:any)=>{const old=prize.cards.slice();prize.moveCardsTo(old,p.hand);p.hand.moveCardsTo(chosen,prize);next();});}));});}
 case 'copyAttack':{
  const copycat=source.getPokemonCard(),cards=(op.previousStages?source.getPokemons().filter((c:any)=>c!==copycat):op.allOpponent?[o.active,...o.bench].map((l:any)=>l.getPokemonCard()):[o.active.getPokemonCard()]).filter(Boolean);if(!cards.some((c:any)=>c.attacks?.length))break;
  b.damage=0;return store.prompt(state,new ChooseAttackPrompt(p.id,GameMessage.CHOOSE_ATTACK_TO_COPY,cards,{allowCancel:false}),(attack:any)=>{if(!attack)return next();const original=cards.find((c:any)=>c.attacks.includes(attack));if(op.payEnergy){const energy=new CheckProvidedEnergyEffect(p,source),cost=new CheckAttackCostEffect(p,attack);store.reduceEffect(state,energy);store.reduceEffect(state,cost);if(!StateUtils.checkEnoughEnergy(energy.energyMap,cost.cost))return next();}
   if((copycat._wotcCopyDepth||0)>=16)throw new GameError(GameMessage.CANNOT_USE_ATTACK);copycat._wotcCopyDepth=(copycat._wotcCopyDepth||0)+1;const generator=runDelegatedCopiedAttackGenerator(advance,{store,state,player:p,opponent:o,copycatCard:copycat,sourceCard:original,selectedAttack:attack,sourceSlot:source});function advance(){const result=generator.next();if(result.done){copycat._wotcCopyDepth--;next();}return result.value;}advance();
  });
 }
 case 'requireOwnBenchSpace':if(!p.bench.some((l:any)=>!l.cards.length))throw new GameError(GameMessage.CANNOT_USE_ATTACK);break;
 case 'reviveBasic':{const owner=op.opponent?o:p,empty=owner.bench.filter((l:any)=>!l.cards.length);if(!empty.length){if(op.requireSpace)throw new GameError(GameMessage.CANNOT_USE_ATTACK);break;}const eligible=owner.discard.cards.filter((c:any)=>c.superType===SuperType.POKEMON&&c.stage===Stage.BASIC);if(!eligible.length)break;return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,owner.discard,{superType:SuperType.POKEMON,stage:Stage.BASIC},{min:1,max:1,allowCancel:false}),(chosen:any)=>{const slots=owner.bench.map((list:any,index:number)=>({list,index})).filter((s:any)=>!s.list.cards.length);store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,slots.map((s:any)=>'Bench '+(s.index+1)),{allowCancel:false}),(index:any)=>{const target=slots[index].list;store.reduceEffect(state,new PlayPokemonFromDiscardEffect(owner,chosen[0],target));if(op.amount){const counters=new PutCountersEffect(b,op.amount);counters.target=target;store.reduceEffect(state,counters);}next();});});}
 case 'evolveChosen':case 'bothEvolveChosen':{
  const owners=op.op==='bothEvolveChosen'?[o,p]:[p],chooseOwner=(ownerIndex:number)=>{if(ownerIndex>=owners.length)return next();const owner=owners[ownerIndex],slots=[{player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0,list:owner.active},...owner.bench.map((list:any,index:number)=>({player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index,list}))],eligible=slots.filter((s:any)=>s.list.getPokemonCard()&&(!op.names||op.names.includes(s.list.getPokemonCard().name)));if(!eligible.length)return chooseOwner(ownerIndex+1);
   store.prompt(state,new ChoosePokemonPrompt(owner.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{min:0,max:Math.min(op.amount||1,eligible.length),allowCancel:false,blocked:slots.filter((s:any)=>!eligible.includes(s)).map(({list,...target}:any)=>target)}),(selected:any)=>{if(!selected?.length)return chooseOwner(ownerIndex+1);const evolve=(index:number)=>{if(index>=selected.length)return shuffle(owner,()=>chooseOwner(ownerIndex+1));const target=selected[index],cards=owner.deck.cards.filter((c:any)=>c.superType===SuperType.POKEMON&&c.evolvesFrom===target.getPokemonCard().name);if(!cards.length)return evolve(index+1);store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_HAND,owner.deck,{superType:SuperType.POKEMON},{min:0,max:1,allowCancel:false,blocked:owner.deck.cards.map((c:any,i:number)=>cards.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{if(chosen?.length){owner.deck.moveCardsTo(chosen,owner.hand);store.reduceEffect(state,new EvolveEffect(owner,target,chosen[0]));}evolve(index+1);});};evolve(0);});};chooseOwner(0);return state;
 }
 case 'chooseEnergyFieldDamage':return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,Object.keys(types).filter(t=>t!=='Colorless'),{allowCancel:false}),(index:any)=>{const energy=Object.keys(types).filter(t=>t!=='Colorless')[index];b.damage=0;b.ignoreWeakness=true;b.ignoreResistance=true;for(const list of [o.active,...o.bench])if(list.getPokemonCard()&&provided(list,o).some((x:any)=>x.card.superType===SuperType.ENERGY&&(x.provides.includes(types[energy])||x.provides.includes(CardType.ANY))))damage(list,op.amount);next();});
 case 'handToDeckSearch':if(!p.hand.cards.length)return shuffle(p);return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,p.hand,{}, {min:0,max:Math.min(op.amount,p.hand.cards.length),allowCancel:false}),(chosen:any)=>{p.hand.moveCardsTo(chosen||[],p.deck);p.deck.cards=[...(chosen||[]),...p.deck.cards.filter((c:any)=>!chosen?.includes(c))];run(store,state,e,chosen?.length?[{op:'search',category:'BasicEnergy',amount:chosen.length}]:[{op:'shuffle'}],next);});
 case 'recoverMixed':{const eligible=p.discard.cards.filter((c:any)=>c.superType===SuperType.POKEMON||c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC);if(!eligible.length)break;return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,p.discard,{}, {min:1,max:1,allowCancel:false,blocked:p.discard.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{p.discard.moveCardsTo(chosen,p.hand);store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,chosen),next);});}
 case 'healBenchEnergyCards':{const amount=op.amount*provided(source,p).filter((x:any)=>x.card.superType===SuperType.ENERGY&&(x.provides.includes(types[op.energy])||x.provides.includes(CardType.ANY))).length;if(!amount||!p.bench.some((l:any)=>l.getPokemonCard()))break;return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_HEAL,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{allowCancel:false}),(chosen:any)=>{heal(chosen[0],amount);next();});}
 case 'healFieldSameType':{const ownType=new CheckPokemonTypeEffect(source);store.reduceEffect(state,ownType);for(const owner of state.players)for(const list of [owner.active,...owner.bench])if(list.getPokemonCard()){const type=new CheckPokemonTypeEffect(list);store.reduceEffect(state,type);if(type.cardTypes.some((t:any)=>ownType.cardTypes.includes(t)))heal(list,op.amount);}break;}
 case 'globalPowerLock':state.wotcGlobalPowerLockUntilTurn=state.turn+op.turns;state.wotcHasPowerLocks=true;break;
 case 'ifDealtDamage':if(b._wotcSourceCard?._wotcLastAttackDamage)return run(store,state,e,op.ops,next);break;
 case 'recoilEnergy':damage(source,op.amount*energyUnits(source,p,op.energy),true);break;
 case 'shiftOwnCounters':{const lists=[p.active,...p.bench].filter((l:any)=>l.getPokemonCard()&&l.damage),counters=new PutCountersEffect(b,lists.length*10);store.reduceEffect(state,counters);if(!counters.preventDefault)for(const list of lists)list.damage-=10;break;}
 case 'onceInPlay':{const card=source.getPokemonCard();card._wotcUsedAttacks??=[];if(card._wotcUsedAttacks.includes(b.attack.name))throw new GameError(GameMessage.BLOCKED_BY_EFFECT);card._wotcUsedAttacks.push(b.attack.name);break;}
 case 'ifDefenderSurvives':{const hp=new CheckHpEffect(o,o.active);store.reduceEffect(state,hp);if(o.active.damage<hp.hp)return run(store,state,e,op.ops,next);break;}
 case 'returnOwnPokemon':{const count=[p.active,...p.bench].filter((l:any)=>l.getPokemonCard()).length;return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_SWITCH,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{min:0,max:count,allowCancel:false}),(chosen:any)=>{for(const list of chosen||[])MOVE_POKEMON_OFF_BOARD(store,state,list,{pokemonDestination:p.hand,attachedDestination:p.hand,sourceCard:b._wotcSourceCard,sourceEffect:b});next();});}
 case 'returnOwnBench':if(p.bench.some((l:any)=>l.getPokemonCard()))return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_SWITCH,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{allowCancel:false}),(chosen:any)=>{MOVE_POKEMON_OFF_BOARD(store,state,chosen[0],{pokemonDestination:p.deck,attachedDestination:p.deck,sourceCard:b._wotcSourceCard,sourceEffect:b});shuffle(p);});break;
 case 'persistentDefenderLock':store.reduceEffect(state,new AddMarkerEffect(b,op.marker,source.getPokemonCard()));break;
 case 'endTurn':store.reduceEffect(state,new EndTurnEffect(p));break;
 case 'returnOpponentBench':if(o.bench.some((l:any)=>l.getPokemonCard()))return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_SWITCH,PlayerType.TOP_PLAYER,[SlotType.BENCH],{allowCancel:false}),(chosen:any)=>{MOVE_POKEMON_OFF_BOARD(store,state,chosen[0],{pokemonDestination:o.hand,attachedDestination:o.hand,sourceCard:b._wotcTrainerCard,sourceEffect:b});next();});break;
 case 'untilReturnEnergy':return FLIP_UNTIL_TAILS_AND_COUNT_HEADS(store,state,p,heads=>{const cards=o.active.cards.filter((c:any)=>c.superType===SuperType.ENERGY),count=Math.min(heads,cards.length);if(!count)return next();store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,o.active,{superType:SuperType.ENERGY},{min:count,max:count,allowCancel:false}),(chosen:any)=>{MOVE_CARDS(store,state,o.active,o.hand,{cards:chosen,sourceCard:b._wotcTrainerCard,sourceEffect:b});next();});});
 case 'arcadeGame':{const cards=p.deck.cards.slice(0,3);if(!cards.length)break;return store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,cards),()=>{const repeated=cards.filter((c:any)=>cards.filter((x:any)=>x.name===c.name).length>=2);p.deck.moveCardsTo(repeated,p.hand);shuffle(p);});}
 case 'energyAmplifier':if(!p.hand.cards.some((c:any)=>c.superType===SuperType.ENERGY))throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,p.hand,{superType:SuperType.ENERGY},{min:1,max:1,allowCancel:false}),(chosen:any)=>store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,chosen),()=>{p.hand.moveCardsTo(chosen,p.deck);shuffle(p,()=>COIN_FLIP_PROMPT(store,state,p,heads=>heads?run(store,state,e,[{op:'search',category:'BasicEnergy',amount:3}],next):next()));}));
 case 'attachDeckEnergy':{
  const count=op.amount??[p.active,...p.bench,o.active,...o.bench].filter((l:any)=>l.getPokemonCard()?.name===op.countFromNamed).length,targets=[...(op.bench?[]:[p.active]),...p.bench].filter((l:any)=>{if(!l.getPokemonCard()||op.toSelf&&l!==source)return false;if(op.targetType){const type=new CheckPokemonTypeEffect(l);store.reduceEffect(state,type);return type.cardTypes.includes(types[op.targetType]);}return true;});
  const finish=()=>op.noShuffle?next():shuffle(p);if(!count||!targets.length)return finish();const cards=p.deck.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&(!op.basic||c.energyType===EnergyType.BASIC)&&(!op.energy||c.provides?.includes(types[op.energy])));if(!cards.length)return finish();
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_ATTACH,p.deck,{superType:SuperType.ENERGY,...(op.basic?{energyType:EnergyType.BASIC}:{})},{min:0,max:Math.min(count,cards.length),allowCancel:false,blocked:p.deck.cards.map((c:any,i:number)=>cards.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{
   const attach=(index:number)=>{if(index>=chosen.length)return finish();const put=(target:any)=>{MOVE_CARDS(store,state,p.deck,target,{cards:[chosen[index]],sourceCard:source.getPokemonCard(),sourceEffect:b});attach(index+1);};if(op.toSelf)return put(source);const slots=[{player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0,list:p.active},...p.bench.map((list:any,index:number)=>({player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index,list}))];store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,op.bench?[SlotType.BENCH]:[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:slots.filter((s:any)=>!targets.includes(s.list)).map(({list,...target}:any)=>target)}),(selected:any)=>put(selected[0]));};attach(0);
  });
 }
 case 'linkedDefense':{if(op.maxHp){const hp=new CheckHpEffect(o,o.active);store.reduceEffect(state,hp);if(hp.hp>op.maxHp)break;}const card=source.getPokemonCard(),marker='WOTC_LINKED_'+b.attack.name,probe=new AddMarkerEffect(b,marker,card);store.reduceEffect(state,probe);if(probe.markerAdded){source.marker.addMarker(marker,card);card._wotcLinkedDefense={marker,turn:state.turn+1,reduction:op.reduction,noAttack:op.noAttack};}break;}
 case 'defenderDamageReduction':{const probe=new AddMarkerEffect(b,'WOTC_DAMAGE_REDUCTION',source.getPokemonCard());store.reduceEffect(state,probe);if(probe.markerAdded)o.active.attackDamageReductionNextTurn=op.amount;break;}
 case 'retreatIncrease':{const probe=new AddMarkerEffect(b,'WOTC_RETREAT_INCREASE',source.getPokemonCard());store.reduceEffect(state,probe);if(probe.markerAdded)o.active.retreatCostIncreaseNextTurn=op.amount;break;}
 case 'preventDamageThreshold':source.preventDamageNextTurnPending={maxDamage:op.max};break;
 case 'setupBaseDamage':{const attack=source.getPokemonCard().attacks.find((a:any)=>a.name===op.attackName);if(attack)source.nextTurnAttackBaseDamagePending={setupAttackName:b.attack.name,attackName:op.attackName,baseDamage:op.double?attack.damage*2:op.amount,sourceCardName:source.getPokemonCard().fullName};break;}
 case 'untilMill':return FLIP_UNTIL_TAILS_AND_COUNT_HEADS(store,state,p,heads=>{o.deck.moveCardsTo(o.deck.cards.slice(0,heads*op.amount),o.discard);next();});
 case 'healEnergyUnits':heal(source,op.amount*energyUnits(source,p));break;
 case 'fieldDiscardAttack':{
  const lists=[p.active,...p.bench].filter((l:any)=>l.getPokemonCard()),eligible=(list:any)=>provided(list,p).filter((x:any)=>x.card.superType===SuperType.ENERGY&&(!op.energy||x.provides.includes(types[op.energy])||x.provides.includes(CardType.ANY))).map((x:any)=>x.card);let count=0;
  const choose=(index:number)=>{if(index>=lists.length){if(op.perHead!==undefined){if(!count){b.damage=op.base;return next();}return MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,count,(results:boolean[])=>{b.damage=op.base+op.perHead*results.filter(Boolean).length;next();});}b.damage=op.base+op.perCard*count;return next();}
   const list=lists[index],cards=eligible(list);if(!cards.length)return choose(index+1);store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,list,{superType:SuperType.ENERGY},{min:0,max:cards.length,allowCancel:false,blocked:list.cards.map((c:any,i:number)=>cards.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{count+=chosen?.length||0;list.moveCardsTo(chosen||[],p.discard);choose(index+1);});};choose(0);return state;
 }
 case 'ifDefenderEnergy':if(o.active.cards.some((c:any)=>c.superType===SuperType.ENERGY))return run(store,state,e,op.ops,next);break;
 case 'defenderTypeBonus':{const type=new CheckPokemonTypeEffect(o.active);store.reduceEffect(state,type);if(type.cardTypes.includes(types[op.energy]))b.damage=op.damage;break;}
 case 'chooseOrderTop':return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Your deck',"Opponent's deck"],{allowCancel:false}),(choice:any)=>run(store,state,e,[{op:choice===1?'orderOpponentTop':'orderTop',amount:op.amount}],next));
 case 'discardToTop':{const owner=op.opponent?o:p;if(!owner.discard.cards.length)break;return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,owner.discard,{}, {min:1,max:1,allowCancel:false}),(chosen:any)=>{owner.discard.moveCardsTo(chosen,owner.deck);owner.deck.cards=[...chosen,...owner.deck.cards.filter((c:any)=>!chosen.includes(c))];next();});}
 case 'inspectTopTrainer':{const card=o.deck.cards[0];if(!card)break;const finish=()=>{if(card.superType===SuperType.TRAINER)o.deck.moveCardsTo([card],o.discard);else if(op.otherwiseHand)o.deck.moveCardsTo([card],o.hand);next();};return store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,[card]),()=>op.private?finish():store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,[card]),finish));}
 case 'bothRecover':{const recover=(owner:any,finish:()=>void)=>{const eligible=owner.discard.cards.filter((c:any)=>op.category!=='Pokemon'||c.superType===SuperType.POKEMON);if(!eligible.length)return finish();store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_HAND,owner.discard,op.category==='Pokemon'?{superType:SuperType.POKEMON}:{},{min:0,max:Math.min(op.amount,eligible.length),allowCancel:false}),(chosen:any)=>{owner.discard.moveCardsTo(chosen||[],op.toDeck?owner.deck:owner.hand);if(op.toDeck&&chosen?.length)return shuffle(owner,finish);finish();});};recover(o,()=>recover(p,next));return state;}
 case 'discardFieldTrainers':for(const list of [o.active,...o.bench]){const cards=list.cards.filter((c:any)=>c.superType===SuperType.TRAINER);if(cards.length){const discard=new DiscardCardsFromOpponentsActivePokemonEffect(b,cards);discard.target=list;store.reduceEffect(state,discard);}}break;
 case 'discardFieldEnergy':{const lists=[o.active,...o.bench].filter((l:any)=>l.getPokemonCard()&&l.cards.some((c:any)=>c.superType===SuperType.ENERGY));const choose=(index:number)=>{if(index>=lists.length)return next();const list=lists[index];store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,list,{superType:SuperType.ENERGY},{min:1,max:1,allowCancel:false}),(chosen:any)=>{const discard=new DiscardCardsFromOpponentsActivePokemonEffect(b,chosen);discard.target=list;store.reduceEffect(state,discard);choose(index+1);});};choose(0);return state;}
 case 'ownPokemonDamage':b.damage=op.amount*[p.active,...p.bench].filter((l:any)=>l.getPokemonCard()).length;break;
 case 'namedBenchBonus':b.damage=op.base+(p.bench.some((l:any)=>l.getPokemonCard()?.name===op.name)?op.amount:0);break;
 case 'ifDarkDefender':{const type=new CheckPokemonTypeEffect(o.active);store.reduceEffect(state,type);if(o.active.getPokemonCard()?.name.includes('Dark')||type.cardTypes.includes(CardType.DARK))return run(store,state,e,op.ops,next);break;}
 case 'statusSetDamage':b.damage=op.base+(op.conditions.some((c:string)=>o.active.specialConditions.includes((SpecialCondition as any)[c]))?op.bonus:0);break;
 case 'removeDefenderConditions':store.reduceEffect(state,new RemoveSpecialConditionsEffect(b,op.conditions.map((c:string)=>(SpecialCondition as any)[c])));break;
 case 'ifOwnBench':if(p.bench.some((l:any)=>l.getPokemonCard()))return run(store,state,e,op.ops,next);break;
 case 'bothMillDamage':{let count=0;for(const owner of [p,o]){const card=owner.deck.cards[0];if(card){if(card.superType===SuperType.ENERGY&&card.provides?.includes(types[op.energy]))count++;owner.deck.moveCardsTo([card],owner.discard);}}b.damage=op.base+count*op.amount;break;}
 case 'fieldCounters':for(const list of [o.active,...o.bench])if(list.getPokemonCard()&&(!op.damaged||list.damage)){const d=new PutCountersEffect(b,op.amount);d.target=list;store.reduceEffect(state,d);}break;
 case 'fieldCoinDamage':{b.damage=0;b.ignoreWeakness=true;b.ignoreResistance=true;const lists=[...(op.both?[p.active,...p.bench]:[]),o.active,...o.bench].filter((l:any)=>l.getPokemonCard());if(!lists.length)break;return MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,lists.length,(results:boolean[])=>{lists.forEach((list:any,index:number)=>{if(results[index])damage(list,op.amount);});next();});}
 case 'fieldDamage':{
  const defenderType=new CheckPokemonTypeEffect(o.active);if(op.defenderType)store.reduceEffect(state,defenderType);
  const lists=[...(op.both?[...(!op.bench?[p.active]:[]),...p.bench]:[]),...(!op.bench?[o.active]:[]),...o.bench];
  if(!op.bench){b.damage=0;b.ignoreWeakness=true;b.ignoreResistance=true;}
  for(const list of lists){const card=list.getPokemonCard();if(!card||op.excludeSelf&&list===source)continue;if(op.pokePowerOrBody&&!card.powers.some((power:any)=>power.powerType===PowerType.POKEPOWER||power.powerType===PowerType.POKEBODY))continue;
   if(op.excludeType||op.defenderType){const type=new CheckPokemonTypeEffect(list);store.reduceEffect(state,type);if(op.excludeType&&type.cardTypes.includes(types[op.excludeType]))continue;if(op.defenderType&&!type.cardTypes.some((t:any)=>defenderType.cardTypes.includes(t)))continue;}damage(list,op.amount);
  }break;
 }
 case 'defenderPowerLock':{
  if(op.onlyPokePower){const lock=new AddMarkerEffect(b,'WOTC_POKEPOWER_LOCK',source.getPokemonCard());store.reduceEffect(state,lock);if(lock.markerAdded){o.active.wotcPokePowerLockUntilTurn=state.turn+op.turns;state.wotcHasPokePowerLocks=true;}}
  else if(o.active.getPokemonCard()?.powers.length){const lock=new AddMarkerEffect(b,'WOTC_STARE_POWER_LOCK',source.getPokemonCard());store.reduceEffect(state,lock);if(lock.markerAdded){o.active.wotcPowerLockUntilTurn=state.turn+op.turns;state.wotcHasPowerLocks=true;}}
  break;
 }
 case 'playLock':store.reduceEffect(state,new PlayLockEffect(b,op.locks));break;
 case 'surviveTen':store.reduceEffect(state,new SurviveOnTenHpDuringOpponentsNextTurnEffect(b));break;
 case 'coinDamageGuard':store.reduceEffect(state,new CoinFlipPreventAttackDamageDuringOpponentsNextTurnEffect(b));break;
 case 'noActiveHandEnergy':o.wotcActiveHandEnergyLockUntilTurn=state.turn+1;break;
 case 'noDefenderEnergy':store.reduceEffect(state,new CannotAttachEnergyFromHandToDefendingNextTurnEffect(b));break;
 case 'noRetreatWhileActive':store.reduceEffect(state,new PreventRetreatWhileActiveEffect(b));break;
 case 'bypassDefender':b.ignoreWeakness=true;b.ignoreResistance=true;b.wotcBypassDefender=true;break;
 case 'requireDamage':if(source.damage<op.amount)throw new GameError(GameMessage.CANNOT_USE_ATTACK);break;
 case 'countersToTen':{const hp=new CheckHpEffect(o,o.active);store.reduceEffect(state,hp);store.reduceEffect(state,new PutCountersEffect(b,Math.max(0,hp.hp-10-o.active.damage)));break;}
 case 'namedBenchDamage':b.damage=op.base+op.amount*p.bench.filter((l:any)=>op.names.includes(l.getPokemonCard()?.name)).length;break;
 case 'ownBenchDamage':b.damage=op.amount*p.bench.filter((l:any)=>l.getPokemonCard()).length;break;
 case 'ownBenchRecoil':damage(source,op.amount*p.bench.filter((l:any)=>l.getPokemonCard()).length,true);break;
 case 'healDefender':heal(o.active,op.amount);break;
 case 'discardPileDamage':b.damage=op.base+op.amount*p.discard.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC&&c.provides.includes(types[op.energy])).length;break;
 case 'shuffleDiscardEnergy':p.discard.moveCardsTo(p.discard.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC&&c.provides.includes(types[op.energy])),p.deck);return shuffle(p);
 case 'allOpponentEnergyDamage':b.damage=0;b.ignoreWeakness=true;b.ignoreResistance=true;for(const list of [o.active,...o.bench])if(list.getPokemonCard())damage(list,op.amount*list.cards.filter((c:any)=>c.superType===SuperType.ENERGY).length);break;
 case 'opponentPokemonCoins':{b.damage=0;b.ignoreWeakness=true;b.ignoreResistance=true;const lists=[o.active,...o.bench].filter((l:any)=>l.getPokemonCard());return MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,lists.length,(results:boolean[])=>{for(let i=0;i<lists.length;i++)if(results[i])damage(lists[i],op.amount);next();});}
 case 'moreDefenderEnergyDamage':b.damage=op.base+(energyUnits(o.active,o)>energyUnits(source,p)?op.bonus:0);break;
 case 'ifSelfCondition':if(source.specialConditions.includes((SpecialCondition as any)[op.condition]))return run(store,state,e,op.ops,next);break;
 case 'damagedOwnDamage':b.damage=op.base+op.amount*[p.active,...p.bench].filter((l:any)=>l.getPokemonCard()&&l.damage>0).length;break;
 case 'bothEnergyDamage':b.damage=op.amount*(energyUnits(source,p)+energyUnits(o.active,o));break;
 case 'spreadCoins':{const lists=[...(op.both?p.bench:[]),...o.bench].filter((l:any)=>l.getPokemonCard());if(!lists.length)break;return MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,lists.length,(results:boolean[])=>{for(let i=0;i<lists.length;i++)if(results[i])damage(lists[i],op.amount);next();});}
 case 'halfNextDamage':source.marker.addMarker('WOTC_HALF_ATTACK_DAMAGE',source.getPokemonCard());source.wotcHalfAttackDamageUntilTurn=state.turn+1;break;
 case 'swapDamage':store.reduceEffect(state,new SwapDamageCountersEffect(b));break;
 case 'damageLessOwn':b.damage=Math.max(0,op.base-source.damage);break;
 case 'optionalOps':return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Skip optional effect','Use optional effect'],{allowCancel:false}),(choice:any)=>choice===1?run(store,state,e,op.ops,next):next());
 case 'selfCounters':{const d=new PutCountersEffect(b,op.amount);d.target=source;store.reduceEffect(state,d);break;}
 case 'ownActiveDamage':damage(source,op.amount,true);break;
 case 'energyUnitsDamage':b.damage=op.base+op.amount*energyUnits(op.opponent?o.active:source,op.opponent?o:p,op.energy);break;
 case 'damagedDamage':b.damage=o.active.damage?op.damaged:op.undamaged;break;
 case 'discardStadium':for(const owner of state.players)owner.stadium.moveTo(owner.discard);break;
 case 'discardDefenderTrainers':{const cards=o.active.cards.filter((c:any)=>c.superType===SuperType.TRAINER);if(cards.length)store.reduceEffect(state,new DiscardCardsFromOpponentsActivePokemonEffect(b,cards));break;}
 case 'clearDefenderConditions':store.reduceEffect(state,new RemoveSpecialConditionsEffect(b,op.conditions.map((c:string)=>(SpecialCondition as any)[c])));break;
 case 'chooseStatus':return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_SPECIAL_CONDITION,op.conditions,{allowCancel:false}),(chosen:any)=>run(store,state,e,[{op:'status',conditions:[op.conditions[chosen]]}],next));
 case 'coinTable':return MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,op.count,(results:boolean[])=>run(store,state,e,op.branches[results.filter(Boolean).length],next));
 case 'searchFlips':return MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,op.count,(results:boolean[])=>{const count=results.filter(Boolean).length;run(store,state,e,count?[{op:'search',category:op.category,amount:count}]:[{op:'shuffle'}],next);});
 case 'clearConditions':source.specialConditions=source.specialConditions.filter((c:any)=>!op.conditions.includes((SpecialCondition as any)[c]));source.poisonDamage=10;source.burnDamage=20;break;
 case 'orderTop':{const top=new CardList();top.cards=p.deck.cards.slice(0,op.amount);if(!top.cards.length)break;return store.prompt(state,new OrderCardsPrompt(p.id,GameMessage.CHOOSE_CARDS_ORDER,top,{allowCancel:false}),(order:any)=>{p.deck.cards=[...order.map((i:number)=>top.cards[i]),...p.deck.cards.slice(top.cards.length)];next();});}
 case 'chooseHealCoins':return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_HEAL,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false}),(chosen:any)=>{MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,op.count,(results:boolean[])=>{heal(chosen[0],results.filter(Boolean).length*op.amount);next();});});
 case 'discardHandCost':{
  if(p.hand.cards.length<op.amount)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_DISCARD,p.hand,{}, {min:op.amount,max:op.amount,allowCancel:false}),(chosen:any)=>{p.hand.moveCardsTo(chosen,p.discard);next();});
 }
 case 'discardHandDraw':{
  const count=p.hand.cards.filter((c:any)=>!op.basicEnergy||c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC).length;if(!count)break;
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_DISCARD,p.hand,op.basicEnergy?{superType:SuperType.ENERGY,energyType:EnergyType.BASIC}:{},{min:0,max:Math.min(count,op.max??count),allowCancel:false}),(chosen:any)=>{const count=chosen?.length||0;p.hand.moveCardsTo(chosen||[],p.discard);const draw=()=>{DRAW_CARDS(store,state,p,op.drawTable?op.drawTable[count]:count*op.multiplier);next();};if(op.coin)COIN_FLIP_PROMPT(store,state,p,heads=>heads?draw():next());else draw();});
 }
 case 'searchBench':{
  const empty=p.bench.filter((l:any)=>!l.cards.length);if(!empty.length){if(op.requireSpace)throw new GameError(GameMessage.CANNOT_USE_ATTACK);break;}
  const eligible=p.deck.cards.filter((c:any)=>c.superType===SuperType.POKEMON&&c.stage===Stage.BASIC&&(!op.baby||c.tags.includes(CardTag.BABY))&&(!op.names||op.names.includes(c.name)));
  if(!eligible.length)return shuffle(p);
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,p.deck,{superType:SuperType.POKEMON,stage:Stage.BASIC},{min:0,max:Math.min(op.amount,eligible.length,empty.length),allowCancel:false,blocked:p.deck.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{
   const place=(i:number)=>{if(i>=chosen.length)return shuffle(p);const slots=p.bench.map((l:any,index:number)=>({l,index})).filter((s:any)=>!s.l.cards.length);store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,slots.map((s:any)=>'Bench '+(s.index+1)),{allowCancel:false}),(selected:any)=>{store.reduceEffect(state,new PlayPokemonFromDeckEffect(p,chosen[i],slots[selected].l));place(i+1);});};place(0);
  });
 }
 case 'switchSelf':{
  if(!p.bench.some((l:any)=>l.getPokemonCard()))break;
  return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{allowCancel:false}),(chosen:any)=>{p.switchPokemon(chosen[0],store,state);next();});
 }
 case 'selfNoAttack':source.cannotAttackNextTurn=true;source.cannotAttackNextTurnPending=true;break;
 case 'showHand':if(o.hand.cards.length)return store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,o.hand.cards),next);break;
 case 'ownTrainerLock':p.applyPlayLocks({item:true,supporter:true,stadium:true,tool:true},1);break;
 case 'bothRecoverFive':{const eligible=(owner:any)=>owner.discard.cards.filter((c:any)=>c.superType===SuperType.POKEMON||c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC);if(!eligible(p).length&&!eligible(o).length)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);const recover=(owner:any,finish:()=>void)=>{const cards=eligible(owner),count=Math.min(5,cards.length);if(!count)return finish();store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_HAND,owner.discard,{}, {min:count,max:count,allowCancel:true,blocked:owner.discard.cards.map((c:any,i:number)=>cards.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{if(!chosen?.length)return finish();owner.discard.moveCardsTo(chosen,owner.deck);shuffle(owner,finish);});};recover(o,()=>recover(p,next));return state;}
 case 'returnOwnEnergyToHand':{const lists=[p.active,...p.bench].filter((l:any)=>l.getPokemonCard()&&l.cards.some((c:any)=>c.superType===SuperType.ENERGY));const choose=(index:number)=>{if(index>=lists.length)return next();const list=lists[index],count=list.cards.filter((c:any)=>c.superType===SuperType.ENERGY).length;store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,list,{superType:SuperType.ENERGY},{min:0,max:count,allowCancel:false}),(chosen:any)=>{if(chosen?.length)MOVE_CARDS(store,state,list,p.hand,{cards:chosen,sourceCard:b._wotcTrainerCard||source.getPokemonCard(),sourceEffect:b});choose(index+1);});};choose(0);return state;}
 case 'opponentHandEnergyDamage':b.damage=op.amount*o.hand.cards.filter((c:any)=>c.superType===SuperType.ENERGY).length;if(o.hand.cards.length)return store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,o.hand.cards),next);break;
 case 'orderOpponentTop':{const top=new CardList(),count=op.energyCards?o.active.cards.filter((c:any)=>c.superType===SuperType.ENERGY).length:op.amount;top.cards=o.deck.cards.slice(0,count);if(!top.cards.length)break;return store.prompt(state,new OrderCardsPrompt(p.id,GameMessage.CHOOSE_CARDS_ORDER,top,{allowCancel:false}),(order:any)=>{o.deck.cards=[...order.map((i:number)=>top.cards[i]),...o.deck.cards.slice(top.cards.length)];next();});}
 case 'opponentHandShuffle':{const eligible=o.hand.cards.filter((c:any)=>op.category==='Energy'?c.superType===SuperType.ENERGY:c.superType===SuperType.TRAINER&&(op.category!=='ToolOrMachine'||c.trainerType===TrainerType.TOOL||c.tags?.includes(CardTag.TECHNICAL_MACHINE)));const finish=(chosen:any[])=>{o.hand.moveCardsTo(chosen,o.deck);shuffle(o);};if(!o.hand.cards.length){if(op.all)return shuffle(o);break;}return store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,o.hand.cards),()=>{if(op.all)return finish(eligible);if(!eligible.length)return next();store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,o.hand,{}, {min:1,max:1,allowCancel:false,blocked:o.hand.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>finish(chosen));});}
 case 'requireEqualEnergy':if(source.cards.filter((c:any)=>c.superType===SuperType.ENERGY).length!==o.active.cards.filter((c:any)=>c.superType===SuperType.ENERGY).length)throw new GameError(GameMessage.CANNOT_USE_ATTACK);break;
 case 'evolvedBonus':b.damage=op.base+(o.active.getPokemonCard().stage!==Stage.BASIC?op.amount:0);break;
 case 'distinctEnergyDamage':b.damage=op.base+op.amount*new Set(source.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC).flatMap((c:any)=>c.provides)).size;break;
 case 'counters':store.reduceEffect(state,new PutCountersEffect(b,op.fromSelfDamage?source.damage:op.fromDamagedOwn?[p.active,...p.bench].filter((l:any)=>l.getPokemonCard()&&l.damage).length*10:op.amount));break;
 case 'targetCounters':{
  b.damage=0;return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_DAMAGE,PlayerType.TOP_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false}),(chosen:any)=>{const d=new PutCountersEffect(b,op.fromEnergy?chosen[0].cards.filter((c:any)=>c.superType===SuperType.ENERGY).length*10:op.amount);d.target=chosen[0];store.reduceEffect(state,d);next();});
 }
 case 'mill':for(const player of op.both?[p,o]:[op.opponent?o:p])player.deck.moveCardsTo(player.deck.cards.slice(0,op.amount),player.discard);break;
 case 'millDamage':{const cards=p.deck.cards.slice(0,op.amount);b.damage=op.perCard*cards.filter((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC&&c.provides.includes(types[op.energy])).length;p.deck.moveCardsTo(cards,p.discard);break;}
 case 'allOpponentDamage':b.damage=0;b.ignoreWeakness=true;b.ignoreResistance=true;for(const list of [o.active,...o.bench])if(list.getPokemonCard())damage(list,op.amount);break;
 case 'healDealt':{const dealt=(op.total?source.getPokemonCard()?._wotcLastTotalAttackDamage:source.getPokemonCard()?._wotcLastAttackDamage)||0;if(dealt){const h=new HealTargetEffect(b,op.amount??Math.ceil(dealt*op.factor/10)*10);h.target=source;store.reduceEffect(state,h);}break;}
 case 'moveOwnEnergy':{
  const lists=[p.active,...p.bench].filter((l:any)=>l.getPokemonCard()),eligible=lists.filter((l:any)=>(!op.fromSelf||l===source)&&l.cards.some((c:any)=>c.superType===SuperType.ENERGY&&(!op.basic||c.energyType===EnergyType.BASIC)));
  if(lists.length<2||!eligible.length)break;
  const targets=[{player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0,list:p.active},...p.bench.map((list:any,index:number)=>({player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index,list}))];
  return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:targets.filter(t=>!eligible.includes(t.list)).map(({list,...target})=>target)}),(from:any)=>{
   store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_ATTACH,from[0],{superType:SuperType.ENERGY,...(op.basic?{energyType:EnergyType.BASIC}:{})},{min:1,max:1,allowCancel:false}),(cards:any)=>{
    store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,op.bench?[SlotType.BENCH]:[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:targets.filter(t=>t.list===from[0]).map(({list,...target})=>target)}),(to:any)=>{from[0].moveCardsTo(cards,to[0]);next();});
   });
  });
 }
 case 'switchBoth':{
  const own=()=>{if(!p.bench.some((l:any)=>l.getPokemonCard()))return next();store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{allowCancel:false}),(chosen:any)=>{p.switchPokemon(chosen[0],store,state);next();});};
  if(!o.bench.some((l:any)=>l.getPokemonCard())){own();return state;}
  return store.prompt(state,new ChoosePokemonPrompt(o.id,GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{allowCancel:false}),(chosen:any)=>{store.reduceEffect(state,new GustOpponentBenchEffect(b,chosen[0]));own();});
 }
 case 'countedCoins':{
  if(op.countFrom==='allOpponentEnergyCards')op={...op,count:[o.active,...o.bench].filter((l:any)=>l.getPokemonCard()).reduce((n:number,l:any)=>n+l.cards.filter((c:any)=>c.superType===SuperType.ENERGY).length,0)};
  if(op.countFrom==='opponentEnergyUnits')op={...op,count:energyUnits(o.active,o)};
  if(op.countFrom==='ownEnergyCards'&&op.energy)op={...op,count:provided(source,p).filter((x:any)=>x.card.superType===SuperType.ENERGY&&(x.provides.includes(types[op.energy])||x.provides.includes(CardType.ANY))).length};
  if(op.countFrom==='namedPokemon')op={...op,count:[p.active,...p.bench].filter((l:any)=>op.names.includes(l.getPokemonCard()?.name)).length};
  if(op.countFrom==='namedBench')op={...op,count:p.bench.filter((l:any)=>op.names.includes(l.getPokemonCard()?.name)).length};
  const count=op.count??Math.min(op.cap??Infinity,op.countFrom==='allPokemon'?[p.active,...p.bench,o.active,...o.bench].filter((l:any)=>l.getPokemonCard()).length:op.countFrom==='benchEnergy'?p.bench.filter((l:any)=>l.getPokemonCard()).reduce((n:number,l:any)=>n+energyUnits(l,p),0):op.countFrom==='opponentDamage'?o.active.damage/10:op.countFrom==='opponentEnergyCards'?o.active.cards.filter((c:any)=>c.superType===SuperType.ENERGY).length:op.countFrom==='damage'?source.damage/10:op.countFrom==='ownEnergyCards'?source.cards.filter((c:any)=>c.superType===SuperType.ENERGY).length:energyUnits(source,p,op.energy));
  const finish=(results:boolean[])=>{const heads=results.filter(Boolean).length;
   if(op.zeroIfNoHeads&&!heads)b.damage=0;
   if(op.damageTable)b.damage=op.damageTable[heads];else if(op.allHeadsDamage!==undefined)b.damage=heads===count?op.allHeadsDamage:0;else if(op.perHead!==undefined)b.damage=(op.base||0)+heads*op.perHead;
   if(op.counterPerHead&&heads)store.reduceEffect(state,new PutCountersEffect(b,heads*op.counterPerHead));
   if(op.healPerHead&&heads){const h=new HealTargetEffect(b,heads*op.healPerHead);h.target=source;store.reduceEffect(state,h);}
   if(op.healAllPerHead&&heads)for(const list of [p.active,...p.bench])if(list.getPokemonCard())heal(list,heads*op.healAllPerHead);
   const conditions=op.statusTable?.[heads]||((op.statusAtLeast!==undefined&&heads>=op.statusAtLeast)||(op.statusExactly!==undefined&&heads===op.statusExactly)?op.conditions:[]);
   const tailOps=op.discardPerTail&&count>heads?[{op:'discardSelf',energy:op.energy,amount:Math.min(count-heads,provided(source,p).filter((x:any)=>!op.energy||x.provides.includes(types[op.energy])||x.provides.includes(CardType.ANY)).length)}]:[];
   if(op.discardOpponentPerHead&&heads)for(let i=0;i<heads*op.discardOpponentPerHead;i++)tailOps.push({op:'discardOpponentEnergy',after:true} as any);
   if(op.requiredDiscardPerHead&&heads)tailOps.push({op:'discardSelf',energy:op.energy,amount:heads*op.requiredDiscardPerHead,orNothing:true} as any);
   if(op.searchPerHead)tailOps.push(heads?{op:'search',category:op.searchCategory,amount:heads*op.searchPerHead}:{op:'shuffle'} as any);
   if(op.attachPerHead)tailOps.push({op:'attachDeckEnergy',amount:heads*op.attachPerHead,energy:op.attachEnergy,targetType:op.attachType} as any);
   if(op.recoilPerTail&&count>heads)tailOps.push({op:'recoil',amount:(count-heads)*op.recoilPerTail,after:true} as any);
   if(op.selfCountersPerHead&&heads)tailOps.push({op:'selfCounters',amount:heads*op.selfCountersPerHead,after:true} as any);
   if(op.millPerHead&&heads)tailOps.push({op:'mill',opponent:true,amount:heads*op.millPerHead,after:true} as any);
   if(op.switchAtLeast!==undefined&&heads>=op.switchAtLeast)tailOps.push({op:'switchSelf',after:true} as any);
   if(op.chooseStatus&&heads>=op.statusAtLeast)tailOps.push({op:'chooseStatus',conditions:op.chooseStatus,after:true} as any);
   run(store,state,e,[...(conditions?.length?[{op:'status',conditions}]:[]),...tailOps],next);
  };
  if(!count){finish([]);return state;}return MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,count,finish);
 }
 case 'optionalDiscardAttack':{
  if(op.required&&b.wotcEnergyCostPaid){const count=b.wotcRequiredEnergyCount||0;if(!count){b.damage=op.base??0;break;}return MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,count,(results:boolean[])=>{b.damage=(op.base||0)+op.perHead*results.filter(Boolean).length;next();});}
  const eligible=provided(source,p).filter((x:any)=>x.provides.includes(types[op.energy])||x.provides.includes(CardType.ANY)).map((x:any)=>x.card);if(!eligible.length){if(op.mandatory)b.damage=op.base??0;break;}
  const finish=(chosen:any[])=>{if(chosen.length){source.moveCardsTo(chosen,p.discard);if(op.flips)return MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,chosen.length,(results:boolean[])=>{b.damage=op.base+op.perHead*results.filter(Boolean).length;next();});b.damage=op.perCard!==undefined?op.base+chosen.length*op.perCard:op.damage;}next();};
  if(op.mandatory){finish(eligible);return state;}
  if(op.all)return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,['Keep Energy','Discard all '+op.energy+' Energy'],{allowCancel:false}),(choice:any)=>finish(choice===1?eligible:[]));
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,source,{superType:SuperType.ENERGY},{min:0,max:eligible.length,allowCancel:false,blocked:source.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{if(op.all&&chosen?.length&&chosen.length!==eligible.length)throw new GameError(GameMessage.INVALID_TARGET);finish(chosen||[]);});
 }
 case 'surplusAnyEnergy':b.damage=op.base+Math.min(op.cap,op.amount*Math.max(0,energyUnits(source,p)-op.cost));break;
 case 'namedPokemonDamage':b.damage=op.amount*[p.active,...p.bench].filter((l:any)=>l.getPokemonCard()?.name.includes(op.name)).length;break;
 case 'halfHpDown':{const hp=new CheckHpEffect(o,o.active);store.reduceEffect(state,hp);b.damage=Math.floor(Math.max(0,hp.hp-o.active.damage)/20)*10;break;}
 case 'thresholdDamage':if(source.damage>=op.counters*10)b.damage=op.damage;break;
 case 'undamagedDamage':if(!o.active.damage)b.damage=op.damage;break;
 case 'stageDamage':{const c=o.active.getPokemonCard();b.damage=c.tags.includes(CardTag.BABY)?op.baby:c.stage===Stage.BASIC?op.basic:op.evolved;break;}
 case 'benchDifferenceDamage':b.damage=Math.max(0,op.base+op.amount*(op.own?-1:1)*(o.bench.filter((l:any)=>l.getPokemonCard()).length-p.bench.filter((l:any)=>l.getPokemonCard()).length));break;
 case 'retreatDamage':{const cost=new CheckRetreatCostEffect(o);store.reduceEffect(state,cost);b.damage=op.base+op.amount*cost.cost.length;break;}
 case 'optionalDraw':{const owner=op.opponent?o:p;return store.prompt(state,new SelectPrompt(owner.id,GameMessage.WANT_TO_DRAW_CARDS,['Draw no cards','Draw '+op.amount],{allowCancel:false}),(choice:any)=>{if(choice===1)DRAW_CARDS(store,state,owner,op.amount);next();});}
 case 'preventConditions':source.cannotBeSpecialConditionedNextTurnPending=true;break;
 case 'protectEffects':source.preventEffectsOfAttacksNextTurnPending={};break;
 case 'defenderExtraDamage':store.reduceEffect(state,new DefendingPokemonTakesMoreDamageDuringAttackerNextTurnEffect(b,op.amount));break;
 case 'spreadWithEnergy':for(const list of [...p.bench,...o.bench])if(list.getPokemonCard()&&list.cards.some((c:any)=>c.superType===SuperType.ENERGY))damage(list,op.amount);break;
 case 'chooseBenchDamage':{
  const owner=op.own?p:o,count=Math.min(op.count,owner.bench.filter((l:any)=>l.getPokemonCard()).length);if(!count){if(op.amountPerEnergy)b.damage=0;break;}
  if(op.amountPerEnergy){b.damage=0;b.ignoreWeakness=true;b.ignoreResistance=true;}
  return store.prompt(state,new ChoosePokemonPrompt(op.opponentChooses?o.id:p.id,GameMessage.CHOOSE_POKEMON_TO_DAMAGE,op.own||op.opponentChooses?PlayerType.BOTTOM_PLAYER:PlayerType.TOP_PLAYER,[SlotType.BENCH],{min:op.optional?0:count,max:count,allowCancel:false}),(chosen:any)=>{const perform=(multiplier:number)=>{for(const list of chosen||[])if(multiplier)damage(list,multiplier*(op.amount??op.amountPerEnergy*energyUnits(source,p,op.energy)));next();};if(op.coinCount)MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,op.coinCount,(results:boolean[])=>perform(results.filter(Boolean).length));else perform(1);});
 }
 case 'requireEnergy':if(!provided(source,p).some((x:any)=>x.provides.includes(types[op.energy])||x.provides.includes(CardType.ANY)))throw new GameError(GameMessage.CANNOT_USE_ATTACK);break;
 case 'optionalEnergyEffect':{
  const eligible=provided(source,p).filter((x:any)=>x.provides.includes(types[op.energy])||x.provides.includes(CardType.ANY)).map((x:any)=>x.card);if(eligible.length<op.amount)break;
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,source,{superType:SuperType.ENERGY},{min:0,max:op.amount,allowCancel:false,blocked:source.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{if(chosen?.length===op.amount){source.moveCardsTo(chosen,p.discard);run(store,state,e,op.ops,next);}else next();});
 }
 case 'evolveSelf':{
  const zone=op.fromHand?p.hand:p.deck,eligible=zone.cards.filter((c:any)=>c.superType===SuperType.POKEMON&&c.stage!==Stage.BASIC&&(op.names?op.names.includes(c.name):c.evolvesFrom===op.evolvesFrom));if(!eligible.length){if(op.fromHand)break;return shuffle(p);}
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,zone,{superType:SuperType.POKEMON},{min:op.optional?0:1,max:1,allowCancel:false,blocked:zone.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{if(chosen?.length){if(!op.fromHand)zone.moveCardsTo(chosen,p.hand);store.reduceEffect(state,new EvolveEffect(p,source,chosen[0]));}if(op.fromHand)next();else shuffle(p);});
 }
 case 'ifOpponentBench':if(o.bench.some((l:any)=>l.getPokemonCard()))return run(store,state,e,op.ops,next);break;
 case 'returnPokemon':{const owner=op.opponent?o:p,list=op.opponent?o.active:source,destination=op.toHand?owner.hand:owner.deck;const probe=new AddMarkerEffect(b,'WOTC_RETURN_PROBE',b._wotcSourceCard);probe.target=list;store.reduceEffect(state,probe);if(!probe.markerAdded)break;MOVE_POKEMON_OFF_BOARD(store,state,list,{pokemonDestination:destination,attachedDestination:op.all?destination:owner.discard,sourceCard:b._wotcSourceCard,sourceEffect:b});if(op.toHand)break;return shuffle(owner);}
 case 'benchFlips':{const count=o.bench.filter((l:any)=>l.getPokemonCard()).length;if(!count){b.damage=0;break;}return MULTIPLE_COIN_FLIPS_PROMPT(store,state,o,count,(results:any[])=>{b.damage=results.filter(x=>op.tails?!x:x).length*op.amount;next();});}
 case 'distributeEnergy':{
  const energy=source.cards.filter((c:any)=>c.superType===SuperType.ENERGY);if(!energy.length)break;if(!p.bench.some((l:any)=>l.getPokemonCard())){source.moveCardsTo(energy,p.discard);break;}
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_ATTACH,source,{superType:SuperType.ENERGY},{min:1,max:1,allowCancel:false}),(chosen:any)=>{store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{allowCancel:false}),(lists:any)=>{source.moveCardsTo(chosen,lists[0]);run(store,state,e,[op,...rest],done);});});
 }
 case 'moveOpponentEnergy':{
  if(op.any){
   const lists=[o.active,...o.bench].filter((l:any)=>l.getPokemonCard()),eligible=lists.filter((l:any)=>l.cards.some((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC));if(lists.length<2||!eligible.length)break;
   const targets=[{player:PlayerType.TOP_PLAYER,slot:SlotType.ACTIVE,index:0,list:o.active},...o.bench.map((list:any,index:number)=>({player:PlayerType.TOP_PLAYER,slot:SlotType.BENCH,index,list}))];
   return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.TOP_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:targets.filter(t=>!eligible.includes(t.list)).map(({list,...target})=>target)}),(from:any)=>{
    store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_ATTACH,from[0],{superType:SuperType.ENERGY,energyType:EnergyType.BASIC},{min:1,max:1,allowCancel:false}),(cards:any)=>{
     store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.TOP_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:targets.filter(t=>t.list===from[0]).map(({list,...target})=>target)}),(to:any)=>{store.reduceEffect(state,new MoveOpponentEnergyEffect(b,cards[0],from[0],to[0]));next();});
    });
   });
  }
  if(!o.bench.some((l:any)=>l.getPokemonCard())||!o.active.cards.some((c:any)=>c.superType===SuperType.ENERGY&&(op.specialAllowed||c.energyType===EnergyType.BASIC)))break;
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_ATTACH,o.active,{superType:SuperType.ENERGY,...(!op.specialAllowed?{energyType:EnergyType.BASIC}:{})},{min:1,max:1,allowCancel:false}),(chosen:any)=>{store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.TOP_PLAYER,[SlotType.BENCH],{allowCancel:false}),(lists:any)=>{store.reduceEffect(state,new MoveOpponentEnergyEffect(b,chosen[0],o.active,lists[0]));next();});});
 }
 case 'equalEnergyDamage':b.damage=source.cards.filter((c:any)=>c.superType===SuperType.ENERGY).length===o.active.cards.filter((c:any)=>c.superType===SuperType.ENERGY).length?op.equal:op.other;break;
 case 'healAll':for(const owner of (op.both?[p,o]:[p]))for(const list of [...(!op.bench?[owner.active]:[]),...owner.bench])if(list.getPokemonCard()&&list.damage)heal(list,op.amount);break;
 case 'peekOpponentTop':if(o.deck.cards.length)return store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,o.deck.cards.slice(0,op.amount)),next);break;
 case 'optionalBothDraw':{
  const choose=(owner:any,finish:()=>void)=>store.prompt(state,new SelectPrompt(owner.id,GameMessage.WANT_TO_DRAW_CARDS,Array.from({length:Math.min(op.amount,owner.deck.cards.length)+1},(_,i)=>'Draw '+i),{allowCancel:false}),(count:any)=>{DRAW_CARDS(store,state,owner,count);finish();});
  return choose(p,()=>choose(o,next));
 }
 case 'bothShuffleHands':{
  const first=p.hand.cards.length,second=o.hand.cards.length;p.hand.moveTo(p.deck);
  return shuffle(p,()=>{DRAW_CARDS(store,state,p,first);o.hand.moveTo(o.deck);shuffle(o,()=>{DRAW_CARDS(store,state,o,second);next();});});
 }
 case 'untilDraw':return FLIP_UNTIL_TAILS_AND_COUNT_HEADS(store,state,p,heads=>{DRAW_CARDS(store,state,p,heads*op.amount);next();});
 case 'mailFromBill':if(p.hand.cards.length>=4)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);DRAW_CARDS(store,state,p,4-p.hand.cards.length);break;
 case 'recoverFlips':case 'recoverToDeck':{
  const eligible=p.discard.cards.filter((c:any)=>(op.category==='Any'||(op.category==='Evolution'?c.superType===SuperType.POKEMON&&c.stage!==Stage.BASIC:op.category==='Energy'?c.superType===SuperType.ENERGY:c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC))&&(!op.energy||c.provides?.includes(types[op.energy])));
  const choose=(heads:number)=>{const count=Math.min(heads,eligible.length);if(!count)return next();const blocked=p.discard.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0);
   store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,p.discard,{}, {min:op.optional?0:count,max:count,allowCancel:false,blocked}),(chosen:any)=>{
    if(chosen?.length)p.discard.moveCardsTo(chosen,op.op==='recoverToDeck'?p.deck:p.hand);
    const finish=()=>op.op==='recoverToDeck'?shuffle(p):next();if(op.reveal&&chosen?.length)store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,chosen),finish);else finish();
   });
  };
  if(op.op==='recoverFlips')return MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,op.count,results=>choose(results.filter(Boolean).length));choose(op.amount);return state;
 }
 case 'topSearch':{
  if(!p.deck.cards.length)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);const top=new CardList();top.cards=[...p.deck.cards.slice(0,op.amount)];
  const eligible=top.cards.filter((c:any)=>op.category==='Any'||op.category==='Pokemon'?op.category==='Any'||c.superType===SuperType.POKEMON:op.category==='Trainer'?c.superType===SuperType.TRAINER:c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC);
  const finish=(chosen:any[])=>{if(chosen.length)p.deck.moveCardsTo(chosen,p.hand);const final=()=>shuffle(p);if(chosen.length)store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,chosen),final);else final();};
  if(op.all){finish(eligible);return state;}if(!eligible.length)return shuffle(p);
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,top,{}, {min:op.required?1:0,max:1,allowCancel:false,blocked:top.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>finish(chosen||[]));
 }
 case 'topHarvest':{
  if(!p.deck.cards.length)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);const top=p.deck.cards.slice(0,op.amount);
  return store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,top),()=>{for(const c of top)p.deck.moveCardTo(c,c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC&&c.provides.includes(types[op.energy])?p.hand:p.discard);next();});
 }
 case 'healBoth':for(const list of [source,o.active])heal(list,op.amount);break;
 case 'chooseHeal':{
  const blocked:any[]=[];let count=0;for(const owner of (op.any?[p,o]:[p]))for(const [slot,index,list] of [[SlotType.ACTIVE,0,owner.active],...owner.bench.map((l:any,i:number)=>[SlotType.BENCH,i,l])] as any){if(!list.damage||op.requireEnergy&&!list.cards.some((c:any)=>c.superType===SuperType.ENERGY))blocked.push({player:owner===p?PlayerType.BOTTOM_PLAYER:PlayerType.TOP_PLAYER,slot,index});else if(list.getPokemonCard()&&(!op.bench||slot===SlotType.BENCH))count++;}
  if(!count)break;
  return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_HEAL,op.any?PlayerType.ANY:PlayerType.BOTTOM_PLAYER,op.bench?[SlotType.BENCH]:[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked}),(chosen:any)=>{if(chosen?.length)heal(chosen[0],op.amount);next();});
 }
 case 'bothPlayersHealCounters':{
  const heal=(owner:any,n:number,finish:()=>void)=>{const damaged=[owner.active,...owner.bench].filter(l=>l.getPokemonCard()&&l.damage);if(!n||!damaged.length)return finish();
   const blocked=[{slot:SlotType.ACTIVE,index:0,list:owner.active},...owner.bench.map((list:any,index:number)=>({slot:SlotType.BENCH,index,list}))].filter(x=>!x.list.damage).map(x=>({player:PlayerType.BOTTOM_PLAYER,slot:x.slot,index:x.index}));
   store.prompt(state,new ChoosePokemonPrompt(owner.id,GameMessage.CHOOSE_POKEMON_TO_HEAL,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked}),(chosen:any)=>{const h=new HealTargetEffect(b,10);h.target=chosen[0];store.reduceEffect(state,h);heal(owner,n-1,finish);});
  };
  return COIN_FLIP_PROMPT(store,state,p,heads=>{const second=()=>COIN_FLIP_PROMPT(store,state,o,otherHeads=>otherHeads?heal(o,op.amount,next):next());if(heads)heal(p,op.amount,second);else second();});
 }
 case 'rainbowWave':{
  b.damage=0;b.ignoreWeakness=true;b.ignoreResistance=true;
  const available=[...new Set(provided(source,p).flatMap((x:any)=>x.provides).flatMap((t:any)=>t===CardType.ANY?Object.values(types).filter(t=>t!==CardType.COLORLESS):[t]).filter((t:any)=>t!==CardType.COLORLESS))];
  if(!available.length)throw new GameError(GameMessage.NOT_ENOUGH_ENERGY);
  return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_ENERGY_TYPE,available.map(t=>Object.keys(types).find(k=>types[k]===t)||String(t)),{allowCancel:false}),(index:any)=>{for(const list of [o.active,...o.bench])if(list.getPokemonCard()?.cardType.includes(available[index]))damage(list,op.amount);next();});
 }
 case 'targetEnergyFlips':{
  b.damage=0;b.ignoreWeakness=true;b.ignoreResistance=true;
  return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_DAMAGE,PlayerType.TOP_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false}),(chosen:any)=>{const count=energyUnits(source,p,op.energy);if(!count)return next();MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,count,(results:any[])=>{damage(chosen[0],op.amount*results.filter(Boolean).length);next();});});
 }
 case 'requiredCost':if(!b.wotcEnergyCostPaid)return run(store,state,e,[{op:'discardSelf',energy:op.energy,amount:op.amount}],next);break;
 case 'coin':return COIN_FLIP_PROMPT(store,state,op.opponent?o:p,heads=>run(store,state,e,heads?op.heads:op.tails,next));
 case 'flips':return MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,op.count,results=>{b.damage=op.allHeads?(results.every(Boolean)?b.damage:0):results.filter(Boolean).length*op.perHead;next();});
 case 'untilTails':return FLIP_UNTIL_TAILS_AND_COUNT_HEADS(store,state,p,heads=>{b.damage=(op.base||0)+op.amount*heads;next();});
 case 'damage':b.damage=op.amount;break;
 case 'status':{const s=new AddSpecialConditionsEffect(b,op.conditions.map((c:string)=>(SpecialCondition as any)[c]));if(op.poison)s.poisonDamage=op.poison;store.reduceEffect(state,s);break;}
 case 'draw':DRAW_CARDS(store,state,p,op.amount);break;
 case 'shuffle':return shuffle(op.opponent?o:p);
 case 'shuffleHand':p.hand.moveTo(p.deck);return shuffle(p,()=>{DRAW_CARDS(store,state,p,op.amount);next();});
 case 'requireBench':if(!o.bench.some((l:any)=>l.getPokemonCard()))throw new GameError(GameMessage.CANNOT_USE_ATTACK);break;
 case 'noRetreat':{const marker=new AddMarkerEffect(b,'WOTC_NO_RETREAT',source.getPokemonCard());store.reduceEffect(state,marker);if(marker.markerAdded)o.active.cannotRetreatNextTurn=true;break;}
 case 'smokescreen':o.active.coinFlipCancelAttackNextTurn=1;break;
 case 'ignoreResistance':b.ignoreResistance=true;break;
 case 'ignoreWeakness':b.ignoreWeakness=true;break;
 case 'energyDamage':b.damage=op.base+op.amount*o.active.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&(!op.special||c.energyType===EnergyType.SPECIAL)).length;break;
 case 'counterDamage':b.damage=Math.max(0,op.base+op.amount*(op.opponent?o.active:source).damage/10);break;
 case 'benchCountDamage':b.damage=op.base+op.amount*p.bench.filter((l:any)=>op.names.includes(l.getPokemonCard()?.name)).length;break;
 case 'conditionalStatusDamage':b.damage=op.base+(o.active.specialConditions.includes((SpecialCondition as any)[op.condition])?op.amount:0);break;
 case 'surplusEnergy':{
  b.damage=op.base+Math.min(op.cap??Infinity,op.amount*StateUtils.getUnusedEnergyUnitsOfType(provided(source,p),op.cost.map((t:string)=>types[t]),types[op.energy]));break;
 }
 case 'energyFlips':{const eligible=provided(source,p).filter((x:any)=>!op.energy||x.provides.includes(types[op.energy])||x.provides.includes(CardType.ANY)).map((x:any)=>x.card),count=op.cards?eligible.length:energyUnits(source,p,op.energy);if(!count){if(!op.draw)b.damage=0;break;}return MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,count,(results:any[])=>{const n=results.filter(Boolean).length;if(op.draw)DRAW_CARDS(store,state,p,n*op.amount);else b.damage=n*op.amount;if(op.discardHeads&&n){run(store,state,e,[{op:'discardSelf',energy:op.energy,amount:n}],next);}else next();});}
 case 'selfStatus':store.reduceEffect(state,new AddSpecialConditionsPowerEffect(p,source.getPokemonCard(),source,[(SpecialCondition as any)[op.condition]]));break;
 case 'discardSelf':{
  if(op.required&&b.wotcEnergyCostPaid)break;
  const eligible=provided(source,p).filter((x:any)=>!op.energy||x.provides.includes(types[op.energy])||x.provides.includes(CardType.ANY)).map((x:any)=>x.card),count=op.amount==='all'?eligible.length:op.amount;
  if(eligible.length<count||!count){if(op.orNothing){b.damage=0;break;}if(!count)break;throw new GameError(GameMessage.NOT_ENOUGH_ENERGY);}
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,source,{superType:SuperType.ENERGY},{min:count,max:count,allowCancel:false,blocked:source.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{if(chosen)source.moveCardsTo(chosen,p.discard);next();});
 }
 case 'attachSelf':case 'search':case 'recover':{
  const list=op.zone==='hand'?p.hand:op.zone==='discard'||op.op==='recover'?p.discard:p.deck;
  const filter:any=op.op==='attachSelf'?{superType:SuperType.ENERGY,...(!op.allowSpecial?{energyType:EnergyType.BASIC}:{}),...(op.energy?{cardType:types[op.energy]}:{})}:['Trainer','ToolOrMachine'].includes(op.category)?{superType:SuperType.TRAINER}:['Pokemon','BasicPokemon','Evolution'].includes(op.category)?{superType:SuperType.POKEMON,...(op.category==='BasicPokemon'?{stage:Stage.BASIC}:{})}:op.category==='Energy'?{superType:SuperType.ENERGY,...(op.energy?{cardType:types[op.energy]}:{})}:{superType:SuperType.ENERGY,energyType:EnergyType.BASIC,...(op.energy?{cardType:types[op.energy]}:{})};
  const eligible=list.cards.filter((c:any)=>Object.entries(filter).every(([k,v])=>k==='cardType'?c.provides?.includes(v):c[k]===v)&&(!op.names||op.names.includes(c.name))&&(!op.evolvesFrom||c.evolvesFrom===op.evolvesFrom)&&(op.category!=='Evolution'||c.stage!==Stage.BASIC)&&(op.category!=='ToolOrMachine'||c.trainerType===TrainerType.TOOL||c.tags?.includes(CardTag.TECHNICAL_MACHINE)));const count=eligible.length;
  if(!count){if(list===p.deck)return shuffle(p);break;}
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,list,filter,{min:list===p.deck||op.optional?0:Math.min(count,op.amount),max:Math.min(count,op.amount),allowCancel:false,blocked:list.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{
   if(chosen?.length)list.moveCardsTo(chosen,op.op==='attachSelf'?source:p.hand);
   const finish=()=>list===p.deck?shuffle(p):next();
   if(chosen?.length&&list===p.deck&&op.op==='search')store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,chosen),finish);else finish();
  });
 }
 case 'lockDefenderAttack':{if(op.basic&&o.active.getPokemonCard()?.stage!==Stage.BASIC)break;const attacks=new CheckPokemonAttacksEffect(o);store.reduceEffect(state,attacks);const choices=[...(o.active.getPokemonCard()?.attacks||[]),...attacks.attacks];if(!choices.length)break;return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_ATTACK_TO_DISABLE,choices.map((a:any)=>a.name),{allowCancel:false}),(index:any)=>{const marker=new AddMarkerEffect(b,'WOTC_AMNESIA_LOCK',source.getPokemonCard());store.reduceEffect(state,marker);if(marker.markerAdded)o.active.cannotUseAttacksNextTurn.push(choices[index].name);next();});}
 case 'noAttack':{const marker=new AddMarkerEffect(b,'WOTC_NO_ATTACK',source.getPokemonCard());store.reduceEffect(state,marker);if(marker.markerAdded)o.active.cannotAttackNextTurn=true;break;}
 case 'selfLock':if(!source.cannotUseAttacksNextTurnPending.includes(b.attack.name))source.cannotUseAttacksNextTurnPending.push(b.attack.name);break;
 case 'protect':source.preventDamageNextTurnPending={};if(op.effects)source.preventEffectsOfAttacksNextTurnPending={};break;
 case 'reduceNextDamage':source.damageReductionNextTurn=op.amount;break;
 case 'halfHp':{const hp=new CheckHpEffect(o,o.active);store.reduceEffect(state,hp);b.damage=Math.ceil(Math.max(0,hp.hp-o.active.damage)/20)*10;break;}
 case 'recoil':damage(source,op.amount,!op.noWR);break;
 case 'heal':heal(source,op.amount);break;
 case 'spread':for(const list of [...(op.own||op.both?p.bench:[]),...(!op.own?o.bench:[])])if(list.getPokemonCard()){if(op.energy){const type=new CheckPokemonTypeEffect(list);store.reduceEffect(state,type);if(!type.cardTypes.includes(types[op.energy]))continue;}damage(list,op.amount);}break;
 case 'discardOpponentEnergy':{
  const eligible=o.active.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&(!op.basic||c.energyType===EnergyType.BASIC)&&(!op.special||c.energyType===EnergyType.SPECIAL));if(!eligible.length)break;
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,o.active,{superType:SuperType.ENERGY},{min:1,max:1,allowCancel:false,blocked:o.active.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{if(chosen?.length)store.reduceEffect(state,new DiscardCardsFromOpponentsActivePokemonEffect(b,chosen));next();});
 }
 case 'targetDamage':{
  if(op.amountPerEnergyCard)op={...op,amount:Math.min(op.cap??Infinity,op.amountPerEnergyCard*provided(source,p).filter((x:any)=>x.card.superType===SuperType.ENERGY&&(x.provides.includes(types[op.energy])||x.provides.includes(CardType.ANY))).length)};
  b.damage=0;b.ignoreWeakness=true;b.ignoreResistance=true;
  const slots=[{player:PlayerType.TOP_PLAYER,slot:SlotType.ACTIVE,index:0,list:o.active},...o.bench.map((list:any,index:number)=>({player:PlayerType.TOP_PLAYER,slot:SlotType.BENCH,index,list}))];
  if(op.requireDamaged&&!slots.some(x=>x.list.getPokemonCard()&&x.list.damage))throw new GameError(GameMessage.CANNOT_USE_ATTACK);
    return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_DAMAGE,PlayerType.TOP_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:op.requireDamaged?slots.filter(x=>!x.list.damage).map(({list,...target}:any)=>target):[]}),(chosen:any)=>{if(chosen?.length){if(op.coinCount){MULTIPLE_COIN_FLIPS_PROMPT(store,state,p,op.coinCount,(results:boolean[])=>{damage(chosen[0],op.amount*results.filter(Boolean).length);next();});return;}if(op.coin){COIN_FLIP_PROMPT(store,state,p,heads=>{if(heads)damage(chosen[0],op.amount);next();});return;}damage(chosen[0],op.amount);if(op.powerLock){const lock=new AddMarkerEffect(b,'WOTC_STARE_POWER_LOCK',source.getPokemonCard());lock.target=chosen[0];store.reduceEffect(state,lock);if(lock.markerAdded){chosen[0].wotcPowerLockUntilTurn=state.turn+1;state.wotcHasPowerLocks=true;}}}next();});
 }
 case 'switchOpponent':{
  if(!o.bench.some((l:any)=>l.getPokemonCard()))break;
  return store.prompt(state,new ChoosePokemonPrompt(o.id,GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{allowCancel:false}),(chosen:any)=>{store.reduceEffect(state,new GustOpponentBenchEffect(b,chosen[0]));next();});
 }
 case 'gust':case 'benchDamage':{
  if(op.surviving){const hp=new CheckHpEffect(o,o.active);store.reduceEffect(state,hp);if(o.active.damage>=hp.hp)break;}
  if(!o.bench.some((l:any)=>l.getPokemonCard()&&(!op.undamaged||!l.damage)))break;
  if(op.optional)return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_SWITCH,['Keep Active Pokemon','Switch Active Pokemon'],{allowCancel:false}),(choice:any)=>{if(choice===1)run(store,state,e,[{...op,optional:false}],next);else next();});
  return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_SWITCH,PlayerType.TOP_PLAYER,[SlotType.BENCH],{allowCancel:false,blocked:op.undamaged?o.bench.map((list:any,index:number)=>({list,index})).filter((s:any)=>s.list.damage).map((s:any)=>({player:PlayerType.TOP_PLAYER,slot:SlotType.BENCH,index:s.index})):[]}), (chosen:any)=>{if(chosen?.length){if(op.op==='gust')store.reduceEffect(state,new GustOpponentBenchEffect(b,chosen[0]));else damage(chosen[0],op.amount);}next();});
 }
 default:throw Error('Unrecognized compiled WOTC operation '+op.op);
 }return next();
}
for(const record of wotcData){
 const d=record.d;
 // Base/Jungle/Fossil keep their already tested original instances.
 if(['base1','base2','base3'].includes(d.set.id))continue;
 const original:any=record.reuse?originals.get(record.reuse):null;
 if(record.reuse&&!original)throw Error('Missing WOTC source '+record.reuse);
 const card:any=original?new original.constructor():d.supertype==='Energy'?new EnergyCard():d.supertype==='Trainer'?new TrainerCard():new PokemonCard();
 card.name=d.name;card.fullName='ILEX WOTC '+d.id;card.set=codes[d.set.id];card.setNumber=d.number;card._wotcId=d.id;
 if((d.rules||[]).some((r:string)=>/more than 1 Shining/.test(r)))card._wotcMaxCopies=1;
 if(d.supertype==='Pokémon'){
  if(record.babyRule){card.tags.push(CardTag.BABY);card.evolvesTo=({Cleffa:['Clefairy'],Igglybuff:['Jigglypuff'],Pichu:['Pikachu'],Elekid:['Electabuzz'],Magby:['Magmar'],Smoochum:['Jynx'],Tyrogue:['Hitmonchan','Hitmonlee','Hitmontop']} as any)[d.name]||[];}
  card.hp=+d.hp;card.cardType=(d.types||[]).map((t:string)=>types[t]);card.evolvesFrom=d.evolvesFrom||'';
  card.stage=d.subtypes.includes('Stage 2')?Stage.STAGE_2:d.subtypes.includes('Stage 1')?Stage.STAGE_1:Stage.BASIC;
  card.weakness=(d.weaknesses||[]).map((w:any)=>({type:types[w.type]}));card.resistance=(d.resistances||[]).map((w:any)=>({type:types[w.type],value:Number(w.value)}));card.retreat=(d.retreatCost||[]).map((t:string)=>types[t]);
  if(original&&card.attacks.length!==(d.attacks||[]).length)throw Error('WOTC attack count mismatch '+d.id);
  if(!original)card.attacks=(d.attacks||[]).map(()=>({}));
  card.attacks.forEach((a:any,i:number)=>{const printed=d.attacks[i];a.name=printed.name;a.cost=printed.cost.map((t:string)=>types[t]);a.damage=parseInt(printed.damage)||0;a.text=(printed.text||'').replace(/(Fire|Grass|Water|Lightning|Psychic|Fighting|Darkness|Metal) Energy/g,(_:any,t:string)=>'['+({Fire:'R',Grass:'G',Water:'W',Lightning:'L',Psychic:'P',Fighting:'F',Darkness:'D',Metal:'M'} as any)[t]+'] Energy');});
  if(!original){
   card.powers=(d.abilities||[]).map((a:any)=>({name:a.name,text:a.text,powerType:a.type==='Poké-Body'?PowerType.POKEBODY:a.type==='Poké-Power'?PowerType.POKEPOWER:PowerType.POKEMON_POWER,useWhenInPlay:record.powers.find((p:any,i:number)=>d.abilities[i]===a)?.kind.startsWith('activated')}));
   const ops=record.ops;card.reduceEffect=function(store:any,state:any,e:any){
   if(this._wotcUsedAttacks?.length&&!state.players.some((p:any)=>[p.active,...p.bench].some((l:any)=>l.cards.includes(this))))this._wotcUsedAttacks=[];
   if(e instanceof UseAttackEffect&&e.player.active.getPokemonCard()===this&&this._wotcUsedAttacks?.includes(e.attack.name))throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
   const link=this._wotcLinkedDefense;
   if(link&&link.turn===state.turn){const owner=state.players.find((p:any)=>p.active.getPokemonCard()===this&&p.active.marker.hasMarker(link.marker,this));if(owner){const opponent=StateUtils.getOpponent(state,owner);if(opponent.active.marker.hasMarker(link.marker,this)){
    if(link.noAttack&&e instanceof UseAttackEffect&&e.player===opponent)throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    if(link.reduction&&e instanceof ApplyWeaknessEffect&&e.source===opponent.active&&e.target===owner.active)e.damage=Math.max(0,e.damage-link.reduction);
   }}}
   if(e instanceof AfterDamageEffect&&e.source.getPokemonCard()===this&&!e._wotcDamageTracked){e._wotcDamageTracked=true;if(e.target===e.opponent.active)this._wotcLastAttackDamage=(this._wotcLastAttackDamage||0)+e.damage;if(e.target===e.opponent.active||e.opponent.bench.includes(e.target))this._wotcLastTotalAttackDamage=(this._wotcLastTotalAttackDamage||0)+e.damage;}
   if(record.babyRule&&e instanceof UseAttackEffect&&StateUtils.getOpponent(state,e.player).active.getPokemonCard()===this&&state.wotcBabyCheckTurn!==state.turn){
    state.wotcBabyCheckTurn=state.turn;e.preventDefault=true;return COIN_FLIP_PROMPT(store,state,e.player,heads=>{store.reduceEffect(state,heads?new UseAttackEffect(e.player,e.attack):new EndTurnEffect(e.player));});
   }
   if(this._wotcId===d.id&&record.powers?.length)wotcPowers(this,record.powers,store,state,e);
   const index=this.attacks.indexOf(e.attack);if(index<0)return state;
   if(e instanceof AttackEffect){this._wotcLastAttackDamage=0;this._wotcLastTotalAttackDamage=0;e._wotcAfterOps=[];const setup=e.source.nextTurnAttackBaseDamage;if(setup&&setup.attackName===e.attack.name&&setup.sourceCardName===this.fullName)e.damage=setup.baseDamage;attackContexts.set(this,e);return run(store,state,e,ops[index]);}
   if(e instanceof AfterAttackEffect){const b=attackContexts.get(this);if(!b)return state;b._wotcAfterPhase=true;return run(store,state,b,b._wotcAfterOps||[],()=>attackContexts.delete(this));}
   return state;
  };}
  if(d.name.startsWith('Dark ')&&!card.tags.includes(CardTag.DARK))card.tags.push(CardTag.DARK);
  if(d.name.startsWith('Unown')&&!card.tags.includes(CardTag.UNOWN))card.tags.push(CardTag.UNOWN);
 }else if(d.supertype==='Energy'&&!original){card.energyType=EnergyType.BASIC;card.provides=[types[d.name.replace(' Energy','')]];}
 if(d.supertype==='Trainer'&&!original){
  const stadium=record.trainerOps?.[0]?.op==='stadium'?record.trainerOps[0]:null;
  const machine=record.trainerOps?.[0]?.op==='technicalMachine'?record.trainerOps[0]:null;
  if(machine){card._tags=[CardTag.TECHNICAL_MACHINE];card.attacks=(d.attacks||[]).map((a:any)=>({name:a.name,cost:a.cost.map((t:string)=>types[t]),damage:parseInt(a.damage)||0,text:a.text}));}
  card._trainerType=stadium?TrainerType.STADIUM:(d.subtypes||[]).includes('Supporter')?TrainerType.SUPPORTER:TrainerType.ITEM;card.text=(d.rules||[]).join('\n');
  card._wotcStadiumAction=stadium&&['drawCoin','healCoin','lookTop','exchangeEnergy'].includes(stadium.kind);
  card.reduceEffect=function(store:any,state:any,e:any){
   if(machine){
    if(e instanceof TrainerEffect&&e.trainerCard===this){const slots=[{player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0,list:e.player.active},...e.player.bench.map((list:any,index:number)=>({player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index,list}))],eligible=slots.filter((s:any)=>{if(!s.list.getPokemonCard())return false;const type=new CheckPokemonTypeEffect(s.list);store.reduceEffect(state,type);return type.cardTypes.includes(types[machine.energy]);});if(!eligible.length)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);return store.prompt(state,new ChoosePokemonPrompt(e.player.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:slots.filter((s:any)=>!eligible.includes(s)).map(({list,...target}:any)=>target)}),(chosen:any)=>MOVE_CARDS(store,state,e.player.supporter,chosen[0],{cards:[this],sourceCard:this,sourceEffect:e}));}
    if(e instanceof CheckPokemonAttacksEffect&&e.player.active.cards.includes(this))for(const attack of this.attacks)if(!e.attacks.includes(attack))e.attacks.push(attack);
    if(e instanceof EndTurnEffect)for(const list of [e.player.active,...e.player.bench])if(list.cards.includes(this))MOVE_CARDS(store,state,list,e.player.discard,{cards:[this],sourceCard:this});
    const index=this.attacks.indexOf(e.attack);if(index<0)return state;
    if(e instanceof AttackEffect){e._wotcAfterOps=[];attackContexts.set(this,e);return run(store,state,e,machine.attacks[index]);}
    if(e instanceof AfterAttackEffect){const b=attackContexts.get(this);if(!b)return state;b._wotcAfterPhase=true;return run(store,state,b,b._wotcAfterOps||[],()=>attackContexts.delete(this));}return state;
   }
   if(stadium){
    if(StateUtils.getStadiumCard(state)!==this)return state;
    if(state.players.some((p:any)=>p.stadiumAndToolHaveNoEffectTurnsRemaining>0))return state;
    const kind=stadium.kind;
    if(e instanceof UseStadiumEffect&&e.stadium===this){
     if(!this._wotcStadiumAction)throw new GameError(GameMessage.CANNOT_USE_POWER);
     if(kind==='exchangeEnergy'){const p=e.player,o=StateUtils.getOpponent(state,p);if(!p.hand.cards.some((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC))throw new GameError(GameMessage.CANNOT_USE_POWER);return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,p.hand,{superType:SuperType.ENERGY,energyType:EnergyType.BASIC},{min:1,max:1,allowCancel:false}),(chosen:any)=>{p.hand.moveCardsTo(chosen,p.discard);store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,p.discard,{superType:SuperType.ENERGY,energyType:EnergyType.BASIC},{min:1,max:1,allowCancel:false}),(recovered:any)=>{p.discard.moveCardsTo(recovered,p.hand);store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,recovered),()=>{});});});}
     if(kind==='lookTop')return store.prompt(state,new ShowCardsPrompt(e.player.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,e.player.deck.cards.slice(0,2)),()=>{});
     return COIN_FLIP_PROMPT(store,state,e.player,heads=>{if(!heads)return;if(kind==='drawCoin')DRAW_CARDS(store,state,e.player,1);else store.reduceEffect(state,new HealEffect(e.player,e.player.active,20));});
    }
    if(e instanceof CheckRetreatCostEffect){const c=e.player.active.getPokemonCard();if(kind==='basicRetreat'&&c?.stage===Stage.BASIC)e.cost.push(CardType.COLORLESS);if(kind==='mistyRetreat'&&c?.name.includes('Misty')){const i=e.cost.indexOf(CardType.COLORLESS);if(i>=0)e.cost.splice(i,1);}}
    if(kind==='giovanniHeal'&&e instanceof EvolveEffect&&e.pokemonCard.name.includes('Giovanni'))store.reduceEffect(state,new HealEffect(e.player,e.target,20));
    if(kind==='blaineWeakness'&&e instanceof ApplyWeaknessEffect&&e.target.getPokemonCard()?.name.includes('Blaine')){const type=new CheckPokemonTypeEffect(e.source);store.reduceEffect(state,type);if(type.cardTypes.includes(CardType.WATER))e.ignoreWeakness=true;}
    if(kind==='brockResistance'&&e instanceof ApplyWeaknessEffect&&e.source.getPokemonCard()?.name.includes('Brock'))e.ignoreResistance=true;
    if(kind==='colorlessReduction'&&e instanceof PutDamageEffect){const type=new CheckPokemonTypeEffect(e.source);store.reduceEffect(state,type);if(type.cardTypes.includes(CardType.COLORLESS))e.wotcSproutReduction=30;}
    return state;
   }
   if(e instanceof TrainerEffect&&e.trainerCard===this){const b:any=new AttackEffect(e.player,StateUtils.getOpponent(state,e.player),{name:this.name,cost:[],damage:0,text:this.text});b._wotcTrainer=true;b._wotcTrainerCard=this;return run(store,state,b,record.trainerOps);}return state;};
 }
 if(d.supertype==='Energy'&&['Darkness Energy','Metal Energy'].includes(d.name)){
  card.text=(d.rules||[]).join('\n');const activeOnly=card.text.includes('Defending Pokémon');
  card.reduceEffect=function(store:any,state:any,e:any){
   if(e instanceof PutDamageEffect&&e.damage>0){
    if(this.name==='Darkness Energy'&&e.source.cards.includes(this)&&(!activeOnly||e.target===e.opponent.active))e.damage+=10;
    if(this.name==='Metal Energy'){
     if(e.source.cards.includes(this)){const type=new CheckPokemonTypeEffect(e.source);store.reduceEffect(state,type);if(!type.cardTypes.includes(CardType.METAL))e.reduceDamage(10);}
     if(e.target.cards.includes(this))e.reduceDamage(10);
    }
   }
   if(this.name==='Darkness Energy'&&e instanceof EndTurnEffect)for(const owner of state.players)for(const list of [owner.active,...owner.bench])if(list.cards.includes(this)&&list.getPokemonCard()){
    const type=new CheckPokemonTypeEffect(list);store.reduceEffect(state,type);if(!type.cardTypes.includes(CardType.DARK)&&!list.getPokemonCard().name.includes('Dark'))list.damage+=10;
   }
   return state;
  };
 }
 if(record.specialEnergy==='crystal'){
  card.energyType=EnergyType.SPECIAL;card.provides=[CardType.COLORLESS];card.text=(d.rules||[]).join('\n');
  card.reduceEffect=function(store:any,state:any,e:any){if(e instanceof CheckProvidedEnergyEffect&&e.source.cards.includes(this)){const provided=[...new Set(e.source.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC).flatMap((c:any)=>c.provides))];let entry=e.energyMap.find((x:any)=>x.card===this);if(!entry){entry={card:this,provides:[]};e.energyMap.push(entry);}entry.provides=provided.length?provided:[CardType.COLORLESS];}return state;};
 }
 supplemental.push(card);
}




