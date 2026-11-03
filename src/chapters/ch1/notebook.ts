import type { NotebookEntry } from '../../engine/types';

const n = (id: string, title: string, text: string): NotebookEntry => ({ id, title, text });

export const notebook: Record<string, NotebookEntry> = {
  self: n('self', 'Frank Tolliver', 'Me, apparently. Licensed private investigator. Ex-SFPD. Missing three days and a .38.'),
  rain: n('rain', 'Rosalind "Rain" Whitcombe', 'Nineteen. The girl in the photo. Last seen in the Haight. Her mother wants her home. She may not want to go.'),
  kev: n('kev', '"Kev knows"', 'Written in my hand inside an Electric Owl matchbook. Kev who? Knows what?'),
  stakes: n('stakes', 'Blue Lightning, 5000, Sundown', 'My own note: *BLUE LIGHTNING — 5000 — SUNDOWN — PANHANDLE — STOP IT — LOTUS.* Sundown is about seven-thirty.'),
  moondog: n('moondog', 'Moondog', 'Poster artist, second floor. Rain trusted him. He trusts nobody, including himself.'),
  owl: n('owl', 'The Owl', 'Rain\'s note: "If Frank forgets — the Owl. Kev hid the key."'),
  poison: n('poison', 'The tab is poison', 'Dr. Fields at the free clinic tested the blue tab. Cut with something that kills at scale. Five thousand of them would fill every hospital in the city.'),
  kell: n('kell', 'Dr. Ambrose Kell', 'Psychiatrist. Runs the Lotus Foundation on Masonic. Sends kids to the free clinic. Brother Ananda says he sold out to the government years ago.'),
  bruno: n('bruno', 'Lt. Ray Bruno', 'SFPD Narcotics. Gray Plymouth. Carried me out of the Owl Thursday night with a biker called Tiny. Used to borrow my pens.'),
  key: n('key', 'The cellar key', 'Brass, lotus on the bow. Tiny dropped it; Kev hid it in the dumpster behind the Owl.'),
  disguise: n('disguise', 'New look', 'Round shades, love beads. Sunny says I look "almost groovy." Tiny and Bruno\'s men won\'t look twice.'),
  card: n('card', 'Seeker card', 'From the Lotus table in the Panhandle. Gets you in the front door on Masonic.'),
  calder: n('calder', 'Sky Calder', 'The real Blue Lightning chemist. Furious someone\'s counterfeiting him. Mentioned his Laguna people: "the Fellowship."'),
  ledger: n('ledger', 'Kell\'s ledger', 'Weekly payments to "R.B." And a column headed LOTUS, initialled "G."'),
  rainAwake: n('rainAwake', 'Rain', 'Awake. Furious. The batch is in the old furnace room downstairs. Kell has my gun.'),
};
