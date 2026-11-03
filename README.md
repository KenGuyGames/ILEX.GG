# ILEX.GG 3.5.0 for Windows

This source snapshot includes **Echoes of Tomorrow** and **Delta Reign**. Finish **The Fractured Hour** to unlock the new campaign. Delta Reign adds 141 catalog entries, a pack profile, and three paired Stadiums.

Use PowerShell in the extracted source folder on Windows 10 or 11 x64 with Node.js 24 and npm.

```powershell
npm install
npm start
```

The included rules engine matches the Windows release. To rebuild it and run the Delta Reign regression check:

```powershell
npm ci --prefix work/desktop-build
npm run build:rules
npm run test:delta-reign
```

The packaged Windows ZIP and checksums are available on the [3.5.0 release page](https://github.com/KenGuyGames/ILEX.GG/releases/tag/v3.5.0-build-2026-11-02). The source manifest records the Windows ZIP hash and the matching desktop files.
