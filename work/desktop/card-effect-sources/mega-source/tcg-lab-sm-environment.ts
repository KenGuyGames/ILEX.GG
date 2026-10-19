import {CardList,ChooseCardsPrompt,SelectPrompt,GameMessage,GamePhase,StateUtils,CardType,CardTag,TrainerType,SpecialCondition} from './game';
import {AttackEffect} from './game/store/effects/game-effects';
import {AddSpecialConditionsEffect} from './game/store/effects/attack-effects';
import {CheckPokemonTypeEffect} from './game/store/effects/check-effects';
import {IS_ABILITY_BLOCKED,IS_TOOL_BLOCKED,MOVE_CARDS,COIN_FLIP_PROMPT} from './game/store/prefabs/prefabs';
export function smToolCapacity(store:any,state:any,owner:any,list:any){const card=list.getPokemonCard();const multiAdapter=card?.name.includes('Rotom')&&[owner.active,...owner.bench].some((slot:any)=>{const provider=slot.getPokemonCard();return provider?.powers.some((p:any)=>p.name==='Multi Adapter')&&!IS_ABILITY_BLOCKED(store,state,owner,provider);});if(multiAdapter)return 2;const drive=card?.powers.some((p:any)=>p.name==='Double Drive'),pockets=card?.powers.some((p:any)=>['Boss Pockets','Tune-Up'].includes(p.name));return drive||pockets?(IS_ABILITY_BLOCKED(store,state,owner,card)?1:pockets?4:2):card?.maxTools||1;}
export function smBeforeEffect(store:any,state:any,e:any):boolean{
 if(!state.rules.xyEraRules)return false;
 const context=(CardList as any).wotcMovementContext;
 const trainer=e.trainerCard||context?.sourceCard;
 if(context?.kind==='trainer'&&[TrainerType.ITEM,TrainerType.SUPPORTER].includes(trainer?.trainerType))for(const owner of state.players)for(const list of [owner.active,...owner.bench])if(smHasTrainerShield(state,list)&&context.actorId===owner.id&&(e.target===list||e.type==='MOVE_CARDS_EFFECT'&&(e.source===list||e.source===list.energies||e.destination===list||e.destination===list.energies))){e.preventDefault=true;return true;}
 if(e.type==='MOVE_CARDS_EFFECT'&&(e.sourceCard?.name||context?.sourceCard?.name)==="Giovanni's Exile"){
  e._smUnderground=[];for(const owner of state.players)if(e.destination===owner.discard)for(const list of [owner.active,...owner.bench]){const card=list.getPokemonCard();if(card&&e.source===list&&(e.cards||e.source.cards).includes(card)&&card.powers.some((p:any)=>p.name==='Underground Work')&&!IS_ABILITY_BLOCKED(store,state,owner,card))e._smUnderground.push({owner,card});}
 }
 if(e.type==='COIN_FLIP_EFFECT'&&!e._smSystemCoin&&e._smWillResult===undefined&&e.player._smWillTurn===state.turn&&state.phase!==GamePhase.BETWEEN_TURNS&&['attack','trainer','power'].includes(context?.kind)){
  store.prompt(state,new SelectPrompt(e.player.id,GameMessage.CHOOSE_OPTION,['Will: choose heads','Will: choose tails'],{allowCancel:false}),(choice:number)=>{delete e.player._smWillTurn;e._smWillResult=choice===0;store.reduceEffect(state,e);});return true;
 }
 if(['HEAL_EFFECT','HEAL_TARGET_EFFECT'].includes(e.type)&&e.target?.getPokemonCard()){
  const type=new CheckPokemonTypeEffect(e.target);store.reduceEffect(state,type);e._smHealSnapshot={target:e.target,damage:e.target.damage,water:type.cardTypes.includes(CardType.WATER),owner:StateUtils.findOwner(state,e.target)};
 }
 if(e.type==='KNOCK_OUT_EFFECT'&&e.target?.getPokemonCard()){
  const type=new CheckPokemonTypeEffect(e.target);store.reduceEffect(state,type);const owner=StateUtils.findOwner(state,e.target);e._smKoSnapshot={card:e.target.getPokemonCard(),owner,active:owner.active===e.target,types:type.cardTypes.slice(),turn:state.turn,duringTurn:state.phase!==GamePhase.BETWEEN_TURNS};
 }
 if(e.type==='CHECK_TABLE_STATE_EFFECT')for(const owner of state.players)for(const list of [owner.active,...owner.bench]){
  if(!list.getPokemonCard()?.name.includes('Rotom')&&!list.getPokemonCard()?._smDoubleDrive&&!list.getPokemonCard()?.powers.some((p:any)=>['Double Drive','Boss Pockets','Tune-Up'].includes(p.name)))continue;
  const capacity=smToolCapacity(store,state,owner,list),excess=list.tools.length-capacity;
  if(excess>0&&!list._smChoosingTools){list._smChoosingTools=true;const view=new CardList();view.cards=list.tools.slice();store.prompt(state,new ChooseCardsPrompt(owner,GameMessage.CHOOSE_CARD_TO_DISCARD,view,{},{min:excess,max:excess,allowCancel:false}),(cards:any)=>{delete list._smChoosingTools;MOVE_CARDS(store,state,list,owner.discard,{cards,sourceCard:list.getPokemonCard(),sourceEffect:e});store.reduceEffect(state,e);});return true;}
 }
 return false;
}
export function smAfterEffect(store:any,state:any,e:any){
 if(e.type==='CHECK_POKEMON_ATTACKS_EFFECT'){
  e.attacks=e.attacks.filter((a:any)=>!a._smZTool);const card=e.player.active.getPokemonCard(),available=[...(card?.attacks||[]),...e.attacks];for(const tool of e.player.active.tools)if(tool._smZRequired&&available.some((a:any)=>a.name===tool._smZRequired)&&!IS_TOOL_BLOCKED(store,state,e.player,tool))e.attacks.push(...tool.attacks);
 }
 const heal=e._smHealSnapshot;if(heal?.water&&heal.target.damage<heal.damage)heal.owner._smWaterHealedTurn=state.turn;
 for(const entry of e._smUnderground||[])if(entry.owner.discard.cards.includes(entry.card)){const opponent=StateUtils.getOpponent(state,entry.owner);MOVE_CARDS(store,state,opponent.deck,opponent.discard,{cards:opponent.deck.cards.slice(0,1),sourceCard:entry.card,sourceEffect:e});}
 const ko=e._smKoSnapshot;if(ko&&e.target.getPokemonCard()!==ko.card){const entry={turn:ko.turn,types:ko.types,gxEx:ko.card.tags.some((t:any)=>[CardTag.POKEMON_GX,CardTag.POKEMON_EX].includes(t)),opponentTurn:ko.duringTurn&&state.players[state.activePlayer]!==ko.owner};ko.owner._smLastKo=entry;ko.owner._smKos=(ko.owner._smKos||[]).filter((r:any)=>r.turn>=state.turn-2||r.turn===ko.owner._dpLastOpponentTurn);ko.owner._smKos.push(entry);
  if(ko.active&&ko.owner.bench.some((l:any)=>l.getPokemonCard())){const controller=StateUtils.getOpponent(state,ko.owner),hypnos=[controller.active,...controller.bench].map((l:any)=>l.getPokemonCard()).filter((c:any)=>c?.powers.some((p:any)=>p.name==='Hypnotic Pendulum')&&!IS_ABILITY_BLOCKED(store,state,controller,c));const flip=(i:number):any=>{if(i>=hypnos.length)return;COIN_FLIP_PROMPT(store,state,controller,(heads:boolean)=>{if(heads)ko.owner._smPromotionChooser=controller.id;flip(i+1);});};flip(0);}
 }
}
export function smCoinResult(effect:any,result:boolean):boolean{return effect._smWillResult===undefined?result:effect._smWillResult;}
export function smPreparePrompts(state:any,prompts:any[]){for(const prompt of prompts)if(prompt.message===GameMessage.CHOOSE_NEW_ACTIVE_POKEMON){const owner=state.players.find((p:any)=>p.id===prompt.playerId);if(owner?._smPromotionChooser!==undefined&&!owner.active.getPokemonCard()){prompt.perspectivePlayerId=owner.id;prompt.playerId=owner._smPromotionChooser;delete owner._smPromotionChooser;}}}
export function smHasTrainerShield(state:any,list:any):boolean{const plan=list._smTrainerShield;return !!(plan&&plan.turn===state.turn&&plan.card===list.getPokemonCard()&&list.marker.hasMarker('SM_TRAINER_SHIELD'));}
export function smPreventTrainerSwitch(state:any,player:any,context:any):boolean{return !!(state&&context?.kind==='trainer'&&context.actorId===player.id&&[TrainerType.ITEM,TrainerType.SUPPORTER].includes(context.sourceCard?.trainerType)&&smHasTrainerShield(state,player.active));}
export function smDustIsland(store:any,state:any,player:any,wasPoisoned:boolean,context:any){if(!store||!state||!wasPoisoned||context?.kind!=='trainer')return;const stadium=StateUtils.getStadiumCard(state);if(stadium?.name!=='Dust Island'||!player.active.getPokemonCard())return;const b:any=new AttackEffect(player,StateUtils.getOpponent(state,player),{name:'Dust Island',cost:[],damage:0,text:''});b._wotcTrainer=true;b._wotcSourceCard=stadium;const status=new AddSpecialConditionsEffect(b,[SpecialCondition.POISONED]);status.target=player.active;store.reduceEffect(state,status);}
