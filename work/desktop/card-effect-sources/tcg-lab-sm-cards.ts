import {CardTag,CardType,EnergyType,TrainerType,GameError,GameMessage,ChooseCardsPrompt,ShuffleDeckPrompt} from './game';
import {AttackEffect,UseAttackEffect,PowerEffect,HealEffect} from './game/store/effects/game-effects';
import {TrainerEffect} from './game/store/effects/play-card-effects';
import {CheckPokemonAttacksEffect,CheckPokemonTypeEffect} from './game/store/effects/check-effects';
import {IS_TOOL_BLOCKED,IS_ABILITY_BLOCKED,FLIP_UNTIL_TAILS_AND_COUNT_HEADS,MOVE_CARDS,DRAW_CARDS} from './game/store/prefabs/prefabs';
import {exAttachedEnergy} from './tcg-lab-ex-attachments';
export function installSmCard(card:any,record:any){
 // Shining Legends shares a name, but no gameplay effect, with Base Set Breeder.
 if(['sm3.5-63','sm3.5-73'].includes(record.d.id)){
  card.trainerType=TrainerType.SUPPORTER;card.text=(record.d.rules||[]).join(' ');
  card.reduceEffect=function(store:any,state:any,e:any){
   if(e instanceof TrainerEffect&&e.trainerCard===this){
    if(!e.player.deck.cards.length)throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
    DRAW_CARDS(store,state,e.player,2);store.reduceEffect(state,new HealEffect(e.player,e.player.active,20));
   }
   return state;
  };
 }
 card._smId=record.d.id;
 if(card.powers?.some((p:any)=>['Cat Walk','Dance of Tribute'].includes(p.name))){const reduce=card.reduceEffect;card.reduceEffect=function(store:any,state:any,e:any){if(e instanceof PowerEffect&&e.card===this&&this.powers.includes(e.power)&&['Cat Walk','Dance of Tribute'].includes(e.power.name)){const p=e.player,name=e.power.name;if(IS_ABILITY_BLOCKED(store,state,p,this))throw new GameError(GameMessage.BLOCKED_BY_EFFECT);if(!(p._smKos||[]).some((ko:any)=>ko.turn===(p._dpLastOpponentTurn??state.turn-1)&&ko.opponentTurn&&(name!=='Cat Walk'||ko.gxEx))||p._smAbilityTurns?.[name]===state.turn||!p.deck.cards.length)throw new GameError(GameMessage.CANNOT_USE_POWER);(p._smAbilityTurns??={})[name]=state.turn;if(name==='Dance of Tribute'){DRAW_CARDS(store,state,p,3);return state;}return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,p.deck,{},{min:0,max:2,allowCancel:false}),(cards:any)=>{MOVE_CARDS(store,state,p.deck,p.hand,{cards,sourceCard:this,sourceEffect:e});store.prompt(state,new ShuffleDeckPrompt(p.id),(order:any)=>p.deck.applyOrder(order));});}return reduce.call(this,store,state,e);};}
 if(record.powers?.some((p:any)=>p.action==='doubleDrive')||record.d.abilities?.some((p:any)=>p.name==='Double Drive'))card._smDoubleDrive=true;
 if(record.reuse&&record.d.abilities?.length===card.powers?.length)card.powers.forEach((p:any,i:number)=>{p.name=record.d.abilities[i].name;p.text=record.d.abilities[i].text;});
 const subtypes=record.d.subtypes||[];
 for(const [name,tag] of [['GX',CardTag.POKEMON_GX],['TAG TEAM',CardTag.TAG_TEAM],['Prism Star',CardTag.PRISM_STAR],['Ultra Beast',CardTag.ULTRA_BEAST]] as any[])if(subtypes.includes(name)&&!card.tags.includes(tag))card.tags.push(tag);
 card.attacks?.forEach((attack:any,index:number)=>{if(/-GX$/.test(record.d.attacks?.[index]?.name||''))attack.gxAttack=true;});
 if(subtypes.includes('Prism Star'))card._wotcMaxCopies=1;
 if(record.powers?.some((p:any)=>p.action==='electricSetup')){card._smSetupSecondOnly=true;if(!card.tags.includes(CardTag.PLAY_DURING_SETUP))card.tags.push(CardTag.PLAY_DURING_SETUP);}
 const z=record.trainerOps?.find((op:any)=>op.kind==='smZ');if(z){card._smZRequired=z.requiredAttack;card.attacks.forEach((a:any)=>a._smZTool=true);const reduce=card.reduceEffect;card.reduceEffect=function(store:any,state:any,e:any){
  if((e instanceof AttackEffect||e instanceof UseAttackEffect)&&this.attacks.includes(e.attack)&&e.player.active.tools.includes(this)){
   const check=new CheckPokemonAttacksEffect(e.player);store.reduceEffect(state,check);if(!check.attacks.includes(e.attack)||IS_TOOL_BLOCKED(store,state,e.player,this))throw new GameError(GameMessage.CANNOT_USE_ATTACK);if(e.player.usedGX)throw new GameError(GameMessage.LABEL_GX_USED);
   if(e instanceof AttackEffect){e.player.usedGX=true;if(z.requiredAttack==='Air Slash'){e.damage=180;e.source.preventDamageNextTurnPending={};e.source.preventEffectsOfAttacksNextTurnPending={};return state;}if(z.requiredAttack==='Tackle')return FLIP_UNTIL_TAILS_AND_COUNT_HEADS(store,state,e.player,(heads:number)=>{e.damage=200+40*heads;});const entries=exAttachedEnergy(store,state,e.player,e.source).filter((entry:any)=>entry.card.energyType===EnergyType.BASIC);e.damage=80*entries.length;for(const entry of entries)MOVE_CARDS(store,state,entry.zone,e.player.discard,{cards:[entry.card],sourceCard:e.source.getPokemonCard(),sourceEffect:e});}
  }
  return reduce.call(this,store,state,e);
 };}
 if(!record.reuse&&record.d.supertype==='Pokémon'){const reduce=card.reduceEffect;card.reduceEffect=function(store:any,state:any,e:any){
  if((e instanceof AttackEffect||e instanceof UseAttackEffect)&&this.attacks.includes(e.attack)&&e.attack.gxAttack){if(e.player.usedGX)throw new GameError(GameMessage.LABEL_GX_USED);if(e instanceof AttackEffect)e.player.usedGX=true;}
  return reduce.call(this,store,state,e);
 };}
 if(card.attacks?.some((a:any)=>a.gxAttack)){const reduce=card.reduceEffect;card.reduceEffect=function(store:any,state:any,e:any){
  if((e instanceof AttackEffect||e instanceof UseAttackEffect)&&this.attacks.includes(e.attack)&&e.attack.gxAttack){const p=e.player,source=e.source||p.active;let allowed=p._smZygardeGxTurn===state.turn&&source.getPokemonCard()?.name==='Zygarde-GX';if(p._smWaterGxTurn===state.turn){const type=new CheckPokemonTypeEffect(source);store.reduceEffect(state,type);allowed=allowed||type.cardTypes.includes(CardType.WATER);}if(allowed){const spent=p.usedGX;p.usedGX=false;try{return reduce.call(this,store,state,e);}finally{p.usedGX=spent||p.usedGX||e instanceof AttackEffect;}}}
  return reduce.call(this,store,state,e);
 };}
}
