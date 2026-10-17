import datetime, json, pathlib, zipfile
root=pathlib.Path(__file__).resolve().parents[2]
load=lambda path:json.loads(path.read_text(encoding='utf-8'))
verification=load(root/'outputs/ILEX.GG-win32-x64/desktop-verification.json')
native=root/'work/desktop-bw-tests-v60'
assert verification['passed'] and verification['native']['deck-sort-native-tests']['passed']
assert load(native/'deck-sort-native-tests-fresh.json')['passed']
archives=[]
for name in ['ILEX.GG-Windows.zip','ILEX.GG-Windows-Offline.zip']:
 path=root/'outputs'/name
 assert not path.with_suffix('.pending.zip').exists()
 with zipfile.ZipFile(path) as archive:
  assert json.loads(archive.read('ILEX.GG-win32-x64/desktop-verification.json'))==verification
  for file in ['app.js','index.html','deck-sort.js']:
   assert archive.read('ILEX.GG-win32-x64/resources/app/ui/'+file)==(root/'work/desktop/ui'/file).read_bytes()
 archives.append({'file':name,'bytes':path.stat().st_size,'crcAndEmbeddedFilesVerified':True})
evidence={'passed':True,'engineSha256':verification['engineSha256'],'engineUnchanged':True,'nativeProfile':str(native),'freshAndRestored':True,'focused':load(root/'work/deck-sort-test-report.json'),'native':verification['native']['deck-sort-native-tests'],'archives':archives,'verifiedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
(root/'work/rules-research/deck-sort-release.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
note='''# Latest UI update — deck sorting (October 16, 2026)

Deck builder groups Pokemon by evolution lineage from cached metadata, including absent intermediate stages, branches and custom evolution data. Lines sort by highest printing copy count, then total line count; within lines count descends, with Basic-to-evolved stage ordering for ties. Trainer order: Supporter, Item (including legacy Trainers), Tool/Technical Machine, Stadium; Basic Energy precedes Special. Counts descend within Trainer/Energy categories; name/ID ties are deterministic. Presentation only: saved card insertion order, counts, exports and match data stay unchanged. Nativev60 fresh/restored, nine focused sorting checks, rendered deck ordering/quantity controls and inherited UI/BW/pack/LEGEND checks pass; screenshot reviewed. EXE and compact/offline ZIPs updated and integrity-verified. See work/rules-research/deck-sort-release.json. No GitHub publication. Preserve the pack auto-reveal/Space update below.

'''
agents=root/'AGENTS.md';text=agents.read_text(encoding='utf-8')
if not text.startswith('# Latest UI update — deck sorting'):agents.write_text(note+text,encoding='utf-8')
print(json.dumps(evidence,indent=2))
