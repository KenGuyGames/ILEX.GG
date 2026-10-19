import { SelectPrompt,GameMessage } from './game';
// Private choices are held in the resolving callback, never in public card state.
export function dpSecretCoinGuess(store:any,state:any,p:any,o:any,done:(correct:boolean)=>void){return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Hide heads','Hide tails'],{allowCancel:false,isBlindGuess:true} as any),(hidden:number)=>store.prompt(state,new SelectPrompt(o.id,GameMessage.CHOOSE_OPTION,['Guess heads','Guess tails'],{allowCancel:false,isBlindGuess:true} as any),(guess:number)=>done(hidden===guess)));}
