# WOTC automation progress — October 12, 2026

The user's request to automate all remaining WOTC cards is **unfinished**. Latest generated development coverage is **1,501 / 1,793 actual bundled scan entries**, with **292 pending**; more source implementations are being added. This brings completion to 442 of the original 734 requested entries. The installed executable and ZIP remain at **1,363 available / 430 pending**. Never equate scans/metadata with implemented interactions. Continue the remaining effects; the user requested completion of the whole WOTC era.

Kenneth requested implementing the remaining effects in larger batches, then error checking afterward. Defer repeated broad tests, native verification and ZIP packaging until the implementation pass is complete. Candidate coverage is separate from the verified executable; unknown clauses remain pending. The already-running development checks finished successfully at 1,376 available: 129 checks, 1,724 seeded WOTC attack scenarios, 634 Base–Fossil scenarios and all three bot difficulty games. This candidate has not been installed, native-tested or packaged.

The implementation-first batch adds field/coin/conditional damage; optional Energy discards across all own Pokémon; recovery, top-deck inspection, mill and hand effects; linked Leer/Growl/Snivel/Intimidate durations; persistent Freeze/Spider Web/Octazooka locks; next-turn attack base damage; Hyper Needle/Ancestral Memory once-per-play limits; typed Technical Machines; Fairy Power/Take Away/Call of the Night returns; additional searches, healing and evolution attacks; and activated/evolution Powers including Bubble Turn, Drive Off, Solar Power, Carry Off, Jet Stream, Energy Recharge, Flower Supplement, Fire Recharge, Super Dynamo, Plunge, Beating Wings, Evolution Helper and several Unown letter combinations. These are candidate implementations, not validated release claims. Build-only checks have succeeded; broad interaction tests are deferred as requested.

The bundled Unown J promo #38 scan was visually checked: JOIN requires Unown N. `wotc-library.cjs` corrects the upstream "Unown Dragon" transcription before compilation. AddMarkerEffect now identifies its marker as an attack or Trainer effect, so attack-effect removal can clear new persistent markers. Remaining attack-copy delegation/session/cost problems described in prior work still need implementation; never enable copies while ignoring required costs or copied Powers. The readable audit at 1,501 available has 116 unhandled attack texts; Power/rule inventories include already-implemented clauses on otherwise blocked cards.

Fully available sets: Base Set (102), Jungle (64), Fossil (62), Base Set 2 (130), Team Rocket (83), Southern Islands (18), Legendary Collection (110).

Per-set availability and unavailable IDs are in `work/desktop/ui/wotc-coverage.json`, visible through Play table's WOTC coverage button (expand Match settings during a game). Detailed printed clauses still needing implementation are in `work/rules-research/wotc-automation-pending.json`. These entries remain blocked in enforced matches.

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

Run `node work/desktop-build/wotc-backlog-audit.cjs` after a generator pass to refresh the readable inventories. Currently 233 distinct unhandled attack texts remain. The Power/rule inventories contain all printed text on blocked cards, including interactions that may already have a handler while a different effect remains missing. The primary historical Expedition rulebook text is stored in `work/rules-research/WOTCE1.txt`.

Executable: `outputs/ILEX.GG-win32-x64/ILEX.GG.exe`. Archive: `outputs/ILEX.GG-Windows.zip`. Packaging includes coverage JSON and honest README caveats. Normal launches keep Chromium sandboxing; isolated hidden tests use `--no-sandbox` because of execution restrictions.

Future feature requests are in the root `FEATURE-BACKLOG.md` and must stay planned until Kenneth requests implementation. Keep app data in `%APPDATA%\TCG Lab` and preserve decks, custom cards, formats, saved journals, native launch, Celebi Prime theme, previews, tabletop drag/drop and bots.


The next batch adds typed Poke-Power locks without suppressing Bodies or Pokemon Powers, Terraforming, Earth Rage, Strange Spiral, Lolling About, Special Delivery and Cunning. Dragon Tornado and Spiral Aura check actual remaining HP before switching; Psychic Leaf counts Energy units and heals actual damage. Older Swift wording and defensive coin/copy-session bypass are supported. Additional coin/status, self-counter, healing, pre-damage optional switch and mill clauses are compiled. New targeted checks cover Power type distinctions, duration, private inspection, top-deck placement, knockout prizes and DCE counting. All 114 checks, 1,704 WOTC attack scenarios, bot games and fresh/restored native v5 checks passed.

Current user scope: WOTC-era card interactions and historical formats only. Unlimited and interactions with later-era cards are deferred. The attack sweeps and bot fixtures use WOTC cards; shared-engine regression checks remain. The second verified batch adds Amnesia, Scary Face with corrected one-opponent-turn cleanup, typed surplus Energy damage, private hand/deck effects, Major Tsunami, Crystal Body, Blindside and conditional Triple Spin. Attack-marker probes now report whether the marker was actually added, so old markers cannot circumvent renewed effect protection. Full 122 checks and 1,704 WOTC attack scenarios plus v6 desktop restoration passed. Source work on return-to-hand attacks is in progress and is not part of this verified build yet.
