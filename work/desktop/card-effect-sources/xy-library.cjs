/* Inventory and exact native reuse for the first XY wave. Coverage is never
   inferred from a name-only match or from the existence of a card scan. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui'),research=path.join(root,'work/rules-research');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),cards=read(path.join(ui,'cards.json')),sets=read(path.join(ui,'sets.json')),map=read(path.join(ui,'rules-card-map.json'));
const ctx={console,setTimeout,clearTimeout};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ui,'rules-engine.js'),'utf8'),ctx);
const native=Object.values(ctx.TCGRules.sets).filter(Array.isArray).flat(),unsafe=new Set(read(path.join(ui,'rules-coverage.json')).knownIncompleteTemplates);
const first=['xy0','xy1'],codes={xy0:'KSS',xy1:'XY'},data=[],pending=[];
const norm=s=>String(s||'').normalize('NFKD').replace(/[^a-z0-9]/gi,'').toLowerCase();
const compiled=[],compile=require('./xy-attack-patterns.cjs');
const xyRaw=read(path.join(root,'work/card-sources/pokemon-tcg-data-master/cards/en/xy1.json'));
const starterTrainers={'Crushing Hammer':'Crushing Hammer EPO','Poké Ball':'Poké Ball BLW','Pokémon Catcher':'Pokemon Catcher EPO',Potion:'Potion BLW',Switch:'Switch BLW',Tierno:'Tierno BKP'};
for(const id of first){const raw=read(path.join(root,'work/card-sources/pokemon-tcg-data-master/cards/en',id+'.json'));for(const scan of cards.filter(c=>c.id.startsWith(id+'-'))){const d=raw.find(d=>d.number===scan.id.slice(id.length+1));let c=native.find(c=>c.fullName===map[scan.id]);
 if(id==='xy0'&&d){
  const record={d:{...d,id:scan.id,set:{id}},heldRules:[],copyOps:(d.attacks||[]).map(a=>compile(a,d.name))};
  if(d.supertype==='Pokémon'&&record.copyOps.every(o=>o!==null)){record.ops=record.copyOps;record.powers=[];record.reason='compiled-effects';compiled.push(record);data.push({...record,method:record.reason,status:'candidate-needs-validation'});continue;}
  if(d.supertype==='Trainer'){c=native.find(c=>c.fullName===starterTrainers[d.name]);if(c&&!unsafe.has(c.fullName)){record.reuse=c.fullName;record.reason='native-source';compiled.push(record);data.push({...record,method:record.reason,status:'candidate-needs-validation'});continue;}}
 }
 let reason='';if(!d)reason='missing printed text';else if(!c||unsafe.has(c.fullName))reason='missing complete native handler';else if(norm(c.name)!==norm(d.name)||(d.attacks||[]).map(a=>norm(a.name)).join('|')!==c.attacks?.map(a=>norm(a.name)).join('|')&&d.supertype==='Pokémon')reason='printed/native identity mismatch';
 if(reason)pending.push({id:scan.id,name:scan.name,reason});else data.push({d:{...d,id:scan.id,set:{id}},reuse:c.fullName,method:'native-source',status:'candidate-needs-validation'});
}}
const eraSets=sets.filter(s=>/^xy/.test(s.id)||['dc1','g1','2014xy','2015xy','2016xy'].includes(s.id)||s.id.startsWith('tk-xy'));
const plan={status:'candidate-source',interactionScope:'Black & White onward through implemented XY; Unlimited deferred',selectedSets:first,total:data.length+pending.length,available:data.length,pending:pending.length,bySet:eraSets.map(s=>({id:s.id,name:s.name,total:cards.filter(c=>c.id.startsWith(s.id+'-')).length,selected:first.includes(s.id),candidateAvailable:data.filter(r=>r.d.set.id===s.id).length,validated:0}))};
fs.writeFileSync(path.join(research,'xy-first-wave-data.json'),JSON.stringify(data,null,2));fs.writeFileSync(path.join(research,'xy-automation-pending.json'),JSON.stringify(pending,null,2));fs.writeFileSync(path.join(ui,'xy-coverage.json'),JSON.stringify({...plan,unsupported:pending},null,2));console.log(JSON.stringify(plan));
fs.writeFileSync(path.join(research,'twinleafgg-main/ptcg-server/src/tcg-lab-xy-data.ts'),'export const xyData:any = '+JSON.stringify(compiled)+';\n');
