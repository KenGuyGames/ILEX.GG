# ILEX.GG

Pokémon TCG simulator for **Windows and Android**, with historical rules automation, deck building, local/bot play, custom cards, and a pack-opening simulator.

## Download 1.12.0

| Platform | Download | Requirements |
| --- | --- | --- |
| Windows | [ILEX.GG-Windows.zip](https://github.com/KenGuyGames/ILEX.GG/releases/download/v1.12.0-build-2026-10-17/ILEX.GG-Windows.zip) — about 232 MiB | 64-bit Windows; extract the entire ZIP and run `ILEX.GG.exe` |
| Android | [ILEX.GG-Android.apk](https://github.com/KenGuyGames/ILEX.GG/releases/download/v1.12.0-build-2026-10-17/ILEX.GG-Android.apk) — about 75 MiB | Android 8.0+ and a current Android System WebView/Chrome |

Windows includes its runtime; Node.js and Python are not needed to play. Android is a signed universal APK (`gg.ilex.app`, version `1.12.0-android.2`, versionCode 2), distributed directly here rather than through the Play Store. Install over an existing ILEX.GG Android installation to keep its workspace and cache; do not uninstall first.

[Android installation and controls](verification/ILEX.GG-Android-Install.md) · [Checksums and verification reports](https://github.com/KenGuyGames/ILEX.GG/releases/tag/v1.12.0-build-2026-10-17) · [Older releases](https://github.com/KenGuyGames/ILEX.GG/releases)

Card images download as viewed and remain cached. Use **Download card images** on the main menu to cache the full collection (about 2.5 GB), with pause/resume. Uncached images need internet. Windows retains the existing `%APPDATA%\TCG Lab` workspace and image cache. Android bundles 236 verified images covering Base–Fossil and the eight menu Celebi cards; other images use its private verified cache.

To move decks/saves between platforms, **Export workspace**, transfer the JSON, then **Import workspace** on the other device. Import replaces that device's workspace, so export it first if needed. There is no automatic cloud synchronization.

## What's new since the last GitHub release (1.6.0)

This release includes the locally completed 1.7.0–1.12.0 updates and the subsequent UI, pack, and Android improvements.

### Complete HGSS and Black & White eras

- **HGSS / Call of Legends: 605/605 printings, zero pending.** HeartGold SoulSilver, Unleashed, Undaunted, Triumphant, Call of Legends, all 25 HGSS Black Star Promos, and both HS Trainer Kits.
- **Black & White: 1,521/1,521 printings, zero pending.** BW through Legendary Treasures, Dragon Vault, all BW01–BW101 catalog promo entries, both BW Trainer Kits, and the McDonald's 2011/2012 collections.
- Added LEGEND-pair assembly and rules, Prime cards, Lost Zone interactions, BW Abilities, Pokémon-EX, Dragon typing, Team Plasma membership, ACE SPEC and relevant era mechanics.
- All nine assembled LEGEND pairs display as one upright joined card on the table, in enlarged actions and magnification. Individual halves remain individual cards, and hidden cards stay hidden.
- WOTC **1,793/1,793**, EX **1,857/1,857**, and DP/Platinum **1,558/1,558** coverage remains available with zero pending.

The latest BW interaction validation covers **HGSS through Call of Legends plus the implemented BW pool**; HGSS validation covers the authorized Holon Phantoms-onward pool. Earlier era regressions are retained. Full printing coverage does not certify every possible cross-era interaction. Unlimited, XY-era automation, online multiplayer, and unrelated interaction sweeps remain deferred. Modern pack contents do not imply modern card automation.

### Redesigned desktop and main menu

- Forest, obsidian and gold presentation with a full-width match table, larger Deck/Discard/Prize piles, elemental attack effects, actual damage feedback, real engine-result coin flips, and Knock Out/Prize/victory feedback.
- Saved Visuals controls for effects, speed and impact motion; Skip/Escape and system reduced-motion support. Rejected moves, forecasts and replay stay quiet, and bot dispatch waits for presentation.
- Dedicated forest home screen with Play, Deck builder, Card gallery, Formats, Custom cards and Pack opening. Audio/Visuals, workspace transfer and card-image downloads are accessible from home.
- Celebi Prime appears first at launch; eight curated Celebi printings rotate on returns to the menu, without advancing on ordinary redraws.
- Decks group Pokémon by evolution lineage and copies; Trainers sort by Supporter, Item, Tool/Technical Machine and Stadium, followed by Basic/Special Energy. Saved deck order, quantities and exports are preserved.
- Indexed catalog lookups and format-compatibility caching greatly reduce deck-filter work. The recorded 306-deck benchmark reduced cold renderer filtering from about 13.4 seconds to 37.9 milliseconds; this does not measure network/image latency.

### Pack opening and collection

- **129 English pack profiles** with actual bundled booster-wrapper artwork, era/set selection, ordinary slots, chase slots and supported special-expansion structures.
- Sequential automatic reveals at 600 ms, rare-pull shine and chase glow, reveal/pause controls, Space to open one new pack, magnification and reduced-motion support. Navigation, dialogs and backgrounding pause reveals.
- A separate **My pulls** collection with quantities by finish, pagination, parent-era filtering and persistent partly revealed packs. Packs commit once before revealing; reloads resume rather than reroll, and save failures roll back.
- **705 subset printings across 18 groups** are reachable within parent packs, including Shiny Vaults, Galarian/Trainer Galleries, Radiant collections, Paldean Fates shinies, Celebrations/30th Classics, Unseen Forces Unown and numbered DP/Platinum subsets.
- Reverse Holo finishes and **505 supported Poké Ball/Master Ball variants** across Prismatic Evolutions, Black Bolt, White Flare and eligible Ascended Heroes printings.
- Ascended Heroes has **318 reverse variants**, including Friend/Love/Quick/Dusk Ball, type-specific Energy symbols and Team Rocket patterns. Unsupported Master Balls and generic Pokémon reverse variants are excluded.
- **Six rare English god/demigod layouts across five expansions:** 151 starter-line demigod, Prismatic Eeveelution god and triple-SIR demigod, Black Bolt/White Flare art layouts, and Ascended Heroes Mega layout. Special layouts roll once, preserve hidden identities, and celebrate only after the final reveal. Japanese-only layouts and unsupported sets are excluded.
- 30th Classic Collection's 30 printings can appear inside the parent anniversary packs; its six-card structure, guaranteed Pikachu and foil Energy are retained.

Pack collation and rare-layout frequencies are simulation estimates where physical rates are unpublished. Reverse and ball patterns are **cosmetic reconstructions over base scans**, not separate scans of every finish. Existing saved pulls are preserved. Detailed sources and limits are in [PACK-SOURCES.md](work/desktop/ui/PACK-SOURCES.md).

### Android with touch controls and a landscape table

- Tap a field Pokémon for attacks, Powers and Retreat; hold a revealed card to magnify it.
- Tap a hand card and choose **Place on table**, then a highlighted destination, or drag it onto the table. Swipe horizontally through a large hand.
- A dedicated landscape arena keeps **both fields, both Benches, all piles and your hand on one screen**. Match controls, new-match settings, log, sandbox and effect choices use overlays. Ordinary Energy choices and Confirm fit at small landscape heights; large choice pools can scroll inside their controls.
- Portrait retains its scrolling layout. Touch cancellation, stale-state guards, multitouch cancellation and duplicate-click suppression preserve reducer/journal/Undo behavior.
- Android Back dismisses overlays or returns home; workspace export/import uses native file pickers. Rotation retains the app, and backgrounding pauses bot/audio/timers and bulk image downloads without changing saved preferences.
- Only INTERNET is requested; broad storage permission is not required. Downloaded artwork is size/hash checked before caching.

**Android validation limits:** 59 Chromium mobile/touch checks and 28 package/static checks passed, along with official APK v2/v3 signature and alignment verification. Landscape layouts were checked at five sizes down to 640×312. **No physical Android device or Android emulator installation has been tested.** Native file pickers, real-device cache downloads, lifecycle/audio and performance still need installed-device acceptance. Touch tests mock the native bridge; this is not device certification.

### Gameplay and reliability fixes since 1.6.0

- Full-Bench searches and placement effects finish correctly for reviewed HGSS/BW cards; typed searches and required public selections retain their restrictions.
- Rescue Energy timing and owner ordering, Lost Burn physical-card costs, Ho-Oh LEGEND conversion, copied HGSS/BW Supporters, Lost Link exclusions, and zero Retreat/Insight precedence have focused regressions.
- Flexible Blend Energy and Double Colorless Energy now use shared **provided Energy units** in affected BW/HGSS attacks and bot scoring.
- First Ticket resolves simultaneous private pregame choices correctly. Mew-EX Versatile inherits eligible attacks without donors' Powers; older Pokémon-ex and BW Pokémon-EX identities remain distinct.
- Team Plasma Badge membership updates across zones and is removed when its Tool leaves. Hand/discard Abilities have validated controls, bot candidates, stale-view/opponent-action guards and normal Undo.
- Corrected constrained counter movement, bot counter caps, private seeded Rock Paper Scissors, G Booster/shred bypass and costs, and G Scope targeting.
- Added scoped height metadata and printed feet/inches handling for Cedric; unresolved printings remain ineligible rather than guessed.
- Fixed subset collection-era filtering, reveal/reload rerolls, finish identity, reduced-motion/stale overlay cleanup, catalog/format-cache invalidation and deck redraw performance.

## Screenshots

Current 1.12.0 desktop and Android views:

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

Requires 64-bit Windows and **Node.js 24 with npm**, plus internet for dependencies, Electron and uncached images. Other desktop operating systems are not verified.

Download **Source code (zip)** from the [1.12.0 release](https://github.com/KenGuyGames/ILEX.GG/releases/tag/v1.12.0-build-2026-10-17), extract it, and open PowerShell in the folder containing `package.json`. Or clone:

```powershell
git clone --branch v1.12.0-build-2026-10-17 --depth 1 https://github.com/KenGuyGames/ILEX.GG.git
cd ILEX.GG
```

Install and launch:

```powershell
npm install
npm start
```

Keep the terminal open while the app runs. Python and a copied scans folder are not required to launch. Normal source launches use the existing Windows workspace; export it before experimenting with source changes.

The ready-to-run engine is included. To rebuild the checked-in TypeScript:

```powershell
npm ci --prefix work/desktop-build
npm run build:rules
npm start
```

Run commands sequentially. The rebuilt engine must match SHA-256 `a7f812b8c255e0246245455792f1be041a86c7212b0a8e0fed6999360423ab59`, recorded in `verification/source-manifest-1.12.0.json`.

### Run checks

```powershell
npm run test:rules
npm run test:ex
npm run test:dp
npm run test:hgss
npm run test:bw
npm run test:bot
node work/desktop-build/card-cache-tests.cjs
```

`test:rules` runs the focused shared WOTC suite used by the current release. The earlier full WOTC enumeration remains historical baseline evidence; run `node work/desktop-build/wotc-tests.cjs` explicitly for that broader, slower suite.

The [1.12.0 fresh-source workflow](https://github.com/KenGuyGames/ILEX.GG/actions/workflows/test-release-1.12.0.yml) checks installation, normal startup, the engine rebuild, README test commands and native desktop interactions on a clean Windows runner.

### Recorded release verification

| Area | Evidence |
| --- | --- |
| BW | 66 focused checks; all 2,206 printed Pokémon attacks plus two Tool attacks; 5,196 branch cases; Power/Trainer audits |
| Scoped BW decks | 18 bounded rollouts, 1,596 decisions, exact replay/Undo; not 18 claimed completed games |
| Shared regressions | HGSS 32, DP 109, EX 170, focused WOTC 127, bot 17 including three complete starter games, Undo seven |
| Desktop | Fresh/restored native checks for gameplay, presentation, menu, deck sorting/performance, all nine LEGEND pairs, packs and persistence |
| Packs | 303 ordinary checks; 705 subset, 505 ball and 318 Ascended-pattern reachability cases; 500,000 production-generator samples for six special layouts |
| Package | 23,736 scan hashes, 1,941 bundled provenance files, Windows archive integrity and engine/source consistency |
| Android | 59 emulated touch/layout checks, 28 package/static checks, APK CRCs, official signatures and alignment; device acceptance pending |

Reports are included in `verification/desktop-verification-1.12.0.json`, `verification/ILEX.GG-Android-verification.json`, `work/android-build/mobile-verification.json` and `work/rules-research`. Earlier and failed discovery reports are retained as historical evidence; they are not relabeled as final passes. Finite tests do not prove every board state.

Recorded native desktop release checks used isolated profiles and test-only no-sandbox/disable-gpu flags required by that environment. Normal launches retain the Chromium sandbox. A full live download of every image is not part of fresh-source verification.

### Android source and packaging

Android source and rebuild notes are in [work/android-build/README.md](work/android-build/README.md). Rebuilding requires JDK 17, the verified official Android SDK tools and Python; it is separate from the Windows Node.js instructions. The original signing key and password are deliberately excluded. A build signed with a different key cannot update the installed release in place.

`package-bw.py` is the current desktop verification/packaging script. Packaging scripts expect original candidate/output folders and native profiles; they are not a clean-clone release pipeline. Do not use the legacy `work/desktop-build/build.cjs` to regenerate the current UI.

## Earlier release trailer

[![Watch the ILEX.GG 1.5.0 EX-era release trailer on YouTube](https://img.youtube.com/vi/qoMEsEkn7J8/hqdefault.jpg)](https://www.youtube.com/watch?v=qoMEsEkn7J8)

[Watch on YouTube](https://www.youtube.com/watch?v=qoMEsEkn7J8). This is the earlier EX-era trailer, not a demonstration of every current feature. Planned features in it are not promises of availability. ILEX.GG remains a work in progress.

## Credits and rights

Unofficial fan project. Pokémon names, card text and artwork belong to their respective owners. Modified Twinleaf rules-engine code retains its MIT notice at `work/desktop/ui/rules-engine-LICENSE.txt`. Card metadata originated from pokemon-tcg-data; booster artwork sources are documented in PACK-SOURCES.md. No new license is granted for original ILEX.GG code or third-party assets by this upload.

