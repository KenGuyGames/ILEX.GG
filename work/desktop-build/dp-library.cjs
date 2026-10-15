// DP/Platinum candidates remain separate from the verified desktop release.
const fs=require('fs'),path=require('path'),vm=require('vm');
const compileTrainer=require('./dp-trainer-patterns.cjs');
const compilePower=require('./dp-power-patterns.cjs');
const compileRules=require('./dp-printed-rules.cjs');
const compile=require('./dp-attack-patterns.cjs');
const energyClauses=require('./dp-energy-clauses.json');
const applyErrata=require('./dp-errata.cjs');
const correctScans=require('./dp-scan-corrections.cjs');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui'),src=path.join(root,'work/rules-research/twinleafgg-main/ptcg-server/src');
const sets={dp1:'DP',dp2:'MT',dp3:'SW',dp4:'GE',dp5:'MD',dp6:'LA',dp7:'SF',pl1:'PL',pl2:'RR',pl3:'SV',pl4:'AR',dpp:'DPP',pop4:'P4',pop5:'P5',pop6:'P6',pop7:'P7',pop8:'P8',pop9:'P9',ru1:'RU','tk-dp-l':'TKDPL','tk-dp-m':'TKDPM'};
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),all=read(path.join(ui,'cards.json')),catalog=read(path.join(ui,'sets.json'));
let canonical=[];for(const id of Object.keys(sets)){const file=path.join(root,'work/card-sources/pokemon-tcg-data-master/cards/en',id+'.json');if(fs.existsSync(file))canonical.push(...read(file).map(d=>({...d,set:{id}})));}
const kitFile=path.join(root,'work/card-sources/dp-trainer-kits.json');if(fs.existsSync(kitFile))canonical.push(...read(kitFile));
canonical=canonical.map(correctScans).map(applyErrata);
const context={console,setTimeout,clearTimeout};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(ui,'rules-engine.js'),'utf8'),context);
const engine=Object.values(context.TCGRules.sets).filter(Array.isArray).flat().filter(c=>!c.fullName.startsWith('ILEX ')),unsafe=new Set(read(path.join(ui,'rules-coverage.json')).knownIncompleteTemplates);
const norm=s=>String(s||'').replace(/[★☆]/g,'Star').normalize('NFKD').replace(/[^a-z0-9]/gi,'').toLowerCase();
const numberKey=n=>String(n).replace(/^DP0*/, '').replace(/^0+(?=\d)/,'');
const attackNames=d=>(d.attacks||[]).map(a=>norm(a.name)).join('|');
const pokemonName=d=>d.subtypes?.includes('Level-Up')?d.evolvesFrom||d.name.replace(/\s+LV\.X$/i,''):d.name.replace(/\s*δ\s*$/,'');
const identity=d=>JSON.stringify([norm(d.name),d.supertype,d.subtypes,d.hp,d.types,d.evolvesFrom,(d.attacks||[]).map(a=>[norm(a.name),a.cost,a.damage,norm(a.text)]),(d.abilities||[]).map(a=>[norm(a.name),a.type,norm(a.text)]),(d.rules||[]).map(norm)]);
const natives=new Map();for(const d of canonical){const n=!d._dpErrataSource&&!d._dpTextCorrection&&engine.find(c=>c.set===sets[d.set.id]&&numberKey(c.setNumber)===numberKey(d.number)&&norm(c.name)===norm(pokemonName(d))&&attackNames(c)===attackNames(d)&&!unsafe.has(c.fullName));if(n)natives.set(identity(d),n.fullName);}
const generated=[],pending=[],pool=all.filter(c=>Object.keys(sets).some(id=>c.id.startsWith(id+'-')));
for(const scan of pool){
 const setId=Object.keys(sets).find(id=>scan.id.startsWith(id+'-')),number=decodeURIComponent(scan.id.slice(setId.length+1));
 const original=canonical.find(d=>d.set.id===setId&&String(d.number)===number);
 if(!original){pending.push({id:scan.id,name:scan.name,set:setId,reason:'missing-reviewed-printed-text'});continue;}
 const d={...original,id:scan.id,number},ops=(d.attacks||[]).map(a=>compile(a,pokemonName(d))),powers=(d.abilities||[]).map(a=>compilePower(a,pokemonName(d)));
 const native=!d._dpErrataSource&&!d._dpTextCorrection&&engine.find(c=>c.set===sets[setId]&&numberKey(c.setNumber)===numberKey(number)&&norm(c.name)===norm(pokemonName(d))&&attackNames(c)===attackNames(d)&&c.powers.map(p=>norm(p.name)).join('|')===(d.abilities||[]).map(p=>norm(p.name)).join('|')&&!unsafe.has(c.fullName));
 const heldRules=compileRules(d),special=heldRules===null,energyClause=energyClauses.find(clause=>clause.name===d.name&&clause.text===(d.rules||[]).join(' '));
 let record;
 if(d.subtypes?.includes('Supporter')&&compileTrainer(d)!==null)record={d,trainerOps:compileTrainer(d),reason:'compiled-trainer'};
 else if(native&&!['dp2-44','pop4-17','dp5-49','dp6-77','dp2-65'].includes(d.id))record={d,reuse:native.fullName,reason:'existing-source'};
 else if(!d._dpTextCorrection&&!['dp2-44','pop4-17','dp5-49','dp6-77','dp2-65'].includes(d.id)&&natives.has(identity(d)))record={d,reuse:natives.get(identity(d)),reason:'exact-printed-reprint'};
 else if(d.supertype==='Energy'&&d.subtypes.includes('Basic'))record={d,ops:[],reason:'basic-energy'};
 else if(d.supertype==='Energy'&&energyClause)record={d,[energyClause.kind.startsWith('dp')?'dpEnergy':'exEnergy']:energyClause.kind,reason:'compiled-special-energy'};
 else if(d.supertype==='Pokémon'&&!special&&ops.every(x=>x!==null)&&powers.every(x=>x!==null))record={d,ops,powers,reason:'compiled-effects'};
 else if(d.supertype==='Trainer'&&+d.hp>0&&!(d.attacks||[]).length&&powers.every(x=>x!==null)&&(d.rules||[]).join(' ')===`Play ${d.name} as if it were a Colorless Basic Pokémon. (${d.name} counts as a Trainer card as well, but if ${d.name} is Knocked Out, this counts as a Knocked Out Pokémon.) ${d.name} can't be affected by any Special Conditions and can't retreat. At any time during your turn before your attack, you may discard ${d.name} from play. (This doesn't count as a Knocked Out Pokémon.)`)record={d,powers,fossil:true,reason:'compiled-fossil'};
 else if(d.supertype==='Trainer'&&compileTrainer(d)!==null)record={d,trainerOps:compileTrainer(d),reason:'compiled-trainer'};
 if(record){record.heldRules=heldRules||[];record.copyOps=ops;generated.push(record);}else pending.push({id:d.id,name:d.name,set:setId,supertype:d.supertype,attacks:(d.attacks||[]).filter((a,i)=>ops[i]===null),abilities:(d.abilities||[]).filter((a,i)=>powers[i]===null),rules:d.rules,reason:d.subtypes?.includes('Level-Up')?'unresolved-level-up-effect':special?'special-rule-or-effect':'unknown-printed-effect'});
}
const plan={status:'candidate-source',total:pool.length,available:generated.length,pending:pending.length,interactionScope:['ex13','ex14','ex15','ex16',...Object.keys(sets)],methods:generated.reduce((a,c)=>(a[c.reason]=(a[c.reason]||0)+1,a),{}),bySet:Object.keys(sets).map(id=>({id,name:catalog.find(s=>s.id===id)?.name||id,total:pool.filter(c=>c.id.startsWith(id+'-')).length,available:generated.filter(c=>c.d.set.id===id).length}))};
fs.writeFileSync(path.join(src,'tcg-lab-dp-data.ts'),'export const dpData:any = '+JSON.stringify(generated)+';\n');
const copySupporters={};for(const d of [...canonical,...['ex13','ex14','ex15','ex16'].flatMap(id=>read(path.join(root,'work/card-sources/pokemon-tcg-data-master/cards/en',id+'.json')))])if(d.subtypes?.includes('Supporter')){const ops=compileTrainer(d);if(ops===null)throw Error('Uncompiled in-scope Supporter effect '+d.id);copySupporters[d.id]=ops;}
fs.writeFileSync(path.join(src,'tcg-lab-dp-supporter-copy-data.ts'),'export const dpSupporterCopyData:any = '+JSON.stringify(copySupporters)+';\n');
fs.writeFileSync(path.join(root,'work/rules-research/dp-automation-pending.json'),JSON.stringify(pending,null,2));
fs.writeFileSync(path.join(root,'work/rules-research/dp-library-plan.json'),JSON.stringify(plan,null,2));
fs.writeFileSync(path.join(ui,'dp-coverage.json'),JSON.stringify({...plan,unsupported:pending},null,2));
console.log(JSON.stringify({...plan,bySet:undefined,interactionScope:undefined}));
