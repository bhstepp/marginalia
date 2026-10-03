// Marginalia math audit. Usage: node tools/math_audit.js [repoRoot]
// Plays every card (base + gilded) under many Might/Smudged/Resolve/Faded/Torn/Ward combinations and checks that the
// number PRINTED on the card (and on enemy intents) equals what the engine really does. Also checks status timing,
// Illuminate, and the per-X attacks against an independent formula. Exits 1 on any failure.
var path = require('path');
var ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
process.chdir(ROOT);
var M = require(path.join(ROOT, 'load'));
var strip = function (s) { return String(s).replace(/<[^>]+>/g, ''); };

var failures = {}, checks = 0;
function fail(section, msg) { (failures[section] = failures[section] || []).push(msg); }
function expect(section, cond, msg) { checks++; if (!cond) fail(section, msg); }

function mkState(char, enemyId) {
  var st = M.newRun({ seed: 'audit', char: char || 'knight', asc: 0, unlocked: Object.keys(M.ACHIEVEMENTS || {}) });
  st.relics = [];
  M.startCombat(st, [enemyId || 'snail_knight'], 'battle');
  var c = st.combat;
  c.enemies = c.enemies.slice(0, 1);
  c.enemies.forEach(function (e) { e.hp = e.maxHp = 9999; e.ward = 0; e.st = {}; });
  c.player.st = {}; c.player.ward = 0; c.ink = 99; c.hand = []; c.draw = []; c.discard = []; c.margin = [];
  st.hp = st.maxHp = 500; st.fx = [];
  return st;
}
function filler(n) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 100 + i, id: 'lance', up: false }); return a; }
// independent damage formula (does not call the engine)
function hitFormula(base, might, smudged, torn) {
  var n = base + might;
  if (smudged) n = Math.floor(n * 0.75);
  if (torn) n = Math.floor(n * 1.5);
  return Math.max(0, n);
}
function wardFormula(base, resolve, faded) {
  var n = base + resolve;
  if (faded) n = Math.floor(n * 0.75);
  return Math.max(0, n);
}

// ---------------------------------------------------------------------------------------------------------------
// 1. Printed card numbers vs. what actually happens
// ---------------------------------------------------------------------------------------------------------------
var PLAYER = {
  none: {}, might3: { might: 3 }, smudged: { smudged: 1 }, might3_smudged: { might: 3, smudged: 1 },
  resolve2: { resolve: 2 }, faded: { faded: 1 }, resolve2_faded: { resolve: 2, faded: 1 }, resolve1_faded: { resolve: 1, faded: 1 },
  might3_resolve2: { might: 3, resolve: 2 }
};
var TARGET = { plain: {}, torn: { torn: 1 }, ward5: { ward: 5 } };

function leafOps(ops, top, out) {
  (ops || []).forEach(function (o) {
    if (o.op === 'if') { leafOps(o.then, false, out); leafOps(o.else, false, out); }
    else if (o.op === 'repeat') leafOps(o.ops, false, out);
    else out.push({ o: o, top: top });
  });
  return out;
}

var playable = Object.keys(M.CARDS).filter(function (id) {
  var d = M.CARDS[id]; return d.cost != null && d.type !== 'blot' && d.type !== 'curse' && d.type !== 'gloss';
});
var cardRuns = 0;
playable.forEach(function (id) {
  [false, true].forEach(function (up) {
    if (up && !M.CARDS[id].up) return;
    var def = M.cardDef({ id: id, up: up });
    var leaves = leafOps(def.ops, true, []);
    var firstDmg = leaves.filter(function (l) { return l.o.op === 'dmg' || l.o.op === 'dmgPer'; })[0];
    var firstWard = leaves.filter(function (l) { return l.o.op === 'ward' || l.o.op === 'wardPer'; })[0];
    var checkDmg = firstDmg && firstDmg.top && firstDmg.o.op === 'dmg';
    var checkWard = firstWard && firstWard.top && firstWard.o.op === 'ward';
    if (!checkDmg && !checkWard) return;
    Object.keys(PLAYER).forEach(function (pn) {
      Object.keys(TARGET).forEach(function (tn) {
        var tag = id + (up ? '+' : '') + ' [' + pn + ' | target ' + tn + ']';
        var st = mkState(def.char || 'knight'); var c = st.combat, e = c.enemies[0];
        Object.assign(c.player.st, PLAYER[pn]);
        e.ward = TARGET[tn].ward || 0; if (TARGET[tn].torn) e.st.torn = TARGET[tn].torn;
        var inst = { uid: 9001, id: id, up: up }; c.hand = [inst]; c.draw = filler(12);
        var text = strip(M.cardText(inst, st));
        st.fx = [];
        var r = M.act(st, { type: 'play', hand: 0, target: 0 }); cardRuns++;
        if (!r.ok) { fail('CARD_PLAY_ERROR', tag + ': ' + r.err); return; }
        if (checkDmg) {
          var hits = st.fx.filter(function (f) { return f.k === 'hit' && f.src === 'p' && f.tgt === e.uid; }).map(function (h) { return h.n + h.blocked; });
          var m = /Deal (\d+) damage/.exec(text);
          if (m && hits.length) expect('PRINTED_DAMAGE_vs_ACTUAL', hits[0] === +m[1], tag + ': card says ' + m[1] + ', actual first hit ' + hits[0] + '  (' + text + ')');
        }
        if (checkWard) {
          var wards = st.fx.filter(function (f) { return f.k === 'ward' && f.tgt === 'p'; }).map(function (f) { return f.n; });
          var wm = /Gain (\d+) Ward/.exec(text);
          if (wm && wards.length) expect('PRINTED_WARD_vs_ACTUAL', wards[0] === +wm[1], tag + ': card says ' + wm[1] + ', actual ' + wards[0] + '  (' + text + ')');
        }
      });
    });
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 2. Glosses: printed damage / Ward (evaluated while the Gloss is still in hand)
// ---------------------------------------------------------------------------------------------------------------
(function () {
  var st = mkState('knight'), c = st.combat; c.player.st.might = 3;
  var inst = { uid: 9001, id: 'scarlet_rubric', up: false }; c.hand = [inst]; c.draw = filler(8);
  var printed = /deal (\d+) damage/.exec(strip(M.cardText(inst, st)));
  M.act(st, { type: 'play', hand: 0, target: 0 });
  st.fx = []; c.hand = [{ uid: 9002, id: 'moss_dart', up: false }]; // Verdigris: must not trigger the Vermilion gloss
  c.hand = [{ uid: 9003, id: 'lance', up: false }]; M.act(st, { type: 'play', hand: 0, target: 0 });
  var hits = st.fx.filter(function (f) { return f.k === 'hit' && f.src === 'p'; }).map(function (h) { return h.n + h.blocked; });
  expect('GLOSS_TEXT', printed && hits.length === 2 && hits[1] === +printed[1], 'Scarlet Rubric: printed ' + (printed && printed[1]) + ', gloss hit actually ' + hits[1]);
})();
['lauds', 'scr_correctors_mark', 'nun_prime'].forEach(function (id) {
  var ch = M.CARDS[id].char || 'knight';
  var st = mkState(ch), c = st.combat; c.player.st.resolve = 2;
  var inst = { uid: 9001, id: id, up: false }; c.hand = [inst]; c.draw = filler(10);
  var m = /gain (\d+) Ward/.exec(strip(M.cardText(inst, st)));
  M.act(st, { type: 'play', hand: 0, target: 0 });
  c.hand = []; c.draw = filler(10); c.discard = [];
  var e = c.enemies[0]; M.ENEMIES[e.id].moves._noop = { name: 'noop', ops: [] }; e.intent = '_noop'; e.hist = ['_noop'];
  st.fx = []; M.act(st, { type: 'endTurn' }); delete M.ENEMIES[e.id].moves._noop;
  var w = st.fx.filter(function (f) { return f.k === 'ward' && f.tgt === 'p'; }).map(function (f) { return f.n; });
  expect('GLOSS_TEXT', m && w.length && w[0] === +m[1], id + ' with Resolve 2: printed ' + (m && m[1]) + ', actual turn-start Ward ' + w[0]);
});

// ---------------------------------------------------------------------------------------------------------------
// 3. "N per X" attacks vs. an independent formula (incl. zero-count case, which must deal 0 even with Might)
// ---------------------------------------------------------------------------------------------------------------
[
  { id: 'harvest_rot', ch: 'knight', setup: function (st, c, e) { e.st.corrode = 3; }, base: function (d) { return d.ops[0].mult * 3; } },
  { id: 'harvest_rot', ch: 'knight', setup: function () { }, base: function () { return 0; } },
  { id: 'canker_strike', ch: 'knight', setup: function (st, c, e) { e.st.corrode = 4; }, base: function (d) { return d.ops[0].base + d.ops[0].mult * 4; } },
  { id: 'shield_slam', ch: 'knight', setup: function (st, c) { c.player.ward = 9; }, base: function (d) { return d.ops[0].base + 9; } },
  { id: 'nun_heavy_psalter', ch: 'nun', setup: function (st, c) { c.player.ward = 12; }, base: function (d) { return (d.ops[0].base || 0) + 12; } },
  { id: 'nun_heavy_psalter', ch: 'nun', setup: function () { }, base: function (d) { return d.ops[0].base || 0; } },
  { id: 'nun_dies_irae', ch: 'nun', setup: function () { }, base: function (d) { return d.ops[0].base || 0; } }
].forEach(function (t) {
  [false, true].forEach(function (up) {
    if (up && !M.CARDS[t.id].up) return;
    [{ might: 0 }, { might: 3, smudged: 1 }].forEach(function (ps) {
      [false, true].forEach(function (torn) {
        var def = M.cardDef({ id: t.id, up: up });
        var st = mkState(t.ch), c = st.combat, e = c.enemies[0];
        Object.assign(c.player.st, ps.might ? { might: ps.might } : {}, ps.smudged ? { smudged: 1 } : {});
        if (torn) e.st.torn = 1;
        t.setup(st, c, e);
        c.hand = [{ uid: 9001, id: t.id, up: up }]; c.draw = filler(8); st.fx = [];
        M.act(st, { type: 'play', hand: 0, target: 0 });
        var hits = st.fx.filter(function (f) { return f.k === 'hit' && f.src === 'p' && f.tgt === e.uid; }).map(function (h) { return h.n + h.blocked; });
        var base = t.base(def);
        var want = base <= 0 ? null : hitFormula(base, ps.might || 0, !!ps.smudged, torn);
        var tag = t.id + (up ? '+' : '') + ' (might ' + (ps.might || 0) + (ps.smudged ? ', smudged' : '') + (torn ? ', torn' : '') + ')';
        if (want === null) expect('PER_X_ATTACKS', hits.length === 0 || hits[0] === 0, tag + ': zero-count attack dealt ' + hits.join(',') + ' (should deal nothing)');
        else expect('PER_X_ATTACKS', hits[0] === want, tag + ': formula says ' + want + ', engine dealt ' + hits[0]);
      });
    });
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 4. Enemy intents vs. what the move really does
// ---------------------------------------------------------------------------------------------------------------
var ENEMY_SC = {
  neutral: { p: {}, e: {} }, e_might2: { p: {}, e: { might: 2 } }, e_smudged: { p: {}, e: { smudged: 1 } },
  e_might2_smudged: { p: {}, e: { might: 2, smudged: 1 } }, p_torn: { p: { torn: 1 }, e: {} },
  p_torn_e_might2_smudged: { p: { torn: 1 }, e: { might: 2, smudged: 1 } }, p_ward7: { p: {}, e: {}, pward: 7 }
};
var intentRuns = 0;
Object.keys(M.ENEMIES).forEach(function (id) {
  var d = M.ENEMIES[id];
  Object.keys(d.moves).forEach(function (mk) {
    Object.keys(ENEMY_SC).forEach(function (sn) {
      var sc = ENEMY_SC[sn];
      var st = mkState('knight', id), c = st.combat, e = c.enemies[0];
      e.st = Object.assign({}, sc.e); c.player.st = Object.assign({}, sc.p); c.player.ward = sc.pward || 0; st.hp = st.maxHp = 5000;
      e.intent = mk; e.hist = [mk];
      var info = M.intentInfo(st, e);
      st.fx = [];
      M.act(st, { type: 'endTurn' }); intentRuns++;
      var hits = st.fx.filter(function (f) { return f.k === 'hit' && f.tgt === 'p' && f.src === 0; }).map(function (h) { return h.n + h.blocked; });
      var total = hits.reduce(function (a, b) { return a + b; }, 0);
      var want = (info.dmg || 0) * (info.times || 0);
      expect('ENEMY_INTENT_vs_ACTUAL', total === want, id + '.' + mk + ' [' + sn + ']: intent shows ' + info.dmg + 'x' + info.times + '=' + want + ', actually dealt ' + hits.join('+') + '=' + total);
    });
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 5. Statuses: timing and arithmetic
// ---------------------------------------------------------------------------------------------------------------
function quietEnemy(st) { var e = st.combat.enemies[0]; M.ENEMIES[e.id].moves._noop = { name: 'noop', ops: [] }; e.intent = '_noop'; e.hist = ['_noop']; return e; }
function endRound(st) { var e = st.combat.enemies[0]; e.intent = '_noop'; e.hist = ['_noop']; st.combat.hand = []; st.combat.draw = filler(10); st.combat.discard = []; M.act(st, { type: 'endTurn' }); }
(function () { // Corrode N loses N, N-1, ... and ignores Ward
  var st = mkState('knight'), e = quietEnemy(st); e.hp = e.maxHp = 100; e.ward = 0;
  M.runOps(st, [{ op: 'apply', s: 'corrode', n: 4, target: 'enemy' }], { side: 'p', target: 0 });
  var lost = []; for (var i = 0; i < 5; i++) { endRound(st); lost.push(100 - e.hp); }
  expect('STATUS', lost.join() === '4,7,9,10,10', 'Corrode 4 cumulative loss ' + lost.join() + ' (expected 4,7,9,10,10)');
})();
(function () { // Brambles retaliate once per hit
  var st = mkState('knight'), e = quietEnemy(st); e.hp = e.maxHp = 100; st.hp = 100; st.maxHp = 100;
  var c = st.combat; c.player.st.brambles = 3; c.player.ward = 100;
  M.ENEMIES[e.id].moves._three = { name: 'three', ops: [{ op: 'dmg', n: 2, times: 3 }] }; e.intent = '_three'; e.hist = ['_three'];
  c.hand = []; c.draw = filler(10); M.act(st, { type: 'endTurn' }); delete M.ENEMIES[e.id].moves._three;
  expect('STATUS', e.hp === 91, 'Brambles 3 vs 3 hits: enemy HP ' + e.hp + ' (expected 91)');
})();
(function () { // Mending / Zeal / Shell end-of-turn timing
  var st = mkState('knight'); quietEnemy(st); var c = st.combat; st.hp = 100; st.maxHp = 200;
  c.player.st.mending = 3; c.player.st.zeal = 1;
  var hp = [], might = []; for (var i = 0; i < 4; i++) { endRound(st); hp.push(st.hp); might.push(c.player.st.might || 0); }
  expect('STATUS', hp.join() === '103,105,106,106', 'Mending 3 heal sequence ' + hp.join() + ' (expected 103,105,106,106)');
  expect('STATUS', might.join() === '1,2,3,4', 'Zeal 1 Might sequence ' + might.join() + ' (expected 1,2,3,4)');
})();
(function () { // Player-applied debuffs on a foe wear off 1 per round; Smudged/Torn/Faded formulas
  ['smudged', 'torn', 'faded'].forEach(function (s) {
    var st = mkState('knight'), e = quietEnemy(st);
    M.runOps(st, [{ op: 'apply', s: s, n: 3, target: 'enemy' }], { side: 'p', target: 0 });
    var seen = []; for (var i = 0; i < 4; i++) { endRound(st); seen.push(e.st[s] || 0); }
    expect('STATUS', seen.join() === '2,1,0,0', s + ' 3 on a foe decays ' + seen.join() + ' (expected 2,1,0,0)');
  });
  var st2 = mkState('knight'), c2 = st2.combat, e2 = c2.enemies[0];
  e2.st = { might: 2, smudged: 1 }; c2.player.st = { torn: 1 };
  expect('STATUS', M.calcDmg(st2, 0, 'p', 6, true) === Math.floor(Math.floor((6 + 2) * 0.75) * 1.5), 'Might+Smudged+Torn order of operations');
  var st3 = mkState('knight'); st3.combat.player.st = { resolve: 2, faded: 1 };
  if (M.calcWard) expect('STATUS', M.calcWard(st3, 'p', 5, true) === wardFormula(5, 2, true), 'Resolve then Faded order of operations');
})();

// ---------------------------------------------------------------------------------------------------------------
// 6. Illuminate
// ---------------------------------------------------------------------------------------------------------------
[
  [['lance', 'shield', 'moss_dart'], 1, 'Vermilion+Lapis+Verdigris'],
  [['lance', 'lance', 'shield'], 0, 'V+V+L (no Verdigris)'],
  [['lance', 'shield', 'gold_leaf'], 1, 'V+L+Gold'],
  [['gold_leaf', 'gold_leaf', 'lance'], 1, 'Gold+Gold+V'],
  [['lance', 'shield', 'moss_dart', 'lance', 'shield', 'moss_dart'], 1, 'two triads in one turn illuminate once'],
  [['lance', 'shield', 'pumice_scrub'], 0, 'colourless Ink card does not count']
].forEach(function (t) {
  var st = mkState('knight'), c = st.combat;
  c.draw = filler(30).map(function (x, i) { x.id = 'turn_the_folio'; x.uid = 500 + i; return x; });
  c.hand = t[0].map(function (id, i) { return { uid: 700 + i, id: id, up: false }; });
  var n = 0; for (var i = 0; i < t[0].length; i++) { st.fx = []; M.act(st, { type: 'play', hand: 0, target: 0 }); n += st.fx.filter(function (f) { return f.k === 'illuminate'; }).length; }
  expect('ILLUMINATE', n === t[1], t[2] + ': illuminated ' + n + 'x (expected ' + t[1] + ')');
});

// ---------------------------------------------------------------------------------------------------------------
// 7. Card wording sanity
// ---------------------------------------------------------------------------------------------------------------
(function () {
  var st = mkState('knight');
  var t = function (id, up) { return strip(M.cardText({ id: id, up: !!up }, null)); };
  expect('TEXT', /Apply 2 Torn\. Deal 16 damage\./.test(t('couched_lance')), 'Couched Lance text: ' + t('couched_lance'));
  expect('TEXT', /Apply 1 Torn\. Deal 4 damage 2 times\./.test(t('rabbit_punch')), 'Rabbit Punch text: ' + t('rabbit_punch'));
  expect('TEXT', /If the target intends to attack, apply 1 Smudged and gain 3 Ward/.test(t('hatched_feint')), 'Hatched Feint text: ' + t('hatched_feint'));
  expect('TEXT', /Illuminated: gain 5 Ward and draw 1 card/.test(t('gilt_initial')), 'Gilt Initial text: ' + t('gilt_initial'));
  expect('TEXT', !/\btext\b/.test('') && !M.CARDS.scr_spilled_ink.text && !(M.CARDS.scr_spilled_ink.up || {}).text, 'Spilled Inkhorn must not carry frozen text');
  void st;
})();

// ---------------------------------------------------------------------------------------------------------------
var sections = Object.keys(failures);
console.log('math audit: ' + checks + ' checks, ' + cardRuns + ' card plays, ' + intentRuns + ' enemy-move plays');
if (!sections.length) { console.log('ALL CLEAR'); process.exit(0); }
sections.forEach(function (k) {
  console.log('\n== ' + k + ' (' + failures[k].length + ')');
  failures[k].slice(0, 8).forEach(function (m) { console.log('  ' + m); });
  if (failures[k].length > 8) console.log('  ... ' + (failures[k].length - 8) + ' more');
});
process.exit(1);
