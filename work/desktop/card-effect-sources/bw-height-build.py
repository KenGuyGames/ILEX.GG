import pathlib,json,re,csv,collections
root=pathlib.Path(__file__).resolve().parents[2];research=root/'work/rules-research'
rows=json.loads((research/'bw-height-ocr-results.json').read_text(encoding='utf-8-sig'));index={r['id']:r for r in json.loads((research/'bw-height-index.json').read_text(encoding='utf-8'))}
species=json.loads((research/'wotc-species-lengths-merged.json').read_text(encoding='utf-8'));forms=collections.defaultdict(list)
for r in csv.DictReader((root/'work/card-sources/bw-height-pokemon.csv').open(encoding='utf-8')):
 if any(s in r['identifier'] for s in ['-mega','-gmax','-alola','-galar','-hisui','-paldea','-totem']):continue
 forms[int(r['species_id'])].append((round(int(r['height'])*10/2.54),r['identifier'],r['is_default']=='1'))
byname={r['name']:r['dex'][0] for r in index.values() if len(r['dex'])==1};heights={};review=[];excluded=[]
for row in rows:
 ident=row['id'];meta=index[ident];text=row['text'].replace('’',"'").replace('′',"'")
 if not re.search(r'\bH\s*T[.:;]?|\bW\s*T[.:;]?|NO[.,]?\s*\d{3}[^.]{0,70}Pok',text,re.I):excluded.append(ident);continue
 dex=(meta['dex'] or [byname.get(meta['name'])])[0]
 if not dex:
  m=re.search(r'NO[.,]?\s*0*(\d{1,3})',text,re.I);dex=int(m[1]) if m else None
 options=forms.get(dex,[])
 if not options:review.append({'id':ident,'reason':'missing-dex','text':text});continue
 default=next((n for n,name,d in options if d),options[0][0]);value=int(species.get(str(dex),default))
 m=re.search(r'\bH\s*T[.:;]?\s*(\d{1,2})\s*[\']\s*(\d{1,2})',text,re.I)
 if m and int(m[2])<12:
  actual=int(m[1])*12+int(m[2]);valid={n for n,name,d in options}
  if actual in valid:value=actual
  elif actual!=value:review.append({'id':ident,'reason':'OCR-mismatch','expected':value,'ocr':actual,'text':text})
 m2=re.search(r'\bH[TIYi][.:;]?\s*(\d{3,4})',text,re.I)
 if m2:
  value=next((n for n,name,d in options if str(n//12)+str(n%12).zfill(2)==m2[1]),value)
 # Named Kyurem formes have different printed heights.
 for suffix in ['black','white']:
  if suffix in meta['name'].lower() and 'kyurem' in meta['name'].lower():value=next((n for n,name,d in options if suffix in name),value)
 if ident=='hgss2-8':value=16 # Sky Forme: scan metadata reads 1 foot 4 inches.
 heights[ident]=value
(research/'bw-card-heights.json').write_text(json.dumps(heights,indent=2),encoding='utf-8');(research/'bw-height-review.json').write_text(json.dumps({'review':review,'noPrintedMetadataDetected':excluded},indent=2),encoding='utf-8')
(root/'work/rules-research/twinleafgg-main/ptcg-server/src/tcg-lab-bw-heights.ts').write_text('export const bwHeights:any = '+json.dumps(heights,separators=(',',':'))+';\n',encoding='utf-8')
print(json.dumps({'eligible':len(heights),'noMetadata':len(excluded),'review':len(review),'reasons':dict(collections.Counter(r['reason'] for r in review))}))
