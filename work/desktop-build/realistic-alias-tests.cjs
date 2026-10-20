const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui');
function context(){const c={console,setTimeout,clearTimeout};vm.createContext(c);return c;}
const main=context();
for(const f of ['rules-engine.js','rules-match.js','bot-ai.js','limitless-collection.js'])vm.runInContext(fs.readFileSync(path.join(ui,f),'utf8'),main);
const raw=JSON.parse(fs.readFileSync(path.join(ui,'rules-card-map.json'))),collection=vm.runInContext('LimitlessCollection',main),M=main.RulesMatch,map=M.withAliases(raw,collection);
const worker=context();let reply;
worker.self={postMessage:r=>{reply=r;}};
worker.fetch=async()=>({ok:true,json:async()=>raw});
worker.importScripts=(...files)=>{for(const f of files)vm.runInContext(fs.readFileSync(path.join(ui,f),'utf8'),worker);};
vm.runInContext(fs.readFileSync(path.join(ui,'bot-worker.js'),'utf8'),worker);
(async()=>{
 const checks=[];
 for(const energy of ['limitlessSUM-R','limitlessTEU-R','limitlessSSH-R']){
  assert(!raw[energy]);assert(map[energy]);
  const deck={name:'Imported Fire Energy',cards:{'base1-46':4,[energy]:56}},m=M.create({profile:'xy',seed:37,decks:[deck,deck]},map);
  for(let i=0;i<180&&M.pending(m).length;i++){const q=M.pending(m)[0];M.apply(m,main.BotAI.choose(m,q.playerId,'normal'));}
  const player=m.store.state.players[m.store.state.activePlayer].id,saved={spec:m.spec,journal:m.journal.slice()},before=JSON.stringify(saved),expected=main.BotAI.choose(m,player,'realistic');
  reply=null;await worker.self.onmessage({data:{requestId:checks.length+1,saved:JSON.parse(before),player}});
  assert(reply&&!reply.error,JSON.stringify(reply));assert.equal(JSON.stringify(reply.action),JSON.stringify(expected));assert.equal(JSON.stringify(saved),before);
  M.apply(m,reply.action);assert.equal(JSON.stringify(M.restore({spec:m.spec,journal:m.journal},map).journal),JSON.stringify(m.journal));checks.push(energy+' restored, planned, applied and replayed');
 }
 const expanded=vm.runInContext('cardMap',worker);const workerMap=await expanded;
 for(const id of Object.keys(collection.ruleAliases))assert.equal(workerMap[id],map[id],'Alias parity '+id);
 checks.push(Object.keys(collection.ruleAliases).length+' imported aliases match the UI map');
 const bad={name:'Unsupported',cards:{'base1-46':4,'missing-card-fixture':56}};
 await worker.self.onmessage({data:{requestId:99,saved:{spec:{profile:'xy',seed:1,decks:[bad,bad]},journal:[]},player:1}});
 assert.match(reply.error,/No automated card implementation: missing-card-fixture/);checks.push('Unsupported cards still reject');
 console.log(JSON.stringify({passed:true,checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
