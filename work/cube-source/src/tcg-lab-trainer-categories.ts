import {SuperType,TrainerType} from './game';
// Tools stopped being Items with SV. Historical profiles retain the older category.
export function isTrainerItem(card:any,state:any){
 return card?.superType===SuperType.TRAINER&&(card.trainerType===TrainerType.ITEM||!state?.rules?.svEraRules&&card.trainerType===TrainerType.TOOL);
}
