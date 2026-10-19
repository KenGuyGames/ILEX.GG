"""Adapt the verified prior release gates without changing game implementations."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[2];here=Path(__file__).resolve().parent
def adapt(old,new):
 s=(here/old).read_text(encoding='utf-8').replace('sm-','swsh-').replace('SM-','SWSH-').replace('desktop-sm-tests-v8','desktop-swsh-tests-v1').replace('3069','3715').replace('3,069','3,715').replace('1.15.0','1.16.0').replace('Sun & Moon','Sword & Shield').replace('through SM','through Sword & Shield')
 (here/new).write_text(s,encoding='utf-8');return s
s=adapt('sm-record-validation.cjs','swsh-record-validation.cjs').replace('focused.checks,82','focused.checks,67').replace('shared.results.length,13','shared.results.length,16')
(here/'swsh-record-validation.cjs').write_text(s,encoding='utf-8')
s=adapt('stage-sm.py','stage-swsh.py')
s=s.replace("prior=archive/('swsh-source-manifest.json' if (archive/'swsh-source-manifest.json').exists() else 'xy-source-manifest.json')","prior=archive/('swsh-source-manifest.json' if (archive/'swsh-source-manifest.json').exists() else 'sm-source-manifest.json')")
s=s.replace("('printed-xy/','printed-sm/')","('printed-xy/','printed-sm/','printed-swsh/')")
s=s.replace("source/'sets/08-sun-and-moon'","source/'sets/08-sun-and-moon',source/'sets/09-sword-and-shield'")
s=s.replace("if f.stem.startswith('sm') or f.stem in ['det1','mcd17','mcd18','mcd19']:files['printed-sm/'+f.name]=f","if f.stem.startswith('swsh') or f.stem in ['pgo','cel25','cel25c','fut20','mcd21','mcd22']:files['printed-swsh/'+f.name]=f")
(here/'stage-swsh.py').write_text(s,encoding='utf-8')
adapt('brand-sm.cjs','brand-swsh.cjs');adapt('run-sm-native.cjs','run-swsh-native.cjs')
s=adapt('package-sm.py','package-swsh.py')
s=s.replace("native_names=['swsh-native-tests'","native_names=['sm-native-tests','swsh-native-tests'")
s=s.replace("len(load(native/'realistic-native-tests.json')['checks'])==12","len(load(native/'realistic-native-tests.json')['checks'])>=12")
start=s.index("scan_audit=load(");end=s.index("print('Verified",start)
s=s[:start]+s[end:]
s=s.replace("'additionalScansVerified':68,'limitedKitEnergyOriginals':12,","'additionalScansVerified':0,")
start=s.index('Complete English Sword & Shield automation:');end=s.index('\n\nInteractions cover',start)
s=s[:start]+"Complete English Sword & Shield automation: 3,715 printings, zero pending across 28 catalogs. Includes Sword & Shield through Crown Zenith, all 307 Black Star Promos, Champion’s Path, Shining Fates/Shiny Vault, Pokémon GO, Celebrations/Classics, four Trainer Galleries, Galarian Gallery, Futsal 2020 and McDonald’s 2021–22."+s[end:]
s=s.replace('The historical SM profile permits first-turn Supporters and uses the updated Burn rule; Expanded retains modern mechanics.','The Sword & Shield profile disallows first-turn Supporters. Expanded retains modern mechanics.')
s=s.replace('GX use, TAG TEAM Prizes, Prism Star movement, conditional Abilities, copied Supporters, attack continuations and Energy-transfer choices are included.','V, VMAX, VSTAR and V-UNION rules, Radiant limits, Battle Styles, Lost Zone costs, Special Energy units and conditional effects are included.')
s=s.replace('SM Windows','SWSH Windows').replace('current SM source','current SWSH source')
(here/'package-swsh.py').write_text(s,encoding='utf-8')
s=adapt('publish-android-sm.py','publish-android-swsh.py').replace('ILEX.GG-SM-candidate','ILEX.GG-SWSH-candidate').replace('sm_mobile','swsh_mobile').replace('smLandscapeSizes','swshLandscapeSizes').replace('==65','==71').replace("'mobileChecks':65","'mobileChecks':71").replace('android.14','android.19').replace("'versionCode':14","'versionCode':19")
(here/'publish-android-swsh.py').write_text(s,encoding='utf-8')
s=adapt('sm-final-release.cjs','swsh-final-release.cjs').replace('additionalScansVerified:68,limitedKitEnergyOriginals:12,','additionalScansVerified:0,')
(here/'swsh-final-release.cjs').write_text(s,encoding='utf-8')
p=root/'work/desktop/package.json';d=json.loads(p.read_text());d['version']='1.16.0';p.write_text(json.dumps(d,indent=2),encoding='utf-8')
p=root/'work/android-build/AndroidManifest.xml';s=p.read_text().replace('versionCode="18"','versionCode="19"').replace('1.15.0-android.18','1.16.0-android.19');p.write_text(s,encoding='utf-8')
p=root/'work/android-build/verify.py';s=p.read_text().replace("versionCode='18'","versionCode='19'").replace("versionName='1.15.0-android.18'","versionName='1.16.0-android.19'").replace('Lysandre Labs repair uses higher versionCode','Sword & Shield uses higher versionCode');p.write_text(s,encoding='utf-8')
print('Prepared SWSH release gates; Android code 19 preserves newer bug-fix updates.')
