// Two-room test chapter: exercises every engine feature in miniature.
import type { Chapter } from '../../engine/types';
import { svgIcon } from '../../art/icons';

export const testChapter: Chapter = {
  id: 'test',
  title: 'Test Case: The Locked Office',
  dateLine: 'FRI · AUG 18 · 1967',
  clockStart: 23 * 60,          // 11:00 PM
  deadline: 30,                 // 11:30 PM
  shardCount: 1,
  startScene: 'office',
  startInventory: ['matches'],
  intro: ['You fell asleep at your desk again. The neon sign across the street blinks VACANCY at you like it knows something.'],

  scenes: {
    office: {
      id: 'office',
      name: 'Your Office',
      art: { placeholder: 'OFFICE — TEST ROOM', inks: ['#e2aa2b', '#5c3b8e'] },
      onEnter: (c) => (c.visited('hall') ? 'Back in the office. It hasn\'t improved.' : undefined),
      hotspots: [
        {
          id: 'desk', name: 'desk', shape: { rect: [380, 380, 300, 160] },
          verbs: {
            look: (c) => c.flag('drawer') ? 'The drawer hangs open, empty as your appointment book.' : 'Your desk. One drawer, one coffee ring, one past.',
            open: (c) => {
              if (c.flag('drawer')) return 'Already open.';
              c.set('drawer');
              c.give('key');
              return 'You pull the drawer. Under the unpaid bills: the office key.';
            },
            close: (c) => { c.unset('drawer'); return 'You close the drawer. Out of sight, out of mind.'; },
          },
        },
        {
          id: 'hat', name: 'hat', shape: { rect: [120, 140, 120, 90] },
          verbs: {
            look: (c) => {
              c.shard(1, '*A rainy Tuesday. A woman in pearls slides a photograph across this desk. "Find her," she says. You already know you will.*');
              c.note('client');
              return 'Your fedora. Tucked in the band: a business card for Mrs. E. Whitcombe, Pacific Heights.';
            },
            take: () => 'You leave the hat on its hook. You\'ll want it later, when you remember why.',
          },
        },
        {
          id: 'bottle', name: 'bottle of rye', shape: { rect: [720, 330, 60, 110] },
          verbs: {
            look: () => 'Rye, three fingers left. It\'s been three fingers for a week.',
            consume: (c) => c.die('rye'),
          },
        },
        {
          id: 'window', name: 'window', shape: { poly: [[560, 60], [800, 60], [800, 300], [560, 300]] },
          verbs: {
            look: () => 'Four floors down, the Tenderloin goes about its business.',
            open: () => 'It\'s painted shut. Has been since Eisenhower.',
            go: (c) => c.die('window'),
          },
        },
        {
          id: 'door', name: 'door', kind: 'exit', shape: { rect: [860, 150, 120, 380] },
          verbs: {
            look: (c) => c.flag('unlocked') ? 'Your door, unlocked. Frosted glass with your name on it, spelled right for once.' : 'Your door. Locked. You locked yourself in, which is a new low.',
            open: (c) => c.flag('unlocked') ? 'It swings open onto the hall.' : 'Locked.',
            use: {
              key: (c) => { c.set('unlocked'); c.remove('key'); return 'The key turns. The lock gives up without a fight.'; },
              matches: () => 'You could burn the door down. You could also not.',
            },
            hit: () => 'You thump the door. It thumps back, more or less.',
          },
        },
        {
          id: 'cigarette', name: 'cigarette', shape: { rect: [430, 340, 60, 30] },
          visible: (s) => !s.inventory.includes('cigarette') && !s.flags.smoked,
          verbs: {
            take: (c) => { c.give('cigarette'); return 'A last cigarette, behind the ashtray. Your lucky day, for small values of lucky.'; },
          },
        },
      ],
      exits: [
        {
          to: 'hall', label: 'Hallway', hotspot: 'door', map: [80, 50],
          guard: (c) => (c.flag('unlocked') ? undefined : 'The door is locked. From the inside. By you.'),
        },
      ],
    },

    hall: {
      id: 'hall',
      name: 'Fourth-Floor Hallway',
      art: { placeholder: 'HALLWAY — TEST ROOM', inks: ['#e8604a', '#2aa3a0'] },
      onEnter: (c) => (c.visited('hall') ? undefined : 'The hallway smells of floor wax and other people\'s cooking.'),
      hotspots: [
        {
          id: 'stairs', name: 'stairs', kind: 'exit', shape: { rect: [700, 120, 220, 420] },
          verbs: {
            look: () => 'Stairs down to the street, and whatever the street has in mind.',
            go: (c) => c.win('test-out'),
          },
        },
        {
          id: 'super', name: 'the super', kind: 'person', shape: { rect: [300, 160, 140, 360] },
          verbs: {
            look: () => 'The building super, mopping the same square yard he mopped yesterday.',
            talk: (c) => { c.note('super'); return '"Rent\'s due Monday, Tolliver." He says it the way other people say good morning.'; },
            give: {
              cigarette: (c) => { c.remove('cigarette'); c.set('superHappy'); return 'He takes the cigarette, tucks it behind his ear. "You\'re all right, Tolliver. Rent\'s still due."'; },
            },
            hit: (c) => c.die('super'),
          },
        },
      ],
      exits: [{ to: 'office', label: 'Your Office', map: [20, 50] }],
    },
  },

  items: {
    key: {
      id: 'key', name: 'office key', icon: () => svgIcon('key'),
      verbs: { look: () => 'A brass key with your office number on it. The number is 4. You used to have more ambition.' },
    },
    matches: {
      id: 'matches', name: 'matches', icon: () => svgIcon('matchbook'),
      verbs: {
        look: () => 'A book of matches. Four left.',
        use: {
          cigarette: (c) => { c.remove('cigarette'); c.set('smoked'); return 'You light up. For a minute the world is the size of the ember.'; },
        },
      },
    },
    cigarette: {
      id: 'cigarette', name: 'cigarette', icon: () => svgIcon('cigarette'),
      verbs: {
        look: () => 'Slightly bent. Like everyone in this building.',
        consume: () => 'You\'re not eating it. Light it, if you must.',
      },
    },
  },

  deaths: {
    rye: { id: 'rye', title: 'Three Fingers', text: 'The rye was not rye. The rye was something the last tenant used on rats. You join the rats.' },
    window: { id: 'window', title: 'Four Floors', text: 'You climb out the window for some air. You get all of it, very quickly.' },
    super: { id: 'super', title: 'Rent Is Due', text: 'The super has been mopping for thirty years. His arms are like hawsers. Yours, it turns out, are like noodles.' },
    late: { id: 'late', title: 'Closing Time', text: 'Midnight finds you still in the building. Whatever you were supposed to do, someone else did it worse.' },
  },

  endings: {
    'test-out': { id: 'test-out', headline: 'P.I. LEAVES BUILDING', body: 'Local detective successfully exits his own office. Neighbours describe the event as "overdue."', win: true },
  },

  events: [
    { id: 'warn', at: 20, run: () => 'Somewhere a church bell does the math for you: ten minutes left.' },
    { id: 'deadline', at: 30, run: (c) => c.die('late') },
  ],

  notebook: {
    client: { id: 'client', title: 'The client', text: 'Mrs. E. Whitcombe, Pacific Heights. Pearls. Money. A daughter somewhere.' },
    super: { id: 'super', title: 'The super', text: 'Rent due Monday. Always Monday.' },
  },
};
