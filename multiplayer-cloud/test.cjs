'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {createServer}=require('./server.cjs');const {Store}=require('./pg-store.cjs');const {PGlite}=require('@electric-sql/pglite');
test('real engine, HTTP accounts/friends/lobbies/privacy/actions/durability',{timeout:180000},async t=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'ilex-mp-'));let now=Date.now(),app,base;
 const pg=new PGlite(path.join(directory,'postgres'));const pool={query:(...x)=>pg.query(...x),connect:async()=>({query:(...x)=>pg.query(...x),release(){}}),end:async()=>{}};
 const start=async()=>{const store=new Store(pool,{test:true});await store.initialize();app=await createServer({store,dataDir:directory,engineRoot:path.join(__dirname,'engine'),clock:()=>now,maxRooms:4,requestLimit:10000});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+app.server.address().port;};
 const stop=async()=>{app.server.closeAllConnections();await new Promise(r=>app.server.close(r));};
 const api=async(route,body,token)=>{const r=await fetch(base+route,{method:body?'POST':'GET',headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()};};
 const cmd=async(token,b,status=200)=>{const x=await api('/api/command',{requestId:crypto.randomUUID(),...b},token);assert.equal(x.status,status,JSON.stringify(x));return x.body;};
 const state=async token=>{const x=await api('/api/state',null,token);assert.equal(x.status,200);return x.body;};
 await start();let alice,bob,eve,recovery,roomId;
 try{
  await t.test('authentication, recovery secret, blocked origins and secret storage',async()=>{
   assert.equal((await api('/api/state')).status,401);
   alice=(await api('/api/register',{username:'alice_test',password:'a-strong-test-password'})).body;recovery=alice.recovery;assert(recovery);
   bob=(await api('/api/register',{username:'bob_test',password:'b-strong-test-password'})).body;
   eve=(await api('/api/register',{username:'eve_test',password:'e-strong-test-password'})).body;
   assert.equal((await api('/api/login',{username:'alice_test',password:'wrong-password-123'})).status,401);
   const raw=(await app.store.one('SELECT * FROM users WHERE id=?',alice.user.id));assert.notEqual(raw.hash,'a-strong-test-password');assert.notEqual(raw.recovery,recovery);
   assert(!JSON.stringify((await app.store.all('SELECT * FROM sessions'))).includes(alice.token));
   const r=await fetch(base+'/api/info',{headers:{Origin:'https://untrusted.example'}});assert.equal(r.status,403);
  });
  await t.test('mutual friendship, private invite access and blocked discovery',async()=>{
   await cmd(alice.token,{type:'friend-request',username:'bob_test'});let s=await state(bob.token);assert.equal(s.requests[0].direction,'incoming');
   await cmd(bob.token,{type:'friend-accept',username:'alice_test'});assert.equal((await state(alice.token)).friends[0].id,bob.user.id);
   const f=app.engine.formats[0],deck={name:'Network fixture',cards:{'base1-46':4,'base1-98':56}};
   await cmd(alice.token,{type:'create',formatId:f.id,profile:'wotc',visibility:'private',mode:'regular',deck,title:'Private fixture'});
   let r=(await state(alice.token)).room;roomId=r.id;assert.equal((await state(eve.token)).rooms.length,0);
   await cmd(eve.token,{type:'join',roomId},403);
   await cmd(alice.token,{type:'invite',username:'bob_test'});assert.equal((await state(bob.token)).invites[0].roomId,roomId);
   await cmd(bob.token,{type:'join',roomId});assert.equal((await state(alice.token)).room.players.length,2);
   await cmd(eve.token,{type:'join',roomId},409);
   r=(await state(bob.token)).room;await cmd(bob.token,{type:'match',message:{type:'deck',deck,revision:r.view.revision}});
   await cmd(alice.token,{type:'match',message:{type:'ready',value:true,revision:(await state(alice.token)).room.view.revision}});
   await cmd(bob.token,{type:'match',message:{type:'ready',value:true,revision:(await state(bob.token)).room.view.revision}});
   for(const token of [alice.token,bob.token]){const v=(await state(token)).room.view;assert.equal(v.lobby,false);const far=v.players.find(p=>p.id!==v.viewer);assert(far.hand.every(c=>c===null));assert(far.prizes.every(c=>c===null));assert(!('journal'in v));assert(!('seed'in v));assert(!('hostDeck'in v));}
  });
  const move=async(token,message)=>cmd(token,{type:'match',message:{...message,revision:(await state(token)).room.view.revision}});
  async function setup(){for(let i=0;i<40;i++){const a=(await state(alice.token)).room.view,b=(await state(bob.token)).room.view;if(a.phase!=='SETUP')return;const v=a.prompt?a:b,token=v.viewer===1?alice.token:bob.token,p=v.prompt;assert(p,'Expected a setup prompt');let value;
    if(p.type==='Choose cards')value=p.rows.filter(x=>!x.blocked).slice(0,p.min||1).map(x=>x.value);
    else if(p.type==='Confirm')value=false;
    else if(p.rows?.length)value=p.rows.find(x=>!x.blocked).value;
    else value=true;
    await move(token,{type:'prompt',promptId:p.id,value});
   }throw Error('Setup did not finish');}
  await t.test('two actual engine players complete setup',setup);
  let action,actorToken,revision;
  await t.test('illegal cross-seat moves rejected; retries commit only once',async()=>{
   let a=(await state(alice.token)).room.view;actorToken=a.active===1?alice.token:bob.token;const v=(await state(actorToken)).room.view;action=v.actions.find(x=>x.label==='End turn');assert(action);revision=v.revision;
   const other=actorToken===alice.token?bob.token:alice.token;
   await cmd(other,{type:'match',message:{type:'action',actionId:action.id,revision}},400);
   const requestId=crypto.randomUUID(),b={type:'match',requestId,message:{type:'action',actionId:action.id,revision}};await cmd(actorToken,b);const after=(await state(actorToken)).room.view.revision;await cmd(actorToken,b);assert.equal((await state(actorToken)).room.view.revision,after);
   await cmd(actorToken,{...b,message:{...b.message,actionId:'tampered'}},409);
   await cmd(actorToken,{type:'match',message:{type:'action',actionId:action.id,revision}},400);
   await cmd(alice.token,{type:'ranked-queue'},400);assert.equal((await state(alice.token)).ranked.enabled,false);
  });
  await t.test('Undo requires opponent approval',async()=>{
   await move(actorToken,{type:'undo-request'});let v=(await state(actorToken)).room.view;assert(v.undo);
   await move(actorToken,{type:'undo-response',id:v.undo.id,approve:true}).then(()=>assert.fail('Self approval succeeded'),()=>{});
   const other=actorToken===alice.token?bob.token:alice.token;await move(other,{type:'undo-response',id:v.undo.id,approve:false});assert.equal((await state(other)).room.view.undo,null);
   await move(actorToken,{type:'undo-request'});v=(await state(actorToken)).room.view;await move(other,{type:'undo-response',id:v.undo.id,approve:true});assert.equal((await state(other)).room.view.undo,null);
  });
  await t.test('server restart restores exact private journal and persisted command receipts',async()=>{
   const saved=JSON.stringify(app.service.rooms.get(roomId).saved.match);await stop();await start();assert.equal(JSON.stringify(app.service.rooms.get(roomId).saved.match),saved);
   await state(alice.token);await state(bob.token);assert.equal((await state(alice.token)).room.view.connected,true);
   now+=16000;assert.equal((await state(alice.token)).room.view.connected,false);await state(bob.token);assert.equal((await state(alice.token)).room.view.connected,true);
  });
  await t.test('complete real rules-engine match and record result once',async()=>{
   for(let i=0;i<120;i++){let a=(await state(alice.token)).room.view;if(a.phase==='FINISHED')break;const token=a.active===1?alice.token:bob.token,v=(await state(token)).room.view;if(v.prompt)throw Error('Unexpected play prompt '+v.prompt.type);const end=v.actions.find(x=>x.label==='End turn');assert(end);await move(token,{type:'action',actionId:end.id});}
   const v=(await state(alice.token)).room.view;assert.equal(v.phase,'FINISHED');assert.equal((await app.store.one('SELECT count(*) n FROM results WHERE room_id=?',roomId)).n,1);await state(alice.token);await state(bob.token);assert.equal((await app.store.one('SELECT count(*) n FROM results WHERE room_id=?',roomId)).n,1);
  });
  await t.test('room abandonment, public visibility, block, emote and report controls',async()=>{
   await cmd(alice.token,{type:'leave'});assert.equal((await state(bob.token)).room,null);
   const f=app.engine.formats[0],deck={name:'Public',cards:{'base1-46':4,'base1-98':56}};
   await cmd(alice.token,{type:'create',formatId:f.id,profile:'wotc',visibility:'public',mode:'regular',deck,title:'Public fixture'});const s=await state(eve.token);assert.equal(s.rooms.length,1);assert(!s.rooms[0].code);assert(!s.rooms[0].view);
   await cmd(alice.token,{type:'emote',text:'Good luck!'});await cmd(alice.token,{type:'emote',text:'Good luck!'},429);await cmd(alice.token,{type:'mute'});assert.equal((await state(alice.token)).room.emotes.length,0);
   await cmd(eve.token,{type:'block',username:'alice_test'});assert.equal((await state(eve.token)).rooms.length,0);
   await cmd(eve.token,{type:'report',username:'alice_test',reason:'Test report for operator review'});assert.equal((await app.store.one('SELECT count(*) n FROM reports')).n,1);
   now+=31*60000;assert.equal((await state(alice.token)).room,null);
  });
  await t.test('recovery rotates code and revokes previous sessions',async()=>{
   const r=await api('/api/recover',{username:'alice_test',password:'a-new-test-password',recovery});assert.equal(r.status,200);assert(r.body.recovery);assert.notEqual(r.body.recovery,recovery);assert.equal((await api('/api/state',null,alice.token)).status,401);
   const wrong=await api('/api/recover',{username:'alice_test',password:'another-new-password',recovery});assert.equal(wrong.status,401);
  });
 }finally{await stop();await pg.close();fs.rmSync(directory,{recursive:true,force:true});}
});
