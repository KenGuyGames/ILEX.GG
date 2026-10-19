from pathlib import Path
root=Path(__file__).resolve().parents[2]
p=root/'work/android-build/verify.py';s=p.read_text(encoding='utf-8').replace('len(scans)==246','len(scans)==285').replace('246 startup','285 startup').replace('SM demonstration scans','SM/SWSH demonstration scans');p.write_text(s,encoding='utf-8')
p=root/'work/desktop-build/publish-android-swsh.py';s=p.read_text(encoding='utf-8').replace("'bundledScans':246","'bundledScans':285");p.write_text(s,encoding='utf-8')
