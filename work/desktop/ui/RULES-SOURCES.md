## EX release validation — October 14, 2026

EX source coverage is complete at 1,857/1,857 printings: Ruby & Sapphire–Power Keepers, Unown, EX Trainer Kits, Nintendo promos and POP1–3. The release uses full-clause compiled effects where recognized and retained native/exact-reprint sources for the other cards. Source registration alone is not exhaustive interaction proof. Bounded validation covers 154 focused checks, 5,302 seeded EX attack scenarios, shared WOTC/e-card regression suites and native save/load/Undo checks. EX interactions with Expedition, Aquapolis and Skyridge are included; Unlimited and later-era sweeps remain deferred.

Historical references: Team Compendium's June 16, 2003 report of the Nintendo rules change: https://www.pojo.com/Features/2003/rules.html . Official PUI rulings and errata are collected in Compendium LVX (original host https://compendium.pokegym.net/compendium-lvx.html ; a readable archived transcription was consulted at https://doczz.net/doc/193314/rulings-compendium-lvx---pokemon-rulings-compendium ). Original publisher rulebooks for the exact early/late cutoff were not retrieved. The late profile implements the no-first-turn-Supporter rule corroborated by the December 2006 / February 2007 PUI Sharing rulings; the early/legacy profile remains unchanged for saved journals. Historical format chronology is corroborated by https://ptcgarchive.com/first-turn-rules-full/ . This does not certify all annual tournament setup variations.

Reviewed EX errata: Feebas HL's Ascension requires a coin (July 22, 2004); Electrode ex RG's Crush and Burn counts Energy cards (December 16, 2004); Balloon Berry has zero Retreat Cost even in damage queries (November 13, 2003). Holon Circle stops a legally declared attack before costs/cancellation flips (November 16, 2006). Psychic Protector applies after Weakness/Resistance and can discard extra cards (February 1, 2007). Volunteer must leave Vulpix in play and exposes evolved-only Tools to their discard condition (December 7, 2006). Canonical source files remain unchanged; corrections feed compilation and offline text together.

# ILEX.GG rules engine attribution and profiles

## Foil presentation metadata

The catalog retains each printing's rarity from the bundled PokemonTCG English dataset. The decorative overlay covers explicitly holo/higher rarities and known foil card subtypes; plain vintage Rare, Common, Uncommon and unknown rarities are excluded. The holo/non-holo Fossil Aerodactyl pair is checked independently. Starting with Scarlet & Violet, normal Rare cards are foil as documented by Pokémon: https://www.pokemon.com/uk/news/pokemon-tcg-scarlet-violet-brings-changes-to-the-pokemon-trading-card-game . This exception applies to indexed Scarlet & Violet printings; it does not make vintage Rare cards holo. Promotional rarity alone is not treated as proof of foil. The effect is stylized presentation, with vintage artwork masks and a broader sheen for higher rarities; it does not alter card rules or certify exact physical foil patterns for every printing.

## Gym Challenge validation — October 13, 2026

All 132 entries have implementations, including the 28 remaining at the start of this pass. Dedicated checks exercise 322 seeded attack scenarios, costs, copying, face-down placement/reveal, journal restoration, optional reactions and Power damage. Bounded validation does not certify every possible combination or historical ruling.

Bundled English scans supply the printed clauses. Roaring Flames uses the corrected Fire symbol; Minefield Gym places 20 counters on tails. Transcriptions use these corrections. Archived error list: https://www.pojo.com/pokemon/Error_Cards/index.shtml . Shock Blast excludes another Shock Blast to avoid recursion, following the May 3, 2001 erratum reproduced at https://pkmncards.com/comments/page/104/ . Weakness/Resistance treatment is corroborated by TCG ONE's implementation release note https://forum.tcgone.net/t/v74-update-diamond-pearl-platinum-and-2010-dp-ul-formats/16398 ; a separate direct WotC transcript for that point was not located. This source limitation remains documented.

Rebellion retains its printed Confusion exception and general Power-suppression checks. Secret Plan uses a Basic proxy until a qualifying action requires identity; revealed non-Basics and attachments are discarded without a Prize. Read-only queries do not reveal live cards; bot forecasts mask opposing concealed identities. Group Attack restores deck order when its optional search is declined because upstream choice construction sorts the deck. Focus Energy changes printed base damage while preserving Quick Attack's coin bonus. Pending WOTC entries remain excluded from enforced matches.

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


## Gym Heroes completion — October 13, 2026

All 132 Gym Heroes entries have implemented effects. The dedicated suite checks 302 seeded attack scenarios plus Trainer costs, optional reactions, Flee timing, Rebirth, temporary attachments, whole-sequence ESP reflips, Recall attack selection, and printed-length quizzes. Passing these checks does not certify every possible interaction.

Blaine's Quiz #1 uses card-specific length data extracted from the bundled scans. Ambiguous OCR readings were reviewed against the scans; the Neo Discovery Poliwhirl printing retains its actual 3'3" measurement. Legacy measurements missing from OCR use corroborating printings of the same species. Card-E entries are eligible only when their scan supplies a printed length. No later-era length coverage was added. The WotC Rules Team's September 2002 update says that cards without a printed length cannot be selected: https://www.pojo.com/Features/Sept2002/91702-Bling.html .

The rest of WOTC remains unfinished. See the coverage panel for the current pending entries.

## Expedition, Black Star Promos and Neo Genesis validation — October 13, 2026

All 329 numbered entries across these three sets are mapped. Their dedicated validation covers 682 distinct-attack scenarios under two seeds and targeted interactions for Psymimic, Mind Games, Focus Band, Chain Reaction, Protective Flame/Bolt, physical counters, Pure Body, Final Blow and Hydroelectric Power. Printed English WOTC text supplies the historical behavior; Slowking is usable from the Bench under these profiles. Unlimited interactions with later-era cards remain deferred.

Persistent Char, Color and Lightning Rod counters survive switching and disappear on evolution. The locally retained Expedition English rulebook (`WOTCE1.pdf`, checkup and counter glossary) orders condition checks before Char and Darkness recoil, then simultaneous knockout checks. Char places counters and does not apply Weakness, Resistance or Metal reduction; the WotC Rules Team correction is archived at https://www.pojo.com/Features/0101/010501WotcChat.html . The same primary transcript defines transformed Energy cards by the Energy they currently provide, used for Ecogym's non-Colorless check.

Lightning Bolt combines its printed 10 damage with the marker's 20 for a marked Active before applying damage modifiers once, and explicitly applies Weakness/Resistance to marked Bench targets. This follows the printed damage and effect text in the bundled Electabuzz #46 scan; no separate official clarification was located. Targeted tests cover that interpretation, persistent markers, and PlusPower ordering. These tests provide regression coverage, not exhaustive certification of all historical rulings or every possible board state. Full-era coverage remains unfinished.


## Final WOTC implementation pass — October 13, 2026

The remaining 75 printings were compiled from bundled English card scans and the matching English card-data records. `work/desktop-build/wotc-final-clauses.json` pins whole clauses; unknown text is never enabled by partial matching. Pineco Neo Discovery 61 was scan-reviewed and retains two ordered flips: a second tails cancels every damage component. Original Energy-source identity, physical card counts, activation restrictions and singleton/Unown construction rules are retained. Shared copied-attack delegation avoids source Powers and guards cyclic Sketch. Pre-retreat prompts occur before payment; Confusion remains after its paid cost. Knockout Tools resolve before stack cleanup and Prize awards.

The official Wizards Pokemon-e rulebook, hosted at https://www.pojo.com/pokemon/rules/PokemonE-Rulebook.pdf, remains the primary reference for historical profiles. The existing early/2002 Power and Burn differences remain unchanged. Full implementation coverage is not certification of every possible interaction or ruling. Unlimited and later-era cross-pool validation remain deferred.
