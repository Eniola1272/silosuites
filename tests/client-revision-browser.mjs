import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {todayInUtah,addDays} from '../prototype/booking.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.SILO_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.SILO_CHROME_EXECUTABLE});const base='http://127.0.0.1:4173';
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/stays.html',{waitUntil:'networkidle'});assert.equal(await p.locator('.suite-card').count(),5);assert.equal(await p.locator('[data-filter=group]').count(),0);assert.equal(await p.locator('.suite-card').filter({hasText:'All Four Silos'}).count(),0);assert.match(await p.locator('.group-inquiry').innerText(),/Interested in reserving all four silos\? Contact us for availability\./);
 await p.goto(base+'/suite.html?id=silo-2',{waitUntil:'networkidle'});await p.locator('h1').waitFor();
 assert.equal(await p.locator('h1').innerText(),'Silo Suite 2');assert((await p.locator('.stay-heading').boundingBox()).y<(await p.locator('.stay-gallery').boundingBox()).y);
 const text=await p.locator('main').innerText();assert(!/favourite|distinctive|slower morning|little history|considered stay/i.test(text));assert.match(text,/This silo is Located at the SILO SUITES/);
 assert.equal(await p.locator('h1').evaluate(el=>getComputedStyle(el).fontStyle),'normal');assert.match(await p.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily),/Playfair Display/);assert.match(await p.locator('.stay-section p').first().evaluate(el=>getComputedStyle(el).fontFamily),/Figtree/);
 await p.getByRole('button',{name:'View all photos',exact:true}).click();assert(await p.locator('#lightbox-dialog').isVisible());await p.keyboard.press('Escape');
 await p.getByRole('button',{name:/See all amenities/}).click();assert(await p.locator('#amenities-dialog').isVisible());await p.keyboard.press('Escape');
 await p.locator('img[loading=lazy]').evaluateAll(imgs=>imgs.forEach(i=>i.loading='eager'));await p.waitForFunction(()=>[...document.images].filter(i=>i.getAttribute('src')).every(i=>i.complete&&i.naturalWidth));await p.evaluate(()=>{document.activeElement.blur();scrollTo(0,0)});await p.screenshot({path:'test-results/client-property-desktop.png',fullPage:true,style:'[data-site-header]{position:static!important}.property-subnav,.skip-link,.preview-control{display:none!important}.stay-booking{position:static!important}'});
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>scrollTo(0,0));assert((await p.locator('#booking-panel').boundingBox()).y<(await p.locator('#about-stay').boundingBox()).y);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:'test-results/client-property-mobile.png',fullPage:true,style:'[data-site-header]{position:static!important}.mobile-booking,.property-subnav,.skip-link,.preview-control{display:none!important}'});
 await p.locator('#booking-panel [data-date-open=in]').click();const dialog=p.locator('#date-dialog'),inDay=addDays(todayInUtah(),2),outDay=addDays(todayInUtah(),5);
 for(const day of [inDay,outDay]){for(let i=0;i<12&&!await dialog.locator(`[data-day="${day}"]`).isVisible();i++)await dialog.locator('[data-month="1"]').click();await dialog.locator(`[data-day="${day}"]`).click();}await p.locator('#apply-dates').click();await p.locator('[data-property-search] button[type=submit]').click();assert(await p.locator('#review-dialog').isVisible());await p.keyboard.press('Escape');
 await p.goto(base+'/suite.html?id=silo-1',{waitUntil:'networkidle'});assert.equal(await p.locator('[data-guests] option').count(),4);
 await p.goto(base+'/suite.html?id=all-silos',{waitUntil:'networkidle'});assert.match(await p.locator('main').innerText(),/Contact us for availability/);assert.equal(await p.locator('[data-property-search]').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: five rentals; inquiry-only group; existing client copy; original font families with upright headings; reference layout; gallery and amenities; mobile booking-first order; date selection and review; property guest limits; legacy group link cannot book; no runtime errors.');
}finally{await browser.close()}
