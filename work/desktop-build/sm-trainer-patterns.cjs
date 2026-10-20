const previous=require('./xy-trainer-patterns.cjs');
module.exports=d=>{
 const special={
 Will:[{op:'sm',kind:'will'}],
 'Missing Clover':[{op:'sm',kind:'missingClover'}],
 Morty:[{op:'sm',kind:'morty'}],
 'Sabrina & Brycen':[{op:'sm',kind:'sabrinaBrycen'}],
 'Misty & Lorelei':[{op:'sm',kind:'mistyLorelei'}],
 Bonnie:[{op:'sm',kind:'bonnie'}],
 'Cynthia & Caitlin':[{op:'sm',kind:'recoverSupporter'}],
 'Dust Island':[{op:'stadium',kind:'smDustIsland'}],
 'Normalium Z: Tackle':[{op:'tool',kind:'smZ',requiredAttack:'Tackle'}],
 'Dragonium Z: Dragon Claw':[{op:'tool',kind:'smZ',requiredAttack:'Dragon Claw'}]
 ,'Flyinium Z: Air Slash':[{op:'tool',kind:'smZ',requiredAttack:'Air Slash'}]
 };
 return special[d.name]||previous(d);
};
