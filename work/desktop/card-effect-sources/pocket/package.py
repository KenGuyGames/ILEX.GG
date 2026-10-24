from pathlib import Path
import json,hashlib,shutil,zipfile,sys,os
root=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(root/'work/desktop-build'))
from reuse_zip_entries import rewrite
research=root/'work/pocket-research';candidate=root/'work/pocket-candidate';ui=candidate/'ui';dest=root/'outputs/ILEX.GG-1.23.0';shared=root/'outputs/ILEX.GG-win32-x64';prior=root/'outputs/ILEX.GG-1.22.0'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
 return h.hexdigest()
reports={n:read(research/n) for n in ['foundation-tests.json','interaction-tests.json','attack-smoke.json','attack-branches.json','effect-smoke.json','strategic-games.json','mobile-tests.json','native-v8/fresh-tests.json','native-v8/restored-tests.json']}
for n,d in reports.items():
 assert d.get('passed',True),n
 assert not d.get('failures'),n
for name in ['mobile-tests.json','native-v8/fresh-tests.json','native-v8/restored-tests.json']:
 for n,h in reports[name]['hashes'].items():
  p=(root/'work/android-build/build/assets/ui'/n) if name=='mobile-tests.json' else (ui/n if (ui/n).exists() else candidate/n)
  assert sha(p)==h,(name,n)
android=read(candidate/'android-verification.json');build=read(candidate/'android-build.json');assert android['passed'];assert sha(candidate/'ILEX.GG-Android.apk')==android['sha256']==build['sha256']
engine='38420f9be848b12126bc1153bce544ca9419de9c89a213e82b7b7379147f50dd';assert sha(ui/'rules-engine.js')==engine
coverage=read(research/'automation-coverage.json');assert coverage['candidate']==4317 and coverage['pending']==0
with zipfile.ZipFile(candidate/'ILEX.GG-Android.apk') as z:
 for p in ui.rglob('*'):
  if p.is_file():
   rel=p.relative_to(ui);expected=root/'work/android-build/build/assets/ui'/rel
   assert hashlib.sha256(z.read('assets/ui/'+rel.as_posix())).hexdigest()==sha(expected),str(p)
   if rel.parts[0].startswith('pocket'):assert sha(expected)==sha(p),str(p)
 assert z.testzip() is None
print('All Android Pocket assets match final source; CRC passed.',flush=True)
shutil.copytree(ui,dest/'resources/app/ui',dirs_exist_ok=True)
shutil.copy2(research/'native-self-test.cjs',dest/'resources/app/self-test.cjs')
shutil.copy2(root/'work/cube-mutant-repair/browser-checks.js',dest/'resources/app/pocket-paper-checks.js')
p=dest/'resources/app/main.cjs';s=p.read_text(encoding='utf-8');s=s.replace('Private Windows multiplayer preview. Catalog rules through Scarlet & Violet; BW onward interactions, Unlimited deferred. Real two-PC connection acceptance remains pending. Local decks and saves are retained. Unofficial fan-made simulator.','Paper TCG and Pokemon TCG Pocket simulator. Separate Pocket cards, decks, Energy Zone battles and packs. Local decks and saves are retained. Unofficial fan-made simulator.');p.write_text(s,encoding='utf-8')
report={'passed':True,'version':'1.23.0','scope':'All released Pocket English printings through 2026-10-20; independent local/bot mode','printings':4317,'catalogs':24,'pending':0,'packPools':55,'cardScans':4317,'packArt':29,'paperEngineUnchanged':engine,'hashes':{p.name:sha(p) for p in ui.iterdir() if p.is_file()},'checks':{n:len(d.get('checks',[])) or d.get('cases') for n,d in reports.items()},'android':build,'limits':['Finite fixtures do not prove every card interaction.','Exact official opening-hand distribution/RNG is not replicated.','Current-client acceptance for simultaneous end triggers and stolen Item discard ownership remains pending.','Promo pools without per-card source rates use uniform simulator selection.','Physical Android device acceptance remains pending.','Pocket multiplayer, trading and ranked services are not included.']}
audit=dest/'resources/app/validation/pocket';source=dest/'resources/app/card-effect-sources/pocket';audit.mkdir(parents=True,exist_ok=True);source.mkdir(parents=True,exist_ok=True)
for n in reports:shutil.copy2(research/n,audit/n.replace('/','-'))
for n in ['scan-integrity.json','SOURCES.json','automation-coverage.json']:shutil.copy2(research/n,audit/n)
for p in research.iterdir():
 if p.suffix in ['.cjs','.py']:shutil.copy2(p,source/p.name)
shutil.copy2(candidate/'android-verification.json',audit/'android.json')
(audit/'release.json').write_text(json.dumps(report,indent=2))
readme='ILEX.GG 1.23.0 — Pokemon TCG Pocket\n\nChoose Pokemon TCG Pocket from the main menu. Includes 4,317 English printings across 24 catalogs, independent 20-card decks, Energy Zone, three-point battles, three-place Bench, Pocket effects and turn limits, local play and Easy/Normal/Hard bots, immediate Undo, enlarged-card actions, committed coin/attack presentation and audio. Packs include 55 booster/promo pools with local card and pack artwork, sequential reveals and saved pulls. Paper decks, cube drafts, matches and collections remain separate.\n\nWindows: extract the entire ZIP, then launch ILEX.GG.exe. Android: install the new APK over the existing app to retain saves; original signing certificate retained. Physical Android acceptance remains pending. Pocket online multiplayer is not included. See bundled source notices and validation/pocket for data attribution and finite-test limitations.\n'
(dest/'POCKET-README.txt').write_text(readme,encoding='utf-8');(root/'outputs/ILEX.GG-Pocket.txt').write_text(readme,encoding='utf-8')
p=dest/'studio-ui-manifest.json';manifest=read(p);manifest.update({p.relative_to(ui).as_posix():sha(p) for p in ui.rglob('*') if p.is_file()});p.write_text(json.dumps(manifest,indent=2))
p=dest/'desktop-verification.json';d=read(p);d['pocket']=report;p.write_text(json.dumps(d,indent=2))
changed={}
for p in dest.rglob('*'):
 if not p.is_file():continue
 rel=p.relative_to(dest).as_posix();old=prior/rel
 if not old.exists() or p.stat().st_size!=old.stat().st_size or (rel.startswith('resources/app/ui/') and sha(p)!=sha(old)) or rel in ['ILEX.GG.exe','resources/app/package.json','resources/app/main.cjs','resources/app/self-test.cjs','desktop-verification.json','studio-ui-manifest.json']:
  changed[rel]=p
prefix='ILEX.GG-win32-x64/';archives=[]
for label in ['Windows','Windows-Offline']:
 old=root/'outputs'/('ILEX.GG-1.22.0-'+label+'.zip');target=root/'outputs'/('ILEX.GG-1.23.0-'+label+'.zip');pending=target.with_suffix('.pending.zip')
 with zipfile.ZipFile(old) as z:names=set(z.namelist())
 print('Packaging '+label,flush=True)
 rewrite(old,pending,{prefix+n:p for n,p in changed.items() if prefix+n in names},{prefix+n:p for n,p in changed.items() if prefix+n not in names})
 with zipfile.ZipFile(pending) as z:
  assert z.testzip() is None
  for n,p in changed.items():assert hashlib.sha256(z.read(prefix+n)).hexdigest()==sha(p),n
 os.replace(pending,target);archives.append({'file':str(target),'sha256':sha(target),'crcPassed':True});print('Verified '+label,flush=True)
 for generic in [root/'outputs'/('ILEX.GG-'+label+'.zip')]:shutil.copy2(target,generic)
for n,p in changed.items():
 target=shared/n;target.parent.mkdir(parents=True,exist_ok=True)
 try:shutil.copy2(p,target)
 except PermissionError:
  if n!='ILEX.GG.exe':raise
  report['sharedExeLocked']=True
for target in [root/'outputs/ILEX.GG-1.23.0-Android.apk',root/'outputs/ILEX.GG-Android.apk']:shutil.copy2(candidate/'ILEX.GG-Android.apk',target)
shutil.copy2(candidate/'android-verification.json',root/'outputs/ILEX.GG-Android-verification.json')
report['archives']=archives;(research/'release.json').write_text(json.dumps(report,indent=2));(root/'work/rules-research/pocket-release.json').write_text(json.dumps(report,indent=2))
print('Pocket 1.23.0 packaged and delivered.',flush=True)
