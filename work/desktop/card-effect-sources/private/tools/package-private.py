"""Package a separately named Windows preview. Never overwrite the normal release/APK."""
from pathlib import Path
import concurrent.futures,hashlib,json,shutil,zipfile
root=Path(__file__).resolve().parents[2];candidate=root/'work/private-desktop-candidate';ui=candidate/'resources/app/ui';research=root/'work/rules-research';out=root/'outputs/ILEX.GG-Private-win32-x64';legacy=root/'work/private-acceptance-v3';final=[legacy/'private-native-tests-fresh.json',legacy/'private-native-tests.json']
def sha(f):
 h=hashlib.sha256()
 with f.open('rb') as s:
  for b in iter(lambda:s.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
read=lambda f:json.loads(f.read_text(encoding='utf-8'));engine=sha(ui/'rules-engine.js');assert engine=='d31da38c530531718e546471fbf59ae49714b70a2bc02133132385b322a0378d'
core=read(research/'private-match-tests.json');peer=read(research/'private-peer-tests.json');assert core['passed'] and peer['passed'];assert core['checks']==15 and peer['checks']==4;assert core['engineSha256']==engine and core['coreSha256']==sha(ui/'private-match.js') and peer['peerSha256']==sha(ui/'private-peer.js')
native=[]
for f in final:
 assert not (f.parent/'failure.txt').exists();r=read(f);assert r['passed'] and r['engineSha256']==engine
 assert not r['actualRTCConnectionVerified'] and not r['externalWindowsPCsTested']
 for n,h in r['hashes'].items():assert sha(ui/n)==h,n
 native.append(r)
assert not (legacy/'failure.txt').exists()
inherited=['desktop-tests','persistence','audio-tests','foil-tests','bot-ui-tests','card-action-tests','pile-count-tests','deck-filter-tests','deck-performance-tests','deck-sort-native-tests','main-menu-tests','pack-native-tests','table-repair-native-tests','realistic-native-tests','xy-native-tests','sm-native-tests','swsh-native-tests','sv-native-tests']
for label in ['', '-fresh']:
 for n in inherited:
  if label and n=='persistence':continue
  r=read(legacy/(n+label+'.json'));assert r['passed'],n+label
  if 'engineSha256' in r:assert r['engineSha256']==engine,n
manifest=read(ui/'scan-manifest.json');assert len(manifest)==23838
def check_scan(item):
 ident,e=item;f=candidate/'resources'/e['file'];assert f.stat().st_size==e['bytes'] and sha(f)==e['sha256'],ident
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(check_scan,manifest.items()))
base=root/'work/private-baseline-ui';finish=[f for f in (base/'finish-scans').rglob('*') if f.is_file()];assert len(finish)==209
for f in finish:assert sha(f)==sha(ui/f.relative_to(base)),f
print('Preview rules, protocol, simulated two-window, inherited fresh/restored, scans and finishes verified.',flush=True)
archive=candidate/'resources/app/card-effect-sources';archive.mkdir(parents=True,exist_ok=True);shutil.copytree(root/'outputs/ILEX.GG-win32-x64/resources/app/card-effect-sources',archive,dirs_exist_ok=True)
sources={}
for n in ['private-match.js','private-peer.js','private-online.js','private-online.css','audio.js','presentation.js','index.html']:sources['private/'+n]=ui/n
for f in (root/'work/desktop-build').glob('*private*'):
 if f.is_file():sources['private/tools/'+f.name]=f
for n in ['private-native-tests.cjs','private-self-test.cjs','private-test-rtc.js','PRIVATE-MULTIPLAYER.md']:sources['private/'+n]=root/'work/desktop'/n
sources['private/main.cjs']=candidate/'resources/app/main.cjs'
for n,f in sources.items():
 dst=archive/n
 if not dst.parent.is_dir():dst.parent.mkdir(parents=True,exist_ok=True)
 shutil.copy2(f,dst)
(archive/'private-source-manifest.json').write_text(json.dumps({'engineSha256':engine,'baseline':'Released SV plus Evosoda and Psychic Embrace fixes; previous provenance retained as historical evidence','files':[{'path':n,'sha256':sha(f)} for n,f in sorted(sources.items())]},indent=2),encoding='utf-8')
audit=candidate/'resources/app/validation/private';audit.mkdir(parents=True,exist_ok=True)
for n in ['private-match-tests.json','private-peer-tests.json','evosoda-fix.json','psychic-embrace-fix.json']:
 f=research/n
 if f.exists():shutil.copy2(f,audit/n)
for i,f in enumerate(final):shutil.copy2(f,audit/('private-native-'+str(i)+'.json'))
for n in inherited:shutil.copy2(legacy/(n+'.json'),audit/(n+'.json'))
guide=root/'work/desktop/PRIVATE-MULTIPLAYER.md';shutil.copy2(guide,candidate/'PRIVATE-MULTIPLAYER.md');shutil.copy2(root/'FEATURE-BACKLOG.md',candidate/'FEATURE-BACKLOG.md')
report={'status':'windows-private-preview-real-network-unverified','version':'1.18.0-private.1','engineSha256':engine,'engineChangedFromFrozenRelease':False,'coreChecks':15,'protocolChecks':4,'simulatedTwoWindowChecks':[len(r['checks']) for r in native],'inheritedFreshAndRestored':True,'verifiedScans':23838,'retainedFinishImages':209,'opponentApprovalRequiredForUndo':True,'paidInfrastructureRequired':False,'actualRTCConnectionVerified':False,'externalWindowsPCsTested':False,'networkEnvironment':{'UDP_loopback':'timed out','TCP_loopback':'EACCES','actualWebRTCTrials':'work/private-native-v1 through v8 failed; diagnostics retained'},'limits':['Real two-PC and Internet/NAT acceptance pending','No TURN relay; restrictive networks may not connect','Trusted host can inspect full state','Custom-card networking, Android multiplayer and matchmaking deferred','Unlimited interactions remain deferred']}
(candidate/'desktop-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');(audit/'preview-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(candidate/'README.md').write_text('# ILEX.GG 1.18.0 private Windows preview\n\nStart ILEX.GG.exe and choose Private multiplayer. Read PRIVATE-MULTIPLAYER.md for invite/response steps and reconnect controls. Both players need this same preview.\n\nOpponent approval is mandatory for Undo. Guest views exclude hidden opponent data and the private journal/seed. No paid infrastructure or account is required; there is no relay fallback.\n\nREAL TWO-PC CONNECTION ACCEPTANCE IS PENDING. The development sandbox blocked socket tests. The native two-window acceptance uses explicitly simulated delivery. See desktop-verification.json for exact limits. The normal Windows release and Android APK are not replaced.\n\nThe frozen released card engine includes the Evosoda and Psychic Embrace fixes. Historical formats and existing local features remain available. BW onward; Unlimited deferred. Verified reverse scan acquisition remains incomplete.\n\nClose your current ILEX.GG before opening this preview. It uses the existing workspace and separate online recovery storage. Keep the folder together. Windows executable remains unsigned.\n',encoding='utf-8')
(candidate/'START HERE.txt').write_text('ILEX.GG private Windows preview\n\nClose any current ILEX.GG window. Open ILEX.GG.exe here, then Private multiplayer.\nShare invite and response codes. Both players confirm Ready. Undo requires opponent approval.\nRead PRIVATE-MULTIPLAYER.md: real two-PC connectivity still needs acceptance testing.\n',encoding='utf-8')
assert out.resolve().is_relative_to((root/'outputs').resolve())
def changed(pair):
 src,dst=pair
 if not dst.exists() or src.stat().st_size!=dst.stat().st_size or sha(src)!=sha(dst):shutil.copy2(src,dst)
files=[f for f in candidate.rglob('*') if f.is_file()]
for d in sorted({out/f.relative_to(candidate).parent for f in files},key=lambda p:len(p.parts)):
 if not d.is_dir():d.mkdir(parents=True,exist_ok=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(changed,[(f,out/f.relative_to(candidate)) for f in files]))
archives=[];scan_paths={out/'resources'/e['file'] for e in manifest.values()}
for offline in [False,True]:
 target=root/('outputs/ILEX.GG-Private-Windows-Offline.zip' if offline else 'outputs/ILEX.GG-Private-Windows.zip');pending=target.with_suffix('.pending.zip');print('Building '+target.name,flush=True)
 with zipfile.ZipFile(pending,'w',allowZip64=True,compression=zipfile.ZIP_DEFLATED,compresslevel=1) as z:
  for f in out.rglob('*'):
   if not f.is_file():continue
   scan=f.is_relative_to(out/'resources/scans')
   if scan and (not offline or f not in scan_paths):continue
   z.write(f,f.relative_to(out.parent),compress_type=zipfile.ZIP_STORED if scan else zipfile.ZIP_DEFLATED,compresslevel=1)
 with zipfile.ZipFile(pending) as z:
  assert z.testzip() is None
  assert len([n for n in z.namelist() if '/resources/scans/' in n])==(len(scan_paths) if offline else 0)
  assert hashlib.sha256(z.read(out.name+'/resources/app/ui/rules-engine.js')).hexdigest()==engine
 pending.replace(target);archives.append({'path':str(target),'bytes':target.stat().st_size,'sha256':sha(target),'crcPassed':True});print(json.dumps(archives[-1]),flush=True)
report.update(archives=archives,executable=str(out/'ILEX.GG.exe'),executableSha256=sha(out/'ILEX.GG.exe'));(research/'private-preview-release.json').write_text(json.dumps(report,indent=2),encoding='utf-8');(root/'outputs/ILEX.GG-Private-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');shutil.copy2(guide,root/'outputs/ILEX.GG-Private-Guide.md');print('Separate private Windows preview packaged; stable release and APK untouched.',flush=True)
