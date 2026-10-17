"""Verify and publish the DP/Platinum desktop candidate without replacing unrelated UI work."""
import concurrent.futures, datetime, hashlib, json, pathlib, shutil, zipfile

root = pathlib.Path(__file__).resolve().parents[2]
candidate = root / 'work/dp-desktop-candidate'
released = root / 'outputs/ILEX.GG-win32-x64'
research = root / 'work/rules-research'
native = root / 'work/desktop-studio-tests-v43'
ui = candidate / 'resources/app/ui'
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
load = lambda p: json.loads(p.read_text(encoding='utf-8'))
engine_sha = digest(ui / 'rules-engine.js')
assert engine_sha == digest(root / 'work/desktop/ui/rules-engine.js')
coverage = load(ui / 'dp-coverage.json')
assert coverage['total'] == coverage['available'] == 1558 and coverage['pending'] == 0
assert all(s['available'] == s['total'] for s in coverage['bySet'])

reports = {}
for name in ['dp-focused-test-report', 'dp-final-attack-validation', 'dp-final-delta-proof',
             'dp-targeted-sweep-report', 'dp-trainer-audit', 'dp-power-audit', 'dp-match-audit',
             'ex-focused-test-report', 'wotc-test-report', 'bot-test-report', 'undo-test-report']:
    report = load(research / (name + '.json'))
    assert report['passed'], name
    if 'engineSha256' in report:
        assert report['engineSha256'] == engine_sha, name
    else:
        assert (research / (name + '.json')).stat().st_mtime >= (root / 'work/desktop/ui/rules-engine.js').stat().st_mtime, name
    reports[name] = report
assert reports['dp-final-delta-proof']['finalEngineSha256'] == engine_sha
assert len(reports['dp-focused-test-report']['checks']) == 109
assert len(reports['dp-match-audit']['games']) == 9

native_reports = {}
for name in ['desktop-tests', 'persistence', 'dp-native-tests', 'ex-native-tests',
             'ex-native-interactions', 'pile-count-tests', 'card-action-tests', 'deck-filter-tests',
             'audio-tests', 'foil-tests', 'bot-ui-tests']:
    report = load(native / (name + '.json'))
    assert report['passed'], name
    native_reports[name] = report
assert native_reports['dp-native-tests']['engineSha256'] == engine_sha
assert native_reports['dp-native-tests']['inheritedEnlargedCardActions']
assert native_reports['persistence']['exactJournalAndDeckOrder']
assert not (native / 'failure.txt').exists()
for name in ['studio-native-tests', 'studio-layouts', 'studio-reduced-motion']:
    report = load(native / (name + '.json'))
    assert report['passed'], name
    native_reports[name] = report
assert native_reports['studio-native-tests']['preferencesRestored']
assert load(native / 'studio-native-tests-fresh.json')['passed']
for file in (root / 'work/desktop/ui').iterdir():
    if file.is_file():
        assert digest(file) == digest(ui / file.name), file.name
ui_manifest = {file.name: digest(file) for file in ui.iterdir() if file.is_file()}
(candidate / 'studio-ui-manifest.json').write_text(json.dumps(ui_manifest, indent=2), encoding='utf-8')

source = candidate / 'resources/app/card-effect-sources'
source_manifest = load(source / 'dp-source-manifest.json')
assert source_manifest['engineSha256'] == engine_sha
for entry in source_manifest['files']:
    assert digest(source / entry['path']) == entry['sha256'], entry['path']

manifest = load(ui / 'scan-manifest.json')
assert len(manifest) == 23736
def verify_scan(item):
    ident, entry = item
    file = candidate / 'resources' / entry['file']
    assert file.stat().st_size == entry['bytes'] and digest(file) == entry['sha256'], ident
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    list(pool.map(verify_scan, manifest.items()))
print('Verified 23,736 scans and all final validation/source reports.', flush=True)

audit = candidate / 'resources/app/validation/dp-platinum'
audit.mkdir(parents=True, exist_ok=True)
for name in reports:
    shutil.copy2(research / (name + '.json'), audit / (name + '.json'))
for i in range(3):
    for prefix in ['dp-full-sweep-report-', 'dp-final-smoke-report-']:
        shutil.copy2(research / (prefix + str(i) + '.json'), audit)
for name in ['dp-native-tests', 'desktop-tests', 'persistence', 'studio-native-tests', 'studio-native-tests-fresh', 'studio-layouts', 'studio-reduced-motion']:
    shutil.copy2(native / (name + '.json'), audit / ('native-' + name + '.json'))
verification = {
    'passed': True, 'version': '1.7.0', 'verifiedUtc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'engineSha256': engine_sha, 'presentation': 'Modern studio UI, elemental attacks, actual-result coin flips, larger piles, saved Visuals preferences', 'dpCoverage': coverage, 'reports': reports,
    'native': native_reports, 'verifiedScans': len(manifest),
    'verifiedSourceFiles': len(source_manifest['files']),
    'nativeTestEnvironment': 'Isolated profile; --no-sandbox and --disable-gpu were needed in the execution environment. Distributed launcher retains its normal Chromium sandbox.',
    'scope': 'DP through Platinum Arceus, DP promos, remaining POP 4–9, DP kits and Rumble. Interactions limited to Holon Phantoms onward. Unlimited remains deferred.',
    'limits': 'Coverage and finite execution/regression checks are not exhaustive proof of all board states. The all-attack smoke build differs only in two isolated modules, verified by a byte-identical inverse rebuild and final-build repair/interaction tests.'
}
(candidate / 'desktop-verification.json').write_text(json.dumps(verification, indent=2), encoding='utf-8')
readme = '''ILEX.GG 1.7.0 — Windows 10/11 x64

Launch ILEX.GG.exe and keep the entire extracted folder together. Existing decks, formats and saved games remain in the TCG Lab user profile.

Modern arena: elemental attack effects, visible actual-result single/multiple coin flips, damage and match-event feedback, and larger Deck/Discard/Prize piles. Use Visuals in the header for effects, Cinematic/Fast speed and impact motion. Esc or Skip animation returns immediately without changing results. System reduced-motion settings are respected.

Diamond & Pearl through Platinum Arceus: 1,558 of 1,558 printings have automated implementations, including DP Black Star Promos, POP Series 4–9, DP Trainer Kits and Pokemon Rumble. WOTC and EX implementation coverage is retained. Custom cards and manual tabletop remain available.

This release targets interactions with EX Holon Phantoms and newer. Unlimited and older cross-era interaction sweeps remain deferred.

Validation: 109 focused DP checks; every one of 2,361 printed Pokemon attacks covered by an execution sweep plus isolated final repairs; 120 final repair scenarios; Trainer and Power audits; nine bot matchups with exact replay and Undo (bounded at 150 decisions, not all complete games); shared EX/WOTC, bot and Undo regressions; fresh/restored native checks. See desktop-verification.json and resources/app/validation/dp-platinum for precise results and limits. Finite tests do not prove every possible interaction.

The compact ZIP omits scans and uses the persistent image cache and bulk download controls. The optional Offline ZIP includes all 23,736 verified scans. Audio, deck/format controls, foil, enlarged-card actions and saved preferences are retained.

Historical DP rules allow the first player to draw and attack, prohibit first-turn Trainers/Supporters/Stadiums, preserve additive Weakness, and implement Lv.X timing and inherited text. Custom automated cards retain their existing structured-effect limits; unrestricted free text still requires manual resolution.

Native verification used an isolated profile and required test-only --no-sandbox/--disable-gpu flags in the execution environment. Normal launch keeps Chromium sandbox settings. The executable is unsigned. This is unofficial fan-made software; Pokemon names/artwork belong to their owners. Runtime/font and engine licenses are included.
'''
(candidate / 'README.md').write_text(readme, encoding='utf-8')
(candidate / 'START HERE.txt').write_text('ILEX.GG 1.7.0 for Windows 10/11 (64-bit)\n\nDouble-click ILEX.GG.exe. Keep the whole folder together. Your previous workspace loads automatically.\nSee README.md for coverage and image-cache/offline options.\n', encoding='utf-8')

# Publish only verified candidate app resources and launcher; preserve the existing scan library/runtime.
shutil.copytree(candidate / 'resources/app', released / 'resources/app', dirs_exist_ok=True)
for name in ['ILEX.GG.exe', 'README.md', 'START HERE.txt', 'desktop-verification.json', 'studio-ui-manifest.json']:
    if name == 'ILEX.GG.exe' and (released / name).exists():
        backup = root / ('work/ILEX.GG-before-studio-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S') + '.exe')
        (released / name).rename(backup)
    shutil.copy2(candidate / name, released / name)
assert digest(released / 'resources/app/ui/rules-engine.js') == engine_sha

for offline in [False, True]:
    target = root / ('outputs/ILEX.GG-Windows-Offline.zip' if offline else 'outputs/ILEX.GG-Windows.zip')
    pending = target.with_suffix('.pending.zip')
    print('Building ' + target.name, flush=True)
    with zipfile.ZipFile(pending, 'w', allowZip64=True, compression=zipfile.ZIP_DEFLATED, compresslevel=1) as z:
        for file in released.rglob('*'):
            if not file.is_file():
                continue
            is_scan = file.is_relative_to(released / 'resources/scans')
            if is_scan and not offline:
                continue
            z.write(file, file.relative_to(released.parent), compress_type=zipfile.ZIP_STORED if is_scan else zipfile.ZIP_DEFLATED, compresslevel=1)
    with zipfile.ZipFile(pending) as z:
        assert len([n for n in z.namelist() if '/resources/scans/' in n]) == (23736 if offline else 0)
        assert z.testzip() is None
        assert hashlib.sha256(z.read('ILEX.GG-win32-x64/resources/app/ui/rules-engine.js')).hexdigest() == engine_sha
    pending.replace(target)
    print(json.dumps({'zip': str(target), 'bytes': target.stat().st_size, 'passed': True}), flush=True)
print('ILEX.GG 1.7.0 release and both archives verified.', flush=True)
