const fs=require('fs'),path=require('path');let s=fs.readFileSync(path.join(__dirname,'tournament-bot-tests.cjs'),'utf8');s=s.slice(0,s.indexOf("test('Separate"));s+=`
const d=JSON.parse(fs.readFileSync(path.join(root,'work/rules-research/swsh-cached-decks.json')))[6];console.log(d.name);for(const id of Object.keys(d.cards)){const c=card(id);if(c.powers?.length)console.log(id,c.name,c.powers);}
`;const Module=require('module'),q=new Module(__filename,module);q.filename=__filename;q.paths=module.paths;q._compile(s,__filename);
