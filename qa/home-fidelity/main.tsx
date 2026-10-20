import { createRoot } from 'react-dom/client';
import { CourtsideHome } from '@/surfaces/season-hub/CourtsideHome';
import { SiteHeader } from '@/ui/SiteHeader';
import { SiteFooter } from '@/ui/SiteFooter';
import { homeReviewFixture } from './fixture';
import '@/ui/tokens.css';
import '@/app/globals.css';
import '../controls/fixture.css';

const params = new URLSearchParams(location.search);
const state = params.get('state') ?? 'member';
const id = params.get('fixture-team') ?? '1';
const { home, weekly, viewer, personal, portraits, faces } = homeReviewFixture(state, id, params.get('reference') === '1');
const headerAvatar = home.directory.find(entry => entry.identity.id === id)?.identity.avatar ?? null;
createRoot(document.getElementById('root')!).render(<>
  <aside className="fixture-note">Offline personalized home review · all teams, values, scores and AI results are synthetic · no account actions</aside>
  <SiteHeader user={viewer.kind === 'member' ? { displayName: `Fixture manager ${id}`, teamId: id, avatar: headerAvatar } : null} logoutAction={async () => { throw Error('No account action in fixture'); }} />
  <main id="main-content"><CourtsideHome data={home} archive={[]} portraits={portraits} aiWeekly={weekly} viewerTeamId={viewer.kind === 'member' ? viewer.teamId : undefined} personal={personal} faces={faces} archived={state === 'archived-edition'} /></main>
  <SiteFooter season={home.hub?.season ?? null} />
</>);
