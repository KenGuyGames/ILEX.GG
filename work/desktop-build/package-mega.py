"""Publish only the tested Mega desktop and signed Android package; preserve saves."""
import concurrent.futures,datetime,hashlib,json,os,pathlib,shutil,zipfile
root=pathlib.Path(__file__).resolve().parents[2];candidate=root/'work/mega-desktop-candidate';released=root/'outputs/ILEX.GG-win32-x64';research=root/'work/rules-research';ui=candidate/'resources/app/ui'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as s:
  for b in iter(lambda:s.read(1048576),b''):h.update(b)
 return h.hexdigest()
read=lambda p:json.loads(p.read_text(encoding='utf-8'))
source=read(research/'mega-source-validation.json');engine=sha(ui/'rules-engine.js');assert source['passed'] and source['engineSha256']==engine and source['printings']==1293 and source['pending']==0
assert source['ruleAdapterSha256']==sha(ui/'rules-match.js') and source['botSha256']==sha(ui/'bot-ai.js')
assert read(ui/'mega-coverage.json')['validated']==1293
native=root/'work/mega-native-final-v6';assert not (native/'failure.txt').exists()
for suffix in ['', '-fresh']:
 for n in ['mega-native-tests','private-native-tests','sv-native-tests','swsh-native-tests','desktop-tests']:
  x=read(native/(n+suffix+'.json'));assert x['passed'],n+suffix
  if 'engineSha256' in x:assert x['engineSha256']==engine,n+suffix
archive=candidate/'resources/app/card-effect-sources';manifest=read(archive/'mega-source-manifest.json');assert manifest['engineSha256']==engine
for entry in manifest['files']:assert sha(archive/entry['path'])==entry['sha256'],entry['path']
for tool in (root/'work/desktop-build').glob('*mega*'):
 if tool.is_file():shutil.copy2(tool,archive/'mega-tools'/tool.name)
manifest['files']=[{'path':f.relative_to(archive).as_posix(),'bytes':f.stat().st_size,'sha256':sha(f)} for sub in ['mega-source','mega-tools','printed-mega','mega-official-promos'] for f in (archive/sub).rglob('*') if f.is_file()]
(archive/'mega-source-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
source['sourceFilesVerified']=len(manifest['files'])
scans=read(ui/'scan-manifest.json');assert len(scans)==23860
def scan_check(pair):
 ident,e=pair;p=candidate/'resources'/e['file'];assert p.stat().st_size==e['bytes'] and sha(p)==e['sha256'],ident
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(scan_check,scans.items()))
apk=root/'work/mega-candidate/ILEX.GG-Android.apk';android=read(root/'work/mega-candidate/android-verification.json');assert android['passed'] and android['sha256']==sha(apk)
with zipfile.ZipFile(apk) as z:
 assert hashlib.sha256(z.read('assets/ui/rules-engine.js')).hexdigest()==engine
 assert json.loads(z.read('assets/ui/mega-coverage.json'))['validated']==1293
audits=candidate/'resources/app/validation/mega';audits.mkdir(parents=True,exist_ok=True)
for f in research.glob('mega-*.json'):shutil.copy2(f,audits/f.name)
for n in ['MEGA-PROGRESS.md','MEGA-RULES-SOURCES.md']:shutil.copy2(research/n,audits/n)
for f in native.glob('*.json'):
 if 'fresh' not in f.name:shutil.copy2(f,audits/('native-'+f.name))
shutil.copy2(root/'work/mega-candidate/android-verification.json',audits/'android-verification.json')
readme=f'''# ILEX.GG 1.19.0

Mega era through 30th Celebration: 1,293 standard-game printing implementations across ten catalogs, including 110 numbered promos, MEE Energy and the 30th Classic Collection. MEP102–110 are officially announced anniversary-product previews with future release dates retained. Museum is a display-only novelty; unconfirmed RGB Mew rows are excluded. Classic Collection keeps historical mechanics and does not imply official tournament legality.

Interactions cover Black & White onward through Mega. Unlimited remains deferred. Historical profiles, saved decks, formats, pack openings, audio, bot difficulties, Undo, sleeves, foil scans and touch controls are preserved. No official banlist update is supplied. Reverse scan acquisition remains a separate incomplete backlog item.

Validation: {source['focusedChecks']} expected-result groups, {source['identityComparisons']} printed-field comparisons, {source['printedPokemonAttacks']} attack cases, {source['branchCases']} compiled branch cases, Ability/Trainer audits, 24 bounded mixed-deck games ({source['decisions']} decisions; {source['completedGames']} completed) with exact replay/Undo, shared regressions and fresh/restored Windows checks. Finite tests do not prove every board state. Conditional/passive unavailable fixtures and distinct audit engine hashes are recorded in desktop-verification.json. Canonical corrected source is resources/app/card-effect-sources/mega-source, with its hash manifest.

Run ILEX.GG.exe on Windows 10/11 64-bit; keep the folder together. Compact ZIP uses the scan cache; Offline ZIP contains all 23,860 verified regular scans plus 209 finish images. Existing workspace AppData is preserved. Windows EXE is unsigned.

Private Windows invite-code multiplayer preview is preserved, including opponent-approved Undo. Its simulated-channel checks pass; an actual external two-PC connection/full match remains unverified. Android 1.19.0-android.27 uses the original signing certificate and supports updating the existing app. Physical Android acceptance remains pending.

Unofficial fan-made software. Pokémon names/artwork belong to their owners. Existing runtime, fonts and engine licenses are retained.
'''
(candidate/'README.md').write_text(readme,encoding='utf-8')
(candidate/'START HERE.txt').write_text('ILEX.GG 1.19.0 for Windows 10/11 64-bit\n\nDouble-click ILEX.GG.exe and keep its folder together. Previous workspace data loads automatically. See README.md for scope and verification limits.\n',encoding='utf-8')
(candidate/'desktop-verification.json').write_text(json.dumps(source,indent=2),encoding='utf-8')
(candidate/'studio-ui-manifest.json').write_text(json.dumps({f.name:sha(f) for f in ui.iterdir() if f.is_file()},indent=2),encoding='utf-8')
backup=root/('work/before-mega-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S'));backup.mkdir()
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
shutil.copy2(apk,android_target);shutil.copy2(root/'work/mega-candidate/android-verification.json',root/'outputs/ILEX.GG-Android-verification.json')
evidence={**source,'archives':archives,'executableSha256':sha(released/'ILEX.GG.exe'),'androidSha256':sha(android_target),'androidVersion':'1.19.0-android.27','androidOriginalCertificate':True,'physicalAndroidDeviceTested':False,'actualExternalTwoPCMatchTested':False,'backup':str(backup)}
(research/'mega-final-release-evidence.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8');print('Mega Windows and Android release verified.',flush=True)
