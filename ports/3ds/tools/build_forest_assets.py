"""Adapt existing Windows art/music to bounded native framebuffer/PCM assets."""
from pathlib import Path
import sys,json,hashlib,subprocess
from PIL import Image,ImageOps,ImageDraw,ImageFont,ImageEnhance,ImageFilter
import numpy as np
port=Path(__file__).resolve().parents[1];root=port.parents[1]
sys.path.insert(0,str(port/'private/media-python'))
import imageio_ffmpeg
source=root/'outputs/ILEX.GG-2.0.0/resources/app/ui';out=port/'media';out.mkdir(exist_ok=True)
records=[]
def record(p,origin):
 records.append(dict(file=p.name,bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),source=origin))
def raw(name,im):
 a=np.asarray(im.convert('RGB'),dtype=np.uint16);v=((a[:,:,0]>>3)<<11)|((a[:,:,1]>>2)<<5)|(a[:,:,2]>>3)
 p=out/(name+'.565');p.write_bytes(v.astype('<u2').tobytes());record(p,'Existing Windows forest-arena.png / native layout')
forest=Image.open(source/'v2-assets/forest-arena.png').convert('RGB')
for w,name in [(400,'forest-top'),(320,'forest-bottom')]:
 im=ImageOps.fit(forest,(w,240),centering=(.5,.55));im=ImageEnhance.Brightness(im).enhance(.48)
 im=Image.blend(im,Image.new('RGB',im.size,'#143723'),.16)
 raw(name,im)
# Table keeps the desktop forest, with a subdued felt oval and wood/gold surround.
im=ImageOps.fit(forest,(400,240));im=ImageEnhance.Brightness(im).enhance(.42);d=ImageDraw.Draw(im)
d.rounded_rectangle((3,20,396,232),radius=30,fill='#493a22',outline='#b49c55',width=2)
d.rounded_rectangle((8,25,391,227),radius=27,fill='#123d30',outline='#658755',width=1)
for y in range(29,225,3):d.line((20,y,380,y),fill=(18+(y%5),58+(y%7),44+(y%3)))
d.ellipse((123,47,277,203),outline='#4c6f4f',width=1);d.ellipse((164,89,236,161),outline='#69855b',width=2)
d.line((16,124,384,124),fill='#476748');raw('table',im)
# Readable 6-pixel advance font with alpha, not the console's black text cells.
font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',10)
atlas=Image.new('L',(8*95,13));d=ImageDraw.Draw(atlas)
for i in range(95):d.text((i*8,-1),chr(i+32),font=font,fill=255)
p=out/'font.alpha';p.write_bytes(b''.join(atlas.crop((i*8,0,i*8+8,13)).tobytes() for i in range(95)));record(p,'Windows Consolas glyph rasterization; generated alpha atlas')
show=Image.frombytes('RGB',(162,226),(port/'art/hgss4-92.rgb').read_bytes())
raw('showcase',show)
back=Image.open(source/'ilex-icon.png').convert('RGB') if (source/'ilex-icon.png').exists() else Image.open(port/'icon.png').convert('RGB')
raw('emblem',back.resize((48,48),Image.Resampling.LANCZOS))
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
for key,name in [('menu','forest-guardian.mp3'),('battle','forest-battle.mp3')]:
 p=out/(key+'.pcm')
 subprocess.run([ffmpeg,'-v','error','-y','-i',str(source/'music'/name),'-ac','1','-ar','22050','-f','s16le',str(p)],check=True)
 assert 22050<p.stat().st_size<=16*1024*1024
 record(p,'Windows music/'+name)
(out/'manifest.json').write_text(json.dumps(dict(pcmRate=22050,pcmChannels=1,pcmBits=16,images='row-major RGB565 little endian',files=records),indent=2))
print(json.dumps({'assets':len(records),'bytes':sum(r['bytes'] for r in records)}))
