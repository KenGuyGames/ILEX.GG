const fs=require('fs'),path=require('path'),base=path.resolve(__dirname,'../rules-research/twinleafgg-main/ptcg-server/src/sets/08-sun-and-moon');
const edits={
 'set-ultra-prism/glaceon-gx.ts':[['Frost Spear','Frost Bullet']],
 'set-sun-and-moon/bruxish.ts':[['Psychic Fangs','Psychic Fang']],
 'set-lost-thunder/suicune.ts':[['Frozen Flow','Frozen Current']],
 'set-unified-minds/rowlet-and-alolan-exeggutor-gx.ts':[['Suepr Growth','Super Growth']],
 'set-cosmic-eclipse/mimikyu.ts':[['Mischevious Hands','Mischievous Hands']],
 'set-unbroken-bonds/venomoth.ts':[['Poision Powder','Poison Powder']],
 'set-unbroken-bonds/meowth.ts':[['Tail Whip','Tail Whap']],
 'set-unbroken-bonds/muk-and-alolan-muk-gx.ts':[['Posion Absorption','Poison Absorption']],
 'set-cosmic-eclipse/mega-lopuny-and-jigglypuff-gx.ts':[['hp: number = 300','hp: number = 240']],
 'set-burning-shadows/tapu-bulu-gx.ts':[["Nature's Judgement","Nature's Judgment"]],
 'set-celestial-storm/electrode-gx.ts':[['Crash and Burn-GX','Crush and Burn-GX']],
 'set-celestial-storm/mr-mime-gx.ts':[['Magic Odds','Magic Evens'],['exactly 10, 30, 50, 70, 90, 110, 130, 150, 170, 190, 210, 230, or 250','exactly 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, or 260']],
 'set-lost-thunder/mimikyu-gx.ts':[["Let's Snuggle and Fall","Let's Snuggle & Fall"]],
 'set-crimson-invasion/registeel.ts':[['Iron Hand','Iron Fist']],
 'set-sun-and-moon-promos/tsareena-gx.ts':[['G Side Eye','Side Eye']],
 'set-team-up/muk.ts':[['Stench','Poison Sacs']]
};
const applied=[];for(const [file,pairs] of Object.entries(edits)){const p=path.join(base,file);if(!fs.existsSync(p)){console.log('MISSING '+file);continue;}let s=fs.readFileSync(p,'utf8');for(const [from,to]of pairs){if(s.includes(from)){s=s.split(from).join(to);applied.push({file,from,to});}}fs.writeFileSync(p,s);}
const evidence=path.resolve(__dirname,'../rules-research/sm-native-source-repairs.json'),previous=fs.existsSync(evidence)?JSON.parse(fs.readFileSync(evidence,'utf8')).applied:[];for(const entry of applied)if(!previous.some(r=>r.file===entry.file&&r.from===entry.from))previous.push(entry);
fs.writeFileSync(evidence,JSON.stringify({status:'candidate-unvalidated',applied:previous},null,2));console.log(applied);
