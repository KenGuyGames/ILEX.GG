const fs=require('fs'),vm=require('vm'),path=require('path');
let base=fs.readFileSync(path.join(__dirname,'unlimited-base-tests.cjs'),'utf8');base=base.replace("fs.readFileSync(path.join(ui,file),'utf8')","fs.readFileSync(file==='rules-engine.js'?path.join(root,'work/unlimited-candidate/ui/rules-engine.js'):path.join(ui,file),'utf8')");const prefix=base.slice(0,base.indexOf("test('Limitless import:"));
const sweep=fs.readFileSync(path.join(__dirname,'unlimited-attack-sweep.cjs'),'utf8'),start=sweep.indexOf('const script=String.raw`')+'const script=String.raw`'.length,helpers=sweep.slice(start,sweep.indexOf('const selected=',start));
const script=String.raw`
const resolved=[],unavailable=[];
for(const record of records.filter(r=>r.d.supertype==='Trainer'&&(!process.env.ILEX_UNLIMITED_TRAINERS||process.env.ILEX_UNLIMITED_TRAINERS.split(',').includes(r.d.id))).filter((r,i,a)=>a.findIndex(x=>M.resolveCardName(map[x.d.id],'unlimited')===M.resolveCardName(map[r.d.id],'unlimited'))===i))for(const positive of [false,true]){
 const m=fixture('bw1-1',7),p=m.store.state.players[0];m.store.dpEffects=0;p.bench[4].cards=[];const card=put(m,record.d.id,p.hand),foreign=card.attachesToOpponentsPokemon; if(foreign){const o=m.store.state.players[1];o.active.cards=[];put(m,'xy1-1',o.active);}
 try{M.apply(m,{type:'play',player:p.id,index:p.hand.cards.indexOf(card),target:foreign?{player:R.PlayerType.TOP_PLAYER,slot:R.SlotType.ACTIVE,index:0}:target});settle(m,positive);assert.equal(M.pending(m).length,0);resolved.push({id:record.d.id,positive});}
 catch(error){const item={id:record.d.id,positive,error:error.message||String(error),stack:error.stack};if(/^(CANNOT_PLAY_THIS_CARD|CANNOT_PLAY_TRAINER|CANNOT_USE_POWER|BLOCKED_BY_EFFECT|SUPPORTER_ALREADY_PLAYED|NO_BENCH_SLOTS_AVAILABLE|TARGET_ALREADY_HAS_TOOL|CANNOT_PLAY_POKEMON_TO_BENCH|INVALID_TARGET)$/.test(item.error))unavailable.push(item);else{failures.push(item);console.log('FAIL '+JSON.stringify(item));}}
}
fs.writeFileSync(path.join(root,'work/rules-research/'+(process.env.ILEX_UNLIMITED_TRAINERS?'unlimited-foreign-tool-audit':'unlimited-full-trainer-audit')+'.json'),JSON.stringify({candidate:true,passed:!failures.length,resolved,unavailable,failures,engineSha256:engineShaAtStart},null,2));console.log(JSON.stringify({resolved:resolved.length,unavailable:unavailable.length,failures:failures.length}));if(failures.length)process.exitCode=1;
`;
vm.runInNewContext(prefix+helpers+script,{require,__dirname,console,setTimeout,clearTimeout,process},{filename:'xy-trainer-audit.cjs'});
