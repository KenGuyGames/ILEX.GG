"""Publish only the verified complete-XY desktop candidate; preserve scan/runtime files."""
import concurrent.futures,datetime,hashlib,json,pathlib,shutil,zipfile
root=pathlib.Path(__file__).resolve().parents[2];candidate=root/'work/dp-desktop-candidate';released=root/'outputs/ILEX.GG-win32-x64';research=root/'work/rules-research';native=root/'work/desktop-celebi-brand-tests';ui=candidate/'resources/app/ui'
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
for run_label in ['fresh','restored']:
 check=load(root/('work/desktop-reverse-coin-tests/reverse-coin-native-'+run_label+'.json'));assert check['passed'] and len(check['checks'])>=42
engine=digest(ui/'rules-engine.js');assert engine==digest(root/'work/desktop/ui/rules-engine.js')
source=load(research/'xy-source-validation.json');assert source['passed'] and source['engineSha256']==engine and source['printings']==2208 and source['pending']==0
assert source['ruleAdapterSha256']==digest(ui/'rules-match.js')
assert source['printedAttacks']==2787 and source['trainerToolAttacks']==2 and source['branchCases']==1604 and source['focusedChecks']==52 and len(source['games'])==16
coverage=load(ui/'xy-coverage.json');assert coverage['status']=='source-validated-finite-scope' and coverage['available']==coverage['total']==2208 and coverage['pending']==0 and all(s['validated']==s['total'] for s in coverage['bySet'])
shared=load(research/'xy-shared-regressions.json');assert shared['passed'] and shared['engineSha256']==engine
for name in ['xy-full-focused-report','xy-full-power-audit','xy-full-trainer-audit']:
 r=load(research/(name+'.json'));assert r['passed'] and r['engineSha256']==engine,name
native_names=['desktop-tests','persistence','dp-native-tests','ex-native-tests','ex-native-interactions','pile-count-tests','card-action-tests','deck-filter-tests','audio-tests','foil-tests','deck-sort-native-tests','deck-performance-tests','main-menu-tests','bot-ui-tests','hgss-native-tests','legend-native-tests','bw-native-tests','xy-native-tests','studio-native-tests','studio-layouts','studio-reduced-motion','pack-native-tests','pack-layouts','pack-reduced-motion']
native_reports={}
for name in native_names:
 r=load(native/(name+'.json'));assert r['passed'],name;native_reports[name]=r
for name in ['xy-native-tests','bw-native-tests','hgss-native-tests','dp-native-tests']:
 assert native_reports[name]['engineSha256']==engine,name
for name in ['xy-native-tests','bw-native-tests','hgss-native-tests','legend-native-tests','pack-native-tests','studio-native-tests','main-menu-tests']:
 assert load(native/(name+'-fresh.json'))['passed'],name
assert not (native/'failure.txt').exists()
assert native_reports['persistence']['exactJournalAndDeckOrder']
assert native_reports['studio-native-tests']['preferencesRestored']
assert native_reports['pack-native-tests']['restored'] and native_reports['pack-native-tests']['saved']['pack']['variant']=='prismatic-eevee'
assert native_reports['xy-native-tests']['printings']==2208 and native_reports['legend-native-tests']['pairs']==9
for audit_name in ['xy-interaction-focused','xy-deep-identity','xy-native-guard-audit']:
 audit=load(research/(audit_name+'.json'));assert audit['passed'] and audit['engineSha256']==engine,audit_name
assert len(load(research/'xy-interaction-focused.json')['checks'])==56
energy_tests=load(research/'basic-energy-tests.json');assert energy_tests['passed'] and energy_tests['engineSha256']==engine and len(energy_tests['printings'])==42
repair=load(native/'table-repair-native-tests.json');assert repair['passed']
assert load(native/'table-repair-native-tests-fresh.json')['passed']
pack=load(root/'work/pack-test-report.json');assert pack['passed'] and len(pack['profiles'])==129
for audit_file in ['pack-subset-audit','pack-ball-audit','ascended-pattern-audit','god-pack-audit']:
 audit=load(research/(audit_file+'.json'));assert audit['passed']
 for name,sha in audit['hashes'].items():assert digest(ui/name)==sha,(audit_file,name)
for name,sha in pack['hashes'].items():assert digest(ui/name)==sha,name
for f in (root/'work/desktop/ui').iterdir():
 if f.is_file():assert digest(f)==digest(ui/f.name),f.name
provenance=candidate/'resources/app/card-effect-sources';manifest=load(provenance/'xy-source-manifest.json');assert manifest['engineSha256']==engine
for entry in manifest['files']:assert digest(provenance/entry['path'])==entry['sha256'],entry['path']
scans=load(ui/'scan-manifest.json');assert len(scans)==23736
def verify_scan(item):
 ident,e=item;file=candidate/'resources'/e['file'];assert file.stat().st_size==e['bytes'] and digest(file)==e['sha256'],ident
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(verify_scan,scans.items()))
print('Verified source, native reports, preserved pack hashes, provenance and all 23,736 scans.',flush=True)
audit_dir=candidate/'resources/app/validation/xy';audit_dir.mkdir(parents=True,exist_ok=True)
for name in ['xy-interaction-focused','xy-deep-identity','xy-native-guard-audit']:shutil.copy2(research/(name+'.json'),audit_dir/(name+'.json'))
shutil.copy2(research/'basic-energy-tests.json',audit_dir/'basic-energy-tests.json')
for file in research.glob('xy-*.json'):
 if any(word in file.name for word in ['source-validation','focused-report','smoke-report-','team-smoke-report','branch-report-','power-audit','trainer-audit','full-match-audit-','shared-regressions']):shutil.copy2(file,audit_dir/file.name)
native_names.append('table-repair-native-tests')
for name in native_names:shutil.copy2(native/(name+'.json'),audit_dir/(name+'.json'))
verification={'passed':True,'version':'1.13.3','engineSha256':engine,'coverage':{'XY':2208,'pending':0},'printedPokemonAttacks':2787,'trainerToolAttacks':2,'branchCases':1604,'focusedChecks':52,'boundedDeckGames':16,'nativeFreshAndRestored':True,'scansVerified':23736,'sourceFilesVerified':len(manifest['files']),'scope':'Black & White onward through XY; Unlimited deferred','limits':'Finite tests do not prove every possible interaction. Android device acceptance is separate.'}
(candidate/'desktop-verification.json').write_text(json.dumps(verification,indent=2),encoding='utf-8')
(candidate/'studio-ui-manifest.json').write_text(json.dumps({f.name:digest(f) for f in ui.iterdir() if f.is_file()},indent=2),encoding='utf-8')
(candidate/'README.md').write_text('''# ILEX.GG 1.13.3

XY interaction audit repairs printing identity, Delta Evolution scope, temporary types, named conditions, attack protections, Burning Energy, attached-Energy selection, Stardust, Xerosic ownership and native attack indexes. Fifty-six new expected-result checks and full printing/native-guard audits pass, alongside the existing regressions.

Basic Darkness and Basic Metal Energy no longer receive the same-name Special Energy effects. Forty-two Basic printings and two Special Darkness controls pass expected-result regressions.

Fixes revealed holo Prize positions after Town Map and automatic completion of Grass damage animations. Renderer exceptions and stopped frames also release presentation automatically. These presentation repairs are retained alongside the Basic Energy engine correction.

Run ILEX.GG.exe on Windows 10/11 64-bit. Keep the whole folder together. Existing workspace, decks, custom formats, card inventory and preferences load automatically.

Complete XY automation: 2,208 printings across Kalos Starter, XY through Evolutions, all catalog XY promos, Yellow A alternates, Double Crisis, Generations/Radiant Collection, all eight Trainer Kit decks and McDonald’s 2014–16. XY interactions are scoped to Black & White onward through implemented XY. Earlier automated pools remain available under their historical profiles; Unlimited interaction sweeps remain deferred.

Historical XY retains its first-turn Supporter and legacy Burn rules. The Expanded mechanics profile uses modern first-turn/Burn settings; format card pools and bans remain separate. No new official banlist is supplied. All existing deck sorting, Limitless import, enlarged-card attacks/Retreat, Undo, bots, forest menu, audio, foil, scan cache and pack-opening features are retained.

Validation covers 2,787 printed Pokémon attacks, both Trainer Tool attacks, 1,604 additional branch cases, 52 focused expected-result checks, 16 bounded mixed-deck games with replay/Undo, shared historical/bot regressions and fresh/restored desktop checks. These are finite tests, not an exhaustive proof of every board state. See desktop-verification.json and resources/app/validation/xy.

The compact ZIP uses the persistent scan cache/download controls. The Offline ZIP includes all 23,736 verified scans. The Windows executable is unsigned. This is unofficial fan-made software; Pokémon names/artwork belong to their owners. Runtime/font/engine licenses are included.
''',encoding='utf-8')
(candidate/'START HERE.txt').write_text('ILEX.GG 1.13.3 for Windows 10/11 (64-bit)\n\nDouble-click ILEX.GG.exe. Keep the folder together. Your previous workspace loads automatically.\nSee README.md for coverage and image-cache/offline options.\n',encoding='utf-8')
shutil.copytree(candidate/'resources/app',released/'resources/app',dirs_exist_ok=True)
for name in ['bw-source-manifest.json','hgss-source-manifest.json','dp-source-manifest.json']:(released/'resources/app/card-effect-sources'/name).unlink(missing_ok=True)
for name in ['ILEX.GG.exe','README.md','START HERE.txt','desktop-verification.json','studio-ui-manifest.json']:
 if name=='ILEX.GG.exe' and (released/name).exists():(released/name).rename(root/('work/ILEX.GG-before-XY-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S')+'.exe'))
 shutil.copy2(candidate/name,released/name)
assert digest(released/'resources/app/ui/rules-engine.js')==engine
archives=[]
for offline in [False,True]:
 target=root/('outputs/ILEX.GG-Windows-Offline.zip' if offline else 'outputs/ILEX.GG-Windows.zip');pending=target.with_suffix('.pending.zip');print('Building '+target.name,flush=True)
 with zipfile.ZipFile(pending,'w',allowZip64=True,compression=zipfile.ZIP_DEFLATED,compresslevel=1) as z:
  for f in released.rglob('*'):
   if not f.is_file():continue
   scan=f.is_relative_to(released/'resources/scans')
   if scan and not offline:continue
   z.write(f,f.relative_to(released.parent),compress_type=zipfile.ZIP_STORED if scan else zipfile.ZIP_DEFLATED,compresslevel=1)
 with zipfile.ZipFile(pending) as z:
  assert len([n for n in z.namelist() if '/resources/scans/' in n])==(23736 if offline else 0)
  assert z.testzip() is None
  assert hashlib.sha256(z.read('ILEX.GG-win32-x64/resources/app/ui/rules-engine.js')).hexdigest()==engine
 pending.replace(target);archives.append({'name':target.name,'bytes':target.stat().st_size,'crcPassed':True});print(json.dumps(archives[-1]),flush=True)
verification['archives']=archives;verification['executableSha256']=digest(released/'ILEX.GG.exe')
(research/'reverse-coin-desktop-release.json').write_text(json.dumps(verification,indent=2),encoding='utf-8');print('XY desktop EXE and both ZIPs verified.',flush=True)
