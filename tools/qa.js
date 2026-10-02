// QA harness for Marginalia (Playwright). Usage:
//   node tools/qa.js [play|sizes|save|stress|a11y|perf|all]   (default: all)
// Screenshots → preview/qa_*.png. Exits 1 if any check failed.
// Cheats (HP top-ups, combat set-ups) live ONLY here, via page.evaluate — never in shipped code.
const { chromium, devices } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'preview') + '/';
const URL = 'file://' + path.join(ROOT, 'dist', 'index.html');
const FONTS = path.join(__dirname, 'qa_fonts') + '/';
const SIZES = {
  i13: { ...devices['iPhone 13'] },
  se: { ...devices['iPhone SE'], viewport: { width: 375, height: 667 }, screen: { width: 375, height: 667 } },
  sesafari: { ...devices['iPhone SE'], viewport: { width: 375, height: 553 }, screen: { width: 375, height: 667 } },
  max: { ...devices['iPhone 13 Pro Max'], viewport: { width: 430, height: 932 }, screen: { width: 430, height: 932 } }
};
const problems = [];
const report = (tag, msg) => { const s = '[' + tag + '] ' + msg; if (!problems.includes(s)) { problems.push(s); console.log('  ✗ ' + s); } };
const ok = (msg) => console.log('  ✓ ' + msg);

// Route Google Fonts to local copies so screenshots use the real typefaces.
async function fonts(ctx) {
  const map = { fell: 'im-fell-english-latin-400-normal.woff2', 'fell-i': 'im-fell-english-latin-400-italic.woff2', fellsc: 'im-fell-english-sc-latin-400-normal.woff2', frak: 'unifrakturmaguntia-latin-400-normal.woff2' };
  const css = `@font-face{font-family:'IM Fell English';font-style:normal;src:url(https://fonts.gstatic.com/x/fell) format('woff2')}
@font-face{font-family:'IM Fell English';font-style:italic;src:url(https://fonts.gstatic.com/x/fell-i) format('woff2')}
@font-face{font-family:'IM Fell English SC';src:url(https://fonts.gstatic.com/x/fellsc) format('woff2')}
@font-face{font-family:'UnifrakturMaguntia';src:url(https://fonts.gstatic.com/x/frak) format('woff2')}`;
  await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: css }));
  await ctx.route('https://fonts.gstatic.com/x/*', r => { const k = r.request().url().split('/').pop(); r.fulfill({ status: 200, contentType: 'font/woff2', body: fs.readFileSync(FONTS + map[k]) }); });
}

async function open(browser, size, opts = {}) {
  const ctx = await browser.newContext({ ...SIZES[size], ...(opts.ctx || {}) });
  await fonts(ctx);
  const p = await ctx.newPage();
  p._errs = [];
  p.on('console', m => { if (m.type() === 'error') p._errs.push(m.text()); });
  p.on('pageerror', e => p._errs.push('PAGEERROR ' + e.message));
  p._size = size;
  if (opts.clear !== false) { await p.goto(URL); await p.evaluate(() => localStorage.clear()); }
  await p.goto(URL + (opts.query || '')); await p.waitForTimeout(400);
  return { ctx, p };
}
const S = (p) => p.evaluate(() => { const s = M.UI.state(); return s ? { screen: s.screen, act: s.act, floor: s.floor, hp: s.hp, over: s.over, won: s.won } : null; });
const idle = (p, t = 20000) => p.waitForFunction(() => !M.UI.ui.busy, null, { timeout: t });
const shot = async (p, name, w = 0) => { if (w) await p.waitForTimeout(w); await p.screenshot({ path: OUT + 'qa_' + name + '.png' }); };
// tap the visible part of an element (cards overlap in the hand); verifies the hit-test lands on it
async function tapEl(p, sel, { dx = null, dy = null } = {}) {
  const pt = await p.evaluate(([sel, dx, dy]) => {
    const el = document.querySelector(sel); if (!el) return null;
    if (el.closest('.page, .mapwrap, .gloss')) el.scrollIntoView({ block: 'nearest' });
    const r = el.getBoundingClientRect();
    const cand = [];
    if (dx != null) cand.push([r.left + dx, r.top + (dy == null ? r.height / 2 : dy)]);
    for (const fx of [0.5, 0.25, 0.12, 0.75]) for (const fy of [0.5, 0.3, 0.7, 0.15]) cand.push([r.left + r.width * fx, r.top + r.height * fy]);
    for (const [x, y] of cand) { const h = document.elementFromPoint(x, y); if (h && (h === el || el.contains(h))) return { x, y }; }
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, blocked: true };
  }, [sel, dx, dy]);
  if (!pt) throw new Error('no element ' + sel);
  await p.touchscreen.tap(pt.x, pt.y);
  return pt;
}
async function tapIf(p, sel) { if (await p.$(sel)) { await tapEl(p, sel); return true; } return false; }

// ---------- generic layout checks, run on every screen we visit ----------
async function layoutCheck(p, label) {
  const r = await p.evaluate(() => {
    const out = [], W = innerWidth, H = innerHeight;
    const vis = (el) => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length; };
    // horizontal overflow of the page
    if (document.documentElement.scrollWidth > W + 1) out.push('document scrollWidth ' + document.documentElement.scrollWidth + ' > ' + W);
    // things that must sit inside the viewport
    document.querySelectorAll('#app .btn, #app .ib, #app .seal, #app .pile, #app .intent, #app .foe .bar, #app .hud, #app .lootItem, #app .choice, #app .restOpt, #ovl .btn, #ovl .dialog').forEach(el => {
      if (!vis(el)) return; const b = el.getBoundingClientRect();
      if (el.closest('.page, .mapwrap, .gloss, .dialog') && !el.matches('.dialog')) return; // scrollable containers
      if (b.right > W + 1 || b.left < -1 || b.bottom > H + 1 || b.top < -1) out.push('offscreen ' + el.className + ' [' + Math.round(b.left) + ',' + Math.round(b.top) + ',' + Math.round(b.right) + ',' + Math.round(b.bottom) + ']');
    });
    // card text fits
    document.querySelectorAll('.card').forEach(c => {
      if (!vis(c) || c.closest('#fxl')) return;
      const rt = c.querySelector('.rt'), inner = rt && rt.firstChild, nm = c.querySelector('.nm');
      const name = (nm && nm.textContent) || '?';
      if (inner && inner.offsetHeight > rt.clientHeight + 2) out.push('card text overflows: ' + name + ' (' + inner.offsetHeight + '>' + rt.clientHeight + ')');
      if (rt && parseFloat(getComputedStyle(rt).fontSize) < 7.5 && !c.classList.contains('big')) out.push('card text tiny: ' + name + ' ' + getComputedStyle(rt).fontSize);
      const tx = c.querySelector('.nm .tx'); if (tx && tx.scrollWidth > tx.clientWidth + 1) out.push('card name overflows: ' + name);
      if (nm && c.querySelector('.ty')) { const a = nm.getBoundingClientRect(), b2 = c.querySelector('.ty').getBoundingClientRect(); if (a.bottom > b2.top + 2 && !c.style.transform.includes('rotate')) out.push('card name overlaps type line: ' + name); }
    });
    // foe names truncated / intents overlapping each other
    document.querySelectorAll('#cFoes .foe .nm').forEach(n => { if (n.scrollWidth > n.clientWidth + 1) out.push('foe name truncated: ' + n.textContent); });
    const ints = [...document.querySelectorAll('#cFoes .foe:not(.dead):not(.dying) .intent')].map(e => e.getBoundingClientRect());
    for (let i = 0; i < ints.length; i++) for (let j = i + 1; j < ints.length; j++) { const a = ints[i], b = ints[j]; if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) out.push('intents overlap'); }
    const foes = [...document.querySelectorAll('#cFoes .foe:not(.dead)')].map(e => e.getBoundingClientRect());
    for (let i = 0; i < foes.length; i++) for (let j = i + 1; j < foes.length; j++) { const a = foes[i], b = foes[j]; if (a.left < b.right - 3 && b.left < a.right - 3 && a.top < b.bottom - 3 && b.top < a.bottom - 3) out.push('foes overlap'); }
    const field = document.querySelector('#cFoes'); if (field) { const fb = field.getBoundingClientRect(); foes.forEach(f => { if (f.right > fb.right + 2 || f.left < fb.left - 2) out.push('foe outside foes area'); }); }
    return out;
  });
  r.forEach(x => report(p._size + ':' + label, x));
  return r;
}

// ---------- the bot: drives the game only through taps ----------
async function closeStrayOverlay(p) {
  const on = await p.evaluate(() => document.getElementById('ovl').classList.contains('on'));
  if (on) { await p.evaluate(() => { const b = document.querySelector('#ovl [data-a="closeOv"].ib, #ovl .zoom [data-a="closeOv"].btn, #ovl [data-a="dlg"]'); if (b) b.click(); else document.getElementById('ovl').className = ''; }); await p.waitForTimeout(150); }
}
async function combatStep(p) {
  await p.waitForFunction(() => !document.querySelector('#cHand .card.deal'), null, { timeout: 3000 }).catch(() => report('combat', 'cards stuck in deal-in animation'));
  const info = await p.evaluate(() => {
    const s = M.UI.state(), c = s.combat; if (!c || c.over) return { over: true };
    const sel = M.UI.ui.selUid;
    const playable = c.hand.map((x, i) => i).filter(i => M.canPlay(s, i));
    // prefer attacks when a foe is low or we have ward, else alternate pigments for illumination
    playable.sort((a, b) => { const da = M.cardDef(c.hand[a]), db = M.cardDef(c.hand[b]); const pa = c.pig[da.pigment] ? 1 : 0, pb = c.pig[db.pigment] ? 1 : 0; return pa - pb || ((M.cardCost(s, c.hand[b]) || 0) - (M.cardCost(s, c.hand[a]) || 0)); });
    const hi = playable[0];
    const live = c.enemies.map((e, i) => ({ e, i })).filter(o => !o.e.dead);
    const tgt = live.sort((a, b) => a.e.hp - b.e.hp)[0];
    return { hi, uid: hi != null ? c.hand[hi].uid : null, needT: hi != null && M.cardDef(c.hand[hi]).target === 'enemy' && live.length > 1, tgtUid: tgt && tgt.e.uid, sel };
  });
  if (info.over) return;
  if (info.hi == null) { await tapEl(p, '#cSeal'); return 'end'; }
  const sel = `#cHand .card[data-uid="${info.uid}"]`;
  if (!(await p.$(sel))) { await p.waitForTimeout(600); if (!(await p.$(sel))) { report('combat', 'hand card uid ' + info.uid + ' in state but not in DOM'); await p.evaluate(() => M.UI.render()); return 'missing'; } }
  if (info.sel !== info.uid) { await tapEl(p, sel, { dx: 14, dy: 40 }); await p.waitForTimeout(260); }
  if (info.needT) await tapEl(p, `#cFoes .foe[data-uid="${info.tgtUid}"] .art`).catch(() => {});
  else await tapEl(p, sel, { dy: 30 }).catch(() => {});
  return 'play';
}
const NEED = ['elite', 'shop', 'rest', 'event', 'treasure'];
async function botStep(p, seen, opts) {
  await idle(p).catch(() => report('stuck', 'ui.busy never cleared on ' + JSON.stringify(seen.last)));
  const s = await S(p); seen.last = s;
  if (!s) return 'title';
  if (opts.cheat) await p.evaluate(() => { const s = M.UI.state(); if (s.hp < s.maxHp * 0.6) { s.hp = s.maxHp; M.UI.render(); } });
  const kind = await p.evaluate(() => { const s = M.UI.state(); return s.combat ? s.combat.kind : s.reward ? 'r' + s.reward.kind : ''; });
  const key = s.screen + (s.screen === 'combat' || s.screen === 'reward' ? '-' + kind : '');
  if (!seen.shots[key + s.act]) { seen.shots[key + s.act] = 1; await p.waitForTimeout(500); await shot(p, 'play_a' + s.act + '_' + String(seen.n++).padStart(2, '0') + '_' + key); await layoutCheck(p, s.screen); }
  await closeStrayOverlay(p);
  switch (s.screen) {
    case 'actIntro': await tapEl(p, '.intro'); break;
    case 'map': {
      // plan: pick the next node whose best path covers the most still-unseen node types
      const pick = await p.evaluate(([NEED, seenT]) => {
        const s = M.UI.state();
        const best = (id, got) => { const n = M.findNode(s, id); const g = new Set(got); if (NEED.includes(n.type)) g.add(n.type); let m = g.size; n.next.forEach(x => { m = Math.max(m, best(x, g)); }); return m; };
        const seen0 = NEED.filter(t => seenT[t]);
        const opts = M.reachable(s).map(id => ({ id, type: M.findNode(s, id).type, score: best(id, seen0) }));
        opts.sort((a, b) => b.score - a.score || (a.type === 'battle' ? -1 : 1));
        return opts[0];
      }, [NEED, seen.types]);
      seen.types[pick.type] = 1; seen.route.push(pick.type);
      await tapEl(p, `.node[data-id="${pick.id}"]`); break;
    }
    case 'combat': await combatStep(p); break;
    case 'reward': {
      await tapIf(p, '.lootItem[data-a="takeGold"]:not(.taken)'); await idle(p);
      if (await p.$('.relicPick[data-a="bossRelic"]')) { await tapEl(p, '.relicPick[data-a="bossRelic"]'); await p.waitForTimeout(300); await shot(p, 'play_bossrelic_dialog'); await tapEl(p, '#ovl [data-a="dlg"][data-idx="1"]'); await idle(p); }
      await tapIf(p, '.lootItem[data-a="takeRelic"]:not(.taken)'); await idle(p);
      if (await p.$('[data-a="rewardCard"]')) { await tapEl(p, '[data-a="rewardCard"][data-idx="0"]'); await p.waitForTimeout(300); if (!seen.zoomShot) { seen.zoomShot = 1; await shot(p, 'play_reward_zoom'); } await tapEl(p, '#ovl [data-a="zoomAct"][data-idx="1"]'); await idle(p); }
      await tapEl(p, '[data-a="leaveReward"]'); await p.waitForTimeout(200);
      if (await p.$('#ovl [data-a="dlg"]')) await tapEl(p, '#ovl [data-a="dlg"][data-idx="1"]');
      break;
    }
    case 'rest': await tapEl(p, seen.rested++ % 2 ? '.restOpt.mend' : '.restOpt.gild:not(.off)').catch(() => tapEl(p, '.restOpt.mend')); break;
    case 'pick': {
      if (await p.$('[data-a="pickCard"]')) { await tapEl(p, '[data-a="pickCard"]'); await p.waitForTimeout(300); if (!seen.pickZoom) { seen.pickZoom = 1; await shot(p, 'play_pick_zoom'); } await tapEl(p, '#ovl [data-a="zoomAct"][data-idx="1"]'); }
      else await tapEl(p, '[data-a="cancelPick"]');
      break;
    }
    case 'treasure': await tapEl(p, '.foot [data-a="openChest"]'); await idle(p); await p.waitForTimeout(700); await shot(p, 'play_treasure_open'); await tapEl(p, '[data-a="leaveTreasure"]'); break;
    case 'shop': {
      const can = await p.evaluate(() => { const s = M.UI.state(); return s.shop.cards.findIndex(c => !c.sold && c.price <= s.gold); });
      if (can >= 0 && !seen.bought) { seen.bought = 1; await tapEl(p, `[data-a="shopCard"][data-idx="${can}"]`); await p.waitForTimeout(300); await tapEl(p, '#ovl [data-a="zoomAct"][data-idx="1"]'); await idle(p); await shot(p, 'play_shop_after'); }
      await tapEl(p, '[data-a="leaveShop"]'); break;
    }
    case 'event': {
      if (await p.$('[data-a="eventChoice"]')) { const btn = await p.$('[data-a="eventChoice"]:not([disabled])'); const idx = await btn.getAttribute('data-idx'); await tapEl(p, `[data-a="eventChoice"][data-idx="${idx}"]`); }
      else { await p.waitForTimeout(200); await shot(p, 'play_event_result'); await tapEl(p, '[data-a="leaveEvent"]'); }
      break;
    }
    case 'end': return 'end';
  }
  return s.screen;
}

async function testPlay(browser) {
  console.log('\n== PLAY: full Act I by taps (iPhone 13) ==');
  const { ctx, p } = await open(browser, 'i13');
  await shot(p, 'title');
  // seed QA0 has an Act I path through elite, shop, rest, event and treasure
  await tapEl(p, '[data-a="seed"]'); await p.waitForTimeout(300); await p.fill('#seedIn', process.env.SEED || 'QA0'); await tapEl(p, '#ovl [data-a="dlg"][data-idx="1"]'); await p.waitForTimeout(500); await tapEl(p, '[data-a="csBegin"]'); await p.waitForTimeout(500);
  const seen = { shots: {}, types: {}, route: [], n: 0, rested: 0 };
  let steps = 0, turns = 0, act2Battles = 0;
  while (steps++ < 900) {
    const r = await botStep(p, seen, { cheat: true });
    if (r === 'end') break;
    const s = await S(p);
    if (s.act >= 2 && s.screen === 'combat') { act2Battles++; if (act2Battles > 30) break; }
    if (s.act >= 2 && s.screen === 'map' && seen.route.length > 20) break;
  }
  const s = await S(p);
  console.log('  route:', seen.route.join(' > '));
  console.log('  ended at', JSON.stringify(s), 'steps', steps);
  for (const t of NEED) if (!seen.types[t]) report('play', 'never visited a ' + t);
  if (s.act < 2) report('play', 'did not reach Act II'); else ok('reached Act II');
  if (p._errs.length) report('play', 'console errors: ' + p._errs.slice(0, 5).join(' | ')); else ok('no console errors during playthrough');
  await ctx.close();
}

// ---------- combat set-ups at three sizes ----------
async function setupCombat(p, enemies, hand, kind) {
  await p.evaluate(([enemies, hand, kind]) => {
    M.UI.startRun('QA-LAYOUT'); const s = M.UI.state();
    M.act(s, { type: 'proceed' });
    M.startCombat(s, enemies, kind || 'battle'); s.screen = 'combat';
    if (hand) { const c = s.combat; c.draw = c.draw.concat(c.hand); c.hand = hand.map((id, k) => ({ uid: 900 + k, id: id.replace('+', ''), up: id.endsWith('+') })); }
    s.fx = []; M.UI.ui.mounted = null; M.UI.render();
  }, [enemies, hand || null, kind]);
  await p.waitForTimeout(900);
}
const LONG = ['tricolour_strike+', 'unicorn_charge', 'unbroken_psalter', 'verdigris_splash', 'rubricated_index', 'acanthus_scroll+', 'green_man', 'wormhole', 'pumice_ritual+', 'riposte'];
async function testSizes(browser) {
  console.log('\n== SIZES: combats, hands, overlays at SE / 13 / Pro Max ==');
  for (const size of (process.env.SIZES || 'se,sesafari,i13,max').split(',')) {
    const { ctx, p } = await open(browser, size);
    const scen = [
      ['mites4', ['ink_mite', 'ink_mite', 'ink_mite', 'ink_mite'], LONG.slice(0, 5)],
      ['bookworm', ['bookworm', 'bookmite', 'bookmite', 'bookmite'], LONG.slice(0, 7), 'boss'],
      ['trio', ['fox_preacher', 'killer_rabbit', 'killer_rabbit'], LONG.slice(0, 8)],
      ['hydra3', ['ouroboros', 'hellmouth_imp', 'ink_mite'], LONG, 'elite'],
      ['boss1', ['great_snail'], ['lance', 'shield', 'moss_dart', 'lance', 'shield']],
      ['cat', ['scribes_cat', 'kitten_scrawl', 'kitten_scrawl'], LONG.slice(2, 9)]
    ];
    for (const [name, en, hand, kind] of scen) {
      await setupCombat(p, en, hand, kind);
      // add statuses to stress chips
      await p.evaluate(() => { const c = M.UI.state().combat; c.enemies.forEach((e, i) => { e.st.corrode = 3; e.st.torn = 2; if (i === 0) { e.st.might = 2; e.ward = 12; } }); c.player.st.might = 1; c.player.st.resolve = 2; c.player.ward = 7; M.UI.render(); });
      await p.waitForTimeout(500);
      await layoutCheck(p, 'combat-' + name);
      // hand usability: each card must have ≥ 14px of tappable exposed strip
      const strip = await p.evaluate(() => { const cs = [...document.querySelectorAll('#cHand .card')]; let min = 999; cs.forEach((c, i) => { const r = c.getBoundingClientRect(); const n = cs[i + 1] ? cs[i + 1].getBoundingClientRect().left : r.right; min = Math.min(min, n - r.left); }); const last = cs[cs.length - 1].getBoundingClientRect(), first = cs[0].getBoundingClientRect(); return { min, left: first.left, right: last.right, W: innerWidth }; });
      if (strip.min < 20) report(size + ':hand-' + name, 'card exposed strip only ' + strip.min.toFixed(1) + 'px');
      if (strip.left < -1 || strip.right > strip.W + 1) report(size + ':hand-' + name, 'hand exceeds screen ' + JSON.stringify(strip));
      await shot(p, size + '_combat_' + name);
    }
    // selected + targeting
    await setupCombat(p, ['ink_mite', 'ink_mite', 'ink_mite'], LONG.slice(0, 6));
    await tapEl(p, '#cHand .card[data-uid="900"]', { dx: 14, dy: 40 }); await p.waitForTimeout(350); await shot(p, size + '_combat_selected');
    // long-press zoom
    const bb = await (await p.$('#cHand .card[data-uid="903"]')).boundingBox();
    await p.mouse.move(bb.x + 12, bb.y + 40); await p.mouse.down(); await p.waitForTimeout(600); await p.mouse.up(); await p.waitForTimeout(300);
    const zoomed = await p.$('#ovl .zoom'); if (!zoomed) report(size + ':longpress', 'long-press did not open zoom'); else ok(size + ' long-press opens zoom');
    await shot(p, size + '_zoom'); await layoutCheck(p, 'zoom');
    await p.evaluate(() => document.querySelector('#ovl .zoom').click()); await p.waitForTimeout(200);
    // the long press must not also select / play the card
    const st2 = await p.evaluate(() => ({ hand: M.UI.state().combat.hand.length, ov: document.getElementById('ovl').className }));
    if (st2.hand !== 6) report(size + ':longpress', 'long-press played a card');
    // screens
    await p.evaluate(() => { const s = M.UI.state(); s.combat = null; s.screen = 'map'; M.UI.ui.mounted = null; M.UI.render(); }); await p.waitForTimeout(500);
    await shot(p, size + '_map'); await layoutCheck(p, 'map');
    const mapScroll = await p.evaluate(() => { const w = document.getElementById('mapwrap'); return { sh: w.scrollHeight, ch: w.clientHeight, docH: document.documentElement.scrollHeight, H: innerHeight }; });
    if (mapScroll.docH > mapScroll.H + 1) report(size + ':map', 'document scrolls vertically');
    for (const [scr, setup] of [
      ['shop', s => { s.gold = 999; s.screen = 'shop'; }], ['rest', s => { s.screen = 'rest'; }],
      ['treasure', s => { s.screen = 'treasure'; }], ['event', s => { s.screen = 'event'; }], ['deck', null], ['relics', null], ['howto', null], ['menu', null], ['title', null]]) {
      if (setup) {
        await p.evaluate((scr) => {
          const s = M.UI.state(); s.gold = 999; s.relics = s.relics.concat(Object.keys(M.RELICS).slice(0, 14));
          if (scr === 'shop') { s.shop = null; s.gold = 999; }
          s.fx = [];
          // reach the screen the way the engine does, via a node of that type
          const n = s.map.rows[1][0]; n.type = scr === 'event' ? 'event' : scr; s.pos = s.map.rows[0][0].id; s.map.rows[0][0].next = [n.id]; s.map.rows[0][0].visited = true; s.screen = 'map';
          M.act(s, { type: 'chooseNode', id: n.id }); s.gold = 999; M.UI.ui.mounted = null; M.UI.render();
        }, scr);
        await p.waitForTimeout(500);
      } else if (scr === 'title') { await p.evaluate(() => M.UI.toTitle()); await p.waitForTimeout(400); }
      else { await p.evaluate((a) => { document.querySelector('[data-a="' + (a === 'howto' ? 'menu' : a) + '"]').click(); if (a === 'howto') document.querySelector('#ovl [data-a="howto"]').click(); }, scr); await p.waitForTimeout(450); }
      await shot(p, size + '_' + scr); await layoutCheck(p, scr);
      await p.evaluate(() => { document.getElementById('ovl').innerHTML = ''; document.getElementById('ovl').className = ''; });
    }
    if (p._errs.length) report(size + ':sizes', 'console errors: ' + p._errs.slice(0, 5).join(' | '));
    await ctx.close();
  }
}

// ---------- save / resume / seeds / daily ----------
async function testSave(browser) {
  console.log('\n== SAVE: resume, abandon, ?seed, daily ==');
  let { ctx, p } = await open(browser, 'i13', { query: '?seed=ABC' });
  let seed = await p.evaluate(() => M.UI.state() && M.UI.state().seed);
  if (seed !== 'ABC') report('save', '?seed=ABC started seed ' + seed); else ok('?seed=ABC starts seed ABC');
  const url = await p.evaluate(() => location.search); if (url) report('save', 'query not stripped: ' + url);
  await tapEl(p, '.intro'); await idle(p);
  const mapA = await p.evaluate(() => JSON.stringify(M.UI.state().map.rows.map(r => r.map(n => n.type + n.x))));
  // mid-map reload
  await p.reload(); await p.waitForTimeout(500);
  if (!(await p.$('[data-a="continue"]'))) report('save', 'no Continue after reload on map');
  await tapEl(p, '[data-a="continue"]'); await p.waitForTimeout(400);
  const s1 = await S(p); if (s1.screen !== 'map') report('save', 'continue restored ' + s1.screen + ' not map'); else ok('continue restores map');
  const mapB = await p.evaluate(() => JSON.stringify(M.UI.state().map.rows.map(r => r.map(n => n.type + n.x))));
  if (mapA !== mapB) report('save', 'map differs after reload');
  // into combat, play one card, reload
  const first = await p.evaluate(() => M.reachable(M.UI.state()).find(id => M.findNode(M.UI.state(), id).type === 'battle') || M.reachable(M.UI.state())[0]);
  await tapEl(p, `.node[data-id="${first}"]`); await idle(p); await p.waitForTimeout(800);
  let s = await S(p);
  if (s.screen === 'combat') {
    await combatStep(p); await idle(p); await p.waitForTimeout(400);
    const before = await p.evaluate(() => { const s = M.UI.state(), c = s.combat; return JSON.stringify({ hp: s.hp, ink: c.ink, hand: c.hand.map(x => x.uid), draw: c.draw.length, disc: c.discard.length, en: c.enemies.map(e => [e.hp, e.ward, e.intent, e.st]), turn: c.turn, ward: c.player.ward, pig: c.pig }); });
    await shot(p, 'save_before_reload');
    await p.reload(); await p.waitForTimeout(500); await tapEl(p, '[data-a="continue"]'); await p.waitForTimeout(900);
    const after = await p.evaluate(() => { const s = M.UI.state(), c = s.combat; return JSON.stringify({ hp: s.hp, ink: c.ink, hand: c.hand.map(x => x.uid), draw: c.draw.length, disc: c.discard.length, en: c.enemies.map(e => [e.hp, e.ward, e.intent, e.st]), turn: c.turn, ward: c.player.ward, pig: c.pig }); });
    if (before !== after) report('save', 'combat state differs after reload:\n   ' + before + '\n   ' + after); else ok('mid-combat reload restores exactly');
    await shot(p, 'save_after_reload');
    const domHand = await p.evaluate(() => document.querySelectorAll('#cHand .card').length);
    if (domHand !== JSON.parse(after).hand.length) report('save', 'hand DOM count mismatch after continue');
    // keep playing after continue (input not stuck)
    const r = await combatStep(p); await idle(p); ok('input works after continue (' + r + ')');
  } else report('save', 'first node was not a combat: ' + s.screen);
  // abandon
  await tapEl(p, '[data-a="menu"]'); await p.waitForTimeout(300);
  await tapEl(p, '#ovl [data-a="dlg"][data-idx="0"]'); await p.waitForTimeout(300); await shot(p, 'save_abandon_confirm');
  await tapEl(p, '#ovl [data-a="dlg"][data-idx="1"]'); await p.waitForTimeout(500);
  const abandoned = await p.evaluate(() => ({ save: localStorage.getItem('marginalia.save.v1'), title: !!document.querySelector('.scr.title'), cont: !!document.querySelector('[data-a="continue"]'), stats: JSON.parse(localStorage.getItem('marginalia.stats.v1') || '{}') }));
  if (abandoned.save || !abandoned.title || abandoned.cont) report('save', 'abandon left state: ' + JSON.stringify(abandoned)); else ok('abandon clears the save, returns to title, counts run (' + abandoned.stats.runs + ')');
  await p.reload(); await p.waitForTimeout(400);
  if (await p.$('[data-a="continue"]')) report('save', 'Continue appears after abandon+reload');
  await shot(p, 'save_title_after_abandon');
  // daily determinism
  const dmap = [];
  for (let k = 0; k < 2; k++) {
    await p.evaluate(() => localStorage.removeItem('marginalia.save.v1')); await p.reload(); await p.waitForTimeout(400);
    await tapEl(p, '[data-a="daily"]'); await p.waitForTimeout(400); await tapEl(p, '[data-a="csBegin"]'); await p.waitForTimeout(400);
    dmap.push(await p.evaluate(() => { const s = M.UI.state(); return s.seed + '|' + JSON.stringify(s.map.rows.map(r => r.map(n => n.type + n.x + n.next.join('')))) + '|' + JSON.stringify(s.map.boss); }));
  }
  if (dmap[0] !== dmap[1]) report('save', 'daily map differs between loads'); else ok('Daily Folio deterministic (' + dmap[0].split('|')[0] + ')');
  // seed entry dialog uppercases and starts
  await p.evaluate(() => { localStorage.removeItem('marginalia.save.v1'); M.UI.toTitle(); }); await p.waitForTimeout(300);
  await tapEl(p, '[data-a="seed"]'); await p.waitForTimeout(250); await p.fill('#seedIn', 'quill7'); await p.keyboard.press('Enter'); await p.waitForTimeout(400); await tapEl(p, '[data-a="csBegin"]'); await p.waitForTimeout(400);
  seed = await p.evaluate(() => M.UI.state().seed); if (seed !== 'QUILL7') report('save', 'seed entry gave ' + seed); else ok('seed entry works');
  if (p._errs.length) report('save', 'console errors: ' + p._errs.slice(0, 5).join(' | '));
  await ctx.close();
}

// ---------- input stress: rapid taps during animations ----------
async function testStress(browser) {
  console.log('\n== STRESS: rapid taps, drag vs scroll, stuck input ==');
  const { ctx, p } = await open(browser, 'i13');
  await setupCombat(p, ['killer_rabbit', 'ink_mite', 'ink_mite'], ['lance', 'shield', 'moss_dart', 'lance', 'shield', 'lance', 'moss_dart']);
  await p.evaluate(() => { const s = M.UI.state(); s.hp = s.maxHp = 999; });
  for (let round = 0; round < 6; round++) {
    // hammer the seal and cards while the enemy turn plays
    await tapEl(p, '#cSeal');
    for (let k = 0; k < 14; k++) {
      const cards = await p.$$('#cHand .card'); const t = k % 3;
      try {
        if (t === 0) await p.touchscreen.tap(330, 760);
        else if (t === 1 && cards.length) { const b = await cards[k % cards.length].boundingBox(); if (b) await p.touchscreen.tap(b.x + 10, b.y + 40); }
        else await p.touchscreen.tap(200, 250);
      } catch (e) { }
      await p.waitForTimeout(40);
    }
    await idle(p, 15000).catch(() => report('stress', 'busy stuck after rapid taps'));
    const st = await p.evaluate(() => { const s = M.UI.state(), c = s.combat; return { turn: c && c.turn, hand: c && c.hand.length, dom: document.querySelectorAll('#cHand .card').length, hidden: [...document.querySelectorAll('#cHand .card')].filter(e => e.style.visibility === 'hidden').length, ov: document.getElementById('ovl').className, busy: M.UI.ui.busy, screen: s.screen }; });
    if (st.screen !== 'combat') break;
    if (st.dom !== st.hand) report('stress', 'hand DOM ' + st.dom + ' vs state ' + st.hand);
    if (st.hidden) report('stress', st.hidden + ' hand cards left invisible');
    const ov0 = await p.evaluate(() => document.getElementById('ovl').textContent.slice(0, 60)); if (ov0) console.log('   overlay after storm:', ov0);
    await p.evaluate(() => { document.getElementById('ovl').className = ''; document.getElementById('ovl').innerHTML = ''; });
    // after the storm (no settling pause: tapping while the new hand deals in must work), a normal play must still work
    const before = await p.evaluate(() => M.UI.state().combat.hand.length);
    const r = await combatStep(p); await idle(p);
    const after = await p.evaluate(() => M.UI.state().combat ? M.UI.state().combat.hand.length : -1);
    if (r === 'play' && after >= before && after !== -1) {
      const dbg = await p.evaluate(() => ({ ovh: document.getElementById('ovl').textContent.slice(0, 80), sel: M.UI.ui.selUid, busy: M.UI.ui.busy, hint: M.UI.ui.hintMsg, ink: M.UI.state().combat.ink, ov: document.getElementById('ovl').className, cards: [...document.querySelectorAll('#cHand .card')].map(e => e.dataset.uid + ':' + e.className.replace('card ', '')) }));
      report('stress', 'tap-to-play did nothing after rapid taps (round ' + round + ') ' + JSON.stringify(dbg)); await shot(p, 'stress_fail_' + round);
    }
  }
  ok('rapid tapping rounds done');
  await shot(p, 'stress_after');
  // drag-to-play vs. small jitter / horizontal swipe must not play
  await setupCombat(p, ['snail_knight'], ['lance', 'shield', 'moss_dart', 'lance', 'shield']);
  const h0 = await p.evaluate(() => M.UI.state().combat.hand.length);
  let b = await (await p.$('#cHand .card[data-uid="901"]')).boundingBox();
  await p.mouse.move(b.x + 12, b.y + 50); await p.mouse.down();
  for (let k = 1; k <= 8; k++) { await p.mouse.move(b.x + 12 + k * 15, b.y + 50 - k * 1.5); await p.waitForTimeout(16); }
  await p.mouse.up(); await idle(p); await p.waitForTimeout(300);
  let h1 = await p.evaluate(() => M.UI.state().combat.hand.length);
  if (h1 !== h0) report('stress', 'horizontal swipe across hand played a card'); else ok('horizontal swipe does not play');
  // a real upward drag does play
  b = await (await p.$('#cHand .card[data-uid="901"]')).boundingBox();
  await p.mouse.move(b.x + 12, b.y + 50); await p.mouse.down();
  for (let k = 1; k <= 10; k++) { await p.mouse.move(b.x + 12, b.y + 50 - k * 25); await p.waitForTimeout(16); }
  await p.mouse.up(); await idle(p); await p.waitForTimeout(300);
  h1 = await p.evaluate(() => M.UI.state().combat.hand.length);
  if (h1 !== h0 - 1) report('stress', 'upward drag did not play a skill'); else ok('upward drag plays');
  // scroll in the pile sheet must not play cards
  await tapEl(p, '#pDraw'); await p.waitForTimeout(400);
  await p.mouse.move(200, 600); await p.mouse.down(); await p.mouse.move(200, 300, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(300);
  h1 = await p.evaluate(() => M.UI.state().combat.hand.length);
  if (h1 !== h0 - 1) report('stress', 'scrolling the draw pile sheet changed the hand');
  await shot(p, 'stress_pile');
  if (p._errs.length) report('stress', 'console errors: ' + p._errs.slice(0, 5).join(' | '));
  await ctx.close();
}

// ---------- accessibility basics ----------
function lum(c) { const a = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; }
async function testA11y(browser) {
  console.log('\n== A11Y: tap targets, labels, contrast ==');
  const { ctx, p } = await open(browser, 'se');
  const check = async (label) => {
    const r = await p.evaluate(() => {
      const out = [];
      document.querySelectorAll('button, [data-a]').forEach(el => {
        const cs = getComputedStyle(el); if (cs.display === 'none' || !el.getClientRects().length || el.closest('#fxl') || el.matches('.veil, .field, .zoom')) return;
        const r = el.getBoundingClientRect();
        if (!el.matches('.scr, .relics, .card, .foe, .hero, .casket, #cIllum, .gl') && (r.width < 43.5 || r.height < 43.5) && !el.matches('.node')) out.push('small target ' + (el.getAttribute('data-a') || el.tagName) + ' ' + Math.round(r.width) + '×' + Math.round(r.height));
        if (el.matches('.node') && (r.width < 43.5)) out.push('small node');
        if (el.tagName === 'BUTTON' && !el.textContent.trim() && !el.getAttribute('aria-label')) out.push('unlabelled button ' + (el.getAttribute('data-a') || el.className));
        if (el.tagName !== 'BUTTON' && !el.getAttribute('role')) out.push('tappable non-button without role: ' + el.getAttribute('data-a'));
      });
      return out;
    });
    r.forEach(x => report('a11y:' + label, x));
  };
  await check('title');
  await setupCombat(p, ['ink_mite', 'ink_mite', 'ink_mite'], ['lance', 'shield', 'moss_dart', 'lance', 'shield']);
  await check('combat');
  await p.evaluate(() => { const s = M.UI.state(); s.combat = null; s.screen = 'map'; M.UI.ui.mounted = null; M.UI.render(); }); await p.waitForTimeout(300);
  await check('map');
  // contrast of key text colours on parchment (#e4d2a8 worst case)
  const bg = [0xe4, 0xd2, 0xa8], pairs = {}; const css = fs.readFileSync(path.join(ROOT, 'src', 'style.css'), 'utf8');
  for (const k of ['ink', 'faded', 'vermT', 'lapis', 'verdT', 'golddkT']) { const m = new RegExp('--' + k + ':\\s*#([0-9a-f]{6})', 'i').exec(css); if (m) pairs[k] = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)); else report('a11y', 'token --' + k + ' missing'); }
  for (const k in pairs) { const a = lum(pairs[k]), b2 = lum(bg); const cr = (Math.max(a, b2) + .05) / (Math.min(a, b2) + .05); (cr < 4.5 ? (x => report('a11y:contrast', x)) : ok)(k + ' on parchment ' + cr.toFixed(2) + ':1'); }
  await ctx.close();
}

// ---------- performance: DOM growth over a long fight ----------
async function testPerf(browser) {
  console.log('\n== PERF: DOM node count across 10+ turns ==');
  const { ctx, p } = await open(browser, 'i13');
  await setupCombat(p, ['great_snail'], null, 'boss');
  await p.evaluate(() => { const s = M.UI.state(); s.hp = s.maxHp = 9999; s.combat.enemies[0].hp = s.combat.enemies[0].maxHp = 9999; });
  const count = () => p.evaluate(() => ({ app: document.querySelectorAll('#app *').length, fxl: document.querySelectorAll('#fxl *').length, ovl: document.querySelectorAll('#ovl *').length, all: document.getElementsByTagName('*').length }));
  const counts = [];
  await p.evaluate(() => { window.__lt = 0; const po = new PerformanceObserver(l => { l.getEntries().forEach(e => { window.__lt += e.duration; }); }); try { po.observe({ type: 'longtask', buffered: true }); } catch (e) { } });
  for (let t = 0; t < 12; t++) {
    for (let k = 0; k < 4; k++) { const r = await combatStep(p); await idle(p); if (r === 'end') break; }
    await idle(p); await p.waitForTimeout(1300);
    counts.push((await count()));
    if (await p.evaluate(() => M.UI.state().screen !== 'combat')) break;
  }
  console.log('  node counts per turn:', counts.map(c => c.all).join(' '));
  console.log('  fx layer leftovers:', counts.map(c => c.fxl).join(' '));
  const grow = counts[counts.length - 1].all - counts[1].all;
  if (grow > 150) report('perf', 'DOM grew by ' + grow + ' nodes over ' + counts.length + ' turns'); else ok('DOM stable (Δ' + grow + ')');
  if (counts[counts.length - 1].fxl > 20) report('perf', 'fx layer leaks nodes: ' + counts[counts.length - 1].fxl);
  // layout thrash: count forced layouts during one enemy turn using a trace of long tasks
  const lt = await p.evaluate(() => window.__lt); console.log('  long-task ms total:', Math.round(lt));
  const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable'); const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value])); console.log('  LayoutCount', m.LayoutCount, 'RecalcStyleCount', m.RecalcStyleCount, 'JSHeap MB', (m.JSHeapUsedSize / 1e6).toFixed(1));
  if (p._errs.length) report('perf', 'console errors: ' + p._errs.slice(0, 5).join(' | '));
  await ctx.close();
}

(async () => {
  const which = process.argv[2] || 'all';
  const browser = await chromium.launch();
  const T = { play: testPlay, sizes: testSizes, save: testSave, stress: testStress, a11y: testA11y, perf: testPerf };
  for (const k of Object.keys(T)) if (which === 'all' || which === k) { try { await T[k](browser); } catch (e) { report(k, 'harness exception: ' + (e.stack || e).toString().split('\n').slice(0, 3).join(' ')); } }
  await browser.close();
  console.log('\n' + (problems.length ? problems.length + ' problem(s):\n' + problems.join('\n') : 'ALL CHECKS PASSED'));
  process.exit(problems.length ? 1 : 0);
})();
