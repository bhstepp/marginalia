/* Marginalia — THE SCRIBE (Brother Odo). Scribe content agent.
   Identity: he WRITES the page. Conjures cards mid-fight (createCard), rewrites his Margin (echoMargin, Margin payoffs),
   runs a tight Ink economy (ink / costHand), scrapes the Blots his haste leaves behind (scrapeBlots, per:'blots'),
   and leans on Gold leaf for Illumination. All ids are prefixed scr_.
   Loop safeguards (keep when editing):
   - No Gloss hook ever contains echoMargin (a Gloss echoing the Margin would echo itself forever).
   - Every card that conjures cards costs Ink or Scrapes; conjured cards are never gilded, and "cost 0" conjuring
     only ever pulls from pools where a self-copy is rare (mean offspring < 1).
   - Nothing draws cards when a Gold card is played; 0-cost cards never draw unconditionally (no draw-cycle infinites).
   - Big Ink/draw bursts Scrape and leave Blots behind. */
(function () {
  var M = ((typeof globalThis !== 'undefined') ? globalThis : window).M;

  function dmg(n, extra) { var o = { op: 'dmg', n: n }; for (var k in extra) o[k] = extra[k]; return o; }
  function ward(n) { return { op: 'ward', n: n }; }
  function ap(s, n, target) { var o = { op: 'apply', s: s, n: n }; if (target) o.target = target; return o; }
  function iff(cond, then, els) { var o = { op: 'if', cond: cond, then: then }; if (els) o.else = els; return o; }
  function draw(n) { return { op: 'draw', n: n }; }
  function ink(n) { return { op: 'ink', n: n }; }
  function create(extra) { var o = { op: 'createCard' }; for (var k in extra) o[k] = extra[k]; return o; }
  function per(op, base, mult, p, extra) { var o = { op: op, base: base, mult: mult, per: p }; for (var k in extra) o[k] = extra[k]; return o; }
  var ECHO = { op: 'echoMargin' };
  function blot(id, n, to) { return { op: 'addCard', id: id, n: n || 1, to: to || 'discard' }; }

  var C = {
    // ======================= STARTERS =======================
    scr_quill_jab: { name: 'Quill Jab', pigment: 'V', type: 'attack', rarity: 'starter', cost: 1, target: 'enemy',
      ops: [dmg(6)], up: { ops: [dmg(9)] }, flavor: 'The sharp end. Mind the ink.' },
    scr_blotting_sand: { name: 'Blotting Sand', pigment: 'L', type: 'skill', rarity: 'starter', cost: 1,
      ops: [ward(5)], up: { ops: [ward(8)] }, flavor: 'Thrown in the eyes, it dries more than ink.' },
    scr_first_draft: { name: 'First Draft', pigment: 'G', type: 'skill', rarity: 'starter', cost: 1, target: 'enemy',
      ops: [ap('corrode', 3), create({ rarity: 'common' })], up: { ops: [ap('corrode', 4), create({ rarity: 'common' })] },
      flavor: 'Rough, green, and full of ideas.' },

    // ======================= COMMON =======================
    scr_red_letter: { name: 'Red Letter Day', pigment: 'V', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
      ops: [dmg(8), iff('played:A', [dmg(4)])], up: { ops: [dmg(10), iff('played:A', [dmg(6)])] },
      flavor: 'Feast days in red, grudges in gold.' },
    scr_strikethrough: { name: 'Strikethrough', pigment: 'V', type: 'attack', rarity: 'common', cost: 2,
      ops: [dmg(9, { target: 'all' })], up: { ops: [dmg(12, { target: 'all' })] },
      flavor: 'One firm line through the whole bestiary.' },
    scr_hasty_hand: { name: 'Hasty Hand', pigment: 'V', type: 'attack', rarity: 'common', cost: 0, target: 'enemy',
      ops: [dmg(6), blot('smear')], up: { ops: [dmg(9), blot('smear')] },
      flavor: 'Fast, furious, and slightly smudged.' },
    scr_double_under: { name: 'Double Underline', pigment: 'V', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
      ops: [dmg(5, { times: 2 })], up: { ops: [dmg(7, { times: 2 })] },
      flavor: 'Important. Very important.' },
    scr_vellum_guard: { name: 'Vellum Guard', pigment: 'L', type: 'skill', rarity: 'common', cost: 1,
      ops: [ward(7), iff('marginFull', [ward(4)])], up: { ops: [ward(10), iff('marginFull', [ward(5)])] },
      flavor: 'Calfskin: it served the calf well enough.' },
    scr_erasure: { name: 'Careful Erasure', pigment: 'L', type: 'skill', rarity: 'common', cost: 1,
      ops: [ward(7), { op: 'scrapeBlots', draw: true }], up: { ops: [ward(10), { op: 'scrapeBlots', draw: true }] },
      flavor: 'A light hand, a sharp knife, no witnesses.' },
    scr_fair_copy: { name: 'Fair Copy', pigment: 'L', type: 'skill', rarity: 'common', cost: 1,
      ops: [ward(4), create({ rarity: 'common', pig: 'L' })], up: { ops: [ward(7), create({ rarity: 'common', pig: 'L' })] },
      flavor: 'The same, but neater. Mostly the same.' },
    scr_iron_gall: { name: 'Iron Gall', pigment: 'G', type: 'skill', rarity: 'common', cost: 0, target: 'enemy',
      ops: [ap('corrode', 2), iff('played:A', [ap('corrode', 2)])], up: { ops: [ap('corrode', 3), iff('played:A', [ap('corrode', 2)])] },
      flavor: 'Oak galls, rust, rainwater. Eats parchment for breakfast.' },
    scr_foxed_page: { name: 'Foxed Page', pigment: 'G', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
      ops: [dmg(6), ap('corrode', 2)], up: { ops: [dmg(8), ap('corrode', 3)] },
      flavor: 'Brown spots, like a fox walked past. It did not.' },
    scr_mildew: { name: 'Spreading Mildew', pigment: 'G', type: 'skill', rarity: 'common', cost: 1,
      ops: [ap('corrode', 2, 'all'), draw(1)], up: { ops: [ap('corrode', 3, 'all'), draw(1)] },
      flavor: 'The library roof leaks. The library thrives.' },
    scr_bole: { name: 'Armenian Bole', pigment: 'A', type: 'skill', rarity: 'common', cost: 0,
      ops: [ward(3), iff('illuminated', [ward(3)])], up: { ops: [ward(5), iff('illuminated', [ward(3)])] },
      flavor: 'Red clay beneath the gold, so the gold looks warmer.' },
    scr_leaf_flake: { name: 'Leaf Flake', pigment: 'A', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
      ops: [dmg(6), iff('illuminated', [create({ rarity: 'common', cost: 0 })])],
      up: { ops: [dmg(8), iff('illuminated', [create({ rarity: 'common', cost: 0 })])] },
      flavor: 'A crumb of gold. Sneeze and it is gone.' },
    scr_scrawl: { name: 'Scrawl', pigment: 'N', type: 'skill', rarity: 'common', cost: 1,
      ops: [create({ n: 2, rarity: 'common' })], up: { cost: 0 },
      flavor: 'Legible to God and, on a good day, to Odo.' },
    scr_refill: { name: 'Refill the Well', pigment: 'N', type: 'skill', rarity: 'common', cost: 0,
      ops: [ink(1), blot('ink_blot')], up: { ops: [ink(1), draw(1), blot('ink_blot')],
        text: 'Gain <b>1</b> Ink. Draw <b>1</b> card. Add an Ink Blot to your discard pile.' },
      text: 'Gain <b>1</b> Ink. Add an Ink Blot to your discard pile.',
      flavor: 'Filled to the brim. Over the brim. Onto the page.' },
    scr_manicule: { name: 'Manicule', pigment: 'N', type: 'gloss', rarity: 'common', cost: 1,
      gloss: { on: 'play', pig: 'A', ops: [dmg(4, { target: 'random' })] },
      up: { gloss: { on: 'play', pig: 'A', ops: [dmg(6, { target: 'random' })] } },
      flavor: 'A little pointing hand: "Nota bene," and also "you there".' },

    // ======================= UNCOMMON =======================
    scr_ditto: { name: 'Ditto', pigment: 'N', type: 'skill', rarity: 'uncommon', cost: 1,
      ops: [ECHO], up: { ops: [ECHO, ward(4)] },
      flavor: 'As above. Exactly as above.' },
    scr_crowded_margin: { name: 'Crowded Margin', pigment: 'V', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy',
      ops: [per('dmgPer', 6, 4, 'margin')], up: { ops: [per('dmgPer', 8, 5, 'margin')] },
      flavor: 'No room to swing a cat. Swing it anyway.' },
    scr_annotate: { name: 'Annotate', pigment: 'L', type: 'skill', rarity: 'uncommon', cost: 1,
      ops: [per('wardPer', 4, 3, 'margin')], up: { ops: [per('wardPer', 6, 4, 'margin')] },
      flavor: 'Hide behind your footnotes, as scholars do.' },
    scr_scrape_clean: { name: 'Scrape Clean', pigment: 'V', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy',
      ops: [per('dmgPer', 7, 4, 'blots'), { op: 'scrapeBlots' }],
      up: { ops: [per('dmgPer', 9, 5, 'blots'), { op: 'scrapeBlots' }] },
      flavor: 'Every smudge, sharpened into a grudge.' },
    scr_rushed_copy: { name: 'Rushed Copy', pigment: 'N', type: 'skill', rarity: 'uncommon', cost: 0, unlock: 'scr_cramp',
      ops: [create({ n: 2, rarity: 'common' }), blot('smear')], up: { ops: [create({ n: 3, rarity: 'common' }), blot('smear')] },
      flavor: 'Due by Vespers. It is Vespers.' },
    scr_burnisher: { name: 'Agate Burnisher', pigment: 'A', type: 'skill', rarity: 'uncommon', cost: 1, scrape: true,
      ops: [{ op: 'costHand', n: 0, count: 1 }, iff('illuminated', [draw(1)])], up: { cost: 0 },
      flavor: 'Rub until the gold gleams and the price drops.' },
    scr_historiated_o: { name: 'Historiated O', pigment: 'A', type: 'attack', rarity: 'uncommon', cost: 2, target: 'enemy',
      ops: [dmg(13), iff('illuminated', [ink(1)])], up: { ops: [dmg(17), iff('illuminated', [ink(1)])] },
      flavor: 'There is a whole siege inside this letter.' },
    scr_nimbus: { name: 'Gilded Nimbus', pigment: 'A', type: 'skill', rarity: 'uncommon', cost: 1, unlock: 'illum_streak',
      ops: [ward(7), iff('illuminated', [ward(5)])], up: { ops: [ward(9), iff('illuminated', [ward(6)])] },
      flavor: 'A halo is just armour for the head, worn smugly.' },
    scr_green_scholia: { name: 'Green Scholia', pigment: 'G', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy',
      ops: [dmg(6), ap('corrode', 3), iff('marginFull', [ap('corrode', 3)])],
      up: { ops: [dmg(8), ap('corrode', 4), iff('marginFull', [ap('corrode', 3)])] },
      flavor: 'Commentary so bitter it rusts.' },
    scr_blot_it_out: { name: 'Blot It Out', pigment: 'L', type: 'skill', rarity: 'uncommon', cost: 1,
      ops: [per('wardPer', 5, 3, 'blots'), { op: 'scrapeBlots' }], up: { ops: [per('wardPer', 7, 4, 'blots'), { op: 'scrapeBlots' }] },
      flavor: 'If you cannot fix it, hide behind it.' },
    // --- uncommon glosses
    scr_copybook: { name: 'Copybook', pigment: 'N', type: 'gloss', rarity: 'uncommon', cost: 1, unlock: 'scr_glossa',
      gloss: { on: 'turnStart', ops: [create({ rarity: 'common' })] }, up: { cost: 0 },
      flavor: 'A model page for novices. Odo is no novice. He copies it anyway.' },
    scr_aping_monkey: { name: 'Aping Monkey', pigment: 'V', type: 'gloss', rarity: 'uncommon', cost: 1,
      gloss: { on: 'play', every: 3, ops: [dmg(4, { target: 'all' })] },
      up: { gloss: { on: 'play', every: 3, ops: [dmg(6, { target: 'all' })] } },
      flavor: 'Monkey see, monkey copy, monkey stab.' },
    scr_correctors_mark: { name: 'Corrector’s Mark', pigment: 'L', type: 'gloss', rarity: 'uncommon', cost: 1,
      gloss: { on: 'turnStart', ops: [ward(4), { op: 'scrapeBlots', draw: true }] },
      up: { gloss: { on: 'turnStart', ops: [ward(6), { op: 'scrapeBlots', draw: true }] },
        text: '<i>Gloss:</i> At the start of your turn, gain <b>6</b> Ward. Scrape Blots in hand; draw 1 for each.' },
      text: '<i>Gloss:</i> At the start of your turn, gain <b>4</b> Ward. Scrape Blots in hand; draw 1 for each.',
      flavor: 'A tiny cross in the margin: someone has erred.' },
    scr_steady_hand: { name: 'Steady Hand', pigment: 'N', type: 'gloss', rarity: 'uncommon', cost: 1,
      gloss: { on: 'turnStart', ops: [iff('marginFull', [ink(1)])] }, up: { cost: 0 },
      flavor: 'Elbow on the desk. Breathe out. Write.' },
    scr_damp_cellar: { name: 'Damp Cellar', pigment: 'G', type: 'gloss', rarity: 'uncommon', cost: 1, unlock: 'deep_rot',
      gloss: { on: 'turnEnd', ops: [ap('corrode', 2, 'random')] }, up: { gloss: { on: 'turnEnd', ops: [ap('corrode', 3, 'random')] } },
      flavor: 'Where old books go to grow beards.' },
    scr_bas_de_page: { name: 'Bas-de-page', pigment: 'A', type: 'gloss', rarity: 'uncommon', cost: 1,
      gloss: { on: 'play', type: 'gloss', ops: [draw(1)] }, up: { gloss: { on: 'play', type: 'gloss', ops: [draw(1), ward(3)] } },
      flavor: 'The bottom of the page, where all the fun happens.' },

    // ======================= RARE =======================
    scr_antiphon: { name: 'Antiphon', pigment: 'N', type: 'skill', rarity: 'rare', cost: 1, scrape: true, unlock: 'scr_glossa',
      ops: [{ op: 'repeat', n: 2, ops: [ECHO] }], up: { cost: 0 },
      text: 'Every Gloss in your Margin fires <b>twice</b> more. <span class="kw">Scrape.</span>',
      flavor: 'One side of the choir sings it. Then the other side does.' },
    scr_carpet_page: { name: 'Carpet Page', pigment: 'A', type: 'skill', rarity: 'rare', cost: 2, scrape: true, unlock: 'scr_cramp',
      ops: [create({ n: 2, pig: 'A', cost: 0 })], up: { ops: [create({ n: 3, pig: 'A', cost: 0 })] },
      flavor: 'A whole page of knotwork, and not one word on it.' },
    scr_magnum_opus: { name: 'Magnum Opus', pigment: 'V', type: 'attack', rarity: 'rare', cost: 2, target: 'enemy', unlock: 'great_blow',
      ops: [per('dmgPer', 10, 6, 'margin')], up: { ops: [per('dmgPer', 13, 7, 'margin')] },
      flavor: 'Thirty years in the making. Delivered in one blow.' },
    scr_explicit: { name: 'Explicit', pigment: 'N', type: 'attack', rarity: 'rare', cost: 2, unlock: 'scr_quire',
      ops: [dmg(10, { target: 'all' }), iff('marginFull', [dmg(10, { target: 'all' })])],
      up: { ops: [dmg(13, { target: 'all' }), iff('marginFull', [dmg(13, { target: 'all' })])] },
      flavor: '"Here it ends." It usually does, for them.' },
    scr_spilled_ink: { name: 'Spilled Inkhorn', pigment: 'V', type: 'attack', rarity: 'rare', cost: 1, unlock: 'triple_kill',
      ops: [dmg(6, { target: 'all', times: 2 }), blot('ink_blot', 2)], up: { ops: [dmg(8, { target: 'all', times: 2 }), blot('ink_blot', 2)],
        text: 'Deal <b>8</b> damage to ALL foes <b>2</b> times. Add 2 Ink Blots to your discard pile.' },
      text: 'Deal <b>6</b> damage to ALL foes <b>2</b> times. Add 2 Ink Blots to your discard pile.',
      flavor: 'An accident. A glorious, deliberate accident.' },
    scr_midnight_oil: { name: 'Midnight Oil', pigment: 'N', type: 'skill', rarity: 'rare', cost: 0, scrape: true,
      ops: [ink(2), draw(2), blot('ink_blot', 1, 'hand')], up: { ops: [ink(2), draw(3), blot('ink_blot', 1, 'hand')],
        text: 'Gain <b>2</b> Ink. Draw <b>3</b> cards. Add an Ink Blot to your hand. <span class="kw">Scrape.</span>' },
      text: 'Gain <b>2</b> Ink. Draw <b>2</b> cards. Add an Ink Blot to your hand. <span class="kw">Scrape.</span>',
      flavor: 'The candle gutters. The quill does not.' },
    scr_recipe_rot: { name: 'Recipe for Rot', pigment: 'G', type: 'skill', rarity: 'rare', cost: 1, target: 'enemy', scrape: true,
      ops: [ap('corrode', 3), { op: 'doubleStatus', s: 'corrode' }], up: { ops: [ap('corrode', 5), { op: 'doubleStatus', s: 'corrode' }] },
      flavor: 'Step one: forget the book in the cellar.' },
    // --- rare glosses
    scr_teeming_margin: { name: 'Teeming Margin', pigment: 'V', type: 'gloss', rarity: 'rare', cost: 2,
      gloss: { on: 'turnStart', ops: [per('dmgPer', 0, 2, 'margin', { target: 'all' })] }, up: { cost: 1 },
      flavor: 'Snails, apes, a bishop on a goat. All armed.' },
    scr_gilt_border: { name: 'Gilt Border', pigment: 'A', type: 'gloss', rarity: 'rare', cost: 1,
      gloss: { on: 'illuminate', ops: [ward(6), dmg(6, { target: 'random' })] },
      up: { gloss: { on: 'illuminate', ops: [ward(8), dmg(8, { target: 'random' })] } },
      flavor: 'A frame of gold, so nobody forgets who paid.' },
    scr_oak_boards: { name: 'Oak Boards', pigment: 'L', type: 'gloss', rarity: 'rare', cost: 2,
      gloss: { on: 'turnEnd', ops: [per('wardPer', 0, 3, 'margin')] }, up: { cost: 1 },
      flavor: 'Bound in oak and calfskin, with brass corners for emphasis.' }
  };
  Object.keys(C).forEach(function (id) { C[id].char = 'scribe'; M.CARDS[id] = C[id]; });

  // ---- Relics -----------------------------------------------------------------------------------
  var R = {
    scr_exemplar: { name: 'Odo’s Exemplar', rarity: 'starter',
      hooks: [{ on: 'turnStart', turn: 1, ops: [create({ rarity: 'common', cost: 0 })] }, { on: 'combatEnd', ops: [{ op: 'heal', n: 4 }] }],
      flavor: 'The model book every copy is copied from. Dog-eared, tea-ringed, beloved.' },
    scr_pounce_pot: { name: 'Pounce Pot', rarity: 'common',
      hooks: [{ on: 'combatStart', ops: [create({ pig: 'A' })] }],
      flavor: 'Powdered cuttlebone, for a page that takes the gold.' },
    scr_reading_stone: { name: 'Reading Stone', rarity: 'uncommon',
      hooks: [{ on: 'play', type: 'gloss', ops: [ward(4)] }],
      flavor: 'A polished beryl. Makes small notes large, and Odo less squinty.' },
    scr_jeromes_lion: { name: 'Jerome’s Lion', rarity: 'rare', unlock: 'scr_glossa',
      hooks: [{ on: 'turnStart', ops: [iff('marginFull', [ECHO])] }],
      flavor: 'The patron saint of scribes pulled a thorn from its paw. It still owes him.' },
    scr_leaking_inkhorn: { name: 'Leaking Inkhorn', rarity: 'boss', passive: { ink: 1 },
      hooks: [{ on: 'combatStart', ops: [blot('ink_blot', 2, 'draw')] }],
      text: 'Gain <b>1</b> Ink each turn. At the start of each fight, shuffle 2 Ink Blots into your draw pile.',
      flavor: 'Bottomless, in every direction.' }
  };
  Object.keys(R).forEach(function (id) { R[id].char = 'scribe'; M.RELICS[id] = R[id]; });

  // ---- Character --------------------------------------------------------------------------------
  M.CHARACTERS = M.CHARACTERS || {};
  M.CHARACTERS.scribe = {
    name: 'Brother Odo', short: 'Scribe', hp: 70, art: 'scribe', order: 3,
    deck: ['scr_quill_jab', 'scr_quill_jab', 'scr_quill_jab', 'scr_quill_jab', 'scr_blotting_sand', 'scr_blotting_sand',
      'scr_blotting_sand', 'scr_blotting_sand', 'scr_first_draft', 'scr_first_draft'],
    relic: 'scr_exemplar', unlock: 'win_nun', colors: ['A', 'V', 'L', 'G'],
    blurb: 'The weary scribe himself, climbed into his own margin to tidy up. Conjures cards, rewrites his Glosses and spends Ink like gold leaf.'
  };

  // ---- Scribe achievements (unlock some of his cards) -------------------------------------------
  M.ACHIEVEMENTS = M.ACHIEVEMENTS || {};
  M.ACHIEVEMENTS.scr_cramp = { name: 'Writer’s Cramp', desc: 'Play 12 cards in a single turn as the Scribe.',
    check: function (st) { return st.char === 'scribe' && st.stats.maxCardsTurn >= 12; } };
  M.ACHIEVEMENTS.scr_glossa = { name: 'Glossa Ordinaria', desc: 'Play 12 Gloss cards in one run as the Scribe.',
    check: function (st) { return st.char === 'scribe' && st.stats.glosses >= 12; } };
  M.ACHIEVEMENTS.scr_quire = { name: 'Odo Turns a Page', desc: 'Defeat the boss of Quire I as the Scribe.',
    check: function (st) { return st.char === 'scribe' && st.stats.bosses >= 1; } };
})();
