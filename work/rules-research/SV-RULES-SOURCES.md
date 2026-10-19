# Scarlet & Violet rules and source evidence

Scope: English standard-TCG Scarlet & Violet era, 3,694 cataloged printings across 20 catalogs. Includes all SVP001–225 and SVP500, both McDonald’s catalogs, SVE Energy and special expansions through Black Bolt/White Flare. Battle Academy 2024's ten unique promos are SVP105–114; reprinted and deck-stamped cards use their original mechanics. My First Battle is a separate simplified 17-card game and is excluded from standard 60-card automation. Finish variants share effects; the verified reverse-scan backlog remains incomplete.

Printed source records and exact compiled/native choices are preserved in `sv-era-candidate-data.json`, provenance reports and the packaged source archive. Missing McDonald’s records were transcribed from reviewed bundled scans and matching original printings; see `sv-mcd-source-provenance.json`. These records, not name-only substitutions, supply printing stats, attack costs and damage. The supplementary completeness audit is `sv-supplement-completeness.json`.

Rules research:

- [Official advanced rules manual](https://asia.pokemon-card.com/sg/wp-content/uploads/sites/6/2025/10/EN_advanced_manual-2025.pdf): effect targets for outgoing versus incoming switches, replacement state retention, damage and Knock Out ordering. Ogre's Mask retains the occupied slot and same-Ability usage; outgoing Roar immunity differs from incoming gust immunity.
- [Official Milotic card](https://www.pokemon-card.com/card-search/details.php/card/46875): Mentally Calm protection. Whole-Pokémon returns are blocked before attached cards move; removing an Evolution while another Pokémon remains is treated separately.
- [Official My First Battle product](https://www.pokemon.com/us/pokemon-tcg/product-gallery/my-first-battle) and [official parent guide](https://parents.pokemon.com/en-us/trading-card-game/): distinguish its mini-decks from normal 60-card play.
- [Official Black Bolt/White Flare](https://www.pokemon-card.com/ex/sv11/index.html): era end expansion identity and finish variants.

Interactions remain Black & White onward, retaining older historical profiles. Unlimited interactions remain deferred. The implementation does not supply a newly maintained official Expanded banlist. Finite expected-result, attack, branch, Ability/Trainer, replay/Undo and native checks establish the tested cases; they do not prove every board state. Passive and conditional Ability/Trainer fixture exclusions are recorded explicitly. Physical Android device acceptance remains pending.
