from pathlib import Path
import json,hashlib,shutil,zipfile,os,re
from reuse_zip_entries import rewrite
root=Path(__file__).resolve().parents[2];work=root/'work/cube-seeding';candidate=root/'work/cube-candidate';ui=candidate/'ui';dest=root/'outputs/ILEX.GG-1.22.0';shared=root/'outputs/ILEX.GG-win32-x64';files=['cube-library.js','cube-ui.js','rules-engine.js','rules-card-map.json','card-details.json','cards.json','cube-x-attack.webp']
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
 return h.hexdigest()
hashes={n:sha(ui/n) for n in files};unit=read(work/'tests.json');fresh=read(work/'native-v2/fresh-tests.json');restored=read(work/'native-v2/restored-tests.json');mobile=read(work/'mobile-tests.json');android=read(candidate/'android-verification.json');build=read(candidate/'android-build.json');baseline=read(root/'work/rules-research/cube-release.json')
assert all(x['passed'] for x in [unit,fresh,restored,mobile,android])
for proof in [unit,fresh,restored,mobile]:
 for n,h in proof['hashes'].items():assert sha(ui/n)==h,n
for n in ['rules-match.js','bot-ai.js','card-actions.js']:assert sha(ui/n)==baseline['hashes'][n],n
assert 'android.38' in (candidate/'AndroidManifest.xml').read_text(encoding='utf-8');assert sha(candidate/'ILEX.GG-Android.apk')==android['sha256']==build['sha256']
xproof=read(root/'work/cube-x-attack/tests.json');assert xproof['passed']
for n,h in xproof['hashes'].items():assert sha(ui/n)==h,n
assert sha(root/'work/cube-x-attack/engine-control.js')==sha(root/'work/cube-x-attack/rules-engine-before.js')==baseline['hashes']['rules-engine.js']
for base in [dest,shared]:
 for n in ['cube-library.js','cube-ui.js']:assert sha(base/'resources/app/ui'/n)==sha(work/(Path(n).stem+'-before'+Path(n).suffix)),n
 assert sha(base/'resources/app/ui/rules-engine.js')==baseline['hashes']['rules-engine.js']
report={'passed':True,'feature':'Exact seeded5/5/6 core-only drafts and CouncilCube X Attack custom Item','hashes':hashes,'seededPacksChecked':unit['seededPacksChecked'],'nativeChecksPerLaunch':len(fresh['checks']),'touchChecks':len(mobile['checks']),'xAttackChecks':len(xproof['checks']),'cubeChecks':len(read(candidate/'tests.json')['checks']),'android':build,'androidStaticChecks':len(android['checks']),'engineControlIdenticalToPrevious':True,'priorEngine':baseline['hashes']['rules-engine.js'],'limits':['Start a NEW draft to use corrected5/5/6 composition; old sessions retain picks.','X Attack uses Kenneth-selected one-use Item lifecycle, differing from printed Battle face-down text.','Physical Android acceptance remains pending.','Finite checks do not prove every interaction.']}
audit=dest/'resources/app/validation/cube-seeding-x-attack';source=dest/'resources/app/card-effect-sources/cube-seeding-x-attack';audit.mkdir(parents=True,exist_ok=True);source.mkdir(parents=True,exist_ok=True)
for n,p in [('unit.json',work/'tests.json'),('fresh.json',work/'native-v2/fresh-tests.json'),('restored.json',work/'native-v2/restored-tests.json'),('mobile.json',work/'mobile-tests.json'),('x-attack.json',root/'work/cube-x-attack/tests.json'),('cube-effects.json',candidate/'tests.json'),('import.json',candidate/'import-tests.json'),('android.json',candidate/'android-verification.json')]:shutil.copy2(p,audit/n)
for p in [work/'tests.cjs',work/'native-self-test.cjs',work/'mobile-tests.cjs',root/'work/cube-source/src/sets/set-council-customs.ts',Path(__file__)]:shutil.copy2(p,source/p.name)
shutil.copy2(root/'work/cube-x-attack/tests.cjs',source/'x-attack-tests.cjs')
(audit/'release.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
for n in files:shutil.copy2(ui/n,dest/'resources/app/ui'/n)
p=dest/'studio-ui-manifest.json';d=read(p);d.update(hashes);p.write_text(json.dumps(d,indent=2),encoding='utf-8');p=dest/'desktop-verification.json';d=read(p);d['cubeSeedingAndXAttackPatch']=report;p.write_text(json.dumps(d,indent=2),encoding='utf-8')
p=dest/'README.md';s=p.read_text(encoding='utf-8');s+='\n\nLatest cube update: EXpansion removed from new draft setup. Zander imports repair to640 core /72 excluded, seeded5 Basics +5 Evolutions +6 Trainers/Special Energy; Basic Energy excluded from seeded slots. Start a NEW draft; old sessions are preserved and display guidance. CouncilCube X Attack custom printing/artwork is bundled offline and links automatically; choose a Pokemon for +30 attack damage this turn, then discard the Item normally (Kenneth-selected lifecycle). Android1.22.0-android.38/code38, original certificate.\n';p.write_text(s,encoding='utf-8')
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
apk=root/'outputs/ILEX.GG-1.22.0-Android.apk';prior=work/'Android-code37.apk'
if not prior.exists():shutil.copy2(apk,prior)
for target in [apk,root/'outputs/ILEX.GG-Android.apk']:shutil.copy2(candidate/'ILEX.GG-Android.apk',target)
shutil.copy2(candidate/'android-verification.json',root/'outputs/ILEX.GG-Android-verification.json');shutil.copy2(dest/'README.md',root/'outputs/ILEX.GG-Cube-Update.txt')
for n,h in hashes.items():assert sha(shared/'resources/app/ui'/n)==h
report['archives']=archives;(root/'work/rules-research/cube-seeding-x-attack-fix.json').write_text(json.dumps(report,indent=2),encoding='utf-8');(work/'release.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('Core-only seeded drafts and CouncilCube X Attack delivered, including Android38.',flush=True)
