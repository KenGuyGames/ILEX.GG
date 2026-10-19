import pathlib,json,re
root=pathlib.Path(__file__).resolve().parents[2];folder=root/'work/mega-candidate';android=root/'work/android-build'
source=(android/'AndroidManifest.xml').read_text(encoding='utf-8')
source=re.sub(r'android:versionCode="\d+"','android:versionCode="27"',source)
source=re.sub(r'android:versionName="[^"]+"','android:versionName="1.19.0-android.27"',source)
(folder/'AndroidManifest.xml').write_text(source,encoding='utf-8')
ids=(android/'sv-startup-scans.txt').read_text(encoding='utf-8').strip().split(',')
ids += ['me01-003','me01-060','me02-029','me02.5-084','me05-048','30th-021','me04-061','me05-027','me01-120','30th-c-019','30th-c-020','me03-047','me03-070']
ids += ['mep-'+str(n).zfill(3) for n in range(89,111)]
records=json.loads((root/'work/rules-research/mega-candidate-data.json').read_text(encoding='utf-8'))
for set_id in ['mee','me01','mep','me02','me02.5','me03','me04','me05','30th','30th-c']:
 ids.append(next(r['d']['id'] for r in records if r['d']['set']['id']==set_id))
ids=list(dict.fromkeys(ids));(folder/'android-extra-scans.txt').write_text(','.join(ids),encoding='utf-8')
print(f'Prepared Android code 27 and {len(ids)} explicit extra scan requests.')
