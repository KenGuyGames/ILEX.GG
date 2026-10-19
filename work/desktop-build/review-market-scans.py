from pathlib import Path
from PIL import Image,ImageDraw
import json
out=Path('work/card-sources/reverse-scan-research');candidates=json.loads((out/'market-candidates.json').read_text());items=[]
for c in candidates:
 p=Path('C:/Users/Kenneth/Downloads')/(str(c['productId'])+'_in_1000x1000.jpg')
 if p.exists():
  try:Image.open(p).verify();items.append({**c,'path':str(p)})
  except Exception as e:print('invalid',p.name,str(e))
(out/'market-downloaded.json').write_text(json.dumps(items,indent=2),encoding='utf-8')
for sheet in range((len(items)+29)//30):
 canvas=Image.new('RGB',(1500,1500),'#20352b');draw=ImageDraw.Draw(canvas)
 for j,c in enumerate(items[sheet*30:(sheet+1)*30]):
  im=Image.open(c['path']).convert('RGB');im.thumbnail((200,218));x=(j%6)*250+(250-im.width)//2;y=(j//6)*300;canvas.paste(im,(x,y));draw.text(((j%6)*250+5,y+222),c['id']+' '+c['name'][:17],fill='white');draw.text(((j%6)*250+5,y+240),c['finish']+' '+str(c['productId']),fill='white')
 canvas.save(out/('market-sheet-'+str(sheet+1)+'.jpg'))
print({'downloaded':len(items),'sheets':(len(items)+29)//30,'undownloadedSpecialCandidates':len(candidates)-len(items)})
