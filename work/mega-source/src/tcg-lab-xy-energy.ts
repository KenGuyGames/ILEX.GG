import {CardList,SuperType,StateUtils} from './game';
import {DiscardCardsEffect} from './game/store/effects/attack-effects';
import {AttackEffect} from './game/store/effects/game-effects';
import {MOVE_CARDS} from './game/store/prefabs/prefabs';
import {shouldPreventAttackEffects} from './game/store/effects/effect-of-attack-effects';
const completedAttacks=new WeakMap<object,AttackEffect>();
export function xyAfterAttack(effect:any,index:number,card:any):AttackEffect|undefined{
 const attack=card.attacks[index];if(!attack||effect.attack!==attack)return;
 if(effect instanceof AttackEffect){completedAttacks.set(card,effect);return;}
 if(effect.type==='AFTER_ATTACK_EFFECT'){const original=completedAttacks.get(card);completedAttacks.delete(card);if(original?.attack===attack)return original;}
}
// Regular Energy and Pokemon acting as Energy occupy different physical zones.
// Native card effects must inspect and prompt against the same combined view.
export function xyEnergyCards(list:any):any[]{return [...new Set([...list.cards.filter((c:any)=>c.superType===SuperType.ENERGY),...list.energies.cards])];}
export function xyEnergyView(list:any):CardList{const view=new CardList();view.cards=xyEnergyCards(list);return view;}
export function xyDiscardEnergy(store:any,state:any,list:any,cards:any[],sourceCard:any,effect:any):void{
 const owner=StateUtils.findOwner(state,list);
 if(effect instanceof AttackEffect){const discard=new DiscardCardsEffect(effect,cards);discard.target=list;store.reduceEffect(state,discard);if(!discard.preventDefault&&!shouldPreventAttackEffects(state,discard))for(const card of cards)if(list.energies.cards.includes(card))MOVE_CARDS(store,state,list.energies,owner.discard,{cards:[card],sourceCard,sourceEffect:effect});return;}
 for(const card of cards){const zone=list.cards.includes(card)?list:list.energies.cards.includes(card)?list.energies:null;if(zone)MOVE_CARDS(store,state,zone,owner.discard,{cards:[card],sourceCard,sourceEffect:effect});}
}
