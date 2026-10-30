const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const url = 'http://localhost:4207/qa/homepage-browser-20/20/index.html';
  const problems = [];
  page.on('pageerror', e => problems.push(e.message));
  page.on('response', r => { if(r.status() >= 400) problems.push(`${r.status()} ${r.url()}`); });
  async function geometry() {
    return page.evaluate(() => ({
      width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      names: [...document.querySelectorAll('.club-name,.ware-name,.runner-up h3')].map(e => ({name:e.innerText, rect:{x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}})),
      outside: [...document.querySelectorAll('main *,header *')].filter(e => {const r=e.getBoundingClientRect();return r.width && (r.left < -1 || r.right > innerWidth+1)}).map(e=>({tag:e.tagName,class:e.className,text:e.innerText?.slice(0,90)})),
      h1: document.querySelectorAll('h1').length,
      ready: document.documentElement.dataset.browserStudyReady,
      images: [...document.images].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0}))
    }));
  }
  await page.goto(url);
  await page.waitForFunction(() => document.documentElement.dataset.browserStudyReady === '20');
  const wide = await geometry();
  await page.screenshot({path:path.join(__dirname,'desktop-initial.png')});
  const designedGeometry = await page.locator('body').evaluate(e => ({content:e.innerText,rects:[...e.querySelectorAll('main *,header *')].map(n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})}));
  await page.goto(`${url}?stage=structure`);
  await page.waitForFunction(() => document.documentElement.dataset.browserStudyReady === '20');
  const neutralGeometry = await page.locator('body').evaluate(e => ({content:e.innerText,rects:[...e.querySelectorAll('main *,header *')].map(n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})}));
  const stageIdentical = JSON.stringify(designedGeometry) === JSON.stringify(neutralGeometry);
  await page.goto(url);
  await page.waitForFunction(() => document.documentElement.dataset.browserStudyReady === '20');
  await page.setViewportSize({width:1120,height:1000});
  const desktop1120 = await geometry();
  await page.evaluate(() => {const sizes = [...document.querySelectorAll('*')].map(e=>[e,getComputedStyle(e).fontSize]);for(const [e,size] of sizes)e.style.fontSize=`${parseFloat(size)*2}px`;});
  const text200 = await geometry();
  await page.locator('.sources summary').focus();
  const focusVisible = await page.locator('.sources summary').evaluate(e=>({outline:getComputedStyle(e).outlineStyle,width:getComputedStyle(e).outlineWidth,inViewport:e.getBoundingClientRect().top>=0&&e.getBoundingClientRect().bottom<=innerHeight}));
  await page.keyboard.press('Enter');
  const detailsOpen = await page.locator('.sources').evaluate(e=>e.open);
  await page.emulateMedia({reducedMotion:'reduce'});
  const reducedMotion = await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  await page.screenshot({path:path.join(__dirname,'text-enlargement.png')});
  fs.writeFileSync(path.join(__dirname,'checks.json'),JSON.stringify({wide,desktop1120,text200,stageIdentical,focusVisible,detailsOpen,reducedMotion,problems},null,2));
  console.log(JSON.stringify({wide:{width:wide.width,scrollWidth:wide.scrollWidth,height:wide.height,outside:wide.outside},desktop1120:{width:desktop1120.width,scrollWidth:desktop1120.scrollWidth,height:desktop1120.height,outside:desktop1120.outside},text200:{width:text200.width,scrollWidth:text200.scrollWidth,height:text200.height,outside:text200.outside},stageIdentical,focusVisible,detailsOpen,reducedMotion,problems},null,2));
  await browser.close();
})();
