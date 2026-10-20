const fs=require('fs'),vm=require('vm'),path=require('path');
const base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8'),prefix=base.slice(0,base.indexOf("test('Limitless import:"));
const sweep=fs.readFileSync(path.join(__dirname,'xy-full-sweep.cjs'),'utf8'),start=sweep.indexOf('const script=String.raw`')+'const script=String.raw`'.length,helpers=sweep.slice(start,sweep.indexOf('const selected=',start));
const script=String.raw`
const resolved=[],unavailable=[];
for(const record of records.filter(r=>r.d.supertype==='Trainer'))for(const positive of [false,true]){
 const m=fixture('bw1-1',7),p=m.store.state.players[0];m.store.dpEffects=0;p.bench[4].cards=[];const card=put(m,record.d.id,p.hand);
 const playTarget=card.attachesToOpponentsPokemon&&card.trainerType===R.TrainerType.TOOL?{...target,player:R.PlayerType.TOP_PLAYER}:target;if(card.attachesToOpponentsPokemon)m.store.state.players.find(x=>x!==p).active.getPokemonCard().tags=[R.CardTag.POKEMON_EX];
 try{M.apply(m,{type:'play',player:p.id,index:p.hand.cards.indexOf(card),target:playTarget});settle(m,positive);assert.equal(M.pending(m).length,0);resolved.push({id:record.d.id,positive});}
 catch(error){const item={id:record.d.id,positive,error:error.message||String(error),stack:error.stack};if(/^(CANNOT_PLAY_THIS_CARD|CANNOT_PLAY_TRAINER|CANNOT_USE_POWER|BLOCKED_BY_EFFECT|SUPPORTER_ALREADY_PLAYED|NO_BENCH_SLOTS_AVAILABLE|TARGET_ALREADY_HAS_TOOL|CANNOT_PLAY_POKEMON_TO_BENCH|INVALID_TARGET)$/.test(item.error))unavailable.push(item);else{failures.push(item);console.log('FAIL '+JSON.stringify(item));}}
}
fs.writeFileSync(path.join(root,'work/rules-research/xy-full-trainer-audit.json'),JSON.stringify({candidate:true,passed:!failures.length,resolved,unavailable,failures,engineSha256:engineShaAtStart},null,2));console.log(JSON.stringify({resolved:resolved.length,unavailable:unavailable.length,failures:failures.length}));if(failures.length)process.exitCode=1;
`;
vm.runInNewContext(prefix+helpers+script,{require,__dirname,console,setTimeout,clearTimeout,process},{filename:'xy-trainer-audit.cjs'});
