from pathlib import Path
p=Path('work/cube-candidate/AndroidManifest.xml');s=p.read_text(encoding='utf-8').replace('versionCode="34"','versionCode="35"').replace('android.34','android.35');p.write_text(s,encoding='utf-8')
p=Path('work/desktop-build/build-android-cube.cjs');s=p.read_text(encoding='utf-8').replace("EXPECTED_CODE:'34'","EXPECTED_CODE:'35'").replace("EXPECTED_VERSION:'1.22.0-android.34'","EXPECTED_VERSION:'1.22.0-android.35'");p.write_text(s,encoding='utf-8')
