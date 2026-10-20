from pathlib import Path
import json,shutil
root=Path.cwd();p=root/'work/cube-review/resolve.py';s=p.read_text(encoding='utf-8').replace("'version':1,'source'","'version':2,'printingRevision':2,'source'");p.write_text(s,encoding='utf-8');d=json.loads((root/'work/cube-printings/mobile-tests.json').read_text(encoding='utf-8'));d['scope']='Focused printing-repair and EXpansion touch checks; prior full mobile and cube deletion evidence retains original hashes.';(root/'work/android-build/mobile-verification.json').write_text(json.dumps(d,indent=2),encoding='utf-8')
