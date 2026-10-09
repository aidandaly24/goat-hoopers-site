/**
 * /claim — claim a team with an invite code. If already logged in,
 * skip straight to the arcade.
 */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import { ClaimForm } from "./ClaimForm";
import { friendsEnrollmentEnabled } from "@/data/friends-auth/config";

export const dynamic = "force-dynamic";

export default async function ClaimPage() {
  if (friendsEnrollmentEnabled()) redirect("/account");
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    // Database not provisioned yet — still render the form; the action
    // will explain. Better than a dead page.
  }
  if (user) redirect("/arcade");
  return <ClaimForm />;
}
