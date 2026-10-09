import {createRoot} from 'react-dom/client';
import {TransactionHistory} from '@/surfaces/transactions/TransactionHistory';
import type {Team} from '@/domain';
import {toTransactions} from '@/data/transform';
import type {RawTransaction} from '@/data/sleeper';
import {Wire} from './wire';
import current from './synthetic-2032.json';
import archive from './synthetic-2031.json';
import '@/ui/tokens.css';
import './wire.css';
const p=new URLSearchParams(location.search);
const f=p.get('season')==='2031'?archive:current;
// Invented JSON is normalized by the actual repaired source transform.
// No live record or identity is bundled.
createRoot(document.getElementById('root')!).render(p.get('variant')==='source'?<main className="wire"><p className="review-note">Repaired production component · entirely invented {f.season} week 1 · no network data</p><TransactionHistory transactions={toTransactions(f.raw as RawTransaction[],f.teams as Team[],[],[],Object.fromEntries(Object.entries(f.playerNames).map(([id,full_name])=>[id,{full_name}]))) } teams={f.teams as unknown as Team[]}/></main>:<Wire/>);
