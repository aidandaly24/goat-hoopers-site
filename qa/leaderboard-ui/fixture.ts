/** Synthetic in-memory responses only; no account, database, provider or reward calls. */
import {headers} from 'next/headers';
import {parseFreeThrowPolicy,rankedReplayContext,replayRankedRound,type RankedAdmission,type RankedScore} from '@/domain/arcade/ranked-free-throw';
import type {CompetitionBoard,CompetitionArchive} from '@/domain/arcade/competition-period';
export const policy=parseFreeThrowPolicy({ruleSetId:'synthetic-ui-only',engine:'moving-court-makes-v2',shots:2,durationMs:30000,minShotIntervalMs:1000,maxRunsPerWeek:null})!;
const version='a'.repeat(64),context=rankedReplayContext(),period={id:'synthetic-week-1',week:'2026-W43',startsAtMs:Date.parse('2026-10-20T00:00:00Z'),endsAtMs:null};
type State={admission?:RankedAdmission;score?:RankedScore};
const globalState=globalThis as typeof globalThis&{leaderboardUiFixture?:Map<string,State>};
const states=globalState.leaderboardUiFixture??=new Map<string,State>();
const response=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
async function fixture(){const h=await headers(),key=h.get('x-qa-run')??'default';if(!states.has(key))states.set(key,{});return{state:states.get(key)!,mode:h.get('x-qa-state')??'ready'};}
function entries(state:State,scope:string,kind:string){
  if(scope==='league')return [];
  if(state.score){const s=state.score;return[{rank:1,username:'fixture_hooper',isCurrentUser:true,teamId:null,score:s.score,makes:s.makes,attempts:s.attempts,accuracy:s.accuracy,longestStreak:s.longestStreak,endingStreak:s.endingStreak,achievedAtMs:s.achievedAtMs}];}
  return[{rank:1,username:kind==='all-time'?'alltime_hooper':'weekly_hooper',isCurrentUser:false,teamId:null,score:1,makes:1,attempts:2,accuracy:.5,longestStreak:1,endingStreak:1,achievedAtMs:Date.now()-60000}];
}
export async function respond(request:Request){
  const{state,mode}=await fixture(),url=new URL(request.url),scope=url.searchParams.get('scope')??'everyone';
  if(url.pathname==='/api/arcade/competition'){
    if(mode==='held')return response({status:'held'});
    if(mode==='error')return response({status:'unavailable'},503);
    const kind=(url.searchParams.get('kind')??'weekly') as CompetitionBoard['kind'];
    if(mode==='race'&&(kind==='all-time'||scope==='league'))await new Promise(r=>setTimeout(r,800));
    const board:CompetitionBoard={gameId:'free-throw',kind,label:kind==='all-time'?'All-time compatible Free Throw':'Synthetic Week 1',phase:mode==='blocked'?'blocked':kind==='archive'?'final':'open',periodId:kind==='all-time'?null:period.id,asOfMs:Date.now(),scoreVersion:version,entries:mode==='empty'?[]:entries(state,scope,kind)};
    return response({status:'ready',board:mode==='invalid'?{...board,gameId:'wrong-game'}:board});
  }
  if(url.pathname.endsWith('/runs')){
    const startedAtMs=Date.now();state.admission={rules:policy,replayContext:context,run:{id:crypto.randomUUID(),gameId:'free-throw',week:period.week,rulesVersion:version,startedAtMs,expiresAtMs:startedAtMs+policy.durationMs,period}};
    return response(state.admission,201);
  }
  if(url.pathname.endsWith('/scores')){
    if(mode==='reject')return response({status:'unavailable'},503);
    const body=await request.json(),a=state.admission;
    if(!a||body.runId!==a.run.id)return response({status:'invalid_run'},400);
    try{const achievedAtMs=Date.now(),round=replayRankedRound(body.shots,achievedAtMs-a.run.startedAtMs,policy,context);
      state.score={...round.statistics,id:crypto.randomUUID(),runId:a.run.id,gameId:'free-throw',week:period.week,rulesVersion:version,startedAtMs:a.run.startedAtMs,achievedAtMs,outcomes:round.outcomes,inputs:round.inputs,replayContext:context};
      return response({score:state.score});
    }catch{return response({status:'invalid_score'},400);}
  }
  if(url.pathname.endsWith('/results'))return state.score?response({score:state.score}):response({status:'not_found'},404);
  if(url.pathname.endsWith('/leaderboard'))return response({gameId:'free-throw',rulesVersion:version,ruleSetId:policy.ruleSetId,calendar:policy.calendar,scope,period,entries:entries(state,scope,'weekly')});
  return response({status:'unavailable'},404);
}
export async function loadCompetitionArchives():Promise<{status:'ready'|'held'|'unavailable';archives:CompetitionArchive[]}>{return{status:'ready',archives:[]};}
