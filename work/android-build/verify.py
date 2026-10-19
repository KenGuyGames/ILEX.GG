from pathlib import Path
import hashlib,json,zipfile,subprocess,struct,os
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent
SOURCE_UI=Path(os.environ.get('ILEX_ANDROID_UI_ROOT',str(ROOT/'work/desktop/ui')))
apk=Path(os.environ.get('ILEX_ANDROID_OUTPUT',str(ROOT/'outputs/ILEX.GG-Android.apk')));checks=[]
def check(value,label):
    assert value,label
    checks.append(label)
with zipfile.ZipFile(apk) as z:
    check(z.testzip() is None,'All APK entries pass CRC integrity checks')
    check(z.read('classes.dex').startswith(b'dex\n'),'Compiled Android Activity and host bridge included')
    check(not any('signing/' in n or n.endswith(('.jks','.keystore')) or 'password' in n for n in z.namelist()),'Private signing material excluded')
    for name in ['scan-manifest.json','rules-ui.js','tabletop-drag.js','rules-engine.js','rules-match.js','bot-ai.js','bot-ui.js','bot-worker.js','limitless-collection.js','cards.json','sets.json','card-details.json','rules-card-map.json','pack-model.js','pack-specials.js','pack-finishes.js','legend-display.js','card-actions.js','tabletop.js','tabletop.css']:
        check(z.read('assets/ui/'+name)==(SOURCE_UI/name).read_bytes(),name+' matches verified desktop source')
    for name in ['mobile.js','mobile-host.js','mobile-compat.js','mobile.css','mobile-landscape.css']:
        check(z.read('assets/ui/'+name)==(HERE/name).read_bytes(),name+' matches final Android source')
    manifest=json.loads(z.read('assets/ui/scan-manifest.json'))
    by_file={e['file']:e for e in manifest.values() if 'file' in e}
    scans=[n for n in z.namelist() if n.startswith('assets/ui/scans/')]
    check(len(scans)==int(os.environ.get('ILEX_ANDROID_EXPECTED_SCANS','395')),'Expected startup and era demonstration scans bundled')
    check(all(hashlib.sha256(z.read(n)).hexdigest()==by_file[n[len('assets/ui/'):]]['sha256'] for n in scans),'Every bundled card scan matches manifest SHA-256')
    check(z.getinfo('resources.arsc').compress_type==zipfile.ZIP_STORED,'Compiled resource table is uncompressed for Android 11+')
    with apk.open('rb') as raw:
        for info in z.infolist():
            if info.compress_type==zipfile.ZIP_STORED:
                raw.seek(info.header_offset+26);name_len,extra_len=struct.unpack('<HH',raw.read(4));assert (info.header_offset+30+name_len+extra_len)%4==0,info.filename
    checks.append('All stored ZIP entries aligned to four bytes')
    check(not any(n.startswith('lib/') for n in z.namelist()),'Universal APK has no CPU-specific native libraries')
badging=subprocess.run([str(HERE/'toolchain/build-tools/android-16/aapt2.exe'),'dump','badging',str(apk)],capture_output=True,text=True,check=True).stdout
check("minSdkVersion:'26'" in badging and "targetSdkVersion:'36'" in badging,'Android 8 minimum and SDK 36 target encoded in APK')
check([line for line in badging.splitlines() if line.startswith('uses-permission:')]==["uses-permission: name='android.permission.INTERNET'"],'Internet is the only requested Android permission')
check("launchable-activity: name='gg.ilex.app.MainActivity'" in badging,'Launcher Activity registered')
expected_code=os.environ.get('ILEX_ANDROID_EXPECTED_CODE','26');expected_version=os.environ.get('ILEX_ANDROID_EXPECTED_VERSION','1.17.0-android.26')
check(f"versionCode='{expected_code}'" in badging and f"versionName='{expected_version}'" in badging,'Expected Android version supports in-place installation')
mobile=json.loads((HERE/'mobile-verification.json').read_text())
check(mobile['passed'] and not mobile['errors'],'Mobile Chromium touch and responsive checks passed')
report={'passed':True,'checks':checks,'mobileChecks':len(mobile['checks']),'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'physicalAndroidDeviceTested':False,'limits':'Native file picker, cache network downloads, actual Android lifecycle/audio and device performance still require an installed-device acceptance pass.'}
Path(os.environ.get('ILEX_ANDROID_VERIFICATION',str(ROOT/'outputs/ILEX.GG-Android-verification.json'))).write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
