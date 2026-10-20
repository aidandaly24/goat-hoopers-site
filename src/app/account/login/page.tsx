import { redirect } from "next/navigation";
import { friendsEnrollmentEnabled } from "@/data/friends-auth/config";
import { AccountForm } from "@/surfaces/accounts/AccountForm";
import { headers } from "next/headers";
import { getVerifiedAccount } from "@/data/friends-auth/runtime";
import { loginContinuationHref, safeLoginDestination } from "@/domain/login-navigation";
export const dynamic = "force-dynamic";
export default async function EmailLoginPage({ searchParams }: { searchParams: Promise<{ notice?: string; next?: string | string[] }> }) {
  if (!friendsEnrollmentEnabled()) redirect("/login");
  const { notice, next } = await searchParams;
  const returnTo = safeLoginDestination(next);
  if (notice !== "reverify" && await getVerifiedAccount(await headers())) redirect(loginContinuationHref(returnTo));
  return <AccountForm mode="login" returnTo={returnTo} notice={notice === "verified" ? "Email verified. Log in to your account." : notice === "reverify" ? "Sign in again to confirm account changes." : null} />;
}
