import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {todayInUtah,addDays,suites} from '../prototype/booking.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.SILO_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.SILO_CHROME_EXECUTABLE});
const errors=[];const today=todayInUtah(),base='http://127.0.0.1:4173';
async function choose(dialog,date){const day=dialog.locator(`[data-qb-day="${date}"]`);for(let i=0;i<13&&!await day.isVisible();i++)await dialog.locator('[data-qb-month="1"]').click();await day.click();}
try{
const p=await browser.newPage({viewport:{width:1440,height:1000}});p.on('pageerror',e=>errors.push(e.message));await p.goto(base,{waitUntil:'networkidle'});
assert.equal(await p.locator('.suite-card').count(),6);assert.equal(await p.locator('.home-card-actions .card-bottom').count(),6);
const dialog=p.locator('.quick-booking-dialog');
for(const suite of suites){const trigger=p.locator(`[data-quick-book="${suite.id}"]`);await trigger.click();assert.equal(await dialog.locator('h2').innerText(),suite.name);assert.equal(await dialog.locator('[data-qb-guests] option').count(),suite.capacity);assert(await dialog.locator('[data-qb-continue]').isDisabled());await p.keyboard.press('Escape');assert(await trigger.evaluate(el=>el===document.activeElement));}
await p.locator('[data-quick-book="silo-1"]').click();
// Reserved nights cannot be arrivals; arrival on day 10 can depart on day 12.
const blocked=addDays(today,12);for(let i=0;i<12&&!await dialog.locator(`[data-qb-day="${blocked}"]`).isVisible();i++)await dialog.locator('[data-qb-month="1"]').click();assert(await dialog.locator(`[data-qb-day="${blocked}"]`).isDisabled());await p.keyboard.press('Escape');
await p.locator('[data-quick-book="silo-1"]').click();await choose(dialog,addDays(today,10));await choose(dialog,addDays(today,15));assert(await dialog.locator('[data-qb-continue]').isDisabled());assert.match(await dialog.locator('[data-qb-status]').innerText(),/unavailable/);
await dialog.locator('[data-qb-pick="out"]').click();await choose(dialog,addDays(today,12));assert(await dialog.locator('[data-qb-continue]').isEnabled());await p.keyboard.press('Escape');
await p.locator('[data-quick-book="all-silos"]').click();const childBlocked=addDays(today,7);for(let i=0;i<12&&!await dialog.locator(`[data-qb-day="${childBlocked}"]`).isVisible();i++)await dialog.locator('[data-qb-month="1"]').click();assert(await dialog.locator(`[data-qb-day="${childBlocked}"]`).isDisabled());await p.keyboard.press('Escape');
await p.locator('[data-quick-book="silo-2"]').click();await choose(dialog,addDays(today,2));await choose(dialog,addDays(today,3));assert(await dialog.locator('[data-qb-continue]').isDisabled());await choose(dialog,addDays(today,5));await dialog.locator('[data-qb-guests]').selectOption('5');assert(await dialog.locator('[data-qb-continue]').isEnabled());
await p.screenshot({path:'test-results/quick-booking-desktop.png'});
await dialog.locator('[data-qb-continue]').click();await p.waitForURL(/checkout.html/);let url=new URL(p.url());assert.equal(url.searchParams.get('property'),'silo-2');assert.equal(url.searchParams.get('guests'),'5');assert.equal(url.searchParams.get('check_in'),addDays(today,2));assert.equal(await p.locator('.checkout-property h2').innerText(),'Silo Suite 2');assert(await p.getByRole('button',{name:'Payment unavailable in preview'}).isDisabled());
// The property-page route reaches the same checkout with the same selection.
await p.goto(`${base}/suite.html?id=silo-2&check_in=${addDays(today,2)}&check_out=${addDays(today,5)}&guests=5`,{waitUntil:'networkidle'});await p.locator('[data-property-search] button[type="submit"]').click();await p.getByRole('link',{name:/Preview checkout/}).click();await p.waitForURL(/checkout.html/);assert.equal(new URL(p.url()).searchParams.get('property'),'silo-2');
await p.goto(base+'/checkout.html?property=not-a-property&check_in=2026-02-30&guests=999');assert(await p.locator('.checkout-error').isVisible());
const m=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});m.on('pageerror',e=>errors.push(e.message));await m.goto(base,{waitUntil:'networkidle'});await m.locator('[data-quick-book="silo-2"]').click();const md=m.locator('.quick-booking-dialog');await choose(md,addDays(today,2));await choose(md,addDays(today,5));assert(await md.locator('[data-qb-continue]').isEnabled());assert(await md.evaluate(el=>el.scrollWidth<=el.clientWidth));await md.locator('[data-qb-continue]').scrollIntoViewIfNeeded();await m.screenshot({path:'test-results/quick-booking-mobile.png'});await md.locator('[data-qb-continue]').click();await m.waitForURL(/checkout.html/);assert.equal(new URL(m.url()).searchParams.get('property'),'silo-2');
assert.deepEqual(errors,[]);console.log('PASS: six dynamic cards; property-specific dialog/capacity; reserved dates; blocked-range rejection; checkout boundary; group child blocking; minimum stay; guest/date carry; both checkout routes; invalid checkout; mobile booking; focus return; no runtime errors.');
}finally{await browser.close();}
