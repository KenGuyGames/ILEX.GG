const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..'),file=path.join(root,'work/cube-candidate/ui/rules-match.js');let s=fs.readFileSync(file,'utf8');const anchor='      const names=ids.map(namesFor);',extra=`
      if(spec.cubeRules&&spec.format?.markerRules?.draftId&&!spec.decks[i].cubePool)throw Error('Choose a deck owned by a seat in this draft');
      if(spec.cubeRules&&spec.decks[i].cubePool)for(const [id,n]of Object.entries(spec.decks[i].cards)){const c=prototypes.get(namesFor(id));if(c?.superType===R.SuperType.ENERGY&&c.energyType===R.EnergyType.BASIC)continue;if(n>(spec.decks[i].cubePool[id]||0))throw Error(id+': exceeds this seat’s drafted pool');}
`;
if(!s.includes('exceeds this seat’s drafted pool')){if(!s.includes(anchor))throw Error('Ownership anchor missing');s=s.replace(anchor,anchor+extra);fs.writeFileSync(file,s);}console.log('Engine enforces pinned draft ownership');
