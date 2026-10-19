import pathlib,json,shutil,hashlib
root=pathlib.Path(__file__).resolve().parents[2];source=root/'work/rules-research/twinleafgg-main/ptcg-server/src';app=root/'work/dp-desktop-candidate/resources/app';archive=app/'card-effect-sources'
prior=archive/('swsh-source-manifest.json' if (archive/'swsh-source-manifest.json').exists() else 'sm-source-manifest.json')
old=json.loads(prior.read_text(encoding='utf-8'))
previous={e['path']:e['sha256'] for e in old['files']}
def resolve(name):
 if name.startswith(('printed-xy/','printed-sm/','printed-swsh/')):return root/'work/card-sources/pokemon-tcg-data-master/cards/en'/pathlib.Path(name).name
 for directory in [source,root/'work/desktop-build',root/'work/desktop',root/'work/rules-research',root/'work/card-sources',archive]:
  if (directory/name).is_file():return directory/name
 raise FileNotFoundError(name)
files={e['path']:resolve(e['path']) for e in old['files']}
for directory in [source/'game',source/'sets/05-heartgold-and-soulsilver',source/'sets/06-black-and-white',source/'sets/07-x-and-y',source/'sets/08-sun-and-moon',source/'sets/09-sword-and-shield']:
 for f in directory.rglob('*.ts'):files[f.relative_to(source).as_posix()]=f
for f in source.glob('tcg-lab-*.ts'):files[f.name]=f
for f in (root/'work/desktop-build').glob('swsh-*'):
 if f.is_file():files[f.name]=f
for name in ['stage-swsh.py','package-swsh.py','brand-swsh.cjs','publish-android-swsh.py']:files[name]=root/'work/desktop-build'/name
for name in ['swsh-native-tests.js','swsh-self-test.cjs']:files[name]=root/'work/desktop'/name
files['SWSH-RULES-SOURCES.md']=root/'work/rules-research/SWSH-RULES-SOURCES.md'
for name in ['swsh-supplements.json']:files[name]=root/'work/card-sources'/name
for f in (root/'work/card-sources/pokemon-tcg-data-master/cards/en').glob('*.json'):
 if f.stem.startswith('swsh') or f.stem in ['pgo','cel25','cel25c','fut20','mcd21','mcd22']:files['printed-swsh/'+f.name]=f
shutil.copytree(root/'work/desktop',app,dirs_exist_ok=True)
(app/'self-test.cjs').write_text("module.exports=require('./swsh-self-test.cjs');",encoding='utf-8')
entries=[]
for name,f in sorted(files.items()):
 target=archive/name;target.parent.mkdir(parents=True,exist_ok=True)
 sha=hashlib.sha256(f.read_bytes()).hexdigest()
 if f.resolve()!=target.resolve() and (not target.exists() or previous.get(name)!=sha):shutil.copy2(f,target)
 entries.append({'path':name,'sha256':sha})
manifest={'engineSha256':hashlib.sha256((app/'ui/rules-engine.js').read_bytes()).hexdigest(),'scope':'Complete Sword & Shield 3715 printings including promos and supplements; BW onward through Sword & Shield interactions; Unlimited deferred. Finite validation required separately.','files':entries}
(archive/'swsh-source-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps({'files':len(entries),'engineSha256':manifest['engineSha256']}))
