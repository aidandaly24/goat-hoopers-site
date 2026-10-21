"""Synthetic actual-Next checks of graph-led selection. No live-data claims."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import base64, json, subprocess, sys, traceback

out = Path(sys.argv[1]).resolve()
origin = sys.argv[2]
report = dict(synthetic=True, cases=[], errors=[], writes=[], external=[], failures=[])
avatar = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')

def guard(route):
    r = route.request
    host = urlparse(r.url).hostname
    if r.method != 'GET':
        report['writes'].append(r.url)
        return route.abort()
    if host == 'sleepercdn.com':
        return route.fulfill(content_type='image/png', body=avatar)
    if host != '127.0.0.1':
        report['external'].append(r.url)
        return route.abort()
    route.continue_()

def geometry(h):
    return h.evaluate('''n=>{
      const box=x=>{const r=x.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width,height:r.height}},b=box(n);
      return{root:b,pageWidth:innerWidth,scroll:document.documentElement.scrollWidth,escapes:[...n.querySelectorAll('*')].filter(x=>{const q=box(x);return x.checkVisibility()&&q.width>0&&(q.left<b.left-1||q.right>b.right+1)}).map(x=>({tag:x.tagName,text:x.textContent.slice(0,90),box:box(x)}))};}''')

def keyboard_focus(locator):
    locator.page.keyboard.press('Tab')
    locator.focus()
    s = locator.evaluate('n=>({active:n===document.activeElement,outline:getComputedStyle(n).outlineWidth,style:getComputedStyle(n).outlineStyle,height:n.getBoundingClientRect().height})')
    assert s['active'] and float(s['outline'][:-2]) >= 2 and s['style'] != 'none', s
    return s

def wait_day(h, label):
    h.locator('[data-history-readout]').get_by_role('heading', name=label+' · UTC', exact=True).wait_for()
    h.get_by_role('heading', name='Roster moves on '+label, exact=True).wait_for()

def select_day(timeline, h, offset, label):
    timeline.focus()
    timeline.press('Home')
    for _ in range(offset):
        timeline.press('ArrowRight')
    wait_day(h, label)

def capture(q, h, path):
    clip = h.evaluate('n=>{const r=n.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:Math.min(2000,r.height)}}')
    q.screenshot(path=str(path), clip=clip, full_page=True, type='webp', animations='disabled')

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for width, scale in [(1440, 100), (390, 100), (320, 100), (320, 200)]:
        case = dict(width=width, rootText=scale, checks=[])
        report['cases'].append(case)
        q = b.new_page(viewport=dict(width=width, height=900), reduced_motion='reduce', has_touch=width < 600, is_mobile=width < 600)
        q.route('**/*', guard)
        q.set_default_timeout(10000)
        q.on('pageerror', lambda e: report['errors'].append(str(e)))
        calls = []
        q.on('request', lambda r: calls.append(r.url) if '/api/team-value-history/detail?' in r.url else None)
        headers = {'x-review-state': 'stats-populated', 'x-review-run': f'timeline-{width}-{scale}'}
        q.set_extra_http_headers(headers)
        try:
            assert q.goto(origin+'/', wait_until='domcontentloaded').status == 200
            q.wait_for_function("document.documentElement.dataset.reviewHydrated==='true'")
            q.evaluate('(s)=>document.documentElement.style.fontSize=s+"%"', scale)
            h = q.locator('[data-team-value-history]')
            timeline = h.get_by_role('slider', name='Team value timeline', exact=True)
            q.wait_for_timeout(250)
            assert not calls, calls
            assert not h.locator('input, select, [data-history-calendar]').count()
            assert h.locator('[data-team-history-chart]').evaluate('n=>n.nextElementSibling.hasAttribute("data-history-inspector")')
            assert 'Oct 20, 2025' in h.locator('[data-history-coverage]').inner_text()
            case['allTimeGeometry'] = geometry(h)
            assert case['allTimeGeometry']['scroll'] == width and not case['allTimeGeometry']['escapes'], case['allTimeGeometry']
            case['checks'].append('inception default, chart immediately followed by inspector, no calendar/date controls, no eager detail reads')
            if (width, scale) in [(1440, 100), (320, 200)]:
                capture(q, h, out/f'timeline-inception-{width}-{scale}.webp')

            # Zoom remains on the graph; it does not substitute a calendar selector.
            h.get_by_role('button', name='Last 30 days', exact=True).click()
            h.get_by_role('button', name='Zoom to values', exact=True).click()
            point = h.locator('[data-history-day="2026-10-19"]')
            point.scroll_into_view_if_needed()
            if width < 600:
                point.tap()
                case['checks'].append('touch on value dot selects exact day')
            else:
                box = point.bounding_box()
                q.mouse.move(box['x']+box['width']/2, box['y']+box['height']/2)
                case['checks'].append('mouse hover on value dot selects exact day without click')
            wait_day(h, 'Oct 19, 2026')
            d = h.locator('[data-history-detail]')
            assert '$335.00' in h.locator('[data-history-readout]').inner_text()
            assert '+$1.66' in h.locator('[data-player-change]').first.inner_text()
            move = d.locator('[data-history-move]').first
            assert 'Synthetic incoming player with a long readable identity' in move.locator('[data-move-received]').inner_text()
            assert 'Other roster participant' not in move.locator('[data-move-received]').inner_text()
            assert 'Synthetic big' in move.locator('[data-move-sent]').inner_text()
            assert 'Other roster outgoing' not in move.locator('[data-move-sent]').inner_text()
            assert move.locator('[data-pick-direction="received"]').count() == 1
            assert move.locator('[data-pick-direction="sent"]').count() == 1
            assert 'Original roster 1' in move.locator('[data-pick-direction="other"]').inner_text()
            assert '12 FAAB units' in d.inner_text() and '0 FAAB units' in d.inner_text()
            assert 'Trade net: unavailable.' in d.inner_text()
            case['detailGeometry'] = g = geometry(h)
            assert g['scroll'] == width and not g['escapes'], g
            case['timelineFocus'] = keyboard_focus(timeline)
            assert case['timelineFocus']['height'] >= 44
            timeline.press('ArrowLeft')
            wait_day(h, 'Oct 18, 2026')
            case['checks'].append('matching value/player changes and roster-scoped trade legs, picks, source units; keyboard day selection/focus')
            if (width, scale) in [(1440, 100), (320, 200)]:
                # Capture the graph and immediately adjacent inspector, before any source disclosures.
                capture(q, h, out/f'timeline-{width}-{scale}.webp')

            h.get_by_role('button', name='Since inception', exact=True).click()
            select_day(timeline, h, 12, 'Nov 1, 2025')
            assert 'Value not recorded' in h.locator('[data-history-readout]').inner_text()
            assert 'Roster cannot be verified' in d.inner_text()
            assert 'Source league synthetic-source-2025' in d.inner_text()
            assert 'Pick terms unavailable' in d.inner_text() and 'No draft picks carried by this record.' in d.inner_text()
            source = d.locator('[data-history-move]').first.locator('summary').filter(has_text='Move source')
            case['sourceFocus'] = keyboard_focus(source)
            source.press('Enter')
            assert 'Synthetic source receipt' in d.inner_text()
            case['historicalGeometry'] = g = geometry(h)
            assert g['scroll'] == width and not g['escapes'], g
            timeline.focus()
            timeline.press('Home')
            wait_day(h, 'Oct 20, 2025')
            timeline.press('End')
            wait_day(h, 'Oct 20, 2026')
            case['checks'].append('keyboard inception/end and missing day, sourced historical terms, missing-versus-empty fields, source disclosure/focus; no fabricated value')
            targets = h.locator('button, summary').evaluate_all('nodes=>nodes.filter(n=>n.checkVisibility()).map(n=>({text:n.textContent,height:n.getBoundingClientRect().height}))')
            assert all(t['height'] >= 44 for t in targets), targets
            case['targetHeights'] = targets
            if width == 320 and scale == 200:
                h.get_by_role('button', name='Last 30 days', exact=True).click()
                h.get_by_role('button', name='Zoom to values', exact=True).click()
                q.set_extra_http_headers({**headers, 'x-review-detail-mode': 'slow'})
                timeline.focus()
                timeline.press('End')
                for _ in range(3): timeline.press('ArrowLeft')
                q.wait_for_timeout(260)
                timeline.press('ArrowLeft')
                wait_day(h, 'Oct 15, 2026')
                q.wait_for_timeout(600)
                assert 'Oct 15, 2026' in h.locator('[data-history-readout]').inner_text()
                q.set_extra_http_headers({**headers, 'x-review-detail-mode': 'changed'})
                h.get_by_role('button', name='Since inception', exact=True).click()
                timeline.focus(); timeline.press('Home'); timeline.press('PageDown')
                h.get_by_text('History changed. Refresh the page to inspect the new roster evidence.', exact=True).wait_for()
                assert not d.count()
                q.set_extra_http_headers({**headers, 'x-review-detail-mode': 'unavailable'})
                timeline.press('ArrowRight')
                h.get_by_role('button', name='Retry day details').wait_for()
                q.set_extra_http_headers(headers)
                h.get_by_role('button', name='Retry day details').click()
                wait_day(h, 'Oct 28, 2025')
                case['checks'].append('rapid selection cancels stale detail; generation409 clears detail; unavailable read retries successfully')
            case['detailRequests'] = len(calls)
        except Exception as e:
            report['failures'].append(dict(width=width, scale=scale, error=str(e), trace=traceback.format_exc()))
        finally:
            q.close()
            (out/'timeline-browser.json').write_text(json.dumps(report, indent=2)+'\n')
    b.close()
root = Path(__file__).resolve().parents[2]
files = ['src/surfaces/season-hub/'+name for name in ['TeamValueHistory.tsx', 'TeamValueHistoryChart.tsx', 'TeamValueHistoryDetail.tsx', 'TeamValueHistory.module.css', 'TeamValueHistoryClient.ts', 'team-value-history-view.ts']]
report['base'] = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
report['sourceBlobs'] = {f: subprocess.check_output(['git', 'hash-object', f], cwd=root, text=True).strip() for f in files}
(out/'timeline-browser.json').write_text(json.dumps(report, indent=2)+'\n')
assert not any(report[k] for k in ['failures', 'errors', 'writes', 'external']), str(report['failures'] or report['errors'])
print('PASS', len(report['cases']), 'synthetic production-Next graph-led layouts')
