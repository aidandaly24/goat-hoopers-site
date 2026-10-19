import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PlayerHeadshot } from '@/ui/PlayerHeadshot';
import { getCourtsidePortraits, clubhouseAnchors } from '@/data/courtside-home';
import '@/ui/tokens.css';
import '../controls/fixture.css';

const portraits = getCourtsidePortraits();
function Review() {
  const [recovered, setRecovered] = useState(false);
  return <div className="fixture-wrap"><h1>Offline player photograph checks</h1>
    <p>Approved local portraits; synthetic image failures, no league results or account activity.</p>
    <section aria-label="All team portrait mappings">{Object.entries(clubhouseAnchors).map(([id, players]) => <div key={id} data-portrait-team={id}>
      <h2>Roster {id}</h2>{players.map(playerId => <PlayerHeadshot key={playerId} name={`Mapped player ${playerId}`} portraitSrc={portraits[playerId]} espnId={null} teamId={id} size={56} />)}
    </div>)}</section>
    <div data-case="local-priority"><PlayerHeadshot name="Local Priority" portraitSrc={portraits['1362']} espnId="fixture-unused" /></div>
    <div data-case="espn-existing"><PlayerHeadshot name="Existing ESPN" espnId="fixture-existing" /></div>
    <div data-case="local-failure"><PlayerHeadshot name="ESPN Recovery" portraitSrc="/missing-portrait.png" espnId="fixture-recovery" /></div>
    <div data-case="both-fail"><PlayerHeadshot name="Both Failed" portraitSrc="/missing-portrait.png" espnId="fixture-fail" /></div>
    <div data-case="unknown"><PlayerHeadshot name="Unknown Player" espnId={null} /></div>
    <div data-case="changed-source"><PlayerHeadshot name="Changed Source" portraitSrc={recovered ? portraits['1362'] : '/missing-portrait.png'} espnId={null} /></div>
    <button type="button" onClick={() => setRecovered(true)}>Recover portrait source</button>
  </div>;
}
createRoot(document.getElementById('root')!).render(<Review />);
