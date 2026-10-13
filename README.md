# ILEX.GG

Desktop Pokémon TCG simulator with deck building, custom cards, historical formats, a local play table, and rules automation.

## Status

**The complete WOTC era is playable in the current Windows build**, from Base Set through Skyridge, including Wizards Black Star Promos, Southern Islands, Legendary Collection, and Best of Game. All **1,793 WOTC scan entries** have rules implementations, with **zero pending** in the verified October 13, 2026 build.

The current build also includes Undo, attack and ability search, visual decklists, audio, and foil effects. Full implementation coverage does not certify every possible card interaction or ruling; Unlimited and interactions with later-era cards remain deferred.

## Download and play

Get the [current Windows x64 release](https://github.com/KenGuyGames/ILEX.GG/releases/tag/v1.4.0-build-2026-10-13), including the runtime and offline card scans. Download `ILEX.GG-Windows.zip.001`, `ILEX.GG-Windows.zip.002`, and `Restore-ILEX-ZIP.cmd` into the same folder. Run the script to restore and checksum-verify the ZIP, extract the entire ZIP, then launch `ILEX.GG.exe`. No Node.js or Python installation is required.

The repository source, source archive, and development progress notes still represent the earlier snapshot. Use the Windows release above for the complete WOTC implementation; rebuilding the existing repository snapshot does not reproduce that release.

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
