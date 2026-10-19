export async function getVerifiedAccount(headers: Headers) {
  return headers.get("cookie")?.includes("fixture-account=") ? { subject: "fixture-account", sessionId: "fixture-session", name: "Fixture manager" } : null;
}
export async function getProviderUser(headers: Headers) {
  return headers.get("cookie")?.includes("fixture-account=member") ? { teamId: "3" } : null;
}
