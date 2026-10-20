const fs=require('fs'),path=require('path'),vm=require('vm');
let base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8');base=base.replace("fs.readFileSync(path.join(ui,file),'utf8')","fs.readFileSync(file==='rules-engine.js'?path.join(root,'work/sv-candidate/rules-engine.js'):path.join(ui,file),'utf8')");const prefix=base.slice(0,base.indexOf("test('Limitless import:"));
const sweep=fs.readFileSync(path.join(__dirname,'sv-era-sweep.cjs'),'utf8'),start=sweep.indexOf('const script=String.raw`')+'const script=String.raw`'.length,helpers=sweep.slice(start,sweep.indexOf('const selected=',start));
const body=String.raw`
const tools=[];
for(const {d}of records.filter(r=>r.d.supertype==='Trainer'&&r.d.attacks?.length)){try{
 const m=fixture('bw1-1',7),s=m.store.state,[p,o]=s.players;p.active.tools=[];const tool=put(m,d.id,p.hand);p.hand.cards=p.hand.cards.filter(c=>c!==tool);p.active.tools=[tool];
 for(let i=0;i<3;i++)put(m,'bw1-3',p.deck);for(const l of [p.active,...p.bench])l.damage=40;
 if(d.name==='Technical Machine: Crisis Punch')for(const prize of o.prizes.slice(1))prize.cards=[];
 if(d.name==='Technical Machine: Devolution'){o.active.cards=o.active.cards.filter(c=>c.superType!==R.SuperType.POKEMON);put(m,'bw1-1',o.active);put(m,'bw1-3',o.active);o.active.getPokemonCard().hp=5000;}
 assert.ok(M.attacks(m,p).some(a=>a.name===d.attacks[0].name));M.apply(m,{type:'attack',player:p.id,name:d.attacks[0].name});settle(m,true);assert.equal(M.pending(m).length,0);assert.ok(p.discard.cards.includes(tool),'Temporary TM expires from its Tool zone');
 const blocked=fixture('bw1-1',7),[bp]=blocked.store.state.players,bt=put(blocked,d.id,bp.hand);bp.hand.cards=bp.hand.cards.filter(c=>c!==bt);bp.active.tools=[bt];put(blocked,'sm6-111',bp.stadium);if(d.name==='Technical Machine: Crisis Punch')for(const prize of blocked.store.state.players[1].prizes.slice(1))prize.cards=[];
 let rejected=false;try{M.apply(blocked,{type:'attack',player:bp.id,name:d.attacks[0].name});settle(blocked,true);}catch(e){rejected=true;}assert.ok(rejected,'Lysandre Labs suppresses the Tool attack');tools.push({id:d.id,attack:d.attacks[0].name,resolved:true,suppression:true,expired:true});console.log('PASS '+d.id+' '+d.attacks[0].name);
}catch(e){failures.push({id:d.id,error:e.message||String(e),stack:e.stack});console.log('FAIL '+d.id+' '+e.message);}}
fs.writeFileSync(path.join(root,'work/rules-research/sv-tool-attacks.json'),JSON.stringify({candidate:true,passed:!failures.length,tools,failures,engineSha256:engineShaAtStart},null,2));if(failures.length)process.exitCode=1;
`;
vm.runInNewContext(prefix+helpers+body,{require,__dirname,console,setTimeout,clearTimeout,process},{filename:__filename});
