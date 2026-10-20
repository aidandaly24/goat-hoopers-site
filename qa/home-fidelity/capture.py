"""Synthetic, numeric-loopback homepage visual comparisons; no account/data writes."""
from pathlib import Path
import json, re, os, subprocess, hashlib
from PIL import Image
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
out=Path(os.environ.get('HOME_FIDELITY_EVIDENCE','/tmp/goat-home-fidelity'))
out.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for version,origin in [('before','http://127.0.0.1:4203'),('after',os.environ.get('HOME_REVIEW_ORIGIN','http://127.0.0.1:4202'))]:
  for width in [1440,390,320]:
   for theme in ['light','dark']:
    page=browser.new_page(viewport={'width':width,'height':1000 if width==1440 else 844},reduced_motion='reduce')
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('**/*',lambda r: r.continue_() if r.request.method=='GET' and r.request.url.startswith(('http://127.0.0.1:', 'data:')) else r.abort())
    for mode,state in [('member','showcase'),('public','showcase-public')]:
     page.goto(f'{origin}/?state={state}&reference=1',wait_until='domcontentloaded')
     page.get_by_role('heading').first.wait_for()
     if version=='after' and os.environ.get('HOME_REVIEW_ORIGIN'):
      page.wait_for_function("document.documentElement.dataset.reviewHydrated === 'true'")
     page.evaluate('document.fonts.ready')
     page.evaluate("document.querySelectorAll('img').forEach(img=>img.loading='eager')")
     page.wait_for_function("[...document.images].every(img=>img.complete)")
     page.evaluate('scrollTo(0,0)')
     page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
     page.wait_for_timeout(80)
     stem=f'{version}-{mode}-{width}-{theme}'
     page.screenshot(path=str(out/f'{stem}.png'),full_page=True)
     metrics=page.evaluate('''() => {const root=document.querySelector('[data-courtside-home]');const wrap=root.querySelector('section > div');const r=wrap.getBoundingClientRect();return {viewport:innerWidth,page:document.documentElement.scrollWidth,wrap:{left:r.left,right:r.right,width:r.width}}}''')
     for name,selector in [('roster','[data-roster-value]'),('watch','[data-scouting-notebook]'),('spotlights','[data-stud-chud]'),('faces','[data-faces-strip]'),('league','[data-league-section]')]:
      node=page.locator(selector)
      if node.count():
       rect=node.evaluate('node=>{const r=node.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}}')
       full=Image.open(out/f'{stem}.png')
       full.crop((int(rect['x']),int(rect['y']),int(rect['x']+rect['width']),int(rect['y']+rect['height']))).save(out/f'{stem}-{name}.png')
     results.append({'version':version,'mode':mode,'width':width,'theme':theme,**metrics,'errors':errors[:]})
    page.close()
 browser.close()
revision=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
changed=subprocess.check_output(['git','status','--porcelain'],text=True).splitlines()
(out/'captures.json').write_text(json.dumps({'revision':revision,'dirty':bool(changed),'method':'Baseline Vite versus production Next.js with identical isolated synthetic projections' if os.environ.get('HOME_REVIEW_ORIGIN') else 'Vite synthetic projections','captures':results},indent=2))
print(json.dumps({'captures':len(results),'page_errors':sum(len(r['errors']) for r in results),'overflows':[r for r in results if r['page']>r['width']]}))
