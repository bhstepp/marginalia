/* MARGINALIA — v2 boss roster (owned by the boss agent).
   Adds six new bosses (+2 minions) to M.ENEMIES and pushes them into M.ENCOUNTERS[act].boss.
   Each act now offers 3 boss options; the map's st.map.boss picks one per run.
   Conventions follow enemies.js: big hits always follow a visible windup; timed debuffs with 2 stacks
   last through the next exchange.
   New minion ids: dancing_fool (Bagpipe Bishop), hell_imp_small (Hellmouth).
   Balanced with tools/sim.js --bosses / --arrivals (paired boss fights from the same arrival state). */
(function () {
  var M = ((typeof globalThis !== 'undefined') ? globalThis : window).M;
  if (!M || !M.ENEMIES || !M.ENCOUNTERS) return;

  function hit(n, times) { return times ? { op: 'dmg', n: n, times: times } : { op: 'dmg', n: n }; }
  function ward(n, target) { return target ? { op: 'ward', n: n, target: target } : { op: 'ward', n: n }; }
  function self(s, n) { return { op: 'apply', s: s, n: n, target: 'self' }; }
  function allies(s, n) { return { op: 'apply', s: s, n: n, target: 'allies' }; }
  function curse(s, n) { return { op: 'apply', s: s, n: n }; }           // on the player
  function blot(id, n, to) { var o = { op: 'addCard', id: id, n: n || 1 }; if (to) o.to = to; return o; }
  function summon(id, max) { var o = { op: 'summon', id: id }; if (max) o.max = max; return o; }
  function drop(s) { return { op: 'removeStatus', s: s }; }

  var B = {
    // ======================= QUIRE I — The Book of Hours =======================
    // A DUO: the hare does the hitting, the snail does the shelling. Kill one and the other avenges it.
    jousting_hare: {
      name: 'The Jousting Hare', act: 1, tier: 'boss', hp: [78, 82], size: 'l',
      desc: 'Rides a snail into battle. The snail has asked, repeatedly, to be consulted.',
      onDeath: [allies('might', 3), allies('zeal', 1)],
      moves: {
        spur:   { name: 'Spur the Mount', ops: [hit(5, 2)] },
        couch:  { name: 'Couch the Carrot-Lance', ops: [ward(6), self('might', 2)] },
        tilt:   { name: 'Full Tilt!', ops: [hit(17)] },
        jeer:   { name: 'Waggle the Ears', intent: 'debuff', ops: [hit(4), curse('torn', 2)] },
        unhorse:{ name: 'Leap from the Saddle', ops: [ward(10), self('might', 2), curse('smudged', 2)] },
        box:    { name: 'Box Like a March Hare', ops: [hit(5, 3)] }
      },
      ai: { type: 'cycle', seq: ['spur', 'couch', 'tilt', 'jeer'] },
      phase2: { at: 0.5, enter: 'unhorse', ai: { type: 'cycle', seq: ['box', 'couch', 'tilt', 'box', 'jeer'] } }
    },

    war_snail: {
      name: 'The War Snail', act: 1, tier: 'boss', hp: [84, 90], size: 'l',
      desc: 'Barded, banner-bearing and fully committed to arriving eventually.',
      start: [self('shell', 2)],
      onDeath: [allies('might', 3), allies('zeal', 1)],
      moves: {
        wall:    { name: 'Shell-Wall for Two', ops: [ward(9, 'allies')] },
        trundle: { name: 'Trundle Over', ops: [hit(10)] },
        pennant: { name: 'Wave the Pennant', ops: [allies('might', 1), blot('ink_blot')] },
        slime:   { name: 'Slime the Lists', ops: [hit(5), curse('faded', 2)] },
        retreat: { name: 'Withdraw to the Keep', ops: [ward(16), self('steadfast', 1), ward(6, 'allies')] },
        horns:   { name: 'Lower the Horns', ops: [ward(8), self('might', 3)] },
        ram:     { name: 'Battering Shell', ops: [hit(20)] }
      },
      ai: { type: 'cycle', seq: ['wall', 'trundle', 'pennant', 'slime'] },
      phase2: { at: 0.5, enter: 'retreat', ai: { type: 'cycle', seq: ['wall', 'horns', 'ram', 'slime'] } }
    },

    bagpipe_bishop: {
      name: 'The Bagpipe Bishop', act: 1, tier: 'boss', hp: [156, 164], size: 'l',
      desc: 'An ape in a mitre with a drone that could wake the dead. It has. They are dancing.',
      moves: {
        morris:  { name: 'Call the Morris', intent: 'summon', ops: [summon('dancing_fool', 3), summon('dancing_fool', 3), ward(8)] },
        drone:   { name: 'Episcopal Drone', ops: [hit(8), curse('smudged', 2)] },
        bless:   { name: 'Bless the Dancers', ops: [allies('might', 1), ward(5, 'allies')] },
        inflate: { name: 'Fill the Bag', ops: [ward(12), self('might', 2), curse('parched', 1)] },
        skirl:   { name: 'Unholy Skirl', ops: [hit(24)] },
        reel:    { name: 'The Excommunicating Reel', intent: 'summon', ops: [summon('dancing_fool', 4), summon('dancing_fool', 4), self('zeal', 1), ward(14)] },
        chant:   { name: 'Plainchant in a Minor Key', ops: [hit(7, 2), curse('parched', 1)] }
      },
      ai: { type: 'cycle', first: ['morris'], seq: ['drone', 'bless', 'inflate', 'skirl', 'morris'] },
      phase2: { at: 0.5, enter: 'reel', ai: { type: 'cycle', seq: ['chant', 'drone', 'inflate', 'skirl', 'bless', 'morris'] } }
    },

    dancing_fool: {
      name: 'Dancing Fool', act: 1, tier: 'minion', hp: [10, 13], size: 's',
      desc: 'Bells on his toes, bells on his hat, and absolutely no sense of rhythm.',
      moves: {
        caper:  { name: 'Caper', ops: [hit(4, 2)] },
        jingle: { name: 'Jingle in Your Ear', ops: [hit(2), curse('smudged', 1)] },
        bow:    { name: 'Deep Bow', ops: [ward(4)] }
      },
      ai: { type: 'random', w: { caper: 3, jingle: 1, bow: 1 }, maxRepeat: 2, noRepeat: ['jingle', 'bow'] }
    },

    // ======================= QUIRE II — The Bestiary =======================
    basilisk: {
      name: 'The Basilisk', act: 2, tier: 'boss', hp: [286, 296], size: 'l',
      desc: 'King of serpents, crowned and courteous. Please do not make eye contact.',
      moves: {
        bite:  { name: 'Corroding Bite', ops: [hit(10), curse('corrode', 4)] },
        lash:  { name: 'Lash of the Tail', ops: [hit(7, 2)] },
        gaze:  { name: 'Petrifying Gaze', intent: 'debuff', ops: [curse('petrified', 2), ward(14), self('might', 2)] },
        crush: { name: 'Coil and Crush', ops: [hit(23)] },
        crown: { name: 'Raise the Crown', ops: [ward(22), self('might', 2), curse('petrified', 1), curse('faded', 2)] },
        stare: { name: 'Stony Stare', intent: 'debuff', ops: [hit(6), curse('petrified', 2), self('might', 1)] }
      },
      ai: { type: 'cycle', seq: ['bite', 'lash', 'gaze', 'crush'] },
      phase2: { at: 0.5, enter: 'crown', ai: { type: 'cycle', seq: ['bite', 'stare', 'crush', 'lash', 'gaze', 'crush'] } }
    },

    siren: {
      name: 'The Siren', act: 2, tier: 'boss', hp: [322, 332], size: 'l',
      desc: 'Half maiden, half fish, wholly uninterested in your shield. She would like it, though.',
      moves: {
        song:   { name: 'Song of the Deep', intent: 'devour', ops: [hit(8), { op: 'devourPigment', pig: 'L', n: 1 }, curse('faded', 2), ward(8)] },
        lure:   { name: 'Lure to the Rocks', ops: [hit(9, 2)] },
        comb:   { name: 'Comb Her Hair', ops: [ward(14), self('might', 4)] },
        wave:   { name: 'The Ninth Wave', ops: [hit(34)] },
        charm:  { name: 'Charming Glance', ops: [hit(9), curse('smudged', 2)] },
        chorus: { name: 'Chorus of the Drowned', intent: 'devour', ops: [{ op: 'devourPigment', pig: 'L', n: 1 }, ward(20), self('zeal', 1), curse('smudged', 2)] },
        tide:   { name: 'Undertow', ops: [hit(5, 3)] }
      },
      ai: { type: 'cycle', seq: ['song', 'lure', 'comb', 'wave', 'charm'] },
      phase2: { at: 0.5, enter: 'chorus', ai: { type: 'cycle', seq: ['tide', 'song', 'comb', 'wave', 'charm'] } }
    },

    // ======================= QUIRE III — The Apocalypse =======================
    hellmouth: {
      name: 'The Hellmouth', act: 3, tier: 'boss', hp: [436, 452], size: 'l',
      desc: 'The great gaping gate of the bottom margin. It eats sinners, pages, and the occasional rhyme.',
      moves: {
        gulp:   { name: 'Swallow Whole', intent: 'devour', ops: [hit(17), { op: 'devour', n: 2 }] },
        spit:   { name: 'Spit Out the Damned', intent: 'curse', ops: [hit(15), blot('ink_blot', 1, 'draw'), blot('smear', 1, 'draw')] },
        imps:   { name: 'Disgorge Imps', intent: 'summon', ops: [summon('hell_imp_small', 4), summon('hell_imp_small', 4), ward(12)] },
        inhale: { name: 'Inhale the Brimstone', ops: [ward(18), self('might', 5), curse('faded', 2)] },
        jaws:   { name: 'The Jaws Close', ops: [hit(46)] },
        ravenous:{ name: 'Ravenous!', intent: 'devour', ops: [{ op: 'devour', n: 2 }, blot('wormhole', 2, 'draw'), ward(20), self('zeal', 1)] },
        gnash:  { name: 'Gnash the Portcullis', ops: [hit(16, 2)] }
      },
      ai: { type: 'cycle', seq: ['gulp', 'spit', 'imps', 'inhale', 'jaws'] },
      phase2: { at: 0.5, enter: 'ravenous', ai: { type: 'cycle', seq: ['gnash', 'gulp', 'spit', 'inhale', 'jaws', 'imps'] } }
    },

    hell_imp_small: {
      name: 'Imp of the Pit', act: 3, tier: 'minion', hp: [12, 15], size: 's',
      desc: 'Pocket-sized, pitchforked and pleased to be out of the mouth for a bit.',
      moves: {
        poke:   { name: 'Poke', ops: [hit(6)] },
        singe:  { name: 'Singe', ops: [hit(3), curse('corrode', 2)] },
        cackle: { name: 'Cackle', ops: [ward(4), self('might', 1)] }
      },
      ai: { type: 'random', w: { poke: 3, singe: 2, cackle: 1 }, maxRepeat: 2, noRepeat: ['singe', 'cackle'] }
    },

    // Four faces, one at a time: Lion (fury), Ox (bulwark), Eagle (thorns), Man (judgement → Trisagion).
    seraph: {
      name: 'The Seraph', act: 3, tier: 'boss', hp: [396, 410], size: 'l',
      desc: 'Six wings, four faces, one opinion of your penmanship. It is on fire about it.',
      moves: {
        lion:  { name: 'Face of the Lion', ops: [drop('shell'), drop('brambles'), self('might', 2), hit(6, 3)] },
        wheel: { name: 'Wheels of Burning Eyes', ops: [hit(7, 3)] },
        ox:    { name: 'Face of the Ox', ops: [drop('brambles'), self('shell', 6), ward(16)] },
        coal:  { name: 'Live Coal from the Altar', ops: [hit(9), curse('corrode', 5)] },
        eagle: { name: 'Face of the Eagle', ops: [drop('shell'), self('brambles', 3), hit(4, 4)] },
        man:   { name: 'Face of the Man', ops: [drop('brambles'), ward(14), self('might', 3), curse('torn', 2), curse('faded', 2)] },
        holy:  { name: 'Holy, Holy, Holy', ops: [hit(32)] },
        wings: { name: 'All Six Wings Unfurled', ops: [drop('shell'), drop('brambles'), drop('corrode'), ward(28), self('steadfast', 1), self('zeal', 1), curse('faded', 2)] },
        blaze: { name: 'Four Faces Ablaze', ops: [hit(7, 2), curse('corrode', 4)] }
      },
      ai: { type: 'cycle', seq: ['lion', 'wheel', 'ox', 'coal', 'eagle', 'wheel', 'man', 'holy'] },
      phase2: { at: 0.5, enter: 'wings', ai: { type: 'cycle', seq: ['blaze', 'eagle', 'wheel', 'man', 'holy', 'ox', 'coal', 'lion'] } }
    }
  };

  Object.keys(B).forEach(function (id) { M.ENEMIES[id] = B[id]; });

  M.ENCOUNTERS[1].boss.push(['jousting_hare', 'war_snail'], ['bagpipe_bishop']);
  M.ENCOUNTERS[2].boss.push(['basilisk'], ['siren']);
  M.ENCOUNTERS[3].boss.push(['hellmouth'], ['seraph']);
})();
