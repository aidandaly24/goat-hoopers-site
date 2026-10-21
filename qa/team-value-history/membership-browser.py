"""Changed-scope actual-Next checks for the agreed synthetic membership/th2 contract."""
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from datetime import date
from playwright.sync_api import sync_playwright
import base64, json, subprocess, sys, traceback

out = Path(sys.argv[1]).resolve()
origin = sys.argv[2]
report = dict(synthetic=True, cases=[], errors=[], external=[], writes=[], failures=[])
avatar = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')

def guard(route):
    r = route.request
    host = urlparse(r.url).hostname
    if r.method != 'GET':
        report['writes'].append(r.url)
        return route.abort()
    if host == 'sleepercdn.com': return route.fulfill(content_type='image/png', body=avatar)
    if host != '127.0.0.1':
        report['external'].append(r.url)
        return route.abort()
    route.continue_()

def choose(timeline, day):
    timeline.focus()
    timeline.press('Home')
    offset = (date.fromisoformat(day)-date(2025, 10, 20)).days
    for _ in range(offset//7): timeline.press('PageDown')
    for _ in range(offset%7): timeline.press('ArrowRight')

def geometry(h):
    return h.evaluate('''n=>{const b=n.getBoundingClientRect();return{width:b.width,scroll:document.documentElement.scrollWidth,viewport:innerWidth,escapes:[...n.querySelectorAll('*')].filter(x=>{const r=x.getBoundingClientRect();return x.checkVisibility()&&r.width>0&&(r.left<b.left-1||r.right>b.right+1)}).map(x=>({tag:x.tagName,text:x.textContent.slice(0,80)}))}}''')

def capture(q, h, path):
    q.evaluate("scrollTo(0,0)")
    clip = h.evaluate('n=>{const r=n.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:Math.min(r.height,2400)}}')
    q.screenshot(path=str(path), clip=clip, full_page=True, type='webp', animations='disabled')

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for width, text in [(1440, 100), (320, 200)]:
        case = dict(width=width, rootText=text, checks=[])
        report['cases'].append(case)
        q = b.new_page(viewport=dict(width=width, height=900), has_touch=width < 600, is_mobile=width < 600, reduced_motion='reduce')
        q.route('**/*', guard); q.set_default_timeout(10000)
        q.on('pageerror', lambda e: report['errors'].append(str(e)))
        calls, aborted = [], []
        q.on('request', lambda r: calls.append(dict(url=r.url, params=parse_qs(urlparse(r.url).query))) if '/api/team-value-history/' in r.url else None)
        q.on('requestfailed', lambda r: aborted.append(dict(url=r.url, failure=r.failure)) if '/api/team-value-history/' in r.url else None)
        headers = {'x-review-state':'stats-populated', 'x-review-run':f'membership-{width}-{text}'}
        def server(view, mode=''): q.set_extra_http_headers({**headers, 'x-review-view':view, 'x-review-detail-mode':mode})
        try:
            server('a')
            assert q.goto(origin+'/', wait_until='domcontentloaded').status == 200
            q.wait_for_function("document.documentElement.dataset.reviewHydrated==='true'")
            q.evaluate('(n)=>document.documentElement.style.fontSize=n+"%"', text)
            h = q.locator('[data-team-value-history]')
            timeline = h.get_by_role('slider', name='Team value timeline', exact=True)
            d = h.locator('[data-history-detail]')
            q.wait_for_timeout(250); assert not calls
            choose(timeline, '2025-11-01')
            h.locator('[data-history-roster-status]').filter(has_text='0/2 priced').wait_for()
            assert 'Value not recorded' in h.locator('[data-history-readout]').inner_text()
            assert 'Synthetic a roster member' in d.inner_text()
            assert '2025-11-01T23:59:59.999999Z' in d.locator('[data-history-inspection]').inner_text()
            assert 'Synthetic draft-anchored replay' in d.locator('[data-history-roster-basis]').inner_text()
            case['checks'].append('ready membership-only detail drives status/count; actual end-of-day microsecond instant and literal anchor prose visible')

            timeline.evaluate('n=>n.dataset.retainedFocus="same-node"')
            server('b')
            q.evaluate('document.querySelector("[data-review-refresh]").click()')
            h.locator('[data-history-roster-status]').filter(has_text='0/3 priced').wait_for()
            assert 'Nov 1, 2025' in h.locator('[data-history-readout]').inner_text()
            assert 'Synthetic b roster member' in d.inner_text()
            assert timeline.evaluate('n=>n.dataset.retainedFocus==="same-node"&&n===document.activeElement')
            assert any('2025-11-01' in x['params'].get('day', []) and x['params'].get('generation', [''])[0].endswith('b'*24) for x in calls)
            case['checks'].append('same-team RSC generation refresh preserves selected day/DOM focus; reloads under new opaque generation instead of old cache')

            server('b', 'slow')
            with q.expect_request(lambda r: '/detail?' in r.url and 'day=2025-11-04' in r.url): choose(timeline, '2025-11-04')
            server('c')
            q.evaluate('document.querySelector("[data-review-refresh]").click()')
            h.locator('[data-history-roster-status]').filter(has_text='0/4 priced').wait_for()
            q.wait_for_timeout(800)
            assert 'Nov 4, 2025' in h.locator('[data-history-readout]').inner_text()
            assert 'Synthetic c roster member' in d.inner_text() and 'Synthetic b roster member' not in d.inner_text()
            assert any('day=2025-11-04' in x['url'] for x in aborted), aborted
            case['checks'].append('generation refresh aborts old in-flight day request; delayed old detail cannot replace new detail')

            choose(timeline, '2025-11-01')
            h.locator('[data-history-roster-status]').filter(has_text='0/4 priced').wait_for()
            server('b')  # The server advances while the browser still carries the c token.
            choose(timeline, '2025-11-05')
            h.get_by_role('button', name='Refresh history', exact=True).wait_for()
            assert not d.count()
            count = len(calls)
            choose(timeline, '2025-11-01')
            q.wait_for_timeout(300)
            assert not d.count() and len(calls) == count
            refresh = h.get_by_role('button', name='Refresh history', exact=True)
            refresh.focus(); q.keyboard.press('Enter')
            h.locator('[data-history-roster-status]').filter(has_text='0/3 priced').wait_for()
            assert 'Nov 1, 2025' in h.locator('[data-history-readout]').inner_text()
            assert timeline.evaluate('n=>n===document.activeElement')
            assert not h.get_by_role('button', name='Refresh history', exact=True).count()
            case['checks'].append('409 invalidates entire detail cache; cached-day reselection stays blocked; real Refresh action recovers same day and returns focus to timeline')

            choose(timeline, '2025-11-02')
            h.locator('[data-history-roster-status]').filter(has_text='0/0 priced').wait_for()
            assert '$0.00' in h.locator('[data-history-readout]').inner_text()
            assert 'Empty roster' in h.locator('[data-history-readout]').inner_text()
            assert 'No players on this roster at the selected date.' in d.inner_text()
            choose(timeline, '2026-04-03')
            h.locator('[data-history-roster-status]').filter(has_text='0/unknown priced').wait_for()
            assert '$0.00' not in h.locator('[data-history-readout]').inner_text()
            assert 'The historical roster is unavailable for this date.' in d.inner_text()
            assert not d.locator('[data-history-player]').count()
            case['checks'].append('known-empty roster zero/count0 remains distinct from gap unknown/null; no invented priced points')

            timeline.press('End')
            d.locator('time').filter(has_text='2026-10-20T13:45:00.456Z').wait_for()
            assert 'Synthetic boundary-reconciled replay' in d.locator('[data-history-roster-basis]').inner_text()
            d.get_by_text('Roster evidence', exact=True).click()
            case['geometry'] = g = geometry(h)
            assert g['scroll'] == width and not g['escapes'], g
            case['focus'] = timeline.evaluate('n=>{n.focus();const s=getComputedStyle(n);return{active:n===document.activeElement,outline:s.outlineWidth,height:n.getBoundingClientRect().height}}')
            assert case['focus']['active'] and float(case['focus']['outline'][:-2]) >= 2 and case['focus']['height'] >= 44, case['focus']
            capture(q, h, out/f'membership-{width}-{text}.webp')
            case['checks'].append('today inspection uses fixed envelope cutoff; reconciliation prose not treated as a transaction; expanded long evidence fits with focus/44px targets')

            server('c', 'future')
            q.evaluate('document.querySelector("[data-review-refresh]").click()')
            h.get_by_role('button', name='Refresh history', exact=True).wait_for()
            assert not d.count()
            case['checks'].append('detail one microsecond beyond envelope cutoff is rejected before display/cache')
            case['requests'] = len(calls); case['abortedRequests'] = len(aborted)
        except Exception as e:
            report['failures'].append(dict(width=width, rootText=text, error=str(e), trace=traceback.format_exc()))
        finally:
            q.close(); (out/'membership-browser.json').write_text(json.dumps(report, indent=2)+'\n')
    b.close()
root = Path(__file__).resolve().parents[2]
report['base'] = subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
report['sourceBlobs'] = {f:subprocess.check_output(['git','hash-object',f],cwd=root,text=True).strip() for f in [
    'src/surfaces/season-hub/TeamValueHistory.tsx','src/surfaces/season-hub/TeamValueHistoryDetail.tsx','src/surfaces/season-hub/TeamValueHistoryChart.tsx','src/surfaces/season-hub/TeamValueHistoryClient.ts','src/surfaces/season-hub/TeamValueHistory.module.css']}
(out/'membership-browser.json').write_text(json.dumps(report, indent=2)+'\n')
assert not any(report[k] for k in ['failures','errors','writes','external']), str(report['failures'] or report['errors'])
print('PASS',len(report['cases']),'changed-scope synthetic membership/RSC-refresh layouts')
