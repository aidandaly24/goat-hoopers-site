import { redirect } from "next/navigation";
import { friendsAuthEnabled } from "@/data/friends-auth/config";
import { AccountForm } from "@/surfaces/accounts/AccountForm";
export const dynamic = "force-dynamic";
export default function ForgotPage() {
  if (!friendsAuthEnabled()) redirect("/login");
  return <AccountForm mode="forgot" />;
}
