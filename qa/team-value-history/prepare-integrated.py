"""Actual signed-in homepage fixture using PR244's real producer with injected offline sources."""
from pathlib import Path
import contextlib, io, runpy, sys

here = Path(__file__).resolve().parent
with contextlib.redirect_stdout(io.StringIO()):
    runpy.run_path(str(here/'prepare-membership.py'), run_name='__main__')
app = Path(sys.argv[1]).resolve()/'app'
# Private fixture imports must reach the actual data module, while the public
# homepage/API imports retain the original fixture alias. Avoid aliasing the
# producer fixture's own import back into this responder.
source = here.parents[1]
fixture = (here/'integrated-producer-fixture.ts').read_text().replace('from "@/data/team-value-history"', 'from "'+str(source/'src/data/team-value-history')+'"')
(app/'integrated-producer-fixture.ts').write_text(fixture)
(app/'fixture-history.ts').write_text('''import {headers} from 'next/headers';
import {log} from './fixture-base';
import {integratedEnvelope,integratedDetail,integratedSummary} from './integrated-producer-fixture';
async function context(){const h=await headers();return{revised:h.get('x-review-view')==='b',later:h.get('x-review-clock')==='later'};}
export async function getTeamValueHistory(teamId:string){const {revised}=await context();await log('history-initial-real-producer',{teamId,revised});return integratedEnvelope(revised);}
export async function teamHistoryDetailResponse(url:URL){const {revised,later}=await context();await log('history-detail-real-producer',Object.fromEntries(url.searchParams));return integratedDetail(url,revised,later);}
export async function teamHistorySummaryResponse(url:URL){const {revised,later}=await context();await log('history-summary-real-producer',Object.fromEntries(url.searchParams));return integratedSummary(url,revised,later);}
''')
print('Actual PR244 producer/helpers; only source dependencies are synthetic. No live traffic.')
