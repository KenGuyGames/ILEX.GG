import {CardTag,Stage,SuperType,EnergyType,CardType,PlayerType,SlotType,ChooseCardsPrompt,ChoosePokemonPrompt,ShowCardsPrompt,CardList,GameMessage,StateUtils,GameError,SpecialCondition} from './game';
import {COIN_FLIP_PROMPT,MOVE_CARDS} from './game/store/prefabs/prefabs';
import {AddSpecialConditionsPowerEffect} from './game/store/effects/check-effects';
import {CheckPokemonTypeEffect} from './game/store/effects/check-effects';
export function swshPowerTrigger(op:any,e:any,p:any,list:any,card:any){
 if(op.kind!=='swshPassive')return false;
 if(op.action==='Justified Law')return e.type==='APPLY_WEAKNESS_EFFECT'&&e.player===p&&e.source===p.active;
 if(op.action==='Teapot of Surprises')return e.type==='AFTER_DAMAGE_EFFECT'&&e.target===list&&p.active===list&&e.player!==p&&e.damage>0;
 if(['Shadow Knife','Dark Ray'].includes(op.action))return e.type==='DP_BASIC_ENTERED_PLAY'&&e.pokemonCard===card&&e.fromHand&&p.bench.includes(list);
 if(op.action==='Punk Out')return e.type==='CHECK_RETREAT_COST_EFFECT'&&e.target===list;
 if(op.action==='Protective DNA')return e.type==='PUT_DAMAGE_EFFECT'&&e.player!==p&&[p.active,...p.bench].includes(e.target)&&e.source.getPokemonCard()?.tags.includes(CardTag.POKEMON_VSTAR)&&!e.attackEffect?.wotcBypassDefender;
 return false;
}
export function swshPower(card:any,op:any,power:any,store:any,state:any,e:any,p:any,list:any,use:any,damage:any){
 const o=StateUtils.getOpponent(state,p),isV=(c:any)=>c?.tags.some((t:any)=>[CardTag.POKEMON_V,CardTag.POKEMON_VMAX,CardTag.POKEMON_VSTAR,CardTag.POKEMON_VUNION].includes(t));
 if(op.action==='Justified Law'){if(e.damage>0&&e.target===o.active&&e.source.getPokemonCard()?.stage===Stage.BASIC){const check=new CheckPokemonTypeEffect(o.active);store.reduceEffect(state,check);if(check.cardTypes.includes(CardType.DARK))e.damage+=30;}return state;}
 if(op.action==='Teapot of Surprises'){if(!o.hand.cards.length)return state;const chosen=o.hand.cards[Math.floor(Math.random()*o.hand.cards.length)];return store.prompt(state,new ShowCardsPrompt(p.id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,[chosen]),()=>{MOVE_CARDS(store,state,o.hand,o.deck,{cards:[chosen],sourceCard:card,sourceEffect:e});if(o.deck.cards.includes(chosen)){o.deck.cards.splice(o.deck.cards.indexOf(chosen),1);o.deck.cards.push(chosen);}});}
 if(op.action==='Punk Out'){if([o.active,...o.bench].some((l:any)=>isV(l.getPokemonCard())))e.cost=[];return state;}
 if(op.action==='Protective DNA'){e.damage=Math.max(0,e.damage-30);return state;}
 if(op.action==='Shadow Knife'){return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_DAMAGE,PlayerType.TOP_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{min:0,max:1,allowCancel:false}),(targets:any)=>{if(targets?.length)damage(targets[0],10);});}
 if(op.action==='Dark Ray'){if(!o.hand.cards.length)return state;const view=new CardList();view.cards=o.hand.cards.slice();return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_DISCARD,view,{},{min:0,max:1,allowCancel:false,isSecret:true}),(cards:any)=>{if(cards?.length)MOVE_CARDS(store,state,o.hand,o.discard,{cards,sourceCard:card,sourceEffect:e});});}
 if(op.action==='Pump Shot'){
  if(!o.bench.some((l:any)=>l.getPokemonCard()))throw new GameError(GameMessage.CANNOT_USE_POWER);
  const cards=p.hand.cards.filter((c:any)=>c.superType===SuperType.ENERGY&&c.energyType===EnergyType.BASIC&&c.provides.includes(CardType.WATER));if(!cards.length)throw new GameError(GameMessage.CANNOT_USE_POWER);
  const view=new CardList();view.cards=cards;
  return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_DISCARD,view,{},{min:1,max:1,allowCancel:false}),(chosen:any)=>{MOVE_CARDS(store,state,p.hand,p.discard,{cards:chosen,sourceCard:card,sourceEffect:e});if(!p.discard.cards.includes(chosen[0]))return;use();store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_DAMAGE,PlayerType.TOP_PLAYER,[SlotType.BENCH],{min:1,max:1,allowCancel:false}),(targets:any)=>damage(targets[0],20));});
 }
 if(op.action==='Loopy Lasso'){
  if(!o.bench.some((l:any)=>l.getPokemonCard()))throw new GameError(GameMessage.CANNOT_USE_POWER);use();
  return COIN_FLIP_PROMPT(store,state,p,(heads:boolean)=>{if(heads)store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_SWITCH,PlayerType.TOP_PLAYER,[SlotType.BENCH],{min:1,max:1,allowCancel:false}),(targets:any)=>{o.switchPokemon(targets[0],store,state);store.reduceEffect(state,new AddSpecialConditionsPowerEffect(p,card,o.active,[SpecialCondition.ASLEEP,SpecialCondition.POISONED]));});});
 }
 return state;
}
