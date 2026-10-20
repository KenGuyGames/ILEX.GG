import {CardList,TrainerType,SuperType,PowerType} from './game';
import {IS_ABILITY_BLOCKED} from './game/store/prefabs/prefabs';

function live(store:any,state:any,owner:any,action:string,active=false){
 return (active?[owner.active]:[owner.active,...owner.bench]).some((list:any)=>{const card=list.getPokemonCard();return card?._svEnvironment?.includes(action)&&!IS_ABILITY_BLOCKED(store,state,owner,card);});
}
export function svPokemonEffectBlocked(store:any,state:any,target:any,actorId:any,kind:string,sourceCard:any):boolean{
 const owner=state.players.find((p:any)=>p.active===target||p.bench.includes(target));if(!owner||owner.id===actorId)return false;
 if(kind==='trainer'&&sourceCard?.trainerType===TrainerType.SUPPORTER&&live(store,state,owner,'wideWall',true))return true;
 const card=target.getPokemonCard();if(kind==='power'&&card?._svEnvironment?.includes('amberProtection')&&!IS_ABILITY_BLOCKED(store,state,owner,card))return true;
 return false;
}
export function svMovementBlocked(source:any,destination:any,card:any,context:any):boolean{
 const {store,state}=context||{};if(!store||!state?.rules?.bwEraRules||context.knockout)return false;
 const owner=state.players.find((p:any)=>p.active===source||p.bench.includes(source)||p.active.energies===source||p.bench.some((l:any)=>l.energies===source));if(!owner)return false;
 const target=source.getPokemonCard?source:[owner.active,...owner.bench].find((l:any)=>l.energies===source);
 const devolving=!context.wholePokemon&&card?.superType===SuperType.POKEMON&&target?.getPokemons().length>1;
 if(destination===owner.hand&&!devolving&&live(store,state,state.players.find((p:any)=>p!==owner),'mentallyCalm'))return true;
 return svPokemonEffectBlocked(store,state,target,context.actorId,context.kind,context.sourceCard);
}
export function svBeforeEffect(store:any,state:any,e:any):boolean{
 if(!state.rules.bwEraRules)return false;
 const allowed=['EFFECT_OF_ABILITY_EFFECT','ADD_SPECIAL_CONDITIONS_EFFECT','EX_POWER_COUNTERS_EFFECT','WOTC_POWER_DAMAGE_EFFECT','PLACE_DAMAGE_COUNTERS_EFFECT','PUT_COUNTERS_EFFECT','PUT_DAMAGE_EFFECT','DEAL_DAMAGE_EFFECT','HEAL_EFFECT','HEAL_TARGET_EFFECT','GUST_OPPONENT_BENCH_EFFECT','SWITCH_OUT_OPPONENTS_ACTIVE_EFFECT','ADD_MARKER_EFFECT','DISCARD_DEFENDING_POKEMON_EFFECT','MOVE_OPPONENT_ENERGY_EFFECT'];
 if(!allowed.includes(e.type))return false;
 const context=(CardList as any).wotcMovementContext,target=e.effectOfAbility?.target||e.target;
 if(!target?.getPokemonCard)return false;
 const directPower=e.type==='EFFECT_OF_ABILITY_EFFECT'||['EX_POWER_COUNTERS_EFFECT','WOTC_POWER_DAMAGE_EFFECT','PLACE_DAMAGE_COUNTERS_EFFECT'].includes(e.type)||e.type==='ADD_SPECIAL_CONDITIONS_EFFECT'&&!e.attackEffect;
 const kind=directPower?'power':e.attackEffect?._wotcTrainer?'trainer':e.attackEffect?'attack':context?.kind;
 const sourceCard=e.attackEffect?._wotcTrainerCard||e.sourceEffect?.trainerCard||context?.sourceCard,actor=e.player?.id??context?.actorId;
 if(!svPokemonEffectBlocked(store,state,target,actor,kind,sourceCard))return false;
 e.preventDefault=true;if(e.effectOfAbility)e.effectOfAbility.target=undefined;if(e.type==='EFFECT_OF_ABILITY_EFFECT')e.target=undefined;return true;
}
