import { redirect } from "next/navigation";
import { friendsEnrollmentEnabled } from "@/data/friends-auth/config";
import { AccountForm } from "@/surfaces/accounts/AccountForm";
export const dynamic = "force-dynamic";
export default async function EmailLoginPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  if (!friendsEnrollmentEnabled()) redirect("/login");
  const { notice } = await searchParams;
  return <AccountForm mode="login" notice={notice === "verified" ? "Email verified. Log in to your account." : null} />;
}
