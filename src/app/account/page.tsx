import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import { friendsAuthEnabled } from "@/data/friends-auth/config";
import { AccountForm } from "@/surfaces/accounts/AccountForm";
export const dynamic = "force-dynamic";
export default async function AccountPage() {
  if (!await getCurrentUser()) redirect("/login");
  if (!friendsAuthEnabled()) return <p>Email account setup is not active yet. <Link href="/team">My Team</Link></p>;
  return <AccountForm mode="password" />;
}
