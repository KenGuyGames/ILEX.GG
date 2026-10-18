import json
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[2]
cards=json.loads((root/'work/desktop/ui/cards.json').read_text(encoding='utf-8'))
seen=set(); selected=[]
for c in cards:
 if not c['id'].startswith('tk-sm-') or c['name'].endswith('Energy'): continue
 key=(c['id'].rsplit('-',1)[0],c['name'])
 if key in seen: continue
 seen.add(key);selected.append(c)
out=root/'work/rules-research/sm-scan-sheets';out.mkdir(exist_ok=True)
for page in range((len(selected)+7)//8):
 sheet=Image.new('RGB',(2000,1450),'white');draw=ImageDraw.Draw(sheet)
 for i,c in enumerate(selected[page*8:page*8+8]):
  x=(i%4)*500;y=(i//4)*725
  im=Image.open(root/'outputs/ILEX.GG-win32-x64/resources'/c['scan']).convert('RGB');im.thumbnail((495,690))
  sheet.paste(im,(x,y+25));draw.text((x+3,y+4),c['id']+' '+c['name'],fill='black')
 sheet.save(out/f'kits-{page}.jpg')
print(len(selected),'unique kit cards')
