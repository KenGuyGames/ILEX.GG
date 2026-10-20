from pathlib import Path
import os, shutil, json, hashlib
root=Path(__file__).resolve().parents[2]
folder=root/'work/combined-bot-release';folder.mkdir(exist_ok=True)
source=root/'outputs/ILEX.GG-1.21.0';dest=root/'outputs/ILEX.GG-1.21.1'
assert not (folder/'manifest.json').exists(), 'Do not overwrite an already prepared combined delivery'
def link(a,b):
    if Path(b).exists():
        assert Path(a).stat().st_size==Path(b).stat().st_size
        return str(b)
    try:os.link(a,b)
    except OSError:shutil.copy2(a,b)
    return str(b)
shutil.copytree(source,dest,copy_function=link,dirs_exist_ok=True)
app=dest/'resources/app';ui=app/'ui'
def replace(src,dst):
    if dst.exists():dst.unlink()
    shutil.copy2(src,dst)
for name in ['rules-engine.js','rules-match.js','limitless-collection.js']:
    replace(root/'outputs/ILEX.GG-win32-x64/resources/app/ui'/name,ui/name)
assert hashlib.sha256((ui/'bot-ai.js').read_bytes()).hexdigest()=='f0235ac708d1eb4dfd05409d7d26e26e6226094539df4c0c844038c9a878d874'
assert hashlib.sha256((ui/'rules-engine.js').read_bytes()).hexdigest()=='46e3e52c11617aa3a8870083ff547c899af0b7d5ef5c8bea643c8a074d74b67e'
assert hashlib.sha256((ui/'rules-match.js').read_bytes()).hexdigest()=='90b679ff7bc2e796d28d5e4a35cd5b51492cf18a4f29d373a7911d89445a7b21'
for name in ['format-reprints-native-fixtures.json','format-reprints-native-tests.js']:
    replace(root/'work/desktop'/name,app/name)
def write(p,s):
    if p.exists():p.unlink()
    p.write_text(s,encoding='utf-8')
write(app/'combined-bot-self-test.cjs', '''const fs=require('fs'),path=require('path'),crypto=require('crypto');
module.exports=async(win,dir)=>{
 await require('./tournament-bot-self-test.cjs')(win,dir);
 await win.webContents.executeJavaScript('window.combinedFormatSaved={saved:state.rulesMatch,paused:state.botPaused,suspended:botSuspended};window.formatFixture='+fs.readFileSync(path.join(__dirname,'format-reprints-native-fixtures.json'),'utf8'),true);
 let r;
 try{r=await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'format-reprints-native-tests.js'),'utf8'),true);}
 finally{await win.webContents.executeJavaScript('state.rulesMatch=combinedFormatSaved.saved;state.botPaused=combinedFormatSaved.paused;botSuspended=combinedFormatSaved.suspended;save();delete window.combinedFormatSaved;',true);}
 for(const n of ['rules-engine','rules-match','bot-ai'])r[n+'Sha256']=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'ui',n+'.js'))).digest('hex');
 fs.writeFileSync(path.join(dir,'format-reprints-native-tests.json'),JSON.stringify(r,null,2));
};
''')
write(app/'self-test.cjs',"module.exports=require('./combined-bot-self-test.cjs');\n")
package=json.loads((app/'package.json').read_text());package['version']='1.21.1'
write(app/'package.json',json.dumps(package,indent=2))
# Branding modifies the executable in place: break its historical hardlink first.
exe=dest/'ILEX.GG.exe';temp=folder/'unbranded.exe';shutil.copy2(exe,temp);replace(temp,exe)
write(folder/'manifest.json',json.dumps({n:hashlib.sha256((ui/n).read_bytes()).hexdigest() for n in ['rules-engine.js','rules-match.js','bot-ai.js','bot-ui.js','limitless-collection.js']},indent=2))
print('Independent combined Windows app prepared',flush=True)
