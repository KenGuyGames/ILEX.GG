import {SuperType,TrainerType,CardList,ConfirmPrompt,GameMessage} from './game';
import {IS_ABILITY_BLOCKED,IS_TOOL_BLOCKED,MOVE_CARDS,DRAW_CARDS} from './game/store/prefabs/prefabs';
export function swshBeforeEffect(store:any,state:any,e:any):boolean{
 if(!state.rules.bwEraRules)return false;
 if(e.type==='DREW_TOPDECK_EFFECT'&&e.handCard.powers?.some((p:any)=>p.name==='Top Entry')&&e.player.hand.cards.includes(e.handCard)){
  const p=e.player,c=e.handCard,slot=p.bench.find((l:any)=>!l.cards.length);if(!slot||c._swshTopEntryTurn===state.turn||IS_ABILITY_BLOCKED(store,state,p,c))return false;
  c._swshTopEntryTurn=state.turn;store.prompt(state,new ConfirmPrompt(p.id,GameMessage.WANT_TO_USE_ABILITY),(yes:boolean)=>{if(yes&&p.hand.cards.includes(c)&&!slot.cards.length){MOVE_CARDS(store,state,p.hand,slot,{cards:[c],sourceCard:c,sourceEffect:e});slot.pokemonPlayedTurn=state.turn;}});return true;
 }
 const context=(CardList as any).wotcMovementContext;
 if(['COIN_FLIP_EFFECT','COIN_FLIP_SEQUENCE_EFFECT'].includes(e.type)&&e.callback&&!e._smSystemCoin&&context?.kind==='attack'){
  const p=e.player,tools=p.active.tools.filter((c:any)=>c.name==='Blunder Policy'&&!IS_TOOL_BLOCKED(store,state,p,c));
  if(tools.length&&!e._swshBlunderWrapped){e._swshBlunderWrapped=true;const callback=e.callback;e.callback=(result:any)=>{if(Array.isArray(result)?result.includes(false):result===false){p._swshBlunderQueued??=[];for(const card of tools)if(!p._swshBlunderQueued.includes(card.id))p._swshBlunderQueued.push(card.id);}return callback(result);};}
 }
 if(e.type==='END_TURN_EFFECT'&&e.player?._swshBlunderQueued?.length){const n=e.player._swshBlunderQueued.length;delete e.player._swshBlunderQueued;DRAW_CARDS(store,state,e.player,3*n);}
 return false;
}
export function swshMovementBlocked(source:any,destination:any,card:any,context:any):boolean{
 if(!context?.store||!context.state?.rules?.bwEraRules||context.knockout||context.wholePokemon)return false;
 const {state,store}=context;
 for(const owner of state.players){
  if(owner.id===context.actorId)continue;
  const live=(name:string,bench=false)=>(bench?owner.bench:[owner.active,...owner.bench]).some((l:any)=>{const c=l.getPokemonCard();return c?.powers.some((p:any)=>p.name===name)&&!IS_ABILITY_BLOCKED(store,state,owner,c);});
  if(source===owner.deck&&destination===owner.discard&&['attack','power','trainer'].includes(context.kind)&&live('Reassuring Dam',true))return true;
  if(context.kind==='trainer'&&[TrainerType.ITEM,TrainerType.SUPPORTER].includes(context.sourceCard?.trainerType)&&[owner.hand,owner.deck,owner.discard].includes(destination)&&card.superType===SuperType.ENERGY&&[owner.active,...owner.bench].some((l:any)=>l===source||l.energies===source)&&live('Brazen Tail'))return true;
 }
 return false;
}
