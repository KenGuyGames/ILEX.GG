# DP / Platinum rules and card sources

Scope: Diamond & Pearl through Platinum Arceus, DP Black Star Promos, POP Series 4–9, DP Trainer Kits and Pokemon Rumble. Interaction validation starts with EX Holon Phantoms (EX13–16 plus this pool). Unlimited remains deferred.

Primary historical rules: Pokemon Platinum Arceus rulebook, including the level-up appendices and first-turn rules: https://assets.pokemon.com/assets/cms/pdf/tcg/rulebooks/Arceus_Rulebook.pdf . The dppl profile keeps additive Weakness, historical Burn, first-turn draw/attack and first-turn Trainer/Supporter/Stadium restrictions. Existing saved matches retain their selected profile.

Official card-specific corrections: https://assets.pokemon.com/assets/cms/pdf/tcg/tcg_errata.pdf . The compiler applies matching card-specific corrections rather than modern blanket Trainer rewrites. English scan corrections and the exact affected clauses are in dp-scan-corrections.cjs and dp-errata.cjs in the included card-effect sources. Each generated printing retains source/errata metadata.

PUI/Pokemon Organized Play rulings: the historical Pokemon Rulings Compendium LVX, preserved at https://doczz.net/doc/193314/rulings-compendium-lvx---pokemon-rulings-compendium . This is a mirror of attributed Rules Team rulings, used because the original compendium endpoint rejected access. Relevant decisions include Energy Shift on either player's turn (December 6, 2007), Restore with no Bench space (July 10, 2008), Power cancellation before ordinary effects, the end-turn errata for Vacation/Waterlog, and Dark Eyes after resolution. Mirror provenance is distinguished from the official rulebook and errata PDF.

Card text: bundled English printing records and scans; missing DP Trainer Kit text was checked against TCGdex. The scan manifest records individual source/hash provenance. Compiled clauses must match completely; unknown text is not silently promoted by a partial match.

Implementation coverage is 1,558/1,558 printings. Finite execution and interaction tests do not certify every possible board state or historic ruling. See desktop-verification.json and validation/dp-platinum for executed checks, valid precondition rejections, bounded bot rollouts and final repair evidence.
