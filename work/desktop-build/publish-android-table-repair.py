from pathlib import Path
import hashlib,json,zipfile,subprocess,re,shutil,os
root=Path(__file__).resolve().parents[2];android=root/'work/android-build';research=root/'work/rules-research';apk=android/'ILEX.GG-Android-table-repair-candidate.apk';target=root/'outputs/ILEX.GG-Android.apk'
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
source=load(research/'xy-source-validation.json');desktop=load(research/'table-repair-desktop-release.json');verified=load(android/'table-repair-verification-report.json');mobile=load(android/'mobile-verification.json');build=load(android/'table-repair-build-report.json')
assert source['passed'] and desktop['passed'] and verified['passed'] and mobile['passed']
assert source['engineSha256']==desktop['engineSha256']==build['engineSha256']
repairs=load(android/'table-repair-mobile-tests.json');assert repairs['passed'] and len(repairs['sizes'])==3 and all(r['passed'] for r in repairs['sizes'])
assert len(mobile['checks'])==59 and verified['mobileChecks']==59
assert hashlib.sha256(apk.read_bytes()).hexdigest()==verified['sha256']==build['sha256']
with zipfile.ZipFile(apk) as z:
 assert z.testzip() is None
 assert z.read('assets/ui/xy-coverage.json')==(root/'work/desktop/ui/xy-coverage.json').read_bytes()
 assert hashlib.sha256(z.read('assets/ui/rules-engine.js')).hexdigest()==source['engineSha256']
java=Path(r'C:/Program Files/Java/jdk-17.0.2/bin/java.exe');signer=android/'toolchain/build-tools/android-16/lib/apksigner.jar'
def certificate(file):
 output=subprocess.run([str(java),'-jar',str(signer),'verify','--verbose','--print-certs',str(file)],capture_output=True,text=True,check=True).stdout
 return re.search(r'Signer #1 certificate SHA-256 digest: (\S+)',output).group(1)
old_cert=certificate(target);new_cert=certificate(apk);assert old_cert==new_cert,'Original update signing certificate must be preserved'
shutil.copy2(apk,target);build['apk']=str(target);(root/'outputs/ILEX.GG-Android-build.json').write_text(json.dumps(build,indent=2),encoding='utf-8')
environment={k:v for k,v in os.environ.items() if not k.startswith('ILEX_ANDROID_')}
subprocess.run([r'C:/Users/Kenneth/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',str(android/'verify.py')],env=environment,check=True,capture_output=True,text=True)
report={'passed':True,'version':'1.13.1-android.4','versionCode':4,'engineSha256':source['engineSha256'],'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sameSigningCertificateAsPrevious':True,'mobileChecks':59,'apkChecks':len(verified['checks']),'physicalAndroidDeviceTested':False,'limits':verified['limits']}
(research/'table-repair-android-release.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))
