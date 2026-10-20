import {Stage,PowerType,GameMessage,GameError,StateUtils,CardTag,SuperType,EnergyType} from './game';
import {PlayPokemonEffect} from './game/store/effects/play-card-effects';
import {EvolveEffect,HealEffect,PowerEffect} from './game/store/effects/game-effects';
import {AfterDamageEffect,PutCountersEffect,PutDamageEffect} from './game/store/effects/attack-effects';
import {IS_TOOL_BLOCKED,IS_SPECIAL_ENERGY_BLOCKED,BREAK_RULE,MOVE_CARDS} from './game/store/prefabs/prefabs';
import {xyTypes} from './tcg-lab-xy-actions';
import {CardList} from './game';
export function installXyCard(card:any,record:any){
 card._xyId=record.d.id;card._xyTrait=record.d.ancientTrait?.name;
 const tool=record.trainerOps?.find((op:any)=>op.op==='tool');if(tool?.kind==='xySpiritLink')card._xySpiritLinkTarget=tool.target;
 if(record.xyEnergy){card.energyType=EnergyType.SPECIAL;card.provides=[xyTypes[record.xyEnergy.energy],xyTypes[record.xyEnergy.energy]];card.text=record.d.rules.join('\n');}
 const old=card.reduceEffect;
 card.reduceEffect=function(store:any,state:any,e:any){
  const card:any=this;
  const list=state.players.flatMap((p:any)=>[p.active,...p.bench]).find((l:any)=>l.cards.includes(card)||l.energies.cards.includes(card)),owner=list?StateUtils.findOwner(state,list):undefined;
  if(record.xyEnergy){const tag=record.xyEnergy.team==='Aqua'?CardTag.TEAM_AQUA:CardTag.TEAM_MAGMA;
   if(e.type==='ATTACH_ENERGY_EFFECT'&&e.energyCard===card&&!e.target.getPokemonCard()?.tags.includes(tag))throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
   if(list&&e.type==='AFTER_ENERGY_ATTACHED_EFFECT'&&e.energyCard===card)card._xyAttachedTurn=state.turn;
   if(list&&!IS_SPECIAL_ENERGY_BLOCKED(store,state,owner,card,list)){
    if(e.type==='CHECK_PROVIDED_ENERGY_EFFECT'&&e.source===list){const provides=list.getPokemonCard()?.tags.includes(tag)?card.provides:[],entry=e.energyMap.find((v:any)=>v.card===card);if(entry)entry.provides=provides;else e.energyMap.push({card,provides});}
    if(e.type==='CHECK_TABLE_STATE_EFFECT'&&!list.getPokemonCard()?.tags.includes(tag)||e.type==='END_TURN_EFFECT'&&card._xyAttachedTurn===state.turn){const zone=list.cards.includes(card)?list:list.energies;MOVE_CARDS(store,state,zone,owner.discard,{cards:[card],sourceCard:card,sourceEffect:e});}
   }
  }
  if(list&&list.getPokemonCard()===card){
   if(card._xyTrait==='θ Stop'){const context=(CardList as any).wotcMovementContext;const targeted=e.target===list||e.type==='MOVE_CARDS_EFFECT'&&(e.source===list||e.source===list.energies);if(targeted&&e.player!==owner&&(e.type==='EFFECT_OF_ABILITY_EFFECT'||context?.kind==='power'&&context.actorId!==owner.id)){e.preventDefault=true;return state;}}
  }
  if(card._xySpiritLinkTarget&&e instanceof PlayPokemonEffect&&e.target.tools.includes(card)&&e.pokemonCard.name===card._xySpiritLinkTarget&&!IS_TOOL_BLOCKED(store,state,e.player,card))e.skipMegaEvolutionEndTurn=true;
  if(tool?.kind==='xyFloralCrown'&&e.type==='END_TURN_EFFECT'){for(const owner of state.players)for(const list of [owner.active,...owner.bench])if(owner!==e.player&&list.tools.includes(card)&&list.getPokemonCard()?.stage===Stage.BASIC&&!IS_TOOL_BLOCKED(store,state,owner,card))store.reduceEffect(state,new HealEffect(owner,list,20));}
  // Permission belongs to the actual evolution card in hand, checked centrally.
  // An unrelated trait card in either player's hand/field must not grant it.
  if(!record.reuse&&card.stage===Stage.BREAK)BREAK_RULE(e,state,card);
  return old.call(this,store,state,e);
 };
}
