const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const correctExText=require('./ex-text-corrections.cjs');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui');
const ctx={console,setTimeout,clearTimeout};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ui,'rules-engine.js'),'utf8'),ctx);
const R=ctx.TCGRules;const upstream=Object.values(R.sets).filter(Array.isArray).flat();
const unique=[...new Map(upstream.map(c=>[c.fullName,c])).values()];
const definitions=[],unsafeClasses=new Set(),unsafeNames=new Set();
function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())scan(p);else if(p.endsWith('.ts')){const text=fs.readFileSync(p,'utf8');const imports=new Map();for(const im of text.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)){for(const binding of im[1].split(',')){const [original,local]=binding.trim().split(/\s+as\s+/);imports.set(local||original,{file:path.resolve(path.dirname(p),im[2])+'.ts',name:original});}}for(const m of text.matchAll(/export class (\w+) extends (\w+)/g)){const body=text.slice(m.index,text.indexOf('export class',m.index+12)<0?undefined:text.indexOf('export class',m.index+12));const full=body.match(/fullName(?:\s*:\s*string)?\s*=\s*['"]([^'\"]+)/)?.[1];const imported=imports.get(m[2]);const id=p+'#'+m[1],parent=(imported?.file||p)+'#'+(imported?.name||m[2]);definitions.push({id,parent,full});if(/TODO|not implemented|not currently implementable/i.test(body))unsafeClasses.add(id);}}}}
scan(path.join(root,'work/cube-source/src/sets'));
for(let i=0;i<definitions.length;i++){let changed=false;for(const d of definitions)if(unsafeClasses.has(d.parent)&&!unsafeClasses.has(d.id)){unsafeClasses.add(d.id);changed=true}if(!changed)break;}
for(const d of definitions)if(unsafeClasses.has(d.id)&&d.full)unsafeNames.add(d.full);
const cards=JSON.parse(fs.readFileSync(path.join(ui,'cards.json'))),sets=JSON.parse(fs.readFileSync(path.join(ui,'sets.json')));
const source=path.join(root,'work/card-sources/pokemon-tcg-data-master');
const dataSets=JSON.parse(fs.readFileSync(path.join(source,'sets/en.json')));
const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
const aliases={'sm7.5':'sm75','sm3.5':'sm35','swsh3.5':'swsh35','swsh4.5':'swsh45','swsh12.5':'swsh12pt5','sv03.5':'sv3pt5','sv04.5':'sv4pt5','sv08.5':'sv8pt5','cel25':'cel25',lc:'base6',bog:'bp',exu:'ex10','tk-ex-latia':'tk1a','tk-ex-latio':'tk1b','tk-ex-p':'tk2a','tk-ex-m':'tk2b'};
const setMap={};for(const s of sets){const ds=dataSets.find(x=>x.id===s.id)||dataSets.find(x=>norm(x.name)===norm(s.name));setMap[s.id]=aliases[s.id]||ds?.id||s.id;}
const records={};for(const file of fs.readdirSync(path.join(source,'cards/en'))){for(const c of JSON.parse(fs.readFileSync(path.join(source,'cards/en',file))))records[c.id]=require('./hgss-text-corrections.cjs')(correctExText(c));}
const dpKits=path.join(root,'work/card-sources/dp-trainer-kits.json');if(fs.existsSync(dpKits))for(const c of JSON.parse(fs.readFileSync(dpKits,'utf8')))records[c.id]=c;
const hgssKits=path.join(root,'work/card-sources/hgss-trainer-kits.json');if(fs.existsSync(hgssKits))for(const c of JSON.parse(fs.readFileSync(hgssKits,'utf8')))records[c.id]=c;
const xySupplements=path.join(root,'work/card-sources/xy-supplements.json');if(fs.existsSync(xySupplements))for(const c of JSON.parse(fs.readFileSync(xySupplements,'utf8')))records[c.id]=c;
const smSupplementFile=path.join(root,'work/card-sources/sm-supplements.json');if(fs.existsSync(smSupplementFile))for(const d of JSON.parse(fs.readFileSync(smSupplementFile,'utf8')))records[d.id]=d;
const swshSupplementFile=path.join(root,'work/card-sources/swsh-supplements.json');if(fs.existsSync(swshSupplementFile))for(const d of JSON.parse(fs.readFileSync(swshSupplementFile,'utf8')))records[d.id]=d;
const swshPrintedFile=path.join(root,'work/rules-research/swsh-wave-data.json');if(fs.existsSync(swshPrintedFile))for(const row of JSON.parse(fs.readFileSync(swshPrintedFile,'utf8')))records[row.d.id]=row.d;
const bwDataFile=path.join(root,'work/cube-source/src/tcg-lab-bw-data.ts');if(fs.existsSync(bwDataFile)){const data=JSON.parse(fs.readFileSync(bwDataFile,'utf8').match(/^export const bwData:any = (.*);$/m)[1]);for(const record of data)records[record.d.id]=record.d;}
const codes={};const metadata={};const mapping={};
const variants={};for(const c of unique){const key=norm(c.set)+'|'+String(c.setNumber).toLowerCase().replace(/^0+(?=\d)/,'');(variants[key]??=[]).push(c);}
for(const c of cards){
  const s=sets.filter(s=>c.id.startsWith(s.id+'-')).sort((a,b)=>b.id.length-a.id.length)[0];if(!s)continue;
  const number=decodeURIComponent(c.id.slice(s.id.length+1)),dsid=setMap[s.id],ds=dataSets.find(x=>x.id===dsid);
  const d=records[dsid+'-'+number]||records[dsid+'-'+number.replace(/^0+(?=\d)/,'')]||records[dsid+'-'+number.replace(/^H0+(?=\d)/i,'H').replace(/(?<=\d)[ab]$/i,'')];
  const code=ds?.ptcgoCode||({mep:'MEP',me01:'MEG',sv09:'JTG',sv10:'DRI','sv10.5b':'BLK','sv10.5w':'WHT'}[s.id])||s.id;
  codes[s.id]=code;
  if(d)metadata[c.id]={id:c.id,name:d.name,rarity:d.rarity,category:d.supertype==='Pokémon'?'Pokemon':d.supertype,stage:d.subtypes?.includes('Level-Up')?'LevelUp':d.subtypes?.includes('Basic')?'Basic':d.subtypes?.includes('Stage 1')?'Stage1':d.subtypes?.includes('Stage 2')?'Stage2':undefined,hp:Number(d.hp)||undefined,types:d.types,attacks:(d.attacks||[]).map(a=>({name:a.name,cost:a.cost,damage:a.damage,effect:a.text})),abilities:(d.abilities||[]).map(a=>({name:a.name,type:a.type,effect:a.text})),effect:d.rules?.join('\n'),subtypes:d.subtypes,energyType:d.subtypes?.includes('Basic')&&d.supertype==='Energy'?'Normal':'Special',evolveFrom:d.evolvesFrom,ptcgoCode:code,number:d.number};
  const potential=variants[norm(code)+'|'+number.toLowerCase().replace(/^0+(?=\d)/,'')]||[];
  const found=potential.find(x=>norm(x.name)===norm(d?.name||c.name));
  if(found&&!unsafeNames.has(found.fullName))mapping[c.id]=found.fullName;
}
// Explicit verified WOTC printings take precedence over upstream number aliases.
const indexIds=new Set(cards.map(c=>c.id));for(const c of upstream)if(c._wotcId&&indexIds.has(c._wotcId))mapping[c._wotcId]=c.fullName;
// The EX compiler owns availability during this pass. A legacy catalog match
// must not re-enable a printing whose full clauses remain explicitly pending.
const exCoverageFile=path.join(ui,'ex-coverage.json');if(fs.existsSync(exCoverageFile))for(const pending of JSON.parse(fs.readFileSync(exCoverageFile,'utf8')).unsupported||[])delete mapping[pending.id];
const bwCoverageFile=path.join(ui,'bw-coverage.json');if(fs.existsSync(bwCoverageFile))for(const pending of JSON.parse(fs.readFileSync(bwCoverageFile,'utf8')).unsupported||[])delete mapping[pending.id];
const hgssCoverageFile=path.join(ui,'hgss-coverage.json');if(fs.existsSync(hgssCoverageFile))for(const pending of JSON.parse(fs.readFileSync(hgssCoverageFile,'utf8')).unsupported||[])delete mapping[pending.id];
const dpCoverageFile=path.join(ui,'dp-coverage.json');if(fs.existsSync(dpCoverageFile))for(const pending of JSON.parse(fs.readFileSync(dpCoverageFile,'utf8')).unsupported||[])delete mapping[pending.id];
const xyCoverageFile=path.join(ui,'xy-coverage.json');if(fs.existsSync(xyCoverageFile))for(const pending of JSON.parse(fs.readFileSync(xyCoverageFile,'utf8')).unsupported||[])delete mapping[pending.id];
const swshCoverageFile=path.join(ui,'swsh-coverage.json');if(fs.existsSync(swshCoverageFile))for(const pending of JSON.parse(fs.readFileSync(swshCoverageFile,'utf8')).unsupported||[])delete mapping[pending.id];
const smCoverageFile=path.join(ui,'sm-coverage.json');if(fs.existsSync(smCoverageFile))for(const pending of JSON.parse(fs.readFileSync(smCoverageFile,'utf8')).unsupported||[])delete mapping[pending.id];
fs.writeFileSync(path.join(ui,'card-details.json'),JSON.stringify(metadata));
fs.writeFileSync(path.join(ui,'deck-set-codes.json'),JSON.stringify(codes));
fs.writeFileSync(path.join(ui,'rules-card-map.json'),JSON.stringify(mapping));
fs.writeFileSync(path.join(ui,'rules-coverage.json'),JSON.stringify({mappedPrintings:Object.keys(mapping).length,totalScans:cards.length,knownIncompleteTemplates:[...unsafeNames].sort(),unsupported:cards.filter(c=>!mapping[c.id]).map(c=>({id:c.id,name:c.name})),note:'Mappings indicate available implementations, not certification of every interaction. Known TODO templates and inherited reprints are excluded.'},null,2));
fs.writeFileSync(path.join(root,'work/rules-research/engine-catalog.json'),JSON.stringify(unique.map(c=>({name:c.name,set:c.set,number:c.setNumber,fullName:c.fullName,superType:c.superType,stage:c.stage,hp:c.hp,attacks:c.attacks,powers:c.powers})),null,2));
console.log(JSON.stringify({upstreamCards:unique.length,mappedPrintings:Object.keys(mapping).length,offlineMetadata:Object.keys(metadata).length,examples:Object.entries(mapping).slice(0,8)}));
