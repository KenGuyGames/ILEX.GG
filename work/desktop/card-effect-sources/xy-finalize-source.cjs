const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..');
const ui=path.join(root,'work/desktop/ui/rules-ui.js');
fs.writeFileSync(ui,fs.readFileSync(ui,'utf8').replace("profile=f?.ruleProfile||'modern'","profile=f?.ruleProfile||(f?.id==='expanded'?'expanded':'modern')"));
const pkg=path.join(root,'work/desktop/package.json'),metadata=JSON.parse(fs.readFileSync(pkg,'utf8'));metadata.version='1.13.0';fs.writeFileSync(pkg,JSON.stringify(metadata,null,2)+'\n');
const main=path.join(root,'work/desktop/main.cjs');fs.writeFileSync(main,fs.readFileSync(main,'utf8').replace('ILEX.GG 1.12.0','ILEX.GG 1.13.0').replace('Automated historical card pools through Black & White / Legendary Treasures.','Automated historical card pools through XY / Evolutions. XY interactions cover Black & White onward; Unlimited remains deferred.'));
