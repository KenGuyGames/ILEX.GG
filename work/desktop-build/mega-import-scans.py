from pathlib import Path
import json,sys,hashlib,shutil,re
root=Path(__file__).resolve().parents[2];sys.path.insert(0,str(root/'work/mega-tools'))
import pillow_jxl
from PIL import Image
temp=Path(r'C:/Users/Kenneth/AppData/Local/Packages/sandbox.{2b20a1e9-030e-4bc7-92dd-c223cf429299}/AC/Temp/browser-use/assets');out=root/'work/card-sources/mega-official-promos';out.mkdir(exist_ok=True)
directories=['ce225f58-423d-42d0-9470-19ee7c90ace8','4a9a7285-b816-4821-bb78-93241e76a9f8','3b9cdff9-3f83-4841-8725-bed0a1e92474','d51ff920-1f8f-4f2c-8fb2-2ca687cccfdc','d2299eb7-ce61-41bc-86d8-2319395c5b12']
rows=[];best={}
for ident in directories:
 bundle=temp/ident;m=json.loads((bundle/'manifest.json').read_text(encoding='utf-8'))
 shutil.copy2(bundle/'manifest.json',out/(ident+'-manifest.json'))
 for a in m['assets']:
  number=int(re.search(r'MEP_(?:EN_)?0*(\d+)',a['name']).group(1));f=Path(a['path']);im=Image.open(f);im.load();source=out/(a['id']+('.jxl' if im.format=='JXL' else '.source.png'));shutil.copy2(f,source)
  row={'number':number,'id':'mep-'+str(number).zfill(3),'url':a['url'],'source':str(source.relative_to(root)),'sourceSha256':hashlib.sha256(f.read_bytes()).hexdigest(),'width':im.width,'height':im.height,'format':im.format,'credit':'The Pokémon Company; official product image' if 'pokemon.com' in a['url'] else 'The Pokémon Company; scan hosted by Limitless TCG'}
  if number not in best or im.width*im.height>best[number]['width']*best[number]['height']:
   target=out/('mep-'+str(number).zfill(3)+'.png');im.save(target);row.update(file=str(target.relative_to(root)),sha256=hashlib.sha256(target.read_bytes()).hexdigest(),bytes=target.stat().st_size);best[number]=row
  rows.append(row)
(out/'source-images.json').write_text(json.dumps({'sources':rows,'printings':list(best.values()),'conversion':'Decoded source pixels to PNG without reconstruction, overlays, resizing or sharpening.'},indent=2),encoding='utf-8')
print('Verified source images:',len(best),'printings; activated supplement range will be separately scoped.')
