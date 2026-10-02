// Validates THE NUN's content (src/data/char_nun.js): node tools/validate_nun.js
var fs = require('fs'), path = require('path');
var M = require('../load');
var errs = [], warns = [];
function E(m) { errs.push(m); } function Wn(m) { warns.push(m); }

var src = fs.readFileSync(path.join(__dirname, '..', 'src', 'engine.js'), 'utf8');
var body = src.slice(src.indexOf('function runOp('), src.indexOf('// ---------------- Rewards'));
var OPS = {}; (body.match(/case '([a-zA-Z]+)'/g) || []).forEach(function (m) { OPS[m.slice(6, -1)] = 1; });
var ENEMY_ONLY = { eraseMargin: 1, devour: 1, devourPigment: 1, summon: 1 };
var RUN_ONLY = { maxHp: 1, gainCard: 1, relic: 1, gildRandom: 1, removeRandom: 1, choose: 1, fight: 1 };
var PERS = ['targetCorrode', 'ward', 'played', 'margin', 'pigments', 'handSize', 'discard', 'might', 'blots', 'missingHp'];
var CONDS = ['illuminated', 'played', 'targetCorroded', 'targetTorn', 'targetAttacking', 'wardAtLeast', 'hpBelowHalf', 'marginFull', 'firstCard', 'handEmpty', 'goldAtLeast'];
var HOOK_ON = ['combatStart', 'turnStart', 'turnEnd', 'illuminate', 'play', 'enemyDies', 'hurt', 'combatEnd'];
var PIGS = ['V', 'L', 'G', 'A', 'N', 'X'], STATUS = Object.keys(M.STATUS);
var PASSIVES = ['ink', 'hand', 'illumEase', 'maxHp', 'restHeal', 'shopDiscount', 'cardChoices', 'goldPct', 'gildRewards'];

function checkOps(ops, w, inHook) {
  if (!Array.isArray(ops)) return E(w + ': ops not array');
  ops.forEach(function (o, i) {
    var ww = w + '[' + i + ']';
    if (!o || !OPS[o.op]) return E(ww + ': unknown op ' + (o && o.op));
    if (ENEMY_ONLY[o.op] || RUN_ONLY[o.op]) E(ww + ': op ' + o.op + ' not for player cards');
    if (o.op === 'echoMargin' && inHook) E(ww + ': echoMargin inside a hook recurses');
    if (['apply', 'doubleStatus', 'removeStatus'].indexOf(o.op) >= 0 && STATUS.indexOf(o.s) < 0) E(ww + ': bad status ' + o.s);
    if (o.op === 'apply' && o.s === 'petrified') E(ww + ': petrified is enemy-only');
    if ((o.op === 'dmgPer' || o.op === 'wardPer') && PERS.indexOf(o.per) < 0) E(ww + ': bad per ' + o.per);
    if ((o.op === 'dmgPer' || o.op === 'wardPer') && o.mult != null && o.mult !== Math.floor(o.mult)) E(ww + ': fractional mult');
    if ((o.op === 'drawPigment') && PIGS.indexOf(o.pig) < 0) E(ww + ': bad pig');
    if (o.op === 'createCard' && o.pig && PIGS.indexOf(o.pig) < 0) E(ww + ': bad pig');
    if (['dmg', 'ward', 'heal', 'loseHp', 'ink', 'draw'].indexOf(o.op) >= 0 && typeof o.n !== 'number') E(ww + ': needs numeric n');
    if (o.op === 'addCard' && !M.CARDS[o.id]) E(ww + ': unknown card ' + o.id);
    if (o.op === 'if') {
      var k = String(o.cond).split(':');
      if (CONDS.indexOf(k[0]) < 0) E(ww + ': bad cond ' + o.cond);
      if (k[0] === 'played' && ['V', 'L', 'G', 'A'].indexOf(k[1]) < 0) E(ww + ': bad played pig');
      if (k[0] === 'wardAtLeast' && !(+k[1] > 0)) E(ww + ': bad wardAtLeast');
      checkOps(o.then || [], ww + '.then', inHook); if (o.else) checkOps(o.else, ww + '.else', inHook);
    }
    if (o.op === 'repeat' || o.op === 'nextTurn') checkOps(o.ops || [], ww + '.ops', inHook);
  });
}
function vis(html) { return String(html).replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, 'x'); }
function badText(t) { return !t || /undefined|NaN|\[object|null/.test(t); }

var ids = Object.keys(M.CARDS).filter(function (id) { return M.CARDS[id].char === 'nun'; });
var counts = {}, pig = {}, gloss = 0, locked = 0;
ids.forEach(function (id) {
  var d = M.CARDS[id], w = 'card ' + id;
  if (id.indexOf('nun_') !== 0) E(w + ': id must start with nun_');
  if (!d.name || d.name.length > 18) E(w + ': name missing/too long');
  if (['V', 'L', 'G', 'A'].indexOf(d.pigment) < 0) E(w + ': bad pigment ' + d.pigment);
  if (['attack', 'skill', 'gloss'].indexOf(d.type) < 0) E(w + ': bad type');
  if (['starter', 'common', 'uncommon', 'rare'].indexOf(d.rarity) < 0) E(w + ': bad rarity');
  if (d.cost == null || d.cost < 0 || d.cost > 3) E(w + ': bad cost');
  if (!d.up) E(w + ': missing up');
  if (!d.flavor) Wn(w + ': no flavor');
  if (d.type === 'gloss' && !d.gloss) E(w + ': gloss without hook');
  if (d.unlock && !M.ACHIEVEMENTS[d.unlock]) E(w + ': unknown unlock ' + d.unlock);
  [false, true].forEach(function (up) {
    var v = up ? Object.assign({}, d, d.up) : d, ww = w + (up ? '+' : '');
    checkOps(v.ops || [], ww + '.ops', false);
    if (v.gloss) (Array.isArray(v.gloss) ? v.gloss : [v.gloss]).forEach(function (h, i) {
      if (HOOK_ON.indexOf(h.on) < 0 || h.on === 'combatStart' || h.on === 'combatEnd') E(ww + ': bad gloss hook ' + h.on);
      if (h.every && ['illuminate', 'play', 'hurt'].indexOf(h.on) < 0 && !v.text) E(ww + ': every without text');
      checkOps(h.ops, ww + '.gloss' + i, true);
    });
    var single = (v.ops || []).some(function n(o) { return (o.target == null && ['dmg', 'dmgPer', 'doubleStatus'].indexOf(o.op) >= 0) || (o.op === 'apply' && o.target == null) || (o.op === 'if' && (/^target/.test(o.cond) || (o.then || []).concat(o.else || []).some(n))); });
    if (single && v.target !== 'enemy') E(ww + ': single-target op without target:enemy');
    var t = M.cardText({ id: id, up: up });
    if (badText(t)) E(ww + ': bad text: ' + t);
    if (vis(t).length > 95) E(ww + ': rules text ' + vis(t).length + ' chars > 95: ' + vis(t));
    // also with a live combat context (dynamic numbers)
  });
  if (d.rarity !== 'starter' && d.unlock) locked++;
  counts[d.rarity] = (counts[d.rarity] || 0) + 1; pig[d.pigment] = (pig[d.pigment] || 0) + 1; if (d.type === 'gloss') gloss++;
});

// relics
var rel = Object.keys(M.RELICS).filter(function (id) { return M.RELICS[id].char === 'nun'; });
rel.forEach(function (id) {
  var r = M.RELICS[id], w = 'relic ' + id;
  if (id.indexOf('nun_') !== 0) E(w + ': id must start with nun_');
  if (!r.name || !r.flavor) E(w + ': name/flavor');
  if (['starter', 'common', 'uncommon', 'rare', 'boss', 'shop'].indexOf(r.rarity) < 0) E(w + ': rarity');
  if (r.passive) { if (!r.text) E(w + ': passive needs text'); Object.keys(r.passive).forEach(function (k) { if (PASSIVES.indexOf(k) < 0) E(w + ': passive ' + k); }); }
  (r.hooks || []).forEach(function (h, i) {
    if (HOOK_ON.indexOf(h.on) < 0) E(w + ': bad hook');
    if (h.every && ['illuminate', 'play', 'hurt'].indexOf(h.on) < 0 && !r.text) E(w + ': every without text');
    checkOps(h.ops, w + '.hook' + i, true);
  });
  if (r.unlock && !M.ACHIEVEMENTS[r.unlock]) E(w + ': unknown unlock');
  var t = M.relicText(id); if (badText(t)) E(w + ': bad text ' + t);
});

// character
var ch = M.CHARACTERS.nun;
if (!ch) E('no M.CHARACTERS.nun');
else {
  if (ch.deck.length !== 10) E('nun deck must be 10 cards');
  ch.deck.forEach(function (id) { if (!M.CARDS[id] || M.CARDS[id].char !== 'nun' || M.CARDS[id].rarity !== 'starter') E('nun deck card bad ' + id); });
  if (!M.RELICS[ch.relic] || M.RELICS[ch.relic].rarity !== 'starter') E('nun starter relic bad');
  if (!M.ACHIEVEMENTS[ch.unlock]) E('nun unlock unknown');
  ['name', 'short', 'hp', 'art', 'order', 'colors', 'blurb'].forEach(function (k) { if (ch[k] == null) E('nun missing ' + k); });
}
// achievements check() must not throw on a fresh run
['nun_rampart', 'nun_hours', 'nun_pilgrim'].forEach(function (a) {
  if (!M.ACHIEVEMENTS[a]) return E('missing achievement ' + a);
  try { M.ACHIEVEMENTS[a].check(M.newRun({ seed: 'x', char: 'nun' })); } catch (e) { E(a + ' check throws ' + e); }
});
// all three illuminating pigments available
['V', 'L', 'G', 'A'].forEach(function (p) { if (!pig[p]) E('nun has no ' + p + ' cards'); });

// smoke: every card (base + gilded) in a live combat
var st = M.newRun({ seed: 'nunval', char: 'nun', unlocked: Object.keys(M.ACHIEVEMENTS) });
if (st.deck.length !== 10 || st.maxHp !== ch.hp) E('newRun nun deck/hp');
ids.forEach(function (id, k) {
  [false, true].forEach(function (up) {
    try {
      var s = M.newRun({ seed: 'nv' + k + up, char: 'nun', unlocked: Object.keys(M.ACHIEVEMENTS) });
      s.hp = s.maxHp = 300;
      M.startCombat(s, M.ENCOUNTERS[1].normal[0], 'battle');
      s.combat.ink = 9; s.combat.player.ward = 12;
      s.combat.hand.push({ uid: 9999, id: id, up: up });
      var t = M.cardText({ id: id, up: up }, s); if (badText(t)) E(id + ': bad combat text ' + t);
      var r = M.act(s, { type: 'play', hand: s.combat.hand.length - 1, target: 0 });
      if (!r.ok) E(id + (up ? '+' : '') + ': could not play: ' + r.err);
      for (var i = 0; i < 4 && s.screen === 'combat' && !s.combat.over; i++) M.act(s, { type: 'endTurn' });
      if (isNaN(s.hp) || s.combat.enemies.some(function (e) { return isNaN(e.hp); })) E(id + ': NaN');
    } catch (e) { E(id + ': threw ' + e.stack); }
  });
});

console.log('Nun cards:', ids.length, JSON.stringify(counts), 'pigments', JSON.stringify(pig), 'glosses', gloss,
  'locked', locked + '/' + (ids.length - (counts.starter || 0)), '| relics', rel.length);
warns.forEach(function (m) { console.log('WARN ' + m); });
errs.forEach(function (m) { console.log('ERROR ' + m); });
console.log(errs.length ? 'FAILED (' + errs.length + ')' : 'NUN OK');
process.exit(errs.length ? 1 : 0);
