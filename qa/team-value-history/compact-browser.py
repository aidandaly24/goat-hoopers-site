"""Focused mobile-first sparse chart, UTC rollover and disclosure checks."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import base64, json, subprocess, sys

out = Path(sys.argv[1]).resolve(); origin = sys.argv[2]
desktop_only = '--desktop-only' in sys.argv[3:]
report = dict(synthetic=True, route='signed-in fixture homepage / -> Your roster.', cases=[], errors=[], external=[], writes=[])
pixel = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
def guard(route):
    r = route.request; host = urlparse(r.url).hostname
    if r.method != 'GET': report['writes'].append(r.url); return route.abort()
    if host == 'sleepercdn.com': return route.fulfill(content_type='image/png', body=pixel)
    if host != '127.0.0.1': report['external'].append(r.url); return route.abort()
    route.continue_()
def geometry(history):
    return history.evaluate('''n=>{const r=n.getBoundingClientRect();return{height:r.height,width:r.width,page:document.documentElement.scrollWidth,viewport:innerWidth,escapes:[...n.querySelectorAll('*')].filter(x=>{const b=x.getBoundingClientRect();return x.checkVisibility()&&b.width>1&&(b.left<r.left-1||b.right>r.right+1)}).map(x=>x.tagName)}}''')

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for width, scale in ([(1440,100)] if desktop_only else [(390,100),(320,100),(320,200),(1440,100)]):
        case = dict(width=width, rootText=scale, checks=[]); report['cases'].append(case)
        page = browser.new_page(viewport=dict(width=width,height=900), is_mobile=width<600, has_touch=width<600, reduced_motion='reduce')
        page.route('**/*', guard); page.on('pageerror', lambda e:report['errors'].append(str(e)))
        calls=[]; responses=[]
        page.on('request', lambda r:calls.append(r.url) if '/api/team-value-history/' in r.url else None)
        page.on('response', lambda r:responses.append(r.status) if '/api/team-value-history/' in r.url else None)
        headers={'x-review-state':'stats-populated','x-review-run':f'compact-{width}-{scale}','x-review-view':'a'}
        page.set_extra_http_headers(headers)
        assert page.goto(origin+'/',wait_until='domcontentloaded').status==200
        page.wait_for_function("document.documentElement.dataset.reviewHydrated==='true'")
        page.get_by_role('heading',name='Your roster.',exact=True).wait_for()
        page.evaluate('(s)=>document.documentElement.style.fontSize=s+"%"',scale)
        h=page.locator('[data-team-value-history]'); t=h.get_by_role('slider',name='Team value timeline',exact=True)
        readout=h.locator('[data-history-readout]'); inspector=h.locator('[data-history-inspector]')
        h.scroll_into_view_if_needed(); page.wait_for_timeout(250)
        assert not calls, calls
        assert t.get_attribute('aria-valuemax')=='14'
        assert 'Oct 21, 2026' in readout.inner_text() and '$123.00' in readout.inner_text()
        assert 'Subtotal' in readout.inner_text() and '1/4 priced' in readout.inner_text()
        assert not inspector.evaluate('n=>n.open') and not h.locator('[data-history-coverage]').is_visible()
        spread=t.evaluate('''n=>{const b=n.getBoundingClientRect(),p=[...n.querySelectorAll('[data-history-day]')].map(x=>x.getBoundingClientRect().x);return{count:p.length,ratio:(Math.max(...p)-Math.min(...p))/b.width}}''')
        assert spread['count']==15 and spread['ratio']>.85, spread
        case['firstView']=g=geometry(h);case['spread']=spread
        assert g['page']==width and not g['escapes'], g
        assert g['height']<(1100 if scale==200 else 650), g
        page.evaluate('scrollTo(0,0)')
        clip=h.evaluate('n=>{const r=n.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}}')
        page.screenshot(path=str(out/f'compact-first-{width}-{scale}.webp'),type='webp',clip=clip,full_page=True)
        case['checks'].append('15 real fixture observations span the initial plot; latest Oct21 partial quote selected after Oct22 UTC rollover; coverage prose collapsed; no eager detail read')

        dot=h.locator('[data-history-day="2026-10-13"]')
        dot.scroll_into_view_if_needed()
        if width<600: dot.tap()
        else:
            box=dot.bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2)
        page.wait_for_function("document.querySelector('[data-history-readout]').textContent.includes('Oct 13, 2026')")
        assert '$360.00' in readout.inner_text() and '4/4 priced' in readout.inner_text() and 'Subtotal' not in readout.inner_text()
        summary=inspector.locator(':scope > summary');summary.focus();summary.press('Enter')
        inspector.get_by_role('heading',name='Player values on Oct 13, 2026',exact=True).wait_for()
        assert inspector.locator('[data-history-player]').count()==4
        assert '2026-10-13T04:00:00.123456Z' in inspector.locator('time').inner_text()
        summary.focus();summary.press('Enter');assert not inspector.get_by_role('heading',name='Player values on Oct 13, 2026',exact=True).is_visible()
        case['checks'].append('tap/hover updates the in-chart date/value/source; native keyboard disclosure reveals exact-time roster detail and closes again')

        h.get_by_role('button',name='All days',exact=True).click();assert t.get_attribute('aria-valuemax')=='367'
        t.focus();t.press('Home');page.wait_for_function("document.querySelector('[data-history-roster-status]')?.textContent.includes('unknown')")
        assert 'Oct 20, 2025' in readout.inner_text() and 'Value not recorded' in readout.inner_text()
        t.press('End');page.wait_for_function("document.querySelector('[data-history-roster-status]')?.textContent.includes('0/4')")
        assert 'Oct 22, 2026' in readout.inner_text() and '$0.00' not in readout.inner_text()
        h.get_by_role('button',name='Values',exact=True).click()
        assert t.get_attribute('aria-valuemax')=='14' and 'Oct 21, 2026' in readout.inner_text()
        t.focus();t.evaluate('n=>n.dataset.compactNode="retained"')
        page.set_extra_http_headers({**headers,'x-review-view':'b'});t.press('PageUp')
        refresh=h.get_by_role('button',name='Refresh history',exact=True);refresh.wait_for();assert 409 in responses
        refresh.focus();refresh.press('Enter')
        page.wait_for_function("document.querySelector('[data-history-readout]').textContent.includes('$371.00')")
        assert 'Oct 14, 2026' in readout.inner_text() and t.get_attribute('aria-valuemax')=='14'
        assert t.evaluate('n=>n.dataset.compactNode==="retained"&&n===document.activeElement')
        h.get_by_role('button',name='All days',exact=True).click();assert t.get_attribute('aria-valuemax')=='368'
        case['checks'].append('full inception-to-today calendar and missing-day counts remain accessible; 409/refresh preserves day, focused viewport and DOM focus across another UTC rollover')
        case['expanded']=g=geometry(h);assert g['page']==width and not g['escapes'],g
        case['requests']=len(calls);page.close()
        (out/'compact-browser-progress.json').write_text(json.dumps(report,indent=2)+'\n')
        print('PASS',width,scale,'compact first view and interaction checks',flush=True)
    browser.close()
root=Path(__file__).resolve().parents[2]
files=['src/surfaces/season-hub/TeamValueHistory.tsx','src/surfaces/season-hub/TeamValueHistoryChart.tsx','src/surfaces/season-hub/TeamValueHistory.module.css','src/surfaces/season-hub/team-value-history-view.ts']
report['sourceBlobs']={f:subprocess.check_output(['git','hash-object',f],cwd=root,text=True).strip() for f in files}
if desktop_only:
    report['reuse']='Three completed mobile cases are recorded in ../mobile-completion.json and its preserved driver/probe/first-view captures. Only desktop remains to run after the QA mouse-scroll correction; no app source changed.'
(out/'compact-browser.json').write_text(json.dumps(report,indent=2)+'\n')
assert len(report['cases'])==(1 if desktop_only else 4) and not any(report[k] for k in ['errors','external','writes']),report
print('PASS compact sparse-chart / UTC-rollover / keyboard / refresh fixture cases:',len(report['cases']))
