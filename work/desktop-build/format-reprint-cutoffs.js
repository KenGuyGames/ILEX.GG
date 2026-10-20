  const formatCutoffCache=new Map();
  function reprintRulesThroughFor(spec){
    if(['unlimited','modern','expanded'].includes(spec.profile))return;
    const rules=spec.format?.markerRules||spec.format;if(!rules)return;
    const end=formatReprintCatalog.rank[formatReprintCatalog.ends[spec.profile]];if(end===undefined)return;
    const explicit=rules.reprintThrough;if(explicit&&formatReprintCatalog.rank[explicit]!==undefined&&formatReprintCatalog.rank[explicit]<=end)return explicit;
    const prefixes=String(rules.sets||'').split(',').map(x=>x.trim().replace(/-$/,''));
    let best;for(const [set,index]of Object.entries(formatReprintCatalog.rank))if(index<=end&&prefixes.includes(set)&&(!best||index>formatReprintCatalog.rank[best]))best=set;
    return best;
  }
  function reprintTableFor(profile,through){
    const current=formatReprints[profile]||{},rank=formatReprintCatalog.rank[through],end=formatReprintCatalog.rank[formatReprintCatalog.ends[profile]];
    if(rank===undefined||end===undefined||rank>=end)return current;
    const key=profile+'|'+through;if(formatCutoffCache.has(key))return formatCutoffCache.get(key);
    const table={};for(const group of formatReprintCatalog.groups){const row=group.rows.find(x=>x[1]<=rank);if(!row)continue;
      let template=formatReprintCatalog.overrides[profile]?.[group.name]||row[0];
      if(group.name==='Leftovers'&&row[1]<formatReprintCatalog.rank['sv03.5'])template='ILEX FORMAT Leftovers legacy';
      for(const [name]of group.rows)if(name!==template)table[name]=template;
    }
    formatCutoffCache.set(key,table);return table;
  }
