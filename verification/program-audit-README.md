# ILEX.GG program audit — October 21, 2026

All **58 automated suites passed** on the current frozen UI/engine after repairing stale harness assumptions. The first run passed 46 suites; the other 12 failures were harness/version/expectation issues described below. No new product defect was confirmed, and product code was not changed.

## Coverage

Historical and modern rules (WOTC through Mega/Unlimited), cross-era effects, format-specific reprints, deck import/export and sorting, cube/import, undo/replay, bot policies/difficulties, private-match and peer logic, pack generation/collation/finishes, Pocket rules and interactions, and previous reported bug regressions. Includes Evosoda, Rare Candy, Psychic Embrace, Custom Catcher, Lysandre Labs, repeated Download and paired Items, Trump Card, Computer Search, and Overeager.

Native desktop checks passed for responsive menus, selections/images, attachment stacks, Energy shortcuts, cries and Celebi cursor. Focused tournament bot, Rare Candy and reprint UI tests passed on fresh and restored profiles; Pocket passed fresh and restored profiles. The label core-bot-private in raw runner output is historical: that focused native job tests bots/reprints/candy, not external networking.

## Integrity and packages

44 JavaScript files parsed successfully. All 5,835 frozen UI/assets matched canonical source and both installed Windows bundles. All 23,860 ordinary scan hashes passed. Both Windows archives passed CRC checks and matched all frozen UI/assets. Android APK passed CRC checks and signature verification with the original certificate; all 7,318 APK UI assets match the prepared Android source and the tested mobile preview. Desktop cursor files are intentionally absent on touch Android; index/audio/presentation contain platform adjustments. Touch Chromium navigation passed at 800×360, 640×312 and 390×844. Energy regression generated 5,600 packs across 129 pack profiles.

## Harness repairs

- SV tests loaded standalone obsolete engine; redirected to frozen current engine.
- EX sparse VM needed current Limitless collection definition.
- Legacy modern Bill fixture played a Supporter on turn1; moved effect assertion to turn3.
- Two Unlimited construction expectations and historical baseline comparison predated requested original/ACE SPEC Computer Search separation.
- Energy tests referenced removed metadata types on Energy; checked printed Energy name against engine provision instead.
- Native helper modules were loaded from released application; current focused native suites used without obsolete chained theme/menu expectations.

The initial failures remain in matrix.json and logs/. Retry results and the exact adapter are saved separately. Assertions were adapted only for current intended behavior, available metadata and legal fixture timing; no product behavior was altered.

## Limits

- Finite automated coverage is not proof of every card and action combination.
- No physical Android hardware lifecycle, audio listening or real touch-device acceptance.
- Private transport tests use local/simulated peers; no independent external two-PC Internet session.
- Full older chained native suite is obsolete (menu structure/palette); current menu and focused native bot/reprint/candy suites were executed instead.

## Suite results

| Suite | Result | Retried |
|---|---|---|
| wotc-tests | PASS | No |
| ex-tests | PASS | Yes |
| hgss-tests | PASS | No |
| dp-tests | PASS | No |
| bw-tests | PASS | No |
| xy-tests | PASS | No |
| xy-full-tests | PASS | No |
| xy-interaction-tests | PASS | No |
| sm-tests | PASS | No |
| swsh-tests | PASS | No |
| swsh-cross-era-tests | PASS | No |
| sv-common-tests | PASS | Yes |
| sv-final-effects-tests | PASS | Yes |
| sv-final-extra-tests | PASS | Yes |
| sv-environment-tests | PASS | Yes |
| sv-reaction-tests | PASS | Yes |
| mega-base-tests | PASS | Yes |
| mega-framework-tests | PASS | No |
| mega-focused-tests | PASS | No |
| unlimited-base-tests | PASS | Yes |
| unlimited-focused-tests | PASS | Yes |
| wotc-final-tests | PASS | No |
| format-reprints-extra-tests | PASS | No |
| format-reprints-replay-tests | PASS | No |
| format-reprints-cutoff-tests | PASS | Yes |
| cube-tests | PASS | No |
| cube-import-tests | PASS | No |
| deck-sort-tests | PASS | No |
| evosoda-tests | PASS | No |
| psychic-embrace-tests | PASS | No |
| rare-candy-tests | PASS | No |
| format-reprints-tests | PASS | No |
| custom-catcher-tests | PASS | No |
| lysandre-labs-tests | PASS | No |
| basic-energy-tests | PASS | No |
| undo-tests | PASS | No |
| private-peer-tests | PASS | No |
| private-match-tests | PASS | No |
| combined-tournament-tests | PASS | No |
| combined-bot-reprints-tests | PASS | No |
| realistic-alias-tests | PASS | No |
| tournament-profile-tests | PASS | No |
| pack-energy-tests | PASS | Yes |
| pack-30th-energy-tests | PASS | Yes |
| pack-speed-tests | PASS | No |
| pack-ball-audit | PASS | No |
| pack-subset-audit | PASS | No |
| ascended-pattern-audit | PASS | No |
| pack-tests | PASS | No |
| reverse-catalog-tests | PASS | No |
| god-pack-audit | PASS | No |
| pocket-model | PASS | No |
| pocket-interactions | PASS | No |
| recent-download | PASS | No |
| recent-paired | PASS | No |
| repeat-energy | PASS | No |
| recent-trump-computer | PASS | No |
| recent-overeager | PASS | No |

Machine-readable details: results.json. Frozen source hashes: manifest.json. No user profile changes, real-app closing, publishing, or release rebuild.
