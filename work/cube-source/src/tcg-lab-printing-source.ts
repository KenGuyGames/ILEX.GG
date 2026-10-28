// Select native implementations by the printing's effect where names were reused.
export function printingSource(record: any): string | undefined {
 const d=record.d, text=(d.rules||[]).join(' ');
 if(d.supertype!=='Trainer') return record.reuse;
 if(d.name==='Potion' && /Heal 30 damage/i.test(text)) return 'Potion SVI';
 if(d.name==='Great Ball' && /top 7 cards/i.test(text)) return 'Great Ball PAL';
 if(d.name==='Energy Retrieval' && /Put (?:up to )?2 basic Energy/i.test(text)) return 'Energy Retrieval SVI';
 if(d.name==='Revive' && !/damage counters/i.test(text)) return 'Revive BLW';
 if(d.name==='Super Potion' && /Heal 60 damage/i.test(text)) return 'Super Potion XY';
 if(d.name==='Lance' && /up to 3 Dragon/i.test(text)) return 'Lance SIT';
 if(/Lysandre/.test(d.name) && /Lost Zone/i.test(text)) return 'Lysandre Prism Star FLI';
 if(/Lusamine/.test(d.name) && /Ultra Beasts/i.test(text)) return 'Lusamine ◇ LOT';
 return record.reuse;
}
