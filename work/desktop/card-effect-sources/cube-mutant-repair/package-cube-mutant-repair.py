from pathlib import Path
import json,hashlib,shutil,zipfile,os,re
from reuse_zip_entries import rewrite
root=Path(__file__).resolve().parents[2];work=root/'work/cube-mutant-repair';patch=work;candidate=root/'work/cube-candidate';ui=candidate/'ui';dest=root/'outputs/ILEX.GG-1.22.0';shared=root/'outputs/ILEX.GG-win32-x64';files=['rules-engine.js']
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
assert sha(ui/'card-details.json')==prior['hashes']['card-details.json']
for base in [dest,shared]:assert sha(base/'resources/app/ui/rules-engine.js')==sha(work/'rules-engine-before.js')
assert 'android.41' in (candidate/'AndroidManifest.xml').read_text();assert sha(candidate/'ILEX.GG-Android.apk')==android['sha256']==build['sha256']
report={'passed':True,'feature':'Shared mutant evolution searches for Solar Evolution, Surprise Time Machine, Pupate, Emerge and Wally Training','hashes':hashes,'freshChecks':len(fresh['checks']),'restoredChecks':len(restored['checks']),'touchChecks':len(mobile['checks']),'android':build,'androidStaticChecks':len(android['checks']),'previousEngine':prior['hashes']['rules-engine.js'],'focusedChecks':len(read(work/'tests.json')['checks']),'cubeChecks':len(read(candidate/'tests.json')['checks']),'limits':['Repairs cover five evolution effects and shared helper, not an exhaustive review of all evolution-related cards.','Physical Android acceptance remains pending.']}
audit=dest/'resources/app/validation/cube-mutant-repair';source=dest/'resources/app/card-effect-sources/cube-mutant-repair';audit.mkdir(parents=True,exist_ok=True);source.mkdir(parents=True,exist_ok=True)
for n,p in [('focused.json',work/'tests.json'),('fresh.json',work/'native/fresh-tests.json'),('restored.json',work/'native/restored-tests.json'),('mobile.json',work/'mobile-tests.json'),('android.json',candidate/'android-verification.json')]:shutil.copy2(p,audit/n)
for p in [work/'native-self-test.cjs',work/'mobile-tests.cjs',work/'tests.cjs',work/'browser-checks.js',Path(__file__)]:shutil.copy2(p,source/p.name)
for rel in ['tcg-lab-evolution-search.ts','sets/09-sword-and-shield/set-evolving-skies/skiploom.ts','sets/03-ex-ruby-and-sapphire/set-ex-team-rocket-returns/surprise-time-machine.ts','sets/08-sun-and-moon/set-unbroken-bonds/caterpie.ts','sets/08-sun-and-moon/set-unbroken-bonds/metapod.ts','sets/03-ex-ruby-and-sapphire/set-ex-sandstorm/wallys-training.ts']:shutil.copy2(root/'work/cube-source/src'/rel,source/Path(rel).name)
(audit/'release.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
for n in files:shutil.copy2(ui/n,dest/'resources/app/ui'/n)
p=dest/'studio-ui-manifest.json';d=read(p);d.update(hashes);p.write_text(json.dumps(d,indent=2),encoding='utf-8');p=dest/'desktop-verification.json';d=read(p);d['mutantEvolutionPatch']=report;p.write_text(json.dumps(d,indent=2),encoding='utf-8')
p=dest/'README.md';s=p.read_text(encoding='utf-8');s+='\n\nMutant evolution repair: Solar Evolution (Skiploom), Surprise! Time Machine, Pupate, Emerge and Wally Training use shared same-type/stage/Prize eligibility in cube matches. Time Machine reads actual remaining Pokemon rather than attached Energy. Searches route evolution through normal evolution events and cleanup. Ordinary family matching remains outside mutant rules. Core-only seeded drafts, draft deletion and X Attack retained. Android1.22.0-android.41/code41, original certificate.\n';p.write_text(s,encoding='utf-8')
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
apk=root/'outputs/ILEX.GG-1.22.0-Android.apk';prior=patch/'Android-code40.apk'
if not prior.exists():shutil.copy2(apk,prior)
for target in [apk,root/'outputs/ILEX.GG-Android.apk']:shutil.copy2(candidate/'ILEX.GG-Android.apk',target)
shutil.copy2(candidate/'android-verification.json',root/'outputs/ILEX.GG-Android-verification.json');shutil.copy2(dest/'README.md',root/'outputs/ILEX.GG-Cube-Update.txt')
for n,h in hashes.items():assert sha(shared/'resources/app/ui'/n)==h
report['archives']=archives;(root/'work/rules-research/cube-mutant-repair-release.json').write_text(json.dumps(report,indent=2),encoding='utf-8');(patch/'release.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('Mutant evolution repair delivered, including Android41.',flush=True)
