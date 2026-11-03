import type { Ending, GameState } from '../../engine/types';

const calder = (s: GameState) => (s.flags.calderAlly
  ? ' Sterling "Sky" Calder, cleared of every charge the papers had ready for him, was seen re-soldering a speaker cable at dawn and refusing all interviews.'
  : ' Sterling "Sky" Calder, whose name was on the counterfeit tabs, has been cleared.');

export const endings: Record<string, Ending> = {
  best: {
    id: 'best', win: true,
    headline: 'PSYCHIATRIST INDICTED IN PANHANDLE POISON PLOT',
    body: (s) => 'Dr. Ambrose Kell of the so-called Lotus Foundation was indicted this morning on charges connected to five thousand poisoned tablets destroyed in a Masonic Avenue basement hours before they were to be handed out free in the Panhandle. Lt. Ray Bruno of SFPD Narcotics was arrested at his desk, a ledger of weekly payments marked "R.B." in evidence.' + calder(s) +
      ' The Morning Ghosts played a five-hour set to a crowd that will never know how close it came. Miss Rosalind Whitcombe has gone home, on her own terms, and says she will not be staying long.\n\n' +
      '*Three days later an envelope arrives at your office, postmarked Laguna Beach. A lotus pressed into the wax seal. Inside, on a single card, one word:* **Fellowship.** *Mr. Garrison, the papers note, could not be located.*',
  },
  good: {
    id: 'good', win: true,
    headline: 'PSYCHIATRIST, NARCOTICS LIEUTENANT CHARGED',
    body: (s) => 'Dr. Ambrose Kell was arrested in the basement of his Masonic Avenue "therapy house" beside the ashes of five thousand poisoned tablets. Lt. Ray Bruno was taken into custody hours later on the strength of a payment ledger.' + calder(s) +
      ' The Morning Ghosts played until the sun came up. Rosalind Whitcombe is home in Pacific Heights.\n\n*You got her back. You got the ledger. You still can\'t account for Wednesday through Friday, and some nights, when the radiator knocks, you feel them knocking with it.*',
  },
  bittersweet: {
    id: 'bittersweet', win: true,
    headline: 'DOCTOR HELD AFTER BASEMENT FIRE ON MASONIC',
    body: (s) => 'Dr. Ambrose Kell faces charges after firefighters found the remains of a large drug batch in his basement furnace. Kell has retained counsel and says he was "framed by the very people he was trying to heal."' + calder(s) +
      ' Rosalind Whitcombe is safe.\n\n*Lt. Ray Bruno gave a statement on the Hall of Justice steps about "outside agitators." He shook your hand for the photographers. His grip was dry and friendly and lasted one second too long.*',
  },
  lonely: {
    id: 'lonely', win: true,
    headline: 'FIRE IN FOUNDATION BASEMENT; NO INJURIES REPORTED',
    body: () => 'A small fire in the basement of the Lotus Foundation on Masonic Avenue was put out by staff before engines arrived. Foundation director Dr. Ambrose Kell called it "a furnace accident." The free gathering in the Panhandle went ahead without incident.\n\n' +
      '*You watched the smoke from across the street, your back against a eucalyptus, until the trucks didn\'t come. Before dawn a gray car pulled up to the side door. Two men carried someone out wrapped in a blanket, long dark hair hanging loose. By the time you reached the corner, the car was gone. You know her name. You know her mother\'s address. You know you\'re not done.*',
  },
};

/** Which win the Rain route earns. */
export function rainEnding(s: GameState): 'best' | 'good' | 'bittersweet' {
  if (!s.inventory.includes('ledger')) return 'bittersweet';
  return s.shards.length >= 5 ? 'best' : 'good';
}
