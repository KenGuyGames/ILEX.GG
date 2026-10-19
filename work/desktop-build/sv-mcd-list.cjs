const c=require('../desktop/ui/cards.json');for(const set of ['2023sv','2024sv'])console.log(set,c.filter(c=>c.id.startsWith(set+'-')).map(c=>({id:c.id,name:c.name,scan:c.scan})));
