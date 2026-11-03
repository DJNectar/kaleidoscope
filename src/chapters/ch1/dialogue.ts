// Longer lines: memory-shard flashbacks and multi-beat conversations.

export const SHARDS = {
  1: '*Wednesday. Your office in the Tenderloin, a fan pushing hot air from one side of the room to the other like a man rearranging furniture he hates. Mrs. Eleanor Whitcombe sits very straight and slides a photograph across your desk with one gloved finger. "Rosalind calls herself Rain now," she says, the way other people say "has shingles." "Find her, Mr. Tolliver. And please. Don\'t tell her I sent you." You take the case. You take the retainer. You tuck your licence in your hatband, where it has lived since you and the Department parted ways over an envelope you wouldn\'t take.*',
  2: '*Thursday morning, this waiting room. Rain comes through the door carrying a boy from the Lotus Foundation, half her size again, smiling at the ceiling like it just told him good news. He doesn\'t know his own name. He seems delighted about it. In the corridor Rain grips your sleeve and talks fast and low: crates in the basement, a doctor who takes notes on how the kids react, a man in a gray suit who signs things. "It doesn\'t kill them, Frank. It just takes them away." You tell her to slow down. You don\'t quite believe her. You will.*',
  3: '*Thursday night. The Electric Owl, the Kaleidoscope Test, the oil wheel turning the whole room into the inside of a jewel. Somebody hands you a paper cup of punch. Rain shouts "Don\'t—" and presses something into your hand: a cardboard tube, brass at the ends. "If they get you, look through this." Then the walls breathe out. Later there is a cot, a bare bulb, and a face leaning into the light: silver hair, kind eyes. Dr. Kell. "This one\'s a policeman," he says gently. "Make it three days. Exactly three. I want to see what comes back." By the door, a man in a gray suit checks his watch, the way you\'d check that the oven was off.*',
  4: '*Friday, a floor you can\'t place. You\'re on it. Two voices above you. One is Kell\'s, like warm milk. The other is rough and bored, a cop\'s voice you used to share a coffee pot with. "I keep Narcotics off Masonic till Saturday night," says Ray Bruno. "After that I find the hippie chemist, the one with the blue pills, and I put the cuffs on him for the cameras." Paper rustles. Money is a very particular sound. "Same as always, R.B.," says Kell, writing in a little oxblood book.*',
  5: '*Thursday afternoon, under these eucalyptus trees. The stage is half a skeleton. Rain is furious with you, magnificently. "You want to call the cops? Frank, the cops are IN on it!" She calls you a square, then a fascist, then, near the end, a sweetheart, in that order. "Sky Calder will listen. It\'s his name on the tabs. We find him tonight at the Test, and we stop it." You should have said no. You said, "All right, kid." You\'d say it again.*',
} as const;

export const MOONDOG = {
  first: 'Moondog is all elbows and paint, with a beard that has given up on being a beard and settled for being an opinion. He looks at you the way people look at a bus they\'ve already missed. "Frank. Man. You look worse than Thursday." Thursday. He knows about Thursday. "Who\'s asking?" he says, before you can, and goes back to his silkscreen.',
  again: '"I don\'t talk to anybody I can\'t place, man," Moondog says. "Not this week. Show me something real."',
  after: '"She said you\'d forget," Moondog says. "She said you\'d come back looking like a man who lost his car keys and then his car. She was right about everything. That\'s the part that keeps me up."',
  photo: 'You hold up the photo. Moondog looks at it for a long time, then at you, and something in his shoulders lets go, like a kite string. "Yeah. Okay. Yeah." He goes to a coffee can marked RENT MONEY, digs past the rent money, and comes up with an envelope. "Rain left this Thursday afternoon. Said if Frank comes around and doesn\'t remember his own name, give him this. You remember your name?" You tell him. "Close enough."',
};

export const KEV = {
  noProof: '"I don\'t know you, man," says the kid on the ladder, who very clearly knows you. His hands shake so hard the gel frames rattle like loose teeth. "I didn\'t see nothing Thursday. Lights don\'t see, man. I run lights."',
  proof: 'Kev sees the photo, or maybe your face, and comes down the ladder in a hurry. "She\'s alive? Okay. Okay." He talks fast and low. "Thursday, two in the morning, the cops came in. Not raiding. Escorting. A narc, Bruno, gray Plymouth, and that big biker, Tiny, carrying you out like laundry. Rain too, smiling, like she was going to a dance." He swallows. "Tiny dropped a key ring. Brass key, lotus on it. I grabbed it, he chased me out back, so I chucked it in the dumpster in the alley. It\'s still there. I\'m not going back for it, man. Not while he\'s on that door."',
  after: '"Dumpster, man. Out back. And don\'t let Tiny see your face. He\'s seen it plenty."',
};

export const LU = {
  first: 'Lu Fontaine stops mid-note and laughs, big enough to rattle the balcony. "Well, look what the fog dragged in." Then the laugh goes out of her like a tide. "Where\'s Rain, Frank? She was with you. She was dancing, and then she wasn\'t."',
  photo: 'Lu takes the photo and holds it against her chest a moment, eyes shut. "Taught that girl three chords and every word a lady shouldn\'t know." She hands it back. "Kev saw something Thursday. He won\'t say what. Get it out of him. Then go bring her home, before she forgets where home is."',
  after: '"Go on," Lu says. "I\'ll be singing loud enough for both of us. Go."',
};

export const HANK = {
  first: 'Hank Delacroix sits cross-legged on the roof rack of his microbus, holding court to three kids and a dog. "TOLLIVER!" he bellows. "The man who passed the Test! Or failed it gloriously. Same thing, brother, same thing." He leans down. "You came in Thursday with the Whitcombe girl looking for Sky Calder. You left with the wrong people. I was busy being a genius at the time. My apologies."',
  again: '"Sky\'s at the Panhandle, brother, building a wall of speakers taller than God. If anybody knows whose name\'s on what, it\'s Sky."',
};

export const CALDER = {
  first: 'Sky Calder doesn\'t look up from the sound desk. Thin, wiry, a soldering iron behind his ear like a pencil. "If you\'re here about the speakers, they\'re fine. If you\'re here about chemistry, I\'m retired. If you\'re a cop, you\'re a bad one."',
  proof: 'You show him Dr. Fields\'s slip. Calder reads it once, slowly, the way a jeweller reads a fake. His face goes white, then red, then a colour that doesn\'t have a name yet. "That\'s not mine. I make things that open doors, man. This closes them and bricks them up." He grips your arm. "My people come up from Laguna. The Fellowship. Surfers, mystics, very serious about quality. If somebody\'s pushing this under my name tonight, they\'re setting me up to hang for it." He lets go. "Stop it. Whatever you need."',
  ally: '"Go," Calder says. "I\'ll keep the Ghosts tuning as long as I can. Nobody hands out anything from that table until the sound\'s right, and the sound is never going to be right."',
};

export const RAIN = {
  dosed: 'Rain looks up from the teapot and smiles at you the way she smiles at the teapot. "More tea? You have a kind face," she says. "Have we met? Everyone has a kind face today."',
  wake: 'You hold out the kaleidoscope. Rain takes it the way you\'d take a seashell from a child, politely, and puts it to her eye. She turns it once. Twice. Then she goes very still, and her face does something complicated, like a house when every light comes on at once. She lowers the kaleidoscope. "Frank," she says, in her own voice. "You absolute square. You came back." She grips your coat. "Listen. The crates are downstairs, in the old furnace room. They load at seven-thirty. And Kell has your gun. He keeps it in his cardigan like a fountain pen."',
  awake: '"I\'ll be right behind you," Rain says, eyeing the fireplace tools. "Don\'t argue. You\'re terrible at it. You just don\'t remember."',
};

/** Frank's own voice, from Thursday, on whatever phone is ringing. */
export const THURSDAY_FRANK = {
  pickup: 'The phone rings as you pass. You pick up. There\'s no hum on the line, only a long soft sound like wind in a hallway, and then a voice: yours, a little hoarse, the voice of a man who has had a long Thursday.',
  hangup: 'A click, and a dial tone that sounds faintly smug.',
};
