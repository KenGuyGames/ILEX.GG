from pathlib import Path
p=Path('work/cube-candidate/ui/cube-ui.js');s=p.read_text(encoding='utf-8').replace("c.notes=String(c.notes||'').slice(0,30000);state.cubes.push(c);", "c.notes=String(c.notes||'').slice(0,30000);CubeLibrary.repairPrintings(c,cubeBuiltins[0],ruleMap,cardMetadata);state.cubes.push(c);");p.write_text(s,encoding='utf-8')
