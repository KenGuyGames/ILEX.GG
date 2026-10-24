const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.resolve(__dirname,'../../..'),ctx=vm.createContext({console});
for(const f of ['runtime/base-engine.js','runtime/rules-match.js','runtime/bot-ai.js','runtime/map.js','runtime/play.js','tests/play-controller.js'])vm.runInContext(fs.readFileSync(path.join(root,'ports/3ds',f),'utf8'),ctx,{filename:f,timeout:240000});
fs.writeFileSync(path.join(root,'ports/3ds/reports/play-v8.json'),JSON.stringify(ctx.IlexPlayTests,null,2));console.log(JSON.stringify(ctx.IlexPlayTests));
