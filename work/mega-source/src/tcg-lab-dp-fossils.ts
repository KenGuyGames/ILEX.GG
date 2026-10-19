import { PokemonCard,CardType,Stage,PowerType,StateUtils,SelectPrompt,GameMessage,GameError,SuperType } from './game';
import { PlayItemEffect,PlayPokemonEffect } from './game/store/effects/play-card-effects';
import { PowerEffect } from './game/store/effects/game-effects';
import { AddSpecialConditionsEffect } from './game/store/effects/attack-effects';
import { AddSpecialConditionsPowerEffect } from './game/store/effects/check-effects';
import { MOVE_POKEMON_OFF_BOARD } from './game/store/prefabs/prefabs';
import { wotcPowers } from './tcg-lab-wotc-powers';

export function installDpFossil(card:any,record:any){
 const pokemon:any=new PokemonCard();for(const key of Object.keys(pokemon))if(card[key]===undefined)card[key]=pokemon[key];
 card.superType=SuperType.TRAINER;card._dpFossil=true;card._wotcFinalPlans=record.powers;card.stage=Stage.BASIC;card.hp=+record.d.hp;card.cardType=[CardType.COLORLESS];card.retreat=[];card.attacks=[];
 card.powers=(record.d.abilities||[]).map((power:any)=>({name:power.name,text:power.text,powerType:PowerType.POKEBODY,_wotcPassive:true}));
 const discard={name:'Discard '+card.name,text:'Discard this Fossil and its attached cards from play.',powerType:PowerType.TRAINER_ABILITY,useWhenInPlay:true,exemptFromAbilityLock:true,isFossil:true,_dpExtra:true};card.powers.push(discard);
 card.reduceEffect=function(store:any,state:any,e:any){
  if(e instanceof PlayItemEffect&&e.trainerCard===this){
   const p=e.player;if(!p.bench.some((list:any)=>!list.cards.length))throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);e.preventDefault=true;
   const empty=p.bench.map((list:any,index:number)=>({list,index})).filter((entry:any)=>!entry.list.cards.length);
   return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,empty.map((entry:any)=>'Bench '+(entry.index+1)),{allowCancel:false}),(index:any)=>{store.reduceEffect(state,new PlayPokemonEffect(p,this,empty[index].list));});
  }
  const list=StateUtils.findPokemonSlot(state,this);if(!list||list.getPokemonCard()!==this)return state;
  const owner=StateUtils.findOwner(state,list);
  if((e instanceof AddSpecialConditionsEffect||e instanceof AddSpecialConditionsPowerEffect)&&e.target===list)e.preventDefault=true;
  if((e.type==='RETREAT_EFFECT'||e.type==='RETREAT_START_EFFECT')&&e.player===owner&&owner.active===list)throw new GameError(GameMessage.CANNOT_RETREAT);
  if(e instanceof PowerEffect&&e.card===this&&e.power===this.powers[this.powers.length-1]){MOVE_POKEMON_OFF_BOARD(store,state,list,{pokemonDestination:owner.discard,attachedDestination:owner.discard,sourceCard:this,sourceEffect:e});return state;}
  return wotcPowers(this,record.powers,store,state,e);
 };
}
