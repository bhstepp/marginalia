/* Marginalia — Apocrypha (events), content agent. */
(function () {
  var M = ((typeof globalThis !== 'undefined') ? globalThis : window).M;

  M.EVENTS = {
    spilled_inkpot: { title: 'The Spilled Inkpot', acts: [1, 2, 3],
      text: 'A pot of iron-gall ink lies tipped across the folio, still glistening. Somewhere above, a scribe is saying words not found in any psalter.',
      choices: [
        { label: 'Dip your lance', desc: 'Gild 2 random cards. Lose 6 HP.', ops: [{ op: 'gildRandom', n: 2 }, { op: 'loseHp', n: 6 }],
          result: 'The ink bites like a goose, but your weapons gleam.' },
        { label: 'Scrape a page', desc: 'Remove a card from your deck.', ops: [{ op: 'choose', purpose: 'remove' }],
          result: 'You scrape the vellum clean. A small sin, unrecorded.' },
        { label: 'Step around it', desc: 'Nothing happens.', ops: [], result: 'You ride on with dry hooves and a clean conscience.' }
      ] },

    drowsy_scribe: { title: 'The Drowsy Scribe', acts: [1, 2],
      text: 'A monk snores face-down on his desk, quill still in hand, mid-word. His purse sits open beside a half-finished drollery of a hare riding a dog.',
      choices: [
        { label: 'Finish his line', desc: 'Gain a random uncommon card. Add a Dog-Ear curse to your deck.',
          ops: [{ op: 'gainCard', rarity: 'uncommon' }, { op: 'addCard', id: 'dog_ear' }],
          result: 'Your handwriting is worse than his. He will notice, eventually, and fold the page in protest.' },
        { label: 'Borrow some silver', desc: 'Gain 60 silver. Add a Censure curse to your deck.',
          ops: [{ op: 'gold', n: 60 }, { op: 'addCard', id: 'censure' }],
          result: 'He mumbles your name in his sleep. That will be in the chapter minutes.' },
        { label: 'Let him sleep', desc: 'Heal 8 HP.', ops: [{ op: 'heal', n: 8 }],
          result: 'You doze off beside him. Nobody wakes for vespers.' }
      ] },

    wayside_shrine: { title: 'The Wayside Shrine', acts: [1, 2, 3],
      text: 'A tiny painted shrine stands in the gutter of the page, candles guttering. A saint with an uncertain number of arrows looks on, patiently.',
      choices: [
        { label: 'Leave an offering', desc: 'Pay 50 silver. Gain a random common relic.', req: { gold: 50 },
          ops: [{ op: 'gold', n: -50 }, { op: 'relic', rarity: 'common' }],
          result: 'The saint seems pleased. Something rattles in the offering box and falls into your hand.' },
        { label: 'Pry loose the relic', desc: 'Gain a random uncommon relic. Add a Censure curse to your deck.',
          ops: [{ op: 'relic', rarity: 'uncommon' }, { op: 'addCard', id: 'censure' }],
          result: 'It comes away with a crack. The saint’s expression does not change, which is somehow worse.' },
        { label: 'Pray', desc: 'Heal 12 HP.', ops: [{ op: 'heal', n: 12 }], result: 'A small warmth. Possibly the candles.' }
      ] },

    snail_toll: { title: 'The Snail Toll-Keeper', acts: [1],
      text: 'A snail in a tiny helmet blocks the bridge across the gutter. It demands a toll, a joust, or an apology for something your ancestors did.',
      choices: [
        { label: 'Pay the toll', desc: 'Pay 35 silver. Gain a random common card.', req: { gold: 35 },
          ops: [{ op: 'gold', n: -35 }, { op: 'gainCard', rarity: 'common' }],
          result: 'The snail issues a receipt, slowly, in mucus.' },
        { label: 'Accept the joust', desc: 'Fight two Snail Knights.', ops: [{ op: 'fight', enc: ['snail_knight', 'snail_knight'], kind: 'battle' }],
          result: 'Its cousin arrives. Neither will yield.' },
        { label: 'Wade the gutter', desc: 'Lose 7 HP.', ops: [{ op: 'loseHp', n: 7 }],
          result: 'The binding is deeper than it looks. Your boots will never forgive you.' }
      ] },

    rabbit_warren: { title: 'The Rabbit Warren', acts: [1],
      text: 'A burrow yawns beneath an illuminated initial. Something glitters inside. Something else, with very long ears and very red eyes, glitters back.',
      choices: [
        { label: 'Reach for the glitter', desc: 'Gain a random uncommon relic, then fight two Killer Rabbits (elite).',
          ops: [{ op: 'relic', rarity: 'uncommon' }, { op: 'fight', enc: ['killer_rabbit', 'killer_rabbit'], kind: 'elite' }],
          result: 'You got the relic. The rabbits got opinions.' },
        { label: 'Leave a carrot', desc: 'Pay 20 silver. Heal 15 HP.', req: { gold: 20 },
          ops: [{ op: 'gold', n: -20 }, { op: 'heal', n: 15 }],
          result: 'The rabbits accept your tribute. For now.' },
        { label: 'Back away slowly', desc: 'Nothing happens.', ops: [], result: 'Wise. Many knights in many margins did not.' }
      ] },

    bestiary_leaf: { title: 'A Loose Bestiary Leaf', acts: [2],
      text: 'A page has worked loose from the Bestiary and flaps across your path, describing a beast with the body of a lion, the face of a man and the manners of neither.',
      choices: [
        { label: 'Study it closely', desc: 'Gain a random rare card. Lose 10 HP.',
          ops: [{ op: 'gainCard', rarity: 'rare' }, { op: 'loseHp', n: 10 }],
          result: 'You learn a great deal. The page bites you twice to make sure.' },
        { label: 'Fold it into a hat', desc: 'Gain 5 Max HP.', ops: [{ op: 'maxHp', n: 5 }],
          result: 'A fine hat. You feel heartier, and slightly ridiculous.' },
        { label: 'Return it to the book', desc: 'Gain 30 silver.', ops: [{ op: 'gold', n: 30 }],
          result: 'The librarian left a finder’s fee in the spine.' }
      ] },

    the_palimpsest: { title: 'The Palimpsest', acts: [1, 2, 3],
      text: 'Under this page’s prayers you can make out an older text: a recipe, a love letter, and what appears to be a list of grudges.',
      choices: [
        { label: 'Scrape it again', desc: 'Transform a card in your deck.', ops: [{ op: 'choose', purpose: 'transform' }],
          result: 'Something new rises through the old ink.' },
        { label: 'Read the undertext', desc: 'Gain a random uncommon card. Add a Water Stain curse to your deck.',
          ops: [{ op: 'gainCard', rarity: 'uncommon' }, { op: 'addCard', id: 'water_stain' }],
          result: 'You squint very close and breathe on it. The page never quite dries.' },
        { label: 'Leave it be', desc: 'Nothing happens.', ops: [], result: 'Some grudges are best left buried.' }
      ] },

    gold_beater: { title: 'The Gold-Beater', acts: [2, 3],
      text: 'A man with enormous forearms hammers a coin into leaf so thin the light comes through. He eyes your purse, then your armour, then your purse again.',
      choices: [
        { label: 'Buy a book of leaf', desc: 'Pay 80 silver. Gild 3 random cards.', req: { gold: 80 },
          ops: [{ op: 'gold', n: -80 }, { op: 'gildRandom', n: 3 }],
          result: 'Your deck shines. Your purse rattles less.' },
        { label: 'Work the hammer', desc: 'Lose 8 HP. Gain 45 silver.', ops: [{ op: 'loseHp', n: 8 }, { op: 'gold', n: 45 }],
          result: 'Your thumbs will never be the same. Your purse is fuller.' },
        { label: 'Admire and leave', desc: 'Gild 1 random card.', ops: [{ op: 'gildRandom', n: 1 }],
          result: 'A flake drifts onto your gear as you go. He pretends not to see.' }
      ] },

    fox_sermon: { title: 'The Fox’s Sermon', acts: [2],
      text: 'A fox in a friar’s habit preaches to a rapt congregation of geese. The collection plate is suspiciously goose-shaped.',
      choices: [
        { label: 'Put silver in the plate', desc: 'Pay 40 silver. Remove a card from your deck.', req: { gold: 40 },
          ops: [{ op: 'gold', n: -40 }, { op: 'choose', purpose: 'remove' }],
          result: 'Your sins are absolved, and also some of your cards.' },
        { label: 'Heckle the preacher', desc: 'Fight the Fox Preacher.', ops: [{ op: 'fight', enc: ['fox_preacher'], kind: 'battle' }],
          result: 'The geese part. The fox bares its teeth and its hymnal.' },
        { label: 'Listen politely', desc: 'Heal 10 HP. Add a Dog-Ear curse to your deck.',
          ops: [{ op: 'heal', n: 10 }, { op: 'addCard', id: 'dog_ear' }],
          result: 'Restful. You dog-ear the hymnal to find the good bit later.' }
      ] },

    ape_mirror: { title: 'The Ape’s Mirror', acts: [1, 2],
      text: 'An ape sits on a vine-scroll, admiring itself in a polished mirror. It offers to show you your own reflection, for a price it cannot quite articulate.',
      choices: [
        { label: 'Gaze into it', desc: 'Duplicate a card in your deck. Lose 5 HP.',
          ops: [{ op: 'loseHp', n: 5 }, { op: 'choose', purpose: 'duplicate' }],
          result: 'Two of you look back. One of them winks.' },
        { label: 'Snatch the mirror', desc: 'Gain 50 silver. Add a Censure curse to your deck.',
          ops: [{ op: 'gold', n: 50 }, { op: 'addCard', id: 'censure' }],
          result: 'The ape shrieks a report to the abbot. You sell the mirror anyway.' },
        { label: 'Make faces at it', desc: 'Nothing happens.', ops: [], result: 'The ape makes better ones.' }
      ] },

    hellmouth_picnic: { title: 'The Hellmouth Picnic', acts: [3],
      text: 'Inside a gaping hellmouth, three small imps have spread a cloth and are toasting something on pitchforks. It smells, frankly, wonderful.',
      choices: [
        { label: 'Join them', desc: 'Heal 25 HP. Add a Water Stain curse to your deck.',
          ops: [{ op: 'heal', n: 25 }, { op: 'addCard', id: 'water_stain' }],
          result: 'Delicious. You spill sulphurous wine all over your page.' },
        { label: 'Steal the pie', desc: 'Gain 6 Max HP. Lose 10 HP.', ops: [{ op: 'maxHp', n: 6 }, { op: 'loseHp', n: 10 }],
          result: 'Hot. Very hot. Strangely fortifying.' },
        { label: 'Scatter them', desc: 'Fight two Hellmouth Imps.', ops: [{ op: 'fight', enc: ['hellmouth_imp', 'hellmouth_imp'], kind: 'battle' }],
          result: 'The imps abandon the picnic for something more fun: you.' }
      ] },

    erasure_knife: { title: 'The Erasure Knife', acts: [2, 3],
      text: 'A scribe’s knife is stuck upright in the margin, keen enough to lift a mistake from the vellum without leaving a scar. Mostly.',
      choices: [
        { label: 'Carve away a page', desc: 'Remove a card from your deck. Lose 5 HP.',
          ops: [{ op: 'loseHp', n: 5 }, { op: 'choose', purpose: 'remove' }],
          result: 'Gone, as though it never was. Your finger begs to differ.' },
        { label: 'Hone your gear on it', desc: 'Gild 1 random card.', ops: [{ op: 'gildRandom', n: 1 }],
          result: 'A fine edge, a finer shine.' },
        { label: 'Pocket it', desc: 'Gain 40 silver.', ops: [{ op: 'gold', n: 40 }],
          result: 'A stationer will pay well for a blade like this.' }
      ] },

    rubricators_desk: { title: 'The Rubricator’s Desk', acts: [1, 2, 3],
      text: 'Three shell-dishes of pigment sit on an abandoned desk, still wet: vermilion, lapis and verdigris. Nobody will miss one. Probably.',
      choices: [
        { label: 'Take the vermilion', desc: 'Gain a Burnished Edge.', ops: [{ op: 'gainCard', id: 'burnished_edge' }],
          result: 'Your lance blushes an alarming red.' },
        { label: 'Take the lapis', desc: 'Gain a Double Gesso.', ops: [{ op: 'gainCard', id: 'double_gesso' }],
          result: 'Worth more than gold, ounce for ounce. Do not spill it.' },
        { label: 'Take the verdigris', desc: 'Gain a Verdigris Bloom.', ops: [{ op: 'gainCard', id: 'verdigris_bloom' }],
          result: 'It eats through the shell-dish before you have gone ten lines.' }
      ] },

    bookworm_tunnel: { title: 'The Worm’s Tunnel', acts: [3],
      text: 'A perfectly round hole bores through the next forty pages. Through it you glimpse something gleaming, and smell something that has eaten an entire psalter.',
      choices: [
        { label: 'Crawl through', desc: 'Lose 12 HP. Gain a random rare relic.',
          ops: [{ op: 'loseHp', n: 12 }, { op: 'relic', rarity: 'rare' }],
          result: 'Tight, dark, and lined with half-digested prayers. Worth it.' },
        { label: 'Feed it a page', desc: 'Remove 1 random card from your deck. Heal 10 HP.',
          ops: [{ op: 'removeRandom', n: 1 }, { op: 'heal', n: 10 }],
          result: 'Something chews contentedly in the dark. You did not choose which page.' },
        { label: 'Go around', desc: 'Nothing happens.', ops: [], result: 'Forty pages is a long way round. You manage.' }
      ] },

    cathedral_choir: { title: 'The Marginal Choir', acts: [2, 3],
      text: 'A choir of tonsured hares sings plainchant from a single enormous book. One of them is very flat and knows it.',
      choices: [
        { label: 'Sing along', desc: 'Gain 4 Max HP.', ops: [{ op: 'maxHp', n: 4 }],
          result: 'Your voice is terrible, your lungs magnificent.' },
        { label: 'Turn their pages', desc: 'Gain a random uncommon card.', ops: [{ op: 'gainCard', rarity: 'uncommon' }],
          result: 'One page sticks to your gauntlet. Finders keepers.' },
        { label: 'Correct the flat hare', desc: 'Pay 30 silver. Gild 2 random cards.', req: { gold: 30 },
          ops: [{ op: 'gold', n: -30 }, { op: 'gildRandom', n: 2 }],
          result: 'Singing lessons are expensive. Gratitude, apparently, is gilded.' }
      ] }
  };
})();
