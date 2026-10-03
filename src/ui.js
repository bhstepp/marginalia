/* Marginalia — UI layer (DOM, input, animation, sound, persistence).
   Talks to the engine only through M.act + read-only helpers (see DESIGN.md "UI contract").
   Layout of this file:
     1. utilities & icons/art lookup     6. screens (title … end)
     2. persistence (save, stats, prefs)  7. combat screen (mount/update, hand layout)
     3. sound (Web Audio synth)           8. overlays (deck, piles, zoom, dialogs, menus)
     4. action pipeline (act → fx → render) 9. input (delegated taps, card pointer handling)
     5. fx player                          10. boot */
(function () {
  'use strict';
  var G = (typeof globalThis !== 'undefined') ? globalThis : window;
  var M = G.M;
  if (!M || typeof document === 'undefined') return;

  /* =========================================================== 1. utilities */
  var app = document.getElementById('app'), fxl = document.getElementById('fxl'), ovl = document.getElementById('ovl');
  var st = null;                    // current run state (engine object)
  var ui = {
    view: 'title', busy: false, selUid: null, mounted: null, prevHand: {}, freshGloss: null,
    popIntents: false, summoned: {}, recorded: null, phase: 'p', lastActor: null, hintMsg: '', hintWarn: false,
    stoneFresh: {}, cs: null, bk: { tab: 'cards', own: '', show: '', scroll: 0 }
  };
  var ACTS = {
    1: { roman: 'I', name: 'The Book of Hours', flav: 'Where snails go a-jousting and the hares have taken up arms.' },
    2: { roman: 'II', name: 'The Bestiary', flav: 'Here be monkfish, manticores, and a cat who has walked across the ink.' },
    3: { roman: 'III', name: 'The Apocalypse', flav: 'The last quire. The ink runs red, and the Bookworm hungers for the binding.' }
  };
  var TYPE_NAMES = { attack: 'Attack', skill: 'Skill', gloss: 'Gloss', blot: 'Blot', curse: 'Curse' };
  var NODE_NAMES = { battle: 'Battle', elite: 'Elite', boss: 'Boss', event: 'Apocrypha', shop: 'Stationer', rest: 'Scriptorium', treasure: 'Reliquary' };
  var PURPOSE = {
    remove: { t: 'Scrape a Page', s: 'Choose a card to scrape from thy deck forever.', b: 'Scrape it' },
    gild: { t: 'Gild a Card', s: 'Choose a card to lay with gold leaf.', b: 'Gild it' },
    transform: { t: 'Transmute', s: 'Choose a card; it becomes another of its rank.', b: 'Transmute it' },
    duplicate: { t: 'Copy a Card', s: 'Choose a card for the scribe to copy.', b: 'Copy it' }
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function stripTags(h) { return String(h || '').replace(/<[^>]*>/g, ''); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function qs(s, r) { return (r || document).querySelector(s); }
  function qsa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function center(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r }; }
  function hash(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

  // Fallback icons (used only if M.ART.icons lacks a key). 24×24, stroke currentColor.
  var FB = {
    intent_attack: '<path d="M7 17L19 5V4h-1L6 16M4.5 14.5l5 5M3.5 20.5l3-3"/>',
    intent_defend: '<path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"/>',
    ward: '<path d="M12 2.5l8 3.2v5.6c0 5.6-4 9-8 11.2-4-2.2-8-5.6-8-11.2V5.7z" fill="currentColor" stroke="#1a120e" stroke-width="1.3"/>',
    intent_buff: '<path d="M12 19V6M6 11l6-6 6 6"/>', intent_debuff: '<path d="M12 5v13M6 13l6 6 6-6"/>',
    intent_curse: '<path d="M12 4c4 0 7 3 6 7 3 1 2 6-2 6-1 3-6 3-7 0-4 1-6-4-3-6-2-4 2-7 6-7z" fill="currentColor"/>',
    intent_erase: '<path d="M5 5l14 14M19 5L5 19"/>', intent_devour: '<path d="M3 8c3 9 15 9 18 0M6 9l2 3 2-3 2 3 2-3 2 3 2-3"/>',
    intent_summon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/>', intent_unknown: '<path d="M9 9a3 3 0 116 0c0 2-3 2-3 5M12 18v.5"/>',
    hp: '<path d="M12 20.5s-7.5-4.7-7.5-10.4A4.2 4.2 0 0112 7.4a4.2 4.2 0 017.5 2.7c0 5.7-7.5 10.4-7.5 10.4z" fill="currentColor"/>',
    ink: '<path d="M12 3c3 5 6 8 6 11.5a6 6 0 01-12 0C6 11 9 8 12 3z" fill="currentColor"/>',
    silver: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><path d="M12 9.5v5"/>',
    deck: '<rect x="7" y="4" width="12" height="16" rx="1.5"/><path d="M4.5 7v13.5h11"/>',
    draw_pile: '<rect x="6" y="3" width="12" height="16" rx="1.5"/><path d="M8 21h8M12 7v8M9 12l3 3 3-3"/>',
    discard_pile: '<rect x="6" y="4" width="12" height="16" rx="1.5" transform="rotate(-10 12 12)"/><path d="M9 10l6 6M15 10l-6 6"/>',
    scraped: '<path d="M6 4h12v16H6z M4 20L20 4"/>', margin: '<path d="M20 3C11 5 7 11 5 21M20 3c-1 6-6 10-12 11M5 21l2-1"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    sound_on: '<path d="M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/>',
    sound_off: '<path d="M4 9h4l5-4v14l-5-4H4zM16 9l5 6M21 9l-5 6"/>',
    node_battle: '<path d="M5 5l14 14M19 5L5 19M3 16l5 5M16 21l5-5"/>',
    node_elite: '<path d="M6 3l2.5 5M18 3l-2.5 5"/><circle cx="12" cy="13" r="6.5"/><circle cx="9.8" cy="12.5" r="1.2" fill="currentColor"/><circle cx="14.2" cy="12.5" r="1.2" fill="currentColor"/><path d="M10 17h4"/>',
    node_boss: '<path d="M4 18h16l-1.5-10-4 4L12 5.5 9.5 12l-4-4zM4 21h16"/>',
    node_event: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 115 0c0 1.7-2.5 1.8-2.5 4M12 17v.5"/>',
    node_shop: '<path d="M5.5 8h13l-1.2 12.5H6.7zM9 8V6.5a3 3 0 016 0V8"/>',
    node_rest: '<path d="M9 21h6V10H9zM12 10V8M12 2.5c2.2 2 1.4 4.6 0 4.6s-2.2-2.6 0-4.6zM6 21h12"/>',
    node_treasure: '<rect x="4" y="10" width="16" height="10" rx="1"/><path d="M4 10c0-4 3.5-6 8-6s8 2 8 6M12 12.5v3M4 14h16"/>',
    relic: '<path d="M8 21h8M12 21v-4M7 6h10l-2 11H9zM12 2.5V6M10 4h4"/>',
    type_attack: '<path d="M7 17L19 5V4h-1L6 16M4.5 14.5l5 5M3.5 20.5l3-3"/>',
    type_skill: '<path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"/>',
    type_gloss: '<path d="M20 3C11 5 7 11 5 21M20 3c-1 6-6 10-12 11"/>',
    type_blot: '<path d="M12 4c4 0 7 3 6 7 3 1 2 6-2 6-1 3-6 3-7 0-4 1-6-4-3-6-2-4 2-7 6-7z" fill="currentColor"/>'
  };
  FB.type_curse = FB.type_blot;
  FB.st_petrified = '<path d="M5 18l2-8 5-5 6 2 2 7-4 5H7z" fill="currentColor" fill-opacity=".25"/><path d="M5 18l2-8 5-5 6 2 2 7-4 5H7zM12 5l-1 6 5 3M7 10l4 1"/>';
  FB.lock = '<rect x="5" y="10.5" width="14" height="10" rx="1.5" fill="currentColor" fill-opacity=".18"/><path d="M8 10.5V8a4 4 0 018 0v2.5M12 14.5v2.5"/>';
  function iconSvg(name) {
    var I = (M.ART && M.ART.icons) || {};
    if (I[name]) return I[name];
    if (FB[name]) return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + FB[name] + '</svg>';
    var letter = String(name).replace(/^(st_|intent_|node_|type_)/, '').charAt(0).toUpperCase();
    return '<span class="ph-ic">' + esc(letter) + '</span>';
  }
  function icon(name, cls) { return '<span class="ic ' + (cls || '') + '">' + iconSvg(name) + '</span>'; }

  var PH_ART = '<svg viewBox="0 0 200 200"><ellipse cx="100" cy="186" rx="62" ry="7" fill="#2a1f1a" opacity=".16"/>' +
    '<path d="M48 182c-12-62 18-114 54-114s62 44 46 114z" fill="#e9c9a0" fill-opacity=".85" stroke="#2a1f1a" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M70 100c6 2 10 0 14-4M112 96c5 3 10 3 15 0" fill="none" stroke="#2a1f1a" stroke-width="3" stroke-linecap="round"/>' +
    '<circle cx="80" cy="116" r="6" fill="#2a1f1a"/><circle cx="118" cy="113" r="6" fill="#2a1f1a"/>' +
    '<path d="M84 145q14 9 30 0" fill="none" stroke="#2a1f1a" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M60 160l-12 6M140 158l12 7" stroke="#2a1f1a" stroke-width="3" stroke-linecap="round"/></svg>';
  var PH_KNIGHT = '<svg viewBox="0 0 200 200"><ellipse cx="100" cy="186" rx="56" ry="7" fill="#2a1f1a" opacity=".16"/>' +
    '<path d="M70 182l6-56h48l6 56z" fill="#1f4f96" fill-opacity=".85" stroke="#2a1f1a" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M72 92c0-30 56-30 56 0v34H72z" fill="#c8c2b4" stroke="#2a1f1a" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M84 104h36" stroke="#2a1f1a" stroke-width="5" stroke-linecap="round"/><path d="M100 62c-4-14 8-24 14-30" fill="none" stroke="#b8321f" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M130 138l48-58" stroke="#2a1f1a" stroke-width="5" stroke-linecap="round"/><path d="M58 128c-14 6-14 34 8 40l8-34z" fill="#b8321f" fill-opacity=".85" stroke="#2a1f1a" stroke-width="4" stroke-linejoin="round"/></svg>';
  function artSvg(key) {
    var A = M.ART || {};
    if (key === 'knight' || key === 'player') return A.player || PH_KNIGHT;
    return (A.enemies && A.enemies[key]) || PH_ART;
  }
  // the hero of a run (or of a character page): their own drawing, else the Knight's
  function playerArt(ch) {
    var A = M.ART || {};
    ch = ch || (st && st.char) || 'knight';
    return (A.players && A.players[ch]) || A.player || PH_KNIGHT;
  }
  function portraitArt(ch) { var A = M.ART || {}; return (A.portraits && A.portraits[ch]) || playerArt(ch); }
  function roman(n) {
    if (!n) return '0';
    var v = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']], s = '';
    v.forEach(function (p) { while (n >= p[0]) { s += p[1]; n -= p[0]; } });
    return s;
  }
  function rn(n) { return n ? roman(n) : '<span class="z">0</span>'; }
  function rubName(n) { return n ? ((M.RUBRICS || [])[n - 1] || {}).name || 'Rubric ' + n : 'Plain Vellum'; }
  function modDef(id) { return (M.MODIFIERS && M.MODIFIERS[id]) || { name: id, desc: '' }; }
  function multOf(asc, nm) { var m = M.scoreMult ? M.scoreMult({ asc: asc, mods: new Array(nm || 0) }) : 1; return '×' + (Math.round(m * 100) / 100).toFixed(2).replace(/0$/, ''); }

  function quireName(a) { return (ACTS[a] || ACTS[1]).name; }
  function cardName(id) { return M.CARDS[id] ? M.CARDS[id].name : id; }
  function relicName(id) { return M.RELICS[id] ? M.RELICS[id].name : id; }
  function dailyDate(seed) { return String(seed || '').replace(/^DAILY-/, ''); }
  function prettyDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso); if (!m) return iso;
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return (+m[3]) + ' ' + months[+m[2] - 1] + ' ' + m[1];
  }

  /* =========================================================== 2. persistence */
  var SAVE_KEY = 'marginalia.save.v1', STATS_KEY = 'marginalia.stats.v1', PREF_KEY = 'marginalia.prefs.v1';
  function lsGet(k) { try { return G.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { G.localStorage.setItem(k, v); } catch (e) { /* storage full or blocked */ } }
  function lsDel(k) { try { G.localStorage.removeItem(k); } catch (e) { } }
  function loadSave() {
    var s = lsGet(SAVE_KEY); if (!s) return null;
    try { var o = M.deserialize(s); return (o && !o.over && o.screen) ? upgradeSave(o) : null; } catch (e) { return null; }
  }
  // v1 saves (no character / Rubrication / modifiers) still load: they become a Knight run at Rubrication 0.
  function upgradeSave(o) {
    if (!o.char || !(M.CHARACTERS && M.CHARACTERS[o.char])) o.char = 'knight';
    if (o.asc == null) o.asc = 0;
    if (!Array.isArray(o.mods)) o.mods = [];
    if (!o.seen) o.seen = { cards: {}, relics: {}, foes: {} };
    ['cards', 'relics', 'foes'].forEach(function (k) { o.seen[k] = o.seen[k] || {}; });
    // v1 runs drew from every card, so keep their pools whole
    if (!Array.isArray(o.unlocked)) o.unlocked = o.v === 1 || !o.v ? Object.keys(M.ACHIEVEMENTS || {}) : [];
    o.stats = o.stats || {};
    ['kills', 'elites', 'bosses', 'floors', 'cards', 'illum', 'dmg', 'turns', 'glosses', 'maxHit', 'killsTurnMax', 'illumStreakMax', 'flawless', 'maxCardsTurn', 'maxWard', 'maxCorrode']
      .forEach(function (k) { if (typeof o.stats[k] !== 'number') o.stats[k] = 0; });
    if (!Array.isArray(o.stats.bossIds)) o.stats.bossIds = [];
    if (!Array.isArray(o.uiAch)) o.uiAch = [];
    return o;
  }
  function persist() {
    if (!st) return;
    if (st.over) { recordEnd(); lsDel(SAVE_KEY); return; }
    try { lsSet(SAVE_KEY, M.serialize(st)); } catch (e) { }
  }

  /* ----- the Book of Marginalia: collection, achievements, Rubrication progress (survives every run) */
  var BOOK_KEY = 'marginalia.book.v1';
  function loadBook() {
    var o = null; try { o = JSON.parse(lsGet(BOOK_KEY) || 'null'); } catch (e) { }
    o = (o && typeof o === 'object') ? o : {};
    o.ach = Array.isArray(o.ach) ? o.ach : [];
    o.seen = o.seen || {}; ['cards', 'relics', 'foes'].forEach(function (k) { o.seen[k] = o.seen[k] || {}; });
    o.rubric = o.rubric || {}; o.best = o.best || {}; o.perChar = o.perChar || {};
    if (typeof o.runs !== 'number' || typeof o.wins !== 'number') {   // first open: inherit the v1 tallies
      var s1 = null; try { s1 = JSON.parse(lsGet(STATS_KEY) || 'null'); } catch (e) { }
      o.runs = (s1 && s1.runs) || 0; o.wins = (s1 && s1.wins) || 0;
    }
    if (!o.v1migr) {   // wins from before characters existed were all Knight wins: credit them once
      var s2 = null; try { s2 = JSON.parse(lsGet(STATS_KEY) || 'null'); } catch (e) { }
      var add = function (id) { if (o.ach.indexOf(id) < 0) o.ach.push(id); };
      if (s2 && s2.wins > 0) {
        ['win_knight', 'quire_one', 'quire_two'].forEach(add);
        var pc0 = o.perChar.knight = o.perChar.knight || { runs: 0, wins: 0, best: 0 };
        pc0.wins = Math.max(pc0.wins || 0, s2.wins); pc0.runs = Math.max(pc0.runs || 0, s2.runs || 0); pc0.best = Math.max(pc0.best || 0, s2.best || 0);
      }
      if (s2 && s2.daily && Object.keys(s2.daily).some(function (d) { return s2.daily[d] && s2.daily[d].won; })) add('daily_win');
      o.v1migr = 1;
      try { lsSet(BOOK_KEY, JSON.stringify(o)); } catch (e) { }
    }
    return o;
  }
  var book = loadBook();
  function saveBook() { lsSet(BOOK_KEY, JSON.stringify(book)); }
  function mergeSeen() {
    if (!st || !st.seen) return false;
    var ch = false;
    ['cards', 'relics', 'foes'].forEach(function (k) {
      var src = st.seen[k] || {}, dst = book.seen[k];
      Object.keys(src).forEach(function (id) { if (!dst[id]) { dst[id] = 1; ch = true; } });
    });
    return ch;
  }
  function charDef(id) { return (M.CHARACTERS && M.CHARACTERS[id]) || { name: 'The Margin Knight', short: 'Knight', hp: 70, colors: ['V', 'L', 'G'], relic: 'pilgrim_badge' }; }
  function charIds() {
    var C = M.CHARACTERS || { knight: charDef('knight') };
    return Object.keys(C).sort(function (a, b) { return ((C[a].order || 9) - (C[b].order || 9)) || a.localeCompare(b); });
  }
  function charUnlocked(id) { var c = charDef(id); return !c.unlock || book.ach.indexOf(c.unlock) >= 0; }
  function rubMax(id) { return Math.max(0, Math.min((M.RUBRICS || []).length, book.rubric[id] || 0)); }
  function achName(id) { var a = M.ACHIEVEMENTS && M.ACHIEVEMENTS[id]; return a ? a.name : id; }
  function unlockList(id) {
    var u = M.unlocksFor ? M.unlocksFor(id) : { cards: [], relics: [], chars: [] };
    return u.chars.map(function (c) { return charDef(c).name; }).concat(u.cards.map(cardName), u.relics.map(relicName));
  }
  // after every engine action: fold this run's sightings into the book, then look for new achievements
  function afterAction() {
    if (!st) return;
    var ch = mergeSeen();
    var neu = [];
    try { neu = M.checkAchievements ? M.checkAchievements(st, book.ach) : []; } catch (e) { neu = []; }
    if (neu.length) {
      neu.forEach(function (id) { book.ach.push(id); if (!Array.isArray(st.uiAch)) st.uiAch = []; if (st.uiAch.indexOf(id) < 0) st.uiAch.push(id); });
      ch = true;
      neu.forEach(function (id, i) { setTimeout(function () { achToast(id); }, i * 1700); });
    }
    if (ch) saveBook();
  }
  function loadStats() {
    var o = null; try { o = JSON.parse(lsGet(STATS_KEY) || 'null'); } catch (e) { }
    o = o || {}; o.runs = o.runs || 0; o.wins = o.wins || 0; o.best = o.best || 0; o.daily = o.daily || {};
    return o;
  }
  function recordEnd() {
    if (!st || !st.over || ui.recorded === st) return;
    ui.recorded = st;
    afterAction();
    // book: tallies, best score per character per Rubrication, next Rubrication unlocked by a (non-daily) win
    var ch = st.char || 'knight', lvl = st.asc || 0, scb = M.score(st), pc = book.perChar[ch] = book.perChar[ch] || { runs: 0, wins: 0, best: 0 };
    book.runs++; pc.runs++; pc.best = Math.max(pc.best || 0, scb);
    if (st.won) { book.wins++; pc.wins++; }
    var bk = ch + ':' + lvl; if (!st.daily && (!book.best[bk] || scb > book.best[bk])) { book.best[bk] = scb; st.uiBest = true; }
    if (st.won && !st.daily && M.RUBRICS && lvl + 1 > rubMax(ch) && lvl < M.RUBRICS.length) { book.rubric[ch] = lvl + 1; st.uiRubUp = lvl + 1; }
    saveBook();
    var s = loadStats(), sc = M.score(st);
    s.runs++; if (st.won) s.wins++; s.best = Math.max(s.best, sc);
    if (st.daily) {
      var d = dailyDate(st.seed), prev = s.daily[d];
      if (!prev || sc > prev.score) s.daily[d] = { score: sc, won: !!st.won, act: st.act };
      var keys = Object.keys(s.daily).sort(); while (keys.length > 60) delete s.daily[keys.shift()];
    }
    lsSet(STATS_KEY, JSON.stringify(s));
  }
  var prefs = (function () { var o = null; try { o = JSON.parse(lsGet(PREF_KEY) || 'null'); } catch (e) { } return o || { sound: true }; })();
  function savePrefs() { lsSet(PREF_KEY, JSON.stringify(prefs)); }

  /* =========================================================== 3. sound */
  var Sfx = (function () {
    var AC = null, out = null, noise = null, drone = null;
    function ctx() {
      if (!prefs.sound || !ui.gesture) return null;
      if (!AC) {
        try {
          var C = G.AudioContext || G.webkitAudioContext; if (!C) return null;
          AC = new C(); out = AC.createGain(); out.gain.value = 0.55; out.connect(AC.destination);
          var len = AC.sampleRate, b = AC.createBuffer(1, len, AC.sampleRate), d = b.getChannelData(0);
          for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
          noise = b;
        } catch (e) { AC = null; return null; }
      }
      if (AC.state === 'suspended') { try { AC.resume(); } catch (e) { } }
      return AC;
    }
    function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
    function nz(t, dur, type, f0, f1, q, peak) {
      var c = AC, s = c.createBufferSource(); s.buffer = noise; s.loop = true;
      var f = c.createBiquadFilter(); f.type = type; f.Q.value = q || 1;
      f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      var g = c.createGain(); env(g, t, 0.006, peak, dur);
      s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
    }
    function tone(t, type, f0, f1, dur, peak, a) {
      var c = AC, o = c.createOscillator(), g = c.createGain(); o.type = type;
      o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      env(g, t, a || 0.005, peak, dur); o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.1);
    }
    var S = {
      unlock: function () { ui.gesture = true; ctx(); },
      quill: function () { if (!ctx()) return; var t = AC.currentTime; for (var i = 0; i < 3; i++) nz(t + i * 0.055 + Math.random() * 0.02, 0.05 + Math.random() * 0.03, 'bandpass', 2600 + Math.random() * 1800, 5200, 3, 0.22); },
      thud: function (big) { if (!ctx()) return; var t = AC.currentTime; tone(t, 'sine', big ? 140 : 110, 42, big ? 0.32 : 0.22, big ? 0.9 : 0.65); nz(t, 0.12, 'lowpass', 900, 200, 0.7, 0.35); },
      block: function () { if (!ctx()) return; var t = AC.currentTime; tone(t, 'triangle', 520, 380, 0.12, 0.25); nz(t, 0.06, 'highpass', 3000, 0, 1, 0.12); },
      ward: function () { if (!ctx()) return; var t = AC.currentTime; tone(t, 'triangle', 600, 900, 0.16, 0.16, 0.01); tone(t + 0.05, 'sine', 1200, 0, 0.2, 0.06, 0.01); },
      bell: function () {
        if (!ctx()) return; var t = AC.currentTime;
        [[1, 0.28], [2.01, 0.12], [2.76, 0.09], [5.4, 0.04], [8.9, 0.02]].forEach(function (p) { tone(t, 'sine', 784 * p[0], 0, 2.2 / Math.sqrt(p[0]), p[1], 0.004); });
        tone(t + 0.12, 'sine', 1175, 0, 1.4, 0.07, 0.004);
      },
      coin: function () { if (!ctx()) return; var t = AC.currentTime; tone(t, 'square', 1900, 0, 0.07, 0.05); tone(t + 0.07, 'square', 2500, 0, 0.14, 0.05); },
      page: function () { if (!ctx()) return; var t = AC.currentTime; nz(t, 0.28, 'highpass', 1200, 4000, 0.6, 0.12); },
      death: function () { if (!ctx()) return; var t = AC.currentTime; nz(t, 0.7, 'lowpass', 2400, 120, 2, 0.3); tone(t, 'sawtooth', 220, 55, 0.6, 0.06); },
      seal: function () { if (!ctx()) return; var t = AC.currentTime; tone(t, 'sine', 90, 50, 0.2, 0.7); nz(t, 0.05, 'bandpass', 1500, 0, 2, 0.2); },
      curse: function () { if (!ctx()) return; var t = AC.currentTime; nz(t, 0.35, 'lowpass', 600, 150, 4, 0.3); },
      heal: function () { if (!ctx()) return; var t = AC.currentTime; [523, 659, 784].forEach(function (f, i) { tone(t + i * 0.07, 'sine', f, 0, 0.4, 0.09); }); },
      victory: function () { if (!ctx()) return; var t = AC.currentTime; [392, 494, 587, 784].forEach(function (f, i) { tone(t + i * 0.12, 'triangle', f, 0, 0.9, 0.12); }); },
      defeat: function () { if (!ctx()) return; var t = AC.currentTime; [330, 262, 196].forEach(function (f, i) { tone(t + i * 0.25, 'triangle', f, f * 0.98, 0.8, 0.12); }); },
      drone: function (on) {
        if (on && drone) return; if (!on && !drone) return;
        if (!on) { var d = drone; drone = null; try { var t0 = AC.currentTime; d.g.gain.cancelScheduledValues(t0); d.g.gain.setValueAtTime(d.g.gain.value, t0); d.g.gain.linearRampToValueAtTime(0, t0 + 1.2); setTimeout(function () { d.o.forEach(function (o) { try { o.stop(); } catch (e) { } }); }, 1400); } catch (e) { } return; }
        if (!ctx()) return;
        var t = AC.currentTime, g = AC.createGain(), f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260; f.Q.value = 3;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.11, t + 2.5);
        var os = [55, 55.35, 82.4].map(function (fr) { var o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.connect(f); o.start(t); return o; });
        var lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 0.15; lg.gain.value = 90; lfo.connect(lg); lg.connect(f.frequency); lfo.start(t); os.push(lfo);
        f.connect(g); g.connect(out); drone = { o: os, g: g };
      },
      stopAll: function () { S.drone(false); }
    };
    return S;
  })();

  /* =========================================================== 4. action pipeline */
  function snapshot() {
    var s = { screen: st.screen, act: st.act, actors: null, hand: [] };
    if (st.combat) {
      var c = st.combat;
      s.actors = { p: { hp: st.hp, maxHp: st.maxHp, ward: c.player.ward, st: clone(c.player.st) } };
      c.enemies.forEach(function (e) { s.actors[e.uid] = { hp: e.hp, maxHp: e.maxHp, ward: e.ward, st: clone(e.st), dead: e.dead }; });
      s.hand = c.hand.map(function (x) { return x.uid; });
    }
    return s;
  }
  function act(a) {
    if (ui.busy || !st) return { ok: false };
    var pre = snapshot();
    var res;
    try { res = M.act(st, a); } catch (e) { console.error('Engine error', e); toast('The ink has smudged (engine error)'); return { ok: false }; }
    if (!res.ok) { if (res.err && st.screen === 'combat') setHint(res.err, true); return res; }
    var fx = (st.fx || []).slice();
    afterAction();
    persist();
    ui.busy = true;
    var done = function () { ui.busy = false; render(); };
    var p = (pre.screen === 'combat' && qs('.scr.combat')) ? playFx(fx, pre, true) : (render(), playFx(fx, pre, false));
    p.then(function () { if (pre.screen === 'combat' || st.screen !== pre.screen) done(); else { ui.busy = false; refreshHud(); } }, function (e) { console.error(e); done(); });
    return res;
  }
  // opts: {char, asc}. The run keeps the achievements earned so far; later unlocks apply to the next run.
  function startRun(seed, opts) {
    opts = opts || {};
    Sfx.stopAll(); closeOv();
    var ch = opts.char && charDef(opts.char) && M.CHARACTERS && M.CHARACTERS[opts.char] ? opts.char : 'knight';
    var daily = /^DAILY-/.test(String(seed));
    var asc = daily ? 0 : Math.max(0, Math.min(rubMax(ch), opts.asc | 0));
    st = M.newRun({ seed: seed, char: ch, asc: asc, unlocked: book.ach.slice() });
    upgradeSave(st);
    if (M.diag) M.diag.newRun(st);
    ui.view = 'run'; ui.recorded = null; ui.mounted = null; ui.selUid = null;
    afterAction(); persist(); Sfx.page(); render();
  }
  function continueRun(saved) { st = upgradeSave(saved); if (M.diag) M.diag.resume(st); ui.view = 'run'; ui.mounted = null; ui.selUid = null; closeOv(); Sfx.page(); render(); }
  function toTitle() { Sfx.stopAll(); ui.view = 'title'; ui.mounted = null; closeOv(); render(); }

  /* =========================================================== 5. fx player */
  function actorEl(tgt) { return tgt === 'p' ? qs('#cHero') : qs('.foe[data-uid="' + tgt + '"]'); }
  function floatAt(el, text, cls, dy) {
    if (!el) return;
    var a = el.querySelector('.art') || el, c = center(a);
    var d = document.createElement('div'); d.className = 'fnum ' + (cls || '');
    d.textContent = text; d.style.left = (c.x + (Math.random() * 24 - 12)) + 'px'; d.style.top = (c.y + (dy || 0)) + 'px';
    fxl.appendChild(d); setTimeout(function () { d.remove(); }, 1100);
  }
  function banner(text, cls, ms) {
    var d = document.createElement('div'); d.className = 'banner ' + (cls || ''); d.innerHTML = '<span>' + esc(text) + '</span>';
    if (ms) d.style.animationDuration = ms + 'ms';
    fxl.appendChild(d); setTimeout(function () { d.remove(); }, (ms || 1100) + 50);
  }
  function toast(text) {
    qsa('.toast', fxl).forEach(function (t) { if (t.textContent === text) t.remove(); });   // never stack the same message
    var old = qsa('.toast', fxl); old.forEach(function (t, i) { t.style.marginBottom = ((old.length - i) * 40) + 'px'; });
    var d = document.createElement('div'); d.className = 'toast'; d.textContent = text; fxl.appendChild(d);
    setTimeout(function () { d.remove(); }, 1900);
  }
  // illuminated, non-blocking achievement scroll at the top of the page
  var achQ = 0;
  function achToast(id) {
    var items = unlockList(id), slot = achQ++;
    var d = document.createElement('div'); d.className = 'achToast'; d.setAttribute('role', 'status');
    d.style.setProperty('--slot', slot);
    d.innerHTML = '<span class="achSeal">' + SEAL_GLYPH + '</span><div class="achTx"><div class="t1">Achievement</div><div class="t2">' + esc(achName(id)) + '</div>' +
      (items.length ? '<div class="t3">Unlocked: ' + esc(items.join(', ')) + '<i> — from thy next run</i></div>' : '') + '</div>';
    fxl.appendChild(d); Sfx.bell();
    setTimeout(function () { d.remove(); achQ = Math.max(0, achQ - 1); }, 4300);
  }
  var SEAL_GLYPH = '<svg viewBox="0 0 40 40"><path d="M20 2l4 5 6-2 1 6 6 2-2 6 4 4-4 4 2 6-6 2-1 6-6-2-4 5-4-5-6 2-1-6-6-2 2-6-4-4 4-4-2-6 6-2 1-6 6 2z" fill="#c99a1e" stroke="#6f520b" stroke-width="1.5"/>' +
    '<circle cx="20" cy="20" r="10.5" fill="#b8321f" stroke="#6f520b" stroke-width="1.4"/><path d="M20 13v14M13 20h14M15.5 15.5l9 9M24.5 15.5l-9 9" stroke="#f7e3a0" stroke-width="1.6" stroke-linecap="round"/></svg>';
  function retrigger(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function sparkle(x, y, n) {
    for (var i = 0; i < (n || 14); i++) {
      var s = document.createElement('div'); s.className = 'spark';
      var ang = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 90;
      s.style.left = x + 'px'; s.style.top = y + 'px';
      s.style.setProperty('--dx', Math.cos(ang) * dist + 'px'); s.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
      s.style.animationDelay = (Math.random() * 0.15) + 's';
      fxl.appendChild(s); (function (q) { setTimeout(function () { q.remove(); }, 1200); })(s);
    }
  }
  function flyCardEl(el, tx, ty, opts) {
    if (!el) return;
    var r = el.getBoundingClientRect(), c = el.cloneNode(true);
    c.classList.remove('sel', 'drag', 'deal'); c.classList.add('flyCard');
    c.style.transition = 'none'; c.style.zIndex = 46;
    c.style.transform = 'translate(' + r.left + 'px,' + r.top + 'px)';
    fxl.appendChild(c); el.style.visibility = 'hidden';
    var dx = tx - r.width / 2, dy = ty - r.height / 2;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        c.style.transition = 'transform ' + ((opts && opts.dur) || 300) + 'ms cubic-bezier(.5,0,.75,.4), opacity ' + ((opts && opts.dur) || 300) + 'ms ease-in';
        c.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + ((opts && opts.rot) || 16) + 'deg) scale(' + ((opts && opts.scale) || 0.35) + ')';
        c.style.opacity = (opts && opts.keep) ? '1' : '0';
      });
    });
    setTimeout(function () { c.remove(); }, ((opts && opts.dur) || 300) + 120);
  }
  function updateActorDom(tgt, m, popStatus) {
    var el = actorEl(tgt); if (!el || !m) return;
    var bar = el.querySelector('.bar'); if (bar) setBar(bar, m.hp, m.maxHp, m.ward);
    var ch = el.querySelector('.chips'); if (ch) ch.innerHTML = chipsHtml(m.st, popStatus);
    if (tgt === 'p') { var h = qs('#hudHp'); if (h) h.textContent = m.hp + '/' + m.maxHp; }
  }

  function playFx(list, pre, inCombat) {
    return new Promise(function (resolve) {
      var model = pre.actors ? clone(pre.actors) : {};
      var i = 0;
      ui.phase = 'p';
      function step() {
        if (i >= list.length) return resolve();
        var f = list[i++], w = 0;
        try { w = inCombat ? fxCombat(f, model, pre) : fxGlobal(f); } catch (e) { console.error('fx error', f, e); }
        if (w > 0) setTimeout(step, w); else step();
      }
      step();
    });
  }
  // fx that make sense on any screen (toasts / sounds)
  function fxGlobal(f) {
    switch (f.k) {
      case 'gold': if (f.n > 0) { Sfx.coin(); var s = qs('.hud .stat.ag'); if (s) floatAt(s, '+' + f.n, 'gold', 34); } else toast('Lost ' + (-f.n) + ' silver'); return 0;
      case 'relic': toast('Relic gained: ' + relicName(f.id)); Sfx.bell(); return 0;
      case 'gainCard': toast('Added to thy deck: ' + cardName(f.id)); Sfx.quill(); return 0;
      case 'removeCard': toast('Scraped away: ' + cardName(f.id)); Sfx.page(); return 0;
      case 'transform': toast(cardName(f.from) + ' became ' + cardName(f.to)); Sfx.quill(); return 0;
      case 'gildDeck': var inst = st.deck.filter(function (x) { return x.uid === f.uid; })[0]; toast('Gilded: ' + (inst ? cardName(inst.id) : 'a card')); Sfx.bell(); return 0;
      case 'heal': if (f.n > 0) { toast('Healed ' + f.n + ' HP'); Sfx.heal(); } return 0;
      case 'loseHp': if (f.n > 0) { toast('Lost ' + f.n + ' HP'); Sfx.thud(); } return 0;
      case 'maxHp': toast((f.n >= 0 ? '+' : '') + f.n + ' Max HP'); return 0;
      case 'combatStart':
        var kind = f.kind || (st.combat && st.combat.kind);
        banner(kind === 'boss' ? 'The Boss' : kind === 'elite' ? 'An Elite Foe!' : 'To Arms!', kind === 'battle' ? '' : 'red');
        if (kind === 'boss') Sfx.drone(true); Sfx.page(); return 0;
      case 'defeat': banner('Blotted Out', 'red', 1600); Sfx.defeat(); return 0;
      case 'victory': banner('Victory!', 'gold'); Sfx.victory(); return 0;
    }
    return 0;
  }
  function fxCombat(f, model, pre) {
    var E = ui.phase === 'e', el, m;
    switch (f.k) {
      case 'play':
        Sfx.quill();
        var cel = qs('#cHand .card[data-uid="' + f.uid + '"]'), def = M.CARDS[f.id] || {}, tx, ty, tg;
        if (f.tgt != null && (tg = actorEl(f.tgt))) { var cc = center(tg.querySelector('.art') || tg); tx = cc.x; ty = cc.y; }
        else if (def.type === 'gloss') { var mc = center(qs('#cMargin')); tx = mc.x; ty = mc.y; }
        else if (def.type === 'attack') { var fc = center(qs('#cFoes')); tx = fc.x; ty = fc.y; }
        else { var hc = center(qs('#cHero')); tx = hc.x; ty = hc.y; }
        flyCardEl(cel, tx, ty);
        ui.selUid = null; clearTargeting();
        return 190;
      case 'hit':
        el = actorEl(f.tgt); m = model[f.tgt];
        if (m) { m.ward = Math.max(0, m.ward - (f.blocked || 0)); m.hp = Math.max(0, m.hp - f.n); updateActorDom(f.tgt, m); }
        if (el) {
          if (f.n > 0) { floatAt(el, '−' + f.n, 'dmg' + (f.n >= 15 ? ' big' : '')); retrigger(el, 'hit'); Sfx.thud(f.n >= 15); }
          else if (f.blocked > 0) { floatAt(el, 'Warded', 'blk'); Sfx.block(); retrigger(el.querySelector('.wardb'), 'shim'); }
          else floatAt(el, '0', 'blk');
          if (f.tgt === 'p' && f.n > 0) retrigger(app, 'shakeAll');
        }
        return E ? 320 : 120;
      case 'loseHp':
        m = model[f.tgt]; if (m) { m.hp = Math.max(0, m.hp - f.n); updateActorDom(f.tgt, m); }
        el = actorEl(f.tgt); if (el && f.n > 0) { floatAt(el, '−' + f.n, 'hpl'); retrigger(el, 'hit'); Sfx.thud(); }
        return E ? 260 : 100;
      case 'heal':
        m = model[f.tgt]; if (m) { m.hp = Math.min(m.maxHp, m.hp + f.n); updateActorDom(f.tgt, m); }
        if (f.n > 0) { floatAt(actorEl(f.tgt), '+' + f.n, 'heal'); Sfx.heal(); }
        return E ? 220 : 90;
      case 'ward':
        m = model[f.tgt]; if (m) { m.ward += f.n; updateActorDom(f.tgt, m); }
        el = actorEl(f.tgt); if (el && f.n > 0) { floatAt(el, '+' + f.n, 'ward', -10); retrigger(el.querySelector('.wardb'), 'shim'); Sfx.ward(); }
        return E ? 240 : 80;
      case 'status':
        m = model[f.tgt];
        if (m) { if (f.n === 0) delete m.st[f.s]; else { m.st[f.s] = (m.st[f.s] || 0) + f.n; if (!m.st[f.s]) delete m.st[f.s]; } updateActorDom(f.tgt, m, f.s); }
        var sd = M.STATUS[f.s];
        if (f.n !== 0 && sd) floatAt(actorEl(f.tgt), (f.n > 0 ? '+' : '') + f.n + ' ' + sd.name, 'st ' + ((sd.good ? f.n > 0 : f.n < 0) ? 'good' : 'bad'), -30);
        return E ? 240 : 70;
      case 'tick':
        var td = M.STATUS[f.s]; floatAt(actorEl(f.tgt), td ? td.name : f.s, 'st bad', -36);
        m = model[f.tgt]; if (m && m.st[f.s]) { m.st[f.s]--; if (!m.st[f.s]) delete m.st[f.s]; updateActorDom(f.tgt, m, f.s); }
        return 160;
      case 'death':
        el = actorEl(f.tgt); if (el) { el.classList.add('dying'); Sfx.death(); }
        return 420;
      case 'draw': return 0;
      case 'reshuffle': retrigger(qs('#pDraw'), 'bump'); toast('Discards shuffled into thy draw pile'); return E ? 120 : 0;
      case 'illuminate':
        var il = qs('#cIllum');
        if (il) { il.classList.add('done'); qsa('.pr', il).forEach(function (p) { p.classList.add('on'); }); retrigger(il, 'flaring'); var ic = center(il); var fl = document.createElement('div'); fl.className = 'flare'; fl.style.left = ic.x + 'px'; fl.style.top = ic.y + 'px'; fxl.appendChild(fl); setTimeout(function () { fl.remove(); }, 1100); sparkle(ic.x, ic.y, 18); }
        banner('Illuminated!', 'gold', 900); Sfx.bell();
        return 380;
      case 'gloss': ui.freshGloss = f.id; return 0;
      case 'erase': toast('A Gloss is erased: ' + cardName(f.id)); Sfx.curse(); return E ? 300 : 0;
      case 'glossFire': var g = qs('#cMargin .gl[data-id="' + f.id + '"]'); retrigger(g, 'fire'); return E ? 160 : 90;
      case 'relicFire': retrigger(qs('.relics .relic[data-id="' + f.id + '"]'), 'fire'); return 60;
      case 'scrape': return 0;
      case 'devour': toast('Devoured from thy draw pile: ' + cardName(f.id)); Sfx.curse(); retrigger(qs('#pDraw'), 'bump'); return 300;
      case 'petrify': // the hand is dealt at 'playerTurn'; mark the card so it crumbles to stone as it lands
        ui.stoneFresh[f.uid] = true; floatAt(actorEl('p'), 'Petrified', 'st bad', -36); Sfx.curse(); return 120;
      case 'summon': ui.summoned[f.tgt] = true; toast('Another foe crawls off the page!'); return 260;
      case 'phase':
        var pe = st.combat && st.combat.enemies.filter(function (x) { return x.uid === f.e; })[0];
        banner((pe ? pe.name : 'The foe') + ' grows wroth!', 'red', 1000); return 500;
      case 'addCard':
        var src = ui.lastActor != null ? actorEl(ui.lastActor) : null, dst = qs(f.to === 'hand' ? '#cHand' : f.to === 'draw' ? '#pDraw' : '#pDisc');
        if (src && dst) {
          var a = center(src), b = center(dst), bl = document.createElement('div'); bl.className = 'blotFly';
          bl.style.left = a.x + 'px'; bl.style.top = a.y + 'px'; bl.style.setProperty('--dx', (b.x - a.x) + 'px'); bl.style.setProperty('--dy', (b.y - a.y) + 'px');
          fxl.appendChild(bl); setTimeout(function () { bl.remove(); }, 800);
        }
        toast(cardName(f.id) + ' added to thy ' + (f.to === 'hand' ? 'hand' : f.to === 'draw' ? 'draw pile' : 'discard'));
        Sfx.curse(); return E ? 320 : 60;
      case 'gild': return 0;
      case 'ink': retrigger(qs('#cInk'), 'bump'); return 0;
      case 'enemyTurn':
        ui.phase = 'e'; ui.selUid = null; clearTargeting(); setHint('', false);
        var seal = qs('#cSeal'); if (seal) seal.disabled = true;
        var d = center(qs('#pDisc'));
        qsa('#cHand .card').forEach(function (c, k) { setTimeout(function () { flyCardEl(c, d.x, d.y, { dur: 260, scale: 0.25, rot: 30 }); }, k * 35); });
        banner('The Drolleries Stir', 'red', 900);
        return 650;
      case 'enemyAct':
        ui.lastActor = f.tgt; el = actorEl(f.tgt);
        if (el) {
          retrigger(el, 'acting');
          if (f.name) { var say = document.createElement('div'); say.className = 'say'; say.textContent = f.name; el.appendChild(say); setTimeout(function () { say.remove(); }, 1150); }
        }
        Sfx.page();
        return 420;
      case 'playerTurn':
        ui.phase = 'p'; ui.popIntents = true;
        render();
        if (pre.screen === 'combat' && st.combat && st.combat.turn > 1) banner('Turn ' + st.combat.turn, '', 800);
        return 0;
      case 'victory':
        banner('Victory!', 'gold', 1100); Sfx.victory(); Sfx.drone(false);
        return 1150;
      case 'defeat':
        banner('Blotted Out', 'red', 1500); Sfx.defeat(); Sfx.drone(false);
        return 1500;
      default:
        return fxGlobal(f);
    }
  }

  /* =========================================================== 6. screens */
  function hudHtml() {
    return '<div class="hud">' +
      '<div class="stat hp">' + icon('hp') + '<span id="hudHp">' + st.hp + '/' + st.maxHp + '</span></div>' +
      '<div class="stat ag">' + icon('silver') + '<span id="hudAg">' + st.gold + '</span></div>' +
      '<div class="where"><b>Quire ' + (ACTS[st.act] || ACTS[1]).roman + (st.asc ? '<span class="rubTag" title="Rubrication ' + st.asc + '"> · R' + roman(st.asc) + '</span>' : '') + '</b>' + (st.floor ? 'Folio ' + st.floor : esc(quireName(st.act))) + '</div>' +
      '<button class="ib" data-a="deck" aria-label="Deck">' + icon('deck') + '<span class="cnt">' + st.deck.length + '</span></button>' +
      '<button class="ib gl-btn" data-a="glossary" aria-label="Glossary">' + GLOSS_ICON + '</button>' +
      '<button class="ib" data-a="menu" aria-label="Menu">' + icon('menu') + '</button>' +
      '</div>' + relicsHtml();
  }
  function relicBadge(id, big) {
    var r = M.RELICS[id] || {}, A = (M.ART && M.ART.relics) || {};
    var inner = A[id] ? '<span class="ic">' + A[id] + '</span>' : esc((r.name || '?').replace(/^(The |A )/, '').charAt(0));
    return '<span class="relic r-' + esc(r.rarity || 'common') + (big ? ' big' : '') + '" data-id="' + esc(id) + '">' + inner + '</span>';
  }
  function relicsHtml() {
    return '<div class="relics" data-a="relics" role="button" aria-label="Relics: ' + esc(st.relics.map(relicName).join(', ')) + '">' + st.relics.map(function (id) { return relicBadge(id); }).join('') + '</div>';
  }
  function refreshHud() {
    var h = qs('#hudHp'); if (h) h.textContent = st.hp + '/' + st.maxHp;
    var g = qs('#hudAg'); if (g) g.textContent = st.gold;
  }

  // ----- title
  function renderTitle() {
    var saved = loadSave(), stats = loadStats(), dseed = M.dailySeed(), dd = dailyDate(dseed), today = stats.daily[dd];
    var dmods = M.dailyMods ? M.dailyMods(dseed) : [];
    var hero = prefs.char && charUnlocked(prefs.char) ? prefs.char : 'knight';
    var bp = bookPct();
    var h = '<div class="scr title enter">' +
      '<button class="ib tr" data-a="sound" aria-label="Sound">' + icon(prefs.sound ? 'sound_on' : 'sound_off') + '</button>' +
      '<div class="ribbon">A Roguelike of the Margins</div>' +
      '<div class="logo"><span class="cap">M</span>arginalia</div>' +
      '<div class="knight art">' + playerArt(hero) + '</div>' +
      '<div class="flavor" style="max-width:300px">The drolleries have crawled off their pages. Ride out from the lower margin and close the book.</div>' +
      '<div class="btns">' +
      (saved ? '<button class="btn primary" data-a="continue">Continue <span class="daily">' + esc(charDef(saved.char).short || '') + ' · ' + (saved.daily ? 'Daily ' + esc(dailyDate(saved.seed)) : 'Seed ' + esc(saved.seed)) + ' · Quire ' + (ACTS[saved.act] || ACTS[1]).roman + (saved.floor ? ', folio ' + saved.floor : '') + (saved.asc ? ' · Rub. ' + roman(saved.asc) : '') + '</span></button>' : '') +
      '<button class="btn gold" data-a="daily">Daily Folio<span class="daily">' + esc(prettyDate(dd)) + (today ? ' · thy best: ' + today.score + (today.won ? ', closed' : '') : '') + '</span>' +
      (dmods.length ? '<span class="dmods">' + dmods.map(function (id) { return '<span class="dm">' + esc(modDef(id).name) + '</span>'; }).join('<span class="amp"> &amp; </span>') + '</span>' : '') + '</button>' +
      '<button class="btn ' + (saved ? '' : 'primary') + '" data-a="newRun">New Run</button>' +
      '<div class="row2"><button class="btn small" data-a="book">The Book <span class="pct">' + bp + '%</span></button><button class="btn small" data-a="seed">Enter Seed</button></div>' +
      '<div class="row2"><button class="btn small" data-a="howto">How to Play</button><button class="btn small" data-a="glossary">Glossary</button></div>' +
      '</div>' +
      '<div class="foot">' + (book.runs ? 'Runs ' + book.runs + ' · Books closed ' + book.wins + ' · Achievements ' + book.ach.length + '/' + Object.keys(M.ACHIEVEMENTS || {}).length : 'Portrait, one thumb, one quill.') + '</div>' +
      '</div>';
    app.innerHTML = h; ui.mounted = 'title';
  }

  // ----- character select (New Run, Daily Folio, Enter Seed all pass through here)
  function openCharSel(mode, seed) {
    var ids = charIds(), ch = prefs.char && ids.indexOf(prefs.char) >= 0 && charUnlocked(prefs.char) ? prefs.char : 'knight';
    if (ids.indexOf(ch) < 0) ch = ids[0];
    ui.cs = { mode: mode, seed: seed || (mode === 'daily' ? M.dailySeed() : null), char: ch, asc: 0 };
    ui.cs.asc = csAscFor(ch);
    closeOv(); ui.view = 'charsel'; ui.mounted = null; Sfx.page(); render();
  }
  function csAscFor(ch) { if (ui.cs.mode === 'daily') return 0; var p = (prefs.asc || {})[ch]; return Math.max(0, Math.min(rubMax(ch), p == null ? rubMax(ch) : p)); }
  function pipsHtml(cols) {
    return '<span class="pips">' + (cols || []).map(function (p) { var P = M.PIGMENTS[p] || { color: '#6b5a4a' }; return '<span class="pr on" style="--pc:' + P.color + '">' + esc(p) + '</span>'; }).join('') + '</span>';
  }
  function renderCharSel() {
    var cs = ui.cs, ids = charIds(), C = charDef(cs.char), locked = !charUnlocked(cs.char), daily = cs.mode === 'daily';
    var h = '<div class="scr charsel' + (ui.mounted === 'charsel' ? '' : ' enter') + '">';
    h += '<div class="csHead"><button class="ib" data-a="title" aria-label="Back to the title page"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></span></button>' +
      '<div><div class="h-sub">' + (daily ? 'Daily Folio · ' + esc(prettyDate(dailyDate(cs.seed))) : cs.mode === 'seed' ? 'Seed ' + esc(cs.seed) : 'A New Run') + '</div><div class="h-title">Choose thy Hand</div></div><span class="ib" aria-hidden="true"></span></div>';
    if (daily) {
      var dm = M.dailyMods ? M.dailyMods(cs.seed) : [];
      h += '<div class="dailyBox"><div class="mods">' + dm.map(function (id) { return modChip(id, true); }).join('') + '</div>' +
        '<div class="note">All who ride today share these pages. <b>Rubrication is fixed at 0</b> for the Daily Folio; any unlocked hand may ride.</div></div>';
    }
    h += '<div class="csTabs" role="tablist">' + ids.map(function (id) {
      var c = charDef(id), lk = !charUnlocked(id);
      return '<button class="csTab' + (id === cs.char ? ' on' : '') + (lk ? ' locked' : '') + '" data-a="csPick" data-id="' + esc(id) + '" role="tab" aria-selected="' + (id === cs.char) + '" aria-label="' + esc(c.name + (lk ? ', locked' : '')) + '">' +
        '<span class="art">' + portraitArt(id) + '</span>' + (lk ? '<span class="lk">' + icon('lock') + '</span>' : '') + '<span class="nm">' + esc(c.short || c.name) + '</span></button>';
    }).join('') + '</div>';
    h += '<div class="page csBody"><div class="csCard' + (locked ? ' locked' : '') + '">' +
      '<div class="portrait art">' + portraitArt(cs.char) + '</div>' +
      '<div class="csName">' + esc(C.name) + '</div>' +
      '<div class="csMeta"><span class="hpv">' + icon('hp') + (C.hp || 70) + ' HP</span>' + pipsHtml(C.colors) + '</div>' +
      '<div class="csBlurb">' + esc(C.blurb || '') + '</div>';
    if (C.relic && M.RELICS[C.relic]) h += '<button class="csRelic" data-a="relicInfo" data-id="' + esc(C.relic) + '">' + relicBadge(C.relic) + '<span><small>Starting relic</small>' + esc(relicName(C.relic)) + '</span><span class="more">ⓘ</span></button>';
    if (locked) {
      var A = (M.ACHIEVEMENTS || {})[C.unlock] || { name: C.unlock, desc: '' };
      h += '<div class="csLock">' + icon('lock') + '<div><b>Unlocks:</b> ' + esc(A.name) + '<br><span>' + esc(A.desc) + '</span></div></div>';
    }
    h += '</div>';
    if (!locked) h += daily ? '' : rubPickerHtml(cs.char, cs.asc);
    h += '</div>';
    var saved = loadSave();
    h += '<div class="foot"><button class="btn primary' + (locked ? ' off' : '') + '" data-a="csBegin">' + (locked ? 'Locked' : 'Begin' + (daily ? ' the Folio' : '') + ' <span class="mult">score ' + multOf(daily ? 0 : cs.asc, daily ? (M.dailyMods ? M.dailyMods(cs.seed).length : 0) : 0) + '</span>') + '</button></div>';
    if (saved && !locked) h = h.replace('</div><div class="foot">', '<div class="flavor warnSave">Beginning anew will scrape thy unfinished run.</div></div><div class="foot">');
    return h + '</div>';
  }
  function rubPickerHtml(ch, asc) {
    var R = M.RUBRICS || [], max = rubMax(ch);
    if (!R.length) return '';
    var rules = R.slice(0, asc).map(function (r, i) { return '<li><b>' + roman(i + 1) + '</b> ' + esc(r.desc) + '</li>'; }).join('');
    var best = book.best[ch + ':' + asc];
    return '<div class="rubPick"><div class="shopSec">Rubrication</div>' +
      '<div class="rubStep"><button class="ib' + (asc <= 0 ? ' off' : '') + '" data-a="rubDown" aria-label="Lower Rubrication">‹</button>' +
      '<div class="rubCur" data-a="rubAll" role="button" aria-label="All Rubrication levels"><span class="rubNum">' + rn(asc) + '</span><b>' + esc(rubName(asc)) + '</b><small>Score ' + multOf(asc, 0) + (best ? ' · thy best ' + best : '') + '</small></div>' +
      '<button class="ib' + (asc >= max ? ' off' : '') + '" data-a="rubUp" aria-label="Raise Rubrication">›</button></div>' +
      (asc ? '<ol class="rubRules">' + rules + '</ol>' : '<div class="flavor" style="font-size:14px">The book as the scribe intended it. No added rules.</div>') +
      (max < R.length ? '<div class="rubNext">' + icon('lock') + ' Rubrication ' + roman(max + 1) + ' unlocks when thou closest the book ' + (max ? 'at ' + roman(max) : 'on plain vellum') + ' with this hand.</div>' : '') +
      '<div style="text-align:center"><button class="btn ghost small" data-a="rubAll">All levels</button></div></div>';
  }
  function showRubAll() {
    var cs = ui.cs, R = M.RUBRICS || [], max = rubMax(cs.char), rows = '';
    for (var i = 0; i <= R.length; i++) {
      var lk = i > max, best = book.best[cs.char + ':' + i];
      rows += '<button class="rubRow' + (i === cs.asc ? ' on' : '') + (lk ? ' locked' : '') + '" data-a="rubSet" data-n="' + i + '"' + (lk ? ' aria-disabled="true"' : '') + '>' +
        '<span class="rubNum">' + rn(i) + '</span><span class="rx"><b>' + esc(rubName(i)) + '</b><span>' + esc(i ? R[i - 1].desc : 'No added rules.') + '</span>' +
        '<small>' + (i > 1 ? 'Plus every rule above · ' : '') + 'score ' + multOf(i, 0) + (best ? ' · best ' + best : '') + '</small></span>' + (lk ? icon('lock') : '') + '</button>';
    }
    sheet('Rubrication', esc(charDef(cs.char).name) + ' · each level adds its rule to all below', '<div class="list">' + rows + '</div>');
  }
  function modChip(id, wide) {
    var m = modDef(id);
    return '<button class="modChip' + (wide ? ' wide' : '') + '" data-a="modInfo" data-id="' + esc(id) + '" aria-label="Modifier: ' + esc(m.name) + '"><span class="wax">' + esc((m.name || '?').replace(/^The /, '').charAt(0)) + '</span><span class="mn">' + esc(m.name) + (wide ? '<small>' + esc(m.desc) + '</small>' : '') + '</span></button>';
  }

  // ----- act intro
  function renderActIntro() {
    var A = ACTS[st.act] || ACTS[1];
    return '<div class="scr intro enter" data-a="proceed" role="button" aria-label="Turn the page">' +
      '<div class="frame">' +
      vineSvg() +
      '<div class="quire">The ' + ['', 'First', 'Second', 'Third'][st.act] + ' Quire</div>' +
      '<div class="num">' + A.roman + '</div>' +
      '<div class="actname">' + esc(A.name) + '</div>' +
      '<div class="flavor">' + esc(A.flav) + '</div>' +
      vineSvg(true) +
      '</div>' +
      ((st.mods && st.mods.length) || st.asc ? '<div class="introRules">' +
        (st.asc ? '<div class="ir"><span class="rubNum">' + roman(st.asc) + '</span><span><b>Rubrication ' + st.asc + '</b> — ' + esc(rubName(st.asc)) + '</span></div>' : '') +
        (st.mods || []).map(function (id) { var m = modDef(id); return '<div class="ir"><span class="wax">' + esc(m.name.charAt(0)) + '</span><span><b>' + esc(m.name) + '</b> — ' + esc(m.desc) + '</span></div>'; }).join('') +
        '</div>' : '') +
      '<div class="tap">Tap to turn the page</div></div>';
  }
  function vineSvg(flip) {
    return '<svg class="vines" viewBox="0 0 300 28" preserveAspectRatio="none" style="' + (flip ? 'transform:scaleY(-1)' : '') + '">' +
      '<path d="M10 14c30-16 50 16 80 0s50-16 60 0 30 16 60 0 50-16 80 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      [40, 110, 190, 260].map(function (x, i) { return '<path d="M' + x + ' ' + (i % 2 ? 18 : 10) + 'c6-8 14-8 16 0-6 4-12 4-16 0z" fill="#2f7d62" fill-opacity=".7" stroke="#2a1f1a" stroke-width="1"/>'; }).join('') +
      '<circle cx="150" cy="14" r="5" fill="#b8321f" stroke="#2a1f1a" stroke-width="1.2"/></svg>';
  }

  // ----- map
  function renderMap() {
    var rows = st.map.rows, R = rows.length, rowH = 92, padTop = 150, padBot = 86;
    var H = padTop + (R - 1) * rowH + padBot;
    var reach = M.reachable(st), cur = st.pos ? M.findNode(st, st.pos) : null, curRow = cur ? cur.r : -1;
    var X = function (n) { return 8 + n.x * 84; }, Y = function (n) { return padTop + (R - 1 - n.r) * rowH; };
    var paths = '';
    rows.forEach(function (row) {
      row.forEach(function (n) {
        n.next.forEach(function (id) {
          var m = M.findNode(st, id); if (!m) return;
          var x1 = X(n), y1 = Y(n), x2 = X(m), y2 = Y(m), hs = hash(n.id + id);
          var mx = (x1 + x2) / 2 + ((hs % 7) - 3) * 0.9, my = (y1 + y2) / 2 + ((hs % 5) - 2) * 4;
          var cls = (n.visited && m.visited) ? 'done' : (st.pos === n.id && reach.indexOf(id) >= 0) ? 'open' : '';
          paths += '<path class="path ' + cls + '" vector-effect="non-scaling-stroke" d="M' + x1.toFixed(2) + ' ' + (y1 - 22) + ' Q' + mx.toFixed(2) + ' ' + my + ' ' + x2.toFixed(2) + ' ' + (y2 + (m.type === 'boss' ? 40 : 24)) + '"/>';
        });
      });
    });
    var nodes = '';
    rows.forEach(function (row) {
      row.forEach(function (n) {
        var cls = ['node', 't-' + n.type];
        if (n.visited) cls.push('visited');
        if (st.pos === n.id) cls.push('here');
        if (reach.indexOf(n.id) >= 0) cls.push('reach');
        else if (n.r <= curRow && !n.visited) cls.push('past');
        var inner;
        if (n.type === 'boss') {
          var bs = bossIds();
          if (bs.length > 1) cls.push('duo');
          inner = bs.length ? bs.slice(0, 2).map(function (b) { return '<div class="art">' + artSvg(b) + '</div>'; }).join('') : icon('node_boss');
          inner += '<span class="lbl">' + esc(bossNames()) + '</span>';
        } else inner = icon('node_' + n.type) + (reach.indexOf(n.id) >= 0 ? '<span class="lbl">' + NODE_NAMES[n.type] + '</span>' : '');
        nodes += '<button class="' + cls.join(' ') + '" style="left:' + X(n).toFixed(2) + '%;top:' + Y(n) + 'px" data-a="node" data-id="' + n.id + '" aria-label="' + NODE_NAMES[n.type] + '">' + inner + '</button>';
      });
    });
    var doodles = '';
    for (var d = 0; d < 4; d++) {
      var y = padTop + 40 + d * rowH * 2.1, left = d % 2 ? 'right:-14px' : 'left:-14px';
      doodles += '<svg class="doodle" style="top:' + y + 'px;' + left + '" viewBox="0 0 60 60"><path d="M30 58C30 40 10 36 14 20s22-10 18 4-14 8-12-2" fill="none" stroke="#2f7d62" stroke-width="2.5" stroke-linecap="round"/><path d="M14 20c-8-2-10-10-4-12 4 4 6 8 4 12z" fill="#2f7d62"/><circle cx="32" cy="26" r="4" fill="#b8321f"/></svg>';
    }
    var bs = bossIds(), CH = charDef(st.char);
    var mapbar = '<div class="mapbar">' +
      '<button class="warden" data-a="bossInfo" aria-label="Guarding this Quire: ' + esc(bossNames()) + '"><span class="wa">' + (bs.length ? bs.slice(0, 2).map(function (b) { return '<span class="art">' + artSvg(b) + '</span>'; }).join('') : icon('node_boss')) + '</span>' +
      '<span class="wt"><small>Guarding the binding</small>' + esc(bossNames()) + '</span></button>' +
      (st.asc ? '<button class="sealBtn" data-a="rubInfo" aria-label="Rubrication ' + st.asc + '"><span class="wax rub">' + roman(st.asc) + '</span></button>' : '') +
      (st.mods || []).map(function (id) { return '<button class="sealBtn" data-a="modInfo" data-id="' + esc(id) + '" aria-label="Modifier: ' + esc(modDef(id).name) + '"><span class="wax">' + esc(modDef(id).name.charAt(0)) + '</span></button>'; }).join('') +
      '</div>';
    return '<div class="scr mapscr enter">' + hudHtml() + mapbar +
      '<div class="mapwrap" id="mapwrap"><div class="map" style="height:' + H + 'px">' +
      '<div class="quirehead"><div class="h-sub">Quire ' + (ACTS[st.act] || ACTS[1]).roman + (st.asc ? ' · Rubrication ' + roman(st.asc) : '') + '</div><div class="h-title" style="font-size:26px">' + esc(quireName(st.act)) + '</div>' +
      ((st.mods || []).length ? '<div class="qmods">' + st.mods.map(function (id) { return esc(modDef(id).name); }).join(' · ') + '</div>' : '') + '</div>' +
      doodles +
      '<svg class="paths" viewBox="0 0 100 ' + H + '" preserveAspectRatio="none">' + paths + '</svg>' + nodes +
      '<div class="quirefoot">' + (st.pos ? (st.char === 'knight' ? 'Ride on, Sir Knight.' : 'Onward, ' + esc(CH.short || CH.name) + '.') : 'Begin at the foot of the page.') + '</div>' +
      '</div></div>' +
      '<div class="legend">' + ['battle', 'elite', 'event', 'shop', 'rest', 'treasure'].map(function (t) { return '<span>' + icon('node_' + t) + NODE_NAMES[t] + '</span>'; }).join('') + '</div>' +
      '</div>';
  }
  function bossIds() { var b = st && st.map && st.map.boss; return (Array.isArray(b) ? b : b ? [b] : []).filter(function (id) { return M.ENEMIES[id]; }); }
  function bossNames() {
    var bs = bossIds(); if (!bs.length) return 'The Boss';
    var names = []; bs.forEach(function (id) { var n = M.ENEMIES[id].name; if (names.indexOf(n) < 0) names.push(n); });
    return names.join(' & ');
  }
  function showBossInfo() {
    var bs = bossIds(), seenB = {}; if (!bs.length) return;
    var body = bs.filter(function (id) { if (seenB[id]) return false; seenB[id] = 1; return true; }).map(function (id) {
      var d = M.ENEMIES[id];
      return '<div class="foeInfo"><div class="art">' + artSvg(id) + '</div><div class="line" style="text-align:center"><b>' + esc(d.name) + '</b></div>' + (d.desc ? '<div class="desc">' + esc(d.desc) + '</div>' : '') + '</div>';
    }).join('<div class="rule"></div>');
    dialog(bs.length > 1 ? 'The Wardens' : 'The Warden', '<p class="faded" style="margin:0 0 4px">' + (bs.length > 1 ? 'They guard' : 'It guards') + ' the top of Quire ' + (ACTS[st.act] || ACTS[1]).roman + '.</p>' + body, [{ label: 'Close', cls: 'primary' }]);
  }
  function afterMap() {
    var w = qs('#mapwrap'); if (!w) return;
    var R = st.map.rows.length, cur = st.pos ? M.findNode(st, st.pos) : null, nextRow = cur ? cur.r + 1 : 0;
    var y = 150 + (R - 1 - nextRow) * 92;
    w.scrollTop = Math.max(0, y - w.clientHeight * 0.55);
  }

  // ----- reward
  function renderReward() {
    var r = st.reward, h = '';
    var title = r.kind === 'boss' ? 'The Quire is Closed' : r.kind === 'elite' ? 'A Worthy Spoil' : 'Spoils';
    h += '<div class="pageHead"><div class="h-title">' + title + '</div><div class="fleuron"></div></div>';
    h += '<div class="loot">';
    h += '<button class="lootItem' + (r.goldTaken ? ' taken' : '') + '" data-a="takeGold">' + icon('silver') + '<span><b>' + r.gold + '</b> silver pennies<small>Tap to pocket</small></span></button>';
    if (r.relic) h += '<button class="lootItem' + (r.relicTaken ? ' taken' : '') + '" data-a="takeRelic">' + relicBadge(r.relic) + '<span>' + esc(relicName(r.relic)) + '<small>' + stripTags(M.relicText(r.relic)) + '</small></span></button>';
    h += '</div>';
    if (r.bossRelics && r.bossRelics.length && !r.relicTaken) {
      h += '<div class="shopSec">Choose a Boss Relic</div><div class="relicRow">' + r.bossRelics.map(function (id, i) {
        return '<div class="relicPick" data-a="bossRelic" data-idx="' + i + '" role="button" aria-label="' + esc(relicName(id)) + '">' + relicBadge(id, true) + '<div class="rn">' + esc(relicName(id)) + '</div><div class="rt">' + M.relicText(id) + '</div></div>';
      }).join('') + '</div>';
    }
    if (!r.cardTaken && r.cards && r.cards.length) {
      h += '<div class="shopSec">Choose a card for thy deck</div><div class="cardRow">' + r.cards.map(function (id, i) {
        return '<div class="slot">' + cardHtml({ id: id, up: M.passive(st, 'gildRewards') > 0 }, { cls: 'static mid', data: 'data-a="rewardCard" data-idx="' + i + '"', ctx: false }) + '</div>';
      }).join('') + '</div><div style="text-align:center"><button class="btn ghost small" data-a="skipCards">Skip the cards</button></div>';
    }
    return '<div class="scr enter">' + hudHtml() + '<div class="page">' + h + '</div>' +
      '<div class="foot"><button class="btn primary" data-a="leaveReward">' + (r.kind === 'boss' ? 'Turn to the next Quire' : 'Onward') + '</button></div></div>';
  }

  // ----- rest
  function renderRest() {
    var heal = Math.min(st.maxHp - st.hp, Math.round(st.maxHp * M.CONST.REST_HEAL) + M.passive(st, 'restHeal'));
    var canGild = st.deck.some(function (x) { return !x.up && M.CARDS[x.id] && M.CARDS[x.id].up; });
    return '<div class="scr enter">' + hudHtml() + '<div class="page">' +
      '<div class="pageHead"><div class="h-title">The Scriptorium</div><div class="flavor">A candle, a quiet desk, a moment’s peace.</div></div>' +
      candleSvg() +
      '<div class="restOpts">' +
      '<button class="restOpt mend" data-a="mend">' + icon('hp') + '<span class="nm">Mend</span><span>' + (heal > 0 ? 'Heal <b>' + heal + '</b> HP' : 'Thou art hale') + '</span><small>' + st.hp + ' / ' + st.maxHp + '</small></button>' +
      '<button class="restOpt gild' + (canGild ? '' : ' off') + '" data-a="gild">' + icon('node_treasure') + '<span class="nm">Gild</span><span>Upgrade a card</span><small>' + (canGild ? 'Gold leaf awaits' : 'Nothing left to gild') + '</small></button>' +
      '</div></div></div>';
  }
  function candleSvg() {
    return '<svg class="candle" viewBox="0 0 110 120"><ellipse cx="55" cy="112" rx="40" ry="6" fill="#2a1f1a" opacity=".15"/>' +
      '<path d="M22 112h66l-6-10H28z" fill="#c99a1e" stroke="#2a1f1a" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M42 102V50c0-3 26-3 26 0v52z" fill="#f4ead2" stroke="#2a1f1a" stroke-width="2.5"/><path d="M60 52c2 8 0 14 3 20" fill="none" stroke="#e4d2a8" stroke-width="3"/>' +
      '<path d="M55 50v-6" stroke="#2a1f1a" stroke-width="2"/>' +
      '<g style="transform-origin:55px 44px;animation:bob 1.6s ease-in-out infinite"><path d="M55 16c10 12 8 26 0 28-8-2-10-16 0-28z" fill="#f0d27a" stroke="#b8321f" stroke-width="2"/><path d="M55 28c4 6 3 12 0 13-3-1-4-7 0-13z" fill="#fff8d8"/></g></svg>';
  }

  // ----- pick
  function renderPick() {
    var p = st.pick, P = PURPOSE[p.purpose] || { t: 'Choose a Card', s: '', b: 'Choose' };
    var list = M.pickable(st);
    var g = list.map(function (inst) { return cardHtml(inst, { data: 'data-a="pickCard" data-uid="' + inst.uid + '"', ctx: false }); }).join('');
    return '<div class="scr enter">' + hudHtml() + '<div class="pageHead"><div class="h-title">' + P.t + '</div><div class="flavor">' + P.s + (p.cost ? ' Costs <b>' + p.cost + '</b> silver.' : '') + '</div></div>' +
      '<div class="page"><div class="grid">' + (g || '<div class="flavor">No card may be chosen.</div>') + '</div></div>' +
      ((p.cancel || !list.length) ? '<div class="foot"><button class="btn" data-a="cancelPick">' + (p.cancel ? 'Cancel' : 'Skip') + '</button></div>' : '') + '</div>';
  }

  // ----- treasure
  function renderTreasure() {
    var t = st.treasure, h = '<div class="pageHead"><div class="h-title">The Reliquary</div><div class="flavor">' + (t.opened ? 'Within, wrapped in silk:' : 'A gilded casket, its hasp unlatched.') + '</div></div>';
    h += '<div class="casket' + (t.opened ? ' open' : '') + '" data-a="openChest" role="button" aria-label="Open the casket">' + casketSvg() + '</div>';
    if (t.opened) {
      h += '<div class="loot">';
      h += '<div class="lootItem">' + icon('silver') + '<span><b>' + t.gold + '</b> silver pennies</span></div>';
      if (t.relic) h += '<div class="lootItem" role="button" data-a="relicInfo" data-id="' + esc(t.relic) + '">' + relicBadge(t.relic) + '<span>' + esc(relicName(t.relic)) + '<small>' + stripTags(M.relicText(t.relic)) + '</small></span></div>';
      h += '</div>';
    } else h += '<div class="flavor">Tap the casket to open it.</div>';
    return '<div class="scr enter">' + hudHtml() + '<div class="page">' + h + '</div>' +
      '<div class="foot">' + (t.opened ? '<button class="btn primary" data-a="leaveTreasure">Onward</button>' : '<button class="btn gold" data-a="openChest">Open the Reliquary</button>') + '</div></div>';
  }
  function casketSvg() {
    return '<svg viewBox="0 0 200 170"><g class="rays" stroke="#f0d27a" stroke-width="5" stroke-linecap="round" opacity=".9">' +
      '<path d="M100 60V12M70 66L48 26M130 66l22-40M50 80L14 62M150 80l36-18"/></g>' +
      '<ellipse cx="100" cy="160" rx="80" ry="8" fill="#2a1f1a" opacity=".18"/>' +
      '<path d="M30 80h140v70H30z" fill="#7a5230" fill-opacity=".9" stroke="#2a1f1a" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M30 100h140M30 132h140" stroke="#c99a1e" stroke-width="6"/><path d="M60 80v70M140 80v70" stroke="#c99a1e" stroke-width="5"/>' +
      '<circle cx="100" cy="112" r="9" fill="#f0d27a" stroke="#2a1f1a" stroke-width="3"/><path d="M100 112v8" stroke="#2a1f1a" stroke-width="3"/>' +
      '<g class="lid"><path d="M26 80c0-30 30-44 74-44s74 14 74 44z" fill="#9a6a3c" stroke="#2a1f1a" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M60 80c0-24 8-36 0-40M140 80c0-24-8-36 0-40" fill="none" stroke="#c99a1e" stroke-width="5"/>' +
      '<path d="M88 54l12-10 12 10-12 10z" fill="#b8321f" stroke="#2a1f1a" stroke-width="2.5"/></g></svg>';
  }

  // ----- shop
  function renderShop() {
    var s = st.shop, h = '';
    h += '<div class="pageHead"><div class="h-title">The Stationer</div></div>';
    h += '<div class="keeper"><div class="art">' + artSvg('stationer') + '</div><div>“Fine vellum, finer pigments. Mind the prices; I mind the till.”</div></div>';
    h += '<div class="shopSec">Cards</div><div class="grid">' + s.cards.map(function (c, i) {
      var poor = st.gold < c.price;
      return '<div class="shopItem' + (c.sold ? ' sold' : '') + (poor ? ' poor' : '') + '" data-a="shopCard" data-idx="' + i + '" role="button" aria-label="' + esc(cardName(c.id) + ', ' + c.price + ' silver') + '">' +
        cardHtml({ id: c.id, up: M.passive(st, 'gildRewards') > 0 }, { ctx: false }) +
        '<span class="price' + (poor ? ' no' : c.sale ? ' sale' : '') + '">' + icon('silver') + c.price + (c.sale ? ' <span class="tag">Sale</span>' : '') + '</span></div>';
    }).join('') + '</div>';
    if (s.relics.length) {
      h += '<div class="shopSec">Relics</div><div class="relicRow">' + s.relics.map(function (r, i) {
        var poor = st.gold < r.price;
        return '<div class="shopItem relicPick' + (r.sold ? ' sold' : '') + (poor ? ' poor' : '') + '" data-a="shopRelic" data-idx="' + i + '" role="button" aria-label="' + esc(relicName(r.id) + ', ' + r.price + ' silver') + '">' + relicBadge(r.id, true) +
          '<div class="rn">' + esc(relicName(r.id)) + '</div><span class="price' + (poor ? ' no' : '') + '">' + icon('silver') + r.price + '</span></div>';
      }).join('') + '</div>';
    }
    var rp = M.removePrice(st), canGild = st.deck.some(function (x) { return !x.up && M.CARDS[x.id] && M.CARDS[x.id].up; });
    h += '<div class="shopSec">Services</div><div class="services">' +
      '<button class="btn small' + (s.removeUsed || st.gold < rp ? ' off' : '') + '" data-a="buyRemove">Scrape a card<small>' + (s.removeUsed ? 'done' : rp + ' silver') + '</small></button>' +
      '<button class="btn small' + (s.gildUsed || st.gold < s.gildPrice || !canGild ? ' off' : '') + '" data-a="buyGild">Gild a card<small>' + (s.gildUsed ? 'done' : s.gildPrice + ' silver') + '</small></button></div>';
    return '<div class="scr enter">' + hudHtml() + '<div class="page">' + h + '</div><div class="foot"><button class="btn primary" data-a="leaveShop">Leave the Stationer</button></div></div>';
  }

  // ----- event
  function renderEvent() {
    var ev = st.event, d = M.EVENTS[ev.id] || { title: 'Apocrypha', text: '', choices: [] }, h = '';
    h += '<div class="pageHead"><div class="h-sub">Apocrypha</div><div class="h-title">' + esc(d.title) + '</div></div>';
    var scene = d.art && M.ART && M.ART.enemies && M.ART.enemies[d.art] ? '<div class="art">' + artSvg(d.art) + '</div>' : (d.icon ? icon(d.icon) : icon('node_event'));
    h += '<div class="mini"><span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span><div class="scene">' + scene + '</div></div>';
    if (ev.stage === 'choice') {
      h += '<div class="evText">' + d.text + '</div><div class="choices">' + (d.choices || []).map(function (c, i) {
        var okc = M.choiceAvailable(st, c);
        return '<button class="choice" data-a="eventChoice" data-idx="' + i + '"' + (okc ? '' : ' disabled') + '><span class="cl">' + esc(c.label) + '</span><span class="cd">' + (c.desc || '') + (okc ? '' : reqText(c.req)) + '</span></button>';
      }).join('') + '</div>';
      return '<div class="scr enter">' + hudHtml() + '<div class="page">' + h + '</div></div>';
    }
    h += '<div class="evText faded" style="font-size:15px">' + d.text + '</div><div class="rule"></div><div class="result">' + (ev.result || 'And so it was.') + '</div>';
    return '<div class="scr enter">' + hudHtml() + '<div class="page">' + h + '</div><div class="foot"><button class="btn primary" data-a="leaveEvent">Continue</button></div></div>';
  }
  function reqText(r) {
    if (!r) return '';
    var p = [];
    if (r.gold != null) p.push(r.gold + ' silver');
    if (r.hp != null) p.push('more than ' + r.hp + ' HP');
    if (r.relic) p.push(relicName(r.relic));
    return ' <i class="rub">(Requires ' + p.join(', ') + ')</i>';
  }

  // ----- end
  function renderEnd() {
    recordEnd(); lsDel(SAVE_KEY);
    var won = st.won, s = st.stats, sc = M.score(st), CH = charDef(st.char);
    var achs = (st.uiAch || []).map(function (id) {
      var it = unlockList(id);
      return '<div class="endAch"><span class="achSeal">' + SEAL_GLYPH + '</span><div><b>' + esc(achName(id)) + '</b>' + (it.length ? '<small>Unlocked: ' + esc(it.join(', ')) + '</small>' : '') + '</div></div>';
    }).join('');
    var h = '<div class="folio ' + (won ? 'win' : 'lose') + '">' +
      '<div class="h-sub">' + (st.daily ? 'Daily Folio · ' + esc(prettyDate(dailyDate(st.seed))) : 'Seed ' + esc(st.seed)) + '</div>' +
      '<div class="verdict">' + (won ? 'Explicit!' : 'Blotted Out') + '</div>' +
      '<div class="flavor">' + (won ? 'Thou hast ridden to the binding and closed the book. The drolleries sleep once more.' : 'Thy ink has run dry in Quire ' + (ACTS[st.act] || ACTS[1]).roman + ', ' + esc(quireName(st.act)) + '.') + '</div>' +
      '<div class="art">' + playerArt(st.char) + '</div>' +
      '<div class="endWho">' + esc(CH.name) + (st.asc ? ' · Rubrication ' + roman(st.asc) + ' <i>(' + esc(rubName(st.asc)) + ')</i>' : ' · plain vellum') + '</div>' +
      ((st.mods || []).length ? '<div class="endMods">' + st.mods.map(function (id) { return modChip(id); }).join('') + '</div>' : '') +
      '<div class="score">Score<b>' + sc + '</b><small>' + M.baseScore(st) + ' × ' + (Math.round(M.scoreMult(st) * 100) / 100) + (st.uiBest ? ' · a new best for this hand &amp; rubric' : '') + '</small></div>' +
      (st.uiRubUp ? '<div class="rubUp"><span class="rubNum">' + roman(st.uiRubUp) + '</span><div><b>Rubrication ' + roman(st.uiRubUp) + ' unlocked</b><small>' + esc(rubName(st.uiRubUp)) + ' — ' + esc(((M.RUBRICS || [])[st.uiRubUp - 1] || {}).desc || '') + '</small></div></div>' : '') +
      (achs ? '<div class="shopSec">Earned this run</div><div class="endAchs">' + achs + '</div>' : '') +
      '<div class="stats">' +
      [['Folios', s.floors], ['Foes slain', s.kills], ['Elites', s.elites], ['Bosses', s.bosses], ['Cards played', s.cards], ['Illuminations', s.illum], ['Damage', s.dmg], ['Turns', s.turns], ['Silver', st.gold], ['Deck', st.deck.length]]
        .map(function (p) { return '<div><span>' + p[0] + '</span><span>' + p[1] + '</span></div>'; }).join('') +
      '</div><div class="seedline">Seed: ' + esc(st.seed) + '</div></div>';
    return '<div class="scr enter"><div class="page">' + h + '</div>' +
      '<div class="foot" style="flex-wrap:wrap"><button class="btn gold" data-a="share">Share</button><button class="btn primary" data-a="newRun">New Run</button>' +
      '<div class="row2" style="flex-basis:100%;display:flex;gap:10px"><button class="btn ghost small" data-a="book" style="flex:1">The Book</button><button class="btn ghost small" data-a="title" style="flex:1">Title page</button></div></div></div>';
  }
  function shareText() {
    var sc = M.score(st);
    var head = st.daily ? 'Marginalia — Daily Folio ' + dailyDate(st.seed) : 'Marginalia — Seed ' + st.seed;
    var who = charDef(st.char).short || 'Knight';
    var res = st.won ? 'Closed the book!' : 'Blotted out in Quire ' + (ACTS[st.act] || ACTS[1]).roman + ', folio ' + st.floor;
    var mods = (st.mods || []).length ? ' [' + st.mods.map(function (id) { return modDef(id).name; }).join(' + ') + ']' : '';
    return head + mods + ' — ' + who + (st.asc ? ', Rubrication ' + roman(st.asc) : '') + ' — ' + res + ' Score ' + sc;
  }
  function copyText(t, viewer) {
    var show = viewer || showText;
    var fallback = function () {
      try {
        var ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '-1000px';
        document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, t.length); var ok = document.execCommand('copy'); ta.remove();
        toast(ok ? 'Copied to clipboard' : 'Could not copy'); if (!ok) show(t);
      } catch (e) { show(t); }
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { toast('Copied to clipboard'); }, fallback);
      else fallback();
    } catch (e) { fallback(); }
  }
  function showReport(t) {
    dialog('Diagnostic report', '<p class="faded" style="margin:0 0 6px;font-size:14px">Select all, copy, and paste it to Claude. It holds only this device’s last fight or two, the seed, and any errors.</p><textarea id="diagTa" readonly spellcheck="false" style="width:100%;height:46vh;box-sizing:border-box;font:11px/1.3 ui-monospace,Menlo,monospace;-webkit-user-select:text;user-select:text">' + esc(t) + '</textarea>', [{ label: 'Close', cls: 'primary' }]);
    var ta = document.getElementById('diagTa'); if (ta) { try { ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length); } catch (e) { } }
  }
  function showText(t) { dialog('Share', '<p style="-webkit-user-select:text;user-select:text">' + esc(t) + '</p>', [{ label: 'Close', cls: 'primary' }]); }

  /* =========================================================== 7. combat */
  function combatKey() { var c = st.combat; return 'combat:' + st.act + ':' + st.floor + ':' + c.kind + ':' + c.enemies.map(function (e) { return e.uid + e.id; }).join(','); }
  function mountCombat() {
    app.innerHTML = '<div class="scr combat enter">' + hudHtml() +
      '<div class="field" data-a="field">' +
      '<div class="margin" id="cMargin"></div>' +
      '<div class="main"><div class="foes" id="cFoes"></div>' +
      '<div class="heroRow"><div class="hero" id="cHero" data-a="hero" role="button" aria-label="' + esc(charDef(st.char).name) + '"></div><div class="heroSide"><div class="illum" id="cIllum" data-a="illumInfo" role="button"></div><div class="hint" id="cHint"></div></div></div>' +
      '</div></div>' +
      '<div class="tray" id="cTray"></div>' +
      '<div class="hand" id="cHand"></div></div>';
    ui.mounted = combatKey(); ui.prevHand = {}; ui.summoned = {};
    if (st.combat.kind === 'boss' && !st.combat.over) Sfx.drone(true);
  }
  function updateCombat() {
    var c = st.combat; if (!c) return;
    // hud bits (relic strip + numbers)
    var hud = qs('.scr.combat .hud'); if (hud) { var tmp = document.createElement('div'); tmp.innerHTML = hudHtml(); var rel = qs('.scr.combat .relics'); hud.replaceWith(tmp.firstChild); if (rel) rel.replaceWith(tmp.firstChild); }
    // margin
    var mh = '<div class="mtitle">Margin</div>';
    var slots = M.marginSlots ? M.marginSlots(st) : M.CONST.MARGIN_SLOTS;
    qs('#cMargin').classList.toggle('wide', slots > 3);
    for (var i = 0; i < slots; i++) {
      var g = c.margin[i];
      if (g) {
        var d = M.cardDef(g), pc = (M.PIGMENTS[d.pigment] || {}).color || '#6b5a4a';
        var fresh = ui.freshGloss === g.id && i === c.margin.length - 1;
        mh += '<div class="gl' + (fresh ? ' fresh' : '') + '" style="--pc:' + pc + '" role="button" aria-label="Gloss: ' + esc(d.name) + '" data-a="glossInfo" data-idx="' + i + '" data-id="' + esc(g.id) + '"><span class="gn">' + esc(d.name) + (g.up ? '+' : '') + '</span>' + glossShort(d) + '</div>';
      } else mh += '<div class="gl empty">' + (i === 0 && !c.margin.length ? 'glosses<br>go here' : '·') + '</div>';
    }
    ui.freshGloss = null;
    qs('#cMargin').innerHTML = mh;
    // foes
    var live = c.enemies.filter(function (e) { return !e.dead; });
    var fe = qs('#cFoes'); fe.className = 'foes n' + live.length;
    fe.innerHTML = c.enemies.map(function (e, i) { return foeHtml(e, i); }).join('');
    ui.popIntents = false; ui.summoned = {};
    // hero
    qs('#cHero').innerHTML = '<div class="art">' + playerArt(st.char) + '</div>' + barHtml(st.hp, st.maxHp, c.player.ward) + '<div class="chips">' + chipsHtml(c.player.st) + '</div>';
    // illumination
    qs('#cIllum').outerHTML = illumHtml();
    // tray
    var anyPlayable = c.hand.some(function (x, k) { return M.canPlay(st, k); });
    qs('#cTray').innerHTML =
      '<button class="pile" id="pDraw" data-a="pile" data-p="draw">' + icon('draw_pile') + '<span class="n">' + c.draw.length + '</span><span class="t">draw</span></button>' +
      '<div class="inkpot' + (c.ink ? '' : ' empty') + '" id="cInk" data-a="inkInfo" role="button" aria-label="' + c.ink + ' Ink">' + inkpotSvg() + '<div class="v">' + c.ink + '<small>/' + (M.CONST.BASE_INK + M.passive(st, 'ink')) + '</small></div></div>' +
      '<button class="pile" id="pDisc" data-a="pile" data-p="discard">' + icon('discard_pile') + '<span class="n">' + c.discard.length + '</span><span class="t">discard</span></button>' +
      '<button class="pile" id="pScr" data-a="pile" data-p="scraped">' + icon('scraped') + '<span class="n">' + c.scraped.length + '</span><span class="t">scraped</span></button>' +
      '<button class="seal' + (!anyPlayable && !c.over ? ' glow' : '') + '" id="cSeal" data-a="endTurn"' + (c.over ? ' disabled' : '') + '>End<br>Turn</button>';
    renderHand();
    refreshHint();
  }
  function glossShort(d) {
    var hs = d.gloss ? (Array.isArray(d.gloss) ? d.gloss : [d.gloss]) : [];
    var t = hs.map(function (h) { return M.hookText ? M.hookText(h) : ''; }).join('; ');
    t = stripTags(t).replace(/^At the start of your turn, /, 'Each turn: ').replace(/^Whenever you play /, 'On ').replace(/^At the end of your turn, /, 'Turn end: ').replace(/^Whenever you Illuminate, /, 'Illuminate: ');
    if (t.length > 40) t = t.slice(0, 38).replace(/\s+\S*$/, '') + '…';
    return esc(t);
  }
  function inkpotSvg() {
    return '<svg viewBox="0 0 58 58"><ellipse cx="29" cy="53" rx="20" ry="3.5" fill="#2a1f1a" opacity=".2"/>' +
      '<path d="M14 24c-4 6-5 20 0 26 8 5 22 5 30 0 5-6 4-20 0-26z" fill="#2a1f1a" stroke="#120c09" stroke-width="2"/>' +
      '<path d="M18 16h22v8H18z" fill="#3d2e25" stroke="#120c09" stroke-width="2"/>' +
      '<path d="M18 30c-2 6-2 12 0 16" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".25" fill="none"/>' +
      '<path d="M34 16C40 6 48 3 54 1c-5 5-9 9-14 18" fill="#f4ead2" stroke="#2a1f1a" stroke-width="1.6" stroke-linejoin="round"/><path d="M36 17c5-6 10-11 17-15" stroke="#6b5a4a" stroke-width="1" fill="none"/></svg>';
  }
  function illumHtml() {
    var c = st.combat, need = M.illumNeed(st), prog = M.illumProgress(st);
    var order = ['V', 'L', 'G'], slots = order.map(function (p) { return { p: p, on: c.pig[p] > 0, gilt: false }; });
    var gold = c.pig.A || 0;
    slots.forEach(function (s) { if (!s.on && gold > 0) { s.gilt = true; gold--; } });
    var h = '<div class="illum' + (c.illum ? ' done' : '') + '" id="cIllum" data-a="illumInfo" role="button" aria-label="Illumination ' + (c.illum ? 'done' : prog + ' of ' + need) + '"><span class="lab">' + (c.illum ? 'Illuminated' : 'Illuminate ' + prog + '/' + need) + '</span>';
    slots.forEach(function (s) {
      var col = M.PIGMENTS[s.p].color;
      h += '<span class="pr' + (s.on || c.illum ? ' on' : '') + (s.gilt && !c.illum ? ' gilt' : '') + '" style="--pc:' + col + '">' + s.p + '</span>';
    });
    return h + '</div>';
  }
  function barHtml(hp, max, ward) {
    var f = max ? Math.max(0, Math.min(1, hp / max)) : 0;
    return '<div class="bar' + (ward > 0 ? ' warded' : '') + '"><div class="ghost" style="transform:scaleX(' + f + ')"></div><div class="fill" style="transform:scaleX(' + f + ')"></div><span class="num">' + hp + '/' + max + '</span>' +
      '<div class="wardb" style="' + (ward > 0 ? '' : 'display:none') + '">' + icon('ward') + '<span>' + ward + '</span></div></div>';
  }
  function setBar(bar, hp, max, ward) {
    var f = max ? Math.max(0, Math.min(1, hp / max)) : 0;
    bar.querySelector('.fill').style.transform = 'scaleX(' + f + ')';
    bar.querySelector('.ghost').style.transform = 'scaleX(' + f + ')';
    bar.querySelector('.num').textContent = hp + '/' + max;
    var w = bar.querySelector('.wardb'); w.style.display = ward > 0 ? '' : 'none'; w.querySelector('span').textContent = ward;
    bar.classList.toggle('warded', ward > 0);
  }
  function chipsHtml(sts, pop) {
    return Object.keys(sts || {}).filter(function (k) { return sts[k]; }).map(function (k) {
      var d = M.STATUS[k] || { good: true }, good = d.good ? sts[k] > 0 : sts[k] < 0;
      return '<span class="chip ' + (good ? 'good' : 'bad') + (pop === k ? ' pop' : '') + '">' + icon('st_' + k) + sts[k] + '</span>';
    }).join('');
  }
  function foeHtml(e, i) {
    if (e.dead) return '<div class="foe dead" data-uid="' + e.uid + '" data-ei="' + i + '"></div>';
    var d = M.ENEMIES[e.id] || {}, size = d.size || (d.tier === 'boss' ? 'l' : d.tier === 'minion' ? 's' : 'm');
    var info = { kinds: ['unknown'] }; try { info = M.intentInfo(st, e); } catch (x) { }
    var ints = '';
    if (!st.combat.over) {
      var k0 = info.kinds[0] || 'unknown', atk = info.kinds.indexOf('attack') >= 0;
      ints = '<div class="intent' + (atk ? ' atk' : '') + (ui.popIntents ? ' pop' : '') + '">' + icon('intent_' + (atk ? 'attack' : k0));
      if (atk) ints += '<b>' + info.dmg + '</b>' + (info.times > 1 ? '<span class="x">×' + info.times + '</span>' : '');
      info.kinds.filter(function (k) { return k !== 'attack' && (atk || k !== k0); }).slice(0, 2).forEach(function (k) { ints += icon('intent_' + k); });
      ints += '</div>';
    }
    var bw = size === 's' ? 70 : size === 'l' ? 120 : 92;
    var lab = e.name + ', ' + e.hp + ' of ' + e.maxHp + ' HP' + (e.ward ? ', ' + e.ward + ' Ward' : '') + (st.combat.over ? '' : ', intends ' + (info.name || info.kinds.join(' ')) + (info.dmg ? ' ' + info.dmg + (info.times > 1 ? '×' + info.times : '') : ''));
    return '<div class="foe sz-' + size + (ui.summoned[e.uid] ? ' summoned' : '') + targetCls(i) + '" data-uid="' + e.uid + '" data-ei="' + i + '" data-a="foe" role="button" aria-label="' + esc(lab) + '" style="--bw:' + bw + 'px">' + ints +
      '<div class="art">' + artSvg(e.id) + '</div>' + barHtml(e.hp, e.maxHp, e.ward) + '<div class="chips">' + chipsHtml(e.st) + '</div><div class="nm">' + esc(e.name) + '</div></div>';
  }
  function targetCls() {
    var inst = selInst(); if (!inst) return '';
    var d = M.cardDef(inst); return d.target === 'enemy' ? ' targetable' : '';
  }
  function selIndex() { if (ui.selUid == null || !st.combat) return -1; for (var i = 0; i < st.combat.hand.length; i++) if (st.combat.hand[i].uid === ui.selUid) return i; return -1; }
  function selInst() { var i = selIndex(); return i >= 0 ? st.combat.hand[i] : null; }
  function clearTargeting() { qsa('.foe.targetable, .foe.aim').forEach(function (f) { f.classList.remove('targetable', 'aim'); }); }
  function applyTargeting() {
    clearTargeting(); var inst = selInst(); if (!inst) return;
    if (M.cardDef(inst).target === 'enemy') qsa('#cFoes .foe:not(.dead)').forEach(function (f) { f.classList.add('targetable'); });
  }
  function setHint(t, warn) { ui.hintMsg = t; ui.hintWarn = !!warn; var h = qs('#cHint'); if (h) { h.textContent = t; h.classList.toggle('warn', !!warn); } }
  function refreshHint() {
    var c = st.combat; if (!c) return;
    var inst = selInst(), t = '', w = false;
    if (inst) {
      var i = selIndex(), d = M.cardDef(inst);
      if (!M.canPlay(st, i)) { t = inst.stone ? 'Turned to stone — it cannot be played this turn.' : (M.cardCost(st, inst) == null || d.unplayable) ? 'This card cannot be played.' : 'Not enough Ink.'; w = true; }
      else if (d.target === 'enemy' && M.living(st).length > 1) t = 'Tap a foe to strike it.';
      else t = 'Tap again, or drag up, to play.';
    } else if (c.turn === 1 && c.played === 0 && st.floor <= 1) t = 'Tap a card to raise it.';
    else if (!c.hand.some(function (x, k) { return M.canPlay(st, k); })) t = 'Seal thy turn when ready.';
    setHint(t, w);
  }

  // ----- cards
  function cardInner(inst, ctx) {
    var d = M.cardDef(inst), inC = ctx && st && st.combat;
    var cost = inC ? M.cardCost(st, inst) : d.cost, base = M.CARDS[inst.id] ? M.CARDS[inst.id].cost : d.cost;
    var costCls = (inC && cost != null && base != null && cost < base) ? ' cheap' : '';
    var name = d.name || inst.id, first = name.charAt(0), rest = name.slice(1);
    var text = ''; try { text = M.cardText(inst, inC ? st : null); } catch (e) { text = ''; }
    var tname = TYPE_NAMES[d.type] || d.type || '';
    return '<div class="band"></div>' +
      (cost != null && !d.unplayable ? '<div class="cost' + costCls + '"><svg viewBox="0 0 25 30"><path d="M12.5 1.5C16 8 22 13 22 19.5a9.5 9.5 0 01-19 0C3 13 9 8 12.5 1.5z" fill="#2a1f1a" stroke="#0d0806" stroke-width="1.2"/><ellipse cx="8.5" cy="17" rx="2" ry="3.6" fill="#fff" opacity=".22"/></svg><span>' + cost + '</span></div>' : '') +
      '<div class="nm"><span class="dc">' + esc(first) + '</span><span class="tx">' + esc(rest) + '</span></div>' +
      '<div class="ty">' + icon('type_' + d.type) + esc(tname) + '</div>' +
      '<div class="rt"><div>' + text + '</div></div>' +
      '<span class="wm">' + iconSvg('type_' + d.type) + '</span>' +
      (inst.stone && inC ? '<div class="stoneOv" aria-hidden="true"><span>Stone</span></div>' : '');
  }
  function cardClasses(inst) {
    var d = M.cardDef(inst);
    return 'card p-' + (d.pigment || 'N') + ' t-' + (d.type || 'skill') + ((inst.up || d._gilded) ? ' gilt' : '') + (inst.stone && st && st.combat ? ' stone' : '');
  }
  function cardHtml(inst, o) {
    o = o || {};
    return '<div class="' + cardClasses(inst) + ' ' + (o.cls || 'static') + '" ' + (o.data ? o.data + ' role="button" aria-label="' + esc(cardLabel(inst)) + '"' : '') + '>' + cardInner(inst, o.ctx) + '</div>';
  }
  function cardLabel(inst, ctx) {
    var d = M.cardDef(inst), cost = ctx && st && st.combat ? M.cardCost(st, inst) : d.cost, t = '';
    try { t = stripTags(M.cardText(inst, ctx ? st : null)); } catch (e) { }
    return (d.name || inst.id) + (inst.up ? ' plus' : '') + (inst.stone && ctx ? ', turned to stone' : '') + (cost != null && !d.unplayable ? ', cost ' + cost : '') + ', ' + (TYPE_NAMES[d.type] || '') + '. ' + t;
  }
  function fitCard(el) {
    var rt = el.querySelector('.rt'), inner = rt && rt.firstChild; if (!inner) return;
    rt.style.fontSize = ''; var fs = parseFloat(getComputedStyle(rt).fontSize) || 10, n = 0;
    while (inner.offsetHeight > rt.clientHeight + 1 && fs > 6.5 && n++ < 12) { fs -= 0.5; rt.style.fontSize = fs + 'px'; }
    var nm = el.querySelector('.nm .tx'); if (nm) { var nf = parseFloat(getComputedStyle(nm).fontSize) || 11, k = 0; nm.style.fontSize = ''; while (nm.offsetHeight > nf * 2.3 && k++ < 6) { nf -= 0.5; nm.style.fontSize = nf + 'px'; } }
  }
  function fitAll(root) { qsa('.card', root || app).forEach(fitCard); }

  // ----- hand (keyed so cards glide when the hand changes)
  function renderHand() {
    var c = st.combat, hand = qs('#cHand'); if (!hand) return;
    var existing = {}; qsa('.card', hand).forEach(function (el) { existing[el.getAttribute('data-uid')] = el; });
    var seen = {}, newCount = 0;
    if (ui.selUid != null && selIndex() < 0) ui.selUid = null;
    c.hand.forEach(function (inst, i) {
      var key = String(inst.uid), el = existing[key];
      var cls = cardClasses(inst) + (M.canPlay(st, i) ? '' : ' dim') + (ui.selUid === inst.uid ? ' sel' : '');
      if (inst.stone && ui.stoneFresh[inst.uid]) { cls += ' stoning'; delete ui.stoneFresh[inst.uid]; }
      else if (inst.stone && el && el.classList.contains('stoning')) cls += ' stoning';
      var html = cardInner(inst, true);
      if (!el) {
        el = document.createElement('div'); el.setAttribute('data-uid', key); el.setAttribute('role', 'button'); el.innerHTML = html; el._h = html;
        if (!ui.prevHand[key]) { el.classList.add('deal'); el.style.animationDelay = (newCount++ * 70) + 'ms'; }
        hand.appendChild(el);
      } else if (el._h !== html) { el.innerHTML = html; el._h = html; }
      if (el._h !== el._lh) { el._lh = el._h; el.setAttribute('aria-label', cardLabel(inst, true)); }
      el.className = cls + (el.classList.contains('deal') ? ' deal' : '');
      el.style.visibility = '';
      el.setAttribute('data-hi', i);
      seen[key] = true; hand.appendChild(el); // keep DOM order == hand order
      setTimeout((function (e2) { return function () { e2.classList.remove('deal'); e2.style.animationDelay = ''; }; })(el), 450 + newCount * 70);
    });
    Object.keys(existing).forEach(function (k) { if (!seen[k]) existing[k].remove(); });
    ui.prevHand = seen;
    layoutHand();
    qsa('.card', hand).forEach(fitCard);
    applyTargeting();
  }
  function layoutHand() {
    var hand = qs('#cHand'); if (!hand) return;
    var cards = qsa('.card', hand), n = cards.length; if (!n) return;
    var W = hand.clientWidth, cw = cards[0].offsetWidth || 94, chh = cards[0].offsetHeight || 134;
    // keep the cost drop (which overhangs the top-left corner by ~8px) and the fan's rotation on screen
    var padL = 13, padR = 10, avail = W - padL - padR, step = n > 1 ? Math.min(cw * 0.94, (avail - cw) / (n - 1)) : 0;
    var total = cw + step * (n - 1), x0 = padL + (avail - total) / 2, mid = (n - 1) / 2;
    var selI = -1; cards.forEach(function (el, i) { if (+el.getAttribute('data-uid') === ui.selUid) selI = i; });
    cards.forEach(function (el, i) {
      var off = i - mid, rot = off * Math.min(3.5, 16 / n), y = 10 + off * off * (n > 6 ? 0.45 : 1), x = x0 + i * step, sc = 1;
      if (selI >= 0 && i !== selI) x += (i < selI ? -1 : 1) * Math.min(18, Math.max(0, cw - step) * 0.45);
      if (i === selI) { // lift the chosen card clear of its neighbours, enlarged for reading
        sc = n > 5 ? 1.2 : 1.14; rot = 0; y = -Math.min(34, chh * 0.24);
        var grow = cw * (sc - 1) / 2; x = Math.max(padL + grow, Math.min(W - padR - cw - grow, x));
      }
      el._x = x; el._y = y;
      if (!el.classList.contains('drag')) el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + sc + ')';
      el.style.zIndex = i === selI ? 30 : i + 1;
    });
  }
  function selectCard(uid) {
    ui.selUid = uid;
    qsa('#cHand .card').forEach(function (el) { el.classList.toggle('sel', +el.getAttribute('data-uid') === uid); if (uid != null) el.classList.remove('deal'); });
    layoutHand(); applyTargeting(); refreshHint();
  }
  function tryPlay(hi, target) {
    var c = st.combat, inst = c.hand[hi]; if (!inst) return;
    if (!M.canPlay(st, hi)) { selectCard(inst.uid); Sfx.block(); return; }
    var d = M.cardDef(inst);
    if (d.target === 'enemy' && target == null) {
      var live = M.living(st);
      if (live.length === 1) target = c.enemies.indexOf(live[0]);
      else { selectCard(inst.uid); setHint('Choose a foe to strike.', false); return; }
    }
    act({ type: 'play', hand: hi, target: target });
  }

  /* =========================================================== render dispatch */
  var SCREENS = { actIntro: renderActIntro, map: renderMap, reward: renderReward, rest: renderRest, pick: renderPick, treasure: renderTreasure, shop: renderShop, event: renderEvent, end: renderEnd };
  function render() {
    if (ui.view === 'charsel' && ui.cs) { Sfx.drone(false); app.innerHTML = renderCharSel(); ui.mounted = 'charsel'; return; }
    if (ui.view === 'title' || !st) { Sfx.drone(false); return renderTitle(); }
    var s = st.screen;
    if (s === 'combat' && st.combat) {
      if (ui.mounted !== combatKey() || !qs('.scr.combat')) mountCombat();
      updateCombat();
      Sfx.drone(st.combat.kind === 'boss' && !st.combat.over);
      return;
    }
    Sfx.drone(false);
    qsa('.fnum, .say', fxl).forEach(function (x) { x.remove(); });
    var fn = SCREENS[s];
    var key = s + ':' + st.floor + ':' + st.act;
    var html = fn ? fn() : '<div class="scr"><div class="page"><div class="h-title">' + esc(s) + '</div></div></div>';
    if (ui.mounted === key) html = html.replace('class="scr enter', 'class="scr');
    app.innerHTML = html; ui.mounted = key;
    if (s === 'map') afterMap();
    fitAll(app);
  }

  /* =========================================================== 8. overlays */
  var ovGen = 0;
  function openOv(html, cls) {
    ovGen++;
    ovl.innerHTML = '<div class="veil" data-a="closeOv" aria-hidden="true"></div>' + html; ovl.className = 'on ' + (cls || '');
    fitAll(ovl);
  }
  function closeOv() { ovl.innerHTML = ''; ovl.className = ''; }
  var dlgHandlers = [];
  function dialog(title, body, buttons) {
    dlgHandlers = buttons || [];
    openOv('<div class="dialog"><h2>' + esc(title) + '</h2>' + body + '<div class="btns">' + dlgHandlers.map(function (b, i) {
      return '<button class="btn ' + (b.cls || '') + '" data-a="dlg" data-idx="' + i + '">' + esc(b.label) + '</button>';
    }).join('') + '</div></div>');
  }
  function confirmDlg(title, text, yes, fn, yesCls) { dialog(title, '<p>' + text + '</p>', [{ label: 'Nay' }, { label: yes, cls: yesCls || 'primary', fn: fn }]); }
  function sheet(title, sub, body) {
    openOv('<div class="sheet"><div class="sh"><h2>' + esc(title) + '</h2><button class="ib" data-a="closeOv" aria-label="Close">' + iconSvgX() + '</button></div>' +
      (sub ? '<div class="sub">' + sub + '</div>' : '') + '<div class="page">' + body + '</div></div>');
  }
  function iconSvgX() { return '<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></span>'; }

  function sortCards(list) {
    var order = { attack: 0, skill: 1, gloss: 2, blot: 3, curse: 4 };
    return list.slice().sort(function (a, b) {
      var da = M.cardDef(a), db = M.cardDef(b);
      return (order[da.type] - order[db.type]) || String(da.name).localeCompare(db.name);
    });
  }
  function showDeck() {
    var cards = sortCards(st.deck);
    sheet('Thy Deck', cards.length + ' cards · long-press or tap to read', '<div class="grid">' + cards.map(function (x) { return cardHtml(x, { data: 'data-a="zoomDeck" data-uid="' + x.uid + '"', ctx: false }); }).join('') + '</div>');
  }
  var pileView = [];
  function showPile(which) {
    var c = st.combat; if (!c) return;
    var list = which === 'draw' ? sortCards(c.draw) : (c[which] || []).slice().reverse();
    pileView = list;
    var T = { draw: ['Draw Pile', 'Shown in no particular order'], discard: ['Discard Pile', 'Most recent first'], scraped: ['Scraped', 'Gone for the rest of this fight'] }[which];
    sheet(T[0], list.length + ' cards · ' + T[1], list.length ? '<div class="grid">' + list.map(function (x, i) { return cardHtml(x, { data: 'data-a="zoomPile" data-idx="' + i + '"', ctx: true }); }).join('') + '</div>' : '<div class="flavor" style="margin-top:30px">Empty.</div>');
  }
  function showRelics() {
    sheet('Relics', st.relics.length + ' borne', '<div class="list">' + st.relics.map(function (id) {
      var r = M.RELICS[id] || {};
      return '<div class="relicLine">' + relicBadge(id) + '<div><div class="rn">' + esc(r.name || id) + '</div><div class="rt">' + M.relicText(id) + passiveText(r) + '</div>' + (r.flavor ? '<div class="rf">' + esc(r.flavor) + '</div>' : '') + '</div></div>';
    }).join('') + '</div>');
  }
  function passiveText(r) {
    if (!r || !r.passive || r.text) return '';
    var p = r.passive, out = [];
    if (p.ink) out.push('+' + p.ink + ' Ink each turn.'); if (p.hand) out.push('Draw ' + p.hand + ' more card' + (p.hand > 1 ? 's' : '') + ' each turn.');
    if (p.illumEase) out.push('Illuminate needs ' + p.illumEase + ' fewer pigment' + (p.illumEase > 1 ? 's' : '') + '.'); if (p.maxHp) out.push('+' + p.maxHp + ' Max HP.');
    if (p.restHeal) out.push('Mend heals ' + p.restHeal + ' more.'); if (p.shopDiscount) out.push('Stationer prices ' + p.shopDiscount + '% lower.');
    if (p.cardChoices) out.push('+' + p.cardChoices + ' card choice in rewards.'); if (p.goldPct) out.push('+' + p.goldPct + '% silver from fights.');
    if (p.gildRewards) out.push('Cards you gain are gilded.');
    return (out.length ? ' ' : '') + out.join(' ');
  }
  function relicInfo(id, buttons) {
    var r = M.RELICS[id] || {};
    dialog(r.name || id, '<div style="display:flex;justify-content:center;margin:6px 0">' + relicBadge(id, true) + '</div><p>' + M.relicText(id) + passiveText(r) + '</p>' + (r.flavor ? '<p class="flavor">' + esc(r.flavor) + '</p>' : '') +
      '<p class="kw" style="font-size:13px">' + esc((r.rarity || '') + ' relic') + '</p>', buttons || [{ label: 'Close', cls: 'primary' }]);
  }
  function glossary(inst) {
    var d = M.cardDef(inst), txt = stripTags(M.cardText(inst, null)) + ' ' + (d.type === 'gloss' ? 'Gloss' : '');
    var out = [];
    Object.keys(M.KEYWORDS || {}).forEach(function (k) {
      var re = new RegExp('\\b' + k + (k === 'Illuminate' ? '|Illuminated' : ''), 'i');
      if (re.test(txt) || (k === 'Blot' && (d.type === 'blot'))) out.push('<div><b>' + esc(k) + '.</b> ' + esc(M.KEYWORDS[k]) + '</div>');
    });
    Object.keys(M.STATUS).forEach(function (s) { var S = M.STATUS[s]; if (new RegExp('\\b' + S.name + '\\b').test(txt)) out.push('<div><b>' + esc(S.name) + '.</b> ' + esc(S.desc) + '</div>'); });
    if (d.type === 'curse') out.push('<div><b>Curse.</b> A permanent stain upon thy deck. Scrape it at a Stationer.</div>');
    return out.join('');
  }
  var zoomActions = [];
  function zoomCard(inst, actions, opts) {
    zoomActions = actions || [];
    opts = opts || {};
    var cardsH;
    if (opts.preview) {
      cardsH = '<div class="pair">' + cardHtml(inst, { cls: 'static big', ctx: opts.ctx }) + '<span class="arrow">→</span>' + cardHtml({ id: inst.id, up: true }, { cls: 'static big', ctx: opts.ctx }) + '</div>';
    } else cardsH = cardHtml(inst, { cls: 'static big', ctx: opts.ctx });
    var d = M.cardDef(inst), g = glossary(inst);
    openOv('<div class="zoom" data-a="closeOv">' + cardsH +
      (d.flavor ? '<div class="cardFlav">' + esc(d.flavor) + '</div>' : '') +
      (g ? '<div class="gloss">' + g + '</div>' : '') +
      '<div class="acts">' + zoomActions.map(function (a, i) { return '<button class="btn ' + (a.cls || '') + (a.off ? ' off' : '') + '" data-a="zoomAct" data-idx="' + i + '">' + a.label + '</button>'; }).join('') +
      (zoomActions.length ? '' : '<button class="btn ghost" data-a="glossary">Glossary</button><button class="btn ghost" data-a="closeOv">Close</button>') + '</div></div>');
  }
  function foeInfo(e) {
    var d = M.ENEMIES[e.id] || {}, info = M.intentInfo(st, e), mv = d.moves && d.moves[e.intent];
    var sts = Object.keys(e.st).filter(function (k) { return e.st[k]; }).map(function (k) { var S = M.STATUS[k] || { name: k, desc: '' }; return '<div class="line"><b>' + esc(S.name) + ' ' + e.st[k] + '.</b> ' + esc(S.desc.replace(/\bN\b/g, e.st[k])) + '</div>'; }).join('');
    var mvText = mv ? stripTags(M.describeOps(mv.ops)).replace(/\bGain\b/g, 'Gains').replace(/\bDeal\b/g, 'Deals').replace(/\bApply\b/g, 'Applies').replace(/\bAdd\b/g, 'Adds').replace(/\byour\b/g, 'thy') : '';
    var body = '<div class="foeInfo"><div class="art">' + artSvg(e.id) + '</div>' + (d.desc ? '<div class="desc">' + esc(d.desc) + '</div>' : '') +
      '<div class="line"><b>HP</b> ' + e.hp + '/' + e.maxHp + (e.ward ? ' · <b>Ward</b> ' + e.ward : '') + (d.tier && d.tier !== 'normal' ? ' · <i>' + esc(d.tier) + '</i>' : '') + '</div>' +
      '<div class="line"><b>Intends:</b> ' + esc(info.name || '?') + (info.dmg ? ' — ' + info.dmg + ' damage' + (info.times > 1 ? ' ×' + info.times : '') : '') + (mvText ? '<br><span class="faded">' + esc(mvText) + '.</span>' : '') + '</div>' + sts + '</div>';
    dialog(e.name, body, [{ label: 'Close', cls: 'primary' }]);
  }
  function heroInfo() {
    var c = st.combat, p = c.player;
    var sts = Object.keys(p.st).filter(function (k) { return p.st[k]; }).map(function (k) { var S = M.STATUS[k] || { name: k, desc: '' }; return '<div class="line"><b>' + esc(S.name) + ' ' + p.st[k] + '.</b> ' + esc(S.desc.replace(/\bN\b/g, p.st[k])) + '</div>'; }).join('');
    dialog(charDef(st.char).name, '<div class="foeInfo"><div class="art">' + playerArt(st.char) + '</div><div class="line"><b>HP</b> ' + st.hp + '/' + st.maxHp + ' · <b>Ward</b> ' + p.ward + ' · <b>Ink</b> ' + c.ink + '</div>' + (sts || '<div class="desc">No humours or afflictions.</div>') + '</div>', [{ label: 'Close', cls: 'primary' }]);
  }
  function showMenu() {
    var body = '<div style="text-align:left">' +
      '<div class="toggleRow"><span>Sound</span><button class="btn small" data-a="sound">' + (prefs.sound ? 'On' : 'Off') + '</button></div>' +
      (st && ui.view === 'run' ? '<div class="toggleRow"><span>Hand</span><span class="sc">' + esc(charDef(st.char).name) + '</span></div>' +
        '<div class="toggleRow" data-a="rubInfo" role="button"><span>Rubrication</span><span class="sc">' + (st.asc ? roman(st.asc) + ' · ' + esc(rubName(st.asc)) : 'None (plain vellum)') + '</span></div>' +
        ((st.mods || []).length ? '<div class="toggleRow"><span>Modifiers</span><span class="menuMods">' + st.mods.map(function (id) { return modChip(id); }).join('') + '</span></div>' : '') : '') +
      (st ? '<div class="toggleRow"><span>Seed</span><span class="sc" style="-webkit-user-select:text;user-select:text">' + esc(st.seed) + '</span></div>' +
        '<div class="toggleRow"><span>Deck · Relics</span><span><button class="btn small" data-a="deck">Deck</button> <button class="btn small" data-a="relics">Relics</button></span></div>' : '') +
      '<div class="toggleRow"><span>Rules</span><span><button class="btn small" data-a="howto">How to Play</button> <button class="btn small" data-a="glossary">Glossary</button></span></div>' +
      '<div class="toggleRow"><span>Collection</span><button class="btn small" data-a="book">The Book · ' + bookPct() + '%</button></div>' +
      (M.diag ? '<div class="toggleRow"><span>Diagnostics</span><span><button class="btn small" data-a="diagCopy">Copy report</button> <button class="btn small" data-a="diagView">View</button></span></div>' : '') + '</div>';
    var btns = [];
    if (st && ui.view === 'run' && !st.over) btns.push({ label: 'Abandon', cls: 'ghost', fn: function () { confirmDlg('Abandon this run?', 'The page will be scraped clean and the run counted as lost.', 'Abandon', function () { st.over = true; st.won = false; recordEnd(); lsDel(SAVE_KEY); toTitle(); }); } });
    btns.push({ label: 'Title', fn: toTitle });
    btns.push({ label: 'Resume', cls: 'primary' });
    dialog('Marginalia', body, btns);
  }
  function showHowTo() {
    var pr = function (p) { return '<span class="pr on" style="--pc:' + M.PIGMENTS[p].color + '">' + p + '</span>'; };
    var body = '<div class="howto">' +
      '<div class="hp">' + icon('ink') + '<div><b>Ink</b> — each card costs Ink, shown in its drop. Thou hast 3 each turn. Tap a card to raise it, tap again (or tap a foe, or drag it upward) to play it. Long-press any card to read it closely.</div></div>' +
      '<div class="hp">' + icon('ward') + '<div><b>Ward</b> blocks damage until thy next turn. Watch each foe’s <b>intent</b> above its head: the number is the blow it means to strike.</div></div>' +
      '<div class="hp"><span class="mini3">' + pr('V') + pr('L') + pr('G') + '</span><div><b>Pigments &amp; Illumination</b> — play a Vermilion, a Lapis and a Verdigris card in one turn to <b>Illuminate</b>: +1 Ink and draw a card. Gold cards count as any pigment. Some cards grow stronger when Illuminated.</div></div>' +
      '<div class="hp">' + icon('margin') + '<div><b>Gloss &amp; the Margin</b> — Gloss cards are written into the Margin at the left of the page and work for the rest of the fight. Only three fit; a fourth erases the oldest. Some foes erase them.</div></div>' +
      '<div class="hp">' + icon('intent_curse') + '<div><b>Blots</b> are junk cards foes smear into thy piles for the fight. <b>Curses</b> stay in thy deck until scraped.</div></div>' +
      '<div class="hp">' + icon('map') + '<div><b>The Map</b> — ride upward through three Quires. Visit the <b>Scriptorium</b> to mend or gild, the <b>Stationer</b> to buy, and the <b>Reliquary</b> for relics. Defeat the boss at the top of each page.</div></div>' +
      '</div>';
    sheet('How to Play', 'A short rubric for the Margin Knight', body + '<div style="text-align:center;margin:14px 0"><button class="btn" data-a="glossary">Open the full Glossary</button></div>');
  }

  /* ---------- Glossary: every term in the game, always reachable from the HUD ---------- */
  var GLOSS_ICON = '<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5.5c3-1.2 6-1 9 1 3-2 6-2.2 9-1v13c-3-1.2-6-1-9 1-3-2-6-2.2-9-1z"/><path d="M12 6.5v13"/><path d="M6 9.5h3.5M6 12.5h3.5M14.5 9.5H18M14.5 12.5H18" stroke-width="1.3"/></svg></span>';
  function glossData() {
    var P = M.PIGMENTS, dot = function (p) { var lab = { A: 'Au', N: 'In', X: '✕' }[p] || p; return '<span class="dot" style="--pc:' + P[p].color + (lab.length > 1 ? ';font-size:11px' : '') + '">' + lab + '</span>'; };
    var I = function (n) { return M.ART && M.ART.icons && M.ART.icons[n] ? icon(n) : ''; };
    var secs = [
      { id: 'basics', t: 'The Basics', intro: 'What the numbers on the page mean.', e: [
        ['HP', I('hp'), 'Thy life. Reach 0 and the run ends. It carries over between fights; heal at the Scriptorium, with relics and some cards.'],
        ['Ink', I('ink'), 'Spent to play cards; each card shows its cost in an ink drop. Thou hast 3 Ink each turn, and unspent Ink is lost at end of turn.'],
        ['Ward', I('ward'), 'Blocks incoming damage point for point. Thy Ward is removed at the start of thy next turn (unless Steadfast). Foes gain Ward too.'],
        ['Silver', I('silver'), 'Money. Earned from fights, chests and events; spent at the Stationer.'],
        ['Intent', I('intent_attack'), 'The badge above each foe shows what it will do on its next turn. A number is damage; ×N means it strikes N times. Tap a foe to read its intent in full.'],
        ['End Turn', '', 'Tap the wax seal when done. Cards left in hand are discarded, then every foe acts in order.'],
        ['Hand', '', 'Thou drawest 5 cards at the start of each turn (10 at most in hand).'],
        ['Draw pile', I('draw_pile'), 'Cards waiting to be drawn this fight. When empty, the discard pile is shuffled back into it.'],
        ['Discard pile', I('discard_pile'), 'Cards played or discarded this fight.'],
        ['Scraped', I('scraped'), 'Cards removed from play for the rest of this fight. They return to thy deck afterwards.'],
        ['Deck', I('deck'), 'Every card thou ownest. Each fight starts with the whole deck shuffled into the draw pile. A lean deck draws its best cards more often.']
      ] },
      { id: 'pigments', t: 'Pigments', intro: 'Every card is painted in one colour. Colour matters for Illumination.', e: [
        ['Vermilion', dot('V'), 'Red. Mostly attacks: Might, Torn and raw damage.'],
        ['Lapis', dot('L'), 'Blue. Mostly defence: Ward, Steadfast, Resolve and Brambles.'],
        ['Verdigris', dot('G'), 'Green. Corrode, healing, Shell and slow growth.'],
        ['Gold', dot('A'), 'Rare and flexible. Counts as ANY one missing pigment toward Illumination.'],
        ['Ink (colourless)', dot('N'), 'Black utility cards: draw, Ink, scraping Blots. They do not count toward Illumination.'],
        ['Blot pigment', dot('X'), 'Junk cards. No colour.']
      ] },
      { id: 'illum', t: 'Illumination', intro: 'The heart of Marginalia: paint the page in all three colours.', e: [
        ['Illuminate', '<span class="dot" style="--pc:#c99a1e">✦</span>', 'Once per turn, when thou hast played a Vermilion, a Lapis and a Verdigris card (Gold fills any gap), thou Illuminatest: gain 1 Ink and draw 1 card. The three roundels in combat track thy progress.'],
        ['Illuminated:', '', 'Card text that only happens if thou hast already Illuminated this turn. The card that completes the trio counts.'],
        ['After Vermilion: (Lapis, Verdigris, Gold)', '', 'Card text that only happens if thou already played a card of that colour EARLIER this turn. Order matters.']
      ] },
      { id: 'cards', t: 'Cards & Keywords', intro: 'Card types and the small words in their rules.', e: [
        ['Attack', I('type_attack'), 'Deals damage. Most need a target: tap the card, then tap a foe (or drag it up onto one).'],
        ['Skill', I('type_skill'), 'Everything that is not an attack: Ward, draw, statuses.'],
        ['Gloss', I('type_gloss'), 'A lasting power. When played it is written into thy Margin and works for the rest of the fight.'],
        ['Margin', I('margin'), 'The strip at the left of the page that holds up to 3 Glosses. A 4th Gloss erases the oldest. Some foes Erase thy Glosses.'],
        ['Blot', I('type_blot'), 'Junk a foe smears into thy piles for this fight only. Usually unplayable, often harmful while in hand.'],
        ['Curse', I('intent_curse'), 'Permanent junk in thy deck, usually from events. Remove it at the Stationer.'],
        ['Scrape', I('scraped'), 'After it is played, this card is removed for the rest of the fight.'],
        ['Fleeting', '', 'If still in thy hand at end of turn, it is Scraped.'],
        ['Opening', '', 'Always in thy opening hand.'],
        ['Unplayable', '', 'Cannot be played.'],
        ['Stone', icon('st_petrified'), 'A card turned to stone by Petrified. It shows grey with a Stone label and cannot be played this turn; it returns to normal once discarded.'],
        ['Gild / Gilded', '', 'Upgrade a card, permanently (Scriptorium, Stationer, events) or for one fight (some cards). Gilded cards have a gold border and better numbers.'],
        ['Damage numbers', '', 'Card text already includes thy Might and Smudged: green numbers are boosted, red ones reduced.']
      ] },
      { id: 'status', t: 'Statuses', intro: 'Marks on thee or a foe. The number is the stacks (N). Tap thy knight or a foe to see theirs.', e: Object.keys(M.STATUS).map(function (k) {
        var S = M.STATUS[k]; return [S.name, I('st_' + k), S.desc + (S.good ? '' : ''), S.good ? 'boon' : 'bane'];
      }) },
      { id: 'intents', t: 'Foe Intents', intro: 'The badges above foes’ heads.', e: [
        ['Attack', I('intent_attack'), 'Will deal the shown damage (×N times). Already adjusted for its Might, Smudged and thy Torn.'],
        ['Defend', I('intent_defend'), 'Will gain Ward.'],
        ['Buff', I('intent_buff'), 'Will strengthen itself or its allies.'],
        ['Debuff', I('intent_debuff'), 'Will afflict thee with a bad status.'],
        ['Blot', I('intent_curse'), 'Will smear Blot cards into thy piles.'],
        ['Erase', I('intent_erase'), 'Will scrape a Gloss from thy Margin (the newest first).'],
        ['Devour', I('intent_devour'), 'Will eat random cards from thy draw pile for the rest of the fight. Some foes devour only one pigment (a siren’s song eats Lapis).'],
        ['Summon', I('intent_summon'), 'Will call more foes onto the page (at most 4 at once). Summoned foes wait a turn before acting.'],
        ['Unknown', I('intent_unknown'), 'Its purpose is hidden.']
      ] },
      { id: 'map', t: 'The Map', intro: 'Ride from the foot of the page to the boss at the top. Each Quire is one act.', e: [
        ['Quire', '', 'One act of the run. There are three: The Book of Hours, The Bestiary, The Apocalypse. Thou healest half thy missing HP between Quires.'],
        ['Folio', '', 'A step on the map; the folio number counts how far thou hast ridden.'],
        ['Battle', I('node_battle'), 'An ordinary fight. Reward: silver and a choice of 3 cards.'],
        ['Elite', I('node_elite'), 'A hard fight. Reward: more silver, better cards and a relic.'],
        ['Boss', I('node_boss'), 'Guards the top of each Quire. Reward: a rare card and a choice of 3 boss relics.'],
        ['Apocrypha', I('node_event'), 'A strange event with choices. Read the outcome under each choice.'],
        ['Stationer', I('node_shop'), 'The shop: buy cards and relics, remove a card, or gild one. One card is always on sale.'],
        ['Scriptorium', I('node_rest'), 'A rest stop. Mend (heal 30% of max HP) or Gild one card.'],
        ['Reliquary', I('node_treasure'), 'A treasure casket with a relic and silver.']
      ] },
      { id: 'relics', t: 'Relics & Runs', intro: '', e: [
        ['Relic', I('relic'), 'A permanent blessing for the run, shown as gold roundels under the top bar. Tap them to read what each does.'],
        ['Boss relic', '', 'Powerful relics offered after a boss, usually with a drawback. Choose one.'],
        ['Daily Folio', '', 'Everyone gets the same seeded run each day. Compare scores with friends.'],
        ['Seed', '', 'The code that fixes a run’s map, cards and foes. Share it and others ride the very same pages.'],
        ['Score', '', 'Folios ridden, foes slain, elites and bosses defeated, silver kept, plus a large bonus (and thy remaining HP) for closing the book.'],
        ['Explicit', '', 'Latin for “it is unrolled”: the word scribes wrote at the end of a book. Thou hast won.']
      ] },
      { id: 'progress', t: 'Hands & Progress', intro: 'What carries over from one run to the next.', e: [
        ['Characters', '', 'Each run is ridden by one hand: the Margin Knight, and others who unlock through achievements. Each has their own starting deck, relic, HP and cards; colourless Ink cards are shared by all.'],
        ['Rubrication', '<span class="rubNum sm">I</span>', 'An optional difficulty ladder, chosen per character before a run. Level N adds rule N to every rule below it. Close the book at a level to unlock the next. Higher levels multiply thy score.'],
        ['Daily modifiers', '<span class="wax sm">D</span>', 'Each Daily Folio has two modifiers (wax seals) that bend the rules for everyone that day. Tap a seal on the map to read it. The Daily is always ridden at Rubrication 0.'],
        ['The Book of Marginalia', GLOSS_ICON, 'Thy collection, kept between runs: every card, relic and foe thou hast met, thy achievements, and each hand’s Rubrication progress. Open it from the title page or the menu.'],
        ['Achievements', '<span class="achSeal sm">' + SEAL_GLYPH + '</span>', 'Feats such as Illuminating three turns running. Many unlock new cards, relics or characters; unlocks join the pools from thy next run.'],
        ['Score multiplier', '', 'Score × (1 + 0.1 per Rubrication level + 0.05 per daily modifier).']
      ] }
    ];
    return secs;
  }
  var glossSec = null;
  function showGlossary(q) {
    var secs = glossData();
    var tabs = '<div class="glossTabs"><button class="on" data-a="glossTab" data-sec="">All</button>' + secs.map(function (s) { return '<button data-a="glossTab" data-sec="' + s.id + '">' + esc(s.t) + '</button>'; }).join('') + '</div>';
    var body = '<div class="glossBar"><input id="glossQ" type="search" placeholder="Search terms…" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search the glossary">' + tabs + '</div>' +
      secs.map(function (s) {
        return '<div class="glossSec" data-sec="' + s.id + '"><h3>' + esc(s.t) + '</h3>' + (s.intro ? '<p class="gintro">' + esc(s.intro) + '</p>' : '') +
          s.e.map(function (e) {
            return '<div class="gEnt" data-k="' + esc((e[0] + ' ' + e[2]).toLowerCase()) + '"><span class="gi">' + (e[1] || '') + '</span><div class="gt"><b>' + esc(e[0]) + '</b>' + (e[3] ? '<span class="tag">' + esc(e[3]) + '</span>' : '') + '<br>' + esc(e[2]) + '</div></div>';
          }).join('') + '</div>';
      }).join('') + '<div class="gEmpty" hidden>No such word in the glossary.</div>';
    sheet('Glossary', 'Every word on the page, explained', body);
    glossSec = null;
    var inp = qs('#glossQ');
    if (inp) { inp.addEventListener('input', function () { glossFilter(inp.value, undefined); }); if (q) { inp.value = q; glossFilter(q); } }
  }
  function glossFilter(q, sec) {
    if (sec !== undefined && sec !== null) glossSec = sec || null;
    var inp = qs('#glossQ'); q = (q != null ? q : (inp ? inp.value : '')).trim().toLowerCase();
    var any = false;
    Array.prototype.forEach.call(document.querySelectorAll('#ovl .glossSec'), function (s) {
      var secOk = !glossSec || s.getAttribute('data-sec') === glossSec, shown = 0;
      Array.prototype.forEach.call(s.querySelectorAll('.gEnt'), function (e) { var ok = secOk && (!q || e.getAttribute('data-k').indexOf(q) >= 0); e.hidden = !ok; if (ok) shown++; });
      s.hidden = !shown; if (shown) any = true;
    });
    var em = document.querySelector('#ovl .gEmpty'); if (em) em.hidden = any;
    Array.prototype.forEach.call(document.querySelectorAll('#ovl .glossTabs button'), function (b) { b.classList.toggle('on', (b.getAttribute('data-sec') || null) === glossSec); });
  }

  function showSeedEntry() {
    dialog('Enter a Seed', '<p>Share a seed and others ride the very same pages.</p><input id="seedIn" maxlength="24" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. QUILL7">', [
      { label: 'Cancel' },
      { label: 'Begin', cls: 'primary', fn: function () { var v = (qs('#seedIn') && qs('#seedIn').value || '').trim().toUpperCase(); if (v) openCharSel(/^DAILY-/.test(v) ? 'daily' : 'seed', v); else return false; } }
    ]);
    setTimeout(function () { var i = qs('#seedIn'); if (i) i.focus(); }, 60);
  }

  /* ---------- The Book of Marginalia (collection overlay) ---------- */
  var RAR = { starter: 0, common: 1, uncommon: 2, rare: 3, boss: 4, shop: 5, special: 6 };
  function bookCards() {
    return Object.keys(M.CARDS).filter(function (id) { var d = M.CARDS[id]; return d.type !== 'blot' && d.type !== 'curse' && d.rarity !== 'special'; });
  }
  function bookRelics() { return Object.keys(M.RELICS || {}).filter(function (id) { return M.RELICS[id].rarity !== 'special'; }); }
  function bookFoes() { return Object.keys(M.ENEMIES || {}); }
  function owners() { return charIds().concat(['shared']); }
  function ownerName(o) { return o === 'shared' ? 'Shared (Ink)' : charDef(o).name; }
  function pct(a, b) { return b ? Math.floor(100 * a / b) : 100; }
  function locked(def) { return def && def.unlock && book.ach.indexOf(def.unlock) < 0; }
  function tabStats() {
    var cs = bookCards(), rs = bookRelics(), fs = bookFoes(), as = Object.keys(M.ACHIEVEMENTS || {}), ch = charIds(), R = (M.RUBRICS || []).length;
    var rub = ch.reduce(function (t, c) { return t + rubMax(c); }, 0) + ch.filter(charUnlocked).length;
    return {
      cards: [cs.filter(function (id) { return book.seen.cards[id]; }).length, cs.length],
      relics: [rs.filter(function (id) { return book.seen.relics[id]; }).length, rs.length],
      foes: [fs.filter(function (id) { return book.seen.foes[id]; }).length, fs.length],
      ach: [as.filter(function (id) { return book.ach.indexOf(id) >= 0; }).length, as.length],
      chars: [rub, ch.length * (R + 1)]
    };
  }
  function bookPct() {
    try { var t = tabStats(), a = 0, b = 0; Object.keys(t).forEach(function (k) { a += t[k][0]; b += t[k][1]; }); return pct(a, b); } catch (e) { return 0; }
  }
  var BOOK_TABS = [['cards', 'Cards'], ['relics', 'Relics'], ['foes', 'Bestiary'], ['ach', 'Achievements'], ['chars', 'Hands']];
  function showBook(tab) {
    var bk = ui.bk; if (tab) { if (tab !== bk.tab) bk.scroll = 0; bk.tab = tab; }
    var t = tabStats(), cur = t[bk.tab] || [0, 0];
    var tabs = '<div class="glossTabs bookTabs" role="tablist">' + BOOK_TABS.map(function (x) {
      return '<button class="' + (x[0] === bk.tab ? 'on' : '') + '" data-a="bookTab" data-tab="' + x[0] + '" role="tab" aria-selected="' + (x[0] === bk.tab) + '">' + x[1] + ' <span class="pct">' + pct(t[x[0]][0], t[x[0]][1]) + '%</span></button>';
    }).join('') + '</div>';
    var body = { cards: bookCardsTab, relics: bookRelicsTab, foes: bookFoesTab, ach: bookAchTab, chars: bookCharsTab }[bk.tab]();
    sheet('The Book of Marginalia', 'All thou hast found, across every run · ' + bookPct() + '% complete',
      '<div class="glossBar">' + tabs + '<div class="bookProg"><span style="width:' + pct(cur[0], cur[1]) + '%"></span><b>' + cur[0] + ' / ' + cur[1] + '</b></div></div>' + body);
    qs('#ovl .sheet').classList.add('bookSheet');
    var pg = qs('#ovl .sheet .page'); if (pg) { pg.scrollTop = bk.scroll || 0; pg.addEventListener('scroll', function () { bk.scroll = pg.scrollTop; }, { passive: true }); }
  }
  function filterChips(key, opts) {
    return '<div class="bookFilt">' + opts.map(function (o) { return '<button class="' + ((ui.bk[key] || '') === o[0] ? 'on' : '') + '" data-a="bookFilt" data-k="' + key + '" data-v="' + esc(o[0]) + '">' + esc(o[1]) + '</button>'; }).join('') + '</div>';
  }
  function silhouette(kind, def, label) {
    var lk = locked(def);
    if (lk) return '<div class="bkSil ' + kind + ' locked" data-a="bookLock" data-ach="' + esc(def.unlock) + '" role="button" aria-label="Locked: unlocked by ' + esc(achName(def.unlock)) + '">' + icon('lock') + '<small>Unlocked by<br><b>' + esc(achName(def.unlock)) + '</b></small></div>';
    return '<div class="bkSil ' + kind + '" aria-label="Not yet found"><span class="q">?</span>' + (label ? '<small>' + esc(label) + '</small>' : '') + '</div>';
  }
  function bookCardsTab() {
    var bk = ui.bk, all = bookCards(), groups = {};
    all.forEach(function (id) { var o = M.CARDS[id].char || 'shared'; (groups[o] = groups[o] || []).push(id); });
    var h = filterChips('own', [['', 'All']].concat(owners().filter(function (o) { return groups[o]; }).map(function (o) { return [o, o === 'shared' ? 'Shared' : charDef(o).short || o]; }))) +
      filterChips('show', [['', 'Everything'], ['found', 'Found'], ['missing', 'Missing'], ['locked', 'Locked']]);
    owners().forEach(function (o) {
      if (!groups[o] || (bk.own && bk.own !== o)) return;
      var ids = groups[o].sort(function (a, b) { var A = M.CARDS[a], B = M.CARDS[b]; return (RAR[A.rarity] - RAR[B.rarity]) || String(A.pigment).localeCompare(B.pigment) || A.name.localeCompare(B.name); });
      var found = ids.filter(function (id) { return book.seen.cards[id]; }).length;
      var cells = ids.filter(function (id) {
        var d = M.CARDS[id], s = book.seen.cards[id] ? 'found' : locked(d) ? 'locked' : 'missing';
        return !bk.show || bk.show === s || (bk.show === 'missing' && s === 'locked');
      }).map(function (id) {
        var d = M.CARDS[id];
        if (book.seen.cards[id]) return cardHtml({ id: id, up: false }, { cls: 'static bk', data: 'data-a="bookCard" data-id="' + esc(id) + '"', ctx: false });
        return silhouette('csil p-' + (d.pigment || 'N'), d, d.rarity);
      }).join('');
      h += '<h3 class="bookH">' + esc(ownerName(o)) + ' <span>' + found + ' / ' + ids.length + '</span></h3>' + (cells ? '<div class="grid bookGrid">' + cells + '</div>' : '<p class="gintro">Nothing to show.</p>');
    });
    return h;
  }
  function bookRelicsTab() {
    var all = bookRelics(), groups = {};
    all.forEach(function (id) { var o = M.RELICS[id].char || 'shared'; (groups[o] = groups[o] || []).push(id); });
    var h = '';
    owners().forEach(function (o) {
      if (!groups[o]) return;
      var ids = groups[o].sort(function (a, b) { return ((RAR[M.RELICS[a].rarity] || 0) - (RAR[M.RELICS[b].rarity] || 0)) || M.RELICS[a].name.localeCompare(M.RELICS[b].name); });
      var found = ids.filter(function (id) { return book.seen.relics[id]; }).length;
      h += '<h3 class="bookH">' + (o === 'shared' ? 'Relics of Any Hand' : esc(charDef(o).name)) + ' <span>' + found + ' / ' + ids.length + '</span></h3><div class="relicRow bookRelics">' + ids.map(function (id) {
        var r = M.RELICS[id];
        if (book.seen.relics[id]) return '<div class="relicPick" data-a="bookRelic" data-id="' + esc(id) + '" role="button" aria-label="' + esc(r.name) + '">' + relicBadge(id, true) + '<div class="rn">' + esc(r.name) + '</div><div class="rt kw">' + esc(r.rarity) + '</div></div>';
        return '<div class="relicPick' + (locked(r) ? ' lockedR' : ' missingR') + '">' + silhouette('relic', r, r.rarity) +
          '<div class="rn">' + (locked(r) ? '<small>Unlocked by</small> ' + esc(achName(r.unlock)) : '? ? ?') + '</div><div class="rt kw">' + esc(r.rarity) + '</div></div>';
      }).join('') + '</div>';
    });
    return h;
  }
  var TIER = { normal: 0, elite: 1, boss: 2, minion: 3 };
  function bookFoesTab() {
    var groups = {};
    bookFoes().forEach(function (id) { var a = M.ENEMIES[id].act || 0; (groups[a] = groups[a] || []).push(id); });
    return Object.keys(groups).sort().map(function (a) {
      var ids = groups[a].sort(function (x, y) { var X = M.ENEMIES[x], Y = M.ENEMIES[y]; return ((TIER[X.tier] || 0) - (TIER[Y.tier] || 0)) || X.name.localeCompare(Y.name); });
      var found = ids.filter(function (id) { return book.seen.foes[id]; }).length;
      return '<h3 class="bookH">' + (ACTS[a] ? 'Quire ' + ACTS[a].roman + ' · ' + esc(ACTS[a].name) : 'Strays') + ' <span>' + found + ' / ' + ids.length + '</span></h3><div class="bestiary">' + ids.map(function (id) {
        var d = M.ENEMIES[id], met = book.seen.foes[id];
        return '<div class="beast' + (met ? '' : ' unmet') + (d.tier === 'boss' ? ' boss' : '') + '"' + (met ? ' data-a="bookFoe" data-id="' + esc(id) + '" role="button" aria-label="' + esc(d.name) + '"' : ' aria-label="Not yet met"') + '>' +
          '<div class="art">' + artSvg(id) + '</div><div class="bn">' + (met ? esc(d.name) : '? ? ?') + '</div><div class="bt">' + esc(d.tier || '') + '</div></div>';
      }).join('') + '</div>';
    }).join('');
  }
  function bookAchTab() {
    var ids = Object.keys(M.ACHIEVEMENTS || {});
    ids.sort(function (a, b) { return (book.ach.indexOf(b) >= 0) - (book.ach.indexOf(a) >= 0); });
    return '<p class="gintro">Unlocks join the card and relic pools from thy <b>next</b> run.</p><div class="list">' + ids.map(function (id) {
      var A = M.ACHIEVEMENTS[id], got = book.ach.indexOf(id) >= 0, it = unlockList(id);
      return '<div class="achRow' + (got ? ' got' : '') + '"><span class="achSeal">' + (got ? SEAL_GLYPH : icon('lock')) + '</span><div><b>' + esc(A.name) + '</b><div class="ad">' + esc(A.desc) + '</div>' +
        (it.length ? '<div class="au">Unlocks: ' + esc(it.join(', ')) + '</div>' : '') + '</div></div>';
    }).join('') + '</div>';
  }
  function bookCharsTab() {
    var R = (M.RUBRICS || []).length;
    return '<div class="list">' + charIds().map(function (id) {
      var c = charDef(id), lk = !charUnlocked(id), max = rubMax(id), pc = book.perChar[id] || { runs: 0, wins: 0, best: 0 };
      var best = pc.best || 0; Object.keys(book.best).forEach(function (k) { if (k.split(':')[0] === id) best = Math.max(best, book.best[k] || 0); });
      var ladder = ''; for (var i = 0; i <= R; i++) ladder += '<span class="rung' + (i < max ? ' done' : i === max ? ' cur' : '') + '" title="' + esc(rubName(i)) + '">' + rn(i) + (book.best[id + ':' + i] ? '<small>' + book.best[id + ':' + i] + '</small>' : '') + '</span>';
      var A = (M.ACHIEVEMENTS || {})[c.unlock] || {};
      return '<div class="charRow' + (lk ? ' locked' : '') + '"><div class="art">' + portraitArt(id) + '</div><div class="cx"><b>' + esc(c.name) + '</b>' +
        (lk ? '<div class="ad">' + icon('lock') + ' Unlocks: ' + esc(A.name || c.unlock) + ' — ' + esc(A.desc || '') + '</div>'
          : '<div class="ad">Runs ' + pc.runs + ' · Books closed ' + pc.wins + ' · Best ' + best + '</div><div class="ad">Rubrication unlocked: <b>' + (max ? roman(max) : 'none yet') + '</b> of ' + roman(R) + '</div><div class="ladder">' + ladder + '</div>') +
        '</div></div>';
    }).join('') + '</div>';
  }
  function bookFoeInfo(id) {
    var d = M.ENEMIES[id] || {};
    dialog(d.name || id, '<div class="foeInfo"><div class="art">' + artSvg(id) + '</div>' + (d.desc ? '<div class="desc">' + esc(d.desc) + '</div>' : '') +
      '<div class="line"><b>Quire</b> ' + (ACTS[d.act] ? ACTS[d.act].roman + ' · ' + esc(ACTS[d.act].name) : '—') + ' · <i>' + esc(d.tier || '') + '</i></div>' +
      (d.hp ? '<div class="line"><b>HP</b> ' + d.hp[0] + (d.hp[1] !== d.hp[0] ? '–' + d.hp[1] : '') + '</div>' : '') +
      (d.moves ? '<div class="line"><b>Moves</b> ' + esc(Object.keys(d.moves).map(function (k) { return d.moves[k].name || k; }).join(', ')) + '</div>' : '') + '</div>',
    [{ label: 'Back', cls: 'primary', fn: function () { showBook(); return true; } }]);
  }

  /* =========================================================== 9. input */
  var H = {
    // title
    continue: function () { var s = loadSave(); if (s) continueRun(s); else render(); },
    daily: function () { openCharSel('daily'); },
    newRun: function () { openCharSel('new'); },
    csPick: function (el) { var id = el.getAttribute('data-id'); ui.cs.char = id; ui.cs.asc = csAscFor(id); Sfx.quill(); render(); },
    rubUp: function () { var m = rubMax(ui.cs.char); if (ui.cs.asc < m) { ui.cs.asc++; rememberAsc(); Sfx.quill(); render(); } else toast('Rubrication ' + roman(m + 1) + ' is still locked'); },
    rubDown: function () { if (ui.cs.asc > 0) { ui.cs.asc--; rememberAsc(); Sfx.quill(); render(); } },
    rubAll: function () { showRubAll(); },
    rubSet: function (el) { var n = +el.getAttribute('data-n'); if (n > rubMax(ui.cs.char)) { toast('Not yet unlocked'); return; } ui.cs.asc = n; rememberAsc(); closeOv(); render(); },
    csBegin: function () {
      var cs = ui.cs; if (!cs || !charUnlocked(cs.char)) return;
      prefs.char = cs.char; savePrefs();
      var go = function () { startRun(cs.seed || M.randomSeed(), { char: cs.char, asc: cs.mode === 'daily' ? 0 : cs.asc }); };
      if (loadSave()) confirmDlg('Begin anew?', 'Thy unfinished run will be lost.', 'Begin', go); else go();
    },
    modInfo: function (el) { var m = modDef(el.getAttribute('data-id')); dialog(m.name, '<div class="wax big">' + esc(m.name.charAt(0)) + '</div><p>' + esc(m.desc) + '</p><p class="faded" style="font-size:14px">A Daily Folio modifier. Each one adds 0.05 to the score multiplier.</p>', [{ label: 'Close', cls: 'primary' }]); },
    rubInfo: function () {
      if (!st) return; var R = M.RUBRICS || [];
      dialog(st.asc ? 'Rubrication ' + roman(st.asc) : 'Plain Vellum', st.asc ? '<ol class="rubRules" style="text-align:left">' + R.slice(0, st.asc).map(function (r, i) { return '<li><b>' + roman(i + 1) + '</b> ' + esc(r.desc) + '</li>'; }).join('') + '</ol><p class="faded">Score ' + multOf(st.asc, 0) + '</p>' : '<p>No added rules: the book as the scribe intended it.</p>', [{ label: 'Close', cls: 'primary' }]);
    },
    bossInfo: function () { showBossInfo(); },
    book: function () { closeOv(); showBook(); },
    bookTab: function (el) { showBook(el.getAttribute('data-tab')); },
    bookFilt: function (el) { ui.bk[el.getAttribute('data-k')] = el.getAttribute('data-v'); ui.bk.scroll = 0; showBook(); },
    bookCard: function (el) { var id = el.getAttribute('data-id'), d = M.CARDS[id]; zoomCard({ id: id, up: false }, [{ label: 'Back to the Book', fn: function () { showBook(); } }], { preview: !!(d && d.up) }); },
    bookRelic: function (el) { relicInfo(el.getAttribute('data-id'), [{ label: 'Back', cls: 'primary', fn: function () { showBook(); } }]); },
    bookFoe: function (el) { bookFoeInfo(el.getAttribute('data-id')); },
    bookLock: function (el) { var id = el.getAttribute('data-ach'), A = (M.ACHIEVEMENTS || {})[id] || { name: id, desc: '' }; dialog(A.name, '<div style="display:flex;justify-content:center">' + icon('lock', 'bigLock') + '</div><p>' + esc(A.desc) + '</p><p class="faded" style="font-size:14px">Earn this achievement to add it to the pools of thy next run.</p>', [{ label: 'Back', cls: 'primary', fn: function () { showBook(); } }]); },
    seed: showSeedEntry, howto: function () { closeOv(); showHowTo(); }, title: toTitle,
    glossary: function (el) { closeOv(); showGlossary(el && el.getAttribute && el.getAttribute('data-q')); },
    glossTab: function (el) { glossFilter(null, el.getAttribute('data-sec')); },
    sound: function () {
      prefs.sound = !prefs.sound; savePrefs(); if (!prefs.sound) Sfx.stopAll(); else { Sfx.unlock(); Sfx.bell(); if (st && st.combat && st.combat.kind === 'boss' && st.screen === 'combat') Sfx.drone(true); }
      if (ovl.classList.contains('on')) showMenu(); else render();
    },
    diagCopy: function () { var t = M.diag.report(st); copyText(t, showReport); }, diagView: function () { closeOv(); showReport(M.diag.report(st)); },
    menu: showMenu, deck: function () { closeOv(); showDeck(); }, relics: function () { closeOv(); showRelics(); },
    closeOv: function () { closeOv(); },
    zoomAct: function (el) { var a = zoomActions[+el.getAttribute('data-idx')]; closeOv(); if (a && a.fn) a.fn(); },
    zoomDeck: function (el) { var uid = +el.getAttribute('data-uid'); var inst = st.deck.filter(function (x) { return x.uid === uid; })[0]; if (inst) zoomCard(inst, [{ label: 'Back', fn: showDeck }]); },
    zoomPile: function (el) { var inst = pileView[+el.getAttribute('data-idx')]; if (inst) zoomCard(inst, [{ label: 'Back', fn: function () { showPile(lastPile); } }], { ctx: true }); },
    relicInfo: function (el) { relicInfo(el.getAttribute('data-id')); },
    // run flow
    proceed: function () { Sfx.page(); act({ type: 'proceed' }); },
    node: function (el) {
      var id = el.getAttribute('data-id');
      if (M.reachable(st).indexOf(id) < 0) { var n = M.findNode(st, id); if (n) toast(NODE_NAMES[n.type] + (n.visited ? ' — already visited' : ' — not reachable from here')); return; }
      Sfx.quill(); act({ type: 'chooseNode', id: id });
    },
    takeGold: function () { act({ type: 'takeGold' }); },
    takeRelic: function () { act({ type: 'takeRelic' }); },
    bossRelic: function (el) { var i = +el.getAttribute('data-idx'), id = st.reward.bossRelics[i]; relicInfo(id, [{ label: 'Back' }, { label: 'Take it', cls: 'gold', fn: function () { act({ type: 'takeBossRelic', idx: i }); } }]); },
    rewardCard: function (el) { var i = +el.getAttribute('data-idx'), id = st.reward.cards[i]; zoomCard({ id: id, up: M.passive(st, 'gildRewards') > 0 }, [{ label: 'Back' }, { label: 'Take', cls: 'primary', fn: function () { act({ type: 'takeCard', idx: i }); } }]); },
    skipCards: function () { act({ type: 'skipCards' }); },
    leaveReward: function () {
      var r = st.reward, left = [];
      if (r && !r.goldTaken) left.push('silver'); if (r && !r.cardTaken && r.cards && r.cards.length) left.push('a card'); if (r && ((r.relic && !r.relicTaken) || (r.bossRelics && r.bossRelics.length && !r.relicTaken))) left.push('a relic');
      var go = function () { Sfx.page(); act({ type: 'leaveReward' }); };
      if (left.length) confirmDlg('Leave spoils behind?', 'Thou hast not taken ' + left.join(', ') + '.', 'Leave them', go); else go();
    },
    mend: function () { act({ type: 'mend' }); }, gild: function () { act({ type: 'gild' }); },
    pickCard: function (el) {
      var uid = +el.getAttribute('data-uid'), inst = st.deck.filter(function (x) { return x.uid === uid; })[0]; if (!inst) return;
      var P = PURPOSE[st.pick.purpose] || { b: 'Choose' };
      zoomCard(inst, [{ label: 'Back' }, { label: P.b, cls: st.pick.purpose === 'gild' ? 'gold' : 'primary', fn: function () { act({ type: 'pickCard', uid: uid }); } }], { preview: st.pick.purpose === 'gild' });
    },
    cancelPick: function () { act({ type: 'cancelPick' }); },
    openChest: function () { if (st.treasure && !st.treasure.opened) { Sfx.coin(); act({ type: 'openChest' }); } },
    leaveTreasure: function () { act({ type: 'leaveTreasure' }); },
    shopCard: function (el) {
      var i = +el.getAttribute('data-idx'), c = st.shop.cards[i]; if (!c || c.sold) return;
      zoomCard({ id: c.id, up: M.passive(st, 'gildRewards') > 0 }, [{ label: 'Back' }, { label: 'Buy · ' + c.price, cls: 'primary', off: st.gold < c.price, fn: function () { act({ type: 'buyCard', idx: i }); } }]);
    },
    shopRelic: function (el) { var i = +el.getAttribute('data-idx'), r = st.shop.relics[i]; if (!r || r.sold) return; relicInfo(r.id, [{ label: 'Back' }, { label: 'Buy · ' + r.price, cls: st.gold < r.price ? 'off' : 'primary', fn: function () { act({ type: 'buyRelic', idx: i }); } }]); },
    buyRemove: function () { act({ type: 'buyRemove' }); }, buyGild: function () { act({ type: 'buyGild' }); },
    leaveShop: function () { act({ type: 'leaveShop' }); },
    eventChoice: function (el) { if (el.disabled) return; Sfx.quill(); act({ type: 'eventChoice', idx: +el.getAttribute('data-idx') }); },
    leaveEvent: function () { act({ type: 'leaveEvent' }); },
    share: function () { copyText(shareText()); },
    // combat
    endTurn: function () {
      if (!st.combat || st.combat.over) return;
      var go = function () { Sfx.seal(); var s = qs('#cSeal'); if (s) s.classList.add('pressed'); act({ type: 'endTurn' }); };
      go();
    },
    foe: function (el) {
      var i = +el.getAttribute('data-ei'), e = st.combat.enemies[i]; if (!e || e.dead) return;
      var hi = selIndex();
      if (hi >= 0) {
        var d = M.cardDef(st.combat.hand[hi]);
        if (M.canPlay(st, hi)) { tryPlay(hi, d.target === 'enemy' ? i : null); return; }
      }
      foeInfo(e);
    },
    hero: function () { if (selIndex() >= 0) { var hi = selIndex(), d = M.cardDef(st.combat.hand[hi]); if (d.target !== 'enemy' && M.canPlay(st, hi)) return tryPlay(hi, null); } heroInfo(); },
    field: function () { if (ui.selUid != null) { selectCard(null); } },
    pile: function (el) { lastPile = el.getAttribute('data-p'); showPile(lastPile); },
    glossInfo: function (el) { var g = st.combat.margin[+el.getAttribute('data-idx')]; if (g) zoomCard(g, null, { ctx: true }); },
    illumInfo: function () { dialog('Illumination', '<p>' + esc(M.KEYWORDS.Illuminate) + '</p><p class="faded">Need: ' + M.illumNeed(st) + ' pigment' + (M.illumNeed(st) > 1 ? 's' : '') + '. ' + (st.combat.illum ? 'Thou hast Illuminated this turn.' : 'Progress this turn: ' + M.illumProgress(st) + '.') + '</p>', [{ label: 'Close', cls: 'primary' }]); },
    inkInfo: function () { dialog('Ink', '<p>' + esc(M.KEYWORDS.Ink) + '</p>', [{ label: 'Close', cls: 'primary' }]); }
  };
  var lastPile = 'draw';
  function rememberAsc() { prefs.asc = prefs.asc || {}; prefs.asc[ui.cs.char] = ui.cs.asc; savePrefs(); }
  // the dialog handler: run fn first (it may open a new overlay), close only if nothing new was opened
  H.dlg = function (el) {
    var b = dlgHandlers[+el.getAttribute('data-idx')], gen = ovGen;
    if (b && b.fn && b.fn() === false) return;
    if (gen === ovGen) closeOv();
  };
  var GAME_ACTS = { proceed: 1, node: 1, takeGold: 1, takeRelic: 1, bossRelic: 1, rewardCard: 1, skipCards: 1, leaveReward: 1, mend: 1, gild: 1, pickCard: 1, cancelPick: 1, openChest: 1, leaveTreasure: 1, shopCard: 1, shopRelic: 1, buyRemove: 1, buyGild: 1, leaveShop: 1, eventChoice: 1, leaveEvent: 1, endTurn: 1, foe: 1, hero: 1, field: 1 };

  document.addEventListener('click', function (ev) {
    Sfx.unlock();
    if (cardPtr.suppressClick) { cardPtr.suppressClick = false; if (ev.target.closest && ev.target.closest('#cHand')) return; }
    var el = ev.target.closest ? ev.target.closest('[data-a]') : null;
    if (!el) return;
    var a = el.getAttribute('data-a');
    if (ui.busy && GAME_ACTS[a]) return;
    if (el.closest('#ovl') == null && ovl.classList.contains('on')) return;
    var fn = H[a]; if (!fn) return;
    // foe/hero taps should not also count as "field" taps
    ev.stopPropagation();
    try { fn(el, ev); } catch (e) { console.error('Handler ' + a, e); }
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && qs('#seedIn') && document.activeElement === qs('#seedIn')) { var b = qsa('#ovl [data-a="dlg"]').pop(); if (b) b.click(); }
    if (ev.key === 'Escape' && ovl.classList.contains('on')) closeOv();
  });
  // no pinch/double-tap zoom on iOS
  ['gesturestart', 'gesturechange'].forEach(function (t) { document.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false }); });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  // ----- card pointer handling: tap / long-press / drag-to-play
  var cardPtr = { el: null, suppressClick: false };
  function foeAtPoint(x, y) {
    var hit = null;
    qsa('#cFoes .foe:not(.dead)').forEach(function (f) { var r = f.getBoundingClientRect(); if (x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 10 && y <= r.bottom + 6) hit = f; });
    return hit;
  }
  document.addEventListener('pointerdown', function (ev) {
    Sfx.unlock();
    var el = ev.target.closest && ev.target.closest('#cHand .card');
    if (!el || ui.busy || ovl.classList.contains('on') || !st || !st.combat || st.combat.over) return;
    var uid = +el.getAttribute('data-uid');
    cardPtr = { el: el, uid: uid, x0: ev.clientX, y0: ev.clientY, moved: false, long: false, id: ev.pointerId, suppressClick: true };
    try { el.setPointerCapture(ev.pointerId); } catch (e) { }
    cardPtr.timer = setTimeout(function () {
      if (cardPtr.el !== el || cardPtr.moved) return;
      cardPtr.long = true;
      var inst = st.combat.hand.filter(function (x) { return x.uid === uid; })[0];
      if (inst) { if (navigator.vibrate) try { navigator.vibrate(8); } catch (e) { } zoomCard(inst, null, { ctx: true }); }
    }, 430);
  });
  document.addEventListener('pointermove', function (ev) {
    var p = cardPtr; if (!p.el || p.long || ev.pointerId !== p.id) return;
    var dx = ev.clientX - p.x0, dy = ev.clientY - p.y0;
    if (!p.moved && Math.sqrt(dx * dx + dy * dy) > 12) {
      p.moved = true; clearTimeout(p.timer);
      if (ui.selUid !== p.uid) selectCard(p.uid);
      p.el.classList.add('drag');
    }
    if (p.moved) {
      p.el.style.transform = 'translate(' + (p.el._x + dx) + 'px,' + (p.el._y + dy) + 'px) rotate(' + (dx * 0.05) + 'deg) scale(1.1)';
      var inst = selInst();
      if (inst && M.cardDef(inst).target === 'enemy') {
        var f = foeAtPoint(ev.clientX, ev.clientY);
        qsa('.foe.aim').forEach(function (x) { if (x !== f) x.classList.remove('aim'); });
        if (f) f.classList.add('aim');
      }
    }
  });
  function endPtr(ev, cancelled) {
    var p = cardPtr; if (!p.el || (ev && ev.pointerId !== p.id)) return;
    clearTimeout(p.timer);
    var el = p.el; cardPtr = { el: null, suppressClick: true };
    setTimeout(function () { cardPtr.suppressClick = false; }, 60);
    if (p.long) return;
    var hi = -1; st.combat.hand.forEach(function (x, i) { if (x.uid === p.uid) hi = i; });
    if (hi < 0) return;
    if (p.moved) {
      el.classList.remove('drag');
      var handTop = qs('#cHand').getBoundingClientRect().top;
      if (!cancelled && ev.clientY < handTop - 24) {
        var d = M.cardDef(st.combat.hand[hi]), f = foeAtPoint(ev.clientX, ev.clientY), tgt = null;
        qsa('.foe.aim').forEach(function (x) { x.classList.remove('aim'); });
        if (d.target === 'enemy') {
          if (f) tgt = +f.getAttribute('data-ei');
          else if (M.living(st).length > 1) { layoutHand(); setHint('Drop the card upon a foe.', true); return; }
        }
        if (!M.canPlay(st, hi)) { layoutHand(); refreshHint(); Sfx.block(); return; }
        tryPlay(hi, tgt); return;
      }
      layoutHand(); return;
    }
    // simple tap
    if (ui.selUid === p.uid) tryPlay(hi, null);
    else { selectCard(p.uid); Sfx.quill(); }
  }
  document.addEventListener('pointerup', function (ev) { endPtr(ev, false); });
  document.addEventListener('pointercancel', function (ev) { endPtr(ev, true); });
  G.addEventListener('resize', function () { if (st && st.screen === 'combat' && ui.view === 'run') layoutHand(); });

  /* =========================================================== 10. boot */
  function boot() {
    if (M.diag) M.diag.install();
    var params = {}; try { params = Object.fromEntries(new URLSearchParams(G.location.search)); } catch (e) { }
    var saved = loadSave();
    if (params.seed) {
      var seed = String(params.seed).trim().toUpperCase().slice(0, 32);
      if (/^DAILY-/i.test(seed)) seed = 'DAILY-' + seed.slice(6);
      if (saved && String(saved.seed).toUpperCase() === seed) continueRun(saved); else startRun(seed, { char: prefs.char && charUnlocked(prefs.char) ? prefs.char : 'knight' });
      try { G.history.replaceState(null, '', G.location.pathname); } catch (e) { }
      return;
    }
    render();
  }
  M.UI = { render: render, act: act, startRun: startRun, state: function () { return st; }, ui: ui, toTitle: toTitle, openCharSel: openCharSel, showBook: showBook, book: function () { return book; }, reloadBook: function () { book = loadBook(); }, achToast: achToast };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
