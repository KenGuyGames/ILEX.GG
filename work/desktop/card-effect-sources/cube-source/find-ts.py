from pathlib import Path
import json
p=Path('work/cube-source/src/tcg-lab-cube-trainers.ts');s=p.read_text(encoding='utf-8').replace('prompts/shuffle-deck-prompt','prompts/shuffle-prompt');p.write_text(s,encoding='utf-8');Path('work/cube-review/cube-trainers.ts').write_text(s,encoding='utf-8')
for p in Path('work/cube-source/src').glob('*data.ts'):
 s=p.read_text(encoding='utf-8');i=s.find(' = ')
 try: a=json.loads(s[i+3:].rstrip(';\n\r '))
 except:continue
 for x in a:
  if isinstance(x,dict) and 'TS-1' in x.get('d',{}).get('name',''): print(p.name, json.dumps(x,ensure_ascii=False)[:4500])
