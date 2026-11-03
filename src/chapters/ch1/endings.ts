import type { Ending, GameState } from '../../engine/types';

const calder = (s: GameState) => (s.flags.calderAlly
  ? ' Sterling "Sky" Calder, whose name was on the counterfeit tabs, has been cleared. He was seen at dawn re-soldering a speaker cable and declining all interviews, on the grounds that the treble was still wrong.'
  : ' Sterling "Sky" Calder, whose name was on the counterfeit tabs, has been cleared.');

export const endings: Record<string, Ending> = {
  best: {
    id: 'best', win: true,
    headline: 'PSYCHIATRIST INDICTED IN PANHANDLE PLOT',
    body: (s) => 'Dr. Ambrose Kell of the Lotus Foundation was indicted this morning in connection with five thousand tablets, destroyed in a Masonic Avenue basement hours before they were to be handed out free at Saturday\'s gathering. Doctors at the Clayton Street free clinic say the drug, codenamed LETHE, erases recent memory. Lt. Ray Bruno of SFPD Narcotics was arrested at his desk; a ledger of weekly payments marked "R.B." is in evidence.' + calder(s) +
      ' The Morning Ghosts played for five hours to a crowd that remembers every minute. Miss Rosalind Whitcombe has gone home to tell her mother she isn\'t staying.\n\n' +
      '*Three days later the pigeon lands on your office windowsill in the Tenderloin with an envelope tied to its leg. Postmarked Laguna Beach. A lotus pressed into the wax. Inside, on a single card, one word:* **Fellowship.** *Mr. Garrison, the papers note, could not be located. Possibly there was more than one of him.*',
  },
  good: {
    id: 'good', win: true,
    headline: 'PSYCHIATRIST, NARCOTICS LIEUTENANT CHARGED',
    body: (s) => 'Dr. Ambrose Kell was arrested in the basement of his Masonic Avenue "therapy house" beside the ashes of five thousand tablets of an experimental drug. Lt. Ray Bruno was taken into custody hours later on the strength of a payment ledger.' + calder(s) +
      ' The Morning Ghosts played until the fog came in. Rosalind Whitcombe is safe.\n\n*You got her back. You got the ledger. You still can\'t account for all of Thursday, and some nights, when the radiator knocks, you could swear it\'s knocking back.*',
  },
  bittersweet: {
    id: 'bittersweet', win: true,
    headline: 'DOCTOR HELD AFTER BASEMENT FIRE',
    body: (s) => 'Dr. Ambrose Kell faces charges after firefighters found the remains of a large drug batch in the furnace of the Lotus Foundation. Kell has retained counsel and says he was "framed by the very people he was trying to heal."' + calder(s) +
      ' Rosalind Whitcombe is safe.\n\n*Lt. Ray Bruno gave a statement on the Hall of Justice steps about "outside agitators," then shook your hand for the photographers. His grip was dry and friendly and lasted one second too long, like a sentence with a word missing.*',
  },
  lonely: {
    id: 'lonely', win: true,
    headline: 'FIRE IN FOUNDATION BASEMENT; NO INJURIES',
    body: () => 'A small fire in the basement of the Lotus Foundation on Masonic Avenue was put out by staff before engines arrived. Foundation director Dr. Ambrose Kell called it "a furnace accident." The free gathering in the Panhandle went ahead, loud and gentle and entirely without incident.\n\n' +
      '*You watched the smoke from across the street, your back against a eucalyptus, until the trucks didn\'t come. Before dawn a gray car pulled up to the side door. A girl in a white dress came down the steps with a man on either side of her. She saw you under the tree and waved, politely, the way you wave at a stranger who looks a little sad. You know her name. You know her mother\'s address. You know you\'re not done.*',
  },
};

/** Which win the Rain route earns. */
export function rainEnding(s: GameState): 'best' | 'good' | 'bittersweet' {
  if (!s.inventory.includes('ledger')) return 'bittersweet';
  return s.shards.length >= 5 ? 'best' : 'good';
}
