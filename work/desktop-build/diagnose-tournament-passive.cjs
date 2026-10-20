const fs=require('fs'),path=require('path');let s=fs.readFileSync(path.join(__dirname,'tournament-bot-tests.cjs'),'utf8');s=s.slice(0,s.indexOf("test('Separate"));s+=`
const {m,p}=start();p.active.cards=[card('sm10-76')];console.log(p.active.getPokemonCard().powers);console.log('decision',choose(m,p),B.strategy.diagnostics());
`;const Module=require('module'),q=new Module(__filename,module);q.filename=__filename;q.paths=module.paths;q._compile(s,__filename);
