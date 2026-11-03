const IlexEchoes=(()=>{
 const archive=LimitlessCollection;
 const formats={},decks={};
 const imported=(i,name)=>archive.decks.find(d=>d.format===archive.formats[i-1].id&&d.name===name);
 const source=(i)=>({...archive.formats[i-1]});
 const catalog=(year,base,name)=>{
   const variant=EchoesDeckVariants[year]?.[name];
   const found=variant||imported(base,name);
   if(!found)throw Error('Missing Echoes deck: '+year+' '+name);
   const id='echoes-'+year+'-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
   decks[id]={...found,id,name,year,format:formats[year].id};return id;
 };
 const L=(id,raw)=>raw.trim().split('\n').map((v,i)=>{const j=v.indexOf('|'), [speaker,emotion]=v.slice(0,j).split('~');return {id:id+'.'+(i+1),speaker,emotion,text:v.slice(j+1).trim()};});
 const data=[
 [2017,24,'The Village That Waited','Hearthwick','PRC–BUS','Gardevoir GX','Golisopod Garb','Iona','Pell',
 [['Iona','Golisopod Garb','A Letter Without a Date','I wrote that I was angry with him. Then I wrote that I wasn’t. Both letters are still in my pocket.','The road was already bringing me back to this door before the letters stopped.'],
  ['Orin','Espeon-GX / Garbodor','The Road Back','Every milepost puts the village another mile away. Then you’re back at the first one.','Look at the postmarks. Those two letters were stamped on the same night.']],
 [['Pell','Gardevoir GX','The Empty Place','I fix things so people will keep bringing them back. I don’t know what to do with something that stays gone.','That case on the handcart is marked for Interchange Nine.'],
  ['Orin','Espeon-GX / Garbodor','The Case in the Cart','I can let you look or I can keep my job. Give me a reason to choose.','The overnight log is in the lining. Don’t hand it back to me where they can see.']],
 ['Pell','Iona','Drampa Garb','The Overnight Log','The cart made the trip twice. Only one journey came back with a passenger count.','Someone has been moving people through the loop. Those marks tell us where.'],
 ['Sera','Gardevoir GX','A Name at the Crossing','I signed for each person I saw. When Tomas’s name vanished, my signature was still on the page.','Take the departure record. If anyone asks, tell them I finally read what I was signing.'],
 'GX attacks','You may use one GX attack per game. Garbodor’s Trashalanche counts Items in the opposing discard pile.',
 `Rowan|You mended the crossing. I was hoping the forest might give you a morning off.
 Celebi|Something is on the other side. It keeps knocking, then forgetting it knocked.
 Narrator|A village supper bell rings. Iona sets out a bowl at a chair no one takes.
 Iona~sad|Tomas hates cold soup. I always heat his again, in case tonight is the night I’m glad I bothered.
 Curator~calm|The handcart can bring another sack tomorrow. You needn’t spend the winter waiting by the road.
 Iona|Then tell me where the road goes.
 Curator|If I had an address you could safely use, you would have it.
 Celebi~worried|She asked where he is. Why does everybody answer a different question?`,
 `Narrator|The departure record shows a black wing across the rear carriage. In the margin: Interchange Nine.
 Iona~sad|If you find him, ask him what he wants. I’ve spent so long deciding what I’d say that I forgot he’ll have something to say too.
 Pell|I’ll go. I know what a machine sounds like when someone’s made it do a job it wasn’t built for.
 Celebi|I’ll hold the crossing. Tell me when you’re ready. I can wait.`],
 [2009,11,'The Station Between Departures','Interchange Nine','DP–Rising Rivals','Flygon / Machamp','CurseGar','Nessa','Vale',
 [['Nessa','CurseGar','The Passenger Ledger','My maps used to tell people how to go home. Now they tell them which windows they can still see home through.','Tomas left a note: “I didn’t change my mind.”']],
 [['Vale','Flygon / Machamp','The Amended Manifest','The amendment is in the same ink as the signature. You only see the scrape if you hold the page to a light.','He was marked voluntary after boarding. That is not when a person volunteers.']],
 ['Bramwell','Nessa','Flygon / Machamp','The Service Platform','You can talk to a porter or you can talk to the uniform. Only one of us remembers the boy.','The rear carriage had people in it. The engine did not.'],
 ['Rook','Palkia Lock','Permanent Placement','If I open that door on my own authority and the line fails, whose names go on the memorial?','The record is filed under Permanent Placement. You did not hear that from me.'],
 'Pokémon LV.X','Level up the matching Active Pokémon. A Pokémon LV.X keeps access to the attacks and powers of the card beneath it.',
 `Narrator|The station clock clicks. The minute hand doesn’t move.
 Nessa|The last time it moved, a train came in with its windows papered over. I’ve hated the sound ever since.
 Pell|How long have you been here?
 Nessa|Long enough to stop counting in days. I count in people who still come to the platform.`,
 `Narrator|Giratina’s shadow passes over the carriage. It bends around the passenger windows and tears into the engine.
 Celebi|It knew where they were.
 Pell|And someone printed that supply label before the train ever left. A greenhouse bought the fittings.
 Nessa|Take the service line. I’m staying until somebody opens these doors.`],
 [2014,19,'The Garden Behind Glass','The Glass Garden','NXD–FLF','VirGen','Aromatisse / Mega Kangaskhan','Sera','Pell',
 [['Freight Lead','Fairy Plasma Box','The Freight Bench','I loaded medicine. I never saw a receiving address.','Ask who signs for a person when the destination column is blank.']],
 [['Infirmary Keeper','VirGen','The Infirmary','People sleep here because it’s warm. Please don’t confuse that with them choosing to stay.','Tomas’s intake record is under the blankets. I was afraid they’d burn it.']],
 ['Foreman','Courier','Aromatisse / Mega Kangaskhan','The Cutting','They told me to keep a plant alive until its owner arrived. I’m starting to think they never meant her to.','The cutting came from a coastal refuge. Someone still sends water there.'],
 ['Rell','Yveltal Garb','No Receiving Address','I can give you the intake sheet or I can keep pretending I can’t read it.','The shelters are in the Distortion World. You’ll need to see one from before he started locking the doors.'],
 'Mega Evolution and Pokémon-EX','Mega Evolution ends your turn unless a card says otherwise. A knocked-out Pokémon-EX gives up two Prizes.',
 `Narrator|The Curator steadies a thin branch between two fingers before cutting.
 Curator~sad|The woman who planted this never saw it flower. She told me where to prune it in case she wasn’t there.
 Celebi|Did she tell you what to do when it grew too large for the pot?
 Curator|We didn’t get that far.
 Pell|I brought food for the road. It’s gone stale.
 Narrator|Pell throws away the bread. He folds the wrapping and puts it back in his coat.`,
 `Sera|There’s a name for every person they took in. There isn’t an address for a single one.
 Celebi|Then we start with the place where they used to ask.
 Narrator|An old greenhouse tag points to a coast where the gates once swung both ways.`],
 [2007,9,'Before the Gates','The Coastal Refuge','EX Deoxys–DP','Empoleon','Banette','Maren','Pell',
 [['Dock Steward','Banette','The Tide Bell','People used to come down at low tide just to watch the gate open.','The old bell still calls for arrivals and departures.']],
 [['Caretaker','Empoleon','The Bowl by the Stove','He warmed the soup himself. If you’re asking whether he was kind once, yes.','I remember him asking people if they wanted to go back.']],
 ['Relief Pilot','Resident','Empoleon','Against Advice','My name is in the report. My words aren’t.','They changed “cleared to return” to “departed against advice.”'],
 ['Maren','Flygon','What I Said That Morning','He asked if I regretted coming back. I told him I regretted what happened after. Those are different answers.','Write down what we wanted. Then write down that I was frightened. I need both to be true.'],
 'A mixed ex and Diamond & Pearl pool','Old Pokémon-ex and Pokémon LV.X can appear together. A Pokémon LV.X is not a Pokémon-ex just for being leveled up.',
 `Maren~sad|A wave took the south stair. There were people on it. Afterward I asked for a blanket and the Curator brought soup as well.
 Pell|You don’t have to make him easy for me to hate.
 Maren|Good. I still have the bowl.
 Celebi|Can we see the record from before the wave?
 Maren|Yes. Let me tell you what I remember first.`,
 `Maren|Aster wrote to ask whether she could keep the mountain gate open. I don’t know what answer she got.
 Celebi|We’ll ask her.
 Maren|When you see her, tell her the soup was good. I think she’ll know why I’m telling you that.`],
 [2021,30,'The Kingdom of Enough','The Mountain Shelter','TEU–CRE','Ice Rider / Inteleon','Shadow Rider Calyrex','Ren','Aster',
 [['Ren','Shadow Rider Calyrex','Boots by the Door','I keep boots by the door because somebody used to tell me I’d get to choose when I needed them.','Leda’s petition asks for a crossing survey. There are more names on it than mine.']],
 [['Archive Clerk','Ice Rider / Inteleon','The Uncounted Petition','I counted the votes against leaving first. I was hoping that would make the other pile smaller.','Leda never asked to close the shelter. She asked what lay outside it.']],
 ['Lieutenant','Examiner','Shadow Rider Calyrex','The Public Count','Everyone who stays should be able to say they stayed. Say it to me without looking at the captain.','The count stands. We can start the survey without taking anyone’s key away.'],
 ['Aster','Shadow Rider Calyrex','A Key for Every Door','I’ve watched people die outside shelter. I’m scared the second I open that gate I’ll spend the rest of my life counting bodies.','We’ll survey before we cross. I’ll stay on the rope with you.'],
 'Pokémon VMAX','A Pokémon VMAX gives up three Prizes. Make a plan for the single-Prize Pokémon that build or disrupt its board.',
 `Ren|I bought boots a size too big because I thought I’d grow into them before I left. I did. Then I wore out the heels indoors.
 Aster~sad|I kept you warm.
 Ren|You did. I can be grateful and still want to go.
 Celebi|Can we hear everyone before anyone tells us what the vote meant?`,
 `Aster|Leda’s sister lives below the river works. If there’s a route out, we owe her a chance to hear about it.
 Ren|I’m leaving the spare boots here. Somebody else will need them.
 Narrator|Aster moves them away from the wet wall and sets them where the next person will see them.`],
 [2005,7,'The River That Forgot Its Course','The Orchard Weir','Ruby & Sapphire–Emerald','Ludicolo / Magcargo','Queendom','Farmer','Pell',
 [['Farmer','Queendom','The Orchard Plan','I drew the bridge twice. The first time for wagons, the second time so my daughter could see where the water went.','The bypass on the drawing isn’t on the company map.']],
 [['Relief Worker','Ludicolo / Magcargo','Water at the Terrace','There are two taps. There’s enough pressure for one, and I was told which one to open.','The terrace houses don’t show up on the distribution sheet.']],
 ['Surveyor','Terrace Keeper','Queendom','Under the Footbridge','The initials under the plank are older than the gates.','That used to be the only place we wrote down who built things.'],
 ['Waterworks Supervisor','PowTar','Maintain Provision','I can be held responsible for a closed valve. I can’t be held responsible for a river.','There is a bypass. When you open it, write my name on the work order too.'],
 'Pokémon-ex and double Rainbow Energy','Pokémon-ex give up two Prizes. Double Rainbow Energy can help eligible evolved Pokémon, with restrictions and a damage penalty.',
 `Farmer|The river used to wet the roots of those three trees. My daughter asked if it could remember where it belonged.
 Pell~sad|Those are my initials on the bridge.
 Celebi|Do you remember putting them there?
 Pell|I remember which side of it I was on. We built a bypass because we knew this would happen.`,
 `Narrator|As the bypass opens, the dry ground makes a sound like a kettle coming off the heat.
 Farmer|Leda’s sister will hear it from her window. Let her listen before you go knocking.
 Pell|The wetland report names a guardian. Whoever wrote it knew what had happened upstream.`],
 [2016,21,'What the Guardian Guards','The Broken Docks','XY–Steam Siege','Greninja BREAK','Night March','Pell','Rell',
 [['Dock Pilot','Night March','The Broken Mooring','The guardian pulled on the pier until it snapped. I didn’t see what was on the other end.','There was a worker underneath. We only started counting when the beam fell.']],
 [['Workshop Keeper','Greninja BREAK','What Fell First','The bolts sheared in two different directions. It was holding the beam up.','Come down to the dock with me. I can show you where the marks are.']],
 ['Dock Steward','Security','VespiPlume','The Narrow Ledge','The order is to recover the old component before the tide.','I’ll hold the ladder. Send somebody light enough to reach him.'],
 ['Ansel','M Audino EX','Wait for the Worker','If we let the part go, I can’t promise we’ll get another chance.','He’s breathing. Put that in the report before you tell anybody what it cost.'],
 'Pokémon BREAK','A BREAK Evolution keeps the previous stage’s attacks and Abilities as well as its printed inherited stats.',
 `Narrator|A beam rolls toward the edge. Giratina catches it. A worker’s hand appears underneath.
 Pell|If I let go of my end, can you hold yours?
 Narrator|The ledge gives way. Giratina shifts its grip, leaving the old component where it falls.
 Rell~sad|I spent three years telling people it came to break things. Give me a hand with this ladder.`,
 `Pell|You can let go now. He’s clear.
 Narrator|Giratina waits until the worker’s weight is on the boards before it lowers the beam.
 Rell|I’m going back to the workshop. Somebody ought to change the diagram so it shows two ways to get a person out.`],
 [2008,10,'The Promise in the Machine','The Release Works','Holon Phantoms–Majestic Dawn','Empoleon Bronzong','Scizor Toxicroak','Engineer','Pell',
 [['Engineer','Scizor Toxicroak','The Release Fork','It has two handles because it takes two people, one on each side, to know it’s safe.','The fork isn’t broken. It was taken out.']],
 [['Stores Keeper','Empoleon Bronzong','The Empty Crate','The manifest says released, the crate says returned, and the shelf is empty.','The authorization came from the Curator. It’s his hand.']],
 ['Signal Keeper','Salvager','Blissey Control','Test the Landing','They tested the room when it was empty. I would have passed that test too.','Verified landing means a person on the other side actually says they can take you.'],
 ['Custodian','Gardevoir Gallade','Two Operators','People came here because the machine gave a promise. I kept it running when the promise changed.','Keep the release fork. You’ll have to find another person to take the other handle.'],
 'Pokémon Powers','Poké-Powers and Poké-Bodies are separate mechanics. Read the printed restrictions before assuming an effect will work while affected by a Special Condition.',
 `Celebi|We’ll get everyone home.
 Engineer|Where is home for the boy born in the shelter?
 Narrator|Celebi looks down at a half-packed crate.
 Celebi~sad|I don’t know where he wants to go. I know which crossing we can test. And I can help you pack.`,
 `Pell|Two operators. A release fork. A verified landing. All three are in the first drawing.
 Celebi|Nessa can check the other side. We should ask her before we turn anything on.
 Narrator|The last page is a route chart with one place still marked for voluntary arrival.`],
 [2012,16,'People Without Permission','The Survey House','HGSS–Dark Explorers','CMT','ZekEels','Nessa','Meri',
 [['Nessa','ZekEels','Ask the Passenger','Meri has a file here. Before you read it, go ask Meri whether she wants you to.','She’s in the waiting room. People keep walking past her to look for proof.']],
 [['Surveyor','CMT','Return Address','Half the chart is the road people took. The other half is where we thought they should go.','Meri can tell you which half her line belongs to.']],
 ['Relief Officer','Records Clerk','Mewtwo Darkrai','The Wooden Bird','I’ve been carrying this bird around for a week. Someone at the residence made it.','The register says Tomas. Nobody checked whether he wanted an assessment.'],
 ['Watch Captain','Mewtwo Darkrai','The Unsent Letter','I can’t open a residence on the strength of a wooden bird.','The residence isn’t far. If you ask for Tomas by name, ask him where he wants the answer sent.'],
 'First-turn attacks and Pokémon-EX','The first player can attack here. Pokémon Catcher uses its original effect, without the later coin-flip erratum.',
 `Meri|You can ask me. I was there.
 Curator|You said the crossing frightened you.
 Meri|It did. I was afraid of where you’d take me if I didn’t get on it, too.
 Nessa~angry|I wrote Rook a letter so I wouldn’t say it to his face. I’m beginning to think he needs to hear it both ways.`,
 `Curator|I remember the day you came in.
 Meri|Good. When you tell it again, remember I was standing right there.
 Celebi|We have a name and an address. This time, let’s knock.`],
 [2015,20,'The Names We Could Not Find','Assessment Residence','Boundaries Crossed–Roaring Skies','Archiestoise','Mega Manectric / Genesect','Iona','Tomas',
 [['Waterworks Keeper','Mega Manectric / Genesect','The Coat in the Hall','He keeps his coat on its hook even when he sleeps in it. He thinks it’ll make leaving quicker.','That door is Tomas’s. Wait until he answers.']],
 [['Dispatcher','Archiestoise','The Unclaimed Post','He asked if there was a way to write a letter that arrived before the person.','I have all his replies here. They were never sent.']],
 ['Escort','Technician','Mega Manectric / Genesect','The Orchard Allocations','They assigned orchard plots before any of the residents had said yes.','I’ll take the names off the requisitions. You’ll have to stop the seal.'],
 ['Administrator','Mega Manectric / Genesect','Permanent Seal','I have a roof for every name in my book. You can’t make a home out of a route on a map.','Take the key. There is a seal crew already at the next gate.'],
 'Post-ban Worlds','Lysandre’s Trump Card is banned. Battle Compressor, VS Seeker and the rest of the period’s discard strategies still work.',
 `Narrator|Tomas opens the door with one sleeve of his coat already on.
 Iona~sad|I thought you’d be taller.
 Tomas|I thought you’d be angrier.
 Iona|I was. It took a while to be anything else.
 Tomas|Can we talk about the coat for a while anyway?
 Iona|Yes. Hold still. There’s a thread coming loose.`,
 `Tomas|I want to go home with Iona. I’d like to come back one day and ask the others what they want.
 Celebi|We can ask. We can’t promise we’ll get the same answer from everyone.
 Narrator|The administrator’s key is cold. Down the hall someone has started turning the sign to NO MORE ARRIVALS.`],
 [2013,18,'No More Arrivals','The Last Departures Board','Black & White–Plasma Freeze','Blastoise Keldeo','TDK','Rook','Nessa',
 [['Seal Worker','TDK','The Second Signature','I signed for the seal and I signed for the shelter power. Nobody said they ran through the same switch.','I’ll sign a third time if it means someone actually reads it.']],
 [['Power Worker','Blastoise Keldeo','The Common Switch','The seal takes its power off the shelter line. Turn the wrong thing off and the rooms go dark.','There’s a separate relay behind the board. We can reach it together.']],
 ['Seal Crew','Shelter Guard','Darkrai Garb','Rooms on the Line','There are people on oxygen upstairs. If your plan counts only people crossing, it’s a bad plan.','Shelter power is isolated. You can release the gates one by one.'],
 ['Rook','TDK','The Last Departure','I’ve spent years asking whose name goes on a mistake. I know whose name goes on this one. Mine.','Put the destinations on the board. Leave the shelter listed as a destination too.'],
 'Team Plasma and ACE SPEC','Plasma support keys off Team Plasma cards. A deck can contain only one ACE SPEC. Plasma Blast is outside this format.',
 `Rook|I read your letter.
 Nessa|Did you read the part where I wanted you here?
 Rook|I kept reading the part where you didn’t trust me. It took longer to get to the rest.
 Pell|There are two switches. I need somebody who knows which one keeps the rooms warm.
 Rook|I do. Come with me.`,
 `Narrator|The board lights up one destination at a time. For the first time in years, the shelter has an arrivals column.
 Nessa|I can run this board. I can’t verify the hub alone.
 Celebi|Then we go together and tell them we’re coming before we cross.`],
 [2022,31,'Somewhere to Go','The Arrival Hub','Sword & Shield–Pokémon GO','Palkia VStar','Arceus / Flying Pikachu','Nessa','Ren',
 [['Arrival Escort','Arceus / Flying Pikachu','A Chair at the Hub','We have a room for people who don’t know where they’re going. It doesn’t have a clock.','We can receive the first crossing whenever your other operator calls.']],
 [['Hub Guide','Palkia VStar','A Room Without a Clock','The door opens both ways. We leave the handle on your side.','The crossing is clear. Tell the people at the other end what they’ll see.']],
 ['Platform Keeper','Dispatch Operator','Mew VMax','The First Crossing','Leave space beside the ramp. People need room to change their minds before they take a step.','The first arrivals are through. None of them had to surrender a key.'],
 ['Deputy','Palkia VStar','Hold the Opening','The archive is still locked. If you widen the breach to reach it, this platform could go with it.','There’s a gap the guardian left just for you. Follow it single file.'],
 'VSTAR Powers','You get one VSTAR Power per game. A Pokémon VSTAR gives up two Prizes, while a VMAX gives up three.',
 `Narrator|Dialga holds the platform level only where Giratina leaves an opening. One person steps through, then another.
 Iona|Tomas has the chair by the wall. He says he likes it there.
 Ren|Aster asked if I’d keep two chairs free. I think it’s her way of saying she might come.
 Celebi|We can keep them free. We can keep the door open, too.`,
 `Pell|The Curator locked the archive with himself inside.
 Narrator|A narrow slit opens in the far wall. Giratina leaves it no wider than a person’s shoulders.
 Celebi|I’ll go first. Call my name when you can see me.`],
 [2023,32,'An Unwritten Tomorrow','The Distortion Archive','Regulation E onward · through Paldea Evolved','Gardevoir ex','Turbo Lost Box','Eda','Pell',
 [['Archive Escort','Single Strike Lugia','The Rooms We Kept','Some of the people upstairs will choose to stay. Tell me what happens to their rooms.','I’ll tell them the shelter stays and the gate opens. They’ll want to hear both.']],
 [['Archive Escort','Single Strike Lugia','The Rooms We Kept','The Curator kept every letter. He thought that meant nothing in them could be lost.','You can take the letters when we’re done. Please leave the rooms standing.']],
 ['Curator','Curator','Mew VMax','The Last Inventory','I can tell you exactly when I stopped asking. I can’t tell you when I stopped thinking it was wrong.','Take the letters. Give Maren’s account back to Maren before you give it to anybody else.'],
 ['Giratina','LostTina','An Unwritten Tomorrow','Hold the crossing long enough for the last person to choose. The guardian will hold this side.','The gap holds. On the far side, the last waiting passenger takes their hand off the rail.'],
 'The Lost Zone and Pokémon ex','Cards in the Lost Zone do not go into the discard pile. Star Requiem needs ten cards in the Lost Zone and uses the one VSTAR Power.',
 `Eda|I used to put a cup outside each room so people could tell I hadn’t forgotten them. Some asked me to stop. Some asked for two.
 Pell|I should have asked what you needed when I was building the bridges.
 Eda|Ask now. We’re still here.
 Celebi~sad|I’m still here, too. Stop saying goodbye to me while I’m talking.
 Narrator|Pell puts his hand back on the release fork. Celebi takes the other end.`,
 `Narrator|The crossing steadies. Giratina lowers its head and waits for the last step to land.
 Curator~sad|I kept a list of everyone who left. What do I do with it now?
 Eda|Ask them what they’d like you to remember.
 Narrator|Later, in Ilex Forest, rain gets through the roof in the same place as ever.
 Tomas|I fixed the button on the coat. The wooden bird is on the chair so no one sits on it.
 Iona|We’ve got another chair.
 Maren|I remembered her name this morning. The woman with the tree. I can tell you if you’d like.
 Celebi|I’d like that. Let me put another cup out.
 Narrator|Outside, petals settle on the wet step. The gate stays open.`],
 ];
 // Each interlude follows a relationship that changes during this chapter.
 const interludes=[
 `Iona~tense|You can sit in his chair. People keep standing around it like it's a grave.
 Pell~worried|Last week you asked me to mend the loose leg.
 Iona~sad|I wanted it ready. That's different from needing it empty.
 Rowan~relieved|Then I'll sit. If he comes in, I'll get up.
 Iona~startled|You make that sound easy.
 Rowan~sad|I had to practice it. There was a time when I laid out a cup for somebody who wasn't coming back.
 Iona|When did you stop?
 Rowan|The day somebody came in wet and I realized the cup was clean.
 Celebi|Did you tell them whose cup it was?
 Rowan~happy|No. But I told them the story while they drank.
 Pell~worried|I used to think fixing a thing meant I could leave before anyone noticed I had been there.
 Iona|Stay until the soup is gone, then. Let me notice.`,
 `Nessa~tense|I used to announce delays by saying we appreciated everyone's patience. I don't think I ever asked for it.
 Vale|You were the only voice coming through the speaker.
 Nessa~sad|That made it worse. If I sounded calm, they took their coats off.
 Vale~worried|When my name disappeared from the board, I kept my ticket. I thought somebody would believe the paper before they believed me.
 Nessa|I would have believed you.
 Vale~angry|You didn't. You asked me to go to the back of the queue.
 Nessa~startled|That was you?
 Vale|I had my hat on. You were doing three people's work.
 Nessa~sad|I can remember the hat. I should have looked under it.
 Celebi|Would you tell us the story again, Vale? Start wherever you want.
 Vale~relieved|It starts with somebody lending me the hat. That part never made the report.
 Nessa|I'll leave room for it this time.`,
 `Sera~worried|I can tell which plants they moved by the circles the pots left behind.
 Pell|Can you tell who moved them?
 Sera~sad|Sometimes. I know my own handwriting. I wish I didn't recognize it quite so quickly.
 Curator|You were keeping the plants alive.
 Sera~angry|I also signed the transfer forms. You don't get to choose which part I remember.
 Pell|What would you put on the form now?
 Sera|Two names. The person who's leaving and the person who's willing to open the door when they arrive.
 Celebi|And if nobody's there?
 Sera~tense|Then we keep the door open and ask who can come. We don't put down an address and hope a person grows there.
 Curator~sad|There was a winter when hope was all I had to put down.
 Sera|Tell us about that winter. Tell us whose name you left out.
 Pell~relieved|I can wait while you decide where to begin.`,
 `Maren~sad|Everybody asks about the water. Nobody asks what we were doing before it came in.
 Pell|What were you doing?
 Maren~happy|Teaching my sister to mend a hem. She put the needle through her sleeve and asked me to cut her free.
 Celebi|Did you?
 Maren|I showed her how to pull the thread out. I still catch myself checking the sleeve.
 Curator~worried|I remember that coat. I thought if I gave you enough time you might want to leave it behind.
 Maren~angry|It was hers. You could have asked why I was wearing it.
 Curator~sad|I was afraid of the answer.
 Maren|So was I. I wore it anyway.
 Pell~tense|We can fix the latch. We can't give her back the afternoon.
 Maren~relieved|I know. Fix the latch and let me choose when I use it.
 Celebi|Tell me about the hem while we work.`,
 `Ren~worried|If I vote to leave, will you think I'm voting against you?
 Aster~startled|I didn't know you thought you needed to ask me that.
 Ren|I've been asking it every time I pick up my boots.
 Aster~sad|When I was your age, someone held a door open for me. I mistook the fact that they waited for the right to tell everyone else when to go.
 Ren~angry|You can worry about me. You can't call it a vote when you decide how mine counts.
 Aster|You're right. I wish I could make those two things feel different in my hands.
 Celebi|What are your hands doing now?
 Aster~tense|Holding the key too tight.
 Ren|Put it down. I'll show you where I keep mine.
 Aster~relieved|Next to the boots?
 Ren~happy|Inside one. It's how I make sure I have to think about where I'm going.
 Aster|When you do go, tell me where you want me to meet you.`,
 `Pell~sad|I used to draw the river with a straightedge. It made the work look like something we could finish.
 Farmer|It looked finished on paper. We still had to get the apples across.
 Pell|You asked me to build a footbridge and I drew a dam.
 Farmer~angry|You drew a dam because they were paying you to draw a dam. It would help if you said that part.
 Pell~tense|They were paying me to draw a dam. I took the money. I liked being asked.
 Celebi|What do you want to be asked now?
 Pell|Where to put my hands.
 Farmer~worried|Here, where the board is soft. Don't lean your whole weight on it.
 Pell~startled|You still want me on the bridge?
 Farmer|I want somebody on the other end of the board. That's an offer I can make today.
 Pell~relieved|I'll take today.
 Farmer|Good. Tomorrow we'll see which planks held.`,
 `Rell~tense|The tide takes everything that isn't tied down. That's what I was taught.
 Pell|Then why did you throw the worker an untied rope?
 Rell~startled|I didn't think. I saw his hand.
 Pell|That's what I saw, too.
 Rell~sad|I spent years saying that if everyone followed my drawings, nobody would need saving.
 Celebi|Did you draw the person who throws the rope?
 Rell|I didn't even draw the person who needed it.
 Pell~worried|That's the bit I get wrong. I draw the handle where I can reach it and assume everybody's the same height.
 Rell|Give me a pencil. Tell me where you stood.
 Pell~relieved|Next to you, although I didn't know what you were doing yet.
 Rell~happy|Draw that part. There should be room for two people getting it wrong and trying again.
 Celebi|And a hand in the water. So the next person knows where to look.`,
 `Engineer~worried|If the fork twists, my first instinct is to grab both handles.
 Pell|Mine too.
 Engineer|So if I reach for yours, say my name. Give me something to hear before you grab it back.
 Pell~tense|And if you can't hear me?
 Engineer|Then we stop. I put that instruction first because I know what people do when it's at the bottom of a page.
 Celebi~sad|I've been on the side of a crossing where no one was answering. I kept pushing because I thought there would be someone if I pushed hard enough.
 Engineer|Sometimes there is. Sometimes you crush the latch.
 Pell|We can test the call before we test the machine.
 Engineer~startled|Right now?
 Pell~relieved|Right now. You can do it badly the first time. I probably will.
 Celebi~happy|I'll listen for both of you.`,
 `Meri~angry|The surveyor asked why I kept correcting the date. Because I was there, and I remember which socks I had on.
 Nessa|I can put that in the record.
 Meri~worried|Can you put down that I get to change my mind about telling you?
 Nessa~sad|I used to think a record had to be permanent to protect someone.
 Meri|If it can't be changed, who protects me from the version you wrote?
 Celebi|We can leave you the pencil.
 Nessa~tense|And a blank page where you can answer the first page.
 Meri~startled|You're going to let people see that I disagreed with you?
 Nessa|I'll put my name on the part you disagreed with.
 Meri~relieved|The socks were green. That part you can write.
 Nessa~happy|Green. Do you want to tell me why you remember them?
 Meri|My neighbor knitted one longer than the other. I miss how sure she was that it was my feet.`,
 `Tomas~worried|If I come back, are you going to tell me what I was like before?
 Iona~startled|I thought you might want me to.
 Tomas|I might, sometimes. I don't want you to tell me when I disagree with you.
 Iona~sad|I've been rehearsing your half of the conversations for so long.
 Tomas|Was I any good?
 Iona~happy|You did a lot more apologizing than I expect you're going to do in person.
 Tomas~relieved|I can start with one. I left the good scissors in my coat.
 Iona|I found those. I left them there.
 Celebi|Do you want the letters right now?
 Tomas~tense|I want to hold them. I don't want everybody watching to see which one I open.
 Iona|I'll be in the hall. Come out when you're ready, even if they're all still closed.
 Tomas|Leave the door a little open. I'd like to hear you there.`,
 `Rook~sad|I changed the sign because I knew nobody could write their own answer while my answer was still up there.
 Nessa~angry|I wish you had known that when we needed you to.
 Rook|So do I. Can I help anyway?
 Nessa~tense|You can start with the names. Read them and let people correct you.
 Rook~worried|What if nobody answers?
 Nessa|Then ask again later. You'll have to live in the time between those two things.
 Celebi|I used to treat a delay as something I could run around.
 Rook|When you run around it, the people waiting think you left.
 Nessa~relieved|You're still standing here. That's a start.
 Rook|Will you stand here with me for the first name?
 Nessa|For the first one. You ask somebody else for the second.
 Rook~happy|All right. I think I know who to ask.`,
 `Ren~worried|I moved the spare chair away from the wall so nobody would think it belonged to the house.
 Nessa|How will Aster know it's for her?
 Ren|I'll tell her. If she wants a different chair, she can have it.
 Celebi~startled|I thought you had been saving that exact one.
 Ren~sad|I was. Then I remembered how it felt to see my own name written on a bed I hadn't agreed to sleep in.
 Nessa|You can want somebody to arrive and still leave them room to sit wherever they want.
 Ren~happy|I hope she picks the one by the window. There's something I want to show her.
 Nessa~tense|We've only verified one landing. If the light changes, you and I both stop.
 Ren|I can do that. I've waited longer for worse reasons.
 Celebi~relieved|I'll call when I can see the first step.
 Ren|Call again when you see the last. That's the one I want to remember.
 Nessa|Then we make sure there's somebody at both ends to hear it.`,
 `Eda~sad|There were people who asked me to keep their cups because they couldn't carry one more thing.
 Pell|Where are they now?
 Eda|Some are upstairs. Some are in a box I haven't opened since the roof started to leak.
 Curator~worried|I know which box. I moved it away from the water.
 Eda~startled|You could have told me.
 Curator|I liked being the one person who knew where things were.
 Eda~angry|Knowing where something is doesn't make it yours to give back.
 Curator~sad|Then come with me. I can carry the box while you ask.
 Celebi~tense|When the opening goes quiet, keep talking to each other. I'll be listening from the other side.
 Pell|I'll tell you something small. Something I can still see.
 Eda~relieved|Tell us the color of the cup you find first.
 Pell|Blue, if we're lucky. I think that's the one I'll be looking for.`
 ];
 // A route-specific conversation after the first match. The other route has its own witness and evidence.
 const firstDebriefs=[
 [
 `Iona~sad|There are two letters and only one of them says I was angry. Which one would you send?
 Celebi|What would you want him to know if he could read both?
 Iona|That being angry didn't make me stop listening for the latch.
 Celebi|Can you put that in a third letter?
 Iona~startled|I could. I thought I was only allowed to correct the first one.
 Iona~relieved|Keep them together. If we find him, he can open them in whichever order he likes.`,
 `Pell~tense|The case has a second hinge. Somebody wanted it to open from underneath.
 Celebi|Could Tomas have opened it?
 Pell|Maybe. I wouldn't put his name on a guess.
 Celebi|You put your name on everything you fix.
 Pell~sad|I used to. Then somebody came to me with a thing I'd signed that had hurt them. I remembered the job. I didn't remember them.
 Pell~relieved|This time let's write down who we need to ask before we write down what happened.`
 ],
 [
 `Nessa~worried|He underlined “didn't” twice. If he was trying to stay calm, his hand gave him away.
 Celebi|Did he leave it where you would find it?
 Nessa|He left it in the fold of the map. He knew I'd fix the crease if it tore.
 Celebi|He knew something about you.
 Nessa~sad|Yes. And I can't remember whether I thanked him for noticing.
 Nessa~tense|We'll take the map with us. Leave the fold as it is.`,
 `Vale~tense|Hold the page by the corner. The scrape is the evidence. Don't smooth it out.
 Celebi|You sound like you've had to say that before.
 Vale~sad|I used to repair books. People would pay extra if I could make it look like nobody had ever read them.
 Celebi|What did you think of that?
 Vale~happy|I liked the books with a recipe in the margin. I always left the recipe.
 Vale~worried|Keep the scrape. The person who made it might still be waiting to tell us why.`
 ],
 [
 `Sera~angry|A crate can have a missing address. A person can tell you where they want to go.
 Celebi|Did somebody teach the freight crew to ask?
 Sera|I taught them to ask for a number. It's the same counter. They can learn a different question.
 Celebi|Could you teach them today?
 Sera~worried|Some of them know what I used to sign.
 Sera~tense|All right. If they bring it up, I'll show them my signature before I ask to see theirs.`,
 `Pell~sad|The keeper hid the paper under a blanket. I hope nobody made them give up the blanket.
 Celebi|We can take it back after we copy the record.
 Pell|We could take a clean one. My mother used to put a warm towel under my feet when I was sick.
 Celebi~happy|Did that help?
 Pell|It helped me believe somebody would come back when the towel got cold.
 Pell~worried|Tell the keeper we'll bring it back ourselves. Give them a person to expect.`
 ],
 [
 `Maren~sad|The tide bell sounds wrong from this side of the gate. I used to think it was two different bells.
 Celebi|Which one did you hear the morning you left?
 Maren|Both. My sister was standing by the rail and I could hear the echo from where she stood.
 Celebi|Should we leave it here?
 Maren~worried|I want other people to have the sound. I just want a moment before we ring it again.
 Maren~relieved|Sit with me until the water turns. You'll hear the difference too.`,
 `Pell|He used to ask if people wanted to go back. What did he do when they said no?
 Celebi|The caretaker says he filled their bowls again.
 Pell~sad|I wish he still remembered how to take an answer like that.
 Celebi|Do you think he does remember?
 Pell~worried|I think he remembers how it felt to hand someone a warm bowl. We need him to remember whose hands were on the other side.
 Pell~tense|Let's ask the caretaker who sat by the stove. I'd rather use their names.`
 ],
 [
 `Ren~worried|People signed after me. I don't know whether I asked them or made them feel they had to.
 Celebi|What did you say when you handed over the pencil?
 Ren|I said to sign if they wanted the gate open.
 Celebi|The petition says survey. Do you want to tell them what you meant?
 Ren~sad|Yes. I'll have to give them a chance to cross their names out.
 Ren~relieved|Will you hold the page while I ask? Leave the pencil where they can reach it.`,
 `Aster~sad|I knew the clerk was counting that pile first. I never gave the order. I didn't have to.
 Celebi|Would it help if somebody else read the count aloud?
 Aster|It would help if they knew I would listen to both numbers.
 Celebi|Where do you want to stand?
 Aster~worried|In the back. I'm afraid they'll turn around to see my face.
 Aster~tense|If they do, I'll ask them to finish reading before I say anything.`
 ],
 [
 `Farmer~proud|See the little bend? She put it in because a wagon needed room to turn.
 Celebi|The line on the company map is straight.
 Farmer~angry|Then let the company turn a wagon on it.
 Celebi~happy|Could you show Pell the bend?
 Farmer~worried|He's seen it. I don't know if he remembers what it cost us to go around.
 Farmer|Come along. If he forgets, I've got a wagon.`,
 `Pell~tense|I can calculate how much pressure the second tap needs.
 Celebi|The relief worker says the houses aren't on the sheet.
 Pell~startled|Then what exactly have I been calculating?
 Celebi|How much water fits through a pipe. We still need to ask who needs it.
 Pell~sad|I used to like the part where the numbers came out even.
 Pell~relieved|Give me a clean sheet. This time I want to start at the door farthest uphill.`
 ],
 [
 `Pell~worried|The pilot saw a pier break. I'm trying to picture looking at that and not knowing whose hand was underneath.
 Celebi|Would you have counted the worker before the beam fell?
 Pell~sad|I'd have counted the beams. I hope I'd have heard someone calling.
 Celebi|Who do you want to hear from now?
 Pell~tense|The people who were under the pier, if they want to talk. Ask before I pull out my notebook.
 Pell~relieved|I can carry something while we wait.`,
 `Rell~tense|The break runs upward. That's what I've been trying to show people.
 Celebi|You can show me without explaining it all at once.
 Rell~worried|If I don't explain the whole thing, people hear the one piece that lets them blame whoever they already blamed.
 Celebi|Show me the mark you saw first.
 Rell~relieved|Here. Put your hand beside mine. The wood is smooth where something held it in place.
 Rell|Now look at the second mark. We can talk about what it means after you've seen both.`
 ],
 [
 `Engineer~angry|They put a brass plate over the opening. “Out of service.” Nothing was out of service. They wanted it out of reach.
 Celebi|Can we take the plate off?
 Engineer~worried|I want to. I want somebody else to read the instructions before I pick up the wrench.
 Celebi|I'll read. Tell me if you hear a word that's missing.
 Engineer~startled|Nobody's asked me to listen to my own instructions before.
 Engineer~relieved|Read the line where it says to stop. I want to know how it sounds in somebody else's voice.`,
 `Pell~sad|I knew it was his hand before the keeper said his name.
 Celebi|What gave it away?
 Pell|The way he drew the last letter. He always wanted there to be room underneath it for another signature.
 Celebi|Was there one?
 Pell~worried|No. That's the part I keep coming back to.
 Pell~tense|When we test the fork, leave the second line blank until somebody actually takes the other handle.`
 ],
 [
 `Nessa~worried|I've walked past the waiting room twice. Meri can probably hear my boots.
 Celebi|What are you waiting for?
 Nessa~sad|I want to have a useful answer before I walk in.
 Celebi|She might have a question you haven't thought of.
 Nessa~startled|I suppose that's a reason to knock.
 Nessa~relieved|I'll ask if she wants me to come in. If she says no, I'll stay close enough to hear if she calls.`,
 `Meri~tense|They'll tell you the dashed line is the safe way. Ask who got to draw a solid one.
 Celebi|Do you want to show me the way you took?
 Meri~worried|Not with everybody standing over me.
 Celebi|We can turn the chart around and sit on your side.
 Meri~relieved|That's better. Put your finger here. I crossed at the bend because there was a light on.
 Meri~sad|I used to think I was going toward someone. I want the map to remember that, too.`
 ],
 [
 `Iona~worried|I know the knock I used when we shared a room. Is it fair to use it now?
 Celebi|You can ask him afterward whether he wants you to use it again.
 Iona~sad|I keep thinking there's one right thing to do and I'll miss my chance.
 Celebi|He'll get to do a second thing, too.
 Iona~relieved|All right. I'll knock once. If he asks who's there, I'll say my name.
 Iona|Would you wait down the hall until I call? I'd like him to see one face first.`,
 `Tomas~tense|Please don't sort the replies by date yet.
 Celebi|How would you like to carry them?
 Tomas|The loose ones on top. Those are the ones I meant to send without thinking about it.
 Celebi|There's a piece of string in the drawer.
 Tomas~startled|I thought you'd ask what I wrote.
 Tomas~relieved|String would be good. I'd like to decide what to read when I'm somewhere I can put the rest down.`
 ],
 [
 `Rook~sad|Two signatures. I signed the second one with the same pen and still didn't ask what I was agreeing to.
 Celebi|What would you ask if they put the form in front of you now?
 Rook|Who will still have a light when I pull this?
 Celebi|Can we ask someone in those rooms?
 Rook~worried|Yes. I should go myself. Some of them will remember me.
 Rook~tense|I'll tell them what I signed before I ask what they need from me.`,
 `Nessa~tense|The relay is close enough for one person to touch and too far for one person to see both sides.
 Celebi|Where do you want me?
 Nessa|Where you can see the shelter light. Say what you see, even if it isn't what I expect.
 Celebi~worried|What if I call and you don't answer?
 Nessa|Then leave it alone and come find me.
 Nessa~relieved|I've written that on the cover. If somebody finds the relay after us, I want them to know they can walk away from the switch.`
 ],
 [
 `Nessa~worried|They gave me the arrival time. I asked when the first person would be ready.
 Celebi|What did they say?
 Nessa~happy|“We'll ask.” It took me a minute to recognize that as an answer.
 Celebi|What will you do in the meantime?
 Nessa|Put water in the room without a clock. It ought to have something in it besides a place to wait.
 Nessa~relieved|If somebody asks when the crossing opens, tell them who they can talk to.`,
 `Ren~startled|The handle moves from this side without anybody turning a key.
 Celebi|Do you want to try the other side?
 Ren~worried|I do. I also want to come straight back so I know I can.
 Celebi|I'll wait right here.
 Ren~relieved|When I come back, could you ask what I saw? I want that to be the first question.
 Ren~happy|And then I'll ask if you want to go. I get to be the one who waits next.`
 ],
 [
 `Eda~worried|The escort asked about the rooms. Did you hear how long it took them to say upstairs?
 Celebi|Do you want to go with them?
 Eda|I want to tell them that keeping the room means keeping the door. Both sides of it.
 Celebi|And if they want the old key?
 Eda~relieved|I'll bring it. They don't have to use it today.
 Eda|I kept the spare under a cup. I thought I was hiding it. I think everybody knew.`,
 `Pell~tense|The letters are dry. He must have moved them every time the roof changed.
 Celebi|How many times do you think that was?
 Pell~sad|Enough that I can imagine him sitting here with a towel and a stack of paper and nobody to ask why he was doing it.
 Celebi|We can ask him now.
 Pell~worried|I'm afraid I'll sound like I'm letting him off.
 Pell~relieved|I can ask why he kept them and still ask why he never sent them. I want to hear both answers.`
 ]
 ];
 // Short reactions for live play. Each row follows the chapter's immediate stakes.
 const battleVoices=[
  ["Leave the letters folded. We can still carry them home.", "You caught the opening. The road can turn twice and still let us through.", "Take your time getting up. Iona left the kettle on.", "The next knock is ours to make.", "I saw you look at the empty chair. Sit down a moment."],
  ["Forget the timetable. Listen for the person on the platform.", "There it is. A gap between two departures. Take it.", "Keep the ticket. We can ask at a different window.", "I can see who is on the platform now.", "We can wait for another train together."],
  ["Mind the bench beside the glass. Someone was here before we were.", "That gives us a little room. Don't put another pot in it yet.", "We still know which blanket covered the record.", "Leave the door open. I want to hear the keeper answer.", "Put the paper somewhere dry before we try again."],
  ["Let the bell finish ringing. We've still got time before the tide.", "You heard the echo too. There's someone on the far side.", "The tide goes out again. Sit where you can hear it turn.", "Ask Maren which words she wants on the page.", "We can stop here without taking the gate away."],
  ["Nobody here has to hand over their key because a match is going badly.", "There's the opening. We can survey it without crossing yet.", "Take your boots off if you want. They'll be here when you're ready.", "Leave the ballots out where people can count them.", "We still owe the people who voted to stay a warm room."],
  ["There is still water on the other side of that valve. Keep your footing.", "You found the bend. Now give the water room to turn.", "Step off the soft plank. I'll take this end.", "Let them hear the tap before we ask them to sign.", "Put the drawing down. Show me where the water actually went."],
  ["Keep looking at the worker. A dropped rope can be thrown again.", "You saw the hand before the beam moved. I saw it too.", "The ladder's still here. Let me check the rung that slipped.", "He's breathing. I want to hear him say his own name.", "The part can wait. We can try the rope from farther up."],
  ["Let go if you need to. The fork was built to stop when one side lets go.", "I heard your call. Both handles are still in reach.", "We can check the landing again before we touch the handle.", "Write down who answered before you write down that it worked.", "I heard you say stop. That's the part of the test we got right."],
  ["Leave the pencil on Meri's side of the chart. She can still correct us.", "Good. We made enough space for her to finish the sentence.", "Ask if she wants us to stay. The file can wait.", "Put her name on the answer she gave us.", "We have the wrong page open. We can turn it back."],
  ["The letters are tied. You don't have to keep a hand on them through every turn.", "There. Tomas has a little more room to reach the door.", "Put the letters somewhere you can reach again. I'll wait in the hall.", "Give him the string and let him choose which letter goes on top.", "I can still hear him through the door. We haven't lost him."],
  ["Keep an eye on the shelter light. One switch is still ours to leave alone.", "I saw the light hold. Call it out so they can hear you.", "Stay on this side of the relay until someone answers.", "Read the names slowly. There is time for them to answer now.", "The rooms still have power. We can ask for another pair of hands."],
  ["There is a chair at the other end. Take the time you need to get to it.", "You found the first step. Look back and call before you take the next.", "Come back to this side. We can verify the landing again.", "Leave the room without a clock open a little longer.", "Nobody needs to give up their place because we had to stop."],
  ["Listen for Pell. If his voice is still there, the crossing can wait.", "I heard him answer. Take the next turn with me.", "Put your hand back on the rail. We can find each other from here.", "I can hear feet on the boards. Keep the opening steady.", "The fork is still down. Tell me what you can see, however small"],
 ];
 const finalDebriefs=[
 `Sera~sad|When I signed this, I thought the next person would ask him where he wanted to go.
 Celebi|Who was the next person?
 Sera|There wasn't one. My signature carried him all the way through.
 Iona~angry|I've been trying to picture somebody saying his name at each door.
 Sera|I can tell you who opened them. I'll start with mine.
 Iona~tense|Write it down before either of us has to leave.
 Sera|Will you read it back? I want to hear where I start making excuses.
 Iona~relieved|I'll read it. After that I need you to help me get this page to the station.`,
 `Rook~worried|They'll notice a missing page sooner than a missing person.
 Nessa~angry|Then leave a copy and let them notice who took the original.
 Rook|You want me to sign for it?
 Nessa|I want whoever comes after us to know who they can ask.
 Rook~tense|What if they ask why I waited?
 Nessa~sad|Tell them why. Then tell them how much time it cost.
 Celebi|I can carry the original flat if someone finds me a board.
 Rook~relieved|Take my clipboard. I can write my name against the wall.`,
 `Rell~sad|I watered the cutting on Sundays. The person it belonged to used to come in on Mondays.
 Celebi|When did they stop?
 Rell|The week I started getting instructions through the slot in the door.
 Sera~worried|What did you do with the water after that?
 Rell|I kept using it. I needed one thing to look the way it did before.
 Sera~relieved|Show me which pot. I can water it while you make the trip to the refuge.
 Rell~startled|You think I should go?
 Sera|I think you should get to ask whose doorstep it belongs on.`,
 `Maren~tense|Read the last sentence again.
 Celebi|“I wanted to go home and I was frightened.”
 Maren~sad|Can you put a full stop after home?
 Pell|Do you want to move the second part down a line?
 Maren|Yes. I spent years listening to people make one sentence cancel the other.
 Celebi~relieved|There. Both sentences can stand on their own.
 Maren~happy|My sister used to mark my letters that way. She said I should give the reader somewhere to breathe.
 Pell|I'll make a copy with the same space in it.`,
 `Aster~worried|How many people do you think will take the rope?
 Ren|Ask tomorrow. Some of them will want to watch you use it first.
 Aster|Do you want to go first?
 Ren~startled|I want to go second. I hadn't realized I could say that.
 Celebi|Who would you want at the other end?
 Ren~relieved|You, if you can tell me when you've had enough.
 Aster~sad|I can learn to say that.
 Ren|Let's practice while the gate's still shut. It'll be easier to hear each other.`,
 `Farmer~worried|The water's running. Leave the tap open till it loses the taste of the pipe.
 Pell|Do you want a bucket for what comes out first?
 Farmer~happy|The weeds won't mind it.
 Celebi|The work order has room for a second name.
 Pell~tense|Put mine on it. The first drawing was mine too.
 Farmer|Fine. You'll be easy to find if the terrace goes dry again.
 Pell~relieved|I'll be at the footbridge in the mornings.
 Farmer|Bring a cup. I want to know what it tastes like to you next week.`,
 `Ansel~tense|He wants to sit up. I'm going to ask him to wait until the shaking stops.
 Rell~worried|Is he shaking?
 Ansel|I am. I don't trust my hands on the ladder yet.
 Pell|Give me the rope. You can keep talking to him.
 Ansel~relieved|All right. He says his name is Dan.
 Rell|I'll put that on the report. Is there anything he wants left off?
 Ansel~startled|Wait. I'll ask him.
 Celebi|I'll hold the page until you've heard his answer.`,
 `Custodian~sad|When the machine stopped asking for two operators, I slept better.
 Engineer|You could go home on time.
 Custodian|Yes. I didn't have to hear someone hesitate before the door opened.
 Pell~tense|We need you to tell us what that hesitation sounded like.
 Custodian|Usually it sounded like a person clearing their throat.
 Celebi~worried|What should we do if we hear that?
 Engineer~relieved|Ask if they want another minute. Leave the handles where they are.
 Custodian|I can stay and teach the next shift how to wait for the answer.`,
 `Meri~tense|You left a blank page in the file.
 Nessa|It's yours. You can write on it or keep it blank.
 Meri~worried|Someone will assume I forgot.
 Nessa|Would you like me to mark it as left blank by request?
 Meri~relieved|Write that on the cover. I want the page to look like mine.
 Celebi|Do you want the pencil back?
 Meri~happy|Keep it till the next person asks. It writes badly if you don't sharpen it.
 Nessa|I'll sharpen it in front of them so they can see where it went.`,
 `Tomas~worried|I left a cup by the bed. Somebody will look at it and think I'm coming back tonight.
 Iona|Do you want me to go and tell them?
 Tomas|I want to tell them in the morning. Can I do that from home?
 Celebi|We can ask the keeper to bring a message when the crossing is open.
 Tomas~relieved|Tell the keeper I want to write it myself.
 Iona~happy|I have paper in my pocket. It smells like the kitchen cupboard.
 Tomas~startled|The one with the cinnamon in it?
 Iona|Yes. I'll let you be the first one to open it.`,
 `Rook~tense|The shelter light stayed on through the whole release.
 Nessa|Someone put a hand up in the window. Did you see it?
 Rook~worried|I thought they were telling me to stop.
 Nessa|They were asking whether you could see them.
 Rook~relieved|I'll go back and say I did.
 Celebi|You can ask whether they need anything before you come back.
 Rook~happy|I know the stairs without the sign now.
 Nessa|Take the long way round. There's another window on the landing.`,
 `Ren~worried|I see Aster on the other side. She hasn't moved toward the gate yet.
 Nessa|Does she know you can see her?
 Ren|I'll wave. If she waves back, I can leave it there for today.
 Celebi~startled|She's holding something up.
 Ren~happy|The key. She found it in the boot I left her.
 Nessa|Do you want me to tell her which room is ready?
 Ren~relieved|Tell her where I'll be if she wants to look for me.
 Celebi|By the window. I'll tell her there's more than one chair.`,
 `Pell~tense|I can see the far rail again. I don't know whose hand that is.
 Eda|Ask if they want you to take it.
 Pell|Can you hear me over there? I'm close enough to reach you if you want.
 Narrator|The hand turns palm up and waits.
 Celebi~relieved|They have your wrist now. Let them tell you when to pull.
 Pell|I thought I was going to spend the rest of my life listening for your voice in the dark.
 Celebi|You can listen for it in the kitchen tomorrow. I know what the kettle sounds like now.
 Eda~happy|Then somebody should bring the blue cup downstairs.`
 ];
 // Conversations prompted by the second match, before the chapter's final evidence is known.
 const middleDebriefs=[
 `Celebi~worried|When the road sends us back, do the people inside know how long we were gone?
 Companion~sad|I don't know. I once put bread on the windowsill to cool and found it hot when I came back.
 Celebi|Did you try it again?
 Companion|With a stone first. Then with a note asking whoever found it to say what time it was.
 Celebi~startled|Did anyone answer?
 Companion~tense|It came back in my handwriting. I don't remember writing it. Let's ask the person who kept the cart log if they ever found a note like that.
 Celebi~relieved|We'll ask what they saw before we show them what you wrote.`,
 `Celebi|You paused when the porter mentioned the rear carriage.
 Companion~sad|Because I know the sound of that door from the inside. You have to lift it before you can slide it.
 Celebi~worried|Did someone help you get it open?
 Companion|A woman lent me her belt to pull on the handle. I still have it. She got off before I did.
 Celebi|Do you know her name?
 Companion~tense|No. Ask whoever has the placement list if we can see more than Tomas's entry.
 Celebi~relieved|We can make room for two searches.`,
 `Celebi~worried|The cutting is starting to lean. Should I tie it to the stake?
 Companion|Turn the pot first. See what it does when the light is on the other side.
 Celebi~startled|You sound like you used to work here.
 Companion~sad|I used to stop by after closing. The people on the night shift ate dinner in the warmest aisle.
 Celebi|Did they have a name for it?
 Companion~happy|The dining room. They kept asking for a table until somebody brought in a door on two crates.
 Celebi~tense|Let's leave the pot by the light. We can ask who used to sit at the table.`,
 `Celebi|Who keeps the old report after somebody changes it?
 Companion~sad|The person who was there, if they had time to make a copy. Everybody else gets the clean version.
 Celebi~worried|What did the clean version leave out this time?
 Companion|The pilot waited for two passengers to change their minds. By the time the report went in, it only said the pilot left late.
 Celebi~angry|Then ask the pilot about the two people.
 Companion~tense|I'll ask who they were. The last thing they need is for me to decide what they were thinking.
 Celebi~relieved|I can keep the page steady while you write.`,
 `Celebi|There are boots lined up outside the counting room.
 Companion~worried|One pair is mine. I left it there because I could hear people listening for my footsteps.
 Celebi|Do you want me to bring them in?
 Companion~tense|Leave them. I can walk in without announcing whether I mean to stay.
 Celebi~startled|Won't the floor be cold?
 Companion~happy|Yes. It'll give me a reason to finish counting before I start talking.
 Celebi~relieved|I'll keep a place beside me if you want to sit down afterward.`,
 `Celebi~worried|Why are the initials on the underside?
 Companion|That was the face of the board when we were fitting it. Somebody turned it over before we put the nails in.
 Celebi|Do you want to turn it back?
 Companion~sad|I want to see if the person who put their name next to mine still comes down here.
 Celebi|What would you ask them?
 Companion~tense|Whether I got the height right. We used to argue about it. I would like to hear what they think now.
 Celebi~relieved|I'll wait upstream. If they come, they should see you first.`,
 `Celebi~tense|The ladder fits if I turn sideways.
 Companion~worried|Tell me when you reach the bent rung. I want to hear your voice before I shift my grip.
 Celebi|Do you always count from the top?
 Companion~sad|I used to. Then someone on the bottom couldn't tell which rung I was talking about.
 Celebi~startled|I can see the bend now. It's level with my shoulder.
 Companion~relieved|Good. I'll remember your shoulder. That'll tell me where you are even if the ladder moves.
 Celebi|I'm going down one more. Stay where I can hear you.`,
 `Celebi~worried|Who said the landing was verified when the room was empty?
 Companion|The lamp said so. Somebody put a jumper across the contacts so they could test the bulb.
 Celebi~startled|And they left it there?
 Companion~sad|It was easier than getting somebody to come down on a Sunday.
 Celebi|Where did you stand when you found it?
 Companion~tense|On the side that could see the lamp. I never walked around to see what it was connected to.
 Celebi~relieved|I'll go around with you now. Call before you touch anything.`,
 `Celebi|The bird only has one eye painted.
 Companion~sad|The other side was against the wall when I found it. I turned it over and thought someone had forgotten.
 Celebi|Do you think they meant to leave it that way?
 Companion~worried|I'd like to ask who made it before I fill in the spot.
 Celebi~relieved|Take it as it is. If we meet Tomas, he'll recognize his own work.
 Companion|I want to know what wood he used. It feels lighter than it looks.
 Celebi~happy|Ask him that first, if he wants to talk about the bird.`,
 `Celebi~worried|The plot numbers are crossed out. The names are still readable.
 Companion|Leave them readable. I want to show people what was put next to their names before anyone asked them.
 Celebi|Did you have a number?
 Companion~sad|I knew where the orchard was from the marks on my coat. They gave us a different color for each road.
 Celebi~angry|Did anybody explain what the color meant?
 Companion~tense|Somebody did, later. I'd already put the coat on.
 Celebi~relieved|You get to decide whether you keep wearing it. We can go look at the gate when you're ready.`,
 `Celebi~tense|I can hear the relay buzzing over the fan upstairs.
 Companion|If the fan stops, put your hand up. I'll be watching the window.
 Celebi~worried|What if somebody sees us from the other side and thinks we're telling them to leave?
 Companion~sad|Then we'll have to go upstairs and tell them what the signal meant. I used to call that a waste of time.
 Celebi|What would you call it now?
 Companion~relieved|Part of the work. Put it on the card where the next shift can see it.
 Celebi|I'll draw the window too.`,
 `Celebi~startled|Someone came back down the ramp. Did the landing move?
 Companion|No. She wanted to tell the person behind her what she saw.
 Celebi~relieved|I thought I was supposed to wave her forward.
 Companion~worried|I did too. I had my hand in the air before she turned around.
 Celebi|What should we do with the rope?
 Companion~tense|Keep it slack. If somebody reaches for it, ask which way they're going.
 Celebi~happy|She brought someone with her this time. I'll move the chair so they can both sit.`,
 `Curator~sad|The first letter I kept was from a man asking his brother to send socks.
 Celebi|Did you think his brother couldn't send them?
 Curator|I thought the man would stop asking if I found him a pair myself.
 Companion~angry|Did he?
 Curator|He wore the socks. He kept asking if there was any mail.
 Celebi~worried|What would you do with the letter today?
 Curator~tense|Put it where he can take it. Then ask if he wants me to find his brother.
 Companion~relieved|Bring the box. You can start by asking who wants to hold it.`
 ];
 const chapters=data.map(([displayYear,base,title,location,range,a,b,friendA,friendB,left,right,mid,boss,topic,rule,intro,outro],n)=>{
  const year=String(n+1),id='echoes-'+year;
  const f=formats[year]={...source(base),...EchoesFormatOverrides[year],id:id+'-format'};
  const sceneNotes=EchoesSceneNotes[n];
  const [danger,comeback,setback,celebration,loss]=battleVoices[n];
  const path=(side,friend,player,entry,other)=>{
   const playerDeck=catalog(year,base,player);
   const mission=(row,i,music='battle')=>{
    const [opponent,deck,title,request,reply]=row,m=id+'-'+side+'-'+(i+1), line=(key,speaker,text,emotion)=>({id:m+'.'+key,speaker,text,emotion});
    const opponentDeck=catalog(year,base,deck),signature=EchoesSignatures[deck],signatureCue='signatureBoss';
    const attackers=deckId=>Object.keys(decks[deckId].cards).slice(0,5).map(k=>cardMetadata[k]?.name).filter(Boolean);
    const special=year==='13'&&i===3;
    return {id:'mission-'+(i+1),opponent,deck:opponentDeck,title,music,tip:i===3?'Check the opponent’s attackers and plan how you will take your last two Prizes.':'Build a second attacker before committing resources to your first.',
     before:L(m+'.before',special?`Narrator|The Curator’s archive buckles. Giratina plants both feet at the edge of the breach.
Pell~tense|The landing is verified. Keep the fork down until I say clear.
Celebi~worried|It isn’t asking us to leave. Look at what it’s holding up.
Narrator|Giratina turns from the opening. The battle will buy the people in the hall time to make up their own minds.`:opponent+'|'+request+'\n'+friend+'|'+(i===0?'I’ll stay with you. When we’re done, I want to hear the whole answer.':'We’ve come this far. Let’s leave enough room for their answer.')+'\nCelebi|'+(i===3?'Whatever you decide after this, tell us yourself.':'I’m listening.')),
     after:[...L(m+'.after',(special?'Narrator':opponent)+'|'+reply+'\nCelebi|'+(i===3?'We’ll carry that forward. Tell me if there’s a part I heard wrong.':'Let’s remember those words the way they said them.')),...(i===0?L(m+'.debrief',firstDebriefs[n][side==='a'?0:1]):[]),...(i===1?L(m+'.middle-debrief',middleDebriefs[n].replaceAll('Companion',friend)):[]),...(i===3?L(m+'.last-debrief',finalDebriefs[n]):[])],
     battleDialogue:{opening:line('opening',opponent,request,'tense'),playerOne:line('one',opponent,i===3?sceneNotes[1]:'One Prize left. Show me what you came here to do.'),opponentOne:line('opp-one',opponent,'One more. I can still finish this.','tense'),playerKeyKO:line('player-ko',opponent,'I saw how much you put into that attacker.'),opponentKeyKO:line('opp-ko',opponent,'I thought that would hold.','startled'),victory:line('won','Celebi',special?'The gap’s still open. I can hear the last person’s feet on the boards.':reply),defeat:line('lost','Celebi','I’m still here. Take a moment before we try again.')},
     partyDialogue:{partyDefeat:line('party-lost',friend,loss,'sad'),partyBehind:line('behind','Celebi',sceneNotes[2]),partySetback:line('setback',friend,setback,'worried'),partyDanger:line('danger',friend,danger,'tense'),partyComeback:line('back',friend,comeback,'relieved'),partyVictory:line('party-won',friend,celebration,'happy')},
     get battleTriggers(){return [
      {event:'knockout',player:1,pokemon:attackers(playerDeck),cue:'playerKeyKO'},
      {event:'knockout',player:2,pokemon:attackers(opponentDeck),cue:'opponentKeyKO'},
      ...(signature?[{event:'attack',player:2,attack:signature,cue:signatureCue}]:[])
     ];},
     ...(signature?{signatureExchanges:{[signatureCue]:{lines:special?[line('sig-1','Narrator','Star Requiem. For a breath, there is no sound from either side of the door.'),line('sig-2','Celebi','Pell? Say something.'),line('sig-3','Pell','I’m still on the handle. The floor is still here. So are you.')]:[line('sig-1',opponent,EchoesBossRemarks[deck]||'I can hold this position.'),line('sig-2','Celebi','I felt the crossing move.'),line('sig-3',friend,sceneNotes[2],'tense'),line('sig-4',opponent,request,'worried')]}}}:{}),
    };
   };
   const middle=[mid[side==='a'?0:1],...mid.slice(2)];
   const obstacle=EchoesExtraMissions[year]||['Checkpoint Officer',other,'The Next Door','I was told to hold this door until somebody could show me where it went.','All right. Show the next person the record you showed me.'];
   const rows=year==='13'?[entry[0],middle,obstacle,boss]:[entry[0],entry[1]||middle,entry[1]?middle:obstacle,boss];
   return {id:side,name:side==='a'?'Follow the witnesses':'Follow the records',companion:friend,description:side==='a'?'Hear what happened from the people who were there.':'Read what was recorded and ask who had the right to change it.',deck:playerDeck,missions:rows.map((row,i)=>mission(row,i,i===3?(year==='13'?'final-boss':'boss'):year==='13'&&i===1?'curator-boss':'battle'))};
  };
  const [keepsake,reflection]=[
   ['Tomas’s envelope','Two letters, stamped the same night. Both were written to a brother.'],['The amended manifest','The scrape in the paper is where a person’s answer used to be.'],['A greenhouse tag','Someone kept a cutting alive long enough for it to outgrow its pot.'],['Maren’s account','The soup was good. She was afraid. She wanted to go home.'],['Leda’s petition','Some names signed to leave. Some signed to stay. Each signature needed its own line.'],['The bridge drawing','Pell marked the bypass in pencil. His daughter would have seen the water from here.'],['A coil of dock rope','The worker came first. You can still feel where the rope carried his weight.'],['The release fork','Two handles. You can’t tell whether a landing is safe from only one side.'],['The wooden bird','Someone carved this while waiting. It took longer to learn where to send it.'],['A coat button','Tomas said he could sew it on himself. Iona held the thread.'],['The destination board','The shelter stayed on the list, even after people could leave.'],['The spare chair','Aster asked for two seats. Nobody wrote down when she had to use them.'],['An extra cup','The rain still comes through the roof. The gate stays open.']
  ][n];
  return {id,title,year,displayYear,location,format:f.name,range,travel:location,keepsake,reflection,backdrop:[1,30,8,15,19,5,12,32,7,29,31,35,39][n],
   lesson:{heading:'Before you take your seat in '+location+'.',cards:[[topic,rule]],tip:'Open either loaner deck to see its list before you choose.'},
   intro:L(id+'.intro',intro.replace(/^ +/gm,'').trim()+'\n'+sceneNotes[0]),outro:[...(n===12?L(id+'.interlude',interludes[n]):[]),...L(id+'.outro',outro.replace(/^ +/gm,'')),...(n===12?[]:L(id+'.interlude',interludes[n]))],paths:[path('a',friendA,a,left,b),path('b',friendB,b,right,a)]};
 });
 return {content:{version:2,campaignId:'echoes-of-tomorrow',dialogueRevision:2,sceneAnchorsByRevision:{1:Object.fromEntries(chapters.flatMap(ch=>[[ch.id+'/intro',ch.intro.map(line=>line.id)],[ch.id+'/outro',ch.outro.filter(line=>line.id.startsWith(ch.id+'.outro.')).map(line=>line.id)],...ch.paths.flatMap(route=>route.missions.flatMap(m=>[['brief','before'],['after','after']].map(([phase,key])=>[ch.id+'/'+route.id+'/'+m.id+'/'+phase,m[key].map(line=>line.id)])))]))},title:'Echoes of Tomorrow',chapters,legacySceneIds:{},credits:['Echoes of Tomorrow','An ILEX.GG story','Original campaign soundtrack'],},decks:{formats,decks}};
})();

