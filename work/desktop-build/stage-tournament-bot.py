from pathlib import Path
import os,shutil,json,hashlib
root=Path(__file__).resolve().parents[2];base=root/'work/unlimited-desktop-candidate';target=root/'work/tournament-bot-desktop-candidate'
assert target.resolve().is_relative_to((root/'work').resolve())
mutable={'ILEX.GG.exe','README.md','START HERE.txt','desktop-verification.json','studio-ui-manifest.json','package.json','self-test.cjs','card-cache.cjs','bot-ai.js','bot-ui.js'}
def copy(src,dst):
 src=Path(src);dst=Path(dst)
 if dst.exists():return str(dst)
 if src.name in mutable:shutil.copy2(src,dst)
 else:
  try:os.link(src,dst)
  except OSError:shutil.copy2(src,dst)
 return str(dst)
shutil.copytree(base,target,dirs_exist_ok=True,copy_function=copy);app=target/'resources/app'
for src in(root/'work/tournament-bot-candidate/ui').rglob('*'):
 if not src.is_file():continue
 dst=app/'ui'/src.relative_to(root/'work/tournament-bot-candidate/ui')
 if dst.exists()and src.read_bytes()==dst.read_bytes():continue
 dst.parent.mkdir(parents=True,exist_ok=True)
 if dst.exists():dst.unlink()
 shutil.copy2(src,dst)
published=Path('C:/Users/Kenneth/Documents/Codex/2026-10-13/ta/work/source-1.19.0/work/desktop')
for n in ['card-cache.cjs','promo-scan-files.json']:shutil.copy2(published/n,app/n)
for n in ['tournament-bot-self-test.cjs','tournament-bot-native-tests.js']:shutil.copy2(root/'work/desktop'/n,app/n)
(app/'self-test.cjs').write_text("module.exports=require('./tournament-bot-self-test.cjs');\n",encoding='utf-8')
p=json.loads((app/'package.json').read_text(encoding='utf-8'));p['version']='1.21.0';(app/'package.json').write_text(json.dumps(p,indent=2),encoding='utf-8')
print('Isolated tournament-bot Windows candidate staged; original source/runtime preserved; published promo cache fix incorporated.',flush=True)
