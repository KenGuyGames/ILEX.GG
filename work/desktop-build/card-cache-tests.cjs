const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const Cache=require('../desktop/card-cache.cjs');
(async()=>{
 const root=await fs.mkdtemp(path.join(require('node:os').tmpdir(),'ilex-cache-tests-'));const bytes=Buffer.from('verified image fixture'),name='123456789012345678901234.webp';
 const entry={file:'scans/'+name,sourceUrl:'https://assets.tcgdex.net/test.webp',bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};let calls=0;
 const cache=new Cache({manifest:{test:entry},directory:path.join(root,'cache'),fetch:async()=>{calls++;return new Response(bytes)}});
 const results=await Promise.all([cache.resolve(name),cache.resolve(name)]);assert.equal(results[0],results[1]);assert.equal(calls,1);
 await cache.resolve(name);assert.equal(calls,1);await assert.rejects(cache.resolve('../escape.webp'));
 await fs.writeFile(results[0],'corrupt');await cache.resolve(name);assert.equal(calls,2);
 const offline=new Cache({manifest:{test:entry},directory:path.join(root,'cache'),fetch:async()=>{throw Error('offline')}});await offline.resolve(name);
 const bad=new Cache({manifest:{test:entry},directory:path.join(root,'bad'),fetch:async()=>new Response('bad')});await assert.rejects(bad.resolve(name));await assert.rejects(fs.access(path.join(root,'bad',name)));
 const forbidden=new Cache({manifest:{test:{...entry,sourceUrl:'https://example.com/image'}},directory:path.join(root,'forbidden'),fetch:async()=>{throw Error('should not fetch')}});await assert.rejects(forbidden.resolve(name),/Unsupported/);
 for(const url of ['https://mcdn.pokemon.com/image/upload/promo.png','https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/promo.png']){
  const promo={...entry,url};delete promo.sourceUrl;let fetched;
  const official=new Cache({manifest:{test:promo},directory:path.join(root,'promo-'+crypto.createHash('sha256').update(url).digest('hex')),fetch:async u=>{fetched=u;return new Response(bytes)}});
  await official.resolve(name);assert.equal(fetched,url);
 }
 const hostile={...entry,url:'https://mcdn.pokemon.com.evil.example/promo.png'};delete hostile.sourceUrl;
 const rejected=new Cache({manifest:{test:hostile},directory:path.join(root,'hostile'),fetch:async()=>{throw Error('should not fetch')}});await assert.rejects(rejected.resolve(name),/Unsupported/);
 const restart=new Cache({manifest:{test:entry},directory:path.join(root,'cache'),fetch:async()=>{throw Error('offline')}});await restart.resolve(name);
 await new Promise(resolve=>{restart.notify=s=>{if(!s.running)resolve()};restart.start()});assert.equal(restart.status().failed,0);assert.equal(restart.status().checked,1);
 const many={};for(let i=0;i<12;i++){const n=i.toString(16).padStart(24,'0')+'.webp';many[i]={...entry,file:'scans/'+n}}
 let active=0,peak=0;
 const paused=new Cache({manifest:many,directory:path.join(root,'paused'),fetch:async()=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,30));active--;return new Response(bytes)}});
 await new Promise(resolve=>{paused.notify=s=>{if(s.checked===1)paused.pause();if(!s.running)resolve()};paused.start()});assert(peak<=4);assert(paused.status().checked<12);assert(paused.status().checked>=1);
 await new Promise(resolve=>{paused.notify=s=>{if(!s.running)resolve()};paused.start()});assert.equal(paused.status().checked,12);assert.equal(paused.status().failed,0);
 console.log('PASS: deduplicated downloads, disk reuse, corruption repair, offline/restart, path and source validation, hash rejection, bulk completion, bounded concurrency, pause/resume.');
})().catch(e=>{console.error(e);process.exitCode=1});

