# ILEX.GG

Desktop Pokémon TCG simulator with deck building, custom cards, historical formats, a local play table, and rules automation.

## Screenshots

Screenshots from ILEX.GG 1.5.0.

### Main menu and card library

![ILEX.GG main menu and card library](ILEX.GG-desktop-preview.png)

### Play table

![ILEX.GG play table with opposing seats, prize cards and a fanned hand](ILEX.GG-widescreen-preview.png)

### Visual deck builder

![ILEX.GG visual deck builder with card images and quantities](ILEX.GG-visual-deck-preview.png)

## Status

**The complete WOTC and EX eras are playable in ILEX.GG 1.5.0**, verified October 14, 2026.

- **WOTC:** Base Set through Skyridge, including Wizards Black Star Promos, Southern Islands, Legendary Collection, and Best of Game — **1,793/1,793 entries, zero pending**.
- **EX:** Ruby & Sapphire through Power Keepers, including the Unseen Forces Unown collection, EX Trainer Kits, Nintendo promos, and POP Series 1–3 — **1,857/1,857 entries, zero pending**.

The EX release passed 155 focused checks, 5,302 scoped attack scenarios, shared WOTC/bot/Undo regressions, and fresh/restored native desktop verification. EX interaction validation covers the EX pool plus Expedition, Aquapolis, and Skyridge. Full implementation coverage does not certify every possible interaction or ruling; Unlimited and other-era interaction sweeps remain deferred.

The current build also includes format-first match setup, Limitless collection integration, updated four-track music, Undo, attack and ability search, visual decklists, and foil effects.

## Download and play

Download [ILEX.GG-Windows-Small.zip](https://github.com/KenGuyGames/ILEX.GG/releases/download/v1.5.0-build-2026-10-14/ILEX.GG-Windows-Small.zip): **one ZIP, approximately 188 MB**, reduced from 2.77 GB. Extract the entire ZIP, then launch `ILEX.GG.exe`. The runtime is included; Node.js and Python are not required.

Cards download automatically when viewed and are cached for offline use. Select **Download card images** at the bottom of the sidebar to download the full collection with pause/resume and retry. Allow about 2.5 GB of disk space for the full cache. Uncached cards need internet. The cache persists in `%APPDATA%\\TCG Lab\\card-cache` across app updates. Existing decks and workspace saves remain in use.

The source on `main` and the release's automatic source ZIP/tar.gz match this smaller build. The app files come from the release ZIP; rebuilding the synchronized rules source reproduces its engine SHA-256. See `verification/source-manifest-1.5.0.json`, `verification/desktop-verification-1.5.0.json`, and `verification/card-cache-release-1.5.0.json`.

Cache integrity, offline/restart reuse, duplicate downloads, corruption repair, bounded concurrency and pause/resume tests passed. New cache UI and live provider downloads remain unverified because the local Electron launch was blocked. Earlier desktop/engine verification is retained separately.

## Development

Use Node.js and npm. From the repository root:

```powershell
npm install
npm start
```

Card images download and cache automatically. A clean clone does not need a copied scans directory. Existing scans in `outputs/Pokemon-TCG-Lab/scans` are still used when present; select **Download card images** for full offline caching. Scans, Electron runtimes, packaged executables, personal profiles, and generated test output are excluded from Git.

The original source layout is preserved so existing scripts keep their relative paths. Build-tool dependencies:

```powershell
npm ci --prefix work/desktop-build
node work/desktop-build/wotc-library.cjs
node work/desktop-build/build-rules.cjs
node work/desktop-build/catalog.cjs
```

`npm run build:rules` bundles the checked-in TypeScript into the release engine. The card compiler and catalog-generation tools are also included for further development. Do not regenerate catalogs merely to launch the checked-in app.

Run dependent commands sequentially. Rules checks:

```powershell
node work/desktop-build/wotc-tests.cjs
node work/desktop-build/bot-tests.cjs
```

The latest `package-ex.py` excludes scans by default; `--include-scans` creates an optional offline archive. Cache tests: `node work/desktop-build/card-cache-tests.cjs`.

Legacy packaging/install scripts also expect the original local output folders and test profiles; they are retained as project history and are not a clean-clone release pipeline. Do not run `build.cjs` to update the current UI: it reconstructs an older base app.

## Credits and rights

Unofficial fan project. Pokémon names, card text and artwork belong to their respective owners. The rules engine includes modified Twinleaf code; its MIT notice is preserved in `work/desktop/ui/rules-engine-LICENSE.txt`. Card metadata originated from pokemon-tcg-data. No new license is granted for the original ILEX.GG code or third-party assets by this upload.

