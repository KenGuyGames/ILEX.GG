const fs=require('fs'),path=require('path');let s=fs.readFileSync(path.join(__dirname,'tournament-bot-tests.cjs'),'utf8');s=s.slice(0,s.indexOf("test('Separate"));s+=`
const {m,p,op}=start();p.bench[0].cards=[card('sm9-51')];p.discard.cards=[card('base1-100')];op.active.cards=[card('swsh2-113')];console.log('blocker',op.active.getPokemonCard().name);console.log('decision',choose(m,p),B.strategy.diagnostics());
`;const Module=require('module'),q=new Module(__filename,module);q.filename=__filename;q.paths=module.paths;q._compile(s,__filename);
