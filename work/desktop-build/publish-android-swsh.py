from pathlib import Path
import hashlib,json,os,re,shutil,subprocess,zipfile
root=Path(__file__).resolve().parents[2];android=root/'work/android-build';research=root/'work/rules-research';apk=android/'ILEX.GG-SWSH-candidate.apk';target=root/'outputs/ILEX.GG-Android.apk'
load=lambda p:json.loads(p.read_text(encoding='utf-8'));sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source=load(research/'swsh-source-validation.json');desktop=load(research/'swsh-desktop-release.json');verified=load(android/'swsh-apk-verification.json');build=load(android/'swsh-build.json');mobile=load(android/'mobile-verification.json');swsh_mobile=load(android/'swsh-mobile-tests.json')
assert source['passed'] and desktop['passed'] and verified['passed'] and mobile['passed'] and swsh_mobile['passed']
assert source['engineSha256']==desktop['engineSha256']==build['engineSha256']==swsh_mobile['engineSha256']
assert len(mobile['checks'])==71 and not mobile['errors'] and verified['mobileChecks']==71
assert len(swsh_mobile['sizes'])==3 and all(r['passed'] and r['printings']==3715 for r in swsh_mobile['sizes'])
assert sha(apk)==verified['sha256']==build['sha256']
with zipfile.ZipFile(apk) as z:
 assert z.testzip() is None
 assert z.read('assets/ui/swsh-coverage.json')==(root/'work/desktop/ui/swsh-coverage.json').read_bytes()
 for name in ['rules-engine.js','rules-match.js','bot-ai.js','rules-card-map.json','cards.json','scan-manifest.json']:
  assert z.read('assets/ui/'+name)==(root/'work/desktop/ui'/name).read_bytes(),name
java=Path(r'C:/Program Files/Java/jdk-17.0.2/bin/java.exe');signer=android/'toolchain/build-tools/android-16/lib/apksigner.jar'
def certificate(file):
 output=subprocess.run([str(java),'-jar',str(signer),'verify','--verbose','--print-certs',str(file)],capture_output=True,text=True,check=True).stdout
 return re.search(r'Signer #1 certificate SHA-256 digest: (\S+)',output).group(1)
assert certificate(target)==certificate(apk),'The original Android signing certificate must be retained'
shutil.copy2(apk,target);build['apk']=str(target);(root/'outputs/ILEX.GG-Android-build.json').write_text(json.dumps(build,indent=2),encoding='utf-8')
environment={k:v for k,v in os.environ.items() if not k.startswith('ILEX_ANDROID_')}
subprocess.run([r'C:/Users/Kenneth/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',str(android/'verify.py')],env=environment,check=True,capture_output=True,text=True)
report={'passed':True,'version':'1.16.0-android.19','versionCode':19,'engineSha256':source['engineSha256'],'sha256':sha(target),'sameSigningCertificateAsPrevious':True,'mobileChecks':71,'swshLandscapeSizes':3,'apkChecks':len(verified['checks']),'bundledScans':285,'physicalAndroidDeviceTested':False,'limits':verified['limits']}
(research/'swsh-android-release.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))
