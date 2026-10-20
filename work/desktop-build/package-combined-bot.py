from pathlib import Path
import hashlib,json,shutil,os,zipfile,datetime
from reuse_zip_entries import rewrite
root=Path(__file__).resolve().parents[2];folder=root/'work/combined-bot-release';dest=root/'outputs/ILEX.GG-1.21.1';app=dest/'resources/app';ui=app/'ui'
def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
    return h.hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def put(p,data):
    p.parent.mkdir(parents=True,exist_ok=True)
    if p.exists():p.unlink()
    p.write_text(data,encoding='utf-8')
report=read(folder/'combined-validation.json');assert report['passed']
for n,h in report['hashes'].items():assert sha(ui/n)==h,n
assert sha(folder/'ILEX.GG-Android.apk')==report['android']['sha256']
audit=app/'validation/combined-bot';audit.mkdir(parents=True,exist_ok=True)
for p in folder.glob('*.json'):shutil.copy2(p,audit/p.name)
for p in (folder/'native-v2').glob('*.json'):shutil.copy2(p,audit/('native-'+p.name))
for n in ['mobile-verification.json','tournament-bot-mobile-tests.json','format-mobile-tests.json','realistic-mobile-tests.json','unlimited-mobile-tests.json']:
    shutil.copy2(root/'work/android-build'/n,audit/n)
source=app/'card-effect-sources/combined-bot-source';source.mkdir(parents=True,exist_ok=True)
shutil.copy2(root/'work/unlimited-source/src/tcg-lab-entry.ts',source/'tcg-lab-entry.ts')
shutil.copy2(root/'work/desktop-build/build-rules.cjs',source/'build-rules.cjs')
for n in ['format-reprints.cjs','format-reprint-cutoffs.js','legacy-reprint-templates.js','format-reprints-tests.cjs','format-reprints-extra-tests.cjs','format-reprints-replay-tests.cjs','format-reprints-cutoff-tests.cjs','combined-tournament-tests.cjs','combined-bot-reprints-tests.cjs','combined-bot-preload.cjs','run-combined-bot-checks.cjs','prepare-combined-bot.py','package-combined-bot.py']:
    shutil.copy2(root/'work/desktop-build'/n,source/n)
for n in ['format-reprints-policy.json','format-reprints-fix.json']:
    p=root/'work/rules-research'/n
    if p.exists():shutil.copy2(p,source/n)
notes='''# ILEX.GG 1.21.1 — combined bot and format-reprint update

Includes the Realistic Player planning upgrade AND the latest format-specific reprint rules, including selected set-pool cutoffs. The newer Rare Candy repair is retained. Restart the application. Select Realistic Player for the upgraded bot; start a NEW match to use the latest historical reprint rules. Existing saved matches keep their pinned/original replay semantics.

Energy and Prize decisions, action sequencing, copied/scaling attacks and opponent-response forecasts have improved. Professional human tournament strength has not been established. Tests are finite and do not prove every interaction. The prior paired benchmark results retain their actual source hashes and are not represented as comparisons executed on this combined build.

Keep the Windows folder together and run ILEX.GG.exe. The Offline ZIP includes 23,860 regular scans and 209 verified finish-specific images; the compact ZIP downloads ordinary scans as needed. Finish-image acquisition is still incomplete. Decks, collection, saves, audio, controls and private multiplayer features are retained. Opponent approval for online Undo remains required.

Android 1.21.1-android.32 uses the original signing certificate and installs over code31 and earlier. Physical Android acceptance and an actual external two-PC full-match test remain pending. No GitHub or Play Store publication.

Current validation: resources/app/validation/combined-bot and desktop-verification.json. Historical validation remains tied to its original source hashes. Existing full engine source archives and reproducible bot overlay are retained; format-reprint source tools are in card-effect-sources/combined-bot-source. Pokémon names/artwork belong to their owners; unofficial fan-made software.
'''
put(dest/'README.md',notes);put(dest/'START HERE.txt','ILEX.GG 1.21.1\n\nRun ILEX.GG.exe. Restart an open app. This build combines the bot upgrade and format-reprint fix. Start a new match for the new historical rules; old saved matches retain their existing policy.\n')
put(dest/'desktop-verification.json',json.dumps(report,indent=2));put(dest/'studio-ui-manifest.json',json.dumps({p.name:sha(p) for p in ui.iterdir() if p.is_file()},indent=2))
relative=['ILEX.GG.exe','README.md','START HERE.txt','desktop-verification.json','studio-ui-manifest.json','resources/app/package.json','resources/app/self-test.cjs','resources/app/combined-bot-self-test.cjs','resources/app/format-reprints-native-tests.js','resources/app/format-reprints-native-fixtures.json']
relative+=['resources/app/ui/'+n for n in ['rules-engine.js','rules-match.js','limitless-collection.js','bot-ai.js','bot-ui.js']]
relative += [p.relative_to(dest).as_posix() for base in [audit,source] for p in base.rglob('*') if p.is_file()]
changed={n:dest/n for n in sorted(set(relative))};archives=[];prefix='ILEX.GG-win32-x64/'
baselines={'Windows':'d3519961151fe3fbf187438852eb7402735fa86002019e8f7c593930a7d296a8','Windows-Offline':'409f75de930b4d373e5d6415380534f95636c6b65127f032f2e3c2b6fa972ab7'}
for label,h in baselines.items():
    old=root/'outputs'/('ILEX.GG-1.21.0-'+label+'.zip');assert sha(old)==h
    target=root/'outputs'/('ILEX.GG-1.21.1-'+label+'.zip');pending=target.with_suffix('.pending.zip')
    with zipfile.ZipFile(old) as z:names=set(z.namelist())
    print('Packaging '+label,flush=True)
    rewrite(old,pending,{prefix+n:p for n,p in changed.items() if prefix+n in names},{prefix+n:p for n,p in changed.items() if prefix+n not in names})
    with zipfile.ZipFile(pending) as z:
        assert z.testzip() is None
        assert len(z.namelist())==len(set(z.namelist()))
        for n,p in changed.items():assert hashlib.sha256(z.read(prefix+n)).hexdigest()==sha(p),n
        scans=sum(n.startswith(prefix+'resources/scans/') and not n.endswith('/') for n in z.namelist());assert scans==(23860 if label.endswith('Offline') else 0)
    os.replace(pending,target);archives.append({'file':str(target),'sha256':sha(target),'bytes':target.stat().st_size,'crcPassed':True,'regularScans':scans})
    print('Verified '+label,flush=True)
# Update the existing launcher resources only after combined tests and archive checks pass.
shared=root/'outputs/ILEX.GG-win32-x64';backup=folder/('shared-backup-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S'));backup.mkdir()
for n in ['rules-engine.js','rules-match.js']:
    assert sha(shared/'resources/app/ui'/n)==report['hashes'][n], 'Shared format fix changed during combined validation'
for n,p in changed.items():
    target=shared/n;target.parent.mkdir(parents=True,exist_ok=True)
    if target.exists() and sha(target)==sha(p):continue
    if target.exists():
        old=backup/n;old.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(target,old)
    temp=target.with_name(target.name+'.combined-pending');shutil.copy2(p,temp)
    try:os.replace(temp,target)
    except PermissionError:
        if n!='ILEX.GG.exe':raise
        os.replace(temp,shared/'ILEX.GG-1.21.1.exe')
for n,h in report['hashes'].items():assert sha(shared/'resources/app/ui'/n)==h
canonical=root/'work/unlimited-candidate/ui'
for n in ['rules-engine.js','rules-match.js']:assert sha(canonical/n)==report['hashes'][n]
for n in ['bot-ai.js','bot-ui.js']:
    target=canonical/n
    if sha(target)!=report['hashes'][n]:
        shutil.copy2(target,backup/('canonical-'+n))
        temp=target.with_name(target.name+'.combined-pending');shutil.copy2(ui/n,temp);os.replace(temp,target)
    assert sha(target)==report['hashes'][n]
apk=root/'outputs/ILEX.GG-1.21.1-Android.apk';shutil.copy2(folder/'ILEX.GG-Android.apk',apk);assert sha(apk)==report['android']['sha256']
for item in archives:
    src=Path(item['file']);standard=root/'outputs'/src.name.replace('ILEX.GG-1.21.1-','ILEX.GG-')
    previous=sha(standard) if standard.exists() else None
    # The previous 1.21.0 archives remain available under their versioned names.
    assert previous in [None,*baselines.values()], 'Shared archive changed during validation'
    temp=standard.with_name(standard.name+'.combined-pending');shutil.copy2(src,temp);assert sha(temp)==item['sha256'];os.replace(temp,standard)
standard_apk=root/'outputs/ILEX.GG-Android.apk'
if standard_apk.exists():shutil.copy2(standard_apk,backup/'previous-Android.apk')
temp=standard_apk.with_name(standard_apk.name+'.combined-pending');shutil.copy2(apk,temp);os.replace(temp,standard_apk)
shutil.copy2(folder/'android-verification.json',root/'outputs/ILEX.GG-Android-verification.json')
evidence={**report,'archives':archives,'executable':str(dest/'ILEX.GG.exe'),'executableSha256':sha(dest/'ILEX.GG.exe'),'androidFile':str(apk),'sharedFolderUpdated':True,'sharedBackup':str(backup),'publication':'Local files only','regularScansPreserved':23860,'verifiedFinishImagesPreserved':209}
put(root/'work/rules-research/combined-bot-release.json',json.dumps(evidence,indent=2));put(folder/'release-evidence.json',json.dumps(evidence,indent=2))
put(root/'outputs/ILEX.GG-Combined-Update.txt',notes+'\nWindows launcher: '+str(dest/'ILEX.GG.exe')+'\nAndroid: '+str(apk)+'\n')
print('Combined 1.21.1 delivered; existing application updated without closing it.',flush=True)

