import {describe,expect,it} from 'vitest';
import {toTransactions} from '@/data/transform';
import type {RawTransaction} from '@/data/sleeper';
import type {Team} from '@/domain';
import archive from './synthetic-2031.json';
const raw=archive.raw as RawTransaction[], teams=archive.teams as Team[];
const directory=Object.fromEntries(Object.entries(archive.playerNames).map(([id,full_name])=>[id,{full_name}]));
describe('repaired source over independently invented fixtures',()=>{
 it('team 703 retains all five trades including pick-only transactions',()=>{
  const tx=toTransactions(raw,teams,[],[],directory);
  expect(tx.filter(t=>t.type==='trade'&&t.teamIds.includes('703'))).toHaveLength(5);
  const pick=tx.find(t=>t.id==='demo-2031-pick-trade-2')!;
  expect(pick.teamIds).toEqual(['702','703']);expect(pick.adds).toEqual([]);expect(pick.drops).toEqual([]);expect(pick.sides).toBeUndefined();
 });
 it('only the four completed waivers enter successful activity',()=>{
  const tx=toTransactions(raw,teams,[],[],directory);
  expect(tx.filter(t=>t.type==='waiver')).toHaveLength(4);
  expect(tx.some(t=>t.id==='demo-2031-waiver-5')).toBe(false);
 });
});
