const fs=require('fs'),path=require('path'),file=path.resolve(__dirname,'../rules-research/twinleafgg-main/ptcg-server/src/game/store/prompts/choose-energy-prompt.ts');let s=fs.readFileSync(file,'utf8');
if(!s.includes('this.energy = StateUtils.physicalEnergyMap'))s=s.replace(/super\(playerId\);\r?\n/,'super(playerId);\n    this.energy = StateUtils.physicalEnergyMap(this.energy);\n');
const begin=s.indexOf('  private getCostThatCanBePaid()'),brace=s.indexOf('{',begin);if(begin<0||brace<0)throw Error('Energy prompt method missing');let depth=1,end=brace+1;while(depth&&end<s.length){if(s[end]==='{')depth++;else if(s[end]==='}')depth--;end++;}if(depth)throw Error('Unbalanced energy method');
s=s.slice(0,begin)+`  private getCostThatCanBePaid(): CardType[] {
    const payable: CardType[] = [];
    // Prefer printed typed requirements, then spend any remaining units on C.
    const ordered=[...this.cost.filter(type=>type!==CardType.COLORLESS),...this.cost.filter(type=>type===CardType.COLORLESS)];
    for(const type of ordered)if(StateUtils.checkEnoughEnergy(this.energy,[...payable,type]))payable.push(type);
    return payable;
  }`+s.slice(end);fs.writeFileSync(file,s);
const utils=path.resolve(__dirname,'../rules-research/twinleafgg-main/ptcg-server/src/game/store/state-utils.ts');let u=fs.readFileSync(utils,'utf8');
const first=u.indexOf('  public static selectMinimalEnergyForCost('),open=u.indexOf('{',first);if(first<0)throw Error('Minimal energy selector missing');let level=1,last=open+1;while(level&&last<u.length){if(u[last]==='{')level++;else if(u[last]==='}')level--;last++;}
u=u.slice(0,first)+`  public static selectMinimalEnergyForCost(energyMap: EnergyMap[], cost: CardType[]): EnergyMap[] | null {
    if(!cost.length)return [];
    let selected=StateUtils.physicalEnergyMap(energyMap);
    if(!StateUtils.checkEnoughEnergy(selected,cost))return null;
    selected.sort((a,b)=>StateUtils.getProvidesUnitCount(a.provides,a)-StateUtils.getProvidesUnitCount(b.provides,b));
    // Trim physical cards using the full matching solver, retaining overlapping
    // selectable types and every unit of multi-unit Special Energy.
    for(let i=0;i<selected.length;){const rest=selected.filter((_,index)=>index!==i);if(StateUtils.checkEnoughEnergy(rest,cost))selected=rest;else i++;}
    return selected;
  }`+u.slice(last);fs.writeFileSync(utils,u);console.log('Physical-card Energy prompt normalization applied');
