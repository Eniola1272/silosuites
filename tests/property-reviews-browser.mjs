import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.SILO_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.SILO_CHROME_EXECUTABLE});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const counts={};
 for(const property of ['silo-1','silo-2','silo-3','silo-4','dairy']){
  await page.goto('http://127.0.0.1:4173/suite.html?id='+property,{waitUntil:'networkidle'});
  const root=page.locator('[data-ssb-reviews]');await root.locator('.ssr-heading').waitFor();
  assert.equal(await root.getAttribute('data-property'),property);
  assert(!/reserving all four silos/i.test(await page.locator('main').innerText()));assert.equal(await page.getByRole('link',{name:/Open (?:the area )?map/}).count(),0);
  assert.equal(await page.locator('.property-subnav a[href="#reviews"]').count(),1);
  if(property==='dairy'){assert.equal(await root.locator('.ssr-empty').innerText(),'No guest reviews yet.');assert.equal(await root.locator('.ssr-card').count(),0);counts[property]=0;continue;}
  assert.equal(await root.locator('.ssr-card').count(),4);assert(!/Airbnb/.test(await root.innerText()));
  counts[property]=Number((await root.locator('.ssr-heading span').innerText()).match(/\d+/)[0]);assert(counts[property]>4);
  const button=root.getByRole('button',{name:'Show all reviews'});await button.click();const dialog=page.locator('.ssr-dialog');assert(await dialog.isVisible());assert.equal(await dialog.locator('.ssr-card').count(),counts[property]);await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert.equal(await page.locator('.ssr-dialog').count(),0);assert(await button.evaluate(el=>el===document.activeElement));
  if(property==='silo-2'){
   await root.scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/property-reviews-desktop.png'});
   await page.setViewportSize({width:390,height:844});await root.scrollIntoViewIfNeeded();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await root.getByRole('button',{name:/Read review/}).first().click();assert(await page.locator('.ssr-dialog').isVisible());assert.equal(await page.locator('.ssr-dialog').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');await page.screenshot({path:'test-results/property-review-popup-mobile.png'});await page.keyboard.press('Escape');await page.locator('.ssr-dialog').waitFor({state:'detached'});await page.setViewportSize({width:1440,height:1000});
  }
 }
 assert.equal((await page.request.get('http://127.0.0.1:4173/api/property-reviews?property=all-silos')).status(),400);
 assert.equal((await page.request.get('http://127.0.0.1:4173/.secrets/hostaway-public-reviews.json')).status(),404);
 // Isolated synthetic response tests cover retries and untrusted text without copying real review data to fixtures.
 await page.route('**/api/synthetic-reviews*',route=>route.fulfill({status:503,body:'unavailable'}));
 await page.setContent('<div data-ssb-reviews data-property="silo-2" data-api="/api/synthetic-reviews"></div>');
 await page.addStyleTag({content:readFileSync('wordpress/plugins/silosuites-booking/assets/reviews.css','utf8')});await page.addScriptTag({content:readFileSync('wordpress/plugins/silosuites-booking/assets/reviews.js','utf8')});
 const root=page.locator('[data-ssb-reviews]');await root.getByRole('button',{name:'Try again'}).waitFor();
 await page.unroute('**/api/synthetic-reviews*');await page.route('**/api/synthetic-reviews*',route=>route.fulfill({json:{property:'silo-2',count:1,average:10,scale:10,reviews:[{text:'Synthetic <img src=x onerror="window.reviewXSS=1">',source:'Vrbo',rating:10,scale:10,month:'2026-10'}]}}));
 await root.getByRole('button',{name:'Try again'}).click();await root.locator('.ssr-card').waitFor();assert.equal(await root.locator('img').count(),0);assert.equal(await page.evaluate(()=>window.reviewXSS),undefined);assert.match(await root.locator('.ssr-card p').innerText(),/<img/);
 assert.deepEqual(errors,[]);console.log('PASS: real local per-suite review cache '+JSON.stringify(counts)+'; review dialogs/focus; mobile layout; empty/retry states; no group invitation or Open map link; private files blocked; safe text rendering.');
}finally{await browser.close();}
