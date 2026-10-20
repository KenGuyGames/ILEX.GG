from pathlib import Path
p=Path('work/cube-candidate/ui/cube-library.js');s=p.read_text(encoding='utf-8')
i=s.index(' function active(')
s=s[:i]+''' function isZander(cube){return cube?.id==='zanders-cube'||cube?.source?.kind==='cubekoga'&&/\\/cube\\/(?:ZandersCubeAndEXpansion|279)\\/?$/i.test(cube.source.url||'')||cube?.source?.kind==='workbook'&&norm(cube.source.name)===norm('Zander’s Cube.xlsx');}
 function isExpansion(entry,metadata){const d=metadata[entry.id];return ['Pokemon','Pokémon'].includes(d?.category)&&(/(?:-EX|-GX| V(?:MAX|STAR|-UNION)?)(?:$|\\s)/.test(d.name)||(d.subtypes||[]).some(t=>['EX','GX','V','VMAX','VSTAR','V-UNION'].includes(t)));}
 function repairDrafting(cube,metadata){if(!isZander(cube)||cube.seededExpansionRevision===1)return 0;cube.rules=rules({...cube.rules,packMode:'seeded',packSize:16,basicsPerPack:5,evolutionsPerPack:5,trainersPerPack:6});for(const e of cube.entries||[])if(e.section==='Active cube'&&e.pool==='Core'&&isExpansion(e,metadata))e.pool='EXpansion';cube.seededExpansionRevision=1;return 1;}
 function legacyDraft(cube,d,metadata){return isZander(cube)&&(d.rules.packMode!=='seeded'||d.rules.basicsPerPack!==5||d.rules.evolutionsPerPack!==5||d.rules.trainersPerPack!==6||d.rounds.some(r=>r.packs.some(p=>p.some(e=>isExpansion(e,metadata)))));}
''' +s[i:]
s=s.replace("return {id:'cube-'+crypto.randomUUID(),name:String(meta.cube_Name", "const cube={id:'cube-'+crypto.randomUUID(),name:String(meta.cube_Name")
s=s.replace("notes:String(meta.overview||'').slice(0,30000)};}","notes:String(meta.overview||'').slice(0,30000)};repairDrafting(cube,metadata);return cube;}")
s=s.replace("return (e.stage||d.stage)==='Basic'?'basics':'evolutions'", "return d.stage==='Basic'?'basics':'evolutions'")
s=s.replace("function createDraft(cube,options,metadata){const r=", "function createDraft(cube,options,metadata){repairDrafting(cube,metadata);const r=")
s=s.replace("for(const e of active(cube,expansion)){if(!e.id)", "for(const e of active(cube,expansion)){const d=metadata[e.id],separate=isZander(cube)&&isExpansion(e,metadata);if(separate&&!expansion)continue;if(r.packMode==='seeded'&&d?.category==='Energy'&&['Normal','Basic'].includes(d.energyType))continue;if(!e.id)")
s=s.replace("pools[e.pool==='EXpansion'?'expansion'", "pools[e.pool==='EXpansion'||separate?'expansion'")
s=s.replace("id:'draft-'+crypto.randomUUID(),cubeId:","id:'draft-'+crypto.randomUUID(),seededExpansionRevision:cube.seededExpansionRevision||0,cubeId:")
s=s.replace('printing,suppliedStandard,repairPrintings,fromKoga,','printing,suppliedStandard,repairPrintings,repairDrafting,isZander,isExpansion,legacyDraft,fromKoga,')
p.write_text(s,encoding='utf-8')
p=Path('work/cube-candidate/ui/cube-ui.js');s=p.read_text(encoding='utf-8');s=s.replace("repaired+=CubeLibrary.repairPrintings(c,presets[0],ruleMap,cardMetadata);", "{repaired+=CubeLibrary.repairPrintings(c,presets[0],ruleMap,cardMetadata);repaired+=CubeLibrary.repairDrafting(c,cardMetadata);}")
s=s.replace('CubeLibrary.repairPrintings(c,cubeBuiltins[0],ruleMap,cardMetadata);state.cubes.push(c);','CubeLibrary.repairPrintings(c,cubeBuiltins[0],ruleMap,cardMetadata);CubeLibrary.repairDrafting(c,cardMetadata);state.cubes.push(c);')
s=s.replace('function cubeDraftView(d){if(d.complete)',"function cubeDraftViewOriginal(d){if(d.complete)")
s+="\nfunction cubeDraftView(d){const c=state.cubes.find(c=>c.id===d.cubeId),notice=CubeLibrary.legacyDraft(c,d,cardMetadata)?'<p class=\"cube-notice\">This saved draft uses the earlier pack settings. Start a new draft for 5 Basics, 5 Evolutions and 6 Trainers / Special Energy, with EXpansion cards kept separate.</p>':'';return notice+cubeDraftViewOriginal(d);}\n"
p.write_text(s,encoding='utf-8')
