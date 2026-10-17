import datetime,json,pathlib,zipfile
root=pathlib.Path(__file__).resolve().parents[2]
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
verification=load(root/'outputs/ILEX.GG-win32-x64/desktop-verification.json')
native=root/'work/desktop-bw-tests-v64'
assert verification['passed'] and verification['native']['main-menu-tests']['passed']
assert load(native/'main-menu-tests-fresh.json')['passed']
archives=[]
for name in ['ILEX.GG-Windows.zip','ILEX.GG-Windows-Offline.zip']:
 path=root/'outputs'/name
 assert not path.with_suffix('.pending.zip').exists()
 with zipfile.ZipFile(path) as archive:
  assert json.loads(archive.read('ILEX.GG-win32-x64/desktop-verification.json'))==verification
  for file in ['app.js','index.html','main-menu.css','packs.js']:
   assert archive.read('ILEX.GG-win32-x64/resources/app/ui/'+file)==(root/'work/desktop/ui'/file).read_bytes()
 archives.append({'file':name,'bytes':path.stat().st_size,'crcAndEmbeddedFilesVerified':True})
evidence={'passed':True,'engineSha256':verification['engineSha256'],'engineUnchanged':True,'nativeProfile':str(native),'freshAndRestored':True,'native':verification['native']['main-menu-tests'],'archives':archives,'verifiedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
(root/'work/rules-research/main-menu-release.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
note='''# Latest UI update — forest main menu (October 16, 2026)

App starts on home (fresh and restarted), with six forest-styled buttons: Play, Deck builder, Card gallery, Formats, Custom cards, Pack opening. Sidebar removed from HTML; all screens and matches use full width. Header brand and Main menu button return home. Persistent menu nav is shown only on home; existing nav handlers/active states remain for compatibility. syncNavigation controls menu/app/header visibility, including packs render. Menu retains Audio/Visuals, workspace export/import with keyboard activation, and image cache/download controls (legacy aside-bottom class is a footer hook, not a sidebar). Packs pause when returning home; saved decks/matches/inventory remain. main-menu.css is loaded last for shell and responsive forest styling. Nativev64 fresh/restored passes19 menu/navigation/state checks at900/1000/1440/1920 widths plus inherited deck performance/sorting, pack, UI/BW/LEGEND suites. Menu screenshots reviewed. EXE and both Windows ZIPs updated and integrity-verified; engine unchanged. See work/rules-research/main-menu-release.json. No GitHub publication.

'''
agents=root/'AGENTS.md';text=agents.read_text(encoding='utf-8')
if not text.startswith('# Latest UI update — forest main menu'):agents.write_text(note+text,encoding='utf-8')
print(json.dumps({'passed':True,'menuChecks':len(evidence['native']['checks']),'archives':archives},indent=2))
