import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getLegacyCurrentUser } from "@/app/actions";
import { friendsEnrollmentEnabled } from "@/data/friends-auth/config";
import { getProviderUser, getVerifiedAccount } from "@/data/friends-auth/runtime";
import { AccountForm } from "@/surfaces/accounts/AccountForm";
export const dynamic = "force-dynamic";
export default async function SetupPage() {
  if (!friendsEnrollmentEnabled()) redirect("/login");
  const user = await getLegacyCurrentUser();
  if (!user) redirect("/login?legacy=1");
  const requestHeaders = await headers();
  const account = await getVerifiedAccount(requestHeaders);
  if (account) {
    if (await getProviderUser(requestHeaders)) redirect("/account");
    return <AccountForm mode="link" notice={`Keep ${user.displayName} and your existing team history. Confirm the link within five minutes of entering your old team password.`} />;
  }
  return <AccountForm mode="setup" notice={`No team code is needed. Keep ${user.displayName} and your team history. Finish within five minutes of confirming your old password. If you already created an email account, log in with email first.`} />;
}
