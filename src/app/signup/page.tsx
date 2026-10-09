import { redirect } from "next/navigation";
import { friendsEnrollmentEnabled } from "@/data/friends-auth/config";
import { AccountForm } from "@/surfaces/accounts/AccountForm";
export const dynamic = "force-dynamic";
export default function SignupPage() {
  if (!friendsEnrollmentEnabled()) redirect("/login");
  return <AccountForm mode="signup" />;
}
