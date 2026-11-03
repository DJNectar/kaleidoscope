import type { Ctx, Handler, HandlerResult, Scene } from '../../engine/types';
import { CALDER, HANK, KEV, LU, MOONDOG, RAIN, SHARDS } from './dialogue';
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
  if (c.with === 'photo') return `${who} looks at the photo of Rain and shakes their head. "Pretty girl. Haven't seen her. Today."`;
  if (c.with === 'money') return `${who} eyes your money. "Put that away before somebody else sees it."`;
  return undefined;
};
/** Re-use another hotspot's handler, looked up by id at call time. */
function same(scene: Scene, id: string, verb: 'look' | 'take' | 'talk' | 'hit', c: Ctx): string {
  const r = scene.hotspots.find((h) => h.id === id)?.verbs[verb]?.(c);
  return Array.isArray(r) ? r.join(' ') : r ?? '';
}
const leaving = (c: Ctx, exitTo: string, hotspot?: string) =>
  (c.verb === 'go' && (c.target === `exit:${exitTo}` || (hotspot !== undefined && c.target === hotspot)));

// ════════════════════════════════════════ 1. ATTIC ════════════════════════════════════════
const attic: Scene = {
  id: 'attic', name: 'The Attic',
  art: { placeholder: 'ATTIC CRASH PAD', inks: inks('attic'), effects: ['dust'] },
  onEnter: (c) => (c.visited('attic') ? 'The attic. It still smells of patchouli and somebody else\'s bad decisions.' : undefined),
  hotspots: [
    {
      id: 'mattress', name: 'mattress', shape: { poly: [[260, 520], [640, 505], [700, 600], [230, 615]] },
      verbs: {
        look: (c) => {
          if (c.flag('foundPage')) return 'A bare mattress with a you-shaped dent in it. Nothing else under there but dust and regret.';
          c.set('foundPage'); c.set('stakesKnown'); c.give('page'); c.note('stakes');
          return 'A bare mattress on bare boards, a you-shaped dent in the middle. You lift a corner out of old habit. Underneath, folded small, is a page torn from a notebook. Your notebook. Your handwriting.';
        },
        take: () => 'You\'ve carried heavier things out of worse rooms, but not today.',
        open: (c) => same(attic, 'mattress', 'look', c),
        hit: () => 'You punch the mattress. It forgives you instantly. Must be nice.',
        consume: () => 'You\'ve been hungry. Never that hungry.',
        go: () => 'You\'ve slept enough for one week. Three days, by the look of things.',
      },
    },
    {
      id: 'window', name: 'tie-dye curtain', shape: { rect: [430, 110, 140, 165] },
      verbs: {
        look: () => 'A tie-dyed curtain, orange and purple spirals, holding back a sun that comes through anyway like it\'s got a warrant. Behind it, a small window onto a fire escape and the backs of the Victorians on Ashbury.',
        open: (c) => { c.set('curtainOpen'); return 'You pull the curtain aside. Light hits you like a bill collector. Outside, a fire escape, painted to match the house: lovely, wrought-iron and lacy. Four floors down, a garden.'; },
        close: (c) => { c.set('curtainOpen', false); return 'You draw the curtain. The room goes orange and purple again. Your headache approves.'; },
        go: (c) => c.die('attic-window'),
        use: { none: (c) => c.die('attic-window'), knife: () => 'The window isn\'t locked. That\'s not the problem with the window.' },
        hit: () => 'You don\'t need to break anything else today. Least of all yourself.',
        take: () => 'You consider taking the curtain as a disguise. You\'d look like a Roman senator at a love-in.',
      },
    },
    {
      id: 'coat', name: 'coat on chair', shape: { poly: [[140, 330], [280, 330], [290, 500], [130, 500]] },
      visible: (s) => !s.flags.coatTaken,
      verbs: {
        look: () => 'Your trench coat, folded over a kitchen chair with more care than you\'d have given it. Something weighs down the pockets.',
        take: (c) => {
          c.set('coatTaken'); c.give('photo'); c.give('matchbook'); c.give('money');
          return 'You shrug the coat on. It\'s rumpled like it slept harder than you did. In the pockets: a snapshot of a girl with ironed-straight hair, a matchbook from the Electric Owl, and seven dollars. Your .38 is not in the pockets. Your .38 is not anywhere.';
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
          if (c.flag('foundLicence')) return 'Your hat, gray felt, a sweat-stain on the band like a map of every bad decision you\'ve made in it.';
          c.set('foundLicence'); c.give('licence'); c.note('self');
          c.shard(1, SHARDS[1]);
          return 'Your hat. Somebody hung it up for you, which is more courtesy than you\'ve had all week. Something stiff is tucked in the hatband: your private investigator\'s licence. **FRANCIS X. TOLLIVER.** Frank. That\'s you. It comes back the way your feet come back after you\'ve sat on them, all pins and needles.';
        },
        take: (c) => {
          const extra = c.flag('foundLicence') ? [] : [same(attic, 'fedora', 'look', c)];
          c.set('hatOn');
          return [...extra, 'You put the hat on. Now you\'re a detective. Of sorts.'];
        },
        consume: () => 'You\'ve threatened to eat your hat before. You\'ve never once followed through.',
      },
    },
    {
      id: 'toast', name: 'plate of toast', shape: { rect: [540, 480, 100, 36] },
      verbs: {
        look: (c) => c.has('knife') ? 'Two slices of toast that have given up. The butter knife is gone. You\'re the one who took it, so don\'t look at the toast like that.' : 'Two slices of toast that have given up, and a butter knife lying across the plate like a body in a doorway.',
        consume: () => 'You bite the toast. The toast bites back. It\'s been here since at least Thursday. You put it down with respect.',
        take: (c) => {
          if (c.has('knife')) return 'Leave the toast. The toast has suffered enough.';
          c.give('knife');
          return 'You leave the toast and take the butter knife. Thin blade, rounded tip. You\'ve opened worse doors with less.';
        },
      },
    },
    {
      id: 'door', name: 'door', kind: 'exit', shape: { poly: [[700, 190], [800, 215], [800, 545], [700, 505]] },
      verbs: {
        look: (c) => c.flag('atticOpen') ? 'The attic door, unlatched. Stairs going down.' : 'A paneled door with no handle on this side and a keyhole full of paint. Locked from the outside. Somebody wanted you to sleep in.',
        open: (c) => c.flag('atticOpen') ? 'It\'s open. The stairs go down. So does your mood.' : 'Locked from the outside. You rattle it. It rattles back.',
        hit: () => 'You thump the door. Somewhere below, someone shouts "Bummer, man!" and turns their record up.',
        talk: () => '"Hello?" you call through the door. The house answers with a sitar, very far away.',
        use: {
          knife: (c) => {
            if (c.flag('atticOpen')) return 'It\'s already open. You put the knife away, slightly disappointed.';
            c.set('atticOpen');
            return 'You slide the butter knife into the gap and work it up under the latch. The old trick. The latch gives with a click that sounds like an apology. The door swings open on a narrow stair.';
          },
          licence: () => 'Credit-carding a lock with your licence works in the pictures. In real life the licence bends and the lock laughs.',
          default: () => 'That won\'t open it. You need something thin and stiff.',
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
    : 'A narrow landing that smells of incense, cabbage and turpentine. Peeling wallpaper, a bare bulb, a radiator wearing a flyer like a hat. One door on this floor has a giant painted eye on it, and the eye is looking at you.',
  hotspots: [
    {
      id: 'flyer', name: 'flyer on radiator', shape: { rect: [90, 360, 160, 120] },
      verbs: {
        look: () => 'A hand-printed flyer: **FREE GATHERING — THE PANHANDLE — SUNDOWN SATURDAY — THE MORNING GHOSTS — gifts of peace from the LOTUS FOUNDATION.** Gifts. Free. Sundown. You feel the hair on your neck stand up and take notes.',
        take: () => 'You leave it. Half the telephone poles in the Haight are wearing the same one.',
        consume: () => 'You\'re not a goat. Not yet.',
      },
    },
    {
      id: 'radiator', name: 'radiator', shape: { rect: [80, 470, 190, 90] },
      verbs: {
        look: () => 'Iron radiator, painted silver, cold. August in San Francisco: it\'ll be on by four in the afternoon any day now.',
        hit: () => 'CLANG. The radiator sings a single note. Somebody downstairs yells, "Heavy!"',
      },
    },
    {
      id: 'eyedoor', name: 'Moondog\'s door', kind: 'exit', shape: { poly: [[560, 150], [700, 160], [700, 540], [560, 520]] },
      verbs: {
        look: () => 'A door painted with one enormous eye, iris made of tiny swirling galaxies. Under it, in small letters: *MOONDOG — POSTERS — KNOCK LIKE YOU MEAN IT.*',
        open: (c) => c.flag('moondogOpen') ? 'The door\'s on the latch now. Moondog trusts you that far.' : 'Locked. Behind it, someone stops breathing.',
        hit: (c) => {
          if (c.flag('moondogOpen')) return 'You knock again. "It\'s open, man," says the door.';
          c.set('moondogOpen'); c.go('studio');
          return 'You knock like you mean it. A long silence, three locks, one chain, and an eye, a real one this time, bloodshot. "Oh, man," says the eye. "Frank." The door opens wide enough for a man to slip through, and you do.';
        },
        talk: (c) => same(landing, 'eyedoor', 'hit', c),
        use: { knife: () => 'You could pick it. Or you could knock, like a person.' },
      },
    },
    {
      id: 'stairsup', name: 'stairs up', kind: 'exit', shape: { rect: [800, 60, 160, 200] },
      verbs: { look: () => 'Back up to the attic. Not much up there but toast.' },
    },
    {
      id: 'stairsdown', name: 'stairs down', kind: 'exit', shape: { poly: [[760, 300], [980, 300], [980, 625], [720, 625]] },
      verbs: { look: () => 'Steep stairs down to the front door and Ashbury Street. Late sun on the bottom steps.' },
    },
    {
      id: 'bulb', name: 'bare bulb', shape: { rect: [380, 20, 60, 80] },
      verbs: {
        look: () => 'A single bare bulb, burning in the daytime. Somebody here is very afraid of the dark.',
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
    : 'Moondog\'s flat is a print shop with a bed somewhere under it. Silkscreen frames lean against every wall, posters dry on clotheslines strung corner to corner, and a black curtain in the corner leaks red light like a wound.',
  hotspots: [
    {
      id: 'moondog', name: 'Moondog', kind: 'person', shape: { rect: [420, 200, 140, 340] },
      verbs: {
        look: () => 'Moondog: thin, barefoot, paint to the elbows, eyes that keep checking the window. He\'s the kind of paranoid that turns out to be right a little too often.',
        talk: (c) => {
          if (c.flag('gotEnvelope')) return MOONDOG.after;
          c.note('moondog');
          if (!c.flag('metMoondog')) { c.set('metMoondog'); return MOONDOG.first; }
          return MOONDOG.again;
        },
        give: {
          photo: (c) => moondogPhoto(c),
          licence: () => '"A licence," Moondog says. "Great. The government says you\'re you. That\'s the last people I\'d ask."',
          tab: () => 'Moondog backs into a drying rack. "Don\'t bring that near me, man. I know what it is. I printed the posters for the party it\'s going to."',
          default: shown('Moondog'),
        },
        use: { photo: (c) => moondogPhoto(c) },
        hit: () => 'He\'s already frightened. You\'re not going to be the man who makes it worse.',
      },
    },
    {
      id: 'posters', name: 'drying posters', shape: { rect: [80, 40, 840, 120] },
      verbs: {
        look: () => 'Posters hanging to dry like laundry: the Morning Ghosts in melting letters, a lotus spilling light over the Panhandle. "The Lotus Foundation paid good," Moondog says without looking. "Cash. Too good. I should\'ve known."',
        take: () => '"Those are wet, man!"',
      },
    },
    {
      id: 'frames', name: 'silkscreen frames', shape: { rect: [60, 280, 260, 260] },
      verbs: { look: () => 'Wooden frames stretched with silk, stencils of eyes and flowers and one, half-finished, of a skull wearing a halo. Moondog\'s working through some things.' },
    },
    {
      id: 'darkroom', name: 'darkroom curtain', shape: { rect: [700, 190, 170, 330] },
      verbs: {
        look: () => 'A heavy black curtain, red light leaking from behind it.',
        open: () => '"Not the darkroom, man!" You let the curtain fall. Somewhere behind it, a print is quietly ruined.',
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
        look: () => 'A green glass bottle labelled GINGER ALE in grease pencil. It\'s flat. It has the faint chemical tang of a darkroom. You\'re very thirsty.',
        consume: (c) => c.die('fixer'),
        take: () => 'Moondog watches you reach for it. "That\'s... yeah, okay, sure, man." You put it back. Something about his face.',
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
    : 'Haight and Ashbury, four o\'clock on a Saturday in the summer everyone will lie about later. Painted Victorians, awnings, a tree throwing lace shadows across the road. A flower-painted microbus sits at the curb with a man on its roof preaching to a dog. Down the block, where the fog is rolling in, a gray Plymouth sits in the shade with its engine off and its driver on.',
  hotspots: [
    {
      id: 'street', name: 'Haight Street traffic', shape: { poly: [[210, 470], [1000, 470], [1000, 625], [200, 625]] },
      verbs: {
        look: () => 'Haight Street traffic: tour buses, motorcycles, a painted bus doing thirty with flowers wired to its bumper. Nobody here has ever heard of a speed limit, or of pedestrians.',
        go: (c) => c.die('bus'),
        use: { none: (c) => c.die('bus') },
      },
    },
    {
      id: 'bus', name: 'microbus Elsewhere', shape: { poly: [[388, 315], [415, 300], [650, 300], [690, 345], [699, 432], [660, 456], [420, 445], [385, 420]] },
      verbs: {
        look: () => 'A microbus painted by people who saw God and wanted to show you the colours: orange daisies, teal swirls, eyes on the hubcaps. ELSEWHERE is lettered along the roof rack. A cardboard destination sign in the windshield reads FURTHER.',
        go: () => '"No riders today, brother!" Hank calls down. "Elsewhere is closed for repairs. Elsewhere is always closed for repairs."',
        open: () => 'The side door slides open with a sigh and a smell of sandalwood. Inside: a mattress, two guitars, a typewriter. You decline, politely.',
      },
    },
    {
      id: 'hank', name: 'Hank Delacroix', kind: 'person', shape: { rect: [455, 240, 130, 62] },
      verbs: {
        look: () => 'Hank Delacroix, the novelist, ringleader of the Electric Jesters, sitting cross-legged on the bus\'s roof rack in a flag shirt and a top hat, talking to anyone in range and several people who aren\'t.',
        talk: (c) => { if (c.flag('metHank')) return HANK.again; c.set('metHank'); return HANK.first; },
        give: {
          photo: () => '"The Whitcombe girl! Sharp as a tack and twice as dangerous. She was asking for Sky Calder all night Thursday. Try the Panhandle, brother. Sky\'s building the sound."',
          tab: () => 'Hank looks at the blue tab and, for once in his life, stops talking. "Where\'d you get that." It isn\'t a question. "Sky doesn\'t press on foil. Never has. Somebody\'s wearing his face."',
          default: shown('Hank'),
        },
      },
    },
    {
      id: 'busker', name: 'busker', kind: 'person', shape: { rect: [740, 330, 70, 130] },
      verbs: {
        look: () => 'A busker under the awning with a twelve-string and eleven strings, playing something long and modal to a hat with a nickel in it.',
        talk: () => '"Request?" he says. You ask for something cheerful. He plays the same song, but in a major key, and it\'s somehow worse.',
        give: {
          money: (c) => c.flag('tippedBusker') ? '"You already did, man. Peace."' : (c.set('tippedBusker'), 'You drop a coin in the hat. He nods and improvises a verse about a man in a raincoat who forgot his own name. It\'s uncomfortably accurate.'),
          default: shown('The busker'),
        },
      },
    },
    {
      id: 'plymouth', name: 'gray Plymouth', shape: { rect: [42, 322, 84, 46] },
      verbs: {
        look: (c) => isDisguised(c)
          ? 'The gray Plymouth, down the block in the fog. The man behind the wheel has a crew cut and a newspaper he isn\'t reading. His eyes slide over you like you\'re a lamppost with beads on.'
          : 'A gray Plymouth sedan down the block, police-issue down to the hubcaps. The man in it has a crew cut, a newspaper he isn\'t reading, and his eyes on you. You don\'t know him. You know the type. You used to be the type.',
        talk: () => 'Some instinct older than your headache keeps you on this side of the street.',
        go: () => 'Walking up to that car is a good way to spend the night in a cell. You stay on the corner.',
        hit: () => 'Punching a police car in broad daylight. Bold. Stupid. You keep your hands in your pockets.',
        open: () => 'You do not open a stranger\'s car with a stranger in it. Especially that stranger.',
      },
    },
    {
      id: 'sign', name: 'street sign', shape: { poly: [[853, 60], [880, 60], [880, 110], [985, 110], [985, 165], [900, 165], [900, 455], [853, 455]] },
      verbs: { look: () => 'A green lamppost with a street sign, both blades stickered over with daisies until you can\'t read HAIGHT or ASHBURY. Somebody has added a third blade, hand-painted, that just says LOVE and points straight up.' },
    },
    {
      id: 'shopfront', name: 'the Third Eye', kind: 'exit', shape: { poly: [[590, 165], [1000, 150], [1000, 420], [910, 420], [910, 300], [700, 300], [700, 345], [590, 345]] },
      verbs: { look: () => 'A corner shopfront under a scalloped orange awning, the window crowded with hanging lamps, potted ferns and hookahs. Gold letters on the glass: THE THIRD EYE.' },
    },
    {
      id: 'house', name: 'your Victorian', kind: 'exit', shape: { rect: [355, 40, 125, 240] },
      verbs: { look: () => 'The Victorian with the turret, where you woke up. From down here it looks innocent. They all do.' },
    },
    {
      id: 'tree', name: 'tree', shape: { poly: [[0, 0], [190, 0], [160, 200], [90, 300], [80, 560], [0, 560]] },
      verbs: {
        look: () => 'An old tree heaving up the sidewalk, leaves gone orange in the late sun, throwing lace shadows across the road.',
        go: () => 'You lean against the tree a minute. It holds you up. Somebody should.',
        hit: () => 'The tree has been here since the Earthquake. It can take it. Your knuckles can\'t.',
      },
    },
    {
      id: 'fog', name: 'fog down the block', shape: { rect: [125, 230, 110, 120] },
      verbs: { look: () => 'Fog rolling in off the ocean at the far end of Haight, swallowing the telephone poles one by one. By sundown it\'ll be here.' },
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
const HINTS: [(c: Ctx) => boolean, string][] = [
  [(c) => !c.has('page'), '"Mabel here. You said if you ever called sounding like this, I should say: check under the mattress. You always hide things under the mattress, Frank."'],
  [(c) => !c.flag('gotEnvelope'), '"Moondog called for you Friday. Said Rain left something with him. He\'s the poster fella on the second floor. Show him who you\'re looking for."'],
  [(c) => !c.flag('fieldsTested'), '"Friday you said: get that pill to a doctor who\'ll talk. Dr. Fields at the free clinic on Clayton."'],
  [(c) => !c.flag('bought'), '"You sounded like a cop, Frank. Kids in the Haight smell a cop a mile off. Dress the part. There\'s a head shop right where you\'re standing, dummy."'],
  [(c) => !c.flag('kevTalked'), '"The matchbook in your coat. The Electric Owl. Ask for Kev, and bring the girl\'s picture."'],
  [(c) => !c.has('brasskey'), '"Kev rang. Said tell you: the dumpster out back of the Owl. And to wear your hippie getup, because the big fella is still on the door."'],
  [(c) => !c.has('card') && !c.flag('admitted'), '"There\'s a Lotus Foundation table at the Panhandle handing out cards. You\'ll want one if you plan on walking in the front door on Masonic."'],
  [(c) => !c.flag('rainAwake'), '"If you find Rain asleep, Frank, wake her up. Use what the doctor gave you."'],
  [(c) => !c.has('ledger'), '"The doctor keeps books. Doctors always keep books. Bring me something with numbers in it."'],
  [() => true, '"Burn it, Frank. Whatever it is. Open it up and burn it, and keep the girl close when the doctor comes down." The line clicks. Mabel never says goodbye.'],
];

function buyDisguise(c: Ctx): string {
  if (c.flag('bought')) return '"You\'re good, man. Keep your bread."';
  c.set('bought'); c.set('boughtDisguise'); c.give('disguise');
  return 'You count out five dollars. Sunny hands over a pair of round purple shades and a string of painted love beads with a little bow. "A new you, friend. Wear it in good health."';
}
function callMabel(c: Ctx): string[] {
  c.hint(); c.cost(10);
  const hint = HINTS.find(([when]) => when(c))![1];
  return ['You feed the phone a dime and dial your answering service. Ten minutes of hold music, then Mabel\'s voice, flat as a griddle:', hint];
}

const thirdeye: Scene = {
  id: 'thirdeye', name: 'The Third Eye',
  art: { placeholder: 'THE THIRD EYE', inks: inks('thirdEye'), effects: ['smoke'] },
  onEnter: (c) => c.visited('thirdeye') ? undefined
    : 'The Third Eye head shop: beads in the doorway, blacklight posters, incense thick enough to lean on. Behind the glass counter a cheerful man in a velvet vest is restacking a tray of brownies like they\'re crown jewels.',
  hotspots: [
    {
      id: 'sunny', name: 'Sunny', kind: 'person', shape: { rect: [430, 190, 140, 260] },
      verbs: {
        look: () => 'Sunny, proprietor: muttonchops, a grin like a sales pitch, a peace medallion the size of a hubcap.',
        talk: (c) => {
          if (isDisguised(c)) return '"Now THAT\'S a man at peace with the universe," Sunny beams. "Almost groovy, friend. Lose the trench coat and you could pass for a poet."';
          if (c.flag('bought')) return '"Put \'em on, man! Shades and beads in a paper bag do nothing for your aura."';
          return '"Welcome, friend, welcome!" Sunny looks you up and down: the coat, the hat, the face. "Oh. Oh, man. You look like a narc. No offence. Everybody on the street is going to make you in two seconds. Five bucks gets you shades and beads and a whole new karma."';
        },
        give: {
          money: (c) => buyDisguise(c),
          tab: () => 'Sunny glances at the blue tab and goes pale under his muttonchops. "Not in my shop. Not THAT. Word is somebody\'s handing those out tonight, free. Free is never free, man."',
          default: shown('Sunny'),
        },
        hit: () => 'You don\'t hit a man in his own shop. Also, he has a softball bat behind the counter. You can see it.',
      },
    },
    {
      id: 'sunglasses', name: 'sunglasses rack', shape: { rect: [140, 220, 130, 220] },
      verbs: {
        look: () => 'A spinning rack of round sunglasses in every colour a hangover can see. A tag: SHADES + BEADS, $5, THE WHOLE LOOK.',
        take: (c) => c.flag('bought') ? 'You\'ve got a pair. One disguise is plenty.' : '"Five bucks, man," Sunny calls, without looking. "The whole look. Love is free; shades are five."',
        use: { money: (c) => buyDisguise(c) },
      },
    },
    {
      id: 'beads', name: 'bead curtain', shape: { rect: [20, 100, 100, 420] },
      verbs: { look: () => 'Strings of glass beads in the doorway, clicking softly whenever anyone breathes.', go: () => 'You part the beads. On the other side: the same shop. Very spiritual.' },
    },
    {
      id: 'vests', name: 'fringe vests', shape: { rect: [290, 160, 120, 300] },
      verbs: { look: () => 'Suede vests with fringe to the knee. You picture yourself in one and are briefly hospitalized by the image.', take: () => 'A man has to draw the line somewhere. The line is fringe.' },
    },
    {
      id: 'brownies', name: 'tray of brownies', shape: { rect: [600, 400, 150, 60] },
      verbs: {
        look: () => 'A tray of brownies under a glass dome. A card reads: SPECIAL. Somebody has underlined SPECIAL three times.',
        consume: (c) => c.die('brownie'),
        take: () => '"Those are for the display, man," Sunny says. "And by display I mean me."',
      },
    },
    {
      id: 'incense', name: 'incense', shape: { rect: [780, 300, 60, 140] },
      verbs: { look: () => 'Sticks of sandalwood smoking in a brass elephant. The smoke curls through the coloured light and spells out nothing at all.', consume: () => 'No.' },
    },
    {
      id: 'payphone', name: 'payphone', shape: { rect: [880, 150, 90, 220] },
      verbs: {
        look: () => 'A payphone in a nook, its directory chewed to pulp. Your answering service, Mabel, picks up twenty-four hours a day and judges you for every one of them.',
        use: { none: (c) => callMabel(c), money: (c) => callMabel(c) },
        talk: (c) => callMabel(c),
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
    : 'The free clinic on Clayton: a Victorian parlour gone to war. Kids on every chair, a girl crying quietly in the corner, a bald man in robes ladling soup. A doctor in a white coat moves through it all like a tugboat through fog.',
  hotspots: [
    {
      id: 'fields', name: 'Dr. Fields', kind: 'person', shape: { rect: [560, 170, 130, 330] },
      verbs: {
        look: () => 'Dr. Nora Fields: forty, gray streak, sleeves rolled, eyes that have seen everything twice this week. She hasn\'t sat down since June.',
        talk: (c) => c.flag('fieldsTested')
          ? '"Get that slip to somebody who\'ll act on it," Fields says. "And if you find the kids that stuff\'s meant for, get them here first."'
          : '"If you\'re not bleeding, sit down and wait," Dr. Fields says without looking up. "If you\'ve got something for me, show me."',
        give: {
          tab: (c) => {
            c.remove('tab'); c.set('fieldsTested'); c.give('slip'); c.give('salts'); c.advance(10);
            c.note('poison'); c.note('kell');
            c.shard(2, SHARDS[2]);
            return ['Fields takes the foil like it might bite. In the back room she drips reagent on a scrap of the tab, watches it turn, drips something else, and goes very still. Ten minutes later she comes back with a slip of paper and her jaw set.',
              '"There\'s acid in it. There\'s also something else, something that stops hearts. One in twenty, maybe more." She writes fast. "Here. Evidence. And take these salts, for the ones who go too deep." She pauses. "I\'ve had six kids this month come in like that. Every one of them sent over by Dr. Kell\'s Lotus Foundation, \'for aftercare.\' I thought he was being kind."'];
          },
          photo: () => '"Thursday morning," Fields says, studying the photo. "She brought in a boy from the Lotus Foundation, half-dead. She was angry. Not at him."',
          slip: () => '"Keep it," she says. "It\'s more use in your pocket than in my files."',
          default: shown('Dr. Fields'),
        },
        hit: () => 'She\'d have you sedated and on a cot before you finished the swing. And you\'d deserve it.',
      },
    },
    {
      id: 'ananda', name: 'Brother Ananda', kind: 'person', shape: { rect: [180, 220, 140, 280] },
      verbs: {
        look: () => 'A bald man in saffron robes, glasses mended with tape, ladling soup with the precision of a man who used to measure things for a living. Brother Ananda. Once Professor Lev Adler, they say, until the university decided his experiments were the wrong kind of interesting.',
        talk: (c) => {
          c.note('kell');
          return '"Soup?" Ananda asks, then looks closer. "Ah. You\'re the one who\'s been asking about the Lotus Foundation." He lowers his voice. "I knew Ambrose Kell at Stanford. Brilliant. Ambitious. In \'59 he took a government grant that the rest of us refused. A man in a gray suit came to sign the papers. Kell has been doing their research ever since, on children who think he\'s a saint."';
        },
        consume: () => 'Wrong target. The soup is in the pot.',
        give: { default: () => '"Keep it, friend. Everything I need is in this pot."' },
      },
    },
    {
      id: 'soup', name: 'soup pot', shape: { rect: [320, 380, 120, 100] },
      verbs: {
        look: () => 'A dented pot of lentil soup the size of a bathtub. It smells like the first honest thing you\'ve met all day.',
        consume: (c) => c.flag('ateSoup') ? 'Ananda smiles. "Others are hungrier, friend."' : (c.set('ateSoup'), 'Ananda hands you a bowl. It\'s hot, salty and perfect. Some of your brain comes back.'),
        take: () => 'It\'s bolted to the stove by sheer moral authority.',
      },
    },
    {
      id: 'kids', name: 'waiting kids', kind: 'person', shape: { rect: [740, 300, 240, 220] },
      verbs: {
        look: () => 'Kids. Fifteen, sixteen, nineteen. Barefoot, sunburned, bad trips and cut feet and nowhere else to go. Most of them are wearing paper lotus pins.',
        talk: () => 'A boy with a lotus pin tells you, very seriously, that Dr. Kell says the gathering tonight will be "the Communion of the Summer." He\'s got his free ticket. He shows you. It\'s a cream card with a gold lotus.',
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
      verbs: { look: () => 'An eye chart. The top letter is E. The bottom line is either F-R-E-E L-O-V-E or you need glasses. Probably both.' },
    },
  ],
  exits: [{ to: 'haight', label: 'Haight St', map: [50, 100] }],
};

// ════════════════════════════════════════ 7. ELECTRIC OWL ════════════════════════════════════════
const owl: Scene = {
  id: 'owl', name: 'The Electric Owl',
  art: { placeholder: 'THE ELECTRIC OWL BALLROOM', inks: inks('owl'), effects: ['dust'] },
  onEnter: (c) => c.visited('owl') ? undefined
    : 'The Electric Owl ballroom the afternoon after the Kaleidoscope Test: paper cups, feathers, a shoe, a ladder, a hall so wrecked it looks like the party is still happening in a parallel room. A kid on the ladder fiddles with a projector rig. On the stage, a woman with a voice like a freight train is running scales.',
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
        hit: () => 'You\'d knock him off the ladder. He\'s nineteen. Pick on someone your own size, like Tiny.',
      },
    },
    {
      id: 'projector', name: 'projector rig', shape: { rect: [770, 200, 160, 140] },
      verbs: {
        look: () => 'An overhead projector on a scaffold, a glass dish of coloured oils, a motor to turn a painted wheel in front of the lens. The heart of every light show in the Haight.',
        use: {
          none: (c) => {
            if (c.flag('lightShow')) return 'The colours swirl on. Your memory has given you all it\'s going to, for now.';
            c.set('lightShow'); c.advance(5);
            c.shard(3, SHARDS[3]);
            return 'You flip the switch. The motor hums, the oil wheel turns, and the far wall blooms: magenta, electric blue, shapes that split and rejoin like cells. Kev says, "Hey, man, careful," but you\'re already somewhere else.';
          },
        },
        take: () => 'You can\'t carry a light show. Kev looks at you like you tried.',
        hit: () => '"Don\'t touch my rig, man!" Kev nearly comes off the ladder.',
      },
    },
    {
      id: 'lu', name: 'Lu Fontaine', kind: 'person', shape: { rect: [260, 200, 120, 280] },
      verbs: {
        look: () => 'Lu Fontaine, front woman of Satchel & the Strays: sequins at four in the afternoon, a laugh that could stop traffic, a voice that could start it again.',
        talk: (c) => (c.flag('metLu') ? LU.after : (c.set('metLu'), LU.first)),
        give: { photo: () => LU.photo, default: shown('Lu') },
      },
    },
    {
      id: 'stage', name: 'stage', shape: { rect: [140, 340, 340, 140] },
      verbs: { look: () => 'The stage where the Kaleidoscope Test happened. Gaffer tape, a broken tambourine, a single sandal. You stood near here, Thursday. You think.' },
    },
    {
      id: 'debris', name: 'party wreckage', shape: { rect: [380, 500, 400, 110] },
      verbs: {
        look: () => 'Paper cups, every one of them sticky. A punch bowl with a ladle and a crust. You do not drink from the punch bowl. You learned that lesson on Thursday, you just don\'t remember the class.',
        consume: () => 'You have some idea of what was in the punch. You keep your mouth shut.',
        take: () => 'None of this is evidence of anything except a good time.',
      },
    },
    {
      id: 'stagedoor', name: 'stage door', kind: 'exit', shape: { rect: [40, 160, 90, 300] },
      verbs: { look: () => 'A steel door marked STAGE — NO EXIT. Behind it, the alley. Kev glances at it and then very carefully doesn\'t.' },
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
    const base = c.visited('alley') ? '' : 'A brick alley that smells of beer, rain and worse. A dumpster overflowing with last night. A fire escape zigzagging up the wall. ';
    if (isDisguised(c)) return base + 'By the stage door, a man the size of a refrigerator in an Iron Saints jacket smokes and watches a hippie in purple shades. That\'s you. He looks away, bored.';
    return base + 'By the stage door, a man the size of a refrigerator in an Iron Saints jacket lowers his cigarette and looks at you. Looks *at* you. Something in his face goes from bored to interested. You should not be here looking like yourself.';
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
        look: () => 'Tiny, of the Iron Saints. The name is a joke. The arms are not. The knuckles have words tattooed on them; you can read LOVE on the left. You decide not to read the right.',
        talk: () => '"Beat it, flower child," Tiny says, without looking at you. "Doc\'s orders. Nobody back here today." Doc. Kell. Tiny knows exactly whose muscle he is.',
        hit: (c) => c.die('tiny-hit'),
        give: {
          money: () => 'Tiny looks at your money like it\'s a parking ticket. "Keep walking."',
          default: () => '"I don\'t want nothing you got," Tiny says. It sounds like a threat because it is one.',
        },
      },
    },
    {
      id: 'dumpster', name: 'dumpster', shape: { rect: [240, 330, 270, 190] },
      verbs: {
        look: (c) => c.flag('gotKey') ? 'The dumpster. You\'ve already been in it. Your coat will be telling people about it for weeks.' : 'An overflowing steel dumpster, lid half-open, last night\'s party spilling out of it. If a kid had to hide something fast, it\'s right here.',
        open: (c) => {
          if (c.flag('gotKey')) return 'You\'ve found all the treasure this dumpster has to offer.';
          c.set('gotKey'); c.give('brasskey'); c.note('key');
          return 'You lift the lid and go in to the elbow, past paper cups, a feather boa and something that was once a sandwich. Your fingers close on metal: a brass key, heavy, a lotus stamped on the bow. Tiny glances over. A hippie, digging in the trash. He looks away.';
        },
        close: () => 'You lower the lid. The smell lowers itself more slowly.',
        go: () => 'You\'re not hiding in a dumpster. You have some pride left. Very little.',
      },
    },
    {
      id: 'fireescape', name: 'fire escape', kind: 'exit', shape: { poly: [[560, 40], [680, 40], [680, 300], [560, 300]] },
      verbs: {
        look: () => 'A fire escape bolted to the wall with what appear to be thumbtacks. Rust has eaten the bottom rungs to lace.',
        go: (c) => c.die('alley-fire-escape'),
        use: { none: (c) => c.die('alley-fire-escape') },
        take: () => 'You\'d pull it right off the wall. Which tells you something.',
      },
    },
    {
      id: 'stagedoor', name: 'stage door', kind: 'exit', shape: { rect: [880, 170, 100, 330] },
      verbs: { look: () => 'The Owl\'s stage door, propped open with a brick. A caged bulb above it flickers like it\'s trying to tell you something in Morse.' },
    },
  ],
  exits: [{ to: 'owl', label: 'The Owl', hotspot: 'stagedoor', map: [100, 50] }],
};

// ════════════════════════════════════════ 9. PANHANDLE ════════════════════════════════════════
const panhandle: Scene = {
  id: 'panhandle', name: 'The Panhandle',
  art: { placeholder: 'THE PANHANDLE', inks: inks('panhandle'), outdoor: true },
  onEnter: (c) => {
    const base = c.visited('panhandle') ? '' : 'The Panhandle: a long strip of park under eucalyptus trees, the grass already filling with blankets. A wooden stage half-built at the far end, a wall of speakers going up behind it like a cathedral. Bikers in Iron Saints colours walk the edges. A folding table under a lotus banner hands out cream cards. ';
    if (isDisguised(c)) return base + 'By the trees, two men in bad sport coats scan the crowd. Their eyes pass over your shades and beads and keep going.';
    return base + 'By the trees, two men in bad sport coats scan the crowd. One of them stops scanning. He nudges the other. They start walking your way, unhurried, the way cops walk when they already know how it ends.';
  },
  beforeAction: (c): HandlerResult => {
    if (isDisguised(c)) return undefined;
    if (leaving(c, 'haight') || leaving(c, 'lotus') || c.verb === 'look') return undefined;
    c.die('bruno-panhandle');
    return 'You take too long. A hand lands on your elbow.';
  },
  hotspots: [
    {
      id: 'scaffold', name: 'stage scaffold', shape: { rect: [380, 120, 300, 260] },
      verbs: {
        look: (c) => {
          if (c.flag('sawScaffold')) return 'The scaffold of the stage. Rain stood right there, yelling at you. You\'d give a lot to be yelled at by her again.';
          c.set('sawScaffold');
          c.shard(5, SHARDS[5]);
          return 'The bones of the stage, raw lumber and pipe. You\'ve stood here before. Recently. The smell of cut wood and eucalyptus hits you, and with it, a voice.';
        },
        go: () => 'A biker in Iron Saints colours steps into your path. "Crew only, flower." You step back.',
      },
    },
    {
      id: 'calder', name: 'Sky Calder', kind: 'person', shape: { rect: [140, 260, 120, 230] },
      verbs: {
        look: () => 'Sterling "Sky" Calder at the sound desk: a wiry man with wild hair and a soldering iron behind his ear, tuning the wall of speakers like a cathedral organ. The most famous underground chemist in California, and he\'s worried about the bass.',
        talk: (c) => (c.flag('calderAlly') ? CALDER.ally : CALDER.first),
        give: {
          slip: (c) => { c.set('calderAlly'); c.note('calder'); return CALDER.proof; },
          tab: () => '"That\'s not mine," Calder says, without touching it. "Who gave you that? Get it tested. Then come back and tell me who\'s using my name."',
          photo: () => '"The Whitcombe girl. She found me Thursday at the Owl, shouting something about crates. I thought she was high. I was high. I\'m sorry." He means it.',
          default: shown('Calder'),
        },
      },
    },
    {
      id: 'speakers', name: 'speaker wall', shape: { rect: [700, 40, 260, 400] },
      verbs: { look: () => 'A wall of speaker cabinets three storeys high, stacked and strapped and wired by hand. When the Morning Ghosts start, people in Oakland will feel it in their fillings.' },
    },
    {
      id: 'volunteer', name: 'Lotus volunteer', kind: 'person', shape: { rect: [40, 380, 150, 150] },
      verbs: {
        look: () => 'A folding table under a lotus banner. Behind it, a girl with flowers in her hair and a smile pinned on like a badge, handing out cream cards.',
        talk: (c) => {
          if (c.has('card') || c.flag('admitted')) return '"You\'re already a Seeker, brother," she says. "Go in peace. Come to the house. The Doctor would love to meet you."';
          c.give('card'); c.note('card');
          return '"Welcome, Seeker!" She presses a cream card into your hand. "The Lotus Foundation offers free consciousness therapy at our house on Masonic. Show this at the door. And tonight, at sundown," she leans in, "there are gifts."';
        },
        give: { default: () => '"Oh, we don\'t take anything," she says. "We only give."' },
      },
    },
    {
      id: 'saints', name: 'Iron Saints', kind: 'person', shape: { rect: [290, 400, 160, 140] },
      verbs: {
        look: () => 'Iron Saints doing security: leather, beards, folded arms. They keep the stage clear and the crowd happy and have no idea what one of their own is mixed up in.',
        talk: () => '"Tiny?" one of them says. "Ain\'t seen him all week. Moonlighting for some doctor." He spits. "Club don\'t like that."',
        hit: () => 'There are eleven of them. You count twice to be sure. You keep your hands to yourself.',
      },
    },
    {
      id: 'narcs', name: 'men in sport coats', kind: 'person', shape: { rect: [880, 300, 110, 220] },
      verbs: {
        look: () => 'Two men in sport coats so bad they must be government-issue. Bruno\'s people. They\'re watching the crowd, and the Lotus table, and the street.',
        talk: (c) => { c.die('bruno-panhandle'); return 'You stroll up to Bruno\'s men. You\'ve always been a brave man. That\'s a nice way of putting it.'; },
        hit: (c) => { c.die('bruno-panhandle'); return 'You swing at a cop in front of two hundred witnesses.'; },
      },
    },
    {
      id: 'crowd', name: 'crowd', shape: { rect: [460, 420, 400, 120] },
      verbs: { look: () => 'Blankets, babies, dogs, a man with a bubble machine. Hundreds already, thousands by sundown. Every one of them is about to be offered a free gift.' },
    },
  ],
  exits: [
    { to: 'haight', label: 'Haight St', minutes: 8, map: [0, 50] },
    { to: 'lotus', label: 'Masonic Ave', minutes: 6, map: [100, 50] },
  ],
};

// ════════════════════════════════════════ 10. LOTUS EXTERIOR ════════════════════════════════════════
const lotus: Scene = {
  id: 'lotus', name: 'Lotus Foundation',
  art: { placeholder: 'LOTUS FOUNDATION, MASONIC AVE', inks: inks('lotusExt'), outdoor: true },
  onEnter: (c) => c.visited('lotus') ? undefined
    : 'The Lotus Foundation: a grand Victorian on Masonic painted gold and plum, a lotus mandala spread across the whole façade like a bloom about to swallow the house. Prayer flags in a too-perfect garden. Wide steps to a carved front door, and down the side, a cellar door with a heavy padlock.',
  hotspots: [
    {
      id: 'house', name: 'mandala façade', shape: { rect: [250, 20, 500, 260] },
      verbs: { look: () => 'A lotus mandala painted across the whole front of the house, every petal perfect. It\'s beautiful. It\'s the most beautiful thing you\'ve seen all day. You don\'t trust it an inch.' },
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
        look: (c) => c.flag('cellarOpen') ? 'The cellar door, padlock hanging open. Stone steps go down into the dark.' : 'Slanted cellar doors with a heavy padlock. The padlock has a little lotus stamped on it.',
        open: (c) => c.flag('cellarOpen') ? 'It\'s open.' : 'Padlocked. The lock has a lotus on it. Some people brand everything.',
        use: {
          brasskey: (c) => {
            if (c.flag('cellarOpen')) return 'Already unlocked.';
            c.set('cellarOpen');
            return 'The brass key slides in like it\'s been waiting. The padlock opens. You ease the cellar door up. Cool air, stone steps, and a smell like a chemistry class that went wrong.';
          },
          knife: () => 'A butter knife against a padlock. The padlock wins on points.',
        },
        hit: () => 'You\'d bring the whole house out. Quietly is the only way in.',
      },
    },
    {
      id: 'garden', name: 'garden', shape: { rect: [40, 330, 330, 230] },
      verbs: { look: () => 'Raked gravel, prayer flags, a stone Buddha with a lotus in its lap. Not a weed. Not a single weed in the Haight-Ashbury. That alone should be illegal.' },
    },
  ],
  exits: [
    { to: 'haight', label: 'Haight St', minutes: 8, map: [0, 70] },
    { to: 'panhandle', label: 'Panhandle', minutes: 6, map: [0, 20] },
    { to: 'parlor', label: 'Front door', hotspot: 'frontdoor', map: [50, 0], guard: (c) => (c.flag('admitted') ? undefined : lotusKnock(c)) },
    { to: 'lab', label: 'Cellar', hotspot: 'cellar', map: [100, 70], guard: (c) => (c.flag('cellarOpen') ? undefined : 'Padlocked. You need the right key.') },
  ],
};

function lotusKnock(c: Ctx): string {
  return c.has('card')
    ? 'The door opens on a serene young woman in white, holding a teapot. Sister Dawn. "Welcome, Seeker," she says. "Your card?"'
    : 'The door opens on a serene young woman in white, holding a teapot. "Welcome, friend. The Foundation receives Seekers. Have you been given your card?" You haven\'t. "The table in the Panhandle," she says kindly, and the door closes, kindly.';
}
function lotusAdmit(c: Ctx): string {
  if (c.flag('admitted')) { c.go('parlor'); return 'Sister Dawn lets you back in with the same smile.'; }
  c.set('admitted'); c.go('parlor'); c.cost(4);
  return 'Sister Dawn takes the card, studies it, and gives you a smile like warm milk. "Welcome, Seeker. The Doctor is resting upstairs. Come in, come in. Would you like some tea?"';
}

// ════════════════════════════════════════ 11. PARLOR ════════════════════════════════════════
const parlor: Scene = {
  id: 'parlor', name: 'The Lotus Parlor',
  art: { placeholder: 'LOTUS FOUNDATION PARLOR', inks: inks('parlor'), effects: ['drapes'] },
  onEnter: (c) => c.visited('parlor') ? undefined
    : 'A Victorian parlor made over as a temple: cushions, candles, stained glass throwing gold and plum across the floor. On a velvet daybed, under a shawl, a girl with long dark hair lies very still. Rain. Sister Dawn pours tea and hums. A carved desk by the window. A door at the back with a brass lock.',
  hotspots: [
    {
      id: 'rain', name: 'Rain', kind: 'person', shape: { rect: [100, 300, 300, 180] },
      verbs: {
        look: (c) => c.flag('rainAwake') ? 'Rain, awake, pale, furious, alive. She\'s eyeing the fireplace tools.' : 'Rain, sedated, breathing slow under a shawl, a lotus pinned to it. The girl from the photo, with all the laughing drained out.',
        talk: (c) => (c.flag('rainAwake') ? RAIN.awake : RAIN.sedated),
        use: {
          salts: (c) => {
            if (c.flag('rainAwake')) return 'She\'s awake. She\'d hit you.';
            c.set('rainAwake'); c.note('rainAwake'); c.advance(5);
            return RAIN.wake;
          },
          default: () => 'That won\'t wake her. She needs something sharp. Not that kind of sharp.',
        },
        hit: () => 'You are not going to slap a drugged girl awake. You have a doctor\'s note for this.',
        take: () => 'You couldn\'t carry her past Dawn and down the steps. Not without waking the house. Wake her instead.',
      },
    },
    {
      id: 'desk', name: 'Kell\'s desk', shape: { rect: [640, 240, 220, 200] },
      verbs: {
        look: (c) => c.has('ledger') ? 'Kell\'s desk, a little lighter by one ledger.' : 'A carved writing desk. Fountain pen, blotter, a framed diploma from Stanford, and a slim ledger bound in oxblood leather.',
        open: () => 'The drawers hold prescription pads, a photograph of Kell shaking hands with a man in a gray suit whose face is turned away, and a lot of very good stationery.',
      },
    },
    {
      id: 'ledger', name: 'ledger', shape: { rect: [700, 230, 80, 40] },
      visible: (s) => !s.inventory.includes('ledger'),
      verbs: {
        look: () => 'A slim ledger in oxblood leather. Accountants and murderers both love a good ledger.',
        take: (c) => {
          c.give('ledger'); c.note('ledger'); c.note('bruno');
          c.shard(4, SHARDS[4]);
          return 'You slide the ledger into your coat while Sister Dawn has her eyes closed. You open it a crack: *R.B. — $500. R.B. — $500. R.B. — $1,000 (Sat.).* R.B. You know a man with those initials.';
        },
        open: (c) => same(parlor, 'ledger', 'take', c),
      },
    },
    {
      id: 'dawn', name: 'Sister Dawn', kind: 'person', shape: { rect: [440, 200, 130, 300] },
      verbs: {
        look: () => 'Sister Dawn: white dress, bare feet, eyes like a lake with something at the bottom. She smiles at everything. She is smiling at you.',
        talk: () => '"Rest, Seeker," Dawn says. "The Doctor will see you after the gathering. Would you like some tea?" She lifts the teapot. You remember a line in green ink: *Don\'t take the tea.*',
        hit: () => 'She doesn\'t flinch. She doesn\'t stop smiling. Somehow that\'s what stops you.',
        give: { default: () => '"We don\'t need things here," Sister Dawn says. "Only peace."' },
      },
    },
    {
      id: 'teapot', name: 'teapot', shape: { rect: [580, 420, 70, 60] },
      verbs: {
        look: () => 'A brass teapot on a low table, two cups poured, steam curling. It smells of jasmine and something under the jasmine.',
        consume: (c) => c.die('tea'),
        take: (c) => c.die('tea'),
      },
    },
    {
      id: 'basementdoor', name: 'basement door', kind: 'exit', shape: { rect: [880, 160, 100, 340] },
      verbs: {
        look: (c) => c.flag('basementOpen') ? 'The basement door stands open. Stone steps go down into the cold.' : 'A narrow door at the back with a brass lock. A lotus on the keyhole plate. You\'ve seen that lotus before, on a key.',
        open: (c) => c.flag('basementOpen') ? 'It\'s open.' : 'Locked.',
        use: {
          brasskey: (c) => {
            if (c.flag('basementOpen')) return 'It\'s already unlocked.';
            c.set('basementOpen');
            return 'The brass key turns sweet as you like. Sister Dawn hums on, eyes closed. The basement door opens on stone steps and cold air.';
          },
        },
      },
    },
    {
      id: 'cushions', name: 'cushions', shape: { rect: [100, 500, 420, 100] },
      verbs: { look: () => 'Silk cushions in a circle. Kids sit here, Rain said, while the Doctor explains the universe and somebody takes notes.', go: () => 'You don\'t sit. If you sit, you\'ll be offered tea.' },
    },
  ],
  exits: [
    { to: 'lotus', label: 'Front door', map: [0, 50] },
    { to: 'lab', label: 'Basement', hotspot: 'basementdoor', map: [100, 70], guard: (c) => (c.flag('basementOpen') ? undefined : 'The basement door is locked. The lock has a lotus on it.') },
  ],
};

// ════════════════════════════════════════ 12. BASEMENT LAB ════════════════════════════════════════
const burnCrates = (c: Ctx): HandlerResult => {
  if (c.flag('burned')) return 'The crates are already burning. Very nicely.';
  if (!c.flag('cratesOpen')) return 'The crates are nailed shut. You can\'t burn what you can\'t get at. Well, you could, but it\'d take all night.';
  if (!c.flag('furnaceOpen')) return 'The furnace door is shut. You\'d be stacking crates against cold iron.';
  c.set('burned'); c.set('climax');
  const lines = ['You drag the crates over and feed them into the furnace, one after another. The foil curls, the blue tabs blacken, five thousand free gifts go up the chimney of a house on Masonic Avenue. It smells like burnt sugar and justice.',
    'Footsteps on the stairs. Slow. A silver-haired man in a cardigan stops halfway down, looks at the fire, and then at you. Dr. Ambrose Kell. In his hand, held like a fountain pen, is your .38.'];
  if (c.flag('admitted') && !c.flag('rainAwake')) {
    lines.push('"Mr. Tolliver," he says. "Sister Dawn told me a Seeker came in with a policeman\'s face." He doesn\'t say anything else.');
    c.die('kell-shot');
    return lines;
  }
  if (c.flag('rainAwake')) {
    lines.push('"Mr. Tolliver," Kell says, very gently. "You should be asleep." Behind him, on the stairs, without a sound, Rain is coming down with a fire iron in both hands. Keep him talking.');
  } else {
    lines.push('He hasn\'t seen you. You\'re in the shadow behind the crates, and he\'s staring at the fire like a man watching his career go up in smoke. The cellar door is three steps behind you.');
  }
  return lines;
};

const lab: Scene = {
  id: 'lab', name: 'Basement Lab',
  art: { placeholder: 'BASEMENT LAB', inks: inks('lab'), effects: ['flicker'] },
  onEnter: (c) => c.visited('lab') ? undefined
    : 'A stone basement turned clandestine lab: glassware and tubing on a workbench, a single bulb swinging, and stacked against the wall, crates. Dozens. Stencilled MEDICAL SUPPLIES. Beside them squats an iron coal furnace the size of a car, and a gas line runs to it with a red valve wheel.',
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
      return 'You back up the cellar steps one at a time, into the evening, and let the cellar door down soft as a coffin lid. Behind you, the furnace roars.';
    }
    c.die('kell-shot');
    return 'You move. He hears it.';
  },
  hotspots: [
    {
      id: 'crates', name: 'crates', shape: { rect: [60, 200, 320, 320] },
      verbs: {
        look: (c) => c.flag('burned') ? 'Empty crates and torn foil. The rest is smoke.' : c.flag('cratesOpen')
          ? 'The lids are off. Foil packets, thousands of them, each one a blue tab with a lightning bolt. Enough for every kid in the Panhandle, and then some.'
          : 'Wooden crates stencilled MEDICAL SUPPLIES — FRAGILE, nailed shut, stacked higher than your head.',
        open: (c) => {
          if (c.flag('cratesOpen')) return 'They\'re open. You don\'t need to look twice.';
          c.set('cratesOpen');
          return 'You find a pry bar on the workbench and work the lids off one after another. Foil packets, blue tabs, lightning bolts. Five thousand counterfeit miracles.';
        },
        use: { none: burnCrates, default: () => 'Just get them in the fire.' },
        take: burnCrates,
        consume: (c) => c.die('blue-tab'),
      },
    },
    {
      id: 'furnace', name: 'furnace', shape: { rect: [420, 200, 260, 320] },
      verbs: {
        look: (c) => c.flag('furnaceOpen') ? 'The furnace door hangs open on a bed of red coals. Hungry.' : 'An iron coal furnace the size of a car, door shut, warm to the touch. The house\'s heart, banked low.',
        open: (c) => {
          if (c.flag('furnaceOpen')) return 'It\'s open. The coals are waiting.';
          c.set('furnaceOpen');
          return 'You wrap your hand in your coat and swing the furnace door open. Heat rolls out. Red coals, banked and patient.';
        },
        close: (c) => { c.set('furnaceOpen', false); return 'You swing the furnace door shut.'; },
        use: { none: burnCrates },
      },
    },
    {
      id: 'valve', name: 'gas valve', shape: { rect: [700, 300, 70, 90] },
      verbs: {
        look: () => 'A gas line running to the furnace, with a red valve wheel. A tag wired to it in a careful hand: DO NOT OPEN — PILOT LIT. Somebody thought of you.',
        open: (c) => c.die('gas-valve'),
        use: { none: (c) => c.die('gas-valve'), default: (c) => c.die('gas-valve') },
        hit: (c) => c.die('gas-valve'),
        close: () => 'It\'s already closed. Keep it that way.',
      },
    },
    {
      id: 'glassware', name: 'glassware', shape: { rect: [700, 160, 260, 120] },
      verbs: {
        look: () => 'Flasks, condensers, a rotary evaporator: a pharmaceutical setup, government-quality. Kell didn\'t buy this with Foundation donations.',
        hit: () => 'Smashing it would feel great and stop nothing. The crates are the problem.',
        take: () => 'Evidence is good, but you can\'t carry a lab up the stairs.',
      },
    },
    {
      id: 'stairs', name: 'stairs up', kind: 'exit', shape: { rect: [800, 400, 180, 200] },
      visible: (s) => !!s.flags.basementOpen,
      verbs: { look: () => 'Stone steps up to the parlor.' },
    },
    {
      id: 'cellardoor', name: 'cellar door', kind: 'exit', shape: { rect: [40, 40, 200, 110] },
      verbs: { look: () => 'The slanted cellar door, daylight cutting under it.' },
    },
    {
      id: 'kell', name: 'Dr. Kell', kind: 'person', shape: { rect: [820, 140, 130, 330] },
      visible: (s) => !!s.flags.climax,
      verbs: {
        look: () => 'Dr. Ambrose Kell: silver hair, cardigan, a voice like warm velvet, and your .38 held loose and steady in his right hand. Behind his kind eyes, nothing at all.',
        talk: (c) => {
          if (!c.flag('rainAwake')) return undefined;
          c.win(rainEnding(c.state));
          return ['"You know what\'s funny, Doc?" you say. "Three days ago I didn\'t even know your name." Kell smiles. "And in a moment you won\'t know your own. I\'m sorry, Mr. Tolliver. Truly. Science requires—"',
            'The fire iron makes a sound against the back of his head like a dropped melon. Dr. Kell sits down on the stairs, then lies down on them. Your .38 clatters to the stone. Rain stands over him, white-knuckled. "Science," she says, "requires you to shut up."',
            'You pick up your gun. It feels like an old friend who\'s been somewhere he won\'t talk about.'];
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
