import {wotcPowers} from './tcg-lab-wotc-powers';
import {CheckPokemonAttacksEffect} from './game/store/effects/check-effects';
import {StateUtils,GameLog,CardType,ConfirmPrompt,GameMessage} from './game';
import {ApplyWeaknessEffect} from './game/store/effects/attack-effects';
import {CheckPokemonTypeEffect} from './game/store/effects/check-effects';
import {DRAW_CARDS,IS_ABILITY_BLOCKED} from './game/store/prefabs/prefabs';
import {ATTACK_COIN_REFLIP_REDUCE_EFFECT} from './game/store/prefabs/attack-coin-reflip';
export function installBwCard(card:any){
 const versatile=card.powers?.some((p:any)=>p.name==='Versatile'),victory=card.powers?.some((p:any)=>p.name==='Victory Star'),justified=card.powers?.some((p:any)=>p.name==='Justified'),intuition=card.powers?.some((p:any)=>p.name==='Intuition');
 if(!versatile&&!victory&&!justified&&!intuition)return;
 card.powers.forEach((p:any)=>{if(['Versatile','Victory Star','Justified','Intuition'].includes(p.name)){p._wotcPassive=true;p.useWhenInPlay=false;}});
 const old=card.reduceEffect;card.reduceEffect=function(store:any,state:any,e:any){
  const list=StateUtils.findPokemonSlot(state,this);
  if(list&&!e.preventDefault){const owner=StateUtils.findOwner(state,list);if(versatile&&e instanceof CheckPokemonAttacksEffect)wotcPowers(this,[{kind:'dpBorrowAttacks',pool:'allField',conditions:null}],store,state,e);
   if(victory){const result=ATTACK_COIN_REFLIP_REDUCE_EFFECT(store,state,e,{source:'tool',reflipLog:GameLog.LOG_PLAYER_USES_ABILITY,canOffer:(s,st,p)=>p===owner&&st.players[st.activePlayer]===p&&!IS_ABILITY_BLOCKED(s,st,p,this)});if(e.preventDefault)return result;}
   if(justified&&e instanceof ApplyWeaknessEffect&&e.source===list&&e.damage>0&&!IS_ABILITY_BLOCKED(store,state,owner,this)){const type=new CheckPokemonTypeEffect(e.target);store.reduceEffect(state,type);if(type.cardTypes.includes(CardType.DARK))e.damage+=50;}

  }
  return old.call(this,store,state,e);
 };
}

export function bwFinish(store:any,state:any,e:any){if(e.type==='EVOLVE_EFFECT'&&e._bwFromHand&&!e._bwIntuitionDone&&e.target.getPokemonCard()===e.pokemonCard&&e.pokemonCard.powers?.some((p:any)=>p.name==='Intuition')&&!IS_ABILITY_BLOCKED(store,state,e.player,e.pokemonCard)){e._bwIntuitionDone=true;store.prompt(state,new ConfirmPrompt(e.player.id,'Use Intuition to draw 2 cards?' as GameMessage),(yes:boolean)=>{if(yes)DRAW_CARDS(store,state,e.player,2);});}return state;}
