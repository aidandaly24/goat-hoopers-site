import {TransactionHistory} from '@/surfaces/transactions/TransactionHistory';
import {demoData} from '../../../data';
export default async function Page({searchParams}:{searchParams:Promise<{season?:string}>}){
  const {season}=await searchParams;
  return <TransactionHistory {...demoData(season)}/>;
}
