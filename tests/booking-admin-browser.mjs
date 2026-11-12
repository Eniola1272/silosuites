import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const {chromium}=require(process.env.SILO_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.SILO_CHROME_EXECUTABLE});
const p=await browser.newPage({viewport:{width:1360,height:1000}});const base='http://127.0.0.1:4190';
try{
 await p.goto(base+'/wp-admin/tools.php?page=silosuites-booking');assert.match(p.url(),/wp-login/);
 const denied=await p.request.post(base+'/wp-admin/admin-post.php',{form:{action:'ssb_discover'}});assert.equal(denied.status(),400);
 await p.locator('#user_login').fill('siloqa');await p.locator('#user_pass').fill(process.env.SILO_QA_PASSWORD);await p.locator('#wp-submit').click();await p.waitForURL(/wp-admin/);
 await p.goto(base+'/wp-admin/tools.php?page=silosuites-booking',{waitUntil:'networkidle'});
 assert.match(await p.locator('.wrap').innerText(),/checkout and booking sync are not enabled/);
 assert.equal(await p.getByRole('button',{name:'Check Hostaway connection and listings'}).isDisabled(),true);
 assert.equal(await p.locator('select[name^="mapping"]').count(),6);
 assert.equal(await p.locator('input[type=password]').count(),0);
 const missingNonce=await p.request.post(base+'/wp-admin/admin-post.php',{form:{action:'ssb_discover'}});assert.equal(missingNonce.status(),403);
 await p.screenshot({path:'test-results/booking-plugin-admin.png',fullPage:true});
 console.log('PASS: administrator diagnostics, six property mapping slots, missing-config state, anonymous request denial, nonce enforcement; no credential form or live connection performed.');
}finally{await browser.close();}
