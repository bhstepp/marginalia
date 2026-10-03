/* Marginalia — core engine. Pure logic, no DOM. Runs in browser and Node.
   All run state is a plain JSON object (st) so it can be saved/resumed.
   Content lives in M.CARDS, M.ENEMIES, M.RELICS, M.EVENTS, M.ENCOUNTERS (data/*.js). */
(function () {
  var G = (typeof globalThis !== 'undefined') ? globalThis : window;
  var M = G.M = G.M || {};
  M.CARDS = M.CARDS || {}; M.ENEMIES = M.ENEMIES || {}; M.RELICS = M.RELICS || {};
  M.EVENTS = M.EVENTS || {}; M.ENCOUNTERS = M.ENCOUNTERS || {};

  var C = M.CONST = {
    START_HP: 70, START_GOLD: 99, BASE_INK: 3, HAND: 5, HAND_MAX: 10, MARGIN_SLOTS: 3,
    ILLUM_NEED: 3, ROWS: 9, REMOVE_COST: 75, REMOVE_STEP: 25, REST_HEAL: 0.3, ACT_HEAL: 0.5,
    ACTS: 3
  };
  M.STARTER_DECK = ['lance', 'lance', 'lance', 'lance', 'shield', 'shield', 'shield', 'shield', 'moss_dart', 'moss_dart'];
  M.STARTER_RELIC = 'pilgrim_badge';
  M.PIGMENTS = {
    V: { name: 'Vermilion', color: '#b8321f' }, L: { name: 'Lapis', color: '#1f4f96' },
    G: { name: 'Verdigris', color: '#2f7d62' }, A: { name: 'Gold', color: '#c99a1e' },
    N: { name: 'Ink', color: '#2a2320' }, X: { name: 'Blot', color: '#3b3330' }
  };
  M.STATUS = {
    might:    { name: 'Might',    good: true,  desc: 'Attacks deal +N damage per hit.' },
    resolve:  { name: 'Resolve',  good: true,  desc: 'Gain +N extra Ward whenever you gain Ward from a card, Gloss or relic.' },
    corrode:  { name: 'Corrode',  good: false, desc: 'At the start of its turn, loses N HP (ignores Ward), then Corrode drops by 1.' },
    smudged:  { name: 'Smudged',  good: false, desc: 'Deals 25% less attack damage. Wears off by 1 each turn.' },
    torn:     { name: 'Torn',     good: false, desc: 'Takes 50% more attack damage. Wears off by 1 each turn.' },
    faded:    { name: 'Faded',    good: false, desc: 'Gains 25% less Ward. Wears off by 1 each turn.' },
    brambles: { name: 'Brambles', good: true,  desc: 'Whenever attacked, the attacker takes N damage.' },
    mending:  { name: 'Mending',  good: true,  desc: 'At the end of its turn, heals N, then Mending drops by 1.' },
    steadfast:{ name: 'Steadfast',good: true,  desc: 'Ward is not removed at the start of turn. Wears off by 1 each turn.' },
    zeal:     { name: 'Zeal',     good: true,  desc: 'At the end of its turn, gains N Might.' },
    shell:    { name: 'Shell',    good: true,  desc: 'At the end of its turn, gains N Ward.' },
    parched:  { name: 'Parched',  good: false, desc: 'Start next turn with N less Ink.' },
    petrified:{ name: 'Petrified',good: false, desc: 'Next turn, the N most expensive cards drawn are turned to stone and cannot be played that turn.' }
  };
  var DECAY = { smudged: 1, torn: 1, faded: 1, mending: 1 };

  // ---------------- RNG ----------------
  function hashStr(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  M.hashStr = hashStr;
  function rnd(st, stream) {
    var s = (st.rng[stream] + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    st.rng[stream] = s;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function rint(st, s, a, b) { return a + Math.floor(rnd(st, s) * (b - a + 1)); }
  function pick(st, s, arr) { return arr[Math.floor(rnd(st, s) * arr.length)]; }
  function shuffle(st, s, arr) {
    for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rnd(st, s) * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  }
  function wpick(st, s, w) {
    var keys = Object.keys(w).filter(function (k) { return w[k] > 0; }), tot = 0;
    keys.forEach(function (k) { tot += w[k]; });
    var r = rnd(st, s) * tot;
    for (var i = 0; i < keys.length; i++) { r -= w[keys[i]]; if (r < 0) return keys[i]; }
    return keys[keys.length - 1];
  }
  M.rnd = rnd; M.rint = rint; M.pick = pick; M.shuffle = shuffle;

  function fx(st, o) { (st.fx = st.fx || []).push(o); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // ---------------- Defs ----------------
  function cardDef(inst) {
    var base = M.CARDS[inst.id];
    if (!base) throw new Error('Unknown card ' + inst.id);
    if (!inst.up || !base.up) return base;
    var d = {}; for (var k in base) d[k] = base[k];
    for (var k2 in base.up) d[k2] = base.up[k2];
    d.up = null; d._gilded = true;
    return d;
  }
  M.cardDef = cardDef;
  function cardCost(st, inst) {
    var d = cardDef(inst);
    if (d.cost == null) return null;
    var c = d.cost;
    if (inst.costTmp != null) c = inst.costTmp;
    (st && st.mods || []).forEach(function (id) { var m = M.MODIFIERS && M.MODIFIERS[id]; if (m && m.costSet && m.costSet[d.pigment] != null && d.type !== 'blot' && d.type !== 'curse') c = Math.min(c, m.costSet[d.pigment]); });
    return Math.max(0, c);
  }
  M.cardCost = cardCost;
  function passive(st, key) {
    var t = 0;
    st.relics.forEach(function (id) { var r = M.RELICS[id]; if (r && r.passive && r.passive[key]) t += r.passive[key]; });
    (st.mods || []).forEach(function (id) { var m = M.MODIFIERS && M.MODIFIERS[id]; if (m && m.passive && m.passive[key]) t += m.passive[key]; });
    return t;
  }
  M.passive = passive;

  // ---------------- Run ----------------
  M.dailySeed = function (d) {
    d = d || new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'DAILY-' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  };
  M.randomSeed = function () {
    var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
    for (var i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)];
    return s;
  };

  M.newRun = function (opts) {
    opts = opts || {};
    var seed = String(opts.seed || M.randomSeed());
    var ch = M.CHARACTERS[opts.char] ? opts.char : 'knight', CH = M.CHARACTERS[ch] || {};
    var st = {
      v: 2, seed: seed, daily: seed.indexOf('DAILY-') === 0, char: ch, asc: Math.max(0, Math.min(M.RUBRICS.length, opts.asc | 0)),
      unlocked: (opts.unlocked || []).slice(), mods: [],
      seen: { cards: {}, relics: {}, foes: {} },
      rng: {}, hp: CH.hp || C.START_HP, maxHp: CH.hp || C.START_HP, gold: C.START_GOLD,
      deck: [], relics: [], relicState: {}, act: 1, floor: 0, map: null, pos: null,
      screen: 'actIntro', combat: null, reward: null, shop: null, event: null, pick: null, treasure: null,
      stats: { kills: 0, elites: 0, bosses: 0, floors: 0, cards: 0, illum: 0, dmg: 0, turns: 0,
        glosses: 0, maxHit: 0, killsTurnMax: 0, illumStreakMax: 0, flawless: 0, maxCardsTurn: 0, maxWard: 0, maxCorrode: 0, bossIds: [] },
      nextUid: 1, removeCost: C.REMOVE_COST, seenEvents: [], lastEnc: null, actBattles: 0,
      over: false, won: false, fx: []
    };
    ['map', 'card', 'combat', 'event', 'loot', 'shop', 'misc'].forEach(function (s) { st.rng[s] = hashStr(seed + ':' + s); });
    if (opts.mods) st.mods = opts.mods.filter(function (id) { return M.MODIFIERS && M.MODIFIERS[id]; });
    else if (st.daily) st.mods = M.dailyMods(seed);
    (CH.deck || M.STARTER_DECK).forEach(function (id) { addToDeck(st, id, false); });
    var sr = CH.relic || M.STARTER_RELIC;
    if (M.RELICS[sr]) gainRelic(st, sr);
    if (st.asc >= 6) addToDeck(st, 'dog_ear', false);
    st.mods.forEach(function (id) { var m = M.MODIFIERS[id]; if (m.onRunStart) runOps(st, m.onRunStart, { side: 'run' }); });
    st.fx = [];
    genMap(st);
    return st;
  };

  function addToDeck(st, id, up) {
    var inst = { uid: st.nextUid++, id: id, up: !!up };
    seeCard(st, id);
    st.deck.push(inst);
    return inst;
  }
  M.addToDeck = addToDeck;

  function gainRelic(st, id) {
    if (!M.RELICS[id] || st.relics.indexOf(id) >= 0) return false;
    st.relics.push(id);
    st.relicState[id] = { count: 0 };
    if (st.seen) st.seen.relics[id] = 1;
    var r = M.RELICS[id];
    if (r.passive && r.passive.maxHp) { st.maxHp += r.passive.maxHp; st.hp += r.passive.maxHp; }
    if (r.onPickup) runOps(st, r.onPickup, { side: 'run' });
    fx(st, { k: 'relic', id: id });
    return true;
  }
  M.gainRelic = gainRelic;

  // ---------------- Characters / unlocks / Rubrication / modifiers ----------------
  M.CHARACTERS = M.CHARACTERS || {};
  function seeCard(st, id) { if (st.seen) st.seen.cards[id] = 1; }
  M.isUnlocked = function (st, def) { return !def || !def.unlock || (st.unlocked || []).indexOf(def.unlock) >= 0; };
  function cardAvail(st, id) {
    var d = M.CARDS[id]; if (!d) return false;
    if (d.char && d.char !== st.char) return false;
    return M.isUnlocked(st, d);
  }
  function relicAvail(st, id) {
    var r = M.RELICS[id]; if (!r || st.relics.indexOf(id) >= 0) return false;
    if (r.char && r.char !== st.char) return false;
    return M.isUnlocked(st, r);
  }
  M.cardAvail = cardAvail; M.relicAvail = relicAvail;
  // Rubrication: ascending difficulty. Level N includes every rule at or below N.
  M.RUBRICS = [
    { name: 'Ruled Lines', desc: 'Elites appear more often.' },
    { name: 'Tougher Drolleries', desc: 'Ordinary foes have 10% more HP.' },
    { name: 'Gilded Elites', desc: 'Elites have 15% more HP and start with 1 Might.' },
    { name: 'Dim Candles', desc: 'The Scriptorium mends only 25% of max HP.' },
    { name: 'Grand Bosses', desc: 'Bosses have 12% more HP.' },
    { name: 'Dog-Eared', desc: 'Begin each run with a Dog Ear curse.' },
    { name: 'Sharpened Claws', desc: 'Ordinary foes start fights with 1 Might.' },
    { name: 'Lean Purse', desc: '20% less silver from fights.' },
    { name: 'Long Road', desc: 'Recover only 25% of missing HP between Quires.' },
    { name: 'Apocalypse Now', desc: 'Bosses start fights with 1 Might.' }
  ];
  M.scoreMult = function (st) { return 1 + 0.1 * (st.asc || 0) + 0.05 * (st.mods || []).length; };
  M.dailyMods = function (seed) {
    var ids = Object.keys(M.MODIFIERS || {}).sort(); if (!ids.length) return [];
    var tmp = { rng: { m: hashStr(seed + ':mods') } }, out = [];
    while (out.length < Math.min(2, ids.length)) { var id = ids[Math.floor(rnd(tmp, 'm') * ids.length)]; if (out.indexOf(id) < 0) out.push(id); }
    return out;
  };
  function marginSlots(st) { return C.MARGIN_SLOTS + passive(st, 'marginSlots'); }
  M.marginSlots = marginSlots;

  // ---------------- Map ----------------
  function genMap(st) {
    var rows = [], R = C.ROWS;
    for (var r = 0; r < R; r++) {
      var n = (r === R - 1) ? 1 : (r === 0 ? 3 : rint(st, 'map', 3, 4));
      if (r === R - 2) n = rint(st, 'map', 2, 3);
      var row = [];
      for (var i = 0; i < n; i++) {
        var x = n === 1 ? 0.5 : 0.12 + 0.76 * (i / (n - 1));
        if (n > 1) x += (rnd(st, 'map') - 0.5) * 0.08;
        row.push({ id: 'n' + r + '_' + i, r: r, i: i, x: x, type: 'battle', next: [], visited: false });
      }
      rows.push(row);
    }
    for (r = 0; r < R - 1; r++) {
      var A = rows[r], B = rows[r + 1];
      A.forEach(function (node, i) {
        var lo = Math.floor(i * B.length / A.length), hi = Math.floor(((i + 1) * B.length - 1) / A.length);
        for (var j = lo; j <= hi; j++) node.next.push(B[j].id);
      });
    }
    for (r = 0; r < R; r++) rows[r].forEach(function (node) {
      if (r === 0) node.type = 'battle';
      else if (r === 1) node.type = rnd(st, 'map') < 0.7 ? 'battle' : 'event';
      else if (r === 4) node.type = 'treasure';
      else if (r === R - 2) node.type = 'rest';
      else if (r === R - 1) node.type = 'boss';
      else node.type = wpick(st, 'map', { battle: 44, event: 24, shop: 12, elite: r >= 3 ? (st.asc >= 1 ? 24 : 16) : 0, rest: (r >= 5) ? 8 : 0 });
    });
    var flat = []; rows.forEach(function (row) { row.forEach(function (n) { flat.push(n); }); });
    var mids = flat.filter(function (n) { return n.r >= 2 && n.r <= R - 3 && n.r !== 4; });
    if (!flat.some(function (n) { return n.type === 'shop'; })) pick(st, 'map', mids).type = 'shop';
    if (!flat.some(function (n) { return n.type === 'elite'; })) pick(st, 'map', mids.filter(function (n) { return n.r >= 3 && n.type !== 'shop'; })).type = 'elite';
    var bosses = (M.ENCOUNTERS[st.act] && M.ENCOUNTERS[st.act].boss) || [];
    st.map = { act: st.act, rows: rows, boss: bosses.length ? pick(st, 'map', bosses) : null };
    st.pos = null;
  }
  M.genMap = genMap;
  function findNode(st, id) {
    for (var r = 0; r < st.map.rows.length; r++) for (var i = 0; i < st.map.rows[r].length; i++) if (st.map.rows[r][i].id === id) return st.map.rows[r][i];
    return null;
  }
  M.findNode = findNode;
  M.reachable = function (st) {
    if (!st.map) return [];
    if (!st.pos) return st.map.rows[0].map(function (n) { return n.id; });
    var cur = findNode(st, st.pos);
    return cur ? cur.next.slice() : [];
  };

  function chooseNode(st, id) {
    if (M.reachable(st).indexOf(id) < 0) return err('Not reachable');
    var node = findNode(st, id);
    st.pos = id; node.visited = true; st.floor++; st.stats.floors++;
    var E = M.ENCOUNTERS[st.act] || {};
    if (node.type === 'battle') {
      var pool = (st.actBattles < 2 && E.easy && E.easy.length) ? E.easy : (E.normal || E.easy);
      startCombat(st, pickEnc(st, pool), 'battle');
    } else if (node.type === 'elite') startCombat(st, pickEnc(st, E.elite), 'elite');
    else if (node.type === 'boss') startCombat(st, st.map.boss || pick(st, 'combat', E.boss), 'boss');
    else if (node.type === 'event') startEvent(st);
    else if (node.type === 'shop') openShop(st);
    else if (node.type === 'rest') st.screen = 'rest';
    else if (node.type === 'treasure') {
      st.treasure = { relic: randomRelic(st, 'loot', { common: 45, uncommon: 40, rare: 15 }), gold: rint(st, 'loot', 20, 40), opened: false };
      st.screen = 'treasure';
    }
    return ok();
  }
  function pickEnc(st, pool) {
    var opts = pool.filter(function (e) { return JSON.stringify(e) !== JSON.stringify(st.lastEnc); });
    if (!opts.length) opts = pool;
    var e = pick(st, 'combat', opts);
    st.lastEnc = e;
    return e;
  }

  // ---------------- Combat ----------------
  function living(st) { return st.combat ? st.combat.enemies.filter(function (e) { return !e.dead; }) : []; }
  M.living = living;
  function actor(st, ref) { return ref === 'p' ? st.combat.player : st.combat.enemies[ref]; }
  function getHp(st, ref) { return ref === 'p' ? st.hp : st.combat.enemies[ref].hp; }
  function stv(st, ref, s) { var a = actor(st, ref); return (a && a.st[s]) || 0; }

  function makeEnemy(st, id) {
    var d = M.ENEMIES[id];
    if (!d) throw new Error('Unknown enemy ' + id);
    var hp = rint(st, 'combat', d.hp[0], d.hp[1]);
    var pct = passive(st, 'enemyHpPct');
    if (d.tier === 'normal' && st.asc >= 2) pct += 10;
    if (d.tier === 'elite' && st.asc >= 3) pct += 15;
    if (d.tier === 'boss' && st.asc >= 5) pct += 12;
    if (pct) hp = Math.max(1, Math.round(hp * (1 + pct / 100)));
    if (st.seen) st.seen.foes[id] = 1;
    return { id: id, name: d.name, hp: hp, maxHp: hp, ward: 0, st: {}, intent: null, hist: [], dead: false, phase: 0, uid: st.combat.eUid++ };
  }

  function startCombat(st, encIds, kind) {
    var c = st.combat = {
      kind: kind, turn: 0, ink: 0, draw: [], hand: [], discard: [], scraped: [], margin: [], pending: [],
      player: { ward: 0, st: {} }, enemies: [], played: 0, attacks: 0, pig: { V: 0, L: 0, G: 0, A: 0 },
      illum: false, over: false, eUid: 1, enc: encIds.slice()
    };
    if (kind === 'battle') st.actBattles++;
    encIds.forEach(function (id) { c.enemies.push(makeEnemy(st, id)); });
    c.draw = shuffle(st, 'combat', st.deck.map(function (d) { return { uid: d.uid, id: d.id, up: d.up }; }));
    var innate = c.draw.filter(function (i) { return cardDef(i).opening; });
    c.draw = c.draw.filter(function (i) { return !cardDef(i).opening; }).concat(innate);
    st.screen = 'combat';
    fx(st, { k: 'combatStart', kind: kind });
    c.enemies.forEach(function (e, i) { var d = M.ENEMIES[e.id]; if (d.start) runOps(st, d.start, { side: 'e', ei: i }); enemyExtras(st, i); });
    c.hpStart = st.hp; c.killsTurn = 0; c.streak = 0;
    fireHooks(st, 'combatStart', {});
    c.enemies.forEach(function (e) { chooseIntent(st, e); });
    startPlayerTurn(st);
  }
  M.startCombat = startCombat;

  // Rubrication + modifier extras applied to every foe when it enters a fight (also summons)
  function enemyExtras(st, i) {
    var e = st.combat.enemies[i], d = M.ENEMIES[e.id], might = 0;
    if ((d.tier === 'normal' || d.tier === 'minion') && st.asc >= 7) might += 1;
    if (d.tier === 'elite' && st.asc >= 3) might += 1;
    if (d.tier === 'boss' && st.asc >= 10) might += 1;
    if (might) { e.st.might = (e.st.might || 0) + might; }
    (st.mods || []).forEach(function (id) { var m = M.MODIFIERS[id]; if (m && m.enemyStart) runOps(st, m.enemyStart, { side: 'e', ei: i }); });
  }
  function aiOf(e) {
    var d = M.ENEMIES[e.id];
    if (d.phase2 && e.phase) return d.phase2.ai;
    return d.ai;
  }
  function chooseIntent(st, e) {
    var d = M.ENEMIES[e.id];
    if (d.phase2 && !e.phase && e.hp <= e.maxHp * d.phase2.at) {
      e.phase = 1; e.hist = [];
      fx(st, { k: 'phase', e: e.uid });
      if (d.phase2.enter) { e.intent = d.phase2.enter; e.hist.push(e.intent); return; }
    }
    var ai = aiOf(e), key;
    var n = e.hist.length;
    if (ai.first && n < ai.first.length) key = ai.first[n];
    else if (ai.type === 'cycle') {
      var off = ai.first ? ai.first.length : 0;
      if (ai.randomStart && e.cycleOff == null) e.cycleOff = rint(st, 'combat', 0, ai.seq.length - 1);
      key = ai.seq[(n - off + (e.cycleOff || 0)) % ai.seq.length];
    } else {
      var w = {}, maxRep = ai.maxRepeat || 2;
      Object.keys(ai.w).forEach(function (k) {
        var lim = (ai.noRepeat && ai.noRepeat.indexOf(k) >= 0) ? 1 : maxRep;
        var run = 0; for (var i = e.hist.length - 1; i >= 0 && e.hist[i] === k; i--) run++;
        if (run < lim) w[k] = ai.w[k];
      });
      if (!Object.keys(w).length) w = ai.w;
      key = wpick(st, 'combat', w);
    }
    e.intent = key; e.hist.push(key);
  }

  // Intent summary for UI
  M.intentInfo = function (st, e) {
    var d = M.ENEMIES[e.id], mv = d.moves[e.intent];
    if (!mv) return { kinds: ['unknown'] };
    var info = { kinds: [], name: mv.name || '', dmg: 0, times: 0 };
    var ei = st.combat.enemies.indexOf(e);
    var ov = { srcMight: 0, srcSmudged: false, tgtTorn: false }; // effects the move applies before its strike lands
    var scan = function (ops) {
      ops.forEach(function (o) {
        if (o.op === 'apply' && o.n > 0) {
          var selfish = (o.target === 'self' || o.target === 'allies');
          if (selfish && o.s === 'might') ov.srcMight += o.n;
          if (selfish && o.s === 'smudged') ov.srcSmudged = true;
          if (!selfish && o.s === 'torn') ov.tgtTorn = true;
        }
        if (o.op === 'dmg') { info.dmg = calcDmg(st, ei, 'p', o.n, true, ov); info.times += (o.times || 1); add('attack'); }
        else if (o.op === 'ward') add('defend');
        else if (o.op === 'apply') add((o.target === 'self' || o.target === 'allies') ? 'buff' : 'debuff');
        else if (o.op === 'heal') add('buff');
        else if (o.op === 'addCard') add('curse');
        else if (o.op === 'eraseMargin') add('erase');
        else if (o.op === 'devour' || o.op === 'devourPigment') add('devour');
        else if (o.op === 'summon') add('summon');
        else if (o.op === 'repeat') scan(o.ops);
      });
    };
    function add(k) { if (info.kinds.indexOf(k) < 0) info.kinds.push(k); }
    scan(mv.ops);
    if (mv.intent) info.kinds = [mv.intent].concat(info.kinds.filter(function (k) { return k !== mv.intent; }));
    if (!info.kinds.length) info.kinds.push('unknown');
    return info;
  };

  // ov (optional, previews only): {srcMight, srcSmudged, tgtTorn} = effects that an earlier op of the SAME card/move
  // will have applied by the time this hit lands (e.g. Couched Lance applies Torn before it strikes).
  function calcDmg(st, src, tgt, base, isAttack, ov) {
    var n = base;
    if (isAttack && src != null) {
      n += stv(st, src, 'might') + ((ov && ov.srcMight) || 0);
      if (stv(st, src, 'smudged') > 0 || (ov && ov.srcSmudged)) n = Math.floor(n * 0.75);
      if ((tgt != null && stv(st, tgt, 'torn') > 0) || (ov && ov.tgtTorn)) n = Math.floor(n * 1.5);
    }
    return Math.max(0, n);
  }
  M.calcDmg = calcDmg;
  // Ward actually gained for a nominal amount (Resolve first, then Faded x0.75). Pure: used by gainWard and card text.
  function calcWard(st, ref, n, fromCard) {
    var a = actor(st, ref); if (!a) return n;
    if (fromCard) n += (a.st.resolve || 0);
    if ((a.st.faded || 0) > 0) n = Math.floor(n * 0.75);
    return Math.max(0, n);
  }
  M.calcWard = calcWard;

  function dealDamage(st, src, tgt, base, isAttack) {
    var c = st.combat; if (!c || c.over) return 0;
    var a = actor(st, tgt); if (!a || (tgt !== 'p' && a.dead)) return 0;
    var n = calcDmg(st, src, tgt, base, isAttack);
    var blocked = Math.min(a.ward, n);
    a.ward -= blocked;
    var dmg = n - blocked;
    if (dmg > 0) loseHp(st, tgt, dmg, true);
    fx(st, { k: 'hit', src: src, tgt: tgt === 'p' ? 'p' : c.enemies[tgt].uid, n: dmg, blocked: blocked });
    if (src === 'p' && dmg > 0) { st.stats.dmg += dmg; if (n > st.stats.maxHit) st.stats.maxHit = n; }
    if (isAttack && src != null && stv(st, tgt, 'brambles') > 0 && !(src !== 'p' && c.enemies[src].dead)) {
      dealDamage(st, tgt, src, stv(st, tgt, 'brambles'), false);
    }
    return dmg;
  }

  function loseHp(st, ref, n, silent) {
    var c = st.combat;
    if (ref === 'p') {
      st.hp = Math.max(0, st.hp - n);
      if (!silent) fx(st, { k: 'loseHp', tgt: 'p', n: n });
      if (st.hp <= 0) { defeat(st); return; }
      if (c && n > 0) fireHooks(st, 'hurt', {});
    } else {
      var e = c.enemies[ref]; if (e.dead) return;
      e.hp = Math.max(0, e.hp - n);
      if (!silent) fx(st, { k: 'loseHp', tgt: e.uid, n: n });
      if (e.hp <= 0) killEnemy(st, ref);
    }
  }

  function heal(st, ref, n) {
    if (ref === 'p') { var b = st.hp; st.hp = Math.min(st.maxHp, st.hp + n); fx(st, { k: 'heal', tgt: 'p', n: st.hp - b }); }
    else { var e = st.combat.enemies[ref]; if (e.dead) return; e.hp = Math.min(e.maxHp, e.hp + n); fx(st, { k: 'heal', tgt: e.uid, n: n }); }
  }

  function gainWard(st, ref, n, fromCard) {
    var a = actor(st, ref); if (!a) return;
    n = calcWard(st, ref, n, fromCard);
    a.ward += n;
    if (ref === 'p' && a.ward > st.stats.maxWard) st.stats.maxWard = a.ward;
    fx(st, { k: 'ward', tgt: ref === 'p' ? 'p' : st.combat.enemies[ref].uid, n: n });
  }

  function applyStatus(st, ref, s, n) {
    var a = actor(st, ref); if (!a || (ref !== 'p' && a.dead)) return;
    a.st[s] = (a.st[s] || 0) + n;
    if (s === 'corrode' && ref !== 'p' && a.st[s] > st.stats.maxCorrode) st.stats.maxCorrode = a.st[s];
    if (a.st[s] === 0) delete a.st[s];
    fx(st, { k: 'status', tgt: ref === 'p' ? 'p' : st.combat.enemies[ref].uid, s: s, n: n });
  }

  function killEnemy(st, i) {
    var c = st.combat, e = c.enemies[i];
    e.dead = true; e.hp = 0; e.ward = 0;
    st.stats.kills++;
    c.killsTurn = (c.killsTurn || 0) + 1; if (c.killsTurn > st.stats.killsTurnMax) st.stats.killsTurnMax = c.killsTurn;
    fx(st, { k: 'death', tgt: e.uid });
    var d = M.ENEMIES[e.id];
    if (d.onDeath) runOps(st, d.onDeath, { side: 'e', ei: i, dying: true });
    fireHooks(st, 'enemyDies', {});
    checkEnd(st);
  }

  function checkEnd(st) {
    var c = st.combat;
    if (!c || c.over) return;
    if (st.hp <= 0) return defeat(st);
    if (!living(st).length) winCombat(st);
  }

  function defeat(st) {
    if (st.over) return;
    if (st.combat) st.combat.over = true;
    st.over = true; st.won = false; st.screen = 'end';
    fx(st, { k: 'defeat' });
  }

  function drawCards(st, n) {
    var c = st.combat;
    for (var i = 0; i < n; i++) {
      if (!c.draw.length) {
        if (!c.discard.length) break;
        c.draw = shuffle(st, 'combat', c.discard); c.discard = [];
        fx(st, { k: 'reshuffle' });
      }
      var inst = c.draw.pop();
      if (c.hand.length >= C.HAND_MAX) { c.discard.push(inst); continue; }
      c.hand.push(inst);
      fx(st, { k: 'draw', uid: inst.uid });
      var d = cardDef(inst);
      if (d.onDraw) runOps(st, d.onDraw, { side: 'p', card: inst });
      if (c.over) return;
    }
  }

  function startPlayerTurn(st) {
    var c = st.combat; if (c.over) return;
    c.turn++; st.stats.turns++;
    c.killsTurn = 0;
    c.illum = false; c.pig = { V: 0, L: 0, G: 0, A: 0 }; c.played = 0; c.attacks = 0;
    var p = c.player;
    if ((p.st.steadfast || 0) > 0) { p.st.steadfast--; if (!p.st.steadfast) delete p.st.steadfast; } else p.ward = 0;
    if ((p.st.corrode || 0) > 0) {
      var n = p.st.corrode; p.st.corrode--; if (!p.st.corrode) delete p.st.corrode;
      fx(st, { k: 'tick', tgt: 'p', s: 'corrode', n: n });
      loseHp(st, 'p', n); if (c.over) return;
    }
    c.ink = C.BASE_INK + passive(st, 'ink');
    if (p.st.parched) { c.ink = Math.max(0, c.ink - p.st.parched); delete p.st.parched; }
    drawCards(st, C.HAND + passive(st, 'hand')); if (c.over) return;
    if (p.st.petrified) {
      var stones = c.hand.filter(function (x) { return cardCost(st, x) != null; }).sort(function (a, b) { return cardCost(st, b) - cardCost(st, a); }).slice(0, p.st.petrified);
      stones.forEach(function (x) { x.stone = true; fx(st, { k: 'petrify', uid: x.uid }); });
      delete p.st.petrified;
    }
    var pend = c.pending; c.pending = [];
    pend.forEach(function (ops) { if (!c.over) runOps(st, ops, { side: 'p' }); });
    if (c.over) return;
    fireHooks(st, 'turnStart', { turn: c.turn });
    fx(st, { k: 'playerTurn', turn: c.turn });
  }

  function illumNeed(st) { return Math.max(1, C.ILLUM_NEED - passive(st, 'illumEase')); }
  M.illumNeed = illumNeed;
  M.illumProgress = function (st) {
    var c = st.combat; if (!c) return 0;
    return Math.min(illumNeed(st), (c.pig.V > 0) + (c.pig.L > 0) + (c.pig.G > 0) + c.pig.A);
  };

  M.canPlay = function (st, hi) {
    var c = st.combat; if (!c || c.over) return false;
    var inst = c.hand[hi]; if (!inst) return false;
    var d = cardDef(inst), cost = cardCost(st, inst);
    if (cost == null || d.unplayable || inst.stone) return false;
    return cost <= c.ink;
  };

  function playCard(st, hi, target) {
    var c = st.combat; if (!c || c.over) return err('No combat');
    if (!M.canPlay(st, hi)) return err('Cannot play');
    var inst = c.hand[hi], d = cardDef(inst);
    var live = living(st);
    var tgtIdx = null;
    if (d.target === 'enemy') {
      if (target == null || !c.enemies[target] || c.enemies[target].dead) {
        if (live.length === 1) target = c.enemies.indexOf(live[0]); else return err('Choose a target');
      }
      tgtIdx = target;
    }
    c.ink -= cardCost(st, inst);
    c.hand.splice(hi, 1);
    var pigBefore = { V: c.pig.V, L: c.pig.L, G: c.pig.G, A: c.pig.A }, playedBefore = c.played;
    fx(st, { k: 'play', uid: inst.uid, id: inst.id, tgt: tgtIdx != null ? c.enemies[tgtIdx].uid : null });
    if (c.pig[d.pigment] != null) c.pig[d.pigment]++;
    c.played++; st.stats.cards++;
    if (c.played > st.stats.maxCardsTurn) st.stats.maxCardsTurn = c.played;
    if (d.type === 'gloss') st.stats.glosses++;
    if (d.type === 'attack') c.attacks++;
    if (!c.illum && M.illumProgress(st) >= illumNeed(st)) illuminate(st);
    runOps(st, d.ops || [], { side: 'p', target: tgtIdx, card: inst, pigBefore: pigBefore, playedBefore: playedBefore });
    if (d.type === 'gloss') {
      c.margin.push({ uid: inst.uid, id: inst.id, up: inst.up, count: 0 });
      if (c.margin.length > marginSlots(st)) { var old = c.margin.shift(); c.scraped.push({ uid: old.uid, id: old.id, up: old.up }); fx(st, { k: 'erase', id: old.id }); }
      fx(st, { k: 'gloss', id: inst.id });
    } else if (d.scrape) { c.scraped.push(inst); fx(st, { k: 'scrape', uid: inst.uid }); }
    else c.discard.push(inst);
    if (!c.over) fireHooks(st, 'play', { pig: d.pigment, type: d.type });
    checkEnd(st);
    return ok();
  }

  function illuminate(st) {
    var c = st.combat;
    c.illum = true; st.stats.illum++;
    c.streak = (c.streak || 0) + 1; if (c.streak > st.stats.illumStreakMax) st.stats.illumStreakMax = c.streak;
    fx(st, { k: 'illuminate' });
    c.ink += 1;
    drawCards(st, 1);
    if (!c.over) fireHooks(st, 'illuminate', {});
  }

  function endTurn(st) {
    var c = st.combat; if (!c || c.over) return err('No combat');
    if (!c.illum) c.streak = 0;
    var hand = c.hand; c.hand = [];
    hand.forEach(function (inst) {
      delete inst.stone;
      var d = cardDef(inst);
      if (d.endTurn && !c.over) runOps(st, d.endTurn, { side: 'p', card: inst });
      if (d.fleeting) { c.scraped.push(inst); fx(st, { k: 'scrape', uid: inst.uid }); }
      else c.discard.push(inst);
    });
    if (c.over) return ok();
    fireHooks(st, 'turnEnd', {});
    if (c.over) return ok();
    endOfTurnStatuses(st, 'p');
    if (c.over) return ok();
    fx(st, { k: 'enemyTurn' });
    // enemy turns
    var n0 = c.enemies.length; // enemies summoned during this enemy turn wait until next turn
    for (var i = 0; i < n0; i++) {
      var e = c.enemies[i];
      if (e.dead) continue;
      if ((e.st.steadfast || 0) > 0) { e.st.steadfast--; if (!e.st.steadfast) delete e.st.steadfast; } else e.ward = 0;
      if ((e.st.corrode || 0) > 0) {
        var n = e.st.corrode; e.st.corrode--; if (!e.st.corrode) delete e.st.corrode;
        fx(st, { k: 'tick', tgt: e.uid, s: 'corrode', n: n });
        loseHp(st, i, n);
        if (c.over) return ok();
        if (e.dead) continue;
      }
      var mv = M.ENEMIES[e.id].moves[e.intent];
      fx(st, { k: 'enemyAct', tgt: e.uid, move: e.intent, name: mv && mv.name });
      if (mv) runOps(st, mv.ops, { side: 'e', ei: i });
      if (c.over) return ok();
    }
    for (i = 0; i < n0; i++) if (!c.enemies[i].dead) { endOfTurnStatuses(st, i); if (c.over) return ok(); }
    // end of round: timed debuffs wear off for everyone (so enemy-applied Torn/Smudged last through the next exchange)
    decayStatuses(st, 'p');
    for (i = 0; i < c.enemies.length; i++) if (!c.enemies[i].dead) decayStatuses(st, i);
    c.enemies.forEach(function (e) { if (!e.dead) chooseIntent(st, e); });
    startPlayerTurn(st);
    return ok();
  }

  function endOfTurnStatuses(st, ref) {
    var a = actor(st, ref);
    if (a.st.mending) heal(st, ref, a.st.mending);
    if (a.st.zeal) applyStatus(st, ref, 'might', a.st.zeal);
    if (a.st.shell) gainWard(st, ref, a.st.shell, false);
  }
  function decayStatuses(st, ref) {
    var a = actor(st, ref);
    Object.keys(DECAY).forEach(function (s) { if (a.st[s]) { a.st[s] -= DECAY[s]; if (a.st[s] <= 0) delete a.st[s]; } });
  }

  // ---------------- Hooks (relics + margin glosses) ----------------
  function hookMatches(h, on, info) {
    if (h.on !== on) return false;
    if (h.pig && h.pig !== info.pig) return false;
    if (h.type && h.type !== info.type) return false;
    if (h.turn && h.turn !== info.turn) return false;
    return true;
  }
  function fireHooks(st, on, info) {
    var c = st.combat;
    st.relics.forEach(function (id) {
      var r = M.RELICS[id]; if (!r || !r.hooks) return;
      r.hooks.forEach(function (h) {
        if ((c && c.over && on !== 'combatEnd') || !hookMatches(h, on, info)) return;
        if (h.every) { var rs = st.relicState[id]; rs.count = (rs.count || 0) + 1; if (rs.count % h.every) return; }
        fx(st, { k: 'relicFire', id: id });
        runOps(st, h.ops, { side: on === 'combatEnd' ? 'run' : 'p', hook: true });
      });
    });
    (st.mods || []).forEach(function (id) {
      var m = M.MODIFIERS && M.MODIFIERS[id]; if (!m || !m.hooks) return;
      m.hooks.forEach(function (h) {
        if ((c && c.over && on !== 'combatEnd') || !hookMatches(h, on, info)) return;
        runOps(st, h.ops, { side: on === 'combatEnd' ? 'run' : 'p', hook: true });
      });
    });
    if (!c || on === 'combatEnd') return;
    c.margin.slice().forEach(function (g) {
      if (c.over) return;
      var d = cardDef(g), hs = d.gloss ? (Array.isArray(d.gloss) ? d.gloss : [d.gloss]) : [];
      hs.forEach(function (h) {
        if (c.over || !hookMatches(h, on, info)) return;
        if (h.every) { g.count++; if (g.count % h.every) return; }
        fx(st, { k: 'glossFire', id: g.id });
        runOps(st, h.ops, { side: 'p', hook: true });
      });
    });
  }

  // ---------------- Effect DSL ----------------
  function resolveTargets(st, ctx, o, def) {
    var t = o.target || def;
    var c = st.combat;
    if (ctx.side === 'p') {
      if (t === 'self') return ['p'];
      if (t === 'all') return c.enemies.map(function (e, i) { return i; }).filter(function (i) { return !c.enemies[i].dead; });
      if (t === 'random' || ctx.target == null || !c.enemies[ctx.target] || c.enemies[ctx.target].dead) {
        var l = c.enemies.map(function (e, i) { return i; }).filter(function (i) { return !c.enemies[i].dead; });
        return l.length ? [pick(st, 'combat', l)] : [];
      }
      return [ctx.target];
    } else {
      if (t === 'self') return [ctx.ei];
      if (t === 'allies') return c.enemies.map(function (e, i) { return i; }).filter(function (i) { return !c.enemies[i].dead; });
      return ['p'];
    }
  }
  function src(ctx) { return ctx.side === 'p' ? 'p' : ctx.ei; }

  function perValue(st, ctx, per, tref) {
    var c = st.combat, p = c.player;
    switch (per) {
      case 'targetCorrode': return tref != null ? stv(st, tref, 'corrode') : 0;
      case 'ward': return actor(st, src(ctx)).ward;
      case 'played': return ctx.playedBefore != null ? ctx.playedBefore : c.played;
      case 'margin': return c.margin.length;
      case 'pigments': return (c.pig.V > 0) + (c.pig.L > 0) + (c.pig.G > 0) + (c.pig.A > 0);
      case 'handSize': return c.hand.length;
      case 'discard': return c.discard.length;
      case 'might': return p.st.might || 0;
      case 'blots': return c.hand.concat(c.draw, c.discard).filter(function (i) { var d = cardDef(i); return d.type === 'blot' || d.type === 'curse'; }).length;
      case 'missingHp': return st.maxHp - st.hp;
      default: return 0;
    }
  }

  function cond(st, ctx, s) {
    var c = st.combat, parts = String(s).split(':'), k = parts[0], v = parts[1];
    switch (k) {
      case 'illuminated': return !!(c && c.illum);
      case 'played': return !!(c && (ctx.pigBefore || c.pig)[v] > 0);
      case 'targetCorroded': return ctx.target != null && stv(st, ctx.target, 'corrode') > 0;
      case 'targetTorn': return ctx.target != null && stv(st, ctx.target, 'torn') > 0;
      case 'targetAttacking': if (ctx.target == null) return false; return M.intentInfo(st, c.enemies[ctx.target]).kinds.indexOf('attack') >= 0;
      case 'wardAtLeast': return c.player.ward >= +v;
      case 'hpBelowHalf': return st.hp <= st.maxHp / 2;
      case 'marginFull': return c.margin.length >= marginSlots(st);
      case 'firstCard': return (ctx.playedBefore != null ? ctx.playedBefore : c.played) === 0;
      case 'handEmpty': return c.hand.length === 0;
      case 'goldAtLeast': return st.gold >= +v;
      default: return false;
    }
  }

  function runOps(st, ops, ctx) {
    if (!ops) return;
    for (var i = 0; i < ops.length; i++) {
      var c = st.combat;
      if (c && c.over && ctx.side !== 'run') return;
      runOp(st, ops[i], ctx);
    }
  }
  M.runOps = runOps;

  function runOp(st, o, ctx) {
    var c = st.combat, s = src(ctx), times, i, ts;
    switch (o.op) {
      case 'dmg':
      case 'dmgPer':
        times = o.times || 1;
        for (i = 0; i < times; i++) {
          if (c.over) return;
          ts = resolveTargets(st, ctx, o, 'enemy');
          ts.forEach(function (t) {
            var base = o.op === 'dmg' ? o.n : (o.base || 0) + (o.mult || 1) * perValue(st, ctx, o.per, t);
            if (o.op === 'dmgPer' && base <= 0) return; // "N per X" with nothing to count deals no damage (Might must not leak in)
            dealDamage(st, s, t, base, true);
          });
          checkEnd(st);
        }
        break;
      case 'ward':
        resolveTargets(st, ctx, o, 'self').forEach(function (t) { gainWard(st, t, o.n, ctx.side === 'p'); }); break;
      case 'wardPer':
        gainWard(st, s, (o.base || 0) + (o.mult || 1) * perValue(st, ctx, o.per, ctx.target), ctx.side === 'p'); break;
      case 'apply':
        resolveTargets(st, ctx, o, ctx.side === 'p' ? 'enemy' : 'player').forEach(function (t) { applyStatus(st, t, o.s, o.n); }); break;
      case 'doubleStatus':
        resolveTargets(st, ctx, o, 'enemy').forEach(function (t) { var v = stv(st, t, o.s); if (v > 0) applyStatus(st, t, o.s, v * ((o.mult || 2) - 1)); }); break;
      case 'removeStatus':
        resolveTargets(st, ctx, o, 'self').forEach(function (t) { var a = actor(st, t); if (a.st[o.s]) { delete a.st[o.s]; fx(st, { k: 'status', tgt: t === 'p' ? 'p' : c.enemies[t].uid, s: o.s, n: 0 }); } }); break;
      case 'draw': if (c) drawCards(st, o.n); break;
      case 'drawPigment':
        for (i = 0; i < o.n; i++) {
          var idx = -1;
          for (var j = c.draw.length - 1; j >= 0; j--) if (cardDef(c.draw[j]).pigment === o.pig) { idx = j; break; }
          if (idx < 0 || c.hand.length >= C.HAND_MAX) break;
          var inst = c.draw.splice(idx, 1)[0]; c.hand.push(inst); fx(st, { k: 'draw', uid: inst.uid });
        }
        break;
      case 'ink': if (c) { c.ink += o.n; fx(st, { k: 'ink', n: o.n }); } break;
      case 'heal':
        if (ctx.side === 'run' || !c) { var b = st.hp; st.hp = Math.min(st.maxHp, st.hp + o.n); fx(st, { k: 'heal', tgt: 'p', n: st.hp - b }); }
        else if (o.target === 'allies') resolveTargets(st, ctx, o, 'allies').forEach(function (t) { heal(st, t, o.n); });
        else heal(st, s, o.n);
        break;
      case 'loseHp':
        if (ctx.side === 'run' || !c) { st.hp = Math.max(1, st.hp - o.n); fx(st, { k: 'loseHp', tgt: 'p', n: o.n }); }
        else loseHp(st, s, o.n);
        break;
      case 'addCard':
        var n = o.n || 1;
        for (i = 0; i < n; i++) {
          if (!c || ctx.side === 'run') { addToDeck(st, o.id, o.up); fx(st, { k: 'gainCard', id: o.id }); continue; }
          var ni = { uid: -(st.nextUid++), id: o.id, up: !!o.up, tmp: true };
          var to = o.to || 'discard';
          if (to === 'hand' && c.hand.length < C.HAND_MAX) c.hand.push(ni);
          else if (to === 'draw') c.draw.splice(rint(st, 'combat', 0, c.draw.length), 0, ni);
          else c.discard.push(ni);
          fx(st, { k: 'addCard', id: o.id, to: to });
        }
        break;
      case 'scrapeBlots':
        var blots = c.hand.filter(function (x) { var d = cardDef(x); return d.type === 'blot' || d.type === 'curse'; });
        c.hand = c.hand.filter(function (x) { return blots.indexOf(x) < 0; });
        blots.forEach(function (x) { c.scraped.push(x); fx(st, { k: 'scrape', uid: x.uid }); });
        if (o.draw && blots.length) drawCards(st, blots.length);
        break;
      case 'gildHand':
        var cand = c.hand.filter(function (x) { return !x.up && M.CARDS[x.id].up; });
        shuffle(st, 'combat', cand);
        cand.slice(0, o.n === 'all' ? cand.length : (o.n || 1)).forEach(function (x) { x.up = true; fx(st, { k: 'gild', uid: x.uid }); });
        break;
      case 'costHand': // set cost of random card(s) in hand to n for this combat
        var cc = c.hand.filter(function (x) { var cs = cardCost(st, x); return cs != null && cs > o.n; });
        shuffle(st, 'combat', cc);
        cc.slice(0, o.count || 1).forEach(function (x) { x.costTmp = o.n; fx(st, { k: 'gild', uid: x.uid }); });
        break;
      case 'createCard': // conjure random card(s) from this character's pool into a pile, temporary for the fight
        for (i = 0; i < (o.n || 1); i++) {
          var cr = o.rarity ? [o.rarity] : ['common', 'uncommon', 'rare'];
          var cp = []; cr.forEach(function (r) { cp = cp.concat(cardPool(r, st, { pig: o.pig, type: o.type })); });
          if (!cp.length) break;
          var cid2 = pick(st, 'combat', cp);
          var ci = { uid: -(st.nextUid++), id: cid2, up: !!o.up, tmp: true };
          if (o.cost != null) ci.costTmp = o.cost;
          var to2 = o.to || 'hand';
          if (to2 === 'hand' && c.hand.length < C.HAND_MAX) c.hand.push(ci);
          else if (to2 === 'draw') c.draw.splice(rint(st, 'combat', 0, c.draw.length), 0, ci);
          else c.discard.push(ci);
          seeCard(st, cid2);
          fx(st, { k: 'addCard', id: cid2, to: to2 });
        }
        break;
      case 'echoMargin': // every Gloss in the Margin fires its effects once more
        c.margin.slice().forEach(function (g) {
          var gd = cardDef(g), hs = gd.gloss ? (Array.isArray(gd.gloss) ? gd.gloss : [gd.gloss]) : [];
          hs.forEach(function (h) { if (!c.over) { fx(st, { k: 'glossFire', id: g.id }); runOps(st, h.ops, { side: 'p', hook: true }); } });
        });
        break;
      case 'if':
        runOps(st, cond(st, ctx, o.cond) ? o.then : (o.else || []), ctx); break;
      case 'repeat':
        for (i = 0; i < o.n; i++) runOps(st, o.ops, ctx); break;
      case 'nextTurn': if (c) c.pending.push(o.ops); break;
      case 'gold': st.gold = Math.max(0, st.gold + o.n); fx(st, { k: 'gold', n: o.n }); break;
      case 'eraseMargin':
        for (i = 0; i < (o.n || 1) && c.margin.length; i++) { var g = c.margin.pop(); c.scraped.push({ uid: g.uid, id: g.id, up: g.up }); fx(st, { k: 'erase', id: g.id }); }
        break;
      case 'devour':
        for (i = 0; i < (o.n || 1) && c.draw.length; i++) { var k2 = rint(st, 'combat', 0, c.draw.length - 1); var dv = c.draw.splice(k2, 1)[0]; c.scraped.push(dv); fx(st, { k: 'devour', id: dv.id }); }
        break;
      case 'devourPigment': // scrape random cards of one pigment from the player's draw pile
        for (i = 0; i < (o.n || 1); i++) {
          var dp = c.draw.map(function (x, k) { return k; }).filter(function (k) { return cardDef(c.draw[k]).pigment === o.pig; });
          if (!dp.length) break;
          var dpk = pick(st, 'combat', dp), dv2 = c.draw.splice(dpk, 1)[0]; c.scraped.push(dv2); fx(st, { k: 'devour', id: dv2.id });
        }
        break;
      case 'summon':
        if (living(st).length < (o.max || 4)) {
          var ne = makeEnemy(st, o.id); c.enemies.push(ne);
          var d2 = M.ENEMIES[o.id]; if (d2.start) runOps(st, d2.start, { side: 'e', ei: c.enemies.length - 1 }); enemyExtras(st, c.enemies.length - 1);
          chooseIntent(st, ne); fx(st, { k: 'summon', tgt: ne.uid });
        }
        break;
      // ----- run-level ops (events, relic pickups) -----
      case 'maxHp': st.maxHp += o.n; if (o.n > 0) st.hp += o.n; st.hp = Math.min(st.hp, st.maxHp); fx(st, { k: 'maxHp', n: o.n }); break;
      case 'gainCard': // {rarity} or {id}
        var cid = o.id || randomCardIds(st, 'event', 1, o.rarity ? (function () { var w = {}; w[o.rarity] = 1; return w; })() : null)[0];
        if (cid) { addToDeck(st, cid, o.up); fx(st, { k: 'gainCard', id: cid }); }
        break;
      case 'relic':
        var rid = o.id || randomRelic(st, 'event', o.rarity ? (function () { var w = {}; w[o.rarity] = 1; return w; })() : null);
        if (rid) gainRelic(st, rid); else { st.gold += 50; fx(st, { k: 'gold', n: 50 }); }
        break;
      case 'gildRandom':
        var gc = st.deck.filter(function (x) { return !x.up && M.CARDS[x.id].up; });
        shuffle(st, 'event', gc);
        gc.slice(0, o.n || 1).forEach(function (x) { x.up = true; fx(st, { k: 'gildDeck', uid: x.uid }); });
        break;
      case 'removeRandom':
        for (i = 0; i < (o.n || 1); i++) {
          var rc = st.deck.filter(function (x) { return M.CARDS[x.id].type !== 'curse'; });
          if (rc.length <= 5) break;
          var rr = pick(st, 'event', rc); st.deck.splice(st.deck.indexOf(rr), 1); fx(st, { k: 'removeCard', id: rr.id });
        }
        break;
      case 'choose': // open pick screen: o.purpose = remove|gild|transform|duplicate
        st.pick = { purpose: o.purpose, back: st.screen, free: true };
        st.screen = 'pick';
        break;
      case 'fight':
        st.pendingFight = { enc: o.enc, kind: o.kind || 'elite' };
        break;
      default:
        if (typeof console !== 'undefined') console.warn('Unknown op', o.op);
    }
  }

  // ---------------- Rewards / loot ----------------
  function cardPool(rarity, st, f) {
    return Object.keys(M.CARDS).filter(function (id) {
      var d = M.CARDS[id];
      if (d.rarity !== rarity || (st && !cardAvail(st, id))) return false;
      if (f && f.pig && d.pigment !== f.pig) return false;
      if (f && f.type && d.type !== f.type) return false;
      return true;
    });
  }
  M.cardPool = cardPool;
  function randomCardIds(st, stream, n, weights) {
    weights = weights || { common: 60, uncommon: 33, rare: 7 };
    var out = [], guard = 0;
    while (out.length < n && guard++ < 200) {
      var r = wpick(st, stream, weights), pool = cardPool(r, st).filter(function (id) { return out.indexOf(id) < 0; });
      if (!pool.length) continue;
      out.push(pick(st, stream, pool));
    }
    return out;
  }
  M.randomCardIds = randomCardIds;
  function randomRelic(st, stream, weights) {
    weights = weights || { common: 50, uncommon: 35, rare: 15 };
    for (var g = 0; g < 30; g++) {
      var r = wpick(st, stream, weights);
      var pool = Object.keys(M.RELICS).filter(function (id) { return M.RELICS[id].rarity === r && relicAvail(st, id); });
      if (pool.length) return pick(st, stream, pool);
    }
    var any = Object.keys(M.RELICS).filter(function (id) { var x = M.RELICS[id].rarity; return (x === 'common' || x === 'uncommon' || x === 'rare') && relicAvail(st, id); });
    return any.length ? pick(st, stream, any) : null;
  }
  M.randomRelic = randomRelic;

  function winCombat(st) {
    var c = st.combat; c.over = true;
    fx(st, { k: 'victory' });
    fireHooks(st, 'combatEnd', {});
    var kind = c.kind;
    if (kind === 'elite') st.stats.elites++;
    if (kind === 'boss') { st.stats.bosses++; c.enemies.forEach(function (e) { if (M.ENEMIES[e.id].tier === 'boss') st.stats.bossIds.push(e.id); }); }
    if (st.hp >= (c.hpStart || 0)) st.stats.flawless++;
    // st.combat stays (over=true) until the reward screen is left, so in-flight loops stay safe.
    if (kind === 'boss' && st.act >= C.ACTS) {
      st.over = true; st.won = true; st.screen = 'end';
      return;
    }
    var nChoices = 3 + passive(st, 'cardChoices');
    var w = kind === 'boss' ? { rare: 1 } : kind === 'elite' ? { common: 45, uncommon: 40, rare: 15 } : { common: 60, uncommon: 33, rare: 7 };
    var gold = kind === 'boss' ? rint(st, 'loot', 90, 110) : kind === 'elite' ? rint(st, 'loot', 28, 38) : rint(st, 'loot', 12, 20);
    gold = Math.round(gold * (1 + passive(st, 'goldPct') / 100) * (st.asc >= 8 ? 0.8 : 1));
    st.reward = { kind: kind, gold: gold, goldTaken: false, cards: randomCardIds(st, 'loot', nChoices, w), cardTaken: false,
      relic: kind === 'elite' ? randomRelic(st, 'loot') : null, relicTaken: false, bossRelics: null };
    st.reward.cards.forEach(function (id) { seeCard(st, id); });
    if (st.reward.relic) st.seen.relics[st.reward.relic] = 1;
    if (kind === 'boss') {
      var br = Object.keys(M.RELICS).filter(function (id) { return M.RELICS[id].rarity === 'boss' && relicAvail(st, id); });
      shuffle(st, 'loot', br);
      st.reward.bossRelics = br.slice(0, 3); st.reward.relicTaken = !br.length;
      st.reward.bossRelics.forEach(function (id) { st.seen.relics[id] = 1; });
    }
    st.screen = 'reward';
  }

  function leaveReward(st) {
    var r = st.reward; st.reward = null; st.combat = null;
    if (r && r.kind === 'boss') return nextAct(st);
    if (st.eventReturn) { st.eventReturn = false; st.screen = 'event'; return; }
    st.screen = 'map';
  }

  function nextAct(st) {
    st.act++; st.actBattles = 0;
    var heal2 = Math.ceil((st.maxHp - st.hp) * (st.asc >= 9 ? 0.25 : C.ACT_HEAL));
    st.hp += heal2;
    genMap(st);
    st.screen = 'actIntro';
  }

  // ---------------- Shop ----------------
  function price(st, base) { return Math.max(1, Math.round(base * (1 - passive(st, 'shopDiscount') / 100))); }
  var CARD_PRICE = { common: 50, uncommon: 75, rare: 140 }, RELIC_PRICE = { common: 145, uncommon: 190, rare: 250, shop: 160 };
  function openShop(st) {
    var cards = randomCardIds(st, 'shop', 5, { common: 50, uncommon: 38, rare: 12 }).map(function (id) {
      var r = M.CARDS[id].rarity; return { id: id, price: price(st, Math.round(CARD_PRICE[r] * (0.9 + rnd(st, 'shop') * 0.2))), sold: false };
    });
    var relics = [];
    for (var i = 0; i < 3; i++) {
      var rid = randomRelic(st, 'shop', { common: 45, uncommon: 35, rare: 15, shop: 20 });
      if (rid && !relics.some(function (x) { return x.id === rid; })) relics.push({ id: rid, price: price(st, Math.round(RELIC_PRICE[M.RELICS[rid].rarity] * (0.9 + rnd(st, 'shop') * 0.2))), sold: false });
    }
    if (cards.length) { var sale = cards[rint(st, 'shop', 0, cards.length - 1)]; sale.price = Math.max(1, Math.round(sale.price * 0.5)); sale.sale = true; }
    cards.forEach(function (x) { seeCard(st, x.id); }); relics.forEach(function (x) { st.seen.relics[x.id] = 1; });
    st.shop = { cards: cards, relics: relics, removeUsed: false, gildPrice: price(st, 70), gildUsed: false };
    st.screen = 'shop';
  }

  // ---------------- Events ----------------
  function startEvent(st) {
    var ids = Object.keys(M.EVENTS).filter(function (id) {
      var e = M.EVENTS[id]; return (!e.acts || e.acts.indexOf(st.act) >= 0) && st.seenEvents.indexOf(id) < 0;
    });
    if (!ids.length) ids = Object.keys(M.EVENTS);
    if (!ids.length) { st.screen = 'map'; return; }
    var id = pick(st, 'event', ids);
    st.seenEvents.push(id);
    st.event = { id: id, stage: 'choice', result: null };
    st.screen = 'event';
  }
  M.choiceAvailable = function (st, ch) {
    if (!ch.req) return true;
    if (ch.req.gold != null && st.gold < ch.req.gold) return false;
    if (ch.req.hp != null && st.hp <= ch.req.hp) return false;
    if (ch.req.relic && st.relics.indexOf(ch.req.relic) < 0) return false;
    return true;
  };
  function eventChoice(st, idx) {
    var ev = st.event; if (!ev || ev.stage !== 'choice') return err('No event');
    var d = M.EVENTS[ev.id], ch = d.choices[idx];
    if (!ch || !M.choiceAvailable(st, ch)) return err('Unavailable');
    ev.stage = 'result'; ev.result = ch.result || '';
    ev.choice = idx;
    st.pendingFight = null;
    runOps(st, ch.ops || [], { side: 'run' });
    if (st.pendingFight) {
      var f = st.pendingFight; st.pendingFight = null;
      st.eventReturn = false; st.event = null;
      startCombat(st, f.enc, f.kind);
    }
    return ok();
  }

  // ---------------- Deck pick (remove / gild / transform / duplicate) ----------------
  M.pickable = function (st) {
    var p = st.pick; if (!p) return [];
    return st.deck.filter(function (x) {
      var d = M.CARDS[x.id];
      if (p.purpose === 'gild') return !x.up && !!d.up;
      if (p.purpose === 'remove') return true;
      if (p.purpose === 'transform') return true;
      if (p.purpose === 'duplicate') return d.type !== 'curse';
      return true;
    });
  };
  function pickCard(st, uid) {
    var p = st.pick; if (!p) return err('No pick');
    var inst = st.deck.filter(function (x) { return x.uid === uid; })[0];
    if (!inst || M.pickable(st).indexOf(inst) < 0) return err('Invalid card');
    if (p.cost) { if (st.gold < p.cost) return err('Not enough silver'); st.gold -= p.cost; }
    if (p.purpose === 'gild') { inst.up = true; fx(st, { k: 'gildDeck', uid: uid }); }
    else if (p.purpose === 'remove') { st.deck.splice(st.deck.indexOf(inst), 1); fx(st, { k: 'removeCard', id: inst.id }); if (p.fromShop) { st.removeCost += C.REMOVE_STEP; st.shop.removeUsed = true; } }
    else if (p.purpose === 'transform') {
      var r = M.CARDS[inst.id].rarity; if (['common', 'uncommon', 'rare'].indexOf(r) < 0) r = 'common';
      var w = {}; w[r] = 1;
      var nid = randomCardIds(st, 'event', 1, w)[0];
      st.deck.splice(st.deck.indexOf(inst), 1); addToDeck(st, nid, false); fx(st, { k: 'transform', from: inst.id, to: nid });
    } else if (p.purpose === 'duplicate') { addToDeck(st, inst.id, inst.up); fx(st, { k: 'gainCard', id: inst.id }); }
    if (p.fromShop && p.purpose === 'gild') st.shop.gildUsed = true;
    var back = p.back; st.pick = null;
    st.screen = back === 'rest' ? 'map' : back;
    return ok();
  }

  // ---------------- Score ----------------
  M.score = function (st) {
    return Math.round(M.scoreMult(st) * M.baseScore(st));
  };
  M.baseScore = function (st) {
    return st.stats.floors * 5 + st.stats.kills * 3 + st.stats.elites * 20 + st.stats.bosses * 75 +
      Math.floor(st.gold / 5) + (st.won ? 300 : 0) + (st.won ? st.hp : 0);
  };

  // ---------------- Action dispatcher ----------------
  function ok() { return { ok: true }; }
  function err(m) { return { ok: false, err: m }; }

  M.act = function (st, a) {
    st.fx = [];
    if (st.over && a.type !== 'noop') return err('Run over');
    switch (a.type) {
      case 'proceed': if (st.screen === 'actIntro') { st.screen = 'map'; return ok(); } return err('Nothing to proceed');
      case 'chooseNode': if (st.screen !== 'map') return err('Not on map'); return chooseNode(st, a.id);
      case 'play': if (st.screen !== 'combat') return err('Not in combat'); return playCard(st, a.hand, a.target);
      case 'endTurn': if (st.screen !== 'combat') return err('Not in combat'); return endTurn(st);
      // rewards
      case 'takeGold': if (!st.reward || st.reward.goldTaken) return err('No gold'); st.gold += st.reward.gold; st.reward.goldTaken = true; fx(st, { k: 'gold', n: st.reward.gold }); return ok();
      case 'takeCard':
        if (!st.reward || st.reward.cardTaken) return err('No card');
        var cid = st.reward.cards[a.idx]; if (!cid) return err('Bad card');
        addToDeck(st, cid, passive(st, 'gildRewards') > 0); st.reward.cardTaken = true; fx(st, { k: 'gainCard', id: cid }); return ok();
      case 'skipCards': if (st.reward) st.reward.cardTaken = true; return ok();
      case 'takeRelic': if (!st.reward || !st.reward.relic || st.reward.relicTaken) return err('No relic'); gainRelic(st, st.reward.relic); st.reward.relicTaken = true; return ok();
      case 'takeBossRelic':
        if (!st.reward || !st.reward.bossRelics || st.reward.relicTaken) return err('No relic');
        gainRelic(st, st.reward.bossRelics[a.idx]); st.reward.relicTaken = true; return ok();
      case 'leaveReward': if (st.screen !== 'reward') return err('No reward'); leaveReward(st); return ok();
      // rest
      case 'mend':
        if (st.screen !== 'rest') return err('Not resting');
        heal(st, 'p', M.mendAmount(st)); st.screen = 'map'; return ok();
      case 'gild':
        if (st.screen !== 'rest') return err('Not resting');
        st.pick = { purpose: 'gild', back: 'rest', cancel: 'rest' }; st.screen = 'pick'; return ok();
      // treasure
      case 'openChest':
        if (st.screen !== 'treasure' || st.treasure.opened) return err('No chest');
        st.treasure.opened = true; st.gold += st.treasure.gold; fx(st, { k: 'gold', n: st.treasure.gold });
        if (st.treasure.relic) gainRelic(st, st.treasure.relic); return ok();
      case 'leaveTreasure': if (st.screen !== 'treasure') return err('No treasure'); st.treasure = null; st.screen = 'map'; return ok();
      // shop
      case 'buyCard':
        var sc = st.shop && st.shop.cards[a.idx]; if (!sc || sc.sold) return err('Sold');
        if (st.gold < sc.price) return err('Not enough silver');
        st.gold -= sc.price; sc.sold = true; addToDeck(st, sc.id, passive(st, 'gildRewards') > 0); fx(st, { k: 'gainCard', id: sc.id }); return ok();
      case 'buyRelic':
        var sr = st.shop && st.shop.relics[a.idx]; if (!sr || sr.sold) return err('Sold');
        if (st.gold < sr.price) return err('Not enough silver');
        st.gold -= sr.price; sr.sold = true; gainRelic(st, sr.id); return ok();
      case 'buyRemove':
        if (!st.shop || st.shop.removeUsed) return err('Used');
        if (st.gold < price(st, st.removeCost)) return err('Not enough silver');
        st.pick = { purpose: 'remove', back: 'shop', cancel: 'shop', cost: price(st, st.removeCost), fromShop: true }; st.screen = 'pick'; return ok();
      case 'buyGild':
        if (!st.shop || st.shop.gildUsed) return err('Used');
        if (st.gold < st.shop.gildPrice) return err('Not enough silver');
        st.pick = { purpose: 'gild', back: 'shop', cancel: 'shop', cost: st.shop.gildPrice, fromShop: true }; st.screen = 'pick'; return ok();
      case 'leaveShop': if (st.screen !== 'shop') return err('Not in shop'); st.shop = null; st.screen = 'map'; return ok();
      // events
      case 'eventChoice': if (st.screen !== 'event') return err('No event'); return eventChoice(st, a.idx);
      case 'leaveEvent': if (st.screen !== 'event') return err('No event'); st.event = null; st.screen = 'map'; return ok();
      // pick
      case 'pickCard': if (st.screen !== 'pick') return err('No pick'); return pickCard(st, a.uid);
      case 'cancelPick':
        if (st.screen !== 'pick' || !st.pick) return err('No pick');
        var back = st.pick.cancel || st.pick.back; st.pick = null; st.screen = back; return ok();
      case 'noop': return ok();
    }
    return err('Unknown action ' + a.type);
  };
  M.mendAmount = function (st) { return Math.round(st.maxHp * (st.asc >= 4 ? 0.25 : C.REST_HEAL)) + passive(st, 'restHeal'); };
  M.removePrice = function (st) { return price(st, st.removeCost); };

  // ---------------- Text generation ----------------
  var PER_TXT = {
    targetCorrode: 'Corrode on the target', ward: 'Ward you have', played: 'other card played this turn',
    margin: 'Gloss in your Margin', pigments: 'pigment played this turn', handSize: 'card in your hand',
    discard: 'card in your discard pile', might: 'Might you have', blots: 'Blot in your deck', missingHp: 'missing HP'
  };
  var COND_TXT = {
    illuminated: '<i>Illuminated:</i>', targetCorroded: 'If the target has Corrode,', targetTorn: 'If the target is Torn,',
    targetAttacking: 'If the target intends to attack,', hpBelowHalf: 'If you are at or below half HP,',
    marginFull: 'If your Margin is full,', firstCard: 'If this is the first card you played this turn,', handEmpty: 'If your hand is empty,'
  };
  function sName(s) { return M.STATUS[s] ? M.STATUS[s].name : s; }
  function cardName(id) { return M.CARDS[id] ? M.CARDS[id].name : id; }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

  // Build the rule sentences for an op list. `ov` tracks effects an EARLIER op in the same list will already have
  // applied when a later op resolves (e.g. Couched Lance applies Torn, then strikes) so printed numbers are true.
  function describeList(ops, ctx, ov) {
    var out = [];
    ov = ov || { srcMight: 0, srcResolve: 0, tornAll: false, tornChosen: false };
    var inC = !!(ctx && ctx.st && ctx.st.combat);
    // In combat, if every living foe is already Torn, the printed damage can include that bonus whoever is struck.
    var allTorn = false;
    if (inC) { var lv = ctx.st.combat.enemies.filter(function (e) { return !e.dead; }); allTorn = lv.length > 0 && lv.every(function (e) { return (e.st.torn || 0) > 0; }); }
    (ops || []).forEach(function (o) {
      var t = '';
      var tgtTxt = o.target === 'all' ? ' to ALL foes' : o.target === 'random' ? ' to a random foe' : '';
      switch (o.op) {
        case 'dmg':
          var chosen = !o.target || o.target === 'enemy';
          var tornNow = allTorn || ov.tornAll || (chosen && ov.tornChosen);
          var n = o.n;
          if (inC) n = calcDmg(ctx.st, 'p', null, o.n, true, { srcMight: ov.srcMight, tgtTorn: tornNow });
          else { n = o.n + ov.srcMight; if (tornNow) n = Math.floor(n * 1.5); }
          var cls = n > o.n ? ' class="up"' : n < o.n ? ' class="down"' : '';
          t = 'Deal <b' + cls + '>' + n + '</b> damage' + tgtTxt + ((o.times || 1) > 1 ? ' <b>' + o.times + '</b> times' : ''); break;
        case 'dmgPer': t = 'Deal ' + (o.base ? '<b>' + o.base + '</b> damage plus ' : '') + '<b>' + (o.mult || 1) + '</b>' + (o.base ? '' : ' damage') + ' per ' + PER_TXT[o.per] + tgtTxt; break;
        case 'ward':
          if (o.target === 'allies') { t = 'All foes gain <b>' + o.n + '</b> Ward'; break; }
          var wn = inC ? calcWard(ctx.st, 'p', o.n + ov.srcResolve, true) : o.n + ov.srcResolve; // Resolve gained earlier on this card counts
          var wcls = wn > o.n ? ' class="up"' : wn < o.n ? ' class="down"' : '';
          t = 'Gain <b' + wcls + '>' + wn + '</b> Ward'; break;
        case 'wardPer': t = 'Gain ' + (o.base ? '<b>' + o.base + '</b> Ward plus ' : '') + '<b>' + (o.mult || 1) + '</b>' + (o.base ? '' : ' Ward') + ' per ' + PER_TXT[o.per]; break;
        case 'apply':
          t = o.target === 'self' ? 'Gain <b>' + o.n + '</b> ' + sName(o.s) : 'Apply <b>' + o.n + '</b> ' + sName(o.s) + tgtTxt;
          if (o.n > 0) {
            if (o.s === 'might' && o.target === 'self') ov.srcMight += o.n;
            if (o.s === 'resolve' && o.target === 'self') ov.srcResolve += o.n;
            if (o.s === 'torn' && o.target !== 'self') { if (o.target === 'all') ov.tornAll = true; else if (!o.target || o.target === 'enemy') ov.tornChosen = true; }
          }
          break;
        case 'doubleStatus': t = ((o.mult || 2) === 2 ? 'Double' : 'Multiply by ' + o.mult) + ' the ' + sName(o.s) + ' on ' + (o.target === 'all' ? 'ALL foes' : 'the target'); break;
        case 'removeStatus': t = (o.target && o.target !== 'self') ? 'Remove the ' + sName(o.s) + ' from ' + (o.target === 'all' ? 'ALL foes' : 'the target') : 'Remove your ' + sName(o.s); break;
        case 'draw': t = 'Draw <b>' + o.n + '</b> card' + (o.n === 1 ? '' : 's'); break;
        case 'drawPigment': t = 'Draw <b>' + o.n + '</b> ' + M.PIGMENTS[o.pig].name + ' card' + (o.n === 1 ? '' : 's'); break;
        case 'ink': t = 'Gain <b>' + o.n + '</b> Ink'; break;
        case 'heal': t = 'Heal <b>' + o.n + '</b> HP'; break;
        case 'loseHp': t = 'Lose <b>' + o.n + '</b> HP'; break;
        case 'addCard': t = 'Add ' + ((o.n || 1) > 1 ? o.n + ' ' : 'a ') + (o.up ? 'gilded ' : '') + cardName(o.id) + ' to your ' + ({ hand: 'hand', draw: 'draw pile', discard: 'discard pile' }[o.to || 'discard']); break;
        case 'scrapeBlots': t = o.short ? 'Scrape Blots in hand' + (o.draw ? '; draw 1 for each' : '') : 'Scrape all Blots in your hand' + (o.draw ? ' and draw 1 card for each' : ''); break; // short: tight Gloss cards
        case 'gildHand': t = 'Gild ' + (o.n === 'all' ? 'ALL cards' : plural(o.n || 1, 'random card')) + ' in your hand for this fight'; break;
        case 'createCard':
          var what = (o.rarity ? o.rarity + ' ' : 'random ') + (o.pig ? M.PIGMENTS[o.pig].name + ' ' : '') + (o.type || 'card');
          t = 'Add ' + ((o.n || 1) > 1 ? o.n + ' ' + what + 's' : 'a ' + what) + (o.up ? ' (gilded)' : '') + ' to your ' + ({ hand: 'hand', draw: 'draw pile', discard: 'discard pile' }[o.to || 'hand']) + (o.cost != null ? '. ' + ((o.n || 1) > 1 ? 'They cost' : 'It costs') + ' <b>' + o.cost + '</b> this fight' : '');
          t = t.replace('a uncommon', 'an uncommon').replace('a attack', 'an attack'); break;
        case 'echoMargin': t = 'Every Gloss in your Margin fires once more'; break;
        case 'costHand': t = 'Set the cost of ' + ((o.count || 1) > 1 ? o.count + ' random cards' : 'a random card') + ' in your hand to <b>' + o.n + '</b> this fight'; break;
        case 'if':
          var ct = COND_TXT[o.cond];
          if (!ct && o.cond.indexOf('played:') === 0) ct = '<i>After ' + M.PIGMENTS[o.cond.split(':')[1]].name + ':</i>';
          if (!ct && o.cond.indexOf('goldAtLeast:') === 0) ct = 'If you have ' + o.cond.split(':')[1] + '+ silver,';
          if (!ct && o.cond.indexOf('wardAtLeast:') === 0) ct = 'If you have ' + o.cond.split(':')[1] + '+ Ward,';
          // every effect inside the condition belongs to it: "If X, do A and B" (never a bare trailing sentence)
          var cp = function (x) { return { srcMight: x.srcMight, srcResolve: x.srcResolve, tornAll: x.tornAll, tornChosen: x.tornChosen }; };
          var thenTxt = joinAnd(describeList(o.then, ctx, cp(ov)).map(lc));
          t = ct + ' ' + thenTxt + (o.else && o.else.length ? '. Otherwise, ' + joinAnd(describeList(o.else, ctx, cp(ov)).map(lc)) : ''); break;
        case 'repeat': t = describeList(o.ops, ctx, ov).join('. ') + ' (' + o.n + ' times)'; break;
        case 'nextTurn': t = 'Next turn, ' + joinAnd(describeList(o.ops, ctx, { srcMight: 0, srcResolve: 0, tornAll: false, tornChosen: false }).map(lc)); break;
        case 'gold': t = (o.n >= 0 ? 'Gain ' : 'Lose ') + '<b>' + Math.abs(o.n) + '</b> silver'; break;
        default: t = '';
      }
      if (t) out.push(t);
    });
    return out;
  }
  function joinAnd(a) { return a.length < 2 ? (a[0] || '') : a.length === 2 ? a[0] + ' and ' + a[1] : a.slice(0, -1).join(', ') + ', and ' + a[a.length - 1]; }
  function describeOps(ops, ctx) { return describeList(ops, ctx).join('. '); }
  function lc(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  M.describeOps = describeOps;

  function hookText(h, ctx) {
    var w;
    var everyTxt = h.every ? 'every ' + ordinal(h.every) + ' time ' : '';
    switch (h.on) {
      case 'turnStart': w = h.turn === 1 ? 'At the start of your first turn' : 'At the start of your turn'; break;
      case 'turnEnd': w = 'At the end of your turn'; break;
      case 'illuminate': w = h.every ? 'Every ' + ordinal(h.every) + ' time you Illuminate' : 'Whenever you Illuminate'; break;
      case 'play':
        var what = h.pig ? 'a ' + M.PIGMENTS[h.pig].name + ' card' : h.type ? 'an ' + (h.type === 'attack' ? 'attack' : h.type) : 'a card';
        if (h.type === 'skill') what = 'a skill';
        if (h.type === 'gloss') what = 'a Gloss';
        w = h.every ? 'Every ' + ordinal(h.every) + ' time you play ' + what : 'Whenever you play ' + what; break;
      case 'enemyDies': w = 'Whenever a foe dies'; break;
      case 'combatStart': w = 'At the start of each fight'; break;
      case 'combatEnd': w = 'After each fight'; break;
      case 'hurt': w = h.every ? 'Every ' + ordinal(h.every) + ' time you lose HP' : 'Whenever you lose HP in a fight'; break;
      default: w = h.on;
    }
    if (h.every && ['illuminate', 'play', 'hurt'].indexOf(h.on) < 0) w = w + ' (every ' + ordinal(h.every) + ' time)';
    void everyTxt;
    return w + ', ' + lc(describeOps(h.ops, ctx));
  }
  function ordinal(n) { return n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'); }
  M.hookText = hookText;

  // Card rules text (HTML). inst may be a deck/combat instance or {id, up}.
  M.cardText = function (inst, st) {
    var d = cardDef(inst);
    if (d.text) return d.text;
    var parts = [];
    var tctx = st && st.combat ? { st: st } : null;
    var body = describeOps(d.ops, tctx);
    if (body) parts.push(body + '.');
    if (d.gloss) (Array.isArray(d.gloss) ? d.gloss : [d.gloss]).forEach(function (h) { parts.push('<i>Gloss:</i> ' + hookText(h, tctx) + '.'); });
    if (d.onDraw) parts.push('When drawn, ' + lc(describeOps(d.onDraw)) + '.');
    if (d.endTurn) parts.push('If in hand at end of turn, ' + lc(describeOps(d.endTurn)) + '.');
    var kw = [];
    if (d.unplayable || d.cost == null) kw.push('Unplayable');
    if (d.opening) kw.push('Opening');
    if (d.fleeting) kw.push('Fleeting');
    if (d.scrape) kw.push('Scrape');
    if (kw.length) parts.push('<span class="kw">' + kw.join('. ') + '.</span>');
    return parts.join(' ');
  };
  M.relicText = function (id) {
    var r = M.RELICS[id]; if (!r) return '';
    if (r.text) return r.text;
    var parts = [];
    (r.hooks || []).forEach(function (h) { parts.push(hookText(h) + '.'); });
    return parts.join(' ');
  };

  M.KEYWORDS = {
    Ward: 'Blocks damage. Removed at the start of your next turn.',
    Ink: 'Spent to play cards. Refills to 3 each turn.',
    Illuminate: 'Play Vermilion, Lapis and Verdigris cards in one turn (Gold counts as any) to Illuminate: gain 1 Ink and draw 1 card. Once per turn.',
    Gloss: 'Written into your Margin when played and stays active for the fight. Margin holds 3; a 4th erases the oldest.',
    Scrape: 'Removed from play for the rest of the fight.',
    Fleeting: 'Scraped if still in your hand at the end of turn.',
    Opening: 'Always in your opening hand.',
    Blot: 'Junk card, usually unplayable.',
    Gild: 'Upgrade a card.',
    Stone: 'A petrified card cannot be played this turn.',
    After: '"After Vermilion:" (or Lapis, Verdigris, Gold) applies if you already played a card of that colour earlier this turn.'
  };

  // ---------------- Save / load ----------------
  M.serialize = function (st) { var s = clone(st); delete s.fx; return JSON.stringify(s); };
  M.deserialize = function (str) { var s = JSON.parse(str); s.fx = []; return s; };
})();
