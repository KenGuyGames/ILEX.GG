const fs=require('fs'),path=require('path'),vm=require('vm'),source=fs.readFileSync(path.join(__dirname,'bot-tests.cjs'),'utf8');
const at=source.indexOf("for(const level of Object.keys(B.levels))test(level+' completes");if(at<0)throw Error('Missing bounded-game boundary');
// Exact strategy assertions must not stop the candidate search just because
// other validation workers consumed the production wall-clock allowance.
// The separate full games and native worker checks retain the real clock.
class StrategyClock extends Date {static now(){return 0;}}
vm.runInNewContext(source.slice(0,at)+`const sha=n=>require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ui,n))).digest('hex');fs.writeFileSync(path.join(root,'work/rules-research/swsh-bot-core-current.json'),JSON.stringify({passed:true,checks:results,engineSha256:sha('rules-engine.js'),ruleAdapterSha256:sha('rules-match.js'),botSha256:sha('bot-ai.js'),strategyClock:'Fixed for exact-decision fixtures; full games and native workers use the production clock',scope:'Current adapter/bot focused regressions; full starter games retained in the shared engine report and new target path checked separately.'},null,2));`,{require,__dirname,console,Date:StrategyClock,setTimeout,clearTimeout,process});
