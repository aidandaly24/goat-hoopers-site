"""Actual Next route: bounded layout and picker journeys; loopback GETs only."""
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
import base64,json,subprocess,sys,traceback

out=Path(sys.argv[1]).resolve();origin=sys.argv[2];baseline='--baseline' in sys.argv
assert urlparse(origin).hostname in ['127.0.0.1','localhost']
report={'synthetic':True,'baseline':baseline,'cases':[],'failures':[],'external':[],'writes':[],'pageErrors':[],'hydrationErrors':[]}
pixel=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
def guard(route):
    r=route.request;host=urlparse(r.url).hostname
    if host=='sleepercdn.com':return route.fulfill(content_type='image/png',body=pixel)
    if host not in ['127.0.0.1','localhost']:report['external'].append(r.url);return route.abort()
    if r.method!='GET':report['writes'].append(r.url);return route.abort()
    route.continue_()

def measure(tab,state):
    g=tab.evaluate('''()=>{
      const root=document.querySelector('[class*="_terminal"]');
      const bounds=root.getBoundingClientRect();
      const controls=[...root.querySelectorAll('button,input,a')].map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label')||e.textContent||e.placeholder,width:r.width,height:r.height};});
      const names=[...root.querySelectorAll('[class*="_resultName"],[class*="_pickName"]')].map(e=>{const s=getComputedStyle(e);return {text:e.textContent,width:e.clientWidth,scrollWidth:e.scrollWidth,height:e.clientHeight,scrollHeight:e.scrollHeight,whiteSpace:s.whiteSpace,textOverflow:s.textOverflow};});
      const escapes=[...root.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(r.right>bounds.right+1||r.left<bounds.left-1)}).map(e=>({tag:e.tagName,classes:e.className,text:e.textContent.slice(0,90)}));
      return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,rootWidth:bounds.width,controls,names,escapes};
    }''')
    g['state']=state
    if not baseline:
        assert g['scrollWidth']==g['viewport'],g
        assert not g['escapes'],g
        assert all(c['width']>=44 and c['height']>=44 for c in g['controls']),g
        assert all(n['scrollWidth']<=n['width']+1 and n['scrollHeight']<=n['height']+1 and n['whiteSpace']!='nowrap' and n['textOverflow']!='ellipsis' for n in g['names']),g
    return g

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width,scale,motion in [(1440,100,'no-preference'),(1280,200,'no-preference'),(390,200,'reduce'),(320,100,'reduce'),(320,200,'no-preference'),(320,200,'reduce')]:
        name=f'{width}px-{scale}percent-{motion}';case={'case':name,'states':[]}
        context=browser.new_context(viewport={'width':width,'height':900},reduced_motion=motion)
        context.route('**/*',guard);tab=context.new_page();tab.set_default_timeout(12000)
        tab.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
        tab.on('console',lambda m:report['hydrationErrors'].append(m.text) if m.type=='error' and any(x in m.text.lower()for x in ['hydration','react error #418','did not match']) else None)
        try:
            assert tab.goto(origin+'/trade-analyzer',wait_until='domcontentloaded').status==200
            tab.wait_for_function("document.documentElement.dataset.reviewHydrated==='true'")
            tab.evaluate('(scale)=>document.documentElement.style.fontSize=scale+"%"',scale)
            a=tab.get_by_role('region',name='TEAM A',exact=True);b=tab.get_by_role('region',name='TEAM B',exact=True)
            aq=a.get_by_role('textbox');bq=b.get_by_role('textbox')
            case['states'].append(measure(tab,'empty'))
            aq.fill('Sengun');result=a.get_by_role('button',name='Alperen Şengün',exact=False);result.wait_for()
            case['states'].append(measure(tab,'accented-picker'))
            aq.press('Tab');assert result.evaluate('(e)=>e===document.activeElement');result.press('Enter')
            a.get_by_role('link',name='Alperen Şengün',exact=True).wait_for()
            assert parse_qs(urlparse(tab.url).query)['a']==['1-player-0']
            case['states'].append(measure(tab,'selected-accented-player'))
            for q in [aq,bq]:q.fill('Sengun')
            a.get_by_text('No matches.',exact=True).wait_for();b.get_by_text('No matches.',exact=True).wait_for()
            aq.fill('');bq.fill('extraordinarily')
            long_result=b.get_by_role('button',name='Synthetic extraordinarily long basketball player surname',exact=False);long_result.wait_for()
            case['states'].append(measure(tab,'long-name-picker'))
            long_result.click();b.get_by_role('link',name='Synthetic extraordinarily long basketball player surname',exact=True).wait_for()
            tab.get_by_text('> AWAITING INPUT',exact=True).wait_for(state='hidden')
            case['states'].append(measure(tab,'both-sides-priced'))
            bq.fill('SyntheticUnbroken');b.get_by_role('button',name='SyntheticUnbrokenPlayerNameThatMustRemainFullyReadableAtLargeText',exact=False).wait_for()
            case['states'].append(measure(tab,'unbroken-name-picker'))
            b.get_by_role('button',name='SyntheticUnbrokenPlayerNameThatMustRemainFullyReadableAtLargeText',exact=False).click()
            b.get_by_role('link',name='SyntheticUnbrokenPlayerNameThatMustRemainFullyReadableAtLargeText',exact=True).wait_for()
            case['states'].append(measure(tab,'three-selected-players'))
            tab.evaluate('''()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Synthetic denied clipboard')}}});document.execCommand=()=>false;}''')
            tab.get_by_role('button',name='> COPY LINK',exact=True).click()
            tab.get_by_role('button',name='> COPY FAILED — COPY URL MANUALLY',exact=True).wait_for()
            case['states'].append(measure(tab,'full-copy-failure-label'))
            tab.screenshot(path=str(out/(name+'.png')),full_page=True)
            # Canonical URL survives reload; selected IDs remain unique across sides.
            before=parse_qs(urlparse(tab.url).query);assert not set(before['a'])&set(before['b'])
            tab.reload(wait_until='domcontentloaded');b.get_by_role('link',name='Synthetic extraordinarily long basketball player surname',exact=True).wait_for()
            assert parse_qs(urlparse(tab.url).query)==before
            b.get_by_role('button',name='Remove Synthetic extraordinarily long basketball player surname from TEAM B',exact=True).click()
            bq.fill('extraordinarily');b.get_by_role('button',name='Synthetic extraordinarily long basketball player surname',exact=False).wait_for()
            case.update({'accentSearch':True,'keyboardSelection':True,'duplicateGuard':True,'pricedVerdict':True,'canonicalReload':True,'removeAndReadd':True})
            report['cases'].append(case);print('PASS',name,flush=True)
        except Exception as e:
            report['failures'].append({'case':name,'error':str(e),'trace':traceback.format_exc(),'completedStates':case['states']});print('FAIL',name,str(e)[:180],flush=True)
        finally:context.close()
    browser.close()

source=Path(__file__).resolve().parents[2]
report['sourceRevision']=subprocess.check_output(['git','rev-parse','HEAD'],cwd=source,text=True).strip()
report['sourceBlobs']={f:subprocess.check_output(['git','hash-object',f],cwd=source,text=True).strip() for f in ['src/surfaces/trade-analyzer/TradeAnalyzer.tsx','src/surfaces/trade-analyzer/TradeAnalyzer.module.css','src/surfaces/trade-analyzer/tradeUrl.ts','src/domain/player-search.ts']}
(out/'browser.json').write_text(json.dumps(report,indent=2))
assert len(report['cases'])==6 and not any(report[k]for k in ['failures','external','writes','pageErrors','hydrationErrors']),report['failures']
print('PASS 6 actual-route journeys / 48 measured states'+(' (baseline measurements only)'if baseline else ''))
