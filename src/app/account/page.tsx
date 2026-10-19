import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { friendsAuthEnabled, friendsEnrollmentEnabled } from "@/data/friends-auth/config";
import { getProviderUser, getVerifiedAccount } from "@/data/friends-auth/runtime";
import { AccountForm } from "@/surfaces/accounts/AccountForm";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import { safeLoginDestination } from "@/domain/login-navigation";
export const dynamic = "force-dynamic";
export default async function AccountPage({ searchParams }: { searchParams?: Promise<{ next?: string | string[] }> } = {}) {
  if (!friendsEnrollmentEnabled()) redirect("/login");
  const returnTo = safeLoginDestination((await searchParams)?.next);
  const requestHeaders = await headers();
  const account = await getVerifiedAccount(requestHeaders);
  if (!account) redirect(`/account/login?next=${encodeURIComponent(returnTo === "/" ? "/account" : returnTo)}`);
  const member = await getProviderUser(requestHeaders);
  if (member) return <>
    <Card><SectionHeading eyebrow="Account" title="Your account" /><p>Signed in as {member.displayName}. Your email account is linked to your existing team. Your team identity and history stay together.</p></Card>
    <p><Link href="/team">My Team</Link></p>
    <p><Link href="/account/password">Change account password</Link></p>
  </>;
  return <>
    {friendsAuthEnabled() ? <AccountForm mode="claim" returnTo={returnTo} /> : <Card><SectionHeading eyebrow="Account" title="Your email account is ready" /><p>You can sign in and reset your account password. New team claims will open when email login is active for the league.</p></Card>}
    <p><Link href="/account/password">Change account password</Link></p>
  </>;
}
