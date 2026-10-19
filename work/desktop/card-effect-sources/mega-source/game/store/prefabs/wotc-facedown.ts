import { PokemonCard } from '../card/pokemon-card';
import { Stage, CardType } from '../card/card-types';
import { PowerType } from '../card/pokemon-types';
import { PowerEffect } from '../effects/game-effects';
import { CardList } from '../state/card-list';
import { StateUtils } from '../state-utils';

// A concealed card is an actual Basic while face down, without inheriting the
// identity, attacks or Powers of the underlying card. Reveal changes the same
// object back, so attachments, card IDs and movement references stay stable.
export function revealConcealedCard(card:any):boolean {
 const real=card._wotcConcealedCard;if(!real)return false;
 for(const key of Object.keys(card))delete card[key];
 Object.setPrototypeOf(card,Object.getPrototypeOf(real));Object.assign(card,real);
 return true;
}
export function revealWotcSlot(store:any,state:any,list:any):boolean {
 const card=list.getPokemonCard();if(!card?._wotcConcealedCard)return false;
 const owner=StateUtils.findOwner(state,list);revealConcealedCard(card);list.isSecret=false;
 if(card instanceof PokemonCard&&card.stage===Stage.BASIC)return false;
 const previous=(CardList as any).wotcMovementContext;
 (CardList as any).wotcMovementContext={...previous,actorId:owner.id,wholePokemon:true};
 try{list.moveTo(owner.discard);}finally{(CardList as any).wotcMovementContext=previous;}
 return true;
}
export function concealedBasic(real:any):PokemonCard {
 const proxy:any=new PokemonCard();proxy.id=real.id;proxy.name='Face-down card';proxy.fullName='ILEX concealed Basic';proxy.stage=Stage.BASIC;
 // No automatic checkup should reveal an unaffected hidden card to inspect HP.
 proxy.hp=Infinity;proxy.cardType=[CardType.COLORLESS];proxy.retreat=[];proxy.attacks=[];
 proxy._wotcConcealedCard=real;proxy._wotcRevealAction=true;
 proxy.powers=[{name:'Reveal face-down card',powerType:PowerType.ABILITY,text:'Turn this card face up.',useWhenInPlay:true}];
 proxy.reduceEffect=function(store:any,state:any,e:any){if(e instanceof PowerEffect&&e.card===this){const list=StateUtils.findCardList(state,this);revealWotcSlot(store,state,list);}return state;};
 return proxy;
}
export function revealForWotcKnowledge(store:any,state:any,list:any):boolean {
 if(!store._wotcActionDepth||store.calculatingPlayability)return false;
 return revealWotcSlot(store,state,list);
}
