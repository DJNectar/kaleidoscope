// The optimal route to the best ending, shared by the unit test and the Playwright walkthrough.
import type { ActionInput } from '../../src/engine/types';

type Step = ActionInput & { expect?: string };
const a = (verb: ActionInput['verb'], target: string, w?: string): Step => (w ? { verb, target, with: w } : { verb, target });

export const ATTIC: Step[] = [
  a('look', 'fedora'),            // licence
  a('take', 'kaleidoscope'),
  a('use', 'licence', 'kaleidoscope'), // shard 1
  a('take', 'coat'),              // photo, matchbook, $7
  a('look', 'mattress'),          // notebook page, starts warnings
  a('take', 'toast'),             // butter knife
  a('use', 'door', 'knife'),
  a('go', 'exit:landing'),
];

export const TO_CLINIC: Step[] = [
  a('hit', 'eyedoor'),            // knock: Moondog lets you in
  a('give', 'moondog', 'photo'),  // envelope
  a('open', 'envelope'),          // tab + note
  a('go', 'exit:landing'),
  a('go', 'exit:haight'),
  a('go', 'exit:clinic'),
  a('give', 'fields', 'tab'),     // slip
  a('use', 'kids', 'kaleidoscope'), // shard 2
  a('go', 'exit:haight'),
];

export const DISGUISE: Step[] = [
  a('go', 'exit:thirdeye'),
  a('give', 'sunny', 'money'),
  a('use', 'self', 'disguise'),
  a('go', 'exit:haight'),
];

export const OWL_ALLEY: Step[] = [
  a('go', 'exit:owl'),
  a('talk', 'kev'),
  a('use', 'projector'),          // light show
  a('use', 'projector', 'kaleidoscope'), // shard 3
  a('go', 'exit:alley'),
  a('open', 'dumpster'),          // brass key
  a('go', 'exit:owl'),
  a('go', 'exit:haight'),
];

export const PANHANDLE: Step[] = [
  a('go', 'exit:panhandle'),
  a('talk', 'volunteer'),         // Seeker card
  a('use', 'scaffold', 'kaleidoscope'), // shard 5
  a('go', 'exit:lotus'),
];

export const PARLOR_LAB: Step[] = [
  a('give', 'frontdoor', 'card'), // admitted to parlor
  a('use', 'rain', 'kaleidoscope'), // Rain remembers
  a('take', 'ledger'),
  a('use', 'ledger', 'kaleidoscope'), // shard 4
  a('use', 'basementdoor', 'brasskey'),
  a('go', 'exit:lab'),
  a('open', 'crates'),
  a('open', 'furnace'),
  a('use', 'crates'),             // burn → Kell arrives
  a('talk', 'kell'),              // Rain clubs him → best ending
];

export const BEST_ROUTE: Step[] = [...ATTIC, ...TO_CLINIC, ...DISGUISE, ...OWL_ALLEY, ...PANHANDLE, ...PARLOR_LAB];
