"""Actual Next calendar-window checks with explicitly synthetic dated history."""
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
import base64,json,subprocess,sys,traceback
from datetime import datetime
out=Path(sys.argv[1]).resolve();origin=sys.argv[2]
report=dict(synthetic=True,cases=[],errors=[],external=[],writes=[])
pixel=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
def guard(route):
 r=route.request;host=urlparse(r.url).hostname
 if r.method!='GET':report['writes'].append(r.url);return route.abort()
 if host=='sleepercdn.com':return route.fulfill(content_type='image/png',body=pixel)
 if host!='127.0.0.1':report['external'].append(r.url);return route.abort()
 route.continue_()
def geometry(h):return h.evaluate('''n=>{const b=n.getBoundingClientRect();return{width:b.width,page:document.documentElement.scrollWidth,viewport:innerWidth,escapes:[...n.querySelectorAll('*')].filter(x=>{const r=x.getBoundingClientRect();return x.checkVisibility()&&r.width>1&&(r.left<b.left-1||r.right>b.right+1)}).map(x=>x.tagName)}}''')
expected={'1W':'2026-11-16','1M':'2026-10-23','3M':'2026-08-23','6M':'2026-05-23','YTD':'2026-01-01','1Y':'2025-11-23','All days':'2025-10-20'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,scale,failed,edge in [(390,100,False,False),(320,100,False,False),(320,200,False,False),(1440,100,False,False),(320,200,True,False),(390,100,False,True)]:
  c=dict(width=width,rootText=scale,summaryFailure=failed,nextDayCurrent=edge,checks=[]);report['cases'].append(c)
  q=b.new_page(viewport=dict(width=width,height=1000),is_mobile=width<600,has_touch=width<600,reduced_motion='reduce');q.set_default_timeout(12000);q.route('**/*',guard);q.on('pageerror',lambda e:report['errors'].append(str(e)))
  calls=[];q.on('request',lambda r:calls.append(r.url) if '/api/team-value-history/summary' in r.url else None)
  if failed:q.route('**/api/team-value-history/summary?*',lambda r:r.fulfill(status=503,content_type='application/json',body='{"error":"synthetic unavailable"}'))
  try:
   q.set_extra_http_headers({'x-review-state':'stats-populated','x-review-current-next-day':'1' if edge else '0','x-review-run':f'ranges-{width}-{scale}-{failed}'})
   assert q.goto(origin+'/',wait_until='domcontentloaded').status==200
   q.wait_for_function("document.documentElement.dataset.reviewHydrated==='true'")
   q.evaluate('(s)=>document.documentElement.style.fontSize=s+"%"',scale)
   h=q.locator('[data-team-value-history]');group=h.get_by_role('group',name='Calendar range');readout=h.locator('[data-history-readout]');coverage=h.locator('[data-history-range-coverage]');q.wait_for_timeout(250);assert not calls
   assert group.get_by_role('button').count()==7 and '$110.00' in readout.inner_text()
   for label,start in expected.items():
    if failed and label!='1W':break
    button=group.get_by_role('button',name=label,exact=True);button.focus();button.press('Enter')
    if failed:
     h.get_by_text('More history could not be loaded. Existing points remain available.',exact=True).wait_for()
     assert 'Range coverage incomplete' in coverage.inner_text() and 'No supported historical values' not in coverage.inner_text()
     assert h.locator('[data-history-point]').count()==0
     c['checks'].append('failed lazy range read remains incomplete, never silently empty or zero');break
    q.wait_for_function("n=>n.textContent.includes('Missing dates stay unpriced.')||n.textContent.includes('No supported historical values in this range.')",arg=coverage.element_handle())
    assert button.get_attribute('aria-pressed')=='true'
    if edge:assert h.locator('[data-history-current]').count()==0
    assert button.evaluate('n=>n===document.activeElement')
    assert float(button.evaluate('n=>getComputedStyle(n).outlineWidth')[:-2])>=2
    assert button.bounding_box()['height']>=44
    assert readout.locator('strong').inner_text()!='$110.00'
    slider=h.locator('[role=slider]');slider.focus();slider.press('Home')
    q.wait_for_function('(d)=>document.querySelector("[role=slider]").getAttribute("aria-valuenow")==="0"',arg=start)
    expected_date=datetime.strptime(start,'%Y-%m-%d').strftime('%b %-d, %Y')
    assert expected_date in readout.inner_text(),(start,readout.inner_text())
    assert expected_date in coverage.inner_text(),coverage.inner_text()
    days=(datetime(2026,11,23)-datetime.strptime(start,'%Y-%m-%d')).days
    assert int(slider.get_attribute('aria-valuemax'))==days-1,(label,slider.get_attribute('aria-valuemax'),days)
    if edge:
     slider.press('End')
     assert 'Nov 22, 2026' in readout.inner_text() and 'Current modeled quote' not in readout.inner_text()
    c.setdefault('windows',[]).append(dict(label=label,fromDay=start,coverage=coverage.inner_text(),points=h.locator('[data-history-point]').count()))
    if label in ['1W','1M']:
     assert h.locator('[data-history-point]').count()==0 and 'No supported historical values in this range' in coverage.inner_text()
    else:assert h.locator('[data-history-point]').count()==2
    if label=='1M':
     h.get_by_role('button',name='History',exact=True).click()
     q.wait_for_function("document.querySelectorAll('[data-history-point]').length===2")
     assert 'Oct 20, 2026' in readout.inner_text()
     c['checks'].append('History recovers known observations after a loaded empty window')
    if label=='3M':
     h.locator('[data-history-day="2026-10-20"]').tap() if width<600 else h.locator('[data-history-day="2026-10-20"]').click()
     h.locator('[data-history-price-change]').first.wait_for();assert h.locator('[data-history-price-change]').count()==3
     assert h.locator('[data-history-detail]').evaluate("n=>!n.closest('details')")
     assert '+$12.80' in h.locator('[data-history-detail]').inner_text()
     c['geometry']=g=geometry(h);assert g['page']==width and not g['escapes'],g
     q.evaluate('scrollTo(0,0)');target=h.locator('figure') if scale==200 else h
     clip=target.evaluate('n=>{const r=n.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}}')
     q.screenshot(path=str(out/f'ranges-{width}-{scale}{"-edge" if edge else ""}.webp'),clip=clip,full_page=True,type='webp')
   if not failed:
    for url in calls:
     params=parse_qs(urlparse(url).query)
     if params['from']==['2026-10-19']:assert params['toExclusive']==['2026-10-21']
     else:
      assert params['toExclusive']==['2026-11-23']
      assert params['from'][0] in expected.values()
    assert len(calls)>=4
    c['requests']=[{k:v[0] for k,v in parse_qs(urlparse(u).query).items()} for u in calls]
    h.locator('[data-history-current-select]').click();assert '$110.00' in readout.inner_text() and 'Current modeled quote' in readout.inner_text()
    c['checks'].append('all seven UTC bounds, lazy range queries, empty versus incomplete, current/historical distinction, changed cards, touch/keyboard and focus')
  except Exception as e:c['failure']=str(e);c['trace']=traceback.format_exc()
  finally:q.close();(out/'ranges-browser.json').write_text(json.dumps(report,indent=2)+'\n')
 b.close()
root=Path(__file__).resolve().parents[2];report['base']=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
files=['src/surfaces/season-hub/'+x for x in ['TeamValueHistory.tsx','TeamValueHistory.module.css','team-value-history-view.ts']]
report['sourceBlobs']={f:subprocess.check_output(['git','hash-object',f],cwd=root,text=True).strip() for f in files}
(out/'ranges-browser.json').write_text(json.dumps(report,indent=2)+'\n')
assert not any(c.get('failure') for c in report['cases']) and not any(report[k] for k in ['errors','external','writes']),report
print('PASS',len(report['cases']),'actual Next synthetic range journeys')
