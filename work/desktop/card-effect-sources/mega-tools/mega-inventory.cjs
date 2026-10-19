const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui'),out=path.join(root,'work/rules-research'),read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const aliases={me01:'me1',me02:'me2','me02.5':'me2pt5',me03:'me3',me04:'me4',me05:'me5','30th':'me55','30th-c':'me55c',mep:'mep',mee:'mee'};
const codes={...read(path.join(ui,'deck-set-codes.json')),mep:'MEP',mee:'MEE'};
const ctx={console,setTimeout,clearTimeout};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ui,'rules-engine.js'),'utf8'),ctx);
const native=Object.values(ctx.TCGRules.sets).filter(Array.isArray).flat().filter(c=>!c.fullName.startsWith('ILEX '));
const sets=read(path.join(ui,'sets.json')).filter(s=>Object.hasOwn(aliases,s.id)),cards=read(path.join(ui,'cards.json')),rows=[],sources=[];
const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
const byName=new Map();for(const c of native){const k=norm(c.name);if(!byName.has(k))byName.set(k,[]);byName.get(k).push(c);}
for(const set of sets){const file=path.join(root,'work/card-sources/pokemon-tcg-data-master/cards/en',aliases[set.id]+'.json'),raw=fs.existsSync(file)?read(file):[];
 const supplement=path.join(root,'work/card-sources/mega-supplements.json');if(fs.existsSync(supplement))for(const d of read(supplement).filter(d=>d.set.id===set.id)){raw.push(d);if(!cards.some(c=>c.id===d.id))cards.push({id:d.id,name:d.name,localId:d.number});}
 if(fs.existsSync(file))sources.push({file:path.relative(root,file),sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),records:read(file).length});
 for(const scan of cards.filter(c=>c.id.startsWith(set.id+'-')&&(set.id!=='30th'||!c.id.startsWith('30th-c-')))){const number=decodeURIComponent(scan.id.slice(set.id.length+1));let d=set.id==='30th-c'?raw.filter(d=>norm(d.name.replace(/ LV\.X$/,''))===norm(scan.name))[number==='020'?1:0]:raw.find(d=>norm(d.number)===norm(number)||/^\d+$/.test(number)&&Number(d.number)===Number(number));
  const cached=path.join(root,'work/card-sources/pack-finishes',scan.id+'.json');
  if(!d&&fs.existsSync(cached)){const c=read(cached),pokemon=c.category==='Pokemon',energy=c.category==='Energy';d={name:c.name,number:c.localId,supertype:pokemon?'Pokémon':energy?'Energy':'Trainer',subtypes:pokemon?[c.stage==='Stage1'?'Stage 1':c.stage==='Stage2'?'Stage 2':'Basic',...(c.suffix?[c.suffix]:[])]:energy?[c.energyType==='Normal'?'Basic':'Special']:[c.trainerType==='Tool'?'Pokémon Tool':c.trainerType||'Item'],hp:String(c.hp||''),types:c.types,evolvesFrom:c.evolveFrom,retreatCost:Array(c.retreat||0).fill('Colorless'),weaknesses:c.weaknesses,resistances:c.resistances,attacks:(c.attacks||[]).map(a=>({name:a.name,cost:a.cost||[],damage:String(a.damage||''),text:a.effect||''})),abilities:(c.abilities||[]).map(a=>({name:a.name,type:'Ability',text:a.effect||''})),rules:c.rules||(c.effect?[c.effect]:[]),regulationMark:c.regulationMark,rarity:c.rarity};sources.push({id:scan.id,file:path.relative(root,cached),sha256:crypto.createHash('sha256').update(fs.readFileSync(cached)).digest('hex')});}
  if(!d&&set.id==='mee'&&Number(number)>=9){const prior=rows.find(r=>r.id==='mee-'+String(Number(number)-8).padStart(3,'0'));if(prior?.d)d={...prior.d,name:scan.name,number};}
  if(d&&set.id==='30th-c'&&scan.id==='30th-c-015')d={...d,supertype:'Pokémon'};
  const matches=d?[...(byName.get(norm(d.name))||[]),...(set.id==='30th-c'?(byName.get(norm(d.name.replace(/ LV\.X$/,'')))||[]):[])].filter((c,i,a)=>a.indexOf(c)===i).sort((a,b)=>Number(b.set===codes[set.id]&&Number(b.setNumber)===Number(d.number))-Number(a.set===codes[set.id]&&Number(a.setNumber)===Number(d.number))):[];
  rows.push({id:scan.id,set:set.id,name:scan.name,number,native:matches.map(c=>c.fullName),d:d?{...d,id:scan.id,number,set:{id:set.id}}:null});
 }
}
const report={status:'source-inventory-only',scope:'Black & White onward through Mega Evolution and 30th Celebration; Unlimited deferred',total:rows.length,bySet:sets.map(s=>({id:s.id,name:s.name,total:rows.filter(r=>r.set===s.id).length,missingText:rows.filter(r=>r.set===s.id&&!r.d).length,nativeCandidates:rows.filter(r=>r.set===s.id&&r.native.length).length})),rows,sources};
fs.writeFileSync(path.join(out,'mega-inventory.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,rows:undefined,sources:undefined},null,2));
