from pathlib import Path
import json,hashlib,shutil,zipfile,os,re
from reuse_zip_entries import rewrite
root=Path(__file__).resolve().parents[2];work=root/'work/cube-draft-delete';patch=work;candidate=root/'work/cube-candidate';ui=candidate/'ui';dest=root/'outputs/ILEX.GG-1.22.0';shared=root/'outputs/ILEX.GG-win32-x64';files=['cube-ui.js']
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
 return h.hexdigest()
hashes={n:sha(ui/n) for n in files};fresh=read(work/'native/fresh-tests.json');restored=read(work/'native/restored-tests.json');mobile=read(work/'mobile-tests.json');android=read(candidate/'android-verification.json');build=read(candidate/'android-build.json');prior=read(root/'work/rules-research/cube-x-attack-text-fix.json')
for proof in [fresh,restored,mobile,android]:assert proof['passed']
for proof in [fresh,restored,mobile]:
 for n,h in proof['hashes'].items():assert sha(ui/n)==h,n
for n in ['rules-engine.js','card-details.json']:assert sha(ui/n)==prior['hashes'][n]
for base in [dest,shared]:assert sha(base/'resources/app/ui/cube-ui.js')==sha(work/'cube-ui-before.js')
assert 'android.40' in (candidate/'AndroidManifest.xml').read_text();assert sha(candidate/'ILEX.GG-Android.apk')==android['sha256']==build['sha256']
report={'passed':True,'feature':'Delete and restore individual saved cube drafts','hashes':hashes,'freshChecks':len(fresh['checks']),'restoredChecks':len(restored['checks']),'touchChecks':len(mobile['checks']),'android':build,'androidStaticChecks':len(android['checks']),'engineUnchanged':prior['hashes']['rules-engine.js'],'limits':['Deleting a draft keeps its drafted decks, format, cube and current match.','Draft deletion is recoverable within its cube.','Physical Android acceptance remains pending.']}
audit=dest/'resources/app/validation/cube-draft-delete';source=dest/'resources/app/card-effect-sources/cube-draft-delete';audit.mkdir(parents=True,exist_ok=True);source.mkdir(parents=True,exist_ok=True)
for n,p in [('fresh.json',work/'native/fresh-tests.json'),('restored.json',work/'native/restored-tests.json'),('mobile.json',work/'mobile-tests.json'),('android.json',candidate/'android-verification.json')]:shutil.copy2(p,audit/n)
for p in [work/'native-self-test.cjs',work/'mobile-tests.cjs',Path(__file__)]:shutil.copy2(p,source/p.name)
(audit/'release.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
for n in files:shutil.copy2(ui/n,dest/'resources/app/ui'/n)
p=dest/'studio-ui-manifest.json';d=read(p);d.update(hashes);p.write_text(json.dumps(d,indent=2),encoding='utf-8');p=dest/'desktop-verification.json';d=read(p);d['draftDeletePatch']=report;p.write_text(json.dumps(d,indent=2),encoding='utf-8')
p=dest/'README.md';s=p.read_text(encoding='utf-8');s+='\n\nSaved cube drafts: select a saved draft and choose Delete draft, then confirm. Works for active and completed drafts. Cube, drafted decks, formats and current match stay intact. Restore deleted draft restores the most recently deleted draft of the selected cube, including its exact picks and packs; deletion and recovery survive restart. Android1.22.0-android.40/code40 retains the original certificate.\n';p.write_text(s,encoding='utf-8')
relative=['resources/app/ui/'+n for n in files]+['studio-ui-manifest.json','desktop-verification.json','README.md']+[p.relative_to(dest).as_posix() for folder in [audit,source] for p in folder.rglob('*') if p.is_file()];changed={n:dest/n for n in relative};prefix='ILEX.GG-win32-x64/';archives=[]
for label in ['Windows','Windows-Offline']:
 target=root/'outputs'/('ILEX.GG-1.22.0-'+label+'.zip');pending=target.with_suffix('.printings-pending.zip')
 with zipfile.ZipFile(target) as z:names=set(z.namelist())
 print('Updating '+label,flush=True);rewrite(target,pending,{prefix+n:p for n,p in changed.items() if prefix+n in names},{prefix+n:p for n,p in changed.items() if prefix+n not in names})
 with zipfile.ZipFile(pending) as z:
  assert z.testzip() is None
  for n,p in changed.items():assert hashlib.sha256(z.read(prefix+n)).hexdigest()==sha(p)
 os.replace(pending,target);archives.append({'file':str(target),'sha256':sha(target),'crcPassed':True});print('Verified '+label,flush=True)
for n,p in changed.items():
 target=shared/n;target.parent.mkdir(parents=True,exist_ok=True);temp=target.with_name(target.name+'.printings-pending');shutil.copy2(p,temp);os.replace(temp,target)
for label in ['Windows','Windows-Offline']:
 src=root/'outputs'/('ILEX.GG-1.22.0-'+label+'.zip');target=root/'outputs'/('ILEX.GG-'+label+'.zip');temp=target.with_suffix('.printings-pending.zip');shutil.copy2(src,temp);os.replace(temp,target)
apk=root/'outputs/ILEX.GG-1.22.0-Android.apk';prior=patch/'Android-code39.apk'
if not prior.exists():shutil.copy2(apk,prior)
for target in [apk,root/'outputs/ILEX.GG-Android.apk']:shutil.copy2(candidate/'ILEX.GG-Android.apk',target)
shutil.copy2(candidate/'android-verification.json',root/'outputs/ILEX.GG-Android-verification.json');shutil.copy2(dest/'README.md',root/'outputs/ILEX.GG-Cube-Update.txt')
for n,h in hashes.items():assert sha(shared/'resources/app/ui'/n)==h
report['archives']=archives;(root/'work/rules-research/cube-draft-delete-release.json').write_text(json.dumps(report,indent=2),encoding='utf-8');(patch/'release.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('Draft deletion delivered, including Android40.',flush=True)
