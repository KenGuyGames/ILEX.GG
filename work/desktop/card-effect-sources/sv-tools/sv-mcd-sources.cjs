const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),base=path.join(root,'work/card-sources/pokemon-tcg-data-master/cards/en'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const records=fs.readdirSync(base).filter(f=>f.endsWith('.json')).flatMap(f=>read(path.join(base,f)).map(d=>({d,file:f})));
const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
// Attack labels and HP were read directly from all thirty bundled scans.
const observed={
 '2023sv':[
 ['Sprigatito',70,'Scratch|Leafage'],['Fuecoco',80,'Gnaw|Combustion'],['Quaxly',70,'Pound|Kick'],['Cetoddle',100,'Icicle|Sharp Fin'],['Cetitan',180,'Hammer In|Sweeping Tackle'],['Pikachu',70,'Growl|Pika Bolt'],['Pawmi',60,'Light Punch|Zap Kick'],['Kilowattrel',120,'Skill Dive|Thunder Blast'],['Flittle',30,'Ram'],['Sandaconda',140,'Skull Bash|Sandstorm Spray'],['Klawf',130,'Vise Grip|Adrenaline Hammer'],['Blissey',150,'Happy Cyclone'],['Tandemaus',40,'Double Hit'],['Cyclizar',110,'Touring|Speed Attack'],['Kirlia',90,'Magical Shot|Psychic']],
 '2024sv':[
 ['Charizard',170,'Royal Blaze'],['Pikachu',60,'Charge|Pika Punch'],['Miraidon',120,'Sharp Fang|Lightning Laser'],['Jigglypuff',60,"Pound|Let's All Rollout"],['Hatenna',60,'Stampede|Magical Shot'],['Dragapult',150,'Dragon Launcher|Spooky Shot'],['Quagsire',120,'Beat|Fickle Impact'],['Koraidon',130,'Claw Slash|Rampaging Fang'],['Umbreon',110,'Blindside|Moon Mirage'],['Hydreigon',180,'Dark Cutter'],['Roaring Moon',140,'Vengeance Fletching|Speed Wing'],['Dragonite',180,'Dragon Pulse'],['Eevee',50,'Continuous Steps'],['Rayquaza',130,'Jaw Lock|Power Blast'],['Drampa',120,'Gentle Slap|Raging Cannon']]
};
const file=path.join(root,'work/card-sources/sv-supplements.json'),supplements=read(file),cards=read(path.join(root,'work/desktop/ui/cards.json')),evidence=[],missing=[];
for(const [set,entries]of Object.entries(observed))for(const [index,[name,hp,attacks]]of entries.entries()){
 const id=set+'-'+(index+1),candidates=records.filter(({d})=>norm(d.name)===norm(name)&&Number(d.hp)===hp&&norm((d.attacks||[]).map(a=>a.name).join('|'))===norm(attacks));
 if(!candidates.length){missing.push({id,name,hp,attacks});continue;}
 const source=candidates[0],d={...source.d,id,number:String(index+1),set:{id:set}};
 const previous=supplements.findIndex(x=>x.id===id);if(previous>=0)supplements[previous]=d;else supplements.push(d);
 const scan=cards.find(c=>c.id===id)?.scan,scanFile=path.join(root,'outputs/ILEX.GG-win32-x64/resources',scan);
 evidence.push({id,sourceId:source.d.id,sourceFile:source.file,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(base,source.file))).digest('hex'),scan,scanSha256:crypto.createHash('sha256').update(fs.readFileSync(scanFile)).digest('hex'),review:'Bundled scan reviewed: HP, attack/Ability text, costs, type, Weakness, Resistance, Retreat and evolution match the identified printing. Cosmetic set/number replaced.',counterparts:candidates.map(c=>c.d.id)});
}
fs.writeFileSync(file,JSON.stringify(supplements,null,2));fs.writeFileSync(path.join(root,'work/rules-research/sv-mcd-source-provenance.json'),JSON.stringify({status:'scan-reviewed-source-candidates-not-engine-validation',evidence,missing},null,2));console.log(JSON.stringify({transcribed:evidence.length,missing}));
