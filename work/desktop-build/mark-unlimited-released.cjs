const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..'),research=path.join(root,'work/rules-research');const e=JSON.parse(fs.readFileSync(path.join(research,'unlimited-final-release-evidence.json')));if(!e.passed||e.version!=='1.20.0'||!e.archives.every(a=>a.crcPassed))throw Error('Release not verified');
const note=`# Latest completed scope — Unlimited interactions (October 19, 2026)

ILEX.GG **1.20.0** enables all implemented eras under the Unlimited profile. Kenneth explicitly lifted the BW-onward restriction. Modern turn/Burn/Tool rules; historical mechanics and explicit saved profiles retained.1508 Trainer and108 Special Energy reprint overrides preserve original IDs/art; no blanket Pokemon aliasing or Basic/Special Energy merge. No official banlist update.

Final engine ${e.engineSha256}.199 expected-result groups,28792 printed attacks,2384 resolved Trainer fixtures (380 unavailable separately),20 shared and28 preserved modern suites,30 bounded mixed-era games (2358 decisions,24 completed) with exact replay/Undo, fresh/restored Windows,146 mobile checks and three Unlimited landscape sizes pass. These finite tests are not exhaustive proof.23860 regular scans and209 finish images verified/preserved; reverse finish acquisition remains incomplete.

Windows app and both ZIPs updated locally. Running older Windows EXE was locked, so the new local launcher is **${e.executablePath}**; archives contain the normal ILEX.GG.exe name with1.20.0 metadata. Do not close the user's running app without authorization. Android1.20.0-android.28/code28 retains original signing certificate. Physical Android and actual external two-PC full-match acceptance remain unverified. Private beta and all prior features retained. No subagents or GitHub publication.

Read work/rules-research/UNLIMITED-PROGRESS.md, unlimited-source-validation.json and unlimited-final-release-evidence.json. Corrected canonical source work/unlimited-source/src, UI work/unlimited-candidate/ui; build with ILEX_RULES_SOURCE_ROOT=work/unlimited-source/src and ILEX_RULES_OUTFILE=work/unlimited-candidate/ui/rules-engine.js. Do not build older mojibake shared source or rerun initial generators. Frozen source archive and hash manifest shipped. Packaging package-unlimited.py has a versioned-launcher fallback for locked EXEs; mark-unlimited-released.cjs finalizes notes after verified archives.

---

`;
fs.writeFileSync(path.join(root,'AGENTS.md'),note+fs.readFileSync(path.join(root,'AGENTS.md'),'utf8'));
fs.appendFileSync(path.join(research,'UNLIMITED-PROGRESS.md'),'\nWindows release note: the running prior EXE was locked. New local launcher: '+e.executablePath+'. ZIPs contain the normal ILEX.GG.exe filename. Older process was left running. Previous release archives and UI/EXE backups are preserved.\n');console.log('Verified Unlimited release notes finalized.');
