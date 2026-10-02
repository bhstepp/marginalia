// Validates src/data/enemies.js against the DESIGN.md contract and prints a balance table.
// Usage: node tools/validate_enemies.js
var M = require('../load');
var errors = [], warns = [];
function err(m) { errors.push(m); }

var ROSTER = {
  1: ['snail_knight', 'killer_rabbit', 'ink_mite', 'ape_piper', 'grotesque_snout', 'cynocephalus', 'hare_cavalier', 'great_snail'],
  2: ['monkfish', 'blemmye', 'cockatrice', 'fox_preacher', 'manticore', 'wyvern', 'scribes_cat'],
  3: ['locust_rider', 'ouroboros', 'hellmouth_imp', 'tome_mimic', 'hydra', 'pale_rider', 'bookworm'],
  minion: ['kitten_scrawl', 'bookmite']
};
var KNOWN_OPS = ['dmg', 'dmgPer', 'ward', 'wardPer', 'apply', 'doubleStatus', 'removeStatus', 'draw', 'drawPigment', 'ink', 'heal',
  'loseHp', 'addCard', 'scrapeBlots', 'gildHand', 'costHand', 'if', 'repeat', 'nextTurn', 'gold', 'eraseMargin', 'devour', 'summon', 'devourPigment'];
var BLOTS = ['ink_blot', 'smear', 'paw_print', 'wormhole', 'water_stain', 'dog_ear', 'censure'];
var TIERS = ['normal', 'elite', 'boss', 'minion'], SIZES = ['s', 'm', 'l'];
var ENEMY_TARGETS = [undefined, 'self', 'allies', 'player'];

var E = M.ENEMIES || {};
Object.keys(ROSTER).forEach(function (k) { ROSTER[k].forEach(function (id) { if (!E[id]) err('missing roster id ' + id); }); });

function checkOps(where, ops) {
  if (!Array.isArray(ops)) return err(where + ': ops not an array');
  ops.forEach(function (o, i) {
    var w = where + '[' + i + ']';
    if (!o || KNOWN_OPS.indexOf(o.op) < 0) return err(w + ': unknown op ' + (o && o.op));
    if (ENEMY_TARGETS.indexOf(o.target) < 0) err(w + ': bad enemy target ' + o.target);
    if ((o.op === 'apply' || o.op === 'removeStatus' || o.op === 'doubleStatus') && !M.STATUS[o.s]) err(w + ': unknown status ' + o.s);
    if (o.op === 'apply' && typeof o.n !== 'number') err(w + ': apply needs n');
    if (o.op === 'dmg' && (typeof o.n !== 'number' || o.n < 0)) err(w + ': bad dmg n');
    if (o.op === 'addCard' && BLOTS.indexOf(o.id) < 0) err(w + ': addCard id not a blot/curse: ' + o.id);
    if (o.op === 'addCard' && M.CARDS && !M.CARDS[o.id]) warns.push(w + ': card ' + o.id + ' not (yet) defined in cards.js');
    if (o.op === 'summon' && !E[o.id]) err(w + ': summon unknown enemy ' + o.id);
    if (o.op === 'if') { checkOps(w + '.then', o.then || []); checkOps(w + '.else', o.else || []); }
    if (o.op === 'repeat' || o.op === 'nextTurn') checkOps(w + '.ops', o.ops || []);
  });
}
function checkAi(id, ai, moves, label) {
  if (!ai) return err(id + ': missing ' + label);
  var keys = [];
  if (ai.type === 'cycle') { if (!Array.isArray(ai.seq) || !ai.seq.length) err(id + ' ' + label + ': empty seq'); keys = keys.concat(ai.seq || []); }
  else if (ai.type === 'random') { if (!ai.w || !Object.keys(ai.w).length) err(id + ' ' + label + ': empty w'); keys = keys.concat(Object.keys(ai.w || {})); keys = keys.concat(ai.noRepeat || []); }
  else err(id + ' ' + label + ': bad type ' + ai.type);
  keys = keys.concat(ai.first || []);
  keys.forEach(function (k) { if (!moves[k]) err(id + ' ' + label + ': references missing move ' + k); });
}

Object.keys(E).forEach(function (id) {
  var d = E[id];
  if (!d.name) err(id + ': no name');
  if ([1, 2, 3].indexOf(d.act) < 0) err(id + ': bad act');
  if (TIERS.indexOf(d.tier) < 0) err(id + ': bad tier');
  if (SIZES.indexOf(d.size) < 0) err(id + ': bad size');
  if (!d.desc) err(id + ': no desc');
  if (!Array.isArray(d.hp) || d.hp.length !== 2 || d.hp[0] > d.hp[1] || d.hp[0] < 1) err(id + ': bad hp');
  if (!d.moves || !Object.keys(d.moves).length) err(id + ': no moves');
  Object.keys(d.moves || {}).forEach(function (k) {
    var mv = d.moves[k];
    if (!mv.name) err(id + '.' + k + ': no name');
    checkOps(id + '.' + k, mv.ops);
  });
  if (d.start) checkOps(id + '.start', d.start);
  if (d.onDeath) checkOps(id + '.onDeath', d.onDeath);
  checkAi(id, d.ai, d.moves, 'ai');
  if (d.phase2) {
    if (!(d.phase2.at > 0 && d.phase2.at < 1)) err(id + ': phase2.at out of range');
    if (d.phase2.enter && !d.moves[d.phase2.enter]) err(id + ': phase2.enter missing move');
    checkAi(id, d.phase2.ai, d.moves, 'phase2.ai');
  } else if (d.tier === 'boss') err(id + ': boss without phase2');
});

var ENC = M.ENCOUNTERS || {};
[1, 2, 3].forEach(function (a) {
  var A = ENC[a]; if (!A) return err('no encounters for act ' + a);
  ['easy', 'normal', 'elite', 'boss'].forEach(function (k) {
    if (!A[k] || !A[k].length) return err('act ' + a + ' ' + k + ' empty');
    A[k].forEach(function (enc) {
      if (!Array.isArray(enc) || !enc.length || enc.length > 4) err('act ' + a + ' ' + k + ': bad encounter size ' + JSON.stringify(enc));
      enc.forEach(function (id) { if (!E[id]) err('act ' + a + ' ' + k + ': unknown enemy ' + id); });
    });
  });
});

// ---------- Balance sim ----------
// Mimics engine chooseIntent; tracks might (self/allies apply, zeal), counts attack dmg (+ corrode on player as total ticks).
function pickW(w) { var t = 0, k; for (k in w) t += w[k]; var r = Math.random() * t; for (k in w) { r -= w[k]; if (r < 0) return k; } return k; }
function simulate(id, turns, phase) {
  var d = E[id], ai = phase ? d.phase2.ai : d.ai, hist = [], might = 0, zeal = 0, total = 0, off = null;
  (d.start || []).forEach(function (o) { if (o.op === 'apply' && o.s === 'might') might += o.n; if (o.op === 'apply' && o.s === 'zeal') zeal += o.n; });
  if (phase && d.phase2.enter) hist.push(d.phase2.enter);
  for (var t = 0; t < turns; t++) {
    var key, n = hist.length;
    if (phase && d.phase2.enter && t === 0) key = d.phase2.enter;
    else if (ai.first && n < ai.first.length) key = ai.first[n];
    else if (ai.type === 'cycle') {
      var fo = ai.first ? ai.first.length : 0;
      if (ai.randomStart && off == null) off = Math.floor(Math.random() * ai.seq.length);
      key = ai.seq[(n - fo + (off || 0)) % ai.seq.length];
    } else {
      var w = {}, mr = ai.maxRepeat || 2;
      Object.keys(ai.w).forEach(function (k) {
        var lim = (ai.noRepeat && ai.noRepeat.indexOf(k) >= 0) ? 1 : mr, run = 0;
        for (var i = hist.length - 1; i >= 0 && hist[i] === k; i--) run++;
        if (run < lim) w[k] = ai.w[k];
      });
      if (!Object.keys(w).length) w = ai.w;
      key = pickW(w);
    }
    if (!(phase && d.phase2.enter && t === 0)) hist.push(key);
    (function run(ops) {
      ops.forEach(function (o) {
        if (o.op === 'dmg') total += Math.max(0, o.n + might) * (o.times || 1);
        else if (o.op === 'apply' && o.s === 'might' && (o.target === 'self' || o.target === 'allies')) might += o.n;
        else if (o.op === 'apply' && o.s === 'zeal' && o.target === 'self') zeal += o.n;
        else if (o.op === 'apply' && o.s === 'corrode' && !o.target) total += o.n * (o.n + 1) / 2;
        else if (o.op === 'repeat') for (var r = 0; r < o.n; r++) run(o.ops);
      });
    })(d.moves[key].ops);
    might += zeal;
  }
  return total / turns;
}
function avgDmg(id, turns, phase) { var s = 0, N = 300; for (var i = 0; i < N; i++) s += simulate(id, turns, phase); return s / N; }
function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }

console.log('\n' + pad('id', 17) + pad('act', 4) + pad('tier', 8) + pad('hp', 10) + pad('avgHp', 7) + pad('dmg/t(6)', 9) + pad('dmg/t(12)', 10) + 'phase2 dmg/t(6)');
var DMG = {};
Object.keys(E).forEach(function (id) {
  var d = E[id], hp = (d.hp[0] + d.hp[1]) / 2;
  var d6 = avgDmg(id, 6), d12 = avgDmg(id, 12), p2 = d.phase2 ? avgDmg(id, 6, true).toFixed(1) : '-';
  DMG[id] = d6;
  console.log(pad(id, 17) + pad(d.act, 4) + pad(d.tier, 8) + pad(d.hp[0] + '-' + d.hp[1], 10) + pad(hp, 7) + pad(d6.toFixed(1), 9) + pad(d12.toFixed(1), 10) + p2);
});

console.log('\nEncounters (total avg HP, summed dmg/turn over first 6 turns; summons excluded)');
[1, 2, 3].forEach(function (a) {
  ['easy', 'normal', 'elite', 'boss'].forEach(function (k) {
    (ENC[a] && ENC[a][k] || []).forEach(function (enc) {
      var hp = 0, dm = 0;
      enc.forEach(function (id) { if (E[id]) { hp += (E[id].hp[0] + E[id].hp[1]) / 2; dm += DMG[id]; } });
      console.log('  A' + a + ' ' + pad(k, 7) + pad(Math.round(hp), 5) + pad(dm.toFixed(1), 6) + enc.join(', '));
    });
  });
});

warns.forEach(function (w) { console.log('WARN ' + w); });
if (errors.length) { errors.forEach(function (e) { console.log('ERROR ' + e); }); console.log('\n' + errors.length + ' error(s)'); process.exit(1); }
console.log('\nOK: ' + Object.keys(E).length + ' enemies, all checks passed (' + warns.length + ' warning(s)).');
