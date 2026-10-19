from pathlib import Path
import sys,json,hashlib,shutil
root=Path(__file__).resolve().parents[2];sys.path.insert(0,str(root/'work/mega-tools'))
import pillow_jxl
from PIL import Image
bundle=Path(r'C:/Users/Kenneth/AppData/Local/Packages/sandbox.{2b20a1e9-030e-4bc7-92dd-c223cf429299}/AC/Temp/browser-use/assets/ce225f58-423d-42d0-9470-19ee7c90ace8')
manifest=json.loads((bundle/'manifest.json').read_text(encoding='utf-8'));out=root/'work/card-sources/mega-official-promos';out.mkdir(exist_ok=True)
print(type(manifest).__name__,list(manifest)[:8])
rows=[]
for f in bundle.glob('*.png'):
 im=Image.open(f);im.load();target=out/(f.stem+'.png');im.save(target)
 shutil.copy2(f,out/(f.stem+'.jxl'))
 rows.append({'assetId':f.stem,'sourceSha256':hashlib.sha256(f.read_bytes()).hexdigest(),'pngSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'width':im.width,'height':im.height})
(out/'decoded.json').write_text(json.dumps(rows,indent=2),encoding='utf-8');shutil.copy2(bundle/'manifest.json',out/'official-asset-manifest.json')
print('Decoded',len(rows),'official scans; no reconstruction or resizing.')
