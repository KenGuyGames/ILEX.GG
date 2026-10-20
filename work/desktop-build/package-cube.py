from pathlib import Path
import hashlib,json,shutil,os,zipfile,datetime
from reuse_zip_entries import rewrite
root=Path(__file__).resolve().parents[2];folder=root/'work/cube-candidate';dest=root/'outputs/ILEX.GG-1.22.0';app=dest/'resources/app';ui=app/'ui'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
 return h.hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def put(p,s):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(s,encoding='utf-8')
report=read(folder/'release-validation.json');assert report['passed']
for n,h in report['hashes'].items():assert sha(ui/n)==h,n
assert sha(folder/'ILEX.GG-Android.apk')==report['android']['sha256']
notes='''# ILEX.GG 1.22.0 — Cube drafting

Open Cube draft from the forest main menu. Zander's source contains 640 core cards, 72 separate EXpansion cards, 558 reserves and 13 excluded entries. Mutant evolution, the two-Prize evolution barrier, unified Abilities and EX/GX/V references, lowercase ex one-Prize rules and 40-card/four-Prize core games are enabled. EXpansion uses 60 cards/six Prizes; its full pool is distributed across the selected seats and rounds by default. Seeded packs use five varied Basics, five varied Evolutions and six Trainers/Special Energy.

Draft locally against drafting bots, resume a saved draft, build using your seat's pool and freely supplied Basic Energy, then play local or bot matches. Draft bots use a simple type/setup heuristic. The draft format and match keep their selected rules even after you edit the cube library. Existing decks and saved games retain their prior rules.

Use Add another cube to paste a public CubeKoga link. Review exact printings and edit rules before drafting. New cube, card/pool editing and ILEX cube JSON import/export are available. The rule editor supports the displayed switches and numeric controls; descriptive notes do not execute arbitrary rules. CubeKoga custom card definitions need review. Online cube drafting and cube matches are not included.

One EXpansion printing remains a deliberate review choice: Single Strike Urshifu V (Pokemon:X7) had no printing link in the workbook. Choose it under Card pool > Review before starting EXpansion. The workbook also starts with 16 Colorless Stage 1 cards against the requested target of 18: choose two additions from Reserves. Core drafting is available without those optional changes. The source workbook is unchanged.

The public CubeKoga API and schema were observed in the browser and importer contract checks passed. Live desktop importing could not be accepted here because the sandbox cannot resolve cubekoga.net; verify it on an unrestricted connection. Errors are shown without replacing your saved library.

Restart the Windows app, keeping its folder together. Android 1.22.0-android.34 retains the original signing certificate and can install over the prior APK. Physical Android acceptance remains pending. Desktop fresh/restored checks, 24 focused cube checks, six importer checks, seven final historical/bot/Undo/private regression groups, 273 mobile Chromium checks and 44 APK checks passed. Earlier 16 regression groups retain their original engine hash; finite tests do not prove every interaction.

Preserves the combined Realistic Player/format-reprint update, VSTAR hitbox fix, existing scans, audio, controls, saves and private multiplayer Undo approval. The Offline Windows archive includes 23,860 regular scans and 209 verified finish images. Finish-image acquisition remains incomplete. No remote publication.

Source and validation: resources/app/card-effect-sources/cube-source and resources/app/validation/cube. The complete current engine source is in cube-engine-src.zip; historical preparatory patch scripts are research records, not an idempotent rebuild pipeline. Compile src/tcg-lab-entry.ts using esbuild for browser/iife/globalName TCGRules, target chrome140, define global=globalThis. The released UI includes the matching adapter, bot and cube data.

Unofficial fan-made software. Pokemon names and artwork belong to their owners.
'''
put(dest/'README.md',notes);put(dest/'START HERE.txt','ILEX.GG 1.22.0\n\nRun ILEX.GG.exe, then choose Cube draft. Restart an open application. Keep this folder together. Read README.md for CubeKoga and printing-review details.\n')
audit=app/'validation/cube';audit.mkdir(parents=True,exist_ok=True)
for n in ['release-validation.json','tests.json','import-tests.json','android-build.json','android-verification.json']:shutil.copy2(folder/n,audit/n)
for label in ['fresh','restored']:shutil.copy2(folder/('native-final-v4/'+label+'-tests.json'),audit/('native-'+label+'.json'))
shutil.copy2(folder/'regressions-final/all.json',audit/'final-regressions.json');shutil.copy2(folder/'regressions/all.json',audit/'ancestor-regressions.json')
for n in ['mobile-verification.json','cube-mobile-tests.json','tournament-bot-mobile-tests.json','format-mobile-tests.json']:shutil.copy2(root/'work/android-build'/n,audit/n)
source=app/'card-effect-sources/cube-source'
for n in ['package-cube.py','brand-cube.cjs']:shutil.copy2(Path(__file__).with_name(n),source/n)
for n in ['record-release.py','cube-native-workflow.js','native-self-test.cjs']:shutil.copy2(root/'work/cube-review'/n,source/n)
shutil.copy2(root/'work/desktop-build/cube-tests.cjs',source/'cube-tests.cjs')
put(dest/'desktop-verification.json',json.dumps(report,indent=2));put(dest/'studio-ui-manifest.json',json.dumps(report['hashes'],indent=2))
relative=['ILEX.GG.exe','README.md','START HERE.txt','desktop-verification.json','studio-ui-manifest.json','resources/app/package.json','resources/app/main.cjs','resources/app/preload.cjs','resources/app/cube-import.cjs','resources/app/cube-self-test.cjs']
relative += [p.relative_to(dest).as_posix() for parent in [ui,audit,source] for p in parent.rglob('*') if p.is_file()]
changed={n:dest/n for n in sorted(set(relative))};prefix='ILEX.GG-win32-x64/';archives=[]
for label in ['Windows','Windows-Offline']:
 old=root/'outputs'/('ILEX.GG-1.21.1-'+label+'.zip');target=root/'outputs'/('ILEX.GG-1.22.0-'+label+'.zip');pending=target.with_suffix('.pending.zip')
 with zipfile.ZipFile(old) as z:names=set(z.namelist())
 print('Packaging '+label,flush=True)
 rewrite(old,pending,{prefix+n:p for n,p in changed.items() if prefix+n in names},{prefix+n:p for n,p in changed.items() if prefix+n not in names})
 with zipfile.ZipFile(pending) as z:
  assert z.testzip() is None
  assert len(z.namelist())==len(set(z.namelist()))
  for n,p in changed.items():assert hashlib.sha256(z.read(prefix+n)).hexdigest()==sha(p),n
  count=sum(n.startswith(prefix+'resources/scans/') and not n.endswith('/') for n in z.namelist());assert count==(23860 if label.endswith('Offline') else 0)
 os.replace(pending,target);archives.append({'file':str(target),'sha256':sha(target),'bytes':target.stat().st_size,'crcPassed':True,'regularScans':count});print('Verified '+label,flush=True)
shared=root/'outputs/ILEX.GG-win32-x64';baseline=read(folder/'baseline.json');backup=folder/('shared-backup-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S'));backup.mkdir()
for n,h in baseline.items():assert sha(shared/'resources/app/ui'/n)==h,'Released UI changed during cube work: '+n
for n,p in changed.items():
 target=shared/n;target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists() and sha(target)==sha(p):continue
 if target.exists():prior=backup/n;prior.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(target,prior)
 temp=target.with_name(target.name+'.cube-pending');shutil.copy2(p,temp)
 try:os.replace(temp,target)
 except PermissionError:
  if n!='ILEX.GG.exe':raise
  os.replace(temp,shared/'ILEX.GG-1.22.0.exe')
for n,h in report['hashes'].items():assert sha(shared/'resources/app/ui'/n)==h,n
apk=root/'outputs/ILEX.GG-1.22.0-Android.apk';shutil.copy2(folder/'ILEX.GG-Android.apk',apk)
for item in archives:
 target=root/'outputs'/Path(item['file']).name.replace('ILEX.GG-1.22.0-','ILEX.GG-');temp=target.with_name(target.name+'.cube-pending');shutil.copy2(item['file'],temp);assert sha(temp)==item['sha256'];os.replace(temp,target)
target=root/'outputs/ILEX.GG-Android.apk'
if target.exists():shutil.copy2(target,backup/'previous-Android.apk')
temp=target.with_name(target.name+'.cube-pending');shutil.copy2(apk,temp);os.replace(temp,target)
shutil.copy2(folder/'android-verification.json',root/'outputs/ILEX.GG-Android-verification.json')
evidence={**report,'archives':archives,'executable':str(dest/'ILEX.GG.exe'),'executableSha256':sha(dest/'ILEX.GG.exe'),'androidFile':str(apk),'sharedFolderUpdated':True,'sharedBackup':str(backup)}
put(root/'work/rules-research/cube-release.json',json.dumps(evidence,indent=2));put(folder/'release-evidence.json',json.dumps(evidence,indent=2));put(root/'outputs/ILEX.GG-Cube-Update.txt',notes)
print('Cube1.22.0 delivered. Existing app updated without closing it.',flush=True)
