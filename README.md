# ILEX.GG

Pokémon TCG simulator for **Windows and Android**, with rules automation, deck building, local/bot play, pack opening and **Cube Drafting**. **New 3DS Port Alpha** is now available as a separate starter-only homebrew download.

## New in 2.0.0

- **The forest interface:** Enter the Arena for Play, Pocket, Cube Draft and Private Multiplayer; Enter the Vault for decks, gallery, formats, custom cards and packs. Refreshed settings, forest artwork, Poké Ball navigation icons and Celebi cursor.
- **Pokémon TCG Pocket:** a separate 20-card rules model with Energy Zone, three-point games, local/bot battles, deck building, card gallery and pack opening. The bundled English pool contains **4,317 printings across 24 catalogs**, with **55 pack pools**. Paper TCG decks and Pocket decks stay separate; pack rates include simulation assumptions.
- **Table and sound improvements:** artwork in effect choices, clearer stacks/Energy, repeat Energy shortcuts and Pokémon entry, evolution, action and Knock Out cries, including reviewed form mappings. Forecasts, rejected actions and replay stay quiet.
- **Rules fixes:** reviewed Download, paired-Item recovery, Lysandre's Trump Card, Computer Search and Sableye's Overeager setup/first-player timing. Older saves keep their pinned policy; new matches use the corrected policy.
- **New 3DS forest/audio Alpha 3:** dual-screen starter play, forest menus, offline card art, menu/battle music, 18 effects, 1,340 species/form cries, SELECT audio settings, autosave and replay recovery. Public packages include **only Ember Grove Fire and Tidal Grove Water starter decks**; no imported Windows deck lists, formats or personal saves.
- **Runtime security update:** Windows and source use Electron **44.9.3**, including the certificate mitigation for GHSA-jr5w-w6x2-84p9. Game code and assets remain identical to the current 2.0.0 build. Locked build tools are updated and both dependency audits report zero known vulnerabilities at release preparation.

Existing WOTC/EX/DP/Platinum/HGSS/BW/XY/SM/SWSH/SV/Mega coverage, historical profiles, Unlimited, Cube Drafting, packs, cached artwork, music and saved workspaces remain available on desktop. Story Mode is removed/deferred and is not included.

## Download 2.0.0

| Platform | Download | Requirements |
| --- | --- | --- |
| Windows | [ILEX.GG-Windows.zip](https://github.com/KenGuyGames/ILEX.GG/releases/download/v2.0.0-build-2026-10-23/ILEX.GG-Windows.zip) | Windows 10/11 64-bit; extract the entire ZIP and run ILEX.GG.exe |
| Android | [ILEX.GG-Android.apk](https://github.com/KenGuyGames/ILEX.GG/releases/download/v2.0.0-build-2026-10-23/ILEX.GG-Android.apk) | Android 8+ and current WebView; **2.0.0-android.86 / code86** |
| New 3DS HOME Menu | [CIA + full SD bundle](https://github.com/KenGuyGames/ILEX.GG/releases/download/v2.0.0-build-2026-10-23/ILEX.GG-New3DS-CIA-SD.zip) | New 3DS / New 3DS XL / New 2DS XL with CFW and FBI; **Alpha 3** |
| New 3DS Homebrew Launcher | [3DSX + full SD bundle](https://github.com/KenGuyGames/ILEX.GG/releases/download/v2.0.0-build-2026-10-23/ILEX.GG-New3DS-Playable-Alpha.zip) | Same New-family hardware; **Alpha 3** |
| New 3DS source | [Public starter-only source](https://github.com/KenGuyGames/ILEX.GG/releases/download/v2.0.0-build-2026-10-23/ILEX.GG-New3DS-Source-Alpha.zip) | Separate devkitARM/libctru/QuickJS build prerequisites |

Windows includes its runtime; the EXE is unsigned. Keep its folder together. Android retains the original signing certificate: install over the prior APK to keep workspace/cache; do not uninstall first. Physical Android acceptance remains pending. Images download as viewed; Download card images supports pause/resume. Windows retains `%APPDATA%\TCG Lab`. Export/import transfers workspace JSON and replaces the destination workspace; there is no automatic cloud sync.

**3DS installation:** extract the full matched SD ZIP to the SD root, keeping `3ds/ilex-gg`. For HOME Menu, also install `cias/ILEX.GG-New3DS-Playable-Alpha.cia` in FBI. Updating only the CIA does not supply the forest/audio assets. Preserve `match.json`, `match.json.bak` and `audio.cfg`. Imported-format saves from private builds require their original private bundle. See [3DS installation and controls](ports/3ds/CIA-INSTALL.md) and [port scope/build notes](ports/3ds/README.md).

The 3DS Alpha is a **starter-only playable slice**, with a lightweight bot. Full-pool gameplay, deck editing/import, packs, Pocket, cube drafting and networking are pending on 3DS. The full catalog browser does not imply full playable coverage. Prior CIA installation/play/save/resume was reported on New 3DS XL; the new forest/audio update still needs physical display, sound, sleep, SD durability, memory and performance acceptance. Emulator audio commands are not a listening test.

[Android installation](verification/ILEX.GG-Android-Install.md) · [Release notes/checksums](https://github.com/KenGuyGames/ILEX.GG/releases/tag/v2.0.0-build-2026-10-23) · [Older releases](https://github.com/KenGuyGames/ILEX.GG/releases/)

## Multiplayer remains in beta

Windows retains invite/response codes, deck/readiness checks, filtered guest views, opponent-approved Undo, reconnect and hosted-match recovery. Both peers need **2.0.0**. Real local two-renderer WebRTC/STUN transport was tested; **independent external two-PC/different-NAT and complete strategic-match acceptance remain pending**. Direct WebRTC has no TURN fallback. Use trusted friends because the host can inspect full state. Android/Pocket networking, cube networking and public matchmaking remain deferred.

## Cube Drafting

Open Enter the Arena → Cube Draft. Draft a custom pool against local bots, resume saved sessions, build from your seat's picks and play local/bot matches.

- **Build your own cube:** edit printings/pools, review supported rule controls and import/export ILEX cube JSON. CubeKoga link importing has contract coverage; live desktop importing remains unverified.
- **Saved drafts and recovery:** resume active/completed drafts, confirm deletion and recover exact picks/packs across restart. Deleted presets stay deleted.
- **Cube gameplay:** mutant evolution, the two-Prize evolution barrier, unified Ability/EX/GX/V references and lowercase ex one-Prize rules. Each seat builds from its drafted pool plus Basic Energy; saved records retain their chosen rules.

Cube drafting/matches are local/bot only. Bots use a simple type/setup heuristic; descriptive notes do not execute arbitrary rules.

## Verification and limits

The paper engine rebuild reproduces SHA-256 `61bc06c62c3fdcaaa07950a3b72667d4a035c304f741e8ff5e9900594d1689d0`. Windows runtime replacement preserves all **39,943 game files** byte-for-byte; Android86 retains the matching paper engine and original signing certificate. The Pocket suite checks 78 groups and 61,000 generated packs. Public 3DS checks run three complete starter matches and save/replay safety in V8 and 32-bit QuickJS with matching final-state/journal hashes under the 64 MiB JS cap. Public packages contain two starter decks, one format and zero private imports.

The October 21 broad audit recorded 58 logic suites and ten focused native jobs; those reports retain their actual tested hashes and dates. They are ancestor evidence, not claims that every suite was rerun on every subsequent package. Fresh release-source install/start/rebuild and current focused checks are run by the [2.0.0 source workflow](https://github.com/KenGuyGames/ILEX.GG/actions/workflows/test-release-2.0.0.yml). Finite tests do not establish all possible interactions, physical Android/3DS acceptance or external Internet acceptance.

See `verification/source-manifest-2.0.0.json`, `verification/runtime-security-verification.json`, `verification/program-audit-README.md`, `work/overeager/tests.json`, `work/pocket-research/foundation-tests.json` and `ports/3ds/reports/public-release.json`.

## Earlier 1.19.0 changes (historical)

- **Complete Mega era through 30th Celebration: 1,293/1,293 standard-game printings, zero pending across ten catalogs.** MEE 16, Mega Evolution 188, MEP 110, Phantasmal Flames 130, Ascended Heroes 295, Perfect Order 124, Chaos Rising 122, Pitch Black 120, 30th 158 and Classic Collection 30.
- **MEP102â€“110 are nine officially announced anniversary previews**, with future release dates retained. Museum remains collection-only and unconfirmed RGB Mew cache rows are excluded. Classic Collection's historical mechanics do not establish tournament legality.
- Added modern Mega stage/Prize identities and reviewed Basic Energy names, physical attachment movement, damage/Weakness timing, reactive KO transfers/coins, optional Prize choices, Tool capacity/cleanup, Power Saver's condition, Gwynn's one-card discard, actual Antique Fossil identities, Waitress's selected Basic Energy and modern Antique setup restrictions.
- Fixed Windows display of the 22 new promo scans by using the already bundled, verified originals, with URL-field compatibility and official-host support; byte/hash verification and the source allowlist remain enforced.
- **22 additional exact scans**, bringing regular scan records to 23,860; 209 verified finish-specific images retained. Reverse-scan acquisition is still incomplete.
- **Android 1.19.0-android.27** includes the current Mega engine, updated mobile UI, 439 bundled startup/demo scans, original signing certificate and preserved workspace/cache.
- All earlier WOTC/EX/DP/HGSS/BW/XY/SM/SWSH/SV coverage, corrected UTF-8 comparisons, Psychic Embrace/Evosoda repairs, bots, packs, music, UI, saved formats and image caching remain available.

Interactions cover **Black & White onward through Mega**; historical profiles remain available and Unlimited is deferred. No newly maintained official Expanded banlist is included.

### Current release evidence

| Area | Recorded result |
| --- | --- |
| Mega identity and effects | 60 expected-result groups; 11,701 printed-field comparisons; 1,535 printed attack cases; 3,212 branch cases |
| Power / Trainer fixtures | 116 / 288 resolved; 300 / 86 conditional or passive fixtures explicitly unavailable |
| Mixed games | 24 bounded games, 2,111 decisions, 14 completed; exact replay/Undo |
| Shared / modern | 20 shared and 28 preserved modern groups; fresh/restored native desktop acceptance |
| Assets / Android | 23,860 regular scan hashes/decodes, 209 finish images; 140 mobile checks and three Mega landscape previews; APK CRC/signature/alignment checks |

These are finite checks, not proof of every board state. Unavailable fixtures are not passes. Current reports bind engine SHA-256 `dae9e59c8cedc6e7f40216556999a808e66800976bc0ec9569c54e109efd8722`; older reports retain their original hashes. Read `verification/desktop-verification-1.19.0.json`, `work/rules-research/mega-final-release-evidence.json`, `mega-source-validation.json`, `MEGA-PROGRESS.md` and `MEGA-RULES-SOURCES.md`.

![Mega-era desktop verification capture](docs/screenshots/mega-native.png)

## Earlier 1.18.0 beta changes

- **Multiplayer beta for Windows:** invite/response codes, legal deck/format checks, both-player readiness, filtered guest views, native card controls, opponent-approved Undo, reconnect and hosted-match recovery. Both players need the same beta build. Real network acceptance remains pending as described above.
- **Complete Sword & Shield:** 3,715/3,715 printings, zero pending across 28 catalogs, including all 307 promos, Sword & Shield through Crown Zenith, special expansions/subsets, Futsal and McDonald's 2021â€“22. Includes V-UNION composites and enlarged landscape actions.
- **Complete Scarlet & Violet:** 3,694/3,694 standard English TCG printings, zero pending across 20 catalogs, through Black Bolt/White Flare, special expansions, SVP001â€“225 and SVP500, McDonald's 2023â€“24 and SVE Energy. Battle Academy unique promos are included. My First Battle's separate simplified ruleset is excluded from standard 60-card automation.
- **Card repairs:** Custom Catcher's single/pair choices, Lysandre Labs' Tool suppression, Puzzle of Time with an empty deck and paired recovery, Shining Legends PokÃ©mon Breeder's draw/heal effect, and Jamming Net/Head Ringer opponent targeting and original ownership. Evosoda now uses the actual first-turn window; Gardevoir ex Psychic Embrace accepts typed Psychic Energy, including the corrected SVE Basic Energy mappings, with damage/nonlethal restrictions retained.
- **Publication fix:** repaired UTF-8 source comparisons for EX Delta evolution and printed PokÃ©mon/Power identities. The failing Dragon Frontiers Charmeleon â†’ Charizard Peal of Thunder regression now passes; Windows and Android were rebuilt with this correction.
- **Table and packs:** GX/VSTAR used markers and new-match setup fixes; era-correct Basic Energy artwork, including the 30th Celebration MEE009â€“016 exception. Existing saved pulls are preserved.
- **209 verified finish-specific images:** 100 Legendary Collection reverses (original low-resolution watermarks retained) and 109 Prismatic PokÃ© Ball/Master Ball images, with an Original finish images filter and source credits. Acquisition remains incomplete: 13,378 cataloged finish entries still lack verified images; other supported finishes use cosmetic reconstruction.
- **Updated Android:** same current card engine and local UI fixes, 395 bundled scans and 209 finish images. Android multiplayer is deferred. Earlier WOTC/EX/DP/HGSS/BW/XY/SM, bots, packs, music, image cache and UI remain available.

New interaction validation is scoped to **Black & White onward through Scarlet & Violet**; historical profiles remain available and Unlimited is deferred. No newly maintained official Expanded banlist is included. Modern pack contents do not imply automation beyond the implemented eras.

### Recorded validation and limits

| Area | Evidence |
| --- | --- |
| Multiplayer | 15 core checks, four simulated protocol checks, 20 native simulated two-window checks per launch; actual RTC connection and external PCs unverified |
| SWSH baseline | 67 expected-result checks, 4,869 printed attacks, 1,484 branch cases, 24 bounded games / 2,785 decisions with replay/Undo |
| SV baseline | 163 focused checks, 4,808 PokÃ©mon attacks plus six TM attacks, 7,312 branch cases, 24 bounded games / 2,161 decisions with replay/Undo |
| Latest engine fixes | 24 Evosoda and 72 Psychic Embrace focused checks; genuine replay/Undo and native fresh/restored checks recorded |
| Android | 128 mobile Chromium and 38 package checks recorded for Psychic Embrace; original certificate retained; physical-device acceptance pending |
| Assets | 23,838 scan records and 209 verified finish-specific images retained |

The broad SWSH/SV baseline reports retain their original engine hashes. The beta and Android use the publication encoding repair engine `d7bf35e686eb84cdb9746be6b9cbfbad5c65f4f96e5644b37e68fae465b524a7`; historical broad results have not been relabeled as new-hash passes. Finite fixtures and bounded games do not prove all possible interactions. See `verification/ILEX.GG-Private-verification.json`, `work/rules-research/private-preview-release.json`, `sv-source-validation.json`, `swsh-source-validation.json`, `evosoda-fix.json` and `psychic-embrace-fix.json`.

## Earlier 1.15.0 changes (historical release notes)

### Complete XY and Sun & Moon eras

- **XY: 2,208/2,208 printings, zero pending** â€” Kalos Starter, XY through Evolutions, 216 catalog XY promos, six Yellow A alternates, Double Crisis, Generations/Radiant Collection, eight 30-card Trainer Kit decks and McDonald's 2014â€“16.
- **Sun & Moon: 3,069/3,069 printings, zero pending across 23 catalogs** â€” SM through Cosmic Eclipse, Shining Legends, Dragon Majesty, Hidden Fates/Shiny Vault, Detective Pikachu, SM1â€“SM248 promos and SM30a/103a/104a, McDonald's 2017â€“19, both complete 30-position Trainer Kits and omitted alternate printings.
- Added era profiles and reviewed Mega/Primal Evolution, Fairy typing, Ancient Traits, BREAK, GX/TAG TEAM, Prism Star, Ultra Beast and Z-Move Tool interactions. Historical formats and prior WOTC/EX/DP/HGSS/BW coverage are preserved.
- New interaction validation is scoped to **Black & White onward through implemented Sun & Moon**. Unlimited, later-era automation, networking and a new official Expanded banlist remain deferred. Modern pack contents do not imply later-era automation.
- Added **68 exact scans**, bringing the manifest to **23,804**. Twelve numbered Trainer Kit Energy originals are only 253Ã—359; they are retained at their real resolution.

### Realistic Player bot

A separate **Realistic Player** option joins Easy, Normal and Hard. Local deterministic bounded search plans up to three actions, rechecks leading actions against a second concealed forecast, and considers search/discard/gust/acceleration choices, follow-up attackers, Prize exposure, excess Energy, Bench liabilities and deck-out. Combo support includes Night March/Vengeance/Bee Revenge.

Planning runs in an offline worker. Pause, Undo, difficulty changes and backgrounding cancel it; stale match/journal/table results cannot commit. Actual actions still use the existing rules reducer and forecast animations/audio remain quiet. Research used first-person tournament reports and official competitive analysis; this is not imitation training or proof of professional strength or a win-rate advantage over Hard.

### Gameplay and presentation repairs

- Corrected Basic Darkness/Metal Energy so the older Special Energy bonus/self-damage reducers apply only to explicitly Special printings; 44 targeted checks retain old Special Energy behavior.
- XY fixes cover Pyroar Flare Command costs/targets, Venipede's printing stats, Delta Evolution eligibility, Dry Skin and named Yveltal conditions, Cross Slicer/Time Freeze protection, Burning Energy recovery, attached-Energy zones/ownership, Stardust shields, native attack indexes, Mist Slash/Recoil and defensive Energy discards after damage.
- SM fixes cover attack continuation and empty-slot checks; scoped GX permissions without erasing shared history; Z-Move Tool dispatch; KO timing/history; Cat Walk/Dance of Tribute usage limits; Energy selection/transfer; conditional and named Powers; and Perfection/Time Recall copying eligibility.
- Town Map's revealed holo Prizes now stay positioned inside their pile on desktop and Android. Grass impact progress is clamped, and animation exceptions/lost frames release gameplay; Skip remains available.
- Printed attacks and Powers use transparent, outlined, full-height action regions. Accessible names/tooltips remain; copied actions, Retreat and no-scan fallbacks retain named buttons. Reviewed boundaries and joined LEGEND geometry are preserved.
- A flat green/ivory Celebi sleeve recreation is shared by hidden hands, decks, Prizes and pack backs. Its silhouette is also used by Windows/Android icons and coin faces: cream-on-green heads, green-on-cream tails. Engine coin outcomes are unchanged. Attribution and approximation limits are recorded in `work/desktop/ui/CARD-BACK-SOURCE.md`.
- Pack auto-reveal is now **450 ms**; sequential reveal, pause, Space, persistence and privacy are preserved.

### Updated Android

**1.15.0-android.14 / versionCode 14** keeps the original signing certificate. Install over the existing app to retain its workspace and cache. It includes the current SM/XY engine, Realistic Player worker, presentation fixes and landscape touch UI. **246 verified startup/Baseâ€“Fossil/SM demonstration scans** are bundled.

65 mobile checks, SM checks at three landscape sizes, 30 APK/static checks, and official SDK signature/alignment verification pass. **Physical Android device/emulator acceptance remains pending**, including native pickers, live cache downloads, lifecycle/audio and performance. This is a direct APK release, not Play Store publication.

### Current release evidence

| Area | Recorded result |
| --- | --- |
| SM | 82 expected-result checks; 4,387 PokÃ©mon attacks plus three Z-Move Tool attacks; 1,168 branch cases; Ability/Trainer and identity audits |
| Scoped SM decks | 24 bounded games, 2,774 decisions, exact replay/Undo; not 24 claimed completed games |
| XY | 52 original focused checks plus 56 interaction cases; 2,787 PokÃ©mon attacks plus two Tool attacks; 1,604 branch cases; printed-data/identity audits |
| Realistic Player | 18 tactical/privacy checks, shared bot groups with four completed starter games, eight bounded BW/XY games; 12 native worker checks per launch and 13 Android worker checks |
| Shared/native | 13 shared suites and desktop v8 fresh/restored, retaining historical formats, packs, LEGEND, UI/audio, bot and Undo |
| Integrity | 23,804 scan hashes, 5,269 provenance files, Windows archive integrity, matching Windows/Android engine and signed APK checks |

See `verification/desktop-verification-1.15.0.json`, `work/rules-research/sm-final-release-evidence.json`, `sm-source-validation.json`, `SM-PROGRESS.md`, `SM-RULES-SOURCES.md`, `xy-interaction-release.json` and `realistic-bot-release.json`. Failed/intermediate reports remain historical evidence. Finite fixtures and bounded rollouts do not prove every possible board state.

![Sun and Moon table â€” desktop verification capture](docs/screenshots/sm-native.png)

## Earlier features retained (through 1.12.0)

This release includes the locally completed 1.7.0â€“1.12.0 updates and the subsequent UI, pack, and Android improvements.

### Complete HGSS and Black & White eras

- **HGSS / Call of Legends: 605/605 printings, zero pending.** HeartGold SoulSilver, Unleashed, Undaunted, Triumphant, Call of Legends, all 25 HGSS Black Star Promos, and both HS Trainer Kits.
- **Black & White: 1,521/1,521 printings, zero pending.** BW through Legendary Treasures, Dragon Vault, all BW01â€“BW101 catalog promo entries, both BW Trainer Kits, and the McDonald's 2011/2012 collections.
- Added LEGEND-pair assembly and rules, Prime cards, Lost Zone interactions, BW Abilities, PokÃ©mon-EX, Dragon typing, Team Plasma membership, ACE SPEC and relevant era mechanics.
- All nine assembled LEGEND pairs display as one upright joined card on the table, in enlarged actions and magnification. Individual halves remain individual cards, and hidden cards stay hidden.
- WOTC **1,793/1,793**, EX **1,857/1,857**, and DP/Platinum **1,558/1,558** coverage remains available with zero pending.

Those are the historical baseline scopes for these earlier releases. Current new-work validation uses BW onward through SM as described above; older rule profiles and regressions remain available. Unlimited and online multiplayer remain deferred.

### Redesigned desktop and main menu

- Forest, obsidian and gold presentation with a full-width match table, larger Deck/Discard/Prize piles, elemental attack effects, actual damage feedback, real engine-result coin flips, and Knock Out/Prize/victory feedback.
- Saved Visuals controls for effects, speed and impact motion; Skip/Escape and system reduced-motion support. Rejected moves, forecasts and replay stay quiet, and bot dispatch waits for presentation.
- Dedicated forest home screen with Play, Deck builder, Card gallery, Formats, Custom cards and Pack opening. Audio/Visuals, workspace transfer and card-image downloads are accessible from home.
- Celebi Prime appears first at launch; eight curated Celebi printings rotate on returns to the menu, without advancing on ordinary redraws.
- Decks group PokÃ©mon by evolution lineage and copies; Trainers sort by Supporter, Item, Tool/Technical Machine and Stadium, followed by Basic/Special Energy. Saved deck order, quantities and exports are preserved.
- Indexed catalog lookups and format-compatibility caching greatly reduce deck-filter work. The recorded 306-deck benchmark reduced cold renderer filtering from about 13.4 seconds to 37.9 milliseconds; this does not measure network/image latency.

### Pack opening and collection

- **129 English pack profiles** with actual bundled booster-wrapper artwork, era/set selection, ordinary slots, chase slots and supported special-expansion structures.
- Sequential automatic reveals at 450 ms, rare-pull shine and chase glow, reveal/pause controls, Space to open one new pack, magnification and reduced-motion support. Navigation, dialogs and backgrounding pause reveals.
- A separate **My pulls** collection with quantities by finish, pagination, parent-era filtering and persistent partly revealed packs. Packs commit once before revealing; reloads resume rather than reroll, and save failures roll back.
- **705 subset printings across 18 groups** are reachable within parent packs, including Shiny Vaults, Galarian/Trainer Galleries, Radiant collections, Paldean Fates shinies, Celebrations/30th Classics, Unseen Forces Unown and numbered DP/Platinum subsets.
- Reverse Holo finishes and **505 supported PokÃ© Ball/Master Ball variants** across Prismatic Evolutions, Black Bolt, White Flare and eligible Ascended Heroes printings.
- Ascended Heroes has **318 reverse variants**, including Friend/Love/Quick/Dusk Ball, type-specific Energy symbols and Team Rocket patterns. Unsupported Master Balls and generic PokÃ©mon reverse variants are excluded.
- **Six rare English god/demigod layouts across five expansions:** 151 starter-line demigod, Prismatic Eeveelution god and triple-SIR demigod, Black Bolt/White Flare art layouts, and Ascended Heroes Mega layout. Special layouts roll once, preserve hidden identities, and celebrate only after the final reveal. Japanese-only layouts and unsupported sets are excluded.
- 30th Classic Collection's 30 printings can appear inside the parent anniversary packs; its six-card structure, guaranteed Pikachu and foil Energy are retained.

Pack collation and rare-layout frequencies are simulation estimates where physical rates are unpublished. Reverse and ball patterns are **cosmetic reconstructions over base scans**, not separate scans of every finish. Existing saved pulls are preserved. Detailed sources and limits are in [PACK-SOURCES.md](work/desktop/ui/PACK-SOURCES.md).

### Android with touch controls and a landscape table

- Tap a field PokÃ©mon for attacks, Powers and Retreat; hold a revealed card to magnify it.
- Tap a hand card and choose **Place on table**, then a highlighted destination, or drag it onto the table. Swipe horizontally through a large hand.
- A dedicated landscape arena keeps **both fields, both Benches, all piles and your hand on one screen**. Match controls, new-match settings, log, sandbox and effect choices use overlays. Ordinary Energy choices and Confirm fit at small landscape heights; large choice pools can scroll inside their controls.
- Portrait retains its scrolling layout. Touch cancellation, stale-state guards, multitouch cancellation and duplicate-click suppression preserve reducer/journal/Undo behavior.
- Android Back dismisses overlays or returns home; workspace export/import uses native file pickers. Rotation retains the app, and backgrounding pauses bot/audio/timers and bulk image downloads without changing saved preferences.
- Only INTERNET is requested; broad storage permission is not required. Downloaded artwork is size/hash checked before caching.

**Android validation limits:** 59 Chromium mobile/touch checks and 28 package/static checks passed, along with official APK v2/v3 signature and alignment verification. Landscape layouts were checked at five sizes down to 640Ã—312. **No physical Android device or Android emulator installation has been tested.** Native file pickers, real-device cache downloads, lifecycle/audio and performance still need installed-device acceptance. Touch tests mock the native bridge; this is not device certification.

### Gameplay and reliability fixes since 1.6.0

- Full-Bench searches and placement effects finish correctly for reviewed HGSS/BW cards; typed searches and required public selections retain their restrictions.
- Rescue Energy timing and owner ordering, Lost Burn physical-card costs, Ho-Oh LEGEND conversion, copied HGSS/BW Supporters, Lost Link exclusions, and zero Retreat/Insight precedence have focused regressions.
- Flexible Blend Energy and Double Colorless Energy now use shared **provided Energy units** in affected BW/HGSS attacks and bot scoring.
- First Ticket resolves simultaneous private pregame choices correctly. Mew-EX Versatile inherits eligible attacks without donors' Powers; older PokÃ©mon-ex and BW PokÃ©mon-EX identities remain distinct.
- Team Plasma Badge membership updates across zones and is removed when its Tool leaves. Hand/discard Abilities have validated controls, bot candidates, stale-view/opponent-action guards and normal Undo.
- Corrected constrained counter movement, bot counter caps, private seeded Rock Paper Scissors, G Booster/shred bypass and costs, and G Scope targeting.
- Added scoped height metadata and printed feet/inches handling for Cedric; unresolved printings remain ineligible rather than guessed.
- Fixed subset collection-era filtering, reveal/reload rerolls, finish identity, reduced-motion/stale overlay cleanup, catalog/format-cache invalidation and deck redraw performance.

## Screenshots

Earlier desktop and Android layouts (Android captures use Chromium touch emulation):

### Forest main menu

![ILEX.GG forest main menu](docs/screenshots/main-menu-1440.png)

### Play table

![ILEX.GG current desktop play table](docs/screenshots/studio-arena-1440.png)

### Pack opening

![ILEX.GG pack opening](docs/screenshots/packs-1440.png)

### Android landscape

![ILEX.GG Android landscape table](docs/screenshots/ILEX.GG-Android-landscape.png)

![ILEX.GG Android landscape Energy prompt](docs/screenshots/ILEX.GG-Android-landscape-prompt.png)

## Build and run the Windows source

Requires 64-bit Windows and **Node.js 24 with npm**, plus internet for dependencies and uncached artwork. Other desktop operating systems are not verified.

Download Source code (zip) from the [2.0.0 release](https://github.com/KenGuyGames/ILEX.GG/releases/tag/v2.0.0-build-2026-10-23), extract it, and open PowerShell in the folder containing package.json. Or clone:

```powershell
git clone --branch v2.0.0-build-2026-10-23 --depth 1 https://github.com/KenGuyGames/ILEX.GG.git
cd ILEX.GG
npm install
npm start
```

Keep the terminal open while playing. Normal launches use the existing Windows workspace; export it before source experiments. The ready-to-run engine is included; Python and a copied scan folder are not needed to launch.

Rebuild and launch:

```powershell
npm ci --prefix work/desktop-build
npm run build:rules
npm start
```

The wrapper compiles the canonical corrected TypeScript in `work/cube-source/src`. The rebuilt engine must match the SHA-256 above and `verification/source-manifest-2.0.0.json`. Do not rerun initial card generators over this release. Pocket has a separate model/engine and frozen compiler inputs in `work/desktop/ui/pocket-source`.

Run current focused checks sequentially:

```powershell
npm run test:cube
npm run test:cube-import
npm run test:overeager
npm run test:pocket
npm run test:multiplayer
npm run test:protocol
node work/desktop-build/card-cache-tests.cjs
```

The source workflow downloads the tag afresh, follows these install/start/rebuild/test commands, checks fresh/restored native UI and verifies every manifest file in both automatic ZIP/tar.gz downloads. Network protocol tests use simulated delivery; they do not establish external connectivity. Native tests use isolated profiles and environment-specific no-sandbox/disable-gpu flags; ordinary launches retain the Chromium sandbox.

### Android and 3DS source

[Android source/build notes](work/android-build/README.md) require JDK17, official SDK tools and Python separately. The original signing key/password are excluded; another key cannot update an installed release in place. Current Android-specific UI source is included. Historical packaging scripts expect original staging/output folders and are not a clean-clone release pipeline; do not use legacy `build.cjs` to regenerate the current UI.

[3DS source/build notes](ports/3ds/README.md) describe the separate native starter port. No SDK, emulator profile, personal deck library or save is included. Install art/media/catalog from the matched public SD bundle. Rebuilding native code requires devkitARM/libctru and matching QuickJS-NG0.17.0 32-bit bytecode tooling; CIA packaging also needs the documented tools.

## Earlier release trailer

[![Watch the ILEX.GG 1.5.0 EX-era release trailer on YouTube](https://img.youtube.com/vi/qoMEsEkn7J8/hqdefault.jpg)](https://www.youtube.com/watch?v=qoMEsEkn7J8)

[Watch on YouTube](https://www.youtube.com/watch?v=qoMEsEkn7J8). This is the earlier EX-era trailer, not a demonstration of every current feature. Planned features in it are not promises of availability. ILEX.GG remains a work in progress.

## Credits and rights

Unofficial fan project. PokÃ©mon names, card text and artwork belong to their respective owners. Modified Twinleaf rules-engine code retains its MIT notice at `work/desktop/ui/rules-engine-LICENSE.txt`. Card metadata originated from pokemon-tcg-data; booster artwork sources are documented in PACK-SOURCES.md. No new license is granted for original ILEX.GG code or third-party assets by this upload.

