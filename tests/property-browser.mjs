import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SILO_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless:true, executablePath:process.env.SILO_CHROME_EXECUTABLE });
const base=process.env.SILO_PREVIEW_URL || 'http://127.0.0.1:4173';
await mkdir('test-results',{recursive:true});
const errors=[];
try {
 const p=await browser.newPage({viewport:{width:1440,height:1000}});
 p.setDefaultTimeout(8000);
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto(`${base}/suite.html?id=silo-2`,{waitUntil:'networkidle'});
 assert.equal(await p.locator('.stay-gallery img').count(),5);
 assert.match(await p.locator('.stay-facts').innerText(),/5 guests.*2 bedrooms.*3 beds.*1 bath/s);
 await p.locator('.all-photos').click();
 await p.keyboard.press('ArrowLeft');
 assert.equal(await p.locator('#gallery-counter').innerText(),'5 / 5');
 await p.keyboard.press('Escape');
 assert.equal(await p.locator('.all-photos').evaluate(el=>el===document.activeElement),true);
 await p.locator('#amenities summary').focus();
 await p.keyboard.press('Enter');
 await p.locator('#amenities li').filter({hasText:'Dining supplies for 5'}).waitFor({state:'visible'});
 await p.locator('#good-to-know summary').filter({hasText:'House rules'}).focus();
 await p.keyboard.press('Enter');
 await p.getByText('Check-in from 3:00 pm',{exact:true}).waitFor({state:'visible'});
 // Real photo decoding before visual inspection; no lazy-load blanks.
 for(const im of await p.locator('main img:visible').all()) {await im.scrollIntoViewIfNeeded();await im.evaluate(el=>el.decode());}
 await p.evaluate(()=>scrollTo(0,0));
 await p.screenshot({path:'test-results/silo-2-desktop.png',fullPage:true});
 for(const width of [768,390,320]) {
  await p.setViewportSize({width,height:844});
  await p.goto(`${base}/suite.html?id=silo-2`,{waitUntil:'networkidle'});
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1);
  await p.locator('.mobile-booking a').click();
  await p.locator('[data-date-open="in"]').click();
  assert.equal(await p.locator('#date-dialog').isVisible(),true);
  await p.keyboard.press('Escape');
  if(width===390){for(const im of await p.locator('main img:visible').all()){await im.scrollIntoViewIfNeeded();await im.evaluate(el=>el.decode());}await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:'test-results/silo-2-mobile.png',fullPage:true});}
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: exported facts, five-photo gallery and wraparound, focus return, amenities, house rules, image decoding, mobile booking/date dialog, no overflow at 768/390/320.');
} finally { await browser.close(); }
