import { StateUtils, SuperType, EnergyType, CardType, CardTag, Stage, SpecialCondition, PowerType, ChooseCardsPrompt, ChoosePokemonPrompt, ConfirmPrompt, PlayerType, SlotType, GameMessage, GameError, CardList } from './game';
import { OrderCardsPrompt } from './game/store/prompts/order-cards-prompt';
import { ShowCardsPrompt, SelectPrompt, ShuffleDeckPrompt } from './game';
import { PowerEffect, EvolveEffect, AttackEffect, HealEffect, KnockOutEffect, AfterRetreatEffect } from './game/store/effects/game-effects';
import { PutDamageEffect, ApplyWeaknessEffect, AddSpecialConditionsEffect, AfterDamageEffect } from './game/store/effects/attack-effects';
import { MovedToActiveEffect } from './game/store/effects/game-effects';
import { AbstractAttackEffect } from './game/store/effects/attack-effects';
import { CheckHpEffect, CheckRetreatCostEffect, CheckProvidedEnergyEffect, CheckPokemonTypeEffect, CheckPokemonStatsEffect, AddSpecialConditionsPowerEffect } from './game/store/effects/check-effects';
import { AttachEnergyEffect, AfterEnergyAttachedEffect } from './game/store/effects/play-card-effects';
import { applyWeaknessAndResistance } from './game/store/effect-reducers/game-effect';
import { IS_POKEMON_POWER_BLOCKED, COIN_FLIP_PROMPT, MULTIPLE_COIN_FLIPS_PROMPT, MOVE_POKEMON_OFF_BOARD, MOVE_CARDS, DRAW_CARDS } from './game/store/prefabs/prefabs';
import { GamePhase } from './game/store/state/state';
const types:any={Fire:CardType.FIRE,Grass:CardType.GRASS,Water:CardType.WATER,Lightning:CardType.LIGHTNING,Psychic:CardType.PSYCHIC,Fighting:CardType.FIGHTING,Darkness:CardType.DARK,Metal:CardType.METAL};
class WotcPowerDamageEffect {
 readonly type='WOTC_POWER_DAMAGE_EFFECT';public preventDefault=false;
 constructor(public player:any,public source:any,public target:any,public damage:number,public sourceTypes:any[]){}
}
export function wotcPowers(card:any,plans:any[],store:any,state:any,e:any){
 const isOwnEvolution=e instanceof EvolveEffect&&e.pokemonCard===card;
 if(isOwnEvolution)card._wotcPowerTurn={};
 const list=isOwnEvolution?e.target:StateUtils.findCardList(state,card);
 const owner=isOwnEvolution?e.player:StateUtils.findOwner(state,list);
 if(!owner||(!isOwnEvolution&&list.getPokemonCard?.()!==card))return state;
 for(let index=0;index<plans.length;index++){
  const op=plans[index],power=card.powers[index],activated=e instanceof PowerEffect&&e.card===card&&e.power===power;
  const triggers=activated||isOwnEvolution&&op.kind.startsWith('onEvolution')||e instanceof CheckRetreatCostEffect&&op.kind==='retreatTax'||e instanceof CheckProvidedEnergyEffect&&op.kind==='convertEnergy'&&e.source===list||e instanceof PutDamageEffect&&(op.kind==='reduceDamage'&&e.target===list||op.kind==='confusionBonus'&&e.source===list)||e instanceof AfterRetreatEffect&&op.kind==='onRetreatDamage'&&e.player!==owner||e instanceof KnockOutEffect&&op.kind==='onKnockoutBeam'&&e.target===list&&state.phase===GamePhase.ATTACK&&state.players[state.activePlayer]!==owner;
  if(op.kind==='onAttachCrystalType'&&e instanceof CheckPokemonTypeEffect&&e.target===list&&list.marker.hasMarker('WOTC_CRYSTAL_TYPE',card)&&card._wotcCrystalTurn===state.turn){e.cardTypes=[card._wotcCrystalType];continue;}
  const additionalTriggers=e instanceof CheckRetreatCostEffect&&op.kind==='retreatSelf'&&e.player===owner&&owner.active===list||e instanceof CheckProvidedEnergyEffect&&op.kind==='multiplyBasicEnergy'&&e.player===owner||e instanceof AttachEnergyEffect&&op.kind.startsWith('onAttach')&&e.target===list&&e.energyCard.energyType===EnergyType.BASIC&&(op.energies?op.energies.some((t:string)=>e.energyCard.provides.includes(types[t])):e.energyCard.provides.includes(types[op.energy]))||e instanceof CheckHpEffect&&op.kind==='energyHp'&&e.target===list||e instanceof PutDamageEffect&&(['reduceBasicEnergyDamage','reduceBasicAttackerDamage','damageThreshold'].includes(op.kind)&&e.target===list||op.kind==='halveAllDamage');
  const attackEffectGuard=op.kind==='preventAttackEffects'&&e instanceof AbstractAttackEffect&&(e.target===list||e.type==='GUST_OPPONENT_BENCH_EFFECT'&&owner.active===list&&e.opponent===owner)&&e.player!==owner&&!e.attackEffect._wotcTrainer&&!['APPLY_WEAKNESS_EFFECT','AFTER_WEAKNESS_AND_RESISTANCE_EFFECT','DEAL_DAMAGE_EFFECT','PUT_DAMAGE_EFFECT','AFTER_DAMAGE_EFFECT'].includes(e.type);
  const conditionGuard=op.kind==='preventCondition'&&(e instanceof AddSpecialConditionsEffect||e instanceof AddSpecialConditionsPowerEffect)&&e.target===list;
  const handEnergyGuard=op.kind==='preventHandEnergy'&&e instanceof AttachEnergyEffect&&e.target===list&&owner.hand.cards.includes(e.energyCard)&&e.energyCard.provides.includes(types[op.energy]);
  const typeGuard=op.kind==='activatedSelfType'&&e instanceof CheckPokemonTypeEffect&&e.target===list&&card._wotcSelfTypeTurn===state.turn&&list.marker.hasMarker('WOTC_SELF_TYPE',card);
  const retreatNameGuard=op.kind==='retreatOwnName'&&e instanceof CheckRetreatCostEffect&&e.player===owner&&owner.bench.includes(list)&&owner.active.getPokemonCard()?.name.includes(op.nameContains);
  const reactiveDamage=op.kind.startsWith('onDamaged')&&e instanceof AfterDamageEffect&&e.target===list&&e.player!==owner&&e.damage>0&&state.phase===GamePhase.ATTACK;
  const attachDamage=op.kind==='onOpponentAttachDamage'&&e instanceof AttachEnergyEffect&&e.player!==owner&&e.player.hand.cards.includes(e.energyCard);
  const promotionDamage=op.kind==='onOpponentPromotionDamage'&&e instanceof MovedToActiveEffect&&e.player!==owner&&state.players[state.activePlayer]===e.player;
  const retreatDiscard=op.kind==='onOpponentRetreatDiscard'&&e instanceof AfterRetreatEffect&&e.player!==owner;
  const allDamageGuard=op.kind==='reduceOwnDamageByType'&&(e instanceof PutDamageEffect||e instanceof WotcPowerDamageEffect)&&StateUtils.findOwner(state,e.target)===owner;
  const attachedEnergy=op.kind==='onAttachedDiscardEnergy'&&e instanceof AfterEnergyAttachedEffect&&e.target===list&&e.fromHand&&e.energyCard.provides.includes(types[op.energy]);
  const fullAttackGuard=['preventBenchAttack','preventAttackByEvolution'].includes(op.kind)&&e instanceof AbstractAttackEffect&&e.player!==owner&&!e.attackEffect._wotcTrainer&&!['APPLY_WEAKNESS_EFFECT','AFTER_DAMAGE_EFFECT'].includes(e.type)&&(op.kind==='preventBenchAttack'?owner.active===list&&owner.bench.includes(e.target):(e.target===list||e.type==='GUST_OPPONENT_BENCH_EFFECT'&&owner.active===list&&e.opponent===owner)&&e.source.getPokemonCard()?.stage!==Stage.BASIC);
  if(!triggers&&!additionalTriggers&&!attackEffectGuard&&!conditionGuard&&!handEnergyGuard&&!typeGuard&&!retreatNameGuard&&!reactiveDamage&&!attachDamage&&!promotionDamage&&!retreatDiscard&&!allDamageGuard&&!attachedEnergy&&!fullAttackGuard)continue;
  
  const disabled=state.wotcGlobalPowerLockUntilTurn>=state.turn||(op.conditions==='all'&&list.specialConditions.length)||(op.conditions==='legacy'&&list.specialConditions.some((c:any)=>[SpecialCondition.ASLEEP,SpecialCondition.CONFUSED,SpecialCondition.PARALYZED,...((state.rules as any).wotcPowerConditions?[SpecialCondition.POISONED,SpecialCondition.BURNED]:[])].includes(c)))||IS_POKEMON_POWER_BLOCKED(store,state,owner,card);
  const pokePowerLocked=power.powerType===PowerType.POKEPOWER&&list.marker.hasMarker('WOTC_POKEPOWER_LOCK')&&list.wotcPokePowerLockUntilTurn>=state.turn;
  if(disabled||pokePowerLocked){if(activated)throw new GameError(GameMessage.BLOCKED_BY_EFFECT);continue;}
  if(activated&&op.once&&card._wotcPowerTurn?.[index]===state.turn)throw new GameError(GameMessage.POWER_ALREADY_USED);
  if(activated&&op.active&&owner.active!==list)throw new GameError(GameMessage.CANNOT_USE_POWER);
  if(activated&&op.bench&&!owner.bench.includes(list))throw new GameError(GameMessage.CANNOT_USE_POWER);
  if(activated&&op.benchNames&&!op.benchNames.every((name:string)=>owner.bench.some((l:any)=>l.getPokemonCard()?.name===name)))throw new GameError(GameMessage.CANNOT_USE_POWER);
  if(activated&&op.oncePerName&&owner._wotcSharedPowerTurns?.[power.name]===state.turn)throw new GameError(GameMessage.POWER_ALREADY_USED);
  const use=()=>{card._wotcPowerTurn??={};card._wotcPowerTurn[index]=state.turn;};
  const powerDamage=(target:any,amount:number,weakness=false,capturedTypes?:any[])=>{if(weakness){const b=new AttackEffect(owner,StateUtils.getOpponent(state,owner),{name:power.name,cost:[],damage:amount,text:power.text});b.source=list;const wr=new ApplyWeaknessEffect(b,amount);wr.target=target;store.reduceEffect(state,wr);amount=wr.damage;}const type=new CheckPokemonTypeEffect(list);if(!capturedTypes)store.reduceEffect(state,type);const damage=new WotcPowerDamageEffect(owner,list,target,amount,capturedTypes||type.cardTypes);store.reduceEffect(state,damage);if(!damage.preventDefault)target.damage+=Math.max(0,damage.damage);};
  switch(op.kind){
  case 'preventBenchAttack':case 'preventAttackByEvolution':e.preventDefault=true;if(typeof e.damage==='number')e.damage=0;break;
  case 'activatedUnownShield':use();owner._wotcSharedPowerTurns??={};owner._wotcSharedPowerTurns[power.name]=state.turn;COIN_FLIP_PROMPT(store,state,owner,heads=>{if(heads)owner.wotcUnownShieldUntilTurn=state.turn+1;});break;
  case 'onAttachedDiscardEnergy':store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,list,{superType:SuperType.ENERGY},{min:1,max:1,allowCancel:false}),(chosen:any)=>MOVE_CARDS(store,state,list,owner.discard,{cards:chosen,sourceCard:card,sourceEffect:e}));break;
  case 'activatedPeekPrize':{const prizes=owner.prizes.map((list:any,index:number)=>({list,index})).filter((s:any)=>s.list.cards.length);if(!prizes.length)throw new GameError(GameMessage.CANNOT_USE_POWER);use();store.prompt(state,new SelectPrompt(owner.id,GameMessage.CHOOSE_OPTION,prizes.map((s:any)=>'Prize '+(s.index+1)),{allowCancel:false}),(index:any)=>store.prompt(state,new ShowCardsPrompt(owner.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,prizes[index].list.cards),()=>{}));break;}
  case 'reduceOwnDamageByType':{if(op.nonstackName&&[owner.active,...owner.bench].filter((l:any)=>l.getPokemonCard()?.name===card.name).length!==1)break;const sourceTypes=e instanceof WotcPowerDamageEffect?e.sourceTypes:(()=>{const type=new CheckPokemonTypeEffect(e.source);store.reduceEffect(state,type);return type.cardTypes;})();if(sourceTypes.includes(types[op.energy])){const key='wotcDamageReduction'+power.name;if(e[key])break;e[key]=true;e.damage=Math.max(0,e.damage-op.amount);}break;}
  case 'onDamagedStatus':{if(op.active&&owner.active!==list)break;const perform=()=>store.reduceEffect(state,new AddSpecialConditionsPowerEffect(owner,card,e.source,[(SpecialCondition as any)[op.condition]]));if(op.coin)COIN_FLIP_PROMPT(store,state,owner,heads=>{if(heads)perform();});else perform();break;}
  case 'onDamagedDiscardEnergy':COIN_FLIP_PROMPT(store,state,owner,heads=>{if(!heads||!e.source.cards.some((c:any)=>c.superType===SuperType.ENERGY))return;store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,e.source,{superType:SuperType.ENERGY},{min:1,max:1,allowCancel:false}),(chosen:any)=>MOVE_CARDS(store,state,e.source,e.player.discard,{cards:chosen,sourceCard:card,sourceEffect:e}));});break;
  case 'onDamagedReturnDamage':if(!op.requireCondition||list.specialConditions.includes((SpecialCondition as any)[op.requireCondition]))powerDamage(e.source,op.amount);break;
  case 'onOpponentAttachDamage':if(!op.nonstackName||[owner.active,...owner.bench].filter((l:any)=>l.getPokemonCard()?.name===card.name).length===1)powerDamage(e.target,op.amount);break;
  case 'onOpponentPromotionDamage':powerDamage(e.player.active,op.amount);break;
  case 'onOpponentRetreatDiscard':if(!op.active||owner.active===list)MOVE_CARDS(store,state,e.target,e.player.discard,{cards:e.target.cards.filter((c:any)=>c.superType===SuperType.ENERGY),sourceCard:card,sourceEffect:e});break;
  case 'onAttachOpponentSwitch':{if(!owner.hand.cards.includes(e.energyCard))break;const opponent=StateUtils.getOpponent(state,owner);if(opponent.bench.some((l:any)=>l.getPokemonCard()))store.prompt(state,new ChoosePokemonPrompt(opponent.id,GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{allowCancel:false}),(chosen:any)=>opponent.switchPokemon(chosen[0],store,state));break;}
  case 'activatedSelfType':if(activated){use();card._wotcSelfTypeTurn=state.turn;list.marker.addMarker('WOTC_SELF_TYPE',card,'ability','pokemon');}else e.cardTypes=[types[op.energy]];break;
  case 'activatedActiveEnergyType':use();owner.active.wotcEnergyTypeTurn=state.turn;owner.active.wotcEnergyTypeFrom=types[op.from];owner.active.wotcEnergyTypeTo=types[op.energy];owner.active.marker.addMarker('WOTC_ENERGY_TYPE',card,'ability','pokemon');break;
  case 'retreatOwnName':e.cost=[];break;
  case 'activatedBenchPowerLock':{const opponent=StateUtils.getOpponent(state,owner),eligible=opponent.bench.filter((l:any)=>l.getPokemonCard()?.powers.some((power:any)=>power.powerType!==PowerType.BABY_RULE));if(!eligible.length)throw new GameError(GameMessage.CANNOT_USE_POWER);store.prompt(state,new ChoosePokemonPrompt(owner.id,GameMessage.CHOOSE_POKEMON_TO_SWITCH,PlayerType.TOP_PLAYER,[SlotType.BENCH],{allowCancel:false,blocked:opponent.bench.map((list:any,index:number)=>({list,index})).filter((s:any)=>!eligible.includes(s.list)).map((s:any)=>({player:PlayerType.TOP_PLAYER,slot:SlotType.BENCH,index:s.index}))}),(chosen:any)=>{use();chosen[0].marker.addMarker('WOTC_STARE_POWER_LOCK',card,'ability','pokemon');chosen[0].wotcPowerLockUntilTurn=state.turn;state.wotcHasPowerLocks=true;});break;}
  case 'preventCondition':e.specialConditions=e.specialConditions.filter((c:any)=>c!==(SpecialCondition as any)[op.condition]);break;
  case 'preventHandEnergy':throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
  case 'activatedSearch':{use();const eligible=owner.deck.cards.filter((c:any)=>c.superType===(op.category==='Trainer'?SuperType.TRAINER:SuperType.POKEMON)),shuffle=()=>store.prompt(state,new ShuffleDeckPrompt(owner.id),(order:any)=>owner.deck.applyOrder(order));if(!eligible.length){shuffle();break;}store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_HAND,owner.deck,{superType:op.category==='Trainer'?SuperType.TRAINER:SuperType.POKEMON},{min:0,max:1,allowCancel:false}),(chosen:any)=>{owner.deck.moveCardsTo(chosen||[],owner.hand);if(chosen?.length)store.prompt(state,new ShowCardsPrompt(StateUtils.getOpponent(state,owner).id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,chosen),shuffle);else shuffle();});break;}
  case 'activatedRefreshHand':{use();const count=owner.hand.cards.length;owner.hand.moveTo(owner.deck);store.prompt(state,new ShuffleDeckPrompt(owner.id),(order:any)=>{owner.deck.applyOrder(order);DRAW_CARDS(store,state,owner,count);});break;}
  case 'activatedRecoverTrainerCoin':use();COIN_FLIP_PROMPT(store,state,owner,heads=>{if(!heads||!owner.discard.cards.some((c:any)=>c.superType===SuperType.TRAINER))return;store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_HAND,owner.discard,{superType:SuperType.TRAINER},{min:1,max:1,allowCancel:false}),(chosen:any)=>owner.discard.moveCardsTo(chosen,owner.hand));});break;
  case 'activatedReturnActive':use();MOVE_POKEMON_OFF_BOARD(store,state,owner.active,{pokemonDestination:owner.hand,attachedDestination:owner.hand,sourceCard:card,sourceEffect:e});break;
  case 'activatedPeekOpponent':{use();const opponent=StateUtils.getOpponent(state,owner);if(opponent.deck.cards.length)store.prompt(state,new ShowCardsPrompt(owner.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,opponent.deck.cards.slice(0,op.amount)),()=>{});break;}
  case 'activatedBothShuffleCoin':use();COIN_FLIP_PROMPT(store,state,owner,heads=>{if(heads){const opponent=StateUtils.getOpponent(state,owner);store.prompt(state,new ShuffleDeckPrompt(opponent.id),(order:any)=>{opponent.deck.applyOrder(order);store.prompt(state,new ShuffleDeckPrompt(owner.id),(ownOrder:any)=>owner.deck.applyOrder(ownOrder));});}});break;
  case 'activatedBothRevealCoin':use();COIN_FLIP_PROMPT(store,state,owner,heads=>{if(!heads)return;const opponent=StateUtils.getOpponent(state,owner),own=()=>{if(owner.hand.cards.length)store.prompt(state,new ShowCardsPrompt(opponent.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,owner.hand.cards),()=>{});};if(opponent.hand.cards.length)store.prompt(state,new ShowCardsPrompt(owner.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,opponent.hand.cards),own);else own();});break;
  case 'activatedAttachEnergyCoin':case 'onEvolutionAttachEnergyCoin':{
   if(isOwnEvolution&&op.active&&owner.active!==list)break;
   const perform=()=>{use();MULTIPLE_COIN_FLIPS_PROMPT(store,state,owner,op.count||1,(results:boolean[])=>{const count=results.filter(Boolean).length;if(!count)return;const zone=op.zone==='hand'?owner.hand:owner.discard,cards=zone.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&(!op.basic||c.energyType===EnergyType.BASIC)&&(!op.energy||c.provides.includes(types[op.energy])));
    const slots=[{player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0,list:owner.active},...owner.bench.map((list:any,index:number)=>({player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index,list}))],allowed=(target:any)=>{if(!target.getPokemonCard()||op.bench&&target===owner.active)return false;if(op.targetType){const type=new CheckPokemonTypeEffect(target);store.reduceEffect(state,type);return type.cardTypes.includes(types[op.targetType]);}return true;};if(!cards.length||!slots.some((s:any)=>allowed(s.list)))return;
    store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_ATTACH,zone,{superType:SuperType.ENERGY},{min:Math.min(count,cards.length),max:Math.min(count,cards.length),allowCancel:false,blocked:zone.cards.map((c:any,i:number)=>cards.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{const attach=(index:number)=>{if(index>=chosen.length)return;const put=(target:any)=>{if(zone===owner.hand)store.reduceEffect(state,new AttachEnergyEffect(owner,chosen[index],target));else MOVE_CARDS(store,state,zone,target,{cards:[chosen[index]],sourceCard:card,sourceEffect:e});attach(index+1);};if(op.toSelf)return put(list);store.prompt(state,new ChoosePokemonPrompt(owner.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,op.bench?[SlotType.BENCH]:[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:slots.filter((s:any)=>!allowed(s.list)).map(({list,...target}:any)=>target)}),(chosenTarget:any)=>put(chosenTarget[0]));};attach(0);});
   });};if(isOwnEvolution)store.prompt(state,new ConfirmPrompt(owner.id,GameMessage.WANT_TO_USE_ABILITY),(yes:any)=>{if(yes)perform();});else perform();break;
  }
  case 'activatedBenchShuffle':{if(!owner.bench.some((l:any)=>l.getPokemonCard()))throw new GameError(GameMessage.CANNOT_USE_POWER);store.prompt(state,new ChoosePokemonPrompt(owner.id,GameMessage.CHOOSE_POKEMON_TO_SWITCH,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{allowCancel:true}),(chosen:any)=>{if(!chosen?.length)return;use();MOVE_POKEMON_OFF_BOARD(store,state,chosen[0],{pokemonDestination:owner.deck,attachedDestination:owner.deck,sourceCard:card,sourceEffect:e});store.prompt(state,new ShuffleDeckPrompt(owner.id),(order:any)=>owner.deck.applyOrder(order));});break;}
  case 'activatedPlunge':use();COIN_FLIP_PROMPT(store,state,owner,heads=>{if(!heads)return;const cards=owner.active.cards.filter((c:any)=>c.superType===SuperType.ENERGY);MOVE_CARDS(store,state,owner.active,list,{cards,sourceCard:card,sourceEffect:e});owner.switchPokemon(list,store,state);});break;
  case 'activatedEvolveActive':{const target=owner.active,eligible=owner.deck.cards.filter((c:any)=>c.superType===SuperType.POKEMON&&c.evolvesFrom===target.getPokemonCard()?.name);use();const shuffle=()=>store.prompt(state,new ShuffleDeckPrompt(owner.id),(order:any)=>owner.deck.applyOrder(order));if(!eligible.length){shuffle();break;}store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_HAND,owner.deck,{superType:SuperType.POKEMON},{min:0,max:1,allowCancel:false,blocked:owner.deck.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{if(chosen?.length){owner.deck.moveCardsTo(chosen,owner.hand);store.reduceEffect(state,new EvolveEffect(owner,target,chosen[0]));}shuffle();});break;}
  case 'activatedBenchReturn':use();COIN_FLIP_PROMPT(store,state,owner,heads=>{if(heads)MOVE_POKEMON_OFF_BOARD(store,state,list,{pokemonDestination:owner.hand,attachedDestination:owner.hand,sourceCard:card,sourceEffect:e});});break;
  case 'activatedOpponentSwitch':{const opponent=StateUtils.getOpponent(state,owner);if(!opponent.bench.some((l:any)=>l.getPokemonCard()))throw new GameError(GameMessage.CANNOT_USE_POWER);use();store.prompt(state,new ChoosePokemonPrompt(opponent.id,GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{allowCancel:false}),(chosen:any)=>opponent.switchPokemon(chosen[0],store,state));break;}
  case 'activatedClearBoth':use();for(const player of state.players){player.active.specialConditions=player.active.specialConditions.filter((c:any)=>!op.conditionsApplied.some((name:string)=>(SpecialCondition as any)[name]===c));if(!player.active.specialConditions.includes(SpecialCondition.POISONED))player.active.poisonDamage=10;}break;
  case 'activatedHandPokemonShuffle':{use();COIN_FLIP_PROMPT(store,state,owner,heads=>{const opponent=StateUtils.getOpponent(state,owner);if(!heads||!opponent.hand.cards.length)return;store.prompt(state,new ShowCardsPrompt(owner.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,opponent.hand.cards),()=>{if(!opponent.hand.cards.some((c:any)=>c.superType===SuperType.POKEMON))return;store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_HAND,opponent.hand,{superType:SuperType.POKEMON},{min:1,max:1,allowCancel:false}),(chosen:any)=>{opponent.hand.moveCardsTo(chosen,opponent.deck);store.prompt(state,new ShuffleDeckPrompt(opponent.id),(order:any)=>opponent.deck.applyOrder(order));});});});break;}
  case 'activatedBothDiscardEnergy':{use();COIN_FLIP_PROMPT(store,state,owner,heads=>{if(!heads)return;const opponent=StateUtils.getOpponent(state,owner),discard=(target:any,player:any,finish:()=>void)=>{if(!target.cards.some((c:any)=>c.superType===SuperType.ENERGY))return finish();store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,target,{superType:SuperType.ENERGY},{min:1,max:1,allowCancel:false}),(chosen:any)=>{target.moveCardsTo(chosen,player.discard);finish();});};discard(list,owner,()=>discard(opponent.active,opponent,()=>{}));});break;}
  case 'preventAttackEffects':e.preventDefault=true;break;
  case 'activatedBothSwitch':{use();const opponent=StateUtils.getOpponent(state,owner);const own=()=>{if(owner.bench.some((l:any)=>l.getPokemonCard()))store.prompt(state,new ChoosePokemonPrompt(owner.id,GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{allowCancel:false}),(chosen:any)=>owner.switchPokemon(chosen[0],store,state));};if(opponent.bench.some((l:any)=>l.getPokemonCard()))store.prompt(state,new ChoosePokemonPrompt(opponent.id,GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{allowCancel:false}),(chosen:any)=>{opponent.switchPokemon(chosen[0],store,state);own();});else own();break;}
  case 'activatedDrawTop':{if(!owner.deck.cards.length)throw new GameError(GameMessage.CANNOT_USE_POWER);use();owner.deck.moveCardsTo(owner.deck.cards.slice(0,1),owner.hand);store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_HAND,owner.hand,{}, {min:1,max:1,allowCancel:false}),(chosen:any)=>{owner.hand.moveCardsTo(chosen,owner.deck);const top=new Set(chosen);owner.deck.cards=[...chosen,...owner.deck.cards.filter((c:any)=>!top.has(c))];});break;}
  case 'activatedOpponentPeekShuffle':{use();COIN_FLIP_PROMPT(store,state,owner,heads=>{const opponent=StateUtils.getOpponent(state,owner);if(!heads||!opponent.deck.cards.length)return;store.prompt(state,new ShowCardsPrompt(owner.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,opponent.deck.cards.slice(0,1)),()=>store.prompt(state,new SelectPrompt(owner.id,GameMessage.CHOOSE_CARDS_ORDER,['Keep deck order','Shuffle opponent deck'],{allowCancel:false}),(choice:any)=>{if(choice===1)store.prompt(state,new ShuffleDeckPrompt(opponent.id),(order:any)=>opponent.deck.applyOrder(order));}));});break;}
  case 'activatedOrderTop':{use();const top=new CardList();top.cards=owner.deck.cards.slice(0,op.amount);if(!top.cards.length)break;store.prompt(state,new OrderCardsPrompt(owner.id,GameMessage.CHOOSE_CARDS_ORDER,top,{allowCancel:false}),(order:any)=>{owner.deck.cards=[...order.map((i:number)=>top.cards[i]),...owner.deck.cards.slice(top.cards.length)];});break;}
  case 'activatedBenchCounters':use();COIN_FLIP_PROMPT(store,state,owner,heads=>{if(heads)for(const target of StateUtils.getOpponent(state,owner).bench)if(target.getPokemonCard())target.damage+=op.amount;});break;
  case 'activatedDiscardStatus':{const eligible=list.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&(!op.basic||c.energyType===EnergyType.BASIC));if(!eligible.length)throw new GameError(GameMessage.CANNOT_USE_POWER);store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,list,{superType:SuperType.ENERGY,...(op.basic?{energyType:EnergyType.BASIC}:{})},{min:1,max:1,allowCancel:true}),(chosen:any)=>{if(!chosen?.length)return;use();list.moveCardsTo(chosen,owner.discard);store.reduceEffect(state,new AddSpecialConditionsPowerEffect(owner,card,StateUtils.getOpponent(state,owner).active,[(SpecialCondition as any)[op.condition]]));});break;}
  case 'activatedHealSleep':use();store.reduceEffect(state,new HealEffect(owner,list,op.amount));store.reduceEffect(state,new AddSpecialConditionsPowerEffect(owner,card,list,[SpecialCondition.ASLEEP]));break;
  case 'onEvolutionStatus':if(!op.active||owner.active===list)store.reduceEffect(state,new AddSpecialConditionsPowerEffect(owner,card,StateUtils.getOpponent(state,owner).active,op.conditionsApplied.map((c:string)=>(SpecialCondition as any)[c])));break;
  case 'onEvolutionMill':COIN_FLIP_PROMPT(store,state,owner,heads=>{const player=heads?StateUtils.getOpponent(state,owner):owner;player.deck.moveCardsTo(player.deck.cards.slice(0,op.amount),player.discard);});break;
  case 'onAttachCrystalType':card._wotcCrystalType=e.energyCard.provides[0];card._wotcCrystalTurn=state.turn;list.marker.addMarker('WOTC_CRYSTAL_TYPE',card);break;
  case 'energyHp':{const energy=new CheckProvidedEnergyEffect(owner,list);store.reduceEffect(state,energy);e.hp+=energy.energyMap.filter((x:any)=>x.provides.includes(types[op.energy])||x.provides.includes(CardType.ANY)).length*op.amount;break;}
  case 'reduceBasicEnergyDamage':e.reduceDamage(Math.min(op.cap,op.amount*list.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC).length));break;
  case 'reduceBasicAttackerDamage':{const attacker=e.source.getPokemonCard();if(attacker?.stage===Stage.BASIC&&!attacker.tags.includes(CardTag.BABY))e.reduceDamage(op.amount);break;}
  case 'damageThreshold':if(e.damage>0&&e.damage<=op.threshold)e.damage=op.amount;break;
  case 'halveAllDamage':if(owner.active===list){const key='wotcHalfDamage'+power.name;if(e[key])break;e[key]=true;e.damage=Math.ceil(e.damage/20)*10;}break;
  case 'retreatSelf':{
   if(op.defenderEvolved&&StateUtils.getOpponent(state,owner).active.getPokemonCard()?.stage===Stage.BASIC)break;
   const energy=new CheckProvidedEnergyEffect(owner,list);store.reduceEffect(state,energy);
   if(op.energy&&!energy.energyMap.some((x:any)=>x.provides.includes(types[op.energy])||x.provides.includes(CardType.ANY)))break;
   if(op.zero){e.cost=[];break;}
   const change=op.perEnergy?op.perEnergy*energy.energyMap.flatMap((x:any)=>x.provides).filter((t:any)=>!op.energy||t===types[op.energy]||t===CardType.ANY).length:op.amount;
   if(change>0)e.cost.push(...Array(change).fill(CardType.COLORLESS));else for(let n=0;n<-change;n++){const i=e.cost.indexOf(CardType.COLORLESS);if(i>=0)e.cost.splice(i,1);}break;
  }
  case 'multiplyBasicEnergy':{
   const key='wotcEnergyMultiply'+power.name;if(e[key])break;
   const type=new CheckPokemonTypeEffect(e.source);store.reduceEffect(state,type);if(!type.cardTypes.includes(types[op.energy]))break;e[key]=true;
   for(const energy of e.source.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC&&c.provides.includes(types[op.energy]))){let entry=e.energyMap.find((x:any)=>x.card===energy);if(!entry){entry={card:energy,provides:[]};e.energyMap.push(entry);}entry.provides=Array(op.amount).fill(types[op.energy]);}break;
  }
  case 'onAttachHeal':store.reduceEffect(state,new HealEffect(owner,list,op.amount));break;
  case 'onAttachClearConditions':list.specialConditions=[];list.poisonDamage=10;list.burnDamage=20;break;
  case 'activatedStatus':use();store.reduceEffect(state,new AddSpecialConditionsPowerEffect(owner,card,StateUtils.getOpponent(state,owner).active,op.conditions.map((c:string)=>(SpecialCondition as any)[c])));break;
  case 'activatedHealAllCoin':case 'onEvolutionHealAllCoin':case 'onEvolutionHealCoin':{
   const perform=()=>{use();COIN_FLIP_PROMPT(store,state,owner,heads=>{
    if(op.kind==='onEvolutionHealCoin'){store.reduceEffect(state,new HealEffect(owner,list,heads?op.heads:op.tails));return;}
    if(!heads)return;for(const player of op.both?state.players:[owner])for(const target of [player.active,...player.bench])if(target.getPokemonCard()){
     if(op.energy){const type=new CheckPokemonTypeEffect(target);store.reduceEffect(state,type);if(!type.cardTypes.includes(types[op.energy]))continue;}
     store.reduceEffect(state,new HealEffect(player,target,op.amount??target.damage));
    }
   });};
   if(isOwnEvolution)store.prompt(state,new ConfirmPrompt(owner.id,GameMessage.WANT_TO_USE_ABILITY),(yes:any)=>{if(yes)perform();});else perform();break;
  }
  case 'activatedMoveEnergy':{
   const slots=[{player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0,list:owner.active},...owner.bench.map((list:any,index:number)=>({player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index,list}))];
   const allowed=(l:any)=>l.getPokemonCard()&&(!op.names||op.names.includes(l.getPokemonCard().name));
   const eligible=(l:any)=>{const energy=new CheckProvidedEnergyEffect(owner,l);store.reduceEffect(state,energy);return energy.energyMap.filter((x:any)=>(!op.basic||x.card.superType===SuperType.ENERGY&&x.card.energyType===EnergyType.BASIC)&&(!op.energy||x.provides.includes(types[op.energy])||x.provides.includes(CardType.ANY))).map((x:any)=>x.card);};
   const destination=op.toActive?owner.active:op.toSelf?list:undefined;
   const fromSlots=slots.filter((s:any)=>allowed(s.list)&&(!op.fromBench||s.slot===SlotType.BENCH)&&s.list!==destination&&eligible(s.list).length&&slots.some((t:any)=>t.list!==s.list&&allowed(t.list)&&(!destination||t.list===destination)));
   if(!fromSlots.length)throw new GameError(GameMessage.CANNOT_USE_POWER);
   store.prompt(state,new ChoosePokemonPrompt(owner.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:true,blocked:slots.filter((s:any)=>!fromSlots.includes(s)).map(({list,...target}:any)=>target)}),(chosen:any)=>{
    if(!chosen?.length)return;const from=chosen[0],cards=eligible(from);
    store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_ATTACH,from,{},{min:1,max:1,allowCancel:false,blocked:from.cards.map((c:any,i:number)=>cards.includes(c)?-1:i).filter((i:number)=>i>=0)}),(energy:any)=>{
     if(destination){use();from.moveCardsTo(energy,destination);return;}
     store.prompt(state,new ChoosePokemonPrompt(owner.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:slots.filter((s:any)=>s.list===from||!allowed(s.list)).map(({list,...target}:any)=>target)}),(to:any)=>{use();from.moveCardsTo(energy,to[0]);});
    });
   });break;
  }
  case 'onRetreatDamage':COIN_FLIP_PROMPT(store,state,e.player,heads=>{if(!heads)powerDamage(e.target,op.amount);});break;
  case 'onKnockoutBeam':{
   const energy=new CheckProvidedEnergyEffect(owner,list);store.reduceEffect(state,energy);const count=energy.energyMap.flatMap((x:any)=>x.provides).filter((t:any)=>t===types[op.energy]||t===CardType.ANY).length;
   const opponent=StateUtils.getOpponent(state,owner),attacker=opponent.active;
   // KO cleanup empties this slot before the animated coin callback resolves.
   // Capture both types and the attacker's defenses while the source is in play.
   const sourceTypes=new CheckPokemonTypeEffect(list),stats=new CheckPokemonStatsEffect(attacker);store.reduceEffect(state,sourceTypes);store.reduceEffect(state,stats);
   const beam=applyWeaknessAndResistance(count*op.amount,sourceTypes.cardTypes,stats.weakness,stats.resistance);
   COIN_FLIP_PROMPT(store,state,owner,heads=>{if(heads)powerDamage(attacker,beam,false,sourceTypes.cardTypes);});break;
  }
  case 'retreatTax':{
   if(op.active&&owner.active!==list)break;if(!op.both&&e.player===owner)break;
   const key='wotcRetreatTax'+power.name;if(op.nonstack&&(e as any)[key])break;(e as any)[key]=true;
   e.cost.push(...Array(op.amount).fill(CardType.COLORLESS));break;
  }
  case 'convertEnergy':{
   for(const energy of list.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&(!op.basic||c.energyType===EnergyType.BASIC))){
    let entry=e.energyMap.find((x:any)=>x.card===energy);if(!entry){entry={card:energy,provides:[...energy.provides]};e.energyMap.push(entry);}entry.provides=entry.provides.map(()=>types[op.energy]);
   }break;
  }
  case 'reduceDamage':e.reduceDamage(op.amount);break;
  case 'confusionBonus':if(list.specialConditions.includes(SpecialCondition.CONFUSED)&&e.damage>0)e.damage+=op.amount;break;
  case 'activatedHeal':if(!list.damage)throw new GameError(GameMessage.CANNOT_USE_POWER);use();store.reduceEffect(state,new HealEffect(owner,list,op.amount));break;
  case 'activatedClearConditions':if(!owner.active.specialConditions.length)throw new GameError(GameMessage.CANNOT_USE_POWER);use();owner.active.specialConditions=[];owner.active.poisonDamage=10;owner.active.burnDamage=20;break;
  case 'activatedDiscardHand':{
   if(!owner.hand.cards.some((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC&&c.provides.includes(types[op.energy])))throw new GameError(GameMessage.CANNOT_USE_POWER);
   store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,owner.hand,{superType:SuperType.ENERGY,energyType:EnergyType.BASIC,cardType:types[op.energy]},{min:1,max:1,allowCancel:true}),(chosen:any)=>{if(chosen?.length)owner.hand.moveCardsTo(chosen,owner.discard);});break;
  }
  case 'activatedGather':{
   const eligible=(from:any)=>{const energy=new CheckProvidedEnergyEffect(owner,from);store.reduceEffect(state,energy);return energy.energyMap.filter((x:any)=>x.provides.includes(types[op.energy])||x.provides.includes(CardType.ANY)).map((x:any)=>x.card);};
   const lists=[owner.active,...owner.bench].filter(l=>l!==list&&l.getPokemonCard()&&eligible(l).length);
   if(!lists.length)throw new GameError(GameMessage.CANNOT_USE_POWER);
   const blocked=[{slot:SlotType.ACTIVE,index:0,list:owner.active},...owner.bench.map((list:any,index:number)=>({slot:SlotType.BENCH,index,list}))].filter(x=>!lists.includes(x.list)).map(x=>({player:PlayerType.BOTTOM_PLAYER,slot:x.slot,index:x.index}));
   store.prompt(state,new ChoosePokemonPrompt(owner.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:true,blocked}),(chosen:any)=>{if(!chosen?.length)return;const from=chosen[0],cards=eligible(from);store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_HAND,from,{},{min:1,max:1,allowCancel:false,blocked:from.cards.map((c:any,i:number)=>cards.includes(c)?-1:i).filter((i:number)=>i>=0)}),(energy:any)=>{if(energy?.length){use();from.moveCardsTo(energy,list);}});});break;
  }
  case 'onEvolutionRecover':{
   const count=owner.discard.cards.filter((c:any)=>c.superType===SuperType.POKEMON).length;if(!count)break;
   store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_HAND,owner.discard,{superType:SuperType.POKEMON},{min:0,max:Math.min(count,op.amount),allowCancel:false}),(chosen:any)=>{if(chosen)owner.discard.moveCardsTo(chosen,owner.hand);});break;
  }
  case 'onEvolutionDamage':{
   store.prompt(state,new ConfirmPrompt(owner.id,GameMessage.WANT_TO_USE_ABILITY),(yes:any)=>{if(!yes)return;const opponent=StateUtils.getOpponent(state,owner);
    store.prompt(state,new ChoosePokemonPrompt(owner.id,GameMessage.CHOOSE_POKEMON_TO_DAMAGE,PlayerType.TOP_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false}),(chosen:any)=>{if(chosen?.length)powerDamage(chosen[0],op.amount,op.weakness);});
   });break;
  }
  }
 }
 return state;
}



