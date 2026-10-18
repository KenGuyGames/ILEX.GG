const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..'),read=p=>JSON.parse(fs.readFileSync(p,'utf8')),dir=path.join(root,'work/card-sources/pokemon-tcg-data-master/cards/en');
const raw=fs.readdirSync(dir).filter(f=>/^sm|^xy|^bw/.test(f)).flatMap(f=>read(path.join(dir,f))),verified=require('./sm-kit-verified.json'),cards=read(path.join(root,'work/desktop/ui/cards.json')),data=[],pending=[],choices=[];
const attack=(name,cost,damage='',text='')=>({name,cost,damage:String(damage),text});
const unique={
 Caterpie:{hp:'50',types:['Grass'],weaknesses:[{type:'Fire',value:'×2'}],retreatCost:['Colorless'],attacks:[attack('Nap',['Colorless'],'','Heal 20 damage from this Pokémon.'),attack('Gnaw',['Colorless','Colorless'],20)]},
 Lycanroc:{hp:'110',types:['Fighting'],subtypes:['Stage 1'],evolvesFrom:'Rockruff',weaknesses:[{type:'Grass',value:'×2'}],retreatCost:['Colorless'],attacks:[attack('Bite',['Colorless','Colorless'],20),attack('Claw Slash',['Fighting','Fighting','Colorless'],80)]},
 'Alolan Raichu':{hp:'110',types:['Lightning'],subtypes:['Stage 1'],evolvesFrom:'Pikachu',weaknesses:[{type:'Fighting',value:'×2'}],resistances:[{type:'Metal',value:'-20'}],retreatCost:['Colorless'],attacks:[attack('Quick Attack',['Lightning'],'10+','Flip a coin. If heads, this attack does 30 more damage.'),attack('Electric Surfer',['Lightning','Colorless','Colorless'],70)]}
};
for(const scan of cards.filter(c=>c.id.startsWith('tk-sm-'))){const group=scan.id.replace(/-\d+$/,''),v=verified[scan.name];let source;
 if(v)source=raw.find(d=>d.name===scan.name&&String(d.hp)===String(v[0])&&(d.attacks||[]).map(a=>a.name).join('|')===v[1]);
 else source=raw.find(d=>d.name===scan.name&&(scan.name.endsWith('Energy')?d.supertype==='Energy'&&d.subtypes.includes('Basic'):d.supertype==='Trainer'));
 if(!source&&unique[scan.name])source={id:'scan-transcription:'+scan.id,name:scan.name,supertype:'Pokémon',subtypes:['Basic'],...unique[scan.name]};
 if(!source){if(!pending.some(r=>r.name===scan.name))pending.push({id:scan.id,name:scan.name,verified:v});continue;}
 choices.push({id:scan.id,equivalent:source.id});data.push({...source,id:scan.id,number:scan.id.slice(group.length+1),set:{id:group},_source:{kind:'bundled-scan-reviewed-reprint',scan:scan.scan,printedEquivalent:source.id}});
}
fs.writeFileSync(path.join(root,'work/card-sources/sm-supplements.json'),JSON.stringify(data,null,2));fs.writeFileSync(path.join(root,'work/rules-research/sm-kit-text-audit.json'),JSON.stringify({status:'candidate-unvalidated',choices,pending},null,2));console.log({saved:data.length,pending});
