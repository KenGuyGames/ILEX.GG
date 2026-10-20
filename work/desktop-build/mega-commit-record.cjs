const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),research=path.join(root,'work/rules-research'),file=path.join(research,'mega-final-release-evidence.json'),v=JSON.parse(fs.readFileSync(file,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
if(!v.passed||v.printings!==1293||sha(path.join(root,'outputs/ILEX.GG-win32-x64/resources/app/ui/rules-engine.js'))!==v.engineSha256||sha(path.join(root,'outputs/ILEX.GG-Android.apk'))!==v.androidSha256)throw Error('Released files do not match final evidence');
v.preservedBackups=fs.readdirSync(path.join(root,'work')).filter(n=>n.startsWith('before-mega-')).map(n=>'work/'+n);fs.writeFileSync(file,JSON.stringify(v,null,2));
const header=`# Latest completed scope — Mega era through 30th Celebration (October 19, 2026)

ILEX.GG **1.19.0** is verified and released locally: **1,293/1,293 standard-game printings, zero pending**, across ten catalogs. MEE16, Mega Evolution188, MEP110, Phantasmal Flames130, Ascended Heroes295, Perfect Order124, Chaos Rising122, Pitch Black120, 30th158 and Classic Collection30. MEP102–110 are nine officially announced anniversary previews with future release dates retained. Museum is collection-only; unconfirmed RGB Mew cache rows excluded. BW onward; Unlimited deferred.

Final engine ${v.engineSha256}.60 expected-result groups,11,701 printed-field comparisons,1,535 printed attack cases,3,212 branch cases, Power/Trainer audits,24 bounded mixed games (${v.decisions} decisions;${v.completedGames} completed) with exact replay/Undo,20 shared and28 preserved modern groups, native fresh/restored and Android checks pass. Finite checks are not exhaustive proof; unavailable conditional/passive fixtures are separate.23,860 regular scan hashes/decodes and209 preserved finish images pass.

Windows EXE and both ZIPs updated/integrity verified. Android **1.19.0-android.27/code27**, original signing certificate retained; physical Android acceptance pending. Private Windows multiplayer preview retained, but real external two-PC connection/full-match acceptance remains unverified. No subagents or GitHub publication. Existing features, saves, historical formats and signing preserved. Reverse scan acquisition remains incomplete.

Read work/rules-research/MEGA-PROGRESS.md and mega-final-release-evidence.json. Canonical corrected UTF-8 source is **work/cube-source/src**; build only with ILEX_RULES_SOURCE_ROOT=work/cube-source/src and ILEX_RULES_OUTFILE=work/mega-candidate/ui/rules-engine.js. Do not build older shared mojibake source or rerun initial generators over the release. Canonical source/provenance shipped under resources/app/card-effect-sources/mega-source and mega-source-manifest.json. Packaging scripts: package-mega.py and finish-mega.cjs; final evidence commit: mega-commit-record.cjs.

---

`.replaceAll('MEE16','MEE 16').replaceAll('Evolution188','Evolution 188').replaceAll('MEP110','MEP 110').replaceAll('Flames130','Flames 130').replaceAll('Heroes295','Heroes 295').replaceAll('Order124','Order 124').replaceAll('Rising122','Rising 122').replaceAll('Black120','Black 120').replaceAll('30th158','30th 158').replaceAll('Collection30','Collection 30').replaceAll('.60 ','. 60 ').replaceAll(',11,701',', 11,701').replaceAll(',1,535',', 1,535').replaceAll(',3,212',', 3,212').replaceAll(',24 ', ', 24 ').replaceAll(';14 ', '; 14 ').replaceAll(',20 ', ', 20 ').replaceAll('and28','and 28').replaceAll('.23,860','. 23,860').replaceAll('and209','and 209');
const agents=path.join(root,'AGENTS.md');if(!fs.readFileSync(agents,'utf8').startsWith('# Latest completed scope — Mega era'))fs.writeFileSync(agents,header+fs.readFileSync(agents,'utf8'));
console.log('Mega release evidence and continuation instructions committed.');
