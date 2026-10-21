"""Actual Next minigame routes with synthetic read-only sources; no live operations."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import base64,json,subprocess,sys,traceback
out=Path(sys.argv[1]).resolve();origin=sys.argv[2];prior=sys.argv[3] if len(sys.argv)>3 else None
report={'synthetic':True,'cases':[],'failures':[],'pageErrors':[],'external':[],'writes':[],'findings':[]}
avatar=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
def guard(route):
    r=route.request;url=urlparse(r.url)
    if url.hostname=='sleepercdn.com':return route.fulfill(content_type='image/png',body=avatar)
    if url.hostname!='127.0.0.1':report['external'].append(r.url);return route.abort()
    if r.method!='GET':report['writes'].append(r.url);return route.abort()
    return route.continue_()
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    def openpage(name,path,mode='ready',width=320,text=200,base=origin,status=200):
        page=browser.new_page(viewport={'width':width,'height':900},reduced_motion='reduce');page.route('**/*',guard);page.set_default_timeout(12000)
        page.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
        page.set_extra_http_headers({'x-review-state':'stats-populated','x-qa-state':mode,'x-qa-run':'bugbash-'+name})
        assert page.goto(base+path,wait_until='domcontentloaded').status==status
        page.wait_for_function("document.documentElement.dataset.reviewHydrated==='true'")
        page.evaluate('(n)=>document.documentElement.style.fontSize=n+"%"',text)
        return page
    def geometry(page):
        g=page.evaluate('()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth})')
        assert g['viewport']==g['scroll'],g
        return g
    def run(name,fn):
        try:
            details=fn() or {};report['cases'].append({'case':name,**details})
        except Exception as e:report['failures'].append({'case':name,'error':str(e),'trace':traceback.format_exc()})
        finally:
            for context in browser.contexts:context.close()
    if prior:
        def baseline():
            page=openpage('baseline','/arcade/82-0-predictions',base=prior,width=390,text=100)
            page.get_by_text("The arcade's database hasn't been provisioned yet.",exact=False).wait_for()
            assert page.get_by_text('npx drizzle-kit push',exact=True).count()==1
            report['findings'].append({'path':'/arcade/82-0-predictions','before':'Unplayable concept enters legacy store path and exposes database setup instructions','after':'Development state before account/store loading'})
        run('unchanged-direct-route-reproduction',baseline)
    for width,text in [(1440,100),(320,200)]:
        def hub(width=width,text=text):
            page=openpage('hub-'+str(width),'/arcade',width=width,text=text)
            nav=page.get_by_role('navigation',name='Jump into a game');games=page.get_by_role('region',name='Available games')
            expected={'Ranked free throws':'/arcade/ranked-free-throw','Local free-throw practice':'/arcade/free-throw','Preview 82–0':'/arcade/week-2-preview','Practice Priced In':'/arcade/priced-in'}
            for label,path in expected.items():assert nav.get_by_role('link',name=label,exact=True).get_attribute('href')==path
            for label,path in [('Play ranked free throws','/arcade/ranked-free-throw'),('Local practice court','/arcade/free-throw'),('Preview 82–0','/arcade/week-2-preview'),('Practice Priced In','/arcade/priced-in')]:
                assert games.get_by_role('link',name=label,exact=True).get_attribute('href')==path
            assert not games.get_by_text('82-0 Predictions',exact=True).count()
            assert not games.locator('a[href$="/leaderboard"]').filter(has_text='Priced').count()
            assert 'when entries are open' in games.inner_text() and 'No scores, rankings or prizes' in games.inner_text()
            g=geometry(page)
            nav.get_by_role('link',name='Practice Priced In',exact=True).focus();page.keyboard.press('Enter');page.wait_for_url('**/arcade/priced-in')
            page.get_by_text('Practice game — scores stay in this session.',exact=False).wait_for()
            return {'geometry':g,'allHeaderDestinations':True,'keyboardLaunch':True,'truthfulModes':True}
        run('hub-'+str(width),hub)
        def construction(width=width,text=text):
            page=openpage('construction-'+str(width),'/arcade/82-0-predictions',width=width,text=text)
            page.get_by_role('heading',name='This game is not playable yet',exact=True).wait_for()
            assert 'Entries, scores, rankings and prizes are not open' in page.locator('main').inner_text()
            assert not page.get_by_text('npx drizzle-kit push',exact=True).count()
            assert not page.get_by_role('list',name='Weekly rankings').count()
            assert not page.get_by_role('link',name='Play ranked free throws',exact=True).count()
            return {'geometry':geometry(page),'noReleaseDateOrPrizePromise':True}
        run('construction-'+str(width),construction)
        def priced(width=width,text=text):
            page=openpage('priced-'+str(width),'/arcade/priced-in',width=width,text=text)
            for index in range(5):
                page.get_by_role('button',name='Over $',exact=False).click()
                page.get_by_role('button',name='See final score' if index==4 else 'Next player',exact=True).click()
            page.get_by_role('region',name='Final score',exact=True).wait_for();g=geometry(page)
            page.get_by_role('button',name='Play again',exact=True).click()
            page.get_by_role('region',name='Player 1 of 5',exact=True).wait_for()
            return {'geometry':g,'fiveLocalRoundsAndRedeal':True,'serverScoreWrites':0}
        run('priced-in-'+str(width),priced)
        def preview(width=width,text=text):
            page=openpage('preview-'+str(width),'/arcade/week-2-preview',width=width,text=text)
            calls=[];page.on('request',lambda r:calls.append(urlparse(r.url).path) if '/api/arcade/nba/' in r.url else None)
            page.get_by_role('button',name='Enter the demo',exact=True).click()
            for index in range(5):
                page.get_by_role('button',name='Reveal NBA team',exact=True).click()
                page.get_by_role('button',name='Fixture Player 1',exact=False).first.click()
                page.get_by_role('button',name='Lock in pick',exact=True).click()
                if index<4:page.get_by_role('button',name='Next team',exact=True).click()
            page.get_by_role('button',name='Draft another five',exact=True).wait_for()
            assert 'No ratings, season forecast, score submission or prize entry' in page.locator('main').inner_text()
            rosters=[path for path in calls if path.endswith('/roster')]
            assert len(set(rosters))==5 and len(rosters)==5,rosters
            return {'geometry':geometry(page),'fiveLocalPicks':True,'lazyRosterReads':len(rosters),'serverScoreWrites':0}
        run('preview-'+str(width),preview)
    def priced_unavailable():
        page=openpage('priced-unavailable','/arcade/priced-in','priced-unavailable')
        page.get_by_role('region',name='Priced In unavailable',exact=True).wait_for()
        assert not page.get_by_role('button',name='Over $',exact=False).count()
        return {'geometry':geometry(page),'noFabricatedRound':True}
    run('priced-unavailable',priced_unavailable)
    def directory_retry():
        page=openpage('directory-error','/arcade/week-2-preview','preview-directory-error')
        page.get_by_role('button',name='Enter the demo',exact=True).click()
        page.get_by_role('button',name='Retry opening draft',exact=True).wait_for()
        assert not page.get_by_role('button',name='Reveal NBA team',exact=True).count()
        page.set_extra_http_headers({'x-review-state':'stats-populated','x-qa-state':'ready','x-qa-run':'bugbash-directory-error'})
        page.get_by_role('button',name='Retry opening draft',exact=True).click()
        page.get_by_role('button',name='Reveal NBA team',exact=True).wait_for()
        return {'geometry':geometry(page),'noDrawUntilDirectoryRecovers':True}
    run('preview-directory-retry',directory_retry)
    def roster_retry():
        page=openpage('roster-error','/arcade/week-2-preview','preview-roster-error');reads=[]
        page.on('request',lambda r:reads.append(urlparse(r.url).path) if r.url.endswith('/roster') else None)
        page.get_by_role('button',name='Enter the demo',exact=True).click()
        page.get_by_role('button',name='Reveal NBA team',exact=True).click()
        page.get_by_role('button',name='Retry roster',exact=True).click()
        page.get_by_role('button',name='Fixture Player 1',exact=False).first.wait_for()
        assert len(reads)==2 and len(set(reads))==1,reads
        return {'geometry':geometry(page),'sameDrawRetried':True,'rosterReads':len(reads)}
    run('preview-roster-retry',roster_retry)
    for mode in ['disabled','signed-out','unavailable','recovery-closed','recovery-unavailable']:
        def availability(mode=mode):
            page=openpage('availability-'+mode,'/arcade/ranked-free-throw',mode)
            assert not page.get_by_role('button',name='Start ranked round',exact=True).count()
            assert not page.get_by_role('button',name='Save completed round',exact=True).count()
            assert page.get_by_role('link',name='Play local practice',exact=True).get_attribute('href')=='/arcade/free-throw'
            if mode=='signed-out':assert page.get_by_role('link',name='Sign in',exact=True).get_attribute('href')=='/account/login'
            return {'geometry':geometry(page),'noAdmissionOrSubmitControl':True}
        run('ranked-'+mode,availability)
    for mode,expected in [('history-held','Ranked history is held'),('history-error','History could not be verified.'),('ready','No mini-game weeks have been finalized yet.'),('history-final','Synthetic Week 1')]:
        def history(mode=mode,expected=expected):
            page=openpage(mode,'/arcade/history',mode);page.get_by_text(expected,exact=False).wait_for()
            if mode=='history-final':
                page.get_by_role('link',name='Synthetic Week 1',exact=True).click();page.get_by_role('list',name='Final ranked scores',exact=True).wait_for()
                assert not page.get_by_role('link',name='Play ranked free throws',exact=True).count()
                page.get_by_role('button',name='League',exact=True).click();page.get_by_text('No completed scores in this final.',exact=True).wait_for()
            return {'geometry':geometry(page),'historyStateDistinct':True}
        run(mode,history)
    for mode in ['upcoming','final','blocked']:
        def admission_phase(mode=mode):
            page=openpage('phase-'+mode,'/arcade/leaderboard',mode)
            page.get_by_role('list',name='Weekly ranked scores',exact=True).wait_for()
            assert not page.get_by_role('link',name='Play ranked free throws',exact=True).count()
            return {'geometry':geometry(page),'noOpenRoundPromise':True}
        run('period-'+mode,admission_phase)
    def wrong_archive():
        page=openpage('wrong-archive','/arcade/history/different-period')
        page.get_by_text('Rankings could not be loaded.',exact=False).wait_for()
        assert not page.get_by_role('list',name='Final ranked scores',exact=True).count()
        return {'wrongPeriodRowsSuppressed':True}
    run('archive-period-mismatch',wrong_archive)
    for path in ['/arcade/unknown-game','/arcade/unknown-game/leaderboard']:
        def unknown(path=path):
            openpage(path,path,status=404)
            return {'status':404}
        run('unknown-'+path,unknown)
    browser.close()
root=Path(json.loads((out/'app/tsconfig.json').read_text())['compilerOptions']['paths']['@/*'][0]).parents[1]
files=['src/app/arcade/[gameId]/page.tsx','src/surfaces/arcade/GameDetail.tsx','src/surfaces/arcade/GameDetail.module.css','src/surfaces/arcade/GameCard.tsx','src/surfaces/arcade/ArcadeHub.tsx','src/surfaces/arcade/RankedFreeThrow.tsx']
report['consumerBlobs']={path:subprocess.check_output(['git','hash-object',path],cwd=root,text=True).strip() for path in files}
(out/'bugbash.json').write_text(json.dumps(report,indent=2))
assert not report['failures'] and not report['pageErrors'] and not report['external'] and not report['writes'],json.dumps(report['failures'] or report['pageErrors'] or report['external'] or report['writes'])
print('PASS',len(report['cases']),'bounded actual-Next minigame checks')
