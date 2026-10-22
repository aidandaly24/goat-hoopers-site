"""Actual Next member homepage; synthetic changed/unchanged/unknown price evidence."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import base64, json, subprocess, sys, traceback

out = Path(sys.argv[1]).resolve(); origin = sys.argv[2]
report = dict(synthetic=True, route='signed-in fixture homepage / -> Your roster.', cases=[], errors=[], external=[], writes=[])
pixel = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
def guard(route):
    r = route.request; host = urlparse(r.url).hostname
    if r.method != 'GET': report['writes'].append(r.url); return route.abort()
    if host == 'sleepercdn.com': return route.fulfill(content_type='image/png', body=pixel)
    if host != '127.0.0.1': report['external'].append(r.url); return route.abort()
    route.continue_()
def geometry(h):
    return h.evaluate('''n=>{const b=n.getBoundingClientRect();return{width:b.width,height:b.height,page:document.documentElement.scrollWidth,viewport:innerWidth,escapes:[...n.querySelectorAll('*')].filter(x=>{const r=x.getBoundingClientRect();return x.checkVisibility()&&r.width>1&&(r.left<b.left-1||r.right>b.right+1)}).map(x=>x.tagName)}}''')

layouts = [('changed',390,100),('changed',320,100),('changed',320,200),('changed',1440,100),('unchanged',320,200),('unknown',320,200)]
if '--text-fix-only' in sys.argv[3:]:
    layouts = [('changed',390,100),('changed',320,200)]
    report['scope'] = 'Follow-up plain-text row correction; remaining unchanged layout/state cases reuse the initial six-case receipt.'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for mode,width,scale in layouts:
        case=dict(mode=mode,width=width,rootText=scale,checks=[]);report['cases'].append(case)
        q=browser.new_page(viewport=dict(width=width,height=900),is_mobile=width<600,has_touch=width<600,reduced_motion='reduce')
        q.set_default_timeout(12000);q.route('**/*',guard);q.on('pageerror',lambda e:report['errors'].append(str(e)))
        calls=[];q.on('request',lambda r:calls.append(r.url) if '/api/team-value-history/' in r.url else None)
        try:
            q.set_extra_http_headers({'x-review-state':'stats-populated','x-review-changes':mode,'x-review-run':f'changes-{mode}-{width}-{scale}'})
            assert q.goto(origin+'/',wait_until='domcontentloaded').status==200
            q.wait_for_function("document.documentElement.dataset.reviewHydrated==='true'")
            q.get_by_role('heading',name='Your roster.',exact=True).wait_for()
            q.evaluate('(s)=>document.documentElement.style.fontSize=s+"%"',scale)
            h=q.locator('[data-team-value-history]');readout=h.locator('[data-history-readout]');inspector=h.locator('[data-history-inspector]')
            q.wait_for_timeout(250);assert not calls
            if h.locator('[data-history-current-select]').count():
                assert 'Current modeled quote' in readout.inner_text()
                h.get_by_role('button',name='History',exact=True).click()
            assert 'Saved snapshot' in readout.inner_text() and 'Oct 20, 2026' in readout.inner_text()
            assert ('$216.35' if mode=='unchanged' else '$202.96') in readout.inner_text()
            summary=inspector.locator(':scope > summary');summary.focus();summary.press('Enter')
            detail=inspector.locator('[data-history-detail]')
            if mode=='unchanged':
                detail.locator('[data-history-no-changes]').wait_for();assert '0 changed · 8 unchanged' in detail.inner_text()
                assert not detail.locator('[data-history-price-change]').count()
            else:
                row=detail.locator('[data-history-price-change]');row.wait_for();assert row.count()==1
                assert 'Tobias Harris' in row.inner_text() and '$24.35' in row.inner_text() and '$10.96' in row.inner_text() and '−$13.39' in row.inner_text()
                assert '$24.35 to $10.96' in row.inner_text()
                assert ('1 changed · 6 unchanged · 1 comparison unavailable' if mode=='unknown' else '1 changed · 7 unchanged') in detail.inner_text()
                link=row.get_by_role('link',name='Tobias Harris',exact=True);link.focus()
                case['focus']=link.evaluate('n=>({active:n===document.activeElement,outline:getComputedStyle(n).outlineWidth})')
                assert case['focus']['active'] and float(case['focus']['outline'][:-2])>=2
            assert not detail.get_by_text('Damian Lillard',exact=True).is_visible()
            assert not detail.locator('[data-history-roster-basis]').is_visible()
            case['defaultGeometry']=g=geometry(h);assert g['page']==width and not g['escapes'],g
            q.evaluate('scrollTo(0,0)');clip=h.evaluate('n=>{const r=n.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}}')
            q.screenshot(path=str(out/f'changes-{mode}-{width}-{scale}.webp'),clip=clip,full_page=True,type='webp')
            case['checks'].append('default list contains only genuine non-zero comparable changes; unchanged and unknown states stay distinct; no provenance wall')

            snapshot=detail.locator('[data-history-snapshot]');snapSummary=snapshot.locator(':scope > summary');snapSummary.focus();snapSummary.press('Enter')
            assert snapshot.locator('[data-history-player]').count()==8
            assert snapshot.get_by_role('link',name='Damian Lillard',exact=True).is_visible()
            if mode=='unknown':assert 'Comparison unavailable' in snapshot.locator('[data-history-player="1-player-1"]').inner_text()
            snapSummary.focus();snapSummary.press('Enter')
            evidence=detail.get_by_text('Snapshot evidence',exact=True);evidence.focus();evidence.press('Enter')
            assert detail.locator('time').inner_text()=='2026-10-20T04:00:00.123456Z'
            evidence.focus();evidence.press('Enter')
            source=h.get_by_text('Sources',exact=True);source.focus();source.press('Enter')
            assert '$110.00' in h.locator('[data-history-current-model]').inner_text()
            assert '2026-10-22T00:10:00.000Z' in h.locator('[data-history-current-model]').inner_text()
            assert 'Different dates, rosters or price coverage' in h.locator('[data-history-value-basis]').inner_text()
            assert '$110.00' not in readout.inner_text()
            case['expandedGeometry']=g=geometry(h);assert g['page']==width and not g['escapes'],g
            source.focus();source.press('Enter')
            case['checks'].append('full roster and exact microsecond provenance remain keyboard-accessible; current model uses the same $110 headline while the selected saved value/date stays separate')

            h.locator('[data-history-day="2026-10-19"]').tap() if width<600 else h.locator('[data-history-day="2026-10-19"]').click()
            detail.get_by_text('No earlier comparable value. Player changes are unavailable.',exact=True).wait_for()
            assert not detail.locator('[data-history-price-change]').count()
            assert 'Oct 19, 2026' in readout.inner_text()
            if mode=='unknown':assert 'Subtotal' in readout.inner_text() and '7/8 priced' in readout.inner_text()
            case['checks'].append('earliest selected snapshot reports unavailable comparison rather than unchanged or a current-value substitution')
            case['detailRequests']=len(calls)
        except Exception as e:
            case['failure']=str(e);case['trace']=traceback.format_exc()
        finally:
            q.close();(out/'changes-browser.json').write_text(json.dumps(report,indent=2)+'\n')
    browser.close()
root=Path(__file__).resolve().parents[2]
report['base']=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
files=['src/surfaces/season-hub/TeamValueHistoryDetail.tsx','src/surfaces/season-hub/TeamValueHistory.tsx','src/surfaces/season-hub/TeamValueHistory.module.css','src/surfaces/season-hub/RosterValueSection.tsx']
report['sourceBlobs']={f:subprocess.check_output(['git','hash-object',f],cwd=root,text=True).strip() for f in files}
(out/'changes-browser.json').write_text(json.dumps(report,indent=2)+'\n')
assert not any(c.get('failure') for c in report['cases']) and not any(report[k] for k in ['errors','external','writes']),report
print('PASS',len(report['cases']),'actual-Next synthetic-source changed-player/coverage/current-value cases')
