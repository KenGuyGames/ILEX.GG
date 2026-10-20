from pathlib import Path
import json,hashlib
root=Path.cwd();p=root/'AGENTS.md';s=p.read_text(encoding='utf-8');note='''# Latest cube repair — all printings and Greninja Star (October 20, 2026)

All1283 existing Zander workbook entries now have automated printing links:640 core,72 EXpansion,558 reserves,13 excluded; zero unresolved. Greninja Star is swshp-SWSH144, with Star/★/* name alias matching for CubeKoga printings. Single Strike Urshifu V defaults to swsh5-85 (Battle Styles85, Laser Focus/Impact Blow), explicitly selected under user's request to fill remaining printings; still editable. Twelve unresolved records resolved from linked workbook scans, including reserve mislabeled numbers/names. Original labels/source links retained. Two additional Colorless Stage1 choices are new card slots, not missing printings, and remain user choices; source640 count unchanged.

Startup migration in cubeAssets repairs only missing/invalid known library links, preserving valid user selections, pool/section edits, names/rules, drafted decks/drafts/matches and deleted-cube recovery records; does not resurrect deleted cubes. Custom definitions/user-selected unresolved entries are not overwritten. ILEX cube JSON imports also repair; existing CubeKoga Greninja Star source IDs repair. Tests5 focused +24 cube effects/model +6 importer contracts pass. Native actual saved-state upgrade/restart8 checks pass (fresh workflow seeded old missing records first);10 touch checks at640x312/360x800 and44 APK checks pass. Engine/adapter/bot/VSTAR hitboxes unchanged. Prior tests retain actual old hashes.

Shared Windows app, independent1.22.0 folder, both versioned and standard Windows ZIPs updated with CRC/difference checks. Original-certificate Android1.22.0-android.36/code36 updated with1137 startup scans; physical Android acceptance pending. User app not closed; restart applies saved-library repair without recreating the cube. Next Android code37. No subagents/remote publication. Existing cube deletion behavior retained. Latest evidence work/rules-research/cube-printings-fix.json; focused sources work/cube-printings and work/desktop-build/package-cube-printings.py. Live CubeKoga transport limitation unchanged. Updated source overrides work/cube-review/printing-overrides.json; initial generators still should not be rerun over completed UI.

Latest hashes: cube-library.js28f1d54e33baa8f869f864ece811f2c98ce4a7d5bcabf78d15da77e36a2d2e66; cube-ui.js5ccf8ce7f5e3ccbcba2c3a36fbe4fe2d6e5b50309e7d493e87cb26dd00dc2da4; cube-presets.json849520c43c01f557e6de2597dc4ecabe0ec9f9c5b184b7fff48022c52cb14a51. Cube source/UI remain work/cube-source/src and work/cube-candidate/ui. Older unresolved Urshifu notes below are historical and superseded.

---

''';p.write_text(note+s,encoding='utf-8')
p=root/'work/cube-review/CHECKPOINT.json';d=json.loads(p.read_text(encoding='utf-8'));d['latestPatch']='work/rules-research/cube-printings-fix.json';d['nextAndroidCode']=37;d['data'].update(expansionResolved=72,unresolved=0,allEntriesResolved=1283);d['data'].pop('unresolvedExpansion',None);p.write_text(json.dumps(d,indent=2),encoding='utf-8');(root/'work/cube-review/unresolved.json').write_text('[]',encoding='utf-8')
d=json.loads((root/'work/rules-research/cube-printings-fix.json').read_text(encoding='utf-8'))
for folder in ['ILEX.GG-win32-x64','ILEX.GG-1.22.0']:
 for n,h in d['hashes'].items():assert hashlib.sha256((root/'outputs'/folder/'resources/app/ui'/n).read_bytes()).hexdigest()==h
assert hashlib.sha256((root/'outputs/ILEX.GG-Android.apk').read_bytes()).hexdigest()==d['android']['sha256']
print('Final deployed printing repairs verified; latest progress saved.')
