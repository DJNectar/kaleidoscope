import type { Ctx, Item } from '../../engine/types';
import { svgIcon } from '../../art/icons';
import { notebook } from './notebook';

const icon = (name: string) => () => svgIcon(name);

export const isDisguised = (c: Pick<Ctx, 'flag'>) => !!c.flag('disguised');

export const items: Record<string, Item> = {
  notebook: {
    id: 'notebook', name: 'case notebook', icon: icon('notebook'),
    verbs: {
      look: (c) => {
        const entries = c.state.notebook.map((id) => notebook[id]).filter(Boolean);
        if (!entries.length) return 'Your notebook. The last three days are blank pages, like someone tore them out of you.';
        return ['You flip through your notebook. In your own hand, more or less:', ...entries.map((e) => `**${e!.title}.** ${e!.text}`)];
      },
      open: (c) => items.notebook!.verbs.look!(c),
      consume: () => 'You\'ve eaten your words before. Not literally. Not today.',
    },
  },

  licence: {
    id: 'licence', name: 'PI licence', icon: icon('card'),
    verbs: {
      look: () => 'State of California, Private Investigator. FRANCIS X. TOLLIVER. The photo is you, five years ago, back when you still believed in things.',
    },
  },

  photo: {
    id: 'photo', name: 'photo of Rain', icon: icon('photo'),
    verbs: {
      look: (c) => { c.note('rain'); return 'A girl, nineteen, long dark hair ironed straight, laughing at whoever held the camera. On the back, in a careful finishing-school hand: *Rosalind, Easter 1967.* Someone has crossed out *Rosalind* and written *RAIN* in green ink.'; },
    },
  },

  matchbook: {
    id: 'matchbook', name: 'matchbook', icon: icon('matchbook'),
    verbs: {
      look: (c) => { c.note('kev'); return 'THE ELECTRIC OWL, it says, over a cartoon owl with spirals for eyes. Inside, in your own handwriting: *Kev knows.* You wish Kev would share.'; },
      open: (c) => items.matchbook!.verbs.look!(c),
      consume: () => 'You chew one match, out of habit. It tastes like a bad week.',
    },
  },

  money: {
    id: 'money', name: (s) => (s.flags.boughtDisguise ? 'two dollars' : 'seven dollars'), icon: icon('money'),
    verbs: {
      look: (c) => c.flag('boughtDisguise')
        ? 'Two dollars. Your entire fortune, minus the price of looking like you belong here.'
        : 'Seven dollars in a fold. Your retainer must be somewhere else. So must your sense of direction.',
    },
  },

  knife: {
    id: 'knife', name: 'butter knife', icon: icon('knife'),
    verbs: {
      look: () => 'A butter knife, slightly buttered. Thin enough to slip a latch, dull enough not to matter in a fight.',
      consume: () => 'There\'s a smear of butter on it. You lick it off. It\'s the best thing that\'s happened today.',
    },
  },

  page: {
    id: 'page', name: 'notebook page', icon: icon('page'),
    verbs: {
      look: (c) => {
        c.note('stakes'); c.set('stakesKnown');
        return 'Torn from your own notebook, your own handwriting gone ragged and huge: *BLUE LIGHTNING — 5000 — SUNDOWN — PANHANDLE — STOP IT — LOTUS.* Sundown in August is about seven-thirty. Your watch says you have until then.';
      },
    },
  },

  envelope: {
    id: 'envelope', name: 'Rain\'s envelope', icon: icon('envelope'),
    verbs: {
      look: () => 'A plain envelope, sealed with a blob of red candle wax. *FRANK* on the front, in green ink.',
      open: (c) => {
        c.remove('envelope'); c.give('tab'); c.give('note');
        return 'You break the wax. Inside: a square of foil folded around a single blue tablet, and a note in green ink.';
      },
    },
  },

  tab: {
    id: 'tab', name: 'blue tab', icon: icon('tab'),
    verbs: {
      look: () => 'Foil, folded neat as a pharmacist\'s, around one blue tablet stamped with a lightning bolt. Blue Lightning, the street calls it. The purest acid in California. Supposedly.',
      open: () => 'You peel the foil back far enough to see the blue. That\'s far enough.',
      consume: (c) => c.die('blue-tab'),
    },
  },

  note: {
    id: 'note', name: 'Rain\'s note', icon: icon('note'),
    verbs: {
      look: (c) => { c.note('owl'); return 'Green ink, quick hand: *"If Frank forgets — the Owl. Kev hid the key."* Under it, smaller: *"Don\'t take the tea."*'; },
    },
  },

  slip: {
    id: 'slip', name: 'toxicology slip', icon: icon('slip'),
    verbs: {
      look: () => 'Dr. Fields\'s handwriting, all business: *Sample 1 blue tab. LSD present, approx 100 mcg. ALSO: unidentified compound, consistent w/ cardiac toxicity. Lethal dose est. 1 tab for 1 in 20 users. DO NOT DISTRIBUTE.* Signed and dated.',
    },
  },

  salts: {
    id: 'salts', name: 'smelling salts', icon: icon('salts'),
    verbs: {
      look: () => 'A brown vial of smelling salts. Dr. Fields\'s label: *For the ones who go too deep.*',
      open: () => 'You uncork it and take a sniff. Your eyes water, your brain stands up straight. You cork it again; it\'s not for you.',
      consume: () => 'You\'re supposed to sniff them, not drink them. You\'re detective enough to work that out.',
      use: {
        self: () => 'One whiff. Your sinuses file a complaint and the room snaps into focus. Better save the rest for someone who needs it more.',
      },
    },
  },

  disguise: {
    id: 'disguise', name: (s) => (s.flags.disguised ? 'shades & beads (wearing)' : 'shades & love beads'), icon: icon('sunglasses'),
    verbs: {
      look: (c) => isDisguised(c)
        ? 'You\'re wearing round purple shades and a string of love beads. You catch your reflection in a window: a tired man at a costume party. It\'ll do.'
        : 'Round sunglasses with purple lenses and a string of painted wooden love beads. With these on, you\'d be just another lost soul on Haight Street.',
      use: (c) => {
        if (isDisguised(c)) { c.set('disguised', false); return 'You take off the shades and beads. The world looks sharper and more dangerous, which is accurate.'; }
        c.set('disguised'); c.note('disguise');
        return 'You put on the shades and loop the love beads over your head. The world turns violet. A girl going past flashes you a peace sign. You flash one back before you can stop yourself.';
      },
    },
  },

  card: {
    id: 'card', name: 'Seeker card', icon: icon('card'),
    verbs: {
      look: () => 'A cream card with a gold lotus. *THE LOTUS FOUNDATION welcomes this SEEKER. Present at the door. Free consciousness therapy. All are healed.* All are healed. That\'s quite a promise.',
    },
  },

  brasskey: {
    id: 'brasskey', name: 'brass key', icon: icon('brassKey'),
    verbs: {
      look: () => 'A heavy brass key with a lotus stamped into the bow. It smells faintly of garbage and very faintly of the sea.',
    },
  },

  ledger: {
    id: 'ledger', name: 'Kell\'s ledger', icon: icon('ledger'),
    verbs: {
      look: () => 'A slim ledger bound in oxblood leather. Weekly entries: *R.B. — $500. R.B. — $500. R.B. — $1,000 (Sat.).* A second column, headed *LOTUS*, lists dosages, ages and outcomes in a neat clinical hand, each page initialled *G.*',
      open: (c) => items.ledger!.verbs.look!(c),
    },
  },
};
