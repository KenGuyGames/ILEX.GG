from pathlib import Path
import hashlib,json,os,re,shutil,subprocess,zipfile
root=Path(__file__).resolve().parents[2];android=root/'work/android-build';research=root/'work/rules-research';apk=android/'ILEX.GG-SV-candidate.apk';target=root/'outputs/ILEX.GG-Android.apk';ui=root/'work/sv-desktop-candidate/resources/app/ui'
load=lambda p:json.loads(p.read_text(encoding='utf-8'));sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source=load(research/'sv-source-validation.json');desktop=load(research/'sv-desktop-release.json');verified=load(android/'sv-apk-verification.json');build=load(android/'sv-build.json');mobile=load(android/'mobile-verification.json');svmobile=load(android/'sv-mobile-tests.json')
assert all(r['passed'] for r in [source,desktop,verified,mobile,svmobile])
assert source['engineSha256']==desktop['engineSha256']==build['engineSha256']==svmobile['engineSha256']
assert len(mobile['checks'])==112 and not mobile['errors'] and verified['mobileChecks']==112
assert len(svmobile['sizes'])==3 and all(r['passed'] and r['printings']==3694 for r in svmobile['sizes'])
assert sha(apk)==verified['sha256']==build['sha256'] and build['bundledScans']==395
with zipfile.ZipFile(apk) as z:
 assert z.testzip() is None
 for name in ['sv-coverage.json','rules-engine.js','rules-match.js','bot-ai.js','rules-card-map.json','cards.json','scan-manifest.json']:
  assert z.read('assets/ui/'+name)==(ui/name).read_bytes(),name
 finish_files=[f for f in (ui/'finish-scans').rglob('*') if f.is_file()];assert len(finish_files)==209
 for f in finish_files:assert z.read('assets/ui/'+f.relative_to(ui).as_posix())==f.read_bytes(),f.name
java=Path(r'C:/Program Files/Java/jdk-17.0.2/bin/java.exe');signer=android/'toolchain/build-tools/android-16/lib/apksigner.jar'
def certificate(file):
 text=subprocess.run([str(java),'-jar',str(signer),'verify','--verbose','--print-certs',str(file)],capture_output=True,text=True,check=True).stdout
 return re.search(r'Signer #1 certificate SHA-256 digest: (\S+)',text).group(1)
assert certificate(target)==certificate(apk),'Original Android certificate must be retained'
shutil.copy2(apk,target);assert sha(target)==verified['sha256'];build['apk']=str(target)
if apk.with_suffix('.apk.idsig').exists():shutil.copy2(apk.with_suffix('.apk.idsig'),target.with_suffix('.apk.idsig'))
(root/'outputs/ILEX.GG-Android-build.json').write_text(json.dumps(build,indent=2),encoding='utf-8')
shutil.copy2(android/'sv-apk-verification.json',root/'outputs/ILEX.GG-Android-verification.json')
report={'passed':True,'version':'1.17.0-android.23','versionCode':23,'engineSha256':source['engineSha256'],'sha256':sha(target),'sameSigningCertificateAsPrevious':True,'mobileChecks':112,'svLandscapeSizes':3,'apkChecks':len(verified['checks']),'bundledScans':395,'physicalAndroidDeviceTested':False,'limits':verified['limits']}
(research/'sv-android-release.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))
