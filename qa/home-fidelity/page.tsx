import { CourtsideHome } from '@/surfaces/season-hub/CourtsideHome';
import { SiteHeader } from '@/ui/SiteHeader';
import { SiteFooter } from '@/ui/SiteFooter';
import { homeReviewFixture } from './fixture';

import { HydrationProbe } from './HydrationProbe';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
async function disabledLogout() { 'use server'; throw new Error('Account actions are disabled in this offline fixture'); }
export default async function Page({ searchParams }: { searchParams: Promise<{ state?: string; reference?: string; 'fixture-team'?: string }> }) {
  const { state = 'member', reference, 'fixture-team': id = '1' } = await searchParams;
  const { home, weekly, viewer, personal, portraits, faces } = homeReviewFixture(state, id, reference === '1');
  return <>
    <HydrationProbe />
    <aside className="fixture-note">Offline production Next.js home review · all teams, values, scores and AI results are synthetic · no account actions · <Link href="/?state=identity-updated" prefetch={false} data-identity-fixture>Load current identity fixture</Link></aside>
    <SiteHeader user={viewer.kind === 'member' ? { displayName: 'Fixture manager', teamId: id } : null} logoutAction={disabledLogout} />
    <main id="main-content"><CourtsideHome data={home} archive={[]} portraits={portraits} aiWeekly={weekly}
      viewerTeamId={viewer.kind === 'member' ? viewer.teamId : undefined} personal={personal} faces={faces} archived={state === 'archived-edition'} /></main>
    <SiteFooter season={home.hub?.season ?? null} />
  </>;
}
