import pathlib,json,shutil,hashlib
root=pathlib.Path(__file__).resolve().parents[2];source=root/'work/rules-research/twinleafgg-main/ptcg-server/src';app=root/'work/dp-desktop-candidate/resources/app';archive=app/'card-effect-sources'
old=json.loads((archive/('xy-source-manifest.json' if (archive/'xy-source-manifest.json').exists() else 'bw-source-manifest.json')).read_text(encoding='utf-8'))
def resolve(name):
 if name.startswith('printed-xy/'):
  return root/'work/card-sources/pokemon-tcg-data-master/cards/en'/pathlib.Path(name).name
 for directory in [source,root/'work/desktop-build',root/'work/rules-research',root/'work/card-sources',archive]:
  if (directory/name).is_file():return directory/name
 raise FileNotFoundError(name)
files={e['path']:resolve(e['path']) for e in old['files']}
files['sets/10-scarlet-and-violet/set-twilight-masquerade/enhanced-hammer.ts']=source/'sets/10-scarlet-and-violet/set-twilight-masquerade/enhanced-hammer.ts'
for directory in [source/'game',source/'sets/05-heartgold-and-soulsilver',source/'sets/06-black-and-white',source/'sets/07-x-and-y']:
 for f in directory.rglob('*.ts'):files[f.relative_to(source).as_posix()]=f
for f in source.glob('tcg-lab-*.ts'):files[f.name]=f
for f in (root/'work/desktop-build').glob('xy-*'):
 if f.is_file():files[f.name]=f
for name in ['xy-supplements.json']:files[name]=root/'work/card-sources'/name
canonical=root/'work/card-sources/pokemon-tcg-data-master/cards/en'
for f in canonical.glob('*.json'):
 if f.stem.startswith('xy') or f.stem in ['g1','dc1','mcd14','mcd15','mcd16']:files['printed-xy/'+f.name]=f
shutil.copytree(root/'work/desktop',app,dirs_exist_ok=True)
(app/'self-test.cjs').write_text("module.exports=require('./xy-self-test.cjs');",encoding='utf-8')
entries=[]
for name,f in sorted(files.items()):
 target=archive/name;target.parent.mkdir(parents=True,exist_ok=True)
 if f.resolve()!=target.resolve():shutil.copy2(f,target)
 entries.append({'path':name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
manifest={'engineSha256':hashlib.sha256((app/'ui/rules-engine.js').read_bytes()).hexdigest(),'scope':'Complete XY 2208 printings, interactions BW onward through implemented XY; Unlimited deferred. Shared historical regressions retained.','files':entries}
(archive/'xy-source-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
for name in ['bw-source-manifest.json','hgss-source-manifest.json','dp-source-manifest.json']:(archive/name).unlink(missing_ok=True)
print(json.dumps({'files':len(entries),'engineSha256':manifest['engineSha256']}))
