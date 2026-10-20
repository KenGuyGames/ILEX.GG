const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/cube-candidate/ui');function patch(n,a,b){const f=path.join(ui,n),s=fs.readFileSync(f,'utf8');if(s.includes(b))return;if(!s.includes(a))throw Error(n+' target missing');fs.writeFileSync(f,s.replace(a,b));}
patch('index.html','class="menu-card" data-tab="cubes"><span class="menu-card-icon">❖</span><span><strong>Cube draft</strong><small>Draft a cube. Shape your rules.</small></span></button>','data-tab="cubes"><span class="menu-icon" aria-hidden="true">❖</span><span><strong>Cube draft</strong><small>Draft a cube. Shape your rules.</small></span><span class="menu-arrow" aria-hidden="true">↗</span></button>');
patch('cube-ui.js',"async function cubeScreen(){ $('#app')","async function cubeScreen(){if(tab!=='cubes')return; $('#app')");
patch('cube-ui.js',"const cubeAssets=Promise.all", "let cubeBuiltins=[];\nconst cubeAssets=Promise.all");
patch('cube-ui.js',"then(([,presets])=>{if(!Array.isArray(state.cubes))", "then(([,presets])=>{cubeBuiltins=presets;if(!Array.isArray(state.cubes))");
patch('cube-ui.js',"if(tab!=='cubes')return;const c=currentCube();", "if(tab!=='cubes')return;if(!Array.isArray(state.cubes)){state.cubes=CubeLibrary.clone(cubeBuiltins);state.cubeDrafts??=[];save();}const c=currentCube();");
patch('cube-library.js',"mutantEvolution:!!meta.mutant","mutantEvolution:meta.mutant===true");
patch('cube-library.js',"(id.startsWith(set+'-')||id.startsWith((aliases[set]||set)+'-'))", "(id.startsWith(set+'-')||id.startsWith((aliases[set]||set)+'-')||!!remote.ptcgo&&d.ptcgoCode===String(remote.ptcgo).split(' ')[0])");
patch('private-match.js',"function cleanFormat(f){", "function cleanFormat(f){if(f?.cubeRules)fail('Cube draft matches currently support local and bot play.');");
console.log('Cube navigation, menu styling and private-format guard completed');
