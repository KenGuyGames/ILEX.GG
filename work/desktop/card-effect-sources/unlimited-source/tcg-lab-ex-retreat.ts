import { CardType } from './game/store/card/card-types';
import { CheckRetreatCostEffect } from './game/store/effects/check-effects';
// EX costs are Colorless. Accumulate reductions below zero before flooring the
// final query, and retain absolute zero separately from a printed zero cost.
export function prepareExRetreatCost(state:any,e:any){
 if(!state.rules.exEraRules||!(e instanceof CheckRetreatCostEffect)||e._exRetreatPrepared)return;
 e._exRetreatPrepared=true;let balance=e.cost.length,absolute=false;
 const cost:any[]=[];const sync=()=>{cost.length=0;cost.push(...Array(absolute?0:Math.max(0,balance)).fill(CardType.COLORLESS));};sync();
 const view=new Proxy(cost,{get(target,key){
  if(key==='push')return (...cards:any[])=>{balance+=cards.length;sync();return target.length;};
  if(key==='splice')return (at:number,count:number,...cards:any[])=>{balance-=count;balance+=cards.length;sync();return [];};
  if(key==='indexOf'||key==='lastIndexOf')return (type:any)=>type===CardType.COLORLESS?0:target.indexOf(type);
  return Reflect.get(target,key,target);
 }});
 Object.defineProperty(e,'cost',{configurable:true,get:()=>view,set:(cards:any[])=>{balance=cards.length;if(!cards.length)absolute=true;sync();}});
}
