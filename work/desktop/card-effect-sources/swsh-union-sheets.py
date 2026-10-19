import json,pathlib
from PIL import Image
root=pathlib.Path(__file__).resolve().parents[2]
manifest=json.loads((root/'work/desktop/ui/scan-manifest.json').read_text())
out=root/'work/rules-research/swsh-union-review';out.mkdir(exist_ok=True)
for start,name in [(139,'Pikachu'),(155,'Greninja'),(159,'Mewtwo'),(163,'Zacian'),(215,'Morpeko'),(287,'Morpeko-alt')]:
 canvas=Image.new('RGB',(734,1024),'white')
 for i in range(4):
  p=root/'work/dp-desktop-candidate/resources'/manifest['swshp-SWSH'+str(start+i)]['file']
  im=Image.open(p).convert('RGB').resize((367,512))
  canvas.paste(im,((i%2)*367,(i//2)*512))
 canvas.save(out/(name+'.png'))
print(out)
