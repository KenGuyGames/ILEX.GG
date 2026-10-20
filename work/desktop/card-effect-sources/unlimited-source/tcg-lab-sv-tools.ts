import {StateUtils} from './game';
import {PutDamageEffect} from './game/store/effects/attack-effects';
import {CheckPokemonTypeEffect} from './game/store/effects/check-effects';
import {KnockOutEffect} from './game/store/effects/game-effects';
import {MOVE_CARDS} from './game/store/prefabs/prefabs';
import {ToolEffect} from './game/store/effects/play-card-effects';
import {IS_TOOL_BLOCKED} from './game/store/prefabs/prefabs';
import {xyTypes} from './tcg-lab-xy-actions';

// Consumption happens in the final damage pipeline, after prevention and normal
// reductions, so a Bench barrier cannot spend a Berry before blocking the hit.
export function installSvTool(card:any,record:any){
 const duster=record.trainerOps?.some((op:any)=>op.kind==='svCursedDuster');
 if(duster){const ordinary=card.reduceEffect;card.reduceEffect=function(store:any,state:any,e:any){
  if(e instanceof KnockOutEffect&&e.target.tools.includes(this)){
   const owner=StateUtils.findOwner(state,e.target),lethal=e.target._exLethalAttackDamage,opponent=StateUtils.getOpponent(state,owner);
   if(state.players[state.activePlayer]!==owner&&lethal?.turn===state.turn&&lethal.card===e.target.getPokemonCard()&&!IS_TOOL_BLOCKED(store,state,owner,this)&&!e._svDusterUsed?.includes(this.id)){
    e._svDusterUsed??=[];e._svDusterUsed.push(this.id);const cards=opponent.hand.cards;if(cards.length){const provenance:any=new ToolEffect(owner,this);provenance._wotcTrainer=true;provenance._wotcTrainerCard=this;MOVE_CARDS(store,state,opponent.hand,opponent.discard,{cards:[cards[Math.floor(Math.random()*cards.length)]],sourceCard:this,sourceEffect:provenance});}
   }
  }return ordinary.call(this,store,state,e);
 };}
 const berry=record.trainerOps?.find((op:any)=>op.kind==='svBerry');if(!berry)return;
 const ordinary=card.reduceEffect;
 card.reduceEffect=function(store:any,state:any,e:any){
  if(e instanceof PutDamageEffect&&e.damage>0&&!e.preventDefault&&e.target.tools.includes(this)&&!e.attackEffect?.wotcBypassDefender){
   const owner=StateUtils.findOwner(state,e.target);
   if(e.player!==owner&&!IS_TOOL_BLOCKED(store,state,owner,this)){
    const type=new CheckPokemonTypeEffect(e.source);store.reduceEffect(state,type);
    if(type.cardTypes.includes(xyTypes[berry.energy])){
     if(!e.consumableDamageReductions.some((entry:any)=>entry.card===this))e.consumableDamageReductions.push({card:this,holder:e.target,amount:berry.amount});
    }
   }
  }
  return ordinary.call(this,store,state,e);
 };
}
