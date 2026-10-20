from pathlib import Path
import shutil,json,hashlib,zipfile,datetime
root=Path(__file__).resolve().parents[2];base=root/'outputs/ILEX.GG-1.21.1';dest=root/'outputs/ILEX.GG-1.22.0';candidate=root/'work/cube-candidate'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
# New independent release; immutable scans and provenance are copied unchanged.
if not dest.exists():shutil.copytree(base,dest)
app=dest/'resources/app';shutil.copytree(candidate/'ui',app/'ui',dirs_exist_ok=True)
for n in ['main.cjs','preload.cjs','cube-import.cjs']:shutil.copy2(candidate/n,app/n)
shutil.copy2(root/'work/cube-review/native-self-test.cjs',app/'cube-self-test.cjs')
p=app/'package.json';d=json.loads(p.read_text(encoding='utf-8'));d['version']='1.22.0';p.write_text(json.dumps(d),encoding='utf-8')
source=app/'card-effect-sources/cube-source';source.mkdir(exist_ok=True)
with zipfile.ZipFile(source/'cube-engine-src.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in (root/'work/cube-source/src').rglob('*'):
  if p.is_file():z.write(p,'src/'+p.relative_to(root/'work/cube-source/src').as_posix())
for p in (root/'work/cube-review').iterdir():
 if p.is_file() and p.suffix in ['.py','.ts','.cjs','.js'] and p.name not in ['resolve.py']:
  shutil.copy2(p,source/p.name)
for n in ['build-cube-rules.cjs','cube-tests.cjs','cube-import-tests.cjs','cube-preload.cjs','run-cube-regressions.cjs','run-cube-native.cjs','build-android-cube.cjs']:shutil.copy2(root/'work/desktop-build'/n,source/n)
print('Independent cube release staged',flush=True)
