from pathlib import Path
import json,hashlib,shutil,zipfile,os,re
from reuse_zip_entries import rewrite
root=Path(__file__).resolve().parents[2];work=root/'work/cube-aliases';candidate=root/'work/cube-candidate';ui=candidate/'ui';dest=root/'outputs/ILEX.GG-1.22.0';shared=root/'outputs/ILEX.GG-win32-x64';files=['cube-library.js']
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
 return h.hexdigest()
hashes={n:sha(ui/n) for n in files};unit=read(work/'tests.json');fresh=read(work/'native/fresh-tests.json');restored=read(work/'native/restored-tests.json');mobile=read(work/'mobile-tests.json');android=read(candidate/'android-verification.json');build=read(candidate/'android-build.json');baseline=read(root/'work/rules-research/cube-release.json')
assert all(x['passed'] for x in [unit,fresh,restored,mobile,android])
for proof in [unit,fresh,restored,mobile]:
 for n,h in proof['hashes'].items():assert sha(ui/n)==h,n
for n in ['rules-engine.js','rules-match.js','bot-ai.js','card-actions.js']:assert sha(ui/n)==baseline['hashes'][n],n
assert 'android.37' in (candidate/'AndroidManifest.xml').read_text(encoding='utf-8');assert sha(candidate/'ILEX.GG-Android.apk')==android['sha256']==build['sha256']
for base in [dest,shared]:
 for n in files:assert sha(base/'resources/app/ui'/n)==sha(work/(Path(n).stem+'-before'+Path(n).suffix)),n
report={'passed':True,'feature':'CubeKoga Classic Collection Umbreon alias and reviewed Delta supplied definitions','hashes':hashes,'savedCube':{'cards':fresh['data']['count'],'unresolved':len(fresh['data']['missing']),'reported':fresh['data']['reported'],'unrelatedStatePreserved':True},'focusedChecks':len(unit['checks']),'mobileChecks':len(mobile['checks']),'android':build,'androidStaticChecks':len(android['checks']),'engineUnchanged':baseline['hashes']['rules-engine.js'],'limits':['Umbreon Celebrations alias uses equivalent original POP5 printing/rules in the local library.','Arbitrary or mismatched custom definitions still require review.','Physical Android acceptance remains pending.','Live desktop network acceptance remains unverified; public source schema observed in browser.']}
audit=dest/'resources/app/validation/cube-aliases';source=dest/'resources/app/card-effect-sources/cube-aliases';audit.mkdir(parents=True,exist_ok=True);source.mkdir(parents=True,exist_ok=True)
for n,p in [('unit.json',work/'tests.json'),('fresh.json',work/'native/fresh-tests.json'),('restored.json',work/'native/restored-tests.json'),('mobile.json',work/'mobile-tests.json'),('cube-effects.json',candidate/'tests.json'),('import.json',candidate/'import-tests.json'),('android.json',candidate/'android-verification.json')]:shutil.copy2(p,audit/n)
for p in [work/'tests.cjs',work/'saved-self-test.cjs',work/'mobile-tests.cjs',work/'public-supplied-rows.json',root/'work/cube-review/printing-overrides.json',Path(__file__)]:shutil.copy2(p,source/p.name)
(audit/'release.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
for n in files:shutil.copy2(ui/n,dest/'resources/app/ui'/n)
p=dest/'studio-ui-manifest.json';d=read(p);d.update(hashes);p.write_text(json.dumps(d,indent=2),encoding='utf-8');p=dest/'desktop-verification.json';d=read(p);d['cubePrintingPatch']=report;p.write_text(json.dumps(d,indent=2),encoding='utf-8')
p=dest/'README.md';s=p.read_text(encoding='utf-8');s+='\n\nCubeKoga alias repair: Umbreon Star cel25c-17_A now maps to the equivalent POP5-17 local printing. Starmie Delta ex11-15 and Mewtwo Delta ex11-12 supplied-definition records match their standard printed stats/costs/effects and are playable. Startup repairs the three flagged records in the saved Zander CubeKoga import; altered/custom definitions remain for review. Isolated actual saved-library tests show712 cards and zero unresolved, with unrelated saved data preserved. Android now1.22.0-android.37/code37, original certificate.\n';p.write_text(s,encoding='utf-8')
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
apk=root/'outputs/ILEX.GG-1.22.0-Android.apk';prior=work/'Android-code36.apk'
if not prior.exists():shutil.copy2(apk,prior)
for target in [apk,root/'outputs/ILEX.GG-Android.apk']:shutil.copy2(candidate/'ILEX.GG-Android.apk',target)
shutil.copy2(candidate/'android-verification.json',root/'outputs/ILEX.GG-Android-verification.json');shutil.copy2(dest/'README.md',root/'outputs/ILEX.GG-Cube-Update.txt')
for n,h in hashes.items():assert sha(shared/'resources/app/ui'/n)==h
report['archives']=archives;(root/'work/rules-research/cube-aliases-fix.json').write_text(json.dumps(report,indent=2),encoding='utf-8');(work/'release.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('Imported cube aliases delivered, including Android37.',flush=True)
