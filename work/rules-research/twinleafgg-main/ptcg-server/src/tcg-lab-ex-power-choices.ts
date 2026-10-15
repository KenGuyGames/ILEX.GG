import { CardType,SuperType,TrainerType,EnergyType,StateUtils,CardTag,CardList,ChooseCardsPrompt,ChoosePokemonPrompt,ShowCardsPrompt,ShuffleDeckPrompt,SelectPrompt,PlayerType,SlotType,GameMessage,GameError,SpecialCondition } from './game';
import { EndTurnEffect } from './game/store/effects/game-phase-effects';
import { HealEffect } from './game/store/effects/game-effects';
import { AddSpecialConditionsPowerEffect } from './game/store/effects/check-effects';
import { DRAW_CARDS, COIN_FLIP_PROMPT } from './game/store/prefabs/prefabs';
import { attachWotcEnergy } from './game/store/prefabs/wotc-energy-attachment';
import { choosePokemonAsBasicPlacement } from './game/store/prefabs/place-pokemon-as-basic';
const types:any={Grass:CardType.GRASS,Fire:CardType.FIRE,Water:CardType.WATER,Lightning:CardType.LIGHTNING,Psychic:CardType.PSYCHIC,Fighting:CardType.FIGHTING,Darkness:CardType.DARK,Metal:CardType.METAL};
export function exPowerChoices(card:any,op:any,store:any,state:any,e:any,p:any,list:any,use:()=>void){
 const o=StateUtils.getOpponent(state,p),shuffle=(owner:any,done:()=>void=()=>{})=>store.prompt(state,new ShuffleDeckPrompt(owner.id),(order:any)=>{owner.deck.applyOrder(order);done();});
 const choose=(zone:any,eligible:any[],max:number,done:(cards:any[])=>void,min=0)=>{if(!eligible.length)return done([]);store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,zone,{}, {min:Math.min(min,eligible.length),max:Math.min(max,eligible.length),allowCancel:false,blocked:zone.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(cards:any)=>done(cards||[]));};
 const slots=(targets:any[],done:(target:any)=>void)=>store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:[{player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0,list:p.active},...p.bench.map((list:any,index:number)=>({player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index,list}))].filter((s:any)=>!targets.includes(s.list)).map(({list,...target}:any)=>target)}),(chosen:any)=>done(chosen[0]));
 switch(op.kind){
 case 'onEvolutionExPlaceBasic':if(p.hand.cards.includes(card)&&!e._wotcFromDeck)store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Skip Power','Use Power'],{allowCancel:false}),(choice:any)=>{if(choice===1){use();choosePokemonAsBasicPlacement(store,state,p,p.deck,{names:op.names,optional:true},()=>shuffle(p));}});break;
 case 'activatedExSearch':case 'onEvolutionExSearch':{
  if(op.kind==='onEvolutionExSearch'&&(!p.hand.cards.includes(card)||e._wotcFromDeck))break;
  const eligible=p.deck.cards.filter((c:any)=>(op.category==='DPTrainer'?c.superType===SuperType.TRAINER&&![TrainerType.SUPPORTER,TrainerType.STADIUM].includes(c.trainerType):op.category==='Supporter'?c.superType===SuperType.TRAINER&&c.trainerType===TrainerType.SUPPORTER:(op.category==='Any'||op.category==='Tool'?op.category==='Any'||c.superType===SuperType.TRAINER&&c.trainerType===TrainerType.TOOL:c.superType===SuperType.POKEMON))&&(!op.pokemonTypes||c.cardType?.some((type:any)=>op.pokemonTypes.some((name:string)=>types[name]===type)))&&(!op.names||op.names.includes(c.name))&&(!op.nameIncludes||c.name.includes(op.nameIncludes))&&(!op.namesInclude||op.namesInclude.some((name:string)=>c.name.includes(name))));
  const perform=()=>{use();choose(p.deck,eligible,op.amount||1,cards=>{p.deck.moveCardsTo(cards,p.hand);if(cards.length&&op.reveal!==false)store.prompt(state,new ShowCardsPrompt(o.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,cards),()=>shuffle(p));else shuffle(p);});};
  if(op.kind==='onEvolutionExSearch')store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Skip Power','Use Power'],{allowCancel:false}),(choice:any)=>{if(choice===1)perform();});else perform();break;
 }
 case 'activatedExAttach':{
  const zone=op.zone==='hand'?p.hand:op.zone==='deck'?p.deck:p.discard,targets=op.self?[list]:(op.anyTarget?[p.active,...p.bench]:p.bench).filter((target:any)=>target.getPokemonCard());
  if(op.absent&&list.cards.some((c:any)=>c.superType===SuperType.ENERGY&&c.name===op.energyName)||!targets.length)throw new GameError(GameMessage.CANNOT_USE_POWER);
  const eligible=zone.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&(!op.basic||c.energyType===EnergyType.BASIC)&&(op.energyName?c.name===op.energyName:!op.energy||c.provides.includes(types[op.energy])));
  if(op.zone!=='deck'&&!eligible.length&&!op.endTurnAlways)throw new GameError(GameMessage.CANNOT_USE_POWER);
  use();choose(zone,eligible,op.amount||1,cards=>{const finish=()=>{const end=()=>{if(op.endTurn&&(cards.length||op.endTurnAlways))store.reduceEffect(state,new EndTurnEffect(p));};if(op.zone==='deck')shuffle(p,end);else end();};
   const attach=(index:number)=>{if(index>=cards.length)return finish();const put=(target:any)=>{attachWotcEnergy(store,state,p,zone,target,cards[index],{sourceCard:card,sourceEffect:e,sourceKind:'power'});if(store.hasPrompts())store.waitPrompt(state,()=>attach(index+1));else attach(index+1);};if(op.self)put(list);else slots(targets,put);};attach(0);
  });break;
 }

 case 'activatedExShuffleHand':{use();const count=o.hand.cards.length;p.hand.moveTo(p.deck);shuffle(p,()=>DRAW_CARDS(store,state,p,count));break;}
 case 'activatedExLookTop':{use();const owner=op.opponent?o:p,top=owner.deck.cards[0];if(!top)break;store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,[top]),()=>store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,op.discard?['Keep on top','Discard']:['Keep order','Shuffle deck'],{allowCancel:false}),(choice:any)=>{if(choice===1){if(op.discard)owner.deck.moveCardsTo([top],owner.discard);else shuffle(owner);}}));break;}
 case 'activatedExCounters':{if(op.coin){use();return COIN_FLIP_PROMPT(store,state,p,heads=>{if(heads)exPowerChoices(card,{...op,coin:false},store,state,e,p,list,()=>{});});}const candidates=[o.active,...o.bench].filter((l:any)=>l.getPokemonCard()&&(!op.delta||l.getPokemonCard().tags.includes(CardTag.DELTA_SPECIES))&&(!op.damaged||l.damage));if(!candidates.length)throw new GameError(GameMessage.CANNOT_USE_POWER);return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_DAMAGE,PlayerType.TOP_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:[{player:PlayerType.TOP_PLAYER,slot:SlotType.ACTIVE,index:0,list:o.active},...o.bench.map((list:any,index:number)=>({player:PlayerType.TOP_PLAYER,slot:SlotType.BENCH,index,list}))].filter((s:any)=>!candidates.includes(s.list)).map(({list,...target}:any)=>target)}),(chosen:any)=>{use();const hit:any={type:'EX_POWER_COUNTERS_EFFECT',player:p,source:list,target:chosen[0],damage:op.amount,preventDefault:false};store.reduceEffect(state,hit);if(!hit.preventDefault)hit.target.damage+=hit.damage;});}
 case 'activatedExSleepHeal':use();store.reduceEffect(state,new HealEffect(p,list,op.amount));store.reduceEffect(state,new AddSpecialConditionsPowerEffect(p,card,list,[SpecialCondition.ASLEEP]));break;
 }
 return state;
}
