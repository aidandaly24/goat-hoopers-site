"""Prepare the retained actual-Next fixture with synthetic agreed th2/membership responses."""
from pathlib import Path
import runpy, shutil, sys

here = Path(__file__).resolve().parent
runpy.run_path(str(here/'prepare.py'), run_name='__main__')
app = Path(sys.argv[1]).resolve()/'app'
shutil.copyfile(here/'membership-fixture.ts', app/'membership-fixture.ts')
nav = app/'app/fixture-nav.tsx'
text = nav.read_text().replace("import Link from 'next/link';", "import Link from 'next/link';\nimport {useRouter} from 'next/navigation';")
text = text.replace('export default function FixtureNav(){', 'export default function FixtureNav(){const router=useRouter();')
text = text.replace('<span>Synthetic merged-tree review</span>', '<span>Synthetic membership contract</span><button data-review-refresh onClick={()=>router.refresh()}>Fixture envelope refresh</button>')
nav.write_text(text)
(app/'fixture-history.ts').write_text('''import {headers} from 'next/headers';
import {log} from './fixture-base';
import {membershipEnvelope,membershipDetail,syntheticGeneration,type SyntheticView} from './membership-fixture';
import {isTeamValueHistoryEnvelope,isTeamValueHistoryDetail,validHistoryDay,validHistoryRange} from '@/domain/team-value-history';
async function context(){const h=await headers();const raw=h.get('x-review-view');const view:SyntheticView=raw==='b'||raw==='c'?raw:'a';return{view,mode:h.get('x-review-detail-mode')??''};}
export async function getTeamValueHistory(teamId:string){const {view}=await context();await log('history-initial',{teamId,view});const value=membershipEnvelope(view);if(!isTeamValueHistoryEnvelope(value))throw Error('Invalid synthetic envelope');return value;}
export async function teamHistoryDetailResponse(url:URL){const {view,mode}=await context(),p=Object.fromEntries(url.searchParams);await log('history-detail',p);
if(p.generation!==syntheticGeneration(view)||mode==='changed')return Response.json({error:'synthetic-generation-changed'},{status:409});
if(p.teamId!=='1'||!validHistoryDay(p.day))return Response.json({error:'invalid'},{status:400});
if(mode==='slow')await new Promise(r=>setTimeout(r,700));
const value=membershipDetail(p.day,view,mode);if(!isTeamValueHistoryDetail(value))throw Error('Invalid synthetic detail');
return Response.json(value,{headers:{'Cache-Control':'no-store'}});}
export async function teamHistorySummaryResponse(url:URL){const {view,mode}=await context(),p=Object.fromEntries(url.searchParams);await log('history-summary',p);if(p.generation!==syntheticGeneration(view)||mode==='changed')return Response.json({error:'synthetic-generation-changed'},{status:409});
const value=membershipEnvelope(view),range={from:p.from,toExclusive:p.toExclusive};if(p.teamId!=='1'||!validHistoryRange(range))return Response.json({error:'invalid'},{status:400});
value.requestedRange=range;value.loadedRange=range;value.points=value.points.filter(point=>point.day>=range.from&&point.day<range.toExclusive);
if(!isTeamValueHistoryEnvelope(value))throw Error('Invalid synthetic summary');return Response.json(value,{headers:{'Cache-Control':'no-store'}});}
''')
print('Synthetic agreed membership/th2 responses only; no live producer or token parser.')
