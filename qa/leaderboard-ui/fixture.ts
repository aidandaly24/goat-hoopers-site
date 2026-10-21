/** Synthetic in-memory responses only; no account, database, provider or reward calls. */
import {headers} from 'next/headers';
import {parseFreeThrowPolicy,rankedReplayContext,replayRankedRound,type RankedAdmission,type RankedScore} from '@/domain/arcade/ranked-free-throw';
import type {CompetitionBoard,CompetitionArchive} from '@/domain/arcade/competition-period';
import type {RankedRecordFeedback, RecordComparison} from '@/domain/arcade/ranked-record-feedback';
export const policy=parseFreeThrowPolicy({ruleSetId:'synthetic-ui-only',engine:'moving-court-makes-v2',shots:2,durationMs:30000,minShotIntervalMs:1000,maxRunsPerWeek:null})!;
const version='a'.repeat(64),context=rankedReplayContext(),period={id:'synthetic-week-1',week:'2026-W43',startsAtMs:Date.parse('2026-10-20T00:00:00Z'),endsAtMs:null};
type State={admission?:RankedAdmission;score?:RankedScore;saveAttempts?:number;rosterAttempts?:number};
const globalState=globalThis as typeof globalThis&{leaderboardUiFixture?:Map<string,State>};
const states=globalState.leaderboardUiFixture??=new Map<string,State>();
const response=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
async function fixture(){const h=await headers(),key=h.get('x-qa-run')??'default';if(!states.has(key))states.set(key,{});return{state:states.get(key)!,mode:h.get('x-qa-state')??'ready'};}
function entries(state:State,scope:string,kind:string){
  if(scope==='league')return [];
  if(state.score){const s=state.score;return[{rank:1,username:'fixture_hooper',isCurrentUser:true,teamId:null,score:s.score,makes:s.makes,attempts:s.attempts,accuracy:s.accuracy,longestStreak:s.longestStreak,endingStreak:s.endingStreak,achievedAtMs:s.achievedAtMs}];}
  return[{rank:1,username:kind==='all-time'?'alltime_hooper':'weekly_hooper',isCurrentUser:false,teamId:null,score:1,makes:1,attempts:2,accuracy:.5,longestStreak:1,endingStreak:1,achievedAtMs:Date.now()-60000}];
}
function recordFeedback(score:RankedScore,mode:string):RankedRecordFeedback|null{
  if(!mode.startsWith('record-')||mode==='record-missing')return null;
  const compare=(previousScore:number|null):RecordComparison=>({previousScore,outcome:previousScore===null?'first':score.score>previousScore?'beaten':score.score===previousScore?'tied':'below'});
  const prior=mode==='record-first'?null:mode==='record-tied'?score.score:mode==='record-below'?score.attempts:0;
  return{version:1,scoreId:mode==='record-misbound'?crypto.randomUUID():score.id,acceptedAtMs:score.achievedAtMs,periodId:period.id,scoreVersion:version,scope:'everyone',
    personalBest:compare(mode==='record-mixed'?null:prior),weeklyRecord:compare(mode==='record-mixed'?score.score:prior),allTimeRecord:compare(mode==='record-mixed'?score.attempts:prior)};
}
export async function respond(request:Request){
  const{state,mode}=await fixture(),url=new URL(request.url),scope=url.searchParams.get('scope')??'everyone';
  if(url.pathname.startsWith('/api/arcade/nba/teams')){
    const teams=Array.from({length:30},(_,i)=>({id:String(i+1),city:'Synthetic city '+(i+1),name:'Team '+(i+1),abbreviation:'T'+(i+1),logo:null}));
    const source=(sourceUrl:string)=>({provider:'ESPN',sourceUrl,observedAt:new Date().toISOString(),sourceUpdatedAt:null,seasonLabel:'Synthetic QA fixture'});
    if(url.pathname==='/api/arcade/nba/teams')return mode==='preview-directory-error'?response({error:'synthetic unavailable'},503):response({teams,source:source('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams?limit=30')});
    const id=url.pathname.split('/')[5],team=teams.find(t=>t.id===id);
    state.rosterAttempts=(state.rosterAttempts??0)+1;
    if(!team)return response({error:'not_found'},404);
    if(mode==='preview-roster-error'&&state.rosterAttempts===1)return response({error:'synthetic unavailable'},503);
    return response({team,source:source('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/'+id+'/roster'),players:Array.from({length:3},(_,i)=>({id:String(Number(id)*100+i+1),firstName:'Fixture',lastName:'Player '+(i+1),position:'Guard',portrait:'',jersey:null,status:i===2?'Two-way':'Active'}))});
  }
  if(url.pathname==='/api/arcade/competition'){
    if(mode==='held')return response({status:'held'});
    if(mode==='error')return response({status:'unavailable'},503);
    const kind=(url.searchParams.get('kind')??'weekly') as CompetitionBoard['kind'];
    if(mode==='race'&&(kind==='all-time'||scope==='league'))await new Promise(r=>setTimeout(r,800));
    const board:CompetitionBoard={gameId:'free-throw',kind,label:kind==='all-time'?'All-time compatible Free Throw':'Synthetic Week 1',phase:mode==='blocked'?'blocked':mode==='upcoming'?'upcoming':kind==='archive'||mode==='final'?'final':'open',periodId:kind==='all-time'?null:period.id,asOfMs:Date.now(),scoreVersion:version,entries:mode==='empty'?[]:entries(state,scope,kind)};
    return response({status:'ready',board:mode==='invalid'?{...board,gameId:'wrong-game'}:board});
  }
  if(url.pathname.endsWith('/runs')){
    const startedAtMs=Date.now();state.admission={rules:policy,replayContext:context,run:{id:crypto.randomUUID(),gameId:'free-throw',week:period.week,rulesVersion:version,startedAtMs,expiresAtMs:startedAtMs+policy.durationMs,period}};
    return response(state.admission,201);
  }
  if(url.pathname.endsWith('/scores')){
    state.saveAttempts=(state.saveAttempts??0)+1;
    if(mode==='reject')return response({status:'unavailable'},503);
    if(mode==='record-retry'&&state.saveAttempts===1)return response({status:'unavailable'},503);
    if(mode==='record-duplicate'&&state.score)return response({status:'saved',score:state.score,recordFeedback:recordFeedback(state.score,mode)},201);
    const body=await request.json(),a=state.admission;
    if(!a||body.runId!==a.run.id)return response({status:'invalid_run'},400);
    try{const achievedAtMs=Date.now(),round=replayRankedRound(body.shots,achievedAtMs-a.run.startedAtMs,policy,context);
      state.score={...round.statistics,id:crypto.randomUUID(),runId:a.run.id,gameId:'free-throw',week:period.week,rulesVersion:version,startedAtMs:a.run.startedAtMs,achievedAtMs,outcomes:round.outcomes,inputs:round.inputs,replayContext:context};
      if(mode==='record-lost-response')return response({status:'unavailable'},503);
      const feedback=recordFeedback(state.score,mode);
      return response({status:'saved',score:state.score,recordFeedback:mode==='record-malformed'?{...feedback,weeklyRecord:{previousScore:0,outcome:'first'}}:feedback},201);
    }catch{return response({status:'invalid_score'},400);}
  }
  if(url.pathname.endsWith('/results'))return state.score?response({score:state.score}):response({status:'not_found'},404);
  if(url.pathname.endsWith('/leaderboard'))return response({gameId:'free-throw',rulesVersion:version,ruleSetId:policy.ruleSetId,calendar:policy.calendar,scope,period,entries:entries(state,scope,'weekly')});
  return response({status:'unavailable'},404);
}
export async function loadCompetitionArchives():Promise<{status:'ready'|'held'|'unavailable';archives:CompetitionArchive[]}>{const{mode}=await fixture();return{status:mode==='history-held'?'held':mode==='history-error'?'unavailable':'ready',archives:mode==='history-final'?[{id:period.id,gameId:'free-throw',label:'Synthetic Week 1',closedAtMs:Date.parse('2026-10-19T00:00:00Z'),finalizedAtMs:Date.parse('2026-10-19T01:00:00Z')}]:[]};}
