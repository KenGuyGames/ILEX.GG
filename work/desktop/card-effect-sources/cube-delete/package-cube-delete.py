from pathlib import Path
import json,hashlib,shutil,zipfile,os
from reuse_zip_entries import rewrite
root=Path(__file__).resolve().parents[2];work=root/'work/cube-delete';candidate=root/'work/cube-candidate';ui=candidate/'ui';dest=root/'outputs/ILEX.GG-1.22.0';shared=root/'outputs/ILEX.GG-win32-x64'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
 return h.hexdigest()
old=sha(work/'cube-ui-before.js');new=sha(ui/'cube-ui.js');fresh=read(work/'native-final/fresh-tests.json');restored=read(work/'native-final/restored-tests.json');mobile=read(work/'mobile-tests.json');android=read(candidate/'android-verification.json');build=read(candidate/'android-build.json');baseline=read(root/'work/rules-research/cube-release.json')
assert all(x['passed'] for x in [fresh,restored,mobile,android])
assert fresh['hashes']['cube-ui.js']==restored['hashes']['cube-ui.js']==mobile['cubeUiSha256']==new
for n in ['rules-engine.js','rules-match.js','bot-ai.js','card-actions.js']:assert sha(ui/n)==baseline['hashes'][n],n
assert 'android.35' in (candidate/'AndroidManifest.xml').read_text(encoding='utf-8')
assert sha(candidate/'ILEX.GG-Android.apk')==android['sha256']==build['sha256']
for base in [dest,shared]:assert sha(base/'resources/app/ui/cube-ui.js')==old
report={'passed':True,'feature':'Delete cube and its drafted decks/drafts; recover together with Restore deleted cube','cubeUiBefore':old,'cubeUiSha256':new,'nativeChecks':[len(fresh['checks']),len(restored['checks'])],'mobileChecks':len(mobile['checks'])+sum(len(x['checks']) for x in mobile['proof']),'android':build,'androidStaticChecks':len(android['checks']),'engineUnchanged':baseline['hashes']['rules-engine.js'],'formatAndBotUnchanged':True,'limits':['Physical Android acceptance remains pending.','Prior full cube release tests retain original hashes; this patch has focused UI deletion/restore coverage.','CubeKoga live-network acceptance limitation from prior release remains.']}
audit=dest/'resources/app/validation/cube-delete';source=dest/'resources/app/card-effect-sources/cube-delete';audit.mkdir(parents=True,exist_ok=True);source.mkdir(parents=True,exist_ok=True)
for n in ['fresh','restored']:shutil.copy2(work/('native-final/'+n+'-tests.json'),audit/(n+'.json'))
for p in [work/'mobile-tests.json',candidate/'android-verification.json',candidate/'android-build.json']:shutil.copy2(p,audit/p.name)
for p in [work/'self-test.cjs',work/'mobile-tests.cjs',work/'workflow.js',Path(__file__)]:shutil.copy2(p,source/p.name)
(audit/'release.json').write_text(json.dumps(report,indent=2),encoding='utf-8');shutil.copy2(ui/'cube-ui.js',dest/'resources/app/ui/cube-ui.js')
manifest=read(dest/'studio-ui-manifest.json');manifest['cube-ui.js']=new;(dest/'studio-ui-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
verification=read(dest/'desktop-verification.json');verification['cubeDeletePatch']=report;(dest/'desktop-verification.json').write_text(json.dumps(verification,indent=2),encoding='utf-8')
notes='\n\nCube deletion update: Delete cube removes the selected cube, its saved drafts and its drafted decks. Cancel leaves everything intact; Restore deleted cube returns those items together, including after restart. Other cubes/decks and current matches are preserved. New cube and import remain available after deleting the last cube. Android now1.22.0-android.35/code35, original certificate. Focused desktop and touch checks passed; prior full release evidence retains its actual hashes.\n'
with (dest/'README.md').open('a',encoding='utf-8') as f:f.write(notes)
relative=['resources/app/ui/cube-ui.js','studio-ui-manifest.json','desktop-verification.json','README.md']+[p.relative_to(dest).as_posix() for folder in [audit,source] for p in folder.rglob('*') if p.is_file()];changed={n:dest/n for n in relative};prefix='ILEX.GG-win32-x64/';archives=[]
for label in ['Windows','Windows-Offline']:
 target=root/'outputs'/('ILEX.GG-1.22.0-'+label+'.zip');pending=target.with_suffix('.delete-pending.zip')
 with zipfile.ZipFile(target) as z:names=set(z.namelist())
 print('Updating '+label,flush=True);rewrite(target,pending,{prefix+n:p for n,p in changed.items() if prefix+n in names},{prefix+n:p for n,p in changed.items() if prefix+n not in names})
 with zipfile.ZipFile(pending) as z:
  assert z.testzip() is None
  for n,p in changed.items():assert hashlib.sha256(z.read(prefix+n)).hexdigest()==sha(p)
 os.replace(pending,target);archives.append({'file':str(target),'sha256':sha(target),'crcPassed':True});print('Verified '+label,flush=True)
for n,p in changed.items():
 target=shared/n;target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists() and n=='resources/app/ui/cube-ui.js':shutil.copy2(target,work/'released-cube-ui-before.js')
 temp=target.with_name(target.name+'.delete-pending');shutil.copy2(p,temp);os.replace(temp,target)
for label in ['Windows','Windows-Offline']:
 src=root/'outputs'/('ILEX.GG-1.22.0-'+label+'.zip');target=root/'outputs'/('ILEX.GG-'+label+'.zip');temp=target.with_suffix('.delete-pending.zip');shutil.copy2(src,temp);os.replace(temp,target)
apk=root/'outputs/ILEX.GG-1.22.0-Android.apk';prior=work/'Android-code34.apk'
if not prior.exists():shutil.copy2(apk,prior)
for target in [apk,root/'outputs/ILEX.GG-Android.apk']:shutil.copy2(candidate/'ILEX.GG-Android.apk',target)
shutil.copy2(candidate/'android-verification.json',root/'outputs/ILEX.GG-Android-verification.json')
assert sha(shared/'resources/app/ui/cube-ui.js')==new
report['archives']=archives;(root/'work/rules-research/cube-delete-fix.json').write_text(json.dumps(report,indent=2),encoding='utf-8');(work/'release.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('Cube deletion delivered to shared Windows app, both archives and signed Android35.',flush=True)
