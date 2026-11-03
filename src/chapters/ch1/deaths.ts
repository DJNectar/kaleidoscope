import type { Death } from '../../engine/types';

const d = (id: string, title: string, text: string): Death => ({ id, title, text });

export const deaths: Record<string, Death> = {
  'attic-window': d('attic-window', 'Decorative Fire Escape',
    'You climb out onto the fire escape. It was installed in 1911 by a man who believed in beauty over function, and it has been waiting fifty-six years to prove his point. You arrive in the garden before the rust does. Not by much.'),
  'blue-tab': d('blue-tab', 'Blue Lightning',
    'You put the evidence in your mouth. It tastes like tinfoil and bad ideas. For eleven glorious minutes you understand everything: the city, the stars, the precise weight of your own heart. Then your heart stops, and you understand that too.'),
  fixer: d('fixer', 'Ginger Ale',
    'It\'s not ginger ale. It\'s photographic fixer, kept in a ginger-ale bottle by a man who also keeps his rent money in a coffee can marked RENT MONEY. Your insides develop. Your prospects do not.'),
  bus: d('bus', 'Flower Power',
    'You step off the curb without looking. A painted bus doing thirty, flowers wired to its bumper, a peace sign where the hood ornament should be, introduces itself. Somebody puts a daisy on your chest. It\'s a nice gesture.'),
  brownie: d('brownie', 'Tuesday',
    'The brownie is very good, then very large, then very far away. You wake up on Sunny\'s stockroom floor with a beaded curtain for a blanket. It\'s Tuesday. The papers are full of the Panhandle. You buy one, and then you stop reading.'),
  'bruno-panhandle': d('bruno-panhandle', 'Held for Questioning',
    'A hand on each elbow, polite as a pallbearer. "Lieutenant Bruno would like a word, Tolliver." The word is "overnight." The cell at Park Station has a high window, and through it, at sundown, you hear the music start. Then you hear it stop.'),
  'tiny-recognize': d('tiny-recognize', 'Remember Me?',
    'Tiny drops his cigarette and steps on it, slowly, the way he\'s about to step on you. "The private eye," he says. "Doc said you\'d be sleeping." You are, shortly. It\'s fast. He\'s a professional, and you\'re a footnote.'),
  'tiny-hit': d('tiny-hit', 'Hit Parade',
    'You throw the best punch of your life. It lands square on Tiny\'s jaw. Tiny looks at you with real interest, the way a man looks at a mosquito that has somehow learned to talk. Then he hits back, once, and the alley gets very quiet.'),
  'alley-fire-escape': d('alley-fire-escape', 'Another Fire Escape',
    'You\'d think you\'d have learned. The fire escape behind the Owl holds your weight for three rungs, then makes a noise like a trombone falling downstairs. So do you.'),
  tea: d('tea', 'Herbal Tea',
    'Sister Dawn\'s tea is warm and sweet and tastes faintly of almonds. "Rest," she says, and you do. The cushions are soft. The candles are pretty. You never find out what was in it, which is the one mercy in this whole business.'),
  'gas-valve': d('gas-valve', 'Spectacular',
    'You give the red valve a twist. Gas hisses, finds the furnace pilot, and has a short, frank conversation with it. The Lotus Foundation loses its basement, its ground floor and its sense of serenity. Neighbours describe the bang as "far out." You are not available for comment.'),
  'kell-shot': d('kell-shot', 'Your Own Gun',
    'Dr. Kell sighs, the way a man sighs at a patient who won\'t cooperate, and shoots you with your own .38. It\'s a good gun. You always said so. You just never wanted a second opinion.'),
  clock: d('clock', 'Sundown',
    'Seven-thirty. Two trucks pull away from Masonic Avenue with the crates under a tarp, and by eight there are five thousand blue tabs in five thousand hands in the Panhandle. Next morning the Clarion runs a single word over the fold: HORROR. Somewhere in a gray office, Mr. Garrison reads it twice and calls it a success.'),
};
