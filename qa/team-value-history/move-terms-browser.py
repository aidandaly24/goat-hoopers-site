"""Bounded synthetic production-Next checks for the PR236 consumer follow-through."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import base64,json,sys,traceback
out=Path(sys.argv[1]).resolve();origin=sys.argv[2]
report={'synthetic':True,'cases':[],'errors':[],'writes':[],'external':[],'failures':[]}
avatar=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
def guard(route):
 r=route.request;host=urlparse(r.url).hostname
 if r.method!='GET':report['writes'].append(r.url);return route.abort()
 if host=='sleepercdn.com':return route.fulfill(content_type='image/png',body=avatar)
 if host!='127.0.0.1':report['external'].append(r.url);return route.abort()
 return route.continue_()
def geometry(h):return h.evaluate('''n=>{
 const box=x=>{const r=x.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width,height:r.height}},b=box(n);
 return{root:b,pageWidth:innerWidth,scroll:document.documentElement.scrollWidth,escapes:[...n.querySelectorAll('*')].filter(x=>{const q=box(x);return x.checkVisibility()&&q.width>0&&(q.left<b.left-1||q.right>b.right+1)}).map(x=>({tag:x.tagName,text:x.textContent.slice(0,100),box:box(x)}))};}''')
def focus(x):
 x.page.keyboard.press('Tab');x.focus();s=x.evaluate('n=>({active:n===document.activeElement,outline:getComputedStyle(n).outlineWidth,style:getComputedStyle(n).outlineStyle,height:n.getBoundingClientRect().height})')
 assert s['active'] and float(s['outline'][:-2])>=2 and s['style']!='none',s
 return s
def capture(page,node,name):
 page.evaluate('scrollTo(0,0)');clip=node.evaluate('n=>{const r=n.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}}')
 page.screenshot(path=str(out/name),clip=clip,full_page=True,type='webp',animations='disabled')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,scale in [(1440,100),(390,100),(320,100),(320,200)]:
  case={'width':width,'rootText':scale,'checks':[]};report['cases'].append(case)
  q=b.new_page(viewport={'width':width,'height':900},reduced_motion='reduce');q.route('**/*',guard);q.set_default_timeout(10000)
  q.on('pageerror',lambda e:report['errors'].append(str(e)))
  calls=[];q.on('request',lambda r:calls.append(r.url) if '/api/team-value-history/detail?' in r.url else None)
  headers={'x-review-state':'stats-populated','x-review-run':f'move-terms-{width}-{scale}'};q.set_extra_http_headers(headers)
  try:
   assert q.goto(origin+'/',wait_until='domcontentloaded').status==200
   q.wait_for_function("document.documentElement.dataset.reviewHydrated==='true'");q.evaluate('(s)=>document.documentElement.style.fontSize=s+"%"',scale)
   h=q.locator('[data-team-value-history]');q.wait_for_timeout(250);assert not calls
   day=h.get_by_label('Inspect day · UTC',exact=True);day.fill('2025-11-01')
   d=h.locator('[data-history-detail]');d.wait_for()
   assert 'Valuation unavailable' in h.locator('[data-history-readout]').inner_text()
   assert 'Roster cannot be verified' in d.inner_text() and '0 of unknown players priced' in d.inner_text()
   move=d.locator('[data-history-move]').first
   assert 'Synthetic incoming player with a long readable identity' in move.locator('[data-move-received]').inner_text()
   assert 'Other roster participant' not in move.locator('[data-move-received]').inner_text()
   assert 'Synthetic big' in move.locator('[data-move-sent]').inner_text()
   assert 'Other roster outgoing' not in move.locator('[data-move-sent]').inner_text()
   assert 'Other declared participants: Roster 2, Roster 3' in move.inner_text()
   assert move.locator('[data-pick-direction="received"]').count()==1
   assert move.locator('[data-pick-direction="sent"]').count()==1
   other=move.locator('[data-pick-direction="other"]');assert 'Original roster 1' in other.inner_text() and 'From roster 2' in other.inner_text() and 'To roster 3' in other.inner_text()
   assert 'Season unavailable' in move.inner_text() and 'Recipient unavailable' in move.inner_text()
   assert 'synthetic-source-2025-league-with-a-long-explicit-identifier' in move.inner_text()
   assert '2025-11-01T07:00:00Z' in move.inner_text()
   assert 'Pick terms unavailable' in d.inner_text() and 'No draft picks carried by this record.' in d.inner_text()
   assert '12 FAAB units' in d.inner_text() and '0 FAAB units' in d.inner_text()
   assert 'Historical trade net unavailable' in d.inner_text() and '$0.00' not in d.inner_text()
   source=move.locator('summary').filter(has_text='Move source');case['focus']=focus(source);source.press('Enter');assert 'Synthetic source receipt' in move.inner_text()
   case['earlyGeometry']=g=geometry(h);assert g['scroll']==width and not g['escapes'],g['escapes']
   if (width,scale) in [(1440,100),(320,200)]:capture(q,move,f'move-terms-{width}-{scale}.webp')
   case['checks'].append('2025 ambiguous/unpriced event; own legs scoped; declared IDs; picks received/sent/origin-other/missing; empty-vs-unavailable; whole and zero FAAB; source proof/focus; no overflow')
   # Existing selection and comparison still work with the enriched detail DTO.
   day.fill('2026-10-19');h.locator('[data-history-comparison]').wait_for()
   assert '+$1.66' in h.locator('[data-player-change]').first.inner_text()
   case['pricedGeometry']=g=geometry(h);assert not g['escapes'] and g['scroll']==width,g['escapes']
   timeline=h.get_by_role('slider',name='Select a history day');focus(timeline);timeline.press('ArrowLeft');assert day.input_value()=='2026-10-18'
   case['checks'].append('current supported date comparison and keyboard day selection retained')
   if width==320 and scale==200:
    q.set_extra_http_headers({**headers,'x-review-detail-mode':'slow'});day.fill('2026-10-16');q.wait_for_timeout(250);day.fill('2026-10-15')
    h.get_by_role('heading',name='Player values on Oct 15, 2026').wait_for();q.wait_for_timeout(600);assert h.get_by_role('heading',name='Player values on Oct 15, 2026').count()==1
    q.set_extra_http_headers({**headers,'x-review-detail-mode':'changed'});day.fill('2025-11-03')
    h.get_by_text('History changed. Refresh the page to inspect the new roster evidence.',exact=True).wait_for();assert not h.locator('[data-history-detail]').count()
    case['checks'].append('stale response cancelled and generation409 clears old detail')
   case['detailRequests']=len(calls)
  except Exception as e:report['failures'].append({'width':width,'scale':scale,'error':str(e),'trace':traceback.format_exc()})
  finally:q.close();(out/'move-terms-browser.json').write_text(json.dumps(report,indent=2)+'\n')
 b.close()
assert not any(report[k] for k in ['failures','errors','writes','external']),str(report['failures'] or report['errors'])
print('PASS',len(report['cases']),'synthetic production-Next move-term layouts')
