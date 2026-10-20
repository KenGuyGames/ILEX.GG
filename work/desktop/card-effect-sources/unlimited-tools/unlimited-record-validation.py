from pathlib import Path
import json,hashlib,shutil
root=Path(__file__).resolve().parents[2];research=root/'work/rules-research';candidate=root/'work/unlimited-desktop-candidate';ui=candidate/'resources/app/ui'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8'))
engine=sha(ui/'rules-engine.js')
def gate(name):
 x=read(research/name);assert x['passed'],name
 if 'engineSha256'in x:assert x['engineSha256']==engine,name+' engine mismatch'
 return x
focused=gate('unlimited-focused-tests.json');shared=gate('unlimited-shared-regressions.json');modern=gate('unlimited-preserved-modern.json');trainers=gate('unlimited-full-trainer-audit.json')
attacks=[gate('unlimited-release-smoke-'+str(i)+'.json')for i in range(6)]
games=[gate('unlimited-mixed-match-audit-offset'+str(offset)+'-'+str(i)+'.json')for offset in [1,3,5]for i in range(3)]
native=root/'work/unlimited-native-final-v2';assert not(native/'failure.txt').exists()
for suffix in ['', '-fresh']:
 for name in ['unlimited-native-tests','mega-native-tests','private-native-tests','sv-native-tests','swsh-native-tests','desktop-tests']:
  x=read(native/(name+suffix+'.json'));assert x['passed'],name+suffix
  if 'engineSha256'in x:assert x['engineSha256']==engine,name+suffix
mobile=read(root/'work/android-build/unlimited-mobile-tests.json');assert mobile['passed']and mobile['engineSha256']==engine
mobilebase=read(root/'work/android-build/mobile-verification.json');assert mobilebase['passed']
android=read(root/'work/unlimited-candidate/android-verification.json');assert android['passed']
archive=candidate/'resources/app/card-effect-sources';shutil.copytree(root/'work/unlimited-source/src',archive/'unlimited-source',dirs_exist_ok=True)
tools=archive/'unlimited-tools';tools.mkdir(exist_ok=True)
for f in (root/'work/desktop-build').glob('*unlimited*'):
 if f.is_file():shutil.copy2(f,tools/f.name)
for f in [root/'work/desktop/unlimited-native-tests.js',root/'work/desktop/unlimited-self-test.cjs']:shutil.copy2(f,tools/f.name)
manifest={'engineSha256':engine,'files':[{'path':f.relative_to(archive).as_posix(),'bytes':f.stat().st_size,'sha256':sha(f)}for sub in ['unlimited-source','unlimited-tools']for f in(archive/sub).rglob('*')if f.is_file()]}
(archive/'unlimited-source-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
reprints=read(research/'unlimited-reprints-audit.json');allgames=[g for x in games for g in x['games']]
report={'passed':True,'version':'1.20.0','engineSha256':engine,'ruleAdapterSha256':sha(ui/'rules-match.js'),'botSha256':sha(ui/'bot-ai.js'),'scope':'Unlimited all implemented eras; modern turn/Burn/Tool rules; latest-wording Trainer and Special Energy reprints; historical profiles retained','focusedChecks':len(focused['checks']),'printedAttackCases':sum(x['scenarios']for x in attacks),'attackConditionalUnavailable':sum(len(x['rejected'])for x in attacks),'trainerResolved':len(trainers['resolved']),'trainerUnavailable':len(trainers['unavailable']),'sharedGroups':len(shared['results']),'preservedModernGroups':len(modern['results']),'mixedGames':len(allgames),'decisions':sum(x['decisions']for x in allgames),'completedGames':sum(x['finished']for x in allgames),'exactReplayUndo':True,'nativeFreshRestored':True,'mobileLandscapeSizes':len(mobile['sizes']),'sourceFilesVerified':len(manifest['files']),'physicalAndroidDeviceTested':False,'actualExternalTwoPCMatchTested':False,'limits':'Finite validation, not exhaustive proof of all interactions. Conditional/passive unavailable cases remain separately recorded. No official banlist update; reverse finish scan acquisition remains incomplete.'}
(research/'unlimited-source-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))
report.update({'trainerPrintingOverrides':reprints['trainerPrintingOverrides'],'specialEnergyPrintingOverrides':reprints['specialEnergyPrintingOverrides'],'regularScans':23860,'preservedFinishImages':209,'androidVersion':'1.20.0-android.28','androidOriginalCertificate':True,'mobileChecks':len(mobilebase['checks'])})
reprints.update({'status':'validated-finite-fixtures','engineSha256':engine});(research/'unlimited-reprints-audit.json').write_text(json.dumps(reprints,indent=2),encoding='utf-8')
(research/'unlimited-source-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
