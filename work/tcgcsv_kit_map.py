import json,re,urllib.request,pathlib,concurrent.futures,unicodedata
root=pathlib.Path('work');dest=root/'tcgcsv-products';dest.mkdir(exist_ok=True)
groups=json.load(open(root/'tcgcsv-groups.json'))['results']
gmap={'tk-sm-r':2069,'tk-sm-l':2069,'tk-xy-p':1796,'tk-xy-su':1796,'tk-xy-latio':1536,'tk-xy-latia':1536,'tk-xy-b':1533,'tk-xy-w':1533,'tk-xy-sy':1532,'tk-xy-n':1532,'tk-bw-e':1538,'tk-bw-z':1538,'tk-hs-g':1540,'tk-hs-r':1540,'tk-dp-m':1541,'tk-dp-l':1541,'tk-ex-latia':1543,'tk-ex-latio':1543,'tk-ex-p':1542,'tk-ex-m':1542}
deck={'tk-sm-r':'Alolan Raichu','tk-sm-l':'Lycanroc','tk-xy-p':'Pikachu Libre','tk-xy-su':'Suicune','tk-xy-latio':'Latios','tk-xy-latia':'Latias','tk-xy-b':'Bisharp','tk-xy-w':'Wigglytuff','tk-xy-sy':'Sylveon','tk-xy-n':'Noivern','tk-bw-e':'Excadrill','tk-bw-z':'Zoroark','tk-hs-g':'Gyarados','tk-hs-r':'Raichu','tk-dp-m':'Manaphy','tk-dp-l':'Lucario','tk-ex-latia':'Latias','tk-ex-latio':'Latios','tk-ex-p':'Plusle','tk-ex-m':'Minun'}
def fetch(g):
 p=dest/f'{g}.json'
 if not p.exists():p.write_bytes(urllib.request.urlopen(f'https://tcgcsv.com/tcgplayer/3/{g}/products',timeout=60).read())
 return g,json.load(open(p))['results']
products=dict(concurrent.futures.ThreadPoolExecutor(max_workers=4).map(fetch,set(gmap.values())))
def norm(v):return re.sub('[^a-z0-9]','',unicodedata.normalize('NFKD',v).encode('ascii','ignore').decode().lower())
def base(v):return norm(re.sub(r'\s*\([^)]*\)','',v))
cards=json.load(open(root/'pokemon/dist/cards.json',encoding='utf-8'))
out={};ambiguous=[];unmatched=[]
for c in cards:
 sid=c['id'].rsplit('-',1)[0]
 if sid not in gmap:continue
 found=[]
 for p in products[gmap[sid]]:
  num=next((x['value'].split('/')[0] for x in p.get('extendedData',[]) if x['name']=='Number'),'')
  explicitNum=re.search(r'\(#(\d+)',p['name'])
  if explicitNum:num=explicitNum.group(1)
  if p['productId']==98024:num='29' # visually verified printed collector number; TCGCSV incorrectly says 4/30
  others=[v for k,v in deck.items() if gmap[k]==gmap[sid] and k!=sid]
  qualifiers=' '.join(re.findall(r'\(([^)]*)\)',p['name']))
  if any(norm(v) in norm(qualifiers) for v in others) and norm(deck[sid]) not in norm(qualifiers):continue
  if num.lstrip('0')==c['localId'].lstrip('0') and base(p['name'])==norm(c['name']) and p.get('imageUrl'):found.append(p)
 if len(found)==1:
  p=found[0];out[c['id']]={'url':p['imageUrl'].replace('_200w','_1000w'),'source':'TCGplayer via TCGCSV','sourceCardId':str(p['productId']),'verifiedIdentity':{'groupId':p['groupId'],'group':next(g['name'] for g in groups if g['groupId']==p['groupId']),'name':p['name'],'number':next(x['value'] for x in p['extendedData'] if x['name']=='Number'),'metadataUrl':f'https://tcgcsv.com/tcgplayer/3/{p["groupId"]}/products','productUrl':p['url']}}
  out[c['id']]['verifiedIdentity']['matchedNumber']=c['localId']
  out[c['id']]['verifiedIdentity']['deck']=deck[sid]
  out[c['id']]['originalUrl']=p['imageUrl']
  if p['productId']==152852:out[c['id']]['verifiedIdentity']['correction']='Number metadata says 2/30; explicit product name identifies #3.'
  if p['productId']==98024:out[c['id']]['verifiedIdentity']['correction']='Number metadata says 4/30; downloaded card scan visually confirms 29/30.'
 elif found:ambiguous.append({'card':c,'products':found})
 else:unmatched.append(c)
(root/'tcgcsv-fallbacks.json').write_text(json.dumps(out,indent=2,ensure_ascii=False),encoding='utf-8')
(root/'tcgcsv-ambiguous.json').write_text(json.dumps(ambiguous,indent=2,ensure_ascii=False),encoding='utf-8')
(root/'tcgcsv-kit-unmatched.json').write_text(json.dumps(unmatched,indent=2,ensure_ascii=False),encoding='utf-8')
print('matched',len(out),'ambiguous',len(ambiguous),'unmatched',len(unmatched),flush=True)
print(json.dumps(unmatched,ensure_ascii=True),flush=True)
