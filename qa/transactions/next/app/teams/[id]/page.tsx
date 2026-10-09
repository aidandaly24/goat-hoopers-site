import Link from 'next/link';
import {demoData} from '../../../../data';
export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const team=demoData().teams.find(t=>t.id===id);
  return <><h1>{team?.name??'Unknown demo team'}</h1><p>Public profile fixture adapter.</p><Link className="control" href={`/transactions?team=${encodeURIComponent(id)}`} prefetch={false}>Transactions for {team?.name??'this franchise'}</Link></>;
}
