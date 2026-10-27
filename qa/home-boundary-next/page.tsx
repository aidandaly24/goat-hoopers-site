import { CourtsideHome } from '@/surfaces/season-hub/CourtsideHome';
import { personalizedFixture, playerGuideFixture } from '@/test/personalized-home-fixture';
import { buildHomeFaces, buildPersonalizedHome } from '@/data/personalized-home';
import { buildHomeWeeklyContext } from '@/data/home-weekly-context';
import { weeklyHomeFixture } from '@/test/home-weekly-fixture';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state = 'public' } = await searchParams;
  if (state.startsWith('weekly-')) {
    const { home, receipt, weekly, market, news } = weeklyHomeFixture();
    if (state === 'weekly-missing-edition') home.edition = null;
    const viewer = state === 'weekly-member' ? { kind: 'member' as const, teamId: '2' }
      : state === 'weekly-estimate-member' ? { kind: 'member' as const, teamId: '1' }
      : { kind: 'signed_out' as const };
    const context = buildHomeWeeklyContext(home, state === 'weekly-unavailable' ? [] : [receipt], viewer.kind === 'member' ? viewer.teamId : null);
    const personal = buildPersonalizedHome(viewer, home, weekly, market, news, context.guideSources);
    return <>
      <p>Offline Next.js weekly fixture; all identities and points are synthetic.</p>
      <main><CourtsideHome data={home} archive={[]} portraits={{}} aiWeekly={weekly}
        personal={personal} faces={buildHomeFaces(home, market)} archived={state === 'weekly-archived'} weeklyRecap={context.recap} /></main>
    </>;
  }
  const { home, weekly, market, news } = personalizedFixture();
  home.checkedAt = '2026-10-19T15:30:00Z';
  weekly.week = 1;
  home.directory.forEach(entry => { if (entry.currentMatchup) entry.currentMatchup.week = 1; });
  if (state === 'missing-edition') home.edition = null;
  const viewer = state === 'member' ? { kind: 'member' as const, teamId: '1' } : { kind: 'signed_out' as const };
  const personal = buildPersonalizedHome(viewer, home, weekly, market, news, playerGuideFixture('1'));
  return <>
    <p>Offline Next.js boundary fixture; all league data is synthetic.</p>
    <main><CourtsideHome data={home} archive={[]} portraits={{}} aiWeekly={weekly}
      personal={personal} faces={buildHomeFaces(home, market)} archived={state === 'archived'} /></main>
  </>;
}
