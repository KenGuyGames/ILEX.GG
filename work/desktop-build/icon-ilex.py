from PIL import Image,ImageDraw
from pathlib import Path
root=Path(__file__).resolve().parents[2]
# Raster export of the code-native leaf/time emblem, drawn at 4x for small icons.
size=512
im=Image.new('RGBA',(size,size),(0,0,0,0));d=ImageDraw.Draw(im)
def xy(points):return [(int(x*4),int(y*4)) for x,y in points]
d.rounded_rectangle((0,0,511,511),radius=128,fill='#102c24')
d.ellipse((76,76,436,436),outline='#91b99a',width=7)
def cubic(a,b,c,z):
 return [((1-t)**3*a[0]+3*(1-t)**2*t*b[0]+3*(1-t)*t*t*c[0]+t**3*z[0],(1-t)**3*a[1]+3*(1-t)**2*t*b[1]+3*(1-t)*t*t*c[1]+t**3*z[1]) for t in [i/100 for i in range(101)]]
leaf=cubic((36,91),(27,54),(48,30),(94,28))+cubic((94,28),(95,72),(77,99),(36,91))
d.polygon(xy(leaf),fill='#c4ee94')
d.line(xy([(35,94),(78,49)]),fill='#1b5844',width=20)
d.line(xy([(53,76),(51,54)]),fill='#1b5844',width=12)
d.line(xy([(64,65),(84,63)]),fill='#1b5844',width=12)
d.polygon(xy([(99,83),(103,91),(111,95),(103,99),(99,107),(95,99),(87,95),(95,91)]),fill='#edb7d0')
im.save(root/'work/desktop/icon.ico',sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
im.resize((256,256),Image.Resampling.LANCZOS).save(root/'work/desktop/ui/ilex-icon.png')
print('ILEX.GG native icon exported')
