const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..'),original=fs.readFileSync;
const released=path.join(root,'work/desktop/ui/rules-engine.js'),candidate=path.join(root,'work/sv-candidate/rules-engine.js');
fs.readFileSync=function(file,...args){return original.call(this,typeof file==='string'&&path.resolve(file)===released?candidate:file,...args);};
