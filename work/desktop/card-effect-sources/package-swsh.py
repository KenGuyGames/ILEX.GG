"""Release only the SM candidate whose current source, native and pack checks pass."""
import concurrent.futures,datetime,hashlib,json,pathlib,shutil,zipfile
root=pathlib.Path(__file__).resolve().parents[2];candidate=root/'work/dp-desktop-candidate';released=root/'outputs/ILEX.GG-win32-x64';research=root/'work/rules-research';native=root/'work/desktop-swsh-tests-v5';ui=candidate/'resources/app/ui'
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as stream:
  for block in iter(lambda:stream.read(1024*1024),b''):h.update(block)
 return h.hexdigest()
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
source=load(research/'swsh-source-validation.json');engine=digest(ui/'rules-engine.js')
assert source['passed'] and source['printings']==3715 and source['pending']==0 and source['engineSha256']==engine
assert source['ruleAdapterSha256']==digest(ui/'rules-match.js') and source['botSha256']==digest(ui/'bot-ai.js')
coverage=load(ui/'swsh-coverage.json');assert coverage['status']=='source-validated-finite-scope' and coverage['validated']==3715 and all(s['validated']==s['total'] for s in coverage['bySet'])
native_names=['sm-native-tests','swsh-native-tests','realistic-native-tests','desktop-tests','persistence','dp-native-tests','ex-native-tests','ex-native-interactions','pile-count-tests','card-action-tests','deck-filter-tests','audio-tests','foil-tests','deck-sort-native-tests','deck-performance-tests','main-menu-tests','bot-ui-tests','hgss-native-tests','legend-native-tests','bw-native-tests','xy-native-tests','studio-native-tests','studio-layouts','studio-reduced-motion','pack-native-tests','pack-layouts','pack-reduced-motion','table-repair-native-tests']
assert not (native/'failure.txt').exists()
for label in ['', '-fresh']:
 for name in native_names:
  if label and name=='persistence':continue
  r=load(native/(name+label+'.json'));assert r['passed'],name+label
  if name in ['sm-native-tests','swsh-native-tests','xy-native-tests','bw-native-tests','hgss-native-tests','dp-native-tests']:assert r['engineSha256']==engine,name+label
  if name=='swsh-native-tests':assert r['ruleAdapterSha256']==source['ruleAdapterSha256'] and r['botSha256']==source['botSha256']
 assert load(native/('legend-native-tests'+label+'.json'))['pairs']==9
assert load(native/'persistence.json')['exactJournalAndDeckOrder']
assert load(native/'swsh-native-tests.json')['printings']==3715
visual=load(root/'work/swsh-visual-review/visual-review.json')
assert visual['passed'] and visual['screenshotsReviewed'] and visual['engineSha256']==engine and len(visual['results'])==6 and visual['mobile']['passed']
assert len(load(native/'realistic-native-tests.json')['checks'])>=12
for name in ['pack-subset-audit','pack-ball-audit','ascended-pattern-audit','god-pack-audit']:
 r=load(research/(name+'.json'));assert r['passed']
 for file,sha in r['hashes'].items():assert digest(ui/file)==sha,(name,file)
pack=load(root/'work/pack-test-report.json');assert pack['passed'] and len(pack['profiles'])==129
for file,sha in pack['hashes'].items():assert digest(ui/file)==sha,file
for f in (root/'work/desktop/ui').iterdir():
 if f.is_file():assert digest(f)==digest(ui/f.name),f.name
provenance=candidate/'resources/app/card-effect-sources';manifest=load(provenance/'swsh-source-manifest.json');assert manifest['engineSha256']==engine
def verify_source(entry):assert digest(provenance/entry['path'])==entry['sha256'],entry['path']
scans=load(ui/'scan-manifest.json');assert len(scans)==23804
def verify_scan(item):
 ident,e=item;f=candidate/'resources'/e['file'];assert f.stat().st_size==e['bytes'] and digest(f)==e['sha256'],ident
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 list(pool.map(verify_source,manifest['files']));list(pool.map(verify_scan,scans.items()))
print('Verified current SWSH source, fresh/restored desktop, inherited features, pack audits, provenance and all 23,804 scans.',flush=True)
audit_dir=candidate/'resources/app/validation/swsh';audit_dir.mkdir(parents=True,exist_ok=True)
for file in research.glob('swsh-*.json'):
 if any(word in file.name for word in ['source-validation','focused-tests','cross-era-tests','tool-attacks','ui-integration','bot-core-current','smoke-report-','branch-report-','power-audit','trainer-audit','match-audit-','shared-regressions','deep-identity','native-guard-audit']):shutil.copy2(file,audit_dir/file.name)
for name in native_names:shutil.copy2(native/(name+'.json'),audit_dir/(name+'.json'))
shutil.copy2(root/'work/swsh-visual-review/visual-review.json',audit_dir/'visual-review.json')
for name in ['SWSH-PROGRESS.md','SWSH-RULES-SOURCES.md']:shutil.copy2(research/name,audit_dir/name)
verification={**source,'nativeFreshAndRestored':True,'scansVerified':23804,'additionalScansVerified':0,'sourceFilesVerified':len(manifest['files']),'unsignedWindowsExecutable':True}
(candidate/'desktop-verification.json').write_text(json.dumps(verification,indent=2),encoding='utf-8')
(candidate/'studio-ui-manifest.json').write_text(json.dumps({f.name:digest(f) for f in ui.iterdir() if f.is_file()},indent=2),encoding='utf-8')
(candidate/'README.md').write_text(f'''# ILEX.GG 1.16.0

Complete English Sword & Shield automation: 3,715 printings, zero pending across 28 catalogs. Includes Sword & Shield through Crown Zenith, all 307 Black Star Promos, Champion’s Path, Shining Fates/Shiny Vault, Pokémon GO, Celebrations/Classics, four Trainer Galleries, Galarian Gallery, Futsal 2020 and McDonald’s 2021–22.

Interactions cover Black & White onward through the implemented SM pool. Earlier historical profiles remain available. Unlimited remains deferred. The Sword & Shield profile disallows first-turn Supporters. Expanded retains modern mechanics. Format card pools and bans remain separate; no new official banlist is supplied.

Validation: {source['printedPokemonAttacks']} printed Pokémon attacks, {source['trainerToolAttacks']} Trainer Tool attacks, {source['branchCases']} branch cases, {source['focusedChecks']} expected-result checks, Ability/Trainer audits, {len(source['games'])} bounded mixed-deck games ({source['decisions']} decisions) with exact replay/Undo, shared historical/bot regressions, and fresh/restored desktop checks. Finite tests do not establish every possible board-state interaction. Evidence is in desktop-verification.json and resources/app/validation/swsh.

V, VMAX, VSTAR and V-UNION rules, Radiant limits, Battle Styles, Lost Zone costs, Special Energy units and conditional effects are included. Existing Realistic Player and other bot levels, Undo, enlarged attacks/Retreat, transparent overlays, landscape/touch controls, forest menu, audio, packs, foils, deck sorting, format filtering and Limitless imports are retained.

Run ILEX.GG.exe on Windows 10/11 64-bit. Keep the folder together. Existing workspace data loads automatically. The compact ZIP uses the persistent scan cache; the Offline ZIP includes all 23,804 verified scans. Twelve numbered Trainer Kit Energy originals are 253×359; they are not artificially upscaled. The Windows executable is unsigned.

Unofficial fan-made software. Pokémon names and artwork belong to their owners. Runtime/font/engine licenses are included. Android device acceptance is separate from desktop verification.
''',encoding='utf-8')
(candidate/'START HERE.txt').write_text('ILEX.GG 1.16.0 for Windows 10/11 (64-bit)\n\nDouble-click ILEX.GG.exe. Keep the folder together. Previous workspace data loads automatically.\nSee README.md and desktop-verification.json for scope and finite validation.\n',encoding='utf-8')
(candidate/'resources/app/swsh-probe.cjs').unlink(missing_ok=True)
def copy_changed(pair):
 src,dst=pair;dst.parent.mkdir(parents=True,exist_ok=True)
 if not dst.exists() or src.stat().st_size!=dst.stat().st_size or digest(src)!=digest(dst):shutil.copy2(src,dst)
pairs=[(f,released/'resources/app'/f.relative_to(candidate/'resources/app')) for f in (candidate/'resources/app').rglob('*') if f.is_file()]
pairs += [(candidate/'resources'/e['file'],released/'resources'/e['file']) for e in scans.values()]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(copy_changed,pairs))
exe=released/'ILEX.GG.exe'
if exe.exists() and digest(exe)!=digest(candidate/'ILEX.GG.exe'):
 backup=root/('work/ILEX.GG-before-SWSH-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S')+'.exe');exe.rename(backup)
for name in ['ILEX.GG.exe','README.md','START HERE.txt','desktop-verification.json','studio-ui-manifest.json']:copy_changed((candidate/name,released/name))
assert digest(released/'resources/app/ui/rules-engine.js')==engine
archives=[];scan_files=len({e['file'] for e in scans.values()})
for offline in [False,True]:
 target=root/('outputs/ILEX.GG-Windows-Offline.zip' if offline else 'outputs/ILEX.GG-Windows.zip');pending=target.with_suffix('.pending.zip');print('Building '+target.name,flush=True)
 with zipfile.ZipFile(pending,'w',allowZip64=True,compression=zipfile.ZIP_DEFLATED,compresslevel=1) as z:
  for f in released.rglob('*'):
   if not f.is_file():continue
   scan=f.is_relative_to(released/'resources/scans')
   if scan and not offline:continue
   z.write(f,f.relative_to(released.parent),compress_type=zipfile.ZIP_STORED if scan else zipfile.ZIP_DEFLATED,compresslevel=1)
 with zipfile.ZipFile(pending) as z:
  assert len([n for n in z.namelist() if '/resources/scans/' in n])==(scan_files if offline else 0)
  assert z.testzip() is None
  assert hashlib.sha256(z.read('ILEX.GG-win32-x64/resources/app/ui/rules-engine.js')).hexdigest()==engine
 pending.replace(target);archives.append({'name':target.name,'bytes':target.stat().st_size,'sha256':digest(target),'crcPassed':True});print(json.dumps(archives[-1]),flush=True)
verification['archives']=archives;verification['executableSha256']=digest(released/'ILEX.GG.exe')
(research/'swsh-desktop-release.json').write_text(json.dumps(verification,indent=2),encoding='utf-8');print('SWSH Windows EXE and both ZIPs verified.',flush=True)
