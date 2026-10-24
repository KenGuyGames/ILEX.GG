"""Reuse the already-bundled Windows cries, with bounded native PCM playback."""
from pathlib import Path
import json,sys,hashlib,re,subprocess,concurrent.futures
port=Path(__file__).resolve().parents[1];root=port.parents[1]
sys.path.insert(0,str(port/'private/media-python'));import imageio_ffmpeg
source=root/'outputs/ILEX.GG-2.0.0/resources/app/ui/cries';dest=port/'media';ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
species=json.loads((source/'species.json').read_text());forms=json.loads((source/'forms.json').read_text())
def convert(f):
 p=dest/('cry-'+f.stem+'.pcm')
 subprocess.run([ffmpeg,'-v','error','-y','-i',str(f),'-ac','1','-ar','22050','-f','s16le',str(p)],check=True,creationflags=0x08000000)
 assert 0<p.stat().st_size<2*1024*1024 and p.stat().st_size%2==0
 return dict(file=p.name,bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),source='Existing Windows cries/'+f.name,sourceSha256=hashlib.sha256(f.read_bytes()).hexdigest())
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:records=list(pool.map(convert,sorted(source.glob('*.ogg'))))
manifest=dest/'manifest.json';m=json.loads(manifest.read_text());m['files']=[r for r in m['files'] if not r['file'].startswith('cry-')]+records;manifest.write_text(json.dumps(m,indent=2))
index=dict(species=species,aliases=forms['aliases'],printings=forms['printings'])
p=port/'runtime/presentation.js';s=p.read_text();s=re.sub(r'/\* CRY_INDEX_BEGIN \*/.*?/\* CRY_INDEX_END \*/\n','',s,flags=re.S)
p.write_text('/* CRY_INDEX_BEGIN */\nvar IlexCryIndex='+json.dumps(index,separators=(',',':'))+';\n/* CRY_INDEX_END */\n'+s)
print(json.dumps({'cries':len(records),'pcmBytes':sum(r['bytes'] for r in records)}))
