import Link from 'next/link';
import {SiteHeader} from '@/ui/SiteHeader';
import {SITE_DESTINATIONS} from '@/ui/siteDestinations';
import '@/ui/tokens.css';
import '../../wire.css';
async function refuseLogout(){'use server';throw new Error('Synthetic fixture refuses account writes');}
export default function Layout({children}:{children:React.ReactNode}){
  const integrated=process.env.TRANSACTIONS_QA_INTEGRATED==='1';
  return <html lang="en"><body className="review">{integrated?<SiteHeader user={null} logoutAction={refuseLogout} destinations={SITE_DESTINATIONS}/>:null}<main id="main-content" tabIndex={-1} className="wire"><p className="coverage">Synthetic Next routing fixture · repaired source components · no live data</p>{integrated?null:<nav aria-label="Fixture league tools" className="detail-actions"><Link className="control" href="/transactions" prefetch={false}>League Transactions</Link><Link className="control" href="/teams" prefetch={false}>Teams</Link></nav>}{children}</main></body></html>;
}
