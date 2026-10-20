"""Production Next.js browser regressions with synthetic league projections only."""
from pathlib import Path
from urllib.parse import urlparse
import base64, json, os
from playwright.sync_api import sync_playwright
origin = os.environ['HOME_REVIEW_ORIGIN']
out = Path(os.environ.get('HOME_FIDELITY_EVIDENCE','/tmp/goat-home-fidelity'))
out.mkdir(parents=True, exist_ok=True)
report = {'transport':'production Next.js', 'checks':[], 'page_errors':[], 'writes':[], 'external':[]}
avatar = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')

def route_request(route):
 request = route.request
 host = urlparse(request.url).hostname
 if request.method != 'GET':
  report['writes'].append(request.url); return route.abort()
 if host == 'sleepercdn.com': return route.fulfill(content_type='image/png', body=avatar)
 if host != '127.0.0.1':
  report['external'].append(host); return route.abort()
 return route.continue_()

with sync_playwright() as p:
 browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
 for width in [1440,390,320]:
  for theme in ['light','dark']:
   page = browser.new_page(viewport={'width':width,'height':1000 if width==1440 else 844}, reduced_motion='reduce')
   page.route('**/*', route_request)
   page.on('pageerror',lambda error: report['page_errors'].append({'url':page.url,'message':str(error)}))
   for state in ['member','showcase-public','identity-updated','stats-populated','long-name','image-failure','unplayed']:
    page.goto(f'{origin}/?state={state}', wait_until='domcontentloaded')
    page.wait_for_function("document.documentElement.dataset.reviewHydrated === 'true'")
    page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
    page.evaluate('document.fonts.ready')
    page.evaluate("document.querySelectorAll('img').forEach(img=>img.loading='eager')")
    page.wait_for_function("[...document.images].every(img=>img.complete)")
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'page overflow {state}/{width}/{theme}'
    surface = page.locator('[data-courtside-home]')
    if state=='identity-updated':
     assert page.locator('h1').inner_text()=='Renamed Current Club vs Renamed Opponent'
     roster = page.locator('[data-roster-value]')
     assert 'Incoming Current Player' in roster.inner_text()
     assert 'Synthetic 1 Player 1' not in roster.inner_text()
     assert page.locator('img[src*="updated-fixture-avatar"]').count()>=3
     assert 'Model choice: Renamed Opponent' in page.locator('[data-team-desk]').inner_text()
     assert page.locator('[data-faces-strip]').get_by_role('link').filter(has_text='Incoming Current Player').count()==1
     assert page.locator('[data-own-move="true"]').get_by_role('link',name='Renamed Current Club',exact=True).count()==1
    if state=='stats-populated':
     card=page.get_by_role('heading',name='League stats',exact=True).locator('../../..')
     assert card.get_by_text('Closest game',exact=True).count()==1
     overflow=card.evaluate('''card=>{const panel=card.getBoundingClientRect();return [...card.querySelectorAll('*')].filter(node=>{const r=node.getBoundingClientRect();return r.width>0&&(r.left<panel.left-1||r.right>panel.right+1)}).map(node=>node.textContent)}''')
     assert not overflow, f'stats panel clipping {width}/{theme}: {overflow}'
     page.screenshot(path=str(out/f'stats-{width}-{theme}.png'),full_page=True)
     from PIL import Image
     rect=card.evaluate('node=>{const r=node.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,w:r.width,h:r.height}}')
     full=Image.open(out/f'stats-{width}-{theme}.png')
     full.crop((int(rect['x']),int(rect['y']),int(rect['x']+rect['w']),int(rect['y']+rect['h']))).save(out/f'stats-panel-{width}-{theme}.png')
    elif state!='image-failure':
     assert page.get_by_text('No completed-game stats yet.',exact=False).count()==1
     assert page.get_by_text('Biggest blowout',exact=True).count()==0
    if state=='unplayed':
     assert 'Current score' in page.locator('[data-team-desk]').inner_text()
     assert 'Final' not in page.locator('[data-ai-decides]').inner_text()
     assert 'Final' not in page.locator('h1').locator('..').inner_text()
    if state=='image-failure':
     try:
      page.wait_for_function("document.querySelectorAll('[data-roster-value] [role=img][aria-label*=unavailable]').length===3",timeout=2000)
     except Exception:
      print(json.dumps({'state':state,'width':width,'portraits':page.locator('[data-roster-value] [data-editorial-portrait]').evaluate_all("nodes=>nodes.map(node=>({html:node.innerHTML,images:[...node.querySelectorAll('img')].map(img=>({src:img.getAttribute('src'),complete:img.complete,naturalWidth:img.naturalWidth}))}))")}),flush=True)
      raise
     assert page.locator('[data-roster-value] [role="img"][aria-label*="unavailable"]').count()==3
     assert page.locator('[data-roster-value] img').count()==0
    if state=='member':
     disclosure=page.locator('[data-hero-valuation]')
     disclosure.locator('summary').click()
     assert disclosure.locator('li').count()==4
     link=page.locator('[data-team-desk] nav').get_by_role('link',name='My team',exact=True)
     link.focus()
     assert link.evaluate('node=>node===document.activeElement&&parseFloat(getComputedStyle(node).outlineWidth)>=2')
     assert all(a.bounding_box()['height']>=44 for a in page.locator('[data-team-desk] nav a').all())
     assert all(a.bounding_box()['height']>=44 for a in page.locator('[data-roster-value] ul').first.locator('a').all())
     portraits=page.locator('[data-roster-value] img')
     assert portraits.count()==3
     assert portraits.evaluate_all("nodes=>nodes.every(img=>getComputedStyle(img).borderTopWidth==='0px'&&getComputedStyle(img).borderRadius==='0px')")
     # Faces cards and team-avatar links survive the portrait-only change.
     assert page.locator('[data-faces-strip] li').count()==10
     # A real Next RSC navigation refreshes props in the existing client tree.
     page.locator('[data-identity-fixture]').click()
     page.wait_for_function("document.querySelector('h1')?.textContent==='Renamed Current Club vs Renamed Opponent'")
     assert 'Incoming Current Player' in page.locator('[data-roster-value]').inner_text()
     assert 'Synthetic 1 Player 1' not in page.locator('[data-roster-value]').inner_text()
     assert page.locator('img[src*="updated-fixture-avatar"]').count()>=3
     assert 'Model choice: Renamed Opponent' in page.locator('[data-team-desk]').inner_text()
     report['checks'].append({'state':'member-to-current-identity-RSC','width':width,'theme':theme})
    assert page.locator('[data-champion-showcase]').count()==0
    report['checks'].append({'state':state,'width':width,'theme':theme})
   page.close()
 # Exercise normal motion as well as the reduced-motion matrix.
 page=browser.new_page(viewport={'width':390,'height':844},reduced_motion='no-preference')
 page.route('**/*',route_request)
 page.on('pageerror',lambda error:report['page_errors'].append({'url':page.url,'message':str(error)}))
 page.goto(f'{origin}/?state=member',wait_until='domcontentloaded')
 page.wait_for_function("document.documentElement.dataset.reviewHydrated === 'true'")
 assert page.locator('[data-roster-value]').is_visible()
 report['checks'].append({'state':'member','width':390,'motion':'no-preference'})
 browser.close()
assert not report['page_errors'],report['page_errors']
assert not report['writes'],report['writes']
assert not report['external'],report['external']
(out/'next-browser.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'browser_checks':len(report['checks']),'page_errors':report['page_errors'],'writes':report['writes'],'external':report['external']}))
