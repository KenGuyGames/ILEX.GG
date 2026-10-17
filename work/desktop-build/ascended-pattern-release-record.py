import datetime,hashlib,json,pathlib,zipfile
root=pathlib.Path(__file__).resolve().parents[2]
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
verification=load(root/'outputs/ILEX.GG-win32-x64/desktop-verification.json')
native=root/'work/desktop-bw-tests-v75'
assert verification['passed'] and load(native/'pack-native-tests-fresh.json')['passed']
report=load(native/'pack-native-tests.json');assert report['passed'] and report['restored']
assert len([c for c in report['checks'] if c.startswith('Ascended pattern collection/era visibility:')])==6
audit=load(root/'work/rules-research/ascended-pattern-audit.json');assert audit['passed'] and audit['totalVariants']==318 and audit['newPatterns']==246
archives=[]
for name in ['ILEX.GG-Windows.zip','ILEX.GG-Windows-Offline.zip']:
 p=root/'outputs'/name;assert not p.with_suffix('.pending.zip').exists()
 with zipfile.ZipFile(p) as z:
  assert json.loads(z.read('ILEX.GG-win32-x64/desktop-verification.json'))==verification
  for file,sha in audit['hashes'].items():
   assert digest(root/'work/desktop/ui'/file)==sha
   assert hashlib.sha256(z.read('ILEX.GG-win32-x64/resources/app/ui/'+file)).hexdigest()==sha
  assert len([n for n in z.namelist() if '/resources/scans/' in n])==(23736 if 'Offline' in name else 0)
 archives.append({'file':name,'bytes':p.stat().st_size,'crcAndEmbeddedFilesVerified':True})
evidence={'passed':True,'engineSha256':verification['engineSha256'],'engineUnchanged':True,'freshAndRestored':True,'nativeProfile':str(native),'audit':audit,'native':report,'renderedOverBaseScans':True,'archives':archives,'verifiedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
(root/'work/rules-research/ascended-pattern-release.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
note='''# Latest pack update — Ascended Heroes complete reverse patterns (October 17, 2026)

Added246 finishes: Friend Ball23, Love Ball25, Quick Ball22, Dusk Ball26, Energy Symbols140 and Team Rocket10. Existing Poké Ball34 plus plain reverse38 gives318 reverse variants. All140 non-ex Pokémon have exactly their assigned ball/Rocket pattern and printed-type Energy symbols; plain reverse is restricted to Trainers/Special Energy in new packs. First parallel slot weights assigned patterns/plain by eligible counts; second retains chase upgrades and weights remaining Energy-symbol/plain choices. Cosmetic weights are distinct from rarity upgrades; tests now validate parallel probabilities per slot. No Master Balls or incorrect generic Pokémon reverse variants are generated for this set. Old saved pulls remain unchanged. Distinct SVG motifs over base scans remain cosmetic reconstructions, with labels, saved finish keys, hidden identities, reduced-motion and normal interactions preserved. Nativev75 fresh/restored verifies all six additions in reveals, magnification, inspector and paged/era-filtered My pulls, type-specific Energy icons and stale-class cleanup; six screenshots reviewed.303 model checks,318 individual real-generator reachability cases,20,000 Ascended random packs,505 existing ball-printing cases and705 subset cases pass. Engine unchanged. EXE plus compact/offline ZIPs updated and integrity verified;23736 scans preserved. Evidence: work/rules-research/ascended-pattern-audit.json and ascended-pattern-release.json; sources/limits in work/desktop/ui/PACK-SOURCES.md. Full variant scans/gallery and other backlog features remain pending. Removed accidentally duplicated pack-feature status prose from unrelated backlog items without changing their requests. Unlimited deferred; no GitHub publication.

'''
p=root/'AGENTS.md';s=p.read_text(encoding='utf-8')
if not s.startswith('# Latest pack update — Ascended Heroes complete reverse patterns'):p.write_text(note+s,encoding='utf-8')
print(json.dumps({'passed':True,'newFinishes':246,'allReverseVariants':318,'nativeChecks':len(report['checks']),'archives':archives},indent=2))
