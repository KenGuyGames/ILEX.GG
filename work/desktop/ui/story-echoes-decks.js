const EchoesFormatOverrides={
 2:{name:'2009 Worlds (DP–RR)',sets:LimitlessCollection.formats[10].sets.replace(',pl3-,pl4-',''),allowedPrintingIds:['dpp-DP30','dpp-DP40','dpp-DP41']},
 5:{name:'2021 Players Cup IV (TEU–CRE)',sets:'sm9-,sm10-,sm11-,sm115-,sm12-,swsh1-,swsh2-,swsh3-,swsh3.5-,swsh4-,swsh4.5-,swsh5-,swsh6-',allowedPrintingIds:[]},
 10:{name:'2015 Worlds (BCR–ROS)',banned:"Lysandre's Trump Card"},
 12:{name:'2022 Worlds (SSH–PGO)',sets:LimitlessCollection.formats[30].sets.split(',').filter(s=>!['swsh11-','swsh11tg-','swsh12-'].includes(s)).join(','),allowedPrintingIds:[]},
 13:{name:'2023 Worlds (Regulation E–PAL)',ruleProfile:'sv'},
};
const EchoesDeckVariants=(()=>{
 const list=(name,cards,credit='Campaign reconstruction of a period archetype')=>({name,credit,cards:Object.fromEntries(cards.split(/\s+/).filter(Boolean).map(x=>{const [n,id]=x.split('*');return [id,+n];}))});
 const archived=(i,name)=>LimitlessCollection.decks.find(d=>d.format===LimitlessCollection.formats[i-1].id&&d.name===name);
 const adapt=(i,name,drop,add,credit)=>{const d=archived(i,name),cards={...d.cards};for(const k of drop)delete cards[k];for(const [k,v] of Object.entries(add))cards[k]=(cards[k]||0)+v;return {cards,credit:credit||'Campaign adaptation of '+d.name};};
 return {
 1:{'Espeon-GX / Garbodor':adapt(24,'Drampa Garb',['sm2-142'],{'sm1-61':2,'sm1-101':2,'xy10-105':0,'sm1-137':-1})},
 2:{
 'Flygon / Machamp':list('Flygon / Machamp','1*pl2-105 3*pl2-5 2*pl2-53 3*dp3-115 1*pl2-84 1*dp7-98 2*dp7-20 1*dp7-41 2*dp7-64 1*pl2-30 1*pl2-70 2*dp4-15 2*dp4-60 2*dp4-57 1*dp6-43 1*dp6-19 1*dp6-27 1*dp5-55 4*dp3-125 4*dp2-109 4*dp4-102 2*dp6-131 2*dp2-113 1*dp7-88 1*dp7-86 1*pl2-92 4*dp5-92 4*dp1-128 3*pl2-102 2*dp1-127','Based on Sami Sekkoum · 2009 Worlds'),
 'CurseGar':list('Gengar / Dusknoir','4*dp7-62 3*dp7-40 4*dp7-18 2*dp7-63 1*dp7-34 1*dp1-2 1*dp7-1 1*dp7-96 2*dp4-60 2*dp4-15 1*dp6-43 1*dp6-19 1*dp4-57 1*dp5-49 4*dp3-125 4*dp2-109 3*dp6-131 4*dp4-102 2*pl1-109 1*dp1-119 1*dp2-113 1*dp7-86 8*dp1-127 4*dp5-92 3*pl1-104'),
 'Palkia Lock':list('Palkia Lock','1*pl1-125 3*pl1-12 1*dp6-146 3*dp6-43 4*dp6-34 1*dp6-19 1*dp2-4 2*pl1-47 1*pl1-55 1*pl1-83 1*dpp-DP41 1*pl2-31 1*pl1-41 2*dp4-57 4*pl1-105 4*dp3-125 1*dp2-109 1*pl2-88 4*pl1-116 4*pl1-118 3*pl1-117 2*pl2-96 1*dp2-113 1*dp7-86 5*dp1-125 4*dp5-92 2*dp1-127 1*dp1-126','Based on the 2009 Palkia Lock archive'),
 },
 3:{'Aromatisse / Mega Kangaskhan':adapt(19,'Fairy Plasma Box',['bw9-111','bw9-110','bw10-97','bw10-96','bw8-133','bw7-144','bw6-124','bw9-31','bw9-67','bw10-91','bw9-121'],{'xy2-78':3,'xy2-79':2,'xy1-96':2, 'xy1-94':2,'xy1-95':2,'xy1-140':4,'bw9-122':1,'xy1-123':3})},
 5:{
 'Ice Rider / Inteleon':list('Ice Rider / Inteleon','4*swsh6-45 3*swsh6-46 4*swsh6-41 4*swsh1-56 2*swsh6-43 4*swsh6-146 3*swsh1-169 3*swsh2-154 2*swsh1-178 1*swsh3-159 4*swsh1-179 4*swsh1-163 3*swsh5-129 3*swsh2-156 2*sm11-206 1*sm9-152 2*swsh1-156 3*swsh6-148 8*limitlessSSH-W','Christian Hasbani · Players Cup IV'),
 'Shadow Rider Calyrex':list('Shadow Rider Calyrex','4*swsh6-74 4*swsh6-75 2*sm10-57 2*sm10-81 1*swsh3.5-22 1*swsh3.5-23 1*sm9-53 1*swsh6-64 4*swsh1-178 3*swsh1-169 3*swsh2-154 4*swsh6-140 4*swsh1-179 2*swsh1-163 2*sm9-152 2*swsh1-183 1*swsh1-171 1*sm11-206 2*swsh1-156 1*swsh6-148 1*swsh2-169 13*limitlessSSH-P 1*sm11-213','Isaac Troan · Players Cup IV'),
 'Rapid Strike Urshifu VMax':adapt(30,'Rapid Strike Urshifu VMax',['swsh7-152'],{'swsh2-154':3}),
 },
 6:{
 'Ludicolo / Magcargo':list('Ludicolo / Magcargo','4*ex2-60 3*ex8-10 2*ex2-45 3*ex2-66 1*ex6-114 2*ex8-20 2*ex7-77 2*ex5-38 2*ex5-57 4*ex6-88 2*ex7-86 1*ex3-88 1*ex4-83 1*ex5-88 1*ex1-89 1*ex3-87 3*ex2-88 1*ex1-92 1*ex2-91 1*ex7-92 1*ex2-92 1*ex2-89 1*ex7-84 1*ex6-100 4*ex5-85 6*ex9-103 4*ex8-95 2*ex8-94 2*ex9-87','Based on the 2005 LudiCargo archive'),
 'Queendom':adapt(7,'Queendom',['ex15-73'],{'ex7-86':2,'ex3-88':2}),
 },
 7:{'Greninja BREAK':adapt(21,'Greninja BREAK',[],{'xy9-99':1}),'Metal Box':adapt(20,'Metal Box',['bwp-BW100','bw8-118','bw7-142','bw7-137', 'bw9-99','bw8-133','xy4-99'],{'xy10-105':3,'xy8-137':3,'xy10-108':1,'xy9-119':2,'xy9-100':2,'xy9-99':2})},
 10:{
 'Archiestoise':list('Archiestoise','2*bw7-31 3*bw7-49 2*bw10-60 2*xy6-106 2*bw9-4 1*xy6-17 1*bw4-54 1*xy5-38 2*xy5-124 2*bw10-84 1*xy2-90 1*bw5-96 4*xy4-109 4*bw10-90 4*xy4-92 4*bw9-103 4*xy6-92 4*xy5-122 1*bw7-137 1*bw9-99 1*xy1-121 2*xy5-137 11*xy1-134','Jacob Van Wagner · 2015 Worlds'),
 'M Rayquaza EX':adapt(20,'M Rayquaza EX',['xy4-99'],{'xy4-109':0,'xy5-122':1}),
 'Mega Manectric / Genesect':list('Mega Manectric / Genesect','3*xy4-24 4*xy4-23 2*bw10-11 2*xy6-106 1*bw10-9 4*xy1-122 3*bw5-96 1*bw8-118 1*xy2-104 1*bw9-102 1*bw7-134 4*bw9-122 4*xy4-109 3*xy4-100 3*xy6-92 2*bw9-121 2*bw7-135 1*xy4-92 1*xy1-121 1*xy3-101 1*bw10-92 3*xy5-137 5*xy1-132 5*xy1-135 2*bw10-91','Pokémon.com · 2015 Worlds'),
 },
 12:{
 'Arceus / Flying Pikachu':list('Arceus / Flying Pikachu','4*swsh9-122 3*swsh9-123 3*cel25-6 2*cel25-7 2*swsh10-083 2*swsh10-084 2*swsh9-120 2*swsh9-121 1*swsh3-104 1*swsh9-040 1*swsh7-76 4*swsh1-169 4*swsh9-132 2*swsh9-147 1*swsh7-152 4*swsh1-179 4*swsh9-150 1*swsh1-163 1*swsh1-183 4*swsh6-148 4*swsh9-151 4*limitlessBRS-L 3*limitlessBRS-F 1*swsh2-171','Ondřej Škubal · 2022 Worlds'),
 'Palkia VStar':list('Palkia VStar','3*swsh10-039 3*swsh10-040 4*swsh6-41 3*swsh1-56 1*swsh6-43 1*swsh1-58 1*swsh10-046 1*swsh8-76 1*swsh9-041 1*swsh1-117 4*swsh10-147 2*swsh6-146 1*swsh9-132 1*swsh10-150 4*swsh8-230 4*swsh8-225 3*swsh2-156 3*swsh2-165 3*swsh1-163 2*swsh1-179 2*swsh5-129 1*swsh10-146 1*swsh6-136 1*swsh9-135 1*swsh5-136 1*swsh2-169 7*limitlessBRS-W','Based on Kaiwen Cabbabe · 2022 Worlds'),
 'Mew VMax':list('Mew VMax','4*swsh8-113 3*swsh8-114 4*swsh8-185 1*swsh8-124 1*swsh8-42 4*swsh8-233 2*swsh9-132 1*swsh9-147 4*swsh8-225 4*swsh8-236 4*swsh8-229 4*swsh9-150 4*swsh1-179 2*swsh8-230 2*swsh8-232 1*swsh5-125 1*swsh9-135 1*swsh1-183 1*swsh5-127 2*swsh8-234 2*swsh9-151 4*swsh8-244 2*swsh3.5-64 2*swsh1-156'),
 },
 };
})();
const EchoesExtraMissions={
 2:['Station Security','Palkia Lock','The Carriage Door','I was assigned to protect the people on this platform. Nobody told me when that stopped including the people on the train.','I’ll stay with the passengers. You need the officer’s key.'],
 3:['Inspector','Fairy Plasma Box','Intake Inspection','There are names on the intake sheet. You have to let me finish reading them.','Here is the annex. Rell is waiting at the last bench.'],
 4:['Records Keeper','Flygon','The Original Record','I left the old entry underneath. I knew what would happen if I erased it.','You should hear the rest from Maren.'],
 5:['Captain','Rapid Strike Urshifu VMax','The Shelter Guard','My orders keep the gate shut, and every night I hear people thanking me for it.','I’ll stand watch when you survey. People can still come back.'],
 6:['Irrigation Guard','Medicham ex','The Shut Valve','If I open it, the supervisor will say I wasted water.','If anyone asks why the orchards are wet, tell them I saw people standing under dry taps.'],
 7:['Freight Keeper','Metal Box','A Rope, Not a Winch','I have a winch ready for the part. Nobody ordered a rope for the worker.','Take the rope. I’ll tie it off here.'],
 10:['Residence Marshal','M Rayquaza EX','The Seal Crew','We used to write a number beside each bed so we could call everyone by name. Now we just call the number.','Tell the administrator there are people waiting by the door. Use their names.'],
 13:['Reserve Keeper','Chien Pao Baxcalibur','Keep the Hall Clear','I can give you time. I can’t give you another guardian.','Go. I’ll stay here until the last person has made up their mind.'],
};
const EchoesSignatures={'Gardevoir GX':'Infinite Force','Palkia Lock':'Hydro Shot','Yveltal Garb':'Evil Ball','Flygon':'Dragon Claw','Shadow Rider Calyrex':'Max Geist','PowTar':'Spinning Tail','M Audino EX':'Magical Symphony','Gardevoir Gallade':'Psychic Cut','Mewtwo Darkrai':'Night Spear','Mega Manectric / Genesect':'Turbo Bolt','TDK':'Blizzard Burn','Palkia VStar':'Subspace Swell','Mew VMax':'Cross Fusion Strike','LostTina':'Star Requiem'};

const EchoesBossRemarks={'Gardevoir GX':'I used to sign for every name. I want you to remember that when you read mine.', 'Palkia Lock':'I can still keep this carriage here. I don’t know where it goes if I let it go.', 'Yveltal Garb':'I remember when he asked us to leave the address blank.', 'Shadow Rider Calyrex':'I know what’s outside this gate. I wish knowing made it easier to open.', 'PowTar':'The valve has held for years. I keep forgetting the orchards haven’t.', 'M Audino EX':'The component is going under. Tell me you can still see the worker.', 'Mewtwo Darkrai':'I was told to take the file if you tried to leave with it.', 'Mega Manectric / Genesect':'These rooms will still need heat tomorrow. Tell me who’s going to keep them warm.', 'TDK':'The shelter lights are on. That means you picked the right switch.', 'Palkia VStar':'The platform is holding. Do you still have somebody on the other side?', 'Mew VMax':'I can tell you where every letter went. I cannot tell you why I never sent them.'};

const EchoesSceneNotes=[
 [`Pell|There’s a chip on the empty bowl. He hit it with a spoon when he was seven.
 Iona~sad|He was six.
 Pell|Right. Six.
 Narrator|Pell draws the chair out a little farther. Iona doesn’t push it back.`.replace(/^ +/gm,''),'Can you wait to take your last Prize until I’ve put his name back?','I can hear the supper bell through the crossing. Take your time.'],
 [`Rook|The attendant used to announce every train. Even the empty ones.
 Nessa|What happened to her?
 Rook|She stopped asking me when she could go home. I should have asked her why.`.replace(/^ +/gm,''),'One more. Then I’m going to need you to look me in the eye when you ask for that key.','The station clock is doing it again. Look at me until it stops.'],
 [`Pell|Who waters it when you’re gone?
 Curator|Rell. I used to check after him. The tree did better when I stopped.
 Narrator|The Curator wipes the blades and hands the shears to Rell handle first.`.replace(/^ +/gm,''),'Take the sheet when this ends. I’m afraid I’ll fold it up and put it away again.','Don’t pull on the stem. We can leave the damaged part and work around it.'],
 [`Maren|There’s still a mark on the inside of the bowl where he ladled too hard.
 Celebi|I didn’t know you could remember a sound from a mark.
 Maren|Sometimes it’s easier than remembering it from a person.`.replace(/^ +/gm,''),'If you hear me pause, don’t finish the sentence for me.','I can hear the tide coming in. The dock is still under us.'],
 [`Narrator|Someone leaves the voting room without putting down a slip. Ren moves aside.
 Aster|Do we count that as staying?
 Ren|We count it as someone who hasn’t told us yet.`.replace(/^ +/gm,''),'I thought I’d feel relieved when the vote was over. I’m still waiting.','I don’t like the way this feels either. I’m staying where you can see me.'],
 [`Farmer|When the trees stopped fruiting, I left a ladder against the best one. It took me a long time to bring it in.
 Pell|Did anybody come to help?
 Farmer|My daughter did. She never asked why it was still there.`.replace(/^ +/gm,''),'Keep your hand on that valve. There’s going to be a lot of pressure when it opens.','We still have the bypass. Think about what you can keep in play.'],
 [`Rell|I can see him moving. I can’t tell if he knows we see him.
 Pell|Tell him anyway.
 Rell|We can see you. You don’t have to move for us to keep looking.`.replace(/^ +/gm,''),'If you’re going to win this, do it where the worker can hear us.','One end of the rope is still tied off. We have something to work with.'],
 [`Engineer|I left the second handle painted yellow. People ask if it means danger.
 Pell|What do you tell them?
 Engineer|That it means somebody else needs to be there.`.replace(/^ +/gm,''),'The handle will be warm when you take it. I’ve been holding it longer than I meant to.','We still have a second handle. Don’t try to pull both by yourself.'],
 [`Meri|When they took me in, they asked if I needed a blanket. Nobody asked who I’d left holding my shopping.
 Nessa|Who was it?
 Meri|My neighbor. I hope she took the plums home before it rained.`.replace(/^ +/gm,''),'Tell Tomas who gave you the address. He can decide what to do with my name.','Meri’s right here. We have time to hear the end of what she was saying.'],
 [`Tomas|What happened to all my letters?
 Iona~sad|I didn’t get them. I thought you weren’t writing.
 Tomas|I wrote fewer after the first winter. I still need you to know I wrote those too.`.replace(/^ +/gm,''),'I’ll wait by the door while you ask them. I don’t know if anyone will want to talk to me.','Iona has the coat. Whatever happens at this table, she’ll be there when he gets up.'],
 [`Narrator|Rook holds the relay cover while Nessa looks inside. Neither of them asks the other to let go.
 Rook|It’s heavier than it looks.
 Nessa|I know. I’ve held it before.`.replace(/^ +/gm,''),'I’ll read the destinations. Tell me if I get a name wrong.','Listen to the rooms upstairs. Their lights are still on.'],
 [`Narrator|An arrival stands on the ramp, then steps back toward the shelter.
 Ren|Do you want us to hold your place?
 Narrator|They nod. No one touches the door.`.replace(/^ +/gm,''),'Look at the ramp. We’ve got room for one more, even if they need a minute.','Nobody’s closing the door because this turn went badly. Look again.'],
 [`Eda|I used to think a room was empty as soon as the person left.
 Curator~sad|And now?
 Eda|Now I ask if they’re coming back before I take their cup away.`.replace(/^ +/gm,''),'The last passenger is at the edge. Give them a moment.','I can still hear Pell. The fork hasn’t moved.'],
];

