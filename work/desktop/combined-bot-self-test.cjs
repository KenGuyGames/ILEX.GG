const fs=require('fs'),path=require('path'),crypto=require('crypto');
module.exports=async(win,dir)=>{
 await require('./tournament-bot-self-test.cjs')(win,dir);
 await win.webContents.executeJavaScript('window.combinedFormatSaved={saved:state.rulesMatch,paused:state.botPaused,suspended:botSuspended};window.formatFixture='+fs.readFileSync(path.join(__dirname,'format-reprints-native-fixtures.json'),'utf8'),true);
 let r;
 try{r=await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'format-reprints-native-tests.js'),'utf8'),true);}
 finally{await win.webContents.executeJavaScript('state.rulesMatch=combinedFormatSaved.saved;state.botPaused=combinedFormatSaved.paused;botSuspended=combinedFormatSaved.suspended;save();delete window.combinedFormatSaved;',true);}
 for(const n of ['rules-engine','rules-match','bot-ai'])r[n+'Sha256']=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'ui',n+'.js'))).digest('hex');
 fs.writeFileSync(path.join(dir,'format-reprints-native-tests.json'),JSON.stringify(r,null,2));
};
