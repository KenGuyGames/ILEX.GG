import json,urllib.request,urllib.error,concurrent.futures,time,datetime
from pathlib import Path
root=Path(__file__).resolve().parents[2]
ids=json.loads((root/'work/rules-research/promo-finish-candidates.json').read_text(encoding='utf-8'))
target=root/'work/desktop/ui/promo-finishes.json'
records=json.loads(target.read_text(encoding='utf-8')) if target.exists() else {}
def fetch(ident):
 for attempt in range(2):
  try:
   with urllib.request.urlopen('https://api.tcgdex.net/v2/en/cards/'+urllib.parse.quote(ident,safe='-'),timeout=8) as response:d=json.load(response)
   v=d.get('variants',{});types={x.get('type') for x in d.get('variants_detailed',[]) if x.get('size','standard')=='standard'}
   if not v and not types:return ident,None,'No finish metadata'
   holo=bool(v.get('holo') or 'holo' in types);reverse=bool(v.get('reverse') or 'reverse' in types);normal=bool(v.get('normal') or 'normal' in types)
   return ident,{'holo':holo,'reverse':reverse,'normal':normal,'source':'TCGdex','sourceId':d.get('id',ident)},None
  except urllib.error.HTTPError as error:
   if error.code==404:return ident,None,'Not in TCGdex API'
   message=str(error)
  except Exception as error:message=type(error).__name__
  if attempt==0:time.sleep(.25)
 return ident,None,message
pending=[i for i in ids if i not in records];errors={}
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
 for n,(ident,data,error) in enumerate(pool.map(fetch,pending),1):
  if data:records[ident]=data
  else:errors[ident]=error
  if n%100==0:
   target.write_text(json.dumps(records,separators=(',',':')),encoding='utf-8');print(f'Checked {n}/{len(pending)}; records {len(records)}, unresolved {len(errors)}',flush=True)
# Positive foil evidence is visible in the bundled English scans; upstream flags omit these.
corrections={'basep-13':'655cad4e0523dac4f57ad71b.webp','basep-15':'233318e1e8917e008ca5ad88.webp'}
for ident,scan in corrections.items():records[ident]={**records[ident],'holo':True,'normal':False,'reviewedScan':scan}
target.write_text(json.dumps(records,separators=(',',':')),encoding='utf-8')
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewedCorrections':corrections,'candidates':len(ids),'resolved':len(records),'foil':sum(v['holo'] or v['reverse'] for v in records.values()),'nonFoil':sum(not(v['holo'] or v['reverse']) for v in records.values()),'bothFinishes':sum(v['normal'] and (v['holo'] or v['reverse']) for v in records.values()),'unresolved':errors,'source':'https://api.tcgdex.net/v2/en/cards/{cardId}'}
(root/'work/rules-research/promo-finish-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps({k:v for k,v in report.items() if k not in ['unresolved','source']}),flush=True)
