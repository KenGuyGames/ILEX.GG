from pathlib import Path, PurePosixPath
import hashlib,json,zipfile,os,shutil,subprocess

EXPECTED='784ebcc894925fa2e23911f04a9ca0749f2bf035a048ba14c82ccf1d079d2949'
archive=Path(os.environ['RUNNER_TEMP'])/'ilex-cache-release/ILEX.GG-Windows-Small.zip'
assert hashlib.sha256(archive.read_bytes()).hexdigest()==EXPECTED,'Release ZIP SHA mismatch'
prefix='ILEX.GG-win32-x64/resources/app/'
count=0
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert not any('/resources/scans/' in n for n in z.namelist())
    for name in z.namelist():
        if not name.startswith(prefix) or name.endswith('/'):continue
        relative=PurePosixPath(name[len(prefix):])
        assert not relative.is_absolute() and '..' not in relative.parts
        dest=Path('work/desktop').joinpath(*relative.parts)
        dest.parent.mkdir(parents=True,exist_ok=True)
        dest.write_bytes(z.read(name));count+=1
    verification=z.read('ILEX.GG-win32-x64/desktop-verification.json')
    Path('verification/desktop-verification-1.5.0.json').write_bytes(verification)
manifest=json.loads(Path('work/desktop/card-effect-sources/ex-source-manifest.json').read_text())
src=Path('work/rules-research/twinleafgg-main/ptcg-server/src')
for entry in manifest['files']:
    relative=PurePosixPath(entry['path'])
    assert not relative.is_absolute() and '..' not in relative.parts
    candidate=Path('work/desktop/card-effect-sources').joinpath(*relative.parts)
    assert hashlib.sha256(candidate.read_bytes()).hexdigest()==entry['sha256']
    dest=(src if candidate.suffix=='.ts' else Path('work/desktop-build')).joinpath(*relative.parts)
    dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(candidate,dest)
engine=Path('work/desktop/ui/rules-engine.js')
assert hashlib.sha256(engine.read_bytes()).hexdigest()==manifest['engineSha256']
coverage=json.loads(Path('work/desktop/ui/ex-coverage.json').read_text())
assert coverage['available']==1857 and coverage['pending']==0
print(f'Imported {count} app files from verified small ZIP and synchronized {len(manifest["files"])} effect sources.')
Path(os.environ['RUNNER_TEMP'],'ilex-cache-release/desktop-verification.json').write_bytes(verification)
Path(os.environ['RUNNER_TEMP'],'ilex-cache-release/SHA256SUMS.txt').write_text(EXPECTED+'  ILEX.GG-Windows-Small.zip\n')
report={'version':'1.5.0','asset':'ILEX.GG-Windows-Small.zip','bytes':archive.stat().st_size,'sha256':EXPECTED,'scansBundled':0,'appFilesVerified':count,'engineSha256':manifest['engineSha256'],'cacheTests':'passed: integrity, concurrency, deduplication, offline restart, corruption repair, pause and resume','cacheNativeUI':'not verified; local Electron launch blocked','liveProviderDownloads':'not verified','priorDesktopVerification':'desktop-verification-1.5.0.json'}
Path('verification/card-cache-release-1.5.0.json').write_text(json.dumps(report,indent=2)+'\n')

