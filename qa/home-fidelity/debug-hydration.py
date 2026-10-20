import os,json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for state in ['member','showcase','showcase-public','long-name','image-failure']:
  page=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)+'\n'+e.stack))
  page.on('console',lambda m:errors.append('CONSOLE '+m.text) if m.type=='error' else None)
  page.route('**/*',lambda r:r.continue_() if r.request.method=='GET' and r.request.url.startswith('http://127.0.0.1:') else r.abort())
  page.goto(f"{os.environ['HOME_REVIEW_ORIGIN']}/?state={state}",wait_until='networkidle')
  page.wait_for_function("document.documentElement.dataset.reviewHydrated === 'true'")
  print(json.dumps({'state':state,'errors':errors}),flush=True)
  page.close()
 browser.close()
