// Headless balance simulator: a heuristic "decent player" bot over the engine API (M.newRun / M.act).
//   node tools/sim.js 400 --char=knight|nun|scribe --asc=N   (also accepts "--char nun" / "--asc 5")
//   --unlocked=all (default: every achievement earned, so locked cards are in the pools) | none (fresh player)
//            | id,id,...      --bosses  paired boss bench: at every boss arrival the state is cloned and EVERY
//                                       boss option of that act is fought from it (lower-variance per-boss win%)
//   Reports: win rate, boss win-rate-given-arrival grouped by boss (st.map.boss), runaway-turn flags
//   (enemy HP removed in one turn > 150 in Act 1 / > 300 later) and turns that hit the play cap (--cap=60).
//   node tools/sim.js 400                 full report: win rate, act reach, deaths, per-encounter HP/turns,
//                                         card pick/win tables (+ lift vs. expected from act acquired), relics
//   node tools/sim.js 800 --seed=v        different seed set;  --quiet trims the card/relic tables
//   node tools/sim.js 24 --bench=cards    fight bench: HP saved per fight when one copy of each card is added
//                                         to a typical deck for each act (also --bench=relics|upcards|encounters)
//   node tools/sim.js 120 --power=relics --only=a,b   full runs with an item forced in from the start
//   --depth=N --beam=K (search, default 5/2)  --peek (let the bot see draw order)  --workers=N
// Combat: every playable card x target is tried on a cloned state (draw pile re-shuffled so the bot
// cannot peek), followed by a shallow beam lookahead; positions are scored on damage dealt and kills,
// incoming damage vs. Ward from the enemies' intents (M.intentInfo), Corrode, statuses, Illumination
// progress and Glosses (worth more early in a fight). It ends the turn when nothing improves the score.
var path = require('path');
var M = require(path.join(__dirname, '..', 'load'));

var args = process.argv.slice(2);
(function () { // normalise "--key value" into "--key=value"
  var out = [];
  for (var i = 0; i < args.length; i++) {
    var a = args[i];
    if (/^--(char|asc|unlocked|seed|cap|reps|depth|beam|workers)$/.test(a) && i + 1 < args.length && args[i + 1].indexOf('--') !== 0) { out.push(a + '=' + args[++i]); }
    else out.push(a);
  }
  args = out;
})();
var N = +(args.filter(function (a) { return /^\d+$/.test(a); })[0] || 400);
function opt(k, d) { var a = args.filter(function (x) { return x.indexOf('--' + k) === 0; })[0]; if (!a) return d; var v = a.split('=')[1]; return v == null ? true : v; }
var CHAR = opt('char', 'knight'), UNLOCKED = opt('unlocked', 'all'), ASC = +opt('asc', 0), CAP = +opt('cap', 60);
function unlockedList() { return UNLOCKED === 'all' ? Object.keys(M.ACHIEVEMENTS) : (UNLOCKED === 'none' || !UNLOCKED || UNLOCKED === true) ? [] : UNLOCKED.split(','); }
var SEED = opt('seed', 'sim'), QUIET = opt('quiet', false), JSON_OUT = opt('json', null);
var WORKERS = +opt('workers', Math.max(1, Math.min(4, require('os').cpus().length)));
var SHARD = opt('shard', null); // internal: "i/n"

// ------------------------------------------------------------------ card / relic tiers (hand-written)
// 0..10 — how much a decent player wants the card in an average deck.
var TIER = { // blend of hand rating and fight-bench HP-saved (node tools/sim.js 24 --bench=cards)
  lance: 1, shield: 1, moss_dart: 2, rubric_strike: 5.5, couched_lance: 5.9, quill_flurry: 5.7, vermilion_wash: 4.7,
  penknife: 6.4, heraldic_charge: 5.3, desperate_tilt: 5.2, drollery_riot: 5.3, tricolour_strike: 5.6, marginal_lion: 6.3,
  rabbit_punch: 6.7, burnished_edge: 6.7, unhorse: 5.2, margin_sweep: 5.1, scarlet_rubric: 6, unicorn_charge: 6,
  martyrs_zeal: 7.4, gesso_wall: 5.1, riposte: 6.5, lapis_mantle: 5.2, book_clasp: 5.4, steadfast_psalm: 5.1, lapis_smudge: 6.1,
  double_gesso: 4.4, shield_slam: 5.1, lauds: 6.3, night_vigil: 5.8, lapis_keep: 5.3, hatched_feint: 6.6, unbroken_psalter: 4.5,
  wall_of_saints: 6, bramble_hedge: 6.2, verdigris_splash: 5.8, gall_tincture: 6.5, mending_moss: 5.6, mite_bite: 5.4,
  vine_tendril: 7.1, ivy_screen: 5.8, verdigris_bloom: 5.9, canker_strike: 5.8, foxing_spreads: 5.8, oak_gall_garden: 6.1,
  herb_poultice: 5.5, acanthus_scroll: 6.7, lichen_shell: 5.8, creeping_rust: 6.5, harvest_rot: 4.8, green_man: 6.8,
  gold_leaf: 6.8, burnish: 6.1, gilt_initial: 7, gold_ground: 6.7, chrysography: 6.4, gloria: 5.3, pumice_scrub: 4.6,
  turn_the_folio: 5.7, trim_the_quill: 5.6, scratch_out: 4.6, palimpsest: 4.9, pumice_ritual: 4.6, catchword: 5.5,
  rubricated_index: 6.1, colophon: 5.5, inkhorn: 6.1
};
// The Nun (char_nun.js) — hand ratings on the same scale
Object.assign(TIER, {
  nun_psalter_swat: 1, nun_telling_beads: 1, nun_holy_water: 2,
  nun_genuflect: 5.4, nun_plainchant: 5.6, nun_wimple: 5.8, nun_cloister_wall: 5.2, nun_lectio: 5.5, nun_prime: 5.6,
  nun_aspergillum: 5.9, nun_simples: 5.2, nun_green_psalm: 6.2, nun_moss_habit: 5.6, nun_thurible: 5.4,
  nun_ruler_rap: 6.0, nun_censer: 5.6, nun_rebuke: 5.8, nun_gilt_thread: 6.5,
  nun_antiphon: 6.0, nun_steadfast_faith: 5.6, nun_matins: 5.0, nun_hair_shirt: 6.0, nun_heavy_psalter: 6.0, nun_vow_silence: 5.8,
  nun_terce: 6.3, nun_nones: 5.4, nun_infirmary: 5.4, nun_lenten_fast: 5.5, nun_copper_patience: 6.0, nun_tolling_bell: 6.2,
  nun_sext: 6.2, nun_litany: 5.6, nun_smite: 6.0, nun_votive_lamp: 6.0,
  nun_vespers: 6.8, nun_compline: 5.8, nun_walled_in: 6.0, nun_dies_irae: 6.0, nun_sword_michael: 6.6, nun_crown_thorns: 6.5,
  nun_ash_wednesday: 6.6, nun_green_martyr: 6.0, nun_loaves: 6.5, nun_te_deum: 5.5, nun_rapture: 6.4
});
// The Scribe (char_scribe.js) — hand ratings on the same scale
Object.assign(TIER, {
  scr_quill_jab: 1, scr_blotting_sand: 1, scr_first_draft: 2.5,
  scr_red_letter: 5.4, scr_strikethrough: 5.6, scr_hasty_hand: 6.0, scr_double_under: 5.5, scr_vellum_guard: 5.3, scr_erasure: 5.0,
  scr_fair_copy: 5.3, scr_iron_gall: 6.4, scr_foxed_page: 5.8, scr_mildew: 6.0, scr_bole: 5.6, scr_leaf_flake: 5.8, scr_scrawl: 5.5,
  scr_refill: 5.0, scr_manicule: 4.8,
  scr_ditto: 5.2, scr_crowded_margin: 5.8, scr_annotate: 5.8, scr_scrape_clean: 5.0, scr_rushed_copy: 5.8, scr_burnisher: 6.0,
  scr_historiated_o: 6.0, scr_nimbus: 6.2, scr_green_scholia: 6.3, scr_blot_it_out: 5.2, scr_copybook: 5.8, scr_aping_monkey: 6.0,
  scr_correctors_mark: 5.4, scr_steady_hand: 5.4, scr_damp_cellar: 6.0, scr_bas_de_page: 5.6,
  scr_antiphon: 6.0, scr_carpet_page: 6.4, scr_magnum_opus: 6.4, scr_explicit: 6.4, scr_spilled_ink: 6.2, scr_midnight_oil: 6.5,
  scr_recipe_rot: 6.0, scr_teeming_margin: 6.6, scr_gilt_border: 6.4, scr_oak_boards: 6.6
});
// order from `node tools/sim.js 120 --power=relics --only=<boss relics>`
var BOSS_RELIC_PREF = ['scr_leaking_inkhorn', 'nun_cilice', 'sanctus_bell', 'mendicant_bowl', 'heavy_lectern', 'rose_window', 'cracked_censer', 'gilded_quill'];
var RELIC_VAL = { common: 15, uncommon: 20, rare: 26, shop: 15, boss: 30, starter: 0 };

// ------------------------------------------------------------------ helpers
function fastClone(st) {
  var s = Object.assign({}, st);
  s.combat = JSON.parse(JSON.stringify(st.combat));
  s.rng = Object.assign({}, st.rng);
  s.relicState = JSON.parse(JSON.stringify(st.relicState));
  s.stats = Object.assign({}, st.stats);
  s.deck = st.deck.slice(); s.relics = st.relics.slice();
  s.fx = [];
  return s;
}
function hideFuture(s) {
  var d = s.combat.draw;
  for (var i = d.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = d[i]; d[i] = d[j]; d[j] = t; }
  s.rng.combat = (Math.random() * 4294967296) | 0;
}
function liveIdx(st) { var c = st.combat, o = []; c.enemies.forEach(function (e, i) { if (!e.dead) o.push(i); }); return o; }

// Expected HP the player will lose during the coming enemy turn, plus related danger.
function incoming(st) {
  var c = st.combat, tot = 0;
  c.enemies.forEach(function (e) {
    if (e.dead) return;
    var cor = e.st.corrode || 0;
    if (cor >= e.hp) return; // dies to Corrode before acting
    var info = M.intentInfo(st, e);
    if (info.dmg) tot += info.dmg * Math.max(1, info.times);
  });
  return tot;
}

var GLOSS_BASE = 9;
function evalState(st, turn) {
  if (st.hp <= 0 || (st.over && !st.won)) return -1e6;
  var c = st.combat;
  if (!c) return 0;
  var alive = liveIdx(st);
  var v = 0;
  if (!alive.length || c.over) return 1e5 + st.hp * 10;
  var hpFrac = st.hp / st.maxHp;
  var W = 1.25 + 1.2 * (1 - hpFrac); // value of one player HP
  // enemies
  c.enemies.forEach(function (e) {
    if (e.dead) { v += 6 + 0; v += e.maxHp; return; }
    v += (e.maxHp - e.hp);
    var cor = e.st.corrode || 0;
    if (cor) v += 0.75 * Math.min(e.hp, cor * (cor + 1) / 2);
    if (e.st.torn) v += 2.5 * e.st.torn;
    if (e.st.smudged) v += 1.5 * e.st.smudged;
    if (e.st.might) v -= 2 * e.st.might;
  });
  // player damage intake
  var inc = incoming(st);
  var loss = Math.max(0, inc - c.player.ward);
  v -= W * loss;
  v += W * st.hp;
  // ward beyond what is needed has small value only if it persists
  if ((c.player.st.steadfast || 0) > 0) v += 0.7 * Math.max(0, c.player.ward - inc);
  v += hourValue(st);
  var p = c.player.st;
  if (p.might) v += 3.5 * p.might;
  if (p.resolve) v += 3 * p.resolve;
  if (p.zeal) v += 8 * p.zeal;
  if (p.shell) v += 4 * p.shell;
  if (p.brambles) v += 1.5 * p.brambles;
  if (p.mending) v += 0.8 * Math.min(st.maxHp - st.hp, p.mending * (p.mending + 1) / 2);
  if (p.steadfast) v += 1;
  if (p.corrode) v -= W * p.corrode * (p.corrode + 1) / 2;
  if (p.torn) v -= 2 * p.torn;
  if (p.smudged) v -= 1.5 * p.smudged;
  if (p.faded) v -= 1 * p.faded;
  if (p.parched) v -= 4 * p.parched;
  // margin (glosses): worth more early in a fight / against big enemies
  var hpLeft = 0; alive.forEach(function (i) { hpLeft += c.enemies[i].hp; });
  var glossW = GLOSS_BASE * Math.min(1.6, Math.max(0.3, hpLeft / 60));
  v += c.margin.length * glossW;
  // pending next-turn effects
  v += 4 * (c.pending ? c.pending.length : 0);
  // resources still usable this turn
  var playableCost = 0, handVal = 0;
  c.hand.forEach(function (inst) {
    var d = M.cardDef(inst);
    if (d.type === 'blot' || d.type === 'curse') {
      if (inst.id === 'ink_blot') v -= W * 2; else if (inst.id === 'wormhole') v -= 3;
      return;
    }
    var cost = M.cardCost(st, inst);
    if (cost != null) { playableCost += cost; handVal += 1.2; }
  });
  v += handVal;
  v += 2.2 * Math.min(c.ink, playableCost);
  // illumination progress (only matters if not yet illuminated)
  if (!c.illum) v += 1.2 * M.illumProgress(st);
  else v += 2;
  return v;
}

// A smart player knows end-of-turn hooks that need N+ Ward (the Nun's Hours, Wooden Rosary, Censer of Myrrh).
function turnEndHooks(st) {
  var c = st.combat, hs = [];
  c.margin.forEach(function (g) { var d = M.cardDef(g); (d.gloss ? (Array.isArray(d.gloss) ? d.gloss : [d.gloss]) : []).forEach(function (h) { if (h.on === 'turnEnd') hs.push(h); }); });
  st.relics.forEach(function (id) { (M.RELICS[id].hooks || []).forEach(function (h) { if (h.on === 'turnEnd') hs.push(h); }); });
  return hs;
}
function hourValue(st) {
  var c = st.combat, v = 0;
  turnEndHooks(st).forEach(function (h) {
    h.ops.forEach(function (o) {
      if (o.op !== 'if' || String(o.cond).indexOf('wardAtLeast:') !== 0) return;
      var need = +o.cond.split(':')[1];
      if (c.player.ward >= need) v += 5; else v += 3 * c.player.ward / need;
    });
  });
  return v;
}
// Candidate plays (deduplicated by card identity) from a state.
function candidates(st) {
  var c = st.combat, alive = liveIdx(st), seen = {}, out = [];
  for (var hi = 0; hi < c.hand.length; hi++) {
    if (!M.canPlay(st, hi)) continue;
    var inst = c.hand[hi], d = M.cardDef(inst);
    var key = inst.id + (inst.up ? '+' : '') + (inst.costTmp != null ? '$' + inst.costTmp : '');
    if (seen[key]) continue; seen[key] = 1;
    var tgts = d.target === 'enemy' ? alive : [null];
    for (var ti = 0; ti < tgts.length; ti++) out.push({ type: 'play', hand: hi, target: tgts[ti] });
  }
  return out;
}
// Best value reachable within `depth` more plays (greedy-ish lookahead on clones).
function lookValue(st, depth) {
  var v = evalState(st);
  if (depth <= 0 || !st.combat || st.combat.over || st.over) return v;
  var cs = candidates(st), kids = [];
  for (var i = 0; i < cs.length; i++) {
    var s2 = fastClone(st);
    if (!M.act(s2, cs[i]).ok) continue;
    kids.push({ s: s2, v: evalState(s2) });
  }
  kids.sort(function (a, b) { return b.v - a.v; });
  for (var k = 0; k < Math.min(BEAM, kids.length); k++) v = Math.max(v, depth > 1 ? lookValue(kids[k].s, depth - 1) : kids[k].v);
  return v;
}
var DEPTH = +opt('depth', 5), BEAM = +opt('beam', 2), PEEK = opt('peek', false);
function chooseCombatAction(st) {
  var base = evalState(st), best = null, bestV = base + 0.25;
  var cs = candidates(st), kids = [];
  for (var i = 0; i < cs.length; i++) {
    var s2 = fastClone(st);
    if (!PEEK) hideFuture(s2); // a human does not know the draw order or the dice
    if (!M.act(s2, cs[i]).ok) continue;
    kids.push({ a: cs[i], s: s2, v: evalState(s2) });
  }
  kids.sort(function (a, b) { return b.v - a.v; });
  for (var k = 0; k < kids.length; k++) {
    var v = kids[k].v;
    if (k < BEAM + 2 && DEPTH > 1) v = Math.max(v, lookValue(kids[k].s, DEPTH - 1) - 0.1);
    if (v > bestV) { bestV = v; best = kids[k].a; }
  }
  return best || { type: 'endTurn' };
}

// ------------------------------------------------------------------ out-of-combat policy
function cardScore(st, id, up) {
  var d = M.CARDS[id]; if (!d) return 0;
  var t = TIER[id] != null ? TIER[id] : 3;
  if (d.type === 'curse' || d.type === 'blot') return -10;
  // deck composition nudges
  var deck = st.deck, n = deck.length;
  var pigs = { V: 0, L: 0, G: 0, A: 0, N: 0 };
  var glossN = 0;
  deck.forEach(function (x) { var dd = M.CARDS[x.id]; if (pigs[dd.pigment] != null) pigs[dd.pigment]++; if (dd.type === 'gloss') glossN++; });
  if (d.type === 'gloss' && glossN >= 3) t -= 1.5;
  if (d.pigment === 'G' && pigs.G < 3) t += 0.5;
  if (d.pigment === 'L' && pigs.L < 5) t += 0.3;
  var aoe = JSON.stringify(d.ops || []).indexOf('"all"') >= 0;
  if (aoe && !deck.some(function (x) { return JSON.stringify(M.CARDS[x.id].ops || []).indexOf('"all"') >= 0; })) t += 1;
  if (['pumice_scrub', 'scratch_out', 'pumice_ritual', 'palimpsest'].indexOf(id) >= 0 &&
      (st.act >= 2 || deck.some(function (x) { return M.CARDS[x.id].type === 'curse'; }))) t += 1;
  var corroders = 0; deck.forEach(function (x) { if (JSON.stringify(M.CARDS[x.id].ops || []).indexOf('corrode') >= 0 || JSON.stringify(M.CARDS[x.id].gloss || []).indexOf('corrode') >= 0) corroders++; });
  var lapis = deck.filter(function (x) { return M.CARDS[x.id].pigment === 'L'; }).length;
  if (['unbroken_psalter', 'double_gesso', 'shield_slam'].indexOf(id) >= 0 && lapis >= 7) t += 1.5;
  if (['harvest_rot', 'canker_strike', 'verdigris_bloom', 'mite_bite'].indexOf(id) >= 0) t += corroders >= 5 ? 1.2 : corroders >= 3 ? 0.4 : -0.5;
  if (up) t += 0.8;
  return t;
}
function chooseReward(st) {
  var r = st.reward;
  if (!r.goldTaken) M.act(st, { type: 'takeGold' });
  if (r.relic && !r.relicTaken) M.act(st, { type: 'takeRelic' });
  if (r.bossRelics && r.bossRelics.length && !r.relicTaken) {
    // ranked by preference, but a human's taste varies: 60% best, 28% second, 12% third
    var order = r.bossRelics.map(function (id, i) { return i; }).sort(function (x, y) { return BOSS_RELIC_PREF.indexOf(r.bossRelics[x]) - BOSS_RELIC_PREF.indexOf(r.bossRelics[y]); });
    var u = Math.random(), bi = order[u < 0.6 || order.length < 2 ? 0 : (u < 0.88 || order.length < 3) ? 1 : 2];
    M.act(st, { type: 'takeBossRelic', idx: bi });
    log.bossRelic(st.reward ? r.bossRelics[bi] : r.bossRelics[bi]);
  }
  if (!r.cardTaken) {
    var best = -1, bv = -99;
    r.cards.forEach(function (id, i) { var v = cardScore(st, id, M.passive(st, 'gildRewards') > 0); log.offer(id); if (v > bv) { bv = v; best = i; } });
    var thresh = st.deck.length > 22 ? 6 : st.deck.length > 16 ? 4.5 : 3.5;
    if (best >= 0 && bv >= thresh) { log.take(r.cards[best]); M.act(st, { type: 'takeCard', idx: best }); }
    else M.act(st, { type: 'skipCards' });
  }
  M.act(st, { type: 'leaveReward' });
}

function nodeValue(st, node, hpFrac, gold, depth) {
  var t = node.type, v = 0;
  if (t === 'battle') v = node.r <= 3 ? 7 : 4.5 - (hpFrac < 0.35 ? 3 : 0);
  else if (t === 'elite') v = hpFrac > 0.6 ? 9 : hpFrac > 0.45 ? 1 : -8;
  else if (t === 'rest') v = hpFrac < 0.5 ? 10 : 4;
  else if (t === 'shop') v = gold >= 150 ? 8 : gold >= 90 ? 3 : 0.5;
  else if (t === 'event') v = 4.5;
  else if (t === 'treasure') v = 8;
  else if (t === 'boss') v = 0;
  if (depth > 0 && node.next.length) {
    var best = -99;
    node.next.forEach(function (id) { var n2 = M.findNode(st, id); best = Math.max(best, nodeValue(st, n2, hpFrac - (t === 'battle' ? 0.08 : t === 'elite' ? 0.2 : 0) + (t === 'rest' ? 0.3 : 0), gold + (t === 'battle' ? 15 : t === 'elite' ? 30 : 0), depth - 1)); });
    v += 0.7 * best;
  }
  return v;
}
function chooseNode(st) {
  var opts = M.reachable(st), hpFrac = st.hp / st.maxHp, best = opts[0], bv = -1e9;
  opts.forEach(function (id) { var v = nodeValue(st, M.findNode(st, id), hpFrac, st.gold, 3); if (v > bv) { bv = v; best = id; } });
  return best;
}

function bestGildTarget(st, list) {
  var best = null, bv = -99;
  list.forEach(function (x) { var v = (TIER[x.id] || 2) + (M.CARDS[x.id].rarity === 'starter' ? -0.5 : 0); if (x.id === 'shield' || x.id === 'nun_telling_beads' || x.id === 'scr_blotting_sand') v += 0.5; if (v > bv) { bv = v; best = x; } });
  return best;
}
function worstCard(st, list) {
  var best = null, bv = 99;
  list.forEach(function (x) {
    var d = M.CARDS[x.id], v = d.type === 'curse' ? -20 : (TIER[x.id] != null ? TIER[x.id] : 3) + (x.up ? 1 : 0);
    if (x.id === 'lance' || x.id === 'nun_psalter_swat' || x.id === 'scr_quill_jab') v -= 0.2;
    if (v < bv) { bv = v; best = x; }
  });
  return best;
}
function doPick(st) {
  var pk = M.pickable(st), p = st.pick;
  if (!pk.length) return M.act(st, { type: 'cancelPick' });
  var c;
  if (p.purpose === 'gild') c = bestGildTarget(st, pk);
  else if (p.purpose === 'duplicate') { c = null; var bv = -1; pk.forEach(function (x) { var v = TIER[x.id] || 0; if (v > bv) { bv = v; c = x; } }); }
  else c = worstCard(st, pk); // remove / transform
  return M.act(st, { type: 'pickCard', uid: c.uid });
}

function doShop(st) {
  var sh = st.shop, guard = 0;
  // 1) remove a curse / starter if affordable
  if (!sh.removeUsed && st.gold >= M.removePrice(st) && st.deck.length > 8) {
    var hasCurse = st.deck.some(function (x) { return M.CARDS[x.id].type === 'curse'; });
    var starters = st.deck.filter(function (x) { return M.CARDS[x.id].rarity === 'starter' && M.CARDS[x.id].pigment !== 'G'; }).length;
    if (hasCurse || starters >= 4) { M.act(st, { type: 'buyRemove' }); if (st.screen === 'pick') doPick(st); log.shop('remove'); }
  }
  // 2) relics, then cards
  while (guard++ < 10) {
    var bestBuy = null, bv = 0;
    sh.relics.forEach(function (r, i) { if (!r.sold && r.price <= st.gold) { var v = RELIC_VAL[M.RELICS[r.id].rarity] / r.price * 10; if (v > bv) { bv = v; bestBuy = { type: 'buyRelic', idx: i }; } } });
    sh.cards.forEach(function (cc, i) {
      if (cc.sold || cc.price > st.gold) return;
      var s = cardScore(st, cc.id, false); if (s < (st.deck.length > 20 ? 6.5 : 5.5)) return;
      var v = (s - 3) * 2.5 / cc.price * 10; if (v > bv) { bv = v; bestBuy = { type: 'buyCard', idx: i }; }
    });
    if (!bestBuy || bv < 0.6) break;
    M.act(st, bestBuy); log.shop(bestBuy.type === 'buyRelic' ? 'relic' : 'card');
    if (bestBuy.type === 'buyCard') log.take(sh.cards[bestBuy.idx].id, true);
  }
  if (!sh.gildUsed && st.gold >= sh.gildPrice + 30) { M.act(st, { type: 'buyGild' }); if (st.screen === 'pick') doPick(st); }
  if (st.screen === 'shop') M.act(st, { type: 'leaveShop' });
}

function opsValue(st, ops) {
  var v = 0, miss = st.maxHp - st.hp, hpFrac = st.hp / st.maxHp;
  ops.forEach(function (o) {
    switch (o.op) {
      case 'gold': v += o.n * 0.12; break;
      case 'heal': v += Math.min(o.n, miss) * (hpFrac < 0.5 ? 0.9 : 0.45); break;
      case 'loseHp': v -= o.n * (hpFrac < 0.5 ? 1.4 : 0.7); if (o.n >= st.hp) v -= 100; break;
      case 'maxHp': v += o.n * 1.3; break;
      case 'gainCard': v += o.id ? cardScore(st, o.id) * 1.3 : ({ common: 5, uncommon: 7, rare: 10 }[o.rarity] || 5); break;
      case 'addCard': v += M.CARDS[o.id].type === 'curse' ? -11 : 3; break;
      case 'relic': v += RELIC_VAL[o.rarity] || 15; break;
      case 'gildRandom': v += 3.5 * (o.n || 1); break;
      case 'removeRandom': v += 3; break;
      case 'choose': v += { remove: 10, transform: 3, duplicate: 6, gild: 6 }[o.purpose] || 0; break;
      case 'fight': v += (o.kind === 'elite' ? (hpFrac > 0.65 ? -2 : -25) : (hpFrac > 0.5 ? 2 : -15)); break;
    }
  });
  return v;
}
function doEvent(st) {
  if (st.event.stage !== 'choice') return M.act(st, { type: 'leaveEvent' });
  var d = M.EVENTS[st.event.id], best = 0, bv = -1e9;
  d.choices.forEach(function (ch, i) { if (!M.choiceAvailable(st, ch)) return; var v = opsValue(st, ch.ops || []); if (v > bv) { bv = v; best = i; } });
  log.event(st.event.id, best);
  return M.act(st, { type: 'eventChoice', idx: best });
}

// ------------------------------------------------------------------ logging
var STATS = {
  runs: 0, wins: 0, reachAct: [0, 0, 0, 0], deathEnc: {}, deathKind: {}, fights: {}, runTurns: 0, runFights: 0,
  cardOffer: {}, cardTake: {}, cardStage: {}, relicStage: {}, cardBuy: {}, winTurns: 0, winFloors: 0, runFloors: 0, cardInDeck: {}, cardInDeckWin: {}, relicHave: {}, relicHaveWin: {}, bossArrive: [0, 0, 0, 0], bossWin: [0, 0, 0, 0],
  events: {}, shop: {}, bossRelic: {}, bigTurns: {}, maxTurnAct: [0, 0, 0, 0], capHits: 0, bossBy: {}, bossFights: {}, deckSize: 0, floorDeath: {}, hpAtBoss: [0, 0, 0, 0]
};
var log = {
  offer: function (id) { STATS.cardOffer[id] = (STATS.cardOffer[id] || 0) + 1; },
  take: function (id, shop) { if (shop) STATS.cardBuy[id] = (STATS.cardBuy[id] || 0) + 1; else STATS.cardTake[id] = (STATS.cardTake[id] || 0) + 1; },
  event: function (id, i) { var k = id + '#' + i; STATS.events[k] = (STATS.events[k] || 0) + 1; },
  shop: function (k) { STATS.shop[k] = (STATS.shop[k] || 0) + 1; },
  bossRelic: function (id) { STATS.bossRelic[id] = (STATS.bossRelic[id] || 0) + 1; }
};
function fightKey(c, act) { return 'A' + act + ' ' + c.kind + ' ' + c.enc.join('+'); }

var FORCE = opt('force', null); // e.g. --force=card:gloria or --force=relic:oak_gall (added at run start)
function playRun(seed) {
  var st = M.newRun({ seed: seed, char: CHAR, asc: ASC, unlocked: unlockedList() }), steps = 0, fight = null;
  if (FORCE) { var fp = FORCE.split(':'); if (fp[0] === 'card') M.addToDeck(st, fp[1], false); else M.gainRelic(st, fp[1]); }
  var acq = {}, acqRel = {};
  var scan = function () {
    st.deck.forEach(function (x) { if (acq[x.uid] == null) acq[x.uid] = Math.min(3, st.act); });
    st.relics.forEach(function (id) { if (acqRel[id] == null) acqRel[id] = Math.min(3, st.act); });
  };
  while (!st.over && steps++ < 20000) {
    scan();
    switch (st.screen) {
      case 'actIntro': M.act(st, { type: 'proceed' }); break;
      case 'map':
        var nid = chooseNode(st);
        if (BOSSMODE && M.findNode(st, nid).type === 'boss') benchBosses(st, nid);
        if (SAVEARR && M.findNode(st, nid).type === 'boss') require('fs').appendFileSync(SAVEARR, JSON.stringify({ nid: nid, snap: JSON.stringify(st) }) + '\n');
        M.act(st, { type: 'chooseNode', id: nid }); break;
      case 'combat':
        if (!fight) {
          fight = { key: fightKey(st.combat, st.act), hp0: st.hp, kind: st.combat.kind, act: st.act, plays: 0, playTurn: -1 };
          if (fight.kind === 'boss') {
            STATS.bossArrive[st.act]++; STATS.hpAtBoss[st.act] += st.hp / st.maxHp;
            fight.boss = 'A' + st.act + ' ' + st.combat.enc.join('+');
            var BB = STATS.bossBy[fight.boss] = STATS.bossBy[fight.boss] || { arr: 0, win: 0, hpArr: 0, turns: 0 };
            BB.arr++; BB.hpArr += st.hp / st.maxHp;
          }
        }
        var a = chooseCombatAction(st);
        if (fight.playTurn !== st.combat.turn) { fight.playTurn = st.combat.turn; fight.plays = 0; }
        if (a.type === 'play' && fight.plays >= CAP) {
          STATS.capHits++;
          if (STATS.capHits <= 5) process.stderr.write('PLAY CAP (' + CAP + ') ' + st.char + ' A' + fight.act + ' ' + fight.key + ' turn ' + st.combat.turn + ', deck ' + st.deck.map(function (x) { return x.id + (x.up ? '+' : ''); }).join(',') + '\n');
          a = { type: 'endTurn' };
        }
        if (a.type === 'play') fight.plays++;
        var hpB = enemyHp(st), turnB = st.combat.turn;
        var r = M.act(st, a);
        if (a.type === 'play') { fight.turnDmg = (fight.turnTag === turnB ? fight.turnDmg : 0) + Math.max(0, hpB - enemyHp(st)); fight.turnTag = turnB; trackTurn(st, fight); }
        if (!r.ok) M.act(st, { type: 'endTurn' });
        break;
      case 'reward':
        endFight(st, fight, true); fight = null;
        chooseReward(st); break;
      case 'rest': if (st.hp / st.maxHp < 0.5 || !st.deck.some(function (x) { return !x.up && M.CARDS[x.id].up; })) M.act(st, { type: 'mend' }); else { M.act(st, { type: 'gild' }); if (st.screen === 'pick') doPick(st); } break;
      case 'pick': doPick(st); break;
      case 'treasure': M.act(st, { type: 'openChest' }); M.act(st, { type: 'leaveTreasure' }); break;
      case 'shop': doShop(st); break;
      case 'event': doEvent(st); break;
      default: throw new Error('screen ' + st.screen);
    }
  }
  if (fight) endFight(st, fight, false); // died (or won final boss)
  STATS.runs++;
  if (st.won) STATS.wins++;
  for (var a2 = 1; a2 <= Math.min(3, st.act); a2++) STATS.reachAct[a2]++;
  STATS.runTurns += st.stats.turns; STATS.runFloors += st.stats.floors;
  STATS.progress = (STATS.progress || 0) + st.stats.floors + (st.won ? 4 : 0);
  if (st.won) { STATS.winTurns += st.stats.turns; STATS.winFloors += st.stats.floors; }
  STATS.deckSize += st.deck.length;
  scan();
  var ids = {}; st.deck.forEach(function (x) { ids[x.id] = Math.min(ids[x.id] || 9, acq[x.uid] || 1); });
  Object.keys(ids).forEach(function (id) { var a = STATS.cardStage[id] = STATS.cardStage[id] || [0, 0, 0, 0]; a[ids[id]]++; });
  st.relics.forEach(function (id) { var a = STATS.relicStage[id] = STATS.relicStage[id] || [0, 0, 0, 0]; a[acqRel[id] || 1]++; });
  Object.keys(ids).forEach(function (id) { STATS.cardInDeck[id] = (STATS.cardInDeck[id] || 0) + 1; if (st.won) STATS.cardInDeckWin[id] = (STATS.cardInDeckWin[id] || 0) + 1; });
  st.relics.forEach(function (id) { STATS.relicHave[id] = (STATS.relicHave[id] || 0) + 1; if (st.won) STATS.relicHaveWin[id] = (STATS.relicHaveWin[id] || 0) + 1; });
  return st;
}
function enemyHp(st) { var t = 0; if (st.combat) st.combat.enemies.forEach(function (e) { t += e.hp; }); return t; }
function trackTurn(st, f) {
  var d = f.turnDmg, lim = f.act === 1 ? 150 : 300;
  var b = d > lim ? 'RUNAWAY>' + lim : d > lim * 2 / 3 ? '>' + Math.round(lim * 2 / 3) : null;
  var A = Math.min(3, f.act);
  if (d > STATS.maxTurnAct[A]) STATS.maxTurnAct[A] = d;
  if (b && !f['seen' + b + f.turnTag]) { f['seen' + b + f.turnTag] = 1; var k = 'A' + f.act + ' ' + b; STATS.bigTurns[k] = (STATS.bigTurns[k] || 0) + 1; }
  if (d > lim && !f.warned && (STATS.bigTurns['A' + f.act + ' RUNAWAY>' + lim] || 0) <= 3) { f.warned = 1; process.stderr.write('RUNAWAY TURN ' + st.char + ' A' + f.act + ' ' + f.key + ' turn ' + f.turnTag + ': ' + d + ' dmg, deck ' + st.deck.map(function (x) { return x.id + (x.up ? '+' : ''); }).join(',') + ' relics ' + st.relics.join(',') + '\n'); }
}
var BOSSMODE = opt('bosses', false), REPS = +opt('reps', 1);
// --saveArrivals=file : append every boss-arrival state (JSON lines).  --arrivals=file : skip the runs; fight every
// boss option of the act from each saved arrival (fast boss-tuning loop; N caps the number of arrivals used).
var ONLYBOSS = opt('onlyBoss', null) ? opt('onlyBoss').split(',') : null; // --onlyBoss=id,id limits the bench
var SAVEARR = opt('saveArrivals', null), ARRFILE = opt('arrivals', null), ARR = null;
if (ARRFILE) { ARR = require('fs').readFileSync(ARRFILE, 'utf8').split('\n').filter(Boolean); N = Math.min(N, ARR.length); }
function benchBosses(st, nid, snap) { // fight every boss option of this act from the same arrival state
  snap = snap || JSON.stringify(st); var act = st.act;
  M.ENCOUNTERS[act].boss.forEach(function (enc) {
    if (ONLYBOSS && !enc.some(function (id) { return ONLYBOSS.indexOf(id) >= 0; })) return;
    for (var r = 0; r < REPS; r++) {
      var s2 = JSON.parse(snap); s2.fx = [];
      s2.map.boss = enc; s2.rng.combat = M.hashStr(s2.seed + ':bossbench:' + enc.join('+') + ':' + r);
      var hp0 = s2.hp;
      M.act(s2, { type: 'chooseNode', id: nid });
      var g = 0, plays = 0, pt = -1;
      while (s2.screen === 'combat' && !s2.over && g++ < 3000) {
        var a = chooseCombatAction(s2);
        if (pt !== s2.combat.turn) { pt = s2.combat.turn; plays = 0; }
        if (a.type === 'play' && ++plays > CAP) a = { type: 'endTurn' };
        if (!M.act(s2, a).ok) M.act(s2, { type: 'endTurn' });
      }
      var won = s2.hp > 0 && (s2.screen === 'reward' || s2.won);
      var key = 'A' + act + ' ' + enc.join('+');
      var B = STATS.bossFights[key] = STATS.bossFights[key] || { n: 0, wins: 0, lost: 0, turns: 0, hpArr: 0 };
      B.n++; B.wins += won ? 1 : 0; B.turns += s2.combat ? s2.combat.turn : 0; B.hpArr += hp0 / s2.maxHp;
      B.lost += won ? Math.max(0, hp0 - s2.hp + healAfter(s2)) : hp0;
    }
  });
}
function endFight(st, f, won) {
  if (!f) return;
  won = won || st.won;
  var F = STATS.fights[f.key] = STATS.fights[f.key] || { n: 0, lost: 0, turns: 0, deaths: 0, kind: f.kind, act: f.act };
  var turns = st.combat ? st.combat.turn : 0;
  var hp1 = won ? st.hp : 0;
  // pilgrim badge etc heal after win before we see it: undo combatEnd heals by using fx-free approximation
  F.n++; F.turns += turns; F.lost += Math.max(0, f.hp0 - hp1 + (won ? healAfter(st) : 0));
  STATS.runFights++;
  if (!won) { F.deaths++; STATS.deathEnc[f.key] = (STATS.deathEnc[f.key] || 0) + 1; STATS.deathKind['A' + f.act + ' ' + f.kind] = (STATS.deathKind['A' + f.act + ' ' + f.kind] || 0) + 1; }
  else if (won && f.kind === 'boss') STATS.bossWin[f.act]++;
  if (f.boss) { var BB = STATS.bossBy[f.boss]; BB.turns += turns; if (won) BB.win++; }
}
function healAfter(st) { // HP restored by combatEnd relic hooks (so 'HP lost' measures the fight itself)
  var h = 0;
  st.relics.forEach(function (id) { (M.RELICS[id].hooks || []).forEach(function (k) { if (k.on === 'combatEnd') k.ops.forEach(function (o) { if (o.op === 'heal') h += o.n; }); }); });
  return h;
}

// ------------------------------------------------------------------ report
function pct(a, b) { return b ? (100 * a / b).toFixed(1) + '%' : '-'; }
function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
function lpad(s, n) { s = String(s); while (s.length < n) s = ' ' + s; return s; }
function merge(a, b) {
  Object.keys(b).forEach(function (k) {
    if (typeof b[k] === 'number') a[k] = (a[k] || 0) + b[k];
    else if (k === 'maxTurnAct') b[k].forEach(function (v, i) { a[k][i] = Math.max(a[k][i] || 0, v); });
    else if (Array.isArray(b[k])) b[k].forEach(function (v, i) { a[k][i] = (a[k][i] || 0) + v; });
    else if (b[k] && typeof b[k] === 'object') { a[k] = a[k] || {}; if (Object.values(b[k]).some(function (x) { return x && typeof x === 'object'; })) { Object.keys(b[k]).forEach(function (kk) { if (!a[k][kk]) a[k][kk] = b[k][kk]; else Object.keys(b[k][kk]).forEach(function (f) { if (typeof b[k][kk][f] === 'number' && f !== 'act') a[k][kk][f] += b[k][kk][f]; }); }); } else merge(a[k], b[k]); }
  });
}

function randomBaseline(n) {
  try {
    var out = require('child_process').execFileSync(process.execPath, [path.join(__dirname, '..', 'smoke.js'), String(n)], { encoding: 'utf8' });
    return JSON.parse(out.trim().split('\n').pop());
  } catch (e) { return null; }
}

function expectedWin(S, stages) { // win rate you'd expect from WHEN the item was acquired (removes survivorship bias)
  var n = 0, e = 0;
  for (var a = 1; a <= 3; a++) { var c = (stages && stages[a]) || 0; if (!c) continue; n += c; e += c * S.wins / Math.max(1, S.reachAct[a]); }
  return n ? e / n : null;
}
function lift(S, have, haveWin, stages) {
  var ex = expectedWin(S, stages); if (ex == null || !have) return '     -';
  var d = 100 * (haveWin / have - ex); return lpad((d >= 0 ? '+' : '') + d.toFixed(1), 6);
}
function report(S, t0) {
  var R = S.runs, o = [];
  o.push('=== Marginalia balance sim [' + CHAR + ', asc ' + ASC + ', unlocked=' + UNLOCKED + ']: ' + R + ' runs (' + ((Date.now() - t0) / 1000).toFixed(1) + 's) ===');
  o.push('SMART bot win rate: ' + pct(S.wins, R) + '   reach Act2: ' + pct(S.reachAct[2], R) + '   reach Act3: ' + pct(S.reachAct[3], R));
  var avgTurns = S.runTurns / R;
  var est = function (turns, floors) { return ((turns * 6 + floors * 20) / 60).toFixed(1); };
  o.push('Avg turns/run: ' + avgTurns.toFixed(1) + ' (est ' + est(avgTurns, S.runFloors / R) + ' min)   winning runs: ' + (S.wins ? (S.winTurns / S.wins).toFixed(1) + ' turns, est ' + est(S.winTurns / S.wins, S.winFloors / S.wins) + ' min' : '-') + '   [6s/turn + 20s per map node]   avg final deck ' + (S.deckSize / R).toFixed(1));
  [1, 2, 3].forEach(function (a) {
    o.push('Boss A' + a + ': arrived ' + S.bossArrive[a] + ', won ' + S.bossWin[a] + ' (' + pct(S.bossWin[a], S.bossArrive[a]) + '), avg HP% on arrival ' + (S.bossArrive[a] ? (100 * S.hpAtBoss[a] / S.bossArrive[a]).toFixed(0) : '-'));
  });
  var rb = opt('baseline', false) ? randomBaseline(300) : null; // --baseline: also run smoke.js 300 (random bot)
  if (rb) o.push('RANDOM bot baseline (smoke.js 300): wins ' + pct(rb.wins, rb.runs) + ', ended in act ' + JSON.stringify(rb.reachedAct));
  o.push('-- Boss win-rate-given-arrival, by boss (natural runs: st.map.boss) --');
  Object.keys(S.bossBy).sort().forEach(function (k) { var B = S.bossBy[k]; o.push('  ' + pad(k, 34) + ' arrived ' + lpad(B.arr, 4) + '  won ' + lpad(pct(B.win, B.arr), 7) + '  HP% on arrival ' + lpad((100 * B.hpArr / B.arr).toFixed(0), 3) + '  turns ' + (B.turns / B.arr).toFixed(1)); });
  if (Object.keys(S.bossFights).length) {
    o.push('-- Paired boss bench (each arrival fought vs every boss option of the act) --');
    o.push('  ' + pad('boss', 34) + lpad('n', 5) + lpad('win%', 8) + lpad('HP lost', 9) + lpad('turns', 7) + lpad('HP%arr', 8));
    Object.keys(S.bossFights).sort().forEach(function (k) { var B = S.bossFights[k]; o.push('  ' + pad(k, 34) + lpad(B.n, 5) + lpad(pct(B.wins, B.n), 8) + lpad((B.lost / B.n).toFixed(1), 9) + lpad((B.turns / B.n).toFixed(1), 7) + lpad((100 * B.hpArr / B.n).toFixed(0), 8)); });
  }
  o.push('Big single turns (enemy HP removed in one turn; RUNAWAY = >150 in A1, >300 later): ' + JSON.stringify(S.bigTurns) + '   max per act ' + JSON.stringify(S.maxTurnAct.slice(1)));
  o.push('Turns that hit the ' + CAP + '-play cap: ' + S.capHits);
  o.push('\n-- Deaths by act/kind --');
  Object.keys(S.deathKind).sort().forEach(function (k) { o.push('  ' + pad(k, 16) + lpad(S.deathKind[k], 5) + '  ' + pct(S.deathKind[k], R - S.wins)); });
  o.push('\n-- Encounters: n, avg HP lost, avg turns, deaths --');
  Object.keys(S.fights).sort(function (a, b) { return a < b ? -1 : 1; }).forEach(function (k) {
    var F = S.fights[k];
    o.push('  ' + pad(k, 52) + lpad(F.n, 5) + lpad((F.lost / F.n).toFixed(1), 7) + lpad((F.turns / F.n).toFixed(1), 6) + lpad(F.deaths, 5));
  });
  var kinds = {};
  Object.keys(S.fights).forEach(function (k) { var F = S.fights[k], kk = 'A' + F.act + ' ' + F.kind; var K = kinds[kk] = kinds[kk] || { n: 0, lost: 0, turns: 0 }; K.n += F.n; K.lost += F.lost; K.turns += F.turns; });
  o.push('\n-- By kind --');
  Object.keys(kinds).sort().forEach(function (k) { var K = kinds[k]; o.push('  ' + pad(k, 14) + ' n ' + lpad(K.n, 5) + '  HP lost ' + lpad((K.lost / K.n).toFixed(1), 5) + '  turns ' + (K.turns / K.n).toFixed(1)); });
  o.push('\n-- Cards: offered(reward), taken, pick%, bought, in final decks, win% with card (overall ' + pct(S.wins, R) + '), lift vs. expected from act acquired --');
  var ids = Object.keys(M.CARDS).filter(function (id) { var r = M.CARDS[id].rarity; return r !== 'special'; });
  ids.sort(function (a, b) { return (S.cardTake[b] || 0) / (S.cardOffer[b] || 1) - (S.cardTake[a] || 0) / (S.cardOffer[a] || 1); });
  ids.forEach(function (id) {
    var inD = S.cardInDeck[id] || 0;
    o.push('  ' + pad(id, 18) + pad(M.CARDS[id].rarity, 9) + lpad(S.cardOffer[id] || 0, 6) + lpad(S.cardTake[id] || 0, 6) + lpad(pct(S.cardTake[id] || 0, S.cardOffer[id] || 0), 8) + lpad(S.cardBuy[id] || 0, 5) + lpad(inD, 6) + lpad(pct(S.cardInDeckWin[id] || 0, inD), 8) + lift(S, inD, S.cardInDeckWin[id] || 0, S.cardStage[id]));
  });
  o.push('\n-- Relics: runs holding at end, win%, lift vs. expected from act acquired --');
  Object.keys(M.RELICS).sort(function (a, b) { return (S.relicHaveWin[b] || 0) / (S.relicHave[b] || 1) - (S.relicHaveWin[a] || 0) / (S.relicHave[a] || 1); }).forEach(function (id) {
    o.push('  ' + pad(id, 18) + pad(M.RELICS[id].rarity, 9) + lpad(S.relicHave[id] || 0, 6) + lpad(pct(S.relicHaveWin[id] || 0, S.relicHave[id] || 0), 8) + lift(S, S.relicHave[id] || 0, S.relicHaveWin[id] || 0, S.relicStage[id]));
  });
  o.push('\n-- Event choices --');
  o.push('  ' + Object.keys(S.events).sort().map(function (k) { return k + ':' + S.events[k]; }).join('  '));
  o.push('-- Shop buys: ' + JSON.stringify(S.shop) + '   boss relics: ' + JSON.stringify(S.bossRelic));
  return o.join('\n');
}


// ------------------------------------------------------------------ fight bench (low-variance card/relic power)
// Fights every encounter of each act with a fixed, typical deck for that act, with and without the item.
var BENCH_DECKS = {
  1: { cards: M.STARTER_DECK.slice(), up: [], relics: [] },
  2: { cards: ['lance', 'lance', 'lance', 'shield', 'shield', 'shield', 'shield', 'moss_dart', 'moss_dart', 'rubric_strike', 'gesso_wall', 'verdigris_splash', 'couched_lance', 'vermilion_wash', 'gall_tincture', 'hatched_feint'],
       up: ['rubric_strike', 'shield'], relics: ['vermilion_cake'] },
  3: { cards: ['lance', 'lance', 'shield', 'shield', 'shield', 'moss_dart', 'moss_dart', 'rubric_strike', 'gesso_wall', 'verdigris_splash', 'couched_lance', 'vermilion_wash', 'gall_tincture', 'hatched_feint', 'unhorse', 'lauds', 'canker_strike', 'gilt_initial', 'lapis_keep', 'rabbit_punch'],
       up: ['rubric_strike', 'shield', 'couched_lance', 'gesso_wall', 'lauds'], relics: ['vermilion_cake', 'scallop_shell'] }
};
var BENCH_HP = { 1: 999, 2: 999, 3: 999 }; // no deaths: measure pure HP lost (lower variance)
function benchFight(act, enc, kind, seed, item) {
  var st = M.newRun({ seed: seed });
  st.act = act; st.deck = []; st.relics = []; st.relicState = {};
  var D = BENCH_DECKS[act], upLeft = D.up.slice();
  D.cards.forEach(function (id) { var k = upLeft.indexOf(id); M.addToDeck(st, id, k >= 0); if (k >= 0) upLeft.splice(k, 1); });
  D.relics.concat(['pilgrim_badge']).forEach(function (id) { M.gainRelic(st, id); });
  if (item) { var ip = item.split(':'); if (ip[0] === 'card') M.addToDeck(st, ip[1], ip[2] === 'up'); else M.gainRelic(st, ip[1]); }
  st.maxHp = st.hp = BENCH_HP[act] + (st.maxHp - 70);
  var hp0 = st.hp;
  M.startCombat(st, enc, kind);
  var g = 0;
  while (st.combat && !st.combat.over && !st.over && g++ < 400) {
    var a = chooseCombatAction(st); if (!M.act(st, a).ok) M.act(st, { type: 'endTurn' });
  }
  var left = 0; if (st.combat) st.combat.enemies.forEach(function (e) { if (!e.dead) left += e.hp; });
  var lost = st.hp <= 0 ? hp0 + 0.5 * left : hp0 - st.hp + healAfter(st);
  return { lost: lost, turns: st.combat ? st.combat.turn : 0, died: st.hp <= 0 };
}
function benchItem(item, reps) {
  var out = {};
  [1, 2, 3].forEach(function (act) {
    var E = M.ENCOUNTERS[act], tot = 0, n = 0, per = {};
    [['normal', 'battle', 1], ['elite', 'elite', 1], ['boss', 'boss', 1]].forEach(function (kk) {
      E[kk[0]].forEach(function (enc) {
        var key = 'A' + act + ' ' + kk[1] + ' ' + enc.join('+'), sum = 0, tsum = 0, d = 0;
        for (var r = 0; r < reps; r++) { var f = benchFight(act, enc, kk[1], SEED + key + r, item); sum += f.lost; tsum += f.turns; d += f.died ? 1 : 0; }
        per[key] = { lost: sum / reps, turns: tsum / reps, deaths: d / reps };
        tot += sum / reps * (kk[0] === 'boss' ? 3 : kk[0] === 'elite' ? 1.5 : 1); n += (kk[0] === 'boss' ? 3 : kk[0] === 'elite' ? 1.5 : 1);
      });
    });
    out[act] = { avg: tot / n, per: per };
  });
  return out;
}

// ------------------------------------------------------------------ main
function runRange(lo, hi) {
  if (ARR) {
    for (var j = lo; j < hi; j++) { var rec = JSON.parse(ARR[Math.floor(j * ARR.length / N)]), s0 = JSON.parse(rec.snap); benchBosses(s0, rec.nid, rec.snap); STATS.runs++; }
    return STATS;
  }
  for (var i = lo; i < hi; i++) {
    var t = Date.now(), st = playRun(SEED + i);
    if (Date.now() - t > 3000) process.stderr.write('slow run ' + SEED + i + ': ' + (Date.now() - t) + 'ms, turns ' + st.stats.turns + ', act ' + st.act + ', deck ' + st.deck.map(function (x) { return x.id; }).join(',') + '\n');
  }
  return STATS;
}

var BENCH = opt('bench', null), BENCHITEM = opt('benchitem', null);
if (BENCHITEM) { process.stdout.write(JSON.stringify(benchItem(BENCHITEM === 'none' ? null : BENCHITEM, N))); process.exit(0); }
if (BENCH === 'encounters') {
  var bi = benchItem(null, N);
  [1, 2, 3].forEach(function (a) { Object.keys(bi[a].per).forEach(function (k) { var p = bi[a].per[k]; console.log(pad(k, 52) + ' lost ' + lpad(p.lost.toFixed(1), 6) + ' turns ' + lpad(p.turns.toFixed(1), 5) + ' died ' + lpad((100 * p.deaths).toFixed(0), 4) + '%'); }); });
  process.exit(0);
}
if (BENCH) {
  var cpb = require('child_process'), bitems = ['none'];
  if (BENCH === 'relics') Object.keys(M.RELICS).forEach(function (id) { if (M.RELICS[id].rarity !== 'starter') bitems.push('relic:' + id); });
  else Object.keys(M.CARDS).forEach(function (id) { if (M.CARDS[id].rarity !== 'special') bitems.push('card:' + id + (BENCH === 'upcards' ? ':up' : '')); });
  if (opt('only', null)) bitems = ['none'].concat(opt('only').split(',').map(function (x) { return (BENCH === 'relics' ? 'relic:' : 'card:') + x; }));
  var bres = {}, bq = 0, brun = 0, bt0 = Date.now();
  var bnext = function () {
    if (bq >= bitems.length) { if (!brun) breport(); return; }
    var it = bitems[bq++]; brun++;
    var ch = cpb.spawn(process.execPath, [__filename, String(N), '--seed=' + SEED, '--benchitem=' + it], { stdio: ['ignore', 'pipe', 'inherit'] }), buf = '';
    ch.stdout.on('data', function (d) { buf += d; });
    ch.on('close', function () { bres[it] = JSON.parse(buf); brun--; bnext(); });
  };
  var breport = function () {
    var b = bres.none;
    console.log('Fight bench: ' + N + ' reps/encounter, ' + ((Date.now() - bt0) / 1000).toFixed(0) + 's. Baseline weighted HP lost/fight A1 ' + b[1].avg.toFixed(1) + ' A2 ' + b[2].avg.toFixed(1) + ' A3 ' + b[3].avg.toFixed(1));
    console.log('  (HP saved per fight when the item is added; positive = helps)');
    var rows = Object.keys(bres).filter(function (k) { return k !== 'none'; }).map(function (k) {
      var r = bres[k]; var d = [1, 2, 3].map(function (a) { return b[a].avg - r[a].avg; });
      return { k: k, d: d, m: (d[0] + d[1] + d[2]) / 3 };
    }).sort(function (x, y) { return y.m - x.m; });
    rows.forEach(function (r) { var id = r.k.split(':')[1], def = (BENCH === 'relics' ? M.RELICS[id] : M.CARDS[id]); console.log('  ' + pad(id, 18) + pad(def.rarity, 9) + (def.cost != null ? 'c' + def.cost + ' ' : '   ') + ' A1 ' + lpad(r.d[0].toFixed(1), 6) + '  A2 ' + lpad(r.d[1].toFixed(1), 6) + '  A3 ' + lpad(r.d[2].toFixed(1), 6) + '  avg ' + lpad(r.m.toFixed(1), 6)); });
  };
  for (var wb = 0; wb < WORKERS; wb++) bnext();
}
var POWER = opt('power', null); // --power=cards|relics : paired runs with each item forced into the start
if (BENCH) { /* handled above */ } else if (POWER && !SHARD && !FORCE) {
  var cp0 = require('child_process'), items = ['none'];
  if (POWER === 'relics') Object.keys(M.RELICS).forEach(function (id) { if (['starter'].indexOf(M.RELICS[id].rarity) < 0) items.push('relic:' + id); });
  else Object.keys(M.CARDS).forEach(function (id) { if (M.CARDS[id].rarity !== 'special') items.push('card:' + id); });
  if (opt('only', null)) items = ['none'].concat(opt('only').split(',').map(function (x) { return (POWER === 'relics' ? 'relic:' : 'card:') + x; }));
  var res = {}, qi = 0, running = 0, t0p = Date.now();
  var next = function () {
    if (qi >= items.length) { if (!running) powerReport(); return; }
    var it = items[qi++]; running++;
    var a = [__filename, String(N), '--workers=1', '--seed=' + SEED, '--json=-', '--quiet'];
    if (it !== 'none') a.push('--force=' + it);
    var ch = cp0.spawn(process.execPath, a, { stdio: ['ignore', 'pipe', 'inherit'] }), buf = '';
    ch.stdout.on('data', function (d) { buf += d; });
    ch.on('close', function () { var S = JSON.parse(buf); res[it] = { win: S.wins / S.runs, prog: S.progress / S.runs, a2: S.reachAct[2] / S.runs }; running--; next(); });
  };
  var powerReport = function () {
    var b = res.none;
    console.log('Power (' + N + ' paired runs each, ' + ((Date.now() - t0p) / 1000).toFixed(0) + 's). baseline win ' + (100 * b.win).toFixed(1) + '% prog ' + b.prog.toFixed(2));
    Object.keys(res).filter(function (k) { return k !== 'none'; }).sort(function (x, y) { return res[y].prog - res[x].prog; }).forEach(function (k) {
      var r = res[k], id = k.split(':')[1], rar = (POWER === 'relics' ? M.RELICS[id] : M.CARDS[id]).rarity;
      console.log('  ' + pad(id, 18) + pad(rar, 9) + ' dWin ' + lpad((100 * (r.win - b.win)).toFixed(1), 6) + '  dProg ' + lpad((r.prog - b.prog).toFixed(2), 6) + '  dAct2 ' + lpad((100 * (r.a2 - b.a2)).toFixed(1), 6));
    });
  };
  for (var w0 = 0; w0 < WORKERS; w0++) next();
} else if (SHARD) {
  var sp = SHARD.split('/'), si = +sp[0], sn = +sp[1];
  var lo = Math.floor(N * si / sn), hi = Math.floor(N * (si + 1) / sn);
  runRange(lo, hi);
  process.stdout.write(JSON.stringify(STATS));
} else {
  var t0 = Date.now();
  if (WORKERS > 1 && N >= 20 && !POWER) {
    var cp = require('child_process'), done = 0, parts = [];
    for (var w = 0; w < WORKERS; w++) (function (w) {
      var ch = cp.spawn(process.execPath, [__filename].concat(args.filter(function (a) { return a.indexOf('--json') && a.indexOf('--workers'); }), ['--shard=' + w + '/' + WORKERS]), { stdio: ['ignore', 'pipe', 'inherit'] });
      var buf = ''; ch.stdout.on('data', function (d) { buf += d; });
      ch.on('close', function () {
        parts[w] = JSON.parse(buf);
        if (++done === WORKERS) {
          var S = parts[0]; for (var k = 1; k < parts.length; k++) merge(S, parts[k]);
          finish(S, t0);
        }
      });
    })(w);
  } else { runRange(0, N); finish(STATS, t0); }
}
function finish(S, t0) {
  if (JSON_OUT === '-') { process.stdout.write(JSON.stringify(S)); return; }
  if (JSON_OUT) require('fs').writeFileSync(JSON_OUT, JSON.stringify(S));
  if (ARR) { var tt = report(S, t0); console.log(tt.split('\n').filter(function (l, i, a) { var h = a.indexOf('-- Paired boss bench (each arrival fought vs every boss option of the act) --'); return i > h && i < h + 12 && /^  A\d|^  boss/.test(l); }).join('\n')); return; }
  var txt = report(S, t0);
  console.log(QUIET ? txt.split('\n-- Cards')[0] : txt);
}
