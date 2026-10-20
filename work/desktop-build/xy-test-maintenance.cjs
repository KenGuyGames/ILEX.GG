const fs=require('fs'),p=__dirname+'/xy-full-test-cases.js';let t=fs.readFileSync(p,'utf8');
const start=t.indexOf("test('Magical Leaf"),end=t.indexOf('\n',start);
t=t.slice(0,start)+"test('Magical Leaf heals exactly on the heads damage branch',()=>{const results=new Set();for(let seed=1;seed<12;seed++){const f=fixture('xyp-XY115');f.m.randomState=seed*19781;f.p.active.damage=30;for(const id of ['bw1-105','bw1-106','bw1-106'])put(f.m,id,f.p.active);M.apply(f.m,{type:'attack',player:f.p.id,name:'Magical Leaf'});settle(f.m);const heads=f.o.active.damage===60;assert.ok([40,60].includes(f.o.active.damage));assert.equal(f.p.active.damage,heads?10:30);results.add(heads);}assert.equal(results.size,2);});"+t.slice(end);
fs.writeFileSync(p,t);
