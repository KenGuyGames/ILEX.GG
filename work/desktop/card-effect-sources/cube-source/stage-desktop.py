from pathlib import Path
import shutil,os,json
root=Path(__file__).resolve().parents[2];base=root/'outputs/ILEX.GG-1.21.1';dest=root/'work/cube-desktop-candidate';app=dest/'resources/app';app.mkdir(parents=True,exist_ok=True)
for p in base.iterdir():
    if p.name=='resources':continue
    q=dest/p.name
    if q.exists():continue
    if p.is_dir():shutil.copytree(p,q)
    else:shutil.copy2(p,q)
for name in ['card-cache.cjs','promo-scan-files.json','icon.ico','package.json']:
    shutil.copy2(base/'resources/app'/name,app/name)
for name in ['main.cjs','preload.cjs','cube-import.cjs']:
    shutil.copy2(root/'work/cube-candidate'/name,app/name)
shutil.copytree(root/'work/cube-candidate/ui',app/'ui',dirs_exist_ok=True)
shutil.copy2(Path(__file__).with_name('native-self-test.cjs'),app/'self-test.cjs')
package=json.loads((app/'package.json').read_text(encoding='utf-8'));package['version']='1.22.0';(app/'package.json').write_text(json.dumps(package),encoding='utf-8')
# A self-test-only scan override avoids copying the immutable scan collection.
main=app/'main.cjs';s=main.read_text(encoding='utf-8');s=s.replace('const scans=app.isPackaged ?', 'const scans=selfTest&&process.env.ILEX_CUBE_SCAN_ROOT ? process.env.ILEX_CUBE_SCAN_ROOT : app.isPackaged ?');main.write_text(s,encoding='utf-8')
print('Cube native preview staged')
