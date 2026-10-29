// A bounded source-state browser audit; findings require rendered judgment.
import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
const root='qa/homepage-structures',phase=process.env.GOAT_STRUCT_PHASE||'polished',ids=process.argv.slice(2);
if(!ids.length)throw Error('Pass frozen IDs');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{for(const id of ids){const rows=[];
  for(const device of['desktop','phone'])for(const view of['member','public']){
    const context=await browser.newContext({viewport:{width:device==='desktop'?1440:390,height:device==='desktop'?1000:844},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:4207/${root}/${phase}/${id}/index.html?view=${view}`);
    await page.waitForSelector(`[data-study-ready='${id}']`);await page.evaluate(()=>document.fonts.ready);
    const states=[{id:'boot'},...await page.evaluate(()=>goatStudy.states)];
    for(const state of states){
      if(state.id!=='boot')await page.evaluate(s=>goatStudy.activate(s),state.id);
      await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
      rows.push({device,view,state:state.id,...await page.evaluate(()=>{
        const rgb=s=>{const n=s.match(/[\d.]+/g)?.map(Number);return n?.length>=3?[n[0],n[1],n[2],n[3]??1]:null};
        const luminance=c=>c.slice(0,3).map(n=>{const x=n/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
        const findings=[];
        for(const el of document.querySelectorAll('main *')){
          if(el.closest('[inert],[hidden],:disabled,[aria-disabled=true]')||!el.getClientRects().length||!el.firstChild||![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
          const style=getComputedStyle(el),rect=el.getBoundingClientRect();if(style.visibility==='hidden'||style.opacity==='0'||rect.width<2||rect.height<2)continue;
          let parent=el,bg=null,complex=false;
          while(parent){const css=getComputedStyle(parent),color=rgb(css.backgroundColor);if(css.backgroundImage!=='none'||Number(css.opacity)<1)complex=true;if(color?.[3]>=.99){bg=color;break}parent=parent.parentElement}
          const textPaint=el instanceof SVGTextElement?style.fill:style.color,fg=rgb(textPaint);if(!bg||!fg||fg[3]<.99||complex)continue;
          const a=luminance(fg),b=luminance(bg),contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),large=parseFloat(style.fontSize)>=24||(parseFloat(style.fontSize)>=18.66&&Number(style.fontWeight)>=700),minimum=large?3:4.5;
          if(contrast<minimum)findings.push({tag:el.tagName,id:el.id,class:typeof el.className==='string'?el.className:'',text:el.textContent.trim().slice(0,100),font:style.fontSize,weight:style.fontWeight,foreground:textPaint,background:bg,contrast:Number(contrast.toFixed(2)),minimum});
        }
        const nav=performance.getEntriesByType('navigation')[0],resources=performance.getEntriesByType('resource');
        return{width:innerWidth,scrollWidth:document.documentElement.scrollWidth,contrastCandidates:findings,domNodes:document.querySelectorAll('*').length,canvases:document.querySelectorAll('canvas').length,loadedFontFaces:[...document.fonts].map(f=>({family:f.family,status:f.status})),resources:resources.map(r=>({name:r.name.replace(location.origin,''),bytes:r.transferSize,encodedBytes:r.encodedBodySize,durationMs:Math.round(r.duration)})),localDomContentLoadedMs:Math.round(nav.domContentLoadedEventEnd),performanceScope:'Single local headless pass during concurrent QA load; payload/DOM observations only, not production or physical-phone speed.'};
      }),errors:[...errors]});
    }
    await context.close();
  }
  await mkdir(`${root}/evidence/${phase}/${id}`,{recursive:true});
  await writeFile(`${root}/evidence/${phase}/${id}/rendered-audit.json`,JSON.stringify({id,phase,scope:'Nearest opaque ancestor text contrast candidates, source-state geometry, loaded font/resources; complex image/opacity areas skipped and require pixel review. Not a complete WCAG, AT, performance or cross-browser audit.',rows},null,2)+'\n');
  console.log(JSON.stringify({id,states:rows.length,pageErrors:[...new Set(rows.flatMap(r=>r.errors))],contrastCandidateStates:rows.filter(r=>r.contrastCandidates.length).map(r=>({device:r.device,view:r.view,state:r.state,count:r.contrastCandidates.length}))}));
}}finally{await browser.close()}
