let resolveCopy:any;
export function registerDpSupporterCopy(resolver:any){resolveCopy=resolver;}
export function copyDpSupporter(store:any,state:any,player:any,card:any,source:any,attack?:any){if(!resolveCopy)throw new Error('Supporter copy resolver not ready');return resolveCopy(store,state,player,card,source,attack);}
