const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui'),research=path.join(root,'work/rules-research'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sets=read(path.join(ui,'sets.json')).filter(s=>/^sv/.test(s.id)||['2023sv','2024sv'].includes(s.id));
const cards=read(path.join(ui,'cards.json')),ctx={console,setTimeout,clearTimeout};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ui,'rules-engine.js'),'utf8'),ctx);
const native=Object.values(ctx.TCGRules.sets).filter(Array.isArray).flat().filter(c=>!c.fullName.startsWith('ILEX ')),unsafe=new Set(read(path.join(ui,'rules-coverage.json')).knownIncompleteTemplates);
const norm=s=>String(s||'').replace(/Prism Star/g,'◇').replace(/GrassFireWater/g,'GRW').replace(/LightningPsychicMetal/g,'LPM').replace(/FightingDarknessFairy/g,'FDY').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase(),names=a=>(a||[]).map(a=>norm(a.name)).join('|');
const byName=new Map();for(const c of native){const k=norm(c.name);if(!byName.has(k))byName.set(k,[]);byName.get(k).push(c);}
// Reuse is a source candidate only. Require the complete printed effect, not just its name.
const reminder=/^(?:You may play|You can play|As long as this card is attached|Pokémon ex rule|ex rule|Tera:)/;
function printedEquivalent(c,d){
 const symbols={G:'Grass',R:'Fire',W:'Water',L:'Lightning',P:'Psychic',F:'Fighting',D:'Darkness',M:'Metal',C:'Colorless',Y:'Fairy',N:'Dragon'};
 const effect=t=>norm(String(t||'').replace(/\[([GRWLPFDMCYN])\]/g,(_,x)=>symbols[x]));
 if(d.supertype==='Trainer'){
  const rules=(d.rules||[]).filter(t=>!reminder.test(t));
  return rules.length===1&&effect(c.text)===effect(rules[0]);
 }
 if(d.supertype==='Energy')return false;
 if(String(c.hp)!==String(d.hp)||names(c.attacks)!==names(d.attacks)||names(c.powers)!==names(d.abilities))return false;
 const types={Grass:1,Fire:2,Water:3,Lightning:4,Psychic:5,Fighting:6,Darkness:7,Metal:8,Colorless:9,Fairy:10,Dragon:11};
 if(c.stage!==(d.subtypes?.includes('Stage 2')?4:d.subtypes?.includes('Stage 1')?3:2))return false;
 if(JSON.stringify(Array.from(c.cardType))!==JSON.stringify((d.types||[]).map(t=>types[t])))return false;
 return (d.attacks||[]).every((a,i)=>effect(a.text)===effect(c.attacks[i].text)&&Number.parseInt(a.damage||0)===Number(c.attacks[i].damage||0)&&JSON.stringify(Array.from(c.attacks[i].cost||[]))===JSON.stringify((a.cost||[]).map(t=>types[t])))&&(d.abilities||[]).every((a,i)=>effect(a.text)===effect(c.powers[i].text));
}
const alias={sv01:'sv1',sv02:'sv2',sv03:'sv3','sv03.5':'sv3pt5',sv04:'sv4','sv04.5':'sv4pt5',sv05:'sv5',sv06:'sv6','sv06.5':'sv6pt5',sv07:'sv7',sv08:'sv8','sv08.5':'sv8pt5',sv09:'sv9',sv10:'sv10','sv10.5b':'zsv10pt5','sv10.5w':'rsv10pt5'};
const nativeCodes={...read(path.join(ui,'deck-set-codes.json')),svp:'SVP'};
const printedSignature=d=>JSON.stringify([norm(d.name),d.hp,d.supertype,d.subtypes,d.types,d.evolvesFrom,d.retreatCost,d.weaknesses,d.resistances,d.attacks,d.abilities,d.rules]);
const rows=[];for(const set of sets){const file=path.join(root,'work/card-sources/pokemon-tcg-data-master/cards/en',(alias[set.id]||set.id)+'.json'),raw=fs.existsSync(file)?read(file):[];
 const supplement=path.join(root,'work/card-sources/sv-supplements.json');if(fs.existsSync(supplement))raw.push(...read(supplement).filter(d=>d.set.id===set.id));
 for(const scan of cards.filter(c=>c.id.startsWith(set.id+'-'))){const number=decodeURIComponent(scan.id.slice(set.id.length+1)),d=set.id==='cel25cc'?raw.find(d=>norm(d.name)===norm(scan.name)):raw.find(d=>(norm(d.number)===norm(number)||/^0*\d+$/.test(number)&&Number(d.number)===Number(number)));
 const printedCounterparts=d?raw.filter(x=>printedSignature(x)===printedSignature(d)):[];
 const exactSource=c=>c.set===nativeCodes[set.id]&&printedCounterparts.some(x=>norm(x.number)===norm(c.setNumber));
 const matches=d?(byName.get(norm(d.name))||[]).filter(c=>!unsafe.has(c.fullName)&&(printedEquivalent(c,d)||exactSource(c))).sort((a,b)=>Number(exactSource(b))-Number(exactSource(a))||Number(norm(b.setNumber)===norm(d.number))-Number(norm(a.setNumber)===norm(d.number))):[];
 rows.push({id:scan.id,set:set.id,name:scan.name,number,sourceFile:fs.existsSync(file)?path.relative(root,file):null,reason:!d?'missing-printed-text':!matches.length?'needs-implementation':'native-candidate-unvalidated',native:matches.map(c=>c.fullName),d:d?{...d,id:scan.id,set:{id:set.id}}:undefined});}}
const report={status:'inventory-only-not-automation',scope:'Black & White onward through Scarlet & Violet; Unlimited deferred',total:rows.length,bySet:sets.map(s=>({id:s.id,name:s.name,total:rows.filter(r=>r.set===s.id).length,missingText:rows.filter(r=>r.set===s.id&&!r.d).length,nativeCandidates:rows.filter(r=>r.set===s.id&&r.native.length).length})),rows};
fs.writeFileSync(path.join(research,'sv-inventory.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,rows:undefined},null,2));
