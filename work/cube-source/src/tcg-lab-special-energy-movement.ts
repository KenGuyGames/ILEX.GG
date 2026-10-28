export function recordSpecialEnergyDiscard(source:any,destination:any,card:any,context:any):void {
 const plan=card._specialEnergyAttackSource;
 if(card.name!=='Boomerang Energy'||!plan||!context?.state||context.kind!=='attack'||context.wholePokemon||context.knockout||plan.turn!==context.state.turn)return;
 const state=context.state,owner=state.players.find((p:any)=>[p.active,...p.bench].some((l:any)=>l===source||l.energies===source));
 const holder=owner&&[owner.active,...owner.bench].find((l:any)=>l===source||l.energies===source);
 if(!holder||owner.id!==context.actorId||destination!==owner.discard||holder.getPokemonCard()!==plan.pokemon||context.specialEnergyBlocked?.(owner,card,holder))return;
 card._specialEnergyReturn={turn:state.turn,pokemon:plan.pokemon,ownerId:owner.id};
}
