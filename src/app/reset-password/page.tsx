import { redirect } from "next/navigation";
import { friendsAuthEnabled } from "@/data/friends-auth/config";
import { AccountForm } from "@/surfaces/accounts/AccountForm";
export const dynamic = "force-dynamic";
export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  if (!friendsAuthEnabled()) redirect("/login");
  const query = await searchParams;
  const token = typeof query.token === "string" && query.token.length <= 256 ? query.token : undefined;
  return <AccountForm mode="reset" token={token} notice={!token || query.error ? "This link is unavailable. Request another reset email." : null} />;
}
