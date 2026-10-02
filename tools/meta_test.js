// Exercises characters, Rubrication levels, every daily modifier, unlock filtering, new ops.
var M = require('../load');
function play(st) { var steps = 0;
  while (!st.over && steps++ < 4000) {
    var s = st.screen, r;
    if (s === 'actIntro') r = M.act(st, { type: 'proceed' });
    else if (s === 'map') { var o = M.reachable(st); r = M.act(st, { type: 'chooseNode', id: o[steps % o.length] }); }
    else if (s === 'combat') { var c = st.combat, pl = c.hand.map(function (x, i) { return i; }).filter(function (i) { return M.canPlay(st, i); });
      if (pl.length) { var lv = c.enemies.map(function (e, i) { return i; }).filter(function (i) { return !c.enemies[i].dead; }); r = M.act(st, { type: 'play', hand: pl[0], target: lv[0] }); } else r = M.act(st, { type: 'endTurn' }); }
    else if (s === 'reward') { M.act(st, { type: 'takeGold' }); M.act(st, { type: 'takeCard', idx: 0 }); if (st.reward.relic) M.act(st, { type: 'takeRelic' }); if (st.reward.bossRelics && st.reward.bossRelics.length) M.act(st, { type: 'takeBossRelic', idx: 0 }); r = M.act(st, { type: 'leaveReward' }); }
    else if (s === 'rest') r = M.act(st, { type: 'mend' });
    else if (s === 'pick') { var pk = M.pickable(st); r = pk.length ? M.act(st, { type: 'pickCard', uid: pk[0].uid }) : M.act(st, { type: 'cancelPick' }); }
    else if (s === 'treasure') { M.act(st, { type: 'openChest' }); r = M.act(st, { type: 'leaveTreasure' }); }
    else if (s === 'shop') r = M.act(st, { type: 'leaveShop' });
    else if (s === 'event') { if (st.event.stage === 'choice') { var d = M.EVENTS[st.event.id]; var av = d.choices.map(function (c, i) { return i; }).filter(function (i) { return M.choiceAvailable(st, d.choices[i]); }); r = M.act(st, { type: 'eventChoice', idx: av[0] }); } else r = M.act(st, { type: 'leaveEvent' }); }
    if (st.hp > st.maxHp || isNaN(st.hp)) throw new Error('hp invariant');
  } return st; }
var errs = 0;
function t(name, f) { try { f(); console.log('ok  ', name); } catch (e) { errs++; console.log('FAIL', name, e.stack.split('\n').slice(0, 3).join(' | ')); } }
Object.keys(M.CHARACTERS).forEach(function (ch) {
  for (var a = 0; a <= M.RUBRICS.length; a += 5) t('char ' + ch + ' asc ' + a, function () {
    for (var i = 0; i < 20; i++) { var st = play(M.newRun({ seed: 'T' + ch + a + i, char: ch, asc: a, unlocked: Object.keys(M.ACHIEVEMENTS) })); if (st.char !== ch) throw new Error('char'); }
  });
});
Object.keys(M.MODIFIERS).forEach(function (id) { t('mod ' + id, function () { for (var i = 0; i < 10; i++) play(M.newRun({ seed: 'MOD' + id + i, mods: [id] })); }); });
t('daily picks 2 mods deterministically', function () { var a = M.newRun({ seed: 'DAILY-2026-10-03' }), b = M.newRun({ seed: 'DAILY-2026-10-03' }); if (a.mods.length !== 2 || a.mods.join() !== b.mods.join()) throw new Error(a.mods); });
t('locked cards never offered', function () {
  var locked = Object.keys(M.CARDS).filter(function (id) { return M.CARDS[id].unlock; });
  for (var i = 0; i < 30; i++) { var st = play(M.newRun({ seed: 'L' + i })); st.deck.forEach(function (x) { if (locked.indexOf(x.id) >= 0) throw new Error('locked card ' + x.id); }); }
});
t('other characters cards not offered', function () {
  for (var i = 0; i < 20; i++) { var st = play(M.newRun({ seed: 'C' + i, char: 'knight' })); st.deck.forEach(function (x) { var d = M.CARDS[x.id]; if (d.char && d.char !== 'knight') throw new Error(x.id); }); }
});
t('achievements evaluate', function () { var st = play(M.newRun({ seed: 'ACH' })); M.checkAchievements(st, []); });
t('createCard + echoMargin ops', function () {
  var st = M.newRun({ seed: 'OPS' }); M.act(st, { type: 'proceed' }); M.act(st, { type: 'chooseNode', id: M.reachable(st)[0] });
  var n = st.combat.hand.length; M.runOps(st, [{ op: 'createCard', n: 2, rarity: 'common', cost: 0 }], { side: 'p' });
  if (st.combat.hand.length !== n + 2) throw new Error('createCard');
  st.combat.margin.push({ uid: 999, id: Object.keys(M.CARDS).filter(function (k) { return M.CARDS[k].type === 'gloss'; })[0], up: false, count: 0 });
  M.runOps(st, [{ op: 'echoMargin' }], { side: 'p' });
  console.log('     ', M.describeOps([{ op: 'createCard', n: 2, rarity: 'uncommon', pig: 'L', cost: 0 }, { op: 'echoMargin' }]));
});
console.log(errs ? errs + ' FAILURES' : 'ALL META TESTS PASSED'); process.exit(errs ? 1 : 0);
