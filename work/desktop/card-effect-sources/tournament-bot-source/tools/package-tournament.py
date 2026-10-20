"""Deliver the verified bot overlay while retaining the verified 1.20.0 payload."""
from pathlib import Path
import datetime, hashlib, json, os, shutil, zipfile
from reuse_zip_entries import rewrite

root=Path(__file__).resolve().parents[2]
folder=root/'work/tournament-bot-release';candidate=root/'work/tournament-bot-desktop-candidate'
released=root/'outputs/ILEX.GG-win32-x64';research=root/'work/rules-research'
read=lambda p:json.loads(p.read_text(encoding='utf-8'))
def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for block in iter(lambda:f.read(4*1024*1024),b''):h.update(block)
    return h.hexdigest()
report=read(folder/'release-validation.json')
assert report['passed'] and report['release']=='1.21.0'
app=candidate/'resources/app';ui=app/'ui'
assert sha(ui/'bot-ai.js')==report['botSha256']
assert sha(ui/'rules-engine.js')==report['engineSha256']
assert sha(folder/'ILEX.GG-Android.apk')==report['android']['sha256']
baseline=read(research/'unlimited-final-release-evidence.json')
assert baseline['engineSha256']==report['priorEngineSha256']
reference={entry['file']:entry for entry in baseline['archives']}

audit=app/'validation/tournament-bot';audit.mkdir(parents=True,exist_ok=True)
for name in ['release-validation.json','tactical.json','profiles.json','expanded-profile.json','policy-delta-audit.json','source-reproduction.json','engine-repair.json','android-verification.json']:
    shutil.copy2(folder/name,audit/name)
for name in ['tournament-bot-mobile-tests.json','realistic-mobile-tests.json','mobile-verification.json','unlimited-mobile-tests.json','candy-mobile-tests.json']:
    shutil.copy2(root/'work/android-build'/name,audit/name)
for p in (root/'work/tournament-native-latest').glob('*.json'):
    if p.name!='rules-workspace-test.json':shutil.copy2(p,audit/('native-'+p.name))
for label,location in [('exact',folder/'benchmark'),('discard',root/'work/tournament-bot-final/benchmark'),('resources',root/'work/tournament-bot-resources/benchmark')]:
    for p in location.glob('tournament-bot-benchmark-*.json'):shutil.copy2(p,audit/(label+'-'+p.name))
shutil.copy2(research/'tournament-shared-regressions.json',audit/'inherited-engine-regressions.json')
shutil.copy2(research/'tournament-promo-cache-tests.json',audit/'promo-cache-tests.json')
shutil.copy2(research/'rare-candy-fix.json',audit/'preserved-rare-candy-fix.json')
readme='''# ILEX.GG 1.21.0

Realistic Player now plans longer turn sequences, checks visible replies and return attacks, values draw/search resources and hand disruption, and handles Energy units, multi-Prize Pokémon, scalable attacks and damage-counter choices more accurately. Variable-discard attacks can select a lethal quantity while preserving useful Energy. Select Realistic Player in a new or existing bot match. Easy, Normal and Hard remain available. Planning runs locally in a cancellable worker and does not use a paid service or concealed opponent identities.

The complete implemented card pool is preserved, including the newer Rare Candy evolution repair. Historical profiles, Unlimited, decks, collection, packs, audio, controls, private multiplayer and opponent-approved online Undo are retained. Restart the app to load the updated policy and prompt handling together.

Validation includes 52 expected-result tactical/privacy checks, functional legal planning across 15 rule profiles, fresh/restored Windows worker and controller checks, Android Chromium touch/landscape checks and a signed APK with the original certificate. Paired seeded comparisons against the previous bot are recorded with their actual source hashes; the scoped later differences are audited separately. These finite tests do not certify professional-human tournament strength or every interaction. Some future-resource and opponent forecasts remain approximate.

Run ILEX.GG.exe on Windows 10/11 64-bit and keep its folder together. The compact ZIP downloads scans as needed; Offline ZIP retains 23,860 regular scans and 209 finish images. Finish-specific scan acquisition remains incomplete. The published offline fallback for 22 original promo scans is retained.

Android 1.21.0-android.30 retains the original signing certificate and follows the Rare Candy code29 update; install over the existing app. Physical Android acceptance remains pending. Private multiplayer protocol is unchanged; an actual external two-PC full match remains unverified. No GitHub or Play Store publication was performed.

Reproducible bot overlay source is in resources/app/card-effect-sources/tournament-bot-source. Canonical unchanged rules source remains in unlimited-source. Detailed evidence is in resources/app/validation/tournament-bot and desktop-verification.json. Previous source archives and licenses are retained. Pokémon names/artwork belong to their owners; this is unofficial fan-made software.
'''
(candidate/'README.md').write_text(readme,encoding='utf-8')
(candidate/'START HERE.txt').write_text('ILEX.GG 1.21.0 for Windows 10/11 64-bit\n\nDouble-click ILEX.GG.exe and keep this folder together. Restart an already open app. Select Realistic Player for the upgraded bot. See README.md and desktop-verification.json for validation limits.\n',encoding='utf-8')
(candidate/'desktop-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(candidate/'studio-ui-manifest.json').write_text(json.dumps({p.name:sha(p) for p in ui.iterdir() if p.is_file()},indent=2),encoding='utf-8')

relative=['ILEX.GG.exe','README.md','START HERE.txt','desktop-verification.json','studio-ui-manifest.json','resources/app/package.json','resources/app/self-test.cjs','resources/app/tournament-bot-self-test.cjs','resources/app/tournament-bot-native-tests.js','resources/app/rare-candy-native-tests.js','resources/app/rare-candy-native-fixture.json','resources/app/private-native-tests.cjs','resources/app/card-cache.cjs','resources/app/promo-scan-files.json','resources/app/ui/bot-ai.js','resources/app/ui/bot-ui.js','resources/app/ui/rules-engine.js','resources/app/card-effect-sources/tournament-bot-source-manifest.json']
relative.extend(str(p.relative_to(candidate)).replace('\\','/') for p in (app/'card-effect-sources/tournament-bot-source').rglob('*') if p.is_file())
relative.extend(str(p.relative_to(candidate)).replace('\\','/') for p in audit.rglob('*') if p.is_file())
relative=sorted(set(relative));changed={name:candidate/name for name in relative}
backup=folder/('before-1.21.0-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S'));backup.mkdir()
def retain(old,dest):
    dest.parent.mkdir(parents=True,exist_ok=True)
    try:os.link(old,dest)
    except OSError:shutil.copy2(old,dest)
def install(src,dst):
    dst.parent.mkdir(parents=True,exist_ok=True)
    pending=dst.with_name(dst.name+'.tournament-pending')
    shutil.copy2(src,pending)
    try:os.replace(pending,dst);return dst
    except PermissionError:
        if dst.name!='ILEX.GG.exe':raise
        alternate=dst.with_name('ILEX.GG-1.21.0.exe');os.replace(pending,alternate);return alternate
launcher=released/'ILEX.GG.exe'
for name,src in changed.items():
    dst=released/name
    if dst.exists() and sha(dst)==sha(src):continue
    if dst.exists():retain(dst,backup/'windows'/name)
    actual=install(src,dst)
    if name=='ILEX.GG.exe':launcher=actual
assert sha(released/'resources/app/ui/bot-ai.js')==report['botSha256']
assert sha(released/'resources/app/ui/rules-engine.js')==report['engineSha256']
archives=[];prefix='ILEX.GG-win32-x64/'
for name,offline in [('ILEX.GG-Windows.zip',False),('ILEX.GG-Windows-Offline.zip',True)]:
    target=root/'outputs'/name
    assert sha(target)==reference[name]['sha256'],'Baseline archive changed: '+name
    with zipfile.ZipFile(target) as z:old_names=set(z.namelist())
    replacements={prefix+n:p for n,p in changed.items() if prefix+n in old_names}
    additions={prefix+n:p for n,p in changed.items() if prefix+n not in old_names}
    pending=target.with_name(target.stem+'-tournament-pending.zip')
    print('Reusing verified archive payload: '+name,flush=True)
    rewrite(target,pending,replacements,additions)
    with zipfile.ZipFile(pending) as z:
        assert z.testzip() is None
        assert len(z.namelist())==len(set(z.namelist()))
        assert hashlib.sha256(z.read(prefix+'resources/app/ui/rules-engine.js')).hexdigest()==report['engineSha256']
        assert hashlib.sha256(z.read(prefix+'resources/app/ui/bot-ai.js')).hexdigest()==report['botSha256']
        assert hashlib.sha256(z.read(prefix+'ILEX.GG.exe')).hexdigest()==sha(candidate/'ILEX.GG.exe')
        assert sum(n.startswith(prefix+'resources/scans/') and not n.endswith('/') for n in z.namelist())==(23860 if offline else 0)
        for n,p in changed.items():assert hashlib.sha256(z.read(prefix+n)).hexdigest()==sha(p),n
    retain(target,backup/name)
    try:os.replace(pending,target)
    except PermissionError:
        target=target.with_name(target.stem+'-1.21.0.zip');os.replace(pending,target)
    archives.append({'file':str(target),'bytes':target.stat().st_size,'sha256':sha(target),'crcPassed':True,'regularScansPreserved':23860 if offline else 0})
    print(json.dumps(archives[-1]),flush=True)
apk=root/'outputs/ILEX.GG-Android.apk'
if apk.exists():retain(apk,backup/apk.name)
install(folder/'ILEX.GG-Android.apk',apk)
assert sha(apk)==report['android']['sha256']
shutil.copy2(folder/'android-verification.json',root/'outputs/ILEX.GG-Android-verification.json')
evidence={**report,'archives':archives,'executablePath':str(launcher),'executableSha256':sha(launcher),'androidPath':str(apk),'backup':str(backup),'changedWindowsFiles':len(changed),'regularScansPreserved':23860,'verifiedFinishImagesPreserved':209,'published':True,'publicationScope':'Local files only'}
(research/'tournament-bot-final-release-evidence.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
(root/'outputs/ILEX.GG-Realistic-Player-Update.txt').write_text('ILEX.GG 1.21.0\n\nRestart the app, then select Realistic Player.\nWindows launcher: '+str(launcher)+'\nAndroid: '+str(apk)+'\n\nLonger bounded turn planning, contextual choices, corrected Energy/Prize/scalable-damage models and visible counterplay checks. Professional-human tournament strength has not been established.\n',encoding='utf-8')
print('Local Windows/Android bot upgrade delivered and verified. No remote publication.',flush=True)
