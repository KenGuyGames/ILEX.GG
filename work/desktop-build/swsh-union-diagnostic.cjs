const fs=require('fs'),vm=require('vm'),path=require('path'),base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8'),prefix=base.slice(0,base.indexOf("test('Limitless import:")),sweep=fs.readFileSync(path.join(__dirname,'swsh-full-sweep.cjs'),'utf8'),start=sweep.indexOf('const script=String.raw`')+'const script=String.raw`'.length,helpers=sweep.slice(start,sweep.indexOf('const selected=',start));
const script=String.raw`
for(const first of [139,155,159,163,215,287]){
 const m=fixture('bw1-1',7),p=m.store.state.players[0];p.bench[0].cards=[];p.discard.cards=[];
 const pieces=Array.from({length:4},(_,i)=>put(m,'swshp-SWSH'+(first+i),p.discard)),c=pieces[0],actions=M.zoneAbilities(m,p,R.SlotType.DISCARD,0);
 console.log(JSON.stringify({first,powers:c.powers,actions}));
 try{M.apply(m,actions[0]);settle(m,true);console.log('assembled '+p.bench[0].cards.length);}catch(e){console.log('ERROR '+e.message+' '+e.stack);}
}
`;
vm.runInNewContext(prefix+helpers+script,{require,__dirname,console,setTimeout,clearTimeout,process});
