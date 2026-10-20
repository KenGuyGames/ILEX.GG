from pathlib import Path
p=Path('work/desktop-build/cube-tests.cjs');s=p.read_text(encoding='utf-8').replace("c.entries.find(e=>e.pool==='EXpansion'&&!e.id).id='swsh5-85';", "assert.equal(c.entries.find(e=>e.key==='Pokemon:X7').id,'swsh5-85');");p.write_text(s,encoding='utf-8')
p=Path('work/cube-candidate/AndroidManifest.xml');s=p.read_text(encoding='utf-8').replace('versionCode="35"','versionCode="36"').replace('android.35','android.36');p.write_text(s,encoding='utf-8')
p=Path('work/desktop-build/build-android-cube.cjs');s=p.read_text(encoding='utf-8').replace("EXPECTED_CODE:'35'","EXPECTED_CODE:'36'").replace("EXPECTED_VERSION:'1.22.0-android.35'","EXPECTED_VERSION:'1.22.0-android.36'");p.write_text(s,encoding='utf-8')
