# ILEX.GG booster simulation — October 15, 2026

129 English standard and special expansion profiles, including Dragon Vault, Legendary Treasures, Double Crisis, Generations, Shining Legends, Dragon Majesty, Hidden Fates, Detective Pikachu, Champion’s Path, Shining Fates, Celebrations, Pokemon GO, Crown Zenith, SV151/Paldean Fates/Shrouded Fable/Prismatic Evolutions/Black Bolt/White Flare, Mega Evolution through Pitch Black and 30th Celebration. Promos, starter kits, Pocket and standalone subset galleries are excluded. No pack or inventory restrictions apply to decks or matches.

## Sources checked

- Mark Stamp and Austin E. Stamp, *Pokemon Trading Card Sequences* (March 25, 2003): https://www.cs.sjsu.edu/~stamp/cv/papers/pokemon.pdf . Examines 153 Base Set packs and reports 5 commons, 2 common Energy, 3 uncommons, 1 rare, with approximately one-third holo rares. This is the documented Base baseline, not a guarantee for every box.
- Historical composition overview: https://bulbapedia.bulbagarden.net/wiki/Booster_pack_(TCG) . Used for era pack sizes and parallel-foil slot conventions; set-specific factory collation is not exhaustively recreated.
- Official modern composition: https://support.pokemon.com/hc/en-us/articles/360000981613-What-can-I-expect-in-a-Pok%C3%A9mon-Trading-Card-Game-booster-pack . Supports Scarlet/Violet four commons, three uncommons and three foils plus Basic Energy; at least one rare-or-higher.

## Simulation model

Pack collation uses simulated rarity tiers and set-specific layouts. It does not reproduce physical print sheets or guarantee box hits. Picks are uniform within each tier, with no repeated common/uncommon IDs within a pack when enough exist. Parallel upgrades replace a parallel card, preserving the pack size.

Basic Energy uses that set's pool when available, otherwise cataloged era/substitute Energy scans (SM scan fallback for SWSH; SVE for SV). Regular scans plus a labeled simulated reverse finish are used; this does not claim to supply distinct reverse scans or complete the reverse-card catalog backlog. Pack collection keys retain card ID and finish separately. EX Unown, Platinum Arceus/Rotom and SWSH Trainer Gallery get separate parallel-slot pools. Custom cards and unclassified cards do not enter booster pools.

Opening, inventory increment and unrevealed cards are committed together before the reveal. Reveal flags persist, so reload/navigation never reroll an existing pack. Storage failure rolls back the whole operation. Bounded collection pages avoid rendering unlimited saved inventory at once. Rarity shine and hidden card backs respect reduced-motion and inspection privacy. Pack inventory is separate from game journals and decks; exports include it in the existing workspace.

Cards reveal automatically in pack order. Space opens a new pack; held keys, text fields, dropdowns and open dialogs do not trigger extra packs. Reveal progress pauses away from the pack view and resumes without rerolling saved pulls.

## Pack artwork and special expansions — October16 update

Actual booster packshots are bundled per expansion from the public 1niceroli asset collection: https://github.com/1niceroli/ptcg-assets . Exact source URLs, sizes and SHA256 hashes are retained in pack-art.js and work/rules-research/pack-art-manifest.json. Images retain Pokemon artwork ownership; this remains an unofficial fan simulator. Wrapper art is independent of the cards rolled.

Official special-product references:
- SV151: https://www.pokemon.com/us/pokemon-tcg/scarlet-violet-151
- Prismatic Evolutions: https://www.pokemon.com/uk/pokemon-tcg/scarlet-violet-prismatic-evolutions
- Mega era: https://www.pokemon.com/us/pokemon-tcg/product-gallery/mega-evolution-pitch-black-booster-bundle
- 30th Celebration: https://www.pokemon.com/uk/pokemon-tcg/30th-celebration?section=overview

Special profiles retain their different pack sizes: Dragon Vault5, Double Crisis7, Detective Pikachu4, Celebrations4, 30th Celebration5 foil cards plus foil Energy. Legendary Treasures and Generations reserve two Radiant Collection positions. Celebrations can replace a main holo with a Classic Collection pull; 30th guarantees a Pikachu rare. Hidden/Shining Fates and Crown Zenith use their companion shiny/gallery pools. Numerical special rarity distributions are simulation estimates rather than audited physical print-sheet collation; confirmed English god/demigod layouts are modeled as detailed below. Reverse finishes use rendered patterns over the base scan rather than separate scans. All-foil packs use holo cosmetic finishes on the existing scans.

Automatic reveals now use600ms per card, with existing pause, privacy, save and keyboard behavior retained.

## 30th Classic Collection integration

All30 cards from the30th Classic Collection catalog pool can replace the ordinary rare-hit position in an existing30th pack. This retains five foil cards plus foil Energy, including the guaranteed Pikachu rare, and does not add a separate selectable expansion. Classic pulls retain their own printing IDs and are grouped under30th/Mega Evolution in My pulls.

Sources distinguish the dedicated three-card Classic product from the base packs: official product showcase https://www.pokemon.com/us/news/pokemon-tcg-30th-celebration-product-showcase ; official Classic highlights https://www.pokemon.com/us/features/highlighting-10-cards-from-the-pokemon-tcg-30th-celebration-classic-collection ; CGC reports base-pack inclusion https://www.cgcgrading.com/news/articles/30th-celebration-collectors-guide-59RDCAY1y4p4dElssFoUy0/ . Exact base-pack frequency is not officially published in these sources. The simulator uses an estimated Classic-slot frequency alongside its existing rarity model, rather than claiming measured physical odds.

## Subset completeness audit

The pack model exposes one shared parent/subset registry used by both generation and My pulls era filtering. External subset membership no longer depends on a recognized rarity label. Hidden Fates94, Shining Fates122, Galarian Gallery70, all four Trainer Galleries30 each, Unseen Forces Unown28, both Classic Collections25/30, inline Radiant Collections25/32, Paldean Fates shinies132 and numbered DP/Platinum subsets are covered by deterministic real-generator reachability checks:705 printings across18 groups. Every audited printing is generated through its actual weighted slot, retains pack size and has a foil finish. Subsets remain inside their parent packs, never separate booster options. work/rules-research/pack-subset-audit.json records exact tested IDs and code hashes.

This audit corrects era-filter visibility for Shiny Vault and Galarian Gallery pulls; those pools were already part of pack generation. Pack reverse finishes are now supported as described below; a complete gallery of separate printing scans remains pending.


## Reverse finishes — October 16

Pack pulls distinguish Regular, Reverse Holo, Poké Ball Reverse Holo and Master Ball Reverse Holo as separate persisted collection keys. Reveals, inspectors and right-click enlargement retain the finish. Hidden cards reveal no finish information. All effects are cosmetic layers over the available base scan; they are not separate scans and do not change deck card IDs.

Prismatic Evolutions has 108 standard reverse variants (100 expansion cards plus eight Basic Energy), 100 Poké Ball variants and 67 Master Ball variants. Master Ball eligibility is restricted to the supported non-ex Pokémon. Ball finishes replace a parallel slot without changing pack size; modeled slot frequencies are estimates. The exact variant eligibility is cached from TCGdex per-card variants_detailed records: https://api.tcgdex.net/v2/en/cards/sv08.5-001 . Counts are cross-checked against https://www.pokebeach.com/2025/01/prismatic-evolutions-set-guide-full-card-list-secret-rares-cut-cards-products-and-more . No distinct variant image is supplied by that API. work/desktop-build/pack-finish-data.cjs reproduces the local metadata.

The bulk TCGdex reverse filter returns 8,195 records but omits known older reverse printings, so it is retained as reference data rather than treated as a complete historical exclusion list. Existing era-specific standard reverse pools remain, and positively recorded Basic Energy reverse printings enter their original expansion pools. Separately numbered Aquapolis/Skyridge H holo cards are excluded from reverse pools in favor of their numbered counterparts; Crystal bonus reverses receive the reverse finish. The full reverse-printing gallery/scan catalog remains a separate backlog item.


## Additional ball finishes — October 17

The modern English catalog audit reads 4,898 card records across 27 SV/Mega-era sets, Energy sets and promos. Only unstamped standard-size reverse ball variants are eligible. Generation uses printing metadata rather than a Prismatic-only condition. In addition to Prismatic's existing100/67 pools, Black Bolt and White Flare each contribute80 Poké Ball and72 Master Ball printings; Ascended Heroes contributes34 specific Poké Ball printings and no Master Balls. Other Ascended Heroes patterns do not get mislabeled as Poké Balls. English151 has neither finish; Japanese151 printings are not imported into its packs. Generic SVE Energy finish records are not injected into unrelated expansions.

Sources: cached TCGdex variants_detailed records (for example https://api.tcgdex.net/v2/en/cards/sv10.5b-001 and https://api.tcgdex.net/v2/en/cards/me02.5-001); official Black Bolt/White Flare product description https://www.pokemon.com/us/pokemon-tcg/product-gallery/scarlet-violet-black-bolt-and-white-flare-booster-bundles ; set reference https://www.pokebeach.com/2026/01/ascended-heroes-set-guide-full-set-list-god-packs-reverse-holos-product-lineup-and-more . Model frequencies remain estimates: Black Bolt/White Flare Master Ball baseline1/15 (preliminary published set-guide estimate), Poké Ball1/3; other ball pools retain the prior model. Weighted replacements preserve pack size and ordinary reverse/chase availability. Rendered patterns over base scans, persisted finish keys and hidden-card behavior are unchanged. pack-ball-audit.json verifies actual generation of all505 eligible ball variants across the four expansions, plus exclusions.


## Ascended Heroes full pattern support — October 17

New openings use printing-specific Friend Ball23, Love Ball25, Quick Ball22, Dusk Ball26, Energy Symbols140 and Team Rocket10 pools, in addition to Poké Ball34 and plain reverse38. Every non-ex Pokémon has its one assigned ball/Rocket pattern plus its own-type Energy-symbol finish; Trainers and Special Energy use plain reverse. The per-card source is the cached TCGdex variants_detailed foil field; energy maps to the distinct energy-symbols finish key to avoid colliding with Basic Energy slot pools. Source set guide: https://www.pokebeach.com/2026/01/ascended-heroes-set-guide-full-set-list-god-packs-reverse-holos-product-lineup-and-more , Reverse Holos section.

The first parallel slot weights the140 assigned ball/Rocket variants against38 plain reverse cards. The second retains illustration/chase upgrades, with the remaining probability divided among140 Energy-symbol and38 plain reverse variants. These cosmetic distributions are estimates based on eligible pool sizes, not physical print sheets; cosmetic variants are not rarity upgrades. Ordinary rarity-upgrade behavior is retained. No Master Ball entries are created for Ascended Heroes. Older saved pulls retain their recorded finish and are not rewritten. All318 reverse variants are individually reached through the real generator and20,000 random packs check eligibility and pack size. Energy patterns use the Pokémon's printed type in pulls, inspectors and magnification. Distinct repeated SVG motifs reconstruct each finish over the base scan; no separate variant scans are claimed. Labels, per-finish inventory keys, privacy and reduced-motion behavior are retained.


## English god and demigod packs — October17

Six supported layouts across five confirmed English expansions in this catalog:
- 151: one starter line, two Illustration Rares followed by its Special Illustration Rare final evolution, replacing the final three ordinary slots; the first eight cards remain unchanged.
- Prismatic Evolutions full god pack: Master Ball Eevee074, all nine Eevee/Eeveelution SIRs and foil Basic Energy. Demigod: three distinct SIRs replacing the final three slots.
- Black Bolt / White Flare: nine distinct Illustration Rares, one SIR and foil Basic Energy from the selected expansion's pools.
- Ascended Heroes: three distinct Mega Attack Rares (strict printed MAR rarity), seven distinct SIRs (excluding MAR) and foil Basic Energy.

Sources: https://www.pokebeach.com/2023/09/scarlet-violet-151-complete-set-guide-card-images-products-demigod-packs-store-giveaways-and-more ; TCGplayer's firsthand Prismatic sample/update https://www.tcgplayer.com/content/article/Pok%C3%A9mon-TCG-Prismatic-Evolutions-Pull-Rates/d94889ea-f76a-4a13-b74d-5b0b071220a7/ ; https://www.pokebeach.com/2025/07/black-bolt-and-white-flare-english-set-guides-full-card-lists-pull-rates-cut-cards-products-and-more ; https://www.pokebeach.com/2026/01/ascended-heroes-set-guide-full-set-list-god-packs-reverse-holos-product-lineup-and-more . Japanese-only layouts are not inserted into English sets. No supported confirmation was found for additional layouts in the other124 catalog expansions.

Physical trigger frequencies are unpublished and not claimed as measured. Simulation baselines are151 demigod1/700, Prismatic full1/2000 and triple1/1000, BLK/WHT1/1000 each, Ascended1/2000, using the existing relative rarity adjustment internally. These are rare independent events with no box guarantee; no rates/comparisons or forced-special controls are exposed in the opening UI. Code cards remain omitted; all supported layouts contain11 collectible cards including Basic Energy. Array entries record packVariant so persistence and fixture cloning retain identity. All rolls and inventory writes commit before reveal; restarting never rerolls. The celebration is shown only after all cards reveal. Auto-reveal, Space, inspection, finishes, saved pulls and reduced motion retain their behavior. Ordinary-slot tests explicitly disable special replacements, while a separate500,000-pack audit tests actual special triggers, boundaries, all three151 branches, exact rarity composition and unsupported-set exclusion.
