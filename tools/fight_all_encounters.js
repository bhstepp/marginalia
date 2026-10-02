// Fights every encounter (each act/kind) with a high-HP random player to exercise enemy code paths
// (summons, onDeath, phase2, erase, devour). Usage: node tools/fight_all_encounters.js [reps]
var M = require('../load');
var reps = +process.argv[2] || 5, errs = 0, stats = [];
[1, 2, 3].forEach(function (a) {
  ['easy', 'normal', 'elite', 'boss'].forEach(function (k) {
    M.ENCOUNTERS[a][k].forEach(function (enc) {
      var turns = 0, lost = 0, phases = 0, summons = 0;
      for (var r = 0; r < reps; r++) {
        var st = M.newRun({ seed: 'fa' + a + k + enc.join() + r });
        st.act = a; st.maxHp = st.hp = 9999;
        try {
          M.startCombat(st, enc, k === 'easy' || k === 'normal' ? 'battle' : k);
          // crude stand-in for a deck that has grown with the run
          if (a > 1) { st.combat.player.st.might = (a - 1) * 3; st.combat.player.st.resolve = (a - 1) * 3; }
          var guard = 0;
          while (!st.combat.over && !st.over && guard++ < 2000) {
            var c = st.combat, pl = c.hand.map(function (x, i) { return i; }).filter(function (i) { return M.canPlay(st, i); });
            if (pl.length) {
              var live = c.enemies.map(function (e, i) { return i; }).filter(function (i) { return !c.enemies[i].dead; });
              M.act(st, { type: 'play', hand: pl[0], target: live[Math.floor(Math.random() * live.length)] });
            } else M.act(st, { type: 'endTurn' });
            st.fx.forEach(function (f) { if (f.k === 'phase') phases++; if (f.k === 'summon') summons++; });
            st.fx.length = 0;
            if (c.enemies.filter(function (e) { return !e.dead; }).length > 4) throw new Error('more than 4 enemies');
          }
          if (guard >= 2000) throw new Error('fight never ended');
          turns += st.combat.turn; lost += 9999 - st.hp;
        } catch (e) { errs++; console.error(a, k, enc.join(','), e.stack); }
      }
      stats.push('A' + a + ' ' + k + ' ' + enc.join(',') + ': turns ' + (turns / reps).toFixed(1) + ', hp lost ' + (lost / reps).toFixed(0) +
        ', lost/turn ' + (lost / Math.max(1, turns)).toFixed(1) + (phases ? ', phase2 x' + phases : '') + (summons ? ', summons ' + summons : ''));
    });
  });
});
console.log(stats.join('\n'));
console.log(errs ? errs + ' error(s)' : 'OK');
process.exit(errs ? 1 : 0);
