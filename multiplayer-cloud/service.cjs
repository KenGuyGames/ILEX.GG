'use strict';
const crypto=require('node:crypto'),{promisify}=require('node:util');
const scrypt=promisify(crypto.scrypt),sha=s=>crypto.createHash('sha256').update(s).digest('hex'),id=()=>crypto.randomUUID();
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
class Service {
 constructor(store,engine,{clock=Date.now,maxRooms=12,maxUsers=1000}={}){
  this.s=store;this.e=engine;this.clock=clock;this.maxRooms=maxRooms;this.maxUsers=maxUsers;this.live=new Map();this.presence=new Map();this.rooms=new Map();
  this.users=new Map();this.relations=new Set();
 }
 async initialize(){
  for(const row of await this.s.all('SELECT id,username,display FROM users'))this.users.set(row.id,row);
  await this.refreshRelations();
  for(const row of (await this.s.all('SELECT data FROM rooms'))){const r=JSON.parse(row.data);if(r.status==='closed')continue;
   if(r.engine!==this.e.fingerprint){r.status='closed';r.reason='Server rules changed; match void.';(await this.save(r));continue;}
   try{this.rooms.set(r.id,r);const p=this.e.create({format:r.format,profile:r.profile,deck:r.deck,id:r.id,saved:r.saved,mode:r.mode});p.connected(false);r.saved=p.save();this.live.set(r.id,p);}
   catch{r.status='closed';r.reason='Recovery unavailable; match void.';(await this.save(r));this.rooms.delete(r.id);this.live.delete(r.id);}
  }
 }
 async save(r){(await this.s.run('INSERT INTO rooms VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated=excluded.updated',r.id,JSON.stringify(r),this.clock()));}
 user(u){return this.users.get(u);}
 async refreshRelations(){this.relations=new Set((await this.s.all('SELECT a,b,kind FROM relations')).map(r=>JSON.stringify([r.a,r.b,r.kind])));}
 async credentials(username,password){
  if(typeof username!=='string'||!/^[a-zA-Z0-9_]{3,24}$/.test(username))fail('Use a username of 3–24 letters, numbers, or underscores.');
  if(typeof password!=='string'||password.length<12||password.length>128)fail('Use a password of 12–128 characters.');
  return username.toLowerCase();
 }
 async session(u){const token=crypto.randomBytes(32).toString('base64url');(await this.s.run('INSERT INTO sessions VALUES(?,?,?)',sha(token),u,this.clock()+7*86400000));return {token,user:this.user(u)};}
 async register(b){const username=await this.credentials(b.username,b.password);if((await this.s.one('SELECT id FROM users WHERE username=?',username)))fail('Username unavailable.',409);
  if((await this.s.one('SELECT count(*) n FROM users')).n>=this.maxUsers)fail('Registration is full.',503);
  const salt=crypto.randomBytes(16).toString('hex'),hash=(await scrypt(b.password,salt,64)).toString('hex'),recovery=crypto.randomBytes(24).toString('base64url'),u=id();
  try{(await this.s.transaction(async ()=>{if((await this.s.one('SELECT count(*) n FROM users')).n>=this.maxUsers)fail('Registration is full.',503);(await this.s.run('INSERT INTO users VALUES(?,?,?,?,?,?,?)',u,username,username,salt,hash,sha(recovery),this.clock()));}));}catch(e){if(e.status)throw e;fail('Username unavailable.',409);}
  this.users.set(u,{id:u,username,display:username});return {...(await this.session(u)),recovery};
 }
 async login(b){const username=await this.credentials(b.username,b.password),row=(await this.s.one('SELECT * FROM users WHERE username=?',username));
  const hash=await scrypt(b.password,row?.salt||'invalid-login-salt',64);if(!row||!crypto.timingSafeEqual(hash,Buffer.from(row.hash,'hex')))fail('Username or password incorrect.',401);
  return (await this.session(row.id));
 }
 async recover(b){const username=await this.credentials(b.username,b.password),row=(await this.s.one('SELECT * FROM users WHERE username=?',username));
  if(typeof b.recovery!=='string'||b.recovery.length>100||!row||!crypto.timingSafeEqual(Buffer.from(sha(b.recovery)),Buffer.from(row.recovery)))fail('Recovery details incorrect.',401);
  const salt=crypto.randomBytes(16).toString('hex'),hash=(await scrypt(b.password,salt,64)).toString('hex'),recovery=crypto.randomBytes(24).toString('base64url');
  (await this.s.transaction(async ()=>{if((await this.s.one('SELECT recovery FROM users WHERE id=?',row.id)).recovery!==row.recovery)fail('Recovery code already used.',401);(await this.s.run('UPDATE users SET salt=?,hash=?,recovery=? WHERE id=?',salt,hash,sha(recovery),row.id));(await this.s.run('DELETE FROM sessions WHERE user_id=?',row.id));}));
  return {...(await this.session(row.id)),recovery};
 }
 async auth(token){if(typeof token!=='string'||token.length>100)fail('Sign in first.',401);const row=(await this.s.one('SELECT user_id FROM sessions WHERE hash=? AND expires>?',sha(token),this.clock()));if(!row)fail('Session expired. Sign in again.',401);this.presence.set(row.user_id,this.clock());return row.user_id;}
 blocked(a,b){return this.relations.has(JSON.stringify([a,b,'block']))||this.relations.has(JSON.stringify([b,a,'block']));}
 friends(a,b){return this.relations.has(JSON.stringify([a,b,'friend']));}
 resolve(name){if(typeof name!=='string'||name.length>24)fail('Enter a username.');const x=[...this.users.values()].find(x=>x.username===name.toLowerCase());if(!x)fail('Player not found.',404);return x.id;}
 active(u){return [...this.rooms.values()].find(r=>r.status!=='closed'&&r.members.includes(u));}
 async touchRoom(r){const p=this.live.get(r.id);const connected=r.members.length===2&&r.members.every(u=>(this.presence.get(u)||0)>this.clock()-15000);p.connected(connected);r.saved=p.save();
  if(!p.view(1).lobby&&r.status==='waiting')r.status='playing';
  if(p.view(1).phase==='FINISHED'&&r.status!=='finished'){r.status='finished';const v=p.view(1);(await this.s.run('INSERT OR IGNORE INTO results VALUES(?,?,?)',r.id,JSON.stringify({members:r.members,winner:v.winner,ranked:false,engine:r.engine}),this.clock()));}
 }
 roomPublic(r,u){const seat=r.members.indexOf(u),view=seat>=0?this.live.get(r.id).view(seat+1):null;if(view?.players)for(const p of view.players)p.name=this.user(r.members[p.id-1])?.display||'Player';return {id:r.id,title:r.title,format:r.format,profile:r.profile,mode:r.mode,visibility:r.visibility,status:r.status,players:r.members.map(x=>this.user(x)),...(seat>=0?{code:r.code,view,muted:r.muted.includes(u),emotes:r.muted.includes(u)?[]:r.emotes.map(e=>({...e,name:this.user(e.user)?.display||'Player'}))}:{})};}
 async snapshot(u){(await this.cleanup());const own=this.active(u);if(own){const old=JSON.stringify(own.saved);(await this.touchRoom(own));if(old!==JSON.stringify(own.saved))(await this.save(own));}
  const relations=(await this.s.all('SELECT a,b,kind FROM relations WHERE a=? OR b=?',u,u));
  return {user:this.user(u),engine:this.e.fingerprint,ranked:{enabled:false,reason:'Ranked opens after multiplayer acceptance testing.'},formats:this.e.formats,profiles:this.e.profiles,
   friends:relations.filter(r=>r.kind==='friend'&&r.a===u&&!this.blocked(u,r.b)).map(r=>({...this.user(r.b),status:(this.presence.get(r.b)||0)<this.clock()-15000?'offline':this.active(r.b)?.status==='playing'?'in match':'online'})),
   requests:relations.filter(r=>r.kind==='request'&&!this.blocked(r.a,r.b)).map(r=>({direction:r.b===u?'incoming':'outgoing',...this.user(r.a===u?r.b:r.a)})),
   blocked:relations.filter(r=>r.kind==='block'&&r.a===u).map(r=>this.user(r.b)),
   invites:(await this.s.all('SELECT * FROM invites WHERE recipient=? AND expires>?',u,this.clock())).filter(i=>!this.blocked(u,i.sender)&&this.rooms.get(i.room_id)?.status==='waiting').map(i=>({id:i.id,roomId:i.room_id,from:this.user(i.sender)})),
   rooms:[...this.rooms.values()].filter(r=>r.status==='waiting'&&r.visibility==='public'&&!r.members.includes(u)&&!r.members.some(x=>this.blocked(x,u))).map(r=>this.roomPublic(r,u)),room:own?this.roomPublic(own,u):null};
 }
 async cleanup(){const now=this.clock();for(const r of this.rooms.values()){
   const idle=now-r.updated;
   if((r.status==='waiting'&&idle>30*60000)||(r.status==='finished'&&idle>10*60000)||(r.status==='playing'&&idle>24*3600000)){
    r.status='closed';r.reason='Room expired.';(await this.save(r));this.rooms.delete(r.id);this.live.delete(r.id);
   }
  }
  (await this.s.run('DELETE FROM invites WHERE expires<?',now));(await this.s.run('DELETE FROM sessions WHERE expires<?',now));(await this.s.run('DELETE FROM receipts WHERE created<?',now-7*86400000));
 }
 async execute(u,b){
  if(typeof b.requestId!=='string'||!/^[\w-]{1,80}$/.test(b.requestId))fail('Request ID required.');
  const prior=(await this.s.one('SELECT response FROM receipts WHERE user_id=? AND request_id=?',u,b.requestId));if(prior){const p=JSON.parse(prior.response);if(p.input!==sha(JSON.stringify(b)))fail('Request ID reused for a different command.',409);return p.output;}
  // A synchronous transaction serializes seats, match mutation, snapshot and receipt.
  const usersBefore=new Map(this.users),relationsBefore=new Set(this.relations);
  const before=new Map([...this.rooms].map(([k,r])=>[k,JSON.stringify(r)]));
  try{return (await this.s.transaction(async ()=>{const output=(await this.command(u,b))||{ok:true};(await this.refreshRelations());(await this.s.run('INSERT INTO receipts VALUES(?,?,?,?)',u,b.requestId,JSON.stringify({input:sha(JSON.stringify(b)),output}),this.clock()));return output;}));}
  catch(e){this.users=usersBefore;this.relations=relationsBefore;this.rooms.clear();this.live.clear();for(const [k,json]of before){const r=JSON.parse(json);this.rooms.set(k,r);this.live.set(k,this.e.create({format:r.format,profile:r.profile,deck:r.deck,id:k,saved:r.saved,mode:r.mode}));}throw e;}
 }
 async command(u,b){
  const now=this.clock();
  if(b.type==='logout'){(await this.s.run('DELETE FROM sessions WHERE user_id=?',u));this.presence.delete(u);return;}
  if(b.type==='display'){if(typeof b.display!=='string'||b.display.trim().length<1||b.display.length>32)fail('Display name must be 1–32 characters.');(await this.s.run('UPDATE users SET display=? WHERE id=?',b.display.trim(),u));this.users.set(u,{...this.users.get(u),display:b.display.trim()});return;}
  if(['friend-request','friend-accept','friend-decline','friend-remove','block','unblock'].includes(b.type)){
   const v=this.resolve(b.username);if(v===u)fail('Choose another player.');
   if(b.type==='block'){(await this.s.run("DELETE FROM relations WHERE kind!='block' AND ((a=? AND b=?) OR(a=? AND b=?))",u,v,v,u));(await this.s.run('DELETE FROM invites WHERE (sender=? AND recipient=?) OR(sender=? AND recipient=?)',u,v,v,u));(await this.s.run("INSERT OR IGNORE INTO relations VALUES(?,?,'block')",u,v));return;}
   if(b.type==='unblock'){(await this.s.run("DELETE FROM relations WHERE a=? AND b=? AND kind='block'",u,v));return;}
   if(this.blocked(u,v))fail('This player is unavailable.');
   if(b.type==='friend-request'){if(this.friends(u,v))fail('Already friends.');if((await this.s.one("SELECT count(*) n FROM relations WHERE kind='request' AND a=?",u)).n>=30)fail('Too many pending requests.');(await this.s.run("INSERT OR IGNORE INTO relations VALUES(?,?,'request')",u,v));}
   if(b.type==='friend-accept'){if(!(await this.s.one("SELECT 1 FROM relations WHERE a=? AND b=? AND kind='request'",v,u)))fail('Request not found.');(await this.s.run("INSERT OR IGNORE INTO relations VALUES(?,?,'friend')",u,v));(await this.s.run("INSERT OR IGNORE INTO relations VALUES(?,?,'friend')",v,u));}
   if(b.type!=='friend-request')(await this.s.run("DELETE FROM relations WHERE kind='request' AND ((a=? AND b=?) OR(a=? AND b=?))",u,v,v,u));
   if(b.type==='friend-remove')(await this.s.run("DELETE FROM relations WHERE kind='friend' AND ((a=? AND b=?) OR(a=? AND b=?))",u,v,v,u));
   return;
  }
  if(b.type==='create'){
   if(this.active(u))fail('Leave your current room first.');if(this.rooms.size>=this.maxRooms)fail('Server rooms are full. Try again later.',503);
   const format=this.e.formats.find(f=>f.id===b.formatId);if(!format)fail('Choose a server format.');if(!this.e.profiles[b.profile])fail('Choose a rules profile.');
   if(!['public','private'].includes(b.visibility)||!['regular','new','ken'].includes(b.mode))fail('Invalid room settings.');
   const roomId=id(),r={id:roomId,code:crypto.randomBytes(12).toString('base64url'),title:String(b.title||'Friendly match').slice(0,64),format,profile:b.profile,mode:b.mode,visibility:b.visibility,members:[u],deck:b.deck,status:'waiting',engine:this.e.fingerprint,updated:now,muted:[],emotes:[]};
   const p=this.e.create({format,profile:r.profile,deck:b.deck,id:roomId,mode:r.mode});r.deck=p.save().hostDeck;r.saved=p.save();this.rooms.set(roomId,r);this.live.set(roomId,p);(await this.save(r));return {roomId};
  }
  if(b.type==='join'){
   if(this.active(u))fail('Leave your current room first.');const r=b.code?[...this.rooms.values()].find(x=>x.code===b.code):this.rooms.get(b.roomId);
   if(!r||r.status!=='waiting'||r.members.length!==1||this.blocked(u,r.members[0]))fail('Room unavailable.',409);
   if(r.visibility==='private'&&b.code!==r.code&&!(await this.s.one('SELECT 1 FROM invites WHERE room_id=? AND recipient=? AND expires>?',r.id,u,now)))fail('Private invitation required.',403);
   r.members.push(u);r.updated=now;(await this.touchRoom(r));(await this.save(r));(await this.s.run('DELETE FROM invites WHERE recipient=? AND room_id=?',u,r.id));return {roomId:r.id};
  }
  if(b.type==='report'){const v=this.resolve(b.username);if(typeof b.reason!=='string'||b.reason.trim().length<5||b.reason.length>500)fail('Describe the issue in 5–500 characters.');(await this.s.run('INSERT INTO reports VALUES(?,?,?,?,?,?)',id(),u,v,String(b.roomId||'').slice(0,40),b.reason,now));return;}
  const r=this.active(u);if(!r)fail('Join a room first.');const p=this.live.get(r.id),seat=r.members.indexOf(u)+1;
  if(b.type==='invite'){const v=this.resolve(b.username);if(!this.friends(u,v)||this.blocked(u,v)||r.status!=='waiting')fail('Invite an available friend to a waiting room.');(await this.s.run('DELETE FROM invites WHERE sender=? AND recipient=?',u,v));(await this.s.run('INSERT INTO invites VALUES(?,?,?,?,?)',id(),u,v,r.id,now+5*60000));return;}
  if(b.type==='leave'){
   // Leaving is explicit abandonment; temporary transport loss only pauses play.
   r.status='closed';r.reason=r.saved.match?'Player left; casual match abandoned.':'Room closed.';(await this.save(r));this.rooms.delete(r.id);this.live.delete(r.id);return;
  }
  if(b.type==='mute'){r.muted=r.muted.includes(u)?r.muted.filter(x=>x!==u):[...r.muted,u];(await this.save(r));return;}
  if(b.type==='emote'){if(!['Hello!','Good luck!','Nice play!','Thinking…','Good game!'].includes(b.text))fail('Choose a preset emote.');if(r.emotes.some(x=>x.user===u&&now-x.at<4000))fail('Wait before sending another emote.',429);r.emotes=[...r.emotes,{user:u,text:b.text,at:now}].slice(-6);(await this.save(r));return;}
  if(b.type==='match'){
   if(!b.message||typeof b.message!=='object')fail('Match command required.');(await this.touchRoom(r));
   const m={...b.message,requestId:b.requestId};p.receive(seat,m);r.updated=now;(await this.touchRoom(r));(await this.save(r));return {ok:true};
  }
  fail('Unknown command.');
 }
}
module.exports={Service,sha};
