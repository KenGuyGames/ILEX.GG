// Candidate EX printings. Never publish a card with an unknown printed clause.
const fs=require('fs'),path=require('path'),vm=require('vm');
const {compile,compilePower,compileTrainer}=require('./printed-effect-compiler.cjs');
const energyClauses=require('./ex-energy-clauses.json');
const correctText=require('./ex-text-corrections.cjs');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui'),src=path.join(root,'work/cube-source/src');
const codes=['RS','SS','DR','MA','HL','RG','TRR','DX','EM','UF','DS','LM','HP','CG','DF','PK'];
const sets=Object.fromEntries(codes.map((code,i)=>['ex'+(i+1),code]));
Object.assign(sets,{np:'NP',pop1:'POP1',pop2:'POP2',pop3:'POP3','tk-ex-latia':'TK1A','tk-ex-latio':'TK1B','tk-ex-p':'TK2A','tk-ex-m':'TK2B'});
const sourceSets={'tk-ex-latia':'tk1a','tk-ex-latio':'tk1b','tk-ex-p':'tk2a','tk-ex-m':'tk2b'};
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const canonical=Object.keys(sets).flatMap(id=>read(path.join(root,'work/card-sources/pokemon-tcg-data-master/cards/en',(sourceSets[id]||id)+'.json')).map(d=>({...correctText(d),id:id+'-'+d.number,set:{id}})));
const cards=read(path.join(ui,'cards.json')).flatMap(scan=>{
 const prefix=scan.id.slice(0,scan.id.lastIndexOf('-'));if(!sets[prefix]&&prefix!=='exu')return [];
 const id=prefix==='exu'?'ex10':prefix,number=decodeURIComponent(scan.id.slice(prefix.length+1));
 const d=canonical.find(d=>d.id===id+'-'+number);if(!d)throw Error('Missing canonical EX scan '+scan.id);
 return [{...d,id:scan.id,_sourceId:d.id,_sourceNumber:d.number,number,_scanSet:prefix}];
});
const context={console,setTimeout,clearTimeout};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(ui,'rules-engine.js'),'utf8'),context);
const engine=Object.values(context.TCGRules.sets).filter(Array.isArray).flat().filter(c=>!c.fullName.startsWith('ILEX '));
const unsafe=new Set(read(path.join(ui,'rules-coverage.json')).knownIncompleteTemplates);
const norm=s=>String(s||'').replace(/[★☆]/g,'Star').normalize('NFKD').replace(/[^a-z0-9]/gi,'').toLowerCase();
const names=d=>(d.attacks||[]).map(a=>norm(a.name)).join('|');
const printedIdentity=d=>JSON.stringify([norm(d.name),d.supertype,d.subtypes,d.hp,d.types,d.evolvesFrom,(d.attacks||[]).map(a=>[norm(a.name),a.cost,a.damage,norm(a.text)]),(d.abilities||[]).map(a=>[norm(a.name),a.type,norm(a.text)]),(d.rules||[]).map(norm)]);
const nativeSources=new Map();
for(const d of canonical){const native=engine.find(c=>c.set===sets[d.set.id]&&String(c.setNumber)===String(d.number)&&norm(c.name)===norm(d.name)&&names(c)===names(d)&&!unsafe.has(c.fullName));if(native)nativeSources.set(printedIdentity(d),native.fullName);}
const generated=[],pending=[];
for(const d of cards){
 const candidates=engine.filter(c=>c.set===sets[d.set.id]&&!unsafe.has(c.fullName)&&norm(c.name)===norm(d.name)&&names(c)===names(d)&&c.powers.map(p=>norm(p.name)).join('|')===(d.abilities||[]).map(p=>norm(p.name)).join('|'));
 const exact=candidates.find(c=>String(c.setNumber)===String(d._sourceNumber));
 const native=exact||(candidates.length===1?candidates[0]:null);
 // EX rules are attached below by the shared runtime, not inferred from rarity.
 const knownRules=(d.rules||[]).every(r=>r==='When Pokémon-ex has been Knocked Out, your opponent takes 2 Prize cards.'||r==="You can't have more than 1 Pokémon Star in your deck."||/^This Pokémon is both (Grass|Fire|Water|Lightning|Psychic|Fighting|Darkness|Metal)\s*(Grass|Fire|Water|Lightning|Psychic|Fighting|Darkness|Metal) type\.$/.test(r));
 const printedName=d.name.replace(/\s*δ\s*$/,'').replace(/[★☆]/g,'Star');
 const ops=(d.attacks||[]).map(a=>compile(a,printedName)),powers=(d.abilities||[]).map(a=>compilePower(a,printedName));
 let record;
 const energy=energyClauses.find(c=>c.name===d.name&&c.text===(d.rules||[]).join(' '));
 if(d.supertype==='Energy'&&energy)record={d,exEnergy:energy.kind,reason:'compiled-energy'};
 else if(d.supertype==='Pokémon'&&knownRules&&ops.every(x=>x!==null)&&powers.every(x=>x!==null))record={d,ops,powers,reason:'compiled-effects'};
 else if(d.supertype==='Trainer'&&compileTrainer(d)!==null)record={d,trainerOps:compileTrainer(d),reason:'compiled-trainer'};
 else if(native)record={d,reuse:native.fullName,reason:'existing-source'};
 else if(nativeSources.has(printedIdentity(d)))record={d,reuse:nativeSources.get(printedIdentity(d)),reason:'exact-printed-reprint'};
 else if(d.supertype==='Energy'&&d.subtypes.includes('Basic'))record={d,reason:'basic-energy',ops:[]};
 else if(d.name==='Root Fossil'&&d.supertype==='Trainer'&&d.hp==='40'&&(d.rules||[]).join(' ')==="Play Root Fossil as if it were a Basic Pokémon. While in play, Root Fossil counts as a Colorless Pokémon (as well as a Trainer card). Root Fossil has no attacks of its own, can't retreat, and can't be affected by any Special Conditions. If Root Fossil is Knocked Out, it doesn't count as a Knocked Out Pokémon. (Discard it anyway.) At any time during your turn before your attack, you may discard Root Fossil from play."&&(d.abilities||[]).length===1&&d.abilities[0].name==='Spongy Stone'&&/^At any times? between turns, remove 1 damage counter from Root Fossil\.$/.test(d.abilities[0].text))record={d,reuse:'Root Fossil SS',reason:'reviewed-fossil'};
 else if(d.supertype==='Trainer'){const trainerOps=compileTrainer(d);if(trainerOps!==null)record={d,trainerOps,reason:'compiled-trainer'};}
 else if(d.supertype==='Pokémon'&&knownRules&&ops.every(x=>x!==null)&&powers.every(x=>x!==null))record={d,ops,powers,reason:'compiled-effects'};
 if(record){record.copyOps=ops;generated.push(record);}
 else pending.push({id:d.id,name:d.name,supertype:d.supertype,attacks:(d.attacks||[]).filter((a,i)=>ops[i]===null),abilities:(d.abilities||[]).filter((a,i)=>powers[i]===null),rules:d.rules});
}
const scanSets=read(path.join(ui,'sets.json'));
const plan={status:'candidate-source',total:cards.length,available:generated.length,pending:pending.length,interactionScope:[...Object.keys(sets),'exu','ecard1','ecard2','ecard3'],methods:generated.reduce((a,c)=>(a[c.reason]=(a[c.reason]||0)+1,a),{}),bySet:[...Object.keys(sets),'exu'].map(id=>({id,name:scanSets.find(s=>s.id===id)?.name||id,total:cards.filter(c=>c._scanSet===id).length,available:generated.filter(c=>c.d._scanSet===id).length}))};
fs.writeFileSync(path.join(src,'tcg-lab-ex-data.ts'),'export const exData:any = '+JSON.stringify(generated)+';\n');
fs.writeFileSync(path.join(root,'work/rules-research/ex-automation-pending.json'),JSON.stringify(pending,null,2));
fs.writeFileSync(path.join(root,'work/rules-research/ex-library-plan.json'),JSON.stringify(plan,null,2));
fs.writeFileSync(path.join(ui,'ex-coverage.json'),JSON.stringify({...plan,unsupported:pending},null,2));
console.log(JSON.stringify({...plan,bySet:undefined,interactionScope:undefined}));
