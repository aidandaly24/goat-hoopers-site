"""Actual signed-in Next homepage with synthetic current/saved quote versions."""
from pathlib import Path
import contextlib, io, json, runpy, subprocess, sys

here = Path(__file__).resolve().parent
with contextlib.redirect_stdout(io.StringIO()):
    runpy.run_path(str(here / 'prepare-changes.py'), run_name='__main__')
app = Path(sys.argv[1]).resolve() / 'app'
league = app / 'fixture-league.ts'
source = league.read_text().replace("import { cache } from 'react';", "import { cache } from 'react';\nimport {headers} from 'next/headers';")
before = "export async function getCourtsideHomeData(){await log('home');return (await fixture()).home.home;}"
after = """export async function getCourtsideHomeData(){await log('home');const home=structuredClone((await fixture()).home.home),mode=(await headers()).get('x-review-current');
if(mode==='unknown')home.directory=home.directory.filter(x=>x.identity.id!=='1');
const member=home.directory.find(x=>x.identity.id==='1');if(member&&mode==='empty')member.players=[];
if(member&&mode==='long')for(const p of member.players)p.fullName='Synthetic long current roster identity '+p.fullName+' extra readable name '.repeat(8);
return home;}"""
assert source.count(before) == 1
source = source.replace(before, after)
before = "export const getStockMarketData=cache(async()=>{await log('market');return {...(await fixture()).raw.market,updatedAt:Date.parse(changesHistory().asOf)};});"
after = """export const getStockMarketData=cache(async()=>{await log('market');const h=await headers(),mode=h.get('x-review-current'),version=h.get('x-review-current-version')==='b',market=structuredClone((await fixture()).raw.market);
market.updatedAt=Date.parse(mode==='same-day'?'2026-10-20T19:00:00.000Z':mode==='rollover'?'2026-10-23T00:00:00.100Z':changesHistory().asOf)+(version?1000:0);
if(mode==='partial')market.stocks=market.stocks.slice(1);if(mode==='unpriced'||mode==='empty')market.stocks=[];
if(mode==='same-day')market.stocks[0].price+=92.96;if(version&&market.stocks.length)market.stocks[0].price+=1;
return market;});"""
assert source.count(before) == 1
league.write_text(source.replace(before, after))
(app / 'fixture-history.ts').write_text('''import {headers} from 'next/headers';
import {log} from './fixture-base';
import {changesHistory,changesDetail} from './changes-fixture';
import {isTeamValueHistoryEnvelope,isTeamValueHistoryDetail,validHistoryDay,validHistoryRange} from '@/domain/team-value-history';
async function context(){const h=await headers();return{version:h.get('x-review-current-version')==='b'?'b':'a',mode:h.get('x-review-current')??'full',slow:h.get('x-review-current-delay')==='slow'};}
function detail(day:string,c:{version:string;mode:string}){const d=changesDetail(day);d.generation='synthetic-current-history-'+c.version;if(c.mode==='retrospective')for(const p of d.players)if(p.price){p.price={kind:'reconstructed',source:'event-log',datasetId:'synthetic-retrospective-inputs',modelVersion:'synthetic-model-v1',inputCutoff:d.valuationAt,availableFrom:d.valuationAt,validUntil:null};}return d;}
function history(c:{version:string;mode:string}){const h=changesHistory();h.generation='synthetic-current-history-'+c.version;if(c.mode==='retrospective'){for(const p of h.points){p.priceKind='reconstructed';p.continuityId='synthetic-retrospective-segment';}h.currentQuote=null;h.sourceNotes=['Synthetic retrospective consumer fixture; no live source or historical coverage claim.'];h.coverage.valuation=[{from:h.leagueRange.from,toExclusive:'2026-10-19',status:'unavailable',reason:'No synthetic model evidence'},{from:'2026-10-19',toExclusive:'2026-10-21',status:'reconstructed',reason:'Two explicitly synthetic retrospective observations'},{from:'2026-10-21',toExclusive:h.leagueRange.toExclusive,status:'unavailable',reason:'No synthetic model evidence'}];}return h;}
export async function getTeamValueHistory(teamId:string){const c=await context(),h=history(c);await log('history-initial-current',{teamId,...c});if(!isTeamValueHistoryEnvelope(h))throw Error('Invalid synthetic current envelope');return h;}
export async function teamHistoryDetailResponse(url:URL){const c=await context(),h=history(c),p=Object.fromEntries(url.searchParams);await log('history-detail-current',p);if(p.generation!==h.generation)return Response.json({error:'fixture changed'},{status:409});if(p.teamId!=='1'||!validHistoryDay(p.day))return Response.json({error:'invalid'},{status:400});const d=detail(p.day,c);if(c.slow)await new Promise(r=>setTimeout(r,700));if(!isTeamValueHistoryDetail(d))throw Error('Invalid synthetic current detail');return Response.json(d);}
export async function teamHistorySummaryResponse(url:URL){const c=await context(),h=history(c),p=Object.fromEntries(url.searchParams),r={from:p.from,toExclusive:p.toExclusive};await log('history-summary-current',p);if(p.generation!==h.generation)return Response.json({error:'fixture changed'},{status:409});if(p.teamId!=='1'||!validHistoryRange(r))return Response.json({error:'invalid'},{status:400});h.requestedRange=h.loadedRange=r;h.points=h.points.filter(x=>x.day>=r.from&&x.day<r.toExclusive);if(!isTeamValueHistoryEnvelope(h))throw Error('Invalid synthetic current summary');return Response.json(h);}
''')
print('Actual Next member homepage; current quote and saved/model histories use explicit synthetic sources; no provider/DB access.')
root = here.parents[1]
files = ['src/domain/current-team-quote.ts', 'src/surfaces/season-hub/RosterValueSection.tsx', 'src/surfaces/season-hub/TeamValueHistory.tsx', 'src/surfaces/season-hub/TeamValueHistoryChart.tsx', 'src/surfaces/season-hub/TeamValueHistory.module.css']
(app.parent / 'current-source-blobs.json').write_text(json.dumps({f:subprocess.check_output(['git','hash-object',f],cwd=root,text=True).strip() for f in files},indent=2)+'\n')
