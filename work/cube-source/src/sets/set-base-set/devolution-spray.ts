import { TrainerCard, TrainerType, Stage, PokemonCard, State, StoreLike, PlayerType, SlotType, ChoosePokemonPrompt, SelectPrompt, GameMessage, GameError } from '../../game';
import { Effect } from '../../game/store/effects/effect';
import { TrainerEffect } from '../../game/store/effects/play-card-effects';
export class DevolutionSpray extends TrainerCard {
  public name='Devolution Spray'; public fullName='Devolution Spray BS'; public set='BS';public setNumber='72';public cardImage='assets/cardback.png';protected _trainerType=TrainerType.ITEM;
  public text='Choose 1 of your own Pokémon in play and a Stage of Evolution. Discard all Evolution cards of that Stage or higher attached to that Pokémon. Clear Special Conditions and effects of attacks.';
  public reduceEffect(store:StoreLike,state:State,effect:Effect):State {
    if(effect instanceof TrainerEffect && effect.trainerCard===this){
      const player=effect.player,blocked:any[]=[];let hasTarget=false;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER,(list,card,target)=>{if(list.cards.some(c=>c instanceof PokemonCard && c.stage>Stage.BASIC))hasTarget=true;else blocked.push(target)});
      if(!hasTarget)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      return store.prompt(state,new ChoosePokemonPrompt(player.id,GameMessage.CHOOSE_POKEMON,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{min:1,max:1,allowCancel:false,blocked}),targets=>{
        const list=targets![0];const stages=[Stage.STAGE_1,Stage.STAGE_2].filter(stage=>list.cards.some(c=>c instanceof PokemonCard && c.stage>=stage));
        return store.prompt(state,new SelectPrompt(player.id,GameMessage.CHOOSE_OPTION,stages.map(s=>'Discard Stage '+(s===Stage.STAGE_1?'1':'2')+' and higher'),{allowCancel:false}),choice=>{
          const discarded=list.cards.filter(c=>c instanceof PokemonCard && c.stage>=stages[choice!]);list.moveCardsTo(discarded,player.discard);list.clearEffects();
        });
      });
    }return state;
  }
}
