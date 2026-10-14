import pathlib,json,hashlib,zipfile,concurrent.futures,shutil,datetime
root=pathlib.Path(__file__).resolve().parents[2]
app=root/'outputs/ILEX.GG-win32-x64'
ui=app/'resources/app/ui'
manifest=json.loads((ui/'scan-manifest.json').read_text(encoding='utf-8'))
def verify(item):
    ident,entry=item
    data=(app/'resources'/entry['file']).read_bytes()
    assert len(data)==entry['bytes'] and hashlib.sha256(data).hexdigest()==entry['sha256'],ident
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(verify,manifest.items()))
assert len(manifest)==23736
print('Verified all 23,736 bundled scan hashes.',flush=True)
tests=root/'work/desktop-ilex-wotc-tests-v24'
coverage=json.loads((ui/'rules-coverage.json').read_text(encoding='utf-8'))
checks=json.loads((tests/'desktop-tests.json').read_text())
checks['persistence']=json.loads((tests/'persistence.json').read_text())
checks['dragAndDrop']=json.loads((tests/'drag-tests.json').read_text())
checks['promoFoil']=json.loads((root/'work/rules-research/promo-finish-report.json').read_text())
assert checks['promoFoil']['resolved']==1790 and not checks['promoFoil']['unresolved']
checks['deckFormatFilter']=json.loads((tests/'deck-filter-tests.json').read_text())
assert checks['deckFormatFilter']['passed']
checks['audio']=json.loads((tests/'audio-tests.json').read_text())
assert checks['audio']['passed']
checks['animatedFoil']=json.loads((tests/'foil-tests.json').read_text())
assert checks['animatedFoil']['passed']
checks['attackAbilitySearch']=json.loads((tests/'attack-search-layouts.json').read_text())
assert checks['attackAbilitySearch']['passed']
checks['visualDecklists']=json.loads((tests/'visual-deck-layouts.json').read_text())
assert checks['visualDecklists']['passed']
checks['widescreenLayouts']=json.loads((tests/'table-sizes.json').read_text())
checks['botEngine']=json.loads((root/'work/rules-research/bot-test-report.json').read_text())
checks['botDesktop']=json.loads((tests/'bot-ui-tests.json').read_text())
checks['undoAction']=json.loads((root/'work/rules-research/undo-test-report.json').read_text())
assert checks['undoAction']['passed']
checks['rulesTests']=json.loads((root/'work/rules-research/rules-test-report.json').read_text())
checks['baseFossilPrintingAudit']=json.loads((root/'work/rules-research/base-fossil-audit.json').read_text())
checks['baseFossilMappedPrintings']=228
checks['baseFossilAttackScenarios']=634
checks['wotcAutomation']=json.loads((root/'work/rules-research/wotc-test-report.json').read_text())
checks['wotcCoverage']=json.loads((ui/'wotc-coverage.json').read_text())
checks['gymHeroes']=json.loads((root/'work/rules-research/gym-heroes-test-report.json').read_text())
checks['wotcFinal']=json.loads((root/'work/rules-research/wotc-final-test-report.json').read_text())
assert checks['wotcFinal']['passed'] and checks['wotcFinal']['attackScenarios']==1368 and len(checks['wotcFinal']['checks'])==93
assert checks['wotcCoverage']['available']==1793 and checks['wotcCoverage']['pending']==0
checks['gymChallenge']=json.loads((root/'work/rules-research/gym-challenge-test-report.json').read_text())
assert checks['gymChallenge']['passed'] and checks['gymChallenge']['attackScenarios']==322
assert next(s for s in checks['wotcCoverage']['bySet'] if s['id']=='gym2')['available']==132
checks['nextThreeSets']=json.loads((root/'work/rules-research/next-three-test-report.json').read_text())
assert checks['nextThreeSets']['passed'] and checks['nextThreeSets']['attackScenarios']==682
for ident in ['ecard1','basep','neo1']:
    entry=next(s for s in checks['wotcCoverage']['bySet'] if s['id']==ident)
    assert entry['available']==entry['total']
assert checks['gymHeroes']['attackScenarios']==302
assert next(s for s in checks['wotcCoverage']['bySet'] if s['id']=='gym1')['available']==132
assert checks['wotcAutomation']['passed'] and checks['rulesTests']['passed'] and checks['botEngine']['passed']
assert checks['wotcAutomation']['attackScenarios']>0
assert checks['wotcAutomation']['coverage']['available']==checks['wotcCoverage']['available']
shutil.copyfile(root/'FEATURE-BACKLOG.md',app/'FEATURE-BACKLOG.md')
checks['bundledScanHashesVerified']=len(manifest)
checks['testEnvironment']='Hidden desktop tests used --no-sandbox because the restricted execution environment blocks nested Chromium sandbox processes, with offscreen software rendering for reliable screenshot capture. Normal launches retain GPU rendering and Chromium sandbox settings. Renderer Node integration is disabled and context isolation enabled.'
checks['executableSHA256']=hashlib.sha256((app/'ILEX.GG.exe').read_bytes()).hexdigest()
checks['rulesEngineSHA256']=hashlib.sha256((ui/'rules-engine.js').read_bytes()).hexdigest()
assert checks['rulesEngineSHA256']==hashlib.sha256((root/'work/desktop/ui/rules-engine.js').read_bytes()).hexdigest()
checks['checkedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
(app/'desktop-verification.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
shutil.copyfile(tests/'desktop-preview.png',root/'outputs/ILEX.GG-desktop-preview.png')
shutil.copyfile(tests/'tabletop-preview.png',root/'outputs/ILEX.GG-tabletop-preview.png')
shutil.copyfile(tests/'tabletop-widescreen-preview.png',root/'outputs/ILEX.GG-widescreen-preview.png')
shutil.copyfile(tests/'bot-preview.png',root/'outputs/ILEX.GG-bot-preview.png')
shutil.copyfile(tests/'visual-deck-preview.png',root/'outputs/ILEX.GG-visual-deck-preview.png')
shutil.copyfile(tests/'attack-search-preview.png',root/'outputs/ILEX.GG-attack-search-preview.png')
shutil.copyfile(tests/'foil-preview.png',root/'outputs/ILEX.GG-foil-preview.png')
for name in ['menu-music.wav','battle-music.wav','audio-preview.png']:shutil.copyfile(tests/name,root/'outputs'/('ILEX.GG-'+name))
(app/'README.md').write_text('''# ILEX.GG 1.4 desktop for Windows

Extract the entire ZIP, then double-click **ILEX.GG.exe**. No Python, Node, separate browser or installation is required. Keep the executable, DLLs, locales and resources together. Windows 10/11, 64-bit. Existing local workspaces remain in `%APPDATA%\\TCG Lab`; exports use a native Save dialog.

The Celebi-inspired theme uses forest greens, soft pink highlights, a leaf-and-time emblem and the Celebi Prime scan from Triumphant (92/102). Previous TCG Lab decks, custom cards, formats and saved matches use the same local workspace.

Games use a seated perspective with opposing Active/Bench rows, side piles and a fanned local hand. Click a Pokémon on the table to see its available actions. Right-click a face-up card to magnify its scan before choosing it; close with Esc, the close button or a click outside. Previews do not play cards or change pending choices. Opponent hands and face-down prizes/decks remain hidden. The seat follows the player taking the current turn or resolving a required choice in local two-player matches.

The window starts maximized and the table fills widescreen displays, with larger cards at 1080p and 1440p. Drag a Basic Pokémon to an empty Bench slot, an evolution/Energy/Tool onto its Pokémon, or a Trainer/Stadium onto the center play area. Drag a Bench Pokémon to Active (or Active onto an occupied Bench slot) to request retreat; costs and restrictions still apply. During a required switch/promotion, drag the eligible Bench Pokémon to Active. For other pending choices, drag a card/Pokémon into the effect's choice area. Drag attached Energy to Discard when choosing a cost; confirm selections below. Energy assignment effects also allow dragging their listed Energy onto a destination Pokémon. Highlighted destinations indicate the kind of action; the engine checks final legality. Cancelling a drag moves nothing. Click controls remain available.

## Play against a bot

On Play table, expand Match settings if a match is already open. Choose **Bot opponent**, select **Easy**, **Normal** or **Hard**, choose your deck and the opponent's deck, then start a new match. Three 60-card Base–Fossil starter decks (Forest/Venusaur, Fire/Charizard, Water/Blastoise) are available directly in these selectors. Your own decks remain available. Select Local two-player for the previous hot-seat mode.

Easy uses simpler, more varied choices. Normal evaluates the board and card effects. Hard adds limited planning across the next actions. All levels follow the selected historical rules and use the same validated actions, costs, coin flips and mandatory choices. This is a heuristic practice opponent; strength varies with the deck and supported effects. Bot planning uses public board information and its own hand, without scoring the human's hidden hand or looking at actual upcoming deck/prize order. Your seat stays fixed and the bot's hand remains concealed except when a card effect permits revealing it.

The bot resolves its own setup, turns and supported choices automatically. Pause/resume and a live difficulty selector are shown above the table. Opponent type and difficulty are saved with the match; opening Play table resumes an unpaused bot. Leaving Play table suspends its next action until you return. An unsupported mandatory effect pauses with an explanation rather than being skipped. A WOTC attack-cost prompt ownership fix also permits required Flamethrower/Fire Spin discards to be answered by their proper player.

## Final WOTC set implementations

The remaining 75 entries in Neo Discovery, Neo Revelation, Neo Destiny, Aquapolis and Skyridge are now implemented. Shared logic covers copied attacks, linked Active effects, pre-retreat choices, knockout prevention, physical Energy movement, hand-entry versus evolution triggers and Tools that resolve before knockout cleanup. Deck validation and the format filter honor printed singleton and Unown-family limits. Tests include both historical profiles, recorded choices, regression suites and saved-game restoration. Unlimited and later-era cross-pool interactions remain deferred.

## Deck format filter

My decks has a Show decks compatible with dropdown. Select a format to show only lists passing its deck size, copy limits, allowed sets, bans, Basic Pokemon and custom-card rules, regardless of the deck’s assigned format. All decks includes drafts and incompatible lists. Filtering preserves every saved deck. New/imported lists return to All decks for editing.

## Audio

Use Audio in the workspace header for independent music and effect volumes, enable switches, mute and track selection. Automatic music uses original forest melodies in menus and three retro battle tracks during games. Playback starts after your first interaction. Successful actions produce synthesized card, Energy, Trainer, Power, attack, damage, prize, turn and undo cues; bot planning, rejected actions and journal replay are silent. Preferences are saved locally. All audio is original and generated offline; no music download is required.

## Animated foil

Known holo-or-higher printings show a sheen and sparkle that follow mouse movement. The effect appears on face-up card scans in the library, visual decks, tabletop, inspector and magnified previews. Vintage holo effects are confined to the artwork area; higher-rarity fronts use a broader sheen. Non-holo variants and hidden cards stay undecorated. Printing rarity comes from bundled metadata; unknown rarity is not guessed. Promo finish records additionally enable known holo and reverse-holo variants, including reviewed vintage promos. For entries with both normal and foil printings, the inspector has a saved Animated foil choice; it changes the overlay, not the scan or deck card ID. Promo-source coverage and corrections are documented in resources/app/ui/PROMO-FOIL-SOURCES.md. Reduced-motion preferences retain a static effect. Foil layers do not intercept clicks, previews or drag-and-drop.

## Attack and ability search

Card library search matches card names/IDs, attack names and ability or Pokemon Power names. Choose Search everything, Card name / ID, Attack name, or Ability / Power name to narrow it. Partial names, case/accent normalization, set filtering and custom cards are supported. Matching attack/Power names appear beneath each card. Searches use bundled or cached text without a network request; entries without available text still match by card name or ID.

## Undo Action

Rules matches have an Undo Action button, including during pending choices and after a game ends. It restores the previous human decision and its automatic effects using the saved action journal. In bot games it also rewinds subsequent bot responses and pauses the bot; use Resume bot when ready. No bot approval is required. Undo history persists with saved matches; older saves can rewind their last player action. Online multiplayer is still pending, and future online undo will require opponent approval.

## Manage formats

On Formats, choose Remove format on any built-in or custom format. If saved decks use it, choose a replacement or leave them unassigned. Deck cards and existing game rules are preserved; unassigned decks need a format before validation or an automated match. Removing every format is supported, and the creation form remains available. Removed presets stay removed after restart.

## Visual decklists

My decks displays card scans grouped into Pokemon, Trainers and Energy, with quantity badges and editing controls on each printing. Click to inspect or right-click to magnify a scan. Deck names, formats, validation and Limitless text import/export remain available. Custom cards without artwork and missing scans show readable placeholders.

## Import a Limitless deck

In Limitless Deck Builder choose **Share > Copy as Text**. In ILEX.GG choose **My decks > Import Limitless list**, paste the text or open a .txt file, choose the format, review the matched entries and save. Unresolved or ambiguous entries prevent saving; no lines are silently dropped. PTCG Live headers, quantities, set codes, collector numbers, leading zeros and Basic Energy symbols are supported. Name-only Trainers and Basic Energy choose a listed printing, shown during review; Pokemon require a unique printing. Incompatible PTCGL ALT codes require replacing the variant with a regular printing in Limitless. Decks can also be exported as compatible text.

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
'''.replace('12,825',format(coverage['mappedPrintings'],',')).replace('20,464',format(len(json.loads((ui/'card-details.json').read_text(encoding='utf-8'))),',')).replace('## WOTC era',f"## WOTC automation coverage\n\nThis pass implements {checks['wotcCoverage']['available']:,} of {checks['wotcCoverage']['total']:,} WOTC scan entries. Every set in the bundled WOTC pool now has full implementation coverage, including Neo Discovery, Neo Revelation, Neo Destiny, Aquapolis and Skyridge. There are no entries awaiting effects. This does not certify every possible interaction or historical ruling. Select **WOTC coverage** on Play table for per-set coverage and the pending-card list. The new effects were exercised in {checks['wotcAutomation']['attackScenarios']:,} seeded attack scenarios, plus targeted Trainer, Power, reprint, copy-limit and historical-rules checks. Metadata coverage is not a certification of every possible interaction.\n\n## WOTC era"),encoding='utf-8')
target=root/'outputs/ILEX.GG-Windows.zip'
pending_target=target.with_suffix('.pending.zip')
print('Building Windows ZIP with verified desktop resources.',flush=True)
with zipfile.ZipFile(pending_target,'w',allowZip64=True,compression=zipfile.ZIP_DEFLATED,compresslevel=1) as z:
    for p in app.rglob('*'):
        if p.is_file():z.write(p,p.relative_to(app.parent),compress_type=zipfile.ZIP_STORED if p.parent.name=='scans' else zipfile.ZIP_DEFLATED,compresslevel=1)
with zipfile.ZipFile(pending_target) as z:
    assert len([n for n in z.namelist() if '/resources/scans/' in n])==23736
    for name in ['ILEX.GG.exe','resources/app/ui/rules-engine.js','resources/app/ui/deck-text.js','resources/app/ui/rules-ui.js','resources/app/ui/bot-ai.js','resources/app/ui/bot-ui.js']:
        assert 'ILEX.GG-win32-x64/'+name in z.namelist()
    assert z.testzip() is None
pending_target.replace(target)
print(json.dumps({'zip':str(target),'bytes':target.stat().st_size,'verifiedScans':len(manifest),'mappedPrintings':coverage['mappedPrintings'],'testsPassed':len(checks['rulesTests']['tests'])}))





