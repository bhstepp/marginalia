// Screens in simulated Home-Screen mode (standalone class + 59px status-bar inset).
const { chromium, devices } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const FONTS = path.join(__dirname, 'qa_fonts') + '/', OUT = path.join(__dirname, '..', 'preview') + '/';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'], viewport: { width: 393, height: 852 } });
  const map = { fell: 'im-fell-english-latin-400-normal.woff2', 'fell-i': 'im-fell-english-latin-400-italic.woff2', fellsc: 'im-fell-english-sc-latin-400-normal.woff2', frak: 'unifrakturmaguntia-latin-400-normal.woff2' };
  const css = `@font-face{font-family:'IM Fell English';src:url(https://fonts.gstatic.com/x/fell)}@font-face{font-family:'IM Fell English';font-style:italic;src:url(https://fonts.gstatic.com/x/fell-i)}@font-face{font-family:'IM Fell English SC';src:url(https://fonts.gstatic.com/x/fellsc)}@font-face{font-family:'UnifrakturMaguntia';src:url(https://fonts.gstatic.com/x/frak)}`;
  await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: css }));
  await ctx.route('https://fonts.gstatic.com/x/*', r => r.fulfill({ status: 200, contentType: 'font/woff2', body: fs.readFileSync(FONTS + map[r.request().url().split('/').pop()]) }));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, '..', 'dist', 'index.html'));
  const sim = () => p.evaluate(() => { document.documentElement.classList.add('standalone'); document.documentElement.style.setProperty('--sat', '69px'); document.documentElement.style.setProperty('--sab', '34px'); });
  await sim(); await p.waitForTimeout(500); await p.screenshot({ path: OUT + 'sa_title.png' });
  await p.tap('[data-a="newRun"]'); await p.waitForTimeout(600); await sim(); await p.screenshot({ path: OUT + 'sa_charsel.png' });
  const h = await p.evaluate(() => ({ app: document.getElementById('app').getBoundingClientRect().height, win: innerHeight, vh: getComputedStyle(document.documentElement).getPropertyValue('--vh') }));
  console.log('sizes', h, 'errors', errs); await b.close();
})();
