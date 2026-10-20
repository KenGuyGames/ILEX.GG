from pathlib import Path
p=Path('work/cube-candidate/AndroidManifest.xml');s=p.read_text(encoding='utf-8').replace('versionCode="36"','versionCode="37"').replace('android.36','android.37');p.write_text(s,encoding='utf-8')
p=Path('work/desktop-build/build-android-cube.cjs');s=p.read_text(encoding='utf-8').replace("EXPECTED_CODE:'36'","EXPECTED_CODE:'37'").replace("EXPECTED_VERSION:'1.22.0-android.36'","EXPECTED_VERSION:'1.22.0-android.37'");p.write_text(s,encoding='utf-8')
