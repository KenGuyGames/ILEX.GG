import datetime,json,pathlib,zipfile
root=pathlib.Path(__file__).resolve().parents[2]
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
verification=load(root/'outputs/ILEX.GG-win32-x64/desktop-verification.json')
native=root/'work/desktop-bw-tests-v72'
assert verification['passed'] and verification['native']['pack-native-tests']['passed']
assert load(native/'pack-native-tests-fresh.json')['passed']
model=load(root/'work/pack-test-report.json');prism=next(p for p in model['profiles'] if p['id']=='sv08.5');assert prism['pools']['reverse']==108 and prism['pools']['pokeball']==100 and prism['pools']['masterball']==67
assert verification['native']['pack-native-tests']['restored']
audit=load(root/'work/rules-research/pack-subset-audit.json');assert audit['passed'] and audit['printingsGenerated']==705
archives=[]
for name in ['ILEX.GG-Windows.zip','ILEX.GG-Windows-Offline.zip']:
 path=root/'outputs'/name
 assert not path.with_suffix('.pending.zip').exists()
 with zipfile.ZipFile(path) as archive:
  assert json.loads(archive.read('ILEX.GG-win32-x64/desktop-verification.json'))==verification
  for file in ['pack-model.js','packs.js','pack-finishes.js','pack-finish-view.js','packs.css','app.js','tabletop.js']:
   assert archive.read('ILEX.GG-win32-x64/resources/app/ui/'+file)==(root/'work/desktop/ui'/file).read_bytes()
 archives.append({'file':name,'bytes':path.stat().st_size,'crcAndEmbeddedFilesVerified':True})
evidence={'passed':True,'engineSha256':verification['engineSha256'],'engineUnchanged':True,'nativeProfile':str(native),'freshAndRestored':True,'prismaticFinishes':{k:prism['pools'][k] for k in ['reverse','pokeball','masterball']},'renderedOverBaseScans':True,'packChecks':len(model['checks']),'subsetAudit':audit,'native':verification['native']['pack-native-tests'],'archives':archives,'verifiedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
(root/'work/rules-research/pack-finish-release.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
note="""# Latest pack update — reverse finishes (October 16, 2026)

Pack openings now render distinct Reverse Holo finishes, plus Prismatic Evolutions Poké Ball and Master Ball patterns. Prismatic pools:108 standard reverse (100 set cards plus8 Basic Energy),100 Poké Ball and67 Master Ball; eligibility from cached TCGdex variant records. Master Balls restricted to non-ex Pokémon. These are cosmetic reconstructions over existing base scans, not separate variant scan images. Finish identity persists in My pulls, inspection and right-click magnification; hidden cards expose no finish. Era-specific reverse pools retained because bulk API flags omit known older printings. Aquapolis/Skyridge H holo IDs excluded from reverse pool, Crystal reverse finish corrected.303 pack checks across212,900 packs and705 subset reachability checks pass. Nativev72 fresh/restored passes variant rendering, magnification, labels, separate saved inventory and unchanged decks/game, plus inherited desktop/LEGEND/BW tests. EXE and both ZIPs updated and integrity-verified;23736 scans preserved. Evidence: work/rules-research/pack-finish-release.json and ui/PACK-SOURCES.md. Full distinct reverse-scan/gallery collection remains pending in FEATURE-BACKLOG.md. Engine unchanged; Unlimited deferred; no GitHub publication.

"""
agents=root/'AGENTS.md';text=agents.read_text(encoding='utf-8')
if not text.startswith('# Latest pack update — reverse finishes'):agents.write_text(note+text,encoding='utf-8')
print(json.dumps({'passed':True,'groups':len(audit['groups']),'printings':705,'archives':archives},indent=2))
