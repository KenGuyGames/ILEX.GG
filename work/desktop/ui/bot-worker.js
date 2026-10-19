/* Dedicated local planner. No external services, accounts or network API. */
importScripts('rules-engine.js','rules-match.js','bot-ai.js','limitless-collection.js');
const cardMap=fetch('rules-card-map.json').then(r=>{if(!r.ok)throw Error('Offline card map unavailable');return r.json();}).then(map=>RulesMatch.withAliases(map,LimitlessCollection));
self.onmessage=async event=>{
 const {requestId,saved,player,custom}=event.data;
 try{const map=await cardMap,m=RulesMatch.restore(saved,map,saved.spec.custom||custom||[]),action=BotAI.choose(m,player,'realistic');self.postMessage({requestId,action,diagnostics:BotAI.strategy.diagnostics()});}
 catch(e){self.postMessage({requestId,error:e.message||String(e)});}
};
