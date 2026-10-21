"""GET-only synthetic actual-Next checks. Usage: browser.py OUTPUT ORIGIN"""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import base64,json,sys,traceback
out=Path(sys.argv[1]).resolve();origin=sys.argv[2]
selected=set(sys.argv[3:])
report={'synthetic':True,'cases':[],'errors':[],'external':[],'writes':[],'failures':[],'observations':[]}
avatar=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
def guard(route):
 r=route.request;host=urlparse(r.url).hostname
 if r.method!='GET':report['writes'].append(r.url);return route.abort()
 if host=='sleepercdn.com':return route.fulfill(content_type='image/png',body=avatar)
 if host!='127.0.0.1':report['external'].append(r.url);return route.abort()
 return route.continue_()
def focus(n):
 n.page.keyboard.press('Tab');n.focus()
 g=n.evaluate('n=>({active:n===document.activeElement,outline:getComputedStyle(n).outlineWidth,style:getComputedStyle(n).outlineStyle,w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})')
 assert g['active'] and float(g['outline'].removesuffix('px'))>=2 and g['style']!='none',g
 return g
def geometry(page):return page.evaluate('''()=>{
 const h=document.querySelector('[data-team-value-history]'),r=h.getBoundingClientRect(),b=n=>{const q=n.getBoundingClientRect();return{x:q.x,y:q.y,w:q.width,h:q.height,right:q.right}};
 return{viewport:innerWidth,scroll:document.documentElement.scrollWidth,history:b(h),plot:b(h.querySelector('[data-history-timeline]')),calendar:b(h.querySelector('[class*=calendarDays]')),date:b(h.querySelector('input[id$="-day"]')),controls:[...h.querySelectorAll('button,input,select,summary')].filter(n=>n.checkVisibility()&&n.getBoundingClientRect().width>0).map(n=>({label:n.getAttribute('aria-label')||n.textContent||n.type,...b(n)})),escapes:[...h.querySelectorAll('*')].filter(n=>{const q=n.getBoundingClientRect();return n.checkVisibility()&&q.width>0&&(q.left<r.left-1||q.right>r.right+1)}).map(n=>({tag:n.tagName,text:n.textContent.slice(0,100),...b(n)}))};}''')
def shot(page,n,name):
 page.evaluate('scrollTo(0,0)')
 clip=n.evaluate('n=>{const r=n.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}}')
 page.screenshot(path=str(out/name),clip=clip,full_page=True,animations='disabled',type='webp')
def openpage(page,run,width,text,theme,mode=None,state='stats-populated'):
 page.set_viewport_size({'width':width,'height':900})
 headers={'x-review-run':run,'x-review-state':state}
 if mode:headers['x-review-detail-mode']=mode
 page.set_extra_http_headers(headers)
 assert page.goto(origin+'/',wait_until='domcontentloaded').status==200
 page.wait_for_function("document.documentElement.dataset.reviewHydrated==='true'")
 page.evaluate('([text,theme])=>{document.documentElement.style.fontSize=text+"%";document.documentElement.dataset.theme=theme}',[text,theme]);page.evaluate('document.fonts.ready')
def save():
 (out/('browser'+('-'+','.join(sorted(selected)) if selected else '')+'.json')).write_text(json.dumps(report,indent=2))
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,text,theme in [(320,100,'light'),(320,200,'light'),(320,200,'dark'),(390,100,'light'),(1440,100,'light')]:
  run=f'graph-{width}-{text}-{theme}'
  if selected and run not in selected:continue
  case={'run':run,'checks':[]};report['cases'].append(case)
  page=browser.new_page(reduced_motion='reduce',is_mobile=width<400,has_touch=width<400);page.route('**/*',guard)
  page.set_default_timeout(10000)
  page.on('pageerror',lambda e:report['errors'].append(str(e)))
  calls=[];page.on('request',lambda r:calls.append(r.url) if '/api/team-value-history/detail?' in r.url else None)
  try:
   openpage(page,run,width,text,theme)
   h=page.locator('[data-team-value-history]');assert h.count()==1
   assert h.get_by_role('button',name='All time',exact=True).get_attribute('aria-pressed')=='true'
   assert '366-day window' in h.locator('[data-history-coverage]').inner_text()
   timeline=h.get_by_role('slider',name='Select a history day',exact=True)
   assert timeline.get_attribute('aria-valuemax')=='365'
   page.wait_for_timeout(250);assert not calls,calls
   case['initial']=g=geometry(page)
   assert g['scroll']==width and not g['escapes'],{k:g[k] for k in ['scroll','history','calendar','date','escapes']}
   assert all(c['h']>=43.9 for c in g['controls']),g['controls']
   if (width,text,theme)==(320,200,'light'):shot(page,h.locator('[class*=calendar]').first,'synthetic-calendar-320-200.webp')
   if width==1440:shot(page,h.locator('[data-team-history-chart]'),'synthetic-chart-1440-100.webp')
   case['timelineFocus']=focus(timeline);timeline.press('Home')
   day=h.get_by_label('Inspect day · UTC',exact=True);assert day.input_value()=='2025-10-20'
   h.locator('[data-history-detail]').wait_for();assert '0 of unknown players priced' in h.locator('[data-history-detail]').inner_text()
   timeline.press('ArrowRight');assert day.input_value()=='2025-10-21'
   timeline.press('End');assert day.input_value()=='2026-10-20'
   timeline.press('PageUp');assert day.input_value()=='2026-10-13'
   # Pointer selection is mapped to calendar days, including an empty month.
   timeline.click(position={'x':g['plot']['w']*.25,'y':g['plot']['h']*.5})
   assert day.input_value()=='2026-01-16',day.input_value()
   h.locator('[data-history-detail]').wait_for()
   assert '0 of unknown players priced' in h.locator('[data-history-detail]').inner_text()
   case['checks'].append('inception/default all-time; missing day pointer/keyboard Home/End/day/week selection; no invented quote')
   month=h.get_by_label('Calendar month',exact=True);month.select_option('2026-10')
   b=h.locator('[data-history-day="2026-10-19"]');case['calendarFocus']=focus(b);b.press('Enter')
   comparison=h.locator('[data-history-comparison]');comparison.wait_for()
   assert 'Since Oct 18, 2026' in comparison.inner_text()
   assert '1 day between observations' in comparison.inner_text()
   assert '+$5.00' in comparison.inner_text() and 'not trade profit' in comparison.inner_text()
   detail=h.locator('[data-history-detail]')
   assert '+$1.66' in detail.locator('[data-player-change]').first.inner_text()
   assert 'Joined this roster between the two observations' in detail.inner_text()
   assert 'Left this roster between observations' in detail.inner_text()
   assert 'Other roster participant' not in detail.locator('[data-move-received]').first.inner_text()
   assert 'Other declared participants: Roster 2, Roster 3' in detail.inner_text()
   assert 'Historical trade net unavailable' in detail.inner_text()
   assert 'Assets in' not in detail.inner_text() and 'Assets out' not in detail.inner_text()
   proof=detail.get_by_text('Price source',exact=True).first;focus(proof);proof.press('Enter')
   assert 'synthetic-quote-2026-10-19-0' in detail.inner_text()
   link=h.get_by_role('button',name='View explanation for Oct 19, 2026');focus(link);link.press('Enter');assert h.locator('[data-history-inspector]').evaluate('n=>n===document.activeElement')
   case['selected']=g=geometry(page);assert g['scroll']==width and not g['escapes'],{k:g[k] for k in ['scroll','history','calendar','date','escapes']}
   if (width,text,theme) in [(320,200,'light'),(1440,100,'light')]:shot(page,h,run+'-detail.webp')
   case['checks'].append('visible selected-day explanation; compatible dated player changes; entry/exit; unscoped trade participants; source proof; contained at text scale')
   # Every month/date stays reachable without prefetching daily rosters.
   assert month.locator('option').count()==13
   month.select_option('2025-10');assert h.locator('[data-history-day]').count()==12
   assert h.locator('[data-history-day="2025-10-20"]').get_attribute('aria-label').endswith('valuation unavailable')
   month.select_option('2026-10')
   zoom=h.get_by_role('button',name='Zoom to dates with values',exact=True);focus(zoom);zoom.press('Enter')
   assert timeline.get_attribute('aria-valuemax')=='111'
   h.get_by_role('button',name='Last 30 days',exact=True).click()
   assert timeline.get_attribute('aria-valuemax')=='29'
   h.get_by_role('button',name='All time',exact=True).click();assert timeline.get_attribute('aria-valuemax')=='365'
   choose=h.locator('summary').filter(has_text='Choose dates').first;focus(choose);choose.press('Enter')
   h.get_by_label('From',exact=True).fill('2026-10-08');h.get_by_label('Through',exact=True).fill('2026-10-19')
   h.get_by_role('button',name='Apply dates',exact=True).press('Enter');assert choose.evaluate('n=>n===document.activeElement')
   assert timeline.get_attribute('aria-valuemax')=='11'
   h.locator('[data-history-changes] button').first.press('Enter');comparison.wait_for()
   case['checks'].append('all months/calendar days reachable; explicit supported zoom/presets/custom range restore; change button opens evidence; focus retained')
   table=page.get_by_role('table',name='League standings')
   rank=table.get_by_role('button',name='Rank:',exact=False);case['rankFocus']=focus(rank);rank.press('Enter')
   assert table.get_by_role('columnheader').first.get_attribute('aria-sort')=='descending'
   if width==1440:
    ticker=page.get_by_role('complementary',name='Live ticker');page.emulate_media(reduced_motion='no-preference')
    pause=ticker.get_by_role('button',name='Pause ticker');focus(pause);pause.press('Enter');assert ticker.get_attribute('data-paused')=='true'
    page.locator('[data-review-utility]').click();page.wait_for_url(origin+'/account');assert page.get_by_role('complementary',name='Live ticker').count()==0
    page.go_back(wait_until='domcontentloaded');page.wait_for_url(lambda u:urlparse(u).path=='/');page.locator('[data-team-value-history]').wait_for()
    page.locator('[data-review-unknown]').click();page.wait_for_url('**/fixture-unmatched-missing/nested');page.get_by_role('heading',name='TICKER_FIXTURE_NOT_FOUND').wait_for();page.wait_for_timeout(250)
    case['unknownRouteTickerCount']=page.get_by_role('complementary',name='Live ticker').count()
    if case['unknownRouteTickerCount']:report['observations'].append('Unknown soft route after account/Back retains ticker; compare baseline separately. Graph/route source scope is recorded in the receipt.')
    case['checks'].append('desktop ticker control and utility/Back restoration; unknown 404 rendered, ticker retention recorded separately')
   case['detailRequests']=len(calls)
  except Exception as e:
   report['failures'].append({'run':run,'error':str(e),'trace':traceback.format_exc()})
   page.screenshot(path=str(out/(run+'-failure.webp')),full_page=True,type='webp')
  finally:page.close();save()
 # Independent failures never erase selected-day evidence or mix generations.
 for mode in ['comparison-unavailable','comparison-changed','unavailable','changed','slow']:
  if selected and mode not in selected:continue
  case={'run':mode,'checks':[]};report['cases'].append(case)
  page=browser.new_page(reduced_motion='reduce');page.route('**/*',guard);page.set_default_timeout(10000)
  page.on('pageerror',lambda e:report['errors'].append(str(e)))
  try:
   openpage(page,mode,320,200,'light',mode)
   h=page.locator('[data-team-value-history]');day=h.get_by_label('Inspect day · UTC',exact=True)
   day.fill('2026-10-19')
   if mode.startswith('comparison-'):
    detail=h.locator('[data-history-detail]');detail.wait_for()
    expected='The previous observation could not be loaded.' if mode=='comparison-unavailable' else 'History changed. Refresh before comparing'
    h.get_by_text(expected,exact=False).wait_for()
    assert 'Synthetic guard' in detail.inner_text() and not h.locator('[data-history-comparison]').count()
    if mode=='comparison-unavailable':
     page.set_extra_http_headers({'x-review-state':'stats-populated','x-review-run':mode})
     detail.get_by_role('button',name='Retry comparison').click();h.locator('[data-history-comparison]').wait_for()
    case['checks'].append('comparison failure keeps selected evidence; no stale delta; bounded retry where valid')
   elif mode=='unavailable':
    retry=h.get_by_role('button',name='Retry day details');retry.wait_for()
    page.set_extra_http_headers({'x-review-state':'stats-populated','x-review-run':mode});retry.click();h.locator('[data-history-comparison]').wait_for()
    case['checks'].append('selected-detail 503 offers retry and recovers')
   elif mode=='changed':
    h.get_by_text('History changed. Refresh the page to inspect the new roster evidence.',exact=True).wait_for()
    assert not h.locator('[data-history-detail]').count()
    case['checks'].append('selected-detail 409 fails closed without another-generation detail')
   else:
    h.locator('[data-history-comparison]').wait_for()
    day.fill('2026-10-16');page.wait_for_timeout(250);day.fill('2026-10-15')
    h.get_by_role('heading',name='Player values on Oct 15, 2026').wait_for();page.wait_for_timeout(600)
    assert h.get_by_role('heading',name='Player values on Oct 15, 2026').count()==1
    case['checks'].append('rapid selection cancels stale response; last selected date wins')
  except Exception as e:report['failures'].append({'run':mode,'error':str(e),'trace':traceback.format_exc()})
  finally:page.close();save()
 browser.close()
assert not report['failures'] and not report['errors'] and not report['writes'] and not report['external'],str([(f['run'],f['error'][:400]) for f in report['failures']]) or str(report['errors'])
print('PASS',len(report['cases']),'synthetic actual Next consumer cases; observations:',len(report['observations']))
