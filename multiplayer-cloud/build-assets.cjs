'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const folder=path.join(__dirname,'web-gzip'),assets=path.resolve(__dirname,'../work/desktop/ui');fs.mkdirSync(folder,{recursive:true});
for(const root of [assets,path.join(__dirname,'client')])for(const name of fs.readdirSync(root)){if(!/\.(js|json|css|svg)$/.test(name)||!fs.statSync(path.join(root,name)).isFile())continue;fs.writeFileSync(path.join(folder,name+'.gz'),zlib.gzipSync(fs.readFileSync(path.join(root,name)),{level:6}));}
console.log('Browser assets compressed; no credentials or account data included.');
