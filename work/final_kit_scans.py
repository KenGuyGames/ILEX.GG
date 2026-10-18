import json,re,urllib.request,urllib.parse,unicodedata,pathlib,concurrent.futures
from PIL import Image
root=pathlib.Path('work');dest=root/'final-kit';dest.mkdir(exist_ok=True)
cards=[c for c in json.load(open('outputs/Pokemon-TCG-Lab/scan-audit.json'))['missing'] if c['id'].startswith('tk-')]
sets={'tk-sm-r':'sm-trainer-kit-alolan-raichu','tk-sm-l':'sm-trainer-kit-lycanroc','tk-hs-g':'hgss-trainer-kit-gyarados'}
def slug(v):return re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFKD',v).encode('ascii','ignore').decode().lower()).strip('-')
def get(c):
 try:
  sid,num=c['id'].rsplit('-',1);page='https://tcgscreener.com/pokemon/'+sets[sid]+'/'+slug(c['name'])+'-'+num
  h=urllib.request.urlopen(page,timeout=45).read().decode();(dest/(c['id']+'.html')).write_text(h,encoding='utf-8')
  urls=sorted(set(re.findall(r'https(?:%3A%2F%2F|://)img(?:%2E|\.)tcgscreener(?:%2E|\.)com(?:%2F|/)cards(?:%2F|/)[a-zA-Z0-9%_.-]+',h)))
  urls=[urllib.parse.unquote(u) for u in urls if u.endswith('.png')]
  if len(urls)!=1:return c['id'],{'error':'image URL ambiguous','urls':urls,'page':page}
  url=urls[0];p=dest/(c['id']+'.png');p.write_bytes(urllib.request.urlopen(url,timeout=45).read());im=Image.open(p);size=im.size;im.verify()
  return c['id'],{'url':url,'source':'TCGScreener','sourceCardId':url.rsplit('/',1)[-1],'verifiedIdentity':{'page':page,'number':num+'/30','name':c['name'],'set':sets[sid],'imageSize':size,'visualVerification':'pending'},'localPath':str(p.resolve())}
 except Exception as e:return c['id'],{'error':str(e)}
out=dict(concurrent.futures.ThreadPoolExecutor(max_workers=4).map(get,cards));(root/'final-kit-fallbacks.json').write_text(json.dumps(out,indent=2),encoding='utf-8');print(json.dumps(out),flush=True)
