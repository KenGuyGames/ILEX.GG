"""Package the validated Unlimited build without changing user data."""
import concurrent.futures,datetime,hashlib,json,os,pathlib,shutil,zipfile
root=pathlib.Path(__file__).resolve().parents[2];candidate=root/'work/unlimited-desktop-candidate';released=root/'outputs/ILEX.GG-win32-x64';research=root/'work/rules-research';ui=candidate/'resources/app/ui'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
read=lambda p:json.loads(p.read_text(encoding='utf-8'))
source=read(research/'unlimited-source-validation.json');engine=sha(ui/'rules-engine.js');assert source['passed']and source['engineSha256']==engine
assert source['ruleAdapterSha256']==sha(ui/'rules-match.js')and source['botSha256']==sha(ui/'bot-ai.js')
archive=candidate/'resources/app/card-effect-sources';manifest=read(archive/'unlimited-source-manifest.json');assert manifest['engineSha256']==engine
for e in manifest['files']:assert sha(archive/e['path'])==e['sha256'],e['path']
scans=read(ui/'scan-manifest.json');assert len(scans)==23860
def scan_check(pair):
 ident,e=pair;p=candidate/'resources'/e['file'];assert p.stat().st_size==e['bytes']and sha(p)==e['sha256'],ident
with concurrent.futures.ThreadPoolExecutor(max_workers=8)as pool:list(pool.map(scan_check,scans.items()))
apk=root/'work/unlimited-candidate/ILEX.GG-Android.apk';android=read(root/'work/unlimited-candidate/android-verification.json');assert android['passed']and android['sha256']==sha(apk)
with zipfile.ZipFile(apk)as z:assert hashlib.sha256(z.read('assets/ui/rules-engine.js')).hexdigest()==engine
audits=candidate/'resources/app/validation/unlimited';audits.mkdir(parents=True,exist_ok=True)
for f in research.glob('unlimited-*.json'):shutil.copy2(f,audits/f.name)
shutil.copy2(research/'UNLIMITED-PROGRESS.md',audits/'UNLIMITED-PROGRESS.md')
for f in(root/'work/unlimited-native-final-v2').glob('*.json'):shutil.copy2(f,audits/('native-'+f.name))
for n in ['unlimited-mobile-tests.json','mobile-verification.json']:shutil.copy2(root/'work/android-build'/n,audits/n)
shutil.copy2(root/'work/unlimited-candidate/android-verification.json',audits/'android-verification.json')
readme=f'''# ILEX.GG 1.20.0

Unlimited now enables interactions across all implemented eras, from Base Set through Mega / 30th Celebration. Select Unlimited when setting up a new match. Existing saved matches retain their original rules profile.

Unlimited uses modern first-turn, Burn and Tool rules, current Trainer/Special Energy reprint wording, and historical card mechanics. Original artwork and deck printing IDs are preserved. Legacy Pokémon Powers, Poké-Powers, Poké-Bodies and modern Abilities remain distinct. Historical format profiles remain available. No official banlist update is supplied.

Validation: {source['focusedChecks']} expected-result groups, {source['printedAttackCases']} printed attack cases, {source['trainerResolved']} resolved Trainer fixtures, {source['sharedGroups']} shared suites, {source['preservedModernGroups']} modern suites, {source['mixedGames']} bounded mixed-era games ({source['decisions']} decisions, {source['completedGames']} completed) with exact replay/Undo, fresh/restored Windows and three mobile landscape sizes. Conditional/passive unavailable cases are recorded separately. Finite checks do not prove every possible interaction.

Run ILEX.GG.exe on Windows 10/11 64-bit and keep its folder together. Windows EXE is unsigned. Existing workspace saves are preserved. Compact ZIP downloads scans as needed; Offline ZIP contains 23,860 regular scans and 209 finish images. Finish-specific scan acquisition remains incomplete.

Android 1.20.0-android.28 retains the original signing certificate; install over the existing app. Physical Android acceptance remains pending. Private invite-code multiplayer and opponent-approved Undo are preserved, with simulated-channel checks; an actual external two-PC full match remains unverified.

Canonical corrected source and hash manifest: resources/app/card-effect-sources/unlimited-source and unlimited-source-manifest.json. Detailed finite validation: desktop-verification.json and resources/app/validation/unlimited. All previous card catalogs, packs, audio, bots and presentation features are retained.

Unofficial fan-made software. Pokémon names/artwork belong to their owners. Existing licenses are retained.
'''
(candidate/'README.md').write_text(readme,encoding='utf-8')
(candidate/'START HERE.txt').write_text('ILEX.GG 1.20.0 for Windows 10/11 64-bit\n\nDouble-click ILEX.GG.exe. Keep this folder together. Choose Unlimited for new all-era matches. See README.md for rules and verification limits.\n',encoding='utf-8')
(candidate/'desktop-verification.json').write_text(json.dumps(source,indent=2),encoding='utf-8')
(candidate/'studio-ui-manifest.json').write_text(json.dumps({f.name:sha(f) for f in ui.iterdir() if f.is_file()},indent=2),encoding='utf-8')
backup=root/('work/before-unlimited-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S'));backup.mkdir()
if (released/'resources/app/ui').exists():shutil.copytree(released/'resources/app/ui',backup/'ui')
if (released/'ILEX.GG.exe').exists():shutil.copy2(released/'ILEX.GG.exe',backup/'ILEX.GG.exe')
def copy_changed(pair):
 src,dst=pair
 if not dst.exists() or src.stat().st_size!=dst.stat().st_size or sha(src)!=sha(dst):shutil.copy2(src,dst)
pairs=[(f,released/f.relative_to(candidate)) for f in candidate.rglob('*') if f.is_file() and not f.is_relative_to(candidate/'resources/scans')]
pairs.extend((candidate/'resources'/e['file'],released/'resources'/e['file']) for e in scans.values())
for parent in sorted({dst.parent for _,dst in pairs},key=lambda p:len(p.parts)):
 parent.mkdir(parents=True,exist_ok=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(copy_changed,pairs))
assert sha(released/'resources/app/ui/rules-engine.js')==engine
archives=[];scan_paths={released/'resources'/e['file'] for e in scans.values()}
for offline in [False,True]:
 target=root/('outputs/ILEX.GG-Windows-Offline.zip' if offline else 'outputs/ILEX.GG-Windows.zip');pending=target.with_suffix('.pending.zip');print('Building '+target.name,flush=True)
 with zipfile.ZipFile(pending,'w',allowZip64=True,compression=zipfile.ZIP_DEFLATED,compresslevel=1) as z:
  for original in candidate.rglob('*'):
   if not original.is_file():continue
   f=released/original.relative_to(candidate)
   scan=f.is_relative_to(released/'resources/scans')
   if scan and (not offline or f not in scan_paths):continue
   z.write(f,f.relative_to(released.parent),compress_type=zipfile.ZIP_STORED if scan else zipfile.ZIP_DEFLATED,compresslevel=1)
 with zipfile.ZipFile(pending) as z:
  assert z.testzip() is None
  assert hashlib.sha256(z.read('ILEX.GG-win32-x64/resources/app/ui/rules-engine.js')).hexdigest()==engine
  assert len([n for n in z.namelist() if '/resources/scans/' in n])==(len(scan_paths) if offline else 0)
 if target.exists():
  try:os.link(target,backup/target.name)
  except OSError:shutil.copy2(target,backup/target.name)
 pending.replace(target);archives.append({'file':target.name,'bytes':target.stat().st_size,'sha256':sha(target),'crcPassed':True});print(json.dumps(archives[-1]),flush=True)
android_target=root/'outputs/ILEX.GG-Android.apk'
if android_target.exists():shutil.copy2(android_target,backup/'ILEX.GG-Android.apk')
shutil.copy2(apk,android_target);shutil.copy2(root/'work/unlimited-candidate/android-verification.json',root/'outputs/ILEX.GG-Android-verification.json')
evidence={**source,'archives':archives,'executableSha256':sha(released/'ILEX.GG.exe'),'androidSha256':sha(android_target),'androidVersion':'1.20.0-android.28','androidOriginalCertificate':True,'physicalAndroidDeviceTested':False,'actualExternalTwoPCMatchTested':False,'backup':str(backup)}
(research/'unlimited-final-release-evidence.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8');print('Unlimited Windows and Android release verified.',flush=True)
