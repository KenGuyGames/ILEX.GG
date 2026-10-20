const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/cube-candidate/ui');function patch(n,a,b){const f=path.join(ui,n),s=fs.readFileSync(f,'utf8');if(s.includes(b))return;if(!s.includes(a))throw Error(n+' missing target');fs.writeFileSync(f,s.replace(a,b));}
patch('cube-library.js',"const allowed=format.cubePool||null;","const allowed=deck.cubePool||format.cubePool||null;if(format.draftId&&deck.cubeDraftId!==format.draftId)issues.push('Assign a deck built from this draft session');");
patch('cube-ui.js',"if(!format?.cubePool)return;const pool=Object.entries(format.cubePool);","if(!format?.cubeRules||!deck.cubePool)return;const pool=Object.entries(deck.cubePool);");
patch('cube-ui.js',"cards:{},cubeDraftId:d.id}","cards:{},cubePool:pool,cubeDraftId:d.id}");
patch('rules-ui.js',"ds.map(d=>({name:d.name,cards:d.cards}))","ds.map(d=>({name:d.name,cards:d.cards,cubePool:d.cubePool,cubeDraftId:d.cubeDraftId}))");
patch('bot-ai.js',"const realPrize=l=>{", "const realPrize=l=>{if(Number.isInteger(l?.getPokemonCard()?._cubePrizeValue))return l.getPokemonCard()._cubePrizeValue;");
console.log('Draft ownership and bot Prize valuation integrated');
