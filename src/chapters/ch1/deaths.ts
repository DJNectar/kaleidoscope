import type { Death } from '../../engine/types';

const d = (id: string, title: string, text: string): Death => ({ id, title, text });

export const deaths: Record<string, Death> = {
  'attic-window': d('attic-window', 'Decorative Fire Escape',
    'The fire escape was installed in 1911 by an ironworker who believed a thing should be beautiful first and functional at some later, unspecified date. That date is not today. You fall four storeys, which takes about as long as remembering, very clearly, where you left your car keys in 1958. The garden receives you without comment. On the sill above, the pigeon makes a note.'),
  'blue-tab': d('blue-tab', 'A Very Nice Haircut',
    'You swallow the blue tab. Twenty minutes later you are the happiest man in San Francisco, and you have no idea why you\'re standing on Haight Street in a trench coat. It doesn\'t matter. Nothing matters, in the nicest possible way. You get a haircut. You call your mother, who died in 1951, and leave a warm message. On Monday you enlist. The recruiting sergeant says he\'s never seen a man so calm.'),
  fixer: d('fixer', 'Ginger Ale',
    'It isn\'t ginger ale. It\'s photographic fixer, kept in a ginger-ale bottle by a man who also keeps his rent money in a coffee can marked RENT MONEY. Your insides develop slowly, like a print in a tray: first the outline, then the shadows, then a clear and final image of your own judgment. On the darkroom sill, the pigeon makes a note.'),
  bus: d('bus', 'Flower Power',
    'You step off the curb the way you\'d step into a warm bath. A painted bus doing thirty, with daisies wired to its bumper and a peace sign where the hood ornament ought to be, introduces itself. It\'s a brief introduction. Somebody lays a daisy on your chest. Somebody else plays a tambourine, softly, out of respect. The pigeon lands on the lamppost and looks the other way.'),
  brownie: d('brownie', 'Tuesday',
    'The brownie is very good, then very large, then very far away, like a planet you once lived on. You wake up on Sunny\'s stockroom floor under a bead curtain, and it is Tuesday. Tuesday is a fine day. Tuesday has no idea what happened on Saturday, and neither, now, does anyone in the Panhandle. You buy a newspaper. Five thousand kids, it says, went home early and asked for haircuts.'),
  'bruno-panhandle': d('bruno-panhandle', 'Held for Questioning',
    'A hand on each elbow, polite as a pair of pallbearers. "Lieutenant Bruno would like a word, Tolliver." The word turns out to be "overnight." The cell at Park Station has a small high window, and through it, at sundown, you hear the music start: long, soft, beautiful. You don\'t hear it stop. That\'s the thing about LETHE. Nobody does.'),
  'tiny-recognize': d('tiny-recognize', 'Remember Me?',
    'Tiny drops his cigarette and steps on it slowly, the way he\'s about to step on you. "The private eye," he says. "Doc said you\'d be sleeping." You are, shortly. It\'s fast and very professional, and afterwards the alley goes back to smelling of beer and rain, as if you were never there. The pigeon, on the fire escape, was the only witness. It isn\'t talking.'),
  'tiny-hit': d('tiny-hit', 'Hit Parade',
    'You throw the best punch of your life. It lands square on Tiny\'s jaw. Tiny looks at you with real interest, the way a mountain might look at a man who has just kicked it, and then he hits you back, once. You travel some distance. Not all of it is horizontal.'),
  'alley-fire-escape': d('alley-fire-escape', 'Another Fire Escape',
    'You\'d think you would have learned. The fire escape behind the Owl holds your weight for three rungs out of politeness, then makes a noise like a trombone falling down a staircase. So do you. Two fire escapes in one afternoon is, according to a man at the Department of Statistics, a San Francisco record.'),
  tea: d('tea', 'Herbal Tea',
    'The tea is warm and sweet and tastes faintly of almonds, and of something under the almonds. "Rest," says a gentle voice, and you do. When you wake up you are Brother Frank, and you have never been happier. You sweep the garden paths every morning and smile at everyone, especially the men in gray suits. You have a kind face. Everyone says so.'),
  'gas-valve': d('gas-valve', 'Spectacular',
    'You give the red valve a thoughtful twist. Gas hisses, finds the furnace pilot, and has a short, frank conversation with it. The Lotus Foundation loses its basement, its ground floor and most of its serenity. Seismographs at Berkeley register a small, joyful event. Neighbours describe the bang as "far out." You are not available for comment, or for anything else.'),
  'kell-shot': d('kell-shot', 'Your Own Gun',
    'Dr. Kell sighs, the way a man sighs at a patient who won\'t take his medicine, and shoots you with your own .38. It\'s a good gun. You always said so. You just never wanted a second opinion. "I\'ll make a note," Kell says, and he does. Somewhere above, the pigeon makes one too.'),
  clock: d('clock', 'Sundown',
    'Seven-thirty. Two trucks pull away from Masonic Avenue with the crates under a tarp. By eight there are five thousand blue tabs in five thousand hands in the Panhandle, and by nine there is a gentle, contented quiet that the city has never heard before. The next morning\'s Clarion calls it THE CALMEST GATHERING IN CITY HISTORY. Five thousand young people report for haircuts. In a gray office, Mr. Garrison reads it twice and closes the file.'),
};
