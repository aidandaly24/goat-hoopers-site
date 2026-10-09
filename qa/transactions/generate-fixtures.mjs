// Entirely invented demonstration data. No input files, network or identity map.
import {writeFile} from 'node:fs/promises';
const names={'demo-player-orion':'Orion Vale','demo-player-lyra':'Lyra Flint','demo-player-vega':'Vega Moss','demo-player-nova':'Nova Reed'};
const makeTeams=archive=>[
 ['701','Juniper Jets','Demo Juniper'],['702','Marble Meteors','Demo Marble'],
 ['703','Saffron Suns','Demo Saffron'],['704','Violet Voyagers','Demo Violet'],
 ['707',archive?'Copper Lanterns':'Copper Comets',archive?'Demo Ember':'Demo Cedar']
].map(([id,name,managerName])=>({id,name,managerName,avatar:null,wins:0,losses:0,ties:0,pointsFor:0,pointsAgainst:0}));
const stamp=(season,day)=>Date.UTC(Number(season),11,day,12);
const record=(season,id,day,patch={})=>({transaction_id:`demo-${season}-${id}`,type:'free_agent',status:'complete',leg:1,created:stamp(season,day),status_updated:stamp(season,day),adds:null,drops:null,roster_ids:[701],draft_picks:[],waiver_budget:[],settings:null,...patch});
const current=Array.from({length:26},(_,i)=>{
 const rid=i<3?707:[701,702,703,704][i%4];const pid=i===0||i===1?'demo-player-lyra':['demo-player-orion','demo-player-vega','demo-player-nova'][i%3];
 return record('2032',`move-${String(i+1).padStart(2,'0')}`,i===0?9:i===1?3:1+i%14,{roster_ids:[rid],...(i%3===0?{drops:{[pid]:rid}}:i%3===1?{adds:{[pid]:rid}}:{adds:{[pid]:rid},drops:{'demo-player-unknown':rid}})});
});
const archive=[];
for(let i=1;i<=2;i++)archive.push(record('2031',`player-trade-${i}`,15-i,{type:'trade',roster_ids:[701,703],adds:{'demo-player-orion':703,'demo-player-vega':701},drops:{'demo-player-orion':701,'demo-player-vega':703}}));
for(let i=1;i<=4;i++){
 const to=i<4?703:704;
 archive.push(record('2031',`pick-trade-${i}`,12-i,{type:'trade',roster_ids:[702,to],draft_picks:[{season:'2033',round:4,roster_id:702,owner_id:to,previous_owner_id:702},{season:'2033',round:5,roster_id:to,owner_id:702,previous_owner_id:to}]}));
}
archive.push(record('2031','other-trade',7,{type:'trade',roster_ids:[701,704],adds:{'demo-player-nova':704},drops:{'demo-player-nova':701}}));
for(let i=1;i<=5;i++)archive.push(record('2031',`waiver-${i}`,7-i,{type:'waiver',roster_ids:[701],adds:{'demo-player-lyra':701},status:i===5?'failed':'complete',settings:i===1?{waiver_bid:7}:null}));
for(let i=1;i<=6;i++)archive.push(record('2031',`free-agent-${i}`,i,{roster_ids:[707],adds:{'demo-player-orion':707}}));
for(const [season,raw] of [['2032',current],['2031',archive]]){
 raw.sort((a,b)=>b.created-a.created);const teams=makeTeams(season==='2031');
 const data={synthetic:true,provenance:'Invented by generate-fixtures.mjs; never copied, relabeled or derived from captured league records.',leagueId:`demo-league-${season}`,season,teams,raw,playerNames:names};
 await writeFile(new URL(`./synthetic-${season}.json`,import.meta.url),JSON.stringify(data,null,2)+'\n');
}
