const fs=require('fs'),path=require('path');let s=fs.readFileSync(path.join(__dirname,'tournament-bot-tests.cjs'),'utf8');s=s.slice(0,s.indexOf("test('Separate"));s+=`
const {m,p}=start();for(const id of ['bw7-49','base1-2','bw1-26','sm3-93']){p.active.cards=[card(id),...Array.from({length:4},()=>card('base1-102'))];p.active.damage=40;console.log(id,p.active.getPokemonCard().attacks,B.strategy.printedPotential(m,p.id));}
`;const Module=require('module'),q=new Module(__filename,module);q.filename=__filename;q.paths=module.paths;q._compile(s,__filename);
