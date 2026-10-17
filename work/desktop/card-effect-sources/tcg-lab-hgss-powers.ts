import {AddSpecialConditionsPowerEffect} from './game/store/effects/check-effects';
import { copyDpSupporter } from './tcg-lab-dp-supporter-copy';
import { PlayItemEffect,AttachPokemonToolEffect } from './game/store/effects/play-card-effects';
import { CheckTableStateEffect } from './game/store/effects/check-effects';
import {CardList,CardType,SuperType,TrainerType,EnergyType,SpecialCondition,Stage,StateUtils,GameError,GameMessage,ChooseCardsPrompt,ChoosePokemonPrompt,ShowCardsPrompt,SelectPrompt,OrderCardsPrompt,ShuffleDeckPrompt,PlayerType,SlotType} from './game';
import {PowerEffect,AttackEffect,HealEffect,KnockOutEffect} from './game/store/effects/game-effects';
import {AfterEnergyAttachedEffect} from './game/store/effects/play-card-effects';
import {CheckHpEffect,CheckRetreatCostEffect,CheckPokemonStatsEffect,CheckPokemonTypeEffect,CheckProvidedEnergyEffect} from './game/store/effects/check-effects';
import {PutDamageEffect,ApplyWeaknessEffect} from './game/store/effects/attack-effects';
import {IS_SPECIAL_ENERGY_BLOCKED,COIN_FLIP_PROMPT,MOVE_CARDS,MOVE_POKEMON_OFF_BOARD,DRAW_CARDS} from './game/store/prefabs/prefabs';
import {exAttachedEnergy,exMoveEnergy} from './tcg-lab-ex-attachments';
import {attachWotcEnergy} from './game/store/prefabs/wotc-energy-attachment';
import {hgssAction} from './tcg-lab-hgss-actions';
const types:any={Fire:CardType.FIRE,Water:CardType.WATER,Grass:CardType.GRASS,Lightning:CardType.LIGHTNING,Psychic:CardType.PSYCHIC,Fighting:CardType.FIGHTING,Darkness:CardType.DARK,Metal:CardType.METAL};
export function hgssPowerTrigger(op:any,e:any,p:any,list:any,card:any,state:any){
 if(op.kind!=='hgssPassive')return false;
 switch(op.action){
 case 'trainerLock':return e instanceof PlayItemEffect||e instanceof AttachPokemonToolEffect;
 case 'benchLimit':return e instanceof CheckTableStateEffect;
 case 'sleepShield':case 'discardReduction':case 'energyReduction':case 'specialShield':case 'benchShield':return e instanceof PutDamageEffect;
 case 'retreatTax':case 'retreatAid':case 'activeEnergyRetreat':case 'selfEnergyRetreat':case 'namedRetreat':case 'energyRetreat':case 'namedAid':return e instanceof CheckRetreatCostEffect;
 case 'namedHp':return e instanceof CheckHpEffect&&e.target===list;
 case 'healBlock':return e instanceof HealEffect;
 case 'noWeakness':return e instanceof CheckPokemonStatsEffect;
 case 'damagedBonus':return e instanceof ApplyWeaknessEffect&&e.source===list;
 case 'energyType':return e instanceof CheckProvidedEnergyEffect&&e.source===list;
 case 'extraPrize':return e instanceof KnockOutEffect&&e.player!==p;
 case 'attachCounters':case 'attachHeal':case 'attachDraw':return e instanceof AfterEnergyAttachedEffect&&e.fromHand;
 case 'entryCounters':return e.type==='DP_BASIC_ENTERED_PLAY'&&e.player!==p&&e.fromHand;
 case 'entryBurn':case 'entryDark':case 'entryOrder':return e.type==='DP_BASIC_ENTERED_PLAY'&&e.pokemonCard===card&&e.fromHand&&p.bench.includes(list);
 case 'oceanGrow':return e.type==='HGSS_LEGEND_ENTERED'&&e.pokemonCard===card;
 }return false;
}
export function hgssPower(card:any,op:any,power:any,store:any,state:any,e:any,p:any,list:any,use:()=>void){
 const o=StateUtils.getOpponent(state,p),field=(owner:any)=>[owner.active,...owner.bench].filter(l=>l.getPokemonCard()),typed=(target:any,type:string)=>{const check=new CheckPokemonTypeEffect(target);store.reduceEffect(state,check);return check.cardTypes.includes(types[type]);},energy=(owner:any,target:any,type?:string)=>exAttachedEnergy(store,state,owner,target).filter((x:any)=>!type||StateUtils.providesMatchesType(x.provides,types[type]));
 const move=(from:any,to:any,cards:any[])=>MOVE_CARDS(store,state,from,to,{cards,sourceCard:card,sourceEffect:e});
 const view=(cards:any[])=>{const l=new CardList();l.cards=cards;return l;};
 const shuffle=(done=()=>{})=>store.prompt(state,new ShuffleDeckPrompt(p.id),(order:any)=>{p.deck.applyOrder(order);done();});
 const choose=(zone:any,eligible:any[],min:number,max:number,done:(cards:any[])=>void,actor=p)=>{if(!eligible.length)return done([]);store.prompt(state,new ChooseCardsPrompt(actor,GameMessage.CHOOSE_CARD_TO_HAND,zone,{},{min:Math.min(min,eligible.length),max:Math.min(max,eligible.length),allowCancel:false,blocked:zone.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(cards:any)=>done(cards||[]));};
 const slots=(targets:any[],done:(target:any)=>void)=>{if(!targets.length)throw new GameError(GameMessage.CANNOT_USE_POWER);const all=[{player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0,list:p.active},...p.bench.map((list:any,index:number)=>({player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index,list}))];store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:all.filter(x=>!targets.includes(x.list)).map(({list,...target})=>target)}),(chosen:any)=>done(chosen[0]));};
 const body=op.kind==='hgssPassive';
 if(body){
  if(op.action==='trainerLock')throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
  if(op.action==='benchLimit'){e.benchSizes=state.players.map((owner:any,i:number)=>owner===p?e.benchSizes[i]:Math.min(e.benchSizes[i],4));return state;}
  if(e instanceof PutDamageEffect){if(e.attackEffect.wotcBypassDefender)return state;const target=e.target;
   if(op.action==='sleepShield'&&target===list&&list.specialConditions.includes(SpecialCondition.ASLEEP))e.preventDefault=true;
   if(op.action==='discardReduction'&&target===list&&e.player!==p)e.damage=Math.max(0,e.damage-op.amount*p.discard.cards.filter((c:any)=>c.superType===SuperType.POKEMON&&c.name===op.name).length);
   if(op.action==='energyReduction'&&target===list&&energy(p,list).length)e.damage=Math.max(0,e.damage-op.amount);
   if(op.action==='specialShield'&&target===list&&e.player!==p&&energy(e.player,e.source).some((x:any)=>x.card.energyType===EnergyType.SPECIAL))e.preventDefault=true;
   if(op.action==='benchShield'&&p.bench.includes(target)&&typed(target,op.energy))e.preventDefault=true;
  }
  if(e instanceof CheckRetreatCostEffect){const target=e.target,own=StateUtils.findOwner(state,target)===p;if(op.action==='retreatTax'&&!own&&(!op.active||p.active===list))e.cost.push(...Array(op.amount).fill(CardType.COLORLESS));if(!own)return state;
   if(op.action==='retreatAid'&&p.bench.includes(list)&&target===p.active)e.cost.splice(0,op.amount);
   if(op.action==='activeEnergyRetreat'&&target===p.active&&energy(p,target,op.energy).length){e.cost=[];e._hgssNoRetreatCost=true;}
   if(op.action==='selfEnergyRetreat'&&target===list&&energy(p,list).length){e.cost=[];e._hgssNoRetreatCost=true;}
   if(op.action==='namedRetreat'&&target===list&&field(p).some(l=>l.getPokemonCard().name===op.name)){e.cost=[];e._hgssNoRetreatCost=true;}
   if(op.action==='energyRetreat'&&target===list)e.cost.splice(0,energy(p,list,op.energy).reduce((n:number,x:any)=>n+StateUtils.getProvidesUnitCount(x.provides),0));
   if(op.action==='namedAid'&&op.names.includes(target.getPokemonCard()?.name))e.cost.splice(0,op.amount);
  }
  if(op.action==='namedHp')e.hp+=op.amount*field(p).filter(l=>l.getPokemonCard().name===op.name).length;
  if(op.action==='healBlock'&&field(p).some(l=>l.getPokemonCard().name===op.name))e.preventDefault=true;
  if(op.action==='noWeakness'&&field(p).includes(e.target)&&typed(e.target,op.energy))e.weakness=[];
  if(op.action==='damagedBonus'&&list.damage&&e.damage>0)e.damage+=op.amount;
  if(op.action==='energyType')e._hgssEnergyType=types[op.energy];
  if(op.action==='extraPrize'&&e.target._exLethalAttackDamage?.card===e.target.getPokemonCard()&&e.target._exLethalAttackDamage?.attackerCard===card)e.prizeCount+=1;
  if(op.action==='attachCounters'&&e.player!==p)e.target.damage+=op.amount;
  if(op.action==='attachHeal'&&e.target===list&&(!op.energy||StateUtils.providesMatchesType(e.energyCard.provides,types[op.energy])))store.reduceEffect(state,new HealEffect(p,list,op.amount));
  if(op.action==='attachDraw'&&e.target===list)DRAW_CARDS(store,state,p,1);
  if(op.action==='entryCounters'&&p.active===list&&o.bench.includes(e.target))e.target.damage+=op.amount;
  if(['entryBurn','entryDark','entryOrder','oceanGrow'].includes(op.action))return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Skip '+power.name,'Use '+power.name],{allowCancel:false}),(choice:number)=>{if(!choice)return;use();const b:any=new AttackEffect(p,o,{name:power.name,cost:[],damage:0,text:''});b.source=list;b._wotcSourceCard=card;
   if(op.action==='entryBurn')return COIN_FLIP_PROMPT(store,state,p,heads=>{if(heads)store.reduceEffect(state,new AddSpecialConditionsPowerEffect(p,card,o.active,[SpecialCondition.BURNED]));});
   if(op.action==='entryOrder'){const top=p.deck.cards.slice(0,op.amount);if(top.length<2)return;store.prompt(state,new OrderCardsPrompt(p.id,GameMessage.CHOOSE_CARD_ORDER,Object.assign(new CardList(),{cards:top}),{allowCancel:false}),(order:number[])=>p.deck.cards=[...order.map(i=>top[i]),...p.deck.cards.slice(top.length)]);}
   if(op.action==='entryDark'){const eligible=p.deck.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&StateUtils.providesMatchesType(c.provides,CardType.DARK));choose(p.deck,eligible,0,1,cards=>{move(p.deck,p.hand,cards);if(cards.length)store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,cards),()=>shuffle());else shuffle();});}
   if(op.action==='oceanGrow'){const top=p.deck.cards.slice(0,op.amount);for(const c of top)if(c.superType===SuperType.ENERGY)attachWotcEnergy(store,state,p,p.deck,list,c,{sourceCard:card,sourceEffect:e,sourceKind:'power'});else move(p.deck,p.discard,[c]);}
  });
  return state;
 }
 switch(op.action){
 case 'portrait':{use();if(!o.hand.cards.length)return state;return store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,o.hand.cards),()=>{const eligible=o.hand.cards.filter((c:any)=>c.superType===SuperType.TRAINER&&c.trainerType===TrainerType.SUPPORTER);if(!eligible.length)return;choose(o.hand,eligible,1,1,cards=>copyDpSupporter(store,state,p,cards[0],card));});}
 case 'moveEnergy':return exMoveEnergy(store,state,p,card,e,{energy:types[op.energy],toSelf:op.self,amount:1},()=>use());
 case 'attach':{const zone=op.discard?p.discard:p.hand,eligible=zone.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&StateUtils.providesMatchesType(c.provides,types[op.energy])),targets=(op.self?[list]:field(p)).filter(l=>!op.targetEnergy||typed(l,op.targetEnergy));if(!eligible.length||!targets.length)throw new GameError(GameMessage.CANNOT_USE_POWER);use();choose(zone,eligible,1,1,cards=>{const put=(target:any)=>{attachWotcEnergy(store,state,p,zone,target,cards[0],{sourceCard:card,sourceEffect:e,sourceKind:'power'});if(op.counters)target.damage+=op.counters;};if(op.self)put(list);else slots(targets,put);});break;}
 case 'switch':use();slots(p.bench.filter((l:any)=>l.getPokemonCard()&&typed(l,op.energy)),target=>p.switchPokemon(target,store,state));break;
 case 'healActive':if(!p.active.damage)throw new GameError(GameMessage.CANNOT_USE_POWER);use();store.reduceEffect(state,new HealEffect(p,p.active,op.amount));break;
 case 'showHand':use();if(o.hand.cards.length)store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,o.hand.cards),()=>{});break;
 case 'returnSelf':use();MOVE_POKEMON_OFF_BOARD(store,state,list,{pokemonDestination:p.hand,attachedDestination:p.hand,sourceCard:card,sourceEffect:e});break;
 case 'returnCoin':use();return COIN_FLIP_PROMPT(store,state,p,heads=>{if(heads)MOVE_POKEMON_OFF_BOARD(store,state,list,{pokemonDestination:p.hand,attachedDestination:p.hand,sourceCard:card,sourceEffect:e});});
 case 'type':use();list._dpTypeChange={turn:state.turn,type:types[op.energy],card};list.marker.addMarker('DP_TYPE_CHANGE',card,'ability','pokemon');break;
 case 'orderEither':use();return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Your deck',"Opponent's deck"],{allowCancel:false}),(index:number)=>{const owner=index?o:p,top=owner.deck.cards.slice(0,op.amount);if(top.length<2){if(top.length)store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,top),()=>{});return;}store.prompt(state,new OrderCardsPrompt(p.id,GameMessage.CHOOSE_CARD_ORDER,Object.assign(new CardList(),{cards:top}),{allowCancel:false}),(order:number[])=>owner.deck.cards=[...order.map(i=>top[i]),...owner.deck.cards.slice(top.length)]);});
 case 'opponentChoice':{use();const top=p.deck.cards.slice(0,2);if(!top.length)break;return store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,top),()=>choose(view(top),top,1,1,cards=>{move(p.deck,p.hand,cards);move(p.deck,p.deck,top.filter(c=>!cards.includes(c)));},o));}
 case 'recoverTrainerTop':use();return COIN_FLIP_PROMPT(store,state,p,heads=>{if(!heads)return;const eligible=p.discard.cards.filter((c:any)=>c.superType===SuperType.TRAINER&&![TrainerType.SUPPORTER,TrainerType.STADIUM].includes(c.trainerType));choose(p.discard,eligible,0,1,cards=>{if(!cards.length)return;store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,cards),()=>{move(p.discard,p.deck,cards);p.deck.cards=[...cards,...p.deck.cards.filter((c:any)=>!cards.includes(c))];});});});
 default:throw Error('Unknown HGSS Power '+op.action);
 }return state;
}
