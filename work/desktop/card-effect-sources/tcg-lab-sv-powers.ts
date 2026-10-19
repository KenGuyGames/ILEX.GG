import {StateUtils,SpecialCondition,CardType,CardTag,SuperType,ChooseCardsPrompt,CardList,ChoosePokemonPrompt,PlayerType,SlotType,GameError,GameMessage,EnergyType,ShowCardsPrompt,Stage,SelectPrompt} from './game';
import {CheckPokemonStatsEffect,CheckPokemonTypeEffect,CheckSpecialConditionRemovalEffect,AddSpecialConditionsPowerEffect,CheckHpEffect,CheckRetreatCostEffect,CheckEvolutionEligibilityEffect,CheckAttackCostEffect,CheckSleepRecoveryEffect} from './game/store/effects/check-effects';
import {PutDamageEffect,AddSpecialConditionsEffect,HealTargetEffect,ApplyWeaknessEffect} from './game/store/effects/attack-effects';
import {DRAW_CARDS,MOVE_CARDS,COIN_FLIP_PROMPT} from './game/store/prefabs/prefabs';
import {attachWotcEnergy} from './game/store/prefabs/wotc-energy-attachment';
import {HealEffect,AttackEffect,KnockOutEffect,PowerEffect,MovedToActiveEffect,MovedFromActiveToBenchEffect} from './game/store/effects/game-effects';
import {exAttachedEnergy} from './tcg-lab-ex-attachments';
import {xyTypes} from './tcg-lab-xy-actions';
import {svEntryPower} from './tcg-lab-sv-entry-powers';
export function svPowerTrigger(op:any,e:any,p:any,list:any){
 if(op.kind!=='svPassive')return false;
 if(op.action==='assaultingHunt')return e instanceof MovedToActiveEffect&&e.player===p&&e.pokemonCard===list.getPokemonCard();
 if(op.action==='lavaZone')return e instanceof MovedFromActiveToBenchEffect&&e.player!==p;
 if(op.action==='koHandDiscard')return e instanceof KnockOutEffect&&e.target===list;
 if(op.action==='activeRetreatLock')return ['RETREAT_EFFECT','RETREAT_START_EFFECT'].includes(e.type)&&e.player!==p&&p.active===list;
 if(op.action==='weaknessMultiplier')return e instanceof CheckPokemonStatsEffect&&e.target!==p.active&&!p.bench.includes(e.target);
 if(op.action==='ownSleepFlips')return e instanceof CheckSleepRecoveryEffect&&e.target===list;
 if(op.action==='rainbowDna')return e instanceof CheckEvolutionEligibilityEffect&&e.player===p&&e.target===list;
 if(op.action==='equalHandFreeCost')return e instanceof CheckAttackCostEffect&&e.player===p&&e.source===list;
 if(['fullHpSurvive','equalEnergyShield'].includes(op.action))return e instanceof PutDamageEffect&&e.target===list&&e.player!==p;
 if(op.action==='attackBonus')return e instanceof ApplyWeaknessEffect&&e.player===p;
 if(op.action==='teamReduction')return e instanceof PutDamageEffect&&e.player!==p&&[p.active,...p.bench].includes(e.target);
 if(op.action==='teamRetreat')return e instanceof CheckRetreatCostEffect&&[p.active,...p.bench].includes(e.target);
 if(op.action==='festivalLead')return e instanceof AttackEffect&&e.player===p&&e.source===list;
 if(op.action==='noHealing')return e instanceof HealEffect||e instanceof HealTargetEffect;
 if(op.action==='specialEnergyHp')return e instanceof CheckHpEffect&&e.target===list;
 if(op.action==='doubleType')return e instanceof CheckPokemonTypeEffect&&e.target===list;
 if(op.action==='noWeakness')return e instanceof CheckPokemonStatsEffect&&[p.active,...p.bench].includes(e.target);
 if(op.action==='wellBaked')return e.target===list&&(e instanceof PutDamageEffect&&e.player!==p||e instanceof AddSpecialConditionsEffect||e instanceof AddSpecialConditionsPowerEffect);
 if(op.action==='poisonSacs')return e instanceof CheckSpecialConditionRemovalEffect;
 return false;
}
export function svPower(card:any,op:any,power:any,store:any,state:any,e:any,p:any,list:any,use:any){
 if(op.action==='adrenaBrain'){
  const o=StateUtils.getOpponent(state,p),slots=[{list:p.active,player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0},...p.bench.map((list:any,index:number)=>({list,player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index}))],donors=slots.filter(s=>s.list.getPokemonCard()&&s.list.damage>=10);
  if(!donors.length||!exAttachedEnergy(store,state,p,list).some((entry:any)=>StateUtils.providesMatchesType(entry.provides,CardType.DARK)))throw new GameError(GameMessage.CANNOT_USE_POWER);
  return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_DAMAGE,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{min:0,max:1,allowCancel:false,blocked:slots.filter(s=>!donors.includes(s)).map(({list,...target})=>target)}),(chosen:any)=>{
   if(!chosen?.length)return;const donor=chosen[0];store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_DAMAGE,PlayerType.TOP_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{min:1,max:1,allowCancel:false}),(targets:any)=>{
    const target=targets[0],max=Math.min(3,Math.floor(donor.damage/10));store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,Array.from({length:max+1},(_,i)=>'Move '+i+' counters'),{allowCancel:false}),(amount:number)=>{
     if(!amount)return;use();const probe={type:'EX_POWER_COUNTERS_EFFECT',preventDefault:false,player:p,source:list,target,damage:amount*10};store.reduceEffect(state,probe);const finish=()=>{if(!probe.preventDefault){donor.damage-=amount*10;target.damage+=amount*10;}};if(store.hasPrompts())store.waitPrompt(state,finish);else finish();
    });
   });
  });
 }
 if(op.action==='lavaZone'){
  const opponent=StateUtils.getOpponent(state,p);if(e.player===opponent&&state.players[state.activePlayer]===opponent&&opponent.active.getPokemonCard())store.reduceEffect(state,new AddSpecialConditionsPowerEffect(p,card,opponent.active,[SpecialCondition.BURNED]));return state;
 }
 if(op.action==='assaultingHunt'){
  if(state.players[state.activePlayer]!==p||card._wotcPowerTurn?.[card.powers.indexOf(power)]===state.turn)return state;const o=StateUtils.getOpponent(state,p),targets=o.bench.filter((l:any)=>l.getPokemonCard()?.stage===Stage.BASIC);if(!targets.length)return state;
  return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Skip Ability','Switch opposing Basic Pokemon'],{allowCancel:false}),(choice:number)=>{if(choice!==1)return;store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_SWITCH,PlayerType.TOP_PLAYER,[SlotType.BENCH],{min:1,max:1,allowCancel:false,blocked:o.bench.map((list:any,index:number)=>({list,index})).filter((s:any)=>!targets.includes(s.list)).map(({index}:any)=>({player:PlayerType.TOP_PLAYER,slot:SlotType.BENCH,index}))}),(chosen:any)=>{use();o.switchPokemon(chosen[0],store,state);});});
 }
 if(op.action==='buggyTurbo'){
  const available=p.discard.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC),attached=exAttachedEnergy(store,state,p,list);
  if(!available.length&&!attached.length)throw new GameError(GameMessage.CANNOT_USE_POWER);use();
  return COIN_FLIP_PROMPT(store,state,p,(heads:boolean)=>{
   if(heads){if(!available.length)return;store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_ATTACH,p.discard,{superType:SuperType.ENERGY,energyType:EnergyType.BASIC},{min:0,max:Math.min(4,available.length),allowCancel:false}),(chosen:any)=>{
    const put=(i:number):any=>{if(i>=(chosen||[]).length)return;attachWotcEnergy(store,state,p,p.discard,list,chosen[i],{sourceCard:card,sourceEffect:e,sourceKind:'power'});if(store.hasPrompts())store.waitPrompt(state,()=>put(i+1));else put(i+1);};put(0);
   });}else if(attached.length){const zone=new CardList();zone.cards=attached.map((entry:any)=>entry.card);store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,zone,{},{min:1,max:1,allowCancel:false}),(chosen:any)=>MOVE_CARDS(store,state,attached.find((entry:any)=>entry.card===chosen[0]).zone,p.discard,{cards:chosen,sourceCard:card,sourceEffect:e}));}
  });
 }
 if(op.action==='rocketBrain'){
  const slots=[{list:p.active,player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0},...p.bench.map((list:any,index:number)=>({list,player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index}))],targets=slots.filter(s=>s.list.getPokemonCard()),donors=targets.filter(s=>s.list.damage>=10&&s.list.getPokemonCard().name.startsWith("Team Rocket's "));
  if(!donors.length||targets.length<2)throw new GameError(GameMessage.CANNOT_USE_POWER);
  return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_DAMAGE,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{min:1,max:1,allowCancel:false,blocked:slots.filter(s=>!donors.includes(s)).map(({list,...target})=>target)}),(chosen:any)=>{
   const donor=chosen[0];store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_DAMAGE,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{min:1,max:1,allowCancel:false,blocked:slots.filter(s=>s.list===donor||!targets.includes(s)).map(({list,...target})=>target)}),(chosen:any)=>{
    const target=chosen[0],probe={type:'EX_POWER_COUNTERS_EFFECT',preventDefault:false,player:p,source:list,target,damage:10};store.reduceEffect(state,probe);const finish=()=>{if(!probe.preventDefault){use();donor.damage-=10;target.damage+=10;}};if(store.hasPrompts())store.waitPrompt(state,finish);else finish();
   });
  });
 }
 if(op.action==='koHandDiscard'){
  const lethal=list._exLethalAttackDamage;if(state.players[state.activePlayer]===p||lethal?.turn!==state.turn||lethal.card!==card||lethal.abilityBlocked||e._svKoHandDiscard?.includes(card.id))return state;
  e._svKoHandDiscard??=[];e._svKoHandDiscard.push(card.id);const o=StateUtils.getOpponent(state,p),remaining=o.hand.cards.slice(),cards:any[]=[];
  for(let i=0;i<op.amount&&remaining.length;i++)cards.push(remaining.splice(Math.floor(Math.random()*remaining.length),1)[0]);
  MOVE_CARDS(store,state,o.hand,o.discard,{cards,sourceCard:card,sourceEffect:new PowerEffect(p,power,card)});return state;
 }
 if(['entrySpecialEat','entryObligingHeal','entryEnergyMove','entryHandEnergyShuffle','entryRandomHandShuffle','entryEvolutionHeal','entryLifeboat'].includes(op.action))return svEntryPower(card,op,power,store,state,p,list);
 if(op.action==='entryProtect')return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Skip Ability','Prevent damage and effects'],{allowCancel:false}),(choice:number)=>{if(choice===1){list.preventDamageNextTurnPending={};list.preventEffectsOfAttacksNextTurnPending={};}});
 if(op.action==='entryGust'){
  const o=StateUtils.getOpponent(state,p),eligible=o.bench.filter((target:any)=>{if(!target.getPokemonCard())return false;const hp=new CheckHpEffect(o,target);store.reduceEffect(state,hp);return hp.hp-target.damage<=op.maxRemainingHp;});if(!eligible.length)return state;
  return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Skip Ability','Switch opposing Pokemon'],{allowCancel:false}),(choice:number)=>{if(choice!==1)return;store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,PlayerType.TOP_PLAYER,[SlotType.BENCH],{min:1,max:1,allowCancel:false,blocked:o.bench.map((list:any,index:number)=>({list,index})).filter((s:any)=>!eligible.includes(s.list)).map(({index}:any)=>({player:PlayerType.TOP_PLAYER,slot:SlotType.BENCH,index}))}),(chosen:any)=>o.switchPokemon(chosen[0],store,state));});
 }
 if(op.action==='activeRetreatLock')throw new GameError(GameMessage.CANNOT_RETREAT);
 if(op.action==='weaknessMultiplier'){if(e.target===StateUtils.getOpponent(state,p).active)e.weakness=e.weakness.map((w:any)=>({...w,value:undefined,multiplier:op.amount}));return state;}
 if(op.action==='ownSleepFlips'){if(list.specialConditions.includes(SpecialCondition.ASLEEP))e.flips=op.amount;return state;}
 if(op.action==='rainbowDna'){const c=e.evolution;if(c.stage===Stage.STAGE_1&&c.evolvesFrom==='Eevee'&&c.tags.includes(CardTag.POKEMON_ex)&&!!c.regulationMark&&p.hand.cards.includes(c))e.allowed=true;return state;}
 if(op.action==='equalHandFreeCost'){if(e.attack.name===op.attack&&p.hand.cards.length===StateUtils.getOpponent(state,p).hand.cards.length)e.cost=[];return state;}
 if(op.action==='entryDraw')return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Skip Ability','Draw '+op.amount+' cards'],{allowCancel:false}),(choice:number)=>{if(choice===1)DRAW_CARDS(store,state,p,op.amount);});
 if(op.action==='entryMill'){MOVE_CARDS(store,state,p.deck,p.discard,{cards:p.deck.cards.slice(0,op.amount),sourceCard:card,sourceEffect:e});return state;}
 if(op.action==='fullHpSurvive'){if(!e.attackEffect?.wotcBypassDefender)e._wotcSurviveTenOptions={requireFullHp:true,coinFlipOnWouldKo:false};return state;}
 if(op.action==='equalEnergyShield'){
  const o=StateUtils.getOpponent(state,p),units=(owner:any,target:any)=>exAttachedEnergy(store,state,owner,target).reduce((n:number,entry:any)=>n+StateUtils.getProvidesUnitCount(entry.provides,entry),0);
  if(!e.attackEffect?.wotcBypassDefender&&units(p,list)===units(o,o.active))e.preventDefault=true;return state;
 }
 if(op.action==='attackBonus'){
  const o=StateUtils.getOpponent(state,p);
  if(e.target!==o.active||op.bench&&!p.bench.includes(list)||op.names&&!op.names.includes(e.source.getPokemonCard()?.name)||op.defenderEvolution&&o.active.getPokemonCard()?.stage===Stage.BASIC)return state;
  if(e.damage>0)e.damage+=op.amount;return state;
 }
 if(op.action==='bothDraw'){use();DRAW_CARDS(store,state,p,1);DRAW_CARDS(store,state,StateUtils.getOpponent(state,p),1);return state;}
 if(op.action==='peekBoth'){
  const o=StateUtils.getOpponent(state,p);if(!o.deck.cards.length)throw new GameError(GameMessage.CANNOT_USE_POWER);use();
  return store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,o.deck.cards.slice(0,1)),()=>{if(p.deck.cards.length)store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CHOOSE_CARD_TO_HAND,p.deck.cards.slice(0,1)),()=>{});});
 }
 if(op.action==='healActiveEvolution'){
  if(!p.active.getPokemonCard()||p.active.getPokemonCard().stage===Stage.BASIC||!p.active.damage)throw new GameError(GameMessage.CANNOT_USE_POWER);use();return store.reduceEffect(state,new HealEffect(p,p.active,op.amount));
 }
 if(op.action==='activeStatus'){
  if(op.requireStadium&&!StateUtils.getStadiumCard(state))throw new GameError(GameMessage.CANNOT_USE_POWER);
  use();const target=StateUtils.getOpponent(state,p).active;
  return store.reduceEffect(state,new AddSpecialConditionsPowerEffect(p,card,target,[(SpecialCondition as any)[op.status]]));
 }
 if(op.action==='teamReduction'||op.action==='teamRetreat'){
  const eligible=!op.energy||exAttachedEnergy(store,state,p,e.target).some((entry:any)=>StateUtils.providesMatchesType(entry.provides,xyTypes[op.energy]));
  if(eligible){if(op.action==='teamRetreat')e.cost=[];else if(!e.attackEffect?.wotcBypassDefender)e.reduceDamage(op.amount);}
  return state;
 }
 if(op.action==='festivalLead'){e.attack.barrage=StateUtils.getStadiumCard(state)?.name==='Festival Grounds';return state;}
 if(op.action==='noHealing'){e.preventDefault=true;return state;}
 if(op.action==='specialEnergyHp'){if(exAttachedEnergy(store,state,p,list).some((entry:any)=>entry.card.energyType===EnergyType.SPECIAL))e.hp+=op.amount;return state;}
 if(op.action==='doubleType'){if(!op.tool||list.tools.some((c:any)=>c.name===op.tool))e.cardTypes=op.types.map((t:string)=>xyTypes[t]);return state;}
 if(op.action==='noWeakness'){e.weakness=[];return state;}
 if(op.action==='wellBaked'){
  if(e instanceof AddSpecialConditionsEffect||e instanceof AddSpecialConditionsPowerEffect)e.specialConditions=e.specialConditions.filter((c:any)=>c!==SpecialCondition.BURNED);
  else if(!e.attackEffect?.wotcBypassDefender){const check=new CheckPokemonTypeEffect(e.source);store.reduceEffect(state,check);if(check.cardTypes.includes(CardType.FIRE))e.preventDefault=true;}
  return state;
 }
 if(op.action==='poisonSacs'){
  const o=StateUtils.getOpponent(state,p);
  if([o.active,...o.bench].includes(e.target)&&e.target.specialConditions.includes(SpecialCondition.POISONED)&&!e.preservedConditions.includes(SpecialCondition.POISONED))e.preservedConditions.push(SpecialCondition.POISONED);
  return state;
 }
 if(op.action==='pullCounter'){
  const candidates=[p.active,...p.bench].filter((l:any)=>l!==list&&l.getPokemonCard()&&l.damage>=10);
  if(!candidates.length)throw new GameError(GameMessage.CANNOT_USE_POWER);
  const slots=[{list:p.active,player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0},...p.bench.map((list:any,index:number)=>({list,player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index}))];
  return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_DAMAGE,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{min:1,max:1,allowCancel:false,blocked:slots.filter(s=>!candidates.includes(s.list)).map(({list,...target})=>target)}),(chosen:any)=>{use();chosen[0].damage-=10;list.damage+=10;});
 }
 return state;
}

