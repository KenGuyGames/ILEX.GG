import datetime,hashlib,json,pathlib,zipfile
root=pathlib.Path(__file__).resolve().parents[2]
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
native=root/'work/desktop-bw-tests-v78'
verification=load(root/'outputs/ILEX.GG-win32-x64/desktop-verification.json')
report=load(native/'pack-native-tests.json');assert verification['passed'] and report['passed'] and report['restored'] and load(native/'pack-native-tests-fresh.json')['passed']
assert report['saved']['pack']['variant']=='prismatic-eevee'
assert len([c for c in report['checks'] if c.startswith('Special-pack celebration follows final reveal:')])==6
audit=load(root/'work/rules-research/god-pack-audit.json');assert audit['passed'] and len(audit['layouts'])==6 and audit['sampledPacks']==500000
archives=[]
for name in ['ILEX.GG-Windows.zip','ILEX.GG-Windows-Offline.zip']:
 p=root/'outputs'/name;assert not p.with_suffix('.pending.zip').exists()
 with zipfile.ZipFile(p) as z:
  assert json.loads(z.read('ILEX.GG-win32-x64/desktop-verification.json'))==verification
  for file,sha in audit['hashes'].items():
   assert digest(root/'work/desktop/ui'/file)==sha
   assert hashlib.sha256(z.read('ILEX.GG-win32-x64/resources/app/ui/'+file)).hexdigest()==sha
 archives.append({'file':name,'bytes':p.stat().st_size,'crcAndEmbeddedFilesVerified':True})
evidence={'passed':True,'engineSha256':verification['engineSha256'],'engineUnchanged':True,'freshAndRestored':True,'nativeProfile':str(native),'audit':audit,'native':report,'physicalOddsKnown':False,'archives':archives,'verifiedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
(root/'work/rules-research/god-pack-release.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
note='''# Latest pack update — English god and demigod packs (October17,2026)

Six rare special layouts across five existing English expansions:151 starter-line demigod (2IR+1SIR), Prismatic full Master Ball Eevee+all9 family SIRs and triple-SIR demigod, Black Bolt/White Flare9IR+1SIR, Ascended Heroes3MAR+7SIR. Full layouts include foil Basic Energy; every layout remains11 cards. Physical trigger rates are unpublished; simulation estimates use the existing rarity adjustment internally with no rate/comparison copy or forced-special controls in the UI. Other124 sets do not get unsupported special layouts; Japanese-only configurations remain excluded. pack-specials.js uses strict printed rarity pools (Ascended MAR separate from SIR), one-time pre-reveal roll and persisted packVariant. Celebration appears after all cards reveal, preserving card-back privacy and sequential suspense. Ordinary-slot regressions opt out of special replacements;500,000 production-generator samples validate all6 layouts, trigger boundaries/frequencies, all3 starter branches, exact finishes/pools and unsupported sets.303 ordinary checks,505 ball cases,318 Ascended-pattern cases and705 subset cases remain passing. Nativev78 fresh/restored validates all6 UI layouts, one-time commit, partial reveal, no reroll, finish-specific inventory and exact restart of a partly revealed Eeveelution god pack. Six screenshots reviewed. Artwork probes use bounded complete/naturalWidth checks and finish the prior pack only after exact restored-state comparison, preventing auto-reveal from replacing an awaited image; prior v77 harness timeout/retry evidence is retained. EXE plus compact/offline ZIPs updated and integrity verified;23736 scans preserved. Engine unchanged; Unlimited deferred; no GitHub publication. Evidence: work/rules-research/god-pack-audit.json and god-pack-release.json. Sources and estimated-rate limitations: work/desktop/ui/PACK-SOURCES.md. Other backlog features remain pending.

'''
p=root/'AGENTS.md';s=p.read_text(encoding='utf-8')
if not s.startswith('# Latest pack update — English god and demigod packs'):p.write_text(note+s,encoding='utf-8')
print(json.dumps({'passed':True,'sets':5,'layouts':6,'nativeChecks':len(report['checks']),'archives':archives},indent=2))
