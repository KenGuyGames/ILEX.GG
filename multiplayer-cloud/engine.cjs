'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const FILES=['rules-engine.js','new-rule-data.js','new-rule-engine.js','ken-guy-engine.js','rules-match.js','limitless-collection.js','private-match.js','rules-card-map.json','card-details.json'];
function loadEngine(root){
 let parseData;const loadData=key=>{if(!/^\d+$/.test(key))throw Error('Invalid engine data key.');const value=parseData(fs.readFileSync(path.join(root,'static-data',key+'.json'),'utf8'));global.gc?.();return value;};
 const context=vm.createContext({__ilexLoadData:loadData,console,crypto:crypto.webcrypto,structuredClone,setTimeout,clearTimeout,TextEncoder,TextDecoder});
 parseData=vm.runInContext('(()=>{const strings=new Map();const parse=text=>JSON.parse(text,(_key,value)=>{if(typeof value!=="string")return value;const previous=strings.get(value);if(previous!==undefined)return previous;strings.set(value,value);return value;});parse.clear=()=>strings.clear();return parse;})()',context);const digest=crypto.createHash('sha256');if(fs.existsSync(path.join(root,'static-data/manifest.json')))digest.update(fs.readFileSync(path.join(root,'static-data/manifest.json')));
 for(const f of FILES){let bytes=fs.readFileSync(path.join(root,f));digest.update(f).update(bytes);if(f.endsWith('.js')){
  let source=bytes.toString();bytes=null;global.gc?.();
  // Server-only transaction snapshots retain pending Undo and deduplication.
  // Direct multiplayer retains its original save/resume behavior.
  if(f==='private-match.js'){
   const a='decisions,events};}',b='decisions,events,serverState:options.serviceSnapshots?{connected,undo,seen:seen.map(x=>[...x])}:undefined};}';
   const c='events=s.events;if(s.match)match=restore(s.match);',d='events=s.events;if(s.match)match=restore(s.match);if(options.serviceSnapshots&&s.serverState){connected=s.serverState.connected;undo=s.serverState.undo;seen=s.serverState.seen.map(x=>new Map(x));}';
   if(!source.includes(a)||!source.includes(c))throw Error('Private match snapshot adapter needs review.');source=source.replace(a,b).replace(c,d);
  }
  vm.runInContext(source,context,{filename:f,timeout:60000});source=null;global.gc?.();
 }}
 parseData.clear();global.gc?.();const get=s=>vm.runInContext(s,context),M=get('RulesMatch'),P=get('PrivateMatch'),collection=get('LimitlessCollection');
 const metadata=Object.assign(JSON.parse(fs.readFileSync(path.join(root,'card-details.json'))),collection.metadata);
 context.cardMetadata=metadata;
 const map=M.withAliases(JSON.parse(fs.readFileSync(path.join(root,'rules-card-map.json'))),collection);
 const allowed=get('(id,c,f)=>!f.sets||limitlessPrintingAllowed(id,c,f,f.sets.split(",").map(s=>s.trim()).filter(Boolean))');
 const formats=collection.formats.filter(f=>!f.cubeRules).map(f=>JSON.parse(JSON.stringify(f)));
 const fingerprint=digest.digest('hex');global.gc?.();
 return {fingerprint,formats,profiles:Object.fromEntries(Object.entries(M.profiles).map(([k,v])=>[k,v.name])),collection,map,metadata,
  create({format,profile,deck,id,saved,mode}){return P.room({rules:M,map,metadata,allowed,engine:fingerprint,format,profile,hostDeck:deck,roomId:id,saved,serviceSnapshots:true,newRules:mode==='new'?{version:1}:undefined,kenGuy:mode==='ken'?{version:1}:undefined});}};
}
module.exports={loadEngine,FILES};
