# Sun & Moon rules and printing sources

Scope: English SM1–12 through Cosmic Eclipse, Shining Legends, Dragon Majesty, Hidden Fates and Shiny Vault, Detective Pikachu, SM1–SM248 Black Star Promos plus SM30a/SM103a/SM104a, McDonald's 2017–19 and both complete Sun & Moon Trainer Kit decks. Total 3,069 printing identities across 23 catalogs. New interactions use BW onward through SM; Unlimited remains deferred. These counts include individually numbered duplicate Trainer Kit positions and alternate art printings, not 3,069 distinct effects.

Primary rules references:

- Official Sun & Moon changes: https://www.pokemon.com/us/strategy/big-changes-in-pokemon-tcg-sun-moon/
- Ultra Prism rulebook, GX and Prism Star rules: https://assets.pokemon.com/assets/cms2/pdf/trading-card-game/rulebook/sm5_rulebook_en.pdf
- Team Up rulebook, TAG TEAM Prizes: https://assets.pokemon.com/assets/cms2/pdf/trading-card-game/rulebook/sm9_rulebook_en.pdf
- Cosmic Eclipse rulebook: https://assets.pokemon.com/assets/cms2/pdf/trading-card-game/rulebook/sm12_rulebook_en.pdf
- Official Trainer Kit product: https://www.pokemon.com/uk/pokemon-tcg/product-gallery/sun-moon-trainer-kit-lycanroc-alolan-raichu/
- Official Genesect-GX printing: https://www.pokemon.com/us/pokemon-tcg/pokemon-cards/series/sm8/224/
- Official Will printing: https://www.pokemon-card.com/card-search/details.php/card/37457/regu/all
- Official Will rulings: https://www.pokemon-card.com/rules/faq/search.php?page=446&regulation=all&sc_group_id=728/1000

The Will rulings distinguish the first eligible coin in an effect from later coins, preserve Contrary's forced result, and exclude Confusion checks. The implementation therefore marks system Confusion coins separately and applies Contrary after Will's choice. GX history remains shared across Pokémon and Z-Move Tools. Bonnie and Misty & Lorelei grant turn- and Pokémon-specific permissions without erasing GX history. TAG TEAM Supporter optional bonuses that require playing the card are excluded when its effect is copied.

Printing text/costs and identities are preserved from the cached English Pokémon TCG Data files: https://github.com/PokemonTCG/pokemon-tcg-data/tree/master/cards/en . These community-maintained records are checked against specific scans/official rules for missing or ambiguous cases; they are not an official exhaustive rulings database. Existing native implementations are candidates until checked, not accepted merely because a name matches.

Trainer Kit data lacked full printed attack costs and twelve numbered Energy positions. Actual scans were reviewed and supplement records retain the individual positions. The Lycanroc list and numbered Energy scans were checked at https://tcgscreener.com/pokemon/sm-trainer-kit-lycanroc ; those twelve original scans are only 253×359. Other additional alternate scans use the exact Pokémon TCG Data image URLs listed in sm-additional-printings.json. All 68 imported files retain their original bytes, SHA-256, dimensions and full image-decode results in sm-additional-scan-audit.json. Filenames use the existing cache's 24-hex format; no new network trust rule was needed.

Validation includes every printed Pokémon attack, all three printed Z-Move Tool attacks, compiled branch cases, focused positive/negative conditions, Ability/Trainer sweeps, construction and identity checks, and bounded cached-deck games with deterministic replay/Undo. Conditional positive checks cover evolution, named partners, Unown wins, copying via Perfection/Time Recall, Fossil/Doll actions, KO responses and Energy transfers. Perfection/Time Recall use the existing enlarged Ability action to choose an eligible attack, then enforce its cost and resolve it through the attack pipeline. Unavailable sweep fixtures are recorded separately from errors.

Repairs discovered during validation include lost attack continuation context, empty-slot type checks, Double Drive cleanup, GX permissions, Z-Tool dispatch accidentally reaching generic Berry healing, Sanctuary's attack index and counters, hand-index Energy prompts, Plunge, Seal of Antiquity, Bag Slash, TAG TEAM recovery eligibility/distribution, Golden Wing's pre-discard continuation, shared Cat Walk/Dance of Tribute limits, Time Recall's eligible evolution list and imported Basic Metal aliases.

Finite tests do not prove all possible board states or every cross-era pairing. Shared historical regression suites are preserved, but Unlimited interaction sweeps and a new official Expanded banlist are not part of this release. Android Chromium emulation/static APK/signature checks do not constitute physical Android device acceptance.
