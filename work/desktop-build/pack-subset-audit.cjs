const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),P=require('../desktop/ui/pack-model.js');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui'),read=n=>JSON.parse(fs.readFileSync(path.join(ui,n))),cards=read('cards.json'),details=read('card-details.json'),profiles=P.build(cards,read('sets.json'),details),groups=[];
const expectedCounts={sma:94,'swsh4.5sv':122,'swsh12.5gg':70,swsh9tg:30,swsh10tg:30,swsh11tg:30,swsh12tg:30,exu:28,cel25cc:25,'30th-c':30};
function route(p,kind){
 if(kind==='radiant')return {choice:-1,pick:p.common+p.uncommon+(p.energy||0)+(p.reverse||0)*2,point:0};
 if(p.slots){let cursor=0;for(const slot of p.slots){if(slot==='classicOrMain'&&kind==='classic')return {choice:cursor,pick:cursor+1,point:.14};if(slot==='rareHit'){const index=p.rareOdds.findIndex(o=>o.kind===kind&&o.boosted>0);if(index>=0)return {choice:cursor,pick:cursor+1,point:p.rareOdds.slice(0,index).reduce((n,o)=>n+o.boosted,0)+p.rareOdds[index].boosted/2};}cursor+=['classicOrMain','rareHit'].includes(slot)?2:1;}}
 for(let slot=0;slot<(p.reverse||0);slot++){const odds=p.bonusOdds.filter(o=>o.slotIndex===slot),i=odds.findIndex(o=>o.kind===kind&&o.boosted>0);if(i>=0){const choice=p.common+p.uncommon+(p.energy||0)+slot*2;return {choice,pick:choice+1,point:odds.slice(0,i).reduce((n,o)=>n+o.boosted,0)+odds[i].boosted/2};}}
 throw Error('Unreachable subset route '+p.id+' '+kind);
}
for(const p of profiles){
 const kinds=['subset','radiant','classic'];if(p.id==='sv04.5')kinds.push('bonus');
 for(const kind of kinds){const pool=p.pools[kind];if(!pool.length)continue;const r=route(p,kind);
  const external=Object.entries(P.subsetParents).filter(([id,parent])=>parent===p.id&&((kind==='classic')===['cel25cc','30th-c'].includes(id)));
  for(const [set] of external){const expected=cards.filter(c=>c.id.slice(0,c.id.lastIndexOf('-'))===set).map(c=>c.id);assert.equal(expected.length,expectedCounts[set],set);for(const id of expected)assert(pool.includes(id),id);assert.equal(new Set(pool).size,pool.length);}
  const observed=[];for(const [index,id] of pool.entries()){let call=0;const pack=P.generate(p,()=>{const n=call++;return n===r.choice?r.point:n===r.pick?(index+.5)/pool.length:.999999;});assert.equal(pack.length,p.count);assert(pack.some(c=>c.id===id&&c.finish==='holo'),p.id+' failed to generate '+id);assert.equal(P.packSetId(id),p.id,'Collection parent mismatch '+id);observed.push(id);}
  groups.push({parent:p.id,name:p.name,pool:kind,printings:pool.length,generated:observed.length,testedIds:observed});
 }
}
for(const [parent,count] of [['bw11',25],['g1',32]])assert.equal(groups.find(g=>g.parent===parent&&g.pool==='radiant').printings,count);
assert.equal(groups.find(g=>g.parent==='sv04.5'&&g.pool==='bonus').printings,132);
assert.equal(profiles.length,129);assert(Object.keys(P.subsetParents).every(id=>!profiles.some(p=>p.id===id)));
const report={passed:true,groups,profiles:profiles.length,printingsGenerated:groups.reduce((n,g)=>n+g.generated,0),hashes:Object.fromEntries(['pack-model.js','packs.js'].map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(path.join(ui,n))).digest('hex')]))};
fs.writeFileSync(path.join(root,'work/rules-research/pack-subset-audit.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,groups:groups.map(({testedIds,...g})=>g),printingsGenerated:report.printingsGenerated},null,2));
