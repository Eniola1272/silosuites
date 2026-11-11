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
 assert.equal(await p.locator('.stay-jump').count(),0);
 assert.equal(await p.locator('.property-subnav').isVisible(),false);
 assert.equal(await p.locator('.property-subnav a').first().textContent(),'Overview');
 await p.locator('#about-stay').evaluate(el=>el.scrollIntoView({behavior:'instant',block:'start'}));
 await p.locator('.property-subnav').waitFor({state:'visible'});
 await p.locator('.property-subnav a').first().click();
 await p.locator('.property-subnav').waitFor({state:'visible'});
 await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
 await p.locator('.property-subnav').waitFor({state:'hidden'});

 assert.match(await p.locator('.stay-facts').innerText(),/5 guests.*2 bedrooms.*3 beds.*1 bath/s);
 await p.locator('.all-photos').click();
 await p.keyboard.press('ArrowLeft');
 assert.equal(await p.locator('#gallery-counter').innerText(),'5 / 5');
 await p.keyboard.press('Escape');
 assert.equal(await p.locator('.all-photos').evaluate(el=>el===document.activeElement),true);
 const amenitiesButton = p.locator('[data-property-open="amenities-dialog"]');
 await amenitiesButton.click();
 await p.locator('#amenities-dialog').waitFor({state:'visible'});
 assert.equal(await p.locator('#amenities-dialog .amenity-group li').count(),14);
 assert.equal(await p.locator('#amenities-dialog .amenity-group').count(),4);
 assert.equal(await p.locator('body').evaluate(el=>el.classList.contains('dialog-open')),true);
 await p.screenshot({animations:'disabled',path:'test-results/silo-amenities-desktop.png'});
 // Native modal focus containment, escape and return to the original trigger.
 await p.keyboard.press('Tab');
 assert.equal(await p.locator('#amenities-dialog').evaluate(el=>el.contains(document.activeElement)),true);
 await p.keyboard.press('Escape');
 assert.equal(await amenitiesButton.evaluate(el=>el===document.activeElement),true);
 await p.waitForFunction(()=>!document.body.classList.contains('dialog-open'));
 for (const id of ['about','rules','cancellation']) {
  await p.locator(`[data-property-open="${id}-dialog"]`).click();
  await p.locator(`#${id}-dialog`).waitFor({state:'visible'});
  await p.locator(`#${id}-dialog [data-close]`).click();
 }
 await p.waitForFunction(()=>!document.body.classList.contains('dialog-open'));
 await p.locator('#amenities').evaluate(el=>el.scrollIntoView({behavior:'instant'}));
 await p.waitForFunction(()=>!document.querySelector('.property-subnav').hidden);
 await p.waitForFunction(()=>document.querySelector('.property-subnav a[aria-current]')?.hash==='#amenities');
 const bounds = await p.evaluate(()=>({nav:document.querySelector('.property-subnav').getBoundingClientRect().top,header:document.querySelector('[data-site-header]').getBoundingClientRect().bottom,card:document.querySelector('.stay-booking').getBoundingClientRect().top,bottom:document.querySelector('.property-subnav').getBoundingClientRect().bottom}));
 assert.ok(Math.abs(bounds.nav-bounds.header)<2);
 assert.ok(bounds.card>=bounds.bottom);
 await p.screenshot({animations:'disabled',path:'test-results/silo-property-subnav.png'});
 await p.locator('.property-subnav a[href="#location"]').click();
 await p.waitForFunction(()=>document.querySelector('.property-subnav a[aria-current]')?.hash==='#location');
 // Real photo decoding before visual inspection; no lazy-load blanks.
 for(const im of await p.locator('main img:visible').all()) {await im.scrollIntoViewIfNeeded();await im.evaluate(el=>el.decode());}
 await p.evaluate(()=>scrollTo(0,0));
 await p.screenshot({animations:'disabled',path:'test-results/silo-2-desktop.png',fullPage:true});
 for(const width of [768,390,320]) {
  await p.setViewportSize({width,height:844});
  await p.goto(`${base}/suite.html?id=silo-2`,{waitUntil:'networkidle'});
  await p.locator('[data-property-open="amenities-dialog"]').click();
  await p.locator('#amenities-dialog').waitFor({state:'visible'});
  assert.ok(await p.locator('#amenities-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  if(width===390) await p.screenshot({animations:'disabled',path:'test-results/silo-amenities-mobile.png'});
  await p.mouse.click(2,2);
  await p.locator('#amenities-dialog').waitFor({state:'hidden'});
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1);
  await p.locator('.mobile-booking a').click();
  await p.locator('[data-date-open="in"]').click();
  assert.equal(await p.locator('#date-dialog').isVisible(),true);
  await p.keyboard.press('Escape');
  if(width===390){for(const im of await p.locator('main img:visible').all()){await im.scrollIntoViewIfNeeded();await im.evaluate(el=>el.decode());}await p.evaluate(()=>scrollTo(0,0));await p.screenshot({animations:'disabled',path:'test-results/silo-2-mobile.png',fullPage:true});}
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: exported facts, five-photo gallery and wraparound, focus return, grouped amenity modal, detail modals, scroll lock/focus return, sticky active navigation, image decoding, mobile booking/date dialog, no overflow at 768/390/320.');
} finally { await browser.close(); }
