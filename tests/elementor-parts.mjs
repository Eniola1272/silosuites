import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.SILO_PLAYWRIGHT_MODULE||'playwright');
const pages=JSON.parse(await readFile('test-results/elementor-parts-pages.json','utf8'));
const browser=await chromium.launch({headless:true,...(process.env.SILO_CHROME_EXECUTABLE?{executablePath:process.env.SILO_CHROME_EXECUTABLE}:{})});
const page=await browser.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
  for(const [part,data]of Object.entries(pages)){
    for(const width of [1440,768,390,320]){
      await page.setViewportSize({width,height:900});
      await page.goto(data.url,{waitUntil:'networkidle'});
      const section=page.locator('.ss-site-'+part);
      await section.waitFor();
      assert.equal(await page.locator('h1').count(),0);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1,part+' overflow at '+width);
      await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
      assert.equal(await section.locator('img').count(),1);
      const story=section.getByRole('link',{name:'Our story',exact:true});
      if(width>767||part==='footer')assert.equal(await story.getAttribute('href'),'http://127.0.0.1:4190/#our-story');
      if(part==='header'){
        assert.equal(await section.getByRole('link',{name:/^Book your stay/}).getAttribute('href'),'http://127.0.0.1:4190/#ss-find-stay');
        if(width<=767){
          const menu=section.locator('.ss-mobile-menu');
          await menu.locator('summary').click();assert.equal(await menu.evaluate(e=>e.open),true);
          await page.keyboard.press('Escape');assert.equal(await menu.evaluate(e=>e.open),false);
        }
      }else assert.equal(await section.getByRole('link',{name:'435 586 8658',exact:true}).getAttribute('href'),'tel:+14355868658');
      if(width===1440||width===390)await section.screenshot({path:`test-results/${part}-${width}-0.1.1.png`});
    }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: independent header/footer imports render with local logos, responsive widths 320–1440px, homepage navigation, phone link, mobile menu open/Escape, and no JavaScript errors.');
}finally{await browser.close()}
