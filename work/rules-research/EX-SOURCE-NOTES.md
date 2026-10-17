# EX printing corrections

Mr. Stone's Project (ex9-79): the canonical transcription omits “Energy” in both search branches. The bundled printing explicitly searches basic Energy cards. `ex-text-corrections.cjs` repairs compiler and offline metadata consistently, while retaining the downloaded canonical files unchanged.

Reviewed scan: `outputs/Pokemon-TCG-Lab/scans/f1dd4a13748a74ec0222e670.webp`. The [official EX Emerald card dex, page 26](https://assets.pokemon.com/assets/cms/pdf/tcg/carddex/EX_Emerald.pdf) corroborates that restriction.

Groudon (ex9-14): the same official card dex says Eruption adds 20 per discarded Energy, but the bundled printed card says 10. The canonical transcription matches the scan; retain 10. Reviewed scan: `outputs/Pokemon-TCG-Lab/scans/ecea3f2cc74f882085b8b5ae.webp`.

EX Power Keepers primary card text: [official card dex](https://assets.pokemon.com/assets/cms/pdf/tcg/carddex/EX_Power_Keepers.pdf). Historical first-turn Supporter profiles still need primary rulebook verification; do not infer later EX rules from contemporary rulebooks.


## Nintendo promo correction (October 14)

NP-39 Rayquaza ex was reviewed against the bundled scan `outputs/ILEX.GG-win32-x64/resources/scans/b83f1be3ed92fc63fe6c4676.webp`. Frenzy says its attacks do **40 more damage**, not merely 40 damage. `ex-text-corrections.cjs` retains the printing-specific correction for generation and offline metadata. The NP set uses uppercase EX subtypes; subtype matching is case-insensitive for Pokemon-ex tagging. All 40 Nintendo Black Star Promos and all 17 POP Series 1 printings are now in the EX candidate inventory. Later promo series remain outside this implementation scope.


## Root Fossil candidate review (October 14)

Legend Maker ex12-80 and Holon Phantoms ex13-93 share the full canonical 40-HP fossil rules and Spongy Stone with EX Emerald's matching variant. The reviewed-fossil generator gate checks the complete rules and Body text, accepting only the recorded "At any time"/"At any times" wording difference. It reuses the repaired Root Fossil SS implementation; it does not infer a fossil from the name alone. Source corrections cover actual selected-stack discard, no-Prize KO targeting, Power-inflicted Special Condition immunity, and a single EX checkup heal. These are candidate source/runtime checks, not new scan or native package certification.
