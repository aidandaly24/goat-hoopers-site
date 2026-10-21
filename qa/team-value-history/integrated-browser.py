"""Actual PR244 producer + held consumer through the signed-in homepage with offline sources."""
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from datetime import date
from playwright.sync_api import sync_playwright
import base64, json, subprocess, sys, traceback

out = Path(sys.argv[1]).resolve(); origin = sys.argv[2]
resume = '--membership-only' in sys.argv[3:]
report = dict(syntheticSources=True, actualProducer=True, route='signed-in homepage / → Your roster', cases=[], errors=[], external=[], writes=[], failures=[])
pixel = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')

def guard(route):
    r = route.request; host = urlparse(r.url).hostname
    if r.method != 'GET': report['writes'].append(r.url); return route.abort()
    if host == 'sleepercdn.com': return route.fulfill(content_type='image/png', body=pixel)
    if host != '127.0.0.1': report['external'].append(r.url); return route.abort()
    route.continue_()

def choose(t, day):
    t.focus(); t.press('Home')
    offset = (date.fromisoformat(day)-date(2025,10,20)).days
    for _ in range(offset//7): t.press('PageDown')
    for _ in range(offset%7): t.press('ArrowRight')

def geometry(h):
    return h.evaluate('''n=>{const b=n.getBoundingClientRect();return{width:b.width,scroll:document.documentElement.scrollWidth,viewport:innerWidth,escapes:[...n.querySelectorAll('*')].filter(x=>{const r=x.getBoundingClientRect();return x.checkVisibility()&&r.width>0&&(r.left<b.left-1||r.right>b.right+1)}).map(x=>({tag:x.tagName,text:x.textContent.slice(0,80)}))}}''')

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width,scale in [(1440,100),(320,200)]:
        case=dict(width=width,rootText=scale,checks=[]);report['cases'].append(case)
        q=browser.new_page(viewport=dict(width=width,height=900),has_touch=width<600,is_mobile=width<600,reduced_motion='reduce')
        q.route('**/*',guard);q.set_default_timeout(12000);q.on('pageerror',lambda e:report['errors'].append(str(e)))
        responses=[];q.on('response',lambda r:responses.append(dict(url=r.url,status=r.status)) if '/api/team-value-history/' in r.url else None)
        calls=[];q.on('request',lambda r:calls.append(dict(url=r.url,params=parse_qs(urlparse(r.url).query))) if '/api/team-value-history/' in r.url else None)
        headers={'x-review-state':'stats-populated','x-review-run':f'producer-integrated-{width}-{scale}'}
        def server(view,clock=''):q.set_extra_http_headers({**headers,'x-review-view':view,'x-review-clock':clock})
        def summary(generation):
            return q.evaluate('''async generation=>{const p=new URLSearchParams({teamId:'1',generation,from:'2026-10-01',toExclusive:'2026-10-21'});const r=await fetch('/api/team-value-history/summary?'+p);return{status:r.status,body:await r.json()}}''',generation)
        try:
            server('b' if resume else 'a');assert q.goto(origin+'/',wait_until='domcontentloaded').status==200
            q.wait_for_function("document.documentElement.dataset.reviewHydrated==='true'")
            q.get_by_role('heading',name='Your roster.',exact=True).wait_for()
            q.evaluate('(n)=>document.documentElement.style.fontSize=n+"%"',scale)
            h=q.locator('[data-team-value-history]');t=h.get_by_role('slider',name='Team value timeline',exact=True);d=h.locator('[data-history-detail]')
            q.wait_for_timeout(250);assert not calls
            if not resume:
                h.get_by_role('button',name='Last 30 days',exact=True).click();h.get_by_role('button',name='Zoom to values',exact=True).click()
                dot=h.locator('[data-history-day="2026-10-09"]');dot.scroll_into_view_if_needed()
                if width<600:dot.tap()
                else:
                    box=dot.bounding_box();q.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2)
                d.get_by_role('heading',name='Player values on Oct 9, 2026',exact=True).wait_for()
                assert '$630.00' in h.locator('[data-history-readout]').inner_text()
                generation_a=calls[-1]['params']['generation'][0]
                assert generation_a.startswith('th2:2026-10-20T12:00:00.000Z:')
                first=summary(generation_a);assert first['status']==200
                cutoff=first['body']['asOf'];assert cutoff=='2026-10-20T12:00:00.000Z'
                case['checks'].append('actual signed-in homepage Your roster; hover/tap selects real-producer point/detail with exact price and th2 token')

                server('a','later');later=summary(generation_a)
                assert later['status']==200 and later['body']['generation']==generation_a and later['body']['asOf']==cutoff
                t.focus();t.press('ArrowLeft');d.get_by_role('heading',name='Player values on Oct 8, 2026',exact=True).wait_for()
                assert '$600.00' in h.locator('[data-history-readout]').inner_text()
                case['checks'].append('real summary/detail accept opaque token under later request clock; returned cutoff remains fixed; keyboard selection retained')

                t.evaluate('n=>n.dataset.integrationNode="same"')
                server('b','later');t.press('End')  # Select a previously unrequested point, rather than the valid cached Oct9 detail.
                refresh=h.get_by_role('button',name='Refresh history',exact=True);refresh.wait_for();assert not d.count()
                assert any(r['status']==409 and 'day=2026-10-19' in r['url'] for r in responses)
                refresh.focus();q.keyboard.press('Enter')
                d.get_by_role('heading',name='Player values on Oct 19, 2026',exact=True).wait_for()
                assert '$667.50' in h.locator('[data-history-readout]').inner_text()
                assert t.evaluate('n=>n.dataset.integrationNode==="same"&&n===document.activeElement')
                generation_b=next(x['params']['generation'][0] for x in reversed(calls) if '/detail?' in x['url'])
                changed=summary(generation_b)
                assert changed['status']==200 and changed['body']['asOf']==cutoff and generation_a!=generation_b
                assert not h.get_by_role('button',name='Refresh history',exact=True).count()
                case['checks'].append('same-cutoff source correction returns actual producer409; real RSC Refresh loads corrected envelope/detail, preserves selected day/zoom/focus, clears old cache')

            else:
                prior=json.loads((out/'integrated-browser-before-membership.json').read_text())
                old=next(c for c in prior['cases'] if c['width']==width and c['rootText']==scale)
                case['checks']=list(old['checks'])
                case['reusedChecks']=len(old['checks'])
                cutoff='2026-10-20T12:00:00.000Z'
                generation_a=generation_b=None

            h.get_by_role('button',name='Since inception',exact=True).click()
            choose(t,'2025-11-01');h.locator('[data-history-roster-status]').filter(has_text='0/4 priced').wait_for()
            assert 'Value not recorded' in h.locator('[data-history-readout]').inner_text()
            assert d.locator('[data-history-player]').count()==4 and 'Synthetic historical-only player104' in d.inner_text()
            assert 'completed startup draft' in d.locator('[data-history-roster-basis]').inner_text()
            assert '2025-11-01T23:59:59.999Z' in d.locator('time').inner_text()
            choose(t,'2026-06-01');h.locator('[data-history-roster-status]').filter(has_text='0/unknown priced').wait_for()
            assert not d.locator('[data-history-player]').count() and '$0.00' not in h.locator('[data-history-readout]').inner_text()
            case['checks'].append('real replay serves four unpriced2025members including historical-only player; real gap remains unknown/null with no fabricated point')

            t.press('End');d.locator('time').filter(has_text=cutoff).wait_for()
            assert 'season-boundary reconciliation' in d.locator('[data-history-roster-basis]').inner_text()
            d.get_by_text('Roster evidence',exact=True).click();case['geometry']=g=geometry(h)
            assert g['scroll']==width and not g['escapes'],g
            t.focus();case['focus']=t.evaluate('n=>({active:n===document.activeElement,outline:getComputedStyle(n).outlineWidth,height:n.getBoundingClientRect().height})')
            assert case['focus']['active'] and float(case['focus']['outline'][:-2])>=2 and case['focus']['height']>=44
            q.evaluate('scrollTo(0,0)');clip=h.evaluate('n=>{const r=n.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:Math.min(r.height,2400)}}')
            q.screenshot(path=str(out/f'integrated-{width}-{scale}.webp'),clip=clip,full_page=True,type='webp',animations='disabled')
            case['checks'].append('today unpriced membership displays real pinned cutoff and reconciliation prose; expanded real-producer evidence fits narrow200% with focus intact')
            case['cutoff']=cutoff;case['generations']=[generation_a,generation_b] if not resume else sorted({x['params']['generation'][0] for x in calls if 'generation' in x['params']});case['historyRequests']=len(calls)
        except Exception as e:report['failures'].append(dict(width=width,rootText=scale,error=str(e),trace=traceback.format_exc()))
        finally:q.close();(out/'integrated-browser.json').write_text(json.dumps(report,indent=2)+'\n')
    browser.close()
root=Path(__file__).resolve().parents[2]
report['reuse']='With --membership-only, the first three checks reuse the same-source successful flow in integrated-browser-before-membership.json; the actual producer uses ms membership timestamps (.999Z), and only that incorrect test expectation changed.' if resume else None
report['base']=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
files=['src/data/team-value-history.ts','src/data/roster-replay.ts','src/surfaces/season-hub/TeamValueHistory.tsx','src/surfaces/season-hub/TeamValueHistoryDetail.tsx','src/surfaces/season-hub/TeamValueHistoryChart.tsx']
report['sourceBlobs']={f:subprocess.check_output(['git','hash-object',f],cwd=root,text=True).strip() for f in files}
(out/'integrated-browser.json').write_text(json.dumps(report,indent=2)+'\n')
assert not any(report[k] for k in ['failures','errors','external','writes']),str(report['failures'] or report['errors'])
print('PASS',len(report['cases']),'actual-producer/offline-source homepage integration cases')
