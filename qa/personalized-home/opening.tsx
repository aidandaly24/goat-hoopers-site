/* eslint-disable @next/next/no-img-element -- Offline fixture reuses the approved local court directly. */
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LeagueOpeningOverlay } from '@/surfaces/season-hub/LeagueOpeningOverlay';
import { reconcileServerClock } from '@/domain/server-clock';
import type { LeagueOpening } from '@/domain/league-opening';
import '@/ui/tokens.css';
import '@/ui/courtside-tokens.css';
import '@/app/globals.css';

const params = new URLSearchParams(location.search);
const base = Date.parse('2026-10-20T23:30:00Z');
const mono = performance.now();
const state = params.get('state') ?? 'running';
const deadline = base + (state === 'ended' ? -1000 : 3000);
const anchor = reconcileServerClock(base, { sequence: 1, sentAtMonoMs: mono, receivedAtMonoMs: mono }, 1);
const opening: LeagueOpening = state === 'date-only'
  ? { status: 'date_only', season: '2026', week: 1, date: '2026-10-20', startsAtMs: null, message: 'Synthetic date-only source' }
  : { status: 'verified', season: '2026', week: 1, date: '2026-10-20', startsAtMs: deadline, timeZone: 'America/New_York', sourceUrl: 'https://example.com/synthetic-schedule', message: 'Synthetic verified schedule; not a real league time' };
function Fixture() {
  const [clock] = useState(anchor.status === 'accepted' ? anchor.anchor : null);
  return <main style={{ maxWidth: '64rem', margin: 'auto', padding: 'var(--gh-s4)' }}>
    <p>Offline countdown states · every date, time and source here is synthetic</p>
    <figure style={{ margin: 0, position: 'relative', aspectRatio: '16 / 9', overflow: 'hidden' }}>
      <img src="/courtside/arena.jpg" alt="Existing approved court" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <LeagueOpeningOverlay opening={opening} clock={state === 'uncertain' ? null : clock} />
    </figure>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
