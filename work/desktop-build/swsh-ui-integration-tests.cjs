const fs=require('fs'),path=require('path'),vm=require('vm');
const base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8'),prefix=base.slice(0,base.indexOf("test('Limitless import:"));
const sweep=fs.readFileSync(path.join(__dirname,'swsh-full-sweep.cjs'),'utf8'),start=sweep.indexOf('const script=String.raw`')+'const script=String.raw`'.length,helpers=sweep.slice(start,sweep.indexOf('const selected=',start));
const body=String.raw`
const checks=[];
for(const id of ['xy4-97','xy4-98'])for(const bench of [false,true]){try{
 const m=fixture('swsh5-85',7),[p,o]=m.store.state.players;p.hand.cards=[];const list=bench?o.bench[0]:o.active;list.cards=[];put(m,'xy1-97',list);const tool=put(m,id,p.hand),slot=bench?R.SlotType.BENCH:R.SlotType.ACTIVE;
 const side=tool.attachesToOpponentsPokemon?R.PlayerType.TOP_PLAYER:R.PlayerType.BOTTOM_PLAYER;const choices=B.candidates(m,p.id).filter(x=>x.action.type==='play');assert.ok(choices.length);assert.ok(choices.every(x=>x.action.target.player===side));
 const journal=m.journal.length;assert.throws(()=>M.apply(m,{type:'play',player:p.id,index:0,target:{player:side===R.PlayerType.TOP_PLAYER?R.PlayerType.BOTTOM_PLAYER:R.PlayerType.TOP_PLAYER,slot,index:0}}));assert.equal(m.journal.length,journal);
 M.apply(m,{type:'play',player:p.id,index:0,target:{player:side,slot,index:0}});settle(m,true);assert.ok(list.tools.includes(tool));assert.ok(!p.active.tools.includes(tool));checks.push({id,bench,passed:true});
}catch(e){failures.push({id,bench,error:e.message||String(e)});}}
const manager=R.CardManager.getInstance(),opponentTools=records.filter(r=>manager.getCardByName(map[r.d.id]).attachesToOpponentsPokemon).map(r=>r.d.id);assert.equal(opponentTools.length,0);
const sha=n=>require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ui,n))).digest('hex');
const report={passed:!failures.length,engineSha256:engineShaAtStart,ruleAdapterSha256:sha('rules-match.js'),botSha256:sha('bot-ai.js'),checks,failures,swshOpponentTools:opponentTools,scope:'Current bridge/bot opponent-Tool target integration; SWSH smoke/Trainer fixtures contain no affected opponent-attaching Tools; engine and prompt paths unchanged.'};fs.writeFileSync(path.join(root,'work/rules-research/swsh-ui-integration.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(failures.length)process.exitCode=1;
`;
vm.runInNewContext(prefix+helpers+body,{require,__dirname,console,setTimeout,clearTimeout,process});
