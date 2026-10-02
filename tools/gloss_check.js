// Screenshots for the font change + glossary.
const { chromium, devices } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const FONTS = path.join(__dirname, 'qa_fonts') + '/', OUT = path.join(__dirname, '..', 'preview') + '/';
(async () => {
  const b = await chromium.launch();
  for (const [tag, dev] of [['i13', devices['iPhone 13']], ['se', { ...devices['iPhone SE'], viewport: { width: 375, height: 667 } }]]) {
    const ctx = await b.newContext(dev);
    const map = { fell: 'im-fell-english-latin-400-normal.woff2', 'fell-i': 'im-fell-english-latin-400-italic.woff2', fellsc: 'im-fell-english-sc-latin-400-normal.woff2', frak: 'unifrakturmaguntia-latin-400-normal.woff2' };
    const css = `@font-face{font-family:'IM Fell English';font-style:normal;src:url(https://fonts.gstatic.com/x/fell)}@font-face{font-family:'IM Fell English';font-style:italic;src:url(https://fonts.gstatic.com/x/fell-i)}@font-face{font-family:'IM Fell English SC';src:url(https://fonts.gstatic.com/x/fellsc)}@font-face{font-family:'UnifrakturMaguntia';src:url(https://fonts.gstatic.com/x/frak)}`;
    await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: css }));
    await ctx.route('https://fonts.gstatic.com/x/*', r => r.fulfill({ status: 200, contentType: 'font/woff2', body: fs.readFileSync(FONTS + map[r.request().url().split('/').pop()]) }));
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await p.goto('file://' + path.join(__dirname, '..', 'dist', 'index.html') + '?seed=GLOSS1'); await p.waitForTimeout(800);
    await p.screenshot({ path: OUT + 'g_' + tag + '_intro.png' });
    await p.evaluate(() => M.UI.act({ type: 'proceed' })); await p.waitForTimeout(400);
    await p.evaluate(() => { const s = M.UI.state(); M.UI.act({ type: 'chooseNode', id: M.reachable(s)[0] }); }); await p.waitForTimeout(1500);
    await p.screenshot({ path: OUT + 'g_' + tag + '_combat.png' });
    await p.tap('[data-a="glossary"]'); await p.waitForTimeout(500);
    await p.screenshot({ path: OUT + 'g_' + tag + '_gloss.png' });
    await p.fill('#glossQ', 'corrode'); await p.waitForTimeout(300);
    await p.screenshot({ path: OUT + 'g_' + tag + '_gloss_search.png' });
    await p.fill('#glossQ', ''); await p.tap('[data-sec="status"]'); await p.waitForTimeout(300);
    await p.screenshot({ path: OUT + 'g_' + tag + '_gloss_status.png' });
    console.log(tag, 'errors:', errs);
    await ctx.close();
  }
  await b.close();
})();
