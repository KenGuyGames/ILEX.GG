from pathlib import Path
import shutil
root=Path('work');src=root/'pocket-candidate/ui';dst=root/'pocket-desktop-candidate/resources/app/ui'
for name in ['pocket-engine.js','pocket-model.js','pocket-ui.js','pocket-cards.json','pocket-sets.json','pocket.css']:
 shutil.copy2(src/name,dst/name)
p=root/'pocket-research/run-native.cjs';s=p.read_text().replace("native-v1","native-v2");p.write_text(s)
p=root/'pocket-research/native-self-test.cjs';s=p.read_text().replace(" await run(\"PocketUI.go('packs')\");", " fs.writeFileSync(path.join(dir,'pocket-battle.png'),(await win.webContents.capturePage()).toPNG());\n await run(\"PocketUI.go('packs')\");");s=s.replace(" check(await run('(async()=>{const i=document.querySelector", " fs.writeFileSync(path.join(dir,'pocket-packs.png'),(await win.webContents.capturePage()).toPNG());\n check(await run('(async()=>{const i=document.querySelector");p.write_text(s)
shutil.copy2(p,root/'pocket-desktop-candidate/resources/app/self-test.cjs')
