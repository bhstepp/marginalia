// Tests for src/diag.js (the gameplay diagnostics log). Usage: node tools/diag_test.js [repoRoot]
// 1) clean play produces a bounded, parseable log and ZERO flags
// 2) negative controls: a wrong printed number / wrong intent / thrown engine error MUST be flagged
// 3) persistence round-trip through a localStorage stub; a new run starts a fresh log
var path = require('path');
var ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
process.chdir(ROOT);
var M = require(path.join(ROOT, 'load'));
var fails = 0, checks = 0;
function ok(c, m) { checks++; if (!c) { fails++; console.log('FAIL: ' + m); } }

// localStorage stub
var store = {};
globalThis.localStorage = { getItem: function (k) { return k in store ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); }, removeItem: function (k) { delete store[k]; } };

function lcg(seed) { var s = seed >>> 0; return function () { return (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }; }
function playRun(seed, ch, asc, maxSteps) {
  var r = lcg(seed * 7919 + 13);
  var st = M.newRun({ seed: 'dg' + seed, char: ch, asc: asc, unlocked: Object.keys(M.ACHIEVEMENTS) });
  M.diag.newRun(st);
  var g = 0;
  while (!st.over && st.screen !== 'end' && g++ < (maxSteps || 2500)) {
    var sc = st.screen, a;
    if (sc === 'combat') {
      var c = st.combat;
      if (c.over) a = { type: 'proceed' };
      else {
        var pl = c.hand.map(function (x, k) { return k; }).filter(function (k) { return M.canPlay(st, k); });
        if (pl.length && r() < 0.92) { var k = pl[Math.floor(r() * pl.length)]; var live = M.living(st); a = { type: 'play', hand: k, target: c.enemies.indexOf(live[Math.floor(r() * live.length)]) }; } else a = { type: 'endTurn' };
      }
    } else if (sc === 'map') { var rc = M.reachable(st); a = { type: 'chooseNode', id: (rc[Math.floor(r() * rc.length)] || rc[0]).id || rc[0] }; }
    else if (sc === 'reward') a = { type: 'leaveReward' }; else if (sc === 'rest') a = { type: 'mend' };
    else if (sc === 'treasure') a = { type: 'leaveTreasure' }; else if (sc === 'shop') a = { type: 'leaveShop' };
    else if (sc === 'event') a = { type: 'leaveEvent' }; else if (sc === 'pick') a = { type: 'cancelPick' }; else a = { type: 'proceed' };
    M.act(st, a);
  }
  return st;
}

M.diag.install();

// ---- 1. clean runs: no flags, bounded size, report parses
var totalFlags = 0, maxBytes = 0;
for (var i = 0; i < 24; i++) {
  playRun(i, ['knight', 'nun', 'scribe'][i % 3], i % 6);
  var B = M.diag.state(); totalFlags += B.flagCount;
  var bytes = JSON.stringify(B.entries).length; if (bytes > maxBytes) maxBytes = bytes;
  if (B.flagCount) console.log('  run ' + i + ' flags:', B.flags.map(function (f) { return f.msg; }).slice(0, 3));
}
ok(totalFlags === 0, 'clean runs should raise no flags (got ' + totalFlags + ')');
ok(maxBytes <= 60000, 'log must stay under its cap (max ' + maxBytes + ')');
var rep = M.diag.report(null);
ok(/^MARGINALIA DIAGNOSTIC REPORT/.test(rep), 'report header');
var lines = rep.split('\n'), logAt = lines.findIndex(function (l) { return /^LOG /.test(l); });
ok(logAt > 0, 'report has LOG section');
var parsed = 0; lines.slice(logAt + 1).forEach(function (l) { if (l) { try { JSON.parse(l); parsed++; } catch (e) { ok(false, 'unparseable log line: ' + l.slice(0, 80)); } } });
ok(parsed > 20, 'log should contain entries (' + parsed + ')');
var types = {}; M.diag.state().entries.forEach(function (e) { types[e.t] = 1; });
['fight', 'play', 'end', 'act'].forEach(function (t) { ok(types[t], 'log should contain "' + t + '" entries (a full run was played)'); });

// ---- 2. negative controls
function oneFight(setup) {
  var st = M.newRun({ seed: 'neg', char: 'knight', asc: 0, unlocked: [] }); st.relics = [];
  M.diag.newRun(st);
  M.startCombat(st, ['snail_knight'], 'battle');
  var c = st.combat, e = c.enemies[0]; e.hp = e.maxHp = 9999; c.ink = 99; c.hand = []; c.draw = []; c.discard = []; st.hp = st.maxHp = 500;
  setup && setup(st, c, e); return st;
}
(function () { // wrong printed damage
  var orig = M.cardText;
  M.cardText = function (i, s) { return orig(i, s).replace(/Deal <b[^>]*>(\d+)/, function (m, n) { return 'Deal <b>' + (+n + 1); }); };
  var st = oneFight(function (st, c) { c.hand = [{ uid: 1, id: 'lance', up: false }]; c.draw = [{ uid: 2, id: 'lance', up: false }]; });
  M.act(st, { type: 'play', hand: 0, target: 0 });
  M.cardText = orig;
  ok(M.diag.state().flags.some(function (f) { return /^DMG lance printed 7 but first hit was 6/.test(f.msg); }), 'wrong printed damage must be flagged');
})();
(function () { // wrong printed ward
  var orig = M.cardText;
  M.cardText = function (i, s) { return orig(i, s).replace(/Gain <b[^>]*>(\d+)<\/b> Ward/, function (m, n) { return 'Gain <b>' + (+n + 2) + '</b> Ward'; }); };
  var st = oneFight(function (st, c) { c.hand = [{ uid: 1, id: 'shield', up: false }]; });
  M.act(st, { type: 'play', hand: 0, target: 0 });
  M.cardText = orig;
  ok(M.diag.state().flags.some(function (f) { return /^WARD shield printed 7 but gained 5/.test(f.msg); }), 'wrong printed ward must be flagged');
})();
(function () { // wrong enemy intent
  var orig = M.intentInfo;
  M.intentInfo = function (st, e) { var i = orig(st, e); if (i.dmg) i.dmg += 1; return i; };
  var st = oneFight(function (st, c, e) { M.ENEMIES.snail_knight.moves._neg = { name: 'Neg', ops: [{ op: 'dmg', n: 5, times: 2 }] }; e.intent = '_neg'; e.hist = ['_neg']; });
  M.act(st, { type: 'endTurn' });
  M.intentInfo = orig; delete M.ENEMIES.snail_knight.moves._neg;
  ok(M.diag.state().flags.some(function (f) { return /^INTENT /.test(f.msg) && /showed 6x2=12 but dealt 5\+5=10/.test(f.msg); }), 'wrong intent must be flagged');
})();
(function () { // engine exception is logged and re-thrown
  var st = oneFight(function (st, c) { c.hand = [{ uid: 1, id: 'lance', up: false }]; });
  var real = M.CARDS.lance.ops; M.CARDS.lance.ops = [{ op: 'dmg', n: 6, target: 'enemy' }, { op: 'summon', id: 'does_not_exist' }];
  var threw = false; try { M.act(st, { type: 'play', hand: 0, target: 0 }); } catch (e) { threw = true; }
  M.CARDS.lance.ops = real;
  ok(threw, 'engine exception must still propagate');
  ok(M.diag.state().errs.some(function (x) { return x.kind === 'engine'; }), 'engine exception must be logged');
})();
(function () { // invariant violation
  var st = oneFight(function (st, c) { c.hand = [{ uid: 1, id: 'shield', up: false }]; });
  st.hp = st.maxHp + 50; M.act(st, { type: 'play', hand: 0, target: 0 });
  ok(M.diag.state().flags.some(function (f) { return /^INV player hp/.test(f.msg); }), 'impossible HP must be flagged');
})();

// ---- 3. persistence + fresh log per run
(function () {
  var st = playRun(99, 'knight', 0, 400);
  M.diag.flush();
  var saved = JSON.parse(store['marginalia.diag.v1']);
  ok(saved.run && saved.run.seed === 'dg99' && saved.entries.length > 5, 'log persisted to storage');
  var n1 = saved.entries.length;
  var st2 = M.newRun({ seed: 'OTHER', char: 'knight', asc: 0, unlocked: [] }); M.diag.newRun(st2); M.diag.flush();
  var saved2 = JSON.parse(store['marginalia.diag.v1']);
  ok(saved2.run.seed === 'OTHER' && saved2.entries.length < n1, 'a new run starts a fresh log');
  // resume with matching seed keeps the log; mismatching seed resets it
  var st3 = M.newRun({ seed: 'KEEP', char: 'nun', asc: 2, unlocked: [] }); M.diag.newRun(st3); M.act(st3, { type: 'proceed' });
  var before = M.diag.state().entries.length; M.diag.resume(st3);
  ok(M.diag.state().entries.length === before + 1 && M.diag.state().run.seed === 'KEEP', 'resume of the same run appends a marker');
  var st4 = M.newRun({ seed: 'DIFF', char: 'nun', asc: 2, unlocked: [] }); M.diag.resume(st4);
  ok(M.diag.state().run.seed === 'DIFF', 'resume of a different run resets the log');
})();

console.log('diag test: ' + checks + ' checks, ' + fails + ' failure(s)');
process.exit(fails ? 1 : 0);
