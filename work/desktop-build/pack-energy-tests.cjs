const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm'),crypto=require('crypto');
const root=__dirname,ui=path.resolve(__dirname,'../desktop/ui'),read=n=>JSON.parse(fs.readFileSync(path.join(ui,n))),P=require(path.join(ui,'pack-model.js'));
const cards=read('cards.json'),sets=read('sets.json'),details=read('card-details.json'),profiles=P.build(cards,sets,details),checks=[];
function check(v,label){assert(v,label);checks.push(label)}
const old={PackFinishes:require(path.join(ui,'pack-finishes.js')),PackSpecials:require(path.join(ui,'pack-specials.js'))};vm.createContext(old);vm.runInContext(fs.readFileSync(path.join(root,'fixtures/pack-energy-before-model.js'),'utf8'),old);
const before=old.PackModel.build(cards,sets,details);
check(before.find(p=>p.id==='swsh12').pools.energy.every(id=>id.startsWith('sm1-')),'Reproduced Sword & Shield receiving Sun & Moon Energy');
check(before.find(p=>p.id==='me01').pools.energy.some(id=>id.startsWith('sve-')),'Reproduced Mega Evolution receiving Scarlet & Violet Energy');
const expected=id=>/^me/.test(id)||id==='30th'?'mee':/^swsh/.test(id)?(/^swsh(?:9|10|11|12)(?:\.5)?$/.test(id)?'energy2022':'energy2020'):/^sm/.test(id)?(/^sm(?:9|10|11|12)$/.test(id)||id==='sm115'?'energy2019':'sm1'):/^sv/.test(id)?'sve':id;
let packs=0,energySlots=0;let seed=257;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
for(const p of profiles.filter(p=>p.energy)){
 const set=expected(p.id);check(p.pools.energy.every(id=>id.slice(0,id.lastIndexOf('-'))===set),p.id+' uses '+set+' Energy artwork');
 check(new Set(p.pools.energy.map(id=>details[id].name)).size===p.pools.energy.length,p.id+' has one printing per Basic Energy type');
 if(set==='sve')check(p.pools.energy.every(id=>{const n=+details[id].number;return /^sv(?:07|08|09|10)/.test(p.id)?n>=9&&n<=16:n>=1&&n<=8}),p.id+' uses the correct Scarlet & Violet artwork generation');
 for(let i=0;i<100;i++){const pack=P.generate(p,rng,{special:false}),energy=pack.filter(c=>c.slot==='Basic Energy');check(energy.length===p.energy,p.id+' seeded pack '+i+' retains Energy count');assert(energy.every(c=>p.pools.energy.includes(c.id)&&c.finish===(p.allFoil?'holo':'normal')));packs++;energySlots+=energy.length;}
}
const ids=JSON.parse(fs.readFileSync(path.join(root,'fixtures/pack-energy-ids.json'))),manifest=read('scan-manifest.json'),map=read('rules-card-map.json'),ctx={console};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ui,'rules-engine.js'),'utf8'),ctx);const R=ctx.PTCG;
// RulesMatch exposes the bundled enum/card manager without changing the engine.
vm.runInContext(fs.readFileSync(path.join(ui,'rules-match.js'),'utf8'),ctx);
for(const id of ids){const m=manifest[id],bytes=fs.readFileSync(path.join(path.resolve(__dirname,'../dp-desktop-candidate/resources'),m.file));check(bytes.length===m.bytes&&crypto.createHash('sha256').update(bytes).digest('hex')===m.sha256,id+' cached scan integrity');const r=ctx.RulesMatch.R,c=r.CardManager.getInstance().getCardByName(map[id]);check(c.energyType===r.EnergyType.BASIC&&c.provides.includes(r.CardType[(details[id].types[0]==='Darkness'?'DARK':details[id].types[0].toUpperCase())]),id+' resolves to the correct Basic Energy implementation');}
const report={passed:true,checks:checks.length,profiles:profiles.length,packs,energySlots,newPrintings:ids.length,engineSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(ui,'rules-engine.js'))).digest('hex')};fs.writeFileSync(path.resolve(__dirname,'../rules-research/pack-energy-test-report.json'),JSON.stringify(report,null,2));console.log(report);


