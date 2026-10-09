import current from './synthetic-2032.json';
import archive from './synthetic-2031.json';
import {toTransactions} from '@/data/transform';
import type {RawTransaction} from '@/data/sleeper';
import type {Team} from '@/domain';
export function demoData(season?:string){
  const f=season==='2031'?archive:current;
  const teams=f.teams as Team[];
  return {teams,transactions:toTransactions(f.raw as RawTransaction[],teams,[],[],Object.fromEntries(Object.entries(f.playerNames).map(([id,full_name])=>[id,{full_name}])))};
}
