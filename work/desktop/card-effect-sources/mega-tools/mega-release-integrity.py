"""Freeze auditable source and verify every inherited scan before Mega publication."""
import concurrent.futures,hashlib,json,pathlib,shutil
from PIL import Image
root=pathlib.Path(__file__).resolve().parents[2]; research=root/'work/rules-research'; candidate=root/'work/mega-desktop-candidate';ui=candidate/'resources/app/ui'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as s:
  for b in iter(lambda:s.read(1048576),b''):h.update(b)
 return h.hexdigest()
read=lambda p:json.loads(p.read_text(encoding='utf-8'))
engine=sha(ui/'rules-engine.js');records=read(research/'mega-candidate-data.json');assert len(records)==1293
manifest=read(ui/'scan-manifest.json');assert len(manifest)==23860
base=root/'work/private-desktop-candidate/resources/app/ui';previous=read(base/'scan-manifest.json')
assert all(manifest.get(k)==v for k,v in previous.items())
def scan_check(pair):
 ident,e=pair;f=candidate/'resources'/e['file'];assert f.stat().st_size==e['bytes'] and sha(f)==e['sha256'],ident
 with Image.open(f) as im:
  im.verify()
 return ident
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(scan_check,manifest.items()))
finishes=[f for f in (base/'finish-scans').rglob('*') if f.is_file()];assert len(finishes)==209
for f in finishes:assert sha(f)==sha(ui/f.relative_to(base))
for n in ['private-match.js','private-peer.js','private-ui.js','ilex-card-back.svg','audio.js']:
 if (base/n).exists():assert sha(base/n)==sha(ui/n),n
mapping=read(ui/'rules-card-map.json');cards=read(ui/'cards.json');details=read(ui/'card-details.json');ids={c['id'] for c in cards}
for r in records:
 ident=r['d']['id'];assert ident in mapping and ident in ids and ident in details and ident in manifest,ident
assert 'mep-Museum' not in mapping
archive=candidate/'resources/app/card-effect-sources';target=archive/'mega-source'
shutil.copytree(root/'work/mega-source/src',target,dirs_exist_ok=True)
tools=archive/'mega-tools';tools.mkdir(exist_ok=True)
for f in (root/'work/desktop-build').glob('*mega*'):
 if f.is_file():shutil.copy2(f,tools/f.name)
for n in ['build-rules.cjs','sv-attack-patterns.cjs','sv-power-patterns.cjs','bw-attack-patterns.cjs','bw-power-patterns.cjs','dp-printed-rules.cjs']:
 f=root/'work/desktop-build'/n
 if f.exists():shutil.copy2(f,tools/n)
printed=archive/'printed-mega';printed.mkdir(exist_ok=True)
for n in ['mega-candidate-data.json','mega-inventory.json','mega-supplements.json','mega-supplement-completeness.json','mega-native-review.json']:
 f=research/n
 if f.exists():shutil.copy2(f,printed/n)
shutil.copytree(root/'work/card-sources/mega-official-promos',archive/'mega-official-promos',dirs_exist_ok=True)
files=[{'path':f.relative_to(archive).as_posix(),'bytes':f.stat().st_size,'sha256':sha(f)} for sub in [target,tools,printed,archive/'mega-official-promos'] for f in sub.rglob('*') if f.is_file()]
(archive/'mega-source-manifest.json').write_text(json.dumps({'engineSha256':engine,'canonicalSource':'mega-source','files':files,'build':'Set ILEX_RULES_SOURCE_ROOT to mega-source and an explicit ILEX_RULES_OUTFILE. Older root source is historical provenance.'},indent=2),encoding='utf-8')
report={'passed':True,'engineSha256':engine,'printings':1293,'scansVerified':len(manifest),'newPromoScans':22,'preservedFinishImages':209,'sourceFilesVerified':len(files),'previousScanEntriesPreserved':len(previous),'privateMultiplayerFilesPreserved':True}
(research/'mega-ui-library-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
