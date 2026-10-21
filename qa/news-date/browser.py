"""Bounded actual-Next regression journeys. GET only, with synthetic source data."""
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
import base64,json,subprocess,sys,traceback
out=Path(sys.argv[1]).resolve();origin=sys.argv[2]
selected=set(sys.argv[3:])
report={'synthetic':True,'cases':[],'failures':[],'pageErrors':[],'hydrationErrors':[],'external':[],'writes':[]}
avatar=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
def guard(route):
    r=route.request;u=urlparse(r.url)
    if u.hostname=='sleepercdn.com':return route.fulfill(content_type='image/png',body=avatar)
    if u.hostname not in ['127.0.0.1','localhost']:report['external'].append(r.url);return route.abort()
    if r.method!='GET':report['writes'].append(r.url);return route.abort()
    return route.continue_()
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    def page(name,path,width=390,zone='America/New_York',summary='null',stamp='2026-10-20T02:30:00Z'):
        tab=browser.new_page(viewport={'width':width,'height':900},timezone_id=zone,reduced_motion='reduce');tab.route('**/*',guard);tab.set_default_timeout(12000)
        tab.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
        tab.on('console',lambda m:report['hydrationErrors'].append(m.text) if m.type=='error' and any(s in m.text.lower()for s in ['hydration','react error #418','did not match']) else None)
        tab.set_extra_http_headers({'x-review-state':'stats-populated','x-qa-summary':summary,'x-qa-date':stamp})
        assert tab.goto(origin+path,wait_until='domcontentloaded').status==200
        tab.wait_for_function("document.documentElement.dataset.reviewHydrated==='true'")
        return tab
    def geometry(tab):
        g=tab.evaluate('()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth})');assert g['viewport']==g['scroll'],g
        return g
    def run(name,fn):
        if selected and not any(name.startswith(prefix)for prefix in selected):return
        try:report['cases'].append({'case':name,**(fn()or{})});print('PASS',name,flush=True)
        except Exception as e:report['failures'].append({'case':name,'error':str(e),'trace':traceback.format_exc()});print('FAIL',name,str(e),flush=True)
        finally:
            for ctx in browser.contexts:ctx.close()
    for width in [1440,390]:
        for mode in ['null','missing','cached-null','legitimate']:
            def news(width=width,mode=mode):
                tab=page('news','/news',width=width,summary=mode)
                lead=tab.get_by_role('link',name='Synthetic lead headline',exact=True).locator('xpath=ancestor::article')
                assert lead.count()==1
                assert lead.locator('p').filter(has_text='Bobby Portis scored 20 points.').count()==(1 if mode=='legitimate' else 0)
                assert not lead.locator('p').filter(has_text='null').count()
                tab.get_by_text('The deal was declared null and void.',exact=True).wait_for()
                return {'geometry':geometry(tab),'summaryMode':mode,'headlineRetained':True,'legitimateNullProseRetained':True}
            run('news-'+mode+'-'+str(width),news)
        for stamp,label,zone in [('2026-10-20T02:30:00Z','Oct 19, 2026, EDT','America/Los_Angeles'),('2026-10-20T04:00:00Z','Oct 20, 2026, EDT','America/Los_Angeles'),('2026-01-01T04:30:00Z','Dec 31, 2025, EST','America/Los_Angeles'),('2026-10-20T02:30:00Z','Oct 19, 2026, EDT','UTC'),('2026-10-20T02:30:00Z','Oct 19, 2026, EDT','Asia/Tokyo')]:
            def dates(width=width,stamp=stamp,label=label,zone=zone):
                tab=page('dates','/',width=width,zone=zone,stamp=stamp)
                entry=tab.locator('#teams details').filter(has=tab.locator('summary[aria-label^="Fixture Club 4,"]'))
                entry.locator('summary').click();home_time=entry.locator('p').filter(has_text='Latest move').locator('time')
                assert home_time.inner_text()==label
                iso=home_time.get_attribute('datetime');assert iso==stamp.replace('Z','.000Z')
                geometry(tab);tab.goto(origin+'/transactions',wait_until='domcontentloaded')
                tx=tab.locator('li').filter(has_text='Bobby Portis').locator('time');assert tx.inner_text()==label and tx.get_attribute('datetime')==iso
                return {'geometry':geometry(tab),'label':label,'originalInstant':iso,'browserZone':zone,'homeMatchesTransactions':True}
            run('move-date-'+stamp+'-'+zone+'-'+str(width),dates)
        def search(width=width):
            tab=page('directory','/',width=width)
            field=tab.get_by_role('searchbox',name='Find a team, manager or roster player',exact=True)
            queries=['Sengun','Şengün','ŞENGÜN','S\u0327engu\u0308n','Alperen']
            for query in queries:
                field.fill(query);tab.get_by_text('1 of 10 teams match your search',exact=False).wait_for()
                assert tab.locator('#directory-list summary').count()==1
            field.fill('');geometry(tab)
            tab.goto(origin+'/trade-analyzer',wait_until='domcontentloaded')
            a=tab.get_by_role('region',name='TEAM A',exact=True);b=tab.get_by_role('region',name='TEAM B',exact=True)
            bquery=b.get_by_role('textbox',name='Search players for TEAM B',exact=True)
            for query in queries:
                bquery.fill(query);b.get_by_role('button',name='Alperen Şengün',exact=False).wait_for()
            b.get_by_role('button',name='Alperen Şengün',exact=False).click()
            assert parse_qs(urlparse(tab.url).query)['b']==['1-player-0']
            assert b.get_by_role('link',name='Alperen Şengün',exact=True).get_attribute('href')=='/player/1-player-0'
            a.get_by_role('textbox',name='Search players for TEAM A',exact=True).fill('Sengun');a.get_by_text('No matches.',exact=True).wait_for()
            bquery.fill('Şengün');b.get_by_text('No matches.',exact=True).wait_for()
            assert b.get_by_role('button',name='Remove Alperen Şengün from TEAM B',exact=True).count()==1
            b.get_by_role('button',name='Remove Alperen Şengün from TEAM B',exact=True).click()
            bquery.fill('Sengun');b.get_by_role('button',name='Alperen Şengün',exact=False).wait_for()
            bquery.fill('...');b.get_by_text('No matches.',exact=True).wait_for()
            return {'geometry':geometry(tab),'accentedAndUnaccentedQueries':queries,'displayNameAndCanonicalIdPreserved':True,'crossSideDuplicateRejected':True}
        run('directory-and-trade-search-'+str(width),search)
    browser.close()
report['sourceBlobs']={f:subprocess.check_output(['git','hash-object',f],text=True).strip() for f in ['src/data/real-news.ts','src/domain/news.ts','src/surfaces/news/NewsFeed.tsx','src/ui/TransactionDate.tsx','src/surfaces/season-hub/CourtsideDirectory.tsx','src/surfaces/transactions/TransactionFilters.tsx','src/surfaces/trade-analyzer/TradeAnalyzer.tsx']}
(out/'browser.json').write_text(json.dumps(report,indent=2))
assert report['cases'] and not report['failures'] and not report['pageErrors'] and not report['hydrationErrors'] and not report['external'] and not report['writes'],json.dumps(report['failures'] or report['pageErrors'] or report['hydrationErrors'])
print('PASS',len(report['cases']),'bounded actual-Next cases')
