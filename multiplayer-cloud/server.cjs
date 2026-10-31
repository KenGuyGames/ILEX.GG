'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{Store}=require('./pg-store.cjs'),{Service}=require('./service.cjs'),{loadEngine,FILES}=require('./engine.cjs');
const crypto=require('node:crypto'),zlib=require('node:zlib');
async function createServer({store:providedStore,databaseUrl,publicOrigin,publicOrigins=[],dataDir,engineRoot,gameRoot,scansRoot,clientRoot=path.join(__dirname,'client'),clock,maxRooms,allowRemoteHttp=false,origins=[],requestLimit=300}){
 console.log('Startup: connecting to PostgreSQL.');const store=providedStore||await Store.open(databaseUrl||process.env.DATABASE_URL);console.log('Startup: loading game engine.');const engine=loadEngine(engineRoot),service=new Service(store,engine,{clock,maxRooms});let queue=Promise.resolve();const serial=fn=>{const p=queue.then(fn);queue=p.catch(()=>{});return p;};console.log('Startup: claiming deployment and recovering rooms.');await store.claim();await store.transaction(async()=>{await store.assertOwner();await service.initialize();});
 const rates=new Map();let authInFlight=0;
 const manifests=FILES.map(name=>({name,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(engineRoot,name))).digest('hex')}));
 const localIP=ip=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(ip);
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
 const server=http.createServer(async(req,res)=>{
  const send=(status,value)=>{res.writeHead(status,headers);res.end(JSON.stringify(value));};
  try{
   const ip=req.socket.remoteAddress,origin=req.headers.origin;const hosted=!!publicOrigin;const expected=hosted?new URL(publicOrigin):null;if(hosted&&req.headers.host!==expected.host)return send(403,{error:'Unrecognized host.'});if(hosted&&req.headers['x-forwarded-proto']!=='https')return send(403,{error:'HTTPS required.'});
   const host=req.headers.host||'';const localHost=/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
   if(!hosted&&localIP(ip)&&!allowRemoteHttp&&!localHost)return send(403,{error:'Unrecognized local host.'});
   if(!hosted&&!localIP(ip)&&!allowRemoteHttp&&!req.socket.encrypted)return send(403,{error:'Run behind a local HTTPS reverse proxy.'});
   const acceptedOrigin=origin&&([...(hosted?[publicOrigin]:[`http://${host}`,`https://${host}`]),'tcglab://app',...origins,...publicOrigins].includes(origin));
   if(origin&&!acceptedOrigin)return send(403,{error:'Origin not allowed.'});
   if(acceptedOrigin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');}
   if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
   const now=Date.now(),key=ip||'local',authPath=/^\/api\/(register|login|recover)$/.test(req.url||'');let limit=rates.get(key);
   if(!limit||now-limit.at>60000){limit={at:now,n:0,auth:0};rates.set(key,limit);}if(++limit.n>requestLimit||(authPath&&++limit.auth>12))return send(429,{error:'Too many requests. Try again shortly.'});
   if(rates.size>10000)for(const [k,v]of rates)if(now-v.at>60000)rates.delete(k);
   const url=new URL(req.url,'http://localhost');
   const atomic=fn=>serial(()=>store.transaction(async()=>{await store.assertOwner();return fn();}));
   if(req.method==='GET'&&url.pathname==='/health')return send(200,{ok:true,version:'0.2.0',ranked:false});
   if(req.method==='GET'&&url.pathname==='/api/info')return send(200,{version:'0.2.0',engine:engine.fingerprint,files:manifests,ranked:false});
   if(req.method==='GET'&&url.pathname==='/api/state'){return send(200,await atomic(async()=>{const u=await service.auth((req.headers.authorization||'').replace(/^Bearer /,''));return service.snapshot(u);}));}
   if(req.method==='POST'&&url.pathname.startsWith('/api/')){
    if(req.headers['content-type']?.split(';')[0]!=='application/json')return send(415,{error:'JSON required.'});
    let bytes=0,chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>524288)return send(413,{error:'Request too large.'});chunks.push(chunk);}
    let b;try{b=JSON.parse(Buffer.concat(chunks));}catch{return send(400,{error:'Invalid JSON.'});}if(!b||typeof b!=='object'||Array.isArray(b))return send(400,{error:'Object required.'});
    if(['/api/register','/api/login','/api/recover'].includes(url.pathname)){
     if(authInFlight>=4)return send(503,{error:'Sign-in busy. Try again shortly.'});authInFlight++;try{return send(200,await atomic(()=>service[url.pathname.slice(5)](b)));}finally{authInFlight--;}
    }
    if(url.pathname==='/api/command')return send(200,await atomic(async()=>{const u=await service.auth((req.headers.authorization||'').replace(/^Bearer /,''));return service.execute(u,b);}));
   }
   if(req.method==='GET'&&url.pathname==='/'){
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"});return res.end('<!doctype html><title>ILEX.GG Multiplayer</title><style>body{background:#102b25;color:#eef6e4;font:20px system-ui;max-width:680px;margin:12vh auto;padding:24px}a{color:#b8e48d}</style><h1>ILEX.GG Multiplayer</h1><p>Free-hosting preview · casual matches · ranked remains disabled.</p>'+(gameRoot?'<p><a href="/game/">Open game preview</a></p>':'<p>Connect from the multiplayer preview in ILEX.GG.</p>'));
   }
   if(req.method==='GET'&&gameRoot&&url.pathname.startsWith('/game/')){
    let name=decodeURIComponent(url.pathname.slice(6))||'index.html';if(name.includes('..')||name.includes('\\')||name.includes(':')||name.startsWith('/')||name.split('/').some(p=>p.startsWith('.'))||/before-|\.bak|\.map$/.test(name))return send(404,{error:'Not found.'});
    const ext=path.extname(name);const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.ogg':'audio/ogg','.woff2':'font/woff2'}[ext];if(!mime)return send(404,{error:'Not found.'});
    const isScan=name.startsWith('scans/')&&scansRoot;const overlay=['multiplayer.js','multiplayer.css','private-online.js','menu-groups.js'].includes(name),assetRoot=overlay?clientRoot:isScan?scansRoot:gameRoot,file=path.join(assetRoot,isScan?name.slice(6):name);if(!fs.existsSync(file)||!fs.statSync(file).isFile())return send(404,{error:'Asset not found.'});
    // Reject symlinks escaping the asset root.
    const relative=path.relative(fs.realpathSync(assetRoot),fs.realpathSync(file));if(relative.startsWith('..')||path.isAbsolute(relative))return send(404,{error:'Not found.'});
    if(name==='index.html'){
     let html=fs.readFileSync(file,'utf8');html=html.replace('</body>','<script>window.ILEX_HOSTED_BROWSER=true;</script><link rel="stylesheet" href="multiplayer.css"><script src="multiplayer.js"></script></body>');
     res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; connect-src 'self' https://api.tcgdex.net; media-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});return res.end(html);
    }
    const gz=path.join(__dirname,'web-gzip',name+'.gz');if(!name.includes('/')&&/gzip/.test(req.headers['accept-encoding']||'')&&fs.existsSync(gz)){res.writeHead(200,{'Content-Type':mime,'Content-Encoding':'gzip','Vary':'Accept-Encoding','X-Content-Type-Options':'nosniff'});return fs.createReadStream(gz).pipe(res);}res.writeHead(200,{'Content-Type':mime,'X-Content-Type-Options':'nosniff'});return fs.createReadStream(file).pipe(res);
   }
   send(404,{error:'Not found.'});
  }catch(e){if(!res.headersSent)send(e.status||400,{error:e.status?e.message:'Request could not be completed. Refresh and try again.'});else res.end();}
 });
 server.requestTimeout=15000;server.headersTimeout=10000;
 const timer=setInterval(async()=>{try{await serial(()=>store.transaction(async()=>{await store.assertOwner();await service.cleanup();}));}catch(e){console.error('Maintenance failed:',e.message);}},60000);timer.unref();
 server.on('close',()=>{clearInterval(timer);store.close().catch(()=>{});});
 return {server,service,store,engine};
}
if(require.main===module){(async()=>{const root=__dirname,port=Number(process.env.PORT||8787),host=process.env.RENDER?'0.0.0.0':process.env.HOST||'127.0.0.1';
 const app=await createServer({databaseUrl:process.env.DATABASE_URL,gameRoot:path.resolve(root,'../work/desktop/ui'),publicOrigin:process.env.RENDER_EXTERNAL_URL,origins:(process.env.ILEX_ORIGINS||'http://127.0.0.1:8788,http://localhost:8788').split(','),engineRoot:path.resolve(process.env.ILEX_ENGINE||path.join(root,'engine')),maxRooms:Number(process.env.ILEX_MAX_ROOMS||6),requestLimit:3000});
 app.server.listen(port,host,()=>console.log('ILEX.GG cloud multiplayer 0.2.0 · PostgreSQL · ranked disabled'));for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>app.server.close(()=>process.exit(0)));
})().catch(e=>{console.error('Server startup failed: '+String(e.code||e.name||'UNKNOWN').replace(/[^A-Z_a-z0-9]/g,'').slice(0,60));process.exitCode=1;});}
module.exports={createServer};
