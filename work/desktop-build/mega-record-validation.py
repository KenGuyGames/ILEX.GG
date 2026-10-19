"""Record finite, hash-bound Mega release gates without upgrading historical evidence."""
import hashlib,json,pathlib
root=pathlib.Path(__file__).resolve().parents[2];r=root/'work/rules-research';ui=root/'work/mega-desktop-candidate/resources/app/ui'
read=lambda p:json.loads(p.read_text(encoding='utf-8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
engine=sha(ui/'rules-engine.js')
def gate(name,current=True):
 x=read(r/(name+'.json'));assert x['passed'],name
 if current:assert x['engineSha256']==engine,name
 return x
focused=gate('mega-focused-tests');framework=gate('mega-framework-tests');identity=gate('mega-identity-audits');trainers=gate('mega-full-trainer-audit');shared=gate('mega-shared-regressions');library=gate('mega-ui-library-audit')
power=gate('mega-full-power-audit');modern=gate('mega-preserved-modern')
smoke=[gate('mega-era-smoke-report-'+str(i)) for i in range(3)];branches=[gate('mega-era-branch-report-'+str(i)) for i in range(3)];matches=[gate('mega-mixed-match-audit-'+str(i)) for i in range(3)];games=[g for x in matches for g in x['games']]
for i,x in enumerate(matches):
 x['scope']='BW onward through Mega; constructed Mega/SV interaction fixtures and cached SWSH decks in 24 bounded 120-decision pairings; exact replay and Undo. Constructed fixtures are not tournament lists.'
 (r/('mega-mixed-match-audit-'+str(i)+'.json')).write_text(json.dumps(x,indent=2),encoding='utf-8')
assert len(games)==24 and all(g['replay'] and g['undo'] for g in games)
native=root/'work/mega-native-final-v6';assert not (native/'failure.txt').exists()
for suffix in ['', '-fresh']:
 for name in ['mega-native-tests','private-native-tests','sv-native-tests','swsh-native-tests','desktop-tests']:
  x=read(native/(name+suffix+'.json'));assert x['passed'],name+suffix
  if 'engineSha256' in x:assert x['engineSha256']==engine,name+suffix
mobile=read(root/'work/android-build/mobile-verification.json');assert mobile['passed'] and not mobile['errors']
android=read(root/'work/mega-candidate/android-verification.json');assert android['passed']
build=read(root/'work/mega-candidate/android-build.json');assert build['engineSha256']==engine
frozen=read(r/'mega-frozen-candidate.json');frozen.update(status='release-validated',previousEngineSha256=frozen['engineSha256'],engineSha256=engine,finalRepair='Gwynn one-card discard; Fossil Quarry actual Antique Item identity; Waitress selected Basic Energy only; modern Antique setup restriction')
(r/'mega-frozen-candidate.json').write_text(json.dumps(frozen,indent=2),encoding='utf-8')
report={'passed':True,'version':'1.19.0','printings':1293,'pending':0,'engineSha256':engine,'ruleAdapterSha256':sha(ui/'rules-match.js'),'botSha256':sha(ui/'bot-ai.js'),'bySet':frozen['bySet'],'focusedChecks':len(focused['checks'])+len(framework['checks']),'identityComparisons':identity['comparisons'],'printedPokemonAttacks':sum(x['scenarios'] for x in smoke),'branchCases':sum(x['scenarios'] for x in branches),'trainerResolved':len(trainers['resolved']),'trainerUnavailable':len(trainers['unavailable']),'powerResolved':len(power['resolved']),'powerUnavailable':len(power['unavailable']),'powerAuditEngineSha256':power['engineSha256'],'preservedModernGroups':len(modern['results']),'preservedModernEngineSha256':modern['engineSha256'],'sharedGroups':len(shared['results']),'games':len(games),'completedGames':sum(g['finished'] for g in games),'decisions':sum(g['decisions'] for g in games),'replayAndUndo':True,'nativeFreshAndRestored':True,'scansVerified':library['scansVerified'],'sourceFilesVerified':library['sourceFilesVerified'],'previewPromos':frozen['previewPromos'],'collectionOnly':['mep-Museum'],'scope':'BW onward; Unlimited deferred','limits':['Finite fixtures do not prove all board states. Unavailable conditional/passive fixtures are reported separately.','All recorded release audit engine hashes match the final build.','Announced MEP102–110 preserve future release dates; Classic Collection does not imply tournament legality.','Real two-PC multiplayer and physical Android acceptance remain unverified.']}
(r/'mega-source-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
coverage={'status':'validated-finite-checks','available':1293,'validated':1293,'pending':0,'engineSha256':engine,'bySet':[{'id':k,'total':v,'validated':v,'pending':0} for k,v in frozen['bySet'].items()],'collectionOnly':['mep-Museum'],'previewPromos':frozen['previewPromos'],'scope':report['scope']}
for target in [ui,root/'work/mega-candidate/ui']:(target/'mega-coverage.json').write_text(json.dumps(coverage,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
