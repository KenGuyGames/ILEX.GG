import {TrainerCard,TrainerType,CardTag,CardType,State,StoreLike,StateUtils,GameError,GameMessage} from '../../../game';
import {Effect} from '../../../game/store/effects/effect';
import {AttackEffect} from '../../../game/store/effects/game-effects';
import {CheckPokemonAttacksEffect,CheckHpEffect} from '../../../game/store/effects/check-effects';
import {PutCountersEffect} from '../../../game/store/effects/attack-effects';
import {IS_TOOL_BLOCKED} from '../../../game/store/prefabs/prefabs';
export class EarthenSealStone extends TrainerCard {
 protected _trainerType=TrainerType.TOOL;
 public regulationMark='F';public set='SIT';public setNumber='154';public cardImage='assets/cardback.png';
 public name='Earthen Seal Stone';public fullName='Earthen Seal Stone SIT 154';
 public text='The Pokémon V this card is attached to can use the VSTAR Power on this card. (You still need the necessary Energy to use this attack.)';
 public attacks=[{name:'Star Gravity',cost:[CardType.COLORLESS,CardType.COLORLESS,CardType.COLORLESS],damage:0,text:"Put damage counters on each of your opponent's Pokémon V until its remaining HP is 100. (You can't use more than 1 VSTAR Power in a game.)"}];
 public reduceEffect(store:StoreLike,state:State,e:Effect):State {
  if(e instanceof CheckPokemonAttacksEffect&&e.player.active.tools.includes(this)&&e.player.active.getPokemonCard()?.hasTag(CardTag.POKEMON_V)&&!IS_TOOL_BLOCKED(store,state,e.player,this)&&!e.attacks.includes(this.attacks[0]))e.attacks.push(this.attacks[0]);
  if(e instanceof AttackEffect&&e.attack===this.attacks[0]){
   if(e.player.usedVSTAR)throw new GameError(GameMessage.LABEL_VSTAR_USED);
   e.player.usedVSTAR=true;
   const opponent=StateUtils.getOpponent(state,e.player);
   for(const list of [opponent.active,...opponent.bench])if(list.getPokemonCard()?.hasTag(CardTag.POKEMON_V)){
    const hp=new CheckHpEffect(opponent,list);store.reduceEffect(state,hp);
    const amount=hp.hp-list.damage-100;
    if(amount>0){const counters=new PutCountersEffect(e,amount);counters.target=list;store.reduceEffect(state,counters);}
   }
  }
  return state;
 }
}
