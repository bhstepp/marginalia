// Screenshots for the v2 UI (characters, Rubrication, daily modifiers, Book, achievements, stone, duo boss).
// Usage: node tools/ui_v2.js [i13|se]   → preview/v2_<size>_*.png. Cheats live only here (page.evaluate).
const { chromium, devices } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'preview') + '/', FONTS = path.join(__dirname, 'qa_fonts') + '/';
const URL = 'file://' + path.join(ROOT, 'dist', 'index.html');
const SIZES = { i13: { ...devices['iPhone 13'] }, se: { ...devices['iPhone SE'], viewport: { width: 375, height: 667 }, screen: { width: 375, height: 667 } } };
async function fonts(ctx) {
  const map = { fell: 'im-fell-english-latin-400-normal.woff2', 'fell-i': 'im-fell-english-latin-400-italic.woff2', fellsc: 'im-fell-english-sc-latin-400-normal.woff2', frak: 'unifrakturmaguntia-latin-400-normal.woff2' };
  const css = `@font-face{font-family:'IM Fell English';font-style:normal;src:url(https://fonts.gstatic.com/x/fell)}@font-face{font-family:'IM Fell English';font-style:italic;src:url(https://fonts.gstatic.com/x/fell-i)}@font-face{font-family:'IM Fell English SC';src:url(https://fonts.gstatic.com/x/fellsc)}@font-face{font-family:'UnifrakturMaguntia';src:url(https://fonts.gstatic.com/x/frak)}`;
  await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: css }));
  await ctx.route('https://fonts.gstatic.com/x/*', r => r.fulfill({ status: 200, contentType: 'font/woff2', body: fs.readFileSync(FONTS + map[r.request().url().split('/').pop()]) }));
}
(async () => {
  const sizes = process.argv[2] ? [process.argv[2]] : ['i13', 'se'];
  const b = await chromium.launch(); let bad = 0;
  for (const size of sizes) {
    const ctx = await b.newContext(SIZES[size]); await fonts(ctx);
    const p = await ctx.newPage(), errs = [];
    p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    const shot = async (n, w = 450) => { await p.waitForTimeout(w); await p.screenshot({ path: OUT + 'v2_' + size + '_' + n + '.png' }); };
    const click = (sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) throw new Error('missing ' + s); e.click(); }, sel);
    await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.goto(URL); await p.waitForTimeout(500);
    await shot('01_title');
    // character select (Nun + Scribe locked on a fresh book)
    await click('[data-a="newRun"]'); await shot('02_charsel');
    await click('.csTab[data-id="nun"]'); await shot('03_charsel_locked');
    // give the Knight some Rubrication progress, then show the picker
    await p.evaluate(() => { const bk = M.UI.book(); bk.rubric.knight = 4; bk.best['knight:2'] = 812; localStorage.setItem('marginalia.book.v1', JSON.stringify(bk)); });
    await click('.csTab[data-id="knight"]'); await click('[data-a="rubDown"]'); await click('[data-a="rubUp"]'); await shot('04_rubric_picker');
    await click('.rubCur'); await shot('05_rubric_all');
    await p.evaluate(() => { document.getElementById('ovl').className = ''; document.getElementById('ovl').innerHTML = ''; });
    // all hands unlocked (test-only book), Scribe chosen
    const saved = await p.evaluate(() => localStorage.getItem('marginalia.book.v1'));
    await p.evaluate(() => { const bk = M.UI.book(); bk.ach.push('win_knight', 'win_nun'); bk.rubric.scribe = 2; M.UI.toTitle(); });
    await click('[data-a="newRun"]'); await click('.csTab[data-id="scribe"]'); await shot('05b_charsel_all_unlocked');
    await p.evaluate((sv) => { localStorage.setItem('marginalia.book.v1', sv); M.UI.reloadBook(); M.UI.toTitle(); }, saved);
    await click('[data-a="newRun"]');
    await p.evaluate(() => { document.getElementById('ovl').className = ''; document.getElementById('ovl').innerHTML = ''; });
    await click('[data-a="csBegin"]'); await p.waitForTimeout(300); await shot('06_intro_rubric');
    // daily with modifiers
    await p.evaluate(() => { localStorage.removeItem('marginalia.save.v1'); M.UI.toTitle(); }); await p.waitForTimeout(300);
    await click('[data-a="daily"]'); await shot('07_daily_select');
    await click('[data-a="csBegin"]'); await p.waitForTimeout(300); await shot('08_daily_intro');
    await p.evaluate(() => M.UI.act({ type: 'proceed' })); await shot('09_map_daily', 700);
    await click('[data-a="modInfo"]'); await shot('10_mod_dialog');
    await p.evaluate(() => { document.getElementById('ovl').className = ''; document.getElementById('ovl').innerHTML = ''; });
    // map with a duo boss at Rubrication 3
    await p.evaluate(() => { localStorage.removeItem('marginalia.save.v1'); M.UI.startRun('DUO1', { char: 'knight', asc: 3 }); const s = M.UI.state(); M.act(s, { type: 'proceed' }); s.map.boss = ['jousting_hare', 'war_snail']; M.UI.ui.mounted = null; M.UI.render(); });
    await shot('11_map_duo', 600);
    await p.evaluate(() => { document.getElementById('mapwrap').scrollTop = 0; }); await shot('12_map_duo_top', 200);
    await click('[data-a="bossInfo"]'); await shot('13_boss_dialog');
    await p.evaluate(() => { document.getElementById('ovl').className = ''; document.getElementById('ovl').innerHTML = ''; });
    // duo boss combat + petrified hand
    await p.evaluate(() => { const s = M.UI.state(); M.startCombat(s, ['jousting_hare', 'war_snail'], 'boss'); s.fx = []; const c = s.combat; c.hand[0].stone = true; c.hand[2].stone = true; c.player.st.petrified = 1; M.UI.ui.mounted = null; M.UI.render(); });
    await shot('14_combat_duo_stone', 900);
    await p.evaluate(() => { const c = M.UI.state().combat; M.UI.ui.selUid = c.hand[0].uid; M.UI.render(); }); await shot('15_stone_selected', 400);
    // Nun / Scribe combat art (unlock them)
    await p.evaluate(() => { localStorage.removeItem('marginalia.save.v1'); const bk = M.UI.book(); bk.ach.push('win_knight', 'win_nun'); localStorage.setItem('marginalia.book.v1', JSON.stringify(bk)); M.UI.startRun('NUN1', { char: 'nun' }); const s = M.UI.state(); M.act(s, { type: 'proceed' }); M.act(s, { type: 'chooseNode', id: M.reachable(s)[0] }); s.fx = []; M.UI.ui.mounted = null; M.UI.render(); });
    await shot('16_combat_nun', 900);
    await p.evaluate(() => { localStorage.removeItem('marginalia.save.v1'); M.UI.startRun('SCR1', { char: 'scribe' }); const s = M.UI.state(); M.act(s, { type: 'proceed' }); M.act(s, { type: 'chooseNode', id: M.reachable(s)[0] }); s.fx = []; M.UI.ui.mounted = null; M.UI.render(); });
    await shot('16b_combat_scribe', 900);
    const sc = await p.evaluate(() => { const s = M.UI.state(); return s.char + ' ' + s.combat.hand.map(h => h.id).join(','); }); console.log(size, 'scribe hand:', sc);
    await p.evaluate(() => { localStorage.removeItem('marginalia.save.v1'); M.UI.startRun('NUN1', { char: 'nun' }); const s = M.UI.state(); M.act(s, { type: 'proceed' }); M.act(s, { type: 'chooseNode', id: M.reachable(s)[0] }); s.fx = []; M.UI.ui.mounted = null; M.UI.render(); });
    // achievement toast (live, through the real pipeline)
    await p.evaluate(() => { const s = M.UI.state(); s.stats.maxWard = 50; s.gold = 400; M.UI.act({ type: 'endTurn' }); });
    await shot('17_ach_toast', 700);
    // the Book
    await p.evaluate(() => { M.UI.toTitle(); }); await p.waitForTimeout(300);
    await p.evaluate(() => { const bk = M.UI.book(); Object.keys(M.CARDS).slice(0, 60).forEach(id => bk.seen.cards[id] = 1); Object.keys(M.RELICS).slice(0, 14).forEach(id => bk.seen.relics[id] = 1); Object.keys(M.ENEMIES).slice(0, 12).forEach(id => bk.seen.foes[id] = 1); bk.rubric.knight = 3; bk.best['knight:0'] = 640; bk.best['knight:1'] = 702; localStorage.setItem('marginalia.book.v1', JSON.stringify(bk)); });
    await shot('18_title_after', 200);
    await click('[data-a="book"]'); await shot('19_book_cards', 600);
    await p.evaluate(() => { const pg = document.querySelector('#ovl .sheet .page'); pg.scrollTop = 900; }); await shot('20_book_cards_scrolled', 300);
    await click('#ovl [data-a="bookCard"]'); await shot('21_book_zoom', 500);
    await click('#ovl [data-a="zoomAct"]'); await p.waitForTimeout(300);
    await click('#ovl [data-a="bookTab"][data-tab="relics"]'); await p.evaluate(() => { const pg = document.querySelector('#ovl .sheet .page'); pg.scrollTop = 2000; }); await shot('22b_book_relics_scrolled', 400);
    for (const [t, n] of [['relics', '22'], ['foes', '23'], ['ach', '24'], ['chars', '25']]) { await click(`#ovl [data-a="bookTab"][data-tab="${t}"]`); await shot(n + '_book_' + t, 450); }
    await click('#ovl [data-a="bookTab"][data-tab="cards"]'); await click('#ovl [data-a="bookFilt"][data-v="scribe"]'); await shot('26_book_filter_scribe', 450);
    // end screen with earned achievements + rubric unlock
    await p.evaluate(() => { document.getElementById('ovl').className = ''; document.getElementById('ovl').innerHTML = ''; M.UI.startRun('ENDQA', { char: 'knight', asc: 3 }); const s = M.UI.state(); s.stats.bosses = 3; s.stats.floors = 45; s.stats.kills = 60; s.over = true; s.won = true; s.screen = 'end'; s.uiAch = ['quire_one', 'unscathed']; M.UI.ui.mounted = null; M.UI.render(); });
    await shot('27_end_win', 600);
    await p.evaluate(() => { const pg = document.querySelector('.page'); pg.scrollTop = 999; }); await shot('28_end_win_scrolled', 200);
    // old v1 save loads
    await p.evaluate(() => { const s = M.newRun({ seed: 'OLDV1' }); M.act(s, { type: 'proceed' }); delete s.char; delete s.asc; delete s.mods; delete s.seen; delete s.unlocked; s.v = 1; localStorage.setItem('marginalia.save.v1', M.serialize(s)); M.UI.toTitle(); });
    await p.waitForTimeout(300); await click('[data-a="continue"]'); await shot('29_v1_continue', 600);
    const v1 = await p.evaluate(() => { const s = M.UI.state(); return { char: s.char, asc: s.asc, mods: s.mods, screen: s.screen }; });
    console.log(size, 'v1 save →', JSON.stringify(v1));
    await click('[data-a="menu"]'); await shot('30_menu', 400);
    console.log(size, 'errors:', errs.length ? errs : 'none'); if (errs.length) bad++;
    await ctx.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
