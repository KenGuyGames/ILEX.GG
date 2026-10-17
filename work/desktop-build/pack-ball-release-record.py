import datetime,json,pathlib,zipfile
root=pathlib.Path(__file__).resolve().parents[2]
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
verification=load(root/'outputs/ILEX.GG-win32-x64/desktop-verification.json')
native=root/'work/desktop-bw-tests-v74'
assert verification['passed'] and verification['native']['pack-native-tests']['passed']
assert load(native/'pack-native-tests-fresh.json')['passed']
model=load(root/'work/pack-test-report.json');prism=next(p for p in model['profiles'] if p['id']=='sv08.5');assert prism['pools']['reverse']==108 and prism['pools']['pokeball']==100 and prism['pools']['masterball']==67
assert verification['native']['pack-native-tests']['restored']
audit=load(root/'work/rules-research/pack-subset-audit.json');assert audit['passed'] and audit['printingsGenerated']==705
ball=load(root/'work/rules-research/pack-ball-audit.json');assert ball['passed'] and ball['printings']==505
assert len([c for c in verification['native']['pack-native-tests']['checks'] if c.startswith('Added-set ball collection filter shows finish:')])==5
archives=[]
for name in ['ILEX.GG-Windows.zip','ILEX.GG-Windows-Offline.zip']:
 path=root/'outputs'/name
 assert not path.with_suffix('.pending.zip').exists()
 with zipfile.ZipFile(path) as archive:
  assert json.loads(archive.read('ILEX.GG-win32-x64/desktop-verification.json'))==verification
  for file in ['pack-model.js','packs.js','pack-finishes.js','pack-finish-view.js','packs.css','app.js','tabletop.js']:
   assert archive.read('ILEX.GG-win32-x64/resources/app/ui/'+file)==(root/'work/desktop/ui'/file).read_bytes()
 archives.append({'file':name,'bytes':path.stat().st_size,'crcAndEmbeddedFilesVerified':True})
evidence={'passed':True,'engineSha256':verification['engineSha256'],'engineUnchanged':True,'nativeProfile':str(native),'freshAndRestored':True,'prismaticFinishes':{k:prism['pools'][k] for k in ['reverse','pokeball','masterball']},'renderedOverBaseScans':True,'packChecks':len(model['checks']),'ballAudit':ball,'subsetAudit':audit,'native':verification['native']['pack-native-tests'],'archives':archives,'verifiedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
(root/'work/rules-research/pack-ball-release.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
note="""# Latest pack update — other Poké Ball/Master Ball sets (October 17, 2026)

Extended ball finish generation from the Prismatic-only condition to per-printing eligibility. Black Bolt and White Flare each add80 Poké Ball and72 Master Ball variants; Ascended Heroes adds34 eligible Poké Ball variants and no Master Balls. Cached audit covers4,898 modern English card records across27 expansion/Energy/promo catalogs. Generic Energy/promo records are not injected into packs; English151 and other Ascended Heroes patterns are excluded from ball pools. All505 supported ball variants (including Prismatic167) are individually reached through the actual generator;338 newly available. Pack sizes and independent ordinary reverse/chase slots remain. Master Ball base estimate for BLK/WHT is1/15 from preliminary published set-guide data; no numerical rate copy is exposed in the UI. All finishes remain cosmetic patterns over base scans, not separate variant images.303 model checks,705 subset reachability checks and nativev74 fresh/restored pass, including the five added set/finish combinations, hidden identities, pattern/magnification, My pulls paging/filtering and saved inventory. EXE plus compact/offline ZIPs updated and integrity verified,23736 scans preserved; engine unchanged. Evidence: work/rules-research/pack-ball-audit.json, pack-ball-release.json and work/desktop/ui/PACK-SOURCES.md. Unlimited deferred; no GitHub publication. Other reverse-scan/gallery backlog work remains pending.

"""
agents=root/'AGENTS.md';text=agents.read_text(encoding='utf-8')
if not text.startswith('# Latest pack update — other Poké Ball/Master Ball sets'):agents.write_text(note+text,encoding='utf-8')
print(json.dumps({'passed':True,'groups':len(audit['groups']),'printings':705,'archives':archives},indent=2))
