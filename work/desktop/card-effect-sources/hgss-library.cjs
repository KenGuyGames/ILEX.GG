const fs=require('fs'),path=require('path'),vm=require('vm');
const correctText=require('./hgss-text-corrections.cjs');
const compile=require('./hgss-attack-patterns.cjs'),power=require('./hgss-power-patterns.cjs'),trainer=require('./hgss-trainer-patterns.cjs'),printed=require('./dp-printed-rules.cjs');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui'),research=path.join(root,'work/rules-research'),src=path.join(research,'twinleafgg-main/ptcg-server/src'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sets={hgss1:'HS',hgss2:'UL',hgss3:'UD',hgss4:'TM',col1:'CL',hgssp:'HSP','tk-hs-r':'TKHSR','tk-hs-g':'TKHSG'},catalog=read(path.join(ui,'sets.json')),cards=read(path.join(ui,'cards.json'));
let canonical=[];for(const id of Object.keys(sets)){const file=path.join(root,'work/card-sources/pokemon-tcg-data-master/cards/en',(id==='hgssp'?'hsp':id)+'.json');if(fs.existsSync(file))canonical.push(...read(file).map(d=>({...d,set:{id}})));}
const kits=path.join(root,'work/card-sources/hgss-trainer-kits.json');if(fs.existsSync(kits))canonical.push(...read(kits));
canonical=canonical.map(d=>{if(d.set.id.startsWith('tk-hs-')&&d.supertype==='Trainer'){const original=canonical.find(c=>c.set.id==='hgss1'&&c.name===d.name&&c.rules?.length);if(!original)throw Error('Missing kit Trainer text '+d.id);d={...d,rules:original.rules};}return correctText(d);});
const ctx={console,setTimeout,clearTimeout};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ui,'rules-engine.js'),'utf8'),ctx);const engine=Object.values(ctx.TCGRules.sets).filter(Array.isArray).flat().filter(c=>!c.fullName.startsWith('ILEX ')),unsafe=new Set(read(path.join(ui,'rules-coverage.json')).knownIncompleteTemplates);
const norm=s=>String(s||'').replace(/[★☆]/g,'Star').normalize('NFKD').replace(/[^a-z0-9]/gi,'').toLowerCase(),attackNames=d=>(d.attacks||[]).map(a=>norm(a.name)).join('|');
const data=[],pending=[],pool=cards.filter(c=>Object.keys(sets).some(id=>c.id.startsWith(id+'-')));
for(const scan of pool){const set=Object.keys(sets).find(id=>scan.id.startsWith(id+'-')),number=decodeURIComponent(scan.id.slice(set.length+1));const raw=canonical.find(d=>d.set.id===set&&String(d.number)===number);if(!raw){pending.push({id:scan.id,name:scan.name,set,reason:'missing-printed-text'});continue;}
 const d={...raw,id:scan.id},ops=(d.attacks||[]).map(a=>compile(a,d.name)),powers=(d.abilities||[]).map(a=>power(a,d.name)),legend=d.subtypes?.includes('LEGEND');
 const nativeNumber=set.startsWith('tk-hs-')&&d.supertype==='Trainer'?canonical.find(c=>c.set.id==='hgss1'&&c.name===d.name)?.number:number,nativeSet=set.startsWith('tk-hs-')&&d.supertype==='Trainer'?'HS':sets[set];
 const native=!legend&&engine.find(c=>c.set===nativeSet&&String(c.setNumber)===String(nativeNumber)&&norm(c.name)===norm(d.name)&&attackNames(c)===attackNames(d)&&c.powers.map(p=>norm(p.name)).join('|')===(d.abilities||[]).map(p=>norm(p.name)).join('|')&&!unsafe.has(c.fullName));
 const held=printed(d),t=d.supertype==='Trainer'?trainer(d):null;let record;
 if(t!==null)record={d,trainerOps:t,reason:'compiled-trainer'};
 else if(d.supertype==='Energy'&&d.subtypes?.includes('Basic'))record={d,ops:[],reason:'basic-energy'};
 else if(d.supertype==='Energy'&&set==='col1'&&['86','87'].includes(number))record={d,hgssEnergy:number==='86'?'dark':'metal',reason:'special-energy'};

 else if(d.supertype==='Pokémon'&&(legend||held!==null)&&ops.every(o=>o!==null)&&powers.every(p=>p!==null))record={d,ops,powers,reason:legend?'compiled-legend':'compiled-effects'};
 else if(native)record={d,reuse:native.fullName,reason:'native-source'};
 if(record){record.heldRules=held||[];record.copyOps=ops;data.push(record);}else pending.push({id:d.id,name:d.name,set,reason:held===null&&!legend?'printed-rule':'uncompiled-effect',supertype:d.supertype,rules:d.rules,attacks:(d.attacks||[]).filter((a,i)=>ops[i]===null),abilities:(d.abilities||[]).filter((a,i)=>powers[i]===null)});
}
const plan={status:'candidate-source',total:pool.length,available:data.length,pending:pending.length,methods:data.reduce((o,r)=>(o[r.reason]=(o[r.reason]||0)+1,o),{}),bySet:Object.keys(sets).map(id=>({id,name:catalog.find(s=>s.id===id)?.name||id,total:pool.filter(c=>c.id.startsWith(id+'-')).length,available:data.filter(r=>r.d.set.id===id).length})),interactionScope:['ex13','ex14','ex15','ex16','dp1–7','pl1–4','DP promos/POP/kits/Rumble',...Object.keys(sets)]};
fs.writeFileSync(path.join(src,'tcg-lab-hgss-data.ts'),'export const hgssData:any = '+JSON.stringify(data)+';\nexport const hgssSupporterCopyData:any = '+JSON.stringify(Object.fromEntries(data.filter(r=>r.d.subtypes?.includes('Supporter')&&r.trainerOps).map(r=>[r.d.id,r.trainerOps])))+';\n');
fs.writeFileSync(path.join(research,'hgss-library-plan.json'),JSON.stringify(plan,null,2));fs.writeFileSync(path.join(research,'hgss-automation-pending.json'),JSON.stringify(pending,null,2));fs.writeFileSync(path.join(ui,'hgss-coverage.json'),JSON.stringify({...plan,unsupported:pending},null,2));
console.log(JSON.stringify(plan));
