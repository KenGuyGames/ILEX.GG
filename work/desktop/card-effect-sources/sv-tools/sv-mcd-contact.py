import json
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
root=Path.cwd(); ui=root/'work/desktop/ui'; cards=json.loads((ui/'cards.json').read_text(encoding='utf-8')); out=root/'work/sv-candidate/mcd-review';out.mkdir(exist_ok=True)
for sid in ['2023sv','2024sv']:
 rows=[c for c in cards if c['id'].startswith(sid+'-')]
 for page in range(2):
  chosen=rows[page*9:(page+1)*9];canvas=Image.new('RGB',(1200,600*((len(chosen)+2)//3)),(245,245,245));draw=ImageDraw.Draw(canvas)
  for i,c in enumerate(chosen):
   pic=Image.open(root/'outputs/ILEX.GG-win32-x64/resources'/c['scan']).convert('RGB');pic.thumbnail((400,565));x=(i%3)*400+(400-pic.width)//2;y=(i//3)*600+25;canvas.paste(pic,(x,y));draw.text(((i%3)*400+8,(i//3)*600+5),c['id']+' '+c['name'],fill='black')
  canvas.save(out/(sid+'-'+str(page)+'.jpg'),quality=95)

