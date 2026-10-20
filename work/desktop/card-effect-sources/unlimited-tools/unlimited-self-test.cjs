const fs=require('fs'),path=require('path'),crypto=require('crypto');
module.exports=async(win,dir)=>{
 await require('./mega-self-test.cjs')(win,dir);
 const report=await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'unlimited-native-tests.js'),'utf8'),true);
 report.engineSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'ui/rules-engine.js'))).digest('hex');
 report.restored=fs.existsSync(path.join(dir,'unlimited-native-tests-fresh.json'));
 fs.writeFileSync(path.join(dir,'unlimited-native-tests.json'),JSON.stringify(report,null,2));
 fs.writeFileSync(path.join(dir,'unlimited-native.png'),(await win.webContents.capturePage()).toPNG());
 await win.webContents.executeJavaScript('unlimitedNativeCleanup();');
};
