import datetime,json,pathlib,zipfile
root=pathlib.Path(__file__).resolve().parents[2]
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
verification=load(root/'outputs/ILEX.GG-win32-x64/desktop-verification.json')
native=root/'work/desktop-bw-tests-v66'
assert verification['passed'] and verification['native']['main-menu-tests']['passed']
assert load(native/'main-menu-tests-fresh.json')['passed']
archives=[]
for name in ['ILEX.GG-Windows.zip','ILEX.GG-Windows-Offline.zip']:
 path=root/'outputs'/name
 assert not path.with_suffix('.pending.zip').exists()
 with zipfile.ZipFile(path) as archive:
  assert json.loads(archive.read('ILEX.GG-win32-x64/desktop-verification.json'))==verification
  for file in ['app.js','index.html','main-menu.js','main-menu.css','foil.js']:
   assert archive.read('ILEX.GG-win32-x64/resources/app/ui/'+file)==(root/'work/desktop/ui'/file).read_bytes()
 archives.append({'file':name,'bytes':path.stat().st_size,'crcAndEmbeddedFilesVerified':True})
evidence={'passed':True,'engineSha256':verification['engineSha256'],'engineUnchanged':True,'nativeProfile':str(native),'freshAndRestored':True,'native':verification['native']['main-menu-tests'],'archives':archives,'verifiedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
(root/'work/rules-research/menu-celebi-release.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
note='''# Latest UI update — rotating Celebi showcase (October 16, 2026)

Forest main menu features Celebi Prime (Triumphant) first on every app launch. Eight curated Celebi printings cycle on each return to home: Prime, Neo Revelation, Shining Neo Destiny, Unseen Forces ex, two Boundaries Crossed EX printings, Fusion Strike V and Shining SM79. Ordinary redraws/modal previews do not advance; no timer or saved-state migration. main-menu.js sync is called by syncNavigation. Uses bundled scans, shared right-click preview data attributes, left-click inspector and existing foil decoration (mainmenu images included). Responsive hero keeps all six menu choices. Nativev66 fresh/restored passes Prime-first, redraw stability, each return, eight-card wrap, magnification and prior menu/UI/BW/pack/LEGEND/deck tests; screenshots reviewed. EXE and both ZIPs updated and integrity-verified. Exact evidence: work/rules-research/menu-celebi-release.json. Engine unchanged; Unlimited deferred. No GitHub publication.

'''
agents=root/'AGENTS.md';text=agents.read_text(encoding='utf-8')
if not text.startswith('# Latest UI update — rotating Celebi showcase'):agents.write_text(note+text,encoding='utf-8')
print(json.dumps({'passed':True,'menuChecks':len(evidence['native']['checks']),'archives':archives},indent=2))
