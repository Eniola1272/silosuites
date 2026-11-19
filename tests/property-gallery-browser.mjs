import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.SILO_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.SILO_CHROME_EXECUTABLE});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const property of ['silo-1','silo-2','silo-3','silo-4','dairy']){
  await page.goto('http://127.0.0.1:4173/suite.html?id='+property,{waitUntil:'networkidle'});
  const gallery=page.locator('.stay-gallery'),photos=gallery.locator('button[data-gallery]:not(.all-photos)');assert.equal(await photos.count(),5);
  await photos.locator('img').evaluateAll(images=>images.forEach(image=>image.loading='eager'));await page.waitForFunction(()=>[...document.querySelectorAll('.stay-gallery img')].every(image=>image.complete&&image.naturalWidth));
  const paths=await photos.locator('img').evaluateAll(images=>images.map(image=>new URL(image.src).pathname));assert.equal(new Set(paths).size,5);assert(paths.every(path=>path.includes('/properties/'+property+'/')));
  const main=await photos.nth(0).boundingBox(),small=await photos.nth(1).boundingBox();assert(main.width>small.width*1.8&&main.height>small.height*1.8);assert.equal(Math.round((await photos.nth(2).boundingBox()).y),Math.round(small.y));assert((await photos.nth(3).boundingBox()).y>small.y);
  const rating=page.locator('[data-property-rating]');await rating.waitFor({state:'visible'});assert((await rating.boundingBox()).y<(await gallery.boundingBox()).y);
  if(property==='dairy'){assert.equal(await rating.innerText(),'No reviews yet');assert.equal(await rating.locator('svg').count(),0);}else{assert.match(await rating.innerText(),/\d+\.\d{2} \/ 10/);assert.match(await rating.getAttribute('aria-label'),/out of 10/);}
  assert.equal(await page.locator('.property-other-card').count(),2);assert.equal(await page.locator(`[data-other-property="${property}"]`).count(),0);assert.equal(await page.getByRole('link',{name:'View all properties',exact:true}).count(),1);assert(!/Stillwater|Boho 405|405 Collection/i.test(await page.locator('main').innerText()));
  await photos.nth(4).click();await page.locator('#lightbox-dialog').waitFor({state:'visible'});assert(new URL(await page.locator('#lightbox-image').getAttribute('src'),'http://127.0.0.1:4173/').pathname===paths[4]);await page.keyboard.press('Escape');await page.locator('#lightbox-dialog').waitFor({state:'hidden'});
  if(property==='silo-2'){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'test-results/property-title-rating-gallery-desktop.png'});}
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));for(const photo of await photos.all())assert(await photo.isVisible());const large=await photos.nth(0).boundingBox(),thumb=await photos.nth(1).boundingBox();assert(large.width>thumb.width*1.9&&large.y<thumb.y);
  if(property==='silo-2'){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'test-results/property-title-rating-gallery-mobile.png'});}
  await page.setViewportSize({width:1440,height:1000});
 }
 // Synthetic widget test: summary and full reviews share a single response, including safe empty/error behavior.
 await page.goto('http://127.0.0.1:4173/stays.html',{waitUntil:'networkidle'});let requests=0;
 await page.route('**/api/synthetic-rating*',route=>{requests++;return route.fulfill({json:{property:'silo-2',scale:10,count:1,average:9.5,reviews:[{text:'Synthetic review only.',rating:9.5,scale:10,source:'Vrbo',month:'2026-11'}]}});});
 await page.setContent('<a data-property-rating data-property="silo-2" data-api="/api/synthetic-rating" href="#reviews" hidden></a><div data-ssb-reviews data-property="silo-2" data-api="/api/synthetic-rating"></div>');await page.addScriptTag({content:readFileSync('wordpress/plugins/silosuites-booking/assets/reviews.js','utf8')});await page.locator('[data-property-rating]').waitFor({state:'visible'});await page.locator('.ssr-card').waitFor();assert.equal(requests,1);assert.match(await page.locator('[data-property-rating]').innerText(),/9\.50 \/ 10/);
 const properties=['silo-1','silo-2','silo-3','silo-4','dairy'].map(slug=>({slug,name:'Synthetic '+slug,url:'http://127.0.0.1:4173/'+slug+'/',capacity:4,bedrooms:1,beds:2,connected:true}));
 await page.setContent('<div class="ssb-app" data-ssb-config></div>');await page.locator('[data-ssb-config]').evaluate((el,properties)=>el.dataset.ssbConfig=JSON.stringify({type:'related',property:'silo-2',properties}),properties);await page.addScriptTag({content:readFileSync('wordpress/plugins/silosuites-booking/assets/booking.js','utf8')});assert.equal(await page.locator('.ssb-card').count(),2);assert.equal(await page.locator('.ssb-card').filter({hasText:'Synthetic silo-2'}).count(),0);assert.equal(await page.getByRole('link',{name:'View all properties →'}).count(),1);
 assert.deepEqual(errors,[]);console.log('PASS: all five property galleries have five distinct matching photos; one large/four small on desktop, all five visible on phones; title ratings; honest Dairy empty state; two alternatives; View all properties; gallery modal; shared rating/review request; no reference-site content.');
}finally{await browser.close();}
