from pathlib import Path
import json,hashlib,shutil,zipfile,sys,os
root=Path(__file__).resolve().parents[2];sys.path.insert(0,str(root/'work/desktop-build'))
from reuse_zip_entries import rewrite
research=root/'work/v2-research';candidate=root/'work/v2-candidate';ui=candidate/'ui';dest=root/'outputs/ILEX.GG-2.0.0';prior=root/'outputs/ILEX.GG-1.23.0';shared=root/'outputs/ILEX.GG-win32-x64'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
 return h.hexdigest()
reports={n:read(research/n) for n in ['native-release/v2-fresh.json','native-release/v2-restored.json','native-release/fresh-tests.json','native-release/restored-tests.json','mobile-tests.json','broad-mobile-tests.json']}
for n,d in reports.items():
 assert d['passed'] and not d.get('errors'),n
 for name,h in d.get('hashes',{}).items():
  p=root/'work/android-build/build/assets/ui'/name if 'mobile' in n else ui/name
  assert sha(p)==h,(n,name)
android=read(candidate/'android-verification.json');build=read(candidate/'android-build.json');assert android['passed'];assert sha(candidate/'ILEX.GG-Android.apk')==android['sha256']==build['sha256']
paper='38420f9be848b12126bc1153bce544ca9419de9c89a213e82b7b7379147f50dd';pocket='3f52fa2fb8a70e72d71fb7f902a777e2d7e510ec0012f296ed4ce9e58a16e046';assert sha(ui/'rules-engine.js')==paper and sha(ui/'pocket-engine.js')==pocket
protected=['app.js','rules-match.js','bot-ai.js','bot-ui.js','bot-worker.js','pocket-engine.js','pocket-ui.js','pocket-model.js','cube-library.js','cube-ui.js','packs.js','pack-model.js','cards.json','sets.json','card-details.json','scan-manifest.json','rules-card-map.json','pocket-cards.json','pocket-sets.json','card-actions.js','tabletop-drag.js','private-match.js','private-peer.js','private-online.js']
for n in protected:assert sha(ui/n)==sha(prior/'resources/app/ui'/n),n
rules=(ui/'rules-ui.js').read_text(encoding='utf-8').replace("title('THE ARENA','Your next match starts here.','Choose your format. Bring your best deck. Make your next move.'","title('RULES TABLE','Play a rules-enforced match','Setup, card effects, attachments, attacks and checkup are resolved by the game engine.'").replace("esc(String(R.GamePhase[g.phase]).replaceAll('_',' '))","esc(R.GamePhase[g.phase])")
assert rules==(prior/'resources/app/ui/rules-ui.js').read_text(encoding='utf-8'),'Only intended rules UI copy changed'
with zipfile.ZipFile(candidate/'ILEX.GG-Android.apk') as z:
 for p in ui.rglob('*'):
  if not p.is_file():continue
  rel=p.relative_to(ui);expected=root/'work/android-build/build/assets/ui'/rel
  assert hashlib.sha256(z.read('assets/ui/'+rel.as_posix())).hexdigest()==sha(expected),str(rel)
  if rel.parts[0].startswith(('pocket','v2')):assert sha(p)==sha(expected),str(rel)
 assert z.testzip() is None
print('Final source, preserved gameplay files and all APK assets verified.',flush=True)
shutil.copytree(ui,dest/'resources/app/ui',dirs_exist_ok=True)
for n in ['self-test.cjs','pocket-self-test.cjs','pocket-paper-checks.js']:assert (dest/'resources/app'/n).exists()
report={'passed':True,'version':'2.0.0','feature':'The Grove Reimagined: major visual overhaul','paperEngineUnchanged':paper,'pocketEngineUnchanged':pocket,'gameplayFilesUnchanged':protected,'hashes':{p.name:sha(p) for p in ui.iterdir() if p.is_file()},'checks':{n:len(d['checks']) for n,d in reports.items()},'android':build,'androidStaticChecks':len(android['checks']),'artwork':{'file':'resources/app/ui/v2-assets/forest-arena.png','sha256':sha(ui/'v2-assets/forest-arena.png'),'tool':'built-in image_gen','prompt':'resources/app/ui/v2-assets/ARTWORK.md'},'limits':['Physical Android device acceptance remains pending.','UI tests and finite interaction fixtures are not exhaustive device or gameplay certification.','Previous multiplayer connectivity and Pocket client-edge acceptance limitations remain unchanged.','No remote publication; version2.0.0 is prepared locally.']}
audit=dest/'resources/app/validation/v2';source=dest/'resources/app/card-effect-sources/v2';audit.mkdir(parents=True,exist_ok=True);source.mkdir(parents=True,exist_ok=True)
for n in reports:shutil.copy2(research/n,audit/n.replace('/','-'))
for p in research.iterdir():
 if p.suffix in ['.cjs','.py','.md']:shutil.copy2(p,source/p.name)
shutil.copy2(candidate/'android-verification.json',audit/'android.json');(audit/'release.json').write_text(json.dumps(report,indent=2))
readme='''ILEX.GG 2.0.0 — THE GROVE REIMAGINED

Cinematic original forest environment, rotating Celebi showcase, luminous emerald/gold menus, coordinated gallery/deck/cube/format/pack/Pocket screens, a wide height-aware desktop arena, and upgraded elemental charge, impact, attacker and match-event presentation. Existing coin results, enlarged card actions, Undo and animation skipping remain. Reduced motion, host pause and keyboard/touch controls are retained. All prior paper and Pocket cards, decks, rules, cubes and saved collections are preserved.

Windows: extract the complete ZIP and run ILEX.GG.exe. Keep runtime and resources together. Android: install 2.0.0-android.43 over the existing app; original package and signing certificate retained. Physical Android acceptance remains pending. No online service, transport change or remote publication is part of this visual update. Existing real-network and gameplay edge limitations remain.

Original forest artwork and exact generation prompt: resources/app/ui/v2-assets/ARTWORK.md. Sources, finite test evidence and design notes are bundled under resources/app/validation/v2 and card-effect-sources/v2. Previous 1.23.0 remains available.
'''
(dest/'README-2.0.txt').write_text(readme,encoding='utf-8');(dest/'README.md').write_text('# ILEX.GG 2.0.0\n\n'+readme+'\n\n'+(prior/'README.md').read_text(encoding='utf-8'),encoding='utf-8');(root/'outputs/ILEX.GG-2.0.0.txt').write_text(readme,encoding='utf-8')
p=dest/'FEATURE-BACKLOG.md';s=p.read_text(encoding='utf-8');s+=('' if '**Major 2.0 UI overhaul:**' in s else '\n- [x] **Major 2.0 UI overhaul:** Implemented October20,2026 locally. Original forest environment, cinematic home with rotating Celebi, all-mode visual system, wide desktop battle arena, upgraded elemental cinematics and responsive/reduced-motion controls. Windows2.0.0 and original-certificate Android43 validated; physical Android acceptance pending. No GitHub publication.\n');p.write_text(s,encoding='utf-8')
p=dest/'studio-ui-manifest.json';d=read(p);d.update({p.relative_to(ui).as_posix():sha(p) for p in ui.rglob('*') if p.is_file()});p.write_text(json.dumps(d,indent=2))
p=dest/'desktop-verification.json';d=read(p);d['v2']=report;p.write_text(json.dumps(d,indent=2))
changed={}
previous_report=read(research/'release.json') if (research/'release.json').exists() else None
seeded=set(previous_report.get('changedReleaseFiles',[])) if previous_report else set()
inventory=([dest/n for n in seeded]+list(audit.rglob('*'))+list(source.rglob('*'))) if seeded else dest.rglob('*')
for p in inventory:
 if not p.is_file():continue
 rel=p.relative_to(dest).as_posix();old=prior/rel
 if rel in seeded or not old.exists() or p.stat().st_size!=old.stat().st_size or (rel.startswith('resources/app/ui/') and sha(p)!=sha(old)) or rel in ['ILEX.GG.exe','resources/app/package.json','resources/app/self-test.cjs','resources/app/pocket-self-test.cjs','desktop-verification.json','studio-ui-manifest.json']:
  changed[rel]=p
prefix='ILEX.GG-win32-x64/';archives=[]
for label in ['Windows','Windows-Offline']:
 old=root/'outputs'/('ILEX.GG-1.23.0-'+label+'.zip');target=root/'outputs'/('ILEX.GG-2.0.0-'+label+'.zip');pending=target.with_suffix('.pending.zip')
 with zipfile.ZipFile(old) as z:names=set(z.namelist())
 print('Packaging '+label,flush=True);rewrite(old,pending,{prefix+n:p for n,p in changed.items() if prefix+n in names},{prefix+n:p for n,p in changed.items() if prefix+n not in names})
 with zipfile.ZipFile(pending) as z:
  assert z.testzip() is None
  for n,p in changed.items():assert hashlib.sha256(z.read(prefix+n)).hexdigest()==sha(p),n
 os.replace(pending,target);archives.append({'file':str(target),'sha256':sha(target),'crcPassed':True});print('Verified '+label,flush=True);shutil.copy2(target,root/'outputs'/('ILEX.GG-'+label+'.zip'))
for n,p in changed.items():
 target=shared/n;target.parent.mkdir(parents=True,exist_ok=True)
 try:shutil.copy2(p,target)
 except PermissionError:
  if n!='ILEX.GG.exe':raise
  report['sharedExeLocked']=True
for target in [root/'outputs/ILEX.GG-2.0.0-Android.apk',root/'outputs/ILEX.GG-Android.apk']:shutil.copy2(candidate/'ILEX.GG-Android.apk',target)
shutil.copy2(candidate/'android-verification.json',root/'outputs/ILEX.GG-Android-verification.json')
shutil.copy2(research/'native-release/home-1440x960.png',root/'outputs/ILEX.GG-2.0.0-preview.png')
report['archives']=archives;report['changedReleaseFiles']=list(changed);(research/'release.json').write_text(json.dumps(report,indent=2));(root/'work/rules-research/v2-ui-release.json').write_text(json.dumps(report,indent=2))
print('ILEX.GG2.0.0 locally packaged; no remote publication.',flush=True)
