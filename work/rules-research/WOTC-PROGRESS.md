# WOTC automation progress — October 13, 2026

## Complete WOTC implementation checkpoint — October 13, 2026

Kenneth authorized finishing the final 75 entries. Source and installed desktop now contain **1,793/1,793 WOTC scan entries, zero pending**. Neo Discovery is 75/75, Neo Revelation 66/66, Neo Destiny 113/113, Aquapolis 186/186 and Skyridge 182/182. All other WOTC sets retain full implementation coverage. This checkpoint supersedes the historical stop-after-Gym-Challenge notes below. Coverage is not certification of every possible interaction or ruling; Unlimited/later-era cross-pool work remains deferred.

Validation passed: **93 final-set checks / 1,368 seeded attack scenarios**, **129 shared engine/import/Base–Fossil checks / 634 scenarios**, **68 WOTC checks / 2,510 scenarios**, Gym Heroes 60 checks / 302 scenarios, prior three sets 67 / 682, Gym Challenge 77 / 322, seven undo checks, and eleven bot checks including games at every difficulty. Fresh and restored native desktop profile **v24** passed, including exact saved journals, full coverage, printed deck limits, drag, search, visual decks, audio and foil.

Shared changes include whole-clause registration, attack-only copy delegation with safe cyclic Sketch, completed-attack/in-play snapshots, linked Active markers, pre-retreat triggers before costs, damage-based survival after reductions, hand-entry versus evolution timing, physical Energy transfers and pre-knockout Tool choices. Hot Plate uses shared Power damage, including Metal reduction. Printed singleton and combined Unown limits also apply to deck validation/filtering. Pineco Neo Discovery 61 was scan-reviewed for its ordered two-coin Burst. A native Parasect missing-source guard and Secret Plan partial movement-context guard were corrected during regressions.

Engine SHA-256: `a50c88f42a98edba51f56c8323d9eff66dadb404380922a541c2fdcf3d2ada2c`. Previous verified UI is retained at `work/verified-ui-before-wotc-final`. Build sequence: wotc-library.cjs → build-rules.cjs → catalog.cjs → wotc-final/shared/previous-set/undo/bot tests → install UI → native fresh/restored v24 → package-ilex.py. Release: executable and ZIP updated (2,752,897,531 bytes). All 23,736 scan SHA-256 hashes and every archive CRC passed. The verification report records complete WOTC coverage and the final-set suite.


## Promo foil desktop update

Kenneth requested foil support for promos with holo printings. `promo-finishes.json` now bundles 1,790 English TCGdex finish records across promo-related collections: 1,000 entries with holo/reverse-holo availability, 790 without, and 107 with mixed normal/foil finishes. The API fields alone missed Venusaur promo 13 and Cool Porygon promo 15; their bundled English scans were visually reviewed and explicit positive corrections are retained by `work/desktop-build/promo-finishes.py`. The same review inspected Team Rocket's Meowth 18 and Scizor 33 scans and retained their source classifications. `PROMO-FOIL-SOURCES.md` records provenance and source limitations; these counts are metadata coverage, not independent proof of every physical finish/variant.

Foil eligibility reads the bundled finish records, preserves non-foil entries and applies artwork masks to vintage holo promos. Reverse holos retain a broader sheen. Mixed-finish entries expose a saved Animated foil on/off choice in the inspector; this changes the overlay rather than the scan, printing ID, deck counts or game journal. The runtime reads local JSON and needs no network access. Native profile `work/desktop-ilex-wotc-tests-v20` passed fresh and restored launches, normal Mew 8 versus holo Mew 9, reviewed Venusaur/Cool Porygon, reverse Entei, modern SWSH001, mixed-finish selection and persistence. Existing hidden-card, reduced-motion, pointer, deck, search, format-removal, undo, bot and drag checks passed. The updated preview displays Venusaur promo 13.

Executable and ZIP are released. All 23,736 scan hashes and archive CRCs passed. ZIP size: **2,752,725,136 bytes**. Packaged verification includes `promoFoil`. The card-effect engine and WOTC coverage remain unchanged at 1,718 available / 75 pending; five backlog features remain pending. Wait for the next instruction.

## Animated foil desktop update

Kenneth selected animated foil overlays from the backlog. `catalog.cjs` now retains printing rarity in bundled metadata. `foil.js`/`foil.css` add pointer-reactive sheen and sparkle to known holo-or-higher face-up scans in the library, visual decks, tabletop, inspectors and magnified previews. Vintage holo masks are confined to the artwork area, with orientation correction for opposing tabletop cards; higher rarities use a broader front sheen. Non-holo same-name printings and hidden card surfaces are excluded. Decorative layers are inaccessible and pointer-transparent, never dispatch actions, and respect reduced-motion preferences. Unknown rarity is not assigned based on name. The Scarlet & Violet normal-Rare foil exception is documented with its official source in RULES-SOURCES.md. This is a stylized effect, not reproduction of every physical foil pattern/variant.

Native profile `work/desktop-ilex-wotc-tests-v19` passed fresh and restored launches, classification checks for holo/common/non-holo same-name printings, pointer coordinates, preview coverage, no game-state mutation and hidden-card exclusion. Chromium reduced-motion emulation verified no pointer-driven movement and no transition. Existing search, visual deck, format removal, undo, saved-journal, bot controls and drag checks passed. The enlarged vintage card was visually reviewed and its mask refined to fit the artwork frame. `foil-tests.json` and packaged `animatedFoil` record the checks; preview is `outputs/ILEX.GG-foil-preview.png`.

Updated executable and ZIP are released. All 23,736 bundled scan hashes and archive CRCs passed. ZIP size: **2,752,707,223 bytes**. Card-effect engine and WOTC coverage remain unchanged at 1,718 available / 75 pending; mapped printings remain 14,124. Five backlog features remain pending. Wait for the next instruction.

## Attack/ability search desktop update

Kenneth selected attack/ability search from the backlog. Card library search now indexes names/IDs, attack names and ability/Pokémon Power names from bundled or cached text. Scopes limit matching to names/IDs, attacks, or abilities/Powers; the default searches all those fields. Matching names appear beneath results. Set/custom filters, partial names, case/accent normalization, input focus and pagination continue to work. A cache keyed by card and metadata references avoids rebuilding name fields on each keystroke and refreshes for imported custom cards or newly cached inspection text. Cards without available text retain name/ID matching. No network requests are issued by search.

Fresh and restored hidden desktop checks passed in `work/desktop-ilex-wotc-tests-v18`, including Damage Swap, Confuse Ray, separate search scopes, set filters, custom attack/ability names, cache refresh, focus and pagination. Search layouts at widths 900 and 1920 fit without horizontal overflow; the native preview was inspected. Existing visual-deck, format-removal, undo, saved-journal, bot and drag checks passed. The intermediate v17 restored run timed out during a hidden preview wait; resize settling and bounded preview waits with actual-loaded-image assertions were added, and v18 passed. Failed artifacts remain retained.

Updated executable and ZIP are released. All 23,736 bundled scan hashes and archive CRCs passed. ZIP size: **2,752,648,313 bytes**. Desktop verification includes `attackAbilitySearch`; preview is `outputs/ILEX.GG-attack-search-preview.png`. The card-effect engine and WOTC coverage remain unchanged at 1,718 available / 75 pending. Six backlog features remain pending. Wait for the next instruction.

## Undo Action desktop update

Kenneth authorized Undo Action for local rules matches and bot games. The button restores the previous human decision and its automatic effects from the action journal, including pending choices and finished games. Persisted undo boundaries survive save/load. Older saves derive boundaries from non-prompt player actions. In bot mode, subsequent bot responses are rewound with the human decision, pending bot timers are cancelled, and the bot pauses until resumed. The bot does not approve/deny undo. Kenneth's future online-multiplayer requirement is recorded in FEATURE-BACKLOG.md: the opponent must approve or deny an undo request before either side rewinds. Networking remains pending.

Validation: 34 shared baseline checks plus **7 focused undo checks** passed, covering attachments/card order/randomness, paid Trainer prompts/cost restoration, attacks/checkup/draws, knockout/Prize/promotion, conceded games, bot responses and legacy saves. All three bot difficulty games passed (11 checks). Fresh and restored hidden native profile `work/desktop-ilex-wotc-tests-v16` passed, including the Undo Action controls, bot timer cancellation, no approval dialog, and exact persisted journal/deck/undo-history restoration. The v15 restore check exposed test helpers omitting undo metadata while temporarily swapping matches; those helpers now preserve it. Failed artifacts are retained.

The executable and ZIP are updated; desktop verification includes the focused undo report. All 23,736 scan hashes and ZIP CRCs passed. ZIP size: **2,752,644,961 bytes**. The card-effect engine and WOTC coverage remain unchanged at 1,718 available / 75 pending. Seven backlog features remain pending. Wait for the next instruction.

## Format removal desktop update

Kenneth requested removing unwanted formats while retaining creation. Every built-in/custom format now has a removal control. The dialog preserves deck cards and offers a replacement format or an unassigned state for affected decks. Removing all formats is supported; creation remains available. Unassigned decks require a format for validation and enforced matches. Removed preset IDs persist in the workspace/export and are respected by WOTC migration. Existing rules-match specs stay unchanged; manual games retain their original prize count when a format is removed. New decks choose the first remaining format instead of hard-coding Unlimited. Workspace import accepts an empty format list.

Fresh and restored hidden desktop checks passed in isolated profile `work/desktop-ilex-wotc-tests-v14`: cancellation, replacement, preserving card quantities/current journal, deleting the final format, subsequent format creation, and removed-preset persistence all passed alongside visual decks, imports/exports, bots, dragging and widescreen checks. The engine and WOTC coverage remain unchanged at 1,718 available / 75 pending. The other eight planned features remain pending. All 23,736 bundled scan hashes passed; the packaging script verifies ZIP CRCs before replacing the released archive. Wait for the next instruction.

## Visual decklist desktop update

Kenneth selected visual decklists from the backlog after Gym Challenge. My decks now displays scans grouped into Pokémon, Trainers and Energy, with copy badges, quantity editing, click inspection and right-click magnification. Unknown cards and missing/custom artwork have readable placeholders. Limitless text import/export and existing deck storage are preserved. The backlog marks only this feature complete; the other eight remain pending. No additional card effects were implemented, so WOTC coverage remains 1,718 available / 75 pending.

Fresh and restored hidden desktop checks passed with isolated profile `work/desktop-ilex-wotc-tests-v13`. Tests verify loaded scans, category/printing counts, quantity increment/decrement, previews without mutation, broken-image fallback, exports, exact saved-journal restoration, bots, tabletop dragging, and visual-deck layouts at widths 900 and 1920. The intermediate v11 fixture failed due to a duplicate test variable and is retained; v12 passed before final fallback/layout checks. The source engine is unchanged from the Gym Challenge checkpoint. Packaged desktop verification includes `visualDecklists`; all 23,736 scan hashes and ZIP CRCs passed. Updated ZIP: 2,752,639,735 bytes. Preview: `outputs/ILEX.GG-visual-deck-preview.png`. Previous UI/helper backup: `work/verified-ui-before-visual-decks`. Wait for the next feature or set instruction.

## Gym Challenge validated desktop checkpoint

Gym Challenge is **132/132 implemented and validated**. All 28 entries remaining at the start of this pass are now available. Source, installed executable and ZIP coverage agree at **1,718/1,793 WOTC entries available, 75 pending**. Remaining counts: Neo Discovery 15, Neo Revelation 12, Neo Destiny 20, Aquapolis 14, Skyridge 14. No other set was deliberately implemented during this pass. Stop here and wait for Kenneth's next set instruction. Planned features remain pending.

Validation:
- **77 dedicated checks**, including 34 shared baseline checks, and **322 Gym Challenge attack scenarios** under two deterministic seeds. Additional tests cover Roaring Flames costs before Confusion, Focus Energy base/coin/recoil separation, partial Bonfire costs, Psychic Control copying and paid costs, Secret Plan reveal/discard behavior, pending-choice and completed journal restoration, concealed bot forecasts, and Brock's Protection movement provenance.
- Final shared checks passed: **129 engine/import/Base–Fossil checks**, **634 Base–Fossil attack scenarios**, **68 WOTC checks / 2,410 compiled attack scenarios**, **60 Gym Heroes checks / 302 scenarios**, **67 next-three-set checks / 682 scenarios**, and all three bot difficulty games (11 checks).
- Fresh and restored hidden desktop launches both exited 0 using isolated profile `work/desktop-ilex-wotc-tests-v10`. Exact journal/deck restoration, scan previews, import/export, bot controls, drag/drop and 900/1920/2560-width layouts passed. Native checks include Gym Challenge coverage and concealed-card reveal controls. Normal launches retain Chromium sandbox settings; the hidden helper retains its documented restricted-environment override. The user's ordinary workspace was not changed by these tests.
- Packaging completed. All **23,736 bundled scan SHA-256 hashes** and every ZIP CRC passed. `outputs/ILEX.GG-Windows.zip` is **2,752,636,368 bytes**; `outputs/ILEX.GG-win32-x64/desktop-verification.json` includes the Gym Challenge report and installed engine hash. Engine SHA-256: `56b7d66b1ee67bbd222e3a974c31265476a18079fc1a1cb1ea57d545249477ca`. The previous installed UI/helper is retained in `work/verified-ui-before-gym-challenge`.

Shared framework fixes include nested continuation ordering (finish inner reactive effects before resuming an enclosing attack/Trainer), after-damage Koga Poison, Scram at the damage point before later status, provided-Energy conversion after native Energy-map construction, whole-stack versus individual attachment movement, and Power-damage reactions/Metal reduction. Secret Plan uses a stable concealed Basic proxy, restores underlying identities on reveal/leaving play, preserves attachments and discards non-Basics without a Prize. Bot trial states mask opposing concealed identities and use finite HP forecasts; read-only queries do not mutate live hidden cards. Group Attack restores original deck order when declined, avoiding upstream choice sorting. Focus Energy preserves printed Quick Attack coin bonuses while changing base damage.

Printed scans, corrections and source limitations are recorded in `work/desktop/ui/RULES-SOURCES.md`. Shock Blast's Weakness/Resistance interpretation is corroborated by the TCG ONE implementation release note; a separate direct WotC transcript for that point was not located. Passing these bounded checks does not certify every possible combination, historical ruling or later-era Unlimited matchup. The full WOTC request remains unfinished until the remaining 75 entries are implemented and validated. Older checkpoints below are historical.

## Gym Challenge candidate checkpoint

Kenneth authorized Gym Challenge next. All 28 previously pending entries now have candidate implementations: Gym Challenge 132/132, WOTC 1,718/1,793 available, 75 pending. The installed executable and ZIP remain the preceding verified 1,690-entry release until shared tests, native checks and packaging pass.

The initial focused suite passed 71 checks and 322 seeded attack scenarios after fixing nested prompt continuation ordering. This candidate checkpoint is historical; the completed validation and release are recorded above. Candidate coverage alone is not a certification of every possible interaction. Other sets and planned features remain deferred.

## Next-three-set validated desktop checkpoint

Expedition **165/165**, Wizards Black Star Promos **53/53**, and Neo Genesis **111/111** now pass the dedicated interaction and set-wide attack checks. The updated desktop resources are installed at `outputs/ILEX.GG-win32-x64/ILEX.GG.exe`. Current source and executable coverage: **1,690/1,793 available, 103 pending**. Remaining counts: Gym Challenge 28, Neo Discovery 15, Neo Revelation 12, Neo Destiny 20, Aquapolis 14, Skyridge 14. Incidental matching Paint/Pure Body effects account for two entries beyond the sixteen originally selected; no additional set was deliberately implemented.

Validation:
- **67 dedicated checks**, including 34 shared baseline checks, and **682 attack scenarios** across all three sets under two seeds.
- Final shared run passed **129 engine/import/Base–Fossil checks**, **634 Base–Fossil attack scenarios**, and the WOTC suite's **68 checks / 2,368 compiled attack scenarios**. The Gym Heroes suite passed **60 checks / 302 attack scenarios**. All three bot difficulty games passed (11 bot checks).
- Fresh and restored hidden desktop launches both exited 0 using isolated profile `work/desktop-ilex-wotc-tests-v9`. Imports, rollback, saved-journal restoration, scan previews, bot controls, drag/drop, 900/1920/2560-width layouts and visible persistent-counter labels passed. The first v8 attempt exposed a randomized drag fixture failure; v9 uses an isolated match with journaled legal setup/shuffle choices. Failed v8 artifacts are retained. Normal launches retain Chromium sandbox settings; the test helper retains its documented restricted-environment override.
- Packaging completed successfully. All **23,736 bundled scan hashes** and every ZIP CRC passed. The released archive is `outputs/ILEX.GG-Windows.zip` (2,752,621,204 bytes), and `outputs/ILEX.GG-win32-x64/desktop-verification.json` includes the next-three-set report and installed engine SHA-256. Source and released executable/ZIP coverage now agree at 1,690 available / 103 pending.

Interaction fixes include Focus Band initialization/Tool cleanup, Chain Reaction's evolution route and self-trigger exclusion, copied-attack cost filtering, Lightning Bolt's single Active damage packet before modifiers, legal-play checks and prepaid-cost replay for Mind Games, Char/condition/Darkness checkup ordering, and Ecogym movement provenance. A real-deck journal test restores both paid-cost and pending-coin Slowking states exactly. Physical counter labels are visible in the tabletop and action dock; passive Powers are excluded from manual actions and bot candidates. Shared PokemonCardList movement preserves attachment aliases without duplicate Tool/converted-Energy moves.

Historical reference and printed interpretation details are in `work/desktop/ui/RULES-SOURCES.md`, including the local English Expedition rulebook and archived WotC Rules Team transcript. Lightning Bolt's 10+20 marked-Active interpretation follows its printed damage/effect text; no separate official clarification was located. Passing these tests does not certify every possible interaction, historical ruling or later-era Unlimited matchup. **Stop after completing packaging for these three sets; wait for Kenneth's instruction before beginning another set.** Planned features remain pending in FEATURE-BACKLOG.md. The older candidate and Gym Heroes checkpoints below are historical.

## Next-three-set candidate checkpoint

Kenneth authorized completing Expedition, Wizards Black Star Promos and Neo Genesis next, selected by their remaining counts (2, 6 and 8). The current model is retained at his request. AGENTS.md records this scope.

Candidate source coverage is **1,690/1,793 available, 103 pending**, including incidental shared matches. Expedition (165/165), Black Star Promos (53/53) and Neo Genesis (111/111) have candidate implementations; they are **not yet certified complete or released**. The executable and ZIP still contain the Gym Heroes checkpoint below (1,672 available, 121 pending).

`node work/desktop-build/next-three-tests.cjs` currently passes **48 checks**, including 34 shared baseline checks. Fin Slap's fixture now retains its high-HP defender so the damage assertion does not inspect a cleared knocked-out stack. This does not replace a set-wide attack sweep or the shared regression/native release checks.

Before release, finish targeted coverage for Chain Reaction, Focus Band, Protective Flame/Bolt, Lightning Rod, Char checkup ordering and copied-attack prerequisites. Review Mind Games legal-play preflight before charging costs or offering cancellation (the existing CAN_PLAY_TRAINER_CARD prefab is not a generic effect probe: it returns false when a Trainer lacks canPlay). Validate Ecogym movement provenance, shared PokemonCardList movement changes, pending-prompt replay and passive-Power UI/bot handling. Resolve uncertain Lightning Bolt marked-Active damage and Char ordering against authoritative text/rulings. Then run all three sets' attack sweeps, shared WOTC/Gym Heroes regressions and bots, fresh/restored native verification, and package the updated executable. Keep these candidate results separate from the verified build until that work passes.

## Gym Heroes completion checkpoint

Kenneth requested finishing Gym Heroes first and then stopping for his instructions about the next set. **Gym Heroes is 132/132 implemented and validated.** The 22 entries remaining at the start of this pass are now available. Do not begin another set without Kenneth's instruction.

Current source and updated executable coverage: **1,672/1,793 WOTC scan entries available, 121 pending**. The full-era request is still unfinished. Best of Game incidentally reached 9/9 through the shared Rocket's Moltres implementation. No other set was deliberately implemented in this pass. Earlier historical checkpoints below describe older builds and are retained as history.

Validation for this checkpoint:
- 60 dedicated checks (including 34 shared setup/historical rules checks), plus **302 Gym Heroes attack scenarios** under two seeded coin branches. All 132 entries are mapped, and every Gym Heroes Pokémon has printed length metadata.
- Full shared suite passed: **129 checks, 2,338 compiled WOTC attack scenarios and 634 Base–Fossil scenarios**. The final No Removal Gym preflight and Recall duplicate-name adjustments were additionally checked by the latest dedicated and focused shared suites and bot games.
- All three bot difficulty games passed. Fresh and restored desktop profile `work/desktop-ilex-wotc-tests-v7` both exited successfully. The normal executable retains Chromium sandbox settings; only the isolated hidden test helper uses the established restricted-environment override.
- Updated executable and ZIP are released at 1,672 available / 121 pending. ZIP packaging completed successfully, rechecking all 23,736 scan hashes and every archive CRC. `outputs/ILEX.GG-win32-x64/desktop-verification.json` includes the dedicated Gym Heroes report.

Implemented Gym Heroes effects: Bench Guard, Flee, Crosscounter, Fire Wall/Rebirth, Shadow Images, Shell Armor, Crystal Beam, Energy Loop, both Lt. Surge and Misty printings, The Rocket's Trap, Blaine's Quiz #1, Charity, No Removal Gym, Recall, Sabrina's ESP, Tickling Machine, Vermilion City Gym, Misty's Duel and Narrow Gym.

Framework additions:
- Optional damage redirection and reactions run before knockout cleanup, with captured damage amounts. Flee preserves attack attribution through native status helpers and blocks remaining effects on the original defender.
- Typed return costs are paid before Confusion; copied attack choices carry the actual source and costs. Attack-only compiled copy handlers avoid importing source Powers, while shared damage tracking and linked defensive effects remain available to copied attacks. Some original clauses still use native fallback; do not claim all copy edge cases have been certified.
- Temporary attachments use ordinary Trainer attachment behavior rather than consuming a Tool slot. Charity returns to hand, ESP discards at turn end and re-flips the whole coin sequence once.
- Hidden random hand selection uses the match's recorded seeded randomness. Tickling Machine stores cards in a separate hidden CardList and restores them at the end of the affected player's next turn. RPS choices are submitted together, logged secretly and ties repeat; the printed coin alternative is supported.
- Bench-size handling supports opponent-first returns to hand with all attachments. No Removal Gym checks legal removal targets before charging its two-card surcharge.
- Recall's added attacks are exposed in the desktop action buttons and bot candidates. Same-named attacks from earlier stages receive a source-name label and retain their own costs/damage.
- `wotc-card-lengths.json` contains scan-derived quiz measurements. OCR ambiguity images and results are retained in rules-research. Legacy unreadable fields use corroborating printings of the same species; reviewed printing differences remain explicit (Neo Discovery Poliwhirl is 3'3"). Card-E eligibility depends on an actual printed length, following the official WotC team update archived at https://www.pojo.com/Features/Sept2002/91702-Bling.html . No later-era lengths were added.

Build steps remain generator → rules bundle → catalog → dedicated Gym Heroes/shared tests → bots → install → native fresh/restored v7 → package. The native/package helper paths were advanced from v6 to v7. Keep planned features pending in FEATURE-BACKLOG.md.

## Earlier checkpoints (historical)

The user's request to automate all remaining WOTC cards is **unfinished**. Latest generated development coverage is **1,649 / 1,793 actual bundled scan entries**, with **144 pending**; more source implementations are being added. This brings completion to 590 of the original 734 requested entries. The installed executable and ZIP remain at **1,363 available / 430 pending**. Never equate scans/metadata with implemented interactions. Continue the remaining effects; the user requested completion of the whole WOTC era.

Kenneth requested implementing the remaining effects in larger batches, then error checking afterward. Defer repeated broad tests, native verification and ZIP packaging until the implementation pass is complete. Candidate coverage is separate from the verified executable; unknown clauses remain pending. The already-running development checks finished successfully at 1,376 available: 129 checks, 1,724 seeded WOTC attack scenarios, 634 Base–Fossil scenarios and all three bot difficulty games. This candidate has not been installed, native-tested or packaged.

The implementation-first batch adds field/coin/conditional damage; optional Energy discards across all own Pokémon; recovery, top-deck inspection, mill and hand effects; linked Leer/Growl/Snivel/Intimidate durations; persistent Freeze/Spider Web/Octazooka locks; next-turn attack base damage; Hyper Needle/Ancestral Memory once-per-play limits; typed Technical Machines; Fairy Power/Take Away/Call of the Night returns; additional searches, healing and evolution attacks; and activated/evolution Powers including Bubble Turn, Drive Off, Solar Power, Carry Off, Jet Stream, Energy Recharge, Flower Supplement, Fire Recharge, Super Dynamo, Plunge, Beating Wings, Evolution Helper and several Unown letter combinations. These are candidate implementations, not validated release claims. Build-only checks have succeeded; broad interaction tests are deferred as requested.

The bundled Unown J promo #38 scan was visually checked: JOIN requires Unown N. `wotc-library.cjs` corrects the upstream "Unown Dragon" transcription before compilation. AddMarkerEffect now identifies its marker as an attack or Trainer effect, so attack-effect removal can clear new persistent markers. Remaining attack-copy delegation/session/cost problems described in prior work still need implementation; never enable copies while ignoring required costs or copied Powers. The readable audit at 1,501 available has 116 unhandled attack texts; Power/rule inventories include already-implemented clauses on otherwise blocked cards.

Fully available sets: Base Set (102), Jungle (64), Fossil (62), Base Set 2 (130), Team Rocket (83), Southern Islands (18), Legendary Collection (110).

Per-set availability and unavailable IDs are in `work/desktop/ui/wotc-coverage.json`, visible through Play table's WOTC coverage button (expand Match settings during a game). Detailed printed clauses still needing implementation are in `work/rules-research/wotc-automation-pending.json`. These entries remain blocked in enforced matches.


## October 13 continued implementation batch (candidate only)

Latest generated source is 1,649/1,793, with 144 pending. This continuation added 24 entries from the preceding 1,625 checkpoint. Bundle compilation passes; no broad tests, native checks, installation or ZIP packaging have been run. The executable remains 1,363 entries and the last full development tests remain 1,376.

New shared elements:
- Active-only stat overrides for Giant Growth; hand-evolution locks that leave attack/Power evolution available; opponent devolution with effect-protection probes; typed optional Energy discards; asymmetric Energy-movement choices and switching the player with fewer Energy cards.
- `CheckSleepRecoveryEffect` for Deep Sleep. Ancient Wind has a turn-scoped Body-suppression flag; test original native Bodies as well as compiled Bodies before release.
- Bounce/Cyclone/Retro Energy use attachment events, eligibility checks, player-chosen switching and optional healing/devolution. Non-hand attachment pathways and attachment-event ordering need final tests.
- Shared Tool attachment/blocked-effect behavior for Berry, Gold Berry, Miracle Berry, Healing Berry and Counterattack Claws. Validate optional between-turn timing versus mandatory turn-start effects, simultaneous knockouts and delayed claw prompts.
- Lt. Surge's Treaty, Sabrina, Hyper Potion, Baton Pass and Electric Blast use shared Prize, Energy movement, healing and counter-distribution logic. UI and bots now preserve original Prize indices after slots empty. Treaty's helper callback positions were checked and corrected.
- `prefabs/place-pokemon-as-basic.ts` handles Fossil Egg, Underground Lake, Revive Friends and Revive Fossil. Temporary stage metadata follows revived cards in play and is restored by CardList movement to non-Pokemon zones. Empty Bench placement uses SelectPrompt, not ChoosePokemonPrompt, whose UI omits empty slots. Test evolution/devolution, recall to hand/deck, knockout cleanup and replay.
- Delegated copy contexts now carry required-discard-paid/count information through both synchronous and generator execution; normal announced delegation supplies it. This prevents compiled copied costs from being charged twice.

Copy-framework investigation: CheckPokemonAttacksEffect currently has only an attack list, and the attack action does not set UseAttackEffect.delegateFrom. A shared attack/source mapping is needed for Mimic, Psylink, Prehistoric Memory, Recall, Memory Berry and similar effects. The native playerLastAttack record is written after announcing an attack, even if attack cancellation occurs, and lacks a turn/in-play snapshot; do not use it alone to enable Sketch/Earthdrill. Attack-only source reducers for original WOTC cards are needed to prevent copied source Powers (such as Machamp's Strikes Back) from bleeding into copied attacks. Compiler-generated per-attack copy plans could cover originals, including Base/Jungle/Fossil prototypes currently skipped by the WOTC registration loop. Keep unknown clauses pending rather than enabling incomplete copies. Bot-cloned copy-session state remains unresolved.

A primary compendium fetch for Blaine's Charizard errata failed; Roaring Flames remains pending. Do not infer its errata from third-party summaries alone. Unknown timing and hidden-card interactions also remain pending. Continue the implementation pass, then perform the full validation/release sequence.

## October 13 framework checkpoint (candidate only)

Kenneth requested continuing WOTC implementation while building shared logic that makes interaction fixes apply across the pool. Source coverage is 1,625/1,793 (168 pending); installed executable and ZIP remain the verified 1,363/1,793 build. The current candidate has only passed bundle compilation, not the broad interaction or native release checks. Do not install/package it as verified yet. The previous full development tests were at 1,376 entries, as stated above.

Shared work now includes:
- `state/active-switch-lock.ts`: one source-bound/duration-aware check used by retreat and effect-driven switching. Poison Bind, Jaw Clamp and Sticky Nectar use it. Confirm all old WOTC switch callers supply state before release.
- `AfterEnergyAttachedEffect` and `prefabs/wotc-energy-attachment.ts`: consistent post-attachment events across hand, deck and discard; movement of existing Energy remains distinct. Sequential attachments wait for triggered prompts. Triggered Poison records a defender marker and duration. Pure Body, Conductivity, Crystal Type and other attachment effects require ordering checks.
- Distinct Energy-choice units, matching for mixed costs and surplus Energy, Crystal Energy, and `prefabs/energy-card-requirements.ts`: Energy-card discards match distinct cards and filter choices using the remaining requirements. Lugia pays its mixed required discard before attack cancellation; Shining Charizard uses the same selector for its effect discard. Check Rainbow/Crystal/Double Colorless and copied-cost cases.
- Damage filters now support both minimum and maximum thresholds; timed halving/reduction can cover Power damage where printed. Exact-HP survival uses `>=` so Fortitude and existing survive-at-10 effects share the corrected behavior. Damage counters remain distinct from damage.
- `CheckTechnicalMachineAttachmentEffect`: typed and evolved attachment restrictions share a permission check; Xatu Synchronicity overrides it through its Body. Typed Cubes and Miracle Spheres share attachment, attack delegation, basic-Energy pair conditions and end-turn discard.
- Repeatable Stadium actions for Celadon/Saffron, once-per-turn Fuchsia and Undersea Ruins actions, and Pokemon Park attachment healing. Only Celadon and Saffron have the repeatable-action flag. Validate action availability, same-turn Stadium replacements and bots.
- `CheckEvolutionTimingEffect`: Giovanni grants a scoped permission tied to the chosen Pokemon card within its evolution stack; it persists through further evolutions during that turn and does not transfer to a replacement Pokemon.
- Shared opponent attachment removal, field damage/counters, named Basic searches, opponent healing/counter selection, optional healing followed by draws/discards, coin-count branches, deck attachments and source-bound protection. New Powers include Primal Aura/Stare, Dark Gaze, Fire Boost, Heat Up, Unown Give/Yield, Good Neighbor, Fragrance Trap, Bolt, Fortitude and Spatial Distortion.

The compiler rewrite encountered text encoding corruption during this pass; it was repaired and coverage regenerated to 1,625. Use explicit UTF-8 for Python reads/writes; Windows default text encoding is not safe for printed Pokemon text and Greek Sphere names.

Remaining concerns to resolve before broad testing/release include delegated-copy costs and source-Power isolation, copy sessions in bot-cloned states, Quicken protection for outgoing Active during gusts, source-bound lock cleanup, surviving/KO trigger prompt order, condition exceptions, original Power damage paths, and attachment timing. Attack-copy sessions were changed from a global list to state-scoped WeakMap sessions during the earlier implementation-first batch; this is not yet verified. Unknown whole cards remain pending. Continue implementing the remaining WOTC cards, then run the full build/catalog/tests/bots/native/package sequence. Next native test profiles should use v7 rather than overwriting the verified v6 evidence.

## Implementation

- `work/desktop-build/wotc-library.cjs`: deterministic build-time compiler, verified reprints, scan/canonical aliases, explicit effects and coverage. It rejects unknown whole-card interactions.
- `work/desktop-build/wotc-attack-patterns.cjs`: additional complete printed clauses for coin tables, damage counters, Energy movement/discards, healing, switching, searches and defensive effects. Punctuation normalization preserves parenthesized sentences.
- `work/rules-research/twinleafgg-main/ptcg-server/src/tcg-lab-wotc.ts`: runtime printing registration, attacks, Trainers and WOTC Special Energy.
- `.../src/tcg-lab-wotc-powers.ts`: explicit Powers, condition restrictions, evolution triggers, Sinkhole and Final Beam.
- Engine changes include original/reprint copy limits, Neo Shining one-copy limits, historical first-turn Supporters, Stare's targeted Power lock/expiry and successful-retreat notification.
- Compiled attacks retain their source and defer status and other subsequent effects until after damage, including conditional effects nested in coin outcomes. Trainer healing uses Trainer/game healing rather than attack healing. New Baby checks precede attack costs and remain active under Special Conditions and Power locks. Crystal Type records the hand attachment and retains its change until turn end or leaving the slot; suppressing its Power after activation does not undo the duration effect.
- Powers added this turn include Energy Connect/Jump/Charge, Electromagnetic Power, Wild Growth, basic-only Rare Metal, retreat modifiers, evolution healing/damage, attachment healing, Energy Barrier, Hard Shell, Relaxing Scent, Gaseous Form and Crystal Type. A card is available only when its other interactions are also implemented.
- Drag destinations now exclude a spent normal Energy attachment while preserving unlimited-attachment exceptions and pending effect choices.
- `work/desktop/ui/rules-ui.js`: offline coverage dialog and Best of Game addition to the unmodified Base–Skyridge preset.

Stare is tested for opponent-turn expiry and switching. Sinkhole fires after successful retreat, not an attempt. Final Beam snapshots types/defenses before KO cleanup removes its source, and is tested for Water Weakness, simultaneous knockouts and excluding Poison knockouts. Power damage does not use attack-only defensive modifiers.

## Build and validation

The resumed pass adds explicit coin/healing/damage tables, Bench coin damage, typed discard recovery, discard-pile damage, simultaneous counter swaps, Light Screen, Swift/Feint Attack defense bypass, and source-bound Mean Look. Required attack costs retain their card count, recognize a singular "a" Energy, accept Energy actually providing ANY, and do not charge twice. Venom Spray and Berserk evolution triggers are implemented. Nine Stadium printings cover coin draw/heal, private top-deck inspection, retreat modifiers, Giovanni evolution healing, Cinnabar Weakness and Sprout Tower reduction. Passive Stadiums apply only while in play; either player may activate an eligible Stadium on the table, and bots consider opponent-owned Stadiums.

For faster development, `node work/desktop-build/wotc-tests.cjs --focused` skips the two broad attack scenario sweeps and writes separate `*-focused-test-report.json` files. Always run the full suite before release; packaging requires full nonzero WOTC scenario coverage. New future ideas must be saved without stopping active work, as requested in AGENTS.md.

Use Node and PowerShell from the project root. Run dependent steps sequentially and wait for each process to complete before moving to the next:

1. `node work/desktop-build/wotc-library.cjs`
2. `node work/desktop-build/build-rules.cjs`
3. `node work/desktop-build/catalog.cjs`
4. `node work/desktop-build/wotc-tests.cjs`
5. `node work/desktop-build/bot-tests.cjs`
6. `node work/desktop-build/install-bot.cjs`
7. `node work/desktop-build/run-test.cjs` (fresh profile and then restoration; current test root is `work/desktop-ilex-wotc-tests-v6`)
8. `work/desktop-build/package-ilex.py` with bundled Python.

Current successful validation: **122 engine/import/interaction checks**, **1,704 seeded WOTC attack scenarios**, plus **634 Base–Fossil scenarios**. These cover damage ordering, Baby costs, counter-vs-damage behavior, Energy-movement limits and conversions, Wild Growth, damage-based healing, Crystal Type duration, explicit no-Weakness recoil, Energy HP/Barrier, defensive thresholds, Trainer costs and zero-Energy discard attacks. Reports are in `work/rules-research` and the test-root folder. Bot games at Easy/Normal/Hard and native UI, coverage dialog, drag/drop, widescreen and exact restoration are included. Package verification hashes all 23,736 scans and validates ZIP CRCs before atomically replacing the previous ZIP.

Run `node work/desktop-build/wotc-backlog-audit.cjs` after a generator pass to refresh the readable inventories. The latest audit has 47 distinct unhandled attack texts; 56 Power texts and 65 rule texts occur on blocked cards. The Power/rule inventories contain all printed text on blocked cards, including interactions that may already have a handler while a different effect remains missing. The primary historical Expedition rulebook text is stored in `work/rules-research/WOTCE1.txt`.

Executable: `outputs/ILEX.GG-win32-x64/ILEX.GG.exe`. Archive: `outputs/ILEX.GG-Windows.zip`. Packaging includes coverage JSON and honest README caveats. Normal launches keep Chromium sandboxing; isolated hidden tests use `--no-sandbox` because of execution restrictions.

Future feature requests are in the root `FEATURE-BACKLOG.md` and must stay planned until Kenneth requests implementation. Keep app data in `%APPDATA%\TCG Lab` and preserve decks, custom cards, formats, saved journals, native launch, Celebi Prime theme, previews, tabletop drag/drop and bots.


The next batch adds typed Poke-Power locks without suppressing Bodies or Pokemon Powers, Terraforming, Earth Rage, Strange Spiral, Lolling About, Special Delivery and Cunning. Dragon Tornado and Spiral Aura check actual remaining HP before switching; Psychic Leaf counts Energy units and heals actual damage. Older Swift wording and defensive coin/copy-session bypass are supported. Additional coin/status, self-counter, healing, pre-damage optional switch and mill clauses are compiled. New targeted checks cover Power type distinctions, duration, private inspection, top-deck placement, knockout prizes and DCE counting. All 114 checks, 1,704 WOTC attack scenarios, bot games and fresh/restored native v5 checks passed.

Current user scope: WOTC-era card interactions and historical formats only. Unlimited and interactions with later-era cards are deferred. The attack sweeps and bot fixtures use WOTC cards; shared-engine regression checks remain. The second verified batch adds Amnesia, Scary Face with corrected one-opponent-turn cleanup, typed surplus Energy damage, private hand/deck effects, Major Tsunami, Crystal Body, Blindside and conditional Triple Spin. Attack-marker probes now report whether the marker was actually added, so old markers cannot circumvent renewed effect protection. Full 122 checks and 1,704 WOTC attack scenarios plus v6 desktop restoration passed. Source work on return-to-hand attacks is in progress and is not part of this verified build yet.

Temporary scan crops in `work/rules-research/quiz-ocr` were retained: the cleanup command was rejected because it required an approval category disabled by the execution policy. The application and ZIP do not include these working files.


### October 13: original audio
Added two forest menu themes and three retro battle tracks, automatic scene switching, saved music/effect volumes, mute and track selection. Cosmetic effects follow committed human/bot actions and manual tabletop logs; rejected moves and replay are silent. Fresh/restored v21 desktop checks and offline renders passed. Card automation remains 1,718/1,793 with 75 pending; no new rule effects were added.


### October 13: deck format filter
My decks now filters by actual deck legality in any selected format. Shared deck validation covers size, copies, set pool, bans, Basic Pokémon and custom permissions. Filtering does not alter card lists or assigned formats; drafts remain accessible via All decks. Card automation coverage is unchanged (75 pending).
