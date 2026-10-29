import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:390,height:844}});
await page.goto('http://localhost:4207/qa/homepage-structures/homepage-corrections/05/');await page.waitForFunction(()=>document.body.dataset.homepageReady==='05');
const fonts=await page.evaluate(()=>({anton:document.fonts.check('16px "Fact Anton"'),dmSans:document.fonts.check('16px "Fact DM Sans"')}));
await page.locator('[data-origin="wall-value"]').click();const running=await page.evaluate(()=>document.getAnimations().length);await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(40);const stopped=await page.evaluate(()=>document.getAnimations().length);
await page.locator('#zoom-back').click();await page.waitForFunction(()=>document.body.dataset.studyState==='default');
await page.locator('#provenance summary').click();await page.evaluate(()=>document.documentElement.style.fontSize='200%');const provenance=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,open:document.getElementById('provenance').open}));
const result={fonts,pointerMotionAnimations:running,liveReducedMotionAnimations:stopped,expandedProvenance200:provenance};await fs.writeFile(new URL('./finish-checks.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await browser.close();
