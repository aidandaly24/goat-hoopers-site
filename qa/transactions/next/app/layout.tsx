import Link from 'next/link';
import '@/ui/tokens.css';
import '../../wire.css';
export default function Layout({children}:{children:React.ReactNode}){
  return <html lang="en"><body className="review"><main className="wire"><p className="coverage">Synthetic Next routing fixture · repaired source components · no live data</p><nav aria-label="Fixture league tools" className="detail-actions"><Link className="control" href="/transactions" prefetch={false}>League Transactions</Link><Link className="control" href="/teams" prefetch={false}>Teams</Link></nav>{children}</main></body></html>;
}
