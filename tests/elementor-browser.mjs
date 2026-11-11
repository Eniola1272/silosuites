import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { todayInUtah, addDays } from '../prototype/booking.mjs';
const require=createRequire(import.meta.url);
const { chromium }=require(process.env.SILO_PLAYWRIGHT_MODULE || 'playwright');
const pages=JSON.parse(await readFile('test-results/elementor-qa-pages.json','utf8'));
const browser=await chromium.launch({headless:true,...(process.env.SILO_CHROME_EXECUTABLE ? {executablePath:process.env.SILO_CHROME_EXECUTABLE} : {})});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
const base='http://127.0.0.1:4190';
async function loadPhotos(){
  for(const img of await page.locator('img').all()){
    await img.scrollIntoViewIfNeeded();
    await img.evaluate(i=>i.decode().catch(()=>{}));
  }
  await page.evaluate(()=>scrollTo(0,0));
}
try{
  for(const [key,data] of Object.entries(pages)){
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(data.url,{waitUntil:'networkidle'});
    assert.equal(await page.locator('h1.elementor-heading-title').count(),1);
    assert.ok(await page.locator('.elementor-widget-heading').count()>20);
    assert.equal(await page.locator('form[data-ss-design-search]').count(),1);
    await loadPhotos();
    assert.equal(await page.locator('img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)),true);
    if(key==='home-complete'){
      await page.screenshot({path:'test-results/elementor-desktop.png',fullPage:true});
      await page.screenshot({path:'test-results/elementor-desktop-top.png'});
      const form=page.locator('form[data-ss-design-search]');
      await form.locator('[name=check_in]').fill(addDays(todayInUtah(),2));
      await form.locator('[name=check_out]').fill(addDays(todayInUtah(),5));
      await form.locator('button').click();
      assert.match(await page.locator('.ss-search-error').innerText(),/not connected/);
      assert.equal(page.url(),data.url);
    }
    for(const width of [1440,1024,768,390,320]){
      await page.setViewportSize({width,height:900});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1,`${key} overflow at ${width}px`);
    }
  }
  await page.goto(pages['home-complete'].url,{waitUntil:'networkidle'});
  await page.setViewportSize({width:390,height:844});
  await loadPhotos();
  await page.screenshot({path:'test-results/elementor-mobile.png',fullPage:true});
  await page.screenshot({path:'test-results/elementor-mobile-top.png'});
  await page.locator('.ss-mobile-menu summary').click();
  assert.equal(await page.locator('.ss-mobile-menu nav').isVisible(),true);
  await page.locator('.ss-mobile-menu summary').click();
  assert.deepEqual(errors,[]);

  if(process.env.SILO_QA_PASSWORD){
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(base+'/wp-login.php');
    await page.locator('#user_login').fill('siloqa');
    await page.locator('#user_pass').fill(process.env.SILO_QA_PASSWORD);
    await page.locator('#wp-submit').click();
    await page.waitForURL(/wp-admin/);
    await page.goto(base+'/wp-admin/tools.php?page=silosuites-design',{waitUntil:'networkidle'});
    assert.equal(await page.getByRole('button',{name:'Import Silo Suites design',exact:true}).count(),1);
    await page.getByRole('button',{name:'Import Silo Suites design',exact:true}).click();
    await page.waitForLoadState('networkidle');
    assert.match(await page.locator('.wrap').innerText(),/Imported successfully/);
    await page.goto(`${base}/wp-admin/post.php?post=${pages['home-complete'].page_id}&action=elementor`,{waitUntil:'domcontentloaded'});
    const preview=page.frameLocator('#elementor-preview-iframe');
    await preview.locator('h1.elementor-heading-title').waitFor({timeout:60000});
    await page.locator('#elementor-loading').waitFor({state:'hidden',timeout:60000});
    await preview.locator('h1.elementor-heading-title').click();
    const title=page.locator('textarea[data-setting="title"]');
    await title.waitFor({timeout:15000});
    const original=await title.inputValue();
    await title.fill('');
    await title.pressSequentially('An editable Elementor headline');
    await title.dispatchEvent('change');
    await title.press('Tab');
    await preview.getByRole('heading',{name:'An editable Elementor headline',exact:true}).waitFor();
    await title.fill(original);
    await title.dispatchEvent('change');
    await title.press('Tab');
    await preview.getByRole('heading',{name:/A little history/}).waitFor();
    await page.screenshot({path:'test-results/elementor-editor.png'});
    console.log('PASS: administrator import form, real Elementor editor, native headline editing, and preview update.');
  }
  console.log('PASS: actual Elementor pages, all imported media, safe date-form preview, mobile navigation, screenshots, and responsive widths 320–1440px.');
}catch(error){
  console.log('Browser errors:',errors);
  await page.screenshot({path:'test-results/elementor-browser-failure.png',fullPage:true});
  await writeFile('test-results/elementor-browser-failure.html',await page.content());
  throw error;
}finally{await browser.close()}
