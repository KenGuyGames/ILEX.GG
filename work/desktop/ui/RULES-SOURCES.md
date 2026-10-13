# ILEX.GG rules engine attribution and profiles

Browser bundle derived from Twinleaf.gg / RyuuPlay `ptcg-server`, declared MIT in its package metadata. Upstream snapshot: `93e6bf8f231cdbcb176da8033d9c25872792bddd`. Original MIT copyright and terms are in rules-engine-LICENSE.txt.

- https://github.com/twinleafgg/twinleafgg
- https://github.com/keeshii/ryuu-play

Local changes include numeric shuffle-order validation; historical Burn checkup; historical starting-player restrictions; Caterpie's Paralysis; Path to the Peak's suppression of on-play Abilities; deterministic engine randomness during replay; validated prompt decoding; desktop choice interfaces; printing-to-implementation mapping; and exclusion of templates marked TODO and their inherited reprints.

Rules profiles configure first-turn draw, attack and Supporter restrictions, first-player choice, Burn checkup, and old Supporter cleanup. They are not exhaustive certification of every historical ruling, card erratum or rare interaction. Pocket gameplay requires manual mode.

WOTC profiles cover English Wizards rules through Skyridge. The 1999–2001 profile retains the original Sleep/Confusion/Paralysis Power restriction; the 2002–2003 profile applies the Poison/Burn Power erratum. Both use the first-player coin flip after concealed setup, a mandatory first draw, first-turn attacks and Trainers, two optional bonus cards per opposing mulligan, unlimited normal retreats, paid Confusion retreat flips, and 20 Confusion self-damage with applicable Weakness, Resistance and Trainer modifiers. Required Energy-card costs matching the implemented card text are paid before Confusion, once per attack. The Neo Baby Rule precedes those costs and remains active under Special Conditions.

Six editable card-pool presets span Base–Fossil, Base–Team Rocket, Base–Gym Challenge, Base–Neo Revelation, Base–Neo Destiny and Base–Skyridge. They are expansion-pool templates, not exhaustive sanctioned-event legality, dated promotional availability or tournament-specific bans. Earlier presets omit promotional cards; Base–Skyridge includes the Wizards promo set.

Primary WOTC sources inspected directly:

- Wizards Advanced Rulebook v1, pp. 4–7, 12–13, 22–23: https://www.judgeball.com/files/archives/tcg-rulebooks/en/WOTC_v1.pdf
- Wizards Expedition Advanced Rulebook (July 2002), pp. 2–5, 7, 19: https://www.judgeball.com/files/archives/tcg-rulebooks/en/WOTCE1.pdf

Additional local fixes for WOTC: Defender attaches and expires correctly; successful retreats clear conditions while failed Confusion retreats preserve them; earlier Powers can remain active under Poison; later Pokémon Powers/Poké-Powers/Poké-Bodies shut down under Special Conditions without shutting down Baby Rules. Automated card coverage remains limited by the upstream implementations.

Primary rules references:

- Current rulebook: https://www.pokemon.com/static-assets/content-assets/cms2/pdf/trading-card-game/rulebook/par_rulebook_en.pdf
- XY rulebook: https://assets.pokemon.com/assets/cms2/pdf/trading-card-game/rulebook/xy1-rulebook-en.pdf
- HGSS rulebook: https://assets.pokemon.com/assets/cms/pdf/tcg/rulebooks/HeartGold_SoulSilver_Rulebook.pdf
- Diamond & Pearl first-turn rules: https://www.pokemon.com/uk/pokemon-tcg/diamond-amp-pearl
- Sun & Moon Burn change: https://www.pokemon.com/us/strategy/big-changes-in-pokemon-tcg-sun-moon/
- Sword & Shield first-turn Supporter change: https://www.pokemon.com/uk/news/pokemon-tcg-retrospective-the-sword-shield-era
- Limitless deck text: https://docs.limitlesstcg.com/player/decklists.html

Offline English metadata: https://github.com/PokemonTCG/pokemon-tcg-data . Printing and scan index attribution remains in scan-manifest.json and scan reports.

## Base–Fossil automation pass (ILEX.GG 1.3)

All 228 English printings from Base Set, Jungle and Fossil are mapped (102 + 64 + 62). Printed Pokémon stats, costs and attack names are normalized from the bundled original-printing metadata. Card effects use the engine implementations with local corrections, rather than interpreting free text during a match.

Local corrections cover Base Gastly, the non-holo Fossil Ditto, Energy Burn/Buzzap, Destiny Bond, Damage Swap, Strange Behavior, Curse, Toxic Gas, Invisible Wall, Transparency, Thick Skinned, drain attacks, surplus Water damage, Quick Attack, Big Eggsplosion, Gigashock, Thunderstorm, Chain Lightning, Mirror Move, Hurricane, Conversion, original Devolution Spray, Pokédex, Gambler, Scavenge and original Fossil/Doll behavior. The original Wizards rulebook, pp. 20–23, supplies damage-before-other-effects ordering and the Weakness/Resistance/Trainer/defensive-Power calculation order.

Verification includes the printing audit, targeted outcome regressions, and 634 attack scenarios that resolve mandatory choices with two deterministic seeds. Scenario coverage is not an exhaustive proof of all combinations, choices or errata. Broader-library mappings continue to indicate available implementations rather than certified interactions.

## Additional WOTC automation (October 12, 2026)

The build-time WOTC compiler uses the bundled `pokemon-tcg-data` English printing metadata and explicit effect handlers. It audits all 1,793 WOTC entries in the local scan index, including Legendary Collection (`lc`), Best of Game (`bog`), Aquapolis holo-number aliases and its four separately indexed artwork variants. The result is recorded in `wotc-coverage.json`, shown by the WOTC coverage button on Play table. It lists available printings by set and every unavailable entry.

Base Set, Jungle, Fossil, Base Set 2, Team Rocket, Southern Islands and Legendary Collection now have full implementation coverage. The rest of the WOTC era remains incomplete. Unknown attacks, Powers, rules and Trainer clauses keep the whole printing out of enforced matches. Having a scan or printed text does not imply automated support.

Verified reprints reuse original effects with the later printing's exact stats, costs, evolution, Weakness and Resistance. Printed-copy limits share original/reprint Trainer names and enforce Neo Shining Pokémon's one-copy rule. New handlers cover coin outcomes, statuses, Energy movement/discards, damage calculations, healing, returning Pokémon, selected Trainer effects, historical Special Condition restrictions, evolution Powers, and Team Rocket's Stare, Sinkhole and Final Beam. Stare follows its target until switching/evolving or the end of the opponent's turn; Sinkhole runs only after a successful retreat; Final Beam captures Energy/types before KO cleanup and applies Weakness/Resistance without attack-only defensive modifiers. Darkness and Metal Energy use their WOTC printed effects. Historical profiles permit first-turn Supporters while retaining one Supporter per turn and end-turn cleanup.

`wotc-test-report.json` and the packaged `desktop-verification.json` record current coverage and validation. Seeded attack scenarios exercise supported prompts; targeted regressions check card destinations, costs, Power expiry, successful retreats and knockout responses. These checks do not certify every combination or historical tournament ruling. The full-era automation request remains unfinished until the pending list is empty.
