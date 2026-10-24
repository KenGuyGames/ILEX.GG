for (const f of ['runtime/base-engine.js','runtime/rules-match.js','runtime/bot-ai.js','runtime/map.js','runtime/play.js','tests/play-controller.js']) std.loadScript('ports/3ds/'+f);
print(JSON.stringify(IlexPlayTests));
