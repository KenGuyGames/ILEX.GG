"""Stage an isolated Mega desktop candidate; never write the released app."""
import pathlib,shutil,json
root=pathlib.Path(__file__).resolve().parents[2]
target=root/'work/mega-desktop-candidate'
base=root/'work/private-desktop-candidate'
target.mkdir(exist_ok=True)
shutil.copytree(base,target,dirs_exist_ok=True)
app=target/'resources/app'
for name in ['mega-self-test.cjs','mega-native-tests.js']:
 shutil.copy2(root/'work/desktop'/name,app/name)
shutil.copytree(root/'work/mega-candidate/ui',app/'ui',dirs_exist_ok=True)
shutil.copytree(root/'work/mega-candidate/scans',target/'resources/scans',dirs_exist_ok=True)
package=json.loads((app/'package.json').read_text(encoding='utf-8'));package.update(version='1.19.0',description='ILEX.GG — a forest sanctuary for Pokemon TCG across every era')
(app/'package.json').write_text(json.dumps(package,indent=2),encoding='utf-8')
(app/'self-test.cjs').write_text("module.exports=require('./mega-self-test.cjs');\n",encoding='utf-8')
print('Isolated Mega desktop staged; no released app changed.',flush=True)
