import { StateUtils } from '../state-utils';
import { PowerEffect } from '../effects/game-effects';
import { SelectPrompt } from '../prompts/select-prompt';
import { ChooseCardsPrompt } from '../prompts/choose-cards-prompt';
import { ChoosePokemonPrompt } from '../prompts/choose-pokemon-prompt';
import { PlayerType, SlotType } from '../actions/play-card-action';
import { GameError } from '../../game-error';
import { GameMessage } from '../../game-message';
import { SuperType, TrainerType, Stage } from '../card/card-types';
import { COIN_FLIP_PROMPT } from './prefabs';

export function withWotcMindGames(store:any,state:any,player:any,trainer:any,continuePlay:()=>any):any {
 if(!(state.rules as any).wotcRules)return continuePlay();
 const opponent=StateUtils.getOpponent(state,player),sources=[opponent.active,...opponent.bench].map((list:any)=>list.getPokemonCard()).filter((card:any)=>card?._wotcMindGames);
 const allowed=(card:any)=>{try{const probe:any=new PowerEffect(opponent,card.powers[0],card);probe._wotcReactiveProbe=true;card.reduceEffect(store,state,probe);return true;}catch{return false;}};
 const eligible=sources.filter(allowed);if(!eligible.length)return continuePlay();
 // Native reducers normally reject these prerequisites before their first
 // choice. Cancellation must not bypass them or charge a cost for illegal play.
 const hasEnergy=(p:any)=>[p.active,...p.bench].some((l:any)=>l.getPokemonCard()&&l.cards.some((c:any)=>c.superType===SuperType.ENERGY));
 if(['Energy Removal','Super Energy Removal'].includes(trainer.name)&&!hasEnergy(opponent)
  ||trainer.name==='Super Energy Removal'&&!hasEnergy(player)
  ||trainer.name==='Super Potion'&&![player.active,...player.bench].some((l:any)=>l.damage>0&&l.cards.some((c:any)=>c.superType===SuperType.ENERGY))
  ||trainer.name==='Good Manners'&&player.hand.cards.some((c:any)=>c.superType===SuperType.POKEMON&&c.stage===Stage.BASIC)
  ||trainer.name==='Computer Search'&&!player.deck.cards.length
  ||trainer.name==='Item Finder'&&!player.discard.cards.some((c:any)=>c.superType===SuperType.TRAINER)
  ||trainer.name==='Max Revive'&&(!player.bench.some((l:any)=>!l.cards.length)||!player.discard.cards.some((c:any)=>c.superType===SuperType.POKEMON&&c.stage===Stage.BASIC))
  ||trainer.canPlay?.(store,state,player)===false)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
 let paid:any;
 const finish=()=>{if(paid){paid.zone===player.hand?player.discard.moveCardsTo(paid.cards,player.hand):player.discard.moveCardsTo(paid.cards,paid.zone);trainer._wotcPrepaidCost=paid;}
  const result=continuePlay();const cleanup=()=>{delete trainer._wotcPrepaidCost;delete trainer._wotcRemovalCostPrepaid;};if(store.hasPrompts())store.waitPrompt(state,cleanup);else cleanup();return result;};
 const cancel=()=>{const source=StateUtils.findCardList(state,trainer);source.moveCardsTo([trainer],player.deck);player.deck.cards.splice(player.deck.cards.indexOf(trainer),1);player.deck.cards.unshift(trainer);if(trainer.trainerType===TrainerType.SUPPORTER)player.supporterTurn++;delete trainer._wotcPrepaidCost;delete trainer._wotcRemovalCostPrepaid;};
 let index=0;
 const attempt=()=>{if(index>=eligible.length)return finish();const card=eligible[index++];if(!allowed(card))return attempt();return store.prompt(state,new SelectPrompt(opponent.id,GameMessage.CHOOSE_OPTION,['Skip Mind Games','Use Mind Games'],{allowCancel:false}),(choice:any)=>{if(choice!==1)return attempt();COIN_FLIP_PROMPT(store,state,opponent,heads=>{if(heads)cancel();else attempt();});});};
 const handCost=trainer.text.match(/^Discard (\d+|a|an|1) (?:of the )?(?:other )?(?:(Energy) )?cards? (?:from|in) your hand in order to/i);
 const extraCost=(StateUtils.getStadiumCard(state) as any)?._wotcRemovalSurcharge&&['Energy Removal','Super Energy Removal'].includes(trainer.name)&&!state.players.some((p:any)=>p.stadiumAndToolHaveNoEffectTurnsRemaining>0)?2:0;
 const amount=(handCost?(/^(?:a|an)$/.test(handCost[1])?1:Number(handCost[1])):0)+extraCost;
 const energyCost=()=>{if(!/^Discard 1 Energy card attached to 1 of your (?:own )?Pokémon in order/i.test(trainer.text))return attempt();const slots=[player.active,...player.bench].filter((l:any)=>l.cards.some((c:any)=>c.superType===SuperType.ENERGY)&&(trainer.name!=='Super Potion'||l.damage>0));if(!slots.length)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);return store.prompt(state,new ChoosePokemonPrompt(player.id,GameMessage.CHOOSE_POKEMON_TO_DISCARD_CARDS,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:player.bench.map((l:any,index:number)=>({l,index})).filter((s:any)=>!slots.includes(s.l)).map((s:any)=>({player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index:s.index})).concat(slots.includes(player.active)?[]:[{player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0}])}),(selected:any)=>{const zone=selected[0];store.prompt(state,new ChooseCardsPrompt(player,GameMessage.CHOOSE_CARD_TO_DISCARD,zone,{superType:SuperType.ENERGY},{min:1,max:1,allowCancel:false}),(cards:any)=>{zone.moveCardsTo(cards,player.discard);paid={cards,zone,energy:true};attempt();});});};
 if(!amount)return energyCost();const choices=player.hand.cards.filter((c:any)=>c!==trainer&&(!handCost?.[2]||c.superType===SuperType.ENERGY));if(choices.length<amount)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
 return store.prompt(state,new ChooseCardsPrompt(player,GameMessage.CHOOSE_CARD_TO_DISCARD,player.hand,handCost?.[2]?{superType:SuperType.ENERGY}:{},{min:amount,max:amount,allowCancel:false,blocked:player.hand.cards.map((c:any,i:number)=>c===trainer?i:-1).filter((i:number)=>i>=0)}),(cards:any)=>{player.hand.moveCardsTo(cards,player.discard);if(extraCost)trainer._wotcRemovalCostPrepaid=true;if(handCost)paid={cards:cards.slice(0,amount-extraCost),zone:player.hand,energy:false};energyCost();});
}
