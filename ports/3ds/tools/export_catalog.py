"""Export a seekable, bounded-memory SD catalog; does not alter application data."""
import argparse, hashlib, json, struct, unicodedata
from pathlib import Path
PORT=Path(__file__).resolve().parents[1]
REPO=PORT.parents[1]
HEADER=struct.Struct('<4sIII')
RECORD=struct.Struct('<64s128s')
def display_name(name):
    name=name.replace('♀',' F').replace('♂',' M').replace('◇',' (Prism Star)').replace('☆',' (Star)').replace('δ',' (Delta)').replace('’',"'")
    return unicodedata.normalize('NFKD',name).encode('ascii','replace').decode('ascii').replace('?','')
def export(source, destination):
    cards=json.loads(source.read_text(encoding='utf-8-sig'))
    rows=sorted(cards,key=lambda c:(c['name'].casefold(),c['id']))
    if len({c['id'] for c in rows})!=len(rows): raise ValueError('Duplicate card IDs')
    records=[]
    for c in rows:
        identity=c['id'].encode('ascii'); name=display_name(c['name']).encode('ascii')
        if len(identity)>=64 or len(name)>=128: raise ValueError('Record field too long: '+c['id'])
        records.append(RECORD.pack(identity,name))
    data=HEADER.pack(b'ILXC',1,len(rows),RECORD.size)+b''.join(records)
    destination.mkdir(parents=True,exist_ok=True)
    (destination/'catalog.bin').write_bytes(data)
    info={'schema':1,'cards':len(rows),'recordBytes':RECORD.size,'fileBytes':len(data),'catalogSha256':hashlib.sha256(data).hexdigest(),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'runtimePageBytes':RECORD.size*8,'scope':'Names and stable printing IDs only; rules, scans, audio and saves are not copied.'}
    (destination/'catalog-manifest.json').write_text(json.dumps(info,indent=2)+'\n')
    return info
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--catalog',type=Path,default=REPO/'work/v2-candidate/ui/cards.json');p.add_argument('--out',type=Path,default=PORT/'staging/sd/3ds/ilex-gg/data');a=p.parse_args()
    print(json.dumps(export(a.catalog,a.out),indent=2))
