from pathlib import Path
import shutil,json,hashlib
root=Path(__file__).resolve().parents[2];out=root/'work/cube-candidate';out.mkdir(exist_ok=True)
source=root/'outputs/ILEX.GG-1.21.1/resources/app/ui'
if not (out/'ui').exists():shutil.copytree(source,out/'ui',ignore=shutil.ignore_patterns('*.backup*'))
baseline={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in source.iterdir() if p.is_file() and '.backup' not in p.name}
(out/'baseline.json').write_text(json.dumps(baseline,indent=2),encoding='utf-8')
print('Cube candidate UI isolated from release')
