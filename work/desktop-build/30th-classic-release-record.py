import datetime,json,pathlib,zipfile
root=pathlib.Path(__file__).resolve().parents[2]
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
verification=load(root/'outputs/ILEX.GG-win32-x64/desktop-verification.json')
native=root/'work/desktop-bw-tests-v68'
assert verification['passed'] and verification['native']['pack-native-tests']['passed']
assert load(native/'pack-native-tests-fresh.json')['passed']
archives=[]
for name in ['ILEX.GG-Windows.zip','ILEX.GG-Windows-Offline.zip']:
 path=root/'outputs'/name
 assert not path.with_suffix('.pending.zip').exists()
 with zipfile.ZipFile(path) as archive:
  assert json.loads(archive.read('ILEX.GG-win32-x64/desktop-verification.json'))==verification
  for file in ['pack-model.js','packs.js']:
   assert archive.read('ILEX.GG-win32-x64/resources/app/ui/'+file)==(root/'work/desktop/ui'/file).read_bytes()
 archives.append({'file':name,'bytes':path.stat().st_size,'crcAndEmbeddedFilesVerified':True})
model=load(root/'work/pack-test-report.json')
assert model['classicPrintingsSeen']==30 and model['sampled30thPacks']==20000
evidence={'passed':True,'engineSha256':verification['engineSha256'],'engineUnchanged':True,'nativeProfile':str(native),'freshAndRestored':True,'modelChecks':len(model['checks']),'classicPrintingsSeen':30,'sampled30thPacks':20000,'native':verification['native']['pack-native-tests'],'archives':archives,'verifiedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'limits':'Classic base-pack frequency is modeled, not an officially published measured rate; dedicated UPC Classic packs are not added.'}
(root/'work/rules-research/30th-classic-release.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
note='''# Latest pack update —30th Classic Collection (October 16, 2026)

All30 printings from30th-c can now replace the rare-hit position in ordinary30th packs. No separate pack/set option;129 profiles retained. Six-card structure (five foil plus Energy), guaranteed Pikachu and foil Energy remain. Classics get collection labels and chase shine; My pulls maps30th-c to30th/Mega Evolution (also maps Celebrations Classics to their parent era). Source notes distinguish UPC Classic boosters from reported ordinary-pack inclusion; exact physical rates unpublished, so slot frequency remains a simulation estimate.301 model checks/172900 generated packs, including20000 anniversary packs reaching all30 Classics, pass. Nativev68 fresh/restored verifies actual Classic roll, pack size/guarantees, reveal labeling/shine, era collection filtering and persistence alongside inherited suites. EXE and both ZIPs updated and integrity-verified. Evidence: work/rules-research/30th-classic-release.json. Game engine unchanged, Unlimited deferred, no GitHub publication.

'''
agents=root/'AGENTS.md';text=agents.read_text(encoding='utf-8')
if not text.startswith('# Latest pack update —30th Classic Collection'):agents.write_text(note+text,encoding='utf-8')
print(json.dumps({'passed':True,'classicPrintings':30,'archives':archives},indent=2))
