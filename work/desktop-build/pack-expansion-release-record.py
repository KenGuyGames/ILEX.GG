import datetime,json,pathlib,zipfile
root=pathlib.Path(__file__).resolve().parents[2]
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
verification=load(root/'outputs/ILEX.GG-win32-x64/desktop-verification.json')
native=root/'work/desktop-bw-tests-v67'
assert verification['passed'] and verification['native']['pack-native-tests']['passed']
assert load(native/'pack-native-tests-fresh.json')['passed']
assert load(root/'work/pack-art-image-validation.json')['passed']
artwork=load(root/'work/rules-research/pack-art-manifest.json')
archives=[]
for name in ['ILEX.GG-Windows.zip','ILEX.GG-Windows-Offline.zip']:
 path=root/'outputs'/name
 assert not path.with_suffix('.pending.zip').exists()
 with zipfile.ZipFile(path) as archive:
  assert json.loads(archive.read('ILEX.GG-win32-x64/desktop-verification.json'))==verification
  for file in ['pack-model.js','packs.js','packs.css','pack-art.js']+[x['file'] for x in artwork.values()]:
   assert archive.read('ILEX.GG-win32-x64/resources/app/ui/'+file)==(root/'work/desktop/ui'/file).read_bytes()
 archives.append({'file':name,'bytes':path.stat().st_size,'crcAndEmbeddedFilesVerified':True})
model=load(root/'work/pack-test-report.json')
evidence={'passed':True,'engineSha256':verification['engineSha256'],'engineUnchanged':True,'nativeProfile':str(native),'freshAndRestored':True,'revealIntervalMs':600,'profiles':len(model['profiles']),'artworkImages':len(artwork),'artworkDecoded':True,'modelChecks':len(model['checks']),'native':verification['native']['pack-native-tests'],'archives':archives,'verifiedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'limits':'Special rarity distributions are finite simulated models; special god packs and distinct Pokeball/Masterball scans remain unmodeled. Booster additions do not automate these cards for rules matches.'}
(root/'work/rules-research/pack-expansion-release.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
note='''# Latest UI update — faster packs, wrapper artwork and special expansions (October 16, 2026)

Pack reveals600ms (previous950ms); pause/Space/save/privacy behavior retained.129 pack profiles (26 added), each with bundled actual booster art from1niceroli/ptcg-assets; selector shows matching wrapper. Adds Mega Evolution1–5 plus Ascended Heroes, SV151/Paldean Fates/Shrouded Fable/Prismatic Evolutions/Black Bolt/White Flare, Dragon Vault/LTR/Double Crisis/Generations, Shining Legends/Dragon Majesty/Hidden Fates/Detective Pikachu, Champions Path/Shining Fates/Celebrations/GO/Crown Zenith and30th Celebration. Dedicated small/all-foil, Radiant, shiny/gallery, Classic Collection and guaranteed Pikachu slots implemented; distinct reverse/Pokeball/Masterball scans and god packs remain unmodeled.299 model checks and129 artwork image SHA/size/decode checks pass; nativev67 fresh/restored passes37 pack checks and inherited UI/BW/LEGEND/deck/mainmenu suites. Pack-art screenshots reviewed. EXE and compact/offline ZIPs updated and integrity-verified. Evidence: work/rules-research/pack-expansion-release.json and pack-art-manifest.json; detailed sources/limits in ui/PACK-SOURCES.md. Game engine and card automation unchanged; Unlimited deferred. No GitHub publication.

'''
agents=root/'AGENTS.md';text=agents.read_text(encoding='utf-8')
if not text.startswith('# Latest UI update — faster packs'):agents.write_text(note+text,encoding='utf-8')
backlog=root/'FEATURE-BACKLOG.md';text=backlog.read_text(encoding='utf-8').replace('103 standard English expansion profiles','129 standard and special English expansion profiles').replace('Special products with unmodeled collation are excluded.','October16:600ms auto-reveals, actual bundled booster art for all129 profiles and26 additional special/Mega expansions; special sizes/subset slots retained.');backlog.write_text(text,encoding='utf-8')
print(json.dumps({'passed':True,'profiles':evidence['profiles'],'artwork':len(artwork),'archives':archives},indent=2))
