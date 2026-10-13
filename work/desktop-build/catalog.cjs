const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui');
const ctx={console,setTimeout,clearTimeout};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ui,'rules-engine.js'),'utf8'),ctx);
const R=ctx.TCGRules;const upstream=Object.values(R.sets).filter(Array.isArray).flat();
const unique=[...new Map(upstream.map(c=>[c.fullName,c])).values()];
const definitions=[],unsafeClasses=new Set(),unsafeNames=new Set();
function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())scan(p);else if(p.endsWith('.ts')){const text=fs.readFileSync(p,'utf8');const imports=new Map();for(const im of text.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)){for(const binding of im[1].split(',')){const [original,local]=binding.trim().split(/\s+as\s+/);imports.set(local||original,{file:path.resolve(path.dirname(p),im[2])+'.ts',name:original});}}for(const m of text.matchAll(/export class (\w+) extends (\w+)/g)){const body=text.slice(m.index,text.indexOf('export class',m.index+12)<0?undefined:text.indexOf('export class',m.index+12));const full=body.match(/fullName(?:\s*:\s*string)?\s*=\s*['"]([^'\"]+)/)?.[1];const imported=imports.get(m[2]);const id=p+'#'+m[1],parent=(imported?.file||p)+'#'+(imported?.name||m[2]);definitions.push({id,parent,full});if(/TODO|not implemented|not currently implementable/i.test(body))unsafeClasses.add(id);}}}}
scan(path.join(root,'work/rules-research/twinleafgg-main/ptcg-server/src/sets'));
for(let i=0;i<definitions.length;i++){let changed=false;for(const d of definitions)if(unsafeClasses.has(d.parent)&&!unsafeClasses.has(d.id)){unsafeClasses.add(d.id);changed=true}if(!changed)break;}
for(const d of definitions)if(unsafeClasses.has(d.id)&&d.full)unsafeNames.add(d.full);
const cards=JSON.parse(fs.readFileSync(path.join(ui,'cards.json'))),sets=JSON.parse(fs.readFileSync(path.join(ui,'sets.json')));
const source=path.join(root,'work/card-sources/pokemon-tcg-data-master');
const dataSets=JSON.parse(fs.readFileSync(path.join(source,'sets/en.json')));
const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
const aliases={'sm7.5':'sm75','sm3.5':'sm35','swsh3.5':'swsh35','swsh4.5':'swsh45','swsh12.5':'swsh12pt5','sv03.5':'sv3pt5','sv04.5':'sv4pt5','sv08.5':'sv8pt5','cel25':'cel25',lc:'base6',bog:'bp'};
const setMap={};for(const s of sets){const ds=dataSets.find(x=>x.id===s.id)||dataSets.find(x=>norm(x.name)===norm(s.name));setMap[s.id]=aliases[s.id]||ds?.id||s.id;}
const records={};for(const file of fs.readdirSync(path.join(source,'cards/en'))){for(const c of JSON.parse(fs.readFileSync(path.join(source,'cards/en',file))))records[c.id]=c;}
const codes={};const metadata={};const mapping={};
const variants={};for(const c of unique){const key=norm(c.set)+'|'+String(c.setNumber).toLowerCase().replace(/^0+(?=\d)/,'');(variants[key]??=[]).push(c);}
for(const c of cards){
  const s=sets.filter(s=>c.id.startsWith(s.id+'-')).sort((a,b)=>b.id.length-a.id.length)[0];if(!s)continue;
  const number=c.id.slice(s.id.length+1),dsid=setMap[s.id],ds=dataSets.find(x=>x.id===dsid);
  const d=records[dsid+'-'+number]||records[dsid+'-'+number.replace(/^0+(?=\d)/,'')]||records[dsid+'-'+number.replace(/^H0+(?=\d)/i,'H').replace(/(?<=\d)[ab]$/i,'')];
  const code=ds?.ptcgoCode||({mep:'MEP',me01:'MEG',sv09:'JTG',sv10:'DRI','sv10.5b':'BLK','sv10.5w':'WHT'}[s.id])||s.id;
  codes[s.id]=code;
  if(d)metadata[c.id]={id:c.id,name:d.name,category:d.supertype==='Pokémon'?'Pokemon':d.supertype,stage:d.subtypes?.includes('Basic')?'Basic':d.subtypes?.includes('Stage 1')?'Stage1':d.subtypes?.includes('Stage 2')?'Stage2':undefined,hp:Number(d.hp)||undefined,types:d.types,attacks:(d.attacks||[]).map(a=>({name:a.name,cost:a.cost,damage:a.damage,effect:a.text})),abilities:(d.abilities||[]).map(a=>({name:a.name,type:a.type,effect:a.text})),effect:d.rules?.join('\n'),subtypes:d.subtypes,energyType:d.subtypes?.includes('Basic')&&d.supertype==='Energy'?'Normal':'Special',evolveFrom:d.evolvesFrom,ptcgoCode:code,number:d.number};
  const potential=variants[norm(code)+'|'+number.toLowerCase().replace(/^0+(?=\d)/,'')]||[];
  const found=potential.find(x=>norm(x.name)===norm(d?.name||c.name));
  if(found&&!unsafeNames.has(found.fullName))mapping[c.id]=found.fullName;
}
// Explicit verified WOTC printings take precedence over upstream number aliases.
const indexIds=new Set(cards.map(c=>c.id));for(const c of upstream)if(c._wotcId&&indexIds.has(c._wotcId))mapping[c._wotcId]=c.fullName;
fs.writeFileSync(path.join(ui,'card-details.json'),JSON.stringify(metadata));
fs.writeFileSync(path.join(ui,'deck-set-codes.json'),JSON.stringify(codes));
fs.writeFileSync(path.join(ui,'rules-card-map.json'),JSON.stringify(mapping));
fs.writeFileSync(path.join(ui,'rules-coverage.json'),JSON.stringify({mappedPrintings:Object.keys(mapping).length,totalScans:cards.length,knownIncompleteTemplates:[...unsafeNames].sort(),unsupported:cards.filter(c=>!mapping[c.id]).map(c=>({id:c.id,name:c.name})),note:'Mappings indicate available implementations, not certification of every interaction. Known TODO templates and inherited reprints are excluded.'},null,2));
fs.writeFileSync(path.join(root,'work/rules-research/engine-catalog.json'),JSON.stringify(unique.map(c=>({name:c.name,set:c.set,number:c.setNumber,fullName:c.fullName,superType:c.superType,stage:c.stage,hp:c.hp,attacks:c.attacks,powers:c.powers})),null,2));
console.log(JSON.stringify({upstreamCards:unique.length,mappedPrintings:Object.keys(mapping).length,offlineMetadata:Object.keys(metadata).length,examples:Object.entries(mapping).slice(0,8)}));
