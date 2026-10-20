const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sets=read(path.join(ui,'sets.json')).filter(s=>/^xy/.test(s.id)||['dc1','g1','2014xy','2015xy','2016xy'].includes(s.id)||s.id.startsWith('tk-xy'));
const cards=read(path.join(ui,'cards.json')),map=read(path.join(ui,'rules-card-map.json')),ctx={console,setTimeout,clearTimeout};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ui,'rules-engine.js'),'utf8'),ctx);
const native=Object.values(ctx.TCGRules.sets).filter(Array.isArray).flat().filter(c=>!c.fullName.startsWith('ILEX ')),unsafe=new Set(read(path.join(ui,'rules-coverage.json')).knownIncompleteTemplates),norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
const report=[];
for(const set of sets){const file=path.join(root,'work/card-sources/pokemon-tcg-data-master/cards/en',({'2014xy':'mcd14','2015xy':'mcd15','2016xy':'mcd16'}[set.id]||set.id)+'.json'),raw=fs.existsSync(file)?read(file):[];
 for(const scan of cards.filter(c=>c.id.startsWith(set.id+'-'))){const number=decodeURIComponent(scan.id.slice(set.id.length+1)),d=raw.find(d=>norm(d.number)===norm(number)),c=native.find(c=>c.fullName===map[scan.id]);let reason='';
 if(!d)reason='missing-text';else if(!c||unsafe.has(c.fullName))reason='missing-native';else if(norm(c.name)!==norm(d.name)||d.supertype==='Pokémon'&&((d.attacks||[]).map(a=>norm(a.name)).join('|')!==(c.attacks||[]).map(a=>norm(a.name)).join('|')||(d.abilities||[]).map(a=>norm(a.name)).join('|')!==(c.powers||[]).map(a=>norm(a.name)).join('|')))reason='identity-mismatch';
 report.push({id:scan.id,set:set.id,name:scan.name,reason,native:c?.fullName,d});}}
fs.writeFileSync(path.join(root,'work/rules-research/xy-inventory.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(sets.map(s=>({id:s.id,total:report.filter(r=>r.set===s.id).length,gaps:report.filter(r=>r.set===s.id&&r.reason).length})),null,2));
console.log(JSON.stringify(report.filter(r=>r.reason).map(({d,...r})=>r),null,2));
