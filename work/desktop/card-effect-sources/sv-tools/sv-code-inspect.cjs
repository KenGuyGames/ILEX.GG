const c=require('../desktop/ui/deck-set-codes.json');console.log(JSON.stringify(Object.entries(c).filter(([k])=>k.startsWith('sv')).slice(0,25),null,2));
