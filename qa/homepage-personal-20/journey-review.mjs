// Root-owned browser reproduction of concrete, authored user journeys.
// Contracts assert useful content and return behavior, not implementation snapshots.
import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';

const root='qa/homepage-personal-20', portable=process.argv.includes('--catalog');
const ids=process.argv.slice(2).filter(x=>x!=='--catalog');
const contracts=JSON.parse(await readFile(root+'/reviews/root-journey-contracts.json','utf8'));
const fixture=JSON.parse(await readFile(root+'/fixture.json','utf8'));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),results=[];
try{for(const id of ids){
  if(!contracts[id])throw Error('No independently reviewed journey contract for '+id);
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
  page.setDefaultTimeout(8000);
  page.on('pageerror',e=>errors.push(e.message));
  for(const [persona,spec]of Object.entries(contracts[id])){
    const steps=[];
    try{
      const url=`http://127.0.0.1:4207/${root}/${portable?'catalog/portable/GOAT-personal-'+id+'.html':id+'/index.html'}?persona=${persona}`;
      await page.goto(url);await page.waitForSelector(`[data-personal-study-ready="${id}"]`);
      const home=await page.locator('main').innerText();
      for(const pattern of spec.home??[])assert.match(home,new RegExp(pattern,'i'));
      for(const [index,task]of spec.tasks.entries()){
        for(const action of task.before??[]){
          const element=page.locator(action.selector).first();
          if(action.fill!==undefined)await element.fill(action.fill);else if(action.select!==undefined)await element.selectOption(action.select);else await element.click();
        }
        const trigger=page.locator(task.selector).first();await trigger.focus();
        const originScroll=await page.evaluate(()=>scrollY);
        if(task.external){
          assert.equal(await trigger.getAttribute('href'),task.external);
          if(task.target)assert.equal(await trigger.getAttribute('target'),task.target);
          assert.match(await trigger.innerText(),new RegExp(task.expect[0],'i'));
          steps.push({task:task.name,trigger:task.selector,href:task.external,result:'pass',limit:'Verified labelled exit contract without contacting the external service.'});
          continue;
        }
        if(task.select!==undefined)await trigger.selectOption(task.select);
        else if(index===0)await page.keyboard.press('Enter');else await trigger.click();
        for(const action of task.after??[])await page.locator(action).click();
        if(task.url)await page.waitForURL(new RegExp(task.url));
        const detail=page.locator(task.detail??'main');
        await detail.waitFor();
        await page.waitForFunction(({selector,pattern})=>new RegExp(pattern,'i').test(document.querySelector(selector)?.innerText??''),{selector:task.detail??'main',pattern:task.expect[0]});
        const text=await detail.innerText();for(const pattern of task.expect)assert.match(text,new RegExp(pattern,'i'));
        if(task.allOwnedPlayers)for(const player of fixture.personas[persona].players)assert.equal(text.includes(player.name),true,'Owned player missing from complete detail: '+player.name);
        for(const [selector,value]of Object.entries(task.values??{}))assert.equal(await page.locator(selector).inputValue(),value);
        if(task.rows!==undefined)assert.equal(await detail.locator('tbody tr').count(),task.rows);
        if(task.noReturn){}
        else if(task.return==='escape')await page.keyboard.press('Escape');
        else if(task.close)await page.locator(task.close).first().click();
        else await page.goBack();
        if(task.nativeAnchor)await page.waitForFunction(y=>Math.abs(scrollY-y)<3,originScroll);
        else await page.waitForFunction(selector=>document.activeElement?.matches(selector),task.returnFocus??task.selector);
        if(portable)assert.equal(page.url().includes(`GOAT-personal-${id}.html`),true,'Journey left standalone file');
        steps.push({task:task.name,trigger:task.selector,expectedContent:task.expect,returnFocus:task.nativeAnchor?'Native in-page anchor: browser Back restores original scroll; no custom focus override asserted':task.returnFocus??task.selector,activation:task.select!==undefined?'native select':index===0?'keyboard Enter':'pointer',result:'pass'});
      }
      assert.equal(errors.length,0);results.push({id,persona,result:'pass',steps});
    }catch(error){
      await mkdir(root+`/${id}/review`,{recursive:true});const image=root+`/${id}/review/root-journey-failure-${persona}.jpg`;
      await page.screenshot({path:image,type:'jpeg',quality:80});results.push({id,persona,result:'fail',steps,error:error.message,image,errors});
    }
  }
  await page.close();
}}finally{await browser.close()}
const output=root+'/reviews/'+(portable?'catalog-task-review':'source-task-review')+'.json';
let previous=[];try{previous=JSON.parse(await readFile(output,'utf8')).results}catch{}
const merged=[...previous.filter(result=>!ids.includes(result.id)),...results].sort((a,b)=>a.id.localeCompare(b.id)||a.persona.localeCompare(b.persona));
await writeFile(output,JSON.stringify({method:'Root browser reproduction of first useful tasks for each persona. First action uses keyboard Enter, other actions use pointer. Fixture-backed content, local return and exact trigger focus are asserted. Contracts reflect independent product inspection of author-reported task selectors; they do not certify visual diversity or complete accessibility.',scope:portable?'Self-contained catalog files':'Authored source files',limits:'Desktop headless Chromium, synthetic fixtures, no external destination/backend/account/device/AT verification.',results:merged},null,2)+'\n');
console.log(JSON.stringify({passed:results.filter(result=>result.result==='pass').length,total:results.length,failures:results.filter(result=>result.result!=='pass')}));
