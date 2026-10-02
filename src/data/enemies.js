/* MARGINALIA — Bestiary: M.ENEMIES and M.ENCOUNTERS (owned by the bestiary agent).
   Conventions:
   - Summoned minions do not act on the turn they are summoned (their first intent is shown a
     full turn ahead), so summon-only minions (kitten_scrawl, bookmite) no longer need a harmless `first`.
   - Big hits are always preceded by a visible windup move (might / ward), never back-to-back.
   - Timed debuffs wear off at END OF ROUND: Torn/Smudged/Faded applied by an enemy with 2 stacks last
     through the next exchange; 1 stack only affects the rest of the current enemy turn (ally combos).
   - Numbers tuned with tools/sim.js (heuristic bot): see that file's header for usage. */
(function () {
  var M = ((typeof globalThis !== 'undefined') ? globalThis : window).M;

  // tiny helpers to keep the tables readable
  function hit(n, times) { return times ? { op: 'dmg', n: n, times: times } : { op: 'dmg', n: n }; }
  function ward(n, target) { return target ? { op: 'ward', n: n, target: target } : { op: 'ward', n: n }; }
  function self(s, n) { return { op: 'apply', s: s, n: n, target: 'self' }; }
  function allies(s, n) { return { op: 'apply', s: s, n: n, target: 'allies' }; }
  function curse(s, n) { return { op: 'apply', s: s, n: n }; }           // on the player
  function blot(id, n, to) { var o = { op: 'addCard', id: id, n: n || 1 }; if (to) o.to = to; return o; }

  M.ENEMIES = {
    // ======================= QUIRE I — The Book of Hours =======================
    snail_knight: {
      name: 'Snail Knight', act: 1, tier: 'normal', hp: [32, 36], size: 'm',
      desc: 'Has been charging the knight on folio 12 since 1340. Gaining, slowly.',
      start: [self('shell', 3)],
      moves: {
        prod:    { name: 'Tentative Prod', ops: [hit(5)] },
        retreat: { name: 'Retreat into Shell', ops: [ward(8), self('might', 2)] },
        joust:   { name: 'Slow but Sure Joust', ops: [hit(10)] }
      },
      ai: { type: 'cycle', seq: ['prod', 'retreat', 'joust'] }
    },

    killer_rabbit: {
      name: 'Killer Rabbit', act: 1, tier: 'normal', hp: [19, 23], size: 's',
      desc: 'Fluffy. Pious. Armed. The monks drew it with a sword for a reason.',
      moves: {
        nibble: { name: 'Vorpal Nibbles', ops: [hit(2, 3)] },
        leap:   { name: 'Leap for the Throat', ops: [hit(6), curse('torn', 1)] },
        thump:  { name: 'Ominous Thump', ops: [ward(5), self('might', 1)] }
      },
      ai: { type: 'random', w: { nibble: 3, leap: 2, thump: 1 }, maxRepeat: 2, noRepeat: ['leap', 'thump'] }
    },

    ink_mite: {
      name: 'Ink Mite', act: 1, tier: 'normal', hp: [9, 12], size: 's',
      desc: 'A full stop that got ideas above its station.',
      moves: {
        ooze:    { name: 'Ooze About', ops: [ward(3)] },
        drip:    { name: 'Drip', ops: [hit(4)] },
        spatter: { name: 'Spatter', ops: [hit(2), blot('ink_blot')] },
        divide:  { name: 'Divide Like a Comma', intent: 'summon', ops: [{ op: 'loseHp', n: 3 }, { op: 'summon', id: 'ink_mite' }] }
      },
      ai: { type: 'random', first: ['ooze'], w: { drip: 4, spatter: 2, divide: 1 }, maxRepeat: 2, noRepeat: ['spatter', 'divide'] }
    },

    ape_piper: {
      name: 'Ape Piper', act: 1, tier: 'normal', hp: [38, 42], size: 'm',
      desc: 'Plays the bagpipes. Nobody asked. Nobody ever asks.',
      moves: {
        drone: { name: 'Bagpipe Drone', ops: [hit(3), curse('smudged', 2)] },
        jig:   { name: 'Reeling Jig', ops: [hit(4, 2)] },
        skirl: { name: 'Shrill Skirl', ops: [hit(8), curse('parched', 1)] }
      },
      ai: { type: 'cycle', first: ['drone'], seq: ['jig', 'skirl', 'drone'] }
    },

    grotesque_snout: {
      name: 'Grotesque Snout', act: 1, tier: 'normal', hp: [50, 54], size: 'm',
      desc: 'A face with legs and opinions. Mostly nose. Prickly to the touch.',
      start: [self('brambles', 2)],
      moves: {
        snort:  { name: 'Wet Snort', ops: [hit(5), blot('smear')] },
        gnash:  { name: 'Gnash', ops: [hit(9)] },
        inhale: { name: 'Draw a Great Breath', ops: [ward(8), self('might', 3)] },
        chomp:  { name: 'Gargoyle Chomp', ops: [hit(15)] }
      },
      ai: { type: 'cycle', seq: ['snort', 'gnash', 'inhale', 'chomp'] }
    },

    cynocephalus: {
      name: 'Cynocephalus', act: 1, tier: 'elite', hp: [84, 90], size: 'l',
      desc: 'A dog-headed man from the edge of the map. Barks in Latin, bites in English.',
      moves: {
        bark:  { name: 'Bark in Tongues', ops: [curse('torn', 2), self('might', 2)] },
        maul:  { name: 'Maul', ops: [hit(15)] },
        bite:  { name: 'Doggish Bite', ops: [hit(7, 2)] },
        sniff: { name: 'Sniff Out Weakness', ops: [hit(8), curse('faded', 2)] },
        howl:  { name: 'Howl at the Margin', ops: [ward(14), self('zeal', 1), blot('smear')] }
      },
      ai: { type: 'cycle', seq: ['bark', 'maul', 'bite', 'sniff'] },
      phase2: { at: 0.5, enter: 'howl', ai: { type: 'cycle', seq: ['bite', 'bark', 'maul', 'sniff'] } }
    },

    hare_cavalier: {
      name: 'Hare Cavalier', act: 1, tier: 'elite', hp: [76, 82], size: 'l',
      desc: 'The hares have stopped fleeing the hunters. The hunters are rather worried.',
      start: [ward(10)],
      moves: {
        spur:   { name: 'Spur and Prick', ops: [hit(5, 3)] },
        couch:  { name: 'Couch the Carrot-Lance', ops: [ward(12), self('might', 3)] },
        charge: { name: 'Headlong Charge', ops: [hit(19)] },
        thump:  { name: 'Thump of Defiance', ops: [hit(8), curse('faded', 2)] }
      },
      ai: { type: 'cycle', seq: ['spur', 'couch', 'charge', 'thump'] }
    },

    great_snail: {
      name: 'The Great Snail', act: 1, tier: 'boss', hp: [150, 158], size: 'l',
      desc: 'Every knight in every margin has fought a snail. This is the one they all lost to.',
      start: [self('shell', 3)],
      moves: {
        glare:  { name: 'Stalk-Eyed Glare', ops: [hit(9), curse('faded', 2)] },
        slime:  { name: 'Slime Trail', ops: [hit(6), blot('ink_blot', 2), ward(8)] },
        spiral: { name: 'Spiral Inward', ops: [ward(16), self('might', 3)] },
        crush:  { name: 'Ponderous Crush', ops: [hit(20)] },
        shed:   { name: 'Abandon the Shell', ops: [{ op: 'removeStatus', s: 'shell' }, self('might', 2), self('zeal', 1), blot('smear', 2)] },
        lunge:  { name: 'Naked Fury', ops: [hit(6, 2)] }
      },
      ai: { type: 'cycle', seq: ['glare', 'slime', 'spiral', 'crush'] },
      phase2: { at: 0.5, enter: 'shed', ai: { type: 'cycle', seq: ['lunge', 'glare', 'lunge', 'slime'] } }
    },

    // ======================= QUIRE II — The Bestiary =======================
    monkfish: {
      name: 'Monkfish', act: 2, tier: 'normal', hp: [52, 58], size: 'm',
      desc: 'Took holy orders. Kept the gills. Disapproves of your annotations.',
      moves: {
        slap:   { name: 'Fin Slap', ops: [hit(13)] },
        vespers:{ name: 'Gurgled Vespers', ops: [ward(7, 'allies'), { op: 'heal', n: 4 }] },
        excom:  { name: 'Excommunicate the Gloss', intent: 'erase', ops: [{ op: 'eraseMargin', n: 1 }, hit(6)] },
        censure:{ name: 'Pronounce Censure', ops: [hit(5), blot('censure')] }
      },
      ai: { type: 'random', first: ['vespers'], w: { slap: 3, excom: 1, censure: 1, vespers: 1 }, maxRepeat: 2, noRepeat: ['excom', 'censure', 'vespers'] }
    },

    blemmye: {
      name: 'Blemmye', act: 2, tier: 'normal', hp: [66, 72], size: 'm',
      desc: 'No head, all heart. Literally: the face is where the heart should be.',
      moves: {
        drub:     { name: 'Two-Fisted Drubbing', ops: [hit(8, 2)] },
        stare:    { name: 'Stare from the Belly', ops: [hit(6), curse('torn', 1)] },
        butt:     { name: 'Chest-Butt', ops: [hit(14)] },
        harrumph: { name: 'Harrumph', ops: [ward(12), self('might', 2)] }
      },
      ai: { type: 'cycle', seq: ['drub', 'stare', 'butt', 'harrumph'], randomStart: true }
    },

    cockatrice: {
      name: 'Cockatrice', act: 2, tier: 'normal', hp: [58, 64], size: 'm',
      desc: 'Hatched by a toad from a cockerel\'s egg. Exactly as pleasant as that sounds.',
      moves: {
        gaze: { name: 'Petrifying Gaze', intent: 'debuff', ops: [hit(4), curse('faded', 2), curse('parched', 1)] },
        peck: { name: 'Peck Peck Peck', ops: [hit(5, 3)] },
        spur: { name: 'Venom Spur', ops: [hit(11), curse('corrode', 3)] },
        crow: { name: 'Crow at Dawn', ops: [ward(10), self('might', 2)] }
      },
      ai: { type: 'random', first: ['gaze'], w: { peck: 3, spur: 2, gaze: 1, crow: 1 }, maxRepeat: 2, noRepeat: ['gaze', 'crow', 'spur'] }
    },

    fox_preacher: {
      name: 'Fox Preacher', act: 2, tier: 'normal', hp: [42, 48], size: 'm',
      desc: 'Preaches to the geese. Counts the geese afterwards. Always one fewer.',
      moves: {
        sermon:  { name: 'Sermon to the Geese', ops: [allies('might', 1), ward(6, 'allies')] },
        snap:    { name: 'Vulpine Snap', ops: [hit(12)] },
        plate:   { name: 'Pass the Collection Plate', ops: [hit(7), { op: 'gold', n: -8 }] },
        blessing:{ name: 'Sly Benediction', ops: [{ op: 'heal', n: 4, target: 'allies' }, curse('smudged', 2)] }
      },
      ai: { type: 'cycle', first: ['sermon'], seq: ['snap', 'plate', 'blessing', 'snap', 'sermon'] }
    },

    manticore: {
      name: 'Manticore', act: 2, tier: 'elite', hp: [140, 150], size: 'l',
      desc: 'Face of a man, body of a lion, tail of a scorpion, manners of none of them.',
      moves: {
        volley: { name: 'Tail-Spike Volley', ops: [hit(4, 4)] },
        sting:  { name: 'Scorpion Sting', ops: [hit(8), curse('corrode', 4)] },
        smile:  { name: 'Triple-Rowed Smile', ops: [ward(16), self('might', 2)] },
        maw:    { name: 'Gnash Thrice', ops: [hit(7, 3)] },
        roar:   { name: 'Roar Like a Trumpet', ops: [curse('torn', 2), curse('smudged', 2), self('zeal', 1)] }
      },
      ai: { type: 'cycle', seq: ['volley', 'sting', 'smile', 'maw'] },
      phase2: { at: 0.5, enter: 'roar', ai: { type: 'cycle', seq: ['volley', 'sting', 'maw', 'smile'] } }
    },

    wyvern: {
      name: 'Wyvern', act: 2, tier: 'elite', hp: [148, 158], size: 'l',
      desc: 'Two legs, two wings, one long grudge against heraldry.',
      moves: {
        lash:   { name: 'Tail Lash', ops: [hit(8, 2)] },
        wing:   { name: 'Take Wing', ops: [ward(16), self('steadfast', 2), self('might', 2)] },
        dive:   { name: 'Plummeting Dive', ops: [hit(24)] },
        breath: { name: 'Venom Breath', ops: [hit(8), curse('corrode', 4), curse('parched', 1)] }
      },
      ai: { type: 'cycle', seq: ['lash', 'wing', 'dive', 'breath'] }
    },

    scribes_cat: {
      name: 'The Scribe\'s Cat', act: 2, tier: 'boss', hp: [306, 318], size: 'l',
      desc: 'Real cats walked on real manuscripts. This one walked on yours, then sat on it.',
      moves: {
        paws:    { name: 'Walk Across the Page', ops: [hit(9, 2), blot('paw_print', 2)] },
        knock:   { name: 'Knock It off the Desk', intent: 'erase', ops: [{ op: 'eraseMargin', n: 1 }, hit(16)] },
        litter:  { name: 'Call the Litter', intent: 'summon', ops: [{ op: 'summon', id: 'kitten_scrawl' }, { op: 'summon', id: 'kitten_scrawl' }, ward(10)] },
        wiggle:  { name: 'Wiggle the Haunches', ops: [ward(14), self('might', 4)] },
        pounce:  { name: 'POUNCE', ops: [hit(30)] },
        sit:     { name: 'Sit on the Manuscript', ops: [ward(20), curse('parched', 1), curse('faded', 2)] },
        zoomies: { name: 'The Midnight Zoomies', ops: [self('zeal', 1), self('steadfast', 1), ward(18), { op: 'summon', id: 'kitten_scrawl' }] },
        swipe:   { name: 'Claw Flourish', ops: [hit(8, 3)] }
      },
      ai: { type: 'cycle', seq: ['paws', 'litter', 'knock', 'wiggle', 'pounce', 'sit'] },
      phase2: { at: 0.5, enter: 'zoomies', ai: { type: 'cycle', seq: ['swipe', 'knock', 'paws', 'wiggle', 'pounce', 'litter'] } }
    },

    kitten_scrawl: {
      name: 'Kitten Scrawl', act: 2, tier: 'minion', hp: [8, 10], size: 's',
      desc: 'Drawn in four lines by a bored novice. Three of them are claws.',
      moves: {
        tumble:  { name: 'Tumble In', ops: [ward(4)] },
        scratch: { name: 'Scratch', ops: [hit(4, 2)] },
        bat:     { name: 'Bat at the Quill', ops: [hit(2), curse('smudged', 1)] }
      },
      ai: { type: 'random', w: { scratch: 3, bat: 1 }, maxRepeat: 2, noRepeat: ['bat'] }
    },

    // ======================= QUIRE III — The Apocalypse =======================
    locust_rider: {
      name: 'Locust Rider', act: 3, tier: 'normal', hp: [58, 64], size: 'm',
      desc: 'Crowned like a king, haired like a woman, toothed like a lion, and late for the Apocalypse.',
      moves: {
        swarm:  { name: 'Darken the Sky', ops: [hit(4, 4)] },
        tail:   { name: 'Scorpion Tail', ops: [hit(8), curse('corrode', 3)] },
        crown:  { name: 'Lower the Crown', ops: [ward(12), self('might', 1)] },
        charge: { name: 'Crowned Charge', ops: [hit(15)] }
      },
      ai: { type: 'cycle', seq: ['swarm', 'tail', 'crown', 'charge'], randomStart: true }
    },

    ouroboros: {
      name: 'Ouroboros', act: 3, tier: 'normal', hp: [116, 124], size: 'l',
      desc: 'Begins where it ends. Ends where it begins. Bites where you stand.',
      onDeath: [{ op: 'summon', id: 'ink_mite' }, { op: 'summon', id: 'ink_mite' }],
      moves: {
        constrict: { name: 'Constrict', ops: [hit(9, 2), curse('faded', 2)] },
        coil:      { name: 'Coil Endlessly', ops: [hit(8), ward(14)] },
        strike:    { name: 'Venomous Strike', ops: [hit(22)] },
        swallow:   { name: 'Swallow Its Tail', ops: [{ op: 'heal', n: 10 }, self('might', 3)] }
      },
      ai: { type: 'cycle', seq: ['constrict', 'coil', 'strike', 'swallow'] }
    },

    hellmouth_imp: {
      name: 'Hellmouth Imp', act: 3, tier: 'normal', hp: [50, 56], size: 's',
      desc: 'Escaped from the jaws of Hell in the bottom margin. Still smells faintly of toast.',
      moves: {
        cackle: { name: 'Gleeful Cackle', ops: [self('might', 2), ward(6)] },
        prod:   { name: 'Pitchfork Prod', ops: [hit(6, 2)] },
        belch:  { name: 'Brimstone Belch', ops: [hit(8), curse('corrode', 4)] },
        stoke:  { name: 'Stoke the Coals', ops: [hit(6), self('brambles', 2)] }
      },
      ai: { type: 'random', first: ['cackle'], w: { prod: 3, belch: 2, stoke: 1, cackle: 1 }, maxRepeat: 2, noRepeat: ['belch', 'stoke', 'cackle'] }
    },

    tome_mimic: {
      name: 'Tome Mimic', act: 3, tier: 'normal', hp: [110, 118], size: 'm',
      desc: 'A lovely little psalter. Do not read it. It is reading you.',
      moves: {
        closed: { name: 'Lie Innocently Closed', ops: [ward(18), self('steadfast', 1)] },
        creak:  { name: 'Creak Open', ops: [hit(5), self('might', 3)] },
        snap:   { name: 'Snap Shut', ops: [hit(26)] },
        riffle: { name: 'Riffle the Pages', ops: [hit(7, 3), blot('wormhole')] }
      },
      ai: { type: 'cycle', first: ['closed'], seq: ['creak', 'snap', 'riffle', 'closed'] }
    },

    hydra: {
      name: 'Hydra', act: 3, tier: 'elite', hp: [200, 214], size: 'l',
      desc: 'Seven heads, seven crowns, seven differing opinions on where to bite first.',
      moves: {
        bites: { name: 'Many-Headed Bite', ops: [hit(7, 3)] },
        spray: { name: 'Venom Spray', ops: [hit(8), curse('corrode', 5)] },
        grow:  { name: 'Grow Another Head', ops: [{ op: 'heal', n: 12 }, self('might', 2), ward(10)] },
        snap:  { name: 'Great Central Snap', ops: [hit(18)] },
        regrow:{ name: 'Cut One, Two Grow', ops: [{ op: 'heal', n: 24 }, self('zeal', 1), self('might', 1), ward(16)] }
      },
      ai: { type: 'cycle', seq: ['bites', 'spray', 'grow', 'snap'] },
      phase2: { at: 0.5, enter: 'regrow', ai: { type: 'cycle', seq: ['bites', 'spray', 'bites', 'snap'] } }
    },

    pale_rider: {
      name: 'The Pale Rider', act: 3, tier: 'elite', hp: [196, 210], size: 'l',
      desc: 'His name that sat on him was Death, and Hell followed with him, carrying the luggage.',
      moves: {
        pestilence: { name: 'Pestilence', ops: [hit(8), curse('corrode', 6)] },
        famine:     { name: 'Scales of Famine', ops: [hit(9), curse('parched', 1), curse('smudged', 2)] },
        raise:      { name: 'Raise the Scythe', ops: [ward(16), self('might', 3)] },
        reap:       { name: 'Reap', ops: [hit(26)] },
        hades:      { name: 'And Hell Followed', intent: 'summon', ops: [{ op: 'summon', id: 'hellmouth_imp' }, ward(20), self('steadfast', 1)] },
        trample:    { name: 'Pale Trample', ops: [hit(5, 3)] }
      },
      ai: { type: 'cycle', seq: ['pestilence', 'famine', 'raise', 'reap'] },
      phase2: { at: 0.5, enter: 'hades', ai: { type: 'cycle', seq: ['trample', 'pestilence', 'raise', 'reap'] } }
    },

    bookworm: {
      name: 'The Bookworm', act: 3, tier: 'boss', hp: [432, 452], size: 'l',
      desc: 'It has eaten the Gospels, the Psalms and three Bestiaries. You are the dessert course.',
      moves: {
        gnaw:    { name: 'Gnaw the Gutter', ops: [hit(15, 2)] },
        burrow:  { name: 'Burrow Through the Quire', intent: 'devour', ops: [hit(14), { op: 'devour', n: 1 }, ward(12)] },
        brood:   { name: 'Brood of Bookmites', intent: 'summon', ops: [{ op: 'summon', id: 'bookmite' }, { op: 'summon', id: 'bookmite' }, ward(10)] },
        margin:  { name: 'Eat the Margins', intent: 'erase', ops: [{ op: 'eraseMargin', n: 1 }, hit(22)] },
        rear:    { name: 'Rear Up from the Binding', ops: [ward(18), self('might', 5)] },
        chapter: { name: 'Devour a Chapter', ops: [hit(48), { op: 'devour', n: 1 }] },
        pupate:  { name: 'Pupate in the Spine', ops: [ward(30), self('steadfast', 1), self('mending', 4), self('zeal', 2), blot('wormhole', 1, 'draw')] }
      },
      ai: { type: 'cycle', seq: ['gnaw', 'burrow', 'brood', 'margin', 'rear', 'chapter'] },
      phase2: { at: 0.5, enter: 'pupate', ai: { type: 'cycle', seq: ['margin', 'gnaw', 'brood', 'rear', 'chapter', 'burrow'] } }
    },

    bookmite: {
      name: 'Bookmite', act: 3, tier: 'minion', hp: [10, 13], size: 's',
      desc: 'Bred on vellum, weaned on gold leaf, partial to your best cards.',
      moves: {
        wriggle: { name: 'Wriggle Free', ops: [ward(3)] },
        nibble:  { name: 'Nibble', ops: [hit(6)] },
        chew:    { name: 'Chew a Page', intent: 'devour', ops: [hit(2), { op: 'devour', n: 1 }] }
      },
      ai: { type: 'random', w: { nibble: 4, chew: 1 }, maxRepeat: 2, noRepeat: ['chew'] }
    }
  };

  M.ENCOUNTERS = {
    1: {
      easy:   [['snail_knight'], ['ape_piper'], ['killer_rabbit', 'ink_mite'], ['ink_mite', 'ink_mite']],
      normal: [['grotesque_snout'], ['killer_rabbit', 'killer_rabbit'], ['ink_mite', 'ink_mite', 'ink_mite', 'ink_mite'],
               ['snail_knight', 'ink_mite'], ['ape_piper', 'ink_mite'], ['snail_knight', 'killer_rabbit'], ['ape_piper', 'killer_rabbit']],
      elite:  [['cynocephalus'], ['hare_cavalier'], ['grotesque_snout', 'snail_knight']],
      boss:   [['great_snail']]
    },
    2: {
      easy:   [['monkfish'], ['fox_preacher', 'ink_mite'], ['snail_knight', 'killer_rabbit']],
      normal: [['blemmye'], ['cockatrice'], ['monkfish', 'fox_preacher'], ['fox_preacher', 'killer_rabbit', 'killer_rabbit'],
               ['monkfish', 'ink_mite', 'ink_mite'], ['fox_preacher', 'grotesque_snout'], ['cockatrice', 'ink_mite']],
      elite:  [['manticore'], ['wyvern'], ['blemmye', 'cockatrice']],
      boss:   [['scribes_cat']]
    },
    3: {
      easy:   [['locust_rider', 'ink_mite'], ['hellmouth_imp', 'killer_rabbit'], ['blemmye', 'ink_mite']],
      normal: [['locust_rider', 'locust_rider'], ['ouroboros'], ['tome_mimic'], ['hellmouth_imp', 'hellmouth_imp'],
               ['locust_rider', 'hellmouth_imp'], ['fox_preacher', 'hellmouth_imp', 'ink_mite'], ['monkfish', 'locust_rider']],
      elite:  [['hydra'], ['pale_rider'], ['ouroboros', 'hellmouth_imp', 'ink_mite']],
      boss:   [['bookworm']]
    }
  };
})();
