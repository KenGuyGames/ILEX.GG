"""Archive current effect source without replacing the validated candidate UI."""
import pathlib,json,shutil,hashlib
root=pathlib.Path(__file__).resolve().parents[2];src=root/'work/rules-research/twinleafgg-main/ptcg-server/src';app=root/'work/sv-desktop-candidate/resources/app';archive=app/'card-effect-sources'
archive.mkdir(parents=True,exist_ok=True)
prior=root/'outputs/ILEX.GG-win32-x64/resources/app/card-effect-sources'
shutil.copytree(prior,archive,dirs_exist_ok=True)
files={}
for f in src.rglob('*.ts'):
 if 'node_modules' not in f.parts:files[f.relative_to(src).as_posix()]=f
for f in (root/'work/desktop-build').glob('sv-*'):
 if f.is_file():files['sv-tools/'+f.name]=f
for name in ['stage-sv-sources.py','package-sv.py','brand-sv.cjs','publish-android-sv.py']:
 f=root/'work/desktop-build'/name
 if f.exists():files['sv-tools/'+name]=f
for f in (root/'work/rules-research').glob('sv-*.json'):
 if any(s in f.name for s in ['candidate-data','provenance','supplement','source-validation']):files['printed-sv/'+f.name]=f
for name in ['SV-PROGRESS.md','SV-RULES-SOURCES.md']:files[name]=root/'work/rules-research'/name
for name in ['sv-native-tests.js','sv-self-test.cjs']:files['sv-tools/'+name]=root/'work/desktop'/name
for name in ['build.py','verify.py','MainActivity.java','mobile.js','mobile-host.js','mobile-compat.js','mobile.css','mobile-landscape.css','launcher-icon.xml']:
 files['android-sv/'+name]=root/'work/android-build'/name
files['android-sv/AndroidManifest.xml']=root/'work/sv-candidate/AndroidManifest.xml'
files['android-sv/extra-scans.txt']=root/'work/sv-candidate/android-extra-scans.txt'
for name,f in files.items():
 target=archive/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,target)
sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
entries=[{'path':f.relative_to(archive).as_posix(),'sha256':sha(f)} for f in sorted(archive.rglob('*')) if f.is_file() and f.name!='sv-source-manifest.json']
manifest={'engineSha256':sha(app/'ui/rules-engine.js'),'scope':'3694 SV printings; BW onward; Unlimited deferred','files':entries}
(archive/'sv-source-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8');print(json.dumps({'files':len(entries),'engineSha256':manifest['engineSha256']}))
