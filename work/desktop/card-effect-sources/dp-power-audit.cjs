const fs=require('fs'),vm=require('vm'),path=require('path');
const base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8'),prefix=base.slice(0,base.indexOf("test('Limitless import:"));
const sweep=fs.readFileSync(path.join(__dirname,'dp-full-sweep.cjs'),'utf8'),start=sweep.indexOf('const script=String.raw`')+'const script=String.raw`'.length,helpers=sweep.slice(start,sweep.indexOf('const selected=',start));
const script=String.raw`
const resolved=[],unavailable=[];
for(const record of records.filter(r=>r.d.supertype==='Pokémon'&&(!process.env.ILEX_DP_POWER_IDS||process.env.ILEX_DP_POWER_IDS.split(',').includes(r.d.id))))for(const power of record.d.abilities||[]){if(power.type!=='Poké-Power'||/when you (?:put|play)|when you attach|whenever|After your opponent|would be Knocked Out|at the end/i.test(power.text))continue;
 for(const bench of [false,true]){
 const m=fixture(record.d.id,7),[p,o]=m.store.state.players;m.store.dpEffects=0;
 if(bench){const top=p.active.cards.filter(card=>card.superType===R.SuperType.POKEMON);p.active.cards=p.active.cards.filter(card=>!top.includes(card));p.bench[3].cards=top;p.bench[3].damage=20;put(m,'dp1-76',p.active);p.active.getPokemonCard().hp=5000;}
 p.bench[4].cards=[];o.bench[4].cards=[];const target=bench?{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.BENCH,index:3}:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0};
 try{M.apply(m,{type:'ability',player:p.id,name:(bench?p.bench[3]:p.active).getPokemonCard().powers.find(candidate=>candidate.name.toLowerCase()===power.name.toLowerCase())?.name||power.name,target});settle(m,true);assert.equal(M.pending(m).length,0);resolved.push({id:record.d.id,power:power.name,bench});}
 catch(error){const item={id:record.d.id,power:power.name,bench,error:error.message||String(error),stack:error.stack,pending:M.pending(m).map(q=>({type:q.type,options:q.options,playerType:q.playerType,slots:q.slots,message:q.message}))};if(/NO_BENCH_SLOTS_AVAILABLE|CANNOT_USE_POWER|CANNOT_PLAY_THIS_CARD|BLOCKED_BY_EFFECT|NOT_ENOUGH_ENERGY|Power .*not available|This power|not available|Cannot use|cannot use|No usable/i.test(item.error))unavailable.push(item);else{failures.push(item);console.log('FAIL '+JSON.stringify(item));}}
 }
}
fs.writeFileSync(path.join(root,'work/rules-research/dp-power-audit.json'),JSON.stringify({candidate:true,passed:!failures.length,resolved,unavailable,failures,engineSha256:require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ui,'rules-engine.js'))).digest('hex')},null,2));console.log(JSON.stringify({resolved:resolved.length,unavailable:unavailable.length,failures:failures.length}));if(failures.length)process.exitCode=1;
`;
vm.runInNewContext(prefix+helpers+script,{require,__dirname,console,setTimeout,clearTimeout,process},{filename:'dp-power-audit.cjs'});
