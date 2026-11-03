// Longer lines: memory-shard flashbacks and multi-beat conversations.

export const SHARDS = {
  1: '*Wednesday. Your office, the Tenderloin, a fan pushing hot air from one side of the room to the other. Mrs. Eleanor Whitcombe sits very straight and slides a photograph across your desk with one gloved finger. "Rosalind calls herself Rain now," she says, as if confessing to a disease in the family. "Find her, Mr. Tolliver. And please. Don\'t tell her I sent you." You take the case. You take the retainer. You tuck your licence in your hatband, where it\'s been since the Department and you parted ways over an envelope you wouldn\'t take.*',
  2: '*Thursday morning. You find Rain where Moondog said you would: ladling soup at the Lotus Foundation, wearing a smile that doesn\'t reach her eyes. She doesn\'t want to go home. She wants to talk, fast and low, in the garden, about crates in the basement and a doctor who takes notes on how the kids react to his "sacraments." "He sends the bad ones to the free clinic," she says. "So nobody counts them in one place." She grips your sleeve. "Frank. It\'s not just him. There\'s a man in a gray suit."*',
  3: '*Thursday night. The Electric Owl, the Kaleidoscope Test, the oil wheel turning the whole room into the inside of a jewel. Somebody hands you a paper cup of punch. Rain shouts "Don\'t—" and then the walls breathe. Later: a cot, a bare bulb, and a face leaning into the light, silver hair, kind eyes. Dr. Kell. He has a syringe in one hand and your .38 in the other, and he\'s saying, very gently, "This one\'s a policeman. Make it three days." Behind him, by the door, a man in a gray suit checks his watch.*',
  4: '*Friday, somewhere around noon, in a room you can\'t place. You\'re on the floor. Two voices above you. One of them is Kell\'s. The other is rough, bored, a cop\'s voice: "I keep the Narcotics boys off Masonic till Saturday night. After that, I find the hippie chemist with the blue pills and I put the cuffs on him for the cameras." Paper rustles. Money. "Same as always, R.B.," Kell says, writing in a little book. Ray Bruno. You knew him at the Department. He used to borrow your pens.*',
  5: '*Thursday, late afternoon, right here, under these eucalyptus trees. The stage is half a skeleton. Rain is furious with you. "You want to call the cops? Frank, the cops are in on it!" You say something reasonable. She says something unprintable. Then: "Sky Calder will listen. It\'s his name on those tabs. We go to the Kaleidoscope Test tonight, we find him, we stop it." You should have said no. You said, "All right, kid." You\'d say it again.*',
} as const;

export const MOONDOG = {
  first: 'Moondog is all elbows and paint, a beard that has given up on being a beard. He looks at you like you\'re a bad trip that\'s come back for its jacket. "Frank. Man. You look worse than Thursday." Thursday. He knows about Thursday. "Who\'s asking?" he says, before you can, and goes back to his silkscreen.',
  again: '"I don\'t talk to anybody I can\'t place, man," Moondog says. "Not this week. Show me something real."',
  after: '"She said you\'d forget," Moondog says. "She said you\'d come back looking like a man who lost his car keys and his car. She was right about everything. That\'s what scares me."',
  photo: 'You hold up the photo. Moondog stares at it a long time, then at you, and something in his shoulders lets go. "Yeah. Okay. Yeah." He goes to a coffee can marked RENT MONEY, digs past the rent money, and comes up with an envelope. "Rain left this Friday. Said if Frank comes around and doesn\'t remember his own name, give it to him. You remember your name?" You tell him. "Close enough."',
};

export const KEV = {
  noProof: '"I don\'t know you, man," says the kid on the ladder, who very clearly knows you. His hands are shaking so hard the gel frames rattle. "I didn\'t see nothing Thursday. I run lights. Lights don\'t see."',
  proof: 'Kev reads the note, or the photo, or your face, and comes down the ladder in a hurry. "She\'s alive? Okay. Okay." He talks fast and low. "Thursday, the cops came in at two in the morning. Not raiding. Escorting. A narc, Bruno, gray Plymouth, and the big biker, Tiny, carrying you out like laundry. Rain too." He swallows. "Tiny dropped a key ring. Brass key, lotus on the bow. I grabbed it. He chased me out back, so I chucked it in the dumpster in the alley. It\'s still there. I\'m not going back there, man. Not while he\'s on that door."',
  after: '"Dumpster, man. Out back. And don\'t let Tiny see your face, he\'s seen it plenty."',
};

export const LU = {
  first: 'Lu Fontaine stops mid-note and laughs, big enough to rattle the balcony. "Well, look what the fog dragged in." Then the laugh goes out of her. "Where\'s Rain, Frank? She was with you. She was dancing, and then she wasn\'t."',
  photo: 'Lu takes the photo and holds it against her chest a second, eyes shut. "Taught that girl three chords and every word I know that a lady shouldn\'t." She hands it back. "Kev saw something Thursday. He won\'t say what. He hid something from that big ape out back, I know he did. You get it out of him. You bring her home."',
  after: '"Go on," Lu says. "I\'ll be singing loud enough for both of us. Go."',
};

export const HANK = {
  first: 'Hank Delacroix sits on the roof of the bus with his boots dangling over a painted sunburst, holding court to three kids and a dog. "TOLLIVER!" he bellows. "The gumshoe who passed the Test! Or failed it gloriously. Same thing, brother, same thing." He leans down. "You came in Thursday with the Whitcombe girl looking for Sky Calder. You left with the wrong people. I was busy being a genius at the time. My apologies."',
  again: '"Sky\'s running sound at the Panhandle, brother. Wall of speakers taller than God. If anybody knows whose name\'s on what, it\'s Sky."',
};

export const CALDER = {
  first: 'Sky Calder doesn\'t look up from the sound desk. Thin, wiry, a soldering iron behind his ear like a pencil. "If you\'re here about the speakers, they\'re fine. If you\'re here about the drugs, I\'m retired. If you\'re a cop, you\'re a bad one."',
  proof: 'You show him what Dr. Fields wrote. Calder reads it once, slowly, the way a jeweller looks at a fake. His face goes white, then red. "That\'s not mine. Nothing I ever made had a binder in it, and I would never press blue on foil like some Tijuana hack." He grips your arm. "My people come up from Laguna. The Fellowship. Surfers, mystics, very serious about quality. If somebody\'s pushing this under my name tonight, they\'re setting me up to hang for it." He lets go. "Stop it. Whatever you need. Stop it."',
  ally: '"Go," Calder says. "I\'ll keep the Ghosts tuning as long as I can. Nobody hands out anything from that table until I say the sound\'s right, and the sound\'s never right."',
};

export const RAIN = {
  sedated: 'Rain murmurs something about colours, and the colours having opinions. Her eyes stay shut.',
  wake: 'You crack the smelling salts under her nose. Rain comes up out of the cushions swinging, catches your wrist, focuses. "Frank. You came back." Her voice is sand. "Listen. The batch is downstairs, the old furnace room, crates of it. They\'re loading at seven-thirty." She grips your coat. "And Frank? Kell has your gun. He keeps it in his pocket like a fountain pen."',
  awake: '"I\'ll be behind you," Rain says, sitting up straighter, eyeing the fireplace tools. "Don\'t argue. You\'re terrible at it, you just don\'t remember."',
};
