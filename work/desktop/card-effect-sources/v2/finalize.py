from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[2];r=root/'work/v2-research';report=json.loads((r/'release.json').read_text());assert report['passed'] and len(report['archives'])==2
for n,h in report['hashes'].items():
 for folder in ['outputs/ILEX.GG-2.0.0/resources/app/ui','outputs/ILEX.GG-win32-x64/resources/app/ui']:
  assert hashlib.sha256((root/folder/n).read_bytes()).hexdigest()==h,(folder,n)
assert (root/'outputs/ILEX.GG-2.0.0-Android.apk').stat().st_size==report['android']['bytes']
assert (root/'outputs/ILEX.GG-1.23.0-Windows.zip').exists()
p=r/'CHECKPOINT.json';d=json.loads(p.read_text());d.update(status='2.0.0 ready locally; Windows EXE, compact/offline ZIPs and signed Android43 verified; NOT uploaded',remaining=[],releaseEvidence='work/rules-research/v2-ui-release.json',nextAndroidCode=44,canonicalUI='work/v2-candidate/ui');p.write_text(json.dumps(d,indent=2))
p=root/'FEATURE-BACKLOG.md';s=p.read_text(encoding='utf-8-sig');marker='**Major 2.0 UI overhaul:**'
if marker not in s:s+='\n- [x] '+marker+' Completed locally October20,2026 in2.0.0. Cinematic original forest, rotating Celebi, all-mode visual system, responsive wide tabletop, elemental charge/impact/attacker presentation and accessible motion controls. Windows and Android43 packages verified; physical Android acceptance pending. No remote publication.\n'
p.write_text(s,encoding='utf-8')
p=root/'AGENTS.md';s=p.read_text(encoding='utf-8-sig');entry='''# Latest completed scope — major UI overhaul / ILEX.GG 2.0.0 (October 20, 2026)

**2.0.0 is ready locally; NOT uploaded to GitHub.** Kenneth requested major AAA-inspired overhaul and version2.0.0 when uploaded. Canonical UI now **work/v2-candidate/ui**. Original generated forest PNG and exact prompt under ui/v2-assets, cinematic home with rotating Celebi Prime/other printings, native SVG mode icons, shared emerald/gold surfaces and typography across gallery/decks/formats/custom/cubes/packs/Pocket/private views, bounded ambient home particles, responsive desktop arena, elemental charge sigils/attacker portrait/impact lighting and shockwaves. Desktop match heading action moves into Match settings; wide playmat uses remaining viewport height. Android keeps its existing landscape geometry and gains compact Energy prompt spacing. Reduced motion, pause, Skip, focus, touch and transparent card actions retained.

Final actual packaged Windows fresh/restored passes99 new presentation/layout groups each, plus31/32 Pocket UI groups including ten cube mutant effect fixtures. Menus at1920x1080,1440x960,1280x720,800x450,640x360,390x844; fully populated paper arenas and unobstructed Pokemon targets; ten elemental presentation fixtures, exact match/journal/RNG preservation and Skip tested. Synthetic visual fixtures are not full gameplay matches.60 new/Pocket mobile touch checks plus176 broader paper/mobile regressions and44 APK/static checks pass. APK all-assets/source/hash/CRC/alignment/signature verified; original cert b7c77e1f936266ffddb0a381be15ab50fcb7c49694520044a19c91fc287bb0b1 retained. Android **2.0.0-android.43/code43**, next44. Physical Android acceptance pending.

Windows independent outputs/ILEX.GG-2.0.0, shared app and both standard/versioned compact/offline ZIPs verified; original1.23 retained. Android versioned/shared APK updated. No real-profile writes, app closing, subagents or remote publication. Both engines byte-identical: paper38420f9be848b12126bc1153bce544ca9419de9c89a213e82b7b7379147f50dd; Pocket3f52fa2fb8a70e72d71fb7f902a777e2d7e510ec0012f296ed4ce9e58a16e046. Protected gameplay/card data files unchanged; rules-ui.js has only heading/phase wording changes. Prior multiplayer/Pocket client-edge limitations and unfinished reverse scans remain. Source gameplay TS remains work/cube-source/src; do not regenerate completed engines for this visual update.

Evidence work/rules-research/v2-ui-release.json, work/v2-research/{CHECKPOINT.json,DESIGN.md,release.json}. Build/package/finalize scripts there. Isolated test runtimes/profiles only. Native-release actual EXE uses final hashes; native-final preview predates the final manual-header selector repair. Earlier candidate failed checks were fixture initialization/copy-limit/timing issues or repaired overflow/prompt layout defects; do not cite them as final passes. Image-generation skill used for original environment only; card scans/brand unchanged. Historical notes below superseded.

---

''';p.write_text(entry+s,encoding='utf-8')
print('2.0.0 final output parity, checkpoint, backlog and AGENTS verified.')
