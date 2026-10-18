# Deeper XY interaction audit — 1.13.3

ILEX.GG **1.13.3** completes the deeper XY interaction audit with repairs across printing identity, Ancient Traits, temporary types, named conditions, attack protection, Energy movements and native attack timing.

1. Pyroar Flare Command pays from its own slot on the Bench or Active, accepts attached Fire-providing Energy, and rejects missing costs or targets before payment.
2. XY Venipede uses its printed 70 HP, 20 Poison Sting damage and three-Energy retreat, independently of the BW source constructor.
3. Delta Evolution permission belongs only to the actual trait evolution card being played from hand, not unrelated copies on either field or in hand.
4. Dry Skin queries the current attacker type and respects damage that ignores defender effects.
5. Light of Life recognizes both Yveltal and Yveltal-EX through shared named-condition parsing, including BW copied attacks.
6. Cross Slicer and Time Freeze use attack-effect events, respecting protection and normal switch/turn cleanup.
7. Burning Energy records actual eligible discards before native reducers move cards and returns to the same in-play Pokemon, with negative controls for other attackers and Trainers.
8. A shared attached-Energy view covers regular attachments and Pokemon-as-Energy zones for Enhanced Hammer, Shuppet, Xerosic, Jirachi, Groudon-EX and Dragonite-EX.
9. Energy discards route through attack prevention and the correct physical zone; Xerosic puts each card in its owner discard pile.
10. Stardust grants its shield only after a successful discard from the opponent Active; Bench-only Special Energy and blocked discards do not grant it.
11. Dragonite-EX, Greninja and Pyroar native attack indexes match their printing; Mist Slash uses the normal damage/KO pipeline with correct bypass flags and attacker bonuses; Inferno Onrush applies recoil.
12. Hyper Beam, Rip Claw and Stardust resolve defensive-Energy discards after damage, so Shield Energy still reduces that attack.

Final engine `0b857042401c6731b0a2250cd963fae7d9a35f5b8f97ce80892950821fb6cf68`. **56 new expected-result cases**, complete printed HP/type/retreat/cost/damage audit of **2,208 XY printings** and static native attack-index audit of **1,499 native-backed Pokemon printings** pass. Repeated all 52 original XY focused checks, 2,787 printed Pokemon attacks and both Tool attacks, 1,604 branch cases, Power/Trainer audits, 16 bounded scoped deck games (1200 decisions) with exact replay/Undo, 44 Basic Energy checks and shared historical/bot/Undo regressions. Native **v87 fresh/restored** suites pass, including Town Map and animation recovery. Earlier interrupted candidate runs predate the final Shield Energy timing repair and are historical, not release passes.

Windows EXE and compact/offline ZIPs are updated and integrity verified; all 23,736 scans and 3339 provenance files pass. Android **1.13.3-android.6 / versionCode 6** preserves the original signing certificate, with 59 touch/landscape, 54 presentation checks over three sizes and 28 APK checks passing. Install over the existing APK. Physical Android/emulator acceptance remains pending.

Scope remains BW onward through implemented XY, with Unlimited deferred and older rule profiles retained. No new cardpool, banlist, networking, subagents or GitHub publication. Finite tests do not prove every board state. See `work/rules-research/xy-interaction-release.json`, `package-xy-interactions.py` and `publish-android-xy-interactions.py`.

---

# Basic Energy correction — 1.13.2

ILEX.GG **1.13.2** corrects Basic Darkness Energy receiving the older Special Darkness self-damage and attack bonus. The shared name-based reducer also affected Basic Metal Energy; it is now restricted to printings explicitly labeled Special Energy. Forty-two mapped Basic Darkness/Metal printings, including era Trainer Kits, pass expected-result checks for Energy type/provision, outgoing and incoming damage, and no extra holder damage at end of turn. Two Special Darkness controls (Neo Genesis and EX Ruby/Sapphire) retain their printed behavior, for 44 targeted checks total.

Final engine `6896c3d0e8ca0ece986fbe7f669288916d9ef95742d954ce0838af1a2028607c`. All 52 XY focused checks, 2,787 printed Pokemon attacks, both Tool attacks, 1,604 branch cases, Power/Trainer audits, 16 bounded scoped deck games with replay/Undo and shared historical/bot/Undo regressions pass again. Native v84 fresh/restored suites pass, retaining the Town Map/animation regressions. Prior XY 2,208/2,208 inventory and BW-onward scope remain unchanged; Unlimited remains deferred.

EXE and both Windows ZIPs are updated and integrity verified, preserving all 23,736 scans and source provenance. Android **1.13.2-android.5 / versionCode 5** preserves the original signing certificate; all 59 touch/landscape, 54 additional presentation checks over three sizes, and 28 APK checks pass. Install over the existing APK. Physical Android/emulator acceptance remains pending. Evidence: `work/rules-research/basic-energy-release.json`. Current repair scripts: `package-basic-energy.py` and `publish-android-basic-energy.py`. No subagents or GitHub publication.

---

# XY presentation repair — 1.13.1

ILEX.GG **1.13.1** repairs Town Map's revealed holo Prize layout and attack animation stalls. The inner Prize grid is positioned relative to its own pile without inheriting outer pile offsets; Android's foil host is also explicitly positioned. Grass impact progress is clamped to [0,1], preventing negative ellipse radii. Canvas callback exceptions finish the effect, and a completion timer releases gameplay if animation frames stop. These are presentation changes; engine `16d55cd679249a61253728235c1150e95d2160f4587cdb7751aa58f941b39769` and the complete 2,208-printing XY coverage remain unchanged. Unlimited remains deferred.

Native v83 fresh/restored suites pass, including 18 focused checks each for both Town Map printings with all six holo Prizes, Grass damage continuation, deliberate canvas failure, lost frames and Skip. The same 18 checks pass at Android 800×360, 640×312 and 360×800, alongside all 59 touch/landscape and 28 APK checks. An initial fixture omitted the required Trainer play target; a portrait assertion was corrected to measure pile-relative position rather than page scrolling. Those earlier failed runs are retained as historical evidence.

EXE and both Windows ZIPs are updated and integrity verified, preserving all 23,736 scans and prior provenance. Android **1.13.1-android.4 / versionCode 4** preserves the original signing certificate; install over the existing app. Physical Android/emulator acceptance remains pending. See `work/rules-research/table-repair-release.json`, `package-table-repair.py` and `publish-android-table-repair.py`. No subagents or GitHub publication.

---

# Complete XY release — October 17, 2026

ILEX.GG 1.13.0 is complete and verified locally: **2,208/2,208 XY-era printings, zero pending**. Includes Kalos Starter, XY through Evolutions, all 216 catalog XY promos, six Yellow A alternates, Double Crisis, Generations/Radiant Collection, eight 30-card Trainer Kit decks and McDonald’s 2014–16. Interaction scope is **Black & White onward through implemented XY**, also the standing baseline for future implementation work; Unlimited remains deferred. Preserve all earlier historical rule profiles and UI/cache/pack/audio/Android landscape features. No subagents were used and no GitHub publication occurred.

Final engine: `16d55cd679249a61253728235c1150e95d2160f4587cdb7751aa58f941b39769`. Fifty-two expected-result checks, all 2,787 printed Pokémon attacks plus both Trainer Tool attacks, 1,604 branch cases, Ability/Trainer audits, 16 bounded mixed-deck games (1199 decisions) with exact replay/Undo, shared historical/bot/Undo regressions and native v81 fresh/restored checks pass. Two cached 59-card lists were completed only in cloned rollout fixtures and are identified in the reports; user decks were not changed. Native v79’s restart failure was an inherited screenshot-harness preference cleanup defect, repaired before v80. Raw failing reports remain historical evidence, not final passes.

Windows EXE, compact ZIP and full Offline ZIP are updated and integrity verified; all 23,736 scan hashes and 3333 provenance files pass. Android **1.13.0-android.3 / versionCode 3** uses the exact previous signing certificate, with 59 touch/landscape checks and 28 APK/static checks plus SDK signature/alignment verification. Install over the existing APK to retain local state. **Physical Android/emulator acceptance remains pending**; do not claim device certification or Play Store publication.

Read `work/rules-research/xy-final-release-evidence.json`, `xy-source-validation.json` and `XY-FULL-PROGRESS.md` for exact evidence and finite-test limitations. `stage-xy.py`, `package-xy.py` and `publish-android-xy.py` are the current release scripts. Do not run the old first-wave inventory/checkpoint scripts over the complete XY release. Expanded mechanics now have their own profile; format card pools/bans are separate and no new official banlist is supplied.

The candidate log and prior validation plan below are historical; all required release work is complete.

---

# Complete XY continuation — candidate source, October 17, 2026

Kenneth requested continuing through the rest of XY without stopping. Work remains active until implementation, validation and packaged Windows/Android updates are complete. No delegation is authorized. Interactions are BW onward through implemented XY, with Unlimited deferred; this is the standing baseline for future work.

## Source milestone, not a release

All 2,208 printings have candidate source records and mappings, zero inventory pending. Includes XY0–12, all 216 catalog XY promos, six Yellow A alternates, Double Crisis, Generations/Radiant Collection, all eight 30-card Trainer Kit decks, and McDonald's 2014–16. `xy-full-library.cjs` owns the candidate inventory; `xy-full-wave-data.json` and `ui/xy-coverage.json` are not evidence that every interaction has passed. Preserve the 185-printing first-wave checkpoint separately.

Forty-eight focused expected-result checks pass in `xy-full-focused-report.json`. Full attack smoke runs are sharded into `xy-full-smoke-report-{0,1,2}.json`; they must all match the final engine hash. Additional compiled-effect branches use `ILEX_XY_BRANCH=1` and separate reports. Power/Trainer audits and sixteen mixed deck rollouts are also required. Two cached Limitless lists contain 59 cards; the rollout script adds one Water/Fire Basic Energy to cloned test fixtures only and records this adjustment. Saved user decks and the cached collection are unchanged.

First candidate smoke exposed 19 failures; some were fixture limits (four Water/Dark Energy versus five required, and Meowth's first-turn-only attack). Those fixtures were corrected. Actual fixes include full-Bench search capacity, typed Energy-discard validation, Drag Off timing, Shrine of Memories inheritance, and native Wild Blaze's wrong deck. Early failing reports/logs are historical and must not be represented as final passes.

New shared XY mechanics cover Mega/Spirit Link routes, BREAK inheritance and proper attack-source delegation, team-based effects, Double Aqua/Magma Energy, promo effects, coin transformations in both real coin resolvers and explicit prompts, Bodyguard hand/player protection, and Giratina's BREAK lock. The UI adapter now respects filtered Powers. All card wrappers operate on the cloned in-game instance (`this`), not the registered template. Focused checks cover these repairs, copied BW effects, and modern Expanded versus historical XY turn/Burn rules. Expanded has a dedicated mechanics profile; format pools/bans remain separate and no current official banlist certification is claimed.

`xy-supplements.json` holds all 240 kit printings plus six Yellow A alternates. Network DNS and the available web/connector paths could not reach TCGdex during this continuation. Bundled scans were reviewed in `xy-scan-sheets`; the kit mapping records exact attack names and equivalent canonical printings. Five unique kit variants were transcribed from their scans in `xy-kit-unique.cjs`. Preserve source/audit provenance. Remote supplement fetch remains an optional acquisition helper, not the authoritative offline build.

## Still required

- Finish current-hash smoke/branch/Power/Trainer/deck rollout checks and repair failures.
- Run shared BW/HGSS/DP/EX/WOTC-focused/bot/Undo regressions after final engine changes.
- Stage XY source provenance, add XY native tests, run fresh/restored desktop verification, package Windows EXE and compact/offline ZIPs with all 23,736 scans verified.
- Increment Android versionCode above 2, keep original signing key private, rebuild/verify APK and rerun the 59-check landscape/touch preview. Physical Android/emulator acceptance remains unavailable and must not be claimed.
- Update release evidence, progress, AGENTS and version/readme files only with verified facts. Existing release artifacts remain old until packaging is actually complete.

Do not rerun `xy-library.cjs` (first wave only) or `xy-checkpoint.cjs` over the full candidate inventory. `xy-prepare-validation.cjs` is a one-time rollout setup helper and would overwrite later fixture adjustments; use the current `xy-full-match-audit.cjs` directly.
