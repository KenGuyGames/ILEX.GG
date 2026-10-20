from pathlib import Path
p=Path('work/cube-review/native-self-test.cjs');s=p.read_text(encoding='utf-8');a=s.index('`(async()=>{')+1;b=s.index('})()`);',a)+4;Path('work/cube-review/cube-native-workflow.js').write_text(s[a:b],encoding='utf-8')
