from pathlib import Path
import json,hashlib,re
root=Path(__file__).resolve().parents[2];folder=root/'work/cube-candidate';ui=folder/'ui';dest=root/'outputs/ILEX.GG-1.22.0';app=dest/'resources/app'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
 return h.hexdigest()
hashes={p.name:sha(p) for p in ui.iterdir() if p.is_file()}
tests=read(folder/'tests.json');imports=read(folder/'import-tests.json');reg=read(folder/'regressions-final/all.json');native=[read(folder/('native-final-v4/'+n+'-tests.json')) for n in ['fresh','restored']];mobile=read(root/'work/android-build/mobile-verification.json');cubeMobile=read(root/'work/android-build/cube-mobile-tests.json');android=read(folder/'android-verification.json');build=read(folder/'android-build.json')
assert all(x['passed'] for x in [tests,imports,reg,*native,mobile,cubeMobile,android])
assert reg['engineSha256']==hashes['rules-engine.js']==cubeMobile['engineSha256']==build['engineSha256']
assert len(tests['checks'])==24 and len(imports['checks'])==6
assert len(native[0]['checks'])==21 and len(native[1]['checks'])==22
for proof in [tests,*native]:
 for n,h in proof['hashes'].items():assert hashes[n]==h,n
for p in ui.rglob('*'):
 if p.is_file():assert sha(p)==sha(app/'ui'/p.relative_to(ui)),str(p)
scans={v['file']:v for v in read(ui/'scan-manifest.json').values() if v.get('file') and v.get('sha256')}
assert len(scans)==23860
for filename,v in scans.items():assert sha(dest/'resources'/filename)==v['sha256'],filename
finish=json.JSONDecoder().raw_decode((ui/'finish-scans.js').read_text(encoding='utf-8').split('var FinishScans=',1)[1])[0];assert len(finish)==209
for v in finish.values():assert sha(app/'ui'/v['file'])==v['sha256']
assert sha(folder/'ILEX.GG-Android.apk')==android['sha256']==build['sha256']
report={'passed':True,'release':'1.22.0','hashes':hashes,'cubeChecks':len(tests['checks']),'importContractChecks':len(imports['checks']),'finalRegressionGroups':reg,'ancestorRegressionGroups':read(folder/'regressions/all.json'),'nativeChecks':[len(x['checks']) for x in native],'mobileChecks':len(mobile['checks']),'mobileErrors':mobile['errors'],'android':{**build,'staticChecks':len(android['checks']),'signingCertificate':'b7c77e1f936266ffddb0a381be15ab50fcb7c49694520044a19c91fc287bb0b1'},'data':{'core':640,'expansion':72,'coreResolved':640,'expansionResolved':71,'reserves':558,'excluded':13,'unresolvedExpansion':'Single Strike Urshifu V, Pokemon:X7; select printing in Review','colorlessStage1ChoicesRemaining':2},'regularScansVerified':len(scans),'finishImagesVerified':len(finish),'liveCubeKogaImport':native[1]['liveImport'],'limits':['Live CubeKoga desktop transport remains unverified: sandbox DNS could not resolve host; real public API/schema observed in browser and contract tests passed.','Cube drafting and matches support local and bot play only.','Arbitrary prose is descriptive; supported rule controls are executable. Custom CubeKoga card definitions require review.','Physical Android acceptance remains pending.','Finite checks do not prove every card interaction.'],'publication':'Local artifacts only'}
(folder/'release-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('Cube release validated: '+str(len(mobile['checks']))+' mobile checks; 23860 scans and209 finish images verified',flush=True)
