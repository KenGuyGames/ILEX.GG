from pathlib import Path
import json,hashlib
root=Path.cwd();p=root/'AGENTS.md';s=p.read_text(encoding='utf-8');note='''# Latest cube update — delete cube and drafted decks (October 20, 2026)

Cube library now has Delete cube with an affected deck count and Cancel/confirmation. Deleting a cube removes its saved drafts and its drafted decks (by draft ID or cube format), as Kenneth explicitly requested. Other cubes/decks, formats and current pinned matches remain intact. Restore deleted cube restores the exact cube/drafts/decks together; empty-library New cube/import work and deleted presets stay gone after restart. Recovery records live in state.deletedCubes; do not discard them during migrations.

Source work/cube-candidate/ui/cube-ui.js hash6a543d4fb75768d3ca53372e0a8983251d67a9b95f29e613100c4a362da857e0. Engine/adapter/bot/VSTAR hitboxes unchanged from1.22.0. Native12 fresh/4 restored checks and32 focused touch checks at640x312/360x800 pass;44 APK checks/signature pass. Prior full273 mobile checks remain historical, not rerun or relabeled. Shared Windows app, independent1.22.0 folder, versioned/standard compact+offline ZIPs updated with CRC/difference checks. Android1.22.0-android.35/code35 retains original certificate and1137 startup scans; physical Android acceptance pending. Next code36. User app not closed. No subagents or remote publication. Evidence work/rules-research/cube-delete-fix.json; scripts work/cube-delete and work/desktop-build/package-cube-delete.py. Earlier cube-release.json remains initial1.22.0 evidence; this UI patch supersedes its cube-ui hash and APK.

---

''';p.write_text(note+s,encoding='utf-8')
p=root/'work/cube-review/CHECKPOINT.json';d=json.loads(p.read_text(encoding='utf-8'));d['latestPatch']='work/rules-research/cube-delete-fix.json';d['nextAndroidCode']=36;p.write_text(json.dumps(d,indent=2),encoding='utf-8')
d=json.loads((root/'work/rules-research/cube-delete-fix.json').read_text(encoding='utf-8'))
for folder in ['ILEX.GG-win32-x64','ILEX.GG-1.22.0']:assert hashlib.sha256((root/'outputs'/folder/'resources/app/ui/cube-ui.js').read_bytes()).hexdigest()==d['cubeUiSha256']
assert hashlib.sha256((root/'outputs/ILEX.GG-Android.apk').read_bytes()).hexdigest()==d['android']['sha256']
print('Final Windows/Android artifacts verified; deletion instructions saved.')
