const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),file=path.join(root,'work/desktop/ui/rules-engine.js'),spec=require('./release-engine-encoding.json'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const input=fs.readFileSync(file);assert.equal(sha(input),spec.inputSha256,'Unexpected compiler output: do not apply frozen-release encoding to a changed engine');
const lines=input.toString('utf8').match(/[^\n]*\n|[^\n]+$/g);for(const e of spec.lines){assert.equal(lines[e.line],e.from);lines[e.line]=e.to;}
const output=Buffer.from(lines.join(''),'utf8');assert.equal(sha(output),spec.outputSha256);fs.writeFileSync(file,output);console.log('Exact frozen release engine reproduced: '+spec.outputSha256);
