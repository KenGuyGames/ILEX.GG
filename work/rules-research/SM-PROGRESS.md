# Sun & Moon — complete implementation

ILEX.GG 1.15.0 implements **3,069/3,069 English SM-era printings, zero pending**, across 23 catalogs. Includes all 248 numbered Black Star Promos plus three promo alternates, every SM expansion and special subset, McDonald's 2017–19, both complete Trainer Kits and the omitted alternate printings. Counts distinguish numbered printings, including duplicate Kit positions, from unique effects.

Interaction scope remains **Black & White onward through SM**. Unlimited remains deferred. Historical rule profiles, formats, saved games and all earlier UI/cache/pack/audio/Android features are retained. No new official Expanded banlist is supplied. No subagents or GitHub publication were used.

Final engine: `7b9381016ff3d3a469b885342535aba901e257527ccead6c86d1325175d559b5`. Validation: 82 expected-result checks; all 4387 printed Pokémon attacks and 3 Z-Move Tool attacks; 1168 branch cases; Ability/Trainer and identity/native-guard audits; 24 bounded cached-deck games (2774 decisions) with exact replay/Undo; 13 shared suites; fresh/restored desktop v8 checks. Positive cases cover conditional evolution, named partners, win conditions, GX permissions, copying, KO responses, Fossil/Doll actions and Energy transfer. Last-opponent-turn conditions reuse the historical framework across extra turns, and first-turn abilities allow the second player to occupy either seat.

Added 68 exact scans: 56 omitted alternate printings and twelve numbered Kit Energy positions. All pass SHA-256/full decode and desktop/native cache-policy checks. Total manifest: **23,804 scans**. Twelve Kit Energy originals are limited to 253×359; retained without artificial upscaling.

Windows source/native verification, archive CRC/hashes and the signed Android 1.15.0-android.14 update are recorded separately in `sm-final-release-evidence.json`. Android retains the original signing certificate and versionCode 14; install over the existing app to retain local data. Physical Android/emulator acceptance remains pending.

These are finite tests, not proof of every possible board state. Broad sweeps record unavailable passive/conditional fixtures separately from failures; focused checks supply selected positive cases. Pilot files and native v1–7 have older hashes or harness defects and are historical evidence, not final passes. Earlier checkpoints must not overwrite the completed data. Current release tools: `sm-record-validation.cjs`, `stage-sm.py`, `package-sm.py`, `publish-android-sm.py`. Do not run the initial `sm-prepare-tests.cjs` generator over the repaired runners.

| Catalog | Implemented printings | Pending |
|---|---:|---:|
| Sun & Moon | 173 | 0 |
| SM Black Star Promos | 251 | 0 |
| SM trainer Kit (Alolan Raichu) | 30 | 0 |
| SM trainer Kit (Lycanroc) | 30 | 0 |
| Guardians Rising | 180 | 0 |
| McDonald's Collection 2017 | 12 | 0 |
| Burning Shadows | 177 | 0 |
| Shining Legends | 81 | 0 |
| Crimson Invasion | 126 | 0 |
| Ultra Prism | 178 | 0 |
| Forbidden Light | 150 | 0 |
| Celestial Storm | 187 | 0 |
| Dragon Majesty | 80 | 0 |
| McDonald's Collection 2018 | 12 | 0 |
| Lost Thunder | 240 | 0 |
| Team Up | 198 | 0 |
| Detective Pikachu | 18 | 0 |
| Unbroken Bonds | 238 | 0 |
| Unified Minds | 261 | 0 |
| Hidden Fates Shiny Vault | 94 | 0 |
| Hidden Fates | 69 | 0 |
| McDonald's Collection 2019 | 12 | 0 |
| Cosmic Eclipse | 272 | 0 |

Sources and implementation details: [SM-RULES-SOURCES.md](SM-RULES-SOURCES.md). Exact tests and limits: `sm-source-validation.json`.
