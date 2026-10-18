import json,re,urllib.request,urllib.parse,html,pathlib,concurrent.futures,unicodedata
root=pathlib.Path('work'); cache=root/'pkmn-pages';cache.mkdir(exist_ok=True)
cards=json.load(open(root/'pokemon/dist/cards.json',encoding='utf-8'))
sets=json.load(open(root/'pokemon/dist/sets.json',encoding='utf-8'))
missing=[c for c in cards if not c.get('image')]
links=sorted(set(re.findall(r'https://pkmncards.com/set/[^"<>\s]+',open(root/'pkmn-sets.html',encoding='utf-8').read())))
def norm(v):return re.sub('[^a-z0-9]','',unicodedata.normalize('NFKD',v).encode('ascii','ignore').decode().lower())
def number(v):
 v=urllib.parse.unquote(v).lower()
 return re.sub(r'\d+',lambda m:str(int(m.group())),v)
def cardname(v):return norm(v.replace('◇','Prism Star').replace('♢','Prism Star'))
def slug(v):return re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFKD',v).encode('ascii','ignore').decode().lower()).strip('-')
print('links',len(links),flush=True)
selected={}
for s in sets:
 if not any(c['id'].rsplit('-',1)[0]==s['id'] for c in missing):continue
 name=s['name']; candidates=[]
 for url in links:
  u=url.rstrip('/').split('/')[-1]
  era={'EX':'ex','DP':'diamondpearl','BW':'blackwhite','SM':'sunmoon','HS':'hs','XY':'xy'}.get(name.split()[0],'')
  if norm(name)==norm(u) or ('trainerkit' in norm(name) and norm(u).startswith(era+'trainerkit') and all(norm(t) in norm(u) for t in re.findall(r'\((.*?)\)',name))) or ("McDonald" in name and re.search(r'20\d\d',name).group() in u and 'mcdonald' in u):candidates.append(url)
 if not candidates:
  base=re.sub(r' (Trainer Gallery|Galarian Gallery|Shiny Vault|Classic Collection)$','',name)
  aliases={'HGSS Black Star Promos':'HeartGold SoulSilver Promos','BW Black Star Promos':'Black White Promos','XY Black Star Promos':'XY Promos','SM Black Star Promos':'Sun Moon Promos','SWSH Black Star Promos':'Sword Shield Promos','SVP Black Star Promos':'Scarlet Violet Promos','MEP Black Star Promos':'Mega Evolution Promos','Unseen Forces Unown Collection':'Unseen Forces'}
  base=aliases.get(name,base)
  candidates=[u for u in links if norm(base)==norm(u.rstrip('/').split('/')[-1])]
 if candidates:selected[s['id']]=candidates
print(selected,flush=True)
def fetch(url):
 p=cache/(url.rstrip('/').split('/')[-1]+'.html')
 try:
  if not p.exists():p.write_bytes(urllib.request.urlopen(url,timeout=60).read())
  return url,p.read_text(encoding='utf-8')
 except Exception as e:return url,''
pages=dict(concurrent.futures.ThreadPoolExecutor(max_workers=4).map(fetch,sorted({u for a in selected.values() for u in a})))
out={};unmatched=[]
for c in missing:
 sid=c['id'].rsplit('-',1)[0];hits=[]
 for url in selected.get(sid,[]):
  for block in re.findall(r'<article\b.*?</article>',pages.get(url,''),re.S):
   title=re.search(r'title="([^"]+)" class="card-image-link"',block);img=re.search(r'<img[^>]* src="([^"]+)"',block);link=re.search(r'<a href="([^"]+)"',block)
   if not title:
    heading=re.search(r'<h2 class="card-title".*?<a href="([^"]+)".*?<span>(.*?)</span>',block,re.S)
    if heading:
     link=heading;titleText=heading.group(2)
    else:continue
   else:titleText=title.group(1)
   if not (img and link):continue
   title=html.unescape(titleText);num=title.rsplit('#',1)[-1];name=re.split(r' [–—−·•] ',title)[0]
   if number(num)==number(c['localId']) and cardname(name)==cardname(c['name']):hits.append((html.unescape(img.group(1)),link.group(1),title,url))
 if len({h[0] for h in hits})==1:
  h=hits[0];out[c['id']]={'url':h[0],'source':'PkmnCards','sourceCardId':h[1],'verifiedIdentity':{'setGallery':h[3],'title':h[2],'number':c['localId'],'name':c['name']}}
 else:unmatched.append(c)
(root/'pkmn-fallbacks.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'pkmn-unmatched.json').write_text(json.dumps(unmatched,ensure_ascii=False,indent=2),encoding='utf-8')
print('mapped',len(out),'unmatched',len(unmatched),flush=True)
