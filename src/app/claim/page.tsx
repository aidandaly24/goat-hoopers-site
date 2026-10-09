/**
 * /claim — claim a team with an invite code. If already logged in,
 * skip straight to the arcade.
 */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import { ClaimForm } from "./ClaimForm";
import { friendsAuthEnabled } from "@/data/friends-auth/config";
import { AccountForm } from "@/surfaces/accounts/AccountForm";

export const dynamic = "force-dynamic";

export default async function ClaimPage() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    // Database not provisioned yet — still render the form; the action
    // will explain. Better than a dead page.
  }
  if (user) redirect("/arcade");
  return friendsAuthEnabled() ? <AccountForm mode="signup" /> : <ClaimForm />;
}
