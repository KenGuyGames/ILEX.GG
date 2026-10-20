from pathlib import Path
import json,re,collections,zipfile,xml.etree.ElementTree as E
here=Path(__file__).resolve().parent;data=json.loads((here/'workbook-contents.json').read_text(encoding='utf-8'));p=data['sheets'][0];groups=collections.defaultdict(list)
for c in p['cells']:groups[re.sub(r'\d','',c['cell'])].append(c)
sections=[];records=[]
for col,cells in groups.items():
    header=next(c['value'] for c in cells if c['cell']==col+'1');section='Active cube';stage= 'EXpansion' if 'EXpansion' in header else ('Stage 2' if 'Stage 2' in header else 'Stage 1' if 'Stage 1' in header else 'Basic');counts=collections.Counter();activeStages=collections.Counter()
    for c in cells:
        if c['cell']==col+'1':continue
        text=str(c['value']).strip()
        if 'Potential Swaps' in text or 'Extra Cards' in text:section='Potential swap';continue
        if text=='No Stage 2':continue
        if re.match(r'^(Basics?|Stage\s*[12])\s*:',text,re.I):stage='Basic' if text.lower().startswith('basic') else 'Stage '+re.search(r'\d',text).group();continue
        if not text:continue
        counts[section]+=1
        if section=='Active cube':activeStages[stage]+=1
        records.append({'sheet':p['name'],'cell':c['cell'],'name':text,'type':header.split()[0].replace('Psychis','Psychic'),'stage':stage,'pool':'EXpansion' if 'EXpansion' in header else 'Core','section':section,'formula':c.get('formula')})
    sections.append({'column':col,'header':header,'counts':dict(counts),'activeStages':dict(activeStages)})
t=data['sheets'][1];headers={re.sub(r'\d','',c['cell']):c['value'] for c in t['cells'] if c['cell'].endswith('1') and not re.search(r'\d\d$',c['cell'])};headers['B']='Supporters:';headers['E']='Items:'
trainers=collections.Counter()
for c in t['cells']:
    row=int(re.sub('[A-Z]','',c['cell']));col=re.sub(r'\d','',c['cell'])
    if row==1:continue
    category=headers[col];trainers[category]+=1
    records.append({'sheet':t['name'],'cell':c['cell'],'name':c['value'],'category':category,'pool':'Excluded' if col=='O' else 'Extra' if category.startswith('Extra') else 'Core','section':'Active cube' if col in ['A','B','D','E','G','I','K','M'] else 'Extra or excluded','formula':c.get('formula')})
source=Path(data['source']);ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','x':'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing'}
with zipfile.ZipFile(source) as z:
    styles=E.fromstring(z.read('xl/styles.xml'));fonts=styles.find('m:fonts',ns);xfs=styles.find('m:cellXfs',ns)
    for s in data['sheets'][:2]:
        cells={c.attrib['r']:c for c in E.fromstring(z.read(s['path'])).findall('.//m:sheetData/m:row/m:c',ns)}
        for r in records:
            if r['sheet']!=s['name']:continue
            cell=cells[r['cell']];font=fonts[int(xfs[int(cell.attrib.get('s','0'))].attrib['fontId'])];r['font']={x.tag.split('}')[-1]:x.attrib for x in font if x.tag.split('}')[-1] in ['color','strike','b','i']}
    drawings=[]
    for name in z.namelist():
        if re.fullmatch('xl/drawings/drawing[0-9]+.xml',name):
            e=E.fromstring(z.read(name));pic=e.findall('.//x:pic',ns);drawings.append({'file':name,'pictures':len(pic),'samples':[{**(x.find('x:nvPicPr/x:cNvPr',ns).attrib if x.find('x:nvPicPr/x:cNvPr',ns) is not None else {})} for x in pic[:3]]})
    images=[n for n in z.namelist() if n.startswith('xl/media/')]
    for name in images[:4]:(here/Path(name).name).write_bytes(z.read(name))
result={'sections':sections,'trainerCategories':dict(trainers),'recordCount':len(records),'records':records,'drawings':drawings}
(here/'cube-analysis.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print('Pokemon counts:',json.dumps(sections));print('Trainer counts:',dict(trainers));print('Drawings:',drawings)
print('Core duplicates:',[(k,len(v)) for k,v in collections.defaultdict(list).items()])
for pool in ['Core','EXpansion','Extra','Excluded']:
    selected=[r for r in records if r['pool']==pool and r['section']=='Active cube'];print(pool,len(selected),'struck',len([r for r in selected if 'strike'in r.get('font',{})]),'colors',dict(collections.Counter(str(r.get('font',{}).get('color',{})) for r in selected)))
