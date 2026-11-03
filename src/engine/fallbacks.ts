import type { TargetKind, Verb } from './types';

// Generic lines for when nothing more specific exists. {n} = target name,
// {w} = the held item's name. Picked deterministically so tests are stable.

type Table = Partial<Record<TargetKind | 'any', string[]>>;

const LINES: Record<Verb, Table> = {
  look: {
    any: [
      'You look at the {n}. It looks back, in its way. Nothing you can use.',
      'The {n}. You file it away under "things that exist."',
      'You give the {n} the once-over. It keeps its secrets, if it has any.',
    ],
    person: [
      'You study {n}. People are harder to read than the racing form, and you were never good at the racing form.',
    ],
    exit: ['The way to {n}. It goes where it says it goes.'],
  },
  take: {
    any: [
      "You can't take the {n}. Some things stay where they are.",
      'The {n} stays put. Your pockets are already full of trouble.',
      "You don't need the {n}. You barely need what you've got.",
    ],
    person: ["You can't take {n} anywhere they don't want to go."],
    item: ['You already have it. Holding it tighter won\'t help.'],
    exit: ["You can't pick up a direction. You've tried."],
  },
  open: {
    any: [
      "The {n} doesn't open. Not for you, not today.",
      "There's nothing about the {n} that opens.",
    ],
    person: ['{n} isn\'t opening up. Not like that.'],
  },
  close: {
    any: [
      "The {n} is as closed as it's going to get.",
      'Nothing to close. The {n} has no opinions about it.',
    ],
  },
  talk: {
    any: [
      'You say something to the {n}. The {n} says nothing back. Fair enough.',
      "You've talked to worse. At least the {n} doesn't lie.",
    ],
    person: ['{n} doesn\'t seem to have anything for you right now.'],
    self: ['You tell yourself it\'ll be fine. You\'ve heard better liars.'],
  },
  use: {
    any: [
      "You can't think of a use for the {n}. Neither can the {n}.",
      'You fiddle with the {n}. Nothing comes of it.',
    ],
    item: ['Use the {n} on what?'],
  },
  give: {
    any: ['The {n} has no use for your {w}.'],
    person: [
      '{n} looks at your {w}, then at you. "What am I supposed to do with that?"',
      '{n} doesn\'t want your {w}. Can\'t say you blame them.',
    ],
  },
  hit: {
    any: [
      "You'd need a reason to hit the {n}. You don't have one.",
      "You think about hitting the {n}. The {n} wins the argument without moving.",
      'Hitting the {n} would hurt your hand and your dignity, in that order.',
    ],
    person: ['You keep your hands to yourself. One of you should stay civilized.'],
    self: ['You\'ve been hit enough for one week.'],
  },
  consume: {
    any: [
      "You're hungry, but not for the {n}.",
      "You're not putting the {n} in your mouth. You've got standards. Low ones, but standards.",
    ],
    person: ['No.'],
  },
  go: {
    any: ["The {n} isn't a place you can go.", 'You walk up to the {n}. That\'s as far as it goes.'],
    person: ['You step closer to {n}. Close enough.'],
  },
};

const WITH_LINES: string[] = [
  'Using the {w} on the {n} does exactly nothing.',
  "The {w} and the {n} weren't made for each other.",
  "You try the {w} on the {n}. Nothing. You've had better ideas.",
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function fill(line: string, name: string, withName?: string): string {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  let out = line.replace(/\{n\}/g, name).replace(/\{w\}/g, withName ?? 'that');
  // Lines that start with a name should start capitalized.
  if (out.startsWith(name)) out = cap(out);
  return out;
}

export function fallbackLine(
  verb: Verb,
  kind: TargetKind,
  name: string,
  seed: string,
  withName?: string,
): string {
  if (verb === 'use' && withName) {
    const pool = WITH_LINES;
    return fill(pool[hash(seed) % pool.length]!, name, withName);
  }
  const table = LINES[verb];
  const pool = table[kind] ?? table.any ?? ['Nothing happens.'];
  return fill(pool[hash(seed) % pool.length]!, name, withName);
}
