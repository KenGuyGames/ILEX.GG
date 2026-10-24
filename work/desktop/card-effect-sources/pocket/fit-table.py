from pathlib import Path
import shutil
r=Path('work');p=r/'pocket-candidate/ui/pocket-ui.js';s=p.read_text().replace('  scheduleBot();\n }','  requestAnimationFrame(fitTable);scheduleBot();\n }');i=s.index(' function playerView(');s=s[:i]+''' function fitTable(){if(tab!=='pocket'||section!=='battle')return;const table=document.querySelector('.pocket-table');if(table)table.style.height=Math.max(120,innerHeight-table.getBoundingClientRect().top-12)+'px';}
 window.addEventListener('resize',()=>requestAnimationFrame(fitTable));
''' +s[i:];p.write_text(s);shutil.copy2(p,r/'pocket-desktop-candidate/resources/app/ui/pocket-ui.js');p=r/'pocket-research/run-native.cjs';p.write_text(p.read_text().replace('native-v4','native-v5'))
