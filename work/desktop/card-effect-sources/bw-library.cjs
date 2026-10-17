const fs=require('fs'),path=require('path'),vm=require('vm');
const correctText=d=>d;
const compile=require('./bw-attack-patterns.cjs'),power=require('./bw-power-patterns.cjs'),trainer=require('./bw-trainer-patterns.cjs'),printed=require('./dp-printed-rules.cjs');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui'),research=path.join(root,'work/rules-research'),src=path.join(research,'twinleafgg-main/ptcg-server/src'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sets={bw1:'BLW',bw2:'EPO',bw3:'NVI',bw4:'NXD',bw5:'DEX',bw6:'DRX',dv1:'DRV',bw7:'BCR',bw8:'PLS',bw9:'PLF',bw10:'PLB',bw11:'LTR','2011bw':'MCD11','2012bw':'MCD12',bwp:'BWP','tk-bw-e':'TKBWE','tk-bw-z':'TKBWZ'},catalog=read(path.join(ui,'sets.json')),cards=read(path.join(ui,'cards.json'));
let canonical=[];for(const id of Object.keys(sets)){const file=path.join(root,'work/card-sources/pokemon-tcg-data-master/cards/en',({'2011bw':'mcd11','2012bw':'mcd12'}[id]||id)+'.json');if(fs.existsSync(file))canonical.push(...read(file).map(d=>({...d,set:{id}})));}
const kits=path.join(root,'work/card-sources/bw-trainer-kits.json');if(fs.existsSync(kits))canonical.push(...read(kits));
canonical=canonical.map(d=>{if(d.set.id.startsWith('tk-bw-')&&d.supertype==='Pokémon'){const original=canonical.find(c=>['bw1','bw2'].includes(c.set.id)&&c.name===d.name&&c.hp===d.hp&&(c.attacks||[]).map(a=>a.name).join('|')===(d.attacks||[]).map(a=>a.name).join('|'));if(original)d={...d,attacks:original.attacks,abilities:original.abilities};}return correctText(d);});
const ctx={console,setTimeout,clearTimeout};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ui,'rules-engine.js'),'utf8'),ctx);const engine=Object.values(ctx.TCGRules.sets).filter(Array.isArray).flat().filter(c=>!c.fullName.startsWith('ILEX ')),unsafe=new Set(read(path.join(ui,'rules-coverage.json')).knownIncompleteTemplates);
const norm=s=>String(s||'').replace(/[★☆]/g,'Star').normalize('NFKD').replace(/[^a-z0-9]/gi,'').toLowerCase(),attackNames=d=>(d.attacks||[]).map(a=>norm(a.name)).join('|');
const data=[],pending=[],pool=cards.filter(c=>Object.keys(sets).some(id=>c.id.startsWith(id+'-'))&&( !c.id.startsWith('bwp-')||Number(c.id.replace(/\D/g,''))<=101));
for(const scan of pool){const set=Object.keys(sets).find(id=>scan.id.startsWith(id+'-')),number=decodeURIComponent(scan.id.slice(set.length+1));const raw=canonical.find(d=>d.set.id===set&&String(d.number).replace(/^BW0+/, 'BW')===number.replace(/^BW0+/, 'BW'));if(!raw){pending.push({id:scan.id,name:scan.name,set,reason:'missing-printed-text'});continue;}
 const d={...raw,id:scan.id},ops=(d.attacks||[]).map(a=>compile(a,d.name)),powers=(d.abilities||[]).map(a=>power(a,d.name)),legend=d.subtypes?.includes('LEGEND');
 const native=engine.find(c=>c.set===sets[set]&&String(c.setNumber).replace(/^BW0*/,'')===number.replace(/^BW0*/,'')&&norm(c.name)===norm(d.name)&&attackNames(c)===attackNames(d)&&c.powers.map(p=>norm(p.name)).join('|')===(d.abilities||[]).map(p=>norm(p.name)).join('|')&&!unsafe.has(c.fullName))||set.startsWith('tk-bw-')&&engine.find(c=>['BLW','EPO'].includes(c.set)&&norm(c.name)===norm(d.name)&&attackNames(c)===attackNames(d)&&String(c.hp||'')===String(d.hp||'')&&!unsafe.has(c.fullName));
 const equivalent=engine.find(c=>['BLW','EPO','NVI','NXD','DEX','DRX','DRV','BCR','PLS','PLF','PLB','LTR'].includes(c.set)&&norm(c.name)===norm(d.name)&&String(c.hp||'')===String(d.hp||'')&&attackNames(c)===attackNames(d)&&c.powers.map(p=>norm(p.name)).join('|')===(d.abilities||[]).map(p=>norm(p.name)).join('|')&&!unsafe.has(c.fullName));
 const held=printed(d),t=d.supertype==='Trainer'?trainer(d):null;let record;
 if(['Cedric Juniper','Caitlin','Iris','Ghetsis','Shadow Triad','Colress','Team Plasma Grunt','Hugh','Elesa','Skyla'].includes(d.name))record={d,trainerOps:t,reason:'compiled-trainer'};
 else if(['bw6-117','bw6-118','dv1-19'].includes(d.id))record={d,reuse:({'bw6-117':'Blend Energy GRPD DRX','bw6-118':'Blend Energy WLFM DRX','dv1-19':'First Ticket DRV'})[d.id],reason:'native-source'};
 else if(d.id==='bw5-47')record={d,ops,powers,reason:'compiled-effects'};
 else if(d.id==='bw5-97')record={d,reuse:'Old Amber Aerodactyl FCO',reason:'native-source'};
 else if(native||equivalent)record={d,reuse:(native||equivalent).fullName,reason:'native-source'};
 else if(t!==null)record={d,trainerOps:t,reason:'compiled-trainer'};
 else if(d.supertype==='Energy'&&d.subtypes?.includes('Basic'))record={d,ops:[],reason:'basic-energy'};
 

 else if(d.supertype==='Pokémon'&&(legend||held!==null)&&ops.every(o=>o!==null)&&powers.every(p=>p!==null))record={d,ops,powers,reason:legend?'compiled-legend':'compiled-effects'};
 else if(native||equivalent)record={d,reuse:(native||equivalent).fullName,reason:'native-source'};
 if(record){record.heldRules=held||[];record.copyOps=ops;data.push(record);}else pending.push({id:d.id,name:d.name,set,reason:held===null&&!legend?'printed-rule':'uncompiled-effect',supertype:d.supertype,rules:d.rules,attacks:(d.attacks||[]).filter((a,i)=>ops[i]===null),abilities:(d.abilities||[]).filter((a,i)=>powers[i]===null)});
}
const plan={status:'candidate-source',total:pool.length,available:data.length,pending:pending.length,methods:data.reduce((o,r)=>(o[r.reason]=(o[r.reason]||0)+1,o),{}),bySet:Object.keys(sets).map(id=>({id,name:catalog.find(s=>s.id===id)?.name||id,total:pool.filter(c=>c.id.startsWith(id+'-')).length,available:data.filter(r=>r.d.set.id===id).length})),interactionScope:['hgss1','hgss2','hgss3','hgss4','col1','hgssp','tk-hs-r','tk-hs-g',...Object.keys(sets)],promoCutoff:'BW01–BW101; complete BW promo series through December2013'};
fs.writeFileSync(path.join(src,'tcg-lab-bw-data.ts'),'export const bwData:any = '+JSON.stringify(data)+';\nexport const bwSupporterCopyData:any = '+JSON.stringify(Object.fromEntries(data.filter(r=>r.d.subtypes?.includes('Supporter')&&trainer(r.d)).map(r=>[r.d.id,trainer(r.d)])))+';\n');
fs.writeFileSync(path.join(research,'bw-library-plan.json'),JSON.stringify(plan,null,2));fs.writeFileSync(path.join(research,'bw-automation-pending.json'),JSON.stringify(pending,null,2));fs.writeFileSync(path.join(ui,'bw-coverage.json'),JSON.stringify({...plan,unsupported:pending},null,2));
console.log(JSON.stringify(plan));
