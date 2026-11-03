import type { Chapter, GameState, TimedEvent } from '../../engine/types';
import { deaths } from './deaths';
import { endings } from './endings';
import { items } from './items';
import { notebook } from './notebook';
import { scenes } from './scenes';

const START = 16 * 60; // 4:00 PM
const at = (h: number, m = 0) => h * 60 + m - START;
const live = (s: GameState) => !s.flags.burned;
const warned = (s: GameState) => live(s) && !!s.flags.stakesKnown;

const events: TimedEvent[] = [
  { id: 'w-630', at: at(18, 30), when: warned, run: () => 'Six-thirty. The light over the park is turning orange, like a peach that has started to worry.' },
  { id: 'w-700', at: at(19), when: warned, run: () => 'Seven o\'clock. A long bass note rolls over the rooftops from the Panhandle, the soundcheck, and every window on the street hums along a little.' },
  { id: 'w-715', at: at(19, 15), when: warned, run: () => 'Seven-fifteen. Your watch has started ticking louder, out of what you can only assume is professional courtesy. Fifteen minutes.' },
  { id: 'deadline', at: at(19, 30), when: live, run: (c) => c.die('clock') },
];

export const ch1: Chapter = {
  id: 'ch1',
  title: 'The Sundown Batch',
  dateLine: 'SAT · AUG 19 · 1967',
  clockStart: START,
  deadline: at(19, 30),
  shardCount: 5,
  startScene: 'attic',
  startInventory: ['notebook'],
  intro: [
    'You wake up at four o\'clock on a Saturday afternoon, which is a time that exists mainly so people can feel bad about it. Sun comes through a tie-dyed curtain and lies across the floorboards like a dog that has decided this is its spot now. On the windowsill, a pigeon with one bent tail feather looks at you as if you owe it money.',
    'Three days are missing. Not lost: lost things turn up in coat pockets. Your holster is empty. The last thing you remember clearly is Wednesday.',
  ],
  scenes, items, deaths, endings, events, notebook,
  exportFlags: (s) => ({
    ch1Ending: s.over?.kind === 'ending' ? s.over.id : 'none',
    ch1RainSafe: !!s.flags.rainAwake,
    ch1Ledger: s.inventory.includes('ledger'),
    ch1CalderAlly: !!s.flags.calderAlly,
    ch1AllShards: s.shards.length >= 5,
  }),
};
