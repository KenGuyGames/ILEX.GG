import pathlib,json,hashlib,zipfile,concurrent.futures,shutil,datetime
root=pathlib.Path(__file__).resolve().parents[2]
app=root/'outputs/TCG Lab-win32-x64'
ui=app/'resources/app/ui'
manifest=json.loads((ui/'scan-manifest.json').read_text(encoding='utf-8'))
def verify(item):
    ident,entry=item
    data=(app/'resources'/entry['file']).read_bytes()
    assert len(data)==entry['bytes'] and hashlib.sha256(data).hexdigest()==entry['sha256'],ident
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(verify,manifest.items()))
assert len(manifest)==23736
tests=root/'work/desktop-bsf-tests-v1'
coverage=json.loads((ui/'rules-coverage.json').read_text(encoding='utf-8'))
checks=json.loads((tests/'desktop-tests.json').read_text())
checks['persistence']=json.loads((tests/'persistence.json').read_text())
checks['rulesTests']=json.loads((root/'work/rules-research/rules-test-report.json').read_text())
checks['baseFossilPrintingAudit']=json.loads((root/'work/rules-research/base-fossil-audit.json').read_text())
checks['baseFossilMappedPrintings']=228
checks['baseFossilAttackScenarios']=634
checks['bundledScanHashesVerified']=len(manifest)
checks['testEnvironment']='Hidden desktop tests used --no-sandbox because the restricted execution environment blocks nested Chromium sandbox processes. This flag is not enabled by the distributed launcher. Renderer Node integration is disabled and context isolation enabled.'
checks['executableSHA256']=hashlib.sha256((app/'TCG Lab.exe').read_bytes()).hexdigest()
checks['checkedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
(app/'desktop-verification.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
shutil.copyfile(tests/'desktop-preview.png',root/'outputs/TCG-Lab-desktop-preview.png')
(app/'README.md').write_text('''# TCG Lab 1.3 desktop for Windows

Extract the entire ZIP, then double-click **TCG Lab.exe**. No Python, Node, separate browser or installation is required. Keep the executable, DLLs, locales and resources together. Windows 10/11, 64-bit. Existing local workspaces remain in `%APPDATA%\\TCG Lab`; exports use a native Save dialog.

## Import a Limitless deck

In Limitless Deck Builder choose **Share > Copy as Text**. In TCG Lab choose **My decks > Import Limitless list**, paste the text or open a .txt file, choose the format, review the matched entries and save. Unresolved or ambiguous entries prevent saving; no lines are silently dropped. PTCG Live headers, quantities, set codes, collector numbers, leading zeros and Basic Energy symbols are supported. Name-only Trainers and Basic Energy choose a listed printing, shown during review; Pokemon require a unique printing. Incompatible PTCGL ALT codes require replacing the variant with a regular printing in Limitless. Decks can also be exported as compatible text.

## Rules-enforced matches

Choose a historical rules profile in each format, then select two decks on Play table. The first deck's format supplies the default profile; the match selector permits an explicit override. Profiles cover ex, Diamond & Pearl/HGSS, Black & White, XY, Sun & Moon and modern rules. The engine handles setup, mulligans, turn restrictions, evolution, attachments, attacks, implemented effects, Stadium/Ability interactions, mandatory choices, special conditions, knockouts, prizes and win checks. Saved matches replay their journal and preserve engine-generated coin outcomes.

Automation currently maps **12,825 printings** to implementations, including all **228 Base Set, Jungle and Fossil printings** (102 + 64 + 62). The Base–Fossil pass corrects printed metadata, adds Base Gastly and non-holo Fossil Ditto, and fixes damage ordering, drain healing, Energy costs, Bench damage, defensive Powers, Transform, Mirror Move and several original Trainers. All distinct attacks were exercised in 634 seeded scenarios, alongside targeted interaction regressions. This does not certify every possible interaction or historical ruling. Known upstream TODO templates and inherited reprints are excluded. Missing implementations block enforced matches, and effects with unavailable choice interfaces pause rather than silently resolve. Full coverage and missing IDs are listed in resources/app/ui/rules-coverage.json. The complete scan library remains available: **23,736 locally bundled scans**, including Pocket. Coverage means one front scan per entry in the bundled English index, not every language or foil variant globally.

Enforced matches currently require 60 cards and six prizes. Pocket gameplay and other deck sizes require the manual sandbox. Historical profiles implement documented era differences, but do not claim all historical errata and tournament rulings. Formats enforce copy limits, set prefixes, bans and custom-card permission; built-in Expanded is an editable era template, not a maintained tournament ban list.

## WOTC era

Six new format presets span Base–Fossil, Base–Team Rocket, Base–Gym Challenge, Base–Neo Revelation, Base–Neo Destiny and Base–Skyridge. They are editable expansion-pool templates; event-specific bans and dated promo legality are not asserted. Existing formats and decks are preserved. Each preset automatically selects its historical match profile.

**WOTC: Base–Neo (1999–2001)** preserves the original Power restriction to Sleep, Confusion and Paralysis. **WOTC: 2002–Skyridge** applies the later Poison/Burn Power erratum and old Burn checkup. Both draw on the first turn, allow first-turn attacks and Trainers, flip for first player after concealed setup, offer up to two bonus cards per opposing mulligan, allow unlimited normal retreats, require a paid Confusion retreat flip, and apply 20 Confusion self-damage with Weakness, Resistance and applicable Trainer modifiers. A failed confused retreat keeps its paid cost and conditions and blocks another attempt until recovery or the next turn. Required implemented Energy-card costs precede cancellation/Confusion checks and are paid once. Neo Baby Rules precede those costs. Sources and coverage caveats are in resources/app/ui/RULES-SOURCES.md.

Custom automated cards currently support Pokemon with numeric damage, typed Energy costs, evolution and a structured special-condition effect on the first attack. Free-text effects, custom Trainers and custom Energy require manual resolution. Custom format/card creation and the manual tabletop remain available.

Offline card text is bundled for 20,464 entries. Other inspection text can require internet; local scans remain available. Unofficial fan-made software. Pokemon names and artwork belong to their owners. The executable is unsigned. Runtime/font licenses, engine MIT license and sources are included. See resources/app/ui/RULES-SOURCES.md.

## Verification

Engine/import checks and desktop UI checks passed, including WOTC profiles and combat cases, import review, export round trip, setup choices, illegal-action rollback, turn advance and exact restoration across launches. Every bundled scan was rechecked against its SHA-256 manifest. See desktop-verification.json for the test count and the restricted test-environment limitation; the distributed launcher retains normal Chromium sandbox settings.
''',encoding='utf-8')
target=root/'outputs/TCG-Lab-Windows.zip'
with zipfile.ZipFile(target,'w',allowZip64=True,compression=zipfile.ZIP_DEFLATED,compresslevel=1) as z:
    for p in app.rglob('*'):
        if p.is_file():z.write(p,p.relative_to(app.parent),compress_type=zipfile.ZIP_STORED if p.parent.name=='scans' else zipfile.ZIP_DEFLATED,compresslevel=1)
with zipfile.ZipFile(target) as z:
    assert len([n for n in z.namelist() if '/resources/scans/' in n])==23736
    for name in ['TCG Lab.exe','resources/app/ui/rules-engine.js','resources/app/ui/deck-text.js','resources/app/ui/rules-ui.js']:
        assert 'TCG Lab-win32-x64/'+name in z.namelist()
    assert z.testzip() is None
print(json.dumps({'zip':str(target),'bytes':target.stat().st_size,'verifiedScans':len(manifest),'mappedPrintings':coverage['mappedPrintings'],'testsPassed':len(checks['rulesTests']['tests'])}))
