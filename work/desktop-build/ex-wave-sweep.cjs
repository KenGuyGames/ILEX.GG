const fs=require('fs'),vm=require('vm'),path=require('path');
const base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8'),prefix=base.slice(0,base.indexOf("test('Limitless import:"));
const ex=fs.readFileSync(path.join(__dirname,'ex-test-cases.js'),'utf8'),helpers=ex.slice(0,ex.indexOf("test('EX inventory"));
const bsf=fs.readFileSync(path.join(__dirname,'bsf-test-cases.js'),'utf8'),settleBase=bsf.slice(bsf.indexOf('function settle('),bsf.indexOf("test('Every Base"));
const settle=settleBase.replace("else if(q.type==='Order cards')",`else if(q.type==='Discard energy'){value=[];for(const from of M.targets(m,q).filter(x=>!q.options.blockedFrom.some(b=>JSON.stringify(b)===JSON.stringify(x.target)))){const blocked=q.options.blockedMap.find(b=>JSON.stringify(b.source)===JSON.stringify(from.target))?.blocked||[];for(const [index,card] of from.list.cards.entries())if(card.superType===R.SuperType.ENERGY&&!blocked.includes(index)&&R.matchesPromptFilter(card,q.filter))value.push({from:from.target,index});}value=value.slice(0,Math.max(q.options.min,Math.min(q.options.max??1,1)));}
 else if(q.type==='Put damage'){const ts=M.targets(m,q).filter(x=>!q.options.blocked.some(b=>JSON.stringify(b)===JSON.stringify(x.target)));value=ts.length?[{target:ts[0].target,damage:q.damage}]:[];}
 else if(q.type==='Move energy'){value=[];const options=M.targets(m,q);for(const from of options.filter(x=>!q.options.blockedFrom.some(b=>JSON.stringify(b)===JSON.stringify(x.target)))){const blocked=q.options.blockedMap.find(b=>JSON.stringify(b.source)===JSON.stringify(from.target))?.blocked||[];const to=options.find(x=>JSON.stringify(x.target)!==JSON.stringify(from.target)&&!q.options.blockedTo.some(b=>JSON.stringify(b)===JSON.stringify(x.target)));if(!to)continue;for(const [index,card] of from.list.cards.entries())if(card.superType===R.SuperType.ENERGY&&!blocked.includes(index)&&R.matchesPromptFilter(card,q.filter))value.push({from:from.target,to:to.target,index});}value=value.slice(0,Math.max(q.options.min,Math.min(q.options.max??1,1)));}
 else if(q.type==='Attach energy'){const to=M.targets(m,q).find(x=>!q.options.blockedTo.some(b=>JSON.stringify(b)===JSON.stringify(x.target)));value=q.cardList.cards.map((card,index)=>({card,index})).filter(x=>!q.options.blocked.includes(x.index)&&R.matchesPromptFilter(x.card,q.filter)).slice(0,Math.max(q.options.min,Math.min(q.options.max,1))).map(x=>({to:to.target,index:x.index}));}
 else if(q.type==='Order cards')`);
const script=`
const records=JSON.parse(fs.readFileSync(path.join(root,'work/rules-research/twinleafgg-main/ptcg-server/src/tcg-lab-ex-data.ts'),'utf8').replace(/^export const exData:any = /,'').replace(/;\\s*$/,''));
const engineSha256=require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ui,'rules-engine.js'))).digest('hex');
const failures=[];let scenarios=0;const scope=['ex10','ex11','ex12','ex13','pop2','pop3'];
for(const record of records.filter(r=>scope.includes(r.d.set.id)&&r.d.supertype==='Pokémon'))for(const printed of record.d.attacks||[])for(const seed of [1,7]){
 const m=exCombat(record.d.id),[p,o]=m.store.state.players;m.randomState=seed;
 for(const owner of [p,o])for(const list of [owner.active,...owner.bench])if(list.getPokemonCard()){list.getPokemonCard().hp=4000;list.getPokemonCard().weakness=[];list.getPokemonCard().resistance=[];}
 p.active.damage=20;o.active.damage=10;
 for(const id of ['ex1-104','ex1-105','ex1-106','ex1-107','ex1-108','ex1-109','ex11-103','ex11-107'])for(let n=0;n<5;n++)exPut(m,id,p.active);
 for(let n=0;n<3;n++)exPut(m,'ex1-106',o.active);
 p.bench[0].moveTo(p.discard);exPut(m,'ex7-34',p.bench[0]);p.bench[0].getPokemonCard().hp=4000;exPut(m,'ex7-34',o.bench[0]);o.bench[0].getPokemonCard().hp=4000;exPut(m,'ex12-11',p.deck);
 exPut(m,'ex1-75',p.hand);exPut(m,'ex3-88',p.supporter);exPut(m,'ex3-88',o.hand);exPut(m,'ex3-88',o.discard);
 try {M.apply(m,{type:'attack',player:p.id,name:printed.name});settle(m);assert.equal(M.pending(m).length,0);assert.equal(m.store.state.turn,2);scenarios++;}
 catch(error){const failure={id:record.d.id,attack:printed.name,seed,error:error.message||String(error)};failures.push(failure);console.log('FAIL '+JSON.stringify(failure));}
}
fs.writeFileSync(path.join(root,'work/rules-research/ex-wave-sweep-report.json'),JSON.stringify({candidate:true,passed:!failures.length,engineSha256,scope,scenarios,failures},null,2));
console.log(JSON.stringify({scenarios,failures:failures.length}));if(failures.length)process.exitCode=1;
`;
vm.runInNewContext(prefix+helpers+settle+script,{require,__dirname,console,setTimeout,clearTimeout,process},{filename:'ex-wave-sweep.cjs'});
