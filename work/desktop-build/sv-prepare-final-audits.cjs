const fs=require('fs'),path=require('path');
for(const kind of ['power','trainer']){
 let s=fs.readFileSync(path.join(__dirname,`swsh-full-${kind}-audit.cjs`),'utf8');
 s=s.replace("const base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8'),prefix=base.slice(0,base.indexOf(\"test('Limitless import:\"));","let base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8');base=base.replace(\"fs.readFileSync(path.join(ui,file),'utf8')\",\"fs.readFileSync(file==='rules-engine.js'?path.join(root,'work/sv-candidate/rules-engine.js'):path.join(ui,file),'utf8')\");const prefix=base.slice(0,base.indexOf(\"test('Limitless import:\"));");
 s=s.replaceAll('swsh-full-sweep.cjs','sv-era-sweep.cjs').replaceAll(`swsh-full-${kind}-audit.json`,`sv-full-${kind}-audit.json`).replaceAll("fs.readFileSync(path.join(ui,'rules-engine.js'))","fs.readFileSync(path.join(root,'work/sv-candidate/rules-engine.js'))");
 fs.writeFileSync(path.join(__dirname,`sv-full-${kind}-audit.cjs`),s);
}
let deep=fs.readFileSync(path.join(__dirname,'swsh-deep-identity.cjs'),'utf8').replaceAll("path.join(ui,'rules-engine.js')","path.join(root,'work/sv-candidate/rules-engine.js')").replaceAll('swsh-wave-data.json','sv-era-candidate-data.json').replaceAll('swsh-deep-identity.json','sv-deep-identity.json');
deep=deep.replace("for(const {d}of records)","for(const r of records)map[r.d.id]='ILEX DP '+r.d.id;for(const {d}of records)").replace("p.cost.map(t=>R.CardType[types[t]||t.toUpperCase()])","p.cost.filter(t=>t!=='Free').map(t=>R.CardType[types[t]||t.toUpperCase()])");
fs.writeFileSync(path.join(__dirname,'sv-deep-identity.cjs'),deep);
console.log('Prepared candidate-only SV identity, Ability and Trainer audits.');
