from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
import re,json,hashlib,shutil
out=Path('work/card-sources/reverse-scan-research');out.mkdir(parents=True,exist_ok=True)
files=sorted(Path('C:/Users/Kenneth/Downloads').glob('LegRH*.jpg'))
records=[]
for p in files:
 match=re.search(r'LegRH[_ ]?(\d+)',p.name,re.I);n=int(match[1]);im=Image.open(p);im.verify();records.append({'id':'lc-'+str(n),'finish':'reverse','downloadPath':str(p),'width':Image.open(p).width,'height':Image.open(p).height,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'sourceUrl':'https://www.charizard.dk/pokemon/legendary/legRH_html/'+p.name,'sourcePage':'https://www.charizard.dk/pokemon/legendary/LegendaryRevHolo.htm','attribution':'Charizard.dk; original watermark retained','quality':'low resolution historical scan'})
(out/'lc-downloaded.json').write_text(json.dumps(records,indent=2),encoding='utf-8')
for sheet in range((len(files)+29)//30):
 canvas=Image.new('RGB',(1200,6*240),'#20352b');draw=ImageDraw.Draw(canvas)
 for j,p in enumerate(files[sheet*30:(sheet+1)*30]):
  im=Image.open(p).convert('RGB');im.thumbnail((216,212));x=(j%5)*240+(240-im.width)//2;y=(j//5)*240;canvas.paste(im,(x,y));draw.text(((j%5)*240+5,y+214),p.stem[:27],fill='white')
 canvas.save(out/('lc-sheet-'+str(sheet+1)+'.jpg'))
print(json.dumps({'downloaded':len(records),'missing':[n for n in range(1,111) if not any(r['id']=='lc-'+str(n) for r in records)],'dimensions':sorted(set((r['width'],r['height']) for r in records))}))

