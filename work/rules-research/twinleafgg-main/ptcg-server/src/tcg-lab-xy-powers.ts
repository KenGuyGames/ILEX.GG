import {CardType,CardTag,SuperType,EnergyType,Stage,PowerType,SpecialCondition,StateUtils,GameMessage,GameError,ChooseCardsPrompt,ShuffleDeckPrompt,ShowCardsPrompt,ConfirmPrompt,CardList} from './game';
import {CheckProvidedEnergyEffect,CheckPokemonTypeEffect} from './game/store/effects/check-effects';
import {HealEffect,UseAttackEffect,KnockOutEffect,PowerEffect} from './game/store/effects/game-effects';
import {PutDamageEffect,AfterDamageEffect,ApplyWeaknessEffect} from './game/store/effects/attack-effects';
import {IS_ABILITY_BLOCKED,COIN_FLIP_PROMPT,MOVE_CARDS} from './game/store/prefabs/prefabs';
import {attachWotcEnergy} from './game/store/prefabs/wotc-energy-attachment';
import {exMoveEnergy} from './tcg-lab-ex-attachments';
import {xyTypes,xyAction} from './tcg-lab-xy-actions';
export function xyPowerTrigger(op:any,e:any,owner:any,list:any,card:any,state:any){
 if(op.kind==='activatedXy')return false; // Exact activated PowerEffect identity is checked by the shared pipeline.
 if(op.kind!=='xyPassive')return false;
 switch(op.action){
 case 'energyFreeRetreat':case 'namedBenchRetreat':return e.type==='CHECK_RETREAT_COST_EFFECT'&&e.target===list;
 case 'nonAquaRetreatTax':return e.type==='CHECK_RETREAT_COST_EFFECT'&&e.target.getPokemonCard()&&!e.target.getPokemonCard().tags.includes(CardTag.TEAM_AQUA);
 case 'benchHp':return e.type==='CHECK_HP_EFFECT'&&e.target===list&&owner.active===list;
 case 'conditionShield':return e.target===list&&!!e.specialConditions||e.type==='CHECK_TABLE_STATE_EFFECT';
 case 'waterParalysisShield':return !!e.specialConditions&&[owner.active,...owner.bench].includes(e.target)||e.type==='CHECK_TABLE_STATE_EFFECT';
 case 'randomHandOnDamage':return e instanceof AfterDamageEffect&&e.target===list&&owner.active===list&&e.player!==owner&&e.damage>0;
 case 'typedReduction':return e instanceof PutDamageEffect&&e.target===list&&e.player!==owner;
 case 'benchShield':return e instanceof PutDamageEffect&&e.target===list&&owner.bench.includes(list);
 case 'breakLock':return e.type==='CHECK_POKEMON_POWERS_EFFECT'&&e.target.tags.includes(CardTag.BREAK);
 case 'shred':return e instanceof ApplyWeaknessEffect&&e.source===list;
 case 'attachHeal':return e.type==='AFTER_ENERGY_ATTACHED_EFFECT'&&e.target===list&&e.fromHand&&!['power','attack'].includes(e.origin);
 case 'entryShield':return e.type==='DP_EVOLVED'&&e.pokemonCard===card&&e.fromHand;
 case 'teamAttackMinimum':return e instanceof UseAttackEffect&&e.player===owner&&owner.active===list;
 case 'koCoin':return e instanceof KnockOutEffect&&e.target===list&&owner.active===list&&state.players[state.activePlayer]!==owner&&list._exLethalAttackDamage;
 case 'contrary':return false; // Coin prompt transformation is installed centrally, after rerolls.
 case 'playerAttackEffectShield':return false;
 }return false;
}
export function xyPower(card:any,op:any,power:any,store:any,state:any,e:any,owner:any,list:any,use:any){
 const opponent=StateUtils.getOpponent(state,owner),units=(target:any,type?:string)=>{const check=new CheckProvidedEnergyEffect(owner,target);store.reduceEffect(state,check);return check.energyMap.some((entry:any)=>!type||StateUtils.providesMatchesType(entry.provides,xyTypes[type]));};
 if(op.kind==='activatedXy'){
  if(op.action==='healBasicBench'){const targets=owner.bench.filter((l:any)=>l.getPokemonCard()?.stage===Stage.BASIC&&l.damage>0);if(!targets.length)throw new GameError(GameMessage.CANNOT_USE_POWER);use();for(const target of targets)store.reduceEffect(state,new HealEffect(owner,target,op.amount));return state;}
  if(op.action==='roar'){if(!opponent.bench.some((l:any)=>l.getPokemonCard()))throw new GameError(GameMessage.CANNOT_USE_POWER);use();const b:any={player:owner,opponent,source:list,attack:{name:power.name,cost:[],damage:0,text:''}};return xyAction(store,state,b,{kind:'roar'},()=>{},{});}
  if(op.action==='moveToMagma')return exMoveEnergy(store,state,owner,card,e,{basic:true,targetTag:CardTag.TEAM_MAGMA},use);
  if(op.action==='attachSelfDiscard'){const eligible=owner.discard.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC&&op.energies.some((t:string)=>c.provides.includes(xyTypes[t])));if(!eligible.length)throw new GameError(GameMessage.CANNOT_USE_POWER);return store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_ATTACH,owner.discard,{superType:SuperType.ENERGY,energyType:EnergyType.BASIC},{min:1,max:1,allowCancel:false,blocked:owner.discard.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(cards:any)=>{use();attachWotcEnergy(store,state,owner,owner.discard,list,cards[0],{sourceCard:card,sourceEffect:e,sourceKind:'power'});});}
  if(op.action==='searchTeam'){const eligible=owner.deck.cards.filter((c:any)=>c.superType===SuperType.POKEMON&&c.tags.includes(CardTag.TEAM_AQUA));use();return store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_HAND,owner.deck,{superType:SuperType.POKEMON},{min:0,max:Math.min(1,eligible.length),allowCancel:false,blocked:owner.deck.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(cards:any)=>{owner.deck.moveCardsTo(cards,owner.hand);const shuffle=()=>store.prompt(state,new ShuffleDeckPrompt(owner.id),(order:any)=>owner.deck.applyOrder(order));if(cards.length)store.prompt(state,new ShowCardsPrompt(opponent.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,cards),shuffle);else shuffle();});}
  throw Error('Unknown XY activated power '+op.action);
 }
 switch(op.action){
 case 'energyFreeRetreat':if(units(list))e.cost=[];break;
 case 'namedBenchRetreat':if(owner.active===list)e.cost=e.cost.slice(Math.min(e.cost.length,owner.bench.filter((l:any)=>l.getPokemonCard()?.name===op.name).length));break;
 case 'nonAquaRetreatTax':e.cost.push(CardType.COLORLESS);break;
 case 'benchHp':e.hp+=op.amount*owner.bench.filter((l:any)=>l.getPokemonCard()).length;break;
 case 'conditionShield':if(e.specialConditions)e.specialConditions=[];else list.specialConditions=[];break;
 case 'waterParalysisShield':if(e.specialConditions){if(units(e.target,'Water'))e.specialConditions=e.specialConditions.filter((c:any)=>c!==SpecialCondition.PARALYZED);}else for(const target of [owner.active,...owner.bench])if(target.getPokemonCard()&&units(target,'Water'))target.specialConditions=target.specialConditions.filter((c:any)=>c!==SpecialCondition.PARALYZED);break;
 case 'typedReduction':{if(e.attackEffect?.wotcBypassDefender)break;const type=new CheckPokemonTypeEffect(e.source);store.reduceEffect(state,type);if(type.cardTypes.includes(xyTypes[op.energy]))e.reduceDamage(op.amount);break;}
 case 'benchShield':if(!e.attackEffect?.wotcBypassDefender)e.preventDefault=true;break;
 case 'breakLock':e.powers=e.powers.filter((p:any)=>p.powerType!==PowerType.ABILITY);break;
 case 'shred':e.attackEffect.wotcBypassDefender=true;break;
 case 'attachHeal':store.reduceEffect(state,new HealEffect(owner,list,op.amount));break;
 case 'entryShield':return store.prompt(state,new ConfirmPrompt(owner.id,'Use Mist Concealment?' as GameMessage),(yes:boolean)=>{if(yes){list.preventDamageNextTurnPending={};list.preventEffectsOfAttacksNextTurnPending={};}});
 case 'randomHandOnDamage':if(opponent.hand.cards.length){const chosen=opponent.hand.cards[Math.floor(Math.random()*opponent.hand.cards.length)];MOVE_CARDS(store,state,opponent.hand,opponent.discard,{cards:[chosen],sourceCard:card,sourceEffect:e});}break;
 case 'teamAttackMinimum':if(state.players.flatMap((p:any)=>[p.active,...p.bench]).filter((l:any)=>l.getPokemonCard()?.tags.includes(op.team==='Aqua'?CardTag.TEAM_AQUA:CardTag.TEAM_MAGMA)).length<op.minimum)throw new GameError(GameMessage.BLOCKED_BY_EFFECT);break;
 case 'koCoin':return COIN_FLIP_PROMPT(store,state,owner,(heads:boolean)=>{if(heads)store.reduceEffect(state,new KnockOutEffect(opponent,opponent.active));});
 default:throw Error('Unknown XY passive power '+op.action);
 }return state;
}
