import type { Ctx, Handler, HandlerResult, Hotspot, Scene, Shape } from '../../engine/types';
import { CALDER, HANK, KEV, LU, MOONDOG, RAIN, SHARDS, THURSDAY_FRANK } from './dialogue';
import { rainEnding } from './endings';
import { isDisguised } from './items';

// Ink pairs from the brief (§11.1). Ink 1 doubles as the UI accent.
const INK = {
  haight: ['#f0644e', '#1f9e9a'], attic: ['#e2aa2b', '#5c3b8e'], landing: ['#d9682b', '#4b6584'],
  studio: ['#ec3f8c', '#a8d81e'], thirdEye: ['#7a3fb0', '#8fd14f'], clinic: ['#9cc7e4', '#e8442e'],
  owl: ['#d6249f', '#2a5cff'], alley: ['#3d1d5c', '#a3121b'], panhandle: ['#4f9a3a', '#f5c518'],
  lotusExt: ['#d4a017', '#6b2d5c'], parlor: ['#6b2d5c', '#d4a017'], lab: ['#a8d81e', '#1a1a1a'],
} as const satisfies Record<string, readonly [string, string]>;
const inks = (k: keyof typeof INK): [string, string] => [INK[k][0], INK[k][1]];

/** Default reaction when you show/give something to a person. */
const shown = (who: string): Handler => (c) => {
  if (c.with === 'photo') return `${who} looks at the photo of Rain and shakes their head. "Pretty girl. Haven't seen her. Not today, anyway."`;
  if (c.with === 'money') return `${who} eyes your money. "Put that away, man. Somebody'll think you're a tourist."`;
  if (c.with === 'kaleidoscope') return `${who} looks into the kaleidoscope, says "Far out," and hands it back. It isn't their memory.`;
  return undefined;
};
const leaving = (c: Ctx, exitTo: string, hotspot?: string) =>
  (c.verb === 'go' && (c.target === `exit:${exitTo}` || (hotspot !== undefined && c.target === hotspot)));

/** Re-use another hotspot's handler, looked up by id at call time. */
function same(scene: Scene, id: string, verb: 'look' | 'take' | 'talk' | 'hit', c: Ctx): string {
  const r = scene.hotspots.find((h) => h.id === id)?.verbs[verb]?.(c);
  return Array.isArray(r) ? r.join(' ') : r ?? '';
}

/** The pigeon: same bird (bent tail feather) in places it couldn't have reached. */
function pigeon(shape: Shape, where: string): Hotspot {
  return {
    id: 'pigeon', name: 'pigeon', kind: 'person', shape,
    verbs: {
      look: (c) => {
        const n = Number(c.flag('pigeonLooks') ?? 0) + 1;
        c.set('pigeonLooks', n);
        if (n === 1) return `A pigeon ${where}. One bent tail feather. It looks at you as if you owe it money.`;
        if (n === 2) return `The pigeon ${where}, bent tail feather and all. It's the same pigeon. You'd swear to it in court, if any court would have you.`;
        return `The pigeon ${where}. You've stopped asking how. It seems to have stopped wondering why you're here, which is more than you can say.`;
      },
      talk: () => '"Hello," you say to the pigeon. The pigeon tilts its head, as if filing the remark under Miscellaneous.',
      take: () => 'The pigeon steps exactly one step out of reach. Not frightened. Precise.',
      hit: () => 'You raise a hand. The pigeon looks at the hand, then at you, and you lower it. You can\'t say why. It feels like an audit.',
      consume: () => 'You\'re hungry, but you\'re not that kind of detective.',
      give: { default: () => 'The pigeon considers your offer and declines it, the way a bank manager declines a loan.' },
    },
  };
}

/** A phone that rings for Frank. The caller is Frank, from Thursday. */
const HINTS: [(c: Ctx) => boolean, string][] = [
  [(c) => !c.has('page'), '"Look under the mattress," you tell yourself. "You always hide things under the mattress. It\'s the first place anybody would look, which is why nobody does."'],
  [(c) => !c.has('kaleidoscope'), '"There\'s a kaleidoscope on the attic windowsill. Rain gave it to you. Don\'t ask me how it works. Look through it at the things that matter."'],
  [(c) => !c.flag('gotEnvelope'), '"Moondog. Second floor. Show him the girl\'s picture. He doesn\'t trust faces, but he trusts hers."'],
  [(c) => !c.flag('fieldsTested'), '"Get that tab to a doctor who\'ll talk. Fields, the free clinic on Clayton. She\'s seen the kids it makes."'],
  [(c) => !c.flag('bought'), '"Buy the shades," you say. "You look like a narc. The whole street can smell it on you."'],
  [(c) => !c.flag('kevTalked'), '"The matchbook. The Electric Owl. Ask for Kev and show him the photo. He\'s scared, so be nice. You\'re bad at nice. Try anyway."'],
  [(c) => !c.has('brasskey'), '"Dumpster behind the Owl. Wear the beads. The big fella on the door has a long memory for faces, and yours is one of them."'],
  [(c) => !c.has('card') && !c.flag('admitted'), '"There\'s a Lotus table in the Panhandle handing out Seeker cards. That gets you in the front door on Masonic. Or there\'s the cellar, if you\'ve got the key and no friends."'],
  [(c) => !c.flag('rainAwake'), '"She won\'t know you. Don\'t take it personally. Give her back the kaleidoscope. Let her look."'],
  [(c) => !c.has('ledger'), '"Kell keeps books. Doctors always keep books. Take them."'],
  [() => true, '"Open the crates, open the furnace, burn it," you say. "And when the doctor comes down the stairs, keep him talking. You\'re good at that. It\'s the only thing you\'re good at."'],
];
function thursdayCall(c: Ctx): string[] {
  c.hint(); c.cost(10);
  const hint = HINTS.find(([when]) => when(c))![1];
  return [THURSDAY_FRANK.pickup, hint, 'The line goes quiet for a moment, as if the other you is listening to the rain. ' + THURSDAY_FRANK.hangup];
}

// ════════════════════════════════════════ 1. ATTIC ════════════════════════════════════════
const attic: Scene = {
  id: 'attic', name: 'The Attic',
  art: { placeholder: 'ATTIC CRASH PAD', inks: inks('attic'), effects: ['dust'] },
  onEnter: (c) => (c.visited('attic') ? 'The attic. It still smells of patchouli and somebody else\'s decisions.' : undefined),
  hotspots: [
    {
      id: 'mattress', name: 'mattress', shape: { poly: [[260, 520], [640, 505], [700, 600], [230, 615]] },
      verbs: {
        look: (c) => {
          if (c.flag('foundPage')) return 'A bare mattress with a you-shaped dent in it, like the outline the police draw, only softer.';
          c.set('foundPage'); c.set('stakesKnown'); c.give('page'); c.note('stakes');
          return 'A bare mattress on bare boards with a you-shaped dent in the middle. You lift a corner out of old habit, because you always hide things under the mattress. Underneath, folded small, is a page torn from your own notebook, in your own handwriting.';
        },
        take: () => 'You\'ve carried heavier things out of worse rooms. Not today, though.',
        open: (c) => same(attic, 'mattress', 'look', c),
        hit: () => 'You punch the mattress. It forgives you instantly. Must be nice.',
        consume: () => 'You\'ve been hungry. Never that hungry.',
        go: () => 'You\'ve slept enough for one week. Three days, by the look of things.',
      },
    },
    {
      id: 'window', name: 'tie-dye curtain', shape: { rect: [430, 110, 140, 150] },
      verbs: {
        look: () => 'A tie-dyed curtain in orange and purple spirals. The sun comes through it and lies across the floorboards like a dog that has decided this is its spot now. Behind it, a small window onto a fire escape and the backs of the Victorians on Ashbury.',
        open: (c) => { c.set('curtainOpen'); return 'You pull the curtain aside. Light hits you like an unpaid bill. Outside, a fire escape painted to match the house: lacy, lovely, wrought by hand. Four floors down, a garden waits.'; },
        close: (c) => { c.set('curtainOpen', false); return 'You draw the curtain. The room goes orange and purple again. Your headache approves.'; },
        go: (c) => c.die('attic-window'),
        use: { none: (c) => c.die('attic-window'), knife: () => 'The window isn\'t locked. That isn\'t the problem with the window.' },
        hit: () => 'You don\'t need to break anything else today, least of all yourself.',
        take: () => 'You consider wearing the curtain as a disguise. You\'d look like a Roman senator at a love-in.',
      },
    },
    {
      id: 'kaleidoscope', name: 'kaleidoscope on sill', shape: { rect: [455, 262, 60, 22] },
      visible: (s) => !s.inventory.includes('kaleidoscope'),
      verbs: {
        look: () => 'On the windowsill, next to the pigeon, a child\'s kaleidoscope: a cardboard tube with brass caps. You have the feeling you put it there carefully. You have the feeling someone asked you to.',
        take: (c) => {
          c.give('kaleidoscope'); c.note('kaleidoscope');
          return 'You pick up the kaleidoscope. It\'s lighter than it looks, and warm, as if somebody was holding it a minute ago. The pigeon watches you put it in your pocket and seems, on balance, to approve.';
        },
        use: { none: () => 'You\'d have to pick it up first. That\'s the thing about most things.' },
      },
    },
    pigeon({ rect: [520, 240, 50, 40] }, 'on the windowsill, behind the curtain'),
    {
      id: 'coat', name: 'coat on chair', shape: { poly: [[140, 330], [280, 330], [290, 500], [130, 500]] },
      visible: (s) => !s.flags.coatTaken,
      verbs: {
        look: () => 'Your trench coat, folded over a kitchen chair with more care than you\'ve ever shown it. Something weighs down the pockets.',
        take: (c) => {
          c.set('coatTaken'); c.give('photo'); c.give('matchbook'); c.give('money');
          return 'You shrug the coat on. It\'s rumpled, like it slept harder than you did. In the pockets: a snapshot of a girl with ironed-straight hair, a matchbook from the Electric Owl, and seven dollars. Your .38 is not in the pockets. Your .38 is not anywhere, which is a very particular kind of not.';
        },
        open: (c) => same(attic, 'coat', 'take', c),
      },
    },
    {
      id: 'chair', name: 'chair', shape: { rect: [140, 500, 150, 40] },
      verbs: {
        look: () => 'A kitchen chair, painted turquoise by someone who loved turquoise more than chairs.',
        go: () => 'You sit for a moment. The room spins at a respectful distance. You get up.',
      },
    },
    {
      id: 'fedora', name: 'fedora', shape: { poly: [[832, 262], [858, 248], [862, 222], [890, 212], [920, 222], [926, 250], [948, 264], [932, 286], [868, 288], [838, 280]] },
      verbs: {
        look: (c) => {
          if (c.flag('foundLicence')) return 'Your hat: gray felt, the kind worn by men who expect at any moment to be photographed in the rain.';
          c.set('foundLicence'); c.give('licence'); c.note('self');
          return 'A gray felt fedora, the kind worn by men who expect at any moment to be photographed in the rain. Tucked in the band is a private investigator\'s licence: FRANCIS X. TOLLIVER. You read the name twice. It seems like a good name. You decide to keep it.';
        },
        take: (c) => {
          const extra = c.flag('foundLicence') ? [] : [same(attic, 'fedora', 'look', c)];
          c.set('hatOn');
          return [...extra, 'You put the hat on. Now you\'re a detective, or at least the silhouette of one.'];
        },
        consume: () => 'You\'ve threatened to eat your hat before. You\'ve never once followed through, and today is not the day.',
      },
    },
    {
      id: 'toast', name: 'plate of toast', shape: { rect: [540, 480, 100, 36] },
      verbs: {
        look: (c) => c.has('knife')
          ? 'Two slices of toast, cold since at least Thursday, and no knife. You took the knife. The toast seems to know.'
          : 'Two slices of toast, cold since at least Thursday. Someone buttered them with great care and never came back, like a love letter written to a person who has moved away. A butter knife lies across the plate.',
        consume: () => 'You bite the toast. It has been here since Thursday and has developed opinions. You put it down with respect.',
        take: (c) => {
          if (c.has('knife')) return 'Leave the toast. The toast has been through enough.';
          c.give('knife');
          return 'You leave the toast and take the butter knife. Thin blade, rounded tip. You\'ve opened worse doors with less.';
        },
      },
    },
    {
      id: 'door', name: 'door', kind: 'exit', shape: { poly: [[700, 190], [800, 215], [800, 545], [700, 505]] },
      verbs: {
        look: (c) => c.flag('atticOpen') ? 'The attic door, unlatched. A narrow stair goes down into the smell of incense and cabbage.' : 'A paneled door with no handle on this side and a keyhole full of paint. Locked from the outside. Somebody wanted you to sleep in.',
        open: (c) => c.flag('atticOpen') ? 'It\'s open. The stairs go down. So, gently, does your mood.' : 'Locked from the outside. You rattle it. It rattles back, with less conviction.',
        hit: () => 'You thump the door. Somewhere below, someone shouts "Bummer, man!" and turns their record up.',
        talk: () => '"Hello?" you call through the door. The house answers with a sitar, very far away, playing something that never quite arrives.',
        use: {
          knife: (c) => {
            if (c.flag('atticOpen')) return 'It\'s already open. You put the knife away, slightly disappointed.';
            c.set('atticOpen');
            return 'You slide the butter knife into the gap and work it up under the latch: the old trick. The latch gives with a click that sounds almost like an apology, and the door swings open on a narrow stair.';
          },
          licence: () => 'Credit-carding a lock with your licence works in the pictures. In real life the licence bends and the lock laughs.',
          default: () => 'That won\'t open it. You need something thin and stiff, like a butter knife, or a bureaucrat.',
        },
      },
    },
  ],
  exits: [
    {
      to: 'landing', label: 'Landing', hotspot: 'door', map: [90, 70],
      guard: (c) => (c.flag('atticOpen') ? undefined : 'The door is locked from the outside. You\'ll need to get clever, or at least get a tool.'),
    },
  ],
};

// ════════════════════════════════════════ 2. LANDING ════════════════════════════════════════
const landing: Scene = {
  id: 'landing', name: 'Second-Floor Landing',
  art: { placeholder: 'SECOND-FLOOR LANDING', inks: inks('landing') },
  onEnter: (c) => c.visited('landing') ? undefined
    : 'A narrow landing that smells of incense, cabbage and turpentine in roughly equal parts, like a committee. Peeling wallpaper, a bare bulb burning in the daytime, a radiator wearing a flyer like a hat. One door on this floor has a giant eye painted on it, and the eye is looking at you.',
  hotspots: [
    {
      id: 'flyer', name: 'flyer on radiator', shape: { rect: [90, 360, 160, 120] },
      verbs: {
        look: () => 'A hand-printed flyer: **FREE GATHERING — THE PANHANDLE — SUNDOWN SATURDAY — THE MORNING GHOSTS — gifts of peace from the LOTUS FOUNDATION.** Gifts. Free. Sundown. The hair on the back of your neck stands up and starts taking notes.',
        take: () => 'You leave it. Half the telephone poles in the Haight are wearing the same one.',
        consume: () => 'You are not a goat. Yet.',
      },
    },
    {
      id: 'radiator', name: 'radiator', shape: { rect: [80, 470, 190, 90] },
      verbs: {
        look: () => 'An iron radiator painted silver, stone cold. August in San Francisco: it will be on any day now.',
        hit: () => 'CLANG. The radiator sings a single note. Downstairs, someone yells "Heavy!" in genuine admiration.',
      },
    },
    {
      id: 'eyedoor', name: 'Moondog\'s door', kind: 'exit', shape: { poly: [[560, 150], [700, 160], [700, 540], [560, 520]] },
      verbs: {
        look: () => 'A door painted with one enormous eye, its iris made of tiny swirling galaxies. Under it, in small letters: *MOONDOG — POSTERS — KNOCK LIKE YOU MEAN IT.* The eye seems to have been expecting you, and to be slightly disappointed.',
        open: (c) => c.flag('moondogOpen') ? 'The door\'s on the latch now. Moondog trusts you that far.' : 'Locked. Behind it, someone stops breathing.',
        hit: (c) => {
          if (c.flag('moondogOpen')) return 'You knock again. "It\'s open, man," says the door.';
          c.set('moondogOpen'); c.go('studio');
          return 'You knock like you mean it. A long silence, three locks, one chain and an eye, a real one this time, bloodshot. "Oh, man," says the eye. "Frank." The door opens just wide enough for a man to slip through, and you do.';
        },
        talk: (c) => same(landing, 'eyedoor', 'hit', c),
        use: { knife: () => 'You could pick it. Or you could knock, like a person.' },
      },
    },
    {
      id: 'stairsup', name: 'stairs up', kind: 'exit', shape: { rect: [800, 60, 160, 200] },
      verbs: { look: () => 'Back up to the attic. Not much up there but toast and a pigeon.' },
    },
    {
      id: 'stairsdown', name: 'stairs down', kind: 'exit', shape: { poly: [[760, 300], [980, 300], [980, 625], [720, 625]] },
      verbs: { look: () => 'Steep stairs down to the front door and Ashbury Street. Late sun lies on the bottom steps like something spilled.' },
    },
    {
      id: 'bulb', name: 'bare bulb', shape: { rect: [380, 20, 60, 80] },
      verbs: {
        look: () => 'A single bare bulb, burning in the daytime. Somebody in this house is very afraid of the dark, or very fond of the electric company.',
        take: () => 'You\'d burn your fingers. You\'re saving them for later.',
      },
    },
  ],
  exits: [
    { to: 'attic', label: 'Attic', hotspot: 'stairsup', map: [80, 10] },
    { to: 'studio', label: 'Moondog\'s', hotspot: 'eyedoor', map: [50, 0], guard: (c) => (c.flag('moondogOpen') ? undefined : 'The door with the eye is locked. A sign under the eye says KNOCK LIKE YOU MEAN IT.') },
    { to: 'haight', label: 'Street', hotspot: 'stairsdown', map: [80, 100] },
  ],
};

// ════════════════════════════════════════ 3. STUDIO ════════════════════════════════════════
function moondogPhoto(c: Ctx): string {
  if (c.flag('gotEnvelope')) return '"I know, man. I know. I gave you the thing already."';
  c.set('gotEnvelope'); c.give('envelope'); c.note('moondog');
  return MOONDOG.photo;
}

const studio: Scene = {
  id: 'studio', name: 'Moondog\'s Studio',
  art: { placeholder: 'MOONDOG\'S STUDIO', inks: inks('studio') },
  onEnter: (c) => c.visited('studio') ? undefined
    : 'Moondog\'s flat is a print shop with a bed somewhere underneath it. Silkscreen frames lean on every wall, posters dry on clotheslines strung corner to corner, and a black curtain in the corner leaks red light, like a darkroom with a secret.',
  hotspots: [
    {
      id: 'moondog', name: 'Moondog', kind: 'person', shape: { rect: [420, 200, 140, 340] },
      verbs: {
        look: () => 'Moondog: thin, barefoot, paint to the elbows, eyes that keep checking the window as if the window might check back. He\'s the kind of paranoid that turns out to be right a little too often.',
        talk: (c) => {
          if (c.flag('gotEnvelope')) return MOONDOG.after;
          c.note('moondog');
          if (!c.flag('metMoondog')) { c.set('metMoondog'); return MOONDOG.first; }
          return MOONDOG.again;
        },
        give: {
          photo: (c) => moondogPhoto(c),
          licence: () => '"A licence," Moondog says. "Great. The government says you\'re you. They\'re the last people I\'d ask."',
          tab: () => 'Moondog backs into a drying rack. "Don\'t bring that near me, man. I know what it is. I printed the posters for the party it\'s going to."',
          default: shown('Moondog'),
        },
        use: { photo: (c) => moondogPhoto(c) },
        hit: () => 'He\'s frightened enough already. You\'re not going to be the man who makes it worse.',
      },
    },
    {
      id: 'posters', name: 'drying posters', shape: { rect: [80, 40, 840, 120] },
      verbs: {
        look: () => 'Posters drying on the lines like laundry: the Morning Ghosts in melting letters; a lotus spilling light over the Panhandle; and one you can\'t stop looking at. It shows tonight\'s gathering under a sky full of smoke, and in the corner, a man in a fedora standing beside a furnace. "I don\'t draw the future, man," Moondog says without turning round. "It just keeps posing for me."',
        take: () => '"Those are wet, man! And that one isn\'t finished. It hasn\'t happened yet."',
      },
    },
    {
      id: 'frames', name: 'silkscreen frames', shape: { rect: [60, 280, 260, 260] },
      verbs: { look: () => 'Wooden frames stretched with silk: stencils of eyes, flowers and, half-finished, a pigeon with one bent tail feather. You decide not to ask.' },
    },
    {
      id: 'darkroom', name: 'darkroom curtain', shape: { rect: [700, 190, 170, 330] },
      verbs: {
        look: () => 'A heavy black curtain with red light leaking round its edges.',
        open: () => '"Not the darkroom, man!" You let the curtain fall. Somewhere behind it, a print quietly ruins itself.',
        go: () => '"NOT the darkroom!" Moondog is very clear on this point.',
      },
    },
    {
      id: 'shelf', name: 'shelf of bottles', shape: { rect: [880, 220, 110, 200] },
      verbs: {
        look: () => 'A shelf of brown chemical bottles with handwritten labels: DEVELOPER, STOP, a coffee can marked RENT MONEY, and a green bottle labelled GINGER ALE in Moondog\'s handwriting.',
        take: () => 'You don\'t need any of these. Not even the rent money. Especially not the rent money.',
      },
    },
    {
      id: 'gingerale', name: 'ginger ale', shape: { rect: [905, 300, 40, 60] },
      verbs: {
        look: () => 'A green glass bottle labelled GINGER ALE in grease pencil. It\'s flat, and it has the faint vinegar breath of a darkroom. You are very, very thirsty.',
        consume: (c) => c.die('fixer'),
        take: () => 'Moondog watches you reach for it. "That\'s... yeah, okay, sure, man." Something about his face makes you put it back.',
        open: () => 'You unscrew it and sniff. Vinegar and swimming pool. You screw it shut again, mostly.',
      },
    },
  ],
  exits: [{ to: 'landing', label: 'Landing', map: [50, 100] }],
};

// ════════════════════════════════════════ 4. HAIGHT & ASHBURY ════════════════════════════════════════
const haight: Scene = {
  id: 'haight', name: 'Haight & Ashbury',
  // Hotspots laid out on the anchor art (3:2 source cropped to 16:10).
  art: { placeholder: 'HAIGHT & ASHBURY', inks: inks('haight'), outdoor: true, effects: ['fog'] },
  onEnter: (c) => c.visited('haight') ? undefined
    : 'Haight and Ashbury, four-something on a Saturday in the summer everybody will lie about later. Painted Victorians, scalloped awnings, a tree throwing lace shadows across the road. A flower-painted microbus sits at the curb with a man on its roof preaching to a dog. Down the block, where the fog is coming in, a gray Plymouth waits in the shade with its engine off and its driver on.',
  hotspots: [
    {
      id: 'street', name: 'Haight Street traffic', shape: { poly: [[210, 470], [1000, 470], [1000, 625], [200, 625]] },
      verbs: {
        look: () => 'Haight Street traffic: tour buses full of people photographing other people, motorcycles, and a painted bus doing thirty with flowers wired to its bumper. Nobody here has heard of a speed limit, or of pedestrians, or of Tuesday.',
        go: (c) => c.die('bus'),
        use: { none: (c) => c.die('bus') },
      },
    },
    {
      id: 'bus', name: 'microbus Elsewhere', shape: { poly: [[388, 315], [415, 300], [650, 300], [690, 345], [699, 432], [660, 456], [420, 445], [385, 420]] },
      verbs: {
        look: () => 'A microbus painted by people who saw God and wanted to show you the colours: orange daisies, teal swirls, eyes on the hubcaps. ELSEWHERE is lettered along the roof rack. A cardboard sign in the windshield gives its destination as FURTHER.',
        go: () => '"No riders today, brother!" Hank calls down. "Elsewhere is closed for repairs. Elsewhere is always closed for repairs. That\'s what makes it Elsewhere."',
        open: () => 'The side door slides open with a sigh and a smell of sandalwood. Inside: a mattress, two guitars, a typewriter and a goat. You decline, politely, on behalf of all of you.',
      },
    },
    {
      id: 'hank', name: 'Hank Delacroix', kind: 'person', shape: { rect: [455, 240, 130, 62] },
      verbs: {
        look: () => 'Hank Delacroix, the novelist, ringleader of the Electric Jesters, sitting cross-legged on the roof rack in a flag shirt and a top hat. He\'s talking to anyone in range and several people who aren\'t.',
        talk: (c) => { if (c.flag('metHank')) return HANK.again; c.set('metHank'); return HANK.first; },
        give: {
          photo: () => '"The Whitcombe girl! Sharp as a tack and twice as dangerous. She was asking for Sky Calder all night Thursday. Try the Panhandle, brother. Sky\'s building the sound."',
          tab: () => 'Hank looks at the blue tab and, possibly for the first time in his life, stops talking. "Where\'d you get that." It isn\'t a question. "Sky doesn\'t press on foil. Never has. Somebody\'s wearing his face, brother."',
          default: shown('Hank'),
        },
      },
    },
    {
      id: 'busker', name: 'busker', kind: 'person', shape: { rect: [740, 330, 70, 130] },
      verbs: {
        look: () => 'A busker under the awning with a twelve-string guitar and eleven strings, playing something long and modal to a hat with a nickel in it.',
        talk: () => '"Request?" he says. You ask for something cheerful. He plays the same song in a major key, and somehow it\'s sadder.',
        give: {
          money: (c) => c.flag('tippedBusker') ? '"You already did, man. Peace."' : (c.set('tippedBusker'), 'You drop a coin in the hat. He nods and improvises a verse about a man in a raincoat who forgot his own name and kept walking anyway. It\'s uncomfortably accurate. It rhymes "Thursday" with "worst day."'),
          default: shown('The busker'),
        },
      },
    },
    {
      id: 'plymouth', name: 'gray Plymouth', shape: { rect: [42, 322, 84, 46] },
      verbs: {
        look: (c) => isDisguised(c)
          ? 'The gray Plymouth, down the block in the fog. The man behind the wheel has a crew cut and a newspaper he isn\'t reading. His eyes slide over you like you\'re a lamppost wearing beads.'
          : 'A gray Plymouth down the block, police-issue down to the hubcaps. The man in it has a crew cut, a newspaper he isn\'t reading, and his eyes on you. You don\'t know him. You know the type. You used to be the type.',
        talk: () => 'Some instinct older than your headache keeps you on this side of the street.',
        go: () => 'Walking up to that car is a good way to spend the night in a cell. You stay on the corner.',
        hit: () => 'Punching a police car in broad daylight: bold, memorable, stupid. You keep your hands in your pockets.',
        open: () => 'You do not open a stranger\'s car with a stranger in it. Especially that stranger.',
      },
    },
    {
      id: 'sign', name: 'street sign', shape: { poly: [[853, 60], [880, 60], [880, 110], [985, 110], [985, 165], [900, 165], [900, 455], [853, 455]] },
      verbs: { look: () => 'A green lamppost and a street sign, both blades stickered with daisies until you can\'t read HAIGHT or ASHBURY. Somebody has added a third blade, hand-painted, that just says LOVE and points straight up. It doesn\'t say how far.' },
    },
    pigeon({ rect: [855, 20, 45, 38] }, 'on top of the lamppost'),
    {
      id: 'shopfront', name: 'the Third Eye', kind: 'exit', shape: { poly: [[590, 165], [1000, 150], [1000, 420], [910, 420], [910, 300], [700, 300], [700, 345], [590, 345]] },
      verbs: { look: () => 'A corner shopfront under a scalloped orange awning, its window crowded with hanging lamps, potted ferns and hookahs. Gold letters on the glass: THE THIRD EYE.' },
    },
    {
      id: 'house', name: 'your Victorian', kind: 'exit', shape: { rect: [355, 40, 125, 240] },
      verbs: { look: () => 'The Victorian with the turret, where you woke up. From down here it looks innocent. Houses always do.' },
    },
    {
      id: 'tree', name: 'tree', shape: { poly: [[0, 0], [190, 0], [160, 200], [90, 300], [80, 560], [0, 560]] },
      verbs: {
        look: () => 'An old tree heaving up the sidewalk, its leaves gone orange in the late sun, throwing lace shadows across the road as if someone asked it to decorate.',
        go: () => 'You lean against the tree a minute. It holds you up. Somebody should.',
        hit: () => 'The tree has been here since the Earthquake. It can take it. Your knuckles can\'t.',
      },
    },
    {
      id: 'fog', name: 'fog down the block', shape: { rect: [125, 230, 110, 120] },
      verbs: { look: () => 'Fog rolling in off the ocean at the far end of Haight, eating the telephone poles one at a time, unhurried, like a cow in a field. By sundown it will be here.' },
    },
  ],
  exits: [
    { to: 'landing', label: 'The house', hotspot: 'house', map: [15, 10] },
    { to: 'thirdeye', label: 'Third Eye', hotspot: 'shopfront', map: [40, 0] },
    { to: 'clinic', label: 'Free clinic', map: [70, 0] },
    { to: 'owl', label: 'Electric Owl', minutes: 6, map: [100, 30] },
    { to: 'panhandle', label: 'Panhandle', minutes: 8, map: [100, 80] },
    { to: 'lotus', label: 'Masonic Ave', minutes: 8, map: [55, 100] },
  ],
};

// ════════════════════════════════════════ 5. THE THIRD EYE ════════════════════════════════════════
function buyDisguise(c: Ctx): string {
  if (c.flag('bought')) return '"You\'re good, man. Keep your bread."';
  c.set('bought'); c.set('boughtDisguise'); c.give('disguise');
  return 'You count out five dollars. Sunny hands over a pair of round purple shades and a string of painted love beads, wrapped in tissue paper with a little bow, as if you might want to give yourself as a present. "A new you, friend. Wear it in good health."';
}

const thirdeye: Scene = {
  id: 'thirdeye', name: 'The Third Eye',
  art: { placeholder: 'THE THIRD EYE', inks: inks('thirdEye'), effects: ['smoke'] },
  onEnter: (c) => c.visited('thirdeye') ? undefined
    : 'The Third Eye head shop: beads in the doorway, blacklight posters, incense thick enough to lean on. Behind the glass counter a cheerful man in a velvet vest is restacking a tray of brownies as if they were the crown jewels of a small, happy nation.',
  hotspots: [
    {
      id: 'sunny', name: 'Sunny', kind: 'person', shape: { rect: [430, 190, 140, 260] },
      verbs: {
        look: () => 'Sunny, proprietor: muttonchops, a grin like a sales pitch, and a peace medallion the size of a hubcap.',
        talk: (c) => {
          if (isDisguised(c)) return '"Now THAT\'S a man at peace with the universe," Sunny beams. "Almost groovy, friend. Lose the trench coat and you could pass for a poet. A sad one, but they\'re the best kind."';
          if (c.flag('bought')) return '"Put \'em on, man! Shades and beads in a paper bag do nothing for your aura."';
          return '"Welcome, friend, welcome!" Sunny looks you up and down: the coat, the hat, the face. "Oh. Oh, man. You look like a narc. No offence. Everybody on the street is going to make you in two seconds. Five bucks gets you shades, beads and a whole new karma."';
        },
        give: {
          money: (c) => buyDisguise(c),
          tab: () => 'Sunny glances at the blue tab and goes pale under his muttonchops. "Not in my shop. Not THAT. Word is somebody\'s handing those out tonight, free. Free is never free, man. Free is the most expensive word there is."',
          default: shown('Sunny'),
        },
        hit: () => 'You don\'t hit a man in his own shop. Also, there\'s a softball bat behind the counter, and Sunny\'s grin is the grin of a man who has used it.',
      },
    },
    {
      id: 'sunglasses', name: 'sunglasses rack', shape: { rect: [140, 220, 130, 220] },
      verbs: {
        look: () => 'A spinning rack of round sunglasses in every colour a hangover can see. A tag: SHADES + BEADS, $5, THE WHOLE LOOK.',
        take: (c) => c.flag('bought') ? 'You\'ve got a pair. One new you is plenty.' : '"Five bucks, man," Sunny calls without looking. "Love is free. Shades are five."',
        use: { money: (c) => buyDisguise(c) },
      },
    },
    {
      id: 'beads', name: 'bead curtain', shape: { rect: [20, 100, 100, 420] },
      verbs: { look: () => 'Strings of glass beads in the doorway that click softly whenever anyone breathes, like a polite abacus.', go: () => 'You part the beads. On the other side is the same shop. Very spiritual.' },
    },
    {
      id: 'vests', name: 'fringe vests', shape: { rect: [290, 160, 120, 300] },
      verbs: { look: () => 'Suede vests with fringe to the knee. You picture yourself in one, and the picture is so vivid you have to sit down in your mind.', take: () => 'A man has to draw the line somewhere. The line is fringe.' },
    },
    {
      id: 'brownies', name: 'tray of brownies', shape: { rect: [600, 400, 150, 60] },
      verbs: {
        look: () => 'A tray of brownies under a glass dome. A card reads SPECIAL. Somebody has underlined SPECIAL three times, then added a small drawing of a planet.',
        consume: (c) => c.die('brownie'),
        take: () => '"Those are for display, man," Sunny says. "And by display I mean me."',
      },
    },
    {
      id: 'incense', name: 'incense', shape: { rect: [780, 300, 60, 140] },
      verbs: { look: () => 'Sandalwood smoking in a brass elephant. The smoke curls through the coloured light and spells out nothing at all, very beautifully.', consume: () => 'No.' },
    },
    {
      id: 'payphone', name: 'payphone', shape: { rect: [880, 150, 90, 220] },
      verbs: {
        look: () => 'A payphone in a nook, its directory chewed to pulp. As you look at it, it starts to ring. "It\'s for you, man," Sunny says without looking up, the way people in the Haight say most things.',
        use: { none: thursdayCall, money: thursdayCall },
        talk: thursdayCall,
        take: thursdayCall,
      },
    },
  ],
  exits: [{ to: 'haight', label: 'Haight St', map: [50, 100] }],
};

// ════════════════════════════════════════ 6. FREE CLINIC ════════════════════════════════════════
const clinic: Scene = {
  id: 'clinic', name: 'Free Clinic',
  art: { placeholder: 'FREE CLINIC, CLAYTON ST', inks: inks('clinic') },
  onEnter: (c) => c.visited('clinic') ? undefined
    : 'The free clinic on Clayton: a Victorian parlour gone to war. Kids on every chair, some crying, some bleeding, and a few just smiling at the ceiling as if it had told them good news. A bald man in robes ladles soup. A doctor in a white coat moves through it all like a tugboat through fog.',
  hotspots: [
    {
      id: 'fields', name: 'Dr. Fields', kind: 'person', shape: { rect: [560, 170, 130, 330] },
      verbs: {
        look: () => 'Dr. Nora Fields: forty, a gray streak, sleeves rolled to the elbow, eyes that have seen everything twice this week. She hasn\'t sat down since June.',
        talk: (c) => c.flag('fieldsTested')
          ? '"Get that slip to somebody who\'ll act on it," Fields says. "And if you find the kids that stuff\'s meant for, get them here first. I\'ll make room. I always make room."'
          : '"If you\'re not bleeding, sit down and wait," Dr. Fields says without looking up. "If you\'ve got something for me, show me."',
        give: {
          tab: (c) => {
            c.remove('tab'); c.set('fieldsTested'); c.give('slip'); c.advance(10);
            c.note('lethe'); c.note('kell');
            return ['Fields takes the foil like it might bite. In the back room she scrapes the tab, drips reagent, waits, drips something else, and goes very still, the way people go still when the thing they were afraid of turns out to have a name. Ten minutes later she comes back with a slip of paper and her jaw set.',
              '"It isn\'t acid. It isn\'t poison, either. It\'s worse, in a quiet way." She nods at the smiling kids. "That. That\'s what it does. Takes the last few months right out of them and leaves them calm and pleasant and asking where they can get a haircut. Every one of them came over from Dr. Kell\'s Lotus Foundation, \'for aftercare.\'" She writes fast. "Here. Evidence. Five thousand of these in the Panhandle and the Summer of Love just won\'t have happened."'];
          },
          photo: () => '"Thursday morning," Fields says, studying the photo. "She brought in a boy from the Lotus Foundation, smiling at nothing. She was angry. Not at him." She hands it back. "Look at the waiting room. Look properly, this time."',
          slip: () => '"Keep it," she says. "It\'s more use in your pocket than in my files."',
          default: shown('Dr. Fields'),
        },
        hit: () => 'She\'d have you sedated and on a cot before you finished the swing, and you\'d deserve it.',
      },
    },
    {
      id: 'ananda', name: 'Brother Ananda', kind: 'person', shape: { rect: [180, 220, 140, 280] },
      verbs: {
        look: () => 'A bald man in saffron robes, glasses mended with tape, ladling soup with the precision of a man who used to measure things for a living. Brother Ananda. Once Professor Lev Adler, until the university decided his experiments were the wrong kind of interesting.',
        talk: (c) => {
          c.note('kell');
          return '"Soup?" Ananda asks, then looks closer. "Ah. You\'re the one asking about the Lotus Foundation." He lowers his voice. "I knew Ambrose Kell at Stanford. Brilliant, ambitious, a beautiful speaking voice. In \'59 he took a government grant the rest of us refused. A man in a gray suit came to sign the papers. The money came from a budget line marked MISC. SEED STOCK, OTHER." He smiles sadly. "Ambrose took the money. The rest of us took the high road, which pays considerably less."';
        },
        consume: () => 'Wrong target. The soup is in the pot.',
        give: { default: () => '"Keep it, friend. Everything I need is in this pot."' },
      },
    },
    {
      id: 'soup', name: 'soup pot', shape: { rect: [320, 380, 120, 100] },
      verbs: {
        look: () => 'A dented pot of lentil soup the size of a bathtub. It smells like the first honest thing you\'ve met all day.',
        consume: (c) => c.flag('ateSoup') ? 'Ananda smiles. "Others are hungrier, friend."' : (c.set('ateSoup'), 'Ananda hands you a bowl. It\'s hot, salty and perfect. A little of your brain comes back from wherever it\'s been and sits down beside you.'),
        take: () => 'It\'s bolted to the stove by sheer moral authority.',
      },
    },
    {
      id: 'kids', name: 'waiting room', kind: 'person', shape: { rect: [740, 300, 240, 220] },
      verbs: {
        look: () => 'Kids, fifteen to nineteen: barefoot, sunburned, bad trips and cut feet and nowhere else to go. Most wear paper lotus pins. Three of them sit very straight, smiling at the ceiling, and none of the three can tell you their own name. They don\'t seem to mind at all.',
        talk: () => 'A boy with a lotus pin tells you, very politely, that he would like a haircut, and that Dr. Kell says tonight will be "the Communion of the Summer." He shows you his ticket: a cream card with a gold lotus. He can\'t remember where he got it. He\'s delighted about this.',
        use: {
          kaleidoscope: (c) => {
            if (c.state.shards.includes(2)) return 'Through the kaleidoscope the waiting room becomes a rose window of tired faces. You\'ve already seen what it has to show you.';
            c.shard(2, SHARDS[2]);
            return 'You lift the kaleidoscope and look at the waiting room. The smiling kids break into six pieces and turn, and the pieces settle into a morning that already happened.';
          },
        },
      },
    },
    {
      id: 'phone', name: 'desk phone', shape: { rect: [700, 400, 60, 50] },
      verbs: {
        look: () => 'A black telephone on Dr. Fields\'s desk, buried under files. It starts to ring the moment you look at it. Fields doesn\'t glance up. "It\'s for you," she says. "It\'s been for you all afternoon."',
        use: { none: thursdayCall },
        talk: thursdayCall,
        take: thursdayCall,
      },
    },
    {
      id: 'cabinet', name: 'medicine cabinet', shape: { rect: [60, 120, 100, 200] },
      verbs: {
        look: () => 'A steel medicine cabinet, padlocked, with a handwritten sign: NO DRUGS IN HERE. GO AWAY. LOVE, NORA.',
        open: () => 'Padlocked. Also, you\'re not that kind of patient.',
        hit: () => 'Every kid in the room looks up at you. You stop.',
      },
    },
    {
      id: 'eyechart', name: 'eye chart', shape: { rect: [440, 60, 80, 140] },
      verbs: { look: () => 'An eye chart. The top letter is E. The bottom line reads either F-R-E-E L-O-V-E or you need glasses. Probably both.' },
    },
  ],
  exits: [{ to: 'haight', label: 'Haight St', map: [50, 100] }],
};

// ════════════════════════════════════════ 7. ELECTRIC OWL ════════════════════════════════════════
const owl: Scene = {
  id: 'owl', name: 'The Electric Owl',
  art: { placeholder: 'THE ELECTRIC OWL BALLROOM', inks: inks('owl'), effects: ['dust'] },
  onEnter: (c) => c.visited('owl') ? undefined
    : 'The Electric Owl ballroom, the afternoon after the Kaleidoscope Test: paper cups, feathers, one shoe, a ladder, a hall so wrecked it looks as if the party is still going on in a room next door you can\'t quite find. A kid up the ladder fiddles with a projector rig. On the stage, a woman with a voice like a freight train is running scales.',
  hotspots: [
    {
      id: 'kev', name: 'Kev on ladder', kind: 'person', shape: { rect: [640, 120, 110, 330] },
      verbs: {
        look: () => 'Kev "Kaleido" Malone: skinny, freckled, nineteen at the outside, up a ladder with a gel frame in his teeth. Every time the door bangs he nearly falls off.',
        talk: (c) => {
          if (c.flag('kevTalked')) return KEV.after;
          if (!(c.has('note') || c.has('photo'))) return KEV.noProof;
          c.set('kevTalked'); c.note('bruno'); c.note('key'); c.advance(3);
          return KEV.proof;
        },
        give: {
          photo: (c) => same(owl, 'kev', 'talk', c),
          note: (c) => same(owl, 'kev', 'talk', c),
          default: shown('Kev'),
        },
        hit: () => 'You\'d knock him off the ladder. He\'s nineteen. Pick on someone your own size, like Tiny. Actually, don\'t.',
      },
    },
    {
      id: 'projector', name: 'projector rig', shape: { rect: [770, 200, 160, 140] },
      verbs: {
        look: (c) => c.flag('lightShow')
          ? 'The oil wheel turns, and the far wall blooms magenta and electric blue: shapes that split and rejoin like cells, or rumours. It looks like the inside of something. It looks like the inside of your kaleidoscope.'
          : 'An overhead projector on a scaffold, a glass dish of coloured oils, and a little motor to turn a painted wheel in front of the lens. The heart of every light show in the Haight, switched off.',
        use: {
          none: (c) => {
            if (c.flag('lightShow')) return 'It\'s already running. The far wall is busy being a galaxy.';
            c.set('lightShow'); c.advance(5);
            return 'You flip the switch. The motor hums, the oil wheel turns, and the far wall blooms: magenta, electric blue, shapes that split and rejoin like cells under a microscope. "Hey, man, careful," says Kev, but he doesn\'t turn it off. The room looks the way it looked on Thursday. You have a feeling about the kaleidoscope.';
          },
          kaleidoscope: (c) => {
            if (!c.flag('lightShow')) return 'You look at the projector through the kaleidoscope. It\'s switched off: six switched-off projectors, turning slowly. Nothing comes back.';
            if (c.state.shards.includes(3)) return 'The light show through the kaleidoscope is so beautiful it\'s almost rude. Thursday has nothing more to say.';
            c.shard(3, SHARDS[3]);
            return 'You hold the kaleidoscope up to the light show: colour inside colour inside colour, the oil wheel turning one way and the mirrors the other, and somewhere in the middle of it, Thursday night opens like a door.';
          },
        },
        take: () => 'You can\'t carry a light show. Kev looks at you as if you tried.',
        hit: () => '"Don\'t touch my rig, man!" Kev nearly comes off the ladder.',
      },
    },
    {
      id: 'lu', name: 'Lu Fontaine', kind: 'person', shape: { rect: [260, 200, 120, 280] },
      verbs: {
        look: () => 'Lu Fontaine, front woman of Satchel & the Strays: sequins at four in the afternoon, a laugh that could stop traffic and a voice that could start it again.',
        talk: (c) => (c.flag('metLu') ? LU.after : (c.set('metLu'), LU.first)),
        give: { photo: () => LU.photo, default: shown('Lu') },
      },
    },
    {
      id: 'stage', name: 'stage', shape: { rect: [140, 340, 340, 140] },
      verbs: { look: () => 'The stage where the Kaleidoscope Test happened: gaffer tape, a broken tambourine, a single sandal standing upright as if its owner simply evaporated. Maybe they did. It was that kind of night.' },
    },
    {
      id: 'debris', name: 'party wreckage', shape: { rect: [380, 500, 400, 110] },
      verbs: {
        look: () => 'Paper cups, every one of them sticky. A punch bowl with a ladle and a crust. You do not drink from the punch bowl. You learned that lesson on Thursday; you just don\'t remember the class.',
        consume: () => 'You have some idea what was in that punch. You keep your mouth shut, literally.',
        take: () => 'None of this is evidence of anything except a very good time.',
      },
    },
    {
      id: 'stagedoor', name: 'stage door', kind: 'exit', shape: { rect: [40, 160, 90, 300] },
      verbs: { look: () => 'A steel door marked STAGE — NO EXIT. Behind it, the alley. Kev glances at it, then very carefully doesn\'t.' },
    },
  ],
  exits: [
    { to: 'haight', label: 'Haight St', minutes: 6, map: [50, 100] },
    { to: 'alley', label: 'Alley', hotspot: 'stagedoor', map: [0, 50] },
  ],
};

// ════════════════════════════════════════ 8. ALLEY ════════════════════════════════════════
const alley: Scene = {
  id: 'alley', name: 'Alley Behind the Owl',
  art: { placeholder: 'ALLEY BEHIND THE OWL', inks: inks('alley'), outdoor: true, effects: ['flicker'] },
  onEnter: (c) => {
    const base = c.visited('alley') ? '' : 'A brick alley that smells of beer, rain and worse. A dumpster overflowing with last night. A fire escape zigzagging up the wall like a nervous signature. ';
    if (isDisguised(c)) return base + 'By the stage door, a man the size of a refrigerator in a biker\'s jacket smokes and watches a hippie in purple shades. That\'s you. He looks away, bored, which is the nicest thing anyone has done for you all day.';
    return base + 'By the stage door, a man the size of a refrigerator in a biker\'s jacket lowers his cigarette and looks at you. Looks *at* you. His face goes from bored to interested, which on that face is a long and terrible journey. You should not be here looking like yourself.';
  },
  beforeAction: (c): HandlerResult => {
    if (isDisguised(c)) return undefined;
    if (leaving(c, 'owl', 'stagedoor') || c.verb === 'look') return undefined;
    c.die('tiny-recognize');
    return 'You move. So does the big man.';
  },
  hotspots: [
    {
      id: 'tiny', name: 'Tiny', kind: 'person', shape: { rect: [700, 140, 160, 380] },
      verbs: {
        look: () => 'Tiny. The name is a joke; the arms are not. His knuckles have words tattooed on them. You can read LOVE on the left. You decide not to read the right.',
        talk: () => '"Beat it, flower child," Tiny says, without looking at you. "Doc\'s orders. Nobody back here today." Doc. Kell. Tiny knows exactly whose muscle he is.',
        hit: (c) => c.die('tiny-hit'),
        give: {
          money: () => 'Tiny looks at your money the way a whale looks at a shrimp. "Keep walking."',
          default: () => '"I don\'t want nothing you got," Tiny says. It sounds like a threat because it is one.',
        },
      },
    },
    {
      id: 'dumpster', name: 'dumpster', shape: { rect: [240, 330, 270, 190] },
      verbs: {
        look: (c) => c.flag('gotKey') ? 'The dumpster. You\'ve already been in it. Your coat will be talking about it for weeks.' : 'An overflowing steel dumpster, lid half-open, last night spilling out of it. If a frightened kid had to hide something in a hurry, it\'d be right here.',
        open: (c) => {
          if (c.flag('gotKey')) return 'You\'ve found all the treasure this dumpster has to offer.';
          c.set('gotKey'); c.give('brasskey'); c.note('key');
          return 'You lift the lid and go in to the elbow, past paper cups, a feather boa and something that was once a sandwich and now has a philosophy. Your fingers close on metal: a brass key, heavy, a lotus stamped on the bow. Tiny glances over. A hippie, digging in the trash. He looks away.';
        },
        close: () => 'You lower the lid. The smell lowers itself more slowly.',
        go: () => 'You are not hiding in a dumpster. You have some pride left. Very little, but some.',
      },
    },
    {
      id: 'fireescape', name: 'fire escape', kind: 'exit', shape: { poly: [[560, 40], [680, 40], [680, 300], [560, 300]] },
      verbs: {
        look: () => 'A fire escape bolted to the wall with what appear to be thumbtacks. Rust has eaten the bottom rungs to lace. On the top landing, a pigeon with one bent tail feather is watching. Of course it is.',
        go: (c) => c.die('alley-fire-escape'),
        use: { none: (c) => c.die('alley-fire-escape') },
        take: () => 'You\'d pull it right off the wall, which tells you something.',
      },
    },
    {
      id: 'stagedoor', name: 'stage door', kind: 'exit', shape: { rect: [880, 170, 100, 330] },
      verbs: { look: () => 'The Owl\'s stage door, propped open with a brick. A caged bulb above it flickers as if trying to tell you something in a code it never learned.' },
    },
  ],
  exits: [{ to: 'owl', label: 'The Owl', hotspot: 'stagedoor', map: [100, 50] }],
};

// ════════════════════════════════════════ 9. PANHANDLE ════════════════════════════════════════
const panhandle: Scene = {
  id: 'panhandle', name: 'The Panhandle',
  art: { placeholder: 'THE PANHANDLE', inks: inks('panhandle'), outdoor: true },
  onEnter: (c) => {
    const base = c.visited('panhandle') ? '' : 'The Panhandle: a long strip of park under eucalyptus trees, the grass already filling with blankets. A wooden stage half-built at the far end, a wall of speakers rising behind it like a cathedral for people who don\'t believe in cathedrals. Bikers walk the edges. A folding table under a lotus banner hands out cream cards. ';
    if (isDisguised(c)) return base + 'By the trees, two men in bad sport coats scan the crowd. Their eyes pass over your shades and beads and keep going.';
    return base + 'By the trees, two men in bad sport coats scan the crowd. One of them stops scanning and nudges the other. They start walking your way, unhurried, the way cops walk when they already know how it ends.';
  },
  beforeAction: (c): HandlerResult => {
    if (isDisguised(c)) return undefined;
    if (leaving(c, 'haight') || leaving(c, 'lotus') || c.verb === 'look') return undefined;
    c.die('bruno-panhandle');
    return 'You take a moment too long. A hand lands on your elbow.';
  },
  hotspots: [
    {
      id: 'scaffold', name: 'stage scaffold', shape: { rect: [380, 120, 300, 260] },
      verbs: {
        look: (c) => c.state.shards.includes(5)
          ? 'The scaffold of the stage. Rain stood right there, yelling at you. You\'d give a great deal to be yelled at by her again.'
          : 'The bones of the stage: raw lumber and pipe, sawdust in the grass. You\'ve stood here before, recently. The smell of cut wood and eucalyptus knocks on a door somewhere in your head.',
        use: {
          kaleidoscope: (c) => {
            if (c.state.shards.includes(5)) return 'Six scaffolds turn in the kaleidoscope, empty. The argument is over. You lost it, beautifully.';
            c.shard(5, SHARDS[5]);
            return 'You look at the scaffold through the kaleidoscope. Lumber and sky break into six pieces, and in the middle of them, very clearly, somebody is shouting at you.';
          },
        },
        go: () => 'A biker steps into your path. "Crew only, flower." You step back.',
      },
    },
    {
      id: 'calder', name: 'Sky Calder', kind: 'person', shape: { rect: [140, 260, 120, 230] },
      verbs: {
        look: () => 'Sterling "Sky" Calder at the sound desk: wiry, wild-haired, a soldering iron behind his ear, tuning a wall of speakers like a cathedral organ. The most famous underground chemist in California, and what he\'s worried about is the bass.',
        talk: (c) => (c.flag('calderAlly') ? CALDER.ally : CALDER.first),
        give: {
          slip: (c) => { c.set('calderAlly'); c.note('calder'); return CALDER.proof; },
          tab: () => '"That\'s not mine," Calder says, without touching it. "Get it tested. Then come back and tell me who\'s wearing my name."',
          photo: () => '"The Whitcombe girl. She found me Thursday at the Owl, shouting about crates. I thought she was high. I was high. I\'m sorry, man." He means it.',
          default: shown('Calder'),
        },
      },
    },
    {
      id: 'speakers', name: 'speaker wall', shape: { rect: [700, 70, 260, 370] },
      verbs: { look: () => 'A wall of speaker cabinets three storeys high, stacked, strapped and wired by hand. When the Morning Ghosts start, people in Oakland will feel it in their fillings and not know why they\'re smiling.' },
    },
    pigeon({ rect: [800, 30, 50, 38] }, 'on top of the speaker wall'),
    {
      id: 'volunteer', name: 'Lotus volunteer', kind: 'person', shape: { rect: [40, 380, 150, 150] },
      verbs: {
        look: () => 'A folding table under a lotus banner. Behind it, a girl with flowers in her hair and a smile pinned on like a name badge, handing out cream cards.',
        talk: (c) => {
          if (c.has('card') || c.flag('admitted')) return '"You\'re already a Seeker, brother," she says. "Go in peace. Come to the house. The Doctor would love to meet you."';
          c.give('card'); c.note('card');
          return '"Welcome, Seeker!" She presses a cream card into your hand. "The Lotus Foundation offers free consciousness therapy at our house on Masonic. Show this at the door. And tonight, at sundown," she leans in, "there are gifts."';
        },
        give: { default: () => '"Oh, we don\'t take anything," she says. "We only give."' },
      },
    },
    {
      id: 'saints', name: 'bikers', kind: 'person', shape: { rect: [290, 400, 160, 140] },
      verbs: {
        look: () => 'Bikers doing security: leather, beards, folded arms. They keep the stage clear and the crowd happy, and have no idea what one of their own is mixed up in.',
        talk: () => '"Tiny?" one says. "Ain\'t seen him all week. Moonlighting for some doctor." He spits, thoughtfully. "The club don\'t like that."',
        hit: () => 'There are eleven of them. You count twice to be sure. You keep your hands to yourself.',
      },
    },
    {
      id: 'narcs', name: 'men in sport coats', kind: 'person', shape: { rect: [880, 450, 110, 140] },
      verbs: {
        look: () => 'Two men in sport coats so bad they must be government issue. Bruno\'s people. They\'re watching the crowd, the Lotus table and the street, in that order.',
        talk: (c) => { c.die('bruno-panhandle'); return 'You stroll up to Bruno\'s men. You\'ve always been brave. That\'s one word for it.'; },
        hit: (c) => { c.die('bruno-panhandle'); return 'You swing at a cop in front of two hundred witnesses.'; },
      },
    },
    {
      id: 'crowd', name: 'crowd', shape: { rect: [460, 420, 400, 120] },
      verbs: { look: () => 'Blankets, babies, dogs, a man with a bubble machine. Hundreds already, thousands by sundown. Every one of them is about to be offered a free gift, and every one of them is going to say thank you.' },
    },
  ],
  exits: [
    { to: 'haight', label: 'Haight St', minutes: 8, map: [0, 50] },
    { to: 'lotus', label: 'Masonic Ave', minutes: 6, map: [100, 50] },
  ],
};

// ════════════════════════════════════════ 10. LOTUS EXTERIOR ════════════════════════════════════════
function lotusKnock(c: Ctx): string {
  return c.has('card')
    ? 'The door opens on a serene young woman in white with bare feet and a teapot. Sister Dawn. "Welcome, Seeker," she says. "Your card?"'
    : 'The door opens on a serene young woman in white with bare feet and a teapot. "Welcome, friend. The Foundation receives Seekers. Have you been given your card?" You haven\'t. "The table in the Panhandle," she says kindly, and the door closes, kindly.';
}
function lotusAdmit(c: Ctx): string {
  if (c.flag('admitted')) { c.go('parlor'); return 'Sister Dawn lets you back in with exactly the same smile, as if it were the first time. For her, perhaps it is.'; }
  c.set('admitted'); c.go('parlor'); c.cost(4);
  return 'Sister Dawn takes the card, studies it, and gives you a smile like warm milk. "Welcome, Seeker. The Doctor is resting upstairs. Go through to the parlor. Sister Rain will bring you tea."';
}

const lotus: Scene = {
  id: 'lotus', name: 'Lotus Foundation',
  art: { placeholder: 'LOTUS FOUNDATION, MASONIC AVE', inks: inks('lotusExt'), outdoor: true },
  onEnter: (c) => c.visited('lotus') ? undefined
    : 'The Lotus Foundation: a grand Victorian on Masonic painted gold and plum, a lotus mandala spread across the whole façade like a flower about to swallow the house. Prayer flags in a garden too perfect to trust. Wide steps up to a carved front door, and down the side, a cellar door with a heavy padlock.',
  hotspots: [
    {
      id: 'house', name: 'mandala façade', shape: { rect: [250, 20, 500, 260] },
      verbs: { look: () => 'A lotus mandala painted across the whole front of the house, every petal perfect. It\'s the most beautiful thing you\'ve seen all day. You trust it about as far as you could throw the house.' },
    },
    {
      id: 'frontdoor', name: 'front door', kind: 'exit', shape: { rect: [440, 300, 120, 240] },
      verbs: {
        look: () => 'A carved front door with a brass lotus knocker. A small card in the window: SEEKERS WELCOME. PLEASE PRESENT YOUR CARD.',
        hit: (c) => lotusKnock(c),
        talk: (c) => lotusKnock(c),
        open: (c) => (c.flag('admitted') ? undefined : lotusKnock(c)),
        give: { card: (c) => lotusAdmit(c), default: () => 'Sister Dawn smiles at it serenely. "Your Seeker card, brother. Only that."' },
        use: { card: (c) => lotusAdmit(c), brasskey: () => 'The key doesn\'t fit the front door. Wrong door, Frank. Think like a cellar.' },
      },
    },
    {
      id: 'cellar', name: 'cellar door', kind: 'exit', shape: { poly: [[780, 430], [960, 430], [990, 560], [760, 560]] },
      verbs: {
        look: (c) => c.flag('cellarOpen') ? 'The cellar door, padlock hanging open. Stone steps go down into the dark.' : 'Slanted cellar doors with a heavy padlock. The padlock has a little lotus stamped on it. Some people brand everything, even their secrets.',
        open: (c) => c.flag('cellarOpen') ? 'It\'s open.' : 'Padlocked. The lock has a lotus on it.',
        use: {
          brasskey: (c) => {
            if (c.flag('cellarOpen')) return 'Already unlocked.';
            c.set('cellarOpen');
            return 'The brass key slides in as if it had been waiting all week. The padlock opens. You ease the cellar door up: cool air, stone steps, and a smell like a chemistry class that went to a very bad party.';
          },
          knife: () => 'A butter knife against a padlock. The padlock wins on points.',
        },
        hit: () => 'You\'d bring the whole house out. Quietly is the only way in.',
      },
    },
    {
      id: 'garden', name: 'garden', shape: { rect: [40, 330, 330, 230] },
      verbs: { look: () => 'Raked gravel, prayer flags and a stone Buddha with a lotus in its lap. Not a single weed, anywhere, in the Haight-Ashbury. That alone ought to be illegal.' },
    },
  ],
  exits: [
    { to: 'haight', label: 'Haight St', minutes: 8, map: [0, 70] },
    { to: 'panhandle', label: 'Panhandle', minutes: 6, map: [0, 20] },
    { to: 'parlor', label: 'Front door', hotspot: 'frontdoor', map: [50, 0], guard: (c) => (c.flag('admitted') ? undefined : lotusKnock(c)) },
    { to: 'lab', label: 'Cellar', hotspot: 'cellar', map: [100, 70], guard: (c) => (c.flag('cellarOpen') ? undefined : 'Padlocked. You need the right key.') },
  ],
};

// ════════════════════════════════════════ 11. PARLOR ════════════════════════════════════════
function wakeRain(c: Ctx): string {
  if (c.flag('rainAwake')) return '"I\'ve seen enough of the inside of that thing for one lifetime," Rain says. "Thanks for looking after it."';
  c.set('rainAwake'); c.note('rainAwake'); c.advance(5);
  return RAIN.wake;
}

const parlor: Scene = {
  id: 'parlor', name: 'The Lotus Parlor',
  art: { placeholder: 'LOTUS FOUNDATION PARLOR', inks: inks('parlor'), effects: ['drapes'] },
  onEnter: (c) => c.visited('parlor') ? undefined
    : 'A Victorian parlor made over as a temple: cushions, candles, stained glass throwing gold and plum across the floor. A carved desk by the window. A narrow door at the back with a brass lock. And at the low table, in a white dress, pouring tea slowly and carefully, the way you\'d pour a river back into its bed: Rain.',
  hotspots: [
    {
      id: 'rain', name: (s) => (s.flags.rainAwake ? 'Rain' : 'Sister Rain'), kind: 'person', shape: { rect: [300, 250, 160, 240] },
      verbs: {
        look: (c) => c.flag('rainAwake')
          ? 'Rain: pale, furious, entirely herself. She\'s eyeing the fireplace tools in a way that would worry a fireplace.'
          : 'Rain, in white, a paper lotus pinned to her dress: the girl from the photo, with the laughing poured out of her and something pleasant poured in. "You have a kind face," she says. "Have we met?" You have. On Thursday she called you a square, a fascist and, near the end, a sweetheart, in that order. Today you\'re a kind face. Somewhere in the house a clock ticks twice for every second, as if it\'s in a hurry to get to tomorrow.',
        talk: (c) => (c.flag('rainAwake') ? RAIN.awake : RAIN.dosed),
        give: {
          kaleidoscope: wakeRain,
          photo: () => '"What a pretty girl," Sister Rain says, studying her own face. "She looks like she has a lot of opinions." She hands it back.',
          default: () => '"How kind," Sister Rain says, and gives it back, the way you\'d return a stranger\'s glove.',
        },
        use: { kaleidoscope: wakeRain, default: () => 'That won\'t bring her back. Something of hers might.' },
        hit: () => 'No. Not in a hundred lifetimes.',
        take: () => 'You couldn\'t carry her past the door without waking the house. And she doesn\'t know you. She\'d scream, politely.',
      },
    },
    {
      id: 'desk', name: 'Kell\'s desk', shape: { rect: [640, 240, 220, 200] },
      verbs: {
        look: (c) => c.has('ledger') ? 'Kell\'s desk, lighter by one ledger.' : 'A carved writing desk: fountain pen, blotter, a framed diploma from Stanford, and a slim ledger bound in oxblood leather.',
        open: () => 'The drawers hold prescription pads, very good stationery, and a photograph of Kell shaking hands with a man in a gray suit whose face is turned away. On the back, in pencil: *G., 1959.* There\'s a second photograph, of a second man in a gray suit, also turned away. Also marked *G.*',
      },
    },
    {
      id: 'ledger', name: 'ledger', shape: { rect: [700, 230, 80, 40] },
      visible: (s) => !s.inventory.includes('ledger'),
      verbs: {
        look: () => 'A slim ledger in oxblood leather. Accountants and villains both love a good ledger. It\'s one of the few things they agree on.',
        take: (c) => {
          c.give('ledger'); c.note('ledger');
          return 'You slide the ledger into your coat while Sister Rain is looking at the teapot. You open it a crack: *R.B. — $500. R.B. — $500. R.B. — $1,000 (Sat.).* R.B. You used to share a coffee pot with a man with those initials.';
        },
        open: (c) => same(parlor, 'ledger', 'take', c),
      },
    },
    {
      id: 'teapot', name: 'teapot', shape: { rect: [480, 400, 80, 70] },
      verbs: {
        look: () => 'A brass teapot on a low table, two cups poured, steam curling. It smells of jasmine, and of something under the jasmine. You remember a line in green ink, underlined twice.',
        consume: (c) => c.die('tea'),
        take: (c) => c.die('tea'),
      },
    },
    {
      id: 'basementdoor', name: 'basement door', kind: 'exit', shape: { rect: [880, 160, 100, 340] },
      verbs: {
        look: (c) => c.flag('basementOpen') ? 'The basement door stands open. Stone steps go down into the cold.' : 'A narrow door at the back with a brass lock and a lotus on the keyhole plate. You\'ve seen that lotus before, on a key.',
        open: (c) => c.flag('basementOpen') ? 'It\'s open.' : 'Locked.',
        use: {
          brasskey: (c) => {
            if (c.flag('basementOpen')) return 'It\'s already unlocked.';
            c.set('basementOpen');
            return 'The brass key turns sweet as you like. The basement door opens on stone steps and cold air that smells faintly of burnt sugar.';
          },
        },
      },
    },
    {
      id: 'cushions', name: 'cushions', shape: { rect: [60, 500, 400, 100] },
      verbs: { look: () => 'Silk cushions in a circle. Kids sit here, Rain told you once, while the Doctor explains the universe and someone takes notes.', go: () => 'You don\'t sit. If you sit, you\'ll be offered tea.' },
    },
  ],
  exits: [
    { to: 'lotus', label: 'Front door', map: [0, 50] },
    { to: 'lab', label: 'Basement', hotspot: 'basementdoor', map: [100, 70], guard: (c) => (c.flag('basementOpen') ? undefined : 'The basement door is locked. The lock has a lotus on it.') },
  ],
};

// ════════════════════════════════════════ 12. BASEMENT LAB ════════════════════════════════════════
const burnCrates = (c: Ctx): HandlerResult => {
  if (c.flag('burned')) return 'The crates are already burning, very nicely.';
  if (!c.flag('cratesOpen')) return 'The crates are nailed shut. You can\'t burn what you can\'t get at. Well, you could, but it would take all night and the fire brigade.';
  if (!c.flag('furnaceOpen')) return 'The furnace door is shut. You\'d just be stacking crates against cold iron.';
  c.set('burned'); c.set('climax');
  const lines = ['You drag the crates over and feed them into the furnace one after another. The foil curls, the blue tabs blacken, and five thousand free gifts go up the chimney of a house on Masonic Avenue. It smells like burnt sugar and, very faintly, of justice.',
    'Footsteps on the stairs. Dr. Ambrose Kell comes down one step at a time, like a man lowering himself into a warm bath: cardigan, leather elbow patches, your .38 held the way other men hold a fountain pen. He looks at the fire, and then at you.'];
  if (c.flag('admitted') && !c.flag('rainAwake')) {
    lines.push('"Mr. Tolliver," he says, with real warmth. "Sister Dawn told me a Seeker came in with a policeman\'s face." He doesn\'t say anything else. He doesn\'t need to.');
    c.die('kell-shot');
    return lines;
  }
  if (c.flag('rainAwake')) {
    lines.push('"Mr. Tolliver," he says, with real warmth. "You\'re supposed to be asleep. Everyone is supposed to be asleep." Behind him, at the top of the stairs, something moves that isn\'t a shadow. It\'s Rain, with a fire iron in both hands. Keep him talking.');
  } else {
    lines.push('He hasn\'t seen you. You\'re in the shadow behind the empty crates, and he\'s staring at the fire like a man watching his career go up a chimney. The cellar door is three steps behind you.');
  }
  return lines;
};

const lab: Scene = {
  id: 'lab', name: 'Basement Lab',
  art: { placeholder: 'BASEMENT LAB', inks: inks('lab'), effects: ['flicker'] },
  onEnter: (c) => c.visited('lab') ? undefined
    : 'A stone basement made over into a laboratory: glassware and tubing on a workbench, a single bulb swinging slightly though there is no draught, and against the wall, crates. Dozens, stencilled MEDICAL SUPPLIES. Beside them squats an iron coal furnace the size of a car, and a gas line runs to it with a red valve wheel.',
  beforeAction: (c): HandlerResult => {
    if (!c.flag('climax')) return undefined;
    if (c.verb === 'look') return undefined;
    if (c.flag('rainAwake')) {
      if (c.verb === 'talk' && c.target === 'kell') return undefined;
      c.die('kell-shot');
      return 'You move. Kell doesn\'t like it.';
    }
    if (leaving(c, 'lotus', 'cellardoor')) {
      c.win('lonely');
      return 'You back up the cellar steps one at a time, into the evening, and lower the cellar door as softly as a coffin lid. Behind you, the furnace roars like applause in another room.';
    }
    c.die('kell-shot');
    return 'You move. He hears it.';
  },
  hotspots: [
    {
      id: 'crates', name: 'crates', shape: { rect: [60, 200, 320, 320] },
      verbs: {
        look: (c) => c.flag('burned') ? 'Empty crates and curled foil. The rest is smoke, going up into the evening to become weather.' : c.flag('cratesOpen')
          ? 'The lids are off. Foil packets, thousands of them, each holding a blue tab with a lightning bolt. Enough for every kid in the Panhandle to forget they were ever there.'
          : 'Wooden crates stencilled MEDICAL SUPPLIES — FRAGILE, nailed shut, stacked higher than your head.',
        open: (c) => {
          if (c.flag('cratesOpen')) return 'They\'re open. You don\'t need to look twice.';
          c.set('cratesOpen');
          return 'You find a pry bar on the workbench and work the lids off one after another. Foil packets, blue tabs, lightning bolts: five thousand counterfeit miracles, packed with great care, like eggs.';
        },
        use: { none: burnCrates, default: () => 'Just get them into the fire.' },
        take: burnCrates,
        consume: (c) => c.die('blue-tab'),
      },
    },
    {
      id: 'furnace', name: 'furnace', shape: { rect: [420, 200, 260, 320] },
      verbs: {
        look: (c) => c.flag('furnaceOpen') ? 'The furnace door hangs open on a bed of red coals. It looks hungry, in a patient way.' : 'An iron coal furnace the size of a car, door shut, warm to the touch: the heart of the house, banked low and thinking.',
        open: (c) => {
          if (c.flag('furnaceOpen')) return 'It\'s open. The coals are waiting.';
          c.set('furnaceOpen');
          return 'You wrap your hand in your coat and swing the furnace door open. Heat rolls out like a big friendly dog. Red coals, banked and patient.';
        },
        close: (c) => { c.set('furnaceOpen', false); return 'You swing the furnace door shut.'; },
        use: { none: burnCrates },
      },
    },
    {
      id: 'valve', name: 'gas valve', shape: { rect: [700, 300, 70, 90] },
      verbs: {
        look: () => 'A gas line running to the furnace with a red valve wheel. A tag wired to it in a careful hand: DO NOT OPEN — PILOT LIT. Somebody, somewhere, thought of you.',
        open: (c) => c.die('gas-valve'),
        use: { none: (c) => c.die('gas-valve'), default: (c) => c.die('gas-valve') },
        hit: (c) => c.die('gas-valve'),
        close: () => 'It\'s already closed. Keep it that way. Keep it that way forever.',
      },
    },
    {
      id: 'glassware', name: 'glassware', shape: { rect: [700, 160, 260, 120] },
      verbs: {
        look: () => 'Flasks, condensers and a rotary evaporator: a pharmaceutical setup, government quality. Kell didn\'t buy this with donations from barefoot teenagers.',
        hit: () => 'Smashing it would feel wonderful and stop nothing. The crates are the problem.',
        take: () => 'Evidence is good, but you can\'t carry a laboratory up the stairs.',
      },
    },
    {
      id: 'stairs', name: 'stairs up', kind: 'exit', shape: { rect: [800, 400, 180, 200] },
      visible: (s) => !!s.flags.basementOpen,
      verbs: { look: () => 'Stone steps up to the parlor.' },
    },
    {
      id: 'cellardoor', name: 'cellar door', kind: 'exit', shape: { rect: [40, 40, 200, 110] },
      verbs: { look: () => 'The slanted cellar door, a line of evening light underneath it like a promise somebody might keep.' },
    },
    {
      id: 'kell', name: 'Dr. Kell', kind: 'person', shape: { rect: [820, 140, 130, 330] },
      visible: (s) => !!s.flags.climax,
      verbs: {
        look: () => 'Dr. Ambrose Kell: silver hair, cardigan, a voice like warm velvet, and your .38 held loose and steady in his right hand. Behind the kind eyes, nothing at all, very neatly arranged.',
        talk: (c) => {
          if (!c.flag('rainAwake')) return undefined;
          c.win(rainEnding(c.state));
          return ['"You know what\'s funny, Doc?" you say. "Three days ago I didn\'t even know your name." Kell smiles. "And in a moment you won\'t know your own. Memory is a wound, Mr. Tolliver. I\'m a doctor. I close wounds. Science requires—"',
            'The fire iron makes a sound against the back of his head like a dropped melon. Dr. Kell sits down on the stairs, then lies down on them, carefully, as if he had planned to all along. Your .38 clatters onto the stone. Rain stands over him, white-knuckled. "Science," she says, "requires you to shut up."',
            'You pick up your gun. It feels like an old friend who has been somewhere he won\'t talk about. Up in the parlor window, a pigeon with one bent tail feather takes off into the dusk.'];
        },
        hit: (c) => c.die('kell-shot'),
      },
    },
  ],
  exits: [
    { to: 'parlor', label: 'Parlor', hotspot: 'stairs', map: [100, 20], visible: (s) => !!s.flags.basementOpen },
    { to: 'lotus', label: 'Cellar door', hotspot: 'cellardoor', map: [0, 20], guard: (c) => (c.flag('cellarOpen') ? undefined : (c.set('cellarOpen'), undefined)) },
  ],
};

export const scenes: Record<string, Scene> = {
  attic, landing, studio, haight, thirdeye, clinic, owl, alley, panhandle, lotus, parlor, lab,
};
