import Link from 'next/link';
import {demoData} from '../../../data';
export default function Page(){
  return <><h1>Teams</h1><p>Fixture directory adapter; public profile design remains separately owned.</p><ul>{demoData().teams.map(t=><li key={t.id}><Link className="control" href={`/teams/${t.id}`} prefetch={false}>{t.name}</Link></li>)}</ul></>;
}
