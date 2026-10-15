const fs=require('fs'),path=require('path'),vm=require('vm');
const base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8');
const prefix=base.slice(0,base.indexOf("test('Limitless import:"));
const ex=fs.readFileSync(path.join(__dirname,'ex-test-cases.js'),'utf8');
const helpers=ex.slice(0,ex.indexOf("test('EX inventory"));
const script=String.raw`
vm.runInContext(fs.readFileSync(path.join(ui,'bot-ai.js'),'utf8'),ctx);const B=ctx.BotAI;
const records=JSON.parse(fs.readFileSync(path.join(root,'work/rules-research/twinleafgg-main/ptcg-server/src/tcg-lab-ex-data.ts'),'utf8').replace(/^export const exData:any = /,'').replace(/;\s*$/,''));
const ecardText=fs.readFileSync(path.join(root,'work/rules-research/twinleafgg-main/ptcg-server/src/tcg-lab-wotc-data.ts'),'utf8');records.push(...JSON.parse(ecardText.slice(ecardText.indexOf('['),ecardText.lastIndexOf(']')+1)).filter(r=>['ecard1','ecard2','ecard3'].includes(r.d.set.id)));
const failures=[],rejected=[],resolved=[];
const reduce=R.Store.prototype.reduceEffect;
R.Store.prototype.reduceEffect=function(state,effect){this.auditEffects=(this.auditEffects||0)+1;if(this.auditEffects>6000)throw Error('Interaction effect budget exceeded');return reduce.call(this,state,effect);};
function settleAudit(m,level){for(let n=0;n<150;n++){const q=M.pending(m)[0];if(!q)return;const a=B.prompt(m,q,level);if(!a)throw Error('Unresolved '+q.type+' '+q.message);M.apply(m,a);}throw Error('Interaction prompt budget exceeded');}
for(const record of records.filter(r=>r.d.supertype==='Pokémon'&&(!process.env.ILEX_AUDIT_IDS||process.env.ILEX_AUDIT_IDS.split(',').includes(r.d.id))))for(const power of record.d.abilities||[]){
 if(power.type!=='Poké-Power')continue;
 for(const level of ['easy','hard'])for(const mode of ['full-unmatched','open-matched']){
 const m=exCombat(record.d.id),[p,o]=m.store.state.players;const c=p.active.getPokemonCard();m.store.auditEffects=0;
 c.hp=1000;p.active.damage=30;o.active.damage=20;
 for(const owner of [p,o]){owner.hand.cards=[];owner.deck.cards=[];owner.discard.cards=[];for(const list of owner.bench)list.cards=[];
  for(const id of ['ex5-44','ex11-66','ex11-42','ex1-75','ex1-77','ex13-11','ex13-12','ex12-25','ex12-20','ex3-88','ex1-104','ex1-105','ex1-106','ex1-107','ex1-108','ex1-109']){exPut(m,id,owner.deck);exPut(m,id,owner.hand);exPut(m,id,owner.discard);}
  for(const [i,id] of ['ex1-75','ex11-11','ex13-11','ex13-12','ex12-25'].entries()){exPut(m,id,owner.bench[i]);owner.bench[i].damage=20;owner.bench[i].getPokemonCard().hp=1000;}
  for(const list of [owner.active,...owner.bench])for(const id of ['ex1-104','ex1-105','ex1-106','ex1-107','ex1-108','ex1-109'])exPut(m,id,list);
 }
 // Evolved abilities need an evolved stack; retain the target as its top card.
 if(mode==='open-matched'){p.bench[4].cards=[];o.bench[4].cards=[];exPut(m,record.d.id,p.deck);}
 if(c.stage!==R.Stage.BASIC){exPut(m,'ex1-75',p.active);p.active.cards.splice(p.active.cards.indexOf(c),1);p.active.cards.push(c);}
 try{M.apply(m,{type:'ability',player:p.id,name:power.name,target});settleAudit(m,level);assert.equal(M.pending(m).length,0);resolved.push({id:record.d.id,power:power.name,level,mode});}
 catch(e){const reason=e.message||String(e),entry={id:record.d.id,power:power.name,level,mode,reason};if(/^(CANNOT_USE_POWER|POWER_ALREADY_USED|BLOCKED_BY_EFFECT|ABILITY_BLOCKED|INVALID_TARGET|CANNOT_USE_POKEPOWER|NOT_ENOUGH_ENERGY|NO_CARDS_IN_DECK|NO_BENCH_SLOTS_AVAILABLE)$/.test(reason))rejected.push(entry);else{failures.push(entry);console.log('FAIL '+JSON.stringify(entry));}}
 }
}
function inventory(m){const all=[];for(const p of m.store.state.players){for(const zone of [p.deck,p.hand,p.discard,p.lostzone,p.stadium,p.supporter,...p.prizes])all.push(...zone.cards);for(const list of [p.active,...p.bench])all.push(...list.cards,...list.tools.filter(c=>!list.cards.includes(c)),...list.energies.cards.filter(c=>!list.cards.includes(c)));}return all;}
for(const record of records.filter(r=>r.d.supertype==='Trainer'&&(!process.env.ILEX_AUDIT_IDS||process.env.ILEX_AUDIT_IDS.split(',').includes(r.d.id))))for(const environment of ['none','ex15-74','ex14-75','ecard2-139']){
 const m=exCombat('ex11-11','ex12-20'),[p,o]=m.store.state.players;m.store.auditEffects=0;exPut(m,'ex11-66',p.active);const top=p.active.cards.shift();p.active.cards.push(top);p.active.damage=30;
 for(const owner of [p,o]){owner.hand.cards=[];owner.deck.cards=[];owner.discard.cards=[];for(const b of owner.bench)b.cards=[];
  for(const id of ['ex5-44','ex11-66','ex11-42','ex1-75','ex1-77','ex13-11','ex13-12','ex3-88','ex1-104','ex1-105','ex1-106','ex1-107','ex1-108','ex1-109'])for(const zone of [owner.deck,owner.hand,owner.discard])exPut(m,id,zone);
  for(const [i,id] of ['ex1-75','ex11-11','ex13-11','ex13-12'].entries())exPut(m,id,owner.bench[i]);
  for(const list of [owner.active,...owner.bench])if(list.getPokemonCard())for(const id of ['ex1-104','ex1-106','ex1-107'])exPut(m,id,list);
 }
 if(environment!=='none')exPut(m,environment,o.stadium);const trainer=exPut(m,record.d.id,p.hand),before=inventory(m);
 try{M.apply(m,{type:'play',player:p.id,index:p.hand.cards.indexOf(trainer),target});settleAudit(m,'normal');const after=inventory(m);assert.equal(after.length,before.length,'Card count changed');assert.equal(new Set(after).size,after.length,'Duplicate card object');assert.ok(before.every(c=>after.includes(c)),'Original card disappeared');resolved.push({id:record.d.id,trainer:record.d.name,environment});}
 catch(e){const reason=e.message||String(e),entry={id:record.d.id,trainer:record.d.name,environment,reason};if(/^[A-Z_]+$/.test(reason)&&!['INVALID_GAME_STATE','INVALID_PROMPT_RESULT'].includes(reason))rejected.push(entry);else{failures.push(entry);console.log('FAIL '+JSON.stringify(entry));}}
}
const report={engineSha256:require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ui,'rules-engine.js'))).digest('hex'),scope:'EX + Expedition/Aquapolis/Skyridge; synthetic mixed fields',resolved,rejected,failures,passed:!failures.length};
fs.writeFileSync(path.join(root,'work/rules-research/ex-interaction-audit.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({resolved:resolved.length,preconditionRejected:rejected.length,failures:failures.length}));
`;
vm.runInNewContext(prefix+helpers+script,{require,__dirname,console,setTimeout,clearTimeout,process},{filename:'ex-interaction-audit.cjs'});
