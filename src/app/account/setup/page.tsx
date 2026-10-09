import { redirect } from "next/navigation";
import { getLegacyCurrentUser } from "@/app/actions";
import { friendsEnrollmentEnabled } from "@/data/friends-auth/config";
import { AccountForm } from "@/surfaces/accounts/AccountForm";
export const dynamic = "force-dynamic";
export default async function SetupPage() {
  if (!friendsEnrollmentEnabled()) redirect("/login");
  const user = await getLegacyCurrentUser();
  if (!user) redirect("/login?legacy=1");
  return <AccountForm mode="setup" notice={`Keep ${user.displayName} and your existing team history. If setup fails, sign in to your existing team again before retrying.`} />;
}
