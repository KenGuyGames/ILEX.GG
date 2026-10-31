'use strict';
const fs=require('node:fs'),path=require('node:path'),{AsyncLocalStorage}=require('node:async_hooks');
function sql(text){let i=0,quoted=false,out='';for(let p=0;p<text.length;p++){const c=text[p];if(c==="'"){out+=c;if(quoted&&text[p+1]==="'"){out+=text[++p];continue;}quoted=!quoted;}else out+=c==='?'&&!quoted?'$'+(++i):c;}if(/^INSERT OR IGNORE INTO /i.test(out))out=out.replace(/^INSERT OR IGNORE INTO /i,'INSERT INTO ')+' ON CONFLICT DO NOTHING';return out;}
class Store{
 constructor(pool,{test=false}={}){this.pool=pool;this.context=new AsyncLocalStorage();this.test=test;this.epoch=require('node:crypto').randomUUID();}
 async initialize(){for(const statement of fs.readFileSync(path.join(__dirname,'schema.sql'),'utf8').split(';').map(s=>s.trim()).filter(Boolean))await this.pool.query(statement);}
 async query(text,args=[]){const c=this.context.getStore()||this.pool;const r=await c.query(sql(text),args);return {...r,rows:r.rows.map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,['n','created','expires','updated'].includes(k)&&typeof v==='string'&&/^\d+$/.test(v)?Number(v):v])))};}
 async run(text,...args){return this.query(text,args);}
 async one(text,...args){return (await this.query(text,args)).rows[0];}
 async all(text,...args){return (await this.query(text,args)).rows;}
 async transaction(fn){if(this.context.getStore())return fn();const c=await this.pool.connect();try{await c.query('BEGIN');if(!this.test)await c.query('SELECT pg_advisory_xact_lock(1875085661)');const result=await this.context.run(c,fn);await c.query('COMMIT');return result;}catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{c.release();}}
 async claim(){await this.transaction(()=>this.run('INSERT INTO deployment_owner VALUES(1,?) ON CONFLICT(id) DO UPDATE SET epoch=excluded.epoch',this.epoch));}
 async assertOwner(){const r=await this.one('SELECT epoch FROM deployment_owner WHERE id=1');if(r?.epoch!==this.epoch)throw Object.assign(Error('Server deployment changed. Reconnect shortly.'),{status:503});}
 async close(){await this.pool.end();}
 static async open(url){if(!url)throw Error('DATABASE_URL is required.');const {Pool}=require('pg'),u=new URL(url);if(!['postgres:','postgresql:'].includes(u.protocol))throw Error('DATABASE_URL must be PostgreSQL.');u.searchParams.delete('sslmode');u.searchParams.delete('channel_binding');const pool=new Pool({connectionString:u.toString(),ssl:{rejectUnauthorized:true},max:3,connectionTimeoutMillis:12000,idleTimeoutMillis:10000,statement_timeout:15000});pool.on('error',()=>console.error('Database connection interrupted; reconnecting on the next request.'));const s=new Store(pool);await s.initialize();return s;}
}
module.exports={Store,sql};
