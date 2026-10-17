# Next Destinies / Dark Explorers — active October16,2026

Authorized scope: BW4, BW5 and period promos through Dark Explorers; interactions with HGSS1–4/Call of Legends, their supplements and implemented BW1–5. Unlimited and later BW sets remain deferred. No subagents used. Baseline release was1.10.0; release1.11.0 is complete and verified.

## Inventory

Next Destinies103, Dark Explorers111 and BW33–BW44 promos12:226 new printings. Cumulative early BW coverage633/633, zero pending, including previous BW1–3, BW01–BW32 and both BW Trainer Kits. BW44 Kyurem Box released June2012 before Dragons Exalted. BW45+ Legendary EX Tins and Dragons Exalted promos excluded. Sources: https://bulbapedia.bulbagarden.net/wiki/BW_Black_Star_Promos_(TCG) and https://bulbapedia.bulbagarden.net/wiki/Black_%26_White_TCG_Series_merchandise .

## Implementation and repairs

Cumulative methods559 native reuses,70 compiled Pokemon and4 compiled Trainers. Added Battle City through shared coin-draw Stadium logic; Old Amber Aerodactyl reuses the identical implemented fossil effect. Cilan and Hooligans Jim & Cas have compiled copy handlers for HGSS Smeargle. Full-Bench guards repair Lapras and Minccino Call for Family. Eelektross now uses shared switch-then-damage and actual-damage healing handlers instead of a broken after-attack context. BW Pokemon-EX typing is separate from historical lowercase Pokemon-ex; era-aware classification retains older canonical uppercase EX records as historical ex.

Initial final attack pass found three implementation errors (Lapras, Minccino, Eelektross) plus correctly blocked Slowbro Airhead. Smoke fixture now uses five Prizes for Slowbro; focused checks cover blocked even and allowed odd counts. First tag repair exposed uppercase historical EX metadata in shared regressions; corrected before final verification. Earlier smoke/nativev55 reports predate this final tag repair and are not final release evidence.

## Final validation

Final candidate engine19391308c88b37817c58fe57e856640457cfc1e36765862a87f1ef3dcb64c0a4.36 focused checks, all907 printed attack smoke cases and1392 additional new-card branch scenarios pass. Ability audit24 resolved/64 expected unavailable (includes passive Abilities); Trainer audit112 resolved/12 expected preconditions, no unexpected failures. Nineteen scoped real-deck rollouts,1786 decisions bounded100 per game, all difficulties, planning immutability/exact replay/Undo pass. Shared HGSS32/DP109/EX170/WOTCfocused127/bot17 with3 completed starter games/Undo7 pass. Nativev56 fresh/restored passes29 BW checks and full inherited UI/pack/LEGEND suites. Supplemental Dark Cloak vs HGSS Tangled Vines check passes in both player orders; logged separately from the36 packaged focused checks. All final reports match the final engine, or are dated after its build where no engine hash is recorded.

Expected-result tests include X Ball/DCE units, Psychic Mirage, Dark Cloak/HGSS Rainbow, Diving Draw, Dark Patch, Heal Block, Battle City, fossil bottom-seven selection, Slurp Shakedown targets and Suction Heal Weakness. Finite fixtures and bounded rollouts do not prove every possible game state. Unlimited remains deferred.

## Packaging
EXE and compact ZIP207815927bytes verified. Offline ZIP2774945964bytes verified. EXE and both ZIPs are updated, all CRC and embedded-engine checks pass.23736 scan hashes and1265 provenance hashes verified. No GitHub publication; Unlimited deferred.
