import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const {chromium}=require(process.env.SILO_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.SILO_CHROME_EXECUTABLE});const p=await browser.newPage({viewport:{width:1440,height:1000}});const base='http://127.0.0.1:4190';
try{
 await p.goto(base+'/wp-login.php',{waitUntil:'networkidle'});await p.locator('#user_login').fill('siloqa');await p.locator('#user_pass').fill(process.env.SILO_QA_PASSWORD);await p.locator('#wp-submit').click();await p.waitForURL(/wp-admin/);
 await p.goto(base+'/wp-admin/tools.php?page=silosuites-design',{waitUntil:'networkidle'});
 let requests=0;
 p.on('request',request=>{if(request.url()===base+'/wp-admin/admin-post.php'&&request.method()==='POST'){requests++;assert.match(request.postData(),/ssdi_import_design/);assert.match(request.postData(),/_wpnonce/);}});
 // A network failure must pause with a usable retry, not claim success.
 await p.route('**/wp-admin/admin-post.php',async route=>{await route.abort();await p.unroute('**/wp-admin/admin-post.php');});
 await p.getByRole('button',{name:'Import Silo Suites design',exact:true}).click();
 await p.locator('#ssdi-import-progress').filter({hasText:/could not reach WordPress/i}).waitFor();
 assert.equal(await p.getByRole('button',{name:'Import Silo Suites design',exact:true}).isEnabled(),true);
 await Promise.all([p.waitForNavigation({waitUntil:'networkidle'}),p.getByRole('button',{name:'Continue one step',exact:true}).click()]);
 await p.getByText('Imported successfully. All ten saved templates are ready.',{exact:true}).waitFor({timeout:60000});
 await Promise.all([p.waitForNavigation({waitUntil:'networkidle'}),p.getByRole('button',{name:'Import Silo Suites design',exact:true}).click()]);
 await p.getByText('Imported successfully. All ten saved templates are ready.',{exact:true}).waitFor({timeout:60000});
 assert.equal(await p.locator('.wrap > ul > li').count(),10);
 assert.ok(requests>=3);
 const nojs=await browser.newContext({javaScriptEnabled:false,storageState:await p.context().storageState()});
 const simple=await nojs.newPage();await simple.goto(base+'/wp-admin/tools.php?page=silosuites-design');
 await Promise.all([simple.waitForNavigation({waitUntil:'networkidle'}),simple.getByRole('button',{name:'Continue one step',exact:true}).click()]);
 await simple.getByText('Imported successfully. All ten saved templates are ready.',{exact:true}).waitFor();
 assert.equal(await simple.locator('.wrap > ul > li').count(),10);await nojs.close();
 await p.screenshot({path:'test-results/elementor-batch-import-ready.png',fullPage:true});
 console.log('PASS: real authenticated batched endpoint, nonce-bearing requests, network-failure recovery through a real standard POST, automatic retry, JavaScript-disabled submission, completed status and ten saved templates.');
}catch(error){console.log('Import progress:',await p.locator('#ssdi-import-progress').innerText().catch(()=>''));await p.screenshot({path:'test-results/elementor-batch-failure.png',fullPage:true});throw error;}finally{await browser.close();}
