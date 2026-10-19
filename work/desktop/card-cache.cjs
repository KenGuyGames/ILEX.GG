const fs=require('node:fs/promises');
const path=require('node:path');
const {createHash}=require('node:crypto');
class CardCache {
  constructor({manifest,directory,bundled,fetch,notify=()=>{}}){
    Object.assign(this,{directory,bundled,fetch,notify});
    this.entries=new Map(Object.values(manifest).map(e=>[path.basename(e.file),e]));
    this.pending=new Map();this.active=0;this.queue=[];this.running=false;this.cancelled=false;
    this.progress={running:false,checked:0,total:this.entries.size,failed:0};
  }
  validName(name){return /^[a-f0-9]{24}\.(webp|jpg|png)$/.test(name)&&this.entries.has(name)}
  async valid(file,e){try{const b=await fs.readFile(file);return b.length===e.bytes&&createHash('sha256').update(b).digest('hex')===e.sha256}catch{return false}}
  async local(name){if(!this.validName(name))throw Error('Unknown card image');const e=this.entries.get(name);for(const root of [this.directory,this.bundled]){if(root&&await this.valid(path.join(root,name),e))return path.join(root,name)}
    const promo=require('./promo-scan-files.json')[name];if(promo&&path.basename(promo)===promo){const file=path.join(__dirname,'card-effect-sources/mega-official-promos',promo);if(await this.valid(file,e))return file}return null}
  async resolve(name){if(!this.validName(name))throw Error('Unknown card image');const local=await this.local(name);if(local)return local;
    if(this.pending.has(name))return this.pending.get(name);
    const job=(async()=>{await new Promise(resolve=>{this.queue.push(resolve);this.pump()});try{
      const e=this.entries.get(name),url=new URL(e.sourceUrl||e.url);
      if(url.protocol!=='https:'||!['assets.tcgdex.net','pkmncards.com','images.pokemontcg.io','cdn.malie.io','img.tcgscreener.com','limitlesstcg.nyc3.cdn.digitaloceanspaces.com','product-images.tcgplayer.com','static.dextcg.com','www.pokebeach.com','mcdn.pokemon.com'].includes(url.hostname))throw Error('Unsupported image source');
      const response=await this.fetch(url.href,{signal:AbortSignal.timeout(30000)});
      if(!response.ok)throw Error('Image server returned '+response.status);
      const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;if(size>e.bytes)throw Error('Image size changed');chunks.push(Buffer.from(chunk))}
      const bytes=Buffer.concat(chunks);
      if(bytes.length!==e.bytes||createHash('sha256').update(bytes).digest('hex')!==e.sha256)throw Error('Image verification failed');
      await fs.mkdir(this.directory,{recursive:true});const target=path.join(this.directory,name),temp=target+'.partial';
      await fs.writeFile(temp,bytes);await fs.rename(temp,target);return target;
    }finally{this.active--;this.pump()}})();
    this.pending.set(name,job);try{return await job}finally{this.pending.delete(name)}
  }
  pump(){while(this.active<4&&this.queue.length){this.active++;this.queue.shift()()}}
  status(){return {...this.progress,running:this.running,directory:this.directory}}
  pause(){this.cancelled=true;return this.status()}
  start(){if(this.running)return this.status();this.running=true;this.cancelled=false;this.progress={checked:0,total:this.entries.size,failed:0};
    this.run().catch(e=>{this.progress.error=e.message}).finally(()=>{this.running=false;this.notify(this.status())});return this.status()}
  async run(){const names=[...this.entries.keys()];let cursor=0;
    await Promise.all(Array.from({length:4},async()=>{while(!this.cancelled&&cursor<names.length){const name=names[cursor++];try{await this.resolve(name)}catch{this.progress.failed++}this.progress.checked++;this.notify(this.status())}}));
  }
}
module.exports=CardCache;
