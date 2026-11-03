import type { Ctx, Item } from '../../engine/types';
import { svgIcon } from '../../art/icons';
import { SHARDS } from './dialogue';
import { notebook } from './notebook';

const icon = (name: string) => () => svgIcon(name);

export const isDisguised = (c: Pick<Ctx, 'flag'>) => !!c.flag('disguised');

/** Looking through the kaleidoscope at something that holds no memory. */
export const kaleidoscopeNothing = (): string =>
  'You look through the kaleidoscope. The world breaks into six pretty pieces and turns slowly, like a thought you almost had. No memory lives here.';

export const items: Record<string, Item> = {
  notebook: {
    id: 'notebook', name: 'case notebook', icon: icon('notebook'),
    verbs: {
      look: (c) => {
        const entries = c.state.notebook.map((id) => notebook[id]).filter(Boolean);
        if (!entries.length) return 'Your notebook. The last three days are blank pages, as clean as a hotel bed.';
        return ['You flip through your notebook. In your own handwriting, more or less:', ...entries.map((e) => `**${e!.title}.** ${e!.text}`)];
      },
      open: (c) => items.notebook!.verbs.look!(c),
      consume: () => 'You\'ve eaten your words before. Never literally. Today is not the day to start.',
    },
  },

  kaleidoscope: {
    id: 'kaleidoscope', name: 'kaleidoscope', icon: icon('kaleidoscope'),
    verbs: {
      look: (c) => { c.note('kaleidoscope'); return 'A child\'s kaleidoscope: a cardboard tube with brass caps, worn soft at one end where a thumb has held it ten thousand times. One of the mirrors inside is cracked. On the side, in faded green ink: *R.W., age 7.* It feels like something you were told to look after.'; },
      use: {
        none: kaleidoscopeNothing,
        self: kaleidoscopeNothing,
        licence: (c) => {
          if (c.state.shards.includes(1)) return 'Your licence breaks into six licences, six Franks. None of them has anything new to say.';
          c.note('self');
          c.shard(1, SHARDS[1]);
          return 'You hold your licence up to the end of the kaleidoscope and look. Your own name breaks into six pieces and turns, slowly, and the pieces start to fit.';
        },
        ledger: (c) => {
          if (c.state.shards.includes(4)) return 'The ledger\'s columns fold into a little paper flower. You\'ve already read what it has to say.';
          c.note('bruno');
          c.shard(4, SHARDS[4]);
          return 'You look at the ledger through the kaleidoscope. The neat columns of figures fold into a pattern, and the pattern has a voice.';
        },
        photo: () => 'Through the kaleidoscope, Rain\'s face becomes six faces, all laughing at whoever held the camera. It\'s a nice thing to look at. It\'s not a memory, though. It\'s a hope.',
        default: kaleidoscopeNothing,
      },
      consume: () => 'You are not going to eat a child\'s toy. You have some standards, and this is roughly where they start.',
      hit: () => 'You\'d sooner hit yourself. In a sense, that would be the same thing.',
    },
  },

  licence: {
    id: 'licence', name: 'PI licence', icon: icon('card'),
    verbs: {
      look: () => 'State of California, Private Investigator: FRANCIS X. TOLLIVER. The photo is you five years ago, back when you still believed most things could be fixed with a phone call and a stern look.',
    },
  },

  photo: {
    id: 'photo', name: 'photo of Rain', icon: icon('photo'),
    verbs: {
      look: (c) => { c.note('rain'); return 'A girl of nineteen, long dark hair ironed straight, laughing at whoever held the camera. On the back, in a careful finishing-school hand: *Rosalind, Easter 1967.* Someone has crossed out *Rosalind* and written *RAIN* in green ink, pressing hard enough to dent the paper.'; },
    },
  },

  matchbook: {
    id: 'matchbook', name: 'matchbook', icon: icon('matchbook'),
    verbs: {
      look: (c) => { c.note('kev'); return 'THE ELECTRIC OWL, over a cartoon owl with spirals for eyes. Inside, in your own handwriting: *Kev knows.* You wish Kev would share.'; },
      open: (c) => items.matchbook!.verbs.look!(c),
      consume: () => 'You chew one match out of habit. It tastes like a long week.',
    },
  },

  money: {
    id: 'money', name: (s) => (s.flags.boughtDisguise ? 'two dollars' : 'seven dollars'), icon: icon('money'),
    verbs: {
      look: (c) => c.flag('boughtDisguise')
        ? 'Two dollars. Your entire fortune, minus the price of looking like you belong here.'
        : 'Seven dollars in a fold. Your retainer must be somewhere else, probably with your memory, having a lovely time.',
    },
  },

  knife: {
    id: 'knife', name: 'butter knife', icon: icon('knife'),
    verbs: {
      look: () => 'A butter knife, slightly buttered. Thin enough to slip a latch, dull enough to be no use in an argument.',
      consume: () => 'There\'s a smear of butter on it. You lick it off. It\'s the best thing that has happened to you in three days, as far as you know.',
    },
  },

  page: {
    id: 'page', name: 'notebook page', icon: icon('page'),
    verbs: {
      look: (c) => {
        c.note('stakes'); c.set('stakesKnown');
        return 'Torn from your own notebook, your handwriting gone ragged and huge, like a man writing on a moving train: *LETHE — 5000 — SUNDOWN — PANHANDLE — STOP IT.* Sundown in August is about seven-thirty. You don\'t know what LETHE is. You wrote it like you were afraid of it.';
      },
    },
  },

  envelope: {
    id: 'envelope', name: 'Rain\'s envelope', icon: icon('envelope'),
    verbs: {
      look: () => 'A plain envelope, sealed with a blob of red candle wax. *FRANK* on the front, in green ink.',
      open: (c) => {
        c.remove('envelope'); c.give('tab'); c.give('note');
        return 'You break the wax. Inside: a square of foil folded around one blue tablet, and a note in green ink.';
      },
    },
  },

  tab: {
    id: 'tab', name: 'blue tab', icon: icon('tab'),
    verbs: {
      look: () => 'Foil, folded neat as a pharmacist\'s, around one blue tablet stamped with a lightning bolt. Blue Lightning, the street calls it, the purest acid in California. This one is pretending.',
      open: () => 'You peel the foil back far enough to see the blue. That\'s far enough.',
      consume: (c) => c.die('blue-tab'),
    },
  },

  note: {
    id: 'note', name: 'Rain\'s note', icon: icon('note'),
    verbs: {
      look: (c) => { c.note('owl'); return 'Green ink, a quick hand: *"If Frank forgets: the Owl. Kev hid the key."* Underneath, smaller and underlined twice: *"Don\'t drink the tea."*'; },
    },
  },

  slip: {
    id: 'slip', name: 'clinic slip', icon: icon('slip'),
    verbs: {
      look: () => 'Dr. Fields\'s handwriting, all business: *Sample: 1 blue tab, sold as "Blue Lightning." NOT LSD. Unknown compound, consistent with the Lotus Foundation cases: retrograde amnesia (weeks to months), marked placidity, compliance. DO NOT DISTRIBUTE.* Signed, dated, and underlined so hard the pen went through.',
    },
  },

  disguise: {
    id: 'disguise', name: (s) => (s.flags.disguised ? 'shades & beads (wearing)' : 'shades & love beads'), icon: icon('sunglasses'),
    verbs: {
      look: (c) => isDisguised(c)
        ? 'You\'re wearing round purple shades and a string of love beads. In a shop window you catch a tired man at a costume party. It\'ll do.'
        : 'Round sunglasses with purple lenses and a string of painted wooden love beads. With these on, you\'d be just another lost soul on Haight Street, which is not far from the truth.',
      use: (c) => {
        if (isDisguised(c)) { c.set('disguised', false); return 'You take off the shades and beads. The world looks sharper and more dangerous, which is accurate.'; }
        c.set('disguised'); c.note('disguise');
        return 'You put on the shades and loop the beads over your head. The world turns violet. A girl going past flashes you a peace sign, and you flash one back before you can stop yourself. Your hand seems pleased about it.';
      },
    },
  },

  card: {
    id: 'card', name: 'Seeker card', icon: icon('card'),
    verbs: {
      look: () => 'A cream card with a gold lotus. *THE LOTUS FOUNDATION welcomes this SEEKER. Present at the door. Free consciousness therapy. All are healed.* All are healed. It\'s the kind of promise that ought to come with fine print.',
    },
  },

  brasskey: {
    id: 'brasskey', name: 'brass key', icon: icon('brassKey'),
    verbs: {
      look: () => 'A heavy brass key with a lotus stamped into the bow. It smells faintly of garbage and, under that, of the sea.',
    },
  },

  ledger: {
    id: 'ledger', name: 'Kell\'s ledger', icon: icon('ledger'),
    verbs: {
      look: (c) => { c.note('ledger'); return 'A slim ledger bound in oxblood leather. Weekly entries: *R.B. — $500. R.B. — $500. R.B. — $1,000 (Sat.).* A second column, headed *LOTUS*, lists doses, ages and "outcomes" in a tidy clinical hand. Every page is initialled *G.*'; },
      open: (c) => items.ledger!.verbs.look!(c),
    },
  },
};
