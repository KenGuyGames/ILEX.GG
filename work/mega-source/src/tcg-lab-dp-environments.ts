import { StateUtils,CardType,CardTag,SuperType,Stage,PowerType,CardList,ChooseCardsPrompt,ChoosePokemonPrompt,ShowCardsPrompt,ShuffleDeckPrompt,PlayerType,SlotType,GameMessage,GameError } from './game';
import { CheckPokemonTypeEffect,CheckPokemonStatsEffect,CheckRetreatCostEffect,CheckPokemonAttacksEffect,CheckPokemonPowersEffect } from './game/store/effects/check-effects';
import { AfterEnergyAttachedEffect,AttachPokemonToolEffect } from './game/store/effects/play-card-effects';
import { HealEffect,PowerEffect,UseStadiumEffect,KnockOutEffect } from './game/store/effects/game-effects';
import { GamePhase } from './game/store/state/state';
import { PutDamageEffect,AfterDamageEffect,ApplyWeaknessEffect } from './game/store/effects/attack-effects';
import { EndTurnEffect } from './game/store/effects/game-phase-effects';
import { DRAW_CARDS,COIN_FLIP_PROMPT,MOVE_CARDS,IS_TOOL_BLOCKED } from './game/store/prefabs/prefabs';
import { exAttachedEnergy } from './tcg-lab-ex-attachments';
import { copyAttacks } from './tcg-lab-wotc-final';

export function dpStadium(card:any,kind:string,store:any,state:any,e:any){
 if(StateUtils.getStadiumCard(state)!==card||state.players.some((p:any)=>p.stadiumAndToolHaveNoEffectTurnsRemaining>0))return state;
 const types=(list:any)=>{const effect=new CheckPokemonTypeEffect(list);store.reduceEffect(state,effect);return effect.cardTypes;};
 if(kind==='lake'&&e instanceof CheckPokemonStatsEffect)e.weakness=e.weakness.map((entry:any)=>({type:entry.type}));
 if(kind==='sunny'){
  if(e instanceof CheckPokemonStatsEffect&&types(e.target).includes(CardType.LIGHTNING))e.weakness=[];
  if(e instanceof ApplyWeaknessEffect&&e.target===StateUtils.getOpponent(state,e.player).active&&types(e.source).includes(CardType.LIGHTNING))e.ignoreResistance=true;
 }
 if(kind==='champion'&&e instanceof CheckRetreatCostEffect&&e.player.active.getPokemonCard()?.tags.includes(CardTag.POKEMON_SP)){const index=e.cost.indexOf(CardType.COLORLESS);if(index>=0)e.cost.splice(index,1);}
 if(kind==='dawn'&&e instanceof AfterEnergyAttachedEffect&&e.fromHand&&types(e.target).some((type:any)=>[CardType.GRASS,CardType.WATER].includes(type))){store.reduceEffect(state,new HealEffect(e.player,e.target,10));e.target.specialConditions=[];e.target.poisonDamage=10;e.target.burnDamage=20;}
 if(kind==='miasma'&&e.type==='DP_BASIC_ENTERED_PLAY'&&e.fromHand&&e.player.bench.includes(e.target)&&!types(e.target).some((type:any)=>[CardType.GRASS,CardType.PSYCHIC].includes(type)))e.target.damage+=20;
 if(kind==='battleTower'&&e.type==='PLAY_POKEMON_EFFECT'&&e.dpLevelPlaced)store.reduceEffect(state,new HealEffect(e.player,e.target,40));
 if(kind==='quarry'&&e instanceof UseStadiumEffect){
  const p=e.player;card._dpStadiumTurns??={};if(card._dpStadiumTurns[p.id]===state.turn)throw new GameError(GameMessage.POWER_ALREADY_USED);card._dpStadiumTurns[p.id]=state.turn;
  return COIN_FLIP_PROMPT(store,state,p,heads=>{if(!heads)return;const eligible=p.discard.cards.filter((entry:any)=>entry.superType===SuperType.ENERGY&&entry.provides.some((type:any)=>[CardType.LIGHTNING,CardType.METAL].includes(type)));if(!eligible.length)return;store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,p.discard,{},{min:1,max:1,allowCancel:false,blocked:p.discard.cards.map((entry:any,index:number)=>eligible.includes(entry)?-1:index).filter((index:number)=>index>=0)}),(cards:any)=>{MOVE_CARDS(store,state,p.discard,p.hand,{cards,sourceCard:card,sourceEffect:e});store.prompt(state,new ShowCardsPrompt(StateUtils.getOpponent(state,p).id,GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,cards),()=>{});});});
 }
 return state;
}

export function dpTool(card:any,kind:string,store:any,state:any,e:any){
 if(e instanceof AttachPokemonToolEffect&&e.trainerCard===card)card._dpAttachedTurn=state.turn;
 if(!(e instanceof CheckPokemonStatsEffect||e instanceof PutDamageEffect||e instanceof AfterDamageEffect||e instanceof EndTurnEffect||e instanceof CheckPokemonAttacksEffect||e instanceof CheckPokemonPowersEffect||e instanceof PowerEffect||e instanceof KnockOutEffect))return state;
 let owner:any,list:any;for(const p of state.players)for(const target of [p.active,...p.bench])if(target.tools.includes(card)){owner=p;list=target;}
 if(!owner||!list.getPokemonCard()||IS_TOOL_BLOCKED(store,state,owner,card))return state;
 const discard=()=>MOVE_CARDS(store,state,list,owner.discard,{cards:[card],sourceCard:card,sourceEffect:e});
 if(kind==='egg'&&e instanceof KnockOutEffect&&e.target===list&&state.phase===GamePhase.ATTACK&&state.players[state.activePlayer]!==owner&&list._exLethalAttackDamage?.card===list.getPokemonCard()&&list._exLethalAttackDamage.turn===state.turn){e._dpLuckyEgg??=[];e._dpLuckyEgg.push({owner,pokemon:list.getPokemonCard()});}
 if(kind==='bench'&&e instanceof PutDamageEffect&&e.target===list&&owner.bench.includes(list)&&!e.attackEffect?.wotcBypassDefender)e.preventDefault=true;
 if(kind==='buffer'){
  if(e instanceof PutDamageEffect&&e.target===list&&e.player!==owner&&!e.attackEffect?.wotcBypassDefender)e.reduceDamage(20);
  if(e instanceof EndTurnEffect&&e.player!==owner&&state.turn>(card._dpAttachedTurn??-1))discard();
 }
 if(kind==='bubble'){
  if(e instanceof CheckPokemonStatsEffect&&e.target===list)e.weakness=[];
  if(e instanceof AfterDamageEffect&&e.target===list&&e.player!==owner&&e.damage>0)card._dpDiscardTurn=state.turn;
  if(e instanceof EndTurnEffect&&card._dpDiscardTurn===state.turn)discard();
 }
 if(kind==='amulet'&&e instanceof EndTurnEffect&&e.player===owner&&owner.active===list)DRAW_CARDS(store,state,owner,1);
 if(kind==='memory'&&e instanceof CheckPokemonAttacksEffect&&e.player===owner&&owner.active===list&&list.isEvolved())for(const donor of list.getPokemons().filter((entry:any)=>entry!==list.getPokemonCard()&&!entry._dpLevelUp&&[Stage.BASIC,Stage.STAGE_1].includes(entry.stage)))copyAttacks(e,donor);
 if(kind==='link'){
  card._dpLinkPower??={name:'Energy Link',text:card.text,powerType:PowerType.TRAINER_ABILITY,useWhenInPlay:true,exemptFromAbilityLock:true};
  if(e instanceof CheckPokemonPowersEffect&&e.target===list.getPokemonCard())e.powers.push(card._dpLinkPower);
  if(e instanceof PowerEffect&&e.card===list.getPokemonCard()&&e.power===card._dpLinkPower){
   const eligible=[owner.active,...owner.bench].filter((target:any)=>target!==list&&target.getPokemonCard()&&target.tools.some((tool:any)=>tool.name==='Energy Link')),entries=exAttachedEnergy(store,state,owner,list);if(!eligible.length||!entries.length)throw new GameError(GameMessage.CANNOT_USE_POWER);
   const view=new CardList();view.cards=entries.map((entry:any)=>entry.card);return store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_ATTACH,view,{},{min:1,max:1,allowCancel:false}),(cards:any)=>{const slots=[{player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0,list:owner.active},...owner.bench.map((list:any,index:number)=>({player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index,list}))];store.prompt(state,new ChoosePokemonPrompt(owner.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:slots.filter((slot:any)=>!eligible.includes(slot.list)).map(({list,...target}:any)=>target)}),(targets:any)=>MOVE_CARDS(store,state,entries.find((entry:any)=>entry.card===cards[0]).zone,targets[0],{cards,sourceCard:card,sourceEffect:e}));});
  }
 }
 return state;
}
