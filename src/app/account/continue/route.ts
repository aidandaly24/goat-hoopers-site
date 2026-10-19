import { NextResponse } from "next/server";
import { friendsAuthEnabled, friendsEnrollmentEnabled } from "@/data/friends-auth/config";
import { getProviderUser, getVerifiedAccount } from "@/data/friends-auth/runtime";
import { safeLoginDestination } from "@/domain/login-navigation";

export const dynamic = "force-dynamic";

/** A fresh document after login reads the new cookie before choosing home
 * or required team setup. This route renders no account/settings screen. */
export async function GET(request: Request) {
  const next = safeLoginDestination(new URL(request.url).searchParams.get("next"));
  const suffix = next === "/" ? "" : `?next=${encodeURIComponent(next)}`;
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url), {
    status: 303, headers: { "Cache-Control": "private, no-store" },
  });
  if (!friendsEnrollmentEnabled()) return go("/login");
  const requestHeaders = new Headers(request.headers);
  if (!await getVerifiedAccount(requestHeaders)) return go(`/account/login${suffix}`);
  if (!friendsAuthEnabled() || !await getProviderUser(requestHeaders)) return go(`/account${suffix}`);
  return go(next);
}
