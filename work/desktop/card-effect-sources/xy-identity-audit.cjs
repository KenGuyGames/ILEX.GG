const fs=require('fs'),vm=require('vm'),ctx={console,setTimeout,clearTimeout};vm.createContext(ctx);vm.runInContext(fs.readFileSync('work/desktop/ui/rules-engine.js','utf8'),ctx);
const map=require('../desktop/ui/rules-card-map.json'),native=Object.values(ctx.TCGRules.sets).filter(Array.isArray).flat(),raw=require('../rules-research/xy-full-wave-data.json'),mismatches=[];
for(const r of raw.filter(r=>r.d.supertype==='Pokémon')){const card=native.find(c=>c.fullName===map[r.d.id]),attacks=r.d.attacks||[];
 if(!card||!card.attacks||card.attacks.length!==attacks.length||card.attacks.some((a,i)=>a.cost.length!==attacks[i].cost.length||a.name!==attacks[i].name))mismatches.push({id:r.d.id,name:r.d.name,mapped:map[r.d.id],reason:r.method||r.reason,actual:card?.attacks?.map(a=>[a.name,a.cost]),expected:attacks.map(a=>[a.name,a.cost])});}
fs.writeFileSync('work/rules-research/xy-identity-mismatches.json',JSON.stringify(mismatches,null,2));console.log(JSON.stringify(mismatches,null,2));
