/* Marginalia — meta content: the Knight character, card/relic unlock tags, daily modifiers, achievements.
   Loaded after cards/relics/events/enemies and BEFORE the other character files. */
(function () {
  var M = ((typeof globalThis !== 'undefined') ? globalThis : window).M;

  // ---- Characters ------------------------------------------------------------------------------
  M.CHARACTERS = M.CHARACTERS || {};
  M.CHARACTERS.knight = {
    name: 'The Margin Knight', short: 'Knight', hp: 70, art: 'knight', order: 1,
    deck: ['lance', 'lance', 'lance', 'lance', 'shield', 'shield', 'shield', 'shield', 'moss_dart', 'moss_dart'],
    relic: 'pilgrim_badge', unlock: null, colors: ['V', 'L', 'G'],
    blurb: 'A knight sketched hastily in the lower margin. Balanced: lance, shield and moss in equal measure.'
  };
  // Every existing pigmented card belongs to the Knight; colourless Ink cards stay shared by all characters.
  Object.keys(M.CARDS).forEach(function (id) {
    var d = M.CARDS[id];
    if (!d.char && d.rarity !== 'special' && ['V', 'L', 'G', 'A'].indexOf(d.pigment) >= 0) d.char = 'knight';
  });
  M.RELICS.pilgrim_badge.char = 'knight';

  // ---- Achievements (unlock cards, relics and characters) ---------------------------------------
  // check(st) reads run state; it is evaluated by the UI after every action and at run end.
  function won(st) { return st.over && st.won; }
  M.ACHIEVEMENTS = M.ACHIEVEMENTS || {};
  var A = {
    illum_streak: { name: 'Unbroken Rubric', desc: 'Illuminate on 3 turns in a row in one fight.', check: function (st) { return st.stats.illumStreakMax >= 3; } },
    glossator: { name: 'Glossator', desc: 'Play 8 Gloss cards in one run.', check: function (st) { return st.stats.glosses >= 8; } },
    great_blow: { name: 'A Mighty Blow', desc: 'Deal 40 or more damage with a single hit.', check: function (st) { return st.stats.maxHit >= 40; } },
    triple_kill: { name: 'Three at a Stroke', desc: 'Slay 3 foes in a single turn.', check: function (st) { return st.stats.killsTurnMax >= 3; } },
    unscathed: { name: 'Unscathed', desc: 'Win 3 fights in one run without losing HP.', check: function (st) { return st.stats.flawless >= 3; } },
    bulwark: { name: 'Bulwark', desc: 'Have 40 or more Ward at once.', check: function (st) { return st.stats.maxWard >= 40; } },
    flurry: { name: 'Scribbling Fury', desc: 'Play 10 cards in a single turn.', check: function (st) { return st.stats.maxCardsTurn >= 10; } },
    deep_rot: { name: 'Deep Rot', desc: 'Stack 30 Corrode on a single foe.', check: function (st) { return st.stats.maxCorrode >= 30; } },
    quire_one: { name: 'First Quire Closed', desc: 'Defeat the boss of Quire I.', check: function (st) { return st.stats.bosses >= 1; } },
    quire_two: { name: 'Second Quire Closed', desc: 'Defeat the boss of Quire II.', check: function (st) { return st.stats.bosses >= 2; } },
    hoarder: { name: 'Hoarder of Silver', desc: 'Hold 300 or more silver at once.', check: function (st) { return st.gold >= 300; } },
    daily_win: { name: 'Folio of the Day', desc: 'Close the book on a Daily Folio.', check: function (st) { return won(st) && st.daily; } },
    win_knight: { name: 'Explicit: The Knight', desc: 'Close the book as the Margin Knight.', check: function (st) { return won(st) && st.char === 'knight'; } },
    win_nun: { name: 'Explicit: The Nun', desc: 'Close the book as the Nun.', check: function (st) { return won(st) && st.char === 'nun'; } },
    win_scribe: { name: 'Explicit: The Scribe', desc: 'Close the book as the Scribe.', check: function (st) { return won(st) && st.char === 'scribe'; } },
    rubric_five: { name: 'Fifth Rubric', desc: 'Close the book at Rubrication 5 or higher.', check: function (st) { return won(st) && st.asc >= 5; } }
  };
  Object.keys(A).forEach(function (k) { M.ACHIEVEMENTS[k] = A[k]; });
  M.checkAchievements = function (st, have) {
    have = have || [];
    return Object.keys(M.ACHIEVEMENTS).filter(function (k) {
      if (have.indexOf(k) >= 0) return false;
      try { return !!M.ACHIEVEMENTS[k].check(st); } catch (e) { return false; }
    });
  };
  // What each achievement unlocks (computed from data tags, for the UI)
  M.unlocksFor = function (ach) {
    var out = { cards: [], relics: [], chars: [] };
    Object.keys(M.CARDS).forEach(function (id) { if (M.CARDS[id].unlock === ach) out.cards.push(id); });
    Object.keys(M.RELICS).forEach(function (id) { if (M.RELICS[id].unlock === ach) out.relics.push(id); });
    Object.keys(M.CHARACTERS).forEach(function (id) { if (M.CHARACTERS[id].unlock === ach) out.chars.push(id); });
    return out;
  };

  // Knight / shared content held back until earned (~20%)
  var LOCK = {
    illum_streak: ['gloria', 'chrysography'], glossator: ['green_man', 'lauds'], great_blow: ['unicorn_charge', 'martyrs_zeal'],
    triple_kill: ['margin_sweep', 'drollery_riot'], unscathed: ['unbroken_psalter', 'wall_of_saints'], bulwark: ['bramble_hedge'],
    flurry: ['colophon', 'inkhorn'], deep_rot: ['harvest_rot'], daily_win: ['creeping_rust']
  };
  Object.keys(LOCK).forEach(function (a) { LOCK[a].forEach(function (id) { if (M.CARDS[id]) M.CARDS[id].unlock = a; }); });
  var RLOCK = { bulwark: ['snail_shell'], quire_one: ['bestiary_page'], quire_two: ['unicorn_horn'], win_knight: ['golden_burnisher'],
    rubric_five: ['arm_reliquary'], hoarder: ['stationers_ledger'], win_scribe: ['gilded_halo'] };
  Object.keys(RLOCK).forEach(function (a) { RLOCK[a].forEach(function (id) { if (M.RELICS[id]) M.RELICS[id].unlock = a; }); });

  // ---- Daily Folio modifiers ----------------------------------------------------------------------
  // Same schema as relics (passive / hooks / onRunStart) plus enemyStart (ops on every foe) and costSet.
  M.MODIFIERS = {
    brambled_foes: { name: 'Thorny Margins', desc: 'Every foe starts each fight with 3 Brambles.', enemyStart: [{ op: 'apply', s: 'brambles', n: 3, target: 'self' }] },
    gilt_age: { name: 'Gilt Age', desc: 'Gold cards cost 0.', costSet: { A: 0 } },
    wide_margins: { name: 'Wide Margins', desc: 'Your Margin holds 5 Glosses instead of 3.', passive: { marginSlots: 2 } },
    rich_patron: { name: 'Rich Patron', desc: 'Begin with 300 silver.', onRunStart: [{ op: 'gold', n: 201 }] },
    rare_start: { name: 'Treasured Folio', desc: 'Begin with 3 random rare cards.', onRunStart: [{ op: 'gainCard', rarity: 'rare' }, { op: 'gainCard', rarity: 'rare' }, { op: 'gainCard', rarity: 'rare' }] },
    fragile_vellum: { name: 'Fragile Vellum', desc: 'Max HP −20, but card rewards offer 4 choices.', onRunStart: [{ op: 'maxHp', n: -20 }], passive: { cardChoices: 1 } },
    mending_ink: { name: 'Mending Ink', desc: 'Heal 2 HP whenever you Illuminate.', hooks: [{ on: 'illuminate', ops: [{ op: 'heal', n: 2 }] }] },
    quick_quill: { name: 'Quick Quill', desc: 'Draw 6 cards each turn, but foes have 15% more HP.', passive: { hand: 1, enemyHpPct: 15 } },
    corrosive_air: { name: 'Corrosive Air', desc: 'Every foe starts each fight with 4 Corrode.', enemyStart: [{ op: 'apply', s: 'corrode', n: 4, target: 'self' }] },
    easy_light: { name: 'Easy Light', desc: 'Illuminate needs only 2 pigments, but foes have 10% more HP.', passive: { illumEase: 1, enemyHpPct: 10 } },
    stained_relic: { name: 'Stained Relic', desc: 'Begin with a random rare relic and a Water Stain curse.', onRunStart: [{ op: 'relic', rarity: 'rare' }, { op: 'addCard', id: 'water_stain' }] },
    zealous_foes: { name: 'Zealous Foes', desc: 'Foes start fights with 2 Might, but you gain 25% more silver.', enemyStart: [{ op: 'apply', s: 'might', n: 2, target: 'self' }], passive: { goldPct: 25 } }
  };
})();
