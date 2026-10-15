import { CardList,StateUtils,ChooseCardsPrompt,GameMessage,GameError } from './game';
import { exAttachedEnergy } from './tcg-lab-ex-attachments';
import { MOVE_CARDS } from './game/store/prefabs/prefabs';
// Unit requirements retain multi-Energy cards and Holon's attached Pokemon.
// A chosen set must pay the requirement without an unnecessary extra card.
export function dpPayEnergyUnits(store:any,state:any,p:any,list:any,requirements:any[],sourceCard:any,sourceEffect:any,done:()=>void){
 const entries=(Array.isArray(list)?list:[list]).filter((list:any)=>list.getPokemonCard()).flatMap((list:any)=>exAttachedEnergy(store,state,p,list)),enough=(cards:any[])=>StateUtils.checkEnoughEnergy(entries.filter((entry:any)=>cards.includes(entry.card)),requirements);
 if(!enough(entries.map((entry:any)=>entry.card)))throw new GameError(GameMessage.NOT_ENOUGH_ENERGY);
 const view=new CardList();view.cards=entries.map((entry:any)=>entry.card);
 const prompt=new ChooseCardsPrompt(p,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,view,{},{min:1,max:Math.min(requirements.length,entries.length),allowCancel:false});
 const ordinary=prompt.validate.bind(prompt);prompt.validate=(cards:any)=>ordinary(cards)&&enough(cards)&&cards.every((card:any)=>!enough(cards.filter((other:any)=>other!==card)));
 return store.prompt(state,prompt,(cards:any)=>{for(const card of cards){const entry=entries.find((entry:any)=>entry.card===card);MOVE_CARDS(store,state,entry.zone,p.discard,{cards:[card],sourceCard,sourceEffect});}done();});
}
