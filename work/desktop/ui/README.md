# ILEX.GG

Includes a local scan for every one of the 23,736 entries in the bundled TCGdex English index, including Pokémon TCG Pocket. Zero entries remain unresolved. Scans occupy approximately 2.56 GB.

Extract the entire Windows ZIP and launch ILEX.GG.exe from its top-level folder. Keep its resources and runtime files together. The desktop app loads local scans and preserves your previous TCG Lab workspace. See the top-level README.md for historical rules, automation coverage, Limitless import and verification details.

Coverage means one front image per entry in the English index downloaded October 11, 2026. It does not establish coverage of every language, foil finish, physical printing variant, or cards absent from that upstream index. Some special collections use synthetic index numbers matched to actual printed cards. Resolution varies by source. Landscape BREAK and LEGEND artwork is preserved.

scan-audit.json records coverage and source counts. scan-manifest.json records each card ID, local filename, original source URL, byte count and SHA-256 hash. scan-verification.json records full image decoding and hash verification. The library's Scan coverage report displays the audit.

Sources: [TCGdex](https://tcgdex.dev/), [Pokémon TCG API data](https://github.com/PokemonTCG/pokemon-tcg-data), [PkmnCards](https://pkmncards.com/), [Malie](https://malie.io/), [Limitless Pocket](https://pocket.limitlesstcg.com/cards), [TCGCSV](https://tcgcsv.com/) / TCGplayer, [TCGScreener](https://tcgscreener.com/), [Dex for TCG Collectors](https://dextcg.com/), and [PokéBeach](https://www.pokebeach.com/2024/08/grand-adventure-collection-featuring-pokemon-horizons-promos-in-november). Exact image URLs are retained in the manifest.

Features: searchable library and set filters, saved decks, custom cards, configurable formats, format validation, JSON workspace export/import, and a two-player local manual tabletop with opening hands, prizes, deck search, shuffle, mulligans, card movement, damage, conditions, coin flips, game log and undo.

Card effects and rules are resolved manually. There is no automatic rules engine, AI opponent, or online multiplayer. Attachments and evolution have no dedicated stack. The active zone holds one card and the bench holds five. The Expanded-era preset is a configurable era filter; configure rotation, bans and exceptions for tournament use.

Decks, formats, custom cards and the game save in browser local storage. Export the workspace for backup. Custom artwork URLs should be publicly accessible HTTPS images.

JavaScript syntax and automated smoke checks cover deck additions, opening deal, draws, prizes and card movement. Browser visual QA and hosted deployment were not completed in this environment. Fan-made and unofficial; Pokémon names and artwork belong to their respective owners.
