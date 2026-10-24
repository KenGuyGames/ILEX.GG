from pathlib import Path
import json,hashlib,shutil,zipfile,sys,os
root=Path(__file__).resolve().parents[2];sys.path.insert(0,str(root/'work/desktop-build'))
from reuse_zip_entries import rewrite
w=root/'work/menu-plaques';candidate=root/'work/v2-candidate';ui=candidate/'ui';dest=root/'outputs/ILEX.GG-2.0.0';shared=root/'outputs/ILEX.GG-win32-x64';files=['v2-assets/forest-plaque-mask.svg','v2-assets/forest-plaque-rim.svg','v2-assets/legend-box-art.svg','v2-assets/championship-arena-art.svg','settings.js','index.html','menu-groups.js','menu-plaques.css','v2-assets/forest-plaque.svg']
files += sorted(p.relative_to(ui).as_posix() for p in (ui/'v2-assets/balls').iterdir() if p.is_file())

def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
 return h.hexdigest()
native=read(w/'native/checks.json');mobile=read(w/'mobile-tests.json');android=read(candidate/'android-verification.json');build=read(candidate/'android-build.json');prior=read(root/'work/v2-research/release.json')
for d in [native,mobile,android]:assert d['passed']
for n,h in native['hashes'].items():assert sha(ui/n)==h,n
for n,h in mobile['hashes'].items():assert sha(root/'work/android-build/build/assets/ui'/n)==h,n
for n,h in prior['hashes'].items():
 if n!='index.html':assert sha(ui/n)==h,n
assert sha(candidate/'ILEX.GG-Android.apk')==android['sha256']==build['sha256']
import re
current=(ui/'index.html').read_text().replace('<html lang="en" class="ilex-booting">','<html lang="en">').replace('<style>html.ilex-booting body{visibility:hidden!important}</style>','').replace('<script src="menu-groups.js"></script>','').replace('<script src="settings.js"></script>','').replace('<link rel="stylesheet" href="menu-plaques.css">','')
original=(w/'before-index.html').read_text()
original=re.sub(r'<span class="v2-version">2\.0<span>THE GROVE REIMAGINED</span></span>','',original)
original=re.sub(r'<div class="menu-settings">.*?</div>','',original)
original=original.replace('CHOOSE YOUR NEXT MOVE','').replace('<div class="menu-divider">','<div class="menu-divider" hidden>')
pattern=r'<div class="menu-welcome">.*?</div>\s*(?=<figure class="menu-celebi-showcase")'
assert len(re.findall(pattern,current,re.S))==0 and len(re.findall(pattern,original,re.S))==1
original=re.sub(pattern,'',original,flags=re.S)
label=re.search(r'<span class="v2-showcase-label">.*?</span>',original,re.S)
assert label and label.group() not in current
original=original.replace(label.group(),'')
assert current==original, 'Unexpected index changes outside welcome and showcase label'
assert 'Every era. One epic arena' not in (ui/'index.html').read_text()
assert 'Your cards. Your strategy. Your moment' not in (ui/'index.html').read_text()
with zipfile.ZipFile(candidate/'ILEX.GG-Android.apk') as z:
 for n in files:
  expected=root/'work/android-build/build/assets/ui'/n if n=='index.html' else ui/n
  assert hashlib.sha256(z.read('assets/ui/'+n)).hexdigest()==sha(expected),n
 assert z.testzip() is None
 assert {n for n in z.namelist() if n.startswith('assets/ui/v2-assets/balls/')}=={'assets/ui/'+n for n in files if n.startswith('v2-assets/balls/')}
hashes={n:sha(ui/n) for n in files};report={'passed':True,'feature':'Official Pokemon PNG ball icons on main menu and submenus','version':'2.0.0','android':build,'hashes':hashes,'nativeChecks':len(native['checks']),'touchChecks':len(mobile['checks']),'androidChecks':len(android['checks']),'backgroundUnchanged':sha(ui/'v2-assets/forest-arena.png'),'playTableAndEnginesUnchanged':True,'notes':['User rejected the illustrated-tile direction and3x3 layout. Illustrated atlas is not included.','Native SVG frame artwork; no new card art or gameplay changes.','Native preview uses isolated synthetic profile. Physical Android acceptance pending.','No remote publication.']}
audit=dest/'resources/app/validation/menu-plaques';source=dest/'resources/app/card-effect-sources/menu-plaques';audit.mkdir(parents=True,exist_ok=True);source.mkdir(parents=True,exist_ok=True)
for p,n in [(w/'native/checks.json','native.json'),(w/'mobile-tests.json','mobile.json'),(candidate/'android-verification.json','android.json')]:shutil.copy2(p,audit/n)
for p in w.iterdir():
 if p.suffix in ['.py','.cjs']:shutil.copy2(p,source/p.name)
report['officialBallIcons']=read(ui/'v2-assets/balls/sources.json')
report['arenaArtwork']=read(w/'arena-art.json')
report['startup']=read(w/'startup-verification.json')
(audit/'release.json').write_text(json.dumps(report,indent=2))
shutil.copy2(w/'startup-verification.json',audit/'startup.json')
for n in files:
 p=dest/'resources/app/ui'/n;p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ui/n,p)
for name in ['studio-ui-manifest.json','desktop-verification.json']:
 p=dest/name;d=read(p)
 if name.startswith('studio'):d.update(hashes)
 else:d['forestMenuRevision']=report
 p.write_text(json.dumps(d,indent=2))
note='\nStartup fix: initialize the menu before revealing it, create Windows at display work-area size and maximize/show only after loading. Widescreen refinement: viewport-sized composition with larger spread-out plaques and Celebi. Menu refinement: one forest-styled header Settings button combines audio and visuals; duplicate bottom controls removed. Enter the Arena groups Play, Pocket, Cube Draft and Private Multiplayer; Enter the Vault groups Deck Builder, Card Gallery, Formats, Custom Cards and Pack opening. Back returns to the two main choices. Curved forest plaques with carved surfaces, vinework and engraved lettering replace modern tiles. A single vertical list on the left replaces the3x3 grid. Large heading removed; enlarged upper-right rotating Celebi showcase; workspace import/export moved into Settings. Forest backdrop and play-table presentation are unchanged. Android2.0.0-android.63/code63, original certificate.\n'
p=dest/'README-2.0.txt';p.write_text(p.read_text(encoding='utf-8')+note,encoding='utf-8')
shutil.copy2(w/'main.cjs',dest/'resources/app/main.cjs')
changed={('resources/app/ui/'+n):dest/'resources/app/ui'/n for n in files}
changed['resources/app/main.cjs']=dest/'resources/app/main.cjs'
for n in ['studio-ui-manifest.json','desktop-verification.json','README-2.0.txt']:changed[n]=dest/n
for folder in [audit,source]:
 for p in folder.rglob('*'):
  if p.is_file():changed[p.relative_to(dest).as_posix()]=p
archives=[];prefix='ILEX.GG-win32-x64/'
for label in ['Windows','Windows-Offline']:
 target=root/'outputs'/('ILEX.GG-2.0.0-'+label+'.zip');pending=target.with_suffix('.menu-pending.zip')
 with zipfile.ZipFile(target) as z:names=set(z.namelist())
 print('Refreshing '+label,flush=True);rewrite(target,pending,{prefix+n:p for n,p in changed.items() if prefix+n in names},{prefix+n:p for n,p in changed.items() if prefix+n not in names})
 with zipfile.ZipFile(pending) as z:
  assert z.testzip() is None
  for n,p in changed.items():assert hashlib.sha256(z.read(prefix+n)).hexdigest()==sha(p),n
 os.replace(pending,target);archives.append({'file':str(target),'sha256':sha(target),'crcPassed':True});shutil.copy2(target,root/'outputs'/('ILEX.GG-'+label+'.zip'));print('Verified '+label,flush=True)
for n,p in changed.items():
 target=shared/n;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target)
oldApk=w/'Android-code43.apk'
if not oldApk.exists():shutil.copy2(root/'outputs/ILEX.GG-2.0.0-Android.apk',oldApk)
for p in [root/'outputs/ILEX.GG-2.0.0-Android.apk',root/'outputs/ILEX.GG-Android.apk']:shutil.copy2(candidate/'ILEX.GG-Android.apk',p)
shutil.copy2(candidate/'android-verification.json',root/'outputs/ILEX.GG-Android-verification.json');shutil.copy2(w/'native/home-1440x960.png',root/'outputs/ILEX.GG-2.0.0-preview.png');shutil.copy2(dest/'README-2.0.txt',root/'outputs/ILEX.GG-2.0.0.txt')
report['archives']=archives;(w/'release.json').write_text(json.dumps(report,indent=2));(root/'work/rules-research/forest-menu-revision.json').write_text(json.dumps(report,indent=2))
print('Forest plaque vertical menu delivered locally.',flush=True)
