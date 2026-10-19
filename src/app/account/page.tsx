import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { friendsAuthEnabled, friendsEnrollmentEnabled } from "@/data/friends-auth/config";
import { getProviderUser, getVerifiedAccount } from "@/data/friends-auth/runtime";
import { AccountForm } from "@/surfaces/accounts/AccountForm";
import { AccountSettings } from "@/surfaces/accounts/AccountSettings";
import { safeLoginDestination } from "@/domain/login-navigation";
export const dynamic = "force-dynamic";
export default async function AccountPage({ searchParams }: { searchParams?: Promise<{ next?: string | string[] }> } = {}) {
  if (!friendsEnrollmentEnabled()) redirect("/login");
  const returnTo = safeLoginDestination((await searchParams)?.next);
  const requestHeaders = await headers();
  const account = await getVerifiedAccount(requestHeaders);
  if (!account) redirect(`/account/login?next=${encodeURIComponent(returnTo === "/" ? "/account" : returnTo)}`);
  const member = await getProviderUser(requestHeaders);
  return <AccountSettings
    accountName={account.name ?? member?.displayName ?? "Your account"}
    linked={Boolean(member)}
    claimForm={!member && friendsAuthEnabled() ? <AccountForm mode="claim" returnTo={returnTo} /> : undefined}
  />;
}
