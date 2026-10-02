// Random-play smoke test: plays N runs with a dumb random policy, checks invariants.
var M = require('./load');
var N = +process.argv[2] || 200, wins = 0, acts = [0,0,0,0], errs = 0;
for (var r = 0; r < N; r++) {
  var st = M.newRun({ seed: 'smoke' + r }), steps = 0;
  while (!st.over && steps++ < 5000) {
    var res;
    try {
    switch (st.screen) {
      case 'actIntro': res = M.act(st, { type: 'proceed' }); break;
      case 'map': var opts = M.reachable(st); res = M.act(st, { type: 'chooseNode', id: opts[Math.floor(Math.random() * opts.length)] }); break;
      case 'combat':
        var c = st.combat, playable = c.hand.map(function (x, i) { return i; }).filter(function (i) { return M.canPlay(st, i); });
        if (playable.length && Math.random() < 0.9) {
          var live = c.enemies.map(function (e, i) { return i; }).filter(function (i) { return !c.enemies[i].dead; });
          res = M.act(st, { type: 'play', hand: playable[0], target: live[Math.floor(Math.random() * live.length)] });
        } else res = M.act(st, { type: 'endTurn' });
        break;
      case 'reward': M.act(st, { type: 'takeGold' }); M.act(st, { type: 'takeCard', idx: 0 }); if (st.reward.relic) M.act(st, { type: 'takeRelic' }); if (st.reward.bossRelics && st.reward.bossRelics.length) M.act(st, { type: 'takeBossRelic', idx: 0 }); res = M.act(st, { type: 'leaveReward' }); break;
      case 'rest': res = M.act(st, { type: Math.random() < 0.5 ? 'mend' : 'gild' }); break;
      case 'pick': var pk = M.pickable(st); res = pk.length ? M.act(st, { type: 'pickCard', uid: pk[0].uid }) : M.act(st, { type: 'cancelPick' }); break;
      case 'treasure': M.act(st, { type: 'openChest' }); res = M.act(st, { type: 'leaveTreasure' }); break;
      case 'shop': M.act(st, { type: 'buyCard', idx: 0 }); res = M.act(st, { type: 'leaveShop' }); break;
      case 'event': if (st.event.stage === 'choice') { var d = M.EVENTS[st.event.id]; var av = d.choices.map(function(c,i){return i;}).filter(function(i){return M.choiceAvailable(st, d.choices[i]);}); res = M.act(st, { type: 'eventChoice', idx: av[Math.floor(Math.random()*av.length)] }); } else res = M.act(st, { type: 'leaveEvent' }); break;
      default: throw new Error('Unknown screen ' + st.screen);
    }
    } catch (e) { errs++; if (errs < 4) console.error('Run', r, 'screen', st.screen, e.stack); st.over = true; break; }
    if (res && !res.ok && st.screen !== 'combat') { console.error('Run', r, st.screen, res.err); errs++; break; }
    // invariants
    if (st.hp > st.maxHp || st.hp < 0 || isNaN(st.hp)) { console.error('HP invariant', st.hp, st.maxHp); errs++; break; }
    if (st.combat) { var tot = st.combat.draw.length + st.combat.hand.length + st.combat.discard.length + st.combat.scraped.length + st.combat.margin.length; if (tot < 1) { console.error('empty piles'); errs++; } }
    // serialization round-trip
    if (steps % 50 === 0) { st = M.deserialize(M.serialize(st)); }
  }
  if (steps >= 5000) { console.error('Run', r, 'stuck on', st.screen); errs++; }
  acts[Math.min(st.act, 3)]++; if (st.won) wins++;
}
console.log(JSON.stringify({ runs: N, wins: wins, reachedAct: acts, errors: errs }));
process.exit(errs ? 1 : 0);
