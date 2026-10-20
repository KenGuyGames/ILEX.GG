from pathlib import Path
import json
root=Path.cwd();ui=root/'work/cube-candidate/ui';p=ui/'cube-presets.json';cubes=json.loads(p.read_text(encoding='utf-8'));c=cubes[0];details=json.loads((ui/'card-details.json').read_text(encoding='utf-8'));rules=json.loads((ui/'rules-card-map.json').read_text(encoding='utf-8'))
fix={'Pokemon:E31':'ex7-44','Pokemon:I33':'ex7-65','Pokemon:I34':'pop9-2','Pokemon:K33':'ex3-92','Pokemon:Q29':'pl1-47','Pokemon:Q46':'basep-3','Pokemon:X7':'swsh5-85','Pokemon:Z27':'ex7-31','Pokemon:AA25':'ex7-15','Pokemon:AG39':'basep-31','TSSSpecial Energy:F16':'base3-58','TSSSpecial Energy:F28':'gym2-121'}
for e in c['entries']:
 if e['key'] in fix:
  i=fix[e['key']];assert i in details and i in rules;print(e['name'],'=>',i,details[i]['name']);e.update(id=i,resolution='Default Battle Styles printing; editable' if e['key']=='Pokemon:X7' else 'Reviewed workbook scan printing')
c['version']=2;c['printingRevision']=2
assert all(e.get('id') in rules for e in c['entries'])
p.write_text(json.dumps(cubes,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
p=root/'work/cube-review/printing-overrides.json';d=json.loads(p.read_text(encoding='utf-8'));d.update(fix);p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
p=ui/'cube-library.js';s=p.read_text(encoding='utf-8');s=s.replace('function printing(remote,map,metadata){',"function printingName(s){return norm(String(s||'').replace(/\\s*(?:[★☆*]|(?:Gold\\s*)?Star)\\s*$/i,''));}\n function printing(remote,map,metadata){")
s=s.replace('norm(metadata[raw]?.name)===norm(remote.card_Name||remote.name)','printingName(metadata[raw]?.name)===printingName(remote.card_Name||remote.name)').replace('norm(d.name)===norm(remote.card_Name||remote.name)','printingName(d.name)===printingName(remote.card_Name||remote.name)')
needle=' function deckIssues('
i=s.index(needle)
repair=''' function repairPrintings(cube,preset,map,metadata){
  if(!Array.isArray(cube?.entries))return 0;let repaired=0;
  const zander=cube.id==='zanders-cube'||cube.source?.kind==='workbook'&&norm(cube.source?.name)===norm('Zander’s Cube.xlsx');
  for(const entry of cube.entries){
   if(entry.id&&Object.hasOwn(map,entry.id))continue;
   if(/custom|user-selected/i.test(entry.resolution||''))continue;
   let id=null;
   if(zander){const source=preset.entries.find(e=>e.key===entry.key&&norm(e.name)===norm(entry.name))||preset.entries.find(e=>norm(e.name)===norm(entry.name));if(source?.id&&Object.hasOwn(map,source.id))id=source.id;}
   if(!id&&entry.sourceId)id=printing({card_ID:entry.sourceId,card_Name:entry.name},map,metadata);
   if(!id&&/greninja\\s*(?:[★☆*]|(?:gold\\s*)?star)/i.test(entry.name||'')&&/SWSH144/i.test([entry.name,entry.sourceId,entry.sourceUrl].join(' '))&&Object.hasOwn(map,'swshp-SWSH144'))id='swshp-SWSH144';
   if(id){entry.id=id;entry.resolution='Repaired printing link';repaired++;}
  }
  if(repaired){cube.printingRevision=2;cube.version=(cube.version||1)+1;}return repaired;
 }
'''
s=s[:i]+repair+s[i:];s=s.replace('defaults,rules,link,printing,fromKoga,','defaults,rules,link,printing,repairPrintings,fromKoga,');p.write_text(s,encoding='utf-8')
p=ui/'cube-ui.js';s=p.read_text(encoding='utf-8');s=s.replace('state.cubeDrafts??=[];return state.cubes;',"state.cubeDrafts??=[];let repaired=0;for(const c of [...state.cubes,...(state.deletedCubes||[]).map(x=>x.cube)])repaired+=CubeLibrary.repairPrintings(c,presets[0],ruleMap,cardMetadata);if(repaired)save();return state.cubes;")
p.write_text(s,encoding='utf-8')
