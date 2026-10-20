from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parents[2];research=root/'work/rules-research';e=json.loads((research/'unlimited-final-release-evidence.json').read_text(encoding='utf-8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assert e['passed']and e['version']=='1.20.0'and len(e['archives'])==2
assert sha(Path(e['executablePath']))==e['executableSha256']
assert sha(root/'outputs/ILEX.GG-Android.apk')==e['androidSha256']
for a in e['archives']:
 assert a['crcPassed']
 with zipfile.ZipFile(root/'outputs'/a['file'])as z:
  prefix='ILEX.GG-win32-x64/'
  assert z.read(prefix+'README.md').decode('utf-8').startswith('# ILEX.GG 1.20.0')
  assert hashlib.sha256(z.read(prefix+'ILEX.GG.exe')).hexdigest()==e['executableSha256']
  assert hashlib.sha256(z.read(prefix+'resources/app/ui/rules-engine.js')).hexdigest()==e['engineSha256']
  assert len([n for n in z.namelist()if '/resources/app/ui/finish-scans/'in n])==209
report={'passed':True,'version':'1.20.0','engineSha256':e['engineSha256'],'archivesMatchExactLauncherAndEngine':True,'finishImagesInEachArchive':209,'androidHashMatches':True,'localLauncher':e['executablePath'],'physicalAndroidDeviceTested':False,'actualExternalTwoPCMatchTested':False}
(research/'unlimited-delivery-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))
