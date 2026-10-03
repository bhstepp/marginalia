/* Marginalia — diagnostics log. Pure logic, no DOM except optional persistence/reporting hooks.
   Records what happened in the current run (card plays, enemy turns, state changes) and AUTO-FLAGS anything where the
   number the player was shown differs from what actually happened, so a pasted report is enough to diagnose a bug.

   Opt-in:  M.diag.install()  wraps M.act (ui.js calls it at boot; Node tests call it explicitly).
   Report:  M.diag.report(st)  -> plain text (header, flags, errors, newest-last JSON-lines log).
   Storage: the newest ~56 KB of entries are kept in localStorage ('marginalia.diag.v1'); a new run starts a fresh log.
   Nothing leaves the device unless the player copies the report themselves. */
(function () {
  var G = (typeof globalThis !== 'undefined') ? globalThis : window;
  var M = G.M = G.M || {};
  var KEY = 'marginalia.diag.v1', VERSION = 1, CAP = 56000, MAXFLAGS = 40, MAXERRS = 12;
  var D = M.diag = { VERSION: VERSION };

  var buf = fresh(), size = 0, lastSt = null, lastCombat = null;
  var installed = false, origAct = null, origConsoleErr = null, timer = null, loaded = false;

  function fresh() { return { v: VERSION, run: null, entries: [], flags: [], flagCount: 0, errs: [], seq: 0, dropped: 0 }; }
  function strip(s) { return String(s == null ? '' : s).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(); }
  function cid(inst) { return inst.id + (inst.up ? '+' : ''); }
  function nz(o) { var r = {}, k, any = false; for (k in (o || {})) if (o[k]) { r[k] = o[k]; any = true; } return any ? r : undefined; }
  function prune(e) {
    var k; for (k in e) { var v = e[k]; if (v === undefined || v === null || v === false || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)) delete e[k]; }
    return e;
  }
  function ls() { try { return G.localStorage || null; } catch (e) { return null; } }

  // ---------------------------------------------------------------- persistence
  function load() {
    loaded = true;
    var L = ls(); if (!L) return;
    try {
      var o = JSON.parse(L.getItem(KEY) || 'null');
      if (o && o.v === VERSION && Array.isArray(o.entries)) { buf = o; size = 0; buf.entries.forEach(function (e) { size += JSON.stringify(e).length; }); }
    } catch (e) { }
  }
  function save() {
    timer = null; var L = ls(); if (!L) return;
    try { L.setItem(KEY, JSON.stringify(buf)); } catch (e) { /* storage full or blocked: the in-memory log still works */ }
  }
  function schedule() { if (!ls() || typeof setTimeout !== 'function') return; if (timer == null) timer = setTimeout(save, 400); }
  D.flush = function () { if (timer != null && typeof clearTimeout === 'function') clearTimeout(timer); save(); };

  // ---------------------------------------------------------------- log buffer
  function push(e) {
    e.n = ++buf.seq;
    e.s = buf.run ? Math.round((Date.now() - buf.run.at) / 1000) : 0;
    prune(e);
    buf.entries.push(e); size += JSON.stringify(e).length;
    while (size > CAP && buf.entries.length > 12) { size -= JSON.stringify(buf.entries.shift()).length; buf.dropped++; }
    schedule();
    return e;
  }
  function noteFlags(e, msgs) {
    msgs.forEach(function (m) { buf.flagCount++; buf.flags.push({ n: e.n, fl: e.fl, tn: e.tn, msg: m }); });
    while (buf.flags.length > MAXFLAGS) buf.flags.shift();
  }
  function pushChecked(e, msgs) {
    if (msgs && msgs.length) e.flag = msgs.join(' | ');
    push(e);
    if (msgs && msgs.length) noteFlags(e, msgs);
    return e;
  }

  // ---------------------------------------------------------------- run lifecycle
  function header(st, how) {
    return {
      at: Date.now(), how: how, seed: st.seed, char: st.char, asc: st.asc || 0, mods: st.mods || [], daily: !!st.daily,
      hp: st.hp, maxHp: st.maxHp, gold: st.gold, act: st.act, floor: st.floor,
      deck: (st.deck || []).map(cid), relics: (st.relics || []).slice()
    };
  }
  function attach(st, how) {
    if (!loaded) load();
    var same = how === 'resume' && buf.run && buf.run.seed === st.seed && buf.run.char === st.char && (buf.run.asc || 0) === (st.asc || 0);
    if (!same) { buf = fresh(); size = 0; buf.run = header(st, how === 'resume' ? 'resumed-unknown-start' : how); }
    lastSt = st; lastCombat = st.combat || null;
    if (how === 'resume') push({ t: 'resume', fl: st.floor, act: st.act, scr: st.screen, hp: st.hp + '/' + st.maxHp, gold: st.gold });
  }
  D.newRun = function (st) { if (!installed) return; try { attach(st, 'new'); } catch (e) { } };
  D.resume = function (st) { if (!installed) return; try { attach(st, 'resume'); } catch (e) { } };
  D.clear = function () { buf = fresh(); size = 0; lastSt = null; lastCombat = null; var L = ls(); if (L) { try { L.removeItem(KEY); } catch (e) { } } };

  // ---------------------------------------------------------------- snapshots
  function meSnap(st) { var c = st.combat; return { hp: st.hp + '/' + st.maxHp, ward: c.player.ward, ink: c.ink, st: nz(c.player.st) }; }
  function foeSnap(e) { return { uid: e.uid, id: e.id, hp: e.hp, ward: e.ward, st: nz(e.st), int: e.dead ? undefined : e.intent, dead: e.dead || undefined }; }
  function shown(st, e) { try { var i = M.intentInfo(st, e); return i.dmg ? (i.dmg + 'x' + (i.times || 1)) : undefined; } catch (x) { return undefined; } }

  function leaves(ops, top, out) {
    (ops || []).forEach(function (o) {
      if (o.op === 'if') { leaves(o.then, false, out); leaves(o.else, false, out); }
      else if (o.op === 'repeat') leaves(o.ops, false, out);
      else out.push({ o: o, top: top });
    });
    return out;
  }

  // ---------------------------------------------------------------- before / after each action
  function before(st, a) {
    var p = { screen: st.screen, hp: st.hp, gold: st.gold, floor: st.floor, act: st.act, deckN: (st.deck || []).length };
    var c = st.combat;
    if (a.type === 'play' && c && st.screen === 'combat' && !c.over) {
      var inst = c.hand[a.hand];
      if (inst) {
        var def = M.cardDef(inst), live = c.enemies.filter(function (e) { return !e.dead; }), ti = a.target;
        if (def.target === 'enemy' && (ti == null || !c.enemies[ti] || c.enemies[ti].dead) && live.length === 1) ti = c.enemies.indexOf(live[0]);
        var torn = live.map(function (e) { return (e.st.torn || 0) > 0; });
        p.card = {
          id: cid(inst), cost: M.cardCost(st, inst), text: strip(M.cardText(inst, st)), def: def,
          ti: ti, tgt: c.enemies[ti] ? foeSnap(c.enemies[ti]) : undefined,
          mixedTorn: torn.some(function (x) { return x; }) && !torn.every(function (x) { return x; })
        };
        p.me = meSnap(st);
      }
    } else if (a.type === 'endTurn' && c && st.screen === 'combat' && !c.over) {
      p.turn = c.turn; p.me = meSnap(st);
      p.intents = {};
      c.enemies.forEach(function (e) {
        if (e.dead) return;
        var info = {}; try { info = M.intentInfo(st, e); } catch (x) { }
        p.intents[e.uid] = { id: e.id, name: info.name || e.intent, dmg: info.dmg || 0, times: info.times || 0 };
      });
    } else if (a.type === 'takeCard' && st.reward) p.detail = st.reward.cards && st.reward.cards[a.idx];
    else if (a.type === 'buyCard' && st.shop) p.detail = st.shop.cards && st.shop.cards[a.idx] && st.shop.cards[a.idx].id;
    else if (a.type === 'buyRelic' && st.shop) p.detail = st.shop.relics && st.shop.relics[a.idx] && st.shop.relics[a.idx].id;
    else if (a.type === 'eventChoice' && st.event) p.detail = (st.event.id || st.event.title || '') + '#' + a.idx;
    else if (a.type === 'chooseNode') { try { var n = M.findNode(st, a.id); p.detail = n && n.type; } catch (x) { } }
    return p;
  }

  function invariants(st) {
    var m = [], c = st.combat;
    if (!isFinite(st.hp) || st.hp > st.maxHp || st.hp < 0) m.push('INV player hp ' + st.hp + '/' + st.maxHp);
    if (!isFinite(st.gold) || st.gold < 0) m.push('INV gold ' + st.gold);
    if (c && st.screen === 'combat') {
      if (!isFinite(c.player.ward) || c.player.ward < 0) m.push('INV player ward ' + c.player.ward);
      if (!isFinite(c.ink) || c.ink < 0) m.push('INV ink ' + c.ink);
      if (c.hand.length > 10) m.push('INV hand size ' + c.hand.length);
      Object.keys(c.player.st).forEach(function (k) { var v = c.player.st[k]; if (!isFinite(v) || v === 0) m.push('INV player status ' + k + '=' + v); });
      c.enemies.forEach(function (e) {
        if (e.hp < 0 || e.hp > e.maxHp || !isFinite(e.hp)) m.push('INV ' + e.id + ' hp ' + e.hp + '/' + e.maxHp);
        if (e.ward < 0 || !isFinite(e.ward)) m.push('INV ' + e.id + ' ward ' + e.ward);
        Object.keys(e.st).forEach(function (k) { var v = e.st[k]; if (!isFinite(v) || v === 0) m.push('INV ' + e.id + ' status ' + k + '=' + v); });
      });
    }
    return m;
  }

  function afterPlay(st, a, pre, fx, res) {
    var c = st.combat, cd = pre.card, msgs = [];
    var hits = [], wards = [], sts = [], kills = [], ilm = false;
    fx.forEach(function (f) {
      if (f.k === 'hit' && f.src === 'p') hits.push([f.tgt, f.n, f.blocked]);
      else if (f.k === 'ward' && f.tgt === 'p') wards.push(f.n);
      else if (f.k === 'status') sts.push([f.tgt, f.s, f.n]);
      else if (f.k === 'death') kills.push(f.tgt);
      else if (f.k === 'illuminate') ilm = true;
    });
    // ---- printed number vs actual (only for the card's first top-level dmg / ward op, matching what the text leads with)
    var lv = leaves(cd.def.ops, true, []);
    var fd = lv.filter(function (l) { return l.o.op === 'dmg' || l.o.op === 'dmgPer'; })[0];
    if (fd && fd.top && fd.o.op === 'dmg' && fd.o.target !== 'random') {
      var m = /Deal (\d+) damage/.exec(cd.text), h0 = fx.filter(function (f) { return f.k === 'hit' && f.src === 'p'; })[0];
      if (m && h0 && !cd.mixedTorn && h0.n + h0.blocked !== +m[1]) msgs.push('DMG ' + cd.id + ' printed ' + m[1] + ' but first hit was ' + (h0.n + h0.blocked));
    }
    var fw = lv.filter(function (l) { return l.o.op === 'ward' || l.o.op === 'wardPer'; })[0];
    if (fw && fw.top && fw.o.op === 'ward' && fw.o.target !== 'allies') {
      var wm = /Gain (\d+) Ward/.exec(cd.text);
      if (wm && wards.length && wards[0] !== +wm[1]) msgs.push('WARD ' + cd.id + ' printed ' + wm[1] + ' but gained ' + wards[0]);
    }
    invariants(st).forEach(function (x) { msgs.push(x); });
    var e = {
      t: 'play', fl: st.floor, tn: c.turn, card: cd.id, cost: cd.cost, text: cd.text, me: pre.me, tgt: cd.tgt,
      hits: hits, wards: wards, sts: sts, kills: kills, ilm: ilm || undefined,
      after: { hp: st.hp + '/' + st.maxHp, ward: c.player.ward, ink: c.ink },
      foes: c.enemies.filter(function (x) { return !x.dead; }).map(foeSnap), ov: c.over || undefined
    };
    pushChecked(e, msgs);
  }

  function afterEnd(st, a, pre, fx) {
    var c = st.combat, acts = [], cur = null, earlier = false, msgs = [];
    fx.forEach(function (f) {
      if (f.k === 'enemyAct') { cur = { uid: f.tgt, mv: f.name || f.move, hits: [], earlier: earlier }; acts.push(cur); }
      else if (f.k === 'hit' && cur && f.tgt === 'p') cur.hits.push(f.n + f.blocked);
      else if (f.k === 'status' && cur && f.n > 0) earlier = true; // an earlier foe buffed itself/allies or debuffed you
    });
    var playerDown = st.hp <= 0;
    var out = acts.map(function (x) {
      var it = pre.intents && pre.intents[x.uid], o = { foe: it ? it.id : x.uid, mv: x.mv };
      if (it && it.dmg) o.shows = it.dmg + 'x' + it.times;
      if (x.hits.length) o.hits = x.hits;
      if (it && !playerDown) {
        var want = it.dmg * it.times, got = x.hits.reduce(function (s, v) { return s + v; }, 0);
        if (want !== got) {
          var mm = it.id + ' "' + (it.name || x.mv) + '" showed ' + it.dmg + 'x' + it.times + '=' + want + ' but dealt ' + (x.hits.join('+') || '0') + '=' + got;
          // A foe acting earlier in the same round can legitimately change this foe's damage (it buffed allies / put Torn on you).
          // That is expected game behaviour, so it is noted in the entry but not counted as a flag.
          if (x.earlier) o.note = 'INTENT differs after an earlier foe changed statuses: ' + mm;
          else { mm = 'INTENT ' + mm; msgs.push(mm); o.flag = mm; }
        }
      }
      return o;
    });
    invariants(st).forEach(function (x) { msgs.push(x); });
    var e = {
      t: 'end', fl: st.floor, tn: pre.turn, me: pre.me, acts: out,
      after: c ? { me: c.over ? undefined : meSnap(st), foes: c.enemies.filter(function (x) { return !x.dead; }).map(function (x) { var f = foeSnap(x); f.shows = shown(st, x); return f; }) } : undefined,
      hand: c && !c.over ? c.hand.map(cid) : undefined, ov: c && c.over || undefined
    };
    pushChecked(e, msgs);
  }

  function afterOther(st, a, pre) {
    var e = { t: 'act', a: a.type, scr: pre.screen + (st.screen !== pre.screen ? '>' + st.screen : ''), fl: st.floor, act: st.act };
    e.d = [a.id, a.idx != null ? '#' + a.idx : null, a.uid != null ? 'uid' + a.uid : null, pre.detail].filter(function (x) { return x != null && x !== ''; }).join(' ');
    if (pre.deckN !== (st.deck || []).length) e.deck = (st.deck || []).length;
    if (st.hp !== pre.hp) e.hp = st.hp + '/' + st.maxHp; if (st.gold !== pre.gold) e.gold = st.gold;
    pushChecked(e, invariants(st));
  }

  function after(st, a, pre, res) {
    if (!res || !res.ok) return;
    var fx = (st.fx || []).slice();
    var c = st.combat;
    var newFight = c && c !== lastCombat;
    if (a.type === 'play' && pre.card) afterPlay(st, a, pre, fx, res);
    else if (a.type === 'endTurn' && pre.intents) afterEnd(st, a, pre, fx);
    else afterOther(st, a, pre);
    if (newFight) {
      lastCombat = c;
      push({
        t: 'fight', fl: st.floor, act: st.act, kind: c.kind,
        foes: c.enemies.map(function (e) { var f = foeSnap(e); f.shows = shown(st, e); return f; }),
        me: { hp: st.hp + '/' + st.maxHp, ward: c.player.ward, ink: c.ink, st: nz(c.player.st) }, hand: c.hand.map(cid)
      });
    } else if (!c) lastCombat = null;
    if (st.over) push({ t: 'over', won: !!st.won, act: st.act, fl: st.floor, hp: st.hp + '/' + st.maxHp });
  }

  // ---------------------------------------------------------------- errors
  D.error = function (kind, e, extra) {
    try {
      var msg = String((e && e.message) || e || '').slice(0, 240), last = buf.entries[buf.entries.length - 1];
      if (last && last.t === 'err' && last.msg === msg) { last.x = (last.x || 1) + 1; schedule(); return; }
      var ent = { t: 'err', kind: kind, msg: msg, stack: String((e && e.stack) || '').split('\n').slice(0, 6).join(' | ').slice(0, 500) };
      if (extra) for (var k in extra) ent[k] = extra[k];
      push(ent); buf.errs.push({ n: ent.n, kind: kind, msg: msg });
      while (buf.errs.length > MAXERRS) buf.errs.shift();
    } catch (x) { }
  };

  // ---------------------------------------------------------------- install
  D.install = function () {
    if (installed) return; installed = true;
    if (!loaded) load();
    origAct = M.act;
    M.act = function (st, a) {
      if (!a) return origAct(st, a);
      var pre = null;
      try { if (st !== lastSt) attach(st, 'resume'); pre = before(st, a); } catch (x) { D.error('diag-before', x); }
      var res;
      try { res = origAct(st, a); }
      catch (ex) { D.error('engine', ex, { a: a.type, scr: st.screen, fl: st.floor }); throw ex; }
      try { if (pre) after(st, a, pre, res); } catch (x) { D.error('diag-after', x); }
      return res;
    };
    if (typeof console !== 'undefined' && console.error) {
      origConsoleErr = console.error;
      console.error = function () {
        try { D.error('console', Array.prototype.slice.call(arguments).map(function (v) { return (v && v.message) || String(v); }).join(' ')); } catch (x) { }
        return origConsoleErr.apply(console, arguments);
      };
    }
    if (typeof G.addEventListener === 'function') {
      G.addEventListener('error', function (ev) { D.error('window', ev && (ev.error || ev.message), { at: ev && ev.filename ? (String(ev.filename).split('/').pop() + ':' + ev.lineno) : undefined }); });
      G.addEventListener('unhandledrejection', function (ev) { D.error('promise', ev && ev.reason); });
      G.addEventListener('pagehide', D.flush);
      if (G.document && G.document.addEventListener) G.document.addEventListener('visibilitychange', function () { if (G.document.visibilityState === 'hidden') D.flush(); });
    }
  };
  D.uninstall = function () { // tests only
    if (!installed) return; installed = false;
    if (origAct) M.act = origAct; if (origConsoleErr) console.error = origConsoleErr; lastSt = null;
  };

  // ---------------------------------------------------------------- report
  function deckStr(deck) {
    var cnt = {}, order = []; (deck || []).forEach(function (d) { var k = cid(d); if (!cnt[k]) { cnt[k] = 0; order.push(k); } cnt[k]++; });
    return order.map(function (k) { return cnt[k] > 1 ? k + ' x' + cnt[k] : k; }).join(', ');
  }
  D.report = function (st) {
    if (!loaded) load();
    if (timer != null) D.flush();
    var L = [], r = buf.run, W = G, nav = W.navigator || {};
    L.push('MARGINALIA DIAGNOSTIC REPORT (diag v' + VERSION + ')');
    L.push('generated: ' + new Date().toISOString());
    if (W.document) L.push('page last modified: ' + (W.document.lastModified || '?') + ' | standalone: ' + (!!nav.standalone || (W.document.documentElement && W.document.documentElement.classList.contains('standalone')) || false));
    L.push('device: ' + (nav.userAgent || 'n/a') + ' | viewport ' + (W.innerWidth || '?') + 'x' + (W.innerHeight || '?') + ' @' + (W.devicePixelRatio || '?'));
    if (r) L.push('run: seed ' + r.seed + ' | ' + r.char + ' | rubrication ' + r.asc + (r.daily ? ' | daily' : '') + (r.mods && r.mods.length ? ' | mods ' + r.mods.join('+') : '') + ' | began ' + new Date(r.at).toISOString() + ' (' + r.how + ')');
    else L.push('run: none recorded yet');
    if (st) {
      L.push('now: act ' + st.act + ', folio ' + st.floor + ', screen ' + st.screen + ', hp ' + st.hp + '/' + st.maxHp + ', silver ' + st.gold + (st.combat ? ', turn ' + st.combat.turn : ''));
      L.push('deck (' + (st.deck || []).length + '): ' + deckStr(st.deck));
      L.push('relics: ' + (st.relics || []).join(', '));
    }
    L.push('log: ' + buf.entries.length + ' entries kept' + (buf.dropped ? ' (' + buf.dropped + ' older dropped)' : '') + ' | flags: ' + buf.flagCount + ' | errors: ' + buf.errs.length);
    if (buf.flags.length) {
      L.push('', 'FLAGS (printed number vs what happened; #entry, folio, turn):');
      buf.flags.forEach(function (f) { L.push('  #' + f.n + ' f' + f.fl + (f.tn ? ' t' + f.tn : '') + ' ' + f.msg); });
    }
    if (buf.errs.length) {
      L.push('', 'ERRORS:');
      buf.errs.forEach(function (x) { L.push('  #' + x.n + ' [' + x.kind + '] ' + x.msg); });
    }
    L.push('', 'LOG (oldest first; JSON lines; hp as now/max; s = seconds since run start):');
    buf.entries.forEach(function (e) { L.push(JSON.stringify(e)); });
    return L.join('\n');
  };
  D.state = function () { return buf; }; // tests / console inspection
})();
