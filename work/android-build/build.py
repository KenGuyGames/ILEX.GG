"""Build a signed universal APK using official Android SDK tools and JDK 17.
Run download-tools.cjs once first. Signing material remains local in signing/.
"""
from pathlib import Path
import shutil, subprocess, zipfile, json, hashlib, secrets, os,struct
ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
JAVA=Path(os.environ.get('ILEX_JAVA_HOME',r'C:/Program Files/Java/jdk-17.0.2'))/'bin'
TOOLS=HERE/'toolchain/build-tools/android-16'
JAR=HERE/'toolchain/platform/android-36/android.jar'
OUT=HERE/'build'; OUT.mkdir(exist_ok=True)
ASSETS=OUT/'assets'; UI=ASSETS/'ui'
def run(*args):
    print('Running',Path(str(args[0])).name,flush=True)
    subprocess.run([str(x) for x in args],check=True)
shutil.copytree(ROOT/'work/desktop/ui',UI,dirs_exist_ok=True)
for name in ['mobile.js','mobile-host.js','mobile-compat.js','mobile.css','mobile-landscape.css']:
    shutil.copy2(HERE/name,UI/name)
index=(UI/'index.html').read_text(encoding='utf-8')
index=index.replace('width=device-width,initial-scale=1','width=device-width,initial-scale=1,viewport-fit=cover')
index=index.replace("object-src 'none';", "frame-src 'none'; object-src 'none';")
index=index.replace('</head>','<link rel="stylesheet" href="mobile.css"><link rel="stylesheet" href="mobile-landscape.css"><script src="mobile-compat.js"></script><script src="mobile-host.js"></script></head>')
index=index.replace('</body>','<script src="mobile.js"></script></body>').replace('Saved on this computer','Saved on this device')
(UI/'index.html').write_text(index,encoding='utf-8')
audio=(UI/'audio.js').read_text(encoding='utf-8').replace("let source=null,", "let hostPaused=false; let source=null,").replace('document.hidden','(document.hidden||hostPaused)')
audio=audio.replace('return {preferences,update,','return {setHostPaused(value){hostPaused=!!value;if(hostPaused){stop();ctx?.suspend()}else if(unlocked){ctx?.resume().then(sync)}},preferences,update,')
(UI/'audio.js').write_text(audio,encoding='utf-8')
presentation=(UI/'presentation.js').read_text(encoding='utf-8').replace('function fitArena(pass){','function fitArena(pass){if(document.documentElement.classList.contains("ilex-mobile"))return;')
(UI/'presentation.js').write_text(presentation,encoding='utf-8')
manifest=json.loads((UI/'scan-manifest.json').read_text(encoding='utf-8'))
ids=[k for k in manifest if k.startswith(('base1-','base2-','base3-'))]+['hgss4-92','neo3-3','neo4-106','ex10-117','bw7-9','bw7-141','swsh8-245','smp-SM79']
for card in ids:
    entry=manifest[card]; target=UI/entry['file']; target.parent.mkdir(parents=True,exist_ok=True)
    source=ROOT/'outputs/ILEX.GG-win32-x64/resources'/entry['file']
    assert hashlib.sha256(source.read_bytes()).hexdigest()==entry['sha256'],card
    shutil.copy2(source,target)
res=OUT/'res/drawable';res.mkdir(parents=True,exist_ok=True)
(res/'icon.xml').write_text('''<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108"><path android:fillColor="#123A2B" android:pathData="M0,0h108v108h-108z"/><path android:fillColor="#C6EB9F" android:pathData="M54,14C18,29 16,63 50,91C86,65 92,30 54,14M54,27L75,48L54,82L33,48z"/><path android:fillColor="#E9E9BA" android:pathData="M50,35h8v36h-8z"/></vector>''',encoding='utf-8')
compiled=OUT/'flat';compiled.mkdir(exist_ok=True)
run(TOOLS/'aapt2.exe','compile','--dir',OUT/'res','-o',compiled)
unsigned=OUT/'unsigned.apk'
linked=OUT/'linked';linked.mkdir(exist_ok=True)
(linked/'res/drawable').mkdir(parents=True,exist_ok=True)
run(TOOLS/'aapt2.exe','link','-I',JAR,'--manifest',HERE/'AndroidManifest.xml','--min-sdk-version','26','--target-sdk-version','36','--output-to-dir','-o',linked,*compiled.glob('*.flat'))
with zipfile.ZipFile(unsigned,'w',compression=zipfile.ZIP_DEFLATED) as archive:
    for f in linked.rglob('*'):
        if f.is_file():archive.write(f,f.relative_to(linked).as_posix())
classes=OUT/'classes';classes.mkdir(exist_ok=True)
run(JAVA/'javac.exe','--release','8','-encoding','UTF-8','-classpath',JAR,'-d',classes,HERE/'MainActivity.java')
dex=OUT/'dex';dex.mkdir(exist_ok=True)
run(JAVA/'java.exe','-cp',TOOLS/'lib/d8.jar','com.android.tools.r8.D8','--release','--min-api','26','--lib',JAR,'--output',dex,*classes.rglob('*.class'))
with zipfile.ZipFile(unsigned,'a',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    archive.write(dex/'classes.dex','classes.dex')
    for f in ASSETS.rglob('*'):
        if f.is_file():archive.write(f,'assets/'+f.relative_to(ASSETS).as_posix())
aligned=OUT/'aligned.apk'
# SDK's native ZIP writer crashes on this Windows host. aapt2's directory
# output and Python ZIP packaging avoid it; verify alignment with SDK below.
with zipfile.ZipFile(unsigned) as source,zipfile.ZipFile(aligned,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as target:
    for entry in source.infolist():
        info=zipfile.ZipInfo(entry.filename);info.compress_type=zipfile.ZIP_STORED if entry.filename=='resources.arsc' or entry.filename.endswith(('.mp3','.webp','.jpg','.png')) else zipfile.ZIP_DEFLATED
        if info.compress_type==zipfile.ZIP_STORED:
            offset=target.fp.tell()+30+len(info.filename.encode('utf-8'))
            padding=(-offset)%4
            if padding:info.extra=struct.pack('<HH',0xd935,padding)+bytes(padding)
        target.writestr(info,source.read(entry))
sign=HERE/'signing';sign.mkdir(exist_ok=True)
password=sign/'password.txt';key=sign/'ilex-android.jks'
if not key.exists():
    password.write_text(secrets.token_urlsafe(36),encoding='ascii')
    run(JAVA/'keytool.exe','-genkeypair','-keystore',key,'-alias','ilex','-keyalg','RSA','-keysize','3072','-validity','10000','-storepass:file',password,'-keypass:file',password,'-dname','CN=ILEX.GG Local Android Release, O=ILEX.GG, C=US')
apk=ROOT/'outputs/ILEX.GG-Android.apk'
run(JAVA/'java.exe','-jar',TOOLS/'lib/apksigner.jar','sign','--ks',key,'--ks-key-alias','ilex','--ks-pass','file:'+str(password),'--out',apk,aligned)
run(JAVA/'java.exe','-jar',TOOLS/'lib/apksigner.jar','verify','--verbose','--print-certs',apk)
run(TOOLS/'zipalign.exe','-c','4',apk)
report={'apk':str(apk),'bytes':apk.stat().st_size,'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'bundledScans':len(ids),'engineSha256':hashlib.sha256((UI/'rules-engine.js').read_bytes()).hexdigest(),'minAndroid':'8.0','targetSdk':36,'physicalDeviceTested':False}
(ROOT/'outputs/ILEX.GG-Android-build.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
