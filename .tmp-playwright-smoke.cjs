const { chromium } = require('playwright');
const fs = require('node:fs/promises');
(async () => {
  await fs.mkdir('output/playwright', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await page.goto('http://127.0.0.1:4301/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: 'output/playwright/showroom-home-desktop.png', fullPage: false });
  const titleVisible = await page.getByText('Find the right car', { exact: false }).isVisible();
  await page.goto('http://127.0.0.1:4301/used-cars?q=bmw', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: 'output/playwright/showroom-catalog-desktop.png', fullPage: false });
  const catalogVisible = await page.getByText('Inventory', { exact: false }).isVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4301/used-cars?q=bmw', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: 'output/playwright/showroom-catalog-mobile.png', fullPage: false });
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  await browser.close();
  console.log(JSON.stringify({ titleVisible, catalogVisible, hasHorizontalOverflow }, null, 2));
})().catch((error) => { console.error(error); process.exit(1); });
