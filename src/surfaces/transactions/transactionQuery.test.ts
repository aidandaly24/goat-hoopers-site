import {describe,expect,it} from 'vitest';
import {readTransactionFilters,transactionFilterHref} from './transactionQuery';

describe('league Transactions query state',()=>{
  it('defaults plain global entry and unknown values to All',()=>{
    for(const q of ['', 'team=unknown&type=other', 'team=all&type=all']) {
      expect(readTransactionFilters(new URLSearchParams(q),['701'])).toEqual({team:'all',type:'all'});
    }
  });
  it('accepts only loaded team IDs and supported raw types',()=>{
    for(const type of ['trade','waiver','free_agent'] as const) {
      expect(readTransactionFilters(new URLSearchParams(`team=701&type=${type}`),['701'])).toEqual({team:'701',type});
    }
  });
  it('retains unrelated repeated query and hash on filter updates',()=>{
    const next=transactionFilterHref('/transactions?utm=demo&utm=second&detail=demo-move#wire',{team:'701',type:'trade'});
    const url=new URL(next,'https://fixture.invalid');
    expect(url.searchParams.getAll('utm')).toEqual(['demo','second']);
    expect(url.searchParams.get('detail')).toBe('demo-move');
    expect(url.searchParams.get('team')).toBe('701');
    expect(url.searchParams.get('type')).toBe('trade');
    expect(url.hash).toBe('#wire');
  });
  it('removes both owned keys for All and preserves a plain league route',()=>{
    expect(transactionFilterHref('/transactions?team=701&type=trade#wire',{team:'all',type:'all'})).toBe('/transactions#wire');
    expect(transactionFilterHref('/transactions',{team:'all',type:'all'})).toBe('/transactions');
  });
  it('removes duplicate owned keys without losing another selected filter',()=>{
    expect(transactionFilterHref('/transactions?team=701&team=702&type=trade&utm=demo',{team:'all',type:'waiver'})).toBe('/transactions?type=waiver&utm=demo');
  });
});
