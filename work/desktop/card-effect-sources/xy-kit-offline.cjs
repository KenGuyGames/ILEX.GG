const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const cards=read(path.join(root,'work/desktop/ui/cards.json')),verified=require('./xy-kit-verified.json'),norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
const dir=path.join(root,'work/card-sources/pokemon-tcg-data-master/cards/en'),raw=fs.readdirSync(dir).filter(f=>/^xy|^bw|^g1\.|^dc1\./.test(f)).flatMap(f=>read(path.join(dir,f)));
const data=[],pending=[],choices=[];
for(const scan of cards.filter(c=>c.id.startsWith('tk-xy-'))){const group=scan.id.replace(/-\d+$/,''),entry=Object.entries(verified).find(([id])=>id.replace(/-\d+$/,'')===group&&norm(cards.find(c=>c.id===id).name)===norm(scan.name));let source;
 if(entry){const options=raw.filter(d=>norm(d.name)===norm(scan.name)&&(d.attacks||[]).map(a=>a.name).join('|')===entry[1]);source=options[0];if(source)choices.push({id:scan.id,source:source.id,hp:source.hp,attacks:source.attacks.map(a=>({name:a.name,cost:a.cost,damage:a.damage})),options:options.map(c=>c.id)});}
 else if(scan.name.endsWith('Energy'))source=raw.find(d=>d.name===scan.name&&d.supertype==='Energy'&&d.subtypes.includes('Basic'));
 else source=raw.find(d=>norm(d.name)===norm(scan.name)&&d.supertype==='Trainer');
 if(!source&&require('./xy-kit-unique.cjs')[scan.name])source={id:'scan-transcription:'+scan.id,name:scan.name,supertype:'Pokémon',subtypes:['Basic'],...require('./xy-kit-unique.cjs')[scan.name]};
 if(!source){pending.push({id:scan.id,name:scan.name,attackNames:entry?.[1]});continue;}
 data.push({...source,id:scan.id,number:scan.id.slice(group.length+1),set:{id:group},_source:{kind:'bundled-scan-reviewed-reprint',scan:scan.scan,printedEquivalent:source.id}});
}
for(const [id,equivalent] of Object.entries({'xya-24a':'xy4-24','xya-28a':'g1-28','xya-54a':'xy10-54','xya-55a':'xy3-55','xya-92a':'xy6-92','xya-107a':'xy9-107'})){const source=raw.find(d=>d.id===equivalent);if(!source)throw Error('Missing '+equivalent);data.push({...source,id,number:id.slice(4),set:{id:'xya'},_source:{kind:'Yellow-A-equivalent-printing',printedEquivalent:equivalent}});}
fs.writeFileSync(path.join(root,'work/card-sources/xy-supplements.json'),JSON.stringify(data,null,2));fs.writeFileSync(path.join(root,'work/rules-research/xy-kit-offline-audit.json'),JSON.stringify({choices,pending},null,2));console.log(JSON.stringify({saved:data.length,pending},null,2));
