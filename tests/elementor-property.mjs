import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.SILO_PLAYWRIGHT_MODULE||'playwright');
const pages=JSON.parse(await readFile('test-results/property-elementor-pages.json','utf8'));
const browser=await chromium.launch({headless:true,executablePath:process.env.SILO_CHROME_EXECUTABLE});
const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(12000);
const base='http://127.0.0.1:4190';
try {
 for(const [kind,data] of Object.entries(pages)) {
  await p.goto(data.url,{waitUntil:'networkidle'});
  assert.equal(await p.locator('h1').innerText(),'Silo Suite 2');
  assert.equal(await p.locator('.sp-gallery .elementor-widget-image').count(),5);
  assert.equal(await p.locator('.sp-subnav').isVisible(),false);
  assert.equal((await p.locator('.sp-subnav a').first().innerText()).trim(),'Overview');
  assert.equal(await p.locator('.sp-dialog').count(),5);
  await p.getByRole('link',{name:'See all amenities'}).click();
  const modal=p.locator('#sp-popup-amenities-dialog');
  await modal.waitFor({state:'visible'});
  assert.equal(await modal.locator('.elementor-widget-text-editor li').count(),14);
  if (kind==='property' && process.env.SILO_QA_SAVED_POPUP==='1') {
   const edited=modal.getByRole('heading',{name:'Amenities edited and saved'});await edited.waitFor();
   assert.equal(await edited.evaluate(el=>getComputedStyle(el).color),'rgb(18, 52, 86)');
   assert.equal(await edited.evaluate(el=>getComputedStyle(el).fontSize),'29px');
  }
  await p.screenshot({path:`test-results/elementor-${kind}-amenities.png`});
  await p.keyboard.press('Escape');
  await modal.waitFor({state:'hidden'});
  for(const label of ['More about this stay','House rules','Cancellation policy']) {
   await p.getByRole('link',{name:label}).click();
   await p.locator('dialog[open]').waitFor();await p.keyboard.press('Escape');
  }
  await p.locator('.sp-gallery > .elementor-widget-button a').click();
  assert.equal(await p.locator('#sp-gallery-dialog img').count(),5);await p.keyboard.press('Escape');
  await p.locator('#sp-amenities').evaluate(el=>el.scrollIntoView({behavior:'instant'}));
  await p.waitForFunction(()=>document.querySelector('.sp-property').classList.contains('sp-nav-on'));
  await p.locator('.sp-subnav a[href="#sp-location"]').click();
  await p.locator('.sp-map[data-ready=true]').waitFor();
  await p.locator('.sp-map .leaflet-tile-loaded').first().waitFor({timeout:20000});
  await p.locator('.sp-preview-form input[name=check_in]').fill('2027-02-01');
  await p.locator('.sp-preview-form input[name=check_out]').fill('2027-02-03');
  await p.locator('.sp-preview-form button').click();
  assert.match(await p.locator('.sp-form-status').innerText(),/No booking has been created/);
  // Decode only the native editorial photos; Leaflet owns its changing tile nodes.
  for(const img of await p.locator('.sp-property .elementor-widget-image img').all()) {
   if(await img.isVisible()){await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());}
  }
  await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await p.screenshot({path:`test-results/elementor-${kind}-desktop.png`,fullPage:true});
  for(const width of [768,390,320]) {
   await p.setViewportSize({width,height:844});
   await p.goto(data.url,{waitUntil:'networkidle'});
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1,`${kind} overflow ${width}`);
   await p.getByRole('link',{name:'See all amenities'}).click();
   await p.locator('#sp-popup-amenities-dialog').waitFor({state:'visible'});
   assert.ok(await p.locator('#sp-popup-amenities-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
   if(width===390)await p.screenshot({path:`test-results/elementor-${kind}-popup-mobile.png`});
   await p.keyboard.press('Escape');
  }
  await p.setViewportSize({width:1440,height:1000});
 }
 assert.deepEqual(errors,[]);
 if(process.env.SILO_QA_PASSWORD) {
  await p.goto(base+'/wp-login.php');await p.locator('#user_login').fill('siloqa');await p.locator('#user_pass').fill(process.env.SILO_QA_PASSWORD);await p.locator('#wp-submit').click();await p.waitForURL(/wp-admin/);
  await p.goto(`${base}/wp-admin/post.php?post=${pages.property.id}&action=elementor`,{waitUntil:'domcontentloaded'});
  const preview=p.frameLocator('#elementor-preview-iframe');
  await preview.locator('h1.elementor-heading-title').waitFor({timeout:60000});
  await p.locator('#elementor-loading').waitFor({state:'hidden',timeout:60000});
  assert.equal(await preview.locator('.sp-runtime').count(),0);
  assert.equal(await preview.locator('.sp-popup-source').count(),4);
  const title=preview.locator('#sp-popup-amenities > .elementor-widget-heading .elementor-heading-title');
  await title.scrollIntoViewIfNeeded();await title.click();
  const field=p.locator('textarea[data-setting=title]');await field.waitFor();
  const original=await field.inputValue();
  await field.fill('');await field.pressSequentially('Client edited amenities');await field.dispatchEvent('change');await field.press('Tab');
  await preview.getByRole('heading',{name:'Client edited amenities',exact:true}).waitFor();
  await p.screenshot({path:'test-results/elementor-property-popup-editor.png'});
  await field.fill(original);await field.dispatchEvent('change');await field.press('Tab');
 }
 console.log('PASS: actual Elementor import rendering, native popup content, gallery, sticky Overview nav, map tiles, preview form, phone layouts; native popup heading edits update in the real Elementor editor.');
} catch(e) {await p.screenshot({path:'test-results/elementor-property-failure.png',fullPage:true});await writeFile('test-results/elementor-property-failure.html',await p.content());console.log(errors);throw e;} finally {await browser.close();}
