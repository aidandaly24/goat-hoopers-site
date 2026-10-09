import { createHash } from "node:crypto";
import { parseEnrollment } from "@/domain/friends-accounts";
import { friendsAuthEnabled, friendsEnrollmentEnabled, readFriendsAuthConfig } from "./config";
import { consumeAuthAttempt, enrollFriend, getFriendsAuth } from "./runtime";

const paths = new Set(["ok", "sign-in/email", "get-session", "sign-out", "verify-email", "send-verification-email",
  "request-password-reset", "reset-password", "change-password", "revoke-sessions", "revoke-other-sessions", "list-sessions", "revoke-session"]);
const json = (error: string, status: number) => Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

async function readBody(request: Request): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  let length = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 16384) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(body);
}

/** Signup is not mounted here. Only the transactional enrollment route can enable it. */
export async function handleFriendsAuth(request: Request): Promise<Response> {
  if (!friendsEnrollmentEnabled()) return json("Email accounts are not active yet", 503);
  const path = new URL(request.url).pathname.replace(/^\/api\/auth\//, "");
  const resetCallback = request.method === "GET" && /^reset-password\/[A-Za-z0-9_-]{1,256}$/.test(path);
  if (!paths.has(path) && !resetCallback) return json("Unavailable account action", 404);
  try {
    const config = readFriendsAuthConfig();
    if (request.method === "POST") {
      if (request.headers.get("origin") !== config.origin) return json("Invalid request origin", 403);
      const body = await readBody(request);
      if (body === null) return json("Account request is too large", 413);
      if (!await consumeAuthAttempt(`auth:${path}`, path.includes("password-reset") || path === "send-verification-email" ? 10 : 120)) {
        return json("Too many account requests; try again in 15 minutes", 429);
      }
      request = new Request(request.url, { method: "POST", headers: request.headers, body });
    }
    const response = await getFriendsAuth().handler(request);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch { return json("Account service is temporarily unavailable", 503); }
}

export async function handleEnrollment(request: Request): Promise<Response> {
  if (!friendsEnrollmentEnabled()) return json("Email accounts are not active yet", 503);
  try {
    if (request.headers.get("origin") !== readFriendsAuthConfig().origin) return json("Invalid request origin", 403);
    if (!request.headers.get("content-type")?.startsWith("application/json")) return json("Use JSON", 415);
    const body = await readBody(request);
    if (body === null) return json("Account request is too large", 413);
    if (!await consumeAuthAttempt("enrollment", 10)) return json("Too many signup attempts; try again in 15 minutes", 429);
    const input = parseEnrollment(JSON.parse(body));
    if (!input || (input.kind === "invite" && !friendsAuthEnabled())) return json("Check your account details", 400);
    const rawToken = /(?:^|;\s*)gh_session=([a-f0-9]{64})(?:;|$)/.exec(request.headers.get("cookie") ?? "")?.[1];
    const tokenHash = rawToken ? createHash("sha256").update(rawToken).digest("hex") : null;
    await enrollFriend(input, tokenHash, request.headers);
    return Response.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch { return json("Could not set up this account. Check your invitation or sign in again; an existing email account can use password recovery.", 400); }
}
