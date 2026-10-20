const fs=require('fs'),vm=require('vm'),path=require('path');
const base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8'),prefix=base.slice(0,base.indexOf("test('Limitless import:")),helpers=fs.readFileSync(path.join(__dirname,'xy-test-cases.js'),'utf8').split("test('Kalos and XY")[0];
vm.runInNewContext(prefix+helpers+`
const raw=path.join(root,'work/card-sources/pokemon-tcg-data-master/cards/en');
const supplements=['xy-supplements','hgss-trainer-kits','dp-trainer-kits','bw-trainer-kits'].flatMap(n=>JSON.parse(fs.readFileSync(path.join(root,'work/card-sources/'+n+'.json'))));
const energies=[...new Map([...fs.readdirSync(raw).filter(n=>n.endsWith('.json')).flatMap(n=>JSON.parse(fs.readFileSync(path.join(raw,n)))),...supplements].filter(d=>map[d.id]&&d.supertype==='Energy'&&d.subtypes?.includes('Basic')&&['Darkness Energy','Metal Energy'].includes(d.name)).map(d=>[d.id,d])).values()];
assert.ok(energies.length>10);
for(const d of energies)test(d.id+' '+d.name+' stays Basic and has no Special Energy effects',()=>{
 const {m,p,o}=fixture('bw1-1'),energy=put(m,d.id,p.active);assert.equal(energy.energyType,R.EnergyType.BASIC);assert.ok(energy.provides.includes(d.name==='Darkness Energy'?R.CardType.DARK:R.CardType.METAL));
 const e=new R.AttackEffect(p,o,{name:'Energy regression',cost:[],damage:30,text:''});
 const hit=new R.PutDamageEffect(e,30);m.store.reduceEffect(m.store.state,hit);assert.equal(hit.damage,30,'Basic Energy must not alter outgoing damage');
 const incoming=new R.PutDamageEffect(new R.AttackEffect(o,p,{name:'Incoming',cost:[],damage:30,text:''}),30);m.store.reduceEffect(m.store.state,incoming);assert.equal(incoming.damage,30,'Basic Metal must not reduce incoming damage');
 const before=p.active.damage;M.apply(m,{type:'pass',player:p.id});settle(m);assert.equal(p.active.damage,before,'Basic Darkness must not damage its holder');
});
for(const [id,damage,penalty]of [['neo1-104',40,10],['ex1-93',30,0]])test(id+' retains its printed Special Darkness behavior',()=>{
 const {m,p,o}=fixture('bw1-1');const e=put(m,id,p.active);assert.equal(e.energyType,R.EnergyType.SPECIAL);
 const attack=new R.AttackEffect(p,o,{name:'Special Energy regression',cost:[],damage:30,text:''}),hit=new R.PutDamageEffect(attack,30);m.store.reduceEffect(m.store.state,hit);assert.equal(hit.damage,damage);
 M.apply(m,{type:'pass',player:p.id});settle(m);assert.equal(p.active.damage,penalty);
});
fs.writeFileSync(path.join(root,'work/rules-research/basic-energy-tests.json'),JSON.stringify({passed:true,checks:passed,printings:energies.map(d=>d.id),engineSha256:require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ui,'rules-engine.js'))).digest('hex')},null,2));
`,{require,__dirname,console,setTimeout,clearTimeout,process},{filename:'basic-energy-tests.cjs'});
