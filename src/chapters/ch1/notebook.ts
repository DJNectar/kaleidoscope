import type { NotebookEntry } from '../../engine/types';

const n = (id: string, title: string, text: string): NotebookEntry => ({ id, title, text });

export const notebook: Record<string, NotebookEntry> = {
  self: n('self', 'Frank Tolliver', 'Me, apparently. Licensed private investigator. Ex-SFPD. Missing three days and a .38.'),
  rain: n('rain', 'Rosalind "Rain" Whitcombe', 'Nineteen. The girl in the photo. Her mother wants her home. She may have opinions about that.'),
  kev: n('kev', '"Kev knows"', 'Written in my hand inside an Electric Owl matchbook. Kev who? Knows what?'),
  stakes: n('stakes', 'LETHE, 5000, Sundown', 'My own scrawl: *LETHE — 5000 — SUNDOWN — PANHANDLE — STOP IT.* Sundown is about seven-thirty. Whatever LETHE is, I wrote it like I was afraid of it.'),
  kaleidoscope: n('kaleidoscope', 'The kaleidoscope', 'A child\'s toy, brass and cardboard, a crack in one mirror. Look through it in the right place and the missing days come back in pieces.'),
  moondog: n('moondog', 'Moondog', 'Poster artist, second floor. Rain trusted him. He trusts nobody, least of all his own posters.'),
  owl: n('owl', 'The Owl', 'Rain\'s note: "If Frank forgets: the Owl. Kev hid the key. Don\'t drink the tea."'),
  lethe: n('lethe', 'What LETHE does', 'Dr. Fields tested the blue tab. It doesn\'t kill. It takes the last few months out of your head and leaves you calm, pleasant and asking for a haircut. Five thousand of them, tonight.'),
  kell: n('kell', 'Dr. Ambrose Kell', 'Psychiatrist. Runs the Lotus Foundation on Masonic. Took a government grant in 1959 that his colleagues refused. A man in a gray suit signed the papers.'),
  bruno: n('bruno', 'Lt. Ray Bruno', 'SFPD Narcotics. Gray Plymouth. Carried me out of the Owl on Thursday with a biker called Tiny. We used to share a coffee pot.'),
  key: n('key', 'The cellar key', 'Brass, a lotus on the bow. Tiny dropped it; Kev hid it in the dumpster behind the Owl.'),
  disguise: n('disguise', 'New look', 'Round shades, love beads. Sunny says I look "almost groovy." Tiny and Bruno\'s people won\'t look twice.'),
  card: n('card', 'Seeker card', 'From the Lotus table in the Panhandle. Gets you in the front door on Masonic.'),
  calder: n('calder', 'Sky Calder', 'The real Blue Lightning chemist, furious that someone is wearing his name. Mentioned his Laguna people: "the Fellowship."'),
  ledger: n('ledger', 'Kell\'s ledger', 'Weekly payments to "R.B." And a column headed LOTUS, every page initialled "G."'),
  rainAwake: n('rainAwake', 'Rain', 'Herself again. Furious, mostly at me. The crates are in the old furnace room. Kell has my gun.'),
};
