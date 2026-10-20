import { createRoot } from 'react-dom/client';
import { CourtsideHome } from '@/surfaces/season-hub/CourtsideHome';
import { playerContextFixture } from './fixture';
import '@/ui/tokens.css';
import '@/app/globals.css';
import '../controls/fixture.css';

const params = new URLSearchParams(location.search);
const state = params.get('state') ?? 'small-cohort';
const requestedTeam = params.get('fixture-team') ?? '1';
const teamId = /^(?:[1-9]|10)$/.test(requestedTeam) ? requestedTeam : '1';
const { home, weekly, viewer, personal, portraits, faces } = playerContextFixture(state, teamId);
const theme = params.get('theme');
if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme;
if (params.get('text') === '200') document.documentElement.style.fontSize = '200%';
createRoot(document.getElementById('root')!).render(<>
  <aside className="fixture-note">Offline component fixture · all identities, prices, points, GP and AI results are synthetic · no account actions</aside>
  <main id="main-content"><CourtsideHome data={home} archive={[]} portraits={portraits} aiWeekly={weekly}
    personal={personal} faces={faces} viewerTeamId={viewer.kind === 'member' ? viewer.teamId : undefined} /></main>
</>);
