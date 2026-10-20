const fs=require('fs'),path=require('path'),crypto=require('crypto');
module.exports=async(win,dir)=>{
 await require('./unlimited-self-test.cjs')(win,dir);
 const x=await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'tournament-bot-native-tests.js'),'utf8'),true);
 x.engineSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'ui/rules-engine.js'))).digest('hex');x.botSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'ui/bot-ai.js'))).digest('hex');fs.writeFileSync(path.join(dir,'tournament-bot-native-tests.json'),JSON.stringify(x,null,2));
 await win.webContents.executeJavaScript('window.botCandySaved={saved:state.rulesMatch,paused:state.botPaused,suspended:botSuspended};window.candyFixture='+fs.readFileSync(path.join(__dirname,'rare-candy-native-fixture.json'),'utf8'),true);
 try{const candy=await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'rare-candy-native-tests.js'),'utf8'),true);candy.engineSha256=x.engineSha256;fs.writeFileSync(path.join(dir,'candy-native-tests.json'),JSON.stringify(candy,null,2));}
 finally{await win.webContents.executeJavaScript('state.rulesMatch=botCandySaved.saved;state.botPaused=botCandySaved.paused;botSuspended=botCandySaved.suspended;save();delete window.botCandySaved;',true);}
};
