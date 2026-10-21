from pathlib import Path
import json,shutil
import sys
source=Path(__file__).resolve().parents[2]
out=Path(sys.argv[1]).resolve();app=out/'app'
out.mkdir(parents=True,exist_ok=True);(app/'app').mkdir(parents=True,exist_ok=True)
deps=source/'node_modules'
if not deps.is_dir():raise SystemExit('Install the locked repository dependencies before preparing the fixture.')
if not (app/'node_modules').exists():(app/'node_modules').symlink_to(deps,target_is_directory=True)
assert (app/'node_modules').resolve()==deps.resolve(), 'Use the same Next/React installation for the fixture and source.'
if not (app/'public').exists():(app/'public').symlink_to(source/'public',target_is_directory=True)
for name in ['page.tsx','globals.css'] :shutil.copyfile(source/'src/app'/name,app/'app'/name)
layout=(source/'src/app/layout.tsx').read_text()
fontImport='import { Anton, Geist_Mono, Inter } from "next/font/google";'
assert layout.count(fontImport)==1
layout=layout.replace(fontImport,'import { Anton, Geist_Mono, Inter } from "./fixture-fonts";\nimport FixtureNav from "./fixture-nav";\nimport "./fixture.css";')
layout=layout.replace('<body>','<body>\n        <FixtureNav />')
(app/'app/layout.tsx').write_text(layout)
shutil.copyfile(source/'qa/ticker-scope/fonts.ts',app/'app/fixture-fonts.ts')
shutil.copyfile(source/'qa/home-fidelity/fixture.ts',app/'app/home-fixture.ts')
shutil.copyfile(source/'qa/home-fidelity/fixture.css',app/'app/fixture.css')
(app/'app/fixture-nav.tsx').write_text('''"use client";
import Link from 'next/link';
import { useEffect } from 'react';
export default function FixtureNav(){useEffect(()=>{document.documentElement.dataset.reviewHydrated='true'},[]);return <aside data-review-navigation style={{display:'flex',flexWrap:'wrap',gap:8,padding:8,fontSize:12}}><span>Synthetic merged-tree review</span><Link href="/" prefetch={false} data-review-home>Fixture home</Link><Link href="/account" prefetch={false} data-review-utility>Fixture account</Link><Link href="/fixture-unmatched-missing/nested" prefetch={false} data-review-unknown>Fixture unknown route</Link></aside>}
''')
for folder in ['@ticker','[...segments]']:
 shutil.copytree(source/'src/app'/folder,app/'app'/folder,dirs_exist_ok=True,ignore=shutil.ignore_patterns('*.test.*'))
shutil.copyfile(source/'qa/ticker-scope/not-found.tsx',app/'app/not-found.tsx')
for route in ['account','login','signup','claim','forgot-password','reset-password','admin','account/fixture/deep']:
 path=app/'app'/route;path.mkdir(parents=True,exist_ok=True)
 (path/'page.tsx').write_text("export const dynamic='force-dynamic'; export default function Page(){return <section data-synthetic-utility="+json.dumps(route)+"><h1>Synthetic utility "+route+"</h1><p>No account operations or forms are available in this fixture.</p></section>}")
detail=app/'app/teams/[id]';detail.mkdir(parents=True,exist_ok=True)
(detail/'page.tsx').write_text('''import { TeamProfile } from '@/surfaces/teams/TeamProfile';
import { personalizedFixture } from '@/test/personalized-home-fixture';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const {teams}=personalizedFixture();const team=teams.find(t=>t.id===id)!;return <section data-synthetic-detail={id}><TeamProfile teams={teams} profile={{team,players:[],matchups:[],streak:0,draftPicks:[],transactions:[]}}/></section>}
''')
for route in ['summary','detail']:
 dest=app/'app/api/team-value-history'/route;dest.mkdir(parents=True,exist_ok=True)
 shutil.copyfile(source/'src/app/api/team-value-history'/route/'route.ts',dest/'route.ts')
(app/'fixture-base.ts').write_text('''import { cache } from 'react';
import { headers } from 'next/headers';
import { appendFileSync } from 'node:fs';
import { homeReviewFixture } from './app/home-fixture';
import { personalizedFixture, playerGuideFixture } from '@/test/personalized-home-fixture';
import { teamValueHistoryFixture } from '@/test/team-value-history-fixture';
export async function log(loader:string,params:unknown=null){const h=await headers();appendFileSync(process.env.REVIEW_PROBE_LOG!,JSON.stringify({run:h.get('x-review-run'),state:h.get('x-review-state'),loader,params})+'\\n');}
export const fixture=cache(async()=>{const h=await headers();const state=h.get('x-review-state')??'stats-populated';return {state,home:homeReviewFixture(state),raw:personalizedFixture(),guide:playerGuideFixture('1')};});
export function history(state:string){const h=teamValueHistoryFixture(state==='paged'?'paged':state==='empty-history'?'empty':'mixed');h.team={id:'1',name:'Fixture Club 1'};h.leagueRange={...h.leagueRange,from:'2025-10-20'};h.requestedRange=h.leagueRange;h.loadedRange={...h.loadedRange,from:'2025-10-20'};h.seasons[0].range.from='2025-10-20';h.coverage.roster[0].from='2025-10-20';h.coverage.valuation[0].from='2025-10-20';h.points=h.points.filter(p=>p.day>='2025-10-20');return h;}
''')
(app/'fixture-league.ts').write_text(('''export type * from 'PLACEHOLDER_SOURCE/src/data/league';
import { cache } from 'react';
import { fixture,log } from './fixture-base';
import { homeReviewFixture } from './app/home-fixture';
export async function getCourtsideHomeData(){await log('home');return (await fixture()).home.home;}
export function getWeeklyArchive(){return [];}
export function getCourtsidePortraits(){return homeReviewFixture('member').portraits;}
export async function getAiDecidesData(){await log('ai');return {weekly:(await fixture()).home.weekly};}
export const getStockMarketData=cache(async()=>{await log('market');return (await fixture()).raw.market;});
export const getLeagueNews=cache(async()=>{await log('news');return (await fixture()).raw.news.articles;});
export async function getLeagueNewsEdition(){await log('news-edition');return (await fixture()).raw.news;}
export async function getHomePlayerGuideSources(){await log('guide');return (await fixture()).guide;}
export async function getRosterSnapshotHistory(ids:string[]){await log('snapshots',ids);return Object.fromEntries(ids.map(id=>[id,[{date:'2026-10-08T12:00:00Z',price:20,source:'live' as const},{date:'2026-10-19T12:00:00Z',price:30,source:'live' as const}]]));}
export async function getSeasonMeta(){await log('season');return (await fixture()).raw.home.hub!.season;}
export async function getTeams(){await log('teams');return (await fixture()).raw.teams;}
''').replace('PLACEHOLDER_SOURCE',str(source)))
(app/'fixture-actions.ts').write_text('''"use server";
import { headers } from 'next/headers';
import type { SiteUser } from '@/domain/arcade';
export async function getCurrentUser():Promise<SiteUser|null>{const h=await headers();return h.get('x-review-state')==='showcase-public'?null:{id:'synthetic-user',teamId:'1',displayName:'Fixture manager',createdAt:new Date('2026-01-01T00:00:00Z')};}
export async function logout(){throw new Error('All account mutations are disabled in this synthetic review');}
''')
(app/'fixture-runtime.ts').write_text('export async function getVerifiedAccount(_headers:Headers):Promise<{subject:string}|null>{throw new Error("Account access disabled in offline review")};\n')
shutil.copyfile(source/'qa/ticker-scope/espn-client.ts',app/'fixture-espn-client.ts')
shutil.copyfile(source/'qa/team-value-history/move-terms-fixture.ts',app/'move-terms-fixture.ts')
(app/'fixture-history.ts').write_text('''import { headers } from 'next/headers';
import { history,log } from './fixture-base';
import { moveTermsDetail } from './move-terms-fixture';
import { isTeamValueHistoryEnvelope, isTeamValueHistoryDetail, validHistoryRange, validHistoryDay } from '@/domain/team-value-history';
export async function getTeamValueHistory(teamId:string){const h=await headers();await log('history-initial',{teamId});return h.get('x-review-state')==='history-unavailable'?null:history(h.get('x-review-state')??'mixed');}
export async function teamHistoryDetailResponse(url:URL){const h=await headers(),p=Object.fromEntries(url.searchParams);await log('history-detail',p);if(p.day==='2026-10-18'&&h.get('x-review-detail-mode')==='comparison-unavailable')return Response.json({error:'synthetic-comparison-unavailable'},{status:503});if(p.day==='2026-10-18'&&h.get('x-review-detail-mode')==='comparison-changed')return Response.json({error:'synthetic-comparison-changed'},{status:409});if(p.day==='2026-10-16'&&h.get('x-review-detail-mode')==='slow')await new Promise(r=>setTimeout(r,500));if(h.get('x-review-detail-mode')==='changed')return Response.json({error:'synthetic-generation-changed'},{status:409});if(h.get('x-review-detail-mode')==='unavailable')return Response.json({error:'synthetic-detail-unavailable'},{status:503});if(p.teamId!=='1'||p.generation!=='synthetic-history-v1'||!validHistoryDay(p.day))return Response.json({error:'invalid'},{status:400});const d=moveTermsDetail(p.day);if(!isTeamValueHistoryDetail(d))throw Error('Invalid synthetic detail');return Response.json(d,{headers:{'Cache-Control':'no-store'}});}
export async function teamHistorySummaryResponse(url:URL){const p=Object.fromEntries(url.searchParams);await log('history-summary',p);const h=history('mixed');const range={from:p.from,toExclusive:p.toExclusive};if(p.teamId!=='1'||p.generation!==h.generation||!validHistoryRange(range))return Response.json({error:'invalid'},{status:400});h.requestedRange=range;h.loadedRange=range;h.points=h.points.filter(point=>point.day>=range.from&&point.day<range.toExclusive);h.page.nextCursor=null;if(!isTeamValueHistoryEnvelope(h))throw Error('Invalid synthetic page');return Response.json(h,{headers:{'Cache-Control':'no-store'}});}
''')
aliases={'@/data/league$':str(app/'fixture-league.ts'),'@/app/actions$':str(app/'fixture-actions.ts'),'@/data/friends-auth/runtime$':str(app/'fixture-runtime.ts'),'@/data/team-value-history$':str(app/'fixture-history.ts'),'@/data/espn-client$':str(app/'fixture-espn-client.ts'),'@':str(source/'src')}
(app/'next.config.mjs').write_text('export default {experimental:{externalDir:true},webpack(config){config.resolve.alias={...config.resolve.alias,...'+json.dumps(aliases)+'};return config;}};\n')
paths={k.removesuffix('$'):[v] for k,v in aliases.items() if k!='@'};paths['@/*']=[str(source/'src/*')]
(app/'tsconfig.json').write_text(json.dumps(dict(compilerOptions=dict(target='ES2017',lib=['dom','dom.iterable','esnext'],strict=True,skipLibCheck=True,noEmit=True,esModuleInterop=True,module='esnext',moduleResolution='bundler',jsx='react-jsx',resolveJsonModule=True,isolatedModules=True,baseUrl='.',paths=paths),include=['**/*.ts','**/*.tsx','.next/types/**/*.ts'],exclude=['node_modules'])))
(app/'package.json').write_text(json.dumps({'name':'team-history-consumer-synthetic-next','private':True}))
(out/'combined-probe.jsonl').write_text('')
print(str(app))
