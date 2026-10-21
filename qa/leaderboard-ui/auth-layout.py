"""Targeted consumer regressions: synthetic auth and active Priced In layouts."""
from pathlib import Path
from urllib.parse import urlparse,parse_qs,quote
from playwright.sync_api import sync_playwright
import base64,json,subprocess,sys,traceback
out=Path(sys.argv[1]).resolve();origin=sys.argv[2]
only={arg for arg in sys.argv[3:] if not arg.startswith('--skip=')};skip={arg.removeprefix('--skip=') for arg in sys.argv[3:] if arg.startswith('--skip=')}
report={'synthetic':True,'cases':[],'failures':[],'pageErrors':[],'external':[],'unexpectedWrites':[]}
avatar=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
ranked='/arcade/ranked-free-throw';run_id='11111111-1111-4111-8111-111111111111'
def guard(route):
    r=route.request;url=urlparse(r.url)
    if url.hostname=='sleepercdn.com':return route.fulfill(content_type='image/png',body=avatar)
    if url.hostname not in ['127.0.0.1','localhost']:report['external'].append(r.url);return route.abort()
    if r.method!='GET' and not(r.method=='POST' and url.path in ['/api/auth/sign-in/email','/api/arcade/free-throw/runs','/api/arcade/free-throw/scores']):
        report['unexpectedWrites'].append(r.url);return route.abort()
    return route.continue_()
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    def openpage(case,path,mode='ready',width=390,text=100):
        page=browser.new_page(viewport={'width':width,'height':900},reduced_motion='reduce');page.route('**/*',guard);page.set_default_timeout(12000)
        page.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
        page.set_extra_http_headers({'x-review-state':'stats-populated','x-qa-state':mode,'x-qa-run':'auth-layout-'+case})
        assert page.goto(origin+path,wait_until='domcontentloaded').status==200
        page.wait_for_function("document.documentElement.dataset.reviewHydrated==='true'")
        page.evaluate('(n)=>document.documentElement.style.fontSize=n+"%"',text)
        return page
    def case(name,fn):
        if name in skip or only and name not in only:return
        try:
            result=fn() or {};report['cases'].append({'case':name,**result});print('PASS',name,flush=True)
        except Exception as e:
            report['failures'].append({'case':name,'error':str(e),'trace':traceback.format_exc()});print('FAIL',name,str(e),flush=True)
            for ctx in browser.contexts:
                for page in ctx.pages:
                    try:page.screenshot(path=str(out/(name+'-failure.png')),full_page=True)
                    except:pass
        finally:
            for ctx in browser.contexts:ctx.close()
    def geometry(page):
        g=page.evaluate('()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth})');assert g['viewport']==g['scroll'],g
        return g
    def login(page,expected):
        page.get_by_label('Email',exact=True).fill('synthetic-only@example.invalid')
        page.get_by_label('Password',exact=True).fill('synthetic-only-password')
        page.get_by_role('button',name='Log in',exact=True).click()
        page.wait_for_url(lambda url:urlparse(str(url)).path==urlparse(expected).path and urlparse(str(url)).query==urlparse(expected).query)
        assert page.url==origin+expected,page.url
    def contextual_login(page,destination):
        link=page.get_by_role('link',name='Sign in to check this round' if '?run=' in destination else 'Sign in',exact=True)
        link.wait_for();href=link.get_attribute('href');assert href=='/account/login?next='+quote(destination,safe=''),href
        link.click();page.wait_for_url('**/account/login?*');login(page,destination)
    def complete(page):
        page.get_by_role('button',name='Start ranked round',exact=True).click()
        shoot=page.get_by_role('button',name='Take synthetic shot',exact=True)
        for _ in range(2):shoot.click();page.wait_for_timeout(100)
        page.get_by_role('button',name='Save completed round',exact=True).click()
    def bookmark():
        destination=ranked+'?run='+run_id
        page=openpage('bookmark',destination+'&next=https://attacker.invalid','signed-out');writes=[]
        page.on('request',lambda r:writes.append(urlparse(r.url).path) if r.method=='POST' else None)
        contextual_login(page,destination)
        page.get_by_text('No saved result was found for this account and round.',exact=True).wait_for()
        assert writes==['/api/auth/sign-in/email'],writes
        assert not page.locator('[data-just-accepted]').count()
        return {'realLoginFormAndContinuation':True,'runPreserved':True,'untrustedNextDropped':True,'staleRunNoResult':True,'scorePosts':0}
    case('signed-out-bookmark',bookmark)
    for index,query in enumerate(['run='+quote('https://attacker.invalid',safe=''),'run='+run_id+'&run=22222222-2222-4222-8222-222222222222']):
        def invalid(query=query):
            page=openpage(query,ranked+'?'+query,'signed-out')
            contextual_login(page,ranked)
            assert urlparse(page.url).query==''
            return {'invalidOrAmbiguousRunDropped':True,'canonicalRankedReturn':True}
        case('invalid-run-'+str(index+1),invalid)
    def bad_login_next():
        page=openpage('bad-next','/account/login?next='+quote('//attacker.invalid',safe=''))
        login(page,'/')
        return {'actualLoginRejectsExternalNext':True}
    case('login-rejects-external-next',bad_login_next)
    for mode in ['auth401-start','auth401-save','auth401-result','auth401-check']:
        def expired(mode=mode):
            path=ranked+'?run='+run_id if mode=='auth401-result' else ranked
            page=openpage(mode,path,mode);posts=[]
            page.on('request',lambda r:posts.append(urlparse(r.url).path) if r.method=='POST' else None)
            if mode=='auth401-start':page.get_by_role('button',name='Start ranked round',exact=True).click()
            elif mode in ['auth401-save','auth401-check']:
                complete(page)
                if mode=='auth401-check':page.get_by_role('button',name='Check saved result',exact=True).click()
            page.get_by_text('Your sign-in has expired.',exact=False).wait_for()
            assert not page.get_by_role('button',name='Save completed round',exact=True).count()
            assert not page.locator('[data-just-accepted]').count()
            destination=urlparse(page.url).path+('?' +urlparse(page.url).query if urlparse(page.url).query else '')
            sent=len(posts);contextual_login(page,destination)
            if '?run=' in destination:page.get_by_text('No saved result was found for this account and round.',exact=True).wait_for()
            else:page.get_by_role('button',name='Start ranked round',exact=True).wait_for()
            assert posts[sent:]==['/api/auth/sign-in/email'],posts
            assert not page.locator('[data-just-accepted]').count()
            return {'contextualSignIn':True,'destination':destination,'noAutomaticRetryOrAcceptedFeedback':True}
        case(mode,expired)
    def saved_recovery():
        page=openpage('saved',ranked,'record-beaten');complete(page)
        page.locator('[data-record-beaten="true"]').wait_for();destination=urlparse(page.url).path+'?'+urlparse(page.url).query
        page.set_extra_http_headers({'x-review-state':'stats-populated','x-qa-state':'signed-out','x-qa-run':'auth-layout-saved'})
        page.context.clear_cookies();page.goto(origin+destination,wait_until='domcontentloaded')
        contextual_login(page,destination);page.locator('[data-just-accepted="false"]').wait_for()
        assert not page.locator('[data-record-beaten="true"]').count()
        foreign=ranked+'?run=22222222-2222-4222-8222-222222222222'
        page.goto(origin+foreign,wait_until='domcontentloaded');page.get_by_text('No saved result was found for this account and round.',exact=True).wait_for()
        assert not page.locator('[data-just-accepted]').count()
        return {'ownedRecoveryWithoutCelebration':True,'foreignRunNoPrivateResult':True,'ownershipIsSyntheticFixtureOnly':True}
    case('saved-recovery-and-foreign-run',saved_recovery)
    for width,text in [(1440,100),(390,100),(320,200)]:
        for mode in ['ready','priced-long-names']:
            def playing(width=width,text=text,mode=mode):
                page=openpage('playing-'+mode+str(width),'/arcade/priced-in',mode,width,text);states=[]
                for index in range(5):
                    region=page.get_by_role('region',name=f'Player {index+1} of 5',exact=True);region.wait_for()
                    states.append({'state':'active-'+str(index+1),**geometry(page)})
                    bounds=region.bounding_box()
                    for span in region.locator(':scope > div').first.locator(':scope > span').all():
                        b=span.bounding_box();assert b['x']+b['width']<=bounds['x']+bounds['width']+1,{'progress':b,'card':bounds}
                    for name in ['Over $','Under $']:
                        button=region.get_by_role('button',name=name,exact=False);assert button.bounding_box()['height']>=44
                    if width==320 and index==0:region.screenshot(path=str(out/(mode+'-active-320.png')))
                    page.get_by_role('button',name='Over $',exact=False).click()
                    page.get_by_role('button',name='See final score' if index==4 else 'Next player',exact=True).wait_for()
                    states.append({'state':'reveal-'+str(index+1),**geometry(page)})
                    page.get_by_role('button',name='See final score' if index==4 else 'Next player',exact=True).click()
                page.get_by_role('region',name='Final score',exact=True).wait_for();geometry(page)
                return {'width':width,'rootTextPercent':text,'activeAndRevealStates':states,'minimumButtonHeight':44,'longUnbrokenNames':mode=='priced-long-names'}
            case('playing-'+mode+'-'+str(width),playing)
    browser.close()
root=Path(json.loads((out/'app/tsconfig.json').read_text())['compilerOptions']['paths']['@/*'][0]).parents[1]
files=['src/surfaces/arcade/RankedFreeThrow.tsx','src/surfaces/arcade/priced-in/PricedIn.module.css','src/app/account/login/page.tsx','src/app/account/continue/route.ts','src/domain/login-navigation.ts','src/surfaces/accounts/AccountForm.tsx']
report['sourceBlobs']={f:subprocess.check_output(['git','hash-object',f],cwd=root,text=True).strip() for f in files}
(out/'auth-layout.json').write_text(json.dumps(report,indent=2))
assert report['cases'] and not report['failures'] and not report['pageErrors'] and not report['external'] and not report['unexpectedWrites'],json.dumps(report['failures'] or report['pageErrors'] or report['external'] or report['unexpectedWrites'])
print('PASS',len(report['cases']),'targeted actual-Next regressions')
