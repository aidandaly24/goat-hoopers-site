"""Actual member homepage with synthetic changed/unchanged/unknown comparisons."""
from pathlib import Path
import contextlib, io, runpy, shutil, sys

here = Path(__file__).resolve().parent
with contextlib.redirect_stdout(io.StringIO()):
    runpy.run_path(str(here / 'prepare-compact.py'), run_name='__main__')
app = Path(sys.argv[1]).resolve() / 'app'
shutil.copyfile(here / 'changes-fixture.ts', app / 'changes-fixture.ts')
league = app / 'fixture-league.ts'
league.write_text(league.read_text().replace("import { cache } from 'react';", "import { cache } from 'react';\nimport {changesHistory} from './changes-fixture';").replace("return (await fixture()).raw.market;", "return {...(await fixture()).raw.market,updatedAt:Date.parse(changesHistory().asOf)};"))
(app / 'fixture-history.ts').write_text('''import {headers} from 'next/headers';
import {log} from './fixture-base';
import {changesHistory,changesDetail} from './changes-fixture';
import {isTeamValueHistoryEnvelope,isTeamValueHistoryDetail,validHistoryDay,validHistoryRange} from '@/domain/team-value-history';
async function mode(){const m=(await headers()).get('x-review-changes');return m==='unknown'||m==='unchanged'?m:'changed';}
export async function getTeamValueHistory(teamId:string){const m=await mode(),h=changesHistory(m);await log('history-initial-changes',{teamId,mode:m});if(!isTeamValueHistoryEnvelope(h))throw Error('Invalid synthetic history');return h;}
export async function teamHistoryDetailResponse(url:URL){const m=await mode(),p=Object.fromEntries(url.searchParams),h=changesHistory(m);await log('history-detail-changes',p);if(p.generation!==h.generation)return Response.json({error:'changed'},{status:409});if(p.teamId!=='1'||!validHistoryDay(p.day))return Response.json({error:'invalid'},{status:400});const d=changesDetail(p.day,m);if(!isTeamValueHistoryDetail(d))throw Error('Invalid synthetic detail');return Response.json(d);}
export async function teamHistorySummaryResponse(url:URL){const h=changesHistory(await mode()),p=Object.fromEntries(url.searchParams),r={from:p.from,toExclusive:p.toExclusive};await log('history-summary-changes',p);if(p.generation!==h.generation)return Response.json({error:'changed'},{status:409});if(p.teamId!=='1'||!validHistoryRange(r))return Response.json({error:'invalid'},{status:400});h.requestedRange=h.loadedRange=r;h.points=h.points.filter(x=>x.day>=r.from&&x.day<r.toExclusive);if(!isTeamValueHistoryEnvelope(h))throw Error('Invalid synthetic summary');return Response.json(h);}
''')
print('Actual member Next homepage; explicitly synthetic historical comparison modes; no upstream/DB access.')
