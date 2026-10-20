from pathlib import Path
import json,os,shutil
root=Path(__file__).resolve().parents[2];base=root/'work/mega-desktop-candidate';target=root/'work/unlimited-desktop-candidate'
def copy(src,dst):
 src=Path(src);dst=Path(dst)
 if src.is_relative_to(base/'resources/scans'):
  if not dst.exists():
   try:os.link(src,dst)
   except OSError:shutil.copy2(src,dst)
 else:shutil.copy2(src,dst)
 return str(dst)
shutil.copytree(base,target,dirs_exist_ok=True,copy_function=copy)
app=target/'resources/app';shutil.copytree(root/'work/unlimited-candidate/ui',app/'ui',dirs_exist_ok=True)
for n in ['unlimited-self-test.cjs','unlimited-native-tests.js']:shutil.copy2(root/'work/desktop'/n,app/n)
p=json.loads((app/'package.json').read_text(encoding='utf-8'));p['version']='1.20.0';(app/'package.json').write_text(json.dumps(p,indent=2),encoding='utf-8')
(app/'self-test.cjs').write_text("module.exports=require('./unlimited-self-test.cjs');\n",encoding='utf-8')
print('Isolated Unlimited desktop staged; immutable scans linked; released app unchanged.',flush=True)
