// Validates THE SCRIBE's content (src/data/char_scribe.js): node tools/validate_scribe.js
var fs = require('fs'), path = require('path');
var M = require('../load');
var errs = [], warns = [];
function E(m) { errs.push(m); } function W(m) { warns.push(m); }

var src = fs.readFileSync(path.join(__dirname, '..', 'src', 'engine.js'), 'utf8');
var body = src.slice(src.indexOf('function runOp('), src.indexOf('// ---------------- Rewards'));
var OPS = {}; (body.match(/case '([a-zA-Z]+)'/g) || []).forEach(function (m) { OPS[m.slice(6, -1)] = 1; });
var RUN_ONLY = { fight: 1, choose: 1, gainCard: 1, relic: 1, gildRandom: 1, removeRandom: 1, maxHp: 1 };
var ENEMY_ONLY = { eraseMargin: 1, devour: 1, devourPigment: 1, summon: 1 };
var PERS = ['targetCorrode', 'ward', 'played', 'margin', 'pigments', 'handSize', 'discard', 'might', 'blots', 'missingHp'];
var CONDS = ['illuminated', 'played', 'targetCorroded', 'targetTorn', 'targetAttacking', 'wardAtLeast', 'hpBelowHalf', 'marginFull', 'firstCard', 'handEmpty', 'goldAtLeast'];
var HOOK_ON = ['combatStart', 'turnStart', 'turnEnd', 'illuminate', 'play', 'enemyDies', 'hurt', 'combatEnd'];
var PIGS = ['V', 'L', 'G', 'A', 'N'], STATUS = Object.keys(M.STATUS), TYPES = ['attack', 'skill', 'gloss'];
var PASSIVES = ['ink', 'hand', 'illumEase', 'maxHp', 'restHeal', 'shopDiscount', 'cardChoices', 'goldPct', 'gildRewards'];

function walk(ops, f) { (ops || []).forEach(function (o) { f(o); if (o.then) walk(o.then, f); if (o.else) walk(o.else, f); if (o.ops) walk(o.ops, f); }); }
function checkOps(ops, w, mode) {
  if (!Array.isArray(ops)) return E(w + ': ops not an array');
  walk(ops, function (o) {
    if (!o || !OPS[o.op]) return E(w + ': unknown op ' + (o && o.op));
    if (mode === 'combat' && RUN_ONLY[o.op]) E(w + ': run op ' + o.op + ' in combat');
    if (ENEMY_ONLY[o.op]) E(w + ': enemy-only op ' + o.op);
    if (['apply', 'doubleStatus', 'removeStatus'].indexOf(o.op) >= 0 && STATUS.indexOf(o.s) < 0) E(w + ': bad status ' + o.s);
    if ((o.op === 'dmgPer' || o.op === 'wardPer') && PERS.indexOf(o.per) < 0) E(w + ': bad per ' + o.per);
    if ((o.op === 'drawPigment' || o.op === 'createCard') && o.pig && ['V', 'L', 'G', 'A', 'N'].indexOf(o.pig) < 0) E(w + ': bad pig ' + o.pig);
    if (o.op === 'createCard' && o.rarity && ['common', 'uncommon', 'rare'].indexOf(o.rarity) < 0) E(w + ': bad createCard rarity');
    if (o.op === 'createCard' && o.up) E(w + ': conjured cards must not be gilded (loop safeguard)');
    if (['dmg', 'ward', 'heal', 'loseHp', 'ink', 'draw'].indexOf(o.op) >= 0 && typeof o.n !== 'number') E(w + ': ' + o.op + ' needs n');
    if (o.op === 'addCard' && !M.CARDS[o.id]) E(w + ': unknown card ' + o.id);
    if (o.op === 'if') { var k = String(o.cond).split(':'); if (CONDS.indexOf(k[0]) < 0) E(w + ': bad cond ' + o.cond); if (k[0] === 'played' && ['V', 'L', 'G', 'A'].indexOf(k[1]) < 0) E(w + ': bad played pig'); }
  });
}
function hasOp(ops, name) { var f = false; walk(ops, function (o) { if (o.op === name) f = true; }); return f; }
function visible(html) { return String(html).replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, 'x'); }
function badText(t) { return !t || /undefined|NaN|\[object|null/.test(t); }

var ids = Object.keys(M.CARDS).filter(function (id) { return M.CARDS[id].char === 'scribe'; });
var counts = {}, pig = {}, glosses = 0, gated = 0;
ids.forEach(function (id) {
  var d = M.CARDS[id], w = 'card ' + id;
  if (id.indexOf('scr_') !== 0) E(w + ': id must start with scr_');
  if (!d.name || d.name.length > 18) E(w + ': name missing or > 18 chars');
  if (PIGS.indexOf(d.pigment) < 0) E(w + ': bad pigment ' + d.pigment);
  if (TYPES.indexOf(d.type) < 0) E(w + ': bad type ' + d.type);
  if (['starter', 'common', 'uncommon', 'rare'].indexOf(d.rarity) < 0) E(w + ': bad rarity ' + d.rarity);
  if (d.cost == null || d.cost < 0 || d.cost > 3) E(w + ': bad cost');
  if (!d.up) E(w + ': missing up');
  if (!d.flavor) W(w + ': no flavor');
  if (d.type === 'gloss' && !d.gloss) E(w + ': gloss without hook');
  if (d.unlock && !M.ACHIEVEMENTS[d.unlock]) E(w + ': unknown unlock ' + d.unlock);
  if (d.unlock && d.rarity === 'starter') E(w + ': starter cards cannot be locked');
  [false, true].forEach(function (g) {
    var v = M.cardDef({ id: id, up: g }), ww = w + (g ? ' (gilded)' : '');
    checkOps(v.ops || [], ww, 'combat');
    var hs = v.gloss ? (Array.isArray(v.gloss) ? v.gloss : [v.gloss]) : [];
    hs.forEach(function (h, i) {
      if (HOOK_ON.indexOf(h.on) < 0 || h.on === 'combatStart' || h.on === 'combatEnd') E(ww + ': bad gloss hook ' + h.on);
      if (h.every && ['play', 'illuminate', 'hurt'].indexOf(h.on) < 0 && !v.text) E(ww + ': every on ' + h.on + ' needs text');
      checkOps(h.ops, ww + '.gloss' + i, 'combat');
      if (hasOp(h.ops, 'echoMargin')) E(ww + ': gloss hook contains echoMargin (infinite recursion)');
    });
    if (hasOp(v.ops, 'createCard') && cardCostOf(v) === 0 && !v.scrape) { // a conjured copy is never gilded: it costs o.cost or the BASE cost
      // 0-cost non-scrape conjurers must not be able to conjure themselves
      walk(v.ops, function (o) { if (o.op === 'createCard' && (!o.rarity || o.rarity === d.rarity) && (!o.pig || o.pig === d.pigment) && (o.cost != null ? o.cost : d.cost) === 0) E(ww + ': free conjurer can conjure itself'); });
    }
    var t = M.cardText({ id: id, up: g });
    if (badText(t)) E(ww + ': bad text: ' + t);
    var vis = visible(t);
    if (vis.length > 95) E(ww + ': rules text ' + vis.length + ' > 95 chars: ' + vis);
    if (g && !d.up.text && d.text && JSON.stringify(d.up) !== JSON.stringify({ cost: d.up.cost })) W(ww + ': base has text override but gilded does not');
  });
  counts[d.rarity] = (counts[d.rarity] || 0) + 1; pig[d.pigment] = (pig[d.pigment] || 0) + 1;
  if (d.type === 'gloss') glosses++; if (d.unlock) gated++;
});
function cardCostOf(v) { return v.cost; }

// relics
var rids = Object.keys(M.RELICS).filter(function (id) { return M.RELICS[id].char === 'scribe'; }), rr = {};
rids.forEach(function (id) {
  var r = M.RELICS[id], w = 'relic ' + id;
  if (id.indexOf('scr_') !== 0) E(w + ': id must start with scr_');
  if (!r.name || !r.flavor) E(w + ': name/flavor');
  if (['starter', 'common', 'uncommon', 'rare', 'boss', 'shop'].indexOf(r.rarity) < 0) E(w + ': rarity');
  if (r.passive) { if (!r.text) E(w + ': passive relic needs text'); Object.keys(r.passive).forEach(function (k) { if (PASSIVES.indexOf(k) < 0) E(w + ': unknown passive ' + k); }); }
  (r.hooks || []).forEach(function (h, i) {
    if (HOOK_ON.indexOf(h.on) < 0) E(w + ': bad hook ' + h.on);
    checkOps(h.ops, w + '.hook' + i, h.on === 'combatEnd' ? 'run' : 'combat');
  });
  if (r.unlock && !M.ACHIEVEMENTS[r.unlock]) E(w + ': unknown unlock');
  var t = M.relicText(id); if (badText(t)) E(w + ': bad text ' + t);
  rr[r.rarity] = (rr[r.rarity] || 0) + 1;
});

// character
var CH = M.CHARACTERS.scribe;
if (!CH) E('no M.CHARACTERS.scribe');
else {
  ['name', 'short', 'hp', 'art', 'order', 'deck', 'relic', 'colors', 'blurb'].forEach(function (k) { if (CH[k] == null) E('scribe missing ' + k); });
  if (CH.unlock !== 'win_nun') E('scribe unlock must be win_nun');
  if (CH.deck.length !== 10) E('deck must have 10 cards');
  CH.deck.forEach(function (id) { var d = M.CARDS[id]; if (!d || d.char !== 'scribe' || d.rarity !== 'starter') E('bad starter card ' + id); });
  if (!M.RELICS[CH.relic] || M.RELICS[CH.relic].rarity !== 'starter' || M.RELICS[CH.relic].char !== 'scribe') E('bad starter relic');
  var dp = {}; CH.deck.forEach(function (id) { dp[M.CARDS[id].pigment] = 1; });
  if (!(dp.V && dp.L && dp.G)) E('starter deck cannot Illuminate (needs V, L and G)');
}
// colour coverage in the reward pool
['V', 'L', 'G', 'A'].forEach(function (p) { if (!ids.some(function (id) { var d = M.CARDS[id]; return d.pigment === p && d.rarity !== 'starter' && !d.unlock; })) E('no unlocked ' + p + ' reward cards'); });
['common', 'uncommon', 'rare'].forEach(function (r) {
  var st = { char: 'scribe', unlocked: [] };
  if (M.cardPool(r, st).length < 4) E('locked-out pool too thin for ' + r);
});
// achievements added here
['scr_cramp', 'scr_glossa', 'scr_quire'].forEach(function (a) {
  var A = M.ACHIEVEMENTS[a]; if (!A || !A.name || !A.desc || typeof A.check !== 'function') return E('achievement ' + a);
  try { A.check(M.newRun({ seed: 'x', char: 'scribe' })); } catch (e) { E('achievement ' + a + ' throws: ' + e.message); }
  if (!M.unlocksFor(a).cards.length && !M.unlocksFor(a).relics.length) W('achievement ' + a + ' unlocks nothing');
});
// conjure smoke: createCard in a Scribe fight produces only Scribe/shared, unlocked cards
var st = M.newRun({ seed: 'VS', char: 'scribe' }); M.act(st, { type: 'proceed' }); M.act(st, { type: 'chooseNode', id: M.reachable(st)[0] });
for (var i = 0; i < 40; i++) { st.combat.hand = []; M.runOps(st, [{ op: 'createCard', n: 3 }], { side: 'p' });
  st.combat.hand.forEach(function (x) { var d = M.CARDS[x.id]; if ((d.char && d.char !== 'scribe') || d.unlock || d.rarity === 'starter') E('conjured illegal card ' + x.id); }); }

console.log('Scribe cards:', ids.length, JSON.stringify(counts), 'pigments', JSON.stringify(pig), 'glosses', glosses, 'gated', gated, '(' + Math.round(100 * gated / ids.length) + '%)');
console.log('Scribe relics:', rids.length, JSON.stringify(rr));
warns.forEach(function (m) { console.log('WARN ' + m); });
errs.forEach(function (m) { console.log('ERROR ' + m); });
console.log(errs.length ? 'FAILED with ' + errs.length + ' error(s)' : 'OK (0 errors, ' + warns.length + ' warnings)');
process.exit(errs.length ? 1 : 0);
