"""Actual home/news/transaction/trade routes with synthetic read-only data."""
from pathlib import Path
import json,runpy,shutil,sys
source=Path(__file__).resolve().parents[2];out=Path(sys.argv[1]).resolve()
sys.argv=[str(source/'qa/team-value-history/prepare.py'),str(out)]
runpy.run_path(str(source/'qa/team-value-history/prepare.py'),run_name='__main__')
app=out/'app'
for route in ['news','transactions','trade-analyzer']:
    path=app/'app'/route;path.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(source/'src/app'/route/'page.tsx',path/'page.tsx')
    for css in (source/'src/app'/route).glob('*.css'):shutil.copyfile(css,path/css.name)
shutil.copyfile(source/'qa/news-date/fixture.ts',app/'fixture-base.ts')
(app/'fixture-league.ts').write_text('''import {cache} from 'react';
import {fixture} from './fixture-base';
import {homeReviewFixture} from './app/home-fixture';
export async function getCourtsideHomeData(){return(await fixture()).home;}
export function getWeeklyArchive(){return[];}
export function getCourtsidePortraits(){return homeReviewFixture('member').portraits;}
export async function getAiDecidesData(){return{weekly:(await fixture()).weekly};}
export const getStockMarketData=cache(async()=>(await fixture()).market);
export const getLeagueNews=cache(async()=>(await fixture()).news.articles);
export async function getLeagueNewsEdition(){return(await fixture()).news;}
export async function getHomePlayerGuideSources(){return(await fixture()).guide;}
export async function getRosterSnapshotHistory(_ids:string[]){return{};}
export async function getSeasonMeta(){return(await fixture()).home.hub!.season;}
export async function getTeams(){return(await fixture()).teams;}
export async function getTransactionHistory(){const f=await fixture();return{transactions:[f.move],teams:f.teams};}
''')
league=app/'fixture-league.ts'
league.write_text('export type * from '+json.dumps(str(source/'src/data/league'))+';\n'+league.read_text())
(app/'fixture-history.ts').write_text('''export async function getTeamValueHistory(_id:string){return null;}
export async function teamHistorySummaryResponse(_url:URL){return Response.json({error:'outside-news-date-fixture'},{status:503});}
export async function teamHistoryDetailResponse(_url:URL){return Response.json({error:'outside-news-date-fixture'},{status:503});}
''')
print('Prepared actual routes. Build/start with qa/team-value-history/serve.py; all sources remain synthetic.')
