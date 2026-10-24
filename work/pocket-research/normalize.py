from pathlib import Path
import json,hashlib,collections,re
root=Path(__file__).resolve().parents[2];src=root/'work/pocket-research';out=root/'work/pocket-candidate/ui'
def read(n):return json.loads((src/n).read_text(encoding='utf-8-sig'))
full=read('cards-full-source.json');prints=read('printing-source.json');sets=[x for group in read('sets-source.json').values() for x in group];rates=read('pull-rates-source.json')
def code(s):return {'PROMO-A':'pa','PROMO-B':'pb'}.get(s,s.lower())
index={(code(c['set']),int(c['number'])):c for c in prints};cards=[];missing=[]
# Parallel print pairs retain separate IDs; art metadata is missing for B4b in one source.
variants=collections.defaultdict(list)
for p in prints:
 m=re.match(r'(.+)_([0-9]{2})_(.+)\.webp$',p['image'])
 if m:variants[(code(p['set']),m[1],p['rarity'])].append((int(m[2]),p['number']))
parallel={(s,num) for (s,stem,rar),vs in variants.items() if s in ['a4b','b4b'] and rar in ['C','U','R'] and len(vs)>1 for ver,num in vs if ver>min(v for v,n in vs)}
for c in full:
 setid=c['set_code'];number=int(c['id'].split('-')[-1]);p=index.get((setid,number))
 if p is None:missing.append(c['id']);continue
 attacks=[{'name':a['name'],'cost':[t for t in (a['cost'] or '') if t!='0'],'damage':a['damage'],'text':a['effect'] or ''} for a in c['attacks'].values() if a['name']]
 rarity=p['rarity'];foil=c.get('art_style')=='Parallel Foil' or (setid,number) in parallel
 bucket=rarity+'F' if foil and rarity in ['C','U','R'] else rarity
 cards.append({'id':'pocket-'+c['id'],'sourceId':c['id'],'name':c['name'],'set':setid,'number':number,'setName':c['set_name'],'released':c['release_date'],'category':'Pokemon' if c['type']=='Pokémon' else c['type'],'subtype':c['subtype'],'stage':{'Basic':0,'Stage 1':1,'Stage 2':2}.get(c['stage']),'evolvesFrom':c['evolves_from'],'hp':c['health'],'retreat':c['retreat'],'weakness':c['weakness'],'attacks':attacks,'ability':c['ability'] if c['ability']['exists'] else None,'text':c['card_text'] or '', 'points':c['points'],'ex':c['ex'],'mega':c['mega'],'shiny':c['shiny'],'tags':c['special_tags'] or [],'rarity':rarity,'rarityBucket':bucket,'parallel':foil,'packs':p.get('packs',[]),'image':c['image'],'artist':c['artist'],'scan':'pocket-scans/'+c['id']+'.webp','automation':'pending'})
assert not missing,missing
assert len(cards)==len({c['id'] for c in cards})==4317
catalog=[]
for s in sets:
 key=code(s['code']);pool=[c for c in cards if c['set']==key]
 assert len(pool)==s.get('count',len(pool)),(key,len(pool),s.get('count'))
 catalog.append({'id':key,'sourceCode':s['code'],'name':s['name']['en'],'release':s['releaseDate'],'count':len(pool),'promo':key in ['pa','pb'],'packs':s['packs'],'rates':rates.get(s['code'])})
for n,d in [('pocket-cards.json',cards),('pocket-sets.json',catalog)]:
 (out/n).write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
report={'sourcePrintings':len(cards),'catalogs':len(catalog),'uniqueSourcePrintings':len(set(c['sourceId'] for c in cards)),'parallelPrintings':sum(c['parallel'] for c in cards),'missingSourceLinks':missing,'automated':0,'releaseValidated':0,'sources':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in src.glob('*source.json')},'scope':'Released catalog through Deluxe Pack Mega; as of2026-10-20. Not a release validation.'}
(src/'catalog-integrity.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))
