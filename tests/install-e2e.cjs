const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');

const browserType = process.env.KAPI_BROWSER === 'webkit' ? webkit : chromium;
const base = process.env.KAPI_BASE_URL || 'http://127.0.0.1:8765/';

(async () => {
  const browser = await browserType.launch({ headless: true, args: browserType === chromium ? ['--no-sandbox'] : [],
    ...(browserType === chromium && process.env.KAPI_CHROME ? { executablePath: process.env.KAPI_CHROME } : {}) });
  try {
    for (const [name, userAgent, touchPoints] of [
      ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1', 5],
      ['iPad desktop mode', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', 5]
    ]) {
      const context = await browser.newContext({ userAgent, viewport: { width: 390, height: 844 }, hasTouch: true,
        serviceWorkers: 'block' });
      await context.addInitScript((points) => {
        Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: points });
        localStorage.setItem('capy-count-install-dismissed-v1', String(Date.now()));
        localStorage.setItem('capy-count-settings-v1', JSON.stringify({ language: 'de' }));
      }, touchPoints);
      const page = await context.newPage();
      await page.goto(base);
      assert.equal(await page.locator('#installPrompt').isVisible(), false, `${name}: dismissed automatic prompt`);
      const button = page.locator('#installHomeButton');
      assert.equal(await button.isVisible(), true, `${name}: manual install button`);
      await button.click();
      assert.equal(await page.locator('#installPrompt').isVisible(), true, `${name}: manual prompt must open`);
      assert.match(await page.locator('#installText').innerText(), /Teilen.*Home-Bildschirm/);
      assert.equal(await page.locator('#installButton').isVisible(), false, `${name}: Safari has no install API`);
      await page.locator('#installContinue').click();
      assert.equal(await page.locator('#installPrompt').isVisible(), false);
      await button.click();
      assert.equal(await page.locator('#installPrompt').isVisible(), true, `${name}: manual prompt opens again`);
      console.log(`PASS ${name}: install button always opens Safari instructions`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
