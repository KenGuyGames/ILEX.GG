import json, pathlib, hashlib, concurrent.futures, time
from PIL import Image
root=pathlib.Path('outputs/Pokemon-TCG-Lab')
manifest=json.loads((root/'scan-manifest.json').read_text())
def check(item):
    id, entry=item
    if entry.get('status')!='downloaded': return {'id':id,'error':'Scan unresolved'}
    try:
        p=root/entry['file']; data=p.read_bytes()
        if hashlib.sha256(data).hexdigest()!=entry['sha256']: raise ValueError('Hash mismatch')
        with Image.open(p) as im:
            w,h=im.size; im.load()
            if w<100 or h<140: raise ValueError(f'Too small: {w}x{h}')
            if not (0.55<w/h<0.85 or 1.2<w/h<1.8): raise ValueError(f'Not portrait or landscape card-front aspect ratio: {w}x{h}')
        return {'id':id,'width':w,'height':h}
    except Exception as e: return {'id':id,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: results=list(pool.map(check,manifest.items()))
failures=[r for r in results if 'error' in r]
report={'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'filesChecked':len(results),'decodedImages':len(results)-len(failures),'failures':failures,'minimumWidth':min((r['width'] for r in results if 'width' in r),default=0),'checks':['SHA-256 matches manifest','Image fully decodes with Pillow','Card-front dimensions and aspect ratio']}
(root/'scan-verification.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
