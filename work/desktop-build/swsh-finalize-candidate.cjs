const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto'),root=path.resolve(__dirname,'../..'),research=path.join(root,'work/rules-research'),ui=path.join(root,'work/desktop/ui'),native=path.join(root,'work/desktop-swsh-tests-v5'),python='C:/Users/Kenneth/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',engine=crypto.createHash('sha256').update(fs.readFileSync(path.join(ui,'rules-engine.js'))).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const reports=['swsh-focused-tests','swsh-tool-attacks','swsh-ui-integration','swsh-bot-core-current','swsh-cross-era-tests','swsh-full-power-audit','swsh-full-trainer-audit','swsh-deep-identity','swsh-native-guard-audit','swsh-shared-regressions',...[0,1,2].flatMap(i=>['swsh-full-smoke-report-'+i,'swsh-full-branch-report-'+i,'swsh-full-match-audit-'+i])];
async function waitFor(label,check){const until=Date.now()+7200000;while(Date.now()<until){if(check()){console.log(label+' ready');return;}await new Promise(r=>setTimeout(r,5000));}throw Error(label+' exceeded bounded wait');}
async function run(label,exe,args,extra={}){console.log('Running '+label);const fd=fs.openSync(path.join(research,'swsh-release-'+label+'.log'),'w');const code=await new Promise((resolve,reject)=>{const child=cp.spawn(exe,args,{cwd:root,env:{...process.env,...extra},windowsHide:true,stdio:['ignore',fd,fd]});child.on('error',reject);child.on('exit',resolve);});fs.closeSync(fd);if(code!==0)throw Error(label+' exit '+code);console.log(label+' passed');}
(async()=>{
 await waitFor('Current-engine source reports',()=>reports.every(name=>{const f=path.join(research,name+'.json');if(!fs.existsSync(f))return false;const r=read(f);if(r.engineSha256!==engine)return false;if(!r.passed)throw Error(name+' failed');return true;}));
 await run('source-validation',process.execPath,['work/desktop-build/swsh-record-validation.cjs']);
 await run('completion-notes',process.execPath,['work/desktop-build/swsh-release-notes.cjs']);
 const android={ILEX_ANDROID_OUTPUT:path.join(root,'work/android-build/ILEX.GG-SWSH-candidate.apk'),ILEX_ANDROID_REPORT:path.join(root,'work/android-build/swsh-build.json'),ILEX_ANDROID_VERIFICATION:path.join(root,'work/android-build/swsh-apk-verification.json')};
 await run('android-build',python,['work/android-build/build.py'],android);
 // The mobile preview is run explicitly and reviewed before publication.
 await waitFor('Mobile preview',()=>{const f=path.join(root,'work/android-build/swsh-mobile-tests.json');if(!fs.existsSync(f))return false;const r=read(f);return r.passed&&r.engineSha256===engine;});
 await run('apk-verify',python,['work/android-build/verify.py'],android);
 await waitFor('Fresh/restored desktop',()=>{if(fs.existsSync(path.join(native,'failure.txt')))throw Error(fs.readFileSync(path.join(native,'failure.txt'),'utf8'));const files=['swsh-native-tests.json','swsh-native-tests-fresh.json','persistence.json'];if(files.some(f=>!fs.existsSync(path.join(native,f))))return false;const [a,b,p]=files.map(f=>read(path.join(native,f)));return a.passed&&b.passed&&a.restored&&a.engineSha256===engine&&b.engineSha256===engine&&p.passed&&p.exactJournalAndDeckOrder;});
 await run('stage',python,['work/desktop-build/stage-swsh.py']);
 await run('windows-package',python,['work/desktop-build/package-swsh.py']);
 console.log('Candidates verified. Review screenshots before Android publication and final evidence.');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
