"""Phase-change scroll context through actual Next routes and synthetic NBA reads."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import base64,json,subprocess,sys,traceback
out=Path(sys.argv[1]).resolve();origin=sys.argv[2];baseline='--baseline' in sys.argv
selected=set(sys.argv[3:])-{'--baseline'}
report={'synthetic':True,'baseline':baseline,'cases':[],'failures':[],'pageErrors':[],'external':[],'writes':[]}
avatar=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
def guard(route):
    r=route.request;url=urlparse(r.url)
    if url.hostname=='sleepercdn.com':return route.fulfill(content_type='image/png',body=avatar)
    if url.hostname not in ['127.0.0.1','localhost']:report['external'].append(r.url);return route.abort()
    if r.method!='GET':report['writes'].append(r.url);return route.abort()
    return route.continue_()
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    configs=[(1440,900,100,'no-preference','pointer'),(390,844,100,'reduce','pointer')] if baseline else [(1440,900,100,'no-preference','pointer'),(1440,900,100,'reduce','keyboard-resize'),(390,844,100,'no-preference','keyboard'),(390,844,100,'reduce','pointer'),(320,900,200,'reduce','keyboard')]
    for width,height,text,motion,input_mode in configs:
        name=f'{width}-{text}-{motion}-{input_mode}';samples=[]
        if selected and name not in selected:continue
        page=browser.new_page(viewport={'width':width,'height':height},reduced_motion=motion);page.route('**/*',guard);page.set_default_timeout(12000)
        page.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
        page.set_extra_http_headers({'x-review-state':'stats-populated','x-qa-state':'ready','x-qa-run':'scroll-'+name})
        def activate(locator):
            if input_mode.startswith('keyboard'):locator.focus();page.keyboard.press('Enter')
            else:locator.click()
        def sample(phase):
            page.locator('[data-draft-phase="'+phase+'"]').wait_for()
            page.wait_for_function("document.activeElement===document.querySelector('[data-draft-phase] h1')")
            data=page.evaluate('''()=>{const root=document.querySelector('[data-draft-phase]'),chrome=document.querySelector('[data-site-chrome]').getBoundingClientRect(),back=root.querySelector('a'),badge=root.firstElementChild.lastElementChild,h1=root.querySelector('h1'),b=back.getBoundingClientRect(),l=badge.getBoundingClientRect(),h=h1.getBoundingClientRect();return{chromeBottom:chrome.bottom,backTop:b.top,backBottom:b.bottom,labelTop:l.top,headingTop:h.top,headingBottom:h.bottom,viewportHeight:innerHeight,scrollWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,focused:document.activeElement===h1,backHit:back.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)),scrollY}}''')
            data['phase']=phase;samples.append(data)
            if baseline:assert data['backTop']<data['chromeBottom'] or data['labelTop']<data['chromeBottom'],data
            else:
                assert data['backTop']>=data['chromeBottom'] and data['labelTop']>=data['chromeBottom'],data
                # Enlarged headings may need vertical scrolling; their beginning
                # and the retained navigation must be visible, never covered.
                assert data['headingTop']>=data['chromeBottom'] and data['headingTop']<data['viewportHeight'],data
                assert data['backHit'] and data['focused'],data
                assert data['scrollWidth']==data['viewportWidth'],data
            return data
        try:
            assert page.goto(origin+'/arcade/week-2-preview',wait_until='domcontentloaded').status==200
            page.wait_for_function("document.documentElement.dataset.reviewHydrated==='true'")
            page.evaluate('(n)=>document.documentElement.style.fontSize=n+"%"',text)
            activate(page.get_by_role('button',name='Enter the demo',exact=True))
            entry=sample('sealed')
            page.screenshot(path=str(out/(name+'-entry.png')))
            if not baseline:
                page.keyboard.press('Shift+Tab')
                back=page.get_by_role('link',name='Back to Arcade',exact=True)
                assert back.evaluate('n=>n===document.activeElement')
                for index in range(5):
                    activate(page.get_by_role('button',name='Reveal NBA team',exact=True))
                    if motion=='no-preference' and index==0:
                        activate(page.get_by_role('button',name='Skip animation',exact=True))
                    sample('revealed')
                    activate(page.get_by_role('button',name='Fixture Player 1',exact=False).first)
                    activate(page.get_by_role('button',name='Lock in pick',exact=True))
                    sample('complete' if index==4 else 'locked')
                    if index<4:
                        if input_mode=='keyboard-resize' and index==0:
                            page.set_viewport_size({'width':320,'height':900})
                            page.evaluate("document.documentElement.style.fontSize='200%'")
                            page.wait_for_timeout(150)
                        activate(page.get_by_role('button',name='Next team',exact=True));sample('sealed')
                page.get_by_role('button',name='Draft another five',exact=True).wait_for()
                activate(page.get_by_role('button',name='Draft another five',exact=True));sample('sealed')
                page.get_by_role('link',name='Back to Arcade',exact=True).focus();page.keyboard.press('Enter')
                page.wait_for_url('**/arcade');page.get_by_role('heading',name='The Arcade',exact=True).wait_for()
            report['cases'].append({'case':name,'entry':entry,'transitionsChecked':len(samples),'phases':sorted({s['phase']for s in samples}),'minimumBackClearance':min(s['backTop']-s['chromeBottom']for s in samples),'minimumLabelClearance':min(s['labelTop']-s['chromeBottom']for s in samples),'focusPreserved':all(s['focused']for s in samples),'keyboardBackNavigation':not baseline,'restartReturnedToContext':not baseline,'resizedChrome':input_mode=='keyboard-resize'})
            print('PASS',name,flush=True)
        except Exception as e:report['failures'].append({'case':name,'error':str(e),'trace':traceback.format_exc()});print('FAIL',name,str(e),flush=True)
        finally:page.close()
    browser.close()
root=Path(json.loads((out/'app/tsconfig.json').read_text())['compilerOptions']['paths']['@/*'][0]).parents[1]
files=['src/surfaces/arcade/week-two/WeekTwoDraft.tsx','src/surfaces/arcade/week-two/WeekTwoDraft.module.css','src/app/globals.css','src/ui/SiteChrome.tsx','src/ui/SiteChrome.module.css']
report['sourceBlobs']={f:subprocess.check_output(['git','hash-object',f],cwd=root,text=True).strip() for f in files}
(out/'scroll-offset.json').write_text(json.dumps(report,indent=2))
assert report['cases'] and not report['failures'] and not report['pageErrors'] and not report['external'] and not report['writes'],json.dumps(report['failures'] or report['pageErrors'] or report['external'] or report['writes'])
print('PASS',len(report['cases']),'baseline reproductions' if baseline else 'actual-Next scroll/focus journeys')
