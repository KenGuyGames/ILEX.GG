import { copyAttacks } from './tcg-lab-wotc-final';
import { CheckPokemonTypeEffect,CheckPokemonAttacksEffect } from './game/store/effects/check-effects';
import { CardType,Stage } from './game';
import { UseAttackEffect } from './game/store/effects/game-effects';
import { EndTurnEffect } from './game/store/effects/game-phase-effects';
import { StateUtils,SuperType,ChooseCardsPrompt,ShuffleDeckPrompt,GameMessage,GameError } from './game';
import { AttachPokemonToolEffect } from './game/store/effects/play-card-effects';
import { BetweenTurnsEffect } from './game/store/effects/game-phase-effects';
import { EvolveEffect } from './game/store/effects/game-effects';
import { MOVE_CARDS,IS_TOOL_BLOCKED } from './game/store/prefabs/prefabs';
import { CardTag } from './game';
import { KnockOutEffect,HealEffect } from './game/store/effects/game-effects';
import { CheckHpEffect,CheckPokemonStatsEffect,CheckTableStateEffect } from './game/store/effects/check-effects';
import { GamePhase } from './game/store/state/state';
export function exWaveTool(card:any,op:any,store:any,state:any,e:any){
 const legal=(list:any)=>!!list.getPokemonCard()&&(!op.evolved||list.isEvolved())&&(!op.excludeEx||!list.getPokemonCard().tags.includes(CardTag.POKEMON_ex))&&(!op.excludeDarkOwner||!/Dark|[’']s /.test(list.getPokemonCard().name));
 if(e instanceof AttachPokemonToolEffect&&e.trainerCard===card&&!legal(e.target))throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
 if(!(e instanceof CheckTableStateEffect||e instanceof CheckPokemonStatsEffect||e instanceof KnockOutEffect||e.type==='EX_CHECKUP_COMPLETE_EFFECT'))return state;
 let owner:any,list:any;for(const p of state.players)for(const l of [p.active,...p.bench])if(l.tools.includes(card)){owner=p;list=l;}
 if(!owner||IS_TOOL_BLOCKED(store,state,owner,card))return state;
 if(!legal(list)){MOVE_CARDS(store,state,list,owner.discard,{cards:[card],sourceCard:card,sourceEffect:e});return state;}
 if(op.kind==='exOrb'&&e instanceof CheckPokemonStatsEffect&&e.target===list)e.weakness=[];
 if(op.kind==='exCurse'&&e instanceof KnockOutEffect&&e.target===list&&owner.active===list&&state.phase===GamePhase.ATTACK&&state.players[state.activePlayer]!==owner&&!list.exForcedKo&&!e._exCurseApplied?.includes(card.id)){const hp=new CheckHpEffect(owner,list);store.reduceEffect(state,hp);if(list.damage<hp.hp||list._exLethalAttackDamage?.card!==list.getPokemonCard()||list._exLethalAttackDamage?.turn!==state.turn)return state;e._exCurseApplied??=[];e._exCurseApplied.push(card.id);const target=StateUtils.getOpponent(state,owner).active,hit:any={type:'EX_TOOL_COUNTERS_EFFECT',player:owner,source:list,target,damage:30,preventDefault:false};store.reduceEffect(state,hit);if(!hit.preventDefault)target.damage+=hit.damage;}
 if(op.kind==='exSitrus'&&e.type==='EX_CHECKUP_COMPLETE_EFFECT'&&list.damage>=30){store.reduceEffect(state,new HealEffect(owner,list,30));MOVE_CARDS(store,state,list,owner.discard,{cards:[card],sourceCard:card,sourceEffect:e});}
 return state;
}
export function exBelt(card:any,team:string,store:any,state:any,e:any){
 if(e instanceof AttachPokemonToolEffect&&e.trainerCard===card&&!e.target.getPokemonCard()?.name.includes(team))throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
 if(!(e instanceof BetweenTurnsEffect))return state;
 const owner=e.player,list=owner.active;if(!list.tools.includes(card)||!list.getPokemonCard()||IS_TOOL_BLOCKED(store,state,owner,card))return state;
 const eligible=owner.deck.cards.filter((c:any)=>c.superType===SuperType.POKEMON&&c.evolvesFrom===list.getPokemonCard().name);
 const finish=()=>store.prompt(state,new ShuffleDeckPrompt(owner.id),(order:any)=>{owner.deck.applyOrder(order);MOVE_CARDS(store,state,list,owner.discard,{cards:[card],sourceCard:card,sourceEffect:e});});
 if(!eligible.length)return finish();
 return store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_HAND,owner.deck,{superType:SuperType.POKEMON},{min:0,max:1,allowCancel:false,blocked:owner.deck.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{if(chosen?.length){owner.deck.moveCardsTo(chosen,owner.hand);const evolution:any=new EvolveEffect(owner,list,chosen[0]);evolution._wotcFromDeck=true;store.reduceEffect(state,evolution);}if(store.hasPrompts())store.waitPrompt(state,finish);else finish();});
}

export function finishTool(card:any,op:any,store:any,state:any,e:any){
 if(!(e instanceof CheckPokemonTypeEffect||e instanceof CheckPokemonAttacksEffect||e instanceof UseAttackEffect||e instanceof EndTurnEffect))return state;
 let p:any,list:any;for(const owner of state.players)for(const l of [owner.active,...owner.bench])if(l.tools.includes(card)){p=owner;list=l;}
 if(!p||IS_TOOL_BLOCKED(store,state,p,card))return state;
 if(op.kind==='finishShard'&&e instanceof CheckPokemonTypeEffect&&e.target===list)e.cardTypes=[CardType.COLORLESS];
 if(op.kind==='finishMemory'&&e instanceof CheckPokemonAttacksEffect&&e.player===p&&p.active===list)for(const donor of list.getPokemons().filter((c:any)=>c!==list.getPokemonCard()&&[Stage.BASIC,Stage.STAGE_1].includes(c.stage)))copyAttacks(e,donor);
 if(e instanceof UseAttackEffect&&e.player===p&&p.active===list)card._finishAttackedTurn=state.turn;
 if(e instanceof EndTurnEffect&&e.player===p&&card._finishAttackedTurn===state.turn)MOVE_CARDS(store,state,list,p.discard,{cards:[card],sourceCard:card,sourceEffect:e});
 return state;
}
