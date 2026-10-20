from pathlib import Path
import concurrent.futures, hashlib, json, os, shutil, zipfile
root=Path(__file__).resolve().parents[2];folder=root/'work/tournament-bot-release';evidence_file=root/'work/rules-research/tournament-bot-final-release-evidence.json';evidence=json.loads(evidence_file.read_text(encoding='utf-8'))
def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
    return h.hexdigest()
versioned=[]
for entry in evidence['archives']:
    src=Path(entry['file']);dst=root/'outputs'/('ILEX.GG-1.21.0-Windows-Offline.zip' if 'Offline' in src.name else 'ILEX.GG-1.21.0-Windows.zip')
    if not dst.exists():shutil.copy2(src,dst)
    assert sha(dst)==entry['sha256'],'Archive changed during delivery freeze'
    versioned.append({**entry,'file':str(dst)})
apk=root/'outputs/ILEX.GG-1.21.0-Android.apk'
if not apk.exists():shutil.copy2(folder/'ILEX.GG-Android.apk',apk)
assert sha(apk)==evidence['android']['sha256']
dest=root/'outputs/ILEX.GG-1.21.0';dest.mkdir(exist_ok=False)
compact=next(Path(a['file']) for a in versioned if 'Offline' not in a['file'])
with zipfile.ZipFile(compact) as archive:
    items=archive.infolist()
    def extract(info):
        parts=Path(info.filename).parts
        assert parts and parts[0]=='ILEX.GG-win32-x64' and '..' not in parts
        target=dest.joinpath(*parts[1:]);assert target.resolve().is_relative_to(dest.resolve())
        if info.is_dir():target.mkdir(parents=True,exist_ok=True);return
        target.parent.mkdir(parents=True,exist_ok=True)
        with archive.open(info) as src,target.open('wb') as out:shutil.copyfileobj(src,out,1024*1024)
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for i,_ in enumerate(pool.map(extract,items),1):
            if i%5000==0:print(f'Frozen package files {i}/{len(items)}',flush=True)
manifest=json.loads((dest/'resources/app/ui/scan-manifest.json').read_text(encoding='utf-8'))
source=root/'work/tournament-bot-desktop-candidate/resources'
def scan(pair):
    ident,e=pair;original=source/e['file'];target=dest/'resources'/e['file'];assert original.stat().st_size==e['bytes'] and sha(original)==e['sha256'],ident
    target.parent.mkdir(parents=True,exist_ok=True)
    try:os.link(original,target)
    except OSError:shutil.copy2(original,target)
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:list(pool.map(scan,manifest.items()))
assert len(manifest)==23860
assert sha(dest/'resources/app/ui/rules-engine.js')==evidence['engineSha256']
assert sha(dest/'resources/app/ui/bot-ai.js')==evidence['botSha256']
assert sha(dest/'ILEX.GG.exe')==evidence['executableSha256']
evidence['sharedWorkingReleaseEngineSha256']=sha(root/'outputs/ILEX.GG-win32-x64/resources/app/ui/rules-engine.js')
evidence['sharedWorkingReleaseNote']='Concurrent format-reprint work is modifying the shared application. That engine was detected and left intact; it is not the bot release validated here.'
evidence['archives']=versioned;evidence['androidPath']=str(apk);evidence['executablePath']=str(dest/'ILEX.GG.exe');evidence['isolatedDelivery']=True
evidence_file.write_text(json.dumps(evidence,indent=2),encoding='utf-8')
(folder/'isolated-delivery.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
(root/'outputs/ILEX.GG-Realistic-Player-Update.txt').write_text('ILEX.GG 1.21.0 — verified bot snapshot\n\nRestart using '+str(dest/'ILEX.GG.exe')+' and select Realistic Player.\nWindows ZIP: '+str(compact)+'\nAndroid: '+str(apk)+'\n\nThis versioned delivery preserves the validated Rare Candy repair. Concurrent format-reprint development in the shared app folder is separate and was left intact. Professional-human tournament strength is not established.\n',encoding='utf-8')
print('Independent versioned Windows app, archives and signed Android APK verified.',flush=True)
