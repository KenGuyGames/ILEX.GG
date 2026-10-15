import { attachWotcEnergy } from './game/store/prefabs/wotc-energy-attachment';
import { PowerEffect } from './game/store/effects/game-effects';
import { ChooseCardsPrompt,SelectPrompt } from './game';
import { CardType,CardTag,SuperType,TrainerType,EnergyType,SpecialCondition,StateUtils,GameMessage,GameError } from './game';
import { EndTurnEffect,BetweenTurnsEffect } from './game/store/effects/game-phase-effects';
import { CheckPokemonAttacksEffect,CheckHpEffect,CheckRetreatCostEffect,CheckProvidedEnergyEffect,CheckPokemonTypeEffect,CheckAttackCostEffect,CheckPokemonStatsEffect,CheckSpecialConditionRemovalEffect,AddSpecialConditionsPowerEffect,CheckTableStateEffect } from './game/store/effects/check-effects';
import { AfterRetreatEffect,EvolveEffect,HealEffect,UseAttackEffect,AttackEffect,KnockOutEffect } from './game/store/effects/game-effects';
import { TrainerEffect,PlayItemEffect,AttachPokemonToolEffect,AfterEnergyAttachedEffect,PlayPokemonEffect } from './game/store/effects/play-card-effects';
import { AbstractAttackEffect,AddSpecialConditionsEffect,ApplyWeaknessEffect,PutDamageEffect } from './game/store/effects/attack-effects';
import { MOVE_CARDS } from './game/store/prefabs/prefabs';
import { exAttachedEnergy } from './tcg-lab-ex-attachments';
export function dpPassiveTrigger(op:any,e:any,owner:any,list:any){
 switch(op.kind){
 case 'dpToxicVirus':return e instanceof BetweenTurnsEffect;
 case 'dpSinkhole':return e instanceof AfterRetreatEffect&&e.player!==owner;
 case 'dpBorrowAttacks':return e instanceof CheckPokemonAttacksEffect&&e.player===owner||op.copyHp&&e instanceof CheckHpEffect&&e.target===list&&owner.active===list;
 case 'dpToxicSludge':return e instanceof EndTurnEffect;
 case 'dpAfterPowerCounters':case 'dpAfterPowerAttach':return e.type==='DP_POWER_USED'&&e.player!==owner;
 case 'dpCheckupCounters':return e instanceof BetweenTurnsEffect&&e.player===owner;
 case 'dpTeamHp':return e instanceof CheckHpEffect&&[owner.active,...owner.bench].includes(e.target);
 case 'dpSelfEnergyHp':return e instanceof CheckHpEffect&&e.target===list;
 case 'dpTeamAttackDiscount':return e instanceof CheckAttackCostEffect&&e.player===owner;
 case 'dpTeamRetreatDiscount':return e instanceof CheckRetreatCostEffect&&e.player===owner;
 case 'dpForceTails':return ['COIN_FLIP_EFFECT','COIN_FLIP_SEQUENCE_EFFECT'].includes(e.type)&&e.player!==owner;
 case 'dpPrizeAttackLock':return e instanceof UseAttackEffect&&e.player===owner&&owner.active===list;
 case 'dpRetreatTax':return e instanceof CheckRetreatCostEffect&&e.target?.getPokemonCard()?.name!==op.excludeName;
 case 'dpOpponentAttachCounters':return e instanceof AfterEnergyAttachedEffect&&e.fromHand&&e.player!==owner;
 case 'dpBypassDefense':return e instanceof AttackEffect&&e.source===list;
 case 'dpConditionNoPrize':return e instanceof KnockOutEffect&&e.target===list&&list.specialConditions.includes((SpecialCondition as any)[op.status]);
 case 'dpFieldProtection':return e instanceof AbstractAttackEffect&&e.player!==owner&&[owner.active,...owner.bench].includes(e.target)&&!e.attackEffect._wotcTrainer&&!e.attackEffect.wotcBypassDefender&&!['APPLY_WEAKNESS_EFFECT','AFTER_WEAKNESS_AND_RESISTANCE_EFFECT','AFTER_DAMAGE_EFFECT'].includes(e.type);
 case 'dpPreserveConditions':return e.player!==owner&&(e instanceof CheckSpecialConditionRemovalEffect||op.burnTails&&e instanceof BetweenTurnsEffect);
 case 'dpTypeConditionShield':return e instanceof CheckTableStateEffect||(e instanceof AddSpecialConditionsEffect||e instanceof AddSpecialConditionsPowerEffect)&&[owner.active,...owner.bench].includes(e.target);
 case 'dpTypedDamageAura':return e instanceof PutDamageEffect&&[owner.active,...owner.bench].includes(e.target)&&!(e.player!==owner&&e.attackEffect.wotcBypassDefender);
 case 'dpEnergyRetreatDiscount':return e instanceof CheckRetreatCostEffect&&e.target===list;
 case 'dpAiryWall':return e instanceof AbstractAttackEffect&&e.target===list&&e.player!==owner&&!e.attackEffect._wotcTrainer&&!e.attackEffect.wotcBypassDefender&&!['APPLY_WEAKNESS_EFFECT','AFTER_WEAKNESS_AND_RESISTANCE_EFFECT','AFTER_DAMAGE_EFFECT'].includes(e.type);
 case 'dpLargeOpponentDiscount':return e instanceof CheckAttackCostEffect&&e.player===owner&&owner.active===list;
 case 'dpPreviousAttackLock':return e instanceof UseAttackEffect&&e.player===owner&&owner.active===list;
 case 'dpTeamStats':return (e instanceof CheckPokemonStatsEffect||op.retreat!==undefined&&e instanceof CheckRetreatCostEffect)&&[owner.active,...owner.bench].includes(e.target);
 case 'dpIgnoreResistance':return e instanceof ApplyWeaknessEffect&&e.player===owner;
 case 'dpStatusFreeAttack':return e instanceof CheckAttackCostEffect&&e.player===owner&&owner.active===list&&list.specialConditions.length>0;
 case 'dpStatusRetreatLock':return ['RETREAT_EFFECT','RETREAT_START_EFFECT'].includes(e.type)&&e.player!==owner&&list.specialConditions.includes((SpecialCondition as any)[op.status]);
 case 'dpCheckupMill':return e instanceof BetweenTurnsEffect&&e.player===owner;
 case 'dpNamedAttackDiscount':return e instanceof CheckAttackCostEffect&&e.player===owner&&owner.active===list;
 case 'dpUnevolvedReduction':return e instanceof PutDamageEffect&&e.target===list&&e.player!==owner&&!e.source.isEvolved()&&!e.attackEffect.wotcBypassDefender;
 case 'dpTeamAttachHeal':return e instanceof AfterEnergyAttachedEffect&&e.fromHand&&e.player===owner&&owner.active===list;
 case 'dpCheckupHeal':return op.afterCheckup?e.type==='EX_CHECKUP_COMPLETE_EFFECT':e instanceof BetweenTurnsEffect&&e.player===owner;
 case 'dpBurningSpirit':return e instanceof PutDamageEffect&&e.damage>0&&e.target.specialConditions.includes(SpecialCondition.BURNED);
 case 'dpToolRetreatTax':return e instanceof CheckRetreatCostEffect&&e.target===list&&list.tools.length>0;
 case 'dpEmptyHandShield':return e instanceof PutDamageEffect&&e.target===list&&e.player!==owner&&!owner.hand.cards.length&&!e.attackEffect.wotcBypassDefender;
 case 'dpNamedCheckupHeal':return e instanceof BetweenTurnsEffect&&e.player===owner;
 case 'dpJamming':return e.type==='DP_SUPPORTER_RESOLVED'&&e.player!==owner;
 case 'dpItemLock':return owner.active===list&&(e instanceof TrainerEffect||e instanceof PlayItemEffect||e instanceof AttachPokemonToolEffect)&&e.player!==owner&&e.player.hand.cards.includes(e.trainerCard)&&[TrainerType.ITEM,TrainerType.TOOL].includes(e.trainerCard.trainerType);
 case 'dpActiveEvolutionLock':return owner.active===list&&e.player!==owner&&(e instanceof EvolveEffect||e instanceof PlayPokemonEffect)&&e.target===e.player.active&&e.player.hand.cards.includes(e.pokemonCard)&&!e.pokemonCard._dpLevelUp;
 case 'dpGlobalHp':return e instanceof CheckHpEffect;
 case 'dpAttachHeal':return e instanceof AfterEnergyAttachedEffect&&e.target===list&&e.fromHand;
 case 'dpActiveEnergyRetreat':case 'dpRainbowRetreat':return e instanceof CheckRetreatCostEffect&&e.player===owner;
 case 'dpDarkShadow':return e instanceof ApplyWeaknessEffect&&e.player===owner&&e.damage>0;
 }return false;
}
export function dpPassive(op:any,store:any,state:any,e:any,owner:any,list:any,types:any){
 switch(op.kind){
 case 'dpToxicVirus':e.poisonDamage+=10;break;
 case 'dpSinkhole':{const hit:any={type:'EX_POWER_COUNTERS_EFFECT',player:owner,source:list,target:e.target,damage:op.amount,preventDefault:false};store.reduceEffect(state,hit);if(!hit.preventDefault)e.target.damage+=hit.damage;break;}
 case 'dpBorrowAttacks':{const opponent=StateUtils.getOpponent(state,owner);if(e instanceof CheckHpEffect){if(op.copyHp&&opponent.active.getPokemonCard())e.hp=opponent.active.getPokemonCard().hp;break;}let donors:any[]=[];if(op.pool==='darkGenes'){if(owner.active.getPokemonCard()?.name!=='Murkrow')break;const attack=list.getPokemonCard()?.attacks[0];if(!attack)break;const energy=new CheckProvidedEnergyEffect(owner,list);store.reduceEffect(state,energy);if(!StateUtils.checkEnoughEnergy(energy.energyMap,attack.cost))break;donors=[list.getPokemonCard()];}else{if(owner.active!==list)break;if(op.pool==='opponent')donors=[opponent.active.getPokemonCard()];if(op.pool==='basic')donors=list.getPokemons().slice(0,-1).filter((entry:any)=>!entry.evolvesFrom&&!entry._dpLevelUp);if(op.pool==='unown')donors=state.players.flatMap((player:any)=>[player.active,...player.bench]).map((target:any)=>target.getPokemonCard()).filter((entry:any)=>entry?.name.startsWith('Unown')&&entry!==list.getPokemonCard());}for(const donor of donors.filter(Boolean))for(const original of donor.attacks){const existing=[...owner.active.getPokemonCard().attacks,...e.attacks];if(existing.some((attack:any)=>attack.name===original.name&&JSON.stringify(attack.cost)===JSON.stringify(original.cost)))continue;const attack:any={...original,cost:op.pool==='darkGenes'?[]:[...original.cost],_dpBorrowBonus:op.bonus||0,_wotcOriginalAttack:original};e.attacks.push(attack);e.attackSources.set(attack,donor);}break;}
 case 'dpToxicSludge':{const opponent=StateUtils.getOpponent(state,owner),target=opponent.active;if(!target.specialConditions.includes(SpecialCondition.POISONED)&&exAttachedEnergy(store,state,opponent,target).some((entry:any)=>StateUtils.providesMatchesType(entry.provides,CardType.GRASS)))store.reduceEffect(state,new AddSpecialConditionsPowerEffect(owner,list.getPokemonCard(),target,[SpecialCondition.POISONED]));break;}
 case 'dpAfterPowerCounters':{const target=StateUtils.findPokemonSlot(state,e.card);if(!target||target.getPokemonCard()!==e.card)break;const hit:any={type:'EX_POWER_COUNTERS_EFFECT',player:owner,source:list,target,damage:op.amount,preventDefault:false};store.reduceEffect(state,hit);if(!hit.preventDefault)target.damage+=hit.damage;break;}
 case 'dpAfterPowerAttach':{const eligible=owner.discard.cards.filter((card:any)=>card.superType===SuperType.ENERGY&&card.energyType===EnergyType.BASIC&&card.provides.includes(types[op.energy]));if(!eligible.length)break;store.prompt(state,new SelectPrompt(owner.id,GameMessage.CHOOSE_OPTION,['Skip attachment','Use Darkness Drive'],{allowCancel:false}),(choice:number)=>{if(choice!==1)return;store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_ATTACH,owner.discard,{superType:SuperType.ENERGY,energyType:EnergyType.BASIC},{min:1,max:1,allowCancel:false,blocked:owner.discard.cards.map((card:any,index:number)=>eligible.includes(card)?-1:index).filter((index:number)=>index>=0)}),(cards:any)=>{if(cards.length)attachWotcEnergy(store,state,owner,owner.discard,list,cards[0],{sourceCard:list.getPokemonCard(),sourceEffect:new PowerEffect(owner,list.getPokemonCard().powers.find((power:any)=>power.name==='Darkness Drive'),list.getPokemonCard()),sourceKind:'power'});});});break;}
 case 'dpCheckupCounters':{if(op.active&&owner.active!==list)break;for(const player of op.both?state.players:[StateUtils.getOpponent(state,owner)])for(const target of op.activeOnly?[player.active]:[player.active,...player.bench]){if(!target.getPokemonCard()||op.requireEnergy&&!exAttachedEnergy(store,state,player,target).length||op.levelOnly&&!target.getPokemonCard().tags.includes(CardTag.POKEMON_LV_X))continue;if(op.excludeType){const type=new CheckPokemonTypeEffect(target);store.reduceEffect(state,type);if(type.cardTypes.includes(types[op.excludeType]))continue;}const hit:any={type:'EX_POWER_COUNTERS_EFFECT',player:owner,source:list,target,damage:op.amount,preventDefault:false};store.reduceEffect(state,hit);if(!hit.preventDefault)target.damage+=hit.damage;}break;}
 case 'dpTeamHp':{if(e.target.getPokemonCard()?.name===op.excludeName||e['_dpHp'+op.key])break;const type=new CheckPokemonTypeEffect(e.target);store.reduceEffect(state,type);if((!op.energy||type.cardTypes.includes(types[op.energy]))&&(!op.evolvesFrom||e.target.getPokemonCard()?.evolvesFrom===op.evolvesFrom)){e['_dpHp'+op.key]=true;e.hp+=op.amount;}break;}
 case 'dpSelfEnergyHp':{const check=new CheckProvidedEnergyEffect(owner,list);store.reduceEffect(state,check);const units=check.energyMap.filter((entry:any)=>StateUtils.providesMatchesType(entry.provides,types[op.energy])).reduce((n:number,entry:any)=>n+StateUtils.getProvidesUnitCount(entry.provides),0);if(units>=op.minimum)e.hp+=op.amount;break;}
 case 'dpTeamAttackDiscount':if(op.names.includes(owner.active.getPokemonCard()?.name)){let n=op.amount;while(n--){const index=e.cost.indexOf(CardType.COLORLESS);if(index>=0)e.cost.splice(index,1);}}break;
 case 'dpTeamRetreatDiscount':{if(!list.getPokemons().slice(0,-1).some((card:any)=>card.name===op.underName))break;const type=new CheckPokemonTypeEffect(e.target||owner.active);store.reduceEffect(state,type);if(type.cardTypes.includes(types[op.energy])){let n=op.amount;while(n--){const index=e.cost.indexOf(CardType.COLORLESS);if(index>=0)e.cost.splice(index,1);}}break;}
 case 'dpForceTails':if((!op.active||owner.active===list)&&e.player===state.players[state.activePlayer]&&!e._dpForceTails){e._dpForceTails=true;const callback=e.callback;e.callback=(result:any)=>callback?.(Array.isArray(result)?result.map(()=>false):false);}break;
 case 'dpPrizeAttackLock':if(StateUtils.getOpponent(state,owner).prizes.filter((zone:any)=>zone.cards.length).length>op.maximum)throw new GameError(GameMessage.BLOCKED_BY_EFFECT);break;
 case 'dpRetreatTax':e.cost.push(...Array(op.amount).fill(CardType.COLORLESS));break;
 case 'dpOpponentAttachCounters':if(!op.active||owner.active===list){const hit:any={type:'EX_POWER_COUNTERS_EFFECT',player:owner,source:list,target:e.target,damage:op.amount,preventDefault:false};store.reduceEffect(state,hit);if(!hit.preventDefault)e.target.damage+=hit.damage;}break;
 case 'dpBypassDefense':e.wotcBypassDefender=true;e.ignoreResistance=true;break;
 case 'dpConditionNoPrize':e.prizeCount=0;break;
 case 'dpFieldProtection':if((!op.active||owner.active===list)&&(!op.bench||owner.bench.includes(list))&&(!op.benchTargets||owner.bench.includes(e.target))&&(!op.nameIncludes||e.target.getPokemonCard()?.name.includes(op.nameIncludes))&&(!op.names||op.names.includes(e.target.getPokemonCard()?.name))&&(!op.sourceLevel||e.source.getPokemonCard()?.tags.includes(CardTag.POKEMON_LV_X))&&(!op.ownName||[owner.active,...owner.bench].some((list:any)=>list.getPokemonCard()?.name===op.ownName)))e.preventDefault=true;break;
 case 'dpPreserveConditions':if(!op.active||owner.active===list){if(e instanceof CheckSpecialConditionRemovalEffect)e.preservedConditions=[...new Set([...e.preservedConditions,...e.target.specialConditions.filter((status:any)=>!op.statuses||op.statuses.some((name:string)=>(SpecialCondition as any)[name]===status))])];else if(op.burnTails)e.burnFlipResult=false;}break;
 case 'dpTypeConditionShield':{for(const target of e instanceof CheckTableStateEffect?[owner.active,...owner.bench]:[e.target]){if(!target.getPokemonCard())continue;const type=new CheckPokemonTypeEffect(target);store.reduceEffect(state,type);if(!type.cardTypes.includes(types[op.energy]))continue;if(e instanceof CheckTableStateEffect)for(const condition of target.specialConditions.slice())target.removeSpecialCondition(condition);else e.preventDefault=true;}break;}
 case 'dpTypedDamageAura':{const type=new CheckPokemonTypeEffect(e.target);store.reduceEffect(state,type);if(op.energies.some((name:string)=>type.cardTypes.includes(types[name])))e.reduceDamage(op.amount);break;}
 case 'dpEnergyRetreatDiscount':{const check=new CheckProvidedEnergyEffect(owner,list);store.reduceEffect(state,check);let amount=check.energyMap.filter((entry:any)=>StateUtils.providesMatchesType(entry.provides,types[op.energy])).reduce((n:number,entry:any)=>n+StateUtils.getProvidesUnitCount(entry.provides),0);while(amount--){const index=e.cost.indexOf(CardType.COLORLESS);if(index>=0)e.cost.splice(index,1);}break;}
 case 'dpAiryWall':if(exAttachedEnergy(store,state,e.player,e.source).length<=op.amount&&(e instanceof PutDamageEffect||list.getPokemons().slice(0,-1).some((card:any)=>card.name===op.underName)))e.preventDefault=true;break;
 case 'dpLargeOpponentDiscount':if([StateUtils.getOpponent(state,owner).active,...StateUtils.getOpponent(state,owner).bench].filter((list:any)=>list.getPokemonCard()).some((target:any)=>{const hp=new CheckHpEffect(StateUtils.getOpponent(state,owner),target);store.reduceEffect(state,hp);return hp.hp>=op.hp;}))e.cost=e.cost.filter((type:any)=>type!==CardType.COLORLESS);break;
 case 'dpPreviousAttackLock':if(list.getPokemonCard()?._wotcLastUsedAttack&&list.getPokemonCard()._wotcLastUsedAttack.turn===owner.wotcLastTurnEnded)throw new GameError(GameMessage.BLOCKED_BY_EFFECT);break;
 case 'dpTeamStats':if(!op.evolvesFrom||e.target.getPokemonCard()?.evolvesFrom===op.evolvesFrom){if(e instanceof CheckPokemonStatsEffect&&op.weakness)e.weakness=[];if(e instanceof CheckRetreatCostEffect&&op.retreat===0)e.cost=[];}break;
 case 'dpIgnoreResistance':{if(op.ownName&&![owner.active,...owner.bench].some((list:any)=>list.getPokemonCard()?.name===op.ownName))break;if(op.types){const type=new CheckPokemonTypeEffect(e.source);store.reduceEffect(state,type);if(!op.types.some((name:string)=>type.cardTypes.includes(types[name])))break;}e.ignoreResistance=true;break;}
 case 'dpStatusFreeAttack':e.cost=[];break;
 case 'dpStatusRetreatLock':throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
 case 'dpCheckupMill':if(!op.active||owner.active===list)MOVE_CARDS(store,state,StateUtils.getOpponent(state,owner).deck,StateUtils.getOpponent(state,owner).discard,{cards:StateUtils.getOpponent(state,owner).deck.cards.slice(0,op.amount),sourceCard:list.getPokemonCard(),sourceEffect:e});break;
 case 'dpNamedAttackDiscount':if(op.names.every((name:string)=>[owner.active,...owner.bench].some((list:any)=>list.getPokemonCard()?.name===name))){let amount=op.amount;while(amount--){const index=e.cost.indexOf(CardType.COLORLESS);if(index>=0)e.cost.splice(index,1);}}break;
 case 'dpUnevolvedReduction':e.reduceDamage(op.amount);break;
 case 'dpTeamAttachHeal':store.reduceEffect(state,new HealEffect(owner,e.target,op.amount));break;
 case 'dpCheckupHeal':if((!op.active||owner.active===list)&&(!op.tool||list.tools.length)&&(!op.status||list.specialConditions.includes((SpecialCondition as any)[op.status]))&&(!op.anyStatus||list.specialConditions.length))for(const target of op.bench?owner.bench:[list])if(target.getPokemonCard())store.reduceEffect(state,new HealEffect(owner,target,op.amount));break;
 case 'dpBurningSpirit':if(!e._dpBurningSpirit&&!(e.attackEffect.wotcBypassDefender&&StateUtils.findOwner(state,e.target)!==e.player)){e._dpBurningSpirit=true;e.damage+=40;}break;
 case 'dpToolRetreatTax':e.cost.push(...Array(op.amount).fill(CardType.COLORLESS));break;
 case 'dpEmptyHandShield':e.preventDefault=true;break;
 case 'dpNamedCheckupHeal':if([owner.active,...owner.bench].some((list:any)=>list.getPokemonCard()?.name===op.name))store.reduceEffect(state,new HealEffect(owner,list,op.amount));break;
 case 'dpJamming':{owner._wotcSharedPowerTurns??={};if(owner._wotcSharedPowerTurns.Jamming===state.turn)break;owner._wotcSharedPowerTurns.Jamming=state.turn;for(const target of [e.player.active,...e.player.bench])if(target.getPokemonCard()){const hit:any={type:'EX_POWER_COUNTERS_EFFECT',player:owner,source:list,target,damage:10,preventDefault:false};store.reduceEffect(state,hit);if(!hit.preventDefault)target.damage+=hit.damage;}break;}
 case 'dpItemLock':case 'dpActiveEvolutionLock':throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
 case 'dpGlobalHp':if(!e._dpGravitation){e._dpGravitation=true;e.hp+=op.amount;}break;
 case 'dpAttachHeal':if(StateUtils.providesMatchesType(e.energyCard.provides,types[op.energy]))store.reduceEffect(state,new HealEffect(owner,list,op.amount));break;
 case 'dpActiveEnergyRetreat':if(exAttachedEnergy(store,state,owner,e.target||owner.active).some((entry:any)=>StateUtils.providesMatchesType(entry.provides,types[op.energy])))e.cost=[];break;
 case 'dpRainbowRetreat':{const target=e.target||owner.active,type=new CheckPokemonTypeEffect(target);store.reduceEffect(state,type);if(exAttachedEnergy(store,state,owner,list).some((entry:any)=>entry.card.energyType===EnergyType.BASIC&&entry.card.provides.some((energy:any)=>type.cardTypes.includes(energy))))e.cost=[];break;}
 case 'dpDarkShadow':{if(e._dpDarkShadow||e.target!==StateUtils.getOpponent(state,owner).active)break;const type=new CheckPokemonTypeEffect(e.source);store.reduceEffect(state,type);if(!type.cardTypes.includes(CardType.DARK))break;e._dpDarkShadow=true;e.damage+=10*exAttachedEnergy(store,state,owner,e.source).filter((entry:any)=>entry.card.superType===SuperType.ENERGY&&entry.card.energyType===EnergyType.BASIC&&entry.card.provides.includes(CardType.DARK)).length;break;}
 }return state;
}
