const fs=require('fs'),path=require('path'),crypto=require('crypto');
module.exports=async(win,dir)=>{
 await require('./sv-self-test.cjs')(win,dir);
 const report=await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'mega-native-tests.js'),'utf8'),true);
 report.engineSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'ui/rules-engine.js'))).digest('hex');
 report.restored=fs.existsSync(path.join(dir,'mega-native-tests-fresh.json'));
 fs.writeFileSync(path.join(dir,'mega-native-tests.json'),JSON.stringify(report,null,2));
 fs.writeFileSync(path.join(dir,'mega-native.png'),(await win.webContents.capturePage()).toPNG());
 await win.webContents.executeJavaScript('megaNativeCleanup();');
 if(process.env.ILEX_MEGA_PRIVATE==='1')await require('./private-native-tests.cjs')(win,dir);
};
