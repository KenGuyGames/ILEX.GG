import datetime,json,pathlib,zipfile
root=pathlib.Path(__file__).resolve().parents[2]
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
verification=load(root/'outputs/ILEX.GG-win32-x64/desktop-verification.json')
native=root/'work/desktop-bw-tests-v62'
assert verification['passed'] and verification['native']['deck-performance-tests']['passed']
assert load(native/'deck-performance-tests-fresh.json')['passed']
archives=[]
for name in ['ILEX.GG-Windows.zip','ILEX.GG-Windows-Offline.zip']:
 path=root/'outputs'/name
 assert not path.with_suffix('.pending.zip').exists()
 with zipfile.ZipFile(path) as archive:
  assert json.loads(archive.read('ILEX.GG-win32-x64/desktop-verification.json'))==verification
  for file in ['app.js','limitless-collection.js']:
   assert archive.read('ILEX.GG-win32-x64/resources/app/ui/'+file)==(root/'work/desktop/ui'/file).read_bytes()
 archives.append({'file':name,'bytes':path.stat().st_size,'crcAndEmbeddedFilesVerified':True})
evidence={'passed':True,'engineSha256':verification['engineSha256'],'engineUnchanged':True,'nativeProfile':str(native),'freshAndRestored':True,'before':load(root/'work/desktop-deck-performance-before/deck-performance.json'),'after':load(root/'work/desktop-deck-performance-after/deck-performance.json'),'native':verification['native']['deck-performance-tests'],'archives':archives,'verifiedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'limits':'Native renderer timings on isolated imported306-deck collection; image provider/network latency is separate.'}
(root/'work/rules-research/deck-performance-release.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
note='''# Latest UI update — deck builder performance (October 16, 2026)

Replaced per-lookup24k-card array copies/linear scans with an indexed catalog lookup, retaining custom-card precedence and array replacement/append/delete refresh. Deck format compatibility caches per deck/counts, full format definition, custom-card data and metadata/catalog identity; unresolved details are never negatively cached. Removed per-card Object.keys(cardMetadata) scans in equivalent-printing validation; pool signatures refresh when metadata/allowed-printing lists change. Evolution sorting and deck contents are unchanged. Native306-deck2004Worlds benchmark: cold filter13443ms→37.9ms; warm10303ms→0.4ms;3filtered switches31263.4ms→4ms. These measure renderer work, not remote image latency. Nativev62 fresh/restored passes cached-vs-fresh legality, quantities, bans, pools, custom edits/deletion, newly loaded details, metadata/catalog replacement, allowed-printing edits, plus inherited deck-sort/pack/UI/BW/LEGEND tests. EXE and both ZIPs updated and integrity-verified. Exact evidence: work/rules-research/deck-performance-release.json. No GitHub publication.

'''
agents=root/'AGENTS.md';text=agents.read_text(encoding='utf-8')
if not text.startswith('# Latest UI update — deck builder performance'):agents.write_text(note+text,encoding='utf-8')
print(json.dumps({'passed':True,'before':evidence['before']['timings'],'after':evidence['after']['timings'],'archives':archives},indent=2))
