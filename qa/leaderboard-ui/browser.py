"""Bounded actual-Next UI journeys. Synthetic loopback sources; no account setup."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import base64,json,sys,traceback,subprocess
out=Path(sys.argv[1]).resolve();origin=sys.argv[2];baseline='--baseline' in sys.argv
selected=set(sys.argv[3:]) - {'--baseline'}
report={'synthetic':True,'baseline':baseline,'cases':[],'errors':[],'external':[],'unexpectedWrites':[],'failures':[]}
avatar=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
captured={}
def guard(route):
    r=route.request;u=urlparse(r.url)
    if u.hostname=='sleepercdn.com':return route.fulfill(content_type='image/png',body=avatar)
    if u.hostname!='127.0.0.1':report['external'].append(r.url);return route.abort()
    if r.method!='GET' and not(r.method=='POST' and u.path in ['/api/arcade/free-throw/runs','/api/arcade/free-throw/scores']):
        report['unexpectedWrites'].append(r.url);return route.abort()
    if u.path.startswith('/api/arcade/') and not u.path.endswith('/clock'):
        response=route.fetch();captured[r.url]=response.json();return route.fulfill(response=response,body=response.body())
    return route.continue_()
def geometry(page):return page.evaluate('''()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth})''')
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    def openpage(run,path='/arcade/leaderboard',mode='ready',width=390,text=100,motion='reduce'):
        page=browser.new_page(viewport={'width':width,'height':900},reduced_motion=motion)
        page.route('**/*',guard);page.set_default_timeout(15000)
        page.on('pageerror',lambda e:report['errors'].append(str(e)))
        page.set_extra_http_headers({'x-review-state':'stats-populated','x-qa-state':mode,'x-qa-run':run})
        assert page.goto(origin+path,wait_until='domcontentloaded').status==200
        page.wait_for_function("document.documentElement.dataset.reviewHydrated==='true'")
        page.evaluate('(n)=>document.documentElement.style.fontSize=n+"%"',text)
        return page
    try:
        if baseline or not selected or 'race' in selected:
            # Same component, different request identity: no old rows under a new heading.
            page=openpage('race','/qa/leaderboard','race')
            page.get_by_text('weekly_hooper',exact=True).wait_for()
            page.get_by_role('button',name='Switch board kind').click()
            oldVisible=page.get_by_text('weekly_hooper',exact=True).count()
            if baseline:
                assert oldVisible==1
                report['cases'].append({'case':'baseline-prop-race','oldWeeklyRowsUnderAllTimeHeading':oldVisible})
                page.get_by_text('alltime_hooper',exact=True).wait_for()
            else:
                assert oldVisible==0
                page.get_by_text('Loading rankings…',exact=True).wait_for()
                page.get_by_text('alltime_hooper',exact=True).wait_for()
                page.get_by_role('button',name='League',exact=True).click()
                page.wait_for_timeout(100)
                page.get_by_role('button',name='Everyone',exact=True).click()
                page.get_by_text('alltime_hooper',exact=True).wait_for();page.wait_for_timeout(850)
                assert not page.get_by_text('No validated league scores',exact=False).count()
                report['cases'].append({'case':'prop-and-scope-races','oldRowsHidden':True,'lastScopeWins':True})
            page.close()
        if baseline:
            page=openpage('baseline-links','/arcade')
            games=page.get_by_role('region',name='Available games',exact=True)
            assert games.locator('a[href="/arcade/free-throw"]').first.count()==1
            assert games.locator('a[href="/arcade/priced-in/leaderboard"]').count()==1
            report['cases'].append({'case':'baseline-entry','primaryFreeThrow':'local practice','unsupportedPricedInBoardAdvertised':True})
            page.close()
        else:
            if not selected or 'header-shortcuts' in selected:
                for width,text in [(1440,100),(320,200)]:
                    page=openpage('header-'+str(width),'/arcade',width=width,text=text)
                    shortcuts=page.get_by_role('navigation',name='Jump into a game',exact=True)
                    assert shortcuts.get_by_role('link',name='Ranked free throws',exact=True).get_attribute('href')=='/arcade/ranked-free-throw'
                    assert not shortcuts.get_by_role('link',name='Free Throw Shootout',exact=True).count()
                    assert geometry(page)['scroll']==width
                    shortcuts.get_by_role('link',name='Ranked free throws',exact=True).click()
                    page.wait_for_url('**/arcade/ranked-free-throw')
                    page.get_by_role('button',name='Start ranked round',exact=True).wait_for()
                    page.go_back(wait_until='domcontentloaded')
                    page.get_by_role('navigation',name='Jump into a game').get_by_role('link',name='Local free-throw practice',exact=True).click()
                    page.wait_for_url('**/arcade/free-throw')
                    page.get_by_text('Local practice. No ranked result is saved.',exact=True).wait_for()
                    report['cases'].append({'case':'header-shortcuts-'+str(width),'rankedDestination':True,'explicitPracticeDestination':True,'noOverflow':True})
                    page.close()
            for width,text,motion in [(1440,100,'no-preference'),(390,100,'reduce'),(320,200,'reduce')]:
                run=f'journey-{width}-{text}'
                if selected and run not in selected:continue
                page=openpage(run,'/arcade',width=width,text=text,motion=motion)
                writes=[];page.on('request',lambda r:writes.append({'url':r.url,'body':r.post_data_json}) if r.method=='POST' else None)
                games=page.get_by_role('region',name='Available games',exact=True)
                assert games.locator('a[href="/arcade/priced-in/leaderboard"]').count()==0
                assert games.locator('a[href="/arcade/week-2-preview/leaderboard"]').count()==0
                games.get_by_role('link',name='Play ranked free throws',exact=True).click()
                page.wait_for_url('**/arcade/ranked-free-throw')
                page.get_by_role('button',name='Start ranked round',exact=True).click()
                shoot=page.get_by_role('button',name='Take synthetic shot',exact=True)
                for _ in range(2):shoot.click();page.wait_for_timeout(100)
                save=page.get_by_role('button',name='Save completed round',exact=True)
                save.click()
                accepted=page.locator('[data-just-accepted="true"]');accepted.wait_for()
                assert 'Round saved' in accepted.inner_text() and 'server validated' in accepted.inner_text()
                animation=accepted.evaluate('n=>getComputedStyle(n).animationName')
                assert animation=='none' if motion=='reduce' else 'saved-round' in animation,animation
                page.get_by_role('list',name='Weekly rankings',exact=True).get_by_text('fixture_hooper',exact=True).wait_for()
                scorePosts=[w for w in writes if w['url'].endswith('/scores')]
                assert len(scorePosts)==1 and sorted(scorePosts[0]['body'])==['runId','shots']
                assert len(scorePosts[0]['body']['shots'])==2
                assert not page.get_by_text('new record',exact=False).count()
                assert not page.get_by_text('personal best',exact=False).count()
                g=geometry(page);assert g['scroll']==width,g
                accepted.screenshot(path=str(out/(run+'-saved.png')))
                page.reload(wait_until='domcontentloaded')
                page.evaluate('(n)=>document.documentElement.style.fontSize=n+"%"',text)
                page.locator('[data-just-accepted="false"]').wait_for()
                assert not page.locator('[data-just-accepted="true"]').count()
                assert len([w for w in writes if w['url'].endswith('/scores')])==1
                page.get_by_role('navigation',name='Saved score leaderboards').get_by_role('link',name='All-time ranked leaderboard',exact=True).click()
                page.get_by_role('list',name='All-time ranked scores').get_by_text('fixture_hooper',exact=False).wait_for()
                page.get_by_role('button',name='League',exact=True).click()
                page.get_by_text('No validated league scores',exact=False).wait_for()
                assert 'currently linked' in page.get_by_text('League includes verified accounts',exact=False).inner_text()
                page.get_by_role('button',name='Everyone',exact=True).click()
                page.get_by_role('list',name='All-time ranked scores').wait_for()
                page.get_by_role('link',name='Current week',exact=True).click()
                page.get_by_role('list',name='Weekly ranked scores').get_by_text('fixture_hooper',exact=False).wait_for()
                assert geometry(page)['scroll']==width
                page.get_by_role('region',name='This week’s leaderboard',exact=True).screenshot(path=str(out/(run+'-weekly.png')))
                report['cases'].append({'case':run,'geometry':g,'syntheticScorePosts':1,'acceptedThenRefreshed':True,'recoveredWithoutCelebrating':True,'allTimeAndWeeklyPersisted':True,'reducedMotion':motion})
                page.close()
            if 'records' in selected:
                for mode,width,text,motion in [('beaten',1440,100,'no-preference'),('beaten',390,100,'reduce'),('beaten',320,200,'reduce'),('first',390,100,'reduce'),('tied',390,100,'reduce'),('below',390,100,'reduce'),('mixed',390,100,'reduce'),('missing',390,100,'reduce'),('misbound',390,100,'reduce'),('malformed',390,100,'reduce'),('lost-response',390,100,'reduce'),('retry',390,100,'reduce'),('duplicate',390,100,'reduce')]:
                    run=f'record-{mode}-{width}'
                    page=openpage(run,'/arcade/ranked-free-throw','record-'+mode,width=width,text=text,motion=motion)
                    posts=[];page.on('request',lambda r:posts.append(r.url) if r.method=='POST' else None)
                    def complete_round():
                        page.get_by_role('button',name='Start ranked round',exact=True).click()
                        shoot=page.get_by_role('button',name='Take synthetic shot',exact=True)
                        for _ in range(2):shoot.click();page.wait_for_timeout(100)
                        page.get_by_role('button',name='Save completed round',exact=True).click()
                    complete_round()
                    if mode in ['lost-response','retry']:
                        page.get_by_text('Check the saved result before retrying.',exact=False).wait_for()
                        assert not page.locator('[data-record-beaten="true"]').count()
                        page.get_by_role('button',name='Check saved result',exact=True).click()
                        if mode=='retry':
                            page.get_by_text('No saved result found.',exact=False).wait_for()
                            page.get_by_role('button',name='Save completed round',exact=True).click()
                    accepted=page.locator('[data-just-accepted="false"]' if mode=='lost-response' else '[data-just-accepted="true"]');accepted.wait_for()
                    expected_beaten=mode in ['beaten','retry','duplicate']
                    assert accepted.get_attribute('data-record-beaten')==str(expected_beaten).lower()
                    comparisons=page.get_by_role('list',name='Server-confirmed score comparisons',exact=True)
                    if mode in ['missing','misbound','malformed','lost-response']:
                        assert not comparisons.count()
                    else:
                        comparisons.wait_for()
                        assert 'Confirmed at acceptance' in accepted.inner_text()
                        assert 'Everyone' in accepted.inner_text() and 'compatible score formats' in accepted.inner_text()
                        if mode=='first':assert 'First personal score' in accepted.inner_text() and 'Record beaten!' not in accepted.inner_text()
                        if mode=='tied':assert 'Personal best tied' in accepted.inner_text() and 'Record beaten!' not in accepted.inner_text()
                        if mode=='mixed':assert 'First personal score' in accepted.inner_text() and 'Weekly record tied' in accepted.inner_text() and 'Record beaten!' not in accepted.inner_text()
                        if expected_beaten:
                            assert 'New personal best' in accepted.inner_text() and '0 to ' in accepted.inner_text()
                            animation=accepted.evaluate('n=>getComputedStyle(n).animationName')
                            assert animation=='none' if motion=='reduce' else 'record-beaten' in animation,animation
                    assert geometry(page)['scroll']==width,geometry(page)
                    if mode=='beaten':accepted.screenshot(path=str(out/(run+'.png')))
                    if mode=='duplicate':
                        complete_round()
                        page.locator('[data-just-accepted="false"]').wait_for()
                        assert not page.locator('[data-record-beaten="true"]').count()
                        assert not comparisons.count()
                    sent=len(posts)
                    page.reload(wait_until='domcontentloaded')
                    page.evaluate('(n)=>document.documentElement.style.fontSize=n+"%"',text)
                    page.locator('[data-just-accepted="false"]').wait_for()
                    assert not page.locator('[data-record-beaten="true"]').count()
                    assert not page.get_by_role('list',name='Server-confirmed score comparisons',exact=True).count()
                    assert len(posts)==sent
                    report['cases'].append({'case':run,'beatenEffect':expected_beaten,'recoveryWithoutNotice':True,'noOverflow':True,'reducedMotion':motion,'duplicateSuppressed':mode=='duplicate'})
                    page.close()
            for mode in ['held','error','empty','invalid','blocked']:
                if selected and mode not in selected:continue
                page=openpage('state-'+mode,mode=mode,width=320,text=200)
                expected={'held':'Ranked leaderboards are not enabled or ready.','error':'Rankings could not be loaded.','empty':'No validated scores in this board yet.','invalid':'Rankings could not be loaded.','blocked':'New rounds are paused'}[mode]
                page.get_by_text(expected,exact=False).wait_for()
                if mode not in ['empty']:assert not page.get_by_text('No validated scores in this board yet.',exact=False).count()
                if mode in ['held','error']:
                    page.set_extra_http_headers({'x-review-state':'stats-populated','x-qa-state':'ready','x-qa-run':'state-'+mode})
                    page.get_by_role('button',name='Check rankings again' if mode=='held' else 'Reload rankings').click()
                    page.get_by_text('weekly_hooper',exact=True).wait_for()
                assert geometry(page)['scroll']==320
                report['cases'].append({'case':mode,'distinctState':True});page.close()
            for game in ['priced-in','week-2-preview','82-0-predictions']:
                if selected and 'unsupported-'+game not in selected:continue
                page=openpage('unsupported-'+game,'/arcade/'+game+'/leaderboard')
                page.get_by_role('heading',name='has no ranked leaderboard',exact=False).wait_for()
                assert not page.get_by_role('group',name='Rankings scope').count()
                if game=='82-0-predictions':page.get_by_text('not playable yet',exact=False).wait_for()
                report['cases'].append({'case':'unsupported-'+game,'honestUnranked':True});page.close()
            if not selected or 'rejected' in selected:
                page=openpage('rejected','/arcade/ranked-free-throw','reject')
                page.get_by_role('button',name='Start ranked round',exact=True).click()
                shoot=page.get_by_role('button',name='Take synthetic shot',exact=True)
                for _ in range(2):shoot.click();page.wait_for_timeout(100)
                page.get_by_role('button',name='Save completed round',exact=True).click()
                page.get_by_text('Check the saved result before retrying.',exact=False).wait_for()
                assert not page.locator('[data-just-accepted]').count()
                report['cases'].append({'case':'rejected-save','noCelebration':True});page.close()
    except Exception as e:
        report['failures'].append({'error':str(e),'trace':traceback.format_exc()})
        try:page.screenshot(path=str(out/'failure.png'),full_page=True)
        except:pass
    finally:browser.close()
files=['src/surfaces/arcade/'+n for n in ['ArcadeHub.tsx','CompetitionLeaderboard.tsx','CompetitionLeaderboard.module.css','GameCard.tsx','RankedFreeThrow.tsx','RankedFreeThrow.module.css']]
root=Path(json.loads((out/'app/tsconfig.json').read_text())['compilerOptions']['paths']['@/*'][0]).parents[1]
report['consumerBlobs']={f:subprocess.check_output(['git','hash-object',f],cwd=root,text=True).strip() for f in files}
(out/('browser'+('-'+','.join(sorted(selected)) if selected else '')+'.json')).write_text(json.dumps(report,indent=2))
assert report['cases'] and not report['failures'] and not report['errors'] and not report['external'] and not report['unexpectedWrites'],json.dumps(report['failures'] or report['errors'])
print('PASS',len(report['cases']),'bounded synthetic production Next cases')
