const fs=require('fs'),path=require('path'),read=fs.readFileSync,write=fs.writeFileSync,here=__dirname;fs.mkdirSync(path.join(here,'regressions'),{recursive:true});
fs.readFileSync=function(file,...args){if(typeof file==='string'&&/[\\/]work[\\/][^\\/]+[\\/]ui[\\/]/.test(path.resolve(file)))file=path.join(here,'ui',file.split(/[\\/]ui[\\/]/).pop());return read.call(this,file,...args);};
fs.writeFileSync=function(file,...args){if(typeof file==='string'&&file.includes('rules-research'))file=path.join(here,'regressions',path.basename(file));return write.call(this,file,...args);};
