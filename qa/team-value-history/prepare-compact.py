"""Actual Next homepage with explicitly synthetic sparse-history responses."""
from pathlib import Path
import contextlib, io, runpy, shutil, sys

here = Path(__file__).resolve().parent
with contextlib.redirect_stdout(io.StringIO()):
    runpy.run_path(str(here / 'prepare-membership.py'), run_name='__main__')
app = Path(sys.argv[1]).resolve() / 'app'
shutil.copyfile(here / 'compact-fixture.ts', app / 'compact-fixture.ts')
(app / 'fixture-history.ts').write_text('''import {headers} from 'next/headers';
import {log} from './fixture-base';
import {compactHistory,compactDetail} from './compact-fixture';
import {isTeamValueHistoryEnvelope,isTeamValueHistoryDetail,validHistoryDay,validHistoryRange} from '@/domain/team-value-history';
async function view(){return(await headers()).get('x-review-view')==='b'?'b':'a';}
export async function getTeamValueHistory(teamId:string){const v=await view();await log('history-initial-compact',{teamId,view:v});const h=compactHistory(v);if(!isTeamValueHistoryEnvelope(h))throw Error('Invalid compact synthetic envelope');return h;}
export async function teamHistoryDetailResponse(url:URL){const v=await view(),h=compactHistory(v),p=Object.fromEntries(url.searchParams);await log('history-detail-compact',p);if(p.generation!==h.generation)return Response.json({error:'fixture changed'},{status:409});if(p.teamId!=='1'||!validHistoryDay(p.day))return Response.json({error:'invalid'},{status:400});const d=compactDetail(p.day,v);if(!isTeamValueHistoryDetail(d))throw Error('Invalid compact synthetic detail');return Response.json(d);}
export async function teamHistorySummaryResponse(url:URL){const h=compactHistory(await view()),p=Object.fromEntries(url.searchParams);await log('history-summary-compact',p);if(p.generation!==h.generation)return Response.json({error:'fixture changed'},{status:409});const r={from:p.from,toExclusive:p.toExclusive};if(p.teamId!=='1'||!validHistoryRange(r))return Response.json({error:'invalid'},{status:400});h.requestedRange=h.loadedRange=r;h.points=h.points.filter(x=>x.day>=r.from&&x.day<r.toExclusive);if(!isTeamValueHistoryEnvelope(h))throw Error('Invalid compact synthetic page');return Response.json(h);}
''')
print('Actual signed-in Next homepage; synthetic sparse history only; no live source access.')
