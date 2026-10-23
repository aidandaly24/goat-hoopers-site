"""Synthetic actual Next member homepage for calendar windows and incomplete reads."""
from pathlib import Path
import contextlib,io,runpy,shutil,sys
here=Path(__file__).resolve().parent
with contextlib.redirect_stdout(io.StringIO()):runpy.run_path(str(here/'prepare-movers.py'),run_name='__main__')
app=Path(sys.argv[1]).resolve()/'app'
shutil.copyfile(here/'ranges-fixture.ts',app/'ranges-fixture.ts')
p=app/'fixture-league.ts';p.write_text(p.read_text().replace("import { cache } from 'react';", "import { cache } from 'react';\nimport {headers} from 'next/headers';").replace("Date.parse(changesHistory().asOf)", "Date.parse((await headers()).get('x-review-current-next-day')==='1'?'2026-11-23T00:10:00.000Z':changesHistory().asOf)").replace("import {changesHistory} from './changes-fixture';","import {rangesHistory as changesHistory} from './ranges-fixture';"))
(app/'fixture-history.ts').write_text('''import {headers} from 'next/headers';
import {log} from './fixture-base';
import {rangesHistory,rangesDetail} from './ranges-fixture';
import {isTeamValueHistoryEnvelope,isTeamValueHistoryDetail,validHistoryDay,validHistoryRange} from '@/domain/team-value-history';
export async function getTeamValueHistory(teamId:string){const h=rangesHistory();h.loadedRange={from:'2026-10-19',toExclusive:'2026-10-21'};await log('ranges-initial',{teamId});if(!isTeamValueHistoryEnvelope(h))throw Error('Invalid synthetic range envelope');return h;}
export async function teamHistoryDetailResponse(url:URL){const p=Object.fromEntries(url.searchParams),h=rangesHistory();await log('ranges-detail',p);if(p.generation!==h.generation)return Response.json({error:'changed'},{status:409});if(p.teamId!=='1'||!validHistoryDay(p.day))return Response.json({error:'invalid'},{status:400});const d=rangesDetail(p.day);if(!isTeamValueHistoryDetail(d))throw Error('Invalid synthetic detail');return Response.json(d);}
export async function teamHistorySummaryResponse(url:URL){const p=Object.fromEntries(url.searchParams),h=rangesHistory(),r={from:p.from,toExclusive:p.toExclusive};await log('ranges-summary',p);if(p.teamId!=='1'||p.generation!==h.generation||!validHistoryRange(r))return Response.json({error:'invalid'},{status:400});h.requestedRange=h.loadedRange=r;h.points=h.points.filter(x=>x.day>=r.from&&x.day<r.toExclusive);if(!isTeamValueHistoryEnvelope(h))throw Error('Invalid synthetic summary');return Response.json(h);}
''')
print('Actual Next with synthetic calendar range fixtures, no production/provider/database access.')
