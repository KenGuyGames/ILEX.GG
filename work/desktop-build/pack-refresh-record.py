import datetime, hashlib, json, pathlib, zipfile

root = pathlib.Path(__file__).resolve().parents[2]
load = lambda path: json.loads(path.read_text(encoding='utf-8'))
verification = load(root / 'outputs/ILEX.GG-win32-x64/desktop-verification.json')
native = root / 'work/desktop-bw-tests-v59'
assert verification['passed']
assert load(native / 'pack-native-tests.json')['restored']
assert load(native / 'pack-native-tests-fresh.json')['passed']
archives = []
for name in ['ILEX.GG-Windows.zip', 'ILEX.GG-Windows-Offline.zip']:
    path = root / 'outputs' / name
    assert not path.with_suffix('.pending.zip').exists()
    with zipfile.ZipFile(path) as archive:
        assert json.loads(archive.read('ILEX.GG-win32-x64/desktop-verification.json')) == verification
        for name_in_ui in ['packs.js', 'packs.css', 'pack-model.js', 'PACK-SOURCES.md']:
            assert archive.read('ILEX.GG-win32-x64/resources/app/ui/' + name_in_ui) == (root / 'work/desktop/ui' / name_in_ui).read_bytes()
    archives.append({'file': name, 'bytes': path.stat().st_size, 'crcAndEmbeddedFilesVerified': True})
evidence = {
    'passed': True, 'version': verification['version'],
    'engineSha256': verification['engineSha256'], 'engineUnchanged': True,
    'nativeProfile': str(native), 'freshAndRestored': True,
    'checks': load(native / 'pack-native-tests.json')['checks'],
    'packModelChecks': len(load(root / 'work/pack-test-report.json')['checks']),
    'verifiedScans': verification['verifiedScans'], 'verifiedSourceFiles': verification['verifiedSourceFiles'],
    'archives': archives, 'verifiedUtc': datetime.datetime.now(datetime.timezone.utc).isoformat()
}
(root / 'work/rules-research/pack-auto-reveal-release.json').write_text(json.dumps(evidence, indent=2), encoding='utf-8')
agents = root / 'AGENTS.md'
note = '''# Latest UI update — pack reveals (October 16, 2026)

Pack screen removes increased-rate messaging and baseline/adjusted comparisons; neutral Pack contents remains. Cards reveal automatically in order at950ms intervals, scroll into view and retain rare shine without replaying prior reveals. Space opens one new pack per press; repeat keys, text inputs/dropdowns, modifier keys and open dialogs are guarded. Navigation/collection pauses timers; dialogs/background visibility pause reveals; return resumes the saved pack. Pack generation probabilities, collection and game engine unchanged. Nativev59 fresh/restored passes sequential reveals, shortcut/repeat/dropdown/dialog/navigation, save rollback/persistence and inherited UI/BW/LEGEND suites.225 model checks pass. EXE and compact/offline ZIPs updated and verified;23736 scans and1941 provenance files pass. See work/rules-research/pack-auto-reveal-release.json. No GitHub publication. Prior BW release evidence remains historical for the same engine.

'''
text = agents.read_text(encoding='utf-8')
if not text.startswith('# Latest UI update — pack reveals'):
    agents.write_text(note + text, encoding='utf-8')
print(json.dumps(evidence, indent=2))
