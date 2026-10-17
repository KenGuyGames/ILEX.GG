import pathlib,json,shutil,hashlib
root=pathlib.Path(__file__).resolve().parents[2]
source=root/'work/rules-research/twinleafgg-main/ptcg-server/src'
app=root/'work/dp-desktop-candidate/resources/app'
archive=app/'card-effect-sources'
old=json.loads((archive/'bw-source-manifest.json').read_text(encoding='utf-8'))
def resolve(name):
 for directory in [source,root/'work/desktop-build',root/'work/rules-research',root/'work/card-sources',archive]:
  if (directory/name).is_file():return directory/name
 raise FileNotFoundError(name)
files={entry['path']:resolve(entry['path']) for entry in old['files']}
for directory in [source/'game',source/'sets/05-heartgold-and-soulsilver',source/'sets/06-black-and-white']:
 for file in directory.rglob('*.ts'):files[file.relative_to(source).as_posix()]=file
files['sets/07-x-and-y/set-fates-collide/old-amber-aerodactyl.ts']=source/'sets/07-x-and-y/set-fates-collide/old-amber-aerodactyl.ts'
for name in ['bw-card-heights.json','bw-height-ocr-results.json','bw-height-index.json','bw-height-review.json']:
 files[name]=root/'work/rules-research'/name
files['bw-height-pokemon.csv']=root/'work/card-sources/bw-height-pokemon.csv'
for file in source.glob('tcg-lab-*.ts'):files[file.name]=file
for file in (root/'work/desktop-build').glob('bw-*'): 
 if file.is_file():files[file.name]=file
shutil.copytree(root/'work/desktop',app,dirs_exist_ok=True)
(app/'self-test.cjs').write_text("module.exports=require('./bw-self-test.cjs');",encoding='utf-8')
entries=[]
for name,file in sorted(files.items()):
 target=archive/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(file,target)
 entries.append({'path':name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
manifest={'engineSha256':hashlib.sha256((app/'ui/rules-engine.js').read_bytes()).hexdigest(),'scope':'Complete BW era including McDonalds2011/2012, BW01–101 and BW Trainer Kits with HGSS/Call of Legends only; shared older regressions retained; Unlimited deferred','files':entries}
(archive/'bw-source-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
# Prior verification remains in release history; current provenance uses the BW manifest.
(archive/'hgss-source-manifest.json').unlink(missing_ok=True)
print(json.dumps({'files':len(entries),'engineSha256':manifest['engineSha256']}))
