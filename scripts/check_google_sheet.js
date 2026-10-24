import { chromium } from 'playwright';

async function checkSheet() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  try {
    const res = await page.goto('https://docs.google.com/spreadsheets/d/1hgC9wdhGU68c7xdxBdltEFrBEJtXS2F1MCNJawKQ2lA/edit?gid=0#gid=0', { waitUntil: 'load', timeout: 30000 });
    console.log('Status:', res ? res.status() : 'null');
    console.log('Final URL:', page.url());
    console.log('Title:', await page.title());
    
    await page.waitForTimeout(4000);
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
    console.log('Body snippet:\n', bodyText);

    // Take a screenshot to inspect visually
    await page.screenshot({ path: 'recordings/google_sheet_inspect.png' });
    console.log('Screenshot saved to recordings/google_sheet_inspect.png');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

checkSheet();
