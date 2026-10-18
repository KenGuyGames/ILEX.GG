import json,hashlib
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[2]
file=root/'work/rules-research/sm-additional-scan-audit.json'
report=json.loads(file.read_text(encoding='utf-8'))
kit=[]
for entry in report['entries']:
 p=root/'work/dp-desktop-candidate/resources'/entry['file']
 assert hashlib.sha256(p.read_bytes()).hexdigest()==entry['sha256']
 with Image.open(p) as image:
  image.verify()
 with Image.open(p) as image:
  image.load();assert list(image.size)==[entry['width'],entry['height']]
  entry['decoded']=True
  entry['resolution']='limited-original' if image.width<400 else 'full-size'
  if entry['id'].startswith('tk-'):kit.append((entry,image.convert('RGB').copy()))
sheet=Image.new('RGB',(1080,1200),'white');draw=ImageDraw.Draw(sheet)
for i,(entry,image) in enumerate(sorted(kit,key=lambda x:int(x[0]['id'].rsplit('-',1)[1]))):
 x=(i%4)*270;y=(i//4)*400;draw.text((x+4,y+4),entry['id'],fill='black');sheet.paste(image,(x,y+25))
sheet.save(root/'work/rules-research/sm-scan-sheets/missing-kit-energy.png')
report['status']='sha256-and-full-image-decode-verified';report['passed']=True
file.write_text(json.dumps(report,indent=2),encoding='utf-8')
print({'verified':len(report['entries']),'limited_originals':len(kit)})
