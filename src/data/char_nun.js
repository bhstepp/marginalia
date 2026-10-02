/* Marginalia — THE NUN (Sister Anselma). Nun content agent.
   Signature: PRAYERS & THE HOURS. Lapis/Verdigris-heavy devotion and endurance. Many cards ask
   "If you have N+ Ward" (a prayer answered), and the canonical-hour Glosses (Prime, Terce, Sext, Nones,
   Vespers, Compline, Matins) fire at the END of your turn only if you are still kneeling behind enough Ward.
   A lean Vermilion third colour turns Ward and prayers into righteous damage. Healing is small and mostly Scrape. */
(function () {
  var M = ((typeof globalThis !== 'undefined') ? globalThis : window).M;

  function dmg(n, extra) { var o = { op: 'dmg', n: n }; for (var k in extra) o[k] = extra[k]; return o; }
  function ward(n) { return { op: 'ward', n: n }; }
  function ap(s, n, target) { var o = { op: 'apply', s: s, n: n }; if (target) o.target = target; return o; }
  function iff(cond, then, els) { var o = { op: 'if', cond: cond, then: then }; if (els) o.else = els; return o; }
  function draw(n) { return { op: 'draw', n: n }; }
  function W(n) { return 'wardAtLeast:' + n; }
  // a canonical-hour Gloss: at the end of your turn, if you have N+ Ward, do ops
  function hour(n, ops) { return { on: 'turnEnd', ops: [iff(W(n), ops)] }; }

  var C = {
    // ======================= STARTERS =======================
    nun_psalter_swat: { name: 'Psalter Swat', pigment: 'V', type: 'attack', rarity: 'starter', cost: 1, target: 'enemy',
      ops: [dmg(5), iff(W(5), [dmg(2)])], up: { ops: [dmg(7), iff(W(5), [dmg(3)])] },
      flavor: 'One hundred and fifty psalms, bound in oak.' },
    nun_telling_beads: { name: 'Telling Beads', pigment: 'L', type: 'skill', rarity: 'starter', cost: 1,
      ops: [ward(5)], up: { ops: [ward(8)] }, flavor: 'Fifty beads. Fifty small walls.' },
    nun_holy_water: { name: 'Holy Water', pigment: 'G', type: 'skill', rarity: 'starter', cost: 1, target: 'enemy',
      ops: [ward(3), ap('corrode', 2)], up: { ops: [ward(4), ap('corrode', 3)] },
      flavor: 'Blessed, slightly green, and kept in a copper stoup.' },

    // ======================= COMMON =======================
    // --- Lapis
    nun_genuflect: { name: 'Genuflect', pigment: 'L', type: 'skill', rarity: 'common', cost: 1,
      ops: [ward(7), { op: 'drawPigment', pig: 'G', n: 1 }], up: { ops: [ward(10), { op: 'drawPigment', pig: 'G', n: 1 }] },
      flavor: 'Down on one knee. The snail is not impressed.' },
    nun_plainchant: { name: 'Plainchant', pigment: 'L', type: 'skill', rarity: 'common', cost: 1,
      ops: [{ op: 'wardPer', base: 4, mult: 2, per: 'played' }], up: { ops: [{ op: 'wardPer', base: 6, mult: 2, per: 'played' }] },
      flavor: 'One note at a time, and each one longer.' },
    nun_wimple: { name: 'Starched Wimple', pigment: 'L', type: 'skill', rarity: 'common', cost: 0,
      ops: [ward(3), iff(W(10), [ward(3)])], up: { ops: [ward(5), iff(W(10), [ward(3)])] },
      flavor: 'Stiff enough to stop an arrow. Or a smile.' },
    nun_cloister_wall: { name: 'Cloister Wall', pigment: 'L', type: 'skill', rarity: 'common', cost: 2,
      ops: [ward(11), ap('steadfast', 1, 'self')], up: { ops: [ward(15), ap('steadfast', 1, 'self')] },
      flavor: 'Four walls, a garden, and absolutely no drolleries.' },
    nun_lectio: { name: 'Lectio Divina', pigment: 'L', type: 'skill', rarity: 'common', cost: 1,
      ops: [ward(4), draw(1)], up: { ops: [ward(7), draw(1)] }, flavor: 'Read slowly. Then read it again, slower.' },
    nun_prime: { name: 'Prime', pigment: 'L', type: 'gloss', rarity: 'common', cost: 1,
      gloss: { on: 'turnStart', ops: [ward(2)] }, up: { gloss: { on: 'turnStart', ops: [ward(4)] } },
      flavor: 'The first hour. Nobody is awake but the snails.' },
    // --- Verdigris
    nun_aspergillum: { name: 'Aspergillum', pigment: 'G', type: 'skill', rarity: 'common', cost: 1,
      ops: [ap('corrode', 2, 'all'), ward(3)], up: { ops: [ap('corrode', 3, 'all'), ward(5)] },
      flavor: 'A blessing for everyone, whether they like it or not.' },
    nun_simples: { name: 'Herb of Simples', pigment: 'G', type: 'skill', rarity: 'common', cost: 1, scrape: true,
      ops: [ap('mending', 2, 'self'), ward(5)], up: { ops: [ap('mending', 3, 'self'), ward(7)] },
      flavor: 'Sage for wisdom. Rue for regret. Comfrey for the bruises.' },
    nun_green_psalm: { name: 'Verdant Psalm', pigment: 'G', type: 'skill', rarity: 'common', cost: 1, target: 'enemy',
      ops: [ap('corrode', 3), iff(W(6), [ap('corrode', 1)])], up: { ops: [ap('corrode', 4), iff(W(6), [ap('corrode', 2)])] },
      flavor: 'Sung in a key that makes copper weep.' },
    nun_moss_habit: { name: 'Mossy Habit', pigment: 'G', type: 'skill', rarity: 'common', cost: 1, scrape: true,
      ops: [ward(5), ap('shell', 1, 'self')], up: { ops: [ward(8), ap('shell', 1, 'self')] },
      flavor: 'Laundry day was in the eleventh century.' },
    nun_thurible: { name: 'Thurible Swing', pigment: 'G', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
      ops: [dmg(5), iff('targetCorroded', [ward(4)])], up: { ops: [dmg(7), iff('targetCorroded', [ward(5)])] },
      flavor: 'Incense on the chain, iron in the pot.' },
    // --- Vermilion
    nun_ruler_rap: { name: 'Ruler Rap', pigment: 'V', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
      ops: [dmg(6), iff(W(8), [dmg(4)])], up: { ops: [dmg(8), iff(W(8), [dmg(5)])] },
      flavor: 'Knuckles out, drollery.' },
    nun_censer: { name: 'Swinging Censer', pigment: 'V', type: 'attack', rarity: 'common', cost: 1,
      ops: [dmg(4, { target: 'all' }), ward(3)], up: { ops: [dmg(6, { target: 'all' }), ward(4)] },
      flavor: 'Holy smoke, at head height.' },
    nun_rebuke: { name: 'Stern Rebuke', pigment: 'V', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
      ops: [dmg(7), iff('targetAttacking', [ap('smudged', 1)])], up: { ops: [dmg(9), iff('targetAttacking', [ap('smudged', 2)])] },
      flavor: '“Mind your margins, young ape.”' },
    // --- Gold
    nun_gilt_thread: { name: 'Gilt Thread', pigment: 'A', type: 'skill', rarity: 'common', cost: 1,
      ops: [ward(4), draw(1)], up: { cost: 0 },
      flavor: 'Embroidered on the altar cloth, and on the tea towels.' },

    // ======================= UNCOMMON =======================
    // --- Lapis
    nun_antiphon: { name: 'Antiphon', pigment: 'L', type: 'skill', rarity: 'uncommon', cost: 1,
      ops: [ward(5), { op: 'nextTurn', ops: [ward(5)] }], up: { ops: [ward(7), { op: 'nextTurn', ops: [ward(7)] }] },
      flavor: 'One side of the choir sings; the other answers.' },
    nun_steadfast_faith: { name: 'Steadfast Faith', pigment: 'L', type: 'skill', rarity: 'uncommon', cost: 2,
      ops: [ward(10), ap('steadfast', 1, 'self')], up: { ops: [ward(14), ap('steadfast', 1, 'self')] },
      flavor: 'Unmoved. Also unmovable; she is very heavy with prayer.' },
    nun_matins: { name: 'Matins', pigment: 'L', type: 'gloss', rarity: 'uncommon', cost: 1,
      gloss: hour(10, [ap('steadfast', 1, 'self')]), up: { cost: 0 },
      flavor: 'The night office. Keep the candle lit and the Ward up.' },
    nun_hair_shirt: { name: 'Hair Shirt', pigment: 'L', type: 'skill', rarity: 'uncommon', cost: 1,
      ops: [ap('brambles', 2, 'self'), ward(4)], up: { ops: [ap('brambles', 3, 'self'), ward(6)] },
      flavor: 'Itchy for her. Considerably worse for whoever hits her.' },
    nun_heavy_psalter: { name: 'Heavy Psalter', pigment: 'L', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy',
      ops: [{ op: 'dmgPer', base: 0, mult: 1, per: 'ward' }], up: { ops: [{ op: 'dmgPer', base: 4, mult: 1, per: 'ward' }] },
      flavor: 'The word of God has considerable heft.' },
    nun_vow_silence: { name: 'Vow of Silence', pigment: 'L', type: 'skill', rarity: 'uncommon', cost: 1, scrape: true,
      ops: [ap('resolve', 1, 'self'), ward(5)], up: { ops: [ap('resolve', 2, 'self'), ward(5)] },
      flavor: '…' },
    // --- Verdigris
    nun_terce: { name: 'Terce', pigment: 'G', type: 'gloss', rarity: 'uncommon', cost: 1,
      gloss: hour(8, [ap('corrode', 2, 'all')]), up: { gloss: hour(8, [ap('corrode', 3, 'all')]) },
      flavor: 'Mid-morning. The copper bells begin to turn green.' },
    nun_nones: { name: 'Nones', pigment: 'G', type: 'gloss', rarity: 'uncommon', cost: 1,
      gloss: { on: 'play', pig: 'L', ops: [ap('corrode', 1, 'random')] }, up: { cost: 0 },
      flavor: 'The ninth hour, when even the moss grows drowsy.' },
    nun_infirmary: { name: 'Infirmary', pigment: 'G', type: 'skill', rarity: 'uncommon', cost: 1, scrape: true,
      ops: [ap('mending', 3, 'self'), ward(5)], up: { ops: [ap('mending', 4, 'self'), ward(7)] },
      flavor: 'Two beds, one cat, and a great deal of comfrey.' },
    nun_lenten_fast: { name: 'Lenten Fast', pigment: 'G', type: 'skill', rarity: 'uncommon', cost: 1, target: 'enemy', scrape: true,
      ops: [ward(5), { op: 'doubleStatus', s: 'corrode' }], up: { ops: [ward(8), { op: 'doubleStatus', s: 'corrode' }] },
      flavor: 'Forty days without bread. The foe is somehow hungrier.' },
    nun_copper_patience: { name: 'Copper Patience', pigment: 'G', type: 'skill', rarity: 'uncommon', cost: 1, scrape: true,
      ops: [ap('shell', 1, 'self'), ap('corrode', 2, 'all')], up: { ops: [ap('shell', 2, 'self'), ap('corrode', 2, 'all')] },
      flavor: 'Copper waits. Copper always wins.' },
    nun_tolling_bell: { name: 'Tolling Bell', pigment: 'G', type: 'attack', rarity: 'uncommon', cost: 2,
      ops: [dmg(6, { target: 'all' }), ap('corrode', 2, 'all')], up: { ops: [dmg(8, { target: 'all' }), ap('corrode', 3, 'all')] },
      flavor: 'Ask not for whom. It is for the hares.' },
    // --- Vermilion
    nun_sext: { name: 'Sext', pigment: 'V', type: 'gloss', rarity: 'uncommon', cost: 1,
      gloss: hour(8, [dmg(5, { target: 'random' })]), up: { gloss: hour(8, [dmg(8, { target: 'random' })]) },
      flavor: 'Noon. The hour of the midday demon, and of the midday nun.' },
    nun_litany: { name: 'Litany of Saints', pigment: 'V', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy',
      ops: [{ op: 'dmgPer', base: 4, mult: 3, per: 'margin' }], up: { ops: [{ op: 'dmgPer', base: 6, mult: 4, per: 'margin' }] },
      flavor: 'Saint Agnes, pray for us. Saint Agatha, hit them.' },
    nun_smite: { name: 'Smite', pigment: 'V', type: 'attack', rarity: 'uncommon', cost: 2, target: 'enemy',
      ops: [dmg(11), iff(W(10), [dmg(7)])], up: { ops: [dmg(14), iff(W(10), [dmg(9)])] },
      flavor: 'Smiting is a sacrament if done with sincerity.' },
    // --- Gold
    nun_votive_lamp: { name: 'Votive Lamp', pigment: 'A', type: 'gloss', rarity: 'uncommon', cost: 1,
      gloss: { on: 'illuminate', ops: [ward(4)] }, up: { gloss: { on: 'illuminate', ops: [ward(7)] } },
      flavor: 'Lit for a saint. Borrowed by a nun.' },

    // ======================= RARE =======================
    nun_vespers: { name: 'Vespers', pigment: 'V', type: 'gloss', rarity: 'rare', cost: 2,
      gloss: hour(12, [dmg(6, { target: 'all' })]), up: { gloss: hour(12, [dmg(9, { target: 'all' })]) },
      flavor: 'Evensong. The drolleries do not sing along.' },
    nun_compline: { name: 'Compline', pigment: 'L', type: 'gloss', rarity: 'rare', cost: 2,
      gloss: hour(12, [ap('resolve', 1, 'self')]), up: { cost: 1 },
      flavor: 'The last office. Protect us through the night, and the margin.' },
    nun_walled_in: { name: 'Walled In', pigment: 'L', type: 'skill', rarity: 'rare', cost: 2, scrape: true,
      ops: [ward(15), ap('steadfast', 3, 'self')], up: { ops: [ward(20), ap('steadfast', 3, 'self')] },
      flavor: 'The anchoress asked for one window. Facing the enemy.' },
    nun_dies_irae: { name: 'Dies Irae', pigment: 'V', type: 'attack', rarity: 'rare', cost: 2, scrape: true,
      ops: [{ op: 'dmgPer', base: 0, mult: 1, per: 'ward', target: 'all' }],
      up: { ops: [{ op: 'dmgPer', base: 6, mult: 1, per: 'ward', target: 'all' }] },
      flavor: 'The day of wrath, conveniently scheduled for a Tuesday.' },
    nun_sword_michael: { name: 'Michael’s Sword', pigment: 'V', type: 'attack', rarity: 'rare', cost: 2, target: 'enemy',
      ops: [dmg(12), iff(W(15), [dmg(12)])], up: { ops: [dmg(16), iff(W(15), [dmg(16)])] },
      flavor: 'Borrowed from an archangel. Due back at Doomsday.' },
    nun_crown_thorns: { name: 'Crown of Thorns', pigment: 'L', type: 'skill', rarity: 'rare', cost: 2,
      ops: [ap('brambles', 4, 'self'), ward(8)], up: { ops: [ap('brambles', 5, 'self'), ward(11)] },
      flavor: 'Uncomfortable. Instructive. Contagious.' },
    nun_ash_wednesday: { name: 'Ash Wednesday', pigment: 'G', type: 'skill', rarity: 'rare', cost: 1, scrape: true,
      ops: [ap('corrode', 3, 'all'), ap('shell', 2, 'self')], up: { ops: [ap('corrode', 5, 'all'), ap('shell', 2, 'self')] },
      flavor: 'Remember, drollery, that thou art ink.' },
    nun_green_martyr: { name: 'Green Martyrdom', pigment: 'G', type: 'gloss', rarity: 'rare', cost: 1,
      gloss: { on: 'hurt', ops: [ap('corrode', 2, 'all')] }, up: { gloss: { on: 'hurt', ops: [ap('corrode', 3, 'all')] } },
      flavor: 'Not red martyrdom, which is messy. Green, which is slow.' },
    nun_loaves: { name: 'Loaves and Fishes', pigment: 'A', type: 'skill', rarity: 'rare', cost: 1, scrape: true,
      ops: [{ op: 'createCard', n: 2, pig: 'L', cost: 0 }], up: { ops: [{ op: 'createCard', n: 3, pig: 'L', cost: 0 }] },
      flavor: 'Two loaves, five fishes, and an unreasonable number of shields.' },
    nun_te_deum: { name: 'Te Deum', pigment: 'A', type: 'skill', rarity: 'rare', cost: 1, scrape: true,
      ops: [{ op: 'echoMargin' }, ward(4)], up: { cost: 0 },
      flavor: 'Sung only for great occasions, and for this.' },
    nun_rapture: { name: 'Rapture', pigment: 'A', type: 'skill', rarity: 'rare', cost: 0, scrape: true,
      ops: [draw(2), iff(W(10), [{ op: 'ink', n: 2 }])], up: { ops: [draw(3), iff(W(10), [{ op: 'ink', n: 2 }])] },
      flavor: 'Her eyes roll heavenward. Her ruler does not.' }
  };
  Object.keys(C).forEach(function (id) { C[id].char = 'nun'; M.CARDS[id] = C[id]; });

  // ---- Relics ----------------------------------------------------------------------------------
  var R = {
    nun_wooden_rosary: { name: 'Wooden Rosary', rarity: 'starter',
      hooks: [{ on: 'turnEnd', ops: [iff(W(8), [{ op: 'heal', n: 1 }])] }],
      flavor: 'Worn smooth by a thousand Aves and one emergency.' },
    nun_hassock: { name: 'Hassock', rarity: 'common',
      hooks: [{ on: 'play', type: 'gloss', ops: [ward(4)] }],
      flavor: 'A cushion for kneeling. Stuffed with straw and good intentions.' },
    nun_myrrh: { name: 'Censer of Myrrh', rarity: 'uncommon',
      hooks: [{ on: 'turnEnd', ops: [iff(W(10), [ap('corrode', 1, 'all')])] }],
      flavor: 'Smells of the East. And, faintly, of rust.' },
    nun_crozier: { name: 'Abbess’s Crozier', rarity: 'rare', unlock: 'nun_pilgrim',
      hooks: [{ on: 'play', pig: 'L', every: 3, ops: [dmg(8, { target: 'random' })] }],
      flavor: 'A shepherd’s crook. The flock are drolleries; the crook is brass.' },
    nun_cilice: { name: 'Iron Cilice', rarity: 'boss', passive: { ink: 1 },
      hooks: [{ on: 'combatStart', ops: [{ op: 'loseHp', n: 3 }, ap('brambles', 2, 'self')] }],
      text: 'Gain <b>1</b> Ink each turn. At the start of each fight, lose <b>3</b> HP and gain <b>2</b> Brambles.',
      flavor: 'A penitent’s chain. Sharp on the inside; sharper on the outside.' }
  };
  Object.keys(R).forEach(function (id) { R[id].char = 'nun'; M.RELICS[id] = R[id]; });

  // ---- Achievements (Nun-specific) ---------------------------------------------------------------
  M.ACHIEVEMENTS = M.ACHIEVEMENTS || {};
  M.ACHIEVEMENTS.nun_rampart = { name: 'Tower of Ivory', desc: 'Have 60 or more Ward at once.',
    check: function (st) { return st.stats.maxWard >= 60; } };
  M.ACHIEVEMENTS.nun_hours = { name: 'Liturgy of the Hours', desc: 'As the Nun, play 10 Gloss cards in one run.',
    check: function (st) { return st.char === 'nun' && st.stats.glosses >= 10; } };
  M.ACHIEVEMENTS.nun_pilgrim = { name: 'Long Pilgrimage', desc: 'Reach Quire III as the Nun.',
    check: function (st) { return st.char === 'nun' && st.act >= 3; } };

  // ~20% of the Nun's non-starter cards are held back until earned
  var LOCK = {
    nun_hours: ['nun_vespers', 'nun_compline'], nun_rampart: ['nun_dies_irae'], bulwark: ['nun_walled_in'],
    glossator: ['nun_te_deum'], great_blow: ['nun_sword_michael'], nun_pilgrim: ['nun_rapture'],
    unscathed: ['nun_crown_thorns'], quire_two: ['nun_loaves']
  };
  Object.keys(LOCK).forEach(function (a) { LOCK[a].forEach(function (id) { M.CARDS[id].unlock = a; }); });

  // ---- Character -------------------------------------------------------------------------------
  M.CHARACTERS = M.CHARACTERS || {};
  M.CHARACTERS.nun = {
    name: 'Sister Anselma', short: 'Nun', hp: 58, art: 'nun', order: 2,
    deck: ['nun_psalter_swat', 'nun_psalter_swat', 'nun_psalter_swat', 'nun_psalter_swat',
      'nun_telling_beads', 'nun_telling_beads', 'nun_telling_beads', 'nun_telling_beads',
      'nun_holy_water', 'nun_holy_water'],
    relic: 'nun_wooden_rosary', unlock: 'win_knight', colors: ['L', 'G', 'V'],
    blurb: 'A nun praying beside a psalm in the margin. Slow and sturdy: keep your Ward up and her Hours answer with wrath.'
  };
})();
