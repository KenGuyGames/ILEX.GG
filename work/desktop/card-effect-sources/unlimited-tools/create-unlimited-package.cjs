const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..');
const base=fs.readFileSync(path.join(__dirname,'package-mega.py'),'utf8');
const tail=base.slice(base.indexOf("(candidate/'studio-ui-manifest.json')")).replaceAll('before-mega-','before-unlimited-').replaceAll('work/mega-candidate','work/unlimited-candidate').replaceAll("'mega-final-release-evidence.json'","'unlimited-final-release-evidence.json'").replaceAll('1.19.0-android.27','1.20.0-android.28').replaceAll('Mega Windows and Android release verified.','Unlimited Windows and Android release verified.');
const head=`"""Package the validated Unlimited build without changing user data."""
import concurrent.futures,datetime,hashlib,json,os,pathlib,shutil,zipfile
root=pathlib.Path(__file__).resolve().parents[2];candidate=root/'work/unlimited-desktop-candidate';released=root/'outputs/ILEX.GG-win32-x64';research=root/'work/rules-research';ui=candidate/'resources/app/ui'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
read=lambda p:json.loads(p.read_text(encoding='utf-8'))
source=read(research/'unlimited-source-validation.json');engine=sha(ui/'rules-engine.js');assert source['passed']and source['engineSha256']==engine
assert source['ruleAdapterSha256']==sha(ui/'rules-match.js')and source['botSha256']==sha(ui/'bot-ai.js')
archive=candidate/'resources/app/card-effect-sources';manifest=read(archive/'unlimited-source-manifest.json');assert manifest['engineSha256']==engine
for e in manifest['files']:assert sha(archive/e['path'])==e['sha256'],e['path']
scans=read(ui/'scan-manifest.json');assert len(scans)==23860
def scan_check(pair):
 ident,e=pair;p=candidate/'resources'/e['file'];assert p.stat().st_size==e['bytes']and sha(p)==e['sha256'],ident
with concurrent.futures.ThreadPoolExecutor(max_workers=8)as pool:list(pool.map(scan_check,scans.items()))
apk=root/'work/unlimited-candidate/ILEX.GG-Android.apk';android=read(root/'work/unlimited-candidate/android-verification.json');assert android['passed']and android['sha256']==sha(apk)
with zipfile.ZipFile(apk)as z:assert hashlib.sha256(z.read('assets/ui/rules-engine.js')).hexdigest()==engine
audits=candidate/'resources/app/validation/unlimited';audits.mkdir(parents=True,exist_ok=True)
for f in research.glob('unlimited-*.json'):shutil.copy2(f,audits/f.name)
shutil.copy2(research/'UNLIMITED-PROGRESS.md',audits/'UNLIMITED-PROGRESS.md')
for f in(root/'work/unlimited-native-final-v2').glob('*.json'):shutil.copy2(f,audits/('native-'+f.name))
for n in ['unlimited-mobile-tests.json','mobile-verification.json']:shutil.copy2(root/'work/android-build'/n,audits/n)
shutil.copy2(root/'work/unlimited-candidate/android-verification.json',audits/'android-verification.json')
readme=f'''# ILEX.GG 1.20.0

Unlimited now enables interactions across all implemented eras, from Base Set through Mega / 30th Celebration. Select Unlimited when setting up a new match. Existing saved matches retain their original rules profile.

Unlimited uses modern first-turn, Burn and Tool rules, current Trainer/Special Energy reprint wording, and historical card mechanics. Original artwork and deck printing IDs are preserved. Legacy Pokémon Powers, Poké-Powers, Poké-Bodies and modern Abilities remain distinct. Historical format profiles remain available. No official banlist update is supplied.

Validation: {source['focusedChecks']} expected-result groups, {source['printedAttackCases']} printed attack cases, {source['trainerResolved']} resolved Trainer fixtures, {source['sharedGroups']} shared suites, {source['preservedModernGroups']} modern suites, {source['mixedGames']} bounded mixed-era games ({source['decisions']} decisions, {source['completedGames']} completed) with exact replay/Undo, fresh/restored Windows and three mobile landscape sizes. Conditional/passive unavailable cases are recorded separately. Finite checks do not prove every possible interaction.

Run ILEX.GG.exe on Windows 10/11 64-bit and keep its folder together. Windows EXE is unsigned. Existing workspace saves are preserved. Compact ZIP downloads scans as needed; Offline ZIP contains 23,860 regular scans and 209 finish images. Finish-specific scan acquisition remains incomplete.

Android 1.20.0-android.28 retains the original signing certificate; install over the existing app. Physical Android acceptance remains pending. Private invite-code multiplayer and opponent-approved Undo are preserved, with simulated-channel checks; an actual external two-PC full match remains unverified.

Canonical corrected source and hash manifest: resources/app/card-effect-sources/unlimited-source and unlimited-source-manifest.json. Detailed finite validation: desktop-verification.json and resources/app/validation/unlimited. All previous card catalogs, packs, audio, bots and presentation features are retained.

Unofficial fan-made software. Pokémon names/artwork belong to their owners. Existing licenses are retained.
'''
(candidate/'README.md').write_text(readme,encoding='utf-8')
(candidate/'START HERE.txt').write_text('ILEX.GG 1.20.0 for Windows 10/11 64-bit\\n\\nDouble-click ILEX.GG.exe. Keep this folder together. Choose Unlimited for new all-era matches. See README.md for rules and verification limits.\\n',encoding='utf-8')
(candidate/'desktop-verification.json').write_text(json.dumps(source,indent=2),encoding='utf-8')
`;
fs.writeFileSync(path.join(__dirname,'package-unlimited.py'),head+tail);
let brand=fs.readFileSync(path.join(__dirname,'brand-mega.cjs'),'utf8').replaceAll('mega-desktop-candidate','unlimited-desktop-candidate').replaceAll('1.19.0','1.20.0');fs.writeFileSync(path.join(__dirname,'brand-unlimited.cjs'),brand);console.log('Gated Unlimited packager and version branding prepared.');
