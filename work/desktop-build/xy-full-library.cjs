const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui'),research=path.join(root,'work/rules-research'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=read(path.join(ui,'sets.json')).filter(s=>/^xy/.test(s.id)||['dc1','g1','2014xy','2015xy','2016xy'].includes(s.id)||s.id.startsWith('tk-xy')),cards=read(path.join(ui,'cards.json'));
const codes={xy0:'KSS',xy1:'XY',xy2:'FLF',xy3:'FFI',xy4:'PHF',xy5:'PRC',xy6:'ROS',xy7:'AOR',xy8:'BKT',xy9:'BKP',xy10:'FCO',xy11:'STS',xy12:'EVO',dc1:'DCR',g1:'GEN',xyp:'XYP',xya:'XYA','2014xy':'MCD14','2015xy':'MCD15','2016xy':'MCD16',...Object.fromEntries(catalog.filter(s=>s.id.startsWith('tk-')).map(s=>[s.id,s.id.toUpperCase().replace(/-/g,'')]))};
const ctx={console,setTimeout,clearTimeout};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ui,'rules-engine.js'),'utf8'),ctx);
const native=Object.values(ctx.TCGRules.sets).filter(Array.isArray).flat().filter(c=>!c.fullName.startsWith('ILEX ')),unsafe=new Set(read(path.join(ui,'rules-coverage.json')).knownIncompleteTemplates);
const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase(),names=a=>(a||[]).map(a=>norm(a.name)).join('|');
const byName=new Map();for(const c of native){const key=norm(c.name);if(!byName.has(key))byName.set(key,[]);byName.get(key).push(c);}
const compile=require('./xy-attack-patterns.cjs'),power=require('./xy-power-patterns.cjs'),trainer=require('./xy-trainer-patterns.cjs'),printed=require('./dp-printed-rules.cjs');
let canonical=[];for(const s of catalog){const f=path.join(root,'work/card-sources/pokemon-tcg-data-master/cards/en',({'2014xy':'mcd14','2015xy':'mcd15','2016xy':'mcd16'}[s.id]||s.id)+'.json');if(fs.existsSync(f))canonical.push(...read(f).map(d=>({...d,set:{id:s.id}})));}
const supplement=path.join(root,'work/card-sources/xy-supplements.json');if(fs.existsSync(supplement))canonical.push(...read(supplement));
const first=read(path.join(research,'xy-first-wave-data.json')),originalCompiled=JSON.parse(fs.readFileSync(path.join(research,'twinleafgg-main/ptcg-server/src/tcg-lab-xy-data.ts'),'utf8').match(/^export const xyData:any = (.*);$/m)[1]);
const data=[],compiled=[],pending=[];
for(const set of catalog)for(const scan of cards.filter(c=>c.id.startsWith(set.id+'-'))){
 const number=decodeURIComponent(scan.id.slice(set.id.length+1)),raw=canonical.find(d=>d.set.id===set.id&&norm(d.number)===norm(number));
 if(['xy0','xy1'].includes(set.id)){const record=first.find(r=>r.d.id===scan.id);if(record){data.push(record);const c=originalCompiled.find(r=>r.d.id===scan.id);if(c)compiled.push(c);continue;}}
 if(!raw){pending.push({id:scan.id,name:scan.name,set:set.id,reason:'missing-printed-text'});continue;}
 const d={...raw,id:scan.id},ops=(d.attacks||[]).map(a=>compile(a,d.name)),powers=(d.abilities||[]).map(a=>power(a,d.name)),held=printed({...d,rules:(d.rules||[]).filter(r=>!/^Pokémon-EX rule: When a Pokémon-EX has been Knocked Out, your opponent takes 2 Prize cards\.$|^Mega Evolution rule: When 1 of your Pokémon becomes a Mega Evolution Pokémon, your turn ends\.$|^BREAK Evolution Rule: .+ BREAK retains the attacks, Abilities, Weakness, Resistance, and Retreat Cost of its previous Evolution\.$/.test(r))}),t=d.supertype==='Trainer'?trainer(d):null;
 const matching=c=>!unsafe.has(c.fullName)&&norm(c.name)===norm(d.name)&&(d.supertype!=='Pokémon'||String(c.hp)===String(d.hp)&&names(c.attacks)===names(d.attacks)&&names(c.powers.filter(p=>p.powerType!==ctx.TCGRules.PowerType.ANCIENT_TRAIT))===names(d.abilities));
 const alias=d.name.replace(/ Team Flare (?:Hyper )?Gear$/,''),candidates=byName.get(norm(alias))||[],source=candidates.find(c=>c.set===codes[set.id]&&norm(c.setNumber)===norm(number)&&(!unsafe.has(c.fullName))&&(matching(c)||alias!==d.name))||candidates.find(c=>matching(c));
 let record;if(source)record={d,reuse:source.fullName,reason:'native-source'};
 else if(['Double Aqua Energy','Double Magma Energy'].includes(d.name))record={d,xyEnergy:{team:d.name.includes('Aqua')?'Aqua':'Magma',energy:d.name.includes('Aqua')?'Water':'Fighting'},reason:'compiled-special-energy'};
 else if(t!==null)record={d,trainerOps:t,reason:'compiled-trainer'};
 else if(d.supertype==='Energy'&&d.subtypes?.includes('Basic'))record={d,ops:[],reason:'basic-energy'};
 else if(d.supertype==='Pokémon'&&held!==null&&(!d.ancientTrait||['Δ Evolution','θ Stop'].includes(d.ancientTrait.name))&&ops.every(o=>o!==null)&&powers.every(p=>p!==null))record={d,ops,powers,reason:'compiled-effects'};
 if(record){record.heldRules=held||[];record.copyOps=ops;data.push(record);compiled.push(record);}else pending.push({id:d.id,name:d.name,set:set.id,reason:'uncompiled-effect',supertype:d.supertype,rules:d.rules,ancientTrait:d.ancientTrait,attacks:(d.attacks||[]).filter((a,i)=>ops[i]===null),abilities:(d.abilities||[]).filter((a,i)=>powers[i]===null)});
}
const plan={status:'candidate-source-unvalidated',total:data.length+pending.length,available:data.length,pending:pending.length,interactionScope:'Black & White onward through implemented XY; Unlimited deferred',bySet:catalog.map(s=>({id:s.id,name:s.name,total:cards.filter(c=>c.id.startsWith(s.id+'-')).length,available:data.filter(r=>r.d.set.id===s.id).length,validated:0})),unsupported:pending};
fs.writeFileSync(path.join(research,'xy-full-wave-data.json'),JSON.stringify(data,null,2));fs.writeFileSync(path.join(research,'xy-full-pending.json'),JSON.stringify(pending,null,2));fs.writeFileSync(path.join(ui,'xy-coverage.json'),JSON.stringify(plan,null,2));
fs.writeFileSync(path.join(research,'twinleafgg-main/ptcg-server/src/tcg-lab-xy-data.ts'),'export const xyData:any = '+JSON.stringify(compiled)+';\nexport const xySupporterCopyData:any = '+JSON.stringify(Object.fromEntries(data.filter(r=>r.d.subtypes?.includes('Supporter')&&trainer(r.d)).map(r=>[r.d.id,trainer(r.d)])))+';\n');
console.log(JSON.stringify({...plan,unsupported:undefined},null,2));
