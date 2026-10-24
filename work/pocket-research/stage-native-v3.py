from pathlib import Path
import shutil
r=Path('work');p=r/'pocket-research/native-self-test.cjs';s=p.read_text();i=s.index(" fs.writeFileSync(path.join(dir,'pocket-battle.png')")
s=s[:i]+''' for(const [w,h] of [[1440,960],[1280,720],[800,450],[640,360]]){win.setContentSize(w,h);await new Promise(r=>setTimeout(r,100));check(await run('(()=>{const t=document.querySelector(".pocket-table").getBoundingClientRect();return t.bottom<=innerHeight+1&&t.left>=0&&t.right<=innerWidth+1})()'),'Pocket full table fits '+w+'x'+h);fs.writeFileSync(path.join(dir,'pocket-battle-'+w+'x'+h+'.png'),(await win.webContents.capturePage()).toPNG());}win.setContentSize(1440,960);await new Promise(r=>setTimeout(r,100));
''' +s[i:];p.write_text(s)
for name in ['pocket-engine.js','pocket-model.js','pocket-ui.js','pocket-cards.json','pocket-sets.json','pocket.css','audio.js','presentation.js']:
 shutil.copy2(r/'pocket-candidate/ui'/name,r/'pocket-desktop-candidate/resources/app/ui'/name)
shutil.copy2(p,r/'pocket-desktop-candidate/resources/app/self-test.cjs')
p=r/'pocket-research/run-native.cjs';p.write_text(p.read_text().replace('native-v2','native-v3'))
