"""Package the release ELF as an SD-installed New 3DS application."""
from pathlib import Path
import hashlib, json, re, subprocess, wave, zipfile
from PIL import Image, ImageDraw, ImageFont

port = Path(__file__).resolve().parents[1]
root = port.parents[1]
tools = root / 'work/3ds-sdk/cia-tools'
build = port / 'build-cia'
build.mkdir(exist_ok=True)
makerom = tools / 'makerom/makerom.exe'
banner = tools / 'bannertool/bannertool-1.2.3-windows/bannertool.exe'
ctrtool = tools / 'ctrtool/ctrtool.exe'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
release = json.loads((port / 'reports/release.json').read_text())
assert sha(port / 'ilex-gg.3dsx') == release['binarySha256']
symbols = json.loads((port / 'reports/release-symbols.json').read_text())
assert symbols['passed'] and symbols['testHooksAbsent']

# Reuse the existing Celebi identity; no third-party banner or sound is needed.
image = Image.new('RGB', (256, 128), '#123c27')
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((3, 3, 252, 124), radius=15, outline='#b4ce70', width=2)
icon = Image.open(port / 'icon.png').convert('RGBA').resize((88, 88), Image.Resampling.LANCZOS)
image.paste(icon, (12, 20), icon)
fontpath = Path('C:/Windows/Fonts/georgiab.ttf')
font = ImageFont.truetype(str(fontpath), 25) if fontpath.exists() else ImageFont.load_default()
draw.text((108, 43), 'ILEX.GG', font=font, fill='#e4edb8')
draw.text((109, 78), 'New 3DS / New 2DS', fill='#c1d7ac')
image.save(build / 'banner.png')
with wave.open(str(build / 'silence.wav'), 'wb') as audio:
    audio.setparams((1, 2, 22050, 22050, 'NONE', 'not compressed'))
    audio.writeframes(bytes(44100))
subprocess.run([str(banner), 'makebanner', '-i', str(build/'banner.png'), '-a', str(build/'silence.wav'), '-o', str(build/'banner.bnr')], check=True)
output = root / 'outputs/ILEX.GG-New3DS-Playable-Alpha.cia'
subprocess.run([str(makerom), '-f', 'cia', '-o', str(output), '-target', 't', '-exefslogo', '-elf', str(port/'ilex-gg.elf'), '-rsf', str(port/'cia.rsf'), '-ver', '3', '-banner', str(build/'banner.bnr'), '-icon', str(port/'ilex-gg.smdh')], check=True)
result = subprocess.run([str(ctrtool), '--verify', str(output)], capture_output=True, text=True)
(port/'reports/cia-ctrtool.txt').write_text(result.stdout + result.stderr)
text = result.stdout + result.stderr
# Homebrew deliberately lacks Nintendo retail signatures. Verify actual payload
# integrity separately: ctrtool returns zero even for a failed signature/hash.
hash_lines = [line for line in text.splitlines() if re.search(r'hash:', line, re.I)]
if result.returncode or len(hash_lines) < 7 or any('(FAIL)' in line for line in hash_lines):
    raise RuntimeError('ctrtool verification failed; see reports/cia-ctrtool.txt')
for required in ['TitleId:       000400000f1e5800', 'AppMemory: 124MB', 'CPU Speed (New3DS):     804MHz (GOOD)', 'Code stack size:        0x00100000']:
    assert required in text, required
report = dict(titleId='000400000F1E5800', titleVersion=3, new3dsMemory='124MB', stackBytes=1048576,
              package=str(output), bytes=output.stat().st_size, sha256=sha(output),
              elfSha256=sha(port/'ilex-gg.elf'), ctrtoolContentHashesVerified=True,
              retailSigned=False, requiresCustomFirmware=True, hardwareTested=False,
              runtimeUnchanged=True, release3dsxSha256=release['binarySha256'],
              tools={p.name:sha(p) for p in (makerom,banner,ctrtool)},
              sources=['https://github.com/3DSGuy/Project_CTR/releases/tag/makerom-v0.19.0',
                       'https://github.com/3DSGuy/Project_CTR/releases/tag/ctrtool-v1.3.0',
                       'https://github.com/carstene1ns/3ds-bannertool/releases/tag/1.2.3'])
original = root / 'outputs/ILEX.GG-New3DS-Playable-Alpha.zip'
assert sha(original) == release['packageSha256'], 'SD package differs from verified alpha'
bundle = root / 'outputs/ILEX.GG-New3DS-CIA-SD.zip'
with zipfile.ZipFile(original) as source, zipfile.ZipFile(bundle, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as target:
    for item in source.infolist():
        assert not item.filename.endswith(('match.json','match.json.bak','match.json.tmp'))
        target.writestr(item, source.read(item.filename))
    target.write(output, 'cias/'+output.name)
    target.write(port/'CIA-INSTALL.md', 'CIA-INSTALL.md')
with zipfile.ZipFile(bundle) as check:
    assert check.testzip() is None
    assert hashlib.sha256(check.read('cias/'+output.name)).hexdigest() == report['sha256']
report.update(sdBundle=str(bundle), sdBundleBytes=bundle.stat().st_size, sdBundleSha256=sha(bundle), zipCrcVerified=True)
(port/'reports/cia-release.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
