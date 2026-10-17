const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto'),Engine=require('../desktop/ui/pack-model.js'),P={...Engine,generate:(p,rng)=>Engine.generate(p,rng,{special:false})};
const ui=path.resolve(__dirname,'../desktop/ui'),read=n=>JSON.parse(fs.readFileSync(path.join(ui,n),'utf8')),cards=read('cards.json'),sets=read('sets.json'),details=read('card-details.json'),profiles=P.build(cards,sets,details),checks=[];
const check=(v,name)=>{assert(v,name);checks.push(name);};let seed=16321;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
check(profiles.length===129,'129 English standard and special expansions have validated slot pools');check(!profiles.some(p=>/promo|starter|kit|Pocket/i.test(p.name)),'Non-booster products excluded');
for(const p of profiles){
 check(Math.abs(p.rareOdds.reduce((s,o)=>s+o.boosted,0)-1)<1e-9,p.id+' rare-slot probabilities sum to one');
 check([...new Set(p.bonusOdds.map(o=>o.slotIndex))].every(slot=>p.bonusOdds.filter(o=>o.slotIndex===slot).reduce((s,o)=>s+o.boosted,0)<1),p.id+' parallel-slot probabilities remain valid');
 for(let n=0;n<100;n++){
  const pack=P.generate(p,rng);assert.equal(pack.length,p.count,p.id);assert.equal(pack.filter(c=>c.slot==='Common').length,p.common);assert.equal(pack.filter(c=>c.slot==='Uncommon').length,p.uncommon);assert.equal(pack.filter(c=>c.slot==='Basic Energy').length,p.energy||0);assert.equal(pack.filter(c=>c.slot==='Rare slot'||p.id==='30th'&&c.slot==='Classic Collection').length,p.slots&&!p.slots.includes('rareHit')?0:1);
  for(const c of pack){assert(cards.some(card=>card.id===c.id));assert(p.pools[c.tier].includes(c.id));assert(!c.revealed);assert(['normal','holo',...P.parallelFinishes].includes(c.finish));if(c.slot==='Common'||c.slot==='Uncommon')assert.equal(c.finish,p.allFoil?'holo':'normal');}
  for(const slot of ['Common','Uncommon']){const ids=pack.filter(c=>c.slot===slot).map(c=>c.id);assert.equal(ids.length,new Set(ids).size);}
 }
}
check(true,'12,900 packs retain exact slot counts, valid finishes, valid pools and unique common/uncommon runs');
for(const [id,size]of [['base1',11],['base2',11],['lc',11],['ecard1',9],['ex16',9],['dp1',10],['pl4',10],['sm1',11],['swsh12',11],['sv01',11]])check(profiles.find(p=>p.id===id).count===size,id+' era pack size');
const base=profiles.find(p=>p.id==='base1');let holo=0;for(let i=0;i<100000;i++)holo+=P.generate(base,rng).at(-1).tier==='holo';check(Math.abs(holo/100000-(1/3*1.12))<.006,'100,000 Base packs reproduce the modest 37.33% holo target');
for(const p of profiles)for(const o of [...p.rareOdds.slice(1),...p.bonusOdds].filter(o=>!o.cosmetic))assert(Math.abs(o.boosted/o.base-1.12)<1e-10);
check(true,'Every upgrade tier has exactly 12% relative boost');
const ex=profiles.find(p=>p.id==='ex10'),pl=profiles.find(p=>p.id==='pl4'),sw=profiles.find(p=>p.id==='swsh9');check(ex.pools.subset.some(id=>id.startsWith('exu-'))&&pl.pools.subset.some(id=>id.includes('-AR'))&&sw.pools.subset.some(id=>id.startsWith('swsh9tg-')),'Unown, Arceus and Trainer Gallery subsets occupy dedicated bonus pools');
const sv=profiles.find(p=>p.id==='sv01');check(!sv.pools.reverse.some(id=>['ultra','secret','bonus'].includes(P.tier(details[id]))),'Modern reverse pool excludes illustration/ultra/chase printings');
const modern=profiles.find(p=>p.id==='sv05');let ace=0,art=0;for(let n=0;n<40000;n++){const pack=P.generate(modern,rng),parallel=pack.filter(c=>['Reverse foil','Bonus slot'].includes(c.slot));assert.equal(parallel.length,2);assert(parallel[1].tier!=='ace');assert(!['double','full','ace'].includes(parallel[1].tier));assert(['rare','double','full'].includes(pack.at(-1).tier));ace+=parallel[0].tier==='ace';art+=['illustration','special','hyper'].includes(parallel[1].tier);}check(Math.abs(ace/40000-1.12/20)<.005,'40,000 SV packs put ACE SPEC upgrades only in first parallel slot at boosted odds');check(Math.abs(art/40000-modern.bonusOdds.filter(o=>o.slotIndex===1).reduce((n,o)=>n+o.boosted,0))<.006,'Modern art/chase tiers independently replace second parallel slot at boosted odds');

for(const id of ['me01','me02','me02.5','me03','me04','me05','sv03.5','sv08.5','sv10.5b','sv10.5w','sm115','swsh4.5','swsh12.5'])check(profiles.some(p=>p.id===id),id+' is available for opening');
for(const [id,count] of [['dv1',5],['dc1',7],['det1',4],['cel25',4],['bw11',10],['g1',10],['30th',6]])check(profiles.find(p=>p.id===id).count===count,id+' special-product card count');
for(const id of ['bw11','g1'])for(let i=0;i<100;i++){const pack=P.generate(profiles.find(p=>p.id===id),rng);assert.equal(pack.filter(c=>c.slot==='Radiant Collection').length,2);}
for(let i=0;i<100;i++){const pack=P.generate(profiles.find(p=>p.id==='30th'),rng);assert.equal(pack.filter(c=>c.slot==='Pikachu rare').length,1);assert(pack.every(c=>c.finish==='holo'));}
check(true,'Radiant and all-foil Pikachu slots retain their dedicated pack positions');
const artContext={};require('vm').runInNewContext(fs.readFileSync(path.join(ui,'pack-art.js'),'utf8'),artContext);const artwork=artContext.PackArt;assert.equal(Object.keys(artwork).length,129);for(const p of profiles){const a=artwork[p.id],bytes=fs.readFileSync(path.join(ui,a.file));assert.equal(bytes.length,a.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256);}
check(true,'Every selectable pack has bundled verified expansion-specific artwork');

const anniversary=profiles.find(p=>p.id==='30th');assert.equal(anniversary.pools.classic.length,30);assert(!profiles.some(p=>p.id==='30th-c'));
const seenClassic=new Set();let classicPacks=0;for(let i=0;i<20000;i++){const pack=P.generate(anniversary,rng),classic=pack.filter(c=>c.id.startsWith('30th-c-'));assert.equal(pack.length,6);assert.equal(pack.filter(c=>c.slot==='Pikachu rare').length,1);assert.equal(pack.filter(c=>c.slot==='Basic Energy').length,1);assert(classic.length<=1);for(const c of classic){assert.equal(c.slot,'Classic Collection');assert.equal(c.finish,'holo');seenClassic.add(c.id);}classicPacks+=classic.length;}
assert.equal(seenClassic.size,30);assert(Math.abs(classicPacks/20000-anniversary.rareOdds.find(o=>o.kind==='classic').boosted)<.012);
check(true,'All30 Classic Collection printings appear within six-card30th packs while retaining Pikachu/Energy and the modeled frequency');
for(const p of profiles.filter(p=>p.id!=='30th'))assert(!Object.values(p.pools).flat().some(id=>id.startsWith('30th-c-')));
check(true,'30th Classics do not leak to other expansions or become a separate pack option');
for(const [set,id] of [['ecard1','ecard1-160'],['ex1','ex1-104']])assert(profiles.find(p=>p.id===set).pools.reverse.includes(id));
check(true,'Confirmed reverse Basic Energy printings are retained in their original expansion reverse pools');
const prism=profiles.find(p=>p.id==='sv08.5');assert.equal(prism.pools.reverse.length,108);assert.equal(prism.pools.pokeball.length,100);assert.equal(prism.pools.masterball.length,67);
for(const id of prism.pools.masterball){assert.equal(details[id].category,'Pokemon');assert(!/ex$/i.test(details[id].name));}
const variantSeen={reverse:new Set(),pokeball:new Set(),masterball:new Set()};for(let n=0;n<40000;n++){const pack=P.generate(prism,rng);assert.equal(pack.length,11);for(const c of pack)if(variantSeen[c.finish]){assert(prism.pools[c.finish].includes(c.id));variantSeen[c.finish].add(c.id);}}
for(const kind of Object.keys(variantSeen))assert.equal(variantSeen[kind].size,prism.pools[kind].length);
check(true,'All108 Reverse Holo,100 Poke Ball and67 Master Ball Prismatic variants are reachable with legal eligibility and unchanged pack size');
const hashes=Object.fromEntries(['pack-specials.js','pack-model.js','packs.js','packs.css','pack-art.js','pack-finishes.js','pack-finish-view.js'].map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(path.join(ui,n))).digest('hex')]));
const report={passed:true,generatedPacks:212900,checks,profiles:profiles.map(({pools,...p})=>({...p,pools:Object.fromEntries(Object.entries(pools).map(([k,v])=>[k,v.length]))})),sampled30thPacks:20000,classicPrintingsSeen:seenClassic.size,classicPackRate:classicPacks/20000,sampledBasePacks:100000,holoRate:holo/100000,hashes};fs.writeFileSync(path.resolve(__dirname,'../pack-test-report.json'),JSON.stringify(report,null,2));console.log(checks.length+' checks; 129 profiles; 212,900 generated packs pass.');
