# ILEX.GG

Desktop Pokémon TCG simulator with deck building, custom cards, historical formats, a local play table, and WOTC rules automation.

## Status

This repository preserves the latest development source, including unfinished WOTC implementation work. The source progress notes record 1,501 of 1,793 WOTC scan entries available, with 292 pending. The previously verified Windows package is older (1,363 available, 430 pending). These are recorded snapshot figures, not a new verification of this repository. See `work/rules-research/WOTC-PROGRESS.md` and `FEATURE-BACKLOG.md`.

## Development

Use Node.js and npm. From the repository root:

```powershell
npm install
npm start
```

The app expects offline scans in `outputs/Pokemon-TCG-Lab/scans`. Copy that directory from the existing local ILEX.GG project before launching for full offline artwork. Scans, Electron runtimes, packaged executables, personal profiles, and generated test output are excluded from Git.

The original source layout is preserved so existing scripts keep their relative paths. Build-tool dependencies:

```powershell
npm ci --prefix work/desktop-build
node work/desktop-build/wotc-library.cjs
node work/desktop-build/build-rules.cjs
node work/desktop-build/catalog.cjs
```

Run dependent commands sequentially. Rules checks:

```powershell
node work/desktop-build/wotc-tests.cjs
node work/desktop-build/bot-tests.cjs
```

Legacy packaging/install scripts also expect the original local output folders and test profiles; they are retained as project history and are not a clean-clone release pipeline. Do not run `build.cjs` to update the current UI: it reconstructs an older base app.

## Credits and rights

Unofficial fan project. Pokémon names, card text and artwork belong to their respective owners. The rules engine includes modified Twinleaf code; its MIT notice is preserved in `work/desktop/ui/rules-engine-LICENSE.txt`. Card metadata originated from pokemon-tcg-data. No new license is granted for the original ILEX.GG code or third-party assets by this upload.
