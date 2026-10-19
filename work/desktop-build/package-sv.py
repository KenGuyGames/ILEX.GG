"""Publish only the frozen SV candidate that passes source and desktop gates."""
import concurrent.futures,datetime,hashlib,json,pathlib,shutil,zipfile
root=pathlib.Path(__file__).resolve().parents[2];candidate=root/'work/sv-desktop-candidate';released=root/'outputs/ILEX.GG-win32-x64';research=root/'work/rules-research';native=root/'work/desktop-sv-tests-v4';ui=candidate/'resources/app/ui'
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as s:
  for b in iter(lambda:s.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
source=load(research/'sv-source-validation.json');engine=digest(ui/'rules-engine.js')
assert source['passed'] and source['printings']==3694 and source['pending']==0 and source['engineSha256']==engine
assert source['ruleAdapterSha256']==digest(ui/'rules-match.js') and source['botSha256']==digest(ui/'bot-ai.js')
coverage=load(ui/'sv-coverage.json');assert coverage['validated']==3694 and all(s['validated']==s['total'] for s in coverage['bySet'])
names=['sv-native-tests','sm-native-tests','swsh-native-tests','realistic-native-tests','desktop-tests','persistence','dp-native-tests','ex-native-tests','ex-native-interactions','pile-count-tests','card-action-tests','deck-filter-tests','audio-tests','foil-tests','deck-sort-native-tests','deck-performance-tests','main-menu-tests','bot-ui-tests','hgss-native-tests','legend-native-tests','bw-native-tests','xy-native-tests','studio-native-tests','studio-layouts','studio-reduced-motion','pack-native-tests','pack-layouts','pack-reduced-motion','table-repair-native-tests']
assert not (native/'failure.txt').exists()
for label in ['', '-fresh']:
 for name in names:
  if label and name=='persistence':continue
  r=load(native/(name+label+'.json'));assert r['passed'],name+label
  if name in ['sv-native-tests','sm-native-tests','swsh-native-tests','xy-native-tests','bw-native-tests','hgss-native-tests','dp-native-tests']:assert r['engineSha256']==engine,name+label
 assert load(native/('sv-native-tests'+label+'.json'))['printings']==3694
assert load(native/'persistence.json')['exactJournalAndDeckOrder']
review=load(research/'sv-visual-review.json');assert review['passed'] and review['engineSha256']==engine and review['screenshotsReviewed']
library=load(research/'sv-ui-library-audit.json');assert library['passed'] and library['engineSha256']==engine and library['preservedFinishImages']==209
archive=candidate/'resources/app/card-effect-sources';manifest=load(archive/'sv-source-manifest.json');assert manifest['engineSha256']==engine
scans=load(ui/'scan-manifest.json');assert len(scans)==23838
def source_check(e):assert digest(archive/e['path'])==e['sha256'],e['path']
def scan_check(pair):
 ident,e=pair;f=candidate/'resources'/e['file'];assert f.stat().st_size==e['bytes'] and digest(f)==e['sha256'],ident
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 list(pool.map(source_check,manifest['files']));list(pool.map(scan_check,scans.items()))
baseline=load(root/'outputs/ILEX.GG-win32-x64/resources/app/ui/scan-manifest.json')
assert all(scans.get(k)==v for k,v in baseline.items()),'Preserve every previous scan entry'
for name in ['finish-scans.js','finish-scans.json','ilex-card-back.svg']:
 old=released/'resources/app/ui'/name
 if old.exists():assert digest(old)==digest(ui/name),name
print('Verified SV source, fresh/restored desktop, all inherited scans and provenance.',flush=True)
audits=candidate/'resources/app/validation/sv';audits.mkdir(parents=True,exist_ok=True)
for file in research.glob('sv-*.json'):
 if file.name in ['sv-source-validation.json','sv-supplement-completeness.json','sv-visual-review.json','sv-final-focused.json','sv-deep-identity.json','sv-native-guard-audit.json','sv-full-power-audit.json','sv-full-trainer-audit.json','sv-tool-attacks.json','sv-current-shared-regressions.json','sv-preserved-swsh.json'] or any(s in file.name for s in ['-validation.json','sv-final-smoke-','sv-final-branch-','sv-mixed-match-audit-']):shutil.copy2(file,audits/file.name)
for name in names:shutil.copy2(native/(name+'.json'),audits/(name+'.json'))
for name in ['SV-PROGRESS.md','SV-RULES-SOURCES.md']:shutil.copy2(research/name,audits/name)
verification={**source,'nativeFreshAndRestored':True,'scansVerified':len(scans),'sourceFilesVerified':len(manifest['files']),'unsignedWindowsExecutable':True}
(candidate/'desktop-verification.json').write_text(json.dumps(verification,indent=2),encoding='utf-8')
(candidate/'studio-ui-manifest.json').write_text(json.dumps({f.name:digest(f) for f in ui.iterdir() if f.is_file()},indent=2),encoding='utf-8')
(candidate/'README.md').write_text(f'''# ILEX.GG 1.17.0

Complete English standard-TCG Scarlet & Violet automation: 3,694 cataloged printings across 20 catalogs, zero pending. Includes special expansions through Black Bolt/White Flare, SVP001–225 and SVP500, both McDonald's catalogs and SVE Energy. Battle Academy unique promos are included; stamped reprints share original mechanics. The separate simplified My First Battle game is not a normal 60-card TCG ruleset.

Interactions cover Black & White onward through Scarlet & Violet. Historical profiles remain available. Unlimited remains deferred; no new official Expanded banlist is supplied.

Validation: {source['printedPokemonAttacks']} printed Pokémon attacks, six Technical Machine attacks, {source['branchCases']} representative compiled branch cases, {source['focusedChecks']} expected-result checks, Ability/Trainer and identity audits, 24 bounded mixed-deck games ({source['decisions']} decisions) with exact replay/Undo, 16 shared suites and fresh/restored desktop checks. Finite checks do not prove all possible states. Passive/conditional fixture exclusions are recorded. Evidence: desktop-verification.json and resources/app/validation/sv.

All prior decks, saves, historical rules, bot difficulties, Undo, enlarged attacks/Retreat, touch controls, forest theme, audio, packs, foils, format filters, card finishes and Limitless imports are retained. Verified finish scan acquisition remains incomplete and is a separate backlog item.

Run ILEX.GG.exe on Windows 10/11 64-bit; keep its folder together. Existing workspace data loads automatically. Compact ZIP uses the persistent scan cache; Offline ZIP includes all {len(scans):,} verified scans. Some historical source images are low resolution; source limitations remain documented. Windows EXE is unsigned. Android device acceptance remains pending.

Unofficial fan-made software. Pokémon names and artwork belong to their owners. Runtime, font and engine licenses are included.
''',encoding='utf-8')
(candidate/'START HERE.txt').write_text('ILEX.GG 1.17.0 for Windows 10/11 (64-bit)\n\nDouble-click ILEX.GG.exe. Keep the folder together. Previous workspace data loads automatically.\nSee README.md and desktop-verification.json for scope and finite validation.\n',encoding='utf-8')
def copy_changed(pair):
 src,dst=pair
 if not dst.parent.is_dir():dst.parent.mkdir(parents=True,exist_ok=True)
 if not dst.exists() or src.stat().st_size!=dst.stat().st_size or digest(src)!=digest(dst):shutil.copy2(src,dst)
# Only synchronize the tested application and its scans; user AppData is never touched.
pairs=[(f,released/'resources/app'/f.relative_to(candidate/'resources/app')) for f in (candidate/'resources/app').rglob('*') if f.is_file()]
pairs.extend((candidate/'resources'/e['file'],released/'resources'/e['file']) for e in scans.values())
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(copy_changed,pairs))
exe=released/'ILEX.GG.exe'
if exe.exists() and digest(exe)!=digest(candidate/'ILEX.GG.exe'):
 shutil.copy2(exe,root/('work/ILEX.GG-before-SV-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S')+'.exe'))
for name in ['ILEX.GG.exe','README.md','START HERE.txt','desktop-verification.json','studio-ui-manifest.json']:copy_changed((candidate/name,released/name))
assert digest(released/'resources/app/ui/rules-engine.js')==engine
archives=[];scan_paths={released/'resources'/e['file'] for e in scans.values()};scan_files=len(scan_paths)
for offline in [False,True]:
 target=root/('outputs/ILEX.GG-Windows-Offline.zip' if offline else 'outputs/ILEX.GG-Windows.zip');pending=target.with_suffix('.pending.zip');print('Building '+target.name,flush=True)
 with zipfile.ZipFile(pending,'w',allowZip64=True,compression=zipfile.ZIP_DEFLATED,compresslevel=1) as z:
  for f in released.rglob('*'):
   if not f.is_file():continue
   scan=f.is_relative_to(released/'resources/scans')
   if scan and (not offline or f not in scan_paths):continue
   z.write(f,f.relative_to(released.parent),compress_type=zipfile.ZIP_STORED if scan else zipfile.ZIP_DEFLATED,compresslevel=1)
 with zipfile.ZipFile(pending) as z:
  assert len([n for n in z.namelist() if '/resources/scans/' in n])==(scan_files if offline else 0)
  assert z.testzip() is None
  assert hashlib.sha256(z.read('ILEX.GG-win32-x64/resources/app/ui/rules-engine.js')).hexdigest()==engine
 pending.replace(target);archives.append({'name':target.name,'bytes':target.stat().st_size,'sha256':digest(target),'crcPassed':True});print(json.dumps(archives[-1]),flush=True)
verification['archives']=archives;verification['executableSha256']=digest(exe)
(research/'sv-desktop-release.json').write_text(json.dumps(verification,indent=2),encoding='utf-8');print('SV Windows EXE and both ZIPs verified.',flush=True)
