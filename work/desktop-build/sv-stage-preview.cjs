const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..');
const distribution=path.join(root,'outputs/ILEX.GG-win32-x64'),candidate=path.join(root,'work/sv-desktop-candidate'),app=path.join(candidate,'resources/app'),ui=path.join(app,'ui');
fs.mkdirSync(candidate,{recursive:true});
for(const name of fs.readdirSync(distribution))if(name!=='resources')fs.cpSync(path.join(distribution,name),path.join(candidate,name),{recursive:true});
fs.mkdirSync(path.dirname(app),{recursive:true});fs.cpSync(path.join(root,'work/desktop'),app,{recursive:true});
const scans=path.join(candidate,'resources/scans');fs.cpSync(path.join(distribution,'resources/scans'),scans,{recursive:true,force:false});
fs.copyFileSync(path.join(root,'work/sv-candidate/rules-engine.js'),path.join(ui,'rules-engine.js'));
const read=n=>JSON.parse(fs.readFileSync(path.join(ui,n),'utf8')),write=(n,d)=>fs.writeFileSync(path.join(ui,n),JSON.stringify(d));
const records=require('../rules-research/sv-era-candidate-data.json'),map=read('rules-card-map.json'),metadata=read('card-details.json'),codes=read('deck-set-codes.json');
for(const {d}of records){map[d.id]='ILEX DP '+d.id;metadata[d.id]={...metadata[d.id],id:d.id,name:d.name,category:d.supertype==='Pokémon'?'Pokemon':d.supertype,stage:d.subtypes?.find(s=>['Basic','Stage 1','Stage 2'].includes(s)),hp:d.hp?+d.hp:undefined,types:d.types||[],subtypes:d.subtypes||[],rarity:d.rarity||metadata[d.id]?.rarity,attacks:(d.attacks||[]).map(a=>({name:a.name,cost:a.cost,damage:a.damage,effect:a.text})),abilities:(d.abilities||[]).map(a=>({name:a.name,type:a.type,effect:a.text})),evolvesFrom:d.evolvesFrom,number:d.number,ptcgoCode:codes[d.set.id]||d.set.id.toUpperCase(),rules:d.rules||[],...(d.supertype==='Energy'?{energyType:d.subtypes?.includes('Basic')?'Basic':'Special'}:{})};}
write('rules-card-map.json',map);write('card-details.json',metadata);
const coverage=read('rules-coverage.json');coverage.unsupported=coverage.unsupported.filter(c=>!map[c.id]);coverage.mappedPrintings=Object.keys(map).length;write('rules-coverage.json',coverage);
write('sv-coverage.json',require('../desktop/ui/sv-era-source-coverage.json'));
const pkg=JSON.parse(fs.readFileSync(path.join(app,'package.json'),'utf8'));pkg.version='1.17.0';writePackage();function writePackage(){fs.writeFileSync(path.join(app,'package.json'),JSON.stringify(pkg,null,2));}
fs.writeFileSync(path.join(app,'self-test.cjs'),"module.exports=require('./sv-self-test.cjs');\n");
console.log(JSON.stringify({candidate,printings:records.length,releaseUpdated:false}));
