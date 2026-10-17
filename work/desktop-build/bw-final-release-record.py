import datetime, hashlib, json, pathlib, zipfile

root = pathlib.Path(__file__).resolve().parents[2]
research = root / 'work/rules-research'
load = lambda path: json.loads(path.read_text(encoding='utf-8'))
verification = load(root / 'outputs/ILEX.GG-win32-x64/desktop-verification.json')
assert verification['passed'] and verification['version'] == '1.12.0'
sha = verification['engineSha256']
archives = []
for name in ['ILEX.GG-Windows.zip', 'ILEX.GG-Windows-Offline.zip']:
    path = root / 'outputs' / name
    assert not path.with_suffix('.pending.zip').exists()
    with zipfile.ZipFile(path) as archive:
        embedded = load(root / 'outputs/ILEX.GG-win32-x64/desktop-verification.json')
        assert json.loads(archive.read('ILEX.GG-win32-x64/desktop-verification.json')) == embedded
        assert hashlib.sha256(archive.read('ILEX.GG-win32-x64/resources/app/ui/rules-engine.js')).hexdigest() == sha
    archives.append({'file': name, 'bytes': path.stat().st_size, 'crcAndEngineVerified': True})
rollouts = load(research / 'bw-match-audit.json')['games']
evidence = {
    'passed': True, 'version': '1.12.0', 'engineSha256': sha,
    'newPrintings': 888, 'totalBwPrintings': 1521, 'pending': 0,
    'focusedChecks': 66, 'printedPokemonAttackSmoke': 2206, 'trainerToolAttacks': 2,
    'newAttackBranchCases': 5196, 'rollouts': len(rollouts),
    'decisions': sum(game['decisions'] for game in rollouts),
    'nativeProfile': 'work/desktop-bw-tests-v58', 'nativeFreshAndRestored': True,
    'nativeBwChecks': len(verification['native']['bw-native-tests']['checks']),
    'verifiedScans': verification['verifiedScans'], 'verifiedSourceFiles': verification['verifiedSourceFiles'],
    'archives': archives, 'scope': verification['scope'], 'limits': verification['limits'],
    'verifiedUtc': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'githubPublished': False
}
(research / 'bw-final-release-evidence.json').write_text(json.dumps(evidence, indent=2), encoding='utf-8')
progress = research / 'BW-FINAL-PROGRESS.md'
text = progress.read_text(encoding='utf-8')
text = text.replace('Baseline release1.11.0 stays separate until candidate verification completes.', 'Release1.12.0 is verified locally; prior1.11.0 evidence is retained separately.')
start = text.index('Final candidate engine')
end = text.index('\n\nInitial discovery', start)
text = text[:start] + f'''Final engine {sha}. All66 focused expected-result checks,2206 printed Pokemon attacks plus both Trainer Tool attacks,5196 additional new-card branch scenarios, Power/Trainer audits and18 scoped real-deck rollouts ({evidence['decisions']} decisions) with replay/Undo pass. Shared HGSS32/DP109/EX170/WOTC-focused127/bot17 plus3 full games/Undo7 regressions pass. Nativev58 fresh/restored passes inherited UI, LEGEND, pack, persistence and BW checks. Desktop preview reviewed.

ILEX.GG1.12.0 EXE and both Windows archives are updated. All23736 scan hashes and1940 provenance files verified. Compact ZIP {archives[0]['bytes']} bytes; offline ZIP {archives[1]['bytes']} bytes. Both archive CRC and embedded-engine checks pass. Exact evidence: bw-final-release-evidence.json and outputs/ILEX.GG-win32-x64/desktop-verification.json. No GitHub publication.''' + text[end:]
progress.write_text(text, encoding='utf-8')
agents = root / 'AGENTS.md'
text = agents.read_text(encoding='utf-8')
end = text.index('# Latest completed scope — Next Destinies')
text = f'''# Latest completed scope — complete Black & White era (October 16, 2026)

Kenneth authorized the remaining BW era. ILEX.GG1.12.0 is complete and verified locally:888 new printings, cumulative1521/1521, zero pending. Includes BW1–11 through Legendary Treasures, Dragon Vault, BW01–BW101 promos, both BW Trainer Kits and McDonalds2011/2012. Interactions remain HGSS–Call of Legends and implemented BW; Unlimited and XY expansion work deferred. Preserve all UI/cache/music/pack/LEGEND/Limitless/backlog features. No subagents used; no GitHub publication.

Final engine {sha}.66 focused checks,2206 Pokemon attacks plus2 Trainer Tool attacks,5196 branch cases, Power/Trainer audits,18 bounded scoped deck rollouts ({evidence['decisions']} decisions) with replay/Undo, shared HGSS32/DP109/EX170/WOTC-focused127/bot17+3games/Undo7 and nativev58 fresh/restored pass. EXE and compact/offline ZIPs updated;23736 scan hashes,1940 provenance files, archive CRCs and engine hashes verified. Read work/rules-research/BW-FINAL-PROGRESS.md and bw-final-release-evidence.json for evidence and finite-test limitations. Older authorization/deferred-set notes below are historical.

''' + text[end:]
agents.write_text(text, encoding='utf-8')
print(json.dumps(evidence, indent=2))
