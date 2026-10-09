import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { friendsEnrollmentEnabled } from "@/data/friends-auth/config";
import { getVerifiedAccount } from "@/data/friends-auth/runtime";
import { AccountForm } from "@/surfaces/accounts/AccountForm";
export const dynamic = "force-dynamic";
export default async function AccountPasswordPage() {
  if (!friendsEnrollmentEnabled()) redirect("/login");
  if (!await getVerifiedAccount(await headers())) redirect("/account/login");
  return <AccountForm mode="password" />;
}
