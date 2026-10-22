"""Synthetic actual-Next quote consistency, selection and race checks. Never live."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import base64, hashlib, json, re, subprocess, sys, traceback

out=Path(sys.argv[1]).resolve();origin=sys.argv[2]
report={'synthetic':True,'route':'actual Next member homepage / -> Your roster','cases':[],'errors':[],'external':[],'writes':[]}
pixel=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
def guard(route):
    r=route.request;host=urlparse(r.url).hostname
    if r.method!='GET':report['writes'].append(r.url);return route.abort()
    if host=='sleepercdn.com':return route.fulfill(content_type='image/png',body=pixel)
    if host!='127.0.0.1':report['external'].append(r.url);return route.abort()
    route.continue_()
def geometry(h):
    return h.evaluate('''n=>{const b=n.getBoundingClientRect();return{width:b.width,page:document.documentElement.scrollWidth,viewport:innerWidth,escapes:[...n.querySelectorAll('*')].filter(x=>{const r=x.getBoundingClientRect();return x.checkVisibility()&&r.width>1&&(r.left<b.left-1||r.right>b.right+1)}).map(x=>x.tagName)}}''')
def normalized(s):return re.sub(r'\s+','',s or '')
def identity(page,h):
    a=page.locator('[data-team-value]').get_attribute('data-quote-calculation')
    b=h.locator('[data-history-readout]').get_attribute('data-quote-calculation')
    c=h.locator('[data-history-current]').get_attribute('data-quote-calculation')
    assert a and a==b==c,'headline/readout/marker calculation identities disagree'
    assert normalized(page.locator('[data-team-value]').text_content())==normalized(h.locator('[data-history-readout] > strong').text_content())
    return a
layouts=[('full',390,100),('full',320,100),('full',320,200),('full',1440,100),('partial',320,200),('unpriced',320,200),('empty',320,200),('unknown',320,200),('long',320,200),('same-day',320,200),('retrospective',390,100),('rollover',320,200)]
if '--layout-only' in sys.argv[3:]:
    layouts=[('full',390,100),('full',320,200)]
    report['scope']='Final native-details spacing fix; unchanged state/provenance cases reuse the twelve-case receipt at its stated source identities.'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for mode,width,scale in layouts:
        case={'mode':mode,'width':width,'rootText':scale,'checks':[]};report['cases'].append(case)
        page=browser.new_page(viewport={'width':width,'height':900},is_mobile=width<600,has_touch=width<600,reduced_motion='reduce');page.set_default_timeout(14000)
        page.route('**/*',guard);page.on('pageerror',lambda e:report['errors'].append(str(e)))
        calls=[];responses=[]
        page.on('request',lambda r:calls.append(r.url) if '/api/team-value-history/' in r.url else None)
        page.on('response',lambda r:responses.append(r.status) if '/api/team-value-history/' in r.url else None)
        headers={'x-review-state':'stats-populated','x-review-current':mode,'x-review-current-version':'a','x-review-run':f'current-{mode}-{width}-{scale}'}
        try:
            page.set_extra_http_headers(headers);assert page.goto(origin+'/',wait_until='domcontentloaded').status==200
            page.wait_for_function("document.documentElement.dataset.reviewHydrated==='true'")
            page.get_by_role('heading',name='Your roster.',exact=True).wait_for();page.evaluate('(s)=>document.documentElement.style.fontSize=s+"%"',scale)
            h=page.locator('[data-team-value-history]');r=h.locator('[data-history-readout]');timeline=h.locator('[data-history-timeline]');inspector=h.locator('[data-history-inspector]')
            page.wait_for_timeout(300);assert not calls,'current view eagerly fetched historical detail'
            assert 'Current modeled quote' in r.inner_text()
            if mode in ['unpriced','unknown']:
                assert 'Current value unavailable' in r.inner_text() and not h.locator('[data-history-current]').count()
                assert page.locator('[data-value-unavailable]').get_attribute('data-quote-calculation')==r.get_attribute('data-quote-calculation')
            else:case['initialIdentityHash']=hashlib.sha256(identity(page,h).encode()).hexdigest()
            if mode=='partial':assert 'Subtotal' in r.inner_text() and '3/4 priced' in r.inner_text() and '3/4 priced' in timeline.get_attribute('aria-valuetext')
            if mode=='empty':assert '$0.00' in r.inner_text() and 'Empty roster' in r.inner_text()
            if mode=='rollover':assert 'Oct 23, 2026' in r.inner_text()
            timeline.focus();timeline.press('End');page.wait_for_timeout(250);assert not calls
            current=h.locator('[data-history-current-select]');assert current.bounding_box()['height']>=44
            summary=inspector.locator(':scope > summary');summary.focus();summary.press('Enter')
            detail=h.locator('[data-current-history-detail]');detail.wait_for();assert not h.locator('[data-history-detail]').count()
            case['focusSeparation']=detail.locator('h4').evaluate('(n)=>n.getBoundingClientRect().top-n.parentElement.previousElementSibling.getBoundingClientRect().bottom')
            assert case['focusSeparation']>=5,'expanded heading overlaps the summary focus outline'
            assert not detail.locator('[data-current-roster]').get_attribute('open')
            case['initialGeometry']=g=geometry(h);assert g['page']==width and not g['escapes'],g
            page.evaluate('scrollTo(0,0)');clip=h.evaluate('n=>{const r=n.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}}')
            page.screenshot(path=str(out/f'current-{mode}-{width}-{scale}.webp'),clip=clip,full_page=True,type='webp')
            roster=detail.locator('[data-current-roster]');rs=roster.locator(':scope > summary');rs.focus();rs.press('Enter')
            assert roster.locator('[data-current-player]').count()==(0 if mode in ['empty','unknown'] else 4)
            case['rosterGeometry']=g=geometry(h);assert g['page']==width and not g['escapes'],g
            rs.press('Enter');assert not calls
            case['checks'].append('current headline/readout/marker share one calculation; partial/empty/unknown states remain honest; no history GET; current roster stays compact and keyboard-accessible')

            h.get_by_role('button',name='History',exact=True).click()
            h.locator('[data-history-day="2026-10-20"]').tap() if width<600 else h.locator('[data-history-day="2026-10-20"]').click()
            hd=h.locator('[data-history-detail]');hd.locator('[data-history-price-change]').wait_for()
            assert '$202.96' in r.inner_text() and '8/8 priced' in r.inner_text()
            assert ('Reconstructed model' if mode=='retrospective' else 'Saved snapshot') in r.inner_text()
            assert not r.get_attribute('data-quote-calculation') and not h.locator('[data-current-history-detail]').count()
            assert hd.locator('[data-history-price-change]').count()==1 and 'Tobias Harris' in hd.locator('[data-history-price-change]').inner_text()
            if mode=='retrospective':
                source=h.get_by_text('Sources',exact=True);source.click();assert 'Modeled roster-value difference' in h.inner_text();assert 'Saved roster-value difference' not in h.inner_text();source.click()
            if mode=='same-day':
                assert normalized(page.locator('[data-team-value]').text_content())==normalized(r.locator('strong').text_content())
                current.click();identity(page,h);assert '4/4 priced' in r.inner_text()
                h.get_by_role('button',name='History',exact=True).click();assert '8/8 priced' in r.inner_text()
            case['historyGeometry']=g=geometry(h);assert g['page']==width and not g['escapes'],g
            h.get_by_role('button',name='All days',exact=True).click();timeline.focus();timeline.press('Home')
            page.wait_for_function("document.querySelector('[data-history-readout] > span').textContent.includes('Oct 20, 2025')")
            assert 'Value not recorded' in r.inner_text() and '$0.00' not in r.locator('strong').inner_text()
            before=len(calls);timeline.press('End')
            if mode not in ['unpriced','unknown']:identity(page,h)
            else:assert 'Current value unavailable' in r.inner_text()
            page.wait_for_timeout(300);assert len(calls)==before,'Current End fetched historical evidence'
            case['checks'].append('historical hover/tap/keyboard selection preserves saved or reconstructed values and changed-only rows; full calendar gaps stay missing; End returns to Current without a historical read')

            if mode=='full':
                timeline.press('ArrowLeft');assert 'Oct 20, 2026' in r.inner_text()
                timeline.press('ArrowRight');assert 'Oct 21, 2026' in r.inner_text() and 'Current modeled quote' not in r.inner_text()
                timeline.press('ArrowRight');assert 'Oct 22, 2026' in r.inner_text() and 'Current modeled quote' not in r.inner_text()
                timeline.press('ArrowRight');identity(page,h)
                case['checks'].append('new viewport gap days remain keyboard-selectable through the pinned cutoff; another right selects the distinct current quote')

            if mode=='full' and (width,scale) in [(390,100),(320,200)]:
                # Cancel an old detail read, then refresh the same team into a new current calculation.
                page.set_extra_http_headers({**headers,'x-review-current-delay':'slow'})
                with page.expect_request(lambda req:'/api/team-value-history/detail' in req.url and 'day=2025-10-20' in req.url):
                    h.get_by_role('button',name='All days',exact=True).click();timeline.focus();timeline.press('Home')
                case['staleDetailRequestObserved']=True
                current.click();headers={**headers,'x-review-current-version':'b'};page.set_extra_http_headers(headers)
                page.locator('[data-review-refresh]').click();page.wait_for_function("document.querySelector('[data-team-value]').textContent.includes('111')")
                page.wait_for_timeout(800);newid=identity(page,h);assert 'Current modeled quote' in r.inner_text() and not h.locator('[data-history-detail]').count()
                assert hashlib.sha256(newid.encode()).hexdigest()!=case['initialIdentityHash']
                # A stale generation refresh retains the chosen historical day and DOM focus.
                h.get_by_role('button',name='History',exact=True).click();h.locator('[data-history-day="2026-10-20"]').tap()
                hd=h.locator('[data-history-detail]');hd.locator('[data-history-price-change]').wait_for()
                headers={**headers,'x-review-current-version':'a'};page.set_extra_http_headers(headers);timeline.focus();timeline.press('ArrowRight')
                refresh=h.get_by_role('button',name='Refresh history',exact=True);refresh.wait_for();assert 409 in responses
                refresh.focus();refresh.press('Enter');page.wait_for_function("document.querySelector('[data-team-value]').textContent.includes('110')")
                hd.get_by_text('No earlier comparable value. Player changes are unavailable.',exact=True).wait_for()
                assert 'Oct 21, 2026' in r.inner_text() and 'Value not recorded' in r.inner_text()
                assert timeline.evaluate('n=>n===document.activeElement')
                current.focus();current.press('Enter');identity(page,h)
                case['checks'].append('same-team RSC refresh swaps headline/current version together and cancels stale details;409 refresh retains historical day/focus; current selection never mixes old history')
            case['historyRequests']=len(calls)
        except Exception as e:
            case['failure']=str(e);case['trace']=traceback.format_exc()
        finally:
            page.close();(out/'current-browser.json').write_text(json.dumps(report,indent=2)+'\n')
    browser.close()
root=Path(__file__).resolve().parents[2]
report['base']=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
files=['src/domain/current-team-quote.ts','src/surfaces/season-hub/RosterValueSection.tsx','src/surfaces/season-hub/TeamValueHistory.tsx','src/surfaces/season-hub/TeamValueHistoryChart.tsx','src/surfaces/season-hub/TeamValueHistory.module.css']
report['sourceBlobs']={f:subprocess.check_output(['git','hash-object',f],cwd=root,text=True).strip() for f in files}
assert report['sourceBlobs']==json.loads((out/'current-source-blobs.json').read_text()),'Application source changed since fixture preparation; receipt is not final-head evidence'
(out/'current-browser.json').write_text(json.dumps(report,indent=2)+'\n')
assert not any(c.get('failure') for c in report['cases']) and not any(report[k] for k in ['errors','external','writes']),report
print('PASS',len(report['cases']),'synthetic actual-Next current/history quote cases')
