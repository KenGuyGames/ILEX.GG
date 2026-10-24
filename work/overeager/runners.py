from pathlib import Path
import zipfile,shutil,re
here=Path(__file__).resolve().parent;root=Path(r'C:/Users/Kenneth/Documents/Codex/2026-10-11/b');prior=here.parent/'trump-computer'
for n in ['preload.cjs','regressions.cjs']:(here/n).write_bytes((prior/n).read_bytes())
with zipfile.ZipFile(root/'outputs/ILEX.GG-2.0.0-Android.apk') as z:
 for n in z.namelist():
  if n.startswith('assets/ui/') and not n.endswith('/'):
   p=here/'android-ui'/n[10:];p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(n))
for n in ['rules-engine.js','rules-match.js']:shutil.copy2(here/'ui'/n,here/'android-ui'/n)
manifest=(root/'work/v2-candidate/AndroidManifest.xml').read_text(encoding='utf-8');manifest=re.sub(r'versionCode="\d+"','versionCode="80"',manifest);manifest=re.sub(r'versionName="[^"]+"','versionName="2.0.0-android.80"',manifest);(here/'AndroidManifest.xml').write_text(manifest,encoding='utf-8')
s=(root/'work/repeat-energy/build-android.cjs').read_text(encoding='utf-8').replace("path.resolve(__dirname,'../..')",repr(str(root))).replace('work/repeat-energy/','../../2026-10-18/us/work/overeager/').replace("path.join(folder,'AndroidManifest.xml')",repr(str(here/'AndroidManifest.xml'))).replace("'79'","'80'").replace('android.79','android.80')
(here/'build-android.cjs').write_text(s,encoding='utf-8');shutil.copy2(root/'work/repeat-energy/build-prepared.py',here/'build-prepared.py')
# Serve the mobile-prepared build with the existing isolated Chromium runtime.
s=(prior/'android.cjs').read_text(encoding='utf-8');start=s.index('const runtime=');s="const fs=require('fs'),path=require('path'),cp=require('child_process'),here=__dirname,root='C:/Users/Kenneth/Documents/Codex/2026-10-11/b',android=path.join(root,'work/android-build');\nif(!process.argv.includes('--preview-only'))cp.execFileSync(process.execPath,[path.join(here,'build-android.cjs'),'--build-only'],{stdio:'inherit',windowsHide:true});\n"+s[start:];s=s.replace('Mobile paired Item UI','Mobile Overeager setup UI');(here/'android.cjs').write_text(s,encoding='utf-8')
