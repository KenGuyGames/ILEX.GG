# SV 1.17.0 — validated implementation

All 3,694 cataloged English standard-TCG printings across 20 catalogs are implemented, with zero pending. Engine: `e4808199a2bb203739d1e63b97326b503733a41de894a26bff9283e094a12369`. BW onward through SV; Unlimited deferred. 163 focused checks, 4808 printed attacks, six Technical Machine attacks, 7312 representative compiled branch cases, full identity/index audits, 24 bounded mixed games (2161 decisions) with exact replay/Undo, 16 shared suites and 67 preserved SWSH cases pass. Fresh/restored Windows and Android Chromium acceptance passed on this engine. Distribution integrity is recorded separately in sv-final-release-evidence.json.

Supplement boundaries and source provenance are in SV-RULES-SOURCES.md and sv-supplement-completeness.json. My First Battle is a separate simplified mini-deck game, excluded from standard 60-card automation. Physical Android device acceptance and verified reverse scan acquisition remain incomplete. Finite checks do not prove all possible board states. Older candidate notes below are historical.

---

# SV continuation — shared effect framework (October 19, 2026)

Kenneth requested uninterrupted completion of the entire Scarlet & Violet era. Work continues; **3694/3694 cataloged source candidates, 0 uncompiled, zero missing-text records; zero release-validated printings**. BW onward interactions; Unlimited deferred. Candidate engine `a66584002ade21406c95611cb596d4d0bf8a994b63d63a34ca7574c1398df7ec`. Source generation is not validation. See `sv-source-checkpoint.json` for exact current-hash bindings; older successful reports are not final-engine passes.

Added exact-wording mappings and shared handlers for conditions/counts, discards/recovery, team damage/retreat/HP defenses, optional Tools, counter placement, first-turn permission, hand/Library choices and evolution entries. Fixed source selection for Bench attacks across duplicate copies, source status/history/Energy costs, Dimension Valley, UI action targets and bot candidates. New CheckAttackCostEffect.source defaults to Active for older callers. Evolution eligibility is now a separate name/stage permission check; Rainbow DNA preserves timing and suppression. Deck evolution retains its source zone, avoiding hand-entry triggers. Weakness supports an explicit multiplier for Ancient Way. Counter transfers remove only counters actually delivered, including after prevention prompts. More native source repairs: free-cost Budew, Iron Moth Suction (actual damage healing), Minccino wrong attack index and Tatsugiri full-Bench search. Defective native attack paths are routed through compiled equivalents by both SV generators. Fossils retain printed Abilities and modern Ability identity. Added remaining zone/return/search and conditional-switch operations, Lucian, Ogre Mask, Bother-Bot, Fluorite and Cursed Duster; source-aware cost and Weakness changes, typed Berries, entry/KO/movement Abilities and environment protection primitives. Ogre Mask retains same-turn Teal Dance through multiple mask swaps. Sticky Jail exposed reversed next-turn tax activation/clear logic, now repaired. Late zone/card effects still need complete focused acceptance and final-hash broad sweeps.

Focused suites include bench, waves 3–24 (reports cover the specific cases named in each file), foundation/common/shared checks and saved-game fixtures. The first full-source printed-attack sweep resolved 4,807 attempts: 4,806 pass and Zeraora Thunder Raid fails without an eligible Bench ex. The native failure is now replaced by compiled code; final-engine verification remains pending. Earlier shard and repair reports are historical evidence. Match fixtures are three constructed base decks (226 decisions) with replay/Undo on their report hash. Remaining effects, supplement completeness, broad semantics/branches, source-aware cost auras/copying, wider replay/Undo, native UI and packaging remain required.

**No EXE, Windows archive or APK updated.** Keep `ILEX_RULES_OUTFILE=work/sv-candidate/rules-engine.js`. Full era is activated with `sv-integrate.cjs --era`; the base generator overwrites its alias. Preserve released engine/resources, reverse scans, all previous features and signing. No subagents.

---

# Confirmed full-era continuation — October 19, 2026

Kenneth explicitly confirmed the ENTIRE Scarlet & Violet era, including special sets and promos. Current candidate pool: **3308/3694 source candidates; 386 uncompiled; zero missing-text entries**. These are not release-validated automation counts. The full candidate is now activated via `sv-integrate.cjs --era`, which aliases `tcg-lab-sv-data.ts` to `tcg-lab-sv-era-candidate-data.ts`. `sv-library.cjs` remains a BASE-only generator and overwrites that alias; rerun `sv-era-preview.cjs` and `sv-integrate.cjs --era` before full-era builds. Continue using `ILEX_RULES_OUTFILE=work/sv-candidate/rules-engine.js`.

Black Bolt/White Flare complete raw records were found under `zsv10pt5`/`rsv10pt5`; inventory aliases are fixed. Earlier native-stat/API fallbacks are historical and are superseded by those raw records. All 30 McDonald’s printings were identified from reviewed bundled scans and matching original text records; see `sv-mcd-source-provenance.json`. The catalog inventory may still omit separate physical supplementary printings and needs a completeness audit.

Current engine `909a2196b198cc5810e08d396af75d83d06d50066273d80874c7bcc8a63b8915`: 18 base-focused, 21 common-focused, 34 shared rules checks; 27 repair attack cases and 3 custom fixture games / 226 decisions with exact replay/Undo pass. Source checks remain finite; no full-era claim. The first smoke shard’s earlier failures and hash remain evidence, not a final pass. All 27 repaired/prerequisite-adjusted cases now pass on the current candidate.

New shared work: modern ex/V conditions; typed/named counts; field Energy discard; typed/tagged/different-type attachments; recovery/search patterns; entry/healing/HP/type powers; Festival Lead’s second attack with ability-suppression controls; SV Tool-versus-Item categories and historical fallback; ACE SPEC tags and SV rules profile. Replaced faulty native paths for Peak Acceleration, Gaia Punk, Summoning Gate, Come and Get You, Prism Charge, Blazing Destruction and Slowing Perfume. Only the candidate source is affected.

**Still NOT RELEASED.** Source `rules-match.js` has an SV profile; released Windows resources and APK remain untouched. Bench attacks have existing partial engine support and newly recognized printed flags, but source selection across multiple copies, cost/status behavior and bot targeting require dedicated work before release. Finish remaining 386 source printings, audit all shared mechanics and physical supplements, validate all era attacks/powers/Trainers and mixed games, then native/package checks. No subagents or GitHub publication. See `sv-source-checkpoint.json`.

---

# Scarlet & Violet implementation — candidate checkpoint, October 19, 2026

Kenneth requested Scarlet & Violet implementation. Working scope is the complete era, including special expansions, promos and cataloged supplements. An optional base-set-versus-era question has not received a response; base-set work proceeded independently, followed by full-era source inventory. Interaction baseline remains Black & White onward through actually implemented cards. Unlimited is deferred. No subagents were used.

## Release status

**Not released. No SV printing is marked release-validated.** The Windows EXE, archives and Android APK were not updated. Production UI engine remains `6ebac3c9fe187ddf5b6c916e8315b565fff09622e96aaaeb3b212dddb100661b`, matching `work/sv-baseline/ui/rules-engine.js`. Preserve the current reverse scans, 30th Energy fix, markers, match-start fix, Android signing/layout, and unrelated audit repairs.

Candidate TS registration is active in `tcg-lab-wotc.ts`. Use `ILEX_RULES_OUTFILE=work/sv-candidate/rules-engine.js` when running `build-rules.cjs`; its default output would include unfinished candidate SV code in production source UI. Do not package this checkpoint as a completed era.

## Base set

258/258 printings have candidate records, zero uncompiled source effects. `sv-library.cjs` deliberately generates **base only** into `sv-wave-data.json`, `tcg-lab-sv-data.ts`, and `sv-coverage.json`. Native-source reuse is a candidate requiring audit, not a validation result. Exact printing source candidates and exact-effect counterparts are preferred over name-only matches; HP, types, stages and attack costs are checked for cross-printing effect matches.

Shared work includes modern ex regulation marks and identity, Tera Bench damage protection, typed/named field scaling, restricted attachment targets, parameterized random hand returns and conditional effects after discarding Energy. Added candidate powers include Counterattack Quills, Strange Behavior, Energy Carnival, Blooming Garden, Well-Baked Body, Poison Sacs, Intimidating Howl and Busybody Nurse. Tandem Unit now caps searches to open Bench spaces. Psychic Embrace exposes legal current-type, nonlethal targets and resolves one attachment per repeatable activation through shared attachment notifications.

Candidate engine: `c5924308c0c128cc8c4c1d0cd7930fa178cd1efee609930a3e8344ff7935430f`.

- 18 focused expected-result checks pass.
- Final candidate smoke resolves all 324 printed Pokémon attacks, zero failures.
- Earlier 1,296 branch cases pass on the pre-Psychic-Embrace/Tandem prompt repair engine. That report is hash-bound and is **not final-engine branch evidence**.
- Trainer audit: 86 resolved, 8 unavailable fixture cases, zero unexpected errors.
- Ability audit: 36 resolved, 36 unavailable/passive fixture cases, zero unexpected errors. This is not complete semantic proof of all Abilities.
- Shared historical rules suite: 34 checks pass.
- Three custom fixture deck games: 226 bounded decisions, no planning mutation, exact replay and Undo pass. These are constructed test decks, not historical tournament lists.

Evidence: `sv-source-checkpoint.json`, `sv-foundation-validation.json`, `sv-base-final-smoke.json`, `sv-base-sweep-report.json`, `sv-base-power-audit.json`, `sv-base-trainer-audit.json`, `sv-shared-regression-report.json`, `sv-base-match-audit.json`.

Still required before a base release: modern Tool-versus-Item behavior under an SV profile, additional exact Trainer/Ability and cross-era interaction cases (including poison preservation through evolution/devolution and ability suppression), final-engine branch coverage, wider existing BW–SWSH regressions, native fresh/restored acceptance, catalog/profile integration, and packaging checks.

## Full-era source work

Catalog inventory: **3,694** entries across 20 catalogs, including Energy and McDonald's printings. This finite inventory is not proof that every physical supplementary printing has been collected.

`sv-era-preview.cjs` writes **unintegrated source candidates** to separate `sv-era-candidate-data.json` / `tcg-lab-sv-era-candidate-data.ts` files. It must not replace the validated release pool. Current preview: 2,853 source candidates, 841 pending; all unvalidated. Pending includes 30 missing-text McDonald's records, 323 records with incomplete printed statistics and remaining uncompiled effects.

414 candidate supplemental text records were transcribed from cached TCGdex records, with URLs, cache hashes and incomplete-field flags in `sv-supplement-provenance.json`. Black Bolt/White Flare records omit known printed Weakness information; those gaps are explicitly blocked by `_svSourceIncomplete`. Do not treat absent fields as proof of no Weakness. Missing text is reduced to 30 McDonald's records. No fabricated effects or scans were introduced.

Next work: finish base expected-result/profile checks, continue later-set effect compilation using reusable framework operations, verify omitted printed statistics and missing supplements from complete sources, then validate and release the era. Preserve all earlier historical profiles and the deferred Unlimited boundary.
