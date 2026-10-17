# Early Black & White automation — October 16, 2026

## Scope and coverage

Kenneth authorized Black & White, Emerging Powers and Noble Victories, promos through the Noble Victories product period, and both BW Trainer Kits. Exact scope407/407, zero pending:

| Group | Implemented |
|---|---:|
| Black & White |115/115|
| Emerging Powers |98/98|
| Noble Victories |102/102|
| BW Black Star Promos BW01–BW32 |32/32|
| Excadrill Trainer Kit |30/30|
| Zoroark Trainer Kit |30/30|

Promo cutoff is the Noble Victories product period before Next Destinies, including December2011 Victini tin BW32. No later BW promos or expansions. Interaction validation uses HGSS1–4, Call of Legends and HGSS supplements with this pool. Unlimited and broader older-era sweeps remain deferred. Shared earlier regressions retained. No subagents used.

## Implementation

Generator bw-library.cjs registers339 native reuses,65 compiled Pokemon and3 compiled Trainers. Canonical printed stats, attacks/costs and Ability types override registration metadata. Trainer Kit Gurdurr missing Bulk Up damage corrected to scan-confirmed20. Coverage is tracked separately from release verification.

Shared handlers include Victory Star whole-sequence reroll (including until-tails and duplicate Victini), Solid Rock damage reduction, Cursed Body, Craftsmanship HP, Bulk Up and remaining compiled attack families. All BW Abilities retain Ability type, including native Reuniclus. Restored Pokemon retain Restored stage and cannot supply starting Basics. Smeargle Portrait copies all early BW Supporters, including N, without using the normal Supporter allowance. Solosis Cell Culture and promo Litwick Call for Family no longer error on a full Bench.

Historical BW profile uses Format.BW, first-turn draw/Trainers/Supporter/attack, BW Rare Candy/Great Ball and pre-errata no-flip Pokemon Catcher. Older historical profiles preserved. Source research: BW-RULES-SOURCES.md.

## Validation

Final engine SHA256:8879fb5ad511d3e1ffaedcba1f8a6e54bc0ad2c6ee6938cf37a4bd6639cc2aad.

- 22 focused expected-result checks pass.
- All559 printed attacks pass final smoke on this engine.
- Discovery2236 scenarios initially found8 failures in two full-Bench attacks; repaired752-case shard rerun passes. Discovery reports predate final export/repair changes; final559-case smoke and focused/audit/rollout reports match the final engine.
- Ability audit11 resolved,33 expected unavailable (includes passive Abilities; not44 activated-Ability assertions), zero unexpected failures.
- Trainer audit78 resolved,6 expected preconditions, zero unexpected failures.
- Eleven scoped real-deck bot rollouts across Easy/Normal/Hard,1430 decisions, bounded150 per game; planning immutability, exact save replay and Undo pass.
- Shared HGSS32, DP109, EX170, WOTC focused, bot17 checks/three completed starter games and Undo7 pass.
- Native v54 fresh and restored passes23 BW checks plus full inherited UI, pack, studio, LEGEND28/all9pairs, audio, foil, deck/format, enlarged-action, drag, bot and persistence checks. v53 failed due to Emboar-only test deck lacking Basics; corrected fixture uses Tepig. User profile untouched. Native execution required test-only no-sandbox/disable-gpu flags; normal launcher settings unchanged.

These are finite fixtures/rollouts, not exhaustive proof of all possible board states. Attack smoke uses ample Energy, raised HP and bounded prompts to test effect completion; expected semantic interactions are checked separately. Unlimited remains deferred.

## Release

ILEX.GG1.10.0 staged and native verified. package-bw.py verifies23736 scans and1075 provenance files, publishes the candidate resources/launcher, and builds compact/offline ZIPs with full CRC and embedded-engine checks. Compact ZIP207500464bytes verified. Offline ZIP2774628209bytes verified. EXE and both ZIPs are complete; all scan hashes, provenance hashes, archive CRCs and embedded-engine checks pass.

Existing LEGEND composition, music, pack opening, foil, cache, Limitless import, decks/formats and backlog are preserved. No GitHub publication performed.
