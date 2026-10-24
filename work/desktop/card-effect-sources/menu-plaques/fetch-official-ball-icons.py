from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import quote
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
import hashlib,json,io
root=Path(__file__).resolve().parents[2];out=root/'work/v2-candidate/ui/v2-assets/balls';out.mkdir(parents=True,exist_ok=True)
names={'ultra':'Ultra','level':'Level','fast':'Fast','lure':'Lure','friend':'Friend','moon':'Moon','heavy':'Heavy','sport':'Sport','strange':'Strange','love':'Love','master':'Master'}
def fetch(entry):
 key,name=entry;filename='GS_Ball_Crystal.png' if key=='gs' else 'Bag_'+name+'_Ball_SV_Sprite.png';digest=hashlib.md5(filename.encode()).hexdigest();url='https://archives.bulbagarden.net/media/upload/'+digest[0]+'/'+digest[:2]+'/'+quote(filename)
 data=urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0 (ILEX.GG local asset collection)'}),timeout=40).read();assert data.startswith(b'\x89PNG\r\n\x1a\n');im=Image.open(io.BytesIO(data));im.verify();im=Image.open(io.BytesIO(data));assert min(im.size)>=100 and max(im.size)<2000;assert 'A' in im.mode or 'transparency' in im.info
 target=out/(key+'.png');target.write_bytes(data)
 return {'key':key,'name':name+' Ball','file':'v2-assets/balls/'+key+'.png','source':url,'sourcePage':'https://archives.bulbagarden.net/wiki/File:'+quote(filename),'origin':'Pokemon Crystal official Ken Sugimori artwork' if key=='gs' else 'Pokemon Scarlet and Violet in-game bag sprite','bytes':len(data),'size':im.size,'mode':im.mode,'sha256':hashlib.sha256(data).hexdigest(),'modified':False}
with ThreadPoolExecutor(max_workers=3) as pool:records=list(pool.map(fetch,names.items()))
(out/'sources.json').write_text(json.dumps({'assets':records,'notice':'Pokemon game artwork and sprites belong to Nintendo, Creatures Inc., GAME FREAK and The Pokemon Company. Files are unmodified PNGs mirrored by Bulbagarden Archives; original source/license references are linked per image.'},indent=2))
print(json.dumps([{'name':r['name'],'size':r['size'],'bytes':r['bytes']} for r in records],indent=2))
