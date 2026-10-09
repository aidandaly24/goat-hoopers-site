import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]));
const origin=process.argv[4] ?? 'http://127.0.0.1:8830',out='qa/transactions/evidence';
await mkdir(out,{recursive:true});const profile=await mkdtemp(tmpdir()+'/goat-transactions-next-');
const receipt={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),origin,method:'Installed Mac Chrome, unique profile/debug port; production-built real Next router and repaired source; synthetic props, directory/profile adapters; no auth or external data',checks:[],pageErrors:[],blocked:[]};
let context;
try{
 context=await chromium.launchPersistentContext(profile,{executablePath:process.argv[3],headless:true,viewport:{width:1440,height:1000},args:['--remote-debugging-port=0']});receipt.browser=context.browser()?.version();
 await context.route('**/*',r=>{if(r.request().method()==='GET'&&new URL(r.request().url()).origin===origin)return r.continue();receipt.blocked.push(r.request().url());return r.abort();});
 const page=context.pages()[0];page.on('pageerror',e=>receipt.pageErrors.push(e.message));
 const record=s=>{receipt.checks.push(s);console.log(s);};
 const count=async n=>{await page.waitForFunction(n=>document.querySelector('p[aria-live]')?.textContent?.startsWith(n+' '),n);assert.match(await page.locator('p[aria-live]').textContent(),new RegExp('^'+n+' transactions?'));};
 const visit=async q=>{await page.goto(origin+'/transactions'+q,{waitUntil:'domcontentloaded'});await page.getByLabel('Filter by team').waitFor();};
 const shot=async n=>page.screenshot({path:out+'/next-'+n+'.png',fullPage:false});
 await visit('');await count(26);record('Plain global Transactions is unfiltered');
 await page.getByLabel('Filter by team').selectOption('707');await count(3);assert.equal(new URL(page.url()).searchParams.get('team'),'707');await page.reload({waitUntil:'domcontentloaded'});await count(3);record('Team filter URL and refresh restore three moves');
 await page.getByRole('link',{name:'Copper Comets',exact:true}).first().click();await page.getByRole('heading',{name:'Copper Comets',exact:true}).waitFor();await page.goBack({waitUntil:'domcontentloaded'});await count(3);await page.goForward({waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'Copper Comets',exact:true}).waitFor();await page.goBack({waitUntil:'domcontentloaded'});await count(3);record('Actual Next public profile departure, Back and Forward preserve team state');await shot('desktop-team-back');
 await visit('?team=707&utm=first&utm=second#wire');await count(3);const filterRequests=[];const track=r=>{if(new URL(r.url()).pathname==='/transactions')filterRequests.push(r.url());};page.on('request',track);await page.getByRole('button',{name:'Trades',exact:true}).click();await count(0);await page.waitForTimeout(250);page.off('request',track);assert.deepEqual(filterRequests,[]);let u=new URL(page.url());assert.deepEqual(u.searchParams.getAll('utm'),['first','second']);assert.equal(u.hash,'#wire');assert.equal(u.searchParams.get('type'),'trade');record('Native Next query update preserves repeated unrelated keys/hash with no route refetch');
 await page.goBack({waitUntil:'domcontentloaded'});await count(3);await page.goForward({waitUntil:'domcontentloaded'});await count(0);record('Filter-selection Back/Forward restores each query state');
 await page.getByRole('link',{name:'League Transactions',exact:true}).click();await count(26);assert.equal(new URL(page.url()).search,'');record('Global tool returns to plain league context');
 await visit('?team=unknown&type=unknown');await count(26);assert.equal(await page.getByLabel('Filter by team').inputValue(),'all');assert.equal(await page.getByRole('button',{name:'All',exact:true}).getAttribute('aria-pressed'),'true');record('Unknown team/type validate to All');
 await visit('?season=2031&type=trade&team=703');await count(5);await page.reload({waitUntil:'domcontentloaded'});await count(5);record('Direct/reloaded archive filter includes pick-only participants');
 await visit('?season=2031&type=waiver');await count(4);record('Failed synthetic waiver is absent from successful activity');
 await page.goto(origin+'/teams',{waitUntil:'domcontentloaded'});await page.getByRole('link',{name:'Copper Comets',exact:true}).click();await page.getByRole('link',{name:'Transactions for Copper Comets',exact:true}).click();await count(3);await page.getByRole('link',{name:'Teams',exact:true}).click();await page.getByRole('heading',{name:'Teams',exact:true}).waitFor();await page.goBack({waitUntil:'domcontentloaded'});await count(3);await page.goBack({waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'Copper Comets',exact:true}).waitFor();record('Teams → public profile → explicit team-filtered Transactions → Teams and Back');
 for(const width of [1440,390,320])for(const enlarged of [false,true]){
  await page.setViewportSize({width,height:1000});await visit('?season=2031&team=703&type=trade');await count(5);await page.evaluate(e=>document.documentElement.style.fontSize=e?'200%':'100%',enlarged);
  const g=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,nan:document.body.textContent.includes('NaN'),controls:[...document.querySelectorAll('button,select')].map(e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height,x:r.x,right:r.right};})}));assert.ok(g.scroll<=g.width+1);assert.equal(g.nan,false);for(const c of g.controls){assert.ok(c.height>=44&&c.width>=44);assert.ok(c.x>=0&&c.right<=width+1);}record(`Real Next ${width}px ${enlarged?'200%':'100%'} text reflow`);if(!enlarged)await shot(width+'-trade');
 }
 await visit('?team=707');await count(3);await page.getByRole('button',{name:'Trades',exact:true}).focus();await page.keyboard.press('Enter');await count(0);record('Keyboard type filter updates canonical state');
 assert.deepEqual(receipt.pageErrors,[]);assert.deepEqual(receipt.blocked,[]);receipt.result='PASS';
}catch(e){receipt.result='FAIL';receipt.error=e.stack;await context?.pages()[0]?.screenshot({path:out+'/next-failure.png'});throw e;}finally{await context?.close();await rm(profile,{recursive:true,force:true});await writeFile(out+'/next-receipt.json',JSON.stringify(receipt,null,2)+'\n');}
