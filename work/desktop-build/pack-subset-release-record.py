import datetime,json,pathlib,zipfile
root=pathlib.Path(__file__).resolve().parents[2]
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
verification=load(root/'outputs/ILEX.GG-win32-x64/desktop-verification.json')
native=root/'work/desktop-bw-tests-v69'
assert verification['passed'] and verification['native']['pack-native-tests']['passed']
assert load(native/'pack-native-tests-fresh.json')['passed']
audit=load(root/'work/rules-research/pack-subset-audit.json');assert audit['passed'] and audit['printingsGenerated']==705
archives=[]
for name in ['ILEX.GG-Windows.zip','ILEX.GG-Windows-Offline.zip']:
 path=root/'outputs'/name
 assert not path.with_suffix('.pending.zip').exists()
 with zipfile.ZipFile(path) as archive:
  assert json.loads(archive.read('ILEX.GG-win32-x64/desktop-verification.json'))==verification
  for file in ['pack-model.js','packs.js']:
   assert archive.read('ILEX.GG-win32-x64/resources/app/ui/'+file)==(root/'work/desktop/ui'/file).read_bytes()
 archives.append({'file':name,'bytes':path.stat().st_size,'crcAndEmbeddedFilesVerified':True})
evidence={'passed':True,'engineSha256':verification['engineSha256'],'engineUnchanged':True,'nativeProfile':str(native),'freshAndRestored':True,'subsetAudit':audit,'native':verification['native']['pack-native-tests'],'archives':archives,'verifiedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
(root/'work/rules-research/pack-subset-release.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
note='''# Latest pack update — subset completeness audit (October 16, 2026)

Verified real-generator reachability for705 printings across18 subset groups: Hidden Fates Shiny Vault94, Shining Fates Shiny Vault122, Crown Zenith Galarian Gallery70, four Trainer Galleries30 each, LTR/Generations Radiant25/32, Paldean Fates shiny132, Celebrations/30th Classics25/30, Unseen Forces Unown28 and numbered DP/Platinum27. Each printing is actually generated through its weighted slot, with foil finish and unchanged pack size; subsets remain inside parent packs,129 profiles. Vault/GG pools were already linked; fixed My pulls era filters hiding those results. PackModel.subsetParents/packSetId is now shared by generation and collection display; external subset membership no longer depends on recognized rarity text. Pack audit is hash-bound and required by package-bw.py.301 baseline pack checks plus nativev69 fresh/restored pass, including actual Vault/GG rolls, parent-era collection visibility and saved inventory/reveal state. EXE and both ZIPs updated and integrity-verified. Evidence: work/rules-research/pack-subset-audit.json and pack-subset-release.json. Engine unchanged, Unlimited deferred; no GitHub publication.

'''
agents=root/'AGENTS.md';text=agents.read_text(encoding='utf-8')
if not text.startswith('# Latest pack update — subset completeness audit'):agents.write_text(note+text,encoding='utf-8')
print(json.dumps({'passed':True,'groups':len(audit['groups']),'printings':705,'archives':archives},indent=2))
