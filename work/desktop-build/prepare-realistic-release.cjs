const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..'),dir=path.join(root,'work/desktop-build');
let s=fs.readFileSync(path.join(dir,'package-transparent-actions.py'),'utf8').replace(/\r\n/g,'\n').replaceAll('desktop-celebi-brand-tests','desktop-realistic-tests-v3').replaceAll('transparent-actions-desktop-release.json','realistic-bot-desktop-release.json').replaceAll('1.13.3','1.14.0');
s=s.replace("engine=digest(ui/'rules-engine.js');",`bot_sha=digest(ui/'bot-ai.js')
focused=load(research/'realistic-bot-tests.json');assert focused['passed'] and focused['botSha256']==bot_sha and len(focused['checks'])==18
shared_bot=load(research/'bot-test-report.json');assert shared_bot['passed'] and len(shared_bot['games'])==4 and {g['level'] for g in shared_bot['games']}=={'easy','normal','hard','realistic'}
for pair in range(4):
 audit=load(research/('realistic-bot-matches-'+str(pair)+'.json'));assert audit['passed'] and audit['botSha256']==bot_sha and len(audit['games'])==2 and all(g['replay'] and g['undo'] for g in audit['games'])
for run_label in ['fresh','restored']:
 check=load(native/('realistic-native-tests'+('-fresh' if run_label=='fresh' else '')+'.json'));assert check['passed'] and check['botSha256']==bot_sha and len(check['checks'])==12
engine=digest(ui/'rules-engine.js');`);
s=s.replace("native_names=['desktop-tests'","native_names=['realistic-native-tests','desktop-tests'");
s=s.replace("audit_dir=candidate/'resources/app/validation/xy';",`bot_dir=candidate/'resources/app/validation/bot';bot_dir.mkdir(parents=True,exist_ok=True)
for file in research.glob('realistic-bot-*.json'):
 if file.name in ['realistic-bot-tests.json']+['realistic-bot-matches-'+str(i)+'.json' for i in range(4)]:shutil.copy2(file,bot_dir/file.name)
shutil.copy2(research/'bot-test-report.json',bot_dir/'shared-bot-regressions.json')
shutil.copy2(research/'REALISTIC-BOT-RESEARCH.md',bot_dir/'RESEARCH.md')
shutil.copy2(native/'realistic-native-tests.json',bot_dir/'desktop-native.json')
audit_dir=candidate/'resources/app/validation/xy';`);
s=s.replace('# ILEX.GG 1.14.0\n\n','# ILEX.GG 1.14.0\n\nSelect Realistic Player in the new-match or live Bot difficulty menu. This offline mode uses multi-action planning, contextual search/discard/target choices, follow-up attackers, prize/risk planning and resource conservation. Its background worker keeps the table responsive and cancels on pause, Undo or difficulty changes. Forecasts conceal hidden opponent cards and future draw/prize order. This is a researched heuristic policy; finite scenario and mixed-deck checks do not establish tournament-level strength. Research and validation are in resources/app/validation/bot.\n\n');
fs.writeFileSync(path.join(dir,'package-realistic-bot.py'),s);console.log('Realistic Player packaging gates prepared.');
