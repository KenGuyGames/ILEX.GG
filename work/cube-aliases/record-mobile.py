from pathlib import Path
import shutil,json
root=Path.cwd();d=json.loads((root/'work/cube-aliases/mobile-tests.json').read_text(encoding='utf-8'));d['scope']='Focused CubeKoga aliases and supplied-standard-definition import/repair checks. Prior mobile evidence retains original hashes.';(root/'work/android-build/mobile-verification.json').write_text(json.dumps(d,indent=2),encoding='utf-8')
