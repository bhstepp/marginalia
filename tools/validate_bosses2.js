// Validates src/data/bosses2.js (v2 boss roster) and dry-runs every move of every new boss once.
// Usage: node tools/validate_bosses2.js
var M = require('../load');
var errors = [];
function err(m) { errors.push(m); }

var BOSSES = { 1: [['jousting_hare', 'war_snail'], ['bagpipe_bishop']], 2: [['basilisk'], ['siren']], 3: [['hellmouth'], ['seraph']] };
var MINIONS = ['dancing_fool', 'hell_imp_small'];
var ENEMY_OPS = ['dmg', 'dmgPer', 'ward', 'wardPer', 'apply', 'doubleStatus', 'removeStatus', 'heal', 'loseHp', 'addCard',
  'if', 'repeat', 'gold', 'eraseMargin', 'devour', 'devourPigment', 'summon'];
var TARGETS = [undefined, 'self', 'allies', 'player'];
var INTENTS = ['attack', 'defend', 'buff', 'debuff', 'curse', 'erase', 'devour', 'summon', 'unknown'];
var E = M.ENEMIES;

function checkOps(where, ops) {
  if (!Array.isArray(ops)) return err(where + ': ops not an array');
  ops.forEach(function (o, i) {
    var w = where + '[' + i + ']';
    if (!o || ENEMY_OPS.indexOf(o.op) < 0) return err(w + ': unknown/invalid enemy op ' + (o && o.op));
    if (TARGETS.indexOf(o.target) < 0) err(w + ': bad target ' + o.target);
    if (['apply', 'removeStatus', 'doubleStatus'].indexOf(o.op) >= 0 && !M.STATUS[o.s]) err(w + ': unknown status ' + o.s);
    if (o.op === 'apply' && typeof o.n !== 'number') err(w + ': apply needs n');
    if (o.op === 'dmg' && (typeof o.n !== 'number' || o.n < 0)) err(w + ': bad dmg');
    if (o.op === 'addCard') { var cd = M.CARDS[o.id]; if (!cd) err(w + ': unknown card ' + o.id); else if (cd.type !== 'blot' && cd.type !== 'curse') err(w + ': addCard not a blot/curse ' + o.id); }
    if (o.op === 'devourPigment' && !M.PIGMENTS[o.pig]) err(w + ': bad pigment ' + o.pig);
    if (o.op === 'summon') { if (!E[o.id]) err(w + ': summon unknown ' + o.id); else if (E[o.id].tier !== 'minion') err(w + ': summons non-minion ' + o.id); }
    if (o.op === 'if') { checkOps(w + '.then', o.then || []); checkOps(w + '.else', o.else || []); }
    if (o.op === 'repeat') checkOps(w + '.ops', o.ops || []);
  });
}
function checkAi(id, ai, moves, label) {
  if (!ai) return err(id + ': missing ' + label);
  var keys = [];
  if (ai.type === 'cycle') { if (!ai.seq || !ai.seq.length) err(id + ' ' + label + ': empty seq'); keys = keys.concat(ai.seq || []); }
  else if (ai.type === 'random') { if (!ai.w || !Object.keys(ai.w).length) err(id + ' ' + label + ': empty w'); keys = keys.concat(Object.keys(ai.w || {}), ai.noRepeat || []); }
  else err(id + ' ' + label + ': bad type');
  keys.concat(ai.first || []).forEach(function (k) { if (!moves[k]) err(id + ' ' + label + ': missing move ' + k); });
}
function bigHit(ops) { var m = 0; ops.forEach(function (o) { if (o.op === 'dmg') m = Math.max(m, (o.times || 1) > 1 ? o.n * o.times * 0.75 : o.n); }); return m; }
function isWindup(ops) { return ops.some(function (o) { return o.op === 'ward' || (o.op === 'apply' && o.target === 'self' && o.s === 'might'); }); }

var ids = MINIONS.slice();
Object.keys(BOSSES).forEach(function (a) { BOSSES[a].forEach(function (enc) { ids = ids.concat(enc); }); });
ids.forEach(function (id) {
  var d = E[id];
  if (!d) return err('missing enemy ' + id);
  var isMinion = MINIONS.indexOf(id) >= 0;
  if (!d.name || !d.desc) err(id + ': name/desc');
  if (d.tier !== (isMinion ? 'minion' : 'boss')) err(id + ': tier ' + d.tier);
  if (!isMinion && d.size !== 'l') err(id + ': boss size must be l');
  if (!Array.isArray(d.hp) || d.hp.length !== 2 || d.hp[0] > d.hp[1] || d.hp[0] < 1) err(id + ': bad hp');
  Object.keys(d.moves).forEach(function (k) {
    var mv = d.moves[k];
    if (!mv.name) err(id + '.' + k + ': no name');
    if (mv.intent && INTENTS.indexOf(mv.intent) < 0) err(id + '.' + k + ': bad intent ' + mv.intent);
    checkOps(id + '.' + k, mv.ops);
  });
  if (d.start) checkOps(id + '.start', d.start);
  if (d.onDeath) checkOps(id + '.onDeath', d.onDeath);
  checkAi(id, d.ai, d.moves, 'ai');
  if (!isMinion) {
    if (!d.phase2) err(id + ': boss needs phase2');
    else {
      if (!d.phase2.enter || !d.moves[d.phase2.enter]) err(id + ': phase2.enter missing');
      if (!(d.phase2.at > 0 && d.phase2.at < 1)) err(id + ': phase2.at');
      checkAi(id, d.phase2.ai, d.moves, 'phase2.ai');
    }
    // telegraph: any hit >= 18 in a cycle must be preceded by a windup move
    [d.ai, d.phase2 && d.phase2.ai].forEach(function (ai, ph) {
      if (!ai || ai.type !== 'cycle') return;
      ai.seq.forEach(function (k, i) {
        if (bigHit(d.moves[k].ops) < 18) return;
        var prev = ai.seq[(i - 1 + ai.seq.length) % ai.seq.length];
        if (!isWindup(d.moves[prev].ops)) err(id + (ph ? ' phase2' : '') + ': big hit ' + k + ' not telegraphed (prev ' + prev + ')');
      });
    });
  }
});
// encounters registered
Object.keys(BOSSES).forEach(function (a) {
  BOSSES[a].forEach(function (enc) {
    if (!M.ENCOUNTERS[a].boss.some(function (e) { return e.join() === enc.join(); })) err('act ' + a + ' boss list lacks ' + enc.join('+'));
  });
  if (M.ENCOUNTERS[a].boss.length !== 3) err('act ' + a + ' should offer 3 bosses, has ' + M.ENCOUNTERS[a].boss.length);
});
// dry-run every move once in a real combat
Object.keys(BOSSES).forEach(function (a) {
  BOSSES[a].forEach(function (enc) {
    try {
      var st = M.newRun({ seed: 'vb2' + enc.join() }); st.act = +a; st.hp = st.maxHp = 999;
      M.startCombat(st, enc, 'boss');
      st.combat.enemies.forEach(function (e, i) {
        Object.keys(M.ENEMIES[e.id].moves).forEach(function (k) {
          if (st.combat.over) return;
          M.runOps(st, M.ENEMIES[e.id].moves[k].ops, { side: 'e', ei: i });
          e.intent = k; var info = M.intentInfo(st, e); if (!info.kinds.length) err(e.id + '.' + k + ': no intent kinds');
        });
      });
      if (isNaN(st.hp) || st.combat.enemies.some(function (e) { return isNaN(e.hp) || isNaN(e.ward); })) err(enc.join() + ': NaN after dry run');
      // a few real turns
      for (var t = 0; t < 30 && !st.combat.over; t++) M.act(st, { type: 'endTurn' });
    } catch (e) { err(enc.join() + ': dry run threw ' + e.stack); }
  });
});

if (errors.length) { errors.forEach(function (e) { console.log('ERROR ' + e); }); console.log(errors.length + ' error(s)'); process.exit(1); }
console.log('OK: ' + ids.length + ' v2 enemies valid; boss lists: ' + [1, 2, 3].map(function (a) { return 'A' + a + '=' + M.ENCOUNTERS[a].boss.map(function (e) { return e.join('+'); }).join('|'); }).join('  '));
