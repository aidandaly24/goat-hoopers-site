"""Hydrated actual Next homepage; synthetic price changes, local assets, no production traffic."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import base64, json, subprocess, sys, traceback
out=Path(sys.argv[1]).resolve();origin=sys.argv[2]
report=dict(synthetic=True,route='signed-in synthetic homepage /, Your roster',cases=[],errors=[],external=[],writes=[])
pixel=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
def guard(route):
    r=route.request;host=urlparse(r.url).hostname
    if r.method!='GET':report['writes'].append(r.url);return route.abort()
    if host=='sleepercdn.com':return route.fulfill(content_type='image/png',body=pixel)
    if host!='127.0.0.1':report['external'].append(r.url);return route.abort()
    route.continue_()
def geometry(h):
    return h.evaluate('''n=>{const b=n.getBoundingClientRect();return{width:b.width,page:document.documentElement.scrollWidth,viewport:innerWidth,escapes:[...n.querySelectorAll('*')].filter(x=>{const r=x.getBoundingClientRect();return x.checkVisibility()&&r.width>1&&(r.left<b.left-1||r.right>b.right+1)}).map(x=>({tag:x.tagName,text:x.textContent.slice(0,50)}))}}''')
layouts=[('changed',390,100),('changed',320,100),('changed',320,200),('changed',1440,100),('unchanged',320,200),('unknown',320,200),('broken-photo',390,100)]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for mode,width,scale in layouts:
        c=dict(mode=mode,width=width,rootText=scale,checks=[]);report['cases'].append(c)
        q=browser.new_page(viewport=dict(width=width,height=1000),is_mobile=width<600,has_touch=width<600,reduced_motion='reduce')
        q.set_default_timeout(12000);q.route('**/*',guard);q.on('pageerror',lambda e:report['errors'].append(str(e)))
        if mode=='broken-photo':q.route('**/courtside/portraits/player-2259.png',lambda r:r.fulfill(status=404,body='synthetic missing image'))
        calls=[];q.on('request',lambda r:calls.append(r.url) if '/api/team-value-history/' in r.url else None)
        try:
            q.set_extra_http_headers({'x-review-state':'stats-populated','x-review-changes':mode,'x-review-run':f'movers-{mode}-{width}-{scale}'})
            assert q.goto(origin+'/',wait_until='domcontentloaded').status==200
            q.wait_for_function("document.documentElement.dataset.reviewHydrated==='true'")
            q.evaluate('(s)=>document.documentElement.style.fontSize=s+"%"',scale)
            h=q.locator('[data-team-value-history]');readout=h.locator('[data-history-readout]')
            q.wait_for_timeout(250);assert not calls
            assert 'Current modeled quote' in readout.inner_text() and '$110.00' in readout.inner_text()
            h.get_by_role('button',name='History',exact=True).click()
            detail=h.locator('[data-history-detail]');detail.wait_for()
            q.wait_for_function("document.querySelector('[data-history-comparison]')")
            assert 'Oct 20, 2026' in readout.inner_text() and '$110.00' not in readout.inner_text()
            assert detail.evaluate("n=>!n.closest('details')")
            rows=detail.locator('[data-history-price-change]')
            if mode=='unchanged':
                assert rows.count()==0 and '0 changed · 8 unchanged' in detail.inner_text()
                assert '+$0.00' in detail.locator('[data-history-change-net]').inner_text()
            else:
                assert rows.count()==(2 if mode=='unknown' else 3)
                first=rows.nth(0);assert 'Anthony Edwards' in first.inner_text() and '+$12.80' in first.inner_text()
                assert '$50.00' in first.inner_text() and '$62.80' in first.inner_text()
                assert 'Oct 19' in first.inner_text() and 'Oct 20' in first.inner_text()
                if mode=='unknown':
                    assert '1 comparison unavailable' in detail.inner_text()
                    assert 'Known price change subtotal' in detail.locator('[data-history-change-net]').inner_text()
                    assert 'Victor Wembanyama' not in detail.inner_text()
                else:
                    assert 'Victor Wembanyama' in rows.nth(1).inner_text() and '−$9.50' in rows.nth(1).inner_text()
                    assert '+$1.30' in detail.locator('[data-history-change-net]').inner_text()
                assert 'Synthetic Longname Alexander-Walker headshot unavailable' in rows.last.locator('[role=img]').get_attribute('aria-label')
                first.scroll_into_view_if_needed()
                if mode=='broken-photo':
                    first.locator('[role=img]').wait_for();assert 'Anthony Edwards headshot unavailable' in first.locator('[role=img]').get_attribute('aria-label')
                else:
                    q.wait_for_function("document.querySelector('[data-history-price-change=\"2259\"] img')?.naturalWidth>0")
                    assert first.locator('img').get_attribute('src')=='/courtside/portraits/player-2259.png'
                link=first.get_by_role('link',name='View Anthony Edwards');link.focus();link.press('Tab',no_wait_after=True);link.focus()
                c['focus']=link.evaluate('n=>({active:n===document.activeElement,outline:getComputedStyle(n).outlineWidth,height:n.getBoundingClientRect().height})')
                assert c['focus']['active'] and float(c['focus']['outline'][:-2])>=2 and c['focus']['height']>=44
            for name in ['Myles Turner','Derrick White','Grayson Allen','Payton Pritchard']:
                assert name not in detail.inner_text()
            assert not detail.locator('[data-history-snapshot]').count()
            assert not detail.get_by_text('Snapshot evidence',exact=True).evaluate('n=>n.parentElement.open')
            c['nameLayout']=rows.evaluate_all("ns=>ns.map(n=>{const a=n.querySelector('a'),s=a.lastElementChild;return {name:s.textContent,width:s.getBoundingClientRect().width,font:getComputedStyle(s).fontSize}})")
            if scale==200 and mode=='changed':assert c['nameLayout'][0]['width']>=150,c['nameLayout']
            c['geometry']=g=geometry(h);assert g['page']==width and not g['escapes'],g
            q.evaluate('scrollTo(0,0)')
            clip=detail.evaluate('n=>{const r=n.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}}')
            q.screenshot(path=str(out/f'movers-{mode}-{width}-{scale}.webp'),clip=clip,full_page=True,type='webp')
            if mode=='changed' and width==390:
                clip=h.evaluate('n=>{const r=n.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}}')
                q.screenshot(path=str(out/'movers-chart-390-100.webp'),clip=clip,full_page=True,type='webp')
            c['checks'].append('immediate changed-only cards, signed comparable subtotal, before/after dates, matching portraits/initials, no whole-team disclosure, focus and containment')
            evidence=detail.get_by_text('Snapshot evidence',exact=True);evidence.focus();evidence.press('Enter')
            assert detail.locator('[data-history-inspection]').inner_text().endswith('2026-10-20T04:00:00.123456Z')
            c['expandedGeometry']=g=geometry(h);assert g['page']==width and not g['escapes'],g
            evidence.press('Enter')
            # Touch selection and keyboard values navigation retain selected-day semantics.
            point=h.locator('[data-history-day="2026-10-19"]')
            point.tap() if width<600 else point.click()
            detail.get_by_text('No earlier comparable value. Player changes are unavailable.',exact=True).wait_for()
            assert rows.count()==0 and 'Oct 19, 2026' in readout.inner_text()
            slider=h.locator('[role=slider]');slider.focus();slider.press('ArrowRight')
            q.wait_for_function("document.querySelector('[data-history-readout]').textContent.includes('Oct 20, 2026')")
            detail.locator('[data-history-comparison]').wait_for()
            h.get_by_role('button',name='All days',exact=True).click();slider.focus();slider.press('Home')
            q.wait_for_function("document.querySelector('[data-history-readout]').textContent.includes('Oct 20, 2025')")
            detail.get_by_text('The historical roster is unavailable for this date.',exact=True).wait_for()
            assert rows.count()==0 and 'No dated price' in readout.inner_text()
            h.locator('[data-history-current-select]').click()
            assert '$110.00' in readout.inner_text() and 'Current modeled quote' in readout.inner_text()
            assert not h.locator('[data-history-detail]').count()
            c['checks'].append('tap/click and keyboard day selection, earliest no-comparison, All days inception missingness, exact microseconds, and Current $110 preserved')
            c['detailRequests']=len(calls)
        except Exception as e:c['failure']=str(e);c['trace']=traceback.format_exc()
        finally:q.close();(out/'movers-browser.json').write_text(json.dumps(report,indent=2)+'\n')
    browser.close()
root=Path(__file__).resolve().parents[2]
report['base']=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
files=['src/surfaces/season-hub/'+f for f in ['TeamValueHistoryDetail.tsx','TeamValueHistory.tsx','TeamValueHistory.module.css','RosterValueSection.tsx','CourtsideHome.tsx']]
report['sourceBlobs']={f:subprocess.check_output(['git','hash-object',f],cwd=root,text=True).strip() for f in files}
(out/'movers-browser.json').write_text(json.dumps(report,indent=2)+'\n')
assert not any(c.get('failure') for c in report['cases']) and not any(report[k] for k in ['errors','external','writes']),report
print('PASS',len(report['cases']),'actual Next synthetic changed-player journeys')
