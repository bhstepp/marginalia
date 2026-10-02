// Content validator: node tools/validate_content.js
var fs = require('fs'), path = require('path');
var M = require('../load');
var errs = [], warns = [];
function E(m) { errs.push(m); }
function W(m) { warns.push(m); }

// --- known op names, parsed from the engine's runOp switch
var src = fs.readFileSync(path.join(__dirname, '..', 'src', 'engine.js'), 'utf8');
var body = src.slice(src.indexOf('function runOp('), src.indexOf('// ---------------- Rewards'));
var OPS = {}; (body.match(/case '([a-zA-Z]+)'/g) || []).forEach(function (m) { OPS[m.slice(6, -1)] = 1; });
if (Object.keys(OPS).length < 20) E('Could not parse op list from engine (' + Object.keys(OPS).length + ')');
var RUN_OPS = { gold: 1, heal: 1, loseHp: 1, maxHp: 1, addCard: 1, gainCard: 1, relic: 1, gildRandom: 1, removeRandom: 1, choose: 1, fight: 1 };
var PERS = ['targetCorrode', 'ward', 'played', 'margin', 'pigments', 'handSize', 'discard', 'might', 'blots', 'missingHp'];
var CONDS = ['illuminated', 'played', 'targetCorroded', 'targetTorn', 'targetAttacking', 'wardAtLeast', 'hpBelowHalf', 'marginFull', 'firstCard', 'handEmpty', 'goldAtLeast'];
var HOOK_ON = ['combatStart', 'turnStart', 'turnEnd', 'illuminate', 'play', 'enemyDies', 'hurt', 'combatEnd'];
var EVERY_TEXT_OK = ['illuminate', 'play', 'hurt'];
var PIGS = Object.keys(M.PIGMENTS), STATUS = Object.keys(M.STATUS);
var RARITY_REL = ['starter', 'common', 'uncommon', 'rare', 'boss', 'shop'];
var RARITY_CARD = ['starter', 'common', 'uncommon', 'rare', 'special'];
var TYPES = ['attack', 'skill', 'gloss', 'blot', 'curse'];
var PASSIVES = ['ink', 'hand', 'illumEase', 'maxHp', 'restHeal', 'shopDiscount', 'cardChoices', 'goldPct', 'gildRewards'];

function checkOps(ops, where, mode) { // mode: 'combat' | 'run'
  if (!Array.isArray(ops)) { E(where + ': ops is not an array'); return; }
  ops.forEach(function (o, i) {
    var w = where + '[' + i + ']';
    if (!o || !OPS[o.op]) { E(w + ': unknown op ' + (o && o.op)); return; }
    if (mode === 'run' && !RUN_OPS[o.op]) E(w + ': op ' + o.op + ' not valid out of combat');
    if (mode === 'combat' && { fight: 1, choose: 1, gainCard: 1, relic: 1, gildRandom: 1, removeRandom: 1, maxHp: 1 }[o.op]) E(w + ': run op ' + o.op + ' used in combat');
    if ((o.op === 'apply' || o.op === 'doubleStatus' || o.op === 'removeStatus') && STATUS.indexOf(o.s) < 0) E(w + ': bad status ' + o.s);
    if ((o.op === 'dmgPer' || o.op === 'wardPer') && PERS.indexOf(o.per) < 0) E(w + ': bad per ' + o.per);
    if (o.op === 'drawPigment' && PIGS.indexOf(o.pig) < 0) E(w + ': bad pig ' + o.pig);
    if ((o.op === 'dmg' || o.op === 'ward' || o.op === 'heal' || o.op === 'loseHp' || o.op === 'ink' || o.op === 'draw' || o.op === 'gold' || o.op === 'maxHp') && typeof o.n !== 'number') E(w + ': ' + o.op + ' needs numeric n');
    if ((o.op === 'addCard' || (o.op === 'gainCard' && o.id)) && !M.CARDS[o.id]) E(w + ': unknown card id ' + o.id);
    if (o.op === 'relic' && o.id && !M.RELICS[o.id]) E(w + ': unknown relic ' + o.id);
    if (o.op === 'choose' && ['remove', 'gild', 'transform', 'duplicate'].indexOf(o.purpose) < 0) E(w + ': bad choose purpose');
    if (o.op === 'fight') {
      if (!Array.isArray(o.enc) || !o.enc.length) E(w + ': fight needs enc');
      else o.enc.forEach(function (id) { if (!M.ENEMIES[id]) W(w + ': fight enemy ' + id + ' not (yet) in M.ENEMIES'); });
    }
    if (o.op === 'if') {
      var k = String(o.cond).split(':');
      if (CONDS.indexOf(k[0]) < 0) E(w + ': bad cond ' + o.cond);
      if (k[0] === 'played' && ['V', 'L', 'G', 'A'].indexOf(k[1]) < 0) E(w + ': bad played pig ' + o.cond);
      if (k[0] === 'goldAtLeast') W(w + ': goldAtLeast has no auto text');
      checkOps(o.then || [], w + '.then', mode); if (o.else) checkOps(o.else, w + '.else', mode);
    }
    if (o.op === 'repeat' || o.op === 'nextTurn') checkOps(o.ops || [], w + '.ops', mode);
  });
}
function checkHook(h, where, isRelic) {
  if (HOOK_ON.indexOf(h.on) < 0) E(where + ': bad hook on ' + h.on);
  if (!isRelic && (h.on === 'combatStart' || h.on === 'combatEnd')) E(where + ': gloss cannot use ' + h.on);
  if (h.pig && PIGS.indexOf(h.pig) < 0) E(where + ': bad hook pig');
  if (h.type && TYPES.indexOf(h.type) < 0) E(where + ': bad hook type');
  checkOps(h.ops || [], where + '.ops', h.on === 'combatEnd' ? 'run' : 'combat');
  return h.every && EVERY_TEXT_OK.indexOf(h.on) < 0; // needs manual text
}
function badText(t) { return !t || /undefined|NaN|\[object/.test(t); }

// ---- cards
var counts = {}, pigCounts = {}, glossN = 0;
Object.keys(M.CARDS).forEach(function (id) {
  var d = M.CARDS[id], w = 'card ' + id;
  if (!d.name) E(w + ': no name'); else if (d.name.length > 18) E(w + ': name too long (' + d.name.length + ')');
  if (PIGS.indexOf(d.pigment) < 0) E(w + ': bad pigment ' + d.pigment);
  if (TYPES.indexOf(d.type) < 0) E(w + ': bad type ' + d.type);
  if (RARITY_CARD.indexOf(d.rarity) < 0) E(w + ': bad rarity ' + d.rarity);
  if (d.cost != null && (d.cost < 0 || d.cost > 3)) E(w + ': cost out of range');
  if (d.rarity !== 'special' && !d.up) E(w + ': missing up');
  if ((d.type === 'blot' || d.type === 'curse') && (d.rarity !== 'special' || d.pigment !== 'X')) E(w + ': junk must be special/X');
  if (d.type === 'gloss' && !d.gloss) E(w + ': gloss card without gloss hook');
  [d, d.up ? Object.assign({}, d, d.up) : null].forEach(function (v, gi) {
    if (!v) return;
    var ww = w + (gi ? ' (gilded)' : '');
    checkOps(v.ops || [], ww + '.ops', 'combat');
    if (v.onDraw) checkOps(v.onDraw, ww + '.onDraw', 'combat');
    if (v.endTurn) checkOps(v.endTurn, ww + '.endTurn', 'combat');
    var needsText = false;
    if (v.gloss) (Array.isArray(v.gloss) ? v.gloss : [v.gloss]).forEach(function (h, i) { if (checkHook(h, ww + '.gloss' + i, false)) needsText = true; });
    if (needsText && !v.text) E(ww + ': gloss hook uses every:N on a hook whose auto text ignores it; add text');
    var single = (v.ops || []).some(function n(o) { return (o.target == null && ['dmg', 'dmgPer', 'doubleStatus'].indexOf(o.op) >= 0) || (o.op === 'apply' && o.target == null) || (o.op === 'if' && (/^target/.test(o.cond) || (o.then || []).concat(o.else || []).some(n))); });
    if (single && v.target !== 'enemy') W(ww + ': single-target op without target:enemy (will hit random foe)');
    var t = M.cardText({ id: id, up: !!gi });
    if (badText(t) && d.rarity !== 'special') E(ww + ': bad text: ' + t);
    if (/undefined|NaN/.test(t)) E(ww + ': bad text: ' + t);
  });
  counts[d.rarity] = (counts[d.rarity] || 0) + 1;
  if (d.rarity !== 'special') pigCounts[d.pigment] = (pigCounts[d.pigment] || 0) + 1;
  if (d.type === 'gloss') glossN++;
});
['lance', 'shield', 'moss_dart', 'ink_blot', 'smear', 'paw_print', 'wormhole', 'water_stain', 'dog_ear', 'censure'].forEach(function (id) { if (!M.CARDS[id]) E('missing fixed card ' + id); });
M.STARTER_DECK.forEach(function (id) { if (!M.CARDS[id]) E('starter deck card missing ' + id); });

// ---- relics
var rcounts = {};
Object.keys(M.RELICS).forEach(function (id) {
  var r = M.RELICS[id], w = 'relic ' + id;
  if (!r.name) E(w + ': no name');
  if (!r.flavor) E(w + ': no flavor');
  if (RARITY_REL.indexOf(r.rarity) < 0) E(w + ': bad rarity ' + r.rarity);
  var needsText = false;
  (r.hooks || []).forEach(function (h, i) { if (checkHook(h, w + '.hooks' + i, true)) needsText = true; });
  if (r.onPickup) { checkOps(r.onPickup, w + '.onPickup', 'run'); needsText = true; if (r.onPickup.some(function (o) { return o.op === 'choose' || o.op === 'fight'; })) E(w + ': choose/fight in onPickup breaks reward flow'); }
  if (r.passive) { needsText = true; Object.keys(r.passive).forEach(function (k) { if (PASSIVES.indexOf(k) < 0) E(w + ': unknown passive ' + k); }); }
  if (needsText && !r.text) E(w + ': needs text (passive/onPickup/every)');
  if (!r.text && !(r.hooks && r.hooks.length)) E(w + ': no text and no hooks');
  if (badText(M.relicText(id))) E(w + ': bad text: ' + M.relicText(id));
  rcounts[r.rarity] = (rcounts[r.rarity] || 0) + 1;
});
if (!M.RELICS[M.STARTER_RELIC]) E('missing starter relic');

// ---- events
Object.keys(M.EVENTS).forEach(function (id) {
  var ev = M.EVENTS[id], w = 'event ' + id;
  if (!ev.title || !ev.text) E(w + ': title/text missing');
  if (!Array.isArray(ev.acts) || !ev.acts.length || ev.acts.some(function (a) { return [1, 2, 3].indexOf(a) < 0; })) E(w + ': bad acts');
  if (!ev.choices || ev.choices.length < 2) E(w + ': needs 2+ choices');
  var free = false;
  (ev.choices || []).forEach(function (c, i) {
    var ww = w + '.choice' + i;
    if (!c.label || !c.desc || c.result == null) E(ww + ': label/desc/result missing');
    checkOps(c.ops || [], ww, 'run');
    if (!c.req) free = true;
    var spend = (c.ops || []).filter(function (o) { return o.op === 'gold' && o.n < 0; })[0];
    if (spend && (!c.req || c.req.gold == null || c.req.gold < -spend.n)) E(ww + ': spends silver without matching req.gold');
    var picks = (c.ops || []).filter(function (o) { return o.op === 'choose' || o.op === 'fight'; }).length;
    if (picks > 1) E(ww + ': more than one choose/fight');
    if (c.req && c.req.relic && !M.RELICS[c.req.relic]) E(ww + ': req relic unknown');
  });
  if (!free) E(w + ': every choice has a requirement (could soft-lock)');
});

console.log('Cards by rarity:', JSON.stringify(counts), 'by pigment:', JSON.stringify(pigCounts), 'gloss:', glossN, 'total:', Object.keys(M.CARDS).length);
console.log('Relics by rarity:', JSON.stringify(rcounts), 'total:', Object.keys(M.RELICS).length);
console.log('Events:', Object.keys(M.EVENTS).length);
warns.forEach(function (m) { console.log('WARN ' + m); });
errs.forEach(function (m) { console.log('ERROR ' + m); });
console.log(errs.length ? 'FAILED with ' + errs.length + ' error(s)' : 'OK (0 errors, ' + warns.length + ' warnings)');
process.exit(errs.length ? 1 : 0);
