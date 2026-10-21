"""Credential-free production Next fixture for leaderboard consumer changes."""
from pathlib import Path
import json,runpy,shutil,sys
qa_source=Path(__file__).resolve().parents[2]
source=Path(sys.argv[2]).resolve() if len(sys.argv)>2 else qa_source
out=Path(sys.argv[1]).resolve()
sys.argv=[str(source/'qa/team-value-history/prepare.py'),str(out)]
runpy.run_path(str(source/'qa/team-value-history/prepare.py'),run_name='__main__')
app=out/'app'
league=app/'fixture-league.ts'
league.write_text("import {headers} from 'next/headers';\n"+league.read_text().replace('return (await fixture()).raw.market;', "const market=(await fixture()).raw.market,mode=(await headers()).get('x-qa-state');return mode==='priced-unavailable'?{...market,stocks:[]}:mode==='priced-long-names'?{...market,stocks:market.stocks.map((s,i)=>({...s,playerName:'Synthetic AntetokounmpoExtraLongUnbrokenPlayerName '+i}))}:market;"))
for route in ['arcade','arcade/leaderboard','arcade/[gameId]','arcade/[gameId]/leaderboard','arcade/ranked-free-throw','arcade/history','arcade/history/[periodId]','arcade/week-2-preview']:
    path=app/'app'/route;path.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(source/'src/app'/route/'page.tsx',path/'page.tsx')
    for css in (source/'src/app'/route).glob('*.css'):shutil.copyfile(css,path/css.name)
shutil.copyfile(source/'src/app/arcade/week-2-preview/DraftPreview.tsx',app/'app/arcade/week-2-preview/DraftPreview.tsx')
shutil.copyfile(qa_source/'qa/leaderboard-ui/fixture.ts',app/'fixture-ranked.ts')
(app/'fixture-history.ts').write_text('''export async function getTeamValueHistory(_id:string){return null;}
export async function teamHistoryDetailResponse(_url:URL){return Response.json({error:'outside-leaderboard-fixture'},{status:503});}
export async function teamHistorySummaryResponse(_url:URL){return Response.json({error:'outside-leaderboard-fixture'},{status:503});}
''')
(app/'fixture-ranked-runtime.ts').write_text('''import {headers} from 'next/headers';
import {policy} from './fixture-ranked';
import type {RankedAvailability} from '@/domain/arcade/ranked-free-throw';
export async function loadRankedAvailability(_requestHeaders:()=>Promise<Headers>):Promise<RankedAvailability>{const h=await headers(),mode=h.get('x-qa-state'),signedIn=(h.get('cookie')??'').includes('qa_ranked_signed_in=1');return mode==='disabled'?{status:'disabled'}:mode==='signed-out'&&!signedIn?{status:'sign_in'}:mode==='unavailable'?{status:'unavailable'}:mode==='recovery-closed'||mode==='recovery-unavailable'?{status:'recovery',reason:mode==='recovery-closed'?'closed':'unavailable'}:{status:'available',ruleSetId:policy.ruleSetId,rules:policy};}
''')
(app/'fixture-runtime.ts').write_text('''const signedIn=(h:Headers)=>(h.get('cookie')??'').split(';').some(c=>c.trim()==='qa_ranked_signed_in=1');
export async function getVerifiedAccount(h:Headers){return signedIn(h)?{subject:'synthetic-ui-account',sessionId:'synthetic-ui-session'}:null;}
export async function getProviderUser(h:Headers){return signedIn(h)?{id:'synthetic-ui-account'}:null;}
''')
(app/'fixture-auth-config.ts').write_text('''export function friendsAuthEnabled(){return true;}
export function friendsEnrollmentEnabled(){return true;}
export function readFriendsAuthConfig():never{throw Error('Provider configuration unavailable in synthetic fixture');}
''')
for route,file in [('account/login','page.tsx'),('account/continue','route.ts')]:
    path=app/'app'/route;path.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(source/'src/app'/route/file,path/file)
signin=app/'app/api/auth/sign-in/email';signin.mkdir(parents=True,exist_ok=True)
(signin/'route.ts').write_text('''export async function POST(){return Response.json({synthetic:true},{headers:{'Set-Cookie':'qa_ranked_signed_in=1; Path=/; HttpOnly; SameSite=Lax'}});}
''')
(app/'fixture-court.tsx').write_text('''"use client";
import type {FreeThrowRoundControls} from '@/domain/arcade/free-throw';
export function FreeThrowPractice({round}:{round?:FreeThrowRoundControls}){return <section aria-label="Synthetic input court"><p>UI fixture input bridge. Renderer unchanged and omitted here.</p>{round?<button disabled={round.blocked} onClick={()=>{if(round.beforeShot({direction:0,power:50})!==false)setTimeout(()=>round.onSettled?.(),20)}}>Take synthetic shot</button>:<p>Local practice. No ranked result is saved.</p>}</section>}
''')
for route in ['competition','free-throw/runs','free-throw/scores','free-throw/results','free-throw/leaderboard','nba/teams','nba/teams/[teamId]/roster']:
    path=app/'app/api/arcade'/route;path.mkdir(parents=True,exist_ok=True)
    method='POST' if route.endswith(('runs','scores')) else 'GET'
    (path/'route.ts').write_text("import {respond} from '"+str(app/'fixture-ranked')+"';\nexport async function "+method+"(request:Request){return respond(request);}\n")
probe=app/'app/qa/leaderboard';probe.mkdir(parents=True,exist_ok=True)
(probe/'page.tsx').write_text('''"use client";
import {useState} from 'react';
import {CompetitionLeaderboard} from '@/surfaces/arcade/CompetitionLeaderboard';
export default function Page(){const[kind,setKind]=useState<'weekly'|'all-time'>('weekly');return <><button onClick={()=>setKind(k=>k==='weekly'?'all-time':'weekly')}>Switch board kind</button><CompetitionLeaderboard kind={kind}/></>}
''')
config=(app/'next.config.mjs').read_text()
extra={'@/data/ranked-free-throw/runtime$':str(app/'fixture-ranked-runtime.ts'),'@/data/arcade-competition/service$':str(app/'fixture-ranked.ts'),'@/data/friends-auth/config$':str(app/'fixture-auth-config.ts')}
config=config.replace('webpack(config){','webpack(config,{webpack}){config.plugins.push(new webpack.NormalModuleReplacementPlugin(/free-throw[\\\\/]FreeThrowPractice$/,resource=>{resource.request='+json.dumps(str(app/'fixture-court.tsx'))+'}));')
config=config.replace('config.resolve.alias={...config.resolve.alias,...','config.resolve.alias={...config.resolve.alias,...'+json.dumps(extra)+',...')
(app/'next.config.mjs').write_text(config)
ts=json.loads((app/'tsconfig.json').read_text())
ts['compilerOptions']['paths'].update({k.removesuffix('$'):[v] for k,v in extra.items()})
(app/'tsconfig.json').write_text(json.dumps(ts))
print('Leaderboard fixture prepared; use qa/team-value-history/serve.py to build/start with the loopback guard.')
