import {CardTag,StateUtils,CardType,GameError,GameMessage,PowerType} from './game';
import {CheckRetreatCostEffect} from './game/store/effects/check-effects';
import {UseStadiumEffect} from './game/store/effects/game-effects';
import {IS_STADIUM_EFFECT_BLOCKED} from './game/store/prefabs/stadium-effect';
import {installSvTool} from './tcg-lab-sv-tools';
import {PutDamageEffect} from './game/store/effects/attack-effects';
import {UseAttackEffect} from './game/store/effects/game-effects';

// Shared printing metadata applies to native and compiled cards alike.
export function installSvCard(card:any,record:any){
 const d=record.d;
 card._svEnvironment=(record.powers||[]).filter((op:any)=>op.kind==='svEnvironment').map((op:any)=>op.action);
 const prior=card.reduceEffect;
 card.reduceEffect=function(store:any,state:any,e:any){
  if(e instanceof PutDamageEffect&&e.player!==StateUtils.findOwner(state,e.target)&&e.target.getPokemonCard()?.tags.includes(CardTag.FUTURE)&&!e.attackEffect?.wotcBypassDefender){
   const owner=StateUtils.findOwner(state,e.target),source=owner.active;if(source.getPokemonCard()===this&&source._svCodeProtectTurn===state.turn&&source.marker.hasMarker('SV_CODE_PROTECT',this)&&e.source.getPokemonCard()?.tags.includes(CardTag.POKEMON_ex)&&!!e.source.getPokemonCard()?.regulationMark){e.preventDefault=true;return state;}
  }return prior.call(this,store,state,e);
 };
 installSvTool(card,record);
 if(record.trainerOps?.some((op:any)=>op.kind==='svPsyduckRetreat')){
  const ordinary=card.reduceEffect;
  card.reduceEffect=function(store:any,state:any,e:any){
   if(StateUtils.getStadiumCard(state)===this){
    if(e instanceof CheckRetreatCostEffect&&e.target.getPokemonCard()?.name==='Psyduck'&&!IS_STADIUM_EFFECT_BLOCKED(store,state,e.player,e.target)){const index=e.cost.indexOf(CardType.COLORLESS);if(index>=0)e.cost.splice(index,1);}
    if(e instanceof UseStadiumEffect)throw new GameError(GameMessage.CANNOT_USE_STADIUM);
   }
   return ordinary.call(this,store,state,e);
  };
 }
 card._svId=d.id;
 card._svRainbowDna=d.abilities?.some((a:any)=>a.name==='Rainbow DNA')||false;
 if(record.fossil)card.powers.filter((power:any)=>!power._dpExtra).forEach((power:any)=>power.powerType=PowerType.ABILITY);
 card.regulationMark=d.regulationMark||'';
 card.attacks?.forEach((a:any,i:number)=>{if(d.attacks?.[i]?.text==='If you have no cards in your hand, this attack can be used for Water.')a._svEmptyHandCost=[CardType.WATER];});
 card.attacks?.forEach((a:any,i:number)=>{if(d.attacks?.[i]?.text?.startsWith('If you go first, you can use this attack during your first turn.'))a.canUseOnFirstTurn=true;});
 card.attacks?.forEach((a:any,i:number)=>{if(d.attacks?.[i]?.cost?.length===1&&d.attacks[i].cost[0]==='Free')a.cost=[];});
 card.attacks?.forEach((a:any,i:number)=>{if(d.attacks?.[i]?.text==='This attack can be used even if this Pokémon is on the Bench.')a.useOnBench=true;});
 const subtypes=d.subtypes||[];
 if(d.abilities?.some((a:any)=>a.name==='Festival Lead')){
  const ordinary=card.reduceEffect;
  card.reduceEffect=function(store:any,state:any,e:any){
   if(e instanceof UseAttackEffect&&e.player.active.getPokemonCard()===this)e.attack.barrage=false;
   return ordinary.call(this,store,state,e);
  };
 }
 for(const [name,tag] of [['ex',CardTag.POKEMON_ex],['Tera',CardTag.POKEMON_TERA],['Ancient',CardTag.ANCIENT],['Future',CardTag.FUTURE],['ACE SPEC',CardTag.ACE_SPEC]] as any[]){
  if(subtypes.includes(name)&&!card.tags.includes(tag))card.tags.push(tag);
 }
 if(subtypes.includes('Tera')){
  const ordinary=card.reduceEffect;
  card.reduceEffect=function(store:any,state:any,e:any){
   if(e instanceof PutDamageEffect&&e.target?.getPokemonCard()===this&&state.players.some((p:any)=>p.bench.includes(e.target))){
    e.preventDefault=true;
    return state;
   }
   return ordinary.call(this,store,state,e);
  };
 }
 if(record.reuse&&d.abilities?.length===card.powers?.length)card.powers.forEach((p:any,i:number)=>{p.name=d.abilities[i].name;p.text=d.abilities[i].text;});
}
