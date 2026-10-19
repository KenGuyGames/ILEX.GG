from pathlib import Path
import json,hashlib,shutil
from PIL import Image
root=Path('work/desktop/ui');target=root/'finish-scans';target.mkdir(exist_ok=True)
records=json.loads(Path('work/card-sources/reverse-scan-research/lc-downloaded.json').read_text())
rejected={13,19,42,55,81,89,90,94,105};accepted=[]
for r in records:
 n=int(r['id'].split('-')[1])
 if n in rejected:continue
 accepted.append(r)
candidates=json.loads(Path('work/card-sources/reverse-scan-research/market-candidates.json').read_text())
for c in json.loads(Path('work/card-sources/reverse-scan-research/market-downloaded.json').read_text()):
 product=c['productId'];p=Path(c['path']);im=Image.open(p);accepted.append({**{k:v for k,v in c.items() if k!='path'},'downloadPath':str(p),'width':im.width,'height':im.height,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'sourceUrl':'https://tcgplayer-cdn.tcgplayer.com/product/'+p.name,'sourcePage':'https://www.tcgplayer.com/product/'+str(product),'attribution':'TCGplayer product image','quality':'finish-specific source image'})
manifest={}
for r in accepted:
 p=Path(r['downloadPath']);name=r['sha256'][:24]+p.suffix.lower();shutil.copy2(p,target/name);r={k:v for k,v in r.items() if k!='downloadPath'};r.update(file='finish-scans/'+name,bytes=p.stat().st_size,visuallyReviewed=True);manifest[r['id']+'|'+r['finish']]=r
(root/'finish-scans.js').write_text('var FinishScans='+json.dumps(manifest,separators=(',',':'))+";\nif(typeof module!=='undefined'&&module.exports)module.exports=FinishScans;\n",encoding='utf-8')
Path('work/card-sources/reverse-scan-research/accepted.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print({'accepted':len(manifest),'rejectedLC':sorted(rejected),'missingLC':[43]})
