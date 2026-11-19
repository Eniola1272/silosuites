import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {todayInUtah,addDays} from '../prototype/booking.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.SILO_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.SILO_NETLIFY_QA_URL||'http://127.0.0.1:4174';
const browser=await chromium.launch({headless:true,executablePath:process.env.SILO_CHROME_EXECUTABLE});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],apiRequests=[],failures=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{const url=new URL(request.url());if(url.hostname==='api.hostaway.com'||url.pathname.startsWith('/api/'))apiRequests.push(url.origin+url.pathname);});page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)failures.push(response.url());});
 await page.goto(base+'/',{waitUntil:'networkidle'});assert.equal(await page.locator('h1').innerText(),'Our suites');assert.equal(await page.locator('.suite-card').count(),5);assert.equal(await page.locator('.group-inquiry').count(),0);assert.equal(await page.getByRole('link',{name:'Hot Springs',exact:true}).first().getAttribute('href'),'https://silosuites.com/hot-springs/');
 const expectedPrices=['Rates from $150','Rates from $165','Rates from $165','Rates from $159','Rates from $159'];assert.deepEqual(await page.locator('.suite-card .card-starting-rate').allTextContents(),expectedPrices);assert.equal(await page.locator('.search-submit').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(129, 173, 123)');assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');assert.equal(await page.locator('.card-starting-rate').first().evaluate(el=>getComputedStyle(el).fontStyle),'normal');
 const expected={'silo-1':52,'silo-2':62,'silo-3':34,'silo-4':11,dairy:0};
 for(const [property,count] of Object.entries(expected)){
  await page.goto(base+'/suite.html?id='+property,{waitUntil:'networkidle'});const reviews=page.locator('[data-ssb-reviews]');await reviews.locator('.ssr-heading').waitFor();
  assert.equal(await page.locator('.stay-gallery img').count(),5);assert.equal(await page.locator('.property-other-card').count(),2);assert.equal(await page.getByRole('link',{name:'View all properties',exact:true}).count(),1);assert.equal(await page.locator('#hosts-heading').innerText(),'Meet your hosts');assert.match(await page.locator('#reviews').innerText(),/Reviews shown as of November 18, 2026/);await page.locator('[data-property-rating]').waitFor({state:'visible'});
  if(count===0){assert.equal(await reviews.locator('.ssr-empty').innerText(),'No guest reviews yet.');continue;}
  assert.match(await reviews.locator('.ssr-heading').innerText(),new RegExp(count+' reviews'));await reviews.getByRole('button',{name:'Show all reviews',exact:true}).click();assert.equal(await page.locator('.ssr-dialog .ssr-card').count(),count);await page.keyboard.press('Escape');await page.locator('.ssr-dialog').waitFor({state:'detached'});
 }
 await page.goto(base+'/suite.html?id=silo-2',{waitUntil:'networkidle'});await page.locator('[data-property-rating]').waitFor({state:'visible'});await page.screenshot({path:'test-results/netlify-client-preview-desktop.png'});
 await page.getByRole('button',{name:'View all photos',exact:true}).click();assert(await page.locator('#lightbox-dialog').isVisible());await page.keyboard.press('Escape');await page.locator('#lightbox-dialog').waitFor({state:'hidden'});
 await page.getByRole('button',{name:/See all amenities/}).click();assert(await page.locator('#amenities-dialog').isVisible());await page.keyboard.press('Escape');await page.locator('#amenities-dialog').waitFor({state:'hidden'});
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));for(const photo of await page.locator('.stay-gallery img').all())assert(await photo.isVisible());await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'test-results/netlify-client-preview-mobile.png'});
 await page.locator('.menu-toggle').click();assert(await page.locator('#mobile-menu').isVisible());await page.locator('.menu-toggle').click();
 await page.locator('#booking-panel [data-date-open="in"]').click();const calendar=page.locator('#date-dialog');
 for(const day of [addDays(todayInUtah(),2),addDays(todayInUtah(),5)]){for(let i=0;i<12&&!await calendar.locator(`[data-day="${day}"]`).isVisible();i++)await calendar.locator('[data-month="1"]').click();await calendar.locator(`[data-day="${day}"]`).click();}
 await page.locator('#apply-dates').click();await page.locator('[data-property-search] button[type="submit"]').click();await page.getByRole('link',{name:/Preview checkout/}).click();await page.locator('.checkout-summary').waitFor();assert(await page.getByRole('button',{name:'Payment unavailable in preview',exact:true}).isDisabled());assert.equal(await page.locator('input').count(),0);
 assert.deepEqual(errors,[]);assert.deepEqual(apiRequests,[]);assert.deepEqual(failures,[]);console.log('PASS: extracted static archive; all five pages and snapshot reviews/ratings; 5-photo galleries; 2 alternatives; host content; gallery/review/amenities popups; mobile navigation/overflow; sample checkout disabled; client olive and published Rates from; no Hostaway/local API requests, missing files, or JS errors.');
}finally{await browser.close();}
