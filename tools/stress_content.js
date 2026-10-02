// Exercises every card (base + gilded), every relic and every event choice across all acts.
// node tools/stress_content.js [runsPerAct]
var M = require('../load');
var N = +process.argv[2] || 40, errs = 0, played = 0;
function fail(m, e) { errs++; if (errs < 10) console.error(m, e && e.stack || e || ''); }
var allCards = Object.keys(M.CARDS), allRelics = Object.keys(M.RELICS);

function playFight(st, guard) {
  var steps = 0;
  while (st.screen === 'combat' && !st.over && steps++ < 400) {
    var c = st.combat, pl = c.hand.map(function (x, i) { return i; }).filter(function (i) { return M.canPlay(st, i); });
    var live = c.enemies.map(function (e, i) { return i; }).filter(function (i) { return !c.enemies[i].dead; });
    var r = pl.length && Math.random() < 0.92 ? M.act(st, { type: 'play', hand: pl[Math.floor(Math.random() * pl.length)], target: live[Math.floor(Math.random() * live.length)] }) : M.act(st, { type: 'endTurn' });
    if (st.hp < 0 || st.hp > st.maxHp || isNaN(st.hp)) throw new Error('HP invariant ' + st.hp + '/' + st.maxHp);
    if (c.enemies.some(function (e) { return isNaN(e.hp) || isNaN(e.ward); }) || isNaN(c.player.ward) || isNaN(c.ink)) throw new Error('NaN in combat');
    if (r && r.ok) played++;
  }
}

for (var act = 1; act <= 3; act++) {
  for (var r = 0; r < N; r++) {
    try {
      var st = M.newRun({ seed: 'stress' + act + '_' + r });
      st.act = act; M.genMap(st); st.hp = st.maxHp = 400;
      // random content: 12 cards (some gilded), 6 relics
      for (var k = 0; k < 12; k++) M.addToDeck(st, allCards[(r * 12 + k + act * 7) % allCards.length], Math.random() < 0.5);
      for (k = 0; k < 6; k++) M.gainRelic(st, allRelics[(r * 6 + k + act) % allRelics.length]);
      if (st.screen === 'pick') { st.pick = null; st.screen = 'actIntro'; }
      var E = M.ENCOUNTERS[act], pools = [E.normal, E.elite, E.boss];
      pools.forEach(function (pool) {
        var enc = pool[Math.floor(Math.random() * pool.length)];
        M.startCombat(st, enc, pool === E.boss ? 'elite' : 'battle'); // 'elite' so a boss win doesn't advance act
        playFight(st);
        if (st.screen === 'reward') M.act(st, { type: 'leaveReward' });
        if (st.over) { st.over = false; st.hp = st.maxHp; st.screen = 'map'; st.combat = null; }
      });
    } catch (e) { fail('combat act ' + act + ' run ' + r, e); }
  }
}
// events: every choice in every act it appears
Object.keys(M.EVENTS).forEach(function (id) {
  var ev = M.EVENTS[id];
  ev.acts.forEach(function (act) {
    ev.choices.forEach(function (ch, i) {
      try {
        var st = M.newRun({ seed: 'ev' + id + act + i }); st.act = act; M.genMap(st); st.screen = 'event'; st.gold = 500;
        st.event = { id: id, stage: 'choice' };
        var res = M.act(st, { type: 'eventChoice', idx: i });
        if (!res.ok) throw new Error(res.err);
        if (st.screen === 'pick') { var pk = M.pickable(st); if (pk.length) M.act(st, { type: 'pickCard', uid: pk[0].uid }); }
        if (st.screen === 'combat') { st.hp = st.maxHp = 400; playFight(st); }
        if (isNaN(st.hp) || isNaN(st.gold) || st.hp < 1 && !st.over) throw new Error('bad state after event');
      } catch (e) { fail('event ' + id + ' act ' + act + ' choice ' + i, e); }
    });
  });
});
console.log(JSON.stringify({ errors: errs, actionsOk: played }));
process.exit(errs ? 1 : 0);
