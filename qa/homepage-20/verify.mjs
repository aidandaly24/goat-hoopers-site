import assert from 'node:assert/strict';
import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const phase=['iterations','repairs'].includes(process.env.GOAT_MOCK_PHASE)?process.env.GOAT_MOCK_PHASE:'directions',prefix=phase==='iterations'?'iteration-':phase==='repairs'?'repair-':'';
const ids=process.argv.slice(2);if(!ids.length)throw new Error('Pass submitted direction IDs');
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const results=[];
try{
 for(const id of ids){
  const cases=[];
  for(const view of ['member','public'])for(const state of ['normal','320','text200','stale','missing']){
   const context=await b.newContext({viewport:{width:state==='320'?320:390,height:844},reducedMotion:'reduce'});const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
   const url=`http://127.0.0.1:4198/qa/homepage-20/${phase}/${id}/index.html?view=${view}${['stale','missing'].includes(state)?`&ai=${state}`:''}`;
   try{
    await p.goto(url);await p.waitForSelector(`[data-mock-ready="${id}"]`,{timeout:20000});await p.evaluate(()=>document.fonts.ready);
    if(state==='text200')await p.addStyleTag({content:'html{font-size:200%!important}'});
    const info=await p.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,teams:document.querySelectorAll('[data-team-id]').length,faces:document.querySelectorAll('[data-face]').length,pairs:document.querySelectorAll('[data-ai-pair]').length,personal:document.querySelectorAll('[data-personal]').length,rosters:new Set([...document.querySelectorAll('[data-team-id] a[href^="/player/"]')].map(a=>a.getAttribute('href'))).size,text:document.body.innerText}));
    assert.deepEqual(errors,[]);assert.equal(info.scrollWidth,info.width);assert.equal(info.teams,10);assert.equal(info.faces,10);assert.equal(info.rosters,228);
    if(view==='public')assert.equal(info.personal,0);else assert(info.personal>0);
    if(state==='missing')assert.match(info.text,/unavailable|no saved/i);else assert.equal(info.pairs,5);
    if(state==='stale')assert.match(info.text,/stale|past.week/i);
    assert.match(info.text,/pending/i);assert.match(info.text,/synthetic|sample|fixture/i);
    if(state==='normal'){
     const directory=p.locator('[data-team-id]').first();const summary=directory.locator('summary').first();if(await summary.count()){await summary.focus();await p.keyboard.press('Enter');assert(await directory.locator('a[href^="/player/"]').first().isVisible());}
     const search=p.locator('input[type="search"]').first();if(await search.count()){await search.fill('Embiid');await p.waitForTimeout(60);const visibleTeams=await p.locator('[data-team-id]').evaluateAll(es=>es.filter(e=>e.getClientRects().length&&getComputedStyle(e).display!=='none').length);assert(visibleTeams<=2,`Search left ${visibleTeams} teams`);await search.fill('');}
    }
    cases.push({view,state,pass:true,...Object.fromEntries(Object.entries(info).filter(([k])=>k!=='text')),errors});
   }catch(error){cases.push({view,state,pass:false,error:String(error),errors})}
   await context.close();
  }
  const result={direction:id,cases,passed:cases.filter(x=>x.pass).length,total:cases.length,method:'Root browser audit, static offline fixture; text200 is root-font enlargement, separate from320px reflow. Native disclosures/search exercised when present; no real routes/auth/AT/physical-device claim.'};
  await writeFile(`qa/homepage-20/evidence/${prefix}${id}-verification.json`,JSON.stringify(result,null,2)+'\n');results.push(result);console.log(JSON.stringify({id,pass:result.passed,total:result.total,failures:cases.filter(x=>!x.pass).map(x=>({view:x.view,state:x.state,error:x.error}))}));
 }
}finally{await b.close()}
