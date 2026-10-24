from pathlib import Path
import json,hashlib,zipfile,shutil,subprocess,sys,os
here=Path(__file__).resolve().parent;root=Path(r'C:/Users/Kenneth/Documents/Codex/2026-10-11/b')
sys.path.insert(0,str(root/'work/desktop-build'));from reuse_zip_entries import rewrite
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
hashes=read(here/'hashes.json');tests=read(here/'tests.json');native=[read(here/f'native-{n}.json') for n in ['fresh','restored']];mobile=read(here/'mobile.json');reg=read(here/'regressions/all.json');assert all(d['passed'] for d in [tests,*native,mobile,reg])
files=list(hashes);apk=here/'ILEX.GG-Android.apk';oldapk=root/'outputs/ILEX.GG-2.0.0-Android.apk'
with zipfile.ZipFile(oldapk) as old,zipfile.ZipFile(apk) as new:
 assert new.testzip() is None
 names={n for n in old.namelist() if n.startswith('assets/ui/')};assert names=={n for n in new.namelist() if n.startswith('assets/ui/')}
 changes={n for n in names if new.read(n)!=old.read(n)};assert changes=={'assets/ui/'+n for n in files},changes
 for n in files:assert hashlib.sha256(new.read('assets/ui/'+n)).hexdigest()==hashes[n]['patched']
 scans=sum(n.startswith('assets/ui/scans/') for n in names)
tool=root/'work/android-build/toolchain/build-tools/android-16';java=r'C:/Program Files/Java/jdk-17.0.2/bin/java.exe'
cert=subprocess.check_output([java,'-jar',str(tool/'lib/apksigner.jar'),'verify','--print-certs',str(apk)],text=True);assert 'b7c77e1f936266ffddb0a381be15ab50fcb7c49694520044a19c91fc287bb0b1' in cert
badging=subprocess.check_output([str(tool/'aapt2.exe'),'dump','badging',str(apk)],text=True);assert "versionCode='80'" in badging and "versionName='2.0.0-android.80'" in badging
apps=[root/'outputs/ILEX.GG-2.0.0',root/'outputs/ILEX.GG-win32-x64'];uis=[root/'work/v2-candidate/ui',root/'work/cube-candidate/ui']+[p/'resources/app/ui' for p in apps]
for ui in uis:
 for n in files:assert sha(ui/n)==hashes[n]['baseline'],str(ui/n)
src=root/'work/cube-source/src/game/store/reducers/setup-reducer.ts';assert src.read_text(encoding='utf-8')==(here/'before-setup-reducer.ts').read_text(encoding='utf-8')
for ui in uis:
 for n in files:
  p=ui/n;backup=p.with_name(p.name+'.before-overeager');assert not backup.exists();p.rename(backup);shutil.copy2(here/'ui'/n,p)
src.rename(src.with_name(src.name+'.before-overeager'));shutil.copy2(here/'setup-reducer.ts',src)
report={'passed':True,'date':'2026-10-21','feature':'Starting Active Overeager forces first player after setup','hashes':hashes,'focused':tests['checks'],'nativeFreshRestored':[len(v['checks']) for v in native],'mobile':[[v['width'],v['height'],len(v['checks'])] for v in mobile['results']],'regressions':reg['results'],'newMatchStartingPowerRulesVersion':1,'unversionedSavedMatchesUse':0,'sourceBaselineParity':True,'androidVersion':'2.0.0-android.80','apkSha256':sha(apk),'originalCertificate':True,'androidUiChanges':sorted(changes),'startupScansPreserved':scans,'physicalAndroidTested':False}
primary=apps[0]
for app in apps:
 for n in ['studio-ui-manifest.json','desktop-verification.json']:
  p=app/n;d=read(p)
  if n.startswith('studio'):d.update({n:hashes[n]['patched'] for n in files})
  else:d.get('hashes',{}).update({n:hashes[n]['patched'] for n in files});d['overeagerFix']=report
  p.unlink();p.write_text(json.dumps(d,indent=2),encoding='utf-8')
sourcezip=primary/'resources/app/card-effect-sources/cube-source/cube-engine-src.zip'
with zipfile.ZipFile(sourcezip) as z:
 found=[n for n in z.namelist() if n.endswith('game/store/reducers/setup-reducer.ts')];assert len(found)==1
rewrite(sourcezip,here/'cube-engine-src.zip',{found[0]:src})
for app in apps:
 p=app/'resources/app/card-effect-sources/cube-source/cube-engine-src.zip';p.unlink();shutil.copy2(here/'cube-engine-src.zip',p)
changed={'resources/app/ui/'+n:primary/'resources/app/ui'/n for n in files}
for n in ['studio-ui-manifest.json','desktop-verification.json','resources/app/card-effect-sources/cube-source/cube-engine-src.zip']:changed[n]=primary/n
archives=[];prefix='ILEX.GG-win32-x64/'
for label in ['Windows','Windows-Offline']:
 target=root/'outputs'/f'ILEX.GG-2.0.0-{label}.zip';pending=target.with_suffix('.overeager-pending.zip')
 with zipfile.ZipFile(target) as z:
  original={i.filename:(i.CRC,i.file_size,i.compress_size,i.date_time) for i in z.infolist()}
  for n in files:assert hashlib.sha256(z.read(prefix+'resources/app/ui/'+n)).hexdigest()==hashes[n]['baseline']
 print('Updating '+label,flush=True);rewrite(target,pending,{prefix+n:p for n,p in changed.items()})
 with zipfile.ZipFile(pending) as z:
  assert z.testzip() is None
  for n,p in changed.items():assert hashlib.sha256(z.read(prefix+n)).hexdigest()==sha(p)
  for i in z.infolist():
   if i.filename not in {prefix+n for n in changed}:assert (i.CRC,i.file_size,i.compress_size,i.date_time)==original[i.filename]
 os.replace(pending,target);alias=root/'outputs'/f'ILEX.GG-{label}.zip';alias.unlink();shutil.copy2(target,alias);assert sha(alias)==sha(target);archives.append({'file':str(target),'sha256':sha(target)})
report['archives']=archives
for p in [oldapk,root/'outputs/ILEX.GG-Android.apk']:
 p.unlink();shutil.copy2(apk,p)
shutil.copy2(here/'android-build.json',root/'outputs/ILEX.GG-Android-build.json')
out=here.parents[1]/'outputs';out.mkdir(exist_ok=True);shutil.copy2(apk,out/'ILEX.GG-Android.apk')
with zipfile.ZipFile(out/'ILEX.GG-Overeager-Fix.zip','w',zipfile.ZIP_DEFLATED) as z:
 for n in files:z.write(here/'ui'/n,n)
 z.writestr('README.txt','ILEX.GG2.0.0 Overeager fix. Close ILEX.GG, back up BOTH matching files in resources/app/ui inside your app folder, replace both with the included files, then reopen and start a NEW match.\nOne starting Active Sableye forces its player to go first; two opposing Overeager starters cancel. Starting Bench/hand/deck does not count. Existing unversioned saved matches retain their original first player.\n')
(here/'release.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
proof=root/'work/overeager';proof.mkdir(exist_ok=True)
for n in ['prepare.cjs','tests.cjs','native.cjs','native-test.js','runners.py','preload.cjs','regressions.cjs','android.cjs','build-android.cjs','build-prepared.py','package.py','setup-reducer.ts','release.json']:shutil.copy2(here/n,proof/n)
shutil.copy2(here/'release.json',root/'work/rules-research/overeager-fix.json')
agents=root/'AGENTS.md';agents.write_text('# Latest rules fix - Sableye Overeager starting player (October 21, 2026)\n\nSetup now applies Overeager after both starting Actives are committed and before first/second-player evolution timing is stamped, in normal and alternative13-card setup. Exactly one Active with Overeager forces that owner first; both cancel, Bench/hand/deck do not count. Modern first-turn attack/Supporter rules remain. New matches pin spec.startingPowerRulesVersion=1; unversioned restores pin0 and keep old turn order to preserve existing journals.10 focused natural-setup groups across both seats, seeds, DP/HGSS, no/both/Bench cases, alternative setup and new/legacy replay pass.16 rendered native checks fresh/restored and three mobile sizes pass; format/Rare Candy/Custom Catcher/Undo regressions pass. Canonical cube setup-reducer.ts and v2/cube engine+adapter, Windows shared/versioned apps/archives and embedded source ZIP updated. Original-cert Android2.0.0-android.80/code80 changes only engine/adapter UI, startup art retained. Next Android81+. Restart and start NEW matches for this rule; old saved matches remain compatible. Evidence work/overeager/release.json; scripts reference current chat. No real-profile writes, real-app closing, subagents or publication. Physical Android/external two-PC acceptance remains pending.\n\n---\n\n'+agents.read_text(encoding='utf-8'),encoding='utf-8')
print('Overeager fix delivered locally',flush=True)
